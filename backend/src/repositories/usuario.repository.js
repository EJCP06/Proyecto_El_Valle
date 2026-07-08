const db = require('../config/db');

class UsuarioRepository {
  async findByEmail(email) {
    const res = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return res.rows[0];
  }

  async findById(id) {
    const res = await db.query('SELECT id, nombre, email, rol, activo, created_at FROM usuarios WHERE id = $1', [id]);
    return res.rows[0];
  }

  async findAll(limit = 10, offset = 0) {
    const res = await db.query(
      'SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return res.rows;
  }

  async count() {
    const res = await db.query('SELECT COUNT(*)::int as total FROM usuarios');
    return res.rows[0].total;
  }

  async create({ nombre, email, password, rol }) {
    const res = await db.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol, activo, created_at',
      [nombre, email, password, rol || 'viewer']
    );
    return res.rows[0];
  }

  async update(id, { nombre, email, rol, activo }) {
    const res = await db.query(
      `UPDATE usuarios 
       SET nombre = COALESCE($1, nombre), 
           email = COALESCE($2, email), 
           rol = COALESCE($3, rol), 
           activo = COALESCE($4, activo),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING id, nombre, email, rol, activo, created_at`,
      [nombre, email, rol, activo !== undefined ? activo : null, id]
    );
    return res.rows[0];
  }

  async deactivate(id) {
    await db.query('UPDATE usuarios SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }
}

module.exports = new UsuarioRepository();
