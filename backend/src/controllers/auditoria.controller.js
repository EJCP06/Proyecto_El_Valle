const auditoriaRepo = require('../repositories/auditoria.repository');

exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const filtros = {
      entidad: req.query.entidad,
      accion: req.query.accion,
      usuarioId: req.query.usuarioId ? parseInt(req.query.usuarioId) : undefined,
      desde: req.query.desde,
      hasta: req.query.hasta,
      search: req.query.search,
      limit,
      offset
    };

    const data = await auditoriaRepo.findAll(filtros);
    const total = await auditoriaRepo.count(filtros);

    return res.json({
      success: true,
      data,
      pagination: { page, limit, total }
    });
  } catch (error) {
    next(error);
  }
};
