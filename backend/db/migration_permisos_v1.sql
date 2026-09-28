-- ============================================================
-- Proyecto El Valle
-- Migración: Modelo de permisos funcionales v1
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Catálogo de permisos
-- ============================================================

CREATE TABLE IF NOT EXISTS permisos (
    id SERIAL PRIMARY KEY,
    modulo VARCHAR(100) NOT NULL,
    accion VARCHAR(20) NOT NULL,
    descripcion VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_permisos_modulo_accion
        UNIQUE (modulo, accion),

    CONSTRAINT chk_permisos_accion
        CHECK (accion IN ('ver', 'crear', 'editar', 'eliminar'))
);


-- ============================================================
-- 2. Permisos asignados a usuarios
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios_permisos (
    usuario_id INTEGER NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    permiso_id INTEGER NOT NULL
        REFERENCES permisos(id)
        ON DELETE CASCADE,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (usuario_id, permiso_id)
);


-- ============================================================
-- 3. Índices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_permisos_usuario
    ON usuarios_permisos(usuario_id, activo);

CREATE INDEX IF NOT EXISTS idx_usuarios_permisos_permiso
    ON usuarios_permisos(permiso_id, activo);

CREATE INDEX IF NOT EXISTS idx_permisos_modulo
    ON permisos(modulo, activo);


-- ============================================================
-- 4. Catálogo inicial de módulos
-- ============================================================

INSERT INTO permisos (modulo, accion, descripcion)
VALUES

    -- Dashboard
    ('dashboard', 'ver', 'Ver el panel principal'),

    -- Consejos
    ('consejos', 'ver', 'Consultar consejos comunales'),
    ('consejos', 'crear', 'Crear consejos comunales'),
    ('consejos', 'editar', 'Editar consejos comunales'),
    ('consejos', 'eliminar', 'Eliminar consejos comunales'),

    -- Familias
    ('familias', 'ver', 'Consultar familias'),
    ('familias', 'crear', 'Crear familias'),
    ('familias', 'editar', 'Editar familias'),
    ('familias', 'eliminar', 'Eliminar familias'),

    -- Miembros
    ('miembros', 'ver', 'Consultar miembros de familias'),
    ('miembros', 'crear', 'Crear miembros'),
    ('miembros', 'editar', 'Editar miembros'),
    ('miembros', 'eliminar', 'Eliminar miembros'),

    -- Formularios
    ('formularios', 'ver', 'Consultar formularios'),
    ('formularios', 'crear', 'Crear formularios'),
    ('formularios', 'editar', 'Editar formularios'),
    ('formularios', 'eliminar', 'Eliminar formularios'),

    -- Reportes
    ('reportes', 'ver', 'Consultar reportes'),

    -- Catálogos
    ('catalogos', 'ver', 'Consultar catálogos'),
    ('catalogos', 'crear', 'Crear elementos de catálogo'),
    ('catalogos', 'editar', 'Editar elementos de catálogo'),
    ('catalogos', 'eliminar', 'Eliminar elementos de catálogo'),

    -- Usuarios
    ('usuarios', 'ver', 'Consultar usuarios'),
    ('usuarios', 'crear', 'Crear usuarios'),
    ('usuarios', 'editar', 'Editar usuarios'),
    ('usuarios', 'eliminar', 'Eliminar usuarios'),

    -- Auditoría
    ('auditoria', 'ver', 'Consultar auditoría'),

    -- Configuración
    ('configuracion', 'ver', 'Consultar configuración'),
    ('configuracion', 'editar', 'Modificar configuración'),

    -- Backup
    ('backup', 'ver', 'Consultar respaldos'),
    ('backup', 'crear', 'Crear respaldos'),
    ('backup', 'eliminar', 'Eliminar respaldos')

ON CONFLICT (modulo, accion) DO NOTHING;


-- ============================================================
-- 5. Permisos iniciales del usuario vocero
-- ============================================================

INSERT INTO usuarios_permisos (usuario_id, permiso_id, activo)
SELECT
    u.id,
    p.id,
    TRUE
FROM usuarios u
INNER JOIN permisos p
    ON (
        (p.modulo = 'dashboard' AND p.accion = 'ver')
        OR
        (p.modulo = 'consejos' AND p.accion = 'ver')
        OR
        (p.modulo = 'familias' AND p.accion IN ('ver', 'crear', 'editar'))
        OR
        (p.modulo = 'miembros' AND p.accion IN ('ver', 'crear', 'editar'))
        OR
        (p.modulo = 'formularios' AND p.accion = 'ver')
        OR
        (p.modulo = 'reportes' AND p.accion = 'ver')
    )
WHERE u.email = 'vocero@elvalle.com'
ON CONFLICT (usuario_id, permiso_id)
DO UPDATE SET activo = TRUE;


-- ============================================================
-- 6. Función auxiliar para validar acceso funcional
--
-- Devuelve TRUE si:
--   - el usuario es admin
--   - o posee el permiso activo solicitado.
-- ============================================================

CREATE OR REPLACE FUNCTION usuario_tiene_permiso(
    p_usuario_id INTEGER,
    p_modulo VARCHAR,
    p_accion VARCHAR
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM usuarios u
        WHERE u.id = p_usuario_id
          AND u.activo = TRUE
          AND (
              u.rol = 'admin'
              OR EXISTS (
                  SELECT 1
                  FROM usuarios_permisos up
                  INNER JOIN permisos p
                      ON p.id = up.permiso_id
                  WHERE up.usuario_id = u.id
                    AND up.activo = TRUE
                    AND p.activo = TRUE
                    AND p.modulo = p_modulo
                    AND p.accion = p_accion
              )
          )
    );
$$;


-- ============================================================
-- 7. Función auxiliar para consultar permisos de un usuario
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_permisos_usuario(
    p_usuario_id INTEGER
)
RETURNS TABLE (
    modulo VARCHAR,
    accion VARCHAR
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        p.modulo,
        p.accion
    FROM usuarios_permisos up
    INNER JOIN permisos p
        ON p.id = up.permiso_id
    INNER JOIN usuarios u
        ON u.id = up.usuario_id
    WHERE up.usuario_id = p_usuario_id
      AND up.activo = TRUE
      AND p.activo = TRUE
      AND u.activo = TRUE
    ORDER BY p.modulo, p.accion;
$$;


COMMIT;