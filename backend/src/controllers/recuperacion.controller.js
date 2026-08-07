const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { enviarCorreoOTP } = require('../config/email');
const { enviarMensaje } = require('../config/telegram');
const recuperacionRepo = require('../repositories/recuperacion.repository');

/**
 * Inicia el proceso de recuperación de contraseña. Siempre responde
 * con el mismo mensaje genérico para evitar enumeración de cuentas.
 * Soporta canal: 'email' (default) o 'telegram'.
 */
exports.solicitar = async (req, res, next) => {
  try {
    const { email, canal = 'email' } = req.body;
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

    // Validar canal telegram
    if (canal === 'telegram') {
      if (!usuario.telegram_chat_id) {
        return res.status(400).json({ success: false, message: 'El usuario no tiene Telegram vinculado. Ve a Usuarios → Vincular Telegram.' });
      }
    }

    const codigo = crypto.randomInt(100000, 999999).toString();
    const codigoHash = await bcrypt.hash(codigo, 10);

    await recuperacionRepo.invalidarCodigosPendientes(usuario.id);
    await recuperacionRepo.insertarCodigo(usuario.id, codigoHash, canal);

    let enviado = false;
    if (canal === 'telegram') {
      const resultado = await enviarMensaje(usuario.telegram_chat_id,
        `🔐 <b>Código de recuperación</b>\n\nTu código es: <b>${codigo}</b>\n\nExpira en 3 minutos. No lo compartas.`
      );
      enviado = resultado.ok;
    } else {
      try {
        await enviarCorreoOTP(usuario.email, codigo);
        enviado = true;
      } catch (emailError) {
        enviado = false;
      }
    }

    if (!enviado) {
      return res.status(500).json({ success: false, message: `Error al enviar el código por ${canal}.` });
    }

    return res.json({
      success: true,
      message: `Código enviado por ${canal}`,
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

/**
 * Vincula la cuenta de Telegram del usuario.
 * Recibe { email, codigo } donde codigo es el que el bot envió al usuario al hacer /start <email>.
 * Si el código coincide con el pendiente, guarda el chat_id en el usuario.
 */
exports.vincularTelegram = async (req, res, next) => {
  try {
    const { email, codigo } = req.body;
    if (!email || !codigo) {
      return res.status(400).json({ success: false, message: 'Correo y código son requeridos' });
    }

    const telegramBot = require('../config/telegramBot');
    const pendiente = telegramBot.pendingLinks?.get(email.toLowerCase().trim());

    if (!pendiente) {
      return res.status(400).json({ success: false, message: 'No hay vinculación pendiente para este correo. Envía /start tu@email.com al bot primero.' });
    }

    if (pendiente.expires < Date.now()) {
      telegramBot.pendingLinks.delete(email.toLowerCase().trim());
      return res.status(400).json({ success: false, message: 'El código ha expirado. Vuelve a enviar /start al bot.' });
    }

    if (pendiente.codigo !== codigo.trim()) {
      return res.status(400).json({ success: false, message: 'Código incorrecto' });
    }

    // Guardar chat_id en el usuario
    const pool = telegramBot.pool;
    await pool.query(
      'UPDATE usuarios SET telegram_chat_id = $1 WHERE LOWER(email) = LOWER($2)',
      [pendiente.chatId, email]
    );

    // Limpiar pendiente
    telegramBot.pendingLinks.delete(email.toLowerCase().trim());

    return res.json({ success: true, message: 'Telegram vinculado correctamente' });
  } catch (error) {
    next(error);
  }
};
