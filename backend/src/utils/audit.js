const auditoriaRepo = require('../repositories/auditoria.repository');

async function registrarAuditoria(req, accion, entidad, entidadId = null, detalle = null) {
  try {
    const usuarioId = req.user ? req.user.id : null;
    const ip = req.ip || req.connection.remoteAddress;
    await auditoriaRepo.create({
      usuarioId,
      accion,
      entidad,
      entidadId,
      detalle,
      ip
    });
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
}

module.exports = { registrarAuditoria };
