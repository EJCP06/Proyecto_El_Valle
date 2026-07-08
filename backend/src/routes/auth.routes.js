const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
const rolesMiddleware = require('../middleware/roles');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authMiddleware, authController.profile);

// Admin users CRUD routes
router.get('/usuarios', authMiddleware, rolesMiddleware('admin'), authController.getAllUsers);
router.get('/usuarios/:id', authMiddleware, rolesMiddleware('admin'), authController.getUserById);
router.post('/usuarios', authMiddleware, rolesMiddleware('admin'), authController.register);
router.patch('/usuarios/:id', authMiddleware, rolesMiddleware('admin'), authController.updateUser);
router.delete('/usuarios/:id', authMiddleware, rolesMiddleware('admin'), authController.deactivateUser);

module.exports = router;
