const db = require('../config/db');
const preguntaRepo = require('./pregunta.repository');

class FormularioRepository {
  async findAll(limit = 10, offset = 0) {
    const res = await db.query(
      'SELECT id, titulo, descripcion, activo, created_at FROM formularios ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return res.rows;
  }

  async count() {
    const res = await db.query('SELECT COUNT(*)::int as total FROM formularios');
    return res.rows[0].total;
  }

  async findById(id) {
    const res = await db.query(
      'SELECT id, titulo, descripcion, activo, created_at FROM formularios WHERE id = $1',
      [id]
    );
    if (res.rows.length === 0) return null;
    const form = res.rows[0];
    const campos = await preguntaRepo.findByFormulario(id);
    return {
      id: form.id,
      titulo: form.titulo,
      descripcion: form.descripcion,
      activo: form.activo,
      campos,
      created_at: form.created_at
    };
  }

  async create({ titulo, descripcion, campos = [] }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const resForm = await client.query(
        'INSERT INTO formularios (titulo, descripcion) VALUES ($1, $2) RETURNING *',
        [titulo, descripcion]
      );
      const newForm = resForm.rows[0];

      const insertedCampos = [];
      for (let i = 0; i < campos.length; i++) {
        const c = campos[i];
        const resCampo = await client.query(
          `INSERT INTO preguntas (id, formulario_id, label, tipo, requerido, opciones, orden) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING id, label, tipo, requerido, opciones, orden`,
          [c.id, newForm.id, c.label, c.tipo, c.requerido || false, c.opciones || null, i + 1]
        );
        insertedCampos.push({
          ...resCampo.rows[0],
          opciones: resCampo.rows[0].opciones || []
        });
      }

      await client.query('COMMIT');
      return {
        id: newForm.id,
        titulo: newForm.titulo,
        descripcion: newForm.descripcion,
        activo: newForm.activo,
        campos: insertedCampos,
        created_at: newForm.created_at
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async update(id, { titulo, descripcion, activo, campos }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const resForm = await client.query(
        `UPDATE formularios 
         SET titulo = COALESCE($1, titulo), 
             descripcion = COALESCE($2, descripcion), 
             activo = COALESCE($3, activo)
         WHERE id = $4 
         RETURNING *`,
        [titulo, descripcion, activo !== undefined ? activo : null, id]
      );
      const updatedForm = resForm.rows[0];

      if (campos) {
        // Delete existing questions and replace them
        await client.query('DELETE FROM preguntas WHERE formulario_id = $1', [id]);
        
        const insertedCampos = [];
        for (let i = 0; i < campos.length; i++) {
          const c = campos[i];
          const resCampo = await client.query(
            `INSERT INTO preguntas (id, formulario_id, label, tipo, requerido, opciones, orden) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, label, tipo, requerido, opciones, orden`,
            [c.id, id, c.label, c.tipo, c.requerido || false, c.opciones || null, i + 1]
          );
          insertedCampos.push({
            ...resCampo.rows[0],
            opciones: resCampo.rows[0].opciones || []
          });
        }
        updatedForm.campos = insertedCampos;
      } else {
        // Load existing questions
        const existing = await preguntaRepo.findByFormulario(id);
        updatedForm.campos = existing;
      }

      await client.query('COMMIT');
      return {
        id: updatedForm.id,
        titulo: updatedForm.titulo,
        descripcion: updatedForm.descripcion,
        activo: updatedForm.activo,
        campos: updatedForm.campos,
        created_at: updatedForm.created_at
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async delete(id) {
    await db.query('DELETE FROM formularios WHERE id = $1', [id]);
  }
}

module.exports = new FormularioRepository();
