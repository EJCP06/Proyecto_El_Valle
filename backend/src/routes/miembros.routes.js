const router = require('express').Router();
const miembrosController = require('../controllers/miembros.controller');
const authMiddleware = require('../middleware/auth');
const rolesMiddleware = require('../middleware/roles');

router.use(authMiddleware);

router.get('/:id', miembrosController.getById);
router.post('/', rolesMiddleware('admin', 'editor'), miembrosController.create);
router.patch('/:id', rolesMiddleware('admin', 'editor'), miembrosController.update);
router.delete('/:id', rolesMiddleware('admin'), miembrosController.delete);

module.exports = router;
