const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const DIR_DB = path.join(__dirname, 'db');

/**
 * Orden de aplicación. `init.sql` va primero porque crea el esquema base;
 * el resto solo agrega columnas, tablas, índices y funciones sobre ese
 * esquema, y todas son idempotentes (IF NOT EXISTS / ON CONFLICT).
 */
const MIGRACIONES = [
  { nombre: 'init', archivo: 'init.sql' },
  { nombre: 'add_reset_token', archivo: 'migration_add_reset_token.sql' },
  { nombre: 'add_telegram_chat_id', archivo: 'migration_add_telegram_chat_id.sql' },
  { nombre: 'add_recuperacion_clave', archivo: 'migration_add_recuperacion_clave.sql' },
  { nombre: 'add_cat_preguntas_seguridad', archivo: 'migration_add_cat_preguntas_seguridad.sql' },
  { nombre: 'add_preguntas_seguridad', archivo: 'migration_add_preguntas_seguridad.sql' },
  { nombre: 'add_sesiones_usuario', archivo: 'migration_add_sesiones_usuario.sql' },
  { nombre: 'add_telegram_pending_links', archivo: 'migration_add_telegram_pending_links.sql' },
  { nombre: 'add_alcance_miembro', archivo: 'migration_add_alcance_miembro.sql' },
  { nombre: 'modelo_comunidad_v1', archivo: 'migration_modelo_comunidad_v1.sql' },
  { nombre: 'permisos_v1', archivo: 'migration_permisos_v1.sql' },
  { nombre: 'reportes_v2', archivo: 'migration_reportes_v2.sql' }
];

async function asegurarRegistro() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre     VARCHAR(150) PRIMARY KEY,
      aplicada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function migracionesAplicadas() {
  const res = await pool.query('SELECT nombre FROM schema_migrations');
  return new Set(res.rows.map((r) => r.nombre));
}

/**
 * Pasos previos que no son migraciones sino limpieza de un estado
 * inconsistente dejado por versiones anteriores del script.
 */
async function ajustesPrevios() {
  // El CHECK original no incluía 'vocero'; las instalaciones viejas
  // quedaron con el constraint viejo o directamente sin él.
  await pool.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check');

  await pool.query(`
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check
    CHECK (rol IN ('admin', 'vocero'))
  `);

  for (const col of ['parentesco', 'estado_civil', 'nivel_educativo', 'ocupacion']) {
    await pool.query(
      `ALTER TABLE miembros ADD COLUMN IF NOT EXISTS ${col} VARCHAR(100)`
    );
  }

  await pool.query(`
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(64)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_usuarios_telegram_chat_id
    ON usuarios(telegram_chat_id)
  `);
  await pool.query(`
    ALTER TABLE recuperacion_clave ADD COLUMN IF NOT EXISTS canal VARCHAR(16) DEFAULT 'email'
  `);

  // La sesión única es obligatoria: al iniciar sesión se revocan las demás.
  await pool.query(`
    INSERT INTO configuracion (clave, valor)
    VALUES ('REQUIERIR_SESION_UNICA', 'true')
    ON CONFLICT (clave) DO UPDATE SET valor = 'true'
  `);
}

async function migrate() {
  console.log('Iniciando migración de base de datos...');

  try {
    await asegurarRegistro();

    const aplicadas = await migracionesAplicadas();

    for (const migracion of MIGRACIONES) {
      if (aplicadas.has(migracion.nombre)) {
        console.log(`  · ${migracion.nombre} (ya aplicada)`);
        continue;
      }

      const ruta = path.join(DIR_DB, migracion.archivo);
      if (!fs.existsSync(ruta)) {
        throw new Error(`No se encontró el archivo de migración: ${migracion.archivo}`);
      }

      const sql = fs.readFileSync(ruta, 'utf8');
      await pool.query(sql);

      await pool.query(
        'INSERT INTO schema_migrations (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING',
        [migracion.nombre]
      );

      console.log(`  ✓ ${migracion.nombre}`);
    }

// Los ajustes previos se ejecutan al final: tocan tablas que todavía no
    // existen mientras `init.sql` no se haya aplicado, así que en una base
    // nueva solo son posibles una vez corridas las migraciones.
    await ajustesPrevios();

    console.log('Migración completada exitosamente.');
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
