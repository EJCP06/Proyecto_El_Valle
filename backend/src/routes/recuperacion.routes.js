const router = require('express').Router();
const recuperacionController = require('../controllers/recuperacion.controller');
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos de verificación. Intenta de nuevo en 15 minutos.' },
});

router.post('/solicitar', recuperacionController.solicitar);
router.post('/verificar', otpLimiter, recuperacionController.verificar);
router.post('/restablecer', otpLimiter, recuperacionController.restablecer);
router.post('/vincular-telegram', otpLimiter, recuperacionController.vincularTelegram);

module.exports = router;
