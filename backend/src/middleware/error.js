const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  logger.error(err.message || 'Internal Server Error', { stack: err.stack });

  const status = err.status || err.statusCode || 500;

  const cuerpo = {
    success: false,
    message: err.message || 'Ocurrió un error inesperado en el servidor'
  };

  // El `code` permite al frontend distinguir, por ejemplo, un intento de
  // consultar un consejo ajeno (COUNCIL_ACCESS_DENIED) de un filtro inválido.
  if (err.code && typeof err.code === 'string' && err.code.length <= 60) {
    cuerpo.code = err.code;
  }

  res.status(status).json(cuerpo);
};
