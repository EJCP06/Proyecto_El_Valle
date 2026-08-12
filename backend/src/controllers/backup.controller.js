const backupService = require('../services/backup.service');
const { registrarAuditoria } = require('../services/auditoria.service');

exports.listar = async (req, res, next) => {
  try {
    return res.json({ success: true, data: backupService.listarBackups() });
  } catch (error) {
    next(error);
  }
};

exports.stats = async (req, res, next) => {
  try {
    return res.json({ success: true, data: backupService.estadisticas() });
  } catch (error) {
    next(error);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { tipo = 'completo', tablas = [] } = req.body ?? {};
    const data = await backupService.crearBackup({ tipo, tablas });

    await registrarAuditoria({
      accion: 'CREAR BACKUP',
      entidad: 'BACKUP',
      detalle: { archivo: data.archivo, tipo: data.tipo },
      req,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.verificar = async (req, res, next) => {
  try {
    const { archivo } = req.params;
    const data = await backupService.verificarBackup(archivo);

    await registrarAuditoria({
      accion: 'VERIFICAR BACKUP',
      entidad: 'BACKUP',
      entidadId: data.archivo,
      detalle: { valido: data.valido },
      req,
    });

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const { archivo } = req.params;
    const data = backupService.eliminarBackup(archivo);

    await registrarAuditoria({
      accion: 'ELIMINAR BACKUP',
      entidad: 'BACKUP',
      entidadId: data.archivo,
      detalle: { archivo: data.archivo },
      req,
    });

    return res.json({ success: true, message: 'Respaldo eliminado', data });
  } catch (error) {
    next(error);
  }
};

exports.descargar = async (req, res, next) => {
  try {
    const { archivo } = req.params;
    backupService.descargarBackup(res, archivo);
  } catch (error) {
    next(error);
  }
};

exports.restaurar = async (req, res, next) => {
  try {
    const { archivo, limpiar = false, recrear = false, tablas = [], confirmar = false } = req.body ?? {};
    if (!confirmar) {
      return res.status(400).json({
        success: false,
        message: 'Debe confirmar la restauración (confirmar: true) porque sobrescribirá la base de datos.',
      });
    }

    const data = await backupService.restaurarBackup({ archivo, limpiar, recrear, tablas });

    await registrarAuditoria({
      accion: 'RESTAURAR BACKUP',
      entidad: 'BACKUP',
      entidadId: data.archivo,
      detalle: { archivo: data.archivo, limpiar, recrear, tablas },
      req,
    });

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.restaurarUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Debe adjuntar un archivo de respaldo (.dump o .sql).' });
    }
    const { limpiar = false, recrear = false, tablas = [], confirmar = false } = req.body ?? {};
    if (!confirmar) {
      return res.status(400).json({
        success: false,
        message: 'Debe confirmar la restauración (confirmar: true) porque sobrescribirá la base de datos.',
      });
    }

    const data = await backupService.restaurarArchivoSubido({
      rutaArchivo: req.file.path,
      archivoOriginal: req.file.originalname,
      limpiar,
      recrear,
      tablas,
    });

    await registrarAuditoria({
      accion: 'RESTAURAR BACKUP',
      entidad: 'BACKUP',
      entidadId: data.archivo,
      detalle: { archivo: data.archivo, subido: true, limpiar, recrear, tablas },
      req,
    });

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
