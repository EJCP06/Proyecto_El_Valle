const db = require('../config/db');

class PreguntaSeguridadRepository {
  async findByUsuarioId(usuarioId) {
    const res = await db.query(
      'SELECT id, usuario_id, pregunta_id, pregunta, created_at FROM preguntas_seguridad WHERE usuario_id = $1',
      [usuarioId]
    );
    return res.rows;
  }

  async create(usuarioId, preguntaId, pregunta, respuestaHash) {
    const res = await db.query(
      'INSERT INTO preguntas_seguridad (usuario_id, pregunta_id, pregunta, respuesta) VALUES ($1, $2, $3, $4) RETURNING id, usuario_id, pregunta_id, pregunta, created_at',
      [usuarioId, preguntaId, pregunta, respuestaHash]
    );
    return res.rows[0];
  }

  async removeByUsuarioId(usuarioId) {
    await db.query('DELETE FROM preguntas_seguridad WHERE usuario_id = $1', [usuarioId]);
  }

  async removeById(id) {
    await db.query('DELETE FROM preguntas_seguridad WHERE id = $1', [id]);
  }

  async update(id, preguntaId, pregunta, respuestaHash) {
    const res = await db.query(
      `UPDATE preguntas_seguridad
       SET pregunta_id = $2, pregunta = $3, respuesta = $4
       WHERE id = $1
       RETURNING id, usuario_id, pregunta_id, pregunta, created_at`,
      [id, preguntaId, pregunta, respuestaHash]
    );
    return res.rows[0];
  }

  async findByUsuarioIdWithRespuestas(usuarioId) {
    const res = await db.query(
      'SELECT id, usuario_id, pregunta_id, pregunta, respuesta FROM preguntas_seguridad WHERE usuario_id = $1',
      [usuarioId]
    );
    return res.rows;
  }
}

module.exports = new PreguntaSeguridadRepository();
