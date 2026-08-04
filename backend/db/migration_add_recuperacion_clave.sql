-- Migración: Tabla para recuperación de contraseña con código OTP

CREATE TABLE IF NOT EXISTS recuperacion_clave (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo VARCHAR(255) NOT NULL,
  expiracion TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '3 minutes'),
  intentos INTEGER DEFAULT 0,
  usado BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recuperacion_clave_usuario ON recuperacion_clave(usuario_id, usado);
