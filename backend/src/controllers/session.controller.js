const db = require('../config/db');

exports.listSessions = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, jti, ip, user_agent, dispositivo, creado_en, ultima_actividad, expira_en
       FROM sesiones_usuario
       WHERE usuario_id = $1 AND revocada = false AND expira_en > NOW()
       ORDER BY ultima_actividad DESC`,
      [req.user.id]
    );

    const currentJti = req.user.jti;
    const sessions = result.rows.map(s => ({
      ...s,
      es_actual: s.jti === currentJti
    }));

    return res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

exports.revokeSession = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.id);
    
    const result = await db.query(
      `SELECT jti FROM sesiones_usuario WHERE id = $1 AND usuario_id = $2`,
      [sessionId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sesión no encontrada' });
    }

    const session = result.rows[0];
    if (session.jti === req.user.jti) {
      return res.status(400).json({ success: false, message: 'No puedes cerrar tu sesión actual desde aquí' });
    }

    await db.query(
      `UPDATE sesiones_usuario SET revocada = true WHERE id = $1`,
      [sessionId]
    );

    return res.json({ success: true, message: 'Sesión cerrada correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.revokeAllOtherSessions = async (req, res, next) => {
  try {
    await db.query(
      `UPDATE sesiones_usuario SET revocada = true WHERE usuario_id = $1 AND jti != $2`,
      [req.user.id, req.user.jti]
    );

    return res.json({ success: true, message: 'Todas las otras sesiones han sido cerradas' });
  } catch (error) {
    next(error);
  }
};