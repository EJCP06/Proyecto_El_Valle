const router = require('express').Router();
const sessionController = require('../controllers/session.controller');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, sessionController.listSessions);
router.delete('/:id', authMiddleware, sessionController.revokeSession);
router.delete('/', authMiddleware, sessionController.revokeAllOtherSessions);

module.exports = router;