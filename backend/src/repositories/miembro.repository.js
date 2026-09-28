const db = require('../config/db');
const accesoConsejoRepo = require('./accesoConsejo.repository');

const COLUMNS = `id, familia_id as "familiaId", cedula, nombre, apellido,
  fecha_nacimiento as "fechaNacimiento", sexo, telefono, email,
  jefe_familia as "jefeFamilia", parentesco, estado_civil as "estadoCivil",
  nivel_educativo as "nivelEducativo", ocupacion, created_at`;

function esAdmin(rol) {
  return rol?.toLowerCase() === 'admin';
}

async function familiaTieneAcceso(familiaId, usuarioId, rol) {
  if (esAdmin(rol)) return true;

  const result = await db.query(
    `SELECT 1
     FROM familias f
     WHERE f.id = $1
       AND f.consejo_id IN (
         SELECT uc.consejo_id
         FROM usuarios_consejos uc
         WHERE uc.usuario_id = $2
           AND uc.activo = TRUE
       )
     LIMIT 1`,
    [familiaId, usuarioId]
  );

  return result.rowCount > 0;
}

class MiembroRepository {
  async findById(id, usuarioId = null, rol = null) {
    const res = await db.query(
      `SELECT ${COLUMNS}
       FROM miembros m
       WHERE m.id = $1
         ${
           !esAdmin(rol)
             ? `AND EXISTS (
                  SELECT 1
                  FROM familias f
                  WHERE f.id = m.familia_id
                    AND f.consejo_id IN (
                      SELECT uc.consejo_id
                      FROM usuarios_consejos uc
                      WHERE uc.usuario_id = $2
                        AND uc.activo = TRUE
                    )
                )`
             : ''
         }`,
      esAdmin(rol) ? [id] : [id, usuarioId]
    );

    return res.rows[0];
  }

  async findAllByFamilia(familiaId, usuarioId = null, rol = null) {
    const permitido = await familiaTieneAcceso(
      familiaId,
      usuarioId,
      rol
    );

    if (!permitido) {
      return null;
    }

    const res = await db.query(
      `SELECT ${COLUMNS}
       FROM miembros
       WHERE familia_id = $1
       ORDER BY jefe_familia DESC, id ASC`,
      [familiaId]
    );

    return res.rows;
  }

  async create(
    {
      familiaId,
      cedula,
      nombre,
      apellido,
      fechaNacimiento,
      sexo,
      telefono,
      email,
      jefeFamilia,
      parentesco,
      estadoCivil,
      nivelEducativo,
      ocupacion
    },
    usuarioId = null,
    rol = null
  ) {
    const permitido = await familiaTieneAcceso(
      familiaId,
      usuarioId,
      rol
    );

    if (!permitido) {
      const error = new Error(
        'No tienes acceso a la familia seleccionada'
      );
      error.code = 'FAMILY_ACCESS_DENIED';
      throw error;
    }

    if (jefeFamilia) {
      await db.query(
        'UPDATE miembros SET jefe_familia = false WHERE familia_id = $1',
        [familiaId]
      );
    }

    const res = await db.query(
      `INSERT INTO miembros (
        familia_id,
        cedula,
        nombre,
        apellido,
        fecha_nacimiento,
        sexo,
        telefono,
        email,
        jefe_familia,
        parentesco,
        estado_civil,
        nivel_educativo,
        ocupacion
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13
      )
      RETURNING ${COLUMNS}`,
      [
        familiaId,
        cedula,
        nombre,
        apellido,
        fechaNacimiento,
        sexo,
        telefono,
        email,
        jefeFamilia || false,
        parentesco,
        estadoCivil,
        nivelEducativo,
        ocupacion
      ]
    );

    return res.rows[0];
  }

  async update(
    id,
    {
      cedula,
      nombre,
      apellido,
      fechaNacimiento,
      sexo,
      telefono,
      email,
      jefeFamilia,
      familiaId,
      parentesco,
      estadoCivil,
      nivelEducativo,
      ocupacion
    },
    usuarioId = null,
    rol = null
  ) {
    const current = await this.findById(
      id,
      usuarioId,
      rol
    );

    if (!current) return null;

    const famId = familiaId || current.familiaId;

    const permitidoFamiliaNueva = await familiaTieneAcceso(
      famId,
      usuarioId,
      rol
    );

    if (!permitidoFamiliaNueva) {
      const error = new Error(
        'No tienes acceso a la familia seleccionada'
      );
      error.code = 'FAMILY_ACCESS_DENIED';
      throw error;
    }

    if (jefeFamilia) {
      await db.query(
        'UPDATE miembros SET jefe_familia = false WHERE familia_id = $1',
        [famId]
      );
    }

    const res = await db.query(
      `UPDATE miembros SET
        cedula = COALESCE($1, cedula),
        nombre = COALESCE($2, nombre),
        apellido = COALESCE($3, apellido),
        fecha_nacimiento = COALESCE($4, fecha_nacimiento),
        sexo = COALESCE($5, sexo),
        telefono = COALESCE($6, telefono),
        email = COALESCE($7, email),
        jefe_familia = COALESCE($8, jefe_familia),
        familia_id = COALESCE($9, familia_id),
        parentesco = COALESCE($10, parentesco),
        estado_civil = COALESCE($11, estado_civil),
        nivel_educativo = COALESCE($12, nivel_educativo),
        ocupacion = COALESCE($13, ocupacion)
       WHERE id = $14
       RETURNING ${COLUMNS}`,
      [
        cedula,
        nombre,
        apellido,
        fechaNacimiento,
        sexo,
        telefono,
        email,
        jefeFamilia !== undefined ? jefeFamilia : null,
        familiaId || null,
        parentesco,
        estadoCivil,
        nivelEducativo,
        ocupacion,
        id
      ]
    );

    return res.rows[0];
  }

  async delete(id, usuarioId = null, rol = null) {
    const current = await this.findById(
      id,
      usuarioId,
      rol
    );

    if (!current) return false;

    const res = await db.query(
      'DELETE FROM miembros WHERE id = $1',
      [id]
    );

    return res.rowCount > 0;
  }
}

module.exports = new MiembroRepository();