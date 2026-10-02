const accesoConsejoRepo = require('../repositories/accesoConsejo.repository');

/**
 * Utilidades de alcance por consejo Comunal.
 *
 * Regla central del sistema:
 *   - El administrador tiene visibilidad de todos los consejos.
 *   - El usuario (vocero) tiene visibilidad únicamente de los consejos
 *     que le fueron asignados en `usuarios_consejos`.
 *
 * Los repositorios deben usar SIEMPRE estos helpers para filtrar por
 * `familias.consejo_id`, de lo contrario un vocero podría consultar
 * datos de comunidades que no administra.
 */

const SENTINEL_SIN_ACCESO = [-1];

function esAdmin(rol) {
  return String(rol || '').toLowerCase() === 'admin';
}

/**
 * Resuelve el alcance de un usuario sobre los consejos comunales.
 *
 * @param {{id:number, rol:string}} usuario
 * @param {number|string|null} consejoIdSolicitado Filtro opcional pedido por el cliente.
 * @returns {Promise<{esAdmin:boolean, consejoIds:number[]|null, consejoId:number|null}>}
 *          `consejoIds === null` significa "sin restricción de consejo" (admin).
 */
async function resolverAlcance(usuario, consejoIdSolicitado = null) {
  const admin = esAdmin(usuario?.rol);

  let consejoId = null;
  if (consejoIdSolicitado !== null && consejoIdSolicitado !== undefined && consejoIdSolicitado !== '') {
    const valor = Number(consejoIdSolicitado);
    if (!Number.isInteger(valor) || valor <= 0) {
      const error = new Error('El consejo solicitado no es válido');
      error.status = 400;
      error.code = 'INVALID_COUNCIL_ID';
      throw error;
    }
    consejoId = valor;
  }

  if (admin) {
    return { esAdmin: true, consejoIds: null, consejoId };
  }

  const asignados = await accesoConsejoRepo.findConsejoIdsByUsuario(usuario?.id);

  if (consejoId !== null && !asignados.includes(consejoId)) {
    const error = new Error('No tienes acceso al consejo solicitado');
    error.status = 403;
    error.code = 'COUNCIL_ACCESS_DENIED';
    throw error;
  }

  if (consejoId !== null) {
    return { esAdmin: false, consejoIds: [consejoId], consejoId };
  }

  return {
    esAdmin: false,
    consejoIds: asignados.length > 0 ? asignados : SENTINEL_SIN_ACCESO,
    consejoId: null
  };
}

/**
 * Agrega al array `params` los ids de consejos permitidos y devuelve el
 * fragmento SQL que restringe la consulta a ese alcance.
 *
 * @param {Array} params Se modifica in situ (los placeholders se calculan
 *                       a partir de su longitud actual).
 * @param {{consejoIds:number[]|null}} alcance
 * @param {string} plantilla Expresión con un marcador `%s` donde se coloca
 *                         `ANY($n::int[])`. Por defecto
 *                         `f.consejo_id = ANY(%s::int[])`.
 * @returns {string|null} Fragmento SQL, o `null` si no hay restricción (admin).
 */
function filtroConsejo(params, alcance, plantilla = 'f.consejo_id = ANY(%s::int[])') {
  if (!alcance || alcance.consejoIds === null) return null;

  const indice = params.length + 1;
  params.push(alcance.consejoIds);

  return plantilla.replace('%s', `$${indice}`);
}

module.exports = {
  esAdmin,
  resolverAlcance,
  filtroConsejo,
  SENTINEL_SIN_ACCESO
};
