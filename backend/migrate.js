const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  console.log('Iniciando migración de base de datos...');
  try {
    // 1. Eliminar CHECK constraint viejo ANTES de hacer seed (permite 'vocero')
    await pool.query(`
      ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
    `);

    // 2. Ejecutar schema completo (CREATE TABLE IF NOT EXISTS + seeds)
    const sqlPath = path.join(__dirname, 'db', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);

    // 3. Agregar el CHECK constraint actualizado
    await pool.query(`
      ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin', 'vocero'));
    `);

    // 4. Agregar columnas nuevas de miembros si no existen (BD preexistente)
    for (const col of ['parentesco', 'estado_civil', 'nivel_educativo', 'ocupacion']) {
      await pool.query(`
        ALTER TABLE miembros ADD COLUMN IF NOT EXISTS ${col} VARCHAR(100);
      `);
    }

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
