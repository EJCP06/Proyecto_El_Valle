const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seed() {
  console.log('Insertando datos de prueba...');
  try {
    const sqlPath = path.join(__dirname, 'db', 'seed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('Datos de prueba insertados exitosamente.');
  } catch (error) {
    console.error('Error al insertar datos de prueba:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
