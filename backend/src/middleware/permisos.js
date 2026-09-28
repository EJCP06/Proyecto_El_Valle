const db = require('../config/db');

/**
 * Middleware para comprobar permisos funcionales.
 *
 * Uso:
 *   permission('familias', 'ver')
 *   permission('familias', 'crear')
 *   permission('familias', 'editar')
 *   permission('familias', 'eliminar')
 *
 * El administrador tiene acceso total.
 */
const permission = (modulo, accion) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // El administrador tiene acceso total.
      if (req.user.rol?.toLowerCase() === 'admin') {
        return next();
      }

      // Todas las acciones distintas de "ver" requieren que "ver"
      // también esté concedido.
      if (accion !== 'ver') {
        const puedeVer = await db.query(
          `SELECT usuario_tiene_permiso($1, $2, 'ver') AS permitido`,
          [req.user.id, modulo]
        );

        if (!puedeVer.rows[0]?.permitido) {
          return res.status(403).json({
            success: false,
            code: 'PERMISSION_DENIED',
            message: `No tienes permiso para ver el módulo ${modulo}`
          });
        }
      }

      const result = await db.query(
        `SELECT usuario_tiene_permiso($1, $2, $3) AS permitido`,
        [req.user.id, modulo, accion]
      );

      if (!result.rows[0]?.permitido) {
        return res.status(403).json({
          success: false,
          code: 'PERMISSION_DENIED',
          message: `No tienes permiso para ${accion} en ${modulo}`
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = permission;