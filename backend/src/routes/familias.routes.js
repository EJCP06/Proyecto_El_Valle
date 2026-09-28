const router = require('express').Router();

const familiasController = require('../controllers/familias.controller');
const authMiddleware = require('../middleware/auth');
const permission = require('../middleware/permisos');

router.use(authMiddleware);

// Consultar
router.get(
  '/',
  permission('familias', 'ver'),
  familiasController.getAll
);

router.get(
  '/:id',
  permission('familias', 'ver'),
  familiasController.getById
);

// Crear
router.post(
  '/',
  permission('familias', 'crear'),
  familiasController.create
);

// Editar
router.patch(
  '/:id',
  permission('familias', 'editar'),
  familiasController.update
);

// Eliminar
router.delete(
  '/:id',
  permission('familias', 'eliminar'),
  familiasController.delete
);

module.exports = router;