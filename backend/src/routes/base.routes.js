const express = require('express');

const { authenticate } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');

function createCrudRoutes(controller, { idParam = 'id', writeRoles = ['ADMIN', 'VOCERO'] } = {}) {
  const router = express.Router();

  router.get('/', authenticate, controller.list);
  router.get(`/:${idParam}`, authenticate, controller.getById);
  router.post('/', authenticate, allowRoles(...writeRoles), controller.create);
  router.put(`/:${idParam}`, authenticate, allowRoles(...writeRoles), controller.update);
  router.delete(`/:${idParam}`, authenticate, allowRoles(...writeRoles), controller.remove);

  return router;
}

module.exports = { createCrudRoutes };
