const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const usuarioRepo = require('../repositories/usuario.repository');
const preguntaRepo = require('../repositories/preguntaSeguridad.repository');
const preguntaSeguridadController = require('./preguntaSeguridad.controller');
const env = require('../config/env');
const db = require('../config/db');
const { pool } = require('../config/db');
const { registrarAuditoria } = require('../services/auditoria.service');

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

async function incrementarIntentosIP(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1') return;
  try {
    const cfg = await pool.query("SELECT valor FROM configuracion WHERE clave IN ('MAX_INTENTOS_LOGIN','TIEMPO_BLOQUEO_MIN')");
    const max = parseInt(cfg.rows.find(r => r.clave === 'MAX_INTENTOS_LOGIN')?.valor ?? '3', 10);
    const mins = parseInt(cfg.rows.find(r => r.clave === 'TIEMPO_BLOQUEO_MIN')?.valor ?? '15', 10);
    const hasta = new Date(Date.now() + mins * 60 * 1000);

    await pool.query(
      `INSERT INTO ip_intentos (ip, intentos_fallidos, bloqueada_hasta, actualizado_en)
       VALUES ($1, 1, NULL, NOW())
       ON CONFLICT (ip) DO UPDATE SET
         intentos_fallidos = ip_intentos.intentos_fallidos + 1,
         bloqueada_hasta = CASE 
           WHEN ip_intentos.intentos_fallidos + 1 >= $2 THEN $3::timestamp
           ELSE ip_intentos.bloqueada_hasta
         END,
         actualizado_en = NOW()`,
      [ip, max, hasta]
    );
  } catch (e) {
    // silencioso
  }
}

async function limpiarIntentosIP(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1') return;
  try {
    await pool.query(`DELETE FROM ip_intentos WHERE ip = $1`, [ip]);
  } catch (e) {
    // silencioso
  }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
    }

    const usuario = await usuarioRepo.findByEmail(email);
    if (!usuario || !usuario.activo) {
      await incrementarIntentosIP(req.ip);
      await registrarAuditoria({
        accion: 'INICIAR SESIÓN FALLIDO',
        entidad: 'AUTENTICACIÓN',
        detalle: { email },
        req
      });
      return res.status(401).json({ success: false, message: 'Credenciales inválidas o usuario inactivo' });
    }

    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
      await incrementarIntentosIP(req.ip);
      await registrarAuditoria({
        accion: 'INICIAR SESIÓN FALLIDO',
        entidad: 'AUTENTICACIÓN',
        detalle: { email },
        req
      });
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

    // Sesión única: al iniciar sesión se revocan todas las sesiones anteriores
    // del usuario (la sesión más reciente siempre es la única activa).
    await db.query(
      `UPDATE sesiones_usuario SET revocada = true WHERE usuario_id = $1 AND jti != $2`,
      [usuario.id, jti]
    );

    await limpiarIntentosIP(req.ip);

    await registrarAuditoria({
      accion: 'INICIAR SESIÓN',
      entidad: 'AUTENTICACIÓN',
      entidadId: usuario.id,
      detalle: { dispositivo: parseDevice(req.get('user-agent')) },
      req
    });

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

/** Actualiza el perfil del usuario autenticado (nombre y/o correo). */
exports.updateProfile = async (req, res, next) => {
  try {
    const { nombre, email } = req.body;
    if (!nombre && !email) {
      return res.status(400).json({ success: false, message: 'Nombre o correo requeridos' });
    }

    const usuario = await usuarioRepo.findById(req.user.id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const nuevoNombre = (nombre ?? usuario.nombre).trim();
    const nuevoEmail = (email ?? usuario.email).trim().toLowerCase();

    if (nuevoNombre.length === 0) {
      return res.status(400).json({ success: false, message: 'El nombre no puede estar vacío' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoEmail)) {
      return res.status(400).json({ success: false, message: 'El correo electrónico no es válido' });
    }

    // Si cambia el correo, verificar que no lo use otro usuario
    if (nuevoEmail !== usuario.email.toLowerCase()) {
      const existente = await usuarioRepo.findByEmail(nuevoEmail);
      if (existente && existente.id !== usuario.id) {
        return res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado' });
      }
    }

    const updated = await usuarioRepo.update(usuario.id, { nombre: nuevoNombre, email: nuevoEmail });

    await registrarAuditoria({
      accion: 'MODIFICAR PERFIL',
      entidad: 'USUARIO',
      entidadId: usuario.id,
      detalle: { nombre: nuevoNombre, email: nuevoEmail },
      req
    });

    return res.json({ success: true, data: updated });
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

    await registrarAuditoria({
      accion: 'REGISTRAR',
      entidad: 'USUARIO',
      entidadId: newUsuario.id,
      detalle: { nombre, email, rol: rol || 'vocero' },
      req
    });

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

    const data = await usuarioRepo.findAll(limit, offset, req.user.id);
    const total = await usuarioRepo.count(req.user.id);

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

    await registrarAuditoria({
      accion: 'MODIFICAR',
      entidad: 'USUARIO',
      entidadId: id,
      detalle: { nombre, email, rol, activo },
      req
    });

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
    await registrarAuditoria({
      accion: 'DESACTIVAR',
      entidad: 'USUARIO',
      entidadId: id,
      req
    });
    return res.json({
      success: true,
      message: 'Usuario desactivado'
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    if (req.user?.jti) {
      await db.query(
        `UPDATE sesiones_usuario SET revocada = true WHERE jti = $1`,
        [req.user.jti]
      );
      await registrarAuditoria({
        accion: 'CERRAR SESIÓN',
        entidad: 'AUTENTICACIÓN',
        entidadId: req.user.id,
        req
      });
    }
    return res.json({ success: true, message: 'Sesión cerrada correctamente' });
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

    const usuario = await usuarioRepo.findByIdWithCredentials(req.user.id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    if (!usuario.password) {
      return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta' });
    }

    const isMatch = await bcrypt.compare(currentPassword, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await usuarioRepo.updatePassword(usuario.id, passwordHash);

    await registrarAuditoria({
      accion: 'CAMBIAR CONTRASEÑA',
      entidad: 'USUARIO',
      entidadId: usuario.id,
      req
    });

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

    await registrarAuditoria({
      accion: 'SOLICITAR RECUPERACIÓN',
      entidad: 'USUARIO',
      entidadId: usuario.id,
      req
    });

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

    const usuario = await usuarioRepo.findByIdWithCredentials(decoded.sub);
    if (!usuario || usuario.reset_token !== token) {
      return res.status(400).json({ success: false, message: 'Token inválido o ya utilizado' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await usuarioRepo.updatePassword(usuario.id, passwordHash);
    await usuarioRepo.update(usuario.id, { reset_token: null });

    await registrarAuditoria({
      accion: 'RESTABLECER CONTRASEÑA',
      entidad: 'USUARIO',
      entidadId: usuario.id,
      req
    });

    return res.json({
      success: true,
      message: 'Contraseña restablecida correctamente'
    });
  } catch (error) {
    next(error);
  }
};
