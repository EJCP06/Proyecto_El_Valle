const db = require('../config/db');

class AsignacionRepository {
  async findAll(limit = 50, offset = 0) {
    const res = await db.query(
      `SELECT a.id, a.formulario_id as "formularioId", a.familia_id as "familiaId", a.estado, a.created_at as "createdAt",
              f.nombre as familia_nombre, 
              form.titulo as formulario_titulo,
              form.alcance as formulario_alcance
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
      formulario: { id: row.formularioId, titulo: row.formulario_titulo, alcance: row.formulario_alcance }
    }));
  }

  async findById(id) {
    const res = await db.query(
      `SELECT a.id, a.formulario_id as "formularioId", a.familia_id as "familiaId", a.estado, a.created_at as "createdAt",
              f.nombre as familia_nombre, 
              form.titulo as formulario_titulo,
              form.descripcion as formulario_descripcion,
              form.alcance as formulario_alcance
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
        descripcion: row.formulario_descripcion,
        alcance: row.formulario_alcance
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

  async findByFamiliaId(familiaId) {
    const res = await db.query(
      `SELECT a.id, a.formulario_id as "formularioId", a.familia_id as "familiaId", a.estado, a.created_at as "createdAt",
              form.titulo as formulario_titulo, form.alcance as formulario_alcance, form.descripcion as formulario_descripcion,
              f.nombre as familia_nombre,
              m.id as miembro_id, m.nombre as miembro_nombre, m.apellido as miembro_apellido
       FROM asignaciones a
       INNER JOIN formularios form ON a.formulario_id = form.id
       INNER JOIN familias f ON a.familia_id = f.id
       LEFT JOIN miembros m ON m.familia_id = a.familia_id
       WHERE a.familia_id = $1
       ORDER BY form.titulo, m.jefe_familia DESC, m.id ASC`,
      [familiaId]
    );

    const grouped = {};
    for (const row of res.rows) {
      const fId = row.formularioId;
      if (!grouped[fId]) {
        grouped[fId] = {
          formulario: { id: fId, titulo: row.formulario_titulo, alcance: row.formulario_alcance, descripcion: row.formulario_descripcion },
          asignaciones: [],
          totalMiembros: 0,
          respondidos: 0
        };
      }
      grouped[fId].asignaciones.push({
        id: row.id,
        formularioId: fId,
        familiaId: row.familiaId,
        estado: row.estado,
        createdAt: row.createdAt,
        familia: { id: row.familiaId, nombre: row.familia_nombre },
        miembro: row.miembro_id ? { id: row.miembro_id, nombre: row.miembro_nombre, apellido: row.miembro_apellido } : null
      });
      if (row.miembro_id) grouped[fId].totalMiembros++;
      if (row.estado === 'completado') grouped[fId].respondidos++;
    }

    return Object.values(grouped);
  }
}

module.exports = new AsignacionRepository();
