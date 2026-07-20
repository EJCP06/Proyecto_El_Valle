const miembroRepo = require('../repositories/miembro.repository');

exports.getAll = async (req, res, next) => {
  try {
    const { familiaId } = req.query;
    if (!familiaId) {
      return res.status(400).json({ success: false, message: 'familiaId es requerido' });
    }
    const data = await miembroRepo.findAllByFamilia(parseInt(familiaId));
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = await miembroRepo.findById(id);
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
    });

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
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
    });

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

exports.delete = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await miembroRepo.delete(id);
    return res.json({
      success: true,
      message: 'Miembro de familia eliminado'
    });
  } catch (error) {
    next(error);
  }
};
