const db = require('../config/db');

class RespuestaRepository {
  async findByAsignacion(asignacionId) {
    const res = await db.query(
      'SELECT id, asignacion_id as "asignacionId", miembro_id as "miembroId", respuestas, completado_en as "completadoEn" FROM respuestas WHERE asignacion_id = $1',
      [asignacionId]
    );
    return res.rows[0];
  }

  async save(asignacionId, respuestas, miembroId = null) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const res = await client.query(
        `INSERT INTO respuestas (asignacion_id, miembro_id, respuestas) 
         VALUES ($1, $2, $3)
         ON CONFLICT (asignacion_id, miembro_id) 
         DO UPDATE SET respuestas = $3, completado_en = CURRENT_TIMESTAMP
         RETURNING id, asignacion_id as "asignacionId", miembro_id as "miembroId", respuestas, completado_en as "completadoEn"`,
        [asignacionId, miembroId, JSON.stringify(respuestas)]
      );

      await client.query(
        "UPDATE asignaciones SET estado = 'completado' WHERE id = $1",
        [asignacionId]
      );

      await client.query('COMMIT');
      return res.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

module.exports = new RespuestaRepository();
