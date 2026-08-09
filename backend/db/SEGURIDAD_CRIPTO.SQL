-- ============================================================
-- SEGURIDAD_CRIPTO.SQL
-- Funciones de cifrado y verificación de credenciales a nivel de BD
--
-- Usa pgcrypto y bcrypt (blowfish, prefijo $2a$), el MISMO algoritmo
-- que emplea el backend con bcryptjs. De este modo los hashes
-- generados desde SQL son verificables desde Node y viceversa.
--
-- Uso:
--   psql "postgres://usuario:clave@host:puerto/base" -f SEGURIDAD_CRIPTO.SQL
-- ============================================================

-- 1. Extensión de criptografía de PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Hash seguro de una contraseña (bcrypt con factor de coste 10)
CREATE OR REPLACE FUNCTION hash_seguro(password TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT crypt($1, gen_salt('bf', 10));
$$;

-- 3. Verificación de una contraseña contra un hash almacenado
CREATE OR REPLACE FUNCTION verificar_contrasena(password TEXT, hash_stored TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ($2 = crypt($1, $2));
$$;

-- 4. Ejemplo de uso:
--    INSERT INTO usuarios (nombre, email, password) VALUES
--      ('Prueba', 'prueba@elvalle.org', hash_seguro('MiClave123!'));
--
--    SELECT * FROM usuarios
--    WHERE email = 'prueba@elvalle.org'
--      AND verificar_contrasena('MiClave123!', password);
