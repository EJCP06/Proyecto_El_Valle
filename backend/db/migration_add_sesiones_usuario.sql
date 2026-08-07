-- Migración: Tabla para tracking de sesiones de usuario
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