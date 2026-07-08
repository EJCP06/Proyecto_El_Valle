const auditoriaRepo = require('../repositories/auditoria.repository');

exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { entidad, desde, hasta } = req.query;

    const data = await auditoriaRepo.findAll(limit, offset, { entidad, desde, hasta });
    const total = await auditoriaRepo.count({ entidad, desde, hasta });

    return res.json({
      success: true,
      data,
      pagination: { page, limit, total }
    });
  } catch (error) {
    next(error);
  }
};
