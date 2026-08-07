const router = require('express').Router();
const controller = require('../controllers/preguntaSeguridad.controller');
const authMiddleware = require('../middleware/auth');

router.get('/usuario/:usuarioId', authMiddleware, controller.getAllByUser);
router.post('/verify', controller.verifyAnswers);
router.post('/reset-password', controller.resetBySecurityQuestions);

module.exports = router;
