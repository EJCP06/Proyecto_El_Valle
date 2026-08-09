const auditoriaRepo = require('../repositories/auditoria.repository');

const CAMPOS_SENSIBLES = new Set([
  'password', 'newPassword', 'currentPassword', 'confirmPassword',
  'token', 'resetToken', 'codigo', 'respuesta', 'respuestas',
  'reset_token', 'token_hash', 'jti'
]);

function sanearDetalle(detalle) {
  if (!detalle || typeof detalle !== 'object') return detalle;

  const limpio = {};
  for (const [clave, valor] of Object.entries(detalle)) {
    if (CAMPOS_SENSIBLES.has(clave)) {
      limpio[clave] = '***';
      continue;
    }
    if (Array.isArray(valor)) {
      limpio[clave] = valor.map((v) => (v && typeof v === 'object' ? sanearDetalle(v) : v));
      continue;
    }
    if (valor && typeof valor === 'object') {
      limpio[clave] = sanearDetalle(valor);
      continue;
    }
    limpio[clave] = valor;
  }
  return limpio;
}

/**
 * Registra una traza de auditoría. Nunca debe romper la petición:
 * los errores de auditoría se capturan y sólo se registran en el logger.
 */
async function registrarAuditoria({ accion, entidad, entidadId, detalle, req, ip }) {
  try {
    const usuarioId = req?.user?.id ?? null;
    const direccionIp = ip ?? req?.ip ?? null;
    await auditoriaRepo.registrar({
      usuarioId,
      accion,
      entidad,
      entidadId,
      detalle: sanearDetalle(detalle),
      ip: direccionIp
    });
  } catch (error) {
    const logger = require('../config/logger');
    logger.error('Error al registrar auditoría:', { accion, entidad, message: error.message });
  }
}

module.exports = { registrarAuditoria, sanearDetalle };
