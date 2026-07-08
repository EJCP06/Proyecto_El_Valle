const router = require('express').Router();
const auditoriaController = require('../controllers/auditoria.controller');
const authMiddleware = require('../middleware/auth');
const rolesMiddleware = require('../middleware/roles');

router.use(authMiddleware);
router.use(rolesMiddleware('admin'));

router.get('/', auditoriaController.getAll);

module.exports = router;
