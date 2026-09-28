const router = require('express').Router();

const formulariosController = require('../controllers/formularios.controller');
const authMiddleware = require('../middleware/auth');
const permission = require('../middleware/permisos');

router.use(authMiddleware);

// Consultas
router.get('/', permission('formularios', 'ver'), formulariosController.getAll);
router.get('/asignaciones', permission('formularios', 'ver'), formulariosController.getAsignaciones);
router.get('/asignacion/:id', permission('formularios', 'ver'), formulariosController.getAsignacionById);
router.get('/familia/:familiaId', permission('formularios', 'ver'), formulariosController.getByFamilia);
router.get('/:id', permission('formularios', 'ver'), formulariosController.getById);

// Administración de formularios
router.post('/', permission('formularios', 'crear'), formulariosController.create);
router.patch('/:id', permission('formularios', 'editar'), formulariosController.update);
router.delete('/:id', permission('formularios', 'eliminar'), formulariosController.delete);

// Asignación de formularios
router.post('/asignar', permission('formularios', 'crear'), formulariosController.asignar);

// Responder se considera una modificación de la información,
// por eso utiliza la acción "editar".
router.post('/responder/:id', permission('formularios', 'editar'), formulariosController.responder);

module.exports = router;