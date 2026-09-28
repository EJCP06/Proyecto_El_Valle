const db = require('../config/db');

class ReporteRepository {
  async getFamiliasData(desde, hasta) {
    let query = `
      SELECT f.id, f.nombre, f.direccion, c.nombre as consejo, 
             COUNT(m.id)::int as total_miembros,
             COALESCE(MAX(CASE WHEN m.jefe_familia = true THEN m.nombre || ' ' || m.apellido END), 'Sin jefe') as jefe_familia,
             f.created_at as fecha_creacion
      FROM familias f
      LEFT JOIN consejos_comunales c ON f.consejo_id = c.id
      LEFT JOIN miembros m ON m.familia_id = f.id
    `;
    const params = [];
    if (desde && hasta) {
      query += ` WHERE f.created_at BETWEEN $1 AND $2`;
      params.push(desde, hasta);
    }
    query += ` GROUP BY f.id, c.nombre ORDER BY f.id DESC`;
    const res = await db.query(query, params);
    return res.rows;
  }

  async getMiembrosData(desde, hasta) {
    let query = `
      SELECT m.id, m.cedula, m.nombre, m.apellido, m.sexo, m.telefono, m.email,
             m.fecha_nacimiento, m.jefe_familia, f.nombre as familia,
             m.created_at as fecha_registro
      FROM miembros m
      INNER JOIN familias f ON m.familia_id = f.id
    `;
    const params = [];
    if (desde && hasta) {
      query += ` WHERE m.created_at BETWEEN $1 AND $2`;
      params.push(desde, hasta);
    }
    query += ` ORDER BY m.id DESC`;
    const res = await db.query(query, params);
    return res.rows;
  }

  async getFormulariosData(desde, hasta) {
    let query = `
      SELECT f.id, f.titulo, f.descripcion, f.activo, f.created_at,
             COUNT(DISTINCT a.id)::int as total_asignados,
             COUNT(DISTINCT r.id)::int as total_respondidos
      FROM formularios f
      LEFT JOIN asignaciones a ON a.formulario_id = f.id
      LEFT JOIN respuestas r ON r.asignacion_id = a.id
    `;
    const params = [];
    if (desde && hasta) {
      query += ` WHERE f.created_at BETWEEN $1 AND $2`;
      params.push(desde, hasta);
    }
    query += ` GROUP BY f.id ORDER BY f.id DESC`;
    const res = await db.query(query, params);
    return res.rows;
  }

  async getDashboardStats() {
    const resConsejos = await db.query('SELECT COUNT(*)::int as total FROM consejos_comunales');
    const resFamilias = await db.query('SELECT COUNT(*)::int as total FROM familias');
    const resMiembros = await db.query('SELECT COUNT(*)::int as total FROM miembros');
    const resFormularios = await db.query('SELECT COUNT(*)::int as total FROM formularios WHERE activo = true');
    
    const resHombres = await db.query("SELECT COUNT(*)::int as total FROM miembros WHERE sexo = 'M'");
    const resMujeres = await db.query("SELECT COUNT(*)::int as total FROM miembros WHERE sexo = 'F'");
    
    const resAdultosMayores = await db.query(
      "SELECT COUNT(*)::int as total FROM miembros WHERE fecha_nacimiento IS NOT NULL AND EXTRACT(YEAR FROM AGE(fecha_nacimiento)) >= 60"
    );
    
    const resNinos = await db.query(
      "SELECT COUNT(*)::int as total FROM miembros WHERE fecha_nacimiento IS NOT NULL AND EXTRACT(YEAR FROM AGE(fecha_nacimiento)) < 18"
    );
    
    const resFamiliasPorConsejo = await db.query(
      `SELECT c.id, c.nombre, COUNT(f.id)::int as total
       FROM consejos_comunales c
       LEFT JOIN familias f ON f.consejo_id = c.id
       GROUP BY c.id, c.nombre
       ORDER BY c.id ASC`
    );

    return {
      consejosCount: resConsejos.rows[0].total,
      familiasCount: resFamilias.rows[0].total,
      miembrosCount: resMiembros.rows[0].total,
      formulariosCount: resFormularios.rows[0].total,
      hombresCount: resHombres.rows[0].total,
      mujeresCount: resMujeres.rows[0].total,
      adultosMayoresCount: resAdultosMayores.rows[0].total,
      ninosCount: resNinos.rows[0].total,
      familiasPorConsejo: resFamiliasPorConsejo.rows,
    };
  }
}

module.exports = new ReporteRepository();
