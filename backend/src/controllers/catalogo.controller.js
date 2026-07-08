const repos = require('../repositories/catalogo.repository');
const { registrarAuditoria } = require('../utils/audit');

const map = {
  parentescos: repos.parentescos,
  'estados-civiles': repos.estadosCiviles,
  'niveles-educativos': repos.nivelesEducativos,
  ocupaciones: repos.ocupaciones,
  'tipos-vivienda': repos.tiposVivienda,
  'tipos-discapacidad': repos.tiposDiscapacidad,
};

function getRepo(req) {
  const repo = map[req.params.catalogo];
  if (!repo) return null;
  return repo;
}

exports.getAll = async (req, res, next) => {
  try {
    const repo = getRepo(req);
    if (!repo) return res.status(404).json({ success: false, message: 'Catálogo no encontrado' });
    const data = await repo.findAll();
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getActive = async (req, res, next) => {
  try {
    const repo = getRepo(req);
    if (!repo) return res.status(404).json({ success: false, message: 'Catálogo no encontrado' });
    const data = await repo.findActive();
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const repo = getRepo(req);
    if (!repo) return res.status(404).json({ success: false, message: 'Catálogo no encontrado' });
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    const data = await repo.create(nombre);
    await registrarAuditoria(req, 'CREATE', `Catalogo_${req.params.catalogo}`, data.id, { nombre });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ success: false, message: 'El valor ya existe en este catálogo' });
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const repo = getRepo(req);
    if (!repo) return res.status(404).json({ success: false, message: 'Catálogo no encontrado' });
    const id = parseInt(req.params.id);
    const { nombre, activo } = req.body;
    const data = await repo.update(id, { nombre, activo });
    if (!data) return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    await registrarAuditoria(req, 'UPDATE', `Catalogo_${req.params.catalogo}`, id, { nombre, activo });
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const repo = getRepo(req);
    if (!repo) return res.status(404).json({ success: false, message: 'Catálogo no encontrado' });
    const id = parseInt(req.params.id);
    await repo.delete(id);
    await registrarAuditoria(req, 'DELETE', `Catalogo_${req.params.catalogo}`, id);
    return res.json({ success: true, message: 'Registro eliminado' });
  } catch (error) {
    next(error);
  }
};
