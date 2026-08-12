const { pool } = require('../config/db');
const logger = require('../config/logger');

const INACTIVIDAD_MIN = 5;
const RETENCION_DIAS = 7;
const INTERVALO_MS = 60 * 1000;

/**
 * Revoca sesiones inactivas o expiradas y elimina las revocadas antiguas.
 * Corrige el caso de navegadores cerrados o usuarios que nunca vuelven,
 * dejando la tabla sesiones_usuario siempre consistente.
 */
async function limpiarSesiones() {
  try {
    const revocadas = await pool.query(
      `UPDATE sesiones_usuario
         SET revocada = true
       WHERE revocada = false
         AND (ultima_actividad < NOW() - ($1 || ' minutes')::interval
              OR expira_en < NOW())
       RETURNING id`,
      [INACTIVIDAD_MIN]
    );

    if (revocadas.rowCount > 0) {
      logger.info(`Sesiones revocadas por inactividad/expiracion: ${revocadas.rowCount}`);
    }

    const eliminadas = await pool.query(
      `DELETE FROM sesiones_usuario
       WHERE revocada = true
         AND creado_en < NOW() - ($1 || ' days')::interval
       RETURNING id`,
      [RETENCION_DIAS]
    );

    if (eliminadas.rowCount > 0) {
      logger.info(`Sesiones revocadas antiguas eliminadas: ${eliminadas.rowCount}`);
    }
  } catch (error) {
    logger.error('Error en limpieza de sesiones:', error);
  }
}

/** Inicia el ciclo de limpieza periódica. */
function iniciarLimpiezaSesiones() {
  logger.info(`Limpieza de sesiones activa (cada ${INTERVALO_MS / 1000}s, inactividad > ${INACTIVIDAD_MIN} min)`);
  // No se ejecuta inmediatamente al arrancar para evitar revocar sesiones
  // válidas de usuarios conectados antes del reinicio del servidor.
  return setInterval(limpiarSesiones, INTERVALO_MS);
}

module.exports = { iniciarLimpiezaSesiones, limpiarSesiones };
