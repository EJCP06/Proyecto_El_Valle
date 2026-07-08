const db = require('../config/db');

class ConsejoRepository {
  async findAll(limit = 10, offset = 0) {
    const res = await db.query(
      'SELECT * FROM consejos_comunales ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return res.rows;
  }

  async count() {
    const res = await db.query('SELECT COUNT(*)::int as total FROM consejos_comunales');
    return res.rows[0].total;
  }

  async findById(id) {
    const res = await db.query('SELECT * FROM consejos_comunales WHERE id = $1', [id]);
    return res.rows[0];
  }

  async create({ nombre, rif, direccion, parroquia, municipio, estado, telefono, email }) {
    const res = await db.query(
      `INSERT INTO consejos_comunales (nombre, rif, direccion, parroquia, municipio, estado, telefono, email) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [nombre, rif, direccion, parroquia, municipio, estado, telefono, email]
    );
    return res.rows[0];
  }

  async update(id, { nombre, rif, direccion, parroquia, municipio, estado, telefono, email, activo }) {
    const res = await db.query(
      `UPDATE consejos_comunales 
       SET nombre = COALESCE($1, nombre), 
           rif = COALESCE($2, rif), 
           direccion = COALESCE($3, direccion), 
           parroquia = COALESCE($4, parroquia), 
           municipio = COALESCE($5, municipio), 
           estado = COALESCE($6, estado), 
           telefono = COALESCE($7, telefono), 
           email = COALESCE($8, email),
           activo = COALESCE($9, activo)
       WHERE id = $10 
       RETURNING *`,
      [nombre, rif, direccion, parroquia, municipio, estado, telefono, email, activo !== undefined ? activo : null, id]
    );
    return res.rows[0];
  }

  async delete(id) {
    await db.query('DELETE FROM consejos_comunales WHERE id = $1', [id]);
  }
}

module.exports = new ConsejoRepository();
