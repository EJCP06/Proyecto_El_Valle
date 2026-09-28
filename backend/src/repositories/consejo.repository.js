const db = require('../config/db');

function esAdmin(rol) {
  return rol?.toLowerCase() === 'admin';
}

class ConsejoRepository {
  async findAll(limit = 10, offset = 0, usuarioId = null, rol = null) {
    let query = `
      SELECT c.*
      FROM consejos_comunales c
    `;

    const params = [limit, offset];

    if (!esAdmin(rol)) {
      query += `
        INNER JOIN usuarios_consejos uc
          ON uc.consejo_id = c.id
         AND uc.usuario_id = $3
         AND uc.activo = TRUE
      `;
      params.push(usuarioId);
    }

    query += `
      ORDER BY c.id DESC
      LIMIT $1 OFFSET $2
    `;

    const res = await db.query(query, params);

    return res.rows;
  }

  async count(usuarioId = null, rol = null) {
    let query = `
      SELECT COUNT(*)::int AS total
      FROM consejos_comunales c
    `;

    const params = [];

    if (!esAdmin(rol)) {
      query += `
        INNER JOIN usuarios_consejos uc
          ON uc.consejo_id = c.id
         AND uc.usuario_id = $1
         AND uc.activo = TRUE
      `;
      params.push(usuarioId);
    }

    const res = await db.query(query, params);

    return res.rows[0].total;
  }

  async findById(id, usuarioId = null, rol = null) {
    let query = `
      SELECT c.*
      FROM consejos_comunales c
      WHERE c.id = $1
    `;

    const params = [id];

    if (!esAdmin(rol)) {
      query += `
        AND EXISTS (
          SELECT 1
          FROM usuarios_consejos uc
          WHERE uc.usuario_id = $2
            AND uc.consejo_id = c.id
            AND uc.activo = TRUE
        )
      `;
      params.push(usuarioId);
    }

    const res = await db.query(query, params);

    return res.rows[0];
  }

  async create({
    nombre,
    rif,
    direccion,
    parroquia,
    municipio,
    estado,
    telefono,
    email
  }) {
    const res = await db.query(
      `INSERT INTO consejos_comunales (
        nombre,
        rif,
        direccion,
        parroquia,
        municipio,
        estado,
        telefono,
        email
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        nombre,
        rif,
        direccion,
        parroquia,
        municipio,
        estado,
        telefono,
        email
      ]
    );

    return res.rows[0];
  }

  async update(
    id,
    {
      nombre,
      rif,
      direccion,
      parroquia,
      municipio,
      estado,
      telefono,
      email,
      activo
    }
  ) {
    const res = await db.query(
      `UPDATE consejos_comunales
       SET nombre = COALESCE($1, nombre),
           rif = COALESCE($2, rif),
           direccion = COALESCE($3, direccion),
           parroquia = COALESCE($4, parroquia),
           municipio = COALESCE($5, municipio),
           estado = COALESCE($6, estado),
           telefono = COALESCE($7, telefono),
           email = COALESCE($8, email),
           activo = COALESCE($9, activo)
       WHERE id = $10
       RETURNING *`,
      [
        nombre,
        rif,
        direccion,
        parroquia,
        municipio,
        estado,
        telefono,
        email,
        activo !== undefined ? activo : null,
        id
      ]
    );

    return res.rows[0];
  }

  async delete(id) {
    await db.query(
      'DELETE FROM consejos_comunales WHERE id = $1',
      [id]
    );
  }
}

module.exports = new ConsejoRepository();