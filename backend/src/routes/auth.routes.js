/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints de autenticación y gestión de usuarios
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@elvalle.org
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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
