/**
 * Catálogo de consultas demográficas.
 *
 * Cada consulta es una definición declarativa: un `SELECT` base que se
 * convierte en un CTE y sobre el que se aplican filtros y columnas.
 *
 * La edad se deriva siempre de `miembros.fecha_nacimiento` con
 * `EXTRACT(YEAR FROM AGE(...))`. Nunca se guarda una edad fija: hoy un niño
 * de 9 años cumple 10 el próximo año sin tocar la base de datos.
 *
 * Para agregar una consulta nueva basta con añadir un objeto a `CONSULTAS`;
 * no hay que tocar controllers, rutas ni el frontend.
 */

// ---------------------------------------------------------------------------
// Base de datos de personas
// ---------------------------------------------------------------------------

const BASE_PERSONAS = `
  SELECT
    m.id                AS id,
    f.consejo_id        AS consejid,
    m.cedula            AS cedula,
    m.nombre            AS nombre,
    m.apellido          AS apellido,
    EXTRACT(YEAR FROM AGE(m.fecha_nacimiento))::int AS edad,
    m.fecha_nacimiento  AS fechanacimiento,
    m.sexo              AS sexo,
    m.parentesco        AS parentesco,
    m.estado_civil      AS estadocivil,
    m.nivel_educativo   AS niveleducativo,
    m.ocupacion         AS ocupacion,
    m.telefono          AS telefono,
    m.email             AS email,
    m.jefe_familia      AS jefefamilia,
    f.id                AS familiaid,
    f.nombre            AS familia,
    f.direccion         AS direccion,
    c.nombre            AS consejo,
    NULLIF(BTRIM(COALESCE(rep.nombre, '') || ' ' || COALESCE(rep.apellido, '')), '') AS representante,
    rep.cedula          AS representantecedula,
    rep.telefono        AS representantetelefono
  FROM miembros m
  INNER JOIN familias f ON f.id = m.familia_id
  LEFT JOIN consejos_comunales c ON c.id = f.consejo_id
  LEFT JOIN miembros rep ON rep.familia_id = f.id AND rep.jefe_familia = TRUE
`;

// ---------------------------------------------------------------------------
// Base de datos de hogares
// ---------------------------------------------------------------------------

const BASE_HOGARES = `
  SELECT
    f.id                AS id,
    f.consejo_id        AS consejid,
    f.nombre            AS familia,
    f.direccion         AS direccion,
    c.nombre            AS consejo,
    NULLIF(BTRIM(COALESCE(rep.nombre, '') || ' ' || COALESCE(rep.apellido, '')), '') AS representante,
    rep.cedula          AS representantecedula,
    rep.telefono        AS representantetelefono,
    (SELECT COUNT(*)::int FROM miembros x WHERE x.familia_id = f.id) AS totalmiembros,
    (SELECT COUNT(*)::int FROM miembros x
      WHERE x.familia_id = f.id
        AND x.fecha_nacimiento IS NOT NULL
        AND EXTRACT(YEAR FROM AGE(x.fecha_nacimiento)) < 18) AS menores,
    (SELECT COUNT(*)::int FROM miembros x
      WHERE x.familia_id = f.id
        AND x.fecha_nacimiento IS NOT NULL
        AND EXTRACT(YEAR FROM AGE(x.fecha_nacimiento)) >= 60) AS adultosmayores
  FROM familias f
  LEFT JOIN consejos_comunales c ON c.id = f.consejo_id
  LEFT JOIN miembros rep ON rep.familia_id = f.id AND rep.jefe_familia = TRUE
`;

// ---------------------------------------------------------------------------
// Base de datos de formularios
// ---------------------------------------------------------------------------

const BASE_FORMULARIOS = `
  SELECT
    x.id                AS id,
    x.consejid          AS consejid,
    x.titulo            AS titulo,
    x.descripcion       AS descripcion,
    x.alcance           AS alcance,
    x.activo            AS activo,
    x.fecha             AS fecha,
    x.totalasignados    AS totalasignados,
    x.totalrespondidos  AS totalrespondidos,
    c.nombre            AS consejo
  FROM (
    SELECT
      f.id                AS id,
      MIN(fam.consejo_id) AS consejid,
      f.titulo            AS titulo,
      f.descripcion       AS descripcion,
      f.alcance           AS alcance,
      f.activo            AS activo,
      f.created_at        AS fecha,
      COUNT(DISTINCT a.id)::int AS totalasignados,
      COUNT(DISTINCT r.id)::int AS totalrespondidos
    FROM formularios f
    LEFT JOIN asignaciones a ON a.formulario_id = f.id
    LEFT JOIN respuestas r ON r.asignacion_id = a.id
    LEFT JOIN familias fam ON fam.id = a.familia_id
    GROUP BY f.id, f.titulo, f.descripcion, f.alcance, f.activo, f.created_at
  ) x
  LEFT JOIN consejos_comunales c ON c.id = x.consejid
`;

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------
// `expr` usa `$__` como marcador. El constructor reemplaza cada aparición por
// un placeholder numerado propio y agrega el valor repetidas veces, de modo
// que nunca se interpola texto del cliente dentro del SQL.

