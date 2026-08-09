-- Migración: Tabla para códigos de vinculación de Telegram (reemplaza Map en memoria)
CREATE TABLE IF NOT EXISTS telegram_pending_links (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  codigo VARCHAR(6) NOT NULL,
  chat_id VARCHAR(64) NOT NULL,
  expira_en TIMESTAMP NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_telegram_pending_email ON telegram_pending_links(email);

-- Limpiar códigos expirados periódicamente (se ejecuta al buscar)
