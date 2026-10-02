const db = require('../config/db');
const configRepo = require('../repositories/configuracion.repository');
const { resolverAlcance, filtroConsejo, esAdmin } = require('../utils/alcance');
const { POR_SLUG } = require('./consultaCatalog');

const LIMITE_PAGINA = 500;

function errorConsulta(message, status = 400, code = 'INVALID_QUERY') {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function slugValido(slug) {
  const definicion = POR_SLUG[slug];
  if (!definicion) {
    throw errorConsulta(`La consulta "${slug}" no existe`, 404, 'QUERY_NOT_FOUND');
  }
  return definicion;
}

/** Normaliza un valor recibido por query string. */
function leerTexto(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  return texto === '' ? null : texto;
}

function leerEntero(valor, campo, { min = null, max = null } = {}) {
  const texto = leerTexto(valor);
  if (texto === null) return null;

  const numero = Number(texto);
  if (!Number.isInteger(numero)) {
    throw errorConsulta(`El filtro "${campo}" debe ser un número entero`);
  }
  if (min !== null && numero < min) {
    throw errorConsulta(`El filtro "${campo}" no puede ser menor que ${min}`);
  }
  if (max !== null && numero > max) {
    throw errorConsulta(`El filtro "${campo}" no puede ser mayor que ${max}`);
  }
  return numero;
}

function leerBooleano(valor) {
  const texto = leerTexto(valor);
  if (texto === null) return null;
  return ['true', '1', 'si', 'sí', 'yes'].includes(texto.toLowerCase());
}

/**
 * Convierte los parámetros del filtro en un valor apto para PostgreSQL,
 * normalizando los comodines de búsqueda.
 */
function prepararValor(defFiltro, valor) {
  switch (defFiltro.tipo) {
    case 'entero':
      return leerEntero(valor, defFiltro.label, { min: 0, max: 150 });
    case 'booleano':
      return leerBooleano(valor);
    case 'texto':
    default: {
      const texto = leerTexto(valor);
      if (texto === null) return null;
      if (defFiltro.key === 'busqueda') {
        return `%${texto.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
      }
      return texto;
    }
  }
}

/**
 * Construye el `WHERE` de una consulta a partir de los filtros declarados.
 * Devuelve el SQL ya con los placeholders numerados y los params alineados.
 */
function construirWhere(definicion, filtros, alcance) {
  const params = [];
  const condiciones = [];

  for (const defFiltro of definicion.filtros) {
    const valor = prepararValor(defFiltro, filtros?.[defFiltro.key]);
    if (valor === null) continue;

    // Cada aparición de $__ recibe su propio placeholder con el mismo valor.
    const expr = defFiltro.expr.replace(/\$__/g, () => {
      const indice = params.length + 1;
      params.push(valor);
      return `$${indice}`;
    });

    condiciones.push(`(${expr})`);
  }

  const plantilla = definicion.scopeExpr || 'base.consejid = ANY(%s::int[])';
  const alcanceSql = filtroConsejo(params, alcance, plantilla);
  if (alcanceSql) {
    condiciones.push(`(${alcanceSql})`);
  }

  return {
    params,
    whereSql: condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : ''
  };
}

/** Indica si el administrador habilitó exponer cédulas y teléfonos. */
async function datosSensiblesPermitidos() {
  try {
    const config = await configRepo.findByKey('MOSTRAR_DATOS_SENSIBLES_EN_REPORTES');
    const valor = config?.valor ?? 'true';
    return String(valor).toLowerCase() === 'true';
  } catch (error) {
    return true;
  }
}

/** Resuelve el listado de columnas pedido, descartando lo desconocido. */
function resolverColumnas(definicion, pedidas, permitirSensibles) {
  const disponibles = permitirSensibles
    ? definicion.columnas
    : definicion.columnas.filter((c) => !c.sensible);

  const validas = pedidas
    .map((key) => disponibles.find((c) => c.key === key))
    .filter(Boolean);

  if (validas.length > 0) return validas;

  return definicion.columnasPorDefecto
    .map((key) => definicion.columnas.find((c) => c.key === key))
    .filter(Boolean);
}

function envolver(definicion) {
  return `WITH base AS (${definicion.baseSql})`;
}

/**
 * Inserta el WHERE dentro de una consulta agregada del catálogo. Los agregados
 * no pueden llevar el WHERE al final (tiene que ir antes del GROUP BY), así que
 * el catálogo deja el marcador `%WHERE%` en su lugar.
 */
function agregarWhere(agregadoSql, whereSql) {
  return agregadoSql.replace('%WHERE%', whereSql || '');
}

function seleccionar(columnas) {
  if (columnas.length === 0) return '*';
  return columnas.map((c) => `${c.sql} AS "${c.key}"`).join(', ');
}

/** Catálogo público que consume el frontend para construir la pantalla. */
async function listarConsultas(usuario) {
  const permitirSensibles = await datosSensiblesPermitidos();

  // El filtro de consejo es universal: lo aplica el motor a cualquier consulta
  // a través del alcance, así que se anuncia siempre como el primero.
  const filtroConsejo = {
    key: 'consejoId',
    label: 'Consejo Comunal',
    tipo: 'entero',
    universal: true
  };

  return Object.values(POR_SLUG).map((definicion) => ({
    slug: definicion.slug,
    label: definicion.label,
    descripcion: definicion.descripcion,
    tipo: definicion.tipo,
    franjas: definicion.franjas || null,
    filtros: [
      filtroConsejo,
      ...definicion.filtros.map((f) => ({
        key: f.key,
        label: f.label,
        tipo: f.tipo,
        catalogo: f.catalogo || null,
        opciones: f.opciones || null
      }))
    ],
    columnas: definicion.columnas
      .filter((c) => permitirSensibles || !c.sensible)
      .map((c) => ({ key: c.key, label: c.label, sensible: Boolean(c.sensible) })),
    columnasPorDefecto: definicion.columnasPorDefecto.filter(
      (key) => permitirSensibles || !(definicion.columnas.find((c) => c.key === key)?.sensible)
    )
  }));
}

/**
 * Ejecuta una consulta.
 *
 * @param {string} slug
 * @param {object} opciones
 * @param {object} opciones.usuario
 * @param {object} [opciones.filtros]     Filtros declarados en el catálogo.
 * @param {string[]} [opciones.columnas]  Claves de columna a mostrar.
 * @param {number}  [opciones.page]
 * @param {number}  [opciones.limit]
 * @param {number}  [opciones.consultasMax] Solo para export: filas a traer.
 */
async function ejecutar(slug, opciones) {
  const definicion = slugValido(slug);
  const usuario = opciones.usuario;
  const admin = esAdmin(usuario?.rol);

  const alcance = await resolverAlcance(usuario, opciones.filtros?.consejoId);
  const { params, whereSql } = construirWhere(definicion, opciones.filtros, alcance);

  const permitirSensibles = await datosSensiblesPermitidos();
  const columnas = resolverColumnas(
    definicion,
    Array.isArray(opciones.columnas) ? opciones.columnas : [],
    permitirSensibles
  );

  const envoltura = envolver(definicion);

  // --- Totales -------------------------------------------------------------
  // Llevan los mismos filtros y el mismo alcance que el detalle: sin esto, los
  // totales mostrarían la población completa y contradirían la tabla.
  let totales = null;
  if (definicion.totalesSql) {
    const res = await db.query(`${envoltura} ${agregarWhere(definicion.totalesSql, whereSql)}`, params);
    totales = res.rows[0] || null;
  }

  // --- Detalle paginado ----------------------------------------------------
  let filas = [];
  if (definicion.columnas.length > 0) {
    const limit = Math.min(
      Math.max(leerEntero(opciones.limit, 'limit', { min: 1, max: LIMITE_PAGINA }) || 50, 1),
      LIMITE_PAGINA
    );
    const page = Math.max(leerEntero(opciones.page, 'page', { min: 1 }) || 1, 1);
    const offset = (page - 1) * limit;

    const detalle = await db.query(
      `${envoltura} SELECT ${seleccionar(columnas)} FROM base ${whereSql}
       ORDER BY ${definicion.ordenPorDefecto}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    filas = detalle.rows;
    opciones.paginacion = { page, limit, offset };
  }

  // --- Resumen agregado ----------------------------------------------------
  let resumen = [];
  if (definicion.resumenSql) {
    const res = await db.query(`${envoltura} ${agregarWhere(definicion.resumenSql, whereSql)}`, params);
    resumen = res.rows;
  }

  return {
    slug: definicion.slug,
    label: definicion.label,
    descripcion: definicion.descripcion,
    tipo: definicion.tipo,
    franjas: definicion.franjas || null,
    filtros: opciones.filtros || {},
    alcance: {
      esAdmin: admin,
      consejoId: alcance.consejoId,
      consejosVisibles: alcance.consejoIds
    },
    columnas: columnas.map((c) => ({ key: c.key, label: c.label })),
    filas,
    resumen,
    totales,
    paginacion: opciones.paginacion || null
  };
}

/**
 * Ejecuta una consulta traeciendo todas las filas para exportar.
 * Reutiliza la misma construcción de filtros y el mismo control de alcance.
 */
async function ejecutarParaExportar(slug, opciones) {
  const definicion = slugValido(slug);
  const alcance = await resolverAlcance(opciones.usuario, opciones.filtros?.consejoId);
  const { params, whereSql } = construirWhere(definicion, opciones.filtros, alcance);

  const permitirSensibles = await datosSensiblesPermitidos();
  const columnas = resolverColumnas(
    definicion,
    Array.isArray(opciones.columnas) ? opciones.columnas : [],
    permitirSensibles
  );

  const envoltura = envolver(definicion);

  let filas = [];
  if (definicion.columnas.length > 0) {
    const res = await db.query(
      `${envoltura} SELECT ${seleccionar(columnas)} FROM base ${whereSql}
       ORDER BY ${definicion.ordenPorDefecto}`,
      params
    );
    filas = res.rows;
  }

  let resumen = [];
  if (definicion.resumenSql) {
    const res = await db.query(`${envoltura} ${agregarWhere(definicion.resumenSql, whereSql)}`, params);
    resumen = res.rows;
  }

  return {
    slug: definicion.slug,
    label: definicion.label,
    descripcion: definicion.descripcion,
    columnas: columnas.map((c) => ({ key: c.key, label: c.label })),
    filas,
    resumen,
    criterios: describirCriterios(definicion, opciones.filtros, alcance)
  };
}

/** Texto legible de los criterios aplicados, para la cabecera del archivo. */
function describirCriterios(definicion, filtros, alcance) {
  const partes = [];

  for (const defFiltro of definicion.filtros) {
    const valor = filtros?.[defFiltro.key];
    if (valor === undefined || valor === null || valor === '') continue;

    if (defFiltro.key === 'busqueda') {
      partes.push(`Búsqueda: "${valor}"`);
      continue;
    }
    if (defFiltro.key === 'soloJefeFamilia') {
      partes.push('Solo jefes de familia');
      continue;
    }
    if (defFiltro.key === 'edadMin') {
      partes.push(`Desde ${valor} años`);
      continue;
    }
    if (defFiltro.key === 'edadMax') {
      partes.push(`Hasta ${valor} años`);
      continue;
    }
    partes.push(`${defFiltro.label}: ${valor}`);
  }

  if (alcance.consejoId !== null) {
    partes.push('Consejo: un único consejo seleccionado');
  }

  return partes;
}

module.exports = {
  listarConsultas,
  ejecutar,
  ejecutarParaExportar,
  slugValido,
  errorConsulta
};
