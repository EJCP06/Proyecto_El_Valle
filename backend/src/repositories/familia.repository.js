const db = require('../config/db');

class FamiliaRepository {
  async findAll(limit = 10, offset = 0, consejoId = null) {
    let query = `
      SELECT f.*, 
             c.nombre as consejo_nombre,
             (SELECT COUNT(*)::int FROM miembros m WHERE m.familia_id = f.id) as miembros_count
      FROM familias f
      LEFT JOIN consejos_comunales c ON f.consejo_id = c.id
    `;
    const params = [limit, offset];

    if (consejoId) {
      query += ` WHERE f.consejo_id = $3`;
      params.push(consejoId);
    }

    query += ` ORDER BY f.id DESC LIMIT $1 OFFSET $2`;

    const res = await db.query(query, params);
    
    // Map response to match frontend interface
    return res.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      direccion: row.direccion,
      consejoId: row.consejo_id,
      consejo: row.consejo_id ? { id: row.consejo_id, nombre: row.consejo_nombre } : null,
      miembros: Array(row.miembros_count).fill({}), // Just mock length for listings
      created_at: row.created_at
    }));
  }

  async count(consejoId = null) {
    let query = 'SELECT COUNT(*)::int as total FROM familias';
    const params = [];

    if (consejoId) {
      query += ' WHERE consejo_id = $1';
      params.push(consejoId);
    }

    const res = await db.query(query, params);
    return res.rows[0].total;
  }

  async findById(id) {
    const resFamilia = await db.query(
      `SELECT f.*, c.nombre as consejo_nombre 
       FROM familias f 
       LEFT JOIN consejos_comunales c ON f.consejo_id = c.id 
       WHERE f.id = $1`,
      [id]
    );

    if (resFamilia.rows.length === 0) return null;

    const familia = resFamilia.rows[0];

    const resMiembros = await db.query(
      `SELECT id, cedula, nombre, apellido, fecha_nacimiento as "fechaNacimiento", sexo, telefono, email, jefe_familia as "jefeFamilia"
       FROM miembros 
       WHERE familia_id = $1 
       ORDER BY jefe_familia DESC, id ASC`,
      [id]
    );

    return {
      id: familia.id,
      nombre: familia.nombre,
      direccion: familia.direccion,
      consejoId: familia.consejo_id,
      consejo: familia.consejo_id ? { id: familia.consejo_id, nombre: familia.consejo_nombre } : null,
      miembros: resMiembros.rows,
      created_at: familia.created_at
    };
  }

  async create({ nombre, direccion, consejoId }) {
    const res = await db.query(
      `INSERT INTO familias (nombre, direccion, consejo_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, nombre, direccion, consejo_id as "consejoId", created_at`,
      [nombre, direccion, consejoId]
    );
    return res.rows[0];
  }

  async update(id, { nombre, direccion, consejoId }) {
    const res = await db.query(
      `UPDATE familias 
       SET nombre = COALESCE($1, nombre), 
           direccion = COALESCE($2, direccion), 
           consejo_id = COALESCE($3, consejo_id)
       WHERE id = $4 
       RETURNING id, nombre, direccion, consejo_id as "consejoId", created_at`,
      [nombre, direccion, consejoId, id]
    );
    return res.rows[0];
  }

  async delete(id) {
    await db.query('DELETE FROM familias WHERE id = $1', [id]);
  }
}

module.exports = new FamiliaRepository();
