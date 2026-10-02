const consultaService = require('../services/consulta.service');
const excelExport = require('../services/excelExport.service');
const pdfExport = require('../services/pdfExport.service');
const configRepo = require('../repositories/configuracion.repository');
const { registrarAuditoria } = require('../services/auditoria.service');

/**
 * Convierte los query params en el objeto `filtros` que espera el catálogo.
 * `columnas` llega como CSV: ?columnas=nombre,edad,consejo
 */
function leerParametros(req) {
  const q = req.query || {};

  const columnas = leerTexto(q.columnas)
    ? String(q.columnas).split(',').map((c) => c.trim()).filter(Boolean)
    : [];

  return {
    filtros: {
      consejoId: q.consejoId ?? null,
      edadMin: q.edadMin ?? null,
      edadMax: q.edadMax ?? null,
      sexo: q.sexo ?? null,
      parentesco: q.parentesco ?? null,
      estadoCivil: q.estadoCivil ?? null,
      nivelEducativo: q.nivelEducativo ?? null,
      ocupacion: q.ocupacion ?? null,
      busqueda: q.busqueda ?? null,
      soloJefeFamilia: q.soloJefeFamilia ?? null,
      conRepresentante: q.conRepresentante ?? null,
      activo: q.activo ?? null
    },
    columnas,
    page: q.page,
    limit: q.limit
  };
}

function leerTexto(valor) {
  if (valor === undefined || valor === null) return '';
  return String(valor).trim();
}

async function nombreSistema() {
  try {
    const config = await configRepo.findByKey('NOMBRE_SISTEMA');
    return config?.valor || 'El Valle — Gestión Comunal';
  } catch (error) {
    return 'El Valle — Gestión Comunal';
  }
}

/** GET /api/reportes/consultas */
exports.listarConsultas = async (req, res, next) => {
  try {
    const data = await consultaService.listarConsultas(req.user);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/** GET /api/reportes/consultas/:slug */
exports.consultar = async (req, res, next) => {
  try {
    const { filtros, columnas, page, limit } = leerParametros(req);
    const data = await consultaService.ejecutar(req.params.slug, {
      usuario: req.user,
      filtros,
      columnas,
      page,
      limit
    });
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/** GET /api/reportes/consultas/:slug/exportar?formato=xlsx|pdf */
exports.exportar = async (req, res, next) => {
  try {
    const formato = (leerTexto(req.query.formato) || 'xlsx').toLowerCase();

    if (!['xlsx', 'pdf'].includes(formato)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_FORMAT',
        message: 'Formato no soportado. Usa "xlsx" o "pdf".'
      });
    }

    const { filtros, columnas } = leerParametros(req);

    const resultado = await consultaService.ejecutarParaExportar(req.params.slug, {
      usuario: req.user,
      filtros,
      columnas
    });

    const contexto = {
      nombreSistema: await nombreSistema(),
      usuario: req.user?.nombre || req.user?.email
    };

    const buffer = formato === 'pdf'
      ? await pdfExport.generarPdf(resultado, contexto)
      : await excelExport.generarExcel(resultado, contexto);

    const nombre = formato === 'pdf'
      ? pdfExport.nombreArchivo(resultado.slug, 'pdf')
      : excelExport.nombreArchivo(resultado.slug, 'xlsx');

    // Trazabilidad de la extracción de datos: queda registro de quién
    // descargó qué información y con qué criterios.
    await registrarAuditoria({
      accion: 'EXPORTAR REPORTE',
      entidad: 'CONSULTA',
      entidadId: null,
      detalle: {
        consulta: resultado.slug,
        formato,
        filas: resultado.filas.length,
        criterios: resultado.criterios
      },
      req
    });

    res.setHeader('Content-Type', formato === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reportes
 * Endpoint legado. Se mantiene por compatibilidad y ahora delega en el
 * catálogo de consultas: `?tipo=personas` equivale a
 * `/reportes/consultas/personas`.
 */
exports.generate = async (req, res, next) => {
  try {
    const tipo = leerTexto(req.query.tipo) || 'personas';
    const { filtros, columnas, page, limit } = leerParametros(req);

    const data = await consultaService.ejecutar(tipo, {
      usuario: req.user,
      filtros,
      columnas,
      page,
      limit
    });

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/** GET /api/reportes/stats */
exports.getStats = async (req, res, next) => {
  try {
    const reporteRepo = require('../repositories/reporte.repository');
    const data = await reporteRepo.getDashboardStats(req.user.id, req.user.rol);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