// `catalogo` indica de qué catálogo alimentan las opciones del select, para que
// el frontend pueda construir el filtro sin conocer cada consulta.

const FILTROS_PERSONA = [
  { key: 'edadMin',         label: 'Edad mínima',        tipo: 'entero',   expr: 'base.edad >= $__' },
  { key: 'edadMax',         label: 'Edad máxima',        tipo: 'entero',   expr: 'base.edad <= $__' },
  { key: 'sexo',            label: 'Sexo',               tipo: 'texto',    expr: 'base.sexo = $__',
    opciones: [ { valor: 'M', label: 'Masculino' }, { valor: 'F', label: 'Femenino' } ] },
  { key: 'parentesco',      label: 'Parentesco',         tipo: 'texto',    expr: 'base.parentesco = $__', catalogo: 'parentescos' },
  { key: 'estadoCivil',     label: 'Estado civil',       tipo: 'texto',    expr: 'base.estadocivil = $__', catalogo: 'estados-civiles' },
  { key: 'nivelEducativo',  label: 'Nivel educativo',    tipo: 'texto',    expr: 'base.niveleducativo = $__', catalogo: 'niveles-educativos' },
  { key: 'ocupacion',       label: 'Ocupación',          tipo: 'texto',    expr: 'base.ocupacion = $__', catalogo: 'ocupaciones' },
  { key: 'busqueda',        label: 'Buscar',             tipo: 'texto',    expr: '(base.nombre ILIKE $__ OR base.apellido ILIKE $__ OR base.cedula ILIKE $__ OR base.direccion ILIKE $__)' },
  { key: 'soloJefeFamilia', label: 'Solo jefes de familia', tipo: 'booleano', expr: 'base.jefefamilia = TRUE' }
];

const FILTROS_HOGAR = [
  { key: 'busqueda',        label: 'Buscar',             tipo: 'texto',    expr: '(base.familia ILIKE $__ OR base.direccion ILIKE $__ OR base.representante ILIKE $__)' },
  { key: 'conRepresentante', label: 'Solo con representante', tipo: 'booleano', expr: 'base.representante IS NOT NULL' }
];

const FILTROS_FORMULARIO = [
  { key: 'busqueda',        label: 'Buscar',             tipo: 'texto',    expr: '(base.titulo ILIKE $__ OR base.descripcion ILIKE $__)' },
  { key: 'activo',          label: 'Solo activos',       tipo: 'booleano', expr: 'base.activo = TRUE' }
];

// ---------------------------------------------------------------------------
// Columnas
// ---------------------------------------------------------------------------
// `sensible: true` marca datos personales que solo se incluyen si el
// administrador lo habilita en Configuración (MOSTRAR_CEDULA_EN_REPORTES).

const COLUMNAS_PERSONA = [
  { key: 'nombre',               label: 'Nombre',                    sql: 'base.nombre' },
  { key: 'apellido',             label: 'Apellido',                  sql: 'base.apellido' },
  { key: 'edad',                 label: 'Edad',                      sql: 'base.edad' },
  { key: 'sexo',                 label: 'Sexo',                      sql: 'base.sexo' },
  { key: 'fechaNacimiento',      label: 'Fecha de nacimiento',       sql: 'base.fechanacimiento' },
  { key: 'parentesco',           label: 'Parentesco',                sql: 'base.parentesco' },
  { key: 'estadoCivil',          label: 'Estado civil',              sql: 'base.estadocivil' },
  { key: 'nivelEducativo',       label: 'Nivel educativo',           sql: 'base.niveleducativo' },
  { key: 'ocupacion',            label: 'Ocupación',                 sql: 'base.ocupacion' },
  { key: 'cedula',               label: 'Cédula',                    sql: 'base.cedula',                       sensible: true },
  { key: 'telefono',             label: 'Teléfono',                  sql: 'base.telefono',                     sensible: true },
  { key: 'email',                label: 'Correo',                    sql: 'base.email',                        sensible: true },
  { key: 'familia',              label: 'Familia',                   sql: 'base.familia' },
  { key: 'direccion',            label: 'Dirección',                 sql: 'base.direccion' },
  { key: 'consejo',              label: 'Consejo Comunal',           sql: 'base.consejo' },
  { key: 'representante',        label: 'Representante',             sql: 'base.representante' },
  { key: 'representanteCedula',  label: 'Cédula del representante',  sql: 'base.representantecedula',          sensible: true },
  { key: 'representanteTelefono', label: 'Teléfono del representante', sql: 'base.representantetelefono',       sensible: true }
];

