const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  logger.error(err.message || 'Internal Server Error', { stack: err.stack });
  
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Ocurrió un error inesperado en el servidor'
  });
};
