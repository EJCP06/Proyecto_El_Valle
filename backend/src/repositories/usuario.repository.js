const db = require('../config/db');

class UsuarioRepository {
  async findByEmail(email) {
    const res = await db.query('SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0];
  }

  async findById(id) {
    const res = await db.query('SELECT id, nombre, email, rol, activo, created_at FROM usuarios WHERE id = $1', [id]);
    return res.rows[0];
  }

  /** Trae el usuario con columnas sensibles (password, reset_token). Usar sólo cuando se necesiten. */
  async findByIdWithCredentials(id) {
    const res = await db.query('SELECT id, nombre, email, rol, activo, created_at, password, reset_token FROM usuarios WHERE id = $1', [id]);
    return res.rows[0];
  }

  async findAll(limit = 10, offset = 0, excludeId = null) {
    const res = await db.query(
      `SELECT id, nombre, email, rol, activo, created_at, telegram_chat_id
       FROM usuarios
       WHERE ($1::int IS NULL OR id != $1)
       ORDER BY id DESC LIMIT $2 OFFSET $3`,
      [excludeId, limit, offset]
    );
    return res.rows;
  }

  async count(excludeId = null) {
    const res = await db.query(
      'SELECT COUNT(*)::int as total FROM usuarios WHERE ($1::int IS NULL OR id != $1)',
      [excludeId]
    );
    return res.rows[0].total;
  }

  async create({ nombre, email, password, rol }) {
    const res = await db.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol, activo, created_at',
      [nombre, email, password, rol || 'viewer']
    );
    return res.rows[0];
  }

  async update(id, { nombre, email, rol, activo, reset_token }) {
    const res = await db.query(
      `UPDATE usuarios 
       SET nombre = COALESCE($1, nombre), 
           email = COALESCE($2, email), 
           rol = COALESCE($3, rol), 
           activo = COALESCE($4, activo),
           reset_token = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING id, nombre, email, rol, activo, created_at`,
      [nombre, email, rol, activo !== undefined ? activo : null, reset_token !== undefined ? reset_token : null, id]
    );
    return res.rows[0];
  }

  async updatePassword(id, passwordHash) {
    await db.query(
      'UPDATE usuarios SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, id]
    );
  }

  async deactivate(id) {
    await db.query('UPDATE usuarios SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }
}

module.exports = new UsuarioRepository();
