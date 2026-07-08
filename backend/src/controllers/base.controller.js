const { notFoundError } = require('../utils/http-error');

function parsePagination(query) {
  return {
    search: query.search,
    limit: query.limit,
    offset: query.offset,
  };
}

function createCrudController(repository, { idParam = 'id' } = {}) {
  return {
    list: async (req, res, next) => {
      try {
        const items = await repository.findAll(parsePagination(req.query));
        res.json({ ok: true, data: items });
      } catch (error) {
        next(error);
      }
    },
    getById: async (req, res, next) => {
      try {
        const item = await repository.findById(req.params[idParam]);
        if (!item) {
          throw notFoundError('Registro no encontrado');
        }

        res.json({ ok: true, data: item });
      } catch (error) {
        next(error);
      }
    },
    create: async (req, res, next) => {
      try {
        const item = await repository.create(req.body);
        res.status(201).json({ ok: true, data: item });
      } catch (error) {
        next(error);
      }
    },
    update: async (req, res, next) => {
      try {
        const item = await repository.update(req.params[idParam], req.body);
        if (!item) {
          throw notFoundError('Registro no encontrado');
        }

        res.json({ ok: true, data: item });
      } catch (error) {
        next(error);
      }
    },
    remove: async (req, res, next) => {
      try {
        const item = await repository.remove(req.params[idParam]);
        if (!item) {
          throw notFoundError('Registro no encontrado');
        }

        res.json({ ok: true, data: item });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createCrudController };
