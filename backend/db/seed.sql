-- Seed masivo de datos de prueba para El Valle
-- Contraseña para todos los usuarios de prueba: "test123" ($2a$10$T7LmNqRqWxLk0DmX8G8v6O4q9fU2aG5hJ1kR3tY6wE7z9I0oP2lM)

BEGIN;

-- Limpiar datos existentes y reiniciar secuencias (CASCADE respeta FKs)
TRUNCATE TABLE
  respuestas, asignaciones, preguntas, formularios,
  miembros, familias, consejos_comunales, auditoria,
  cat_parentescos, cat_estados_civiles, cat_niveles_educativos,
  cat_ocupaciones, cat_tipos_vivienda, cat_tipos_discapacidad
RESTART IDENTITY CASCADE;

-- Eliminar usuarios extras (deja solo los seed del init.sql)
DELETE FROM usuarios WHERE email NOT IN ('admin@elvalle.com', 'vocero@elvalle.com');

-- ──────────────────────────────────────────────
-- CATÁLOGOS
-- ──────────────────────────────────────────────

INSERT INTO cat_parentescos (nombre) VALUES
  ('Jefe/a de familia'), ('Cónyuge'), ('Hijo/a'), ('Padre/Madre'),
  ('Hermano/a'), ('Abuelo/a'), ('Nieto/a'), ('Tío/a'), ('Primo/a'),
  ('Suegro/a'), ('Yerno/Nuera'), ('Cuñado/a'), ('Otro');

INSERT INTO cat_estados_civiles (nombre) VALUES
  ('Soltero/a'), ('Casado/a'), ('Divorciado/a'), ('Viudo/a'),
  ('Concubino/a'), ('Separado/a');

INSERT INTO cat_niveles_educativos (nombre) VALUES
  ('Ninguno'), ('Primaria'), ('Secundaria'), ('Bachiller'),
  ('Técnico Superior'), ('Universitario'), ('Postgrado'), ('Especialización');

INSERT INTO cat_ocupaciones (nombre) VALUES
  ('Estudiante'), ('Empleado/a'), ('Obrero/a'), ('Comerciante'),
  ('Profesional'), ('Ama de casa'), ('Jubilado/a'), ('Desempleado/a'),
  ('Emprendedor/a'), ('Agricultor/a'), ('Conductor/a'), ('Docente'),
  ('Enfermero/a'), ('Ingeniero/a'), ('Abogado/a'), ('Otro');

INSERT INTO cat_tipos_vivienda (nombre) VALUES
  ('Casa'), ('Apartamento'), ('Rancho'), ('Vivienda rural'),
  ('Casa de vecindad'), ('Refugio'), ('Otro');

INSERT INTO cat_tipos_discapacidad (nombre) VALUES
  ('Física'), ('Visual'), ('Auditiva'), ('Cognitiva'),
  ('Psicosocial'), ('Múltiple'), ('Otra');

-- ──────────────────────────────────────────────
-- USUARIOS
-- ──────────────────────────────────────────────

-- Todas las contraseñas: "test123"
-- Hash Bcrypt: $2a$10$dIO2DXIT06uhHOJTDJDeS.zPHdoK1dOe8wIJEyFsREOUmmZP2TDe.

-- Se insertan con ON CONFLICT para no duplicar si ya existen (seed se puede ejecutar varias veces)
INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES
  ('Administrador', 'admin@elvalle.com', '$2a$10$dIO2DXIT06uhHOJTDJDeS.zPHdoK1dOe8wIJEyFsREOUmmZP2TDe.', 'admin', true)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, rol = EXCLUDED.rol, activo = EXCLUDED.activo;

INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES
  ('Vocero General', 'vocero@elvalle.com', '$2a$10$dIO2DXIT06uhHOJTDJDeS.zPHdoK1dOe8wIJEyFsREOUmmZP2TDe.', 'vocero', true)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, rol = EXCLUDED.rol, activo = EXCLUDED.activo;

INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES
  ('María Rodríguez', 'maria@elvalle.com', '$2a$10$dIO2DXIT06uhHOJTDJDeS.zPHdoK1dOe8wIJEyFsREOUmmZP2TDe.', 'vocero', true),
  ('Carlos Pérez', 'carlos@elvalle.com', '$2a$10$dIO2DXIT06uhHOJTDJDeS.zPHdoK1dOe8wIJEyFsREOUmmZP2TDe.', 'vocero', true),
  ('Ana Martínez', 'ana@elvalle.com', '$2a$10$dIO2DXIT06uhHOJTDJDeS.zPHdoK1dOe8wIJEyFsREOUmmZP2TDe.', 'vocero', true),
  ('José Hernández', 'jose@elvalle.com', '$2a$10$dIO2DXIT06uhHOJTDJDeS.zPHdoK1dOe8wIJEyFsREOUmmZP2TDe.', 'vocero', true),
  ('Diana Torres', 'diana@elvalle.com', '$2a$10$dIO2DXIT06uhHOJTDJDeS.zPHdoK1dOe8wIJEyFsREOUmmZP2TDe.', 'vocero', true),
  ('Super Admin', 'super@elvalle.com', '$2a$10$dIO2DXIT06uhHOJTDJDeS.zPHdoK1dOe8wIJEyFsREOUmmZP2TDe.', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- ──────────────────────────────────────────────
-- CONSEJOS COMUNALES
-- ──────────────────────────────────────────────

INSERT INTO consejos_comunales (nombre, rif, direccion, parroquia, municipio, estado, telefono, email) VALUES
  ('Patria Querida', 'J-40523123-1', 'Calle 1 de Mayo, Sector El 70', 'El Valle', 'Libertador', 'Distrito Capital', '0212-8712345', 'patria.querida@elvalle.com'),
  ('El Valle Resiste', 'J-40523124-2', 'Av. Intercomunal, Los Castores', 'El Valle', 'Libertador', 'Distrito Capital', '0212-8723456', 'resistencia@elvalle.com'),
  ('Unidad y Fuerza', 'J-40523125-3', 'Barrio Unión, Calle Principal', 'El Valle', 'Libertador', 'Distrito Capital', '0212-8734567', 'unidad.fuerza@elvalle.com'),
  ('Viviendo en Victoria', 'J-40523126-4', 'Sector La Bombilla, Calle 8', 'El Valle', 'Libertador', 'Distrito Capital', '0212-8745678', 'victoria@elvalle.com'),
  ('La Nueva Comuna', 'J-40523127-5', 'Urbanización Nueva Esperanza, Av. 5', 'El Valle', 'Libertador', 'Distrito Capital', '0212-8756789', 'nueva.comuna@elvalle.com'),
  ('Renacer del Valle', 'J-40523128-6', 'Sector Alto Valle, Calle Las Flores', 'El Valle', 'Libertador', 'Distrito Capital', '0212-8767890', 'renacer@elvalle.com'),
  ('Fuerza Comunal', 'J-40523129-7', 'Barrio El Carmen, Av. Principal', 'El Valle', 'Libertador', 'Distrito Capital', '0212-8778901', 'fuerza.comunal@elvalle.com'),
  ('Por la Paz del Valle', 'J-40523130-8', 'Sector La Paz, Calle 10', 'El Valle', 'Libertador', 'Distrito Capital', '0212-8789012', 'paz.valle@elvalle.com'),
  ('Construyendo Futuro', 'J-40523131-9', 'Urbanización El Valle Sur, Av. 7', 'El Valle', 'Libertador', 'Distrito Capital', '0212-8790123', 'construyendo@elvalle.com');

-- ──────────────────────────────────────────────
-- FAMILIAS (15 registros)
-- ──────────────────────────────────────────────

INSERT INTO familias (nombre, direccion, consejo_id) VALUES
  ('Familia Pérez Rodríguez', 'Calle 1 de Mayo, Casa N° 12', 1),
  ('Familia García Martínez', 'Calle 1 de Mayo, Casa N° 18', 1),
  ('Familia Hernández Torres', 'Av. Intercomunal, Edif. Los Castores, Apto 2-B', 2),
  ('Familia López Sánchez', 'Av. Intercomunal, Edif. Los Castores, Apto 5-C', 2),
  ('Familia Martínez González', 'Barrio Unión, Calle Principal, Casa 7', 3),
  ('Familia Rodríguez Díaz', 'Sector La Bombilla, Calle 8, Casa 23', 4),
  ('Familia Torres Medina', 'Sector La Bombilla, Calle 8, Casa 31', 4),
  ('Familia Sánchez Castillo', 'Urbanización Nueva Esperanza, Av. 5, Casa 15', 5),
  ('Familia Ramírez Flores', 'Urbanización Nueva Esperanza, Av. 5, Casa 22', 5),
  ('Familia Díaz Contreras', 'Sector Alto Valle, Calle Las Flores, Casa 6', 6),
  ('Familia Morales Rivas', 'Barrio El Carmen, Av. Principal, Casa 41', 7),
  ('Familia Ortega Ruiz', 'Barrio El Carmen, Av. Principal, Casa 55', 7),
  ('Familia Mendoza Vargas', 'Sector La Paz, Calle 10, Casa 8', 8),
  ('Familia Rojas Paredes', 'Urbanización El Valle Sur, Av. 7, Casa 33', 9),
  ('Familia Castro Jiménez', 'Urbanización El Valle Sur, Av. 7, Casa 47', 9);

-- ──────────────────────────────────────────────
-- MIEMBROS (40+ registros)
-- ──────────────────────────────────────────────

INSERT INTO miembros (familia_id, cedula, nombre, apellido, fecha_nacimiento, sexo, telefono, email, jefe_familia, parentesco, estado_civil, nivel_educativo, ocupacion) VALUES
  -- Familia 1: Pérez Rodríguez
  (1, 'V-12345678', 'Carlos', 'Pérez', '1978-05-12', 'M', '0412-1234567', 'carlos.perez@email.com', true, 'Jefe/a de familia', 'Casado/a', 'Bachiller', 'Empleado/a'),
  (1, 'V-13456789', 'María', 'Rodríguez', '1980-11-22', 'F', '0412-1234567', NULL, false, 'Cónyuge', 'Casado/a', 'Técnico Superior', 'Ama de casa'),
  (1, 'V-14567890', 'Sofía', 'Pérez Rodríguez', '2005-03-15', 'F', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Secundaria', 'Estudiante'),
  (1, 'V-15678901', 'Luis', 'Pérez Rodríguez', '2008-07-28', 'M', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Primaria', 'Estudiante'),
  (1, 'V-30456789', 'Doña Elena', 'Rodríguez de Pérez', '1955-09-10', 'F', NULL, NULL, false, 'Padre/Madre', 'Viudo/a', 'Primaria', 'Jubilado/a'),

  -- Familia 2: García Martínez
  (2, 'V-16789012', 'Pedro', 'García', '1982-01-30', 'M', '0414-2345678', 'pedro.garcia@email.com', true, 'Jefe/a de familia', 'Concubino/a', 'Universitario', 'Profesional'),
  (2, 'V-17890123', 'Ana', 'Martínez', '1985-06-14', 'F', '0414-2345678', NULL, false, 'Cónyuge', 'Concubino/a', 'Bachiller', 'Comerciante'),
  (2, 'V-18901234', 'Diego', 'García Martínez', '2010-12-01', 'M', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Primaria', 'Estudiante'),

  -- Familia 3: Hernández Torres
  (3, 'V-19012345', 'José', 'Hernández', '1975-08-20', 'M', '0416-3456789', 'jose.hernandez@email.com', true, 'Jefe/a de familia', 'Casado/a', 'Bachiller', 'Obrero/a'),
  (3, 'V-20123456', 'Carmen', 'Torres', '1979-03-11', 'F', '0416-3456789', NULL, false, 'Cónyuge', 'Casado/a', 'Secundaria', 'Ama de casa'),
  (3, 'V-21234567', 'Andrés', 'Hernández Torres', '2002-09-25', 'M', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Universitario', 'Estudiante'),
  (3, 'V-22345678', 'Valentina', 'Hernández Torres', '2006-04-18', 'F', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Secundaria', 'Estudiante'),
  (3, 'V-30987654', 'Don Tomás', 'Hernández', '1950-12-05', 'M', NULL, NULL, false, 'Padre/Madre', 'Viudo/a', 'Primaria', 'Jubilado/a'),

  -- Familia 4: López Sánchez
  (4, 'V-23456789', 'Miguel', 'López', '1990-07-15', 'M', '0426-4567890', 'miguel.lopez@email.com', true, 'Jefe/a de familia', 'Soltero/a', 'Técnico Superior', 'Emprendedor/a'),
  (4, 'V-24567890', 'Laura', 'Sánchez', '1992-11-30', 'F', '0426-4567890', NULL, false, 'Hermano/a', 'Soltero/a', 'Universitario', 'Estudiante'),

  -- Familia 5: Martínez González
  (5, 'V-25678901', 'Roberto', 'Martínez', '1968-04-22', 'M', '0412-5678901', 'roberto.martinez@email.com', true, 'Jefe/a de familia', 'Casado/a', 'Primaria', 'Obrero/a'),
  (5, 'V-26789012', 'Isabel', 'González', '1970-09-18', 'F', '0412-5678901', NULL, false, 'Cónyuge', 'Casado/a', 'Secundaria', 'Ama de casa'),
  (5, 'V-27890123', 'Jesús', 'Martínez González', '1995-02-14', 'M', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Universitario', 'Empleado/a'),
  (5, 'V-28901234', 'Marta', 'Martínez González', '1998-08-08', 'F', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Universitario', 'Estudiante'),
  (5, 'V-31567890', 'Don Francisco', 'Martínez', '1945-06-30', 'M', NULL, NULL, false, 'Padre/Madre', 'Viudo/a', 'Primaria', 'Jubilado/a'),

  -- Familia 6: Rodríguez Díaz
  (6, 'V-29012345', 'Jorge', 'Rodríguez', '1985-12-05', 'M', '0414-6789012', 'jorge.rodriguez@email.com', true, 'Jefe/a de familia', 'Casado/a', 'Bachiller', 'Conductor/a'),
  (6, 'V-30123456', 'Rosa', 'Díaz', '1987-03-27', 'F', '0414-6789012', NULL, false, 'Cónyuge', 'Casado/a', 'Bachiller', 'Ama de casa'),
  (6, 'V-31234567', 'Julián', 'Rodríguez Díaz', '2012-10-10', 'M', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Primaria', 'Estudiante'),

  -- Familia 7: Torres Medina
  (7, 'V-32345678', 'Fernando', 'Torres', '1972-11-08', 'M', '0426-7890123', 'fernando.torres@email.com', true, 'Jefe/a de familia', 'Casado/a', 'Bachiller', 'Comerciante'),
  (7, 'V-33456789', 'Gladys', 'Medina', '1974-07-19', 'F', '0426-7890123', NULL, false, 'Cónyuge', 'Casado/a', 'Secundaria', 'Ama de casa'),
  (7, 'V-34567890', 'Eduardo', 'Torres Medina', '1999-05-22', 'M', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Universitario', 'Estudiante'),
  (7, 'V-35678901', 'Mariana', 'Torres Medina', '2003-01-15', 'F', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Bachiller', 'Estudiante'),

  -- Familia 8: Sánchez Castillo
  (8, 'V-36789012', 'Alberto', 'Sánchez', '1988-09-12', 'M', '0412-8901234', 'alberto.sanchez@email.com', true, 'Jefe/a de familia', 'Casado/a', 'Técnico Superior', 'Empleado/a'),
  (8, 'V-37890123', 'Doris', 'Castillo', '1990-04-25', 'F', '0412-8901234', NULL, false, 'Cónyuge', 'Casado/a', 'Bachiller', 'Ama de casa'),
  (8, 'V-38901234', 'Samuel', 'Sánchez Castillo', '2016-08-30', 'M', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Ninguno', 'Estudiante'),

  -- Familia 9: Ramírez Flores
  (9, 'V-39012345', 'Rafael', 'Ramírez', '1995-06-01', 'M', '0414-9012345', 'rafael.ramirez@email.com', true, 'Jefe/a de familia', 'Concubino/a', 'Bachiller', 'Emprendedor/a'),
  (9, 'V-40123456', 'Yolanda', 'Flores', '1997-12-14', 'F', '0414-9012345', NULL, false, 'Cónyuge', 'Concubino/a', 'Secundaria', 'Empleado/a'),

  -- Familia 10: Díaz Contreras
  (10, 'V-41234567', 'Antonio', 'Díaz', '1965-02-28', 'M', '0426-0123456', 'antonio.diaz@email.com', true, 'Jefe/a de familia', 'Casado/a', 'Primaria', 'Agricultor/a'),
  (10, 'V-42345678', 'Elena', 'Contreras', '1967-10-05', 'F', '0426-0123456', NULL, false, 'Cónyuge', 'Casado/a', 'Primaria', 'Ama de casa'),
  (10, 'V-43456789', 'Oscar', 'Díaz Contreras', '1992-06-20', 'M', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Técnico Superior', 'Empleado/a'),
  (10, 'V-44567890', 'Lorena', 'Díaz Contreras', '1996-03-08', 'F', NULL, NULL, false, 'Hijo/a', 'Casado/a', 'Bachiller', 'Ama de casa'),

  -- Familia 11: Morales Rivas
  (11, 'V-45678901', 'Guillermo', 'Morales', '1980-08-15', 'M', '0412-1122334', 'guillermo.morales@email.com', true, 'Jefe/a de familia', 'Divorciado/a', 'Universitario', 'Docente'),
  (11, 'V-46789012', 'Andrea', 'Rivas', '1983-05-09', 'F', NULL, NULL, false, 'Hermano/a', 'Soltero/a', 'Universitario', 'Enfermero/a'),

  -- Familia 12: Ortega Ruiz
  (12, 'V-47890123', 'Manuel', 'Ortega', '1970-01-20', 'M', '0416-2233445', 'manuel.ortega@email.com', true, 'Jefe/a de familia', 'Casado/a', 'Bachiller', 'Obrero/a'),
  (12, 'V-48901234', 'Teresa', 'Ruiz', '1972-04-17', 'F', NULL, NULL, false, 'Cónyuge', 'Casado/a', 'Secundaria', 'Ama de casa'),

  -- Familia 13: Mendoza Vargas
  (13, 'V-49012345', 'Luis', 'Mendoza', '1991-11-11', 'M', '0426-3344556', 'luis.mendoza@email.com', true, 'Jefe/a de familia', 'Soltero/a', 'Universitario', 'Ingeniero/a'),
  (13, 'V-50123456', 'Patricia', 'Vargas', '1993-07-23', 'F', NULL, NULL, false, 'Cónyuge', 'Concubino/a', 'Técnico Superior', 'Empleado/a'),

  -- Familia 14: Rojas Paredes
  (14, 'V-51234567', 'Humberto', 'Rojas', '1976-09-30', 'M', '0414-4455667', 'humberto.rojas@email.com', true, 'Jefe/a de familia', 'Casado/a', 'Bachiller', 'Conductor/a'),
  (14, 'V-52345678', 'Silvia', 'Paredes', '1978-02-14', 'F', '0414-4455667', NULL, false, 'Cónyuge', 'Casado/a', 'Bachiller', 'Ama de casa'),
  (14, 'V-53456789', 'Daniel', 'Rojas Paredes', '2007-10-05', 'M', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Secundaria', 'Estudiante'),
  (14, 'V-54567890', 'Camila', 'Rojas Paredes', '2009-06-12', 'F', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Primaria', 'Estudiante'),
  (14, 'V-32654321', 'Doña Inés', 'Paredes de Rojas', '1948-11-20', 'F', NULL, NULL, false, 'Padre/Madre', 'Viudo/a', 'Primaria', 'Jubilado/a'),

  -- Familia 15: Castro Jiménez
  (15, 'V-55678901', 'Víctor', 'Castro', '1983-12-25', 'M', '0426-5566778', 'victor.castro@email.com', true, 'Jefe/a de familia', 'Casado/a', 'Bachiller', 'Empleado/a'),
  (15, 'V-56789012', 'Liliana', 'Jiménez', '1986-08-03', 'F', '0426-5566778', NULL, false, 'Cónyuge', 'Casado/a', 'Técnico Superior', 'Empleado/a'),
  (15, 'V-57890123', 'Nicolás', 'Castro Jiménez', '2015-05-16', 'M', NULL, NULL, false, 'Hijo/a', 'Soltero/a', 'Primaria', 'Estudiante');

-- ──────────────────────────────────────────────
-- FORMULARIOS DE EJEMPLO
-- ──────────────────────────────────────────────

INSERT INTO formularios (titulo, descripcion, activo) VALUES
  ('Censo de Salud 2026', 'Encuesta para conocer el estado de salud general de los habitantes de la comuna.', true),
  ('Registro de Vivienda', 'Formulario para actualizar los datos de las viviendas y servicios públicos.', true),
  ('Encuesta Socioproductiva', 'Identificar emprendimientos, oficios y habilidades productivas en la comunidad.', true),
  ('Censo de Adultos Mayores', 'Registro de personas de la tercera edad para la entrega de medicamentos y atención.', true);

-- Preguntas del Censo de Salud (formulario 1)
INSERT INTO preguntas (id, formulario_id, label, tipo, requerido, opciones, orden) VALUES
  ('salud-01', 1, '¿Tiene algún problema de salud crónico?', 'radio', true, ARRAY['Sí', 'No'], 0),
  ('salud-02', 1, '¿Cuál?', 'text', false, NULL, 1),
  ('salud-03', 1, '¿Posee seguro médico?', 'select', true, ARRAY['Público', 'Privado', 'No posee'], 2),
  ('salud-04', 1, '¿Cuántas veces al año asiste al médico?', 'select', false, ARRAY['Nunca', '1-2 veces', '3-5 veces', 'Más de 5'], 3),
  ('salud-05', 1, '¿Consume algún medicamento de forma permanente?', 'radio', true, ARRAY['Sí', 'No'], 4),
  ('salud-06', 1, '¿Tiene alguna discapacidad?', 'checkbox', false, NULL, 5);

-- Preguntas del Registro de Vivienda (formulario 2)
INSERT INTO preguntas (id, formulario_id, label, tipo, requerido, opciones, orden) VALUES
  ('viv-01', 2, 'Tipo de vivienda', 'select', true, ARRAY['Casa', 'Apartamento', 'Rancho', 'Vivienda rural', 'Otro'], 0),
  ('viv-02', 2, '¿La vivienda es propia o alquilada?', 'radio', true, ARRAY['Propia', 'Alquilada', 'Cedida', 'Otro'], 1),
  ('viv-03', 2, '¿Cuántos cuartos tiene?', 'number', true, NULL, 2),
  ('viv-04', 2, '¿Tiene servicios de agua potable?', 'radio', true, ARRAY['Sí', 'No'], 3),
  ('viv-05', 2, '¿Tiene servicio eléctrico?', 'radio', true, ARRAY['Sí', 'No'], 4),
  ('viv-06', 2, 'Observaciones', 'textarea', false, NULL, 5);

-- Preguntas de Encuesta Socioproductiva (formulario 3)
INSERT INTO preguntas (id, formulario_id, label, tipo, requerido, opciones, orden) VALUES
  ('prod-01', 3, '¿Tiene algún emprendimiento o negocio propio?', 'radio', true, ARRAY['Sí', 'No'], 0),
  ('prod-02', 3, '¿Qué tipo de emprendimiento?', 'text', false, NULL, 1),
  ('prod-03', 3, '¿Cuál es su principal oficio o profesión?', 'select', false, ARRAY['Docente', 'Enfermero/a', 'Ingeniero/a', 'Abogado/a', 'Conductor/a', 'Comerciante', 'Obrero/a', 'Otro'], 2),
  ('prod-04', 3, '¿Estaría interesado/a en cursos de formación?', 'radio', true, ARRAY['Sí', 'No', 'Tal vez'], 3),
  ('prod-05', 3, '¿Qué área de formación le interesa?', 'textarea', false, NULL, 4);

-- Preguntas de Adultos Mayores (formulario 4)
INSERT INTO preguntas (id, formulario_id, label, tipo, requerido, opciones, orden) VALUES
  ('adm-01', 4, 'Nombre completo del adulto mayor', 'text', true, NULL, 0),
  ('adm-02', 4, 'Fecha de nacimiento', 'date', true, NULL, 1),
  ('adm-03', 4, '¿Vive solo/a?', 'radio', true, ARRAY['Sí', 'No'], 2),
  ('adm-04', 4, '¿Recibe pensión o ayuda económica?', 'radio', true, ARRAY['Sí', 'No'], 3),
  ('adm-05', 4, '¿Requiere algún medicamento especial?', 'text', false, NULL, 4),
  ('adm-06', 4, '¿Tiene algún familiar que lo cuide?', 'radio', true, ARRAY['Sí', 'No'], 5),
  ('adm-07', 4, 'Dirección de habitación', 'textarea', true, NULL, 6),
  ('adm-08', 4, 'Teléfono de contacto', 'text', false, NULL, 7);

-- ──────────────────────────────────────────────
-- ASIGNACIONES (formularios asignados a familias)
-- ──────────────────────────────────────────────

INSERT INTO asignaciones (formulario_id, familia_id, estado) VALUES
  (1, 1, 'completado'),
  (1, 2, 'pendiente'),
  (1, 3, 'completado'),
  (1, 4, 'en_progreso'),
  (1, 5, 'pendiente'),
  (2, 1, 'completado'),
  (2, 6, 'pendiente'),
  (2, 7, 'pendiente'),
  (2, 8, 'pendiente'),
  (3, 9, 'pendiente'),
  (3, 10, 'pendiente'),
  (3, 11, 'pendiente'),
  (4, 12, 'pendiente'),
  (4, 13, 'pendiente'),
  (4, 14, 'pendiente');

-- ──────────────────────────────────────────────
-- RESPUESTAS DE EJEMPLO
-- ──────────────────────────────────────────────

INSERT INTO respuestas (asignacion_id, respuestas) VALUES
  (1, '{"¿Tiene algún problema de salud crónico?":"Sí","¿Cuál?":"Hipertensión arterial","¿Posee seguro médico?":"Público","¿Cuántas veces al año asiste al médico?":"3-5 veces","¿Consume algún medicamento de forma permanente?":"Sí","¿Tiene alguna discapacidad?":false}'),
  (3, '{"¿Tiene algún problema de salud crónico?":"No","¿Posee seguro médico?":"No posee","¿Cuántas veces al año asiste al médico?":"1-2 veces","¿Consume algún medicamento de forma permanente?":"No","¿Tiene alguna discapacidad?":false}'),
  (6, '{"Tipo de vivienda":"Casa","¿La vivienda es propia o alquilada?":"Propia","¿Cuántos cuartos tiene?":4,"¿Tiene servicios de agua potable?":"Sí","¿Tiene servicio eléctrico?":"Sí","Observaciones":"Vivienda en buen estado"}');

-- ──────────────────────────────────────────────
-- AUDITORÍA
-- ──────────────────────────────────────────────

INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle) VALUES
  (1, 'CREAR', 'consejos_comunales', 1, '{"nombre":"Patria Querida"}'),
  (1, 'CREAR', 'consejos_comunales', 2, '{"nombre":"El Valle Resiste"}'),
  (1, 'CREAR', 'familias', 1, '{"nombre":"Familia Pérez Rodríguez"}'),
  (1, 'CREAR', 'familias', 2, '{"nombre":"Familia García Martínez"}'),
  (1, 'CREAR', 'formularios', 1, '{"titulo":"Censo de Salud 2026"}'),
  (1, 'CREAR', 'formularios', 2, '{"titulo":"Registro de Vivienda"}'),
  (1, 'CREAR', 'usuarios', 3, '{"nombre":"María Rodríguez"}'),
  (1, 'CREAR', 'usuarios', 4, '{"nombre":"Carlos Pérez"}'),
  (1, 'ASIGNAR', 'formularios', 1, '{"accion":"Asignado a Familia Pérez Rodríguez"}'),
  (1, 'RESPONDER', 'formularios', 1, '{"accion":"Formulario Censo de Salud respondido por Familia Pérez Rodríguez"}');

COMMIT;
