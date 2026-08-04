-- Migración: Crear tabla de preguntas de seguridad

CREATE TABLE IF NOT EXISTS preguntas_seguridad (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  pregunta VARCHAR(255) NOT NULL,
  respuesta VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
