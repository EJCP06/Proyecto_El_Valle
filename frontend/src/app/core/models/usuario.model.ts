// ── Usuario ──────────────────────────────────────────────────────────────────
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'vocero';
  activo: boolean;
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
  miembros?: Miembro[];
  createdAt?: string;
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

// ── Auditoría ─────────────────────────────────────────────────────────────────
export interface RegistroAuditoria {
  id: number;
  usuarioId: number;
  usuario?: Pick<Usuario, 'id' | 'nombre' | 'email'>;
  accion: string;
  entidad: string;
  entidadId?: number;
  detalle?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

// ── Configuración ─────────────────────────────────────────────────────────────
export interface ConfiguracionSistema {
  clave: string;
  valor: string;
  descripcion?: string;
}

// ── Reporte ───────────────────────────────────────────────────────────────────
export interface ReporteParams {
  tipo: 'familias' | 'miembros' | 'formularios' | 'auditoria';
  desde?: string;
  hasta?: string;
  consejoId?: number;
  formato?: 'json' | 'csv' | 'pdf';
}
