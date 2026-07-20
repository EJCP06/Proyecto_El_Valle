const formularioRepo = require('../repositories/formulario.repository');
const asignacionRepo = require('../repositories/asignacion.repository');
const respuestaRepo = require('../repositories/respuesta.repository');

exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const data = await formularioRepo.findAll(limit, offset);
    const total = await formularioRepo.count();

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
    const data = await formularioRepo.findById(id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Formulario no encontrado' });
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
    const { titulo, descripcion, alcance, campos } = req.body;
    if (!titulo) {
      return res.status(400).json({ success: false, message: 'El título es obligatorio' });
    }

    const data = await formularioRepo.create({ titulo, descripcion, alcance, campos });

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
    const { titulo, descripcion, activo, alcance, campos } = req.body;

    const data = await formularioRepo.update(id, { titulo, descripcion, activo, alcance, campos });
    if (!data) {
      return res.status(404).json({ success: false, message: 'Formulario no encontrado' });
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
    await formularioRepo.delete(id);
    return res.json({
      success: true,
      message: 'Formulario eliminado'
    });
  } catch (error) {
    next(error);
  }
};

exports.asignar = async (req, res, next) => {
  try {
    const { formularioId, familiaId } = req.body;
    if (!formularioId || !familiaId) {
      return res.status(400).json({ success: false, message: 'Formulario y familia son requeridos' });
    }

    const data = await asignacionRepo.create({ 
      formularioId: parseInt(formularioId), 
      familiaId: parseInt(familiaId) 
    });

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.responder = async (req, res, next) => {
  try {
    const asignacionId = parseInt(req.params.id);
    const { respuestas, miembroId } = req.body;

    if (!respuestas) {
      return res.status(400).json({ success: false, message: 'Respuestas son requeridas' });
    }

    const asignacion = await asignacionRepo.findById(asignacionId);
    if (!asignacion) {
      return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
    }

    const data = await respuestaRepo.save(asignacionId, respuestas, miembroId || null);

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getAsignaciones = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const data = await asignacionRepo.findAll(limit, offset);
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getByFamilia = async (req, res, next) => {
  try {
    const familiaId = parseInt(req.params.familiaId);
    if (!familiaId) {
      return res.status(400).json({ success: false, message: 'familiaId es requerido' });
    }

    const data = await asignacionRepo.findByFamiliaId(familiaId);
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
