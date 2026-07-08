const router = require('express').Router();
const catalogoController = require('../controllers/catalogo.controller');
const authMiddleware = require('../middleware/auth');
const rolesMiddleware = require('../middleware/roles');

router.use(authMiddleware);

router.get('/:catalogo', catalogoController.getAll);
router.get('/:catalogo/activos', catalogoController.getActive);
router.post('/:catalogo', rolesMiddleware('admin'), catalogoController.create);
router.patch('/:catalogo/:id', rolesMiddleware('admin'), catalogoController.update);
router.delete('/:catalogo/:id', rolesMiddleware('admin'), catalogoController.delete);

module.exports = router;
