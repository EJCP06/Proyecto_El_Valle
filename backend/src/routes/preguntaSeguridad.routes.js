const router = require('express').Router();
const controller = require('../controllers/preguntaSeguridad.controller');
const authMiddleware = require('../middleware/auth');
const validarPassword = require('../middleware/validarPassword');

router.get('/mias', authMiddleware, controller.getMias);
router.put('/mias', authMiddleware, controller.replaceMine);
router.get('/usuario/:usuarioId', authMiddleware, controller.getAllByUser);
router.post('/verify', controller.verifyAnswers);
router.post('/reset-password', validarPassword, controller.resetBySecurityQuestions);

module.exports = router;
