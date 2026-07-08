const db = require('../config/db');

const COLUMNS = `id, familia_id as "familiaId", cedula, nombre, apellido,
  fecha_nacimiento as "fechaNacimiento", sexo, telefono, email,
  jefe_familia as "jefeFamilia", parentesco, estado_civil as "estadoCivil",
  nivel_educativo as "nivelEducativo", ocupacion, created_at`;

class MiembroRepository {
  async findById(id) {
    const res = await db.query(`SELECT ${COLUMNS} FROM miembros WHERE id = $1`, [id]);
    return res.rows[0];
  }

  async findAllByFamilia(familiaId) {
    const res = await db.query(
      `SELECT ${COLUMNS} FROM miembros WHERE familia_id = $1 ORDER BY jefe_familia DESC, id ASC`,
      [familiaId]
    );
    return res.rows;
  }

  async create({ familiaId, cedula, nombre, apellido, fechaNacimiento, sexo, telefono, email, jefeFamilia, parentesco, estadoCivil, nivelEducativo, ocupacion }) {
    if (jefeFamilia) {
      await db.query('UPDATE miembros SET jefe_familia = false WHERE familia_id = $1', [familiaId]);
    }

    const res = await db.query(
      `INSERT INTO miembros (familia_id, cedula, nombre, apellido, fecha_nacimiento, sexo, telefono, email, jefe_familia, parentesco, estado_civil, nivel_educativo, ocupacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING ${COLUMNS}`,
      [familiaId, cedula, nombre, apellido, fechaNacimiento, sexo, telefono, email, jefeFamilia || false, parentesco, estadoCivil, nivelEducativo, ocupacion]
    );
    return res.rows[0];
  }

  async update(id, { cedula, nombre, apellido, fechaNacimiento, sexo, telefono, email, jefeFamilia, familiaId, parentesco, estadoCivil, nivelEducativo, ocupacion }) {
    const current = await this.findById(id);
    if (!current) return null;

    const famId = familiaId || current.familiaId;

    if (jefeFamilia) {
      await db.query('UPDATE miembros SET jefe_familia = false WHERE familia_id = $1', [famId]);
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
        parentesco = COALESCE($9, parentesco),
        estado_civil = COALESCE($10, estado_civil),
        nivel_educativo = COALESCE($11, nivel_educativo),
        ocupacion = COALESCE($12, ocupacion)
       WHERE id = $13
       RETURNING ${COLUMNS}`,
      [cedula, nombre, apellido, fechaNacimiento, sexo, telefono, email, jefeFamilia !== undefined ? jefeFamilia : null, parentesco, estadoCivil, nivelEducativo, ocupacion, id]
    );
    return res.rows[0];
  }

  async delete(id) {
    await db.query('DELETE FROM miembros WHERE id = $1', [id]);
  }
}

module.exports = new MiembroRepository();
