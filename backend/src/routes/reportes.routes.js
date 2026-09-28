const router = require('express').Router();
const reportesController = require('../controllers/reportes.controller');
const authMiddleware = require('../middleware/auth');
const permission = require('../middleware/permisos');

router.use(authMiddleware);

router.get('/', permission('reportes', 'ver'), reportesController.generate);
router.get('/download', permission('reportes', 'ver'), reportesController.downloadPdf);
router.get('/stats', permission('reportes', 'ver'), reportesController.getStats);

module.exports = router;