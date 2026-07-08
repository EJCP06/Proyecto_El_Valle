const reporteRepo = require('../repositories/reporte.repository');

exports.generate = async (req, res, next) => {
  try {
    const { tipo, desde, hasta } = req.body;
    let data;
    if (tipo === 'familias') {
      data = await reporteRepo.getFamiliasData(desde, hasta);
    } else if (tipo === 'miembros') {
      data = await reporteRepo.getMiembrosData(desde, hasta);
    } else if (tipo === 'formularios') {
      data = await reporteRepo.getFormulariosData(desde, hasta);
    } else {
      data = await reporteRepo.getAuditoriaData(desde, hasta);
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadPdf = async (req, res, next) => {
  try {
    const { tipo } = req.body;
    return res.status(501).json({
      success: false,
      message: 'La generación de PDF requiere una librería especializada. Por favor, instala pdfkit o contacta al administrador.'
    });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const data = await reporteRepo.getDashboardStats();
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
