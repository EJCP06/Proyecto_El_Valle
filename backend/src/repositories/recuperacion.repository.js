const db = require('../config/db');

class RecuperacionRepository {
  async findUsuarioByEmail(email) {
    const res = await db.query(
      'SELECT id, email, activo FROM usuarios WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    return res.rows[0] || null;
  }

  async invalidarCodigosPendientes(usuarioId) {
    await db.query(
      'UPDATE recuperacion_clave SET usado = true WHERE usuario_id = $1 AND usado = false',
      [usuarioId]
    );
  }

  async insertarCodigo(usuarioId, codigo, canal = 'email') {
    await db.query(
      `INSERT INTO recuperacion_clave (usuario_id, codigo, expiracion, canal)
       VALUES ($1, $2, NOW() + INTERVAL '3 minutes', $3)`,
      [usuarioId, codigo, canal]
    );
  }

  async findCodigoValido(email) {
    const res = await db.query(
      `SELECT rc.id, rc.codigo, rc.expiracion, rc.intentos
       FROM recuperacion_clave rc
       JOIN usuarios u ON rc.usuario_id = u.id
       WHERE LOWER(u.email) = LOWER($1) AND rc.usado = false
       ORDER BY rc.fecha_creacion DESC LIMIT 1`,
      [email.trim()]
    );
    return res.rows[0] || null;
  }

  async incrementarIntentos(id) {
    await db.query(
      'UPDATE recuperacion_clave SET intentos = COALESCE(intentos, 0) + 1 WHERE id = $1',
      [id]
    );
  }

  async marcarUsado(id) {
    await db.query('UPDATE recuperacion_clave SET usado = true WHERE id = $1', [id]);
  }

  async updatePassword(usuarioId, passwordHash) {
    await db.query(
      'UPDATE usuarios SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, usuarioId]
    );
  }
}

module.exports = new RecuperacionRepository();
