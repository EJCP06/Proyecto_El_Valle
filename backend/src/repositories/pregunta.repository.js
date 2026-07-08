const db = require('../config/db');

class PreguntaRepository {
  async findByFormulario(formularioId) {
    const res = await db.query(
      'SELECT id, label, tipo, requerido, opciones, orden FROM preguntas WHERE formulario_id = $1 ORDER BY orden ASC',
      [formularioId]
    );
    return res.rows.map(row => ({
      id: row.id,
      label: row.label,
      tipo: row.tipo,
      requerido: row.requerido,
      opciones: row.opciones || [],
      orden: row.orden
    }));
  }

  async deleteByFormulario(formularioId) {
    await db.query('DELETE FROM preguntas WHERE formulario_id = $1', [formularioId]);
  }

  async create({ id, formularioId, label, tipo, requerido, opciones, orden }) {
    const res = await db.query(
      `INSERT INTO preguntas (id, formulario_id, label, tipo, requerido, opciones, orden) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, label, tipo, requerido, opciones, orden`,
      [id, formularioId, label, tipo, requerido || false, opciones || null, orden]
    );
    return res.rows[0];
  }
}

module.exports = new PreguntaRepository();
