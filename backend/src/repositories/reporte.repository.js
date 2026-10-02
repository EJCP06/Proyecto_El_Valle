const db = require('../config/db');

/**
 * Indicadores del panel principal.
 *
 * El detalle de la información ya no vive aquí: se genera dinámicamente
 * desde `services/consultaCatalog.js`, que reutiliza los mismos datos
 * para responder cualquier solicitud de la alcaldía o del gobierno.
 *
 * Este repositorio solo resuelve los contadores y las tarjetas del dashboard.
 */
class ReporteRepository {
  /** Ids de consejos visibles; `null` para el administrador (ve todos). */
  async alcanceDe(usuarioId, rol) {
    if (String(rol || '').toLowerCase() === 'admin') return null;

    const acceso = await db.query(
      `SELECT consejo_id
         FROM usuarios_consejos
        WHERE usuario_id = $1
          AND activo = TRUE
        ORDER BY consejo_id`,
      [usuarioId]
    );

    const ids = acceso.rows.map((row) => row.consejo_id);

    // Un vocero sin consejos asignados no debe ver nada. El centinela -1
    // no coincide con ningún consejo real.
    return ids.length > 0 ? ids : [-1];
  }

  async contar(sql, params) {
    const res = await db.query(sql, params);
    return res.rows[0].total;
  }

  async getDashboardStats(usuarioId, rol) {
    const alcance = await this.alcanceDe(usuarioId, rol);

    /** Traduce el alcance a un fragmento WHERE sobre una columna. */
    const scope = (columna) =>
      alcance === null
        ? { where: '', params: [] }
        : { where: `WHERE ${columna} = ANY($1::int[])`, params: [alcance] };

    const sConsejos = scope('c.id');
    const sFamilias = scope('f.consejo_id');

    const [consejosCount, familiasCount, miembrosCount, formulariosCount] = await Promise.all([
      this.contar(`SELECT COUNT(*)::int AS total FROM consejos_comunales c ${sConsejos.where}`, sConsejos.params),
      this.contar(`SELECT COUNT(*)::int AS total FROM familias f ${sFamilias.where}`, sFamilias.params),
      this.contar(
        `SELECT COUNT(*)::int AS total FROM miembros m
           INNER JOIN familias f ON f.id = m.familia_id ${sFamilias.where}`,
        sFamilias.params
      ),
      this.contar('SELECT COUNT(*)::int AS total FROM formularios WHERE activo = TRUE', [])
    ]);

    /**
     * Contador demográfico sobre miembros, restringido al alcance.
     * `condicion` puede referenciar `$2` porque el alcance, cuando existe,
     * ocupa siempre el placeholder `$1`.
     */
    const contarMiembros = (condicion, extra = []) => {
      const where = sFamilias.where
        ? `${sFamilias.where} AND ${condicion}`
        : `WHERE ${condicion}`;
      return this.contar(
        `SELECT COUNT(*)::int AS total FROM miembros m
           INNER JOIN familias f ON f.id = m.familia_id ${where}`,
        [...sFamilias.params, ...extra]
      );
    };

    const [
      hombresCount,
      mujeresCount,
      adultosMayoresCount,
      ninosCount,
      sinFechaNacimientoCount
    ] = await Promise.all([
      contarMiembros("m.sexo = $1", ['M']),
      contarMiembros("m.sexo = $1", ['F']),
      contarMiembros('m.fecha_nacimiento IS NOT NULL AND EXTRACT(YEAR FROM AGE(m.fecha_nacimiento)) >= 60'),
      contarMiembros('m.fecha_nacimiento IS NOT NULL AND EXTRACT(YEAR FROM AGE(m.fecha_nacimiento)) < 18'),
      contarMiembros('m.fecha_nacimiento IS NULL')
    ]);

    const familiasPorConsejo = await db.query(
      `SELECT c.id, c.nombre, COUNT(f.id)::int AS total
         FROM consejos_comunales c
         LEFT JOIN familias f ON f.consejo_id = c.id
         ${sConsejos.where}
        GROUP BY c.id, c.nombre
        ORDER BY c.id ASC`,
      sConsejos.params
    );

    return {
      consejosCount,
      familiasCount,
      miembrosCount,
      formulariosCount,
      hombresCount,
      mujeresCount,
      adultosMayoresCount,
      ninosCount,
      sinFechaNacimientoCount,
      familiasPorConsejo: familiasPorConsejo.rows
    };
  }
}

module.exports = new ReporteRepository();
