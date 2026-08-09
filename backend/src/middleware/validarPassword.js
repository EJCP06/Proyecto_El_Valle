/**
 * Middleware de validación de fortaleza de contraseña.
 * Reglas:
 *  - Mínimo 8 caracteres
 *  - Al menos 1 mayúscula
 *  - Al menos 1 minúscula
 *  - Al menos 1 número
 *  - Al menos 1 carácter especial (!@#$%^&*()_+-=[]{}|;':\",./<>?)
 */
function validarPassword(password) {
  const errors = [];
  if (!password || typeof password !== 'string') {
    return ['La contraseña es requerida'];
  }
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Al menos 1 letra mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Al menos 1 letra minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Al menos 1 número');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Al menos 1 carácter especial');
  }
  return errors;
}

/**
 * Express middleware que valida la contraseña del cuerpo de la petición.
 * Soporta el campo 'password' (registro) y 'newPassword' (cambio de contraseña).
 */
module.exports = function validarPasswordMiddleware(req, res, next) {
  const password = req.body.password || req.body.newPassword;
  const errors = validarPassword(password);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: `La contraseña no cumple los requisitos de seguridad: ${errors.join(', ')}`,
      errors
    });
  }
  next();
};

module.exports.validarPassword = validarPassword;
