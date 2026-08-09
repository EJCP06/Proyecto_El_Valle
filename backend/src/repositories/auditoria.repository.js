const db = require('../config/db');

class AuditoriaRepository {
  async registrar({ usuarioId, accion, entidad, entidadId, detalle, ip }) {
    const res = await db.query(
      `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle, ip)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [usuarioId ?? null, accion, entidad, entidadId ?? null, detalle ?? null, ip ?? null]
    );
    return res.rows[0];
  }

  async findAll({ entidad, accion, usuarioId, desde, hasta, search, limit = 50, offset = 0 } = {}) {
    const values = [];
    const clauses = [];

    if (entidad) {
      values.push(entidad);
      clauses.push(`a.entidad = $${values.length}`);
    }

    if (accion) {
      values.push(`%${accion}%`);
      clauses.push(`a.accion ILIKE $${values.length}`);
    }

    if (usuarioId) {
      values.push(usuarioId);
      clauses.push(`a.usuario_id = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      clauses.push(`(u.nombre ILIKE $${values.length} OR u.email ILIKE $${values.length} OR a.entidad ILIKE $${values.length} OR a.accion ILIKE $${values.length})`);
    }

    if (desde) {
      values.push(desde);
      clauses.push(`a.created_at >= $${values.length}`);
    }

    if (hasta) {
      values.push(hasta);
      clauses.push(`a.created_at <= $${values.length}`);
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    values.push(Math.max(1, Number(limit) || 50));
    values.push(Math.max(0, Number(offset) || 0));

    const result = await db.query(
      `SELECT a.id, a.usuario_id, a.accion, a.entidad, a.entidad_id, a.detalle, a.ip, a.created_at,
              u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM auditoria a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return result.rows;
  }

  async count({ entidad, accion, usuarioId, desde, hasta, search } = {}) {
    const values = [];
    const clauses = [];

    if (entidad) {
      values.push(entidad);
      clauses.push(`a.entidad = $${values.length}`);
    }

    if (accion) {
      values.push(`%${accion}%`);
      clauses.push(`a.accion ILIKE $${values.length}`);
    }

    if (usuarioId) {
      values.push(usuarioId);
      clauses.push(`a.usuario_id = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      clauses.push(`(u.nombre ILIKE $${values.length} OR u.email ILIKE $${values.length} OR a.entidad ILIKE $${values.length} OR a.accion ILIKE $${values.length})`);
    }

    if (desde) {
      values.push(desde);
      clauses.push(`a.created_at >= $${values.length}`);
    }

    if (hasta) {
      values.push(hasta);
      clauses.push(`a.created_at <= $${values.length}`);
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM auditoria a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       ${whereClause}`,
      values
    );

    return result.rows[0].total;
  }
}

module.exports = new AuditoriaRepository();
