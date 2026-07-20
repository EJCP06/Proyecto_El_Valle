const router = require('express').Router();
const authRoutes = require('./auth.routes');
const consejosRoutes = require('./consejos.routes');
const familiasRoutes = require('./familias.routes');
const miembrosRoutes = require('./miembros.routes');
const formulariosRoutes = require('./formularios.routes');
const reportesRoutes = require('./reportes.routes');
const configuracionRoutes = require('./configuracion.routes');
const catalogoRoutes = require('./catalogo.routes');

router.use('/auth', authRoutes);
router.use('/consejos', consejosRoutes);
router.use('/familias', familiasRoutes);
router.use('/miembros', miembrosRoutes);
router.use('/formularios', formulariosRoutes);
router.use('/reportes', reportesRoutes);
router.use('/configuracion', configuracionRoutes);
router.use('/catalogos', catalogoRoutes);

module.exports = router;
