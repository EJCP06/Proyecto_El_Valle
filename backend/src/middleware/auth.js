const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');

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
      return res.status(401).json({ 
        success: false, 
        code: 'SESSION_REVOKED', 
        message: 'Tu sesión fue cerrada porque iniciaste sesión en otro dispositivo' 
      });
    }
    return res.status(401).json({ success: false, message: 'Sesión inválida o expirada' });
  }

  // Actualizar última actividad
  await db.query(
    `UPDATE sesiones_usuario SET ultima_actividad = NOW() WHERE jti = $1`,
    [payload.jti]
  );

  req.user = { id: payload.sub, email: payload.email, rol: payload.rol, jti: payload.jti };
  next();
};

module.exports = authMiddleware;