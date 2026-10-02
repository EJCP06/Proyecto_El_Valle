// ── Usuario ──────────────────────────────────────────────────────────────────
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'vocero';
  activo: boolean;
  telegram_chat_id?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ── Consejo Comunal ───────────────────────────────────────────────────────────
export interface ConsejoComunal {
  id: number;
  nombre: string;
  rif: string;
  direccion: string;
  parroquia: string;
  municipio: string;
  estado: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  createdAt?: string;
}

// ── Familia ───────────────────────────────────────────────────────────────────
export interface Familia {
  id: number;
  nombre: string;
  direccion: string;
  consejoId: number;
  consejo?: Pick<ConsejoComunal, 'id' | 'nombre'>;
  /** Solo viene en el detalle; en el listado se usa `miembrosCount`. */
  miembros?: Miembro[];
  miembrosCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ── Miembro ───────────────────────────────────────────────────────────────────
export interface Miembro {
  id: number;
  familiaId: number;
  cedula: string;
  nombre: string;
  apellido: string;
  fechaNacimiento?: string;
  sexo?: 'M' | 'F';
  telefono?: string;
  email?: string;
  jefeFamilia: boolean;
  parentesco?: string;
  estadoCivil?: string;
  nivelEducativo?: string;
  ocupacion?: string;
  createdAt?: string;
}

// ── Formulario ────────────────────────────────────────────────────────────────
export type TipoCampo =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'yes_no';

export interface CampoFormulario {
  id?: string;
  label: string;
  tipo: TipoCampo;
  requerido: boolean;
  opciones?: string[];  // For select / radio / checkbox
  orden: number;
}

export interface Formulario {
  id: number;
  titulo: string;
  descripcion?: string;
  campos?: CampoFormulario[];
  activo: boolean;
  alcance?: 'familiar' | 'individual';
  num_campos?: number;
  createdAt?: string;
}

export interface FormularioAsignacion {
  id: number;
  formularioId: number;
  familiaId: number;
  miembroId?: number | null;
  estado: 'pendiente' | 'en_progreso' | 'completado';
  formulario?: Pick<Formulario, 'id' | 'titulo' | 'alcance'>;
  familia?: Pick<Familia, 'id' | 'nombre'>;
  miembro?: Pick<Miembro, 'id' | 'nombre' | 'apellido'>;
  createdAt?: string;
}

export interface FormularioRespuesta {
  id: number;
  asignacionId: number;
  miembroId?: number | null;
  respuestas: Record<string, unknown>;
  completadoEn?: string;
}

export interface FormularioAsignacionFamilia {
  formulario: Pick<Formulario, 'id' | 'titulo' | 'alcance' | 'descripcion'>;
  asignaciones: FormularioAsignacion[];
  totalMiembros: number;
  respondidos: number;
}

// ── Configuración ─────────────────────────────────────────────────────────────
export interface ConfiguracionSistema {
  clave: string;
  valor: string;
  descripcion?: string;
}

// ── Consultas demográficas ────────────────────────────────────────────────────
/**
 * Las consultas no se hardcodean en el frontend: el backend publica su catálogo
 * (`GET /reportes/consultas`) y la pantalla se construye a partir de estos
 * descriptores. Agregar una consulta nueva en el backend no requiere tocar
 * ningún componente de Angular.
 */
export type TipoConsulta = 'detalle' | 'agregado';
export type TipoFiltroConsulta = 'entero' | 'texto' | 'booleano';
export type FormatoExportacion = 'xlsx' | 'pdf';

export interface OpcionFiltro {
  valor: string | number;
  label: string;
}

export interface FiltroConsulta {
  key: string;
  label: string;
  tipo: TipoFiltroConsulta;
  /** Catálogo que alimenta el select (`parentescos`, `estados-civiles`, …). */
  catalogo?: string | null;
  /** Opciones fijas cuando el filtro no depende de un catálogo. */
  opciones?: OpcionFiltro[] | null;
  /** El filtro de consejo lo aplica el motor a cualquier consulta. */
  universal?: boolean;
}

export interface ColumnaConsulta {
  key: string;
  label: string;
  /** Datos personales que el administrador puede ocultar desde Configuración. */
  sensible?: boolean;
}

export interface FranjaEtaria {
  etiqueta: string;
  min: number;
  max: number;
  columna: string;
}

export interface ConsultaInfo {
  slug: string;
  label: string;
  descripcion: string;
  tipo: TipoConsulta;
  franjas: FranjaEtaria[] | null;
  filtros: FiltroConsulta[];
  columnas: ColumnaConsulta[];
  columnasPorDefecto: string[];
}

export type FiltrosConsulta = Record<string, string | number | boolean | null>;

export interface ConsultaParametros {
  filtros?: FiltrosConsulta;
  columnas?: string[];
  page?: number;
  limit?: number;
}

export interface ConsultaResultado {
  slug: string;
  label: string;
  descripcion: string;
  tipo: TipoConsulta;
  franjas: FranjaEtaria[] | null;
  filtros: FiltrosConsulta;
  alcance: {
    esAdmin: boolean;
    consejoId: number | null;
    consejosVisibles: number[];
  };
  columnas: ColumnaConsulta[];
  filas: Record<string, unknown>[];
  resumen: Record<string, unknown>[];
  totales: Record<string, unknown> | null;
  paginacion: { page: number; limit: number; offset: number } | null;
}
