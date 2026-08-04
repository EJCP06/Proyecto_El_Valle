const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { enviarCorreoOTP } = require('../config/email');
const recuperacionRepo = require('../repositories/recuperacion.repository');

/**
 * Inicia el proceso de recuperación de contraseña. Siempre responde
 * con el mismo mensaje genérico para evitar enumeración de cuentas.
 * Si el usuario existe, genera y envía un código OTP por correo.
 */
exports.solicitar = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Correo requerido' });
    }

    const usuario = await recuperacionRepo.findUsuarioByEmail(email);

    if (!usuario) {
      return res.status(200).json({
        success: true,
        message: 'Si el correo está registrado, recibirás un código de verificación',
        expiracion: 180
      });
    }

    const codigo = crypto.randomInt(100000, 999999).toString();
    const codigoHash = await bcrypt.hash(codigo, 10);

    await recuperacionRepo.invalidarCodigosPendientes(usuario.id);
    await recuperacionRepo.insertarCodigo(usuario.id, codigoHash);

    try {
      await enviarCorreoOTP(usuario.email, codigo);
    } catch (emailError) {
      return res.status(500).json({ success: false, message: 'Error al enviar el correo. Verifica la configuración de email.' });
    }

    return res.json({
      success: true,
      message: 'Código enviado al correo registrado',
      expiracion: 180
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica que el código OTP ingresado sea válido y no haya expirado.
 */
exports.verificar = async (req, res, next) => {
  try {
    const { email, codigo } = req.body;
    if (!email || !codigo) {
      return res.status(400).json({ success: false, message: 'Correo y código son requeridos' });
    }

    const registro = await recuperacionRepo.findCodigoValido(email);

    if (!registro) {
      return res.status(400).json({ success: false, message: 'No hay código pendiente. Solicita uno nuevo.' });
    }

    if (new Date() > new Date(registro.expiracion)) {
      await recuperacionRepo.marcarUsado(registro.id);
      return res.status(400).json({ success: false, message: 'El código ha expirado. Solicita uno nuevo.' });
    }

    const codigoValido = await bcrypt.compare(codigo, registro.codigo);
    if (!codigoValido) {
      await recuperacionRepo.incrementarIntentos(registro.id);
      return res.status(400).json({ success: false, message: 'Código incorrecto' });
    }

    return res.json({ success: true, message: 'Código verificado correctamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Restablece la contraseña del usuario tras validar el código OTP.
 */
exports.restablecer = async (req, res, next) => {
  try {
    const { email, codigo, newPassword } = req.body;
    if (!email || !codigo || !newPassword) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const registro = await recuperacionRepo.findCodigoValido(email);

    if (!registro) {
      return res.status(400).json({ success: false, message: 'No hay código pendiente. Solicita uno nuevo.' });
    }

    if (new Date() > new Date(registro.expiracion)) {
      await recuperacionRepo.marcarUsado(registro.id);
      return res.status(400).json({ success: false, message: 'El código ha expirado. Solicita uno nuevo.' });
    }

    const codigoValido = await bcrypt.compare(codigo, registro.codigo);
    if (!codigoValido) {
      await recuperacionRepo.incrementarIntentos(registro.id);
      return res.status(400).json({ success: false, message: 'Código incorrecto' });
    }

    const usuario = await recuperacionRepo.findUsuarioByEmail(email);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await recuperacionRepo.updatePassword(usuario.id, passwordHash);
    await recuperacionRepo.marcarUsado(registro.id);

    return res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
};
