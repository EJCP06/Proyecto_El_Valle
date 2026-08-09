const { isIP } = require('net');
const db = require('../config/db');
const configuracionRepo = require('../repositories/configuracion.repository');

let configCache = {
  IP_VALIDACION: 'true',
  IP_BLOQUEADAS: '',
  IP_PERMITIDAS: '',
  timestamp: 0
};
const CACHE_TTL = 60 * 1000;

async function cargarConfig() {
  const ahora = Date.now();
  if (ahora - configCache.timestamp < CACHE_TTL) return configCache;

  try {
    const rows = await db.query(
      `SELECT clave, valor FROM configuracion WHERE clave IN ('IP_VALIDACION','IP_BLOQUEADAS','IP_PERMITIDAS')`
    );
    const nueva = { ...configCache, timestamp: ahora };
    for (const r of rows.rows) {
      if (r.clave === 'IP_VALIDACION') nueva.IP_VALIDACION = r.valor;
      else if (r.clave === 'IP_BLOQUEADAS') nueva.IP_BLOQUEADAS = r.valor;
      else if (r.clave === 'IP_PERMITIDAS') nueva.IP_PERMITIDAS = r.valor;
    }
    configCache = nueva;
  } catch (e) {
    // si falla BD, usa cache o defaults
  }
  return configCache;
}

function parseCSV(csv) {
  if (!csv) return new Set();
  return new Set(csv.split(',').map(s => s.trim()).filter(Boolean));
}

function obtenerIP(req) {
  return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
}

module.exports = async function validarIP(req, res, next) {
  const ip = obtenerIP(req);

  if (ip === 'unknown' || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1')) {
    return next();
  }

  if (!isIP(ip)) {
    return res.status(400).json({ success: false, code: 'IP_INVALIDA', message: 'Dirección IP no válida' });
  }

  const cfg = await cargarConfig();

  if (cfg.IP_VALIDACION !== 'true') return next();

  const bloqueadas = parseCSV(cfg.IP_BLOQUEADAS);
  if (bloqueadas.has(ip)) {
    return res.status(403).json({ success: false, code: 'IP_BLOQUEADA', message: 'Tu IP está bloqueada' });
  }

  const permitidas = parseCSV(cfg.IP_PERMITIDAS);
  if (permitidas.size > 0 && !permitidas.has(ip)) {
    return res.status(403).json({ success: false, code: 'IP_NO_PERMITIDA', message: 'Tu IP no está autorizada' });
  }

  next();
};

module.exports.cargarConfig = cargarConfig;
module.exports.parseCSV = parseCSV;