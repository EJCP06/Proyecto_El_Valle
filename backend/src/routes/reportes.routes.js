const router = require('express').Router();
const reportesController = require('../controllers/reportes.controller');
const authMiddleware = require('../middleware/auth');
const permission = require('../middleware/permisos');

router.use(authMiddleware);

// --- Catálogo de consultas demográficas ---
router.get(
  '/consultas',
  permission('reportes', 'ver'),
  reportesController.listarConsultas
);

router.get(
  '/consultas/:slug/exportar',
  permission('reportes', 'exportar'),
  reportesController.exportar
);

router.get(
  '/consultas/:slug',
  permission('reportes', 'ver'),
  reportesController.consultar
);

// --- Indicadores del panel ---
router.get('/stats', permission('reportes', 'ver'), reportesController.getStats);

// --- Endpoint legado, delegado en el catálogo ---
router.get('/', permission('reportes', 'ver'), reportesController.generate);

module.exports = router;
