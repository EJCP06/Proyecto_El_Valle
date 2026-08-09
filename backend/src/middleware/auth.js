const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');
const { registrarAuditoria } = require('../services/auditoria.service');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token de autorización requerido' });
  }

  const token = authHeader.split(' ')[1];
  let payload;

  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Token expirado' });
    }
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  // Verificar sesión en BD
  const sessionResult = await db.query(
    `SELECT * FROM sesiones_usuario WHERE jti = $1 AND revocada = false AND expira_en > NOW()`,
    [payload.jti]
  );

  if (sessionResult.rows.length === 0) {
    // Verificar si fue revocada por sesión única
    const revokedResult = await db.query(
      `SELECT revocada FROM sesiones_usuario WHERE jti = $1`,
      [payload.jti]
    );
    if (revokedResult.rows.length > 0 && revokedResult.rows[0].revocada) {
      await registrarAuditoria({
        accion: 'SESIÓN REVOCADA',
        entidad: 'AUTENTICACIÓN',
        entidadId: revokedResult.rows[0].usuario_id,
        req
      });
      return res.status(401).json({ 
        success: false, 
        code: 'SESSION_REVOKED', 
        message: 'Tu sesión fue cerrada porque iniciaste sesión en otro dispositivo' 
      });
    }
    return res.status(401).json({ success: false, message: 'Sesión inválida o expirada' });
  }

  // Terminar sesión por inactividad: si no hubo actividad en los últimos 5 minutos
  // se revoca en BD y se obliga a volver a iniciar sesión.
  const inactiva = sessionResult.rows[0].ultima_actividad < new Date(Date.now() - 5 * 60 * 1000);
  if (inactiva) {
    await db.query(
      `UPDATE sesiones_usuario SET revocada = true WHERE jti = $1`,
      [payload.jti]
    );
    await registrarAuditoria({
      accion: 'TERMINAR SESIÓN POR INACTIVIDAD',
      entidad: 'AUTENTICACIÓN',
      entidadId: sessionResult.rows[0].usuario_id,
      req
    });
    return res.status(401).json({
      success: false,
      code: 'SESSION_INACTIVE',
      message: 'Tu sesión terminó por inactividad. Vuelve a iniciar sesión.'
    });
  }

  // Actualizar última actividad (se omite para los chequeos de sesión del frontend,
  // para no interferir con la revocación por inactividad del servidor).
  const esChequeoSesion = req.headers['x-session-check'] === '1';
  if (!esChequeoSesion) {
    await db.query(
      `UPDATE sesiones_usuario SET ultima_actividad = NOW() WHERE jti = $1`,
      [payload.jti]
    );
  }

  req.user = { id: payload.sub, email: payload.email, rol: payload.rol, jti: payload.jti };
  next();
};

module.exports = authMiddleware;