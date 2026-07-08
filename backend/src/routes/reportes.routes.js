const router = require('express').Router();
const reportesController = require('../controllers/reportes.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', reportesController.generate);
router.get('/download', reportesController.downloadPdf);
router.get('/stats', reportesController.getStats);

module.exports = router;
