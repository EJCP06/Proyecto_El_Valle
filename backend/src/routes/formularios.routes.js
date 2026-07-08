const router = require('express').Router();
const formulariosController = require('../controllers/formularios.controller');
const authMiddleware = require('../middleware/auth');
const rolesMiddleware = require('../middleware/roles');

router.use(authMiddleware);

router.get('/', formulariosController.getAll);
router.get('/asignaciones', formulariosController.getAsignaciones);
router.get('/:id', formulariosController.getById);
router.post('/', rolesMiddleware('admin', 'editor'), formulariosController.create);
router.patch('/:id', rolesMiddleware('admin', 'editor'), formulariosController.update);
router.delete('/:id', rolesMiddleware('admin'), formulariosController.delete);
router.post('/asignar', rolesMiddleware('admin', 'editor'), formulariosController.asignar);
router.post('/responder/:id', formulariosController.responder);

module.exports = router;
