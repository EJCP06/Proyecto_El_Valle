const familiaRepo = require('../repositories/familia.repository');

exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const consejoId = req.query.consejoId ? parseInt(req.query.consejoId) : null;

    const data = await familiaRepo.findAll(limit, offset, consejoId);
    const total = await familiaRepo.count(consejoId);

    return res.json({
      success: true,
      data,
      pagination: { page, limit, total }
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = await familiaRepo.findById(id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Familia no encontrada' });
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
    const { nombre, direccion, consejoId } = req.body;
    if (!nombre || !direccion) {
      return res.status(400).json({ success: false, message: 'Nombre y dirección son obligatorios' });
    }

    const data = await familiaRepo.create({ nombre, direccion, consejoId: consejoId ? parseInt(consejoId) : null });

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
    const { nombre, direccion, consejoId } = req.body;

    const data = await familiaRepo.update(id, { 
      nombre, 
      direccion, 
      consejoId: consejoId ? parseInt(consejoId) : null 
    });
    if (!data) {
      return res.status(404).json({ success: false, message: 'Familia no encontrada' });
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
    await familiaRepo.delete(id);
    return res.json({
      success: true,
      message: 'Familia eliminada'
    });
  } catch (error) {
    next(error);
  }
};
