const bcrypt = require('bcryptjs');
const preguntaRepo = require('../repositories/preguntaSeguridad.repository');
const usuarioRepo = require('../repositories/usuario.repository');

exports.getAllByUser = async (req, res, next) => {
  try {
    const usuarioId = parseInt(req.params.usuarioId);
    const preguntas = await preguntaRepo.findByUsuarioId(usuarioId);
    return res.json({ success: true, data: preguntas });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const usuarioId = parseInt(req.params.usuarioId);
    if (req.user.id !== usuarioId) {
      return res.status(403).json({ success: false, message: 'No puedes crear preguntas para otro usuario' });
    }

    const { pregunta, respuesta } = req.body;
    if (!pregunta || !respuesta) {
      return res.status(400).json({ success: false, message: 'Pregunta y respuesta son requeridas' });
    }

    const existing = await preguntaRepo.findByUsuarioId(usuarioId);
    if (existing.length >= 3) {
      return res.status(400).json({ success: false, message: 'Máximo 3 preguntas de seguridad por usuario' });
    }

    const respuestaHash = await bcrypt.hash(respuesta.toLowerCase().trim(), 10);
    const created = await preguntaRepo.create(usuarioId, pregunta, respuestaHash);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await preguntaRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });
    }
    if (existing.usuario_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No puedes modificar preguntas de otro usuario' });
    }

    const { pregunta, respuesta } = req.body;

    let respuestaHash = null;
    if (respuesta) {
      respuestaHash = await bcrypt.hash(respuesta.toLowerCase().trim(), 10);
    }

    const updated = await preguntaRepo.update(id, pregunta, respuestaHash);
    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await preguntaRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });
    }
    if (existing.usuario_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No puedes eliminar preguntas de otro usuario' });
    }

    await preguntaRepo.remove(id);
    return res.json({ success: true, message: 'Pregunta eliminada' });
  } catch (error) {
    next(error);
  }
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
