const db = require('../config/db');

class UsuarioRepository {
  async findByEmail(email) {
    const res = await db.query('SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0];
  }

  async findById(id) {
    const res = await db.query('SELECT id, nombre, email, rol, activo, created_at FROM usuarios WHERE id = $1', [id]);
    return res.rows[0];
  }

  /** Trae el usuario con columnas sensibles (password, reset_token). Usar sólo cuando se necesiten. */
  async findByIdWithCredentials(id) {
    const res = await db.query('SELECT id, nombre, email, rol, activo, created_at, password, reset_token FROM usuarios WHERE id = $1', [id]);
    return res.rows[0];
  }

  async findAll(limit = 10, offset = 0, excludeId = null) {
    const res = await db.query(
      `SELECT id, nombre, email, rol, activo, created_at, telegram_chat_id
       FROM usuarios
       WHERE ($1::int IS NULL OR id != $1)
       ORDER BY id DESC LIMIT $2 OFFSET $3`,
      [excludeId, limit, offset]
    );
    return res.rows;
  }

  async count(excludeId = null) {
    const res = await db.query(
      'SELECT COUNT(*)::int as total FROM usuarios WHERE ($1::int IS NULL OR id != $1)',
      [excludeId]
    );
    return res.rows[0].total;
  }

  async create({ nombre, email, password, rol, activo }) {
    const res = await db.query(
      'INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, email, rol, activo, created_at',
      [nombre, email, password, rol || 'viewer', activo !== undefined ? activo : true]
    );
    return res.rows[0];
  }

  async update(id, { nombre, email, rol, activo, reset_token }) {
    const res = await db.query(
      `UPDATE usuarios 
       SET nombre = COALESCE($1, nombre), 
           email = COALESCE($2, email), 
           rol = COALESCE($3, rol), 
           activo = COALESCE($4, activo),
           reset_token = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING id, nombre, email, rol, activo, created_at`,
      [nombre, email, rol, activo !== undefined ? activo : null, reset_token !== undefined ? reset_token : null, id]
    );
    return res.rows[0];
  }

    async findConsejos(id) {
    const res = await db.query(
      `SELECT
         c.id,
         c.nombre,
         c.rif,
         uc.activo,
         uc.created_at as "createdAt"
       FROM usuarios_consejos uc
       INNER JOIN consejos_comunales c
         ON c.id = uc.consejo_id
       WHERE uc.usuario_id = $1
         AND uc.activo = TRUE
       ORDER BY c.id`,
      [id]
    );

    return res.rows;
  }

  async setConsejos(id, consejoIds = []) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const usuario = await client.query(
        `SELECT id
         FROM usuarios
         WHERE id = $1`,
        [id]
      );

      if (usuario.rows.length === 0) {
        return null;
      }

      const ids = [
        ...new Set(
          consejoIds
            .map(Number)
            .filter(
              (consejoId) =>
                Number.isInteger(consejoId) && consejoId > 0
            )
        )
      ];

      if (ids.length > 0) {
        const consejos = await client.query(
          `SELECT id
           FROM consejos_comunales
           WHERE id = ANY($1::int[])`,
          [ids]
        );

        const existentes = new Set(
          consejos.rows.map(row => row.id)
        );

        const invalidos = ids.filter(
          consejoId => !existentes.has(consejoId)
        );

        if (invalidos.length > 0) {
          const error = new Error(
            `Consejos comunales inválidos: ${invalidos.join(', ')}`
          );
          error.code = 'INVALID_COUNCIL_IDS';
          throw error;
        }
      }

      await client.query(
        `UPDATE usuarios_consejos
         SET activo = FALSE
         WHERE usuario_id = $1`,
        [id]
      );

      for (const consejoId of ids) {
        await client.query(
          `INSERT INTO usuarios_consejos (
             usuario_id,
             consejo_id,
             activo
           )
           VALUES ($1, $2, TRUE)
           ON CONFLICT (usuario_id, consejo_id)
           DO UPDATE SET
             activo = TRUE`,
          [id, consejoId]
        );
      }

      await client.query('COMMIT');

      return this.findConsejos(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePassword(id, passwordHash) {
    await db.query(
      'UPDATE usuarios SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, id]
    );
  }

  async deactivate(id) {
    await db.query('UPDATE usuarios SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

    async findPermisos(id) {
    const res = await db.query(
      `SELECT
         p.id,
         p.modulo,
         p.accion,
         up.created_at as "createdAt"
       FROM usuarios_permisos up
       INNER JOIN permisos p
         ON p.id = up.permiso_id
       WHERE up.usuario_id = $1
       ORDER BY p.modulo, p.accion`,
      [id]
    );

    return res.rows;
  }

  async setPermisos(id, permisoIds = []) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const usuario = await client.query(
        `SELECT id
         FROM usuarios
         WHERE id = $1`,
        [id]
      );

      if (usuario.rows.length === 0) {
        return null;
      }

      const ids = [
        ...new Set(
          permisoIds
            .map(Number)
            .filter(
              permisoId =>
                Number.isInteger(permisoId) && permisoId > 0
            )
        )
      ];

      if (ids.length > 0) {
        const permisos = await client.query(
          `SELECT id
           FROM permisos
           WHERE id = ANY($1::int[])`,
          [ids]
        );

        const existentes = new Set(
          permisos.rows.map(row => row.id)
        );

        const invalidos = ids.filter(
          permisoId => !existentes.has(permisoId)
        );

        if (invalidos.length > 0) {
          const error = new Error(
            `Permisos inválidos: ${invalidos.join(', ')}`
          );

          error.code = 'INVALID_PERMISSION_IDS';

          throw error;
        }
      }

      await client.query(
        `DELETE FROM usuarios_permisos
         WHERE usuario_id = $1`,
        [id]
      );

      for (const permisoId of ids) {
        await client.query(
          `INSERT INTO usuarios_permisos (
             usuario_id,
             permiso_id
           )
           VALUES ($1, $2)
           ON CONFLICT (usuario_id, permiso_id)
           DO NOTHING`,
          [id, permisoId]
        );
      }

      await client.query('COMMIT');

      return this.findPermisos(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findPermisosCatalogo() {
    const res = await db.query(
      `SELECT
         id,
         modulo,
         accion
       FROM permisos
       ORDER BY modulo, accion`
    );

    return res.rows;
  }

    async findAcceso(id) {
    const [permisos, consejos] = await Promise.all([
      this.findPermisos(id),
      this.findConsejos(id)
    ]);

    return {
      permisos,
      consejos
    };
  }
}

module.exports = new UsuarioRepository();
