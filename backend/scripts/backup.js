/**
 * RESPALDAR BASE DE DATOS
 *
 * Genera un respaldo de la base de datos completa usando pg_dump.
 *   npm run backup                -> formato custom comprimido (.dump)
 *   npm run backup -- --sql       -> SQL plano legible (.sql)
 *
 * Los respaldos se guardan en backend/backups/ con metadatos en JSON.
 */
const { crearBackup, formatoBytes } = require('../src/services/backup.service');

async function main() {
  const sqlPlano = process.argv.includes('--sql');
  try {
    console.log('Iniciando respaldo de la base de datos...');
    console.log(sqlPlano ? 'Formato: SQL plano (-Fp)' : 'Formato: custom comprimido (-Fc)');

    const meta = await crearBackup({ tipo: sqlPlano ? 'sql' : 'completo' });
    console.log(`\nRespaldo completado: ${meta.archivo}`);
    console.log(`Tamaño: ${formatoBytes(meta.tamaño_bytes)}`);
    console.log(`Metadatos: ${meta.archivo}.json`);
  } catch (error) {
    console.error('ERROR al generar el respaldo:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
