const db = require('../config/db');

function esAdmin(rol) {
  return rol?.toLowerCase() === 'admin';
}

class RespuestaRepository {
  async findByAsignacion(
    asignacionId,
    usuarioId = null,
    rol = null
  ) {
    let query = `
      SELECT
        r.id,
        r.asignacion_id as "asignacionId",
        r.miembro_id as "miembroId",
        r.respuestas,
        r.completado_en as "completadoEn"
      FROM respuestas r
      INNER JOIN asignaciones a
        ON a.id = r.asignacion_id
      INNER JOIN familias f
        ON f.id = a.familia_id
      WHERE r.asignacion_id = $1
    `;

    const params = [asignacionId];

    if (!esAdmin(rol)) {
      query += `
        AND f.consejo_id IN (
          SELECT uc.consejo_id
          FROM usuarios_consejos uc
          WHERE uc.usuario_id = $2
            AND uc.activo = TRUE
        )
      `;

      params.push(usuarioId);
    }

    query += `
      ORDER BY r.id DESC
      LIMIT 1
    `;

    const res = await db.query(query, params);

    return res.rows[0];
  }

  async save(
    asignacionId,
    respuestas,
    miembroId = null,
    usuarioId = null,
    rol = null
  ) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      /*
       * Primero verificamos que la asignación exista
       * y que el usuario tenga acceso a la familia.
       */
      const asignacionQuery = `
        SELECT
          a.id,
          a.familia_id as "familiaId",
          f.consejo_id as "consejoId"
        FROM asignaciones a
        INNER JOIN familias f
          ON f.id = a.familia_id
        WHERE a.id = $1
        ${
          !esAdmin(rol)
            ? `
              AND f.consejo_id IN (
                SELECT uc.consejo_id
                FROM usuarios_consejos uc
                WHERE uc.usuario_id = $2
                  AND uc.activo = TRUE
              )
            `
            : ''
        }
        FOR UPDATE
      `;

      const asignacionParams = esAdmin(rol)
        ? [asignacionId]
        : [asignacionId, usuarioId];

      const asignacionResult = await client.query(
        asignacionQuery,
        asignacionParams
      );

      if (asignacionResult.rows.length === 0) {
        const error = new Error(
          'No tienes acceso a la asignación seleccionada'
        );
        error.code = 'ASSIGNMENT_ACCESS_DENIED';
        throw error;
      }

      const asignacion = asignacionResult.rows[0];

      /*
       * Si se indicó un miembro, debe pertenecer
       * obligatoriamente a la familia de la asignación.
       */
      if (miembroId !== null && miembroId !== undefined) {
        const miembroResult = await client.query(
          `SELECT id
           FROM miembros
           WHERE id = $1
             AND familia_id = $2
           LIMIT 1`,
          [miembroId, asignacion.familiaId]
        );

        if (miembroResult.rows.length === 0) {
          const error = new Error(
            'El miembro no pertenece a la familia de la asignación'
          );
          error.code = 'MEMBER_FAMILY_MISMATCH';
          throw error;
        }
      }

      const res = await client.query(
        `INSERT INTO respuestas (
          asignacion_id,
          miembro_id,
          respuestas
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (asignacion_id, miembro_id)
        DO UPDATE SET
          respuestas = $3,
          completado_en = CURRENT_TIMESTAMP
        RETURNING
          id,
          asignacion_id as "asignacionId",
          miembro_id as "miembroId",
          respuestas,
          completado_en as "completadoEn"`,
        [
          asignacionId,
          miembroId,
          JSON.stringify(respuestas)
        ]
      );

      await client.query(
        `UPDATE asignaciones
         SET estado = 'completado'
         WHERE id = $1`,
        [asignacionId]
      );

      await client.query('COMMIT');

      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new RespuestaRepository();