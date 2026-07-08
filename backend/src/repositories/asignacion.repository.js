const db = require('../config/db');

class AsignacionRepository {
  async findAll(limit = 50, offset = 0) {
    const res = await db.query(
      `SELECT a.id, a.formulario_id as "formularioId", a.familia_id as "familiaId", a.estado, a.created_at as "createdAt",
              f.nombre as familia_nombre, 
              form.titulo as formulario_titulo
       FROM asignaciones a
       INNER JOIN familias f ON a.familia_id = f.id
       INNER JOIN formularios form ON a.formulario_id = form.id
       ORDER BY a.id DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.rows.map(row => ({
      id: row.id,
      formularioId: row.formularioId,
      familiaId: row.familiaId,
      estado: row.estado,
      createdAt: row.createdAt,
      familia: { id: row.familiaId, nombre: row.familia_nombre },
      formulario: { id: row.formularioId, titulo: row.formulario_titulo }
    }));
  }

  async findById(id) {
    const res = await db.query(
      `SELECT a.id, a.formulario_id as "formularioId", a.familia_id as "familiaId", a.estado, a.created_at as "createdAt",
              f.nombre as familia_nombre, 
              form.titulo as formulario_titulo,
              form.descripcion as formulario_descripcion
       FROM asignaciones a
       INNER JOIN familias f ON a.familia_id = f.id
       INNER JOIN formularios form ON a.formulario_id = form.id
       WHERE a.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      formularioId: row.formularioId,
      familiaId: row.familiaId,
      estado: row.estado,
      createdAt: row.createdAt,
      familia: { id: row.familiaId, nombre: row.familia_nombre },
      formulario: { 
        id: row.formularioId, 
        titulo: row.formulario_titulo, 
        descripcion: row.formulario_descripcion 
      }
    };
  }

  async create({ formularioId, familiaId }) {
    const res = await db.query(
      `INSERT INTO asignaciones (formulario_id, familia_id) 
       VALUES ($1, $2) 
       ON CONFLICT (formulario_id, familia_id) DO UPDATE SET estado = 'pendiente'
       RETURNING id, formulario_id as "formularioId", familia_id as "familiaId", estado, created_at as "createdAt"`,
      [formularioId, familiaId]
    );
    return res.rows[0];
  }

  async updateEstado(id, estado) {
    const res = await db.query(
      'UPDATE asignaciones SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );
    return res.rows[0];
  }

  async delete(id) {
    await db.query('DELETE FROM asignaciones WHERE id = $1', [id]);
  }
}

module.exports = new AsignacionRepository();
