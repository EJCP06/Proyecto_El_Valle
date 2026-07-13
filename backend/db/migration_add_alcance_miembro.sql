-- Migración: Alcance de formularios + Miembro en respuestas
-- Ejecutar una sola vez sobre la BD existente

-- 1. Agregar columnas time y yes_no al CHECK de preguntas
ALTER TABLE preguntas DROP CONSTRAINT IF EXISTS preguntas_tipo_check;
ALTER TABLE preguntas ADD CONSTRAINT preguntas_tipo_check CHECK (tipo IN ('text', 'textarea', 'number', 'date', 'time', 'select', 'radio', 'checkbox', 'file', 'yes_no'));

-- 2. Agregar alcance a formularios
ALTER TABLE formularios ADD COLUMN IF NOT EXISTS alcance VARCHAR(20) DEFAULT 'familiar';
ALTER TABLE formularios ADD CONSTRAINT formularios_alcance_check CHECK (alcance IN ('familiar', 'individual'));

-- 3. Respuestas: agregar miembro_id, cambiar constraint UNIQUE
ALTER TABLE respuestas DROP CONSTRAINT IF EXISTS respuestas_asignacion_id_key;
ALTER TABLE respuestas ADD COLUMN IF NOT EXISTS miembro_id INTEGER REFERENCES miembros(id) ON DELETE CASCADE;
ALTER TABLE respuestas ADD CONSTRAINT respuestas_asignacion_miembro_key UNIQUE (asignacion_id, miembro_id);
