const { registrarAuditoria } = require('../services/auditoria.service');

// Rutas que se auditan explícitamente desde sus controladores
// (autenticación, recuperación y preguntas de seguridad) para no duplicar trazas.
const RUTAS_EXPLICITAS = [
  '/api/auth',
  '/api/preguntas-seguridad',
  '/api/configuracion'
];

function esRutaExplicita(originalUrl) {
  return RUTAS_EXPLICITAS.some((ruta) => originalUrl.startsWith(ruta));
}

function extraerIdDeUrl(url) {
  const segmentos = url.split('?')[0].split('/').filter(Boolean);
  for (let i = segmentos.length - 1; i >= 0; i--) {
    const n = Number(segmentos[i]);
    if (Number.isInteger(n) && n > 0) return n;
  }
  return null;
}

function extraerEntidadDeUrl(url) {
  const segmentos = url.split('?')[0].split('/').filter(Boolean);
  for (let i = segmentos.length - 1; i >= 0; i--) {
    const n = Number(segmentos[i]);
    if (!(Number.isInteger(n) && n > 0)) return segmentos[i];
  }
  return null;
}

const METODOS_ESCRITURA = ['POST', 'PUT', 'PATCH', 'DELETE'];
const ACCION_POR_METODO = {
  POST: 'CREAR',
  PUT: 'MODIFICAR',
  PATCH: 'MODIFICAR',
  DELETE: 'ELIMINAR'
};

/**
 * Traza automática de actividad (REGISTRAR ACTIVIDAD): registra todas las
 * peticiones de escritura con sesión iniciada (consejos, familias, miembros,
 * formularios, catálogos, etc.). Las rutas sensibles se auditan explícitamente.
 * Se registra al terminar la respuesta, cuando req.user ya está disponible.
 */
module.exports = function registrarActividadMiddleware(req, res, next) {
  if (!METODOS_ESCRITURA.includes(req.method) || esRutaExplicita(req.originalUrl)) {
    return next();
  }

  const entidad = extraerEntidadDeUrl(req.originalUrl) || 'sistema';
  const entidadId = extraerIdDeUrl(req.originalUrl);
  const accion = ACCION_POR_METODO[req.method];
  const detalle = req.body && Object.keys(req.body).length ? { ...req.body } : null;

  res.on('finish', () => {
    if (res.statusCode >= 400 || !req.user) return;
    registrarAuditoria({ accion, entidad, entidadId, detalle, req });
  });

  next();
};
