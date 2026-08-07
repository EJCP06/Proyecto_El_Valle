const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const usuarioRepo = require('../repositories/usuario.repository');
const preguntaRepo = require('../repositories/preguntaSeguridad.repository');
const preguntaSeguridadController = require('./preguntaSeguridad.controller');
const env = require('../config/env');
const db = require('../config/db');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseDevice(userAgent) {
  if (!userAgent) return 'Desconocido';
  if (userAgent.includes('Mobile')) return 'Móvil';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'Mac';
  if (userAgent.includes('Linux')) return 'Linux';
  return 'Escritorio';
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
    }

    const usuario = await usuarioRepo.findByEmail(email);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas o usuario inactivo' });
    }

    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const jti = crypto.randomUUID();
    const token = jwt.sign(
      { sub: usuario.id, email: usuario.email, rol: usuario.rol, jti },
      env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const tokenHash = hashToken(token);
    const expiraEn = new Date(Date.now() + 8 * 60 * 60 * 1000);

    // Guardar sesión
    await db.query(
      `INSERT INTO sesiones_usuario (usuario_id, jti, token_hash, ip, user_agent, dispositivo, expira_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [usuario.id, jti, tokenHash, req.ip, req.get('user-agent'), parseDevice(req.get('user-agent')), expiraEn]
    );

    // Si REQUIERIR_SESION_UNICA está activado, revocar otras sesiones
    const configResult = await db.query(`SELECT valor FROM configuracion WHERE clave = 'REQUIERIR_SESION_UNICA'`);
    const requireSingle = configResult.rows[0]?.valor === 'true';

    if (requireSingle) {
      await db.query(
        `UPDATE sesiones_usuario SET revocada = true WHERE usuario_id = $1 AND jti != $2`,
        [usuario.id, jti]
      );
    }

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          activo: usuario.activo
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { nombre, email, password, rol, preguntasSeguridad } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    const existing = await usuarioRepo.findByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUsuario = await usuarioRepo.create({
      nombre,
      email,
      password: passwordHash,
      rol: rol || 'vocero'
    });

    if (Array.isArray(preguntasSeguridad) && preguntasSeguridad.length > 0) {
      const creadas = await preguntaSeguridadController.crearPreguntasParaUsuario(newUsuario.id, preguntasSeguridad);
      newUsuario.preguntasSeguridad = creadas;
    }

    return res.status(201).json({
      success: true,
      data: newUsuario
    });
  } catch (error) {
    next(error);
  }
};

exports.profile = async (req, res, next) => {
  try {
    const usuario = await usuarioRepo.findById(req.user.id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    return res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// Admin CRUD functions for Users
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const data = await usuarioRepo.findAll(limit, offset);
    const total = await usuarioRepo.count();

    return res.json({
      success: true,
      data,
      pagination: { page, limit, total }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const usuario = await usuarioRepo.findById(id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    return res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, email, rol, activo, preguntasSeguridad } = req.body;

    const updated = await usuarioRepo.update(id, { nombre, email, rol, activo });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado o no actualizado' });
    }

    if (Array.isArray(preguntasSeguridad)) {
      await preguntaRepo.removeByUsuarioId(id);
      const creadas = await preguntaSeguridadController.crearPreguntasParaUsuario(id, preguntasSeguridad);
      updated.preguntasSeguridad = creadas;
    }

    return res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.deactivateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await usuarioRepo.deactivate(id);
    return res.json({
      success: true,
      message: 'Usuario desactivado'
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Contraseña actual y nueva contraseña requeridas' });
    }

    const usuario = await usuarioRepo.findById(req.user.id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(currentPassword, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await usuarioRepo.updatePassword(usuario.id, passwordHash);

    return res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requerido' });
    }

    const usuario = await usuarioRepo.findByEmail(email);
    if (!usuario) {
      return res.json({
        success: true,
        message: 'Si el correo está registrado, recibirás un enlace de recuperación'
      });
    }

    const resetToken = jwt.sign(
      { sub: usuario.id, purpose: 'password-reset' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await usuarioRepo.update(usuario.id, { reset_token: resetToken });

    return res.json({
      success: true,
      message: 'Si el correo está registrado, recibirás un enlace de recuperación',
      data: { resetToken }
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token y nueva contraseña requeridos' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ success: false, message: 'Token inválido' });
    }

    const usuario = await usuarioRepo.findById(decoded.sub);
    if (!usuario || usuario.reset_token !== token) {
      return res.status(400).json({ success: false, message: 'Token inválido o ya utilizado' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await usuarioRepo.updatePassword(usuario.id, passwordHash);
    await usuarioRepo.update(usuario.id, { reset_token: null });

    return res.json({
      success: true,
      message: 'Contraseña restablecida correctamente'
    });
  } catch (error) {
    next(error);
  }
};
