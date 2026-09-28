const router = require('express').Router();

const miembrosController = require('../controllers/miembros.controller');
const authMiddleware = require('../middleware/auth');
const permission = require('../middleware/permisos');

router.use(authMiddleware);

router.get(
  '/',
  permission('miembros', 'ver'),
  miembrosController.getAll
);

router.get(
  '/:id',
  permission('miembros', 'ver'),
  miembrosController.getById
);

router.post(
  '/',
  permission('miembros', 'crear'),
  miembrosController.create
);

router.patch(
  '/:id',
  permission('miembros', 'editar'),
  miembrosController.update
);

router.delete(
  '/:id',
  permission('miembros', 'eliminar'),
  miembrosController.delete
);

module.exports = router;