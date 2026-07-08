function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function notFoundError(message = 'Recurso no encontrado') {
  return httpError(404, message);
}

module.exports = { httpError, notFoundError };
