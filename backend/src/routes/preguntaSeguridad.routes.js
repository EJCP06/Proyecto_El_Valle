const router = require('express').Router();
const controller = require('../controllers/preguntaSeguridad.controller');
const authMiddleware = require('../middleware/auth');

router.get('/usuario/:usuarioId', authMiddleware, controller.getAllByUser);
router.post('/usuario/:usuarioId', authMiddleware, controller.create);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.remove);
router.post('/verify', controller.verifyAnswers);
router.post('/reset-password', controller.resetBySecurityQuestions);

module.exports = router;
