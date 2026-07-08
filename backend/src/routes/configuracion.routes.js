const router = require('express').Router();
const configuracionController = require('../controllers/configuracion.controller');
const authMiddleware = require('../middleware/auth');
const rolesMiddleware = require('../middleware/roles');

router.use(authMiddleware);

router.get('/', configuracionController.getAll);
router.patch('/:clave', rolesMiddleware('admin'), configuracionController.update);

module.exports = router;
