const router = require('express').Router();
const familiasController = require('../controllers/familias.controller');
const authMiddleware = require('../middleware/auth');
const rolesMiddleware = require('../middleware/roles');

router.use(authMiddleware);

router.get('/', familiasController.getAll);
router.get('/:id', familiasController.getById);
router.post('/', rolesMiddleware('admin', 'editor'), familiasController.create);
router.patch('/:id', rolesMiddleware('admin', 'editor'), familiasController.update);
router.delete('/:id', rolesMiddleware('admin'), familiasController.delete);

module.exports = router;
