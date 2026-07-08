const db = require('../config/db');

class ConfiguracionRepository {
  async findAll() {
    const res = await db.query(
      'SELECT clave, valor, descripcion FROM configuracion ORDER BY clave ASC'
    );
    return res.rows;
  }

  async findByKey(clave) {
    const res = await db.query(
      'SELECT clave, valor, descripcion FROM configuracion WHERE clave = $1',
      [clave]
    );
    return res.rows[0];
  }

  async update(clave, valor) {
    const res = await db.query(
      `UPDATE configuracion 
       SET valor = $1 
       WHERE clave = $2 
       RETURNING clave, valor, descripcion`,
      [valor, clave]
    );
    return res.rows[0];
  }
}

module.exports = new ConfiguracionRepository();
