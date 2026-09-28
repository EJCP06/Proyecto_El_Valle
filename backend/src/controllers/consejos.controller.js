const consejoRepo = require('../repositories/consejo.repository');

exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const data = await consejoRepo.findAll(
      limit,
      offset,
      req.user.id,
      req.user.rol
    );

    const total = await consejoRepo.count(
      req.user.id,
      req.user.rol
    );

    return res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de consejo inválido'
      });
    }

    const data = await consejoRepo.findById(
      id,
      req.user.id,
      req.user.rol
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Consejo comunal no encontrado'
      });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      nombre,
      rif,
      direccion,
      parroquia,
      municipio,
      estado,
      telefono,
      email
    } = req.body;

    if (
      !nombre ||
      !rif ||
      !direccion ||
      !parroquia ||
      !municipio ||
      !estado
    ) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }

    const data = await consejoRepo.create({
      nombre,
      rif,
      direccion,
      parroquia,
      municipio,
      estado,
      telefono,
      email
    });

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de consejo inválido'
      });
    }

    const {
      nombre,
      rif,
      direccion,
      parroquia,
      municipio,
      estado,
      telefono,
      email,
      activo
    } = req.body;

    const data = await consejoRepo.update(id, {
      nombre,
      rif,
      direccion,
      parroquia,
      municipio,
      estado,
      telefono,
      email,
      activo
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Consejo comunal no encontrado'
      });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de consejo inválido'
      });
    }

    const existing = await consejoRepo.findById(
      id,
      req.user.id,
      req.user.rol
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Consejo comunal no encontrado'
      });
    }

    await consejoRepo.delete(id);

    return res.json({
      success: true,
      message: 'Consejo comunal eliminado'
    });
  } catch (error) {
    next(error);
  }
};