const COLUMNAS_HOGAR = [
  { key: 'familia',               label: 'Familia',                    sql: 'base.familia' },
  { key: 'direccion',             label: 'Dirección',                  sql: 'base.direccion' },
  { key: 'consejo',               label: 'Consejo Comunal',            sql: 'base.consejo' },
  { key: 'representante',         label: 'Representante',              sql: 'base.representante' },
  { key: 'representanteCedula',   label: 'Cédula del representante',   sql: 'base.representantecedula',          sensible: true },
  { key: 'representanteTelefono', label: 'Teléfono del representante', sql: 'base.representantetelefono',       sensible: true },
  { key: 'totalMiembros',         label: 'Total de miembros',          sql: 'base.totalmiembros' },
  { key: 'menores',               label: 'Menores de 18 años',         sql: 'base.menores' },
  { key: 'adultosMayores',        label: 'Adultos mayores (60+)',      sql: 'base.adultosmayores' }];

const COLUMNAS_FORMULARIO = [
  { key: 'titulo',           label: 'Título',       sql: 'base.titulo' },
  { key: 'descripcion',      label: 'Descripción',  sql: 'base.descripcion' },
  { key: 'alcance',          label: 'Alcance',      sql: 'base.alcance' },
  { key: 'activo',           label: 'Activo',       sql: 'base.activo' },
  { key: 'consejo',          label: 'Consejo',      sql: 'base.consejo' },
  { key: 'totalAsignados',   label: 'Asignados',    sql: 'base.totalasignados' },
  { key: 'totalRespondidos', label: 'Respondidos',  sql: 'base.totalrespondidos' },
  { key: 'fecha',            label: 'Fecha',        sql: 'base.fecha' }
];

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------
// `%WHERE%` lo reemplaza el motor por el WHERE ya construido (filtros + alcance
// por consejo). Se usa ese marcador y no `${...}` porque estas cadenas son
// plantillas de JavaScript y `${where}` se intentaría resolver al cargar el
// módulo.

