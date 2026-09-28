-- ============================================================
-- El Valle - Modelo de comunidad v1
-- Objetivo:
--   1. Relacionar voceros con consejos comunales.
--   2. Preparar auditoría temporal de familias y miembros.
--   3. Reforzar integridad de jefe de familia.
--   4. Crear índices para las consultas demográficas.
--
-- IMPORTANTE:
--   Esta migración NO elimina columnas existentes ni modifica
--   formularios/respuestas. Debe revisarse antes de ejecutarla.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Relación usuario (vocero) <-> consejo comunal
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios_consejos (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  consejo_id INTEGER NOT NULL REFERENCES consejos_comunales(id) ON DELETE CASCADE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, consejo_id)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_consejos_usuario
  ON usuarios_consejos(usuario_id, activo);

CREATE INDEX IF NOT EXISTS idx_usuarios_consejos_consejo
  ON usuarios_consejos(consejo_id, activo);

-- ------------------------------------------------------------
-- 2. Fechas de actualización para información base
-- ------------------------------------------------------------
ALTER TABLE familias
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE miembros
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ------------------------------------------------------------
-- 3. Índices para consultas frecuentes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_familias_consejo
  ON familias(consejo_id);

CREATE INDEX IF NOT EXISTS idx_miembros_familia
  ON miembros(familia_id);

CREATE INDEX IF NOT EXISTS idx_miembros_fecha_nacimiento
  ON miembros(fecha_nacimiento);

CREATE INDEX IF NOT EXISTS idx_miembros_sexo
  ON miembros(sexo);

CREATE INDEX IF NOT EXISTS idx_miembros_ocupacion
  ON miembros(ocupacion);

CREATE INDEX IF NOT EXISTS idx_miembros_nivel_educativo
  ON miembros(nivel_educativo);

-- ------------------------------------------------------------
-- 4. Solo un jefe de familia por familia.
--    No altera datos existentes; si ya existen duplicados,
--    PostgreSQL impedirá crear el índice hasta corregirlos.
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_miembros_un_jefe_por_familia
  ON miembros(familia_id)
  WHERE jefe_familia = TRUE;

COMMIT;
