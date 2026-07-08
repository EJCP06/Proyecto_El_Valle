const router = require('express').Router();
const consejosController = require('../controllers/consejos.controller');
const authMiddleware = require('../middleware/auth');
const rolesMiddleware = require('../middleware/roles');

router.use(authMiddleware);

router.get('/', consejosController.getAll);
router.get('/:id', consejosController.getById);
router.post('/', rolesMiddleware('admin', 'editor'), consejosController.create);
router.patch('/:id', rolesMiddleware('admin', 'editor'), consejosController.update);
router.delete('/:id', rolesMiddleware('admin'), consejosController.delete);

module.exports = router;
