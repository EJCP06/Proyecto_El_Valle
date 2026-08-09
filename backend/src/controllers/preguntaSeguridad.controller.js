const bcrypt = require('bcryptjs');
const preguntaRepo = require('../repositories/preguntaSeguridad.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const catalogoRepos = require('../repositories/catalogo.repository');
const { registrarAuditoria } = require('../services/auditoria.service');

/** Detecta si el valor almacenado es un hash bcrypt (datos viejos). */
function esHashBcrypt(valor) {
  return typeof valor === 'string' && /^\$2[aby]\$\d{2}\$/.test(valor) && valor.length === 60;
}

/**
 * Compara una respuesta ingresada contra el valor almacenado.
 * Soporta valores viejos (hasheados con bcrypt) y los nuevos en texto plano.
 */
async function compararRespuesta(input, stored) {
  const normalized = (input || '').toLowerCase().trim();
  if (!stored) return false;
  if (esHashBcrypt(stored)) {
    return bcrypt.compare(normalized, stored);
  }
  return normalized === String(stored).toLowerCase().trim();
}

exports.getAllByUser = async (req, res, next) => {
  try {
    const usuarioId = parseInt(req.params.usuarioId);
    const preguntas = await preguntaRepo.findByUsuarioId(usuarioId);
    return res.json({ success: true, data: preguntas });
  } catch (error) {
    next(error);
  }
};

/**
 * Devuelve las preguntas de seguridad del usuario autenticado (perfil).
 */
exports.getMias = async (req, res, next) => {
  try {
    // La respuesta no se expone: está encriptada en la base de datos.
    const preguntas = await preguntaRepo.findByUsuarioId(req.user.id);
    return res.json({ success: true, data: preguntas });
  } catch (error) {
    next(error);
  }
};

/**
 * Reemplaza las preguntas de seguridad del usuario autenticado (perfil).
 * Recibe { preguntas: [{ preguntaId, respuesta }] }. Permite eliminar todas
 * enviando un arreglo vacío.
 */
exports.replaceMine = async (req, res, next) => {
  try {
    const { preguntas } = req.body;
    if (preguntas !== undefined && !Array.isArray(preguntas)) {
      return res.status(400).json({ success: false, message: 'preguntas debe ser un arreglo' });
    }
    const items = preguntas || [];

    // Filas actuales del usuario para saber cuáles se conservan.
    const actuales = await preguntaRepo.findByUsuarioIdWithRespuestas(req.user.id);
    const actualesIds = new Set(actuales.map((a) => a.id));
    const payloadIds = new Set(items.filter((p) => p.id).map((p) => p.id));

    // 1) Eliminar las filas que el usuario quitó.
    for (const row of actuales) {
      if (!payloadIds.has(row.id)) {
        await preguntaRepo.removeById(row.id);
      }
    }

    // 2) Actualizar filas existentes cuyo texto de respuesta cambió.
    //    (respuesta vacía = conservar la respuesta actual encriptada)
    for (const item of items) {
      if (!item.id || !actualesIds.has(item.id)) continue;
      const respuesta = (item.respuesta || '').trim();
      if (!respuesta) continue;
      const preguntaId = parseInt(item.preguntaId);
      const preguntaCat = await catalogoRepos.preguntasSeguridad.findById(preguntaId);
      if (!preguntaCat) continue;
      const respuestaHash = await bcrypt.hash(respuesta.toLowerCase(), 10);
      await preguntaRepo.update(item.id, preguntaId, preguntaCat.nombre, respuestaHash);
    }

    // 3) Crear las filas nuevas (sin id).
    await exports.crearPreguntasParaUsuario(req.user.id, items.filter((p) => !p.id));

    await registrarAuditoria({
      accion: 'MODIFICAR PREGUNTAS DE SEGURIDAD',
      entidad: 'USUARIO',
      entidadId: req.user.id,
      req
    });

    return res.json({ success: true, message: 'Preguntas de seguridad actualizadas' });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea (o reemplaza) las preguntas de seguridad de un usuario a partir del
 * catálogo de preguntas. Cada elemento debe ser { preguntaId, respuesta }.
 * Retorna los registros creados.
 */
exports.crearPreguntasParaUsuario = async (usuarioId, preguntasSeguridad) => {
  if (!preguntasSeguridad || !Array.isArray(preguntasSeguridad)) return [];

  const catPreguntas = catalogoRepos.preguntasSeguridad;
  const creadas = [];

  for (const item of preguntasSeguridad) {
    const preguntaId = parseInt(item.preguntaId);
    const respuesta = (item.respuesta || '').trim();
    if (!preguntaId || !respuesta) continue;

    const preguntaCat = await catPreguntas.findById(preguntaId);
    if (!preguntaCat) continue;

    const respuestaHash = await bcrypt.hash(respuesta.toLowerCase(), 10);
    const creada = await preguntaRepo.create(usuarioId, preguntaId, preguntaCat.nombre, respuestaHash);
    creadas.push(creada);
  }

  return creadas;
};

exports.verifyAnswers = async (req, res, next) => {
  try {
    const { email, respuestas } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requerido' });
    }

    const usuario = await usuarioRepo.findByEmail(email);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const preguntas = await preguntaRepo.findByUsuarioIdWithRespuestas(usuario.id);
    if (preguntas.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay preguntas de seguridad registradas' });
    }

    if (!respuestas || !Array.isArray(respuestas) || respuestas.length === 0) {
      return res.json({
        success: false,
        message: 'Preguntas encontradas',
        data: { preguntas: preguntas.map(p => ({ id: p.id, pregunta: p.pregunta })) }
      });
    }

    let allCorrect = true;
    for (const r of respuestas) {
      const preg = preguntas.find(p => p.id === r.preguntaId);
      if (!preg) {
        allCorrect = false;
        break;
      }
      const match = await compararRespuesta(r.respuesta, preg.respuesta);
      if (!match) {
        allCorrect = false;
        break;
      }
    }

    if (!allCorrect) {
      await registrarAuditoria({
        accion: 'RESPUESTAS DE SEGURIDAD INCORRECTAS',
        entidad: 'USUARIO',
        entidadId: usuario.id,
        req
      });
      return res.status(401).json({ success: false, message: 'Las respuestas no son correctas' });
    }

    await registrarAuditoria({
      accion: 'VERIFICAR PREGUNTAS DE SEGURIDAD',
      entidad: 'USUARIO',
      entidadId: usuario.id,
      req
    });

    return res.json({
      success: true,
      message: 'Respuestas correctas. Puede restablecer su contraseña.',
      data: { usuarioId: usuario.id }
    });
  } catch (error) {
    next(error);
  }
};

exports.resetBySecurityQuestions = async (req, res, next) => {
  try {
    const { email, respuestas, newPassword } = req.body;
    if (!email || !respuestas || !Array.isArray(respuestas) || !newPassword) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    const usuario = await usuarioRepo.findByEmail(email);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const preguntas = await preguntaRepo.findByUsuarioIdWithRespuestas(usuario.id);
    if (preguntas.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay preguntas de seguridad registradas' });
    }

    let allCorrect = true;
    for (const r of respuestas) {
      const preg = preguntas.find(p => p.id === r.preguntaId);
      if (!preg) {
        allCorrect = false;
        break;
      }
      const match = await compararRespuesta(r.respuesta, preg.respuesta);
      if (!match) {
        allCorrect = false;
        break;
      }
    }

    if (!allCorrect) {
      return res.status(401).json({ success: false, message: 'Las respuestas no son correctas' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await usuarioRepo.updatePassword(usuario.id, passwordHash);

    await registrarAuditoria({
      accion: 'RESTABLECER CONTRASEÑA',
      entidad: 'USUARIO',
      entidadId: usuario.id,
      req
    });

    return res.json({ success: true, message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    next(error);
  }
};
