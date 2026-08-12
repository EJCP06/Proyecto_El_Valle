const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const { pool } = require('../config/db');
const { BACKUP_DIR } = require('../services/backup.service');

const INTERVALO_MS = 6 * 60 * 60 * 1000;
const DIAS_DEFAULT = 30;

async function diasRetencion() {
  try {
    const r = await pool.query("SELECT valor FROM configuracion WHERE clave = 'RETENCION_BACKUPS_DIAS'");
    const n = parseInt(r.rows[0]?.valor, 10);
    return Number.isFinite(n) && n >= 0 ? n : DIAS_DEFAULT;
  } catch {
    return DIAS_DEFAULT;
  }
}

/**
 * Elimina los respaldos más antiguos que RETENCION_BACKUPS_DIAS.
 * Conserva siempre al menos el respaldo más reciente.
 */
async function limpiarBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const dias = await diasRetencion();
    if (dias <= 0) return;

    const corte = Date.now() - dias * 24 * 60 * 60 * 1000;
    const archivos = fs.readdirSync(BACKUP_DIR)
      .filter((f) => /\.(dump|sql)$/i.test(f))
      .sort();

    let eliminados = 0;
    for (let i = 0; i < archivos.length - 1; i++) {
      const ruta = path.join(BACKUP_DIR, archivos[i]);
      const stats = fs.statSync(ruta);
      if (stats.mtimeMs < corte) {
        fs.unlinkSync(ruta);
        const rutaJson = `${ruta}.json`;
        if (fs.existsSync(rutaJson)) fs.unlinkSync(rutaJson);
        eliminados++;
      }
    }

    if (eliminados > 0) {
      logger.info(`Limpieza de respaldos: ${eliminados} eliminados (retención ${dias} días)`);
    }
  } catch (error) {
    logger.error('Error en limpieza de respaldos:', error);
  }
}

function iniciarLimpiezaBackups() {
  logger.info(`Limpieza automática de respaldos activa (cada ${INTERVALO_MS / 3600000}h)`);
  limpiarBackups();
  return setInterval(limpiarBackups, INTERVALO_MS);
}

module.exports = { iniciarLimpiezaBackups, limpiarBackups };
