const configuracionRepo = require('../repositories/configuracion.repository');

exports.getAll = async (req, res, next) => {
  try {
    const data = await configuracionRepo.findAll();
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { clave } = req.params;
    const { valor } = req.body;

    if (valor === undefined) {
      return res.status(400).json({ success: false, message: 'El valor es requerido' });
    }

    const data = await configuracionRepo.update(clave, valor);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Clave de configuración no encontrada' });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
