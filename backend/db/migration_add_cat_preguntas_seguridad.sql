-- Migración: Catálogo de preguntas de seguridad
-- Las preguntas de seguridad pasan a ser un catálogo administrable.
-- Las respuestas por usuario se referencian al catálogo vía pregunta_id,
-- conservando la columna pregunta como texto de respaldo para registros existentes.

CREATE TABLE IF NOT EXISTS cat_preguntas_seguridad (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE
);

ALTER TABLE preguntas_seguridad ADD COLUMN IF NOT EXISTS pregunta_id INTEGER REFERENCES cat_preguntas_seguridad(id);

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