const CONSULTAS = [
  {
    slug: 'personas',
    label: 'Personas',
    descripcion: 'Listado de personas con filtros de edad, sexo y datos demográficos. Incluye al representante (jefe de familia) de cada hogar.',
    tipo: 'detalle',
    baseSql: BASE_PERSONAS,
    filtros: FILTROS_PERSONA,
    columnas: COLUMNAS_PERSONA,
    columnasPorDefecto: ['nombre', 'apellido', 'edad', 'sexo', 'direccion', 'consejo', 'representante'],
    ordenPorDefecto: 'base.apellido ASC, base.nombre ASC',
    totalesSql: `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE base.sexo = 'M')::int AS hombres,
        COUNT(*) FILTER (WHERE base.sexo = 'F')::int AS mujeres,
        COUNT(DISTINCT base.familiaid)::int AS hogares
      FROM base
      %WHERE%`
  },
  {
    slug: 'poblacion-edad',
    label: 'Población por rango de edad',
    descripcion: 'Total de personas dentro del rango de edad seleccionado, desglosado por consejo. Responde preguntas como "¿cuántos niños de 1 a 10 años hay?".',
    tipo: 'agregado',
    baseSql: BASE_PERSONAS,
    filtros: FILTROS_PERSONA,
    columnas: [],
    columnasPorDefecto: [],
    ordenPorDefecto: '1 ASC, 2 ASC',
    totalesSql: `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE base.sexo = 'M')::int AS hombres,
        COUNT(*) FILTER (WHERE base.sexo = 'F')::int AS mujeres,
        COUNT(DISTINCT base.familiaid)::int AS hogares
      FROM base
      %WHERE%`,
    resumenSql: `
      SELECT
        COALESCE(base.consejo, 'Sin consejo asignado') AS etiqueta,
        base.sexo,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE base.sexo = 'M')::int AS hombres,
        COUNT(*) FILTER (WHERE base.sexo = 'F')::int AS mujeres
      FROM base
      %WHERE%
      GROUP BY COALESCE(base.consejo, 'Sin consejo asignado'), base.sexo
      ORDER BY 1 ASC, 3 DESC`
  },
  {
    slug: 'composicion-etaria',
    label: 'Composición etaria',
    descripcion: 'Distribución de la población por franjas de edad. Sirve para justificar recursos y planificar servicios del consejo.',
    tipo: 'agregado',
    baseSql: BASE_PERSONAS,
    filtros: [],
    columnas: [],
    columnasPorDefecto: [],
    ordenPorDefecto: '1 ASC',
    franjas: [
      { etiqueta: '0 a 2 años',    min: 0,  max: 2,   columna: 'f_0_2' },
      { etiqueta: '3 a 5 años',    min: 3,  max: 5,   columna: 'f_3_5' },
      { etiqueta: '6 a 11 años',   min: 6,  max: 11,  columna: 'f_6_11' },
      { etiqueta: '12 a 17 años',  min: 12, max: 17,  columna: 'f_12_17' },
      { etiqueta: '18 a 59 años',  min: 18, max: 59,  columna: 'f_18_59' },
      { etiqueta: '60 años o más', min: 60, max: 200, columna: 'f_60' }
    ],
    totalesSql: `
      SELECT
        COUNT(*)::int AS total,
        COUNT(DISTINCT base.consejo)::int AS consejos
      FROM base
      %WHERE%`,
    resumenSql: `
      SELECT
        COALESCE(base.consejo, 'Sin consejo asignado') AS consejo,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE base.edad BETWEEN 0 AND 2)::int    AS f_0_2,
        COUNT(*) FILTER (WHERE base.edad BETWEEN 3 AND 5)::int    AS f_3_5,
        COUNT(*) FILTER (WHERE base.edad BETWEEN 6 AND 11)::int   AS f_6_11,
        COUNT(*) FILTER (WHERE base.edad BETWEEN 12 AND 17)::int  AS f_12_17,
        COUNT(*) FILTER (WHERE base.edad BETWEEN 18 AND 59)::int  AS f_18_59,
        COUNT(*) FILTER (WHERE base.edad >= 60)::int             AS f_60
      FROM base
      %WHERE%
      GROUP BY COALESCE(base.consejo, 'Sin consejo asignado')
      ORDER BY 1 ASC`
  },
  {
    slug: 'hogares',
    label: 'Hogares',
    descripcion: 'Familias registradas con su dirección, número de integrantes y el representante (jefe de familia).',
    tipo: 'detalle',
    baseSql: BASE_HOGARES,
    filtros: FILTROS_HOGAR,
    columnas: COLUMNAS_HOGAR,
    columnasPorDefecto: ['familia', 'direccion', 'consejo', 'representante', 'totalMiembros'],
    ordenPorDefecto: 'base.familia ASC'
  },
  {
    slug: 'formularios',
    label: 'Formularios',
    descripcion: 'Seguimiento de formularios: cuántos se asignaron a los hogares y cuántos se respondieron.',
    tipo: 'detalle',
    baseSql: BASE_FORMULARIOS,
    filtros: FILTROS_FORMULARIO,
    columnas: COLUMNAS_FORMULARIO,
    columnasPorDefecto: ['titulo', 'consejo', 'totalAsignados', 'totalRespondidos'],
    ordenPorDefecto: 'base.titulo ASC',
    // Un mismo formulario puede estar asignado a hogares de varios consejos,
    // así que el alcance se valida sobre las asignaciones, no sobre el
    // consejo "principal" del formulario.
    scopeExpr: 'EXISTS (SELECT 1 FROM asignaciones ax INNER JOIN familias fx ON fx.id = ax.familia_id WHERE ax.formulario_id = base.id AND fx.consejo_id = ANY(%s::int[]))'
  }
];

const POR_SLUG = CONSULTAS.reduce((acc, c) => {
  acc[c.slug] = c;
  return acc;
}, {});

module.exports = { CONSULTAS, POR_SLUG };
