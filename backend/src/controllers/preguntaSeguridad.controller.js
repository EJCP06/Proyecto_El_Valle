const bcrypt = require('bcryptjs');
const preguntaRepo = require('../repositories/preguntaSeguridad.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const catalogoRepos = require('../repositories/catalogo.repository');

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
      const match = await bcrypt.compare(r.respuesta.toLowerCase().trim(), preg.respuesta);
      if (!match) {
        allCorrect = false;
        break;
      }
    }

    if (!allCorrect) {
      return res.status(401).json({ success: false, message: 'Las respuestas no son correctas' });
    }

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
      const match = await bcrypt.compare(r.respuesta.toLowerCase().trim(), preg.respuesta);
      if (!match) {
        allCorrect = false;
        break;
      }
    }

    if (!allCorrect) {
      return res.status(401).json({ success: false, message: 'Las respuestas no son correctas' });
    }

    const bcryptHash = require('bcryptjs');
    const passwordHash = await bcryptHash.hash(newPassword, 10);
    await usuarioRepo.updatePassword(usuario.id, passwordHash);

    return res.json({ success: true, message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    next(error);
  }
};
