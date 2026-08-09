const router = require('express').Router();
const configuracionController = require('../controllers/configuracion.controller');
const authMiddleware = require('../middleware/auth');
const rolesMiddleware = require('../middleware/roles');

router.use(authMiddleware);

router.get('/', configuracionController.getAll);
router.patch('/:clave', rolesMiddleware('admin'), configuracionController.update);
router.get('/ip-intentos', rolesMiddleware('admin'), configuracionController.getIpIntentos);
router.delete('/ip-intentos/:ip', rolesMiddleware('admin'), configuracionController.desbloquearIp);

module.exports = router;
