const db = require('../config/db');

async function findConsejoIdsByUsuario(usuarioId) {
  const result = await db.query(
    `SELECT consejo_id
       FROM usuarios_consejos
      WHERE usuario_id = $1
        AND activo = TRUE
      ORDER BY consejo_id`,
    [usuarioId]
  );

  return result.rows.map(row => row.consejo_id);
}

async function usuarioTieneAcceso(usuarioId, consejoId) {
  const result = await db.query(
    `SELECT 1
       FROM usuarios_consejos
      WHERE usuario_id = $1
        AND consejo_id = $2
        AND activo = TRUE
      LIMIT 1`,
    [usuarioId, consejoId]
  );

  return result.rowCount > 0;
}

module.exports = {
  findConsejoIdsByUsuario,
  usuarioTieneAcceso
};