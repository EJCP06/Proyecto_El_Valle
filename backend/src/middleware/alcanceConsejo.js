const db = require('../config/db');

/**
 * Comprueba que el usuario tenga acceso al consejo indicado.
 *
 * ADMIN:
 *   acceso total.
 *
 * VOCERO:
 *   solamente consejos asignados en usuarios_consejos
 *   y marcados como activos.
 */
async function usuarioTieneAccesoConsejo(usuarioId, consejoId, rol) {
  if (rol?.toLowerCase() === 'admin') {
    return true;
  }

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

/**
 * Middleware para comprobar acceso a un consejo recibido
 * directamente como parámetro de ruta.
 *
 * Ejemplo:
 *   /consejos/:id
 */
const consejoPorParametro = (parametro = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      const consejoId = parseInt(req.params[parametro], 10);

      if (!Number.isInteger(consejoId) || consejoId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID de consejo inválido'
        });
      }

      const permitido = await usuarioTieneAccesoConsejo(
        req.user.id,
        consejoId,
        req.user.rol
      );

      if (!permitido) {
        return res.status(403).json({
          success: false,
          code: 'COUNCIL_ACCESS_DENIED',
          message: 'No tienes acceso a este consejo comunal'
        });
      }

      req.consejoId = consejoId;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  usuarioTieneAccesoConsejo,
  consejoPorParametro
};