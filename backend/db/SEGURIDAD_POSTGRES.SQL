-- ============================================================
-- SEGURIDAD_POSTGRES.SQL
-- Generación de la Base de Datos de Seguridad (Consejo Comunal El Valle)
--
-- Consolida el esquema de seguridad que hoy vive repartido entre
-- init.sql y las migraciones de backend/db. Es idempotente:
-- se puede ejecutar varias veces sin errores.
--
-- Uso:
--   psql "postgres://usuario:clave@host:puerto/base" -f SEGURIDAD_POSTGRES.SQL
-- ============================================================

-- ------------------------------------------------------------
-- 1. Usuarios del sistema (login, roles, recuperación, telegram)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) DEFAULT 'vocero' CHECK (rol IN ('admin', 'vocero')),
  activo BOOLEAN DEFAULT TRUE,
  reset_token VARCHAR(500),
  telegram_chat_id VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_telegram_chat_id ON usuarios(telegram_chat_id);

-- ------------------------------------------------------------
-- 2. Sesiones de usuario (sesión única, expiración, inactividad)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones_usuario (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  jti VARCHAR(64) NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL,
  ip VARCHAR(45),
  user_agent TEXT,
  dispositivo VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expira_en TIMESTAMP NOT NULL,
  revocada BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones_usuario(usuario_id, revocada);
CREATE INDEX IF NOT EXISTS idx_sesiones_jti ON sesiones_usuario(jti);

-- ------------------------------------------------------------
-- 3. Catálogo de preguntas de seguridad
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cat_preguntas_seguridad (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE
);

-- ------------------------------------------------------------
-- 4. Preguntas de seguridad por usuario
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preguntas_seguridad (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  pregunta VARCHAR(255) NOT NULL,
  respuesta VARCHAR(255) NOT NULL,
  pregunta_id INTEGER REFERENCES cat_preguntas_seguridad(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 5. Recuperación de contraseña (código OTP por email/telegram)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recuperacion_clave (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo VARCHAR(255) NOT NULL,
  expiracion TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '3 minutes'),
  intentos INTEGER DEFAULT 0,
  usado BOOLEAN DEFAULT FALSE,
  canal VARCHAR(16) DEFAULT 'email',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recuperacion_clave_usuario ON recuperacion_clave(usuario_id, usado);

-- ------------------------------------------------------------
-- 6. Vinculación de Telegram (códigos pendientes de /start)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telegram_pending_links (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  codigo VARCHAR(6) NOT NULL,
  chat_id VARCHAR(64) NOT NULL,
  expira_en TIMESTAMP NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_pending_email ON telegram_pending_links(email);

-- ------------------------------------------------------------
-- 7. Configuración del sistema de seguridad
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(100) PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT
);

-- ------------------------------------------------------------
-- 8. Auditoría de datos sensibles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER,
  accion VARCHAR(255) NOT NULL,
  entidad VARCHAR(100) NOT NULL,
  entidad_id INTEGER,
  detalle JSONB,
  ip VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Datos iniciales
-- ------------------------------------------------------------

-- Catálogo de preguntas de seguridad
INSERT INTO cat_preguntas_seguridad (nombre) VALUES
  ('¿Cuál es el nombre de tu primera mascota?'),
  ('¿Cuál es el nombre de tu mejor amigo/a de la infancia?'),
  ('¿En qué ciudad naciste?'),
  ('¿Cuál es el nombre de tu escuela primaria?'),
  ('¿Cuál es el apellido de soltera de tu madre?'),
  ('¿Cuál es tu comida favorita?'),
  ('¿Cuál es el nombre de tu profesor/a favorito/a?'),
  ('¿Cuál es el modelo de tu primer carro?')
ON CONFLICT (nombre) DO NOTHING;

-- Configuración inicial de seguridad
INSERT INTO configuracion (clave, valor, descripcion)
VALUES
  ('NOMBRE_SISTEMA', 'El Valle - Gestión Comunal', 'Nombre de la aplicación visible en el sistema'),
  ('MODO_MANTENIMIENTO', 'false', 'Indica si el sistema está en mantenimiento'),
  ('REGISTRO_ABIERTO', 'true', 'Indica si se permite el registro de nuevos usuarios en el sistema'),
  ('REQUIERIR_SESION_UNICA', 'true', 'Al iniciar sesión se revocan todas las sesiones anteriores')
ON CONFLICT (clave) DO NOTHING;
