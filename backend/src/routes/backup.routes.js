const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const os = require('os');
const backupController = require('../controllers/backup.controller');
const authMiddleware = require('../middleware/auth');
const rolesMiddleware = require('../middleware/roles');
const { sanitizarArchivo } = require('../services/backup.service');

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_req, file, cb) => {
      try {
        const nombre = sanitizarArchivo(file.originalname);
        cb(null, `backup_${Date.now()}_${nombre}`);
      } catch (error) {
        cb(error);
      }
    },
  }),
  limits: { fileSize: 256 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    try {
      sanitizarArchivo(file.originalname);
      cb(null, true);
    } catch (error) {
      cb(error);
    }
  },
});

router.use(authMiddleware);

router.get('/', rolesMiddleware('admin'), backupController.listar);
router.get('/stats', rolesMiddleware('admin'), backupController.stats);
router.post('/', rolesMiddleware('admin'), backupController.crear);
router.post('/restore', rolesMiddleware('admin'), backupController.restaurar);
router.post('/restore/upload', rolesMiddleware('admin'), upload.single('file'), backupController.restaurarUpload);
router.get('/:archivo/download', rolesMiddleware('admin'), backupController.descargar);
router.get('/:archivo/verificar', rolesMiddleware('admin'), backupController.verificar);
router.delete('/:archivo', rolesMiddleware('admin'), backupController.eliminar);

module.exports = router;
