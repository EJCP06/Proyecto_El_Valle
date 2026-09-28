const router = require('express').Router();

const consejosController = require('../controllers/consejos.controller');
const authMiddleware = require('../middleware/auth');
const permission = require('../middleware/permisos');

router.use(authMiddleware);

router.get(
  '/',
  permission('consejos', 'ver'),
  consejosController.getAll
);

router.get(
  '/:id',
  permission('consejos', 'ver'),
  consejosController.getById
);

router.post(
  '/',
  permission('consejos', 'crear'),
  consejosController.create
);

router.patch(
  '/:id',
  permission('consejos', 'editar'),
  consejosController.update
);

router.delete(
  '/:id',
  permission('consejos', 'eliminar'),
  consejosController.delete
);

module.exports = router;