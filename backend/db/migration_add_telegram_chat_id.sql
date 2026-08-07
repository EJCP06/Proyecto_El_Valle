-- Migración: Agregar telegram_chat_id a usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(64);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_usuarios_telegram_chat_id ON usuarios(telegram_chat_id);