const miembroRepo = require('../repositories/miembro.repository');

exports.getAll = async (req, res, next) => {
  try {
    const { familiaId } = req.query;
    if (!familiaId) {
      return res.status(400).json({ success: false, message: 'familiaId es requerido' });
    }
    const data = await miembroRepo.findAllByFamilia(
      parseInt(familiaId),
      req.user.id,
      req.user.rol
    );

    if (data === null) {
      return res.status(403).json({
        success: false,
        code: 'FAMILY_ACCESS_DENIED',
        message: 'No tienes acceso a esta familia'
      });
    }
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = await miembroRepo.findById(
      id,
      req.user.id,
      req.user.rol
    );
    if (!data) {
      return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
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
    const { familiaId, cedula, nombre, apellido, fechaNacimiento, sexo, telefono, email, jefeFamilia, parentesco, estadoCivil, nivelEducativo, ocupacion } = req.body;
    if (!familiaId || !cedula || !nombre || !apellido) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }

    const data = await miembroRepo.create({
      familiaId: parseInt(familiaId),
      cedula, nombre, apellido, fechaNacimiento, sexo, telefono, email,
      jefeFamilia: jefeFamilia === true || jefeFamilia === 'true',
      parentesco, estadoCivil, nivelEducativo, ocupacion
    }, 
    req.user.id, 
    req.user.rol);

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {

    if (error.code === 'FAMILY_ACCESS_DENIED') {
      return res.status(403).json({
        success: false,
        code: 'FAMILY_ACCESS_DENIED',
        message: error.message
      });
    }

    if (error.code === '23505' && error.constraint === 'miembros_cedula_key') {
      return res.status(409).json({ success: false, message: 'Ya existe un miembro registrado con esa cédula.' });
    }
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { cedula, nombre, apellido, fechaNacimiento, sexo, telefono, email, jefeFamilia, familiaId, parentesco, estadoCivil, nivelEducativo, ocupacion } = req.body;

    const data = await miembroRepo.update(id, {
      cedula, nombre, apellido, fechaNacimiento, sexo, telefono, email,
      jefeFamilia: jefeFamilia !== undefined ? (jefeFamilia === true || jefeFamilia === 'true') : undefined,
      familiaId: familiaId ? parseInt(familiaId) : undefined,
      parentesco, estadoCivil, nivelEducativo, ocupacion
    }, 
    req.user.id, 
    req.user.rol);

    if (!data) {
      return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {

    if (error.code === 'FAMILY_ACCESS_DENIED') {
      return res.status(403).json({
        success: false,
        code: 'FAMILY_ACCESS_DENIED',
        message: error.message
      });
    }
    
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const eliminado = await miembroRepo.delete(
      id,
      req.user.id,
      req.user.rol
    );

    if (!eliminado) {
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado'
      });
    }
    return res.json({
      success: true,
      message: 'Miembro de familia eliminado'
    });
  } catch (error) {
    next(error);
  }
};
