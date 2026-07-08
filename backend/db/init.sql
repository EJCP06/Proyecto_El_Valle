-- Schema SQL completo para el Consejo Comunal El Valle

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) DEFAULT 'vocero' CHECK (rol IN ('admin', 'vocero')),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Consejos Comunales
CREATE TABLE IF NOT EXISTS consejos_comunales (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  rif VARCHAR(50) UNIQUE NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  parroquia VARCHAR(100) NOT NULL,
  municipio VARCHAR(100) NOT NULL,
  estado VARCHAR(100) NOT NULL,
  telefono VARCHAR(50),
  email VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Familias
CREATE TABLE IF NOT EXISTS familias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  consejo_id INTEGER REFERENCES consejos_comunales(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Miembros de Familia
CREATE TABLE IF NOT EXISTS miembros (
  id SERIAL PRIMARY KEY,
  familia_id INTEGER REFERENCES familias(id) ON DELETE CASCADE,
  cedula VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE,
  sexo CHAR(1) CHECK (sexo IN ('M', 'F')),
  telefono VARCHAR(50),
  email VARCHAR(255),
  jefe_familia BOOLEAN DEFAULT FALSE,
  parentesco VARCHAR(100),
  estado_civil VARCHAR(100),
  nivel_educativo VARCHAR(100),
  ocupacion VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Formularios
CREATE TABLE IF NOT EXISTS formularios (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Preguntas (Campos) del Formulario
CREATE TABLE IF NOT EXISTS preguntas (
  id VARCHAR(100) PRIMARY KEY, -- UUID/Text
  formulario_id INTEGER REFERENCES formularios(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('text', 'textarea', 'number', 'date', 'select', 'radio', 'checkbox', 'file')),
  requerido BOOLEAN DEFAULT FALSE,
  opciones TEXT[], -- Para select, radio, checkbox
  orden INTEGER NOT NULL
);

-- Tabla de Asignaciones de Formulario a Familias
CREATE TABLE IF NOT EXISTS asignaciones (
  id SERIAL PRIMARY KEY,
  formulario_id INTEGER REFERENCES formularios(id) ON DELETE CASCADE,
  familia_id INTEGER REFERENCES familias(id) ON DELETE CASCADE,
  estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completado')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(formulario_id, familia_id)
);

-- Tabla de Respuestas
CREATE TABLE IF NOT EXISTS respuestas (
  id SERIAL PRIMARY KEY,
  asignacion_id INTEGER UNIQUE REFERENCES asignaciones(id) ON DELETE CASCADE,
  respuestas JSONB NOT NULL,
  completado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Auditoría
CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER, -- Puede ser null si el usuario es eliminado o es sistema
  accion VARCHAR(255) NOT NULL,
  entidad VARCHAR(100) NOT NULL,
  entidad_id INTEGER,
  detalle JSONB,
  ip VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tablas de Catálogos
CREATE TABLE IF NOT EXISTS cat_parentescos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cat_estados_civiles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cat_niveles_educativos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cat_ocupaciones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cat_tipos_vivienda (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cat_tipos_discapacidad (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE
);

-- Tabla de Configuración
CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(100) PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT
);

-- Seed de Datos Iniciales
-- Contraseña de admin por defecto: "admin123" (Bcrypt hash: $2a$10$vUf5DqK2N5qJd7F2O2sLGeR.xL2u2V4Uu7qfL6k3gL2.d.p3v0d8O)
INSERT INTO usuarios (nombre, email, password, rol, activo)
VALUES ('Administrador', 'admin@elvalle.com', '$2a$10$OUU53G8pcV6PcTlLMH9HXeGqh9KGkdFgDDSJm/kiZGl3W7iVEiswi', 'admin', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO usuarios (nombre, email, password, rol, activo)
VALUES ('Vocero', 'vocero@elvalle.com', '$2a$10$OUU53G8pcV6PcTlLMH9HXeGqh9KGkdFgDDSJm/kiZGl3W7iVEiswi', 'vocero', true)
ON CONFLICT (email) DO NOTHING;

-- Seed de Catálogos
INSERT INTO cat_parentescos (nombre) VALUES
  ('Jefe/a de familia'), ('Cónyuge'), ('Hijo/a'), ('Padre/Madre'),
  ('Hermano/a'), ('Abuelo/a'), ('Nieto/a'), ('Tío/a'), ('Primo/a'),
  ('Suegro/a'), ('Yerno/Nuera'), ('Cuñado/a'), ('Otro')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_estados_civiles (nombre) VALUES
  ('Soltero/a'), ('Casado/a'), ('Divorciado/a'), ('Viudo/a'),
  ('Concubino/a'), ('Separado/a')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_niveles_educativos (nombre) VALUES
  ('Ninguno'), ('Primaria'), ('Secundaria'), ('Bachiller'),
  ('Técnico Superior'), ('Universitario'), ('Postgrado'), ('Especialización')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_ocupaciones (nombre) VALUES
  ('Estudiante'), ('Empleado/a'), ('Obrero/a'), ('Comerciante'),
  ('Profesional'), ('Ama de casa'), ('Jubilado/a'), ('Desempleado/a'),
  ('Emprendedor/a'), ('Agricultor/a'), ('Conductor/a'), ('Docente'),
  ('Enfermero/a'), ('Ingeniero/a'), ('Abogado/a'), ('Otro')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_tipos_vivienda (nombre) VALUES
  ('Casa'), ('Apartamento'), ('Rancho'), ('Vivienda rural'),
  ('Casa de vecindad'), ('Refugio'), ('Otro')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_tipos_discapacidad (nombre) VALUES
  ('Física'), ('Visual'), ('Auditiva'), ('Cognitiva'),
  ('Psicosocial'), ('Múltiple'), ('Otra')
ON CONFLICT (nombre) DO NOTHING;

-- Configuración inicial
INSERT INTO configuracion (clave, valor, descripcion)
VALUES 
  ('NOMBRE_SISTEMA', 'El Valle - Gestión Comunal', 'Nombre de la aplicación visible en el sistema'),
  ('MODO_MANTENIMIENTO', 'false', 'Indica si el sistema está en mantenimiento'),
  ('REGISTRO_ABIERTO', 'true', 'Indica si se permite el registro de nuevos usuarios en el sistema')
ON CONFLICT (clave) DO NOTHING;
