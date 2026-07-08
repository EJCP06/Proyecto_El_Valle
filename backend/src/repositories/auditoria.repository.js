const db = require('../config/db');

class AuditoriaRepository {
  async create({ usuarioId, accion, entidad, entidadId, detalle, ip }) {
    const res = await db.query(
      `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle, ip) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [usuarioId, accion, entidad, entidadId, detalle ? JSON.stringify(detalle) : null, ip]
    );
    return res.rows[0];
  }

  async findAll(limit = 50, offset = 0, { entidad, desde, hasta } = {}) {
    let query = `
      SELECT a.id, a.usuario_id as "usuarioId", a.accion, a.entidad, a.entidad_id as "entidadId", a.detalle, a.ip, a.created_at as "createdAt",
             u.nombre as usuario_nombre, u.email as usuario_email
      FROM auditoria a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (entidad) {
      query += ` AND a.entidad ILIKE $${paramIndex}`;
      params.push(`%${entidad}%`);
      paramIndex++;
    }

    if (desde) {
      query += ` AND a.created_at >= $${paramIndex}`;
      params.push(desde);
      paramIndex++;
    }

    if (hasta) {
      query += ` AND a.created_at <= $${paramIndex}`;
      params.push(hasta);
      paramIndex++;
    }

    query += ` ORDER BY a.id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const res = await db.query(query, params);
    return res.rows.map(row => ({
      id: row.id,
      usuarioId: row.usuarioId,
      accion: row.accion,
      entidad: row.entidad,
      entidadId: row.entidadId,
      detalle: row.detalle,
      ip: row.ip,
      createdAt: row.createdAt,
      usuario: row.usuarioId ? { id: row.usuarioId, nombre: row.usuario_nombre, email: row.usuario_email } : null
    }));
  }

  async count({ entidad, desde, hasta } = {}) {
    let query = 'SELECT COUNT(*)::int as total FROM auditoria a WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (entidad) {
      query += ` AND a.entidad ILIKE $${paramIndex}`;
      params.push(`%${entidad}%`);
      paramIndex++;
    }

    if (desde) {
      query += ` AND a.created_at >= $${paramIndex}`;
      params.push(desde);
      paramIndex++;
    }

    if (hasta) {
      query += ` AND a.created_at <= $${paramIndex}`;
      params.push(hasta);
      paramIndex++;
    }

    const res = await db.query(query, params);
    return res.rows[0].total;
  }
}

module.exports = new AuditoriaRepository();
