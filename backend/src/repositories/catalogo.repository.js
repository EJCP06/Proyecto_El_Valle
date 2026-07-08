const db = require('../config/db');

class CatalogoRepository {
  constructor(table) {
    this.table = table;
  }

  async findAll() {
    const res = await db.query(
      `SELECT id, nombre, activo FROM ${this.table} ORDER BY id ASC`
    );
    return res.rows;
  }

  async findActive() {
    const res = await db.query(
      `SELECT id, nombre FROM ${this.table} WHERE activo = true ORDER BY nombre ASC`
    );
    return res.rows;
  }

  async create(nombre) {
    const res = await db.query(
      `INSERT INTO ${this.table} (nombre) VALUES ($1) RETURNING id, nombre, activo`,
      [nombre]
    );
    return res.rows[0];
  }

  async update(id, { nombre, activo }) {
    const res = await db.query(
      `UPDATE ${this.table} SET nombre = COALESCE($1, nombre), activo = COALESCE($2, activo) WHERE id = $3 RETURNING id, nombre, activo`,
      [nombre, activo, id]
    );
    return res.rows[0];
  }

  async delete(id) {
    await db.query(`DELETE FROM ${this.table} WHERE id = $1`, [id]);
  }
}

const repos = {
  parentescos: new CatalogoRepository('cat_parentescos'),
  estadosCiviles: new CatalogoRepository('cat_estados_civiles'),
  nivelesEducativos: new CatalogoRepository('cat_niveles_educativos'),
  ocupaciones: new CatalogoRepository('cat_ocupaciones'),
  tiposVivienda: new CatalogoRepository('cat_tipos_vivienda'),
  tiposDiscapacidad: new CatalogoRepository('cat_tipos_discapacidad'),
};

module.exports = repos;
