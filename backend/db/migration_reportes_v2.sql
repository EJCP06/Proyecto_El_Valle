-- ============================================================
-- Proyecto El Valle
-- Migración: Módulo de consultas y reportes v2
--
--   1. Habilita el permiso funcional `exportar` en el catálogo.
--   2. Concede ese permiso a los voceros (responder solicitudes de
--      la alcaldía y del gobierno es parte de su función).
--   3. Agrega la bandera que controla la exposición de datos personales
--      sensibles (cédula, teléfono, correo) en los reportes.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Ampliar las acciones válidas del catálogo de permisos
-- ------------------------------------------------------------
ALTER TABLE permisos DROP CONSTRAINT IF EXISTS chk_permisos_accion;

ALTER TABLE permisos
  ADD CONSTRAINT chk_permisos_accion
  CHECK (accion IN ('ver', 'crear', 'editar', 'eliminar', 'exportar'));

INSERT INTO permisos (modulo, accion, descripcion)
VALUES ('reportes', 'exportar', 'Descargar reportes en Excel o PDF')
ON CONFLICT (modulo, accion) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Permiso para los voceros
--    Los voceros participan del consejo: son quienes atienden las
--    solicitudes de información de la alcaldía y del gobierno, así
--    que deben poder exportar los reportes de sus comunidades.
-- ------------------------------------------------------------
INSERT INTO usuarios_permisos (usuario_id, permiso_id, activo)
SELECT u.id, p.id, TRUE
FROM usuarios u
CROSS JOIN permisos p
WHERE u.rol = 'vocero'
  AND u.activo = TRUE
  AND p.modulo = 'reportes'
  AND p.accion = 'exportar'
  AND p.activo = TRUE
ON CONFLICT (usuario_id, permiso_id)
DO UPDATE SET activo = TRUE;

-- ------------------------------------------------------------
-- 3. Exposición de datos personales sensibles en reportes
-- ------------------------------------------------------------
INSERT INTO configuracion (clave, valor, descripcion)
VALUES (
  'MOSTRAR_DATOS_SENSIBLES_EN_REPORTES',
  'true',
  'Si es false, los reportes ocultan cédula, teléfono y correo, aunque se soliciten como columna'
)
ON CONFLICT (clave) DO UPDATE
  SET descripcion = EXCLUDED.descripcion;

COMMIT;
