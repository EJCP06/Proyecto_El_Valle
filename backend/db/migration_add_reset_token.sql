-- Migración: Agregar columna reset_token a tabla usuarios
-- Para recuperación de contraseña

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token VARCHAR(500);
