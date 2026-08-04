const db = require('../config/db');

class PreguntaSeguridadRepository {
  async findByUsuarioId(usuarioId) {
    const res = await db.query(
      'SELECT id, usuario_id, pregunta, created_at FROM preguntas_seguridad WHERE usuario_id = $1',
      [usuarioId]
    );
    return res.rows;
  }

  async findById(id) {
    const res = await db.query(
      'SELECT id, usuario_id, pregunta, created_at FROM preguntas_seguridad WHERE id = $1',
      [id]
    );
    return res.rows[0];
  }

  async create(usuarioId, pregunta, respuestaHash) {
    const res = await db.query(
      'INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta) VALUES ($1, $2, $3) RETURNING id, usuario_id, pregunta, created_at',
      [usuarioId, pregunta, respuestaHash]
    );
    return res.rows[0];
  }

  async update(id, pregunta, respuestaHash) {
    const res = await db.query(
      'UPDATE preguntas_seguridad SET pregunta = COALESCE($1, pregunta), respuesta = COALESCE($2, respuesta) WHERE id = $3 RETURNING id, usuario_id, pregunta, created_at',
      [pregunta, respuestaHash, id]
    );
    return res.rows[0];
  }

  async remove(id) {
    await db.query('DELETE FROM preguntas_seguridad WHERE id = $1', [id]);
  }

  async findByUsuarioIdWithRespuestas(usuarioId) {
    const res = await db.query(
      'SELECT id, usuario_id, pregunta, respuesta FROM preguntas_seguridad WHERE usuario_id = $1',
      [usuarioId]
    );
    return res.rows;
  }
}

module.exports = new PreguntaSeguridadRepository();
