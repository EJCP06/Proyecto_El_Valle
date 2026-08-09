/**
 * RESPALDAR BASE DE DATOS
 *
 * Genera un respaldo de la base de datos completa usando pg_dump.
 *   npm run backup                -> formato custom comprimido (.dump)
 *   npm run backup -- --sql       -> SQL plano legible (.sql)
 *
 * Los respaldos se guardan en backend/backups/ con metadatos en JSON.
 */
require('dotenv').config();
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execFileAsync = util.promisify(execFile);

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no está definida en backend/.env');
  process.exit(1);
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function formatoBytes(bytes) {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

async function main() {
  const sqlPlano = process.argv.includes('--sql');
  const ext = sqlPlano ? 'sql' : 'dump';
  const base = `elvalle_${timestamp()}`;
  const archivo = `${base}.${ext}`;
  const ruta = path.join(BACKUP_DIR, archivo);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const args = [DATABASE_URL, '--no-password', '--file', ruta];
  if (sqlPlano) {
    args.push('--format=plain');
  } else {
    args.push('--format=custom');
  }

  console.log(`Iniciando respaldo de la base de datos...`);
  console.log(sqlPlano ? 'Formato: SQL plano (-Fp)' : 'Formato: custom comprimido (-Fc)');

  try {
    const { stdout, stderr } = await execFileAsync('pg_dump', args, {
      maxBuffer: 512 * 1024 * 1024,
      windowsHide: true
    });
    if (stderr && stderr.trim()) console.log(stderr.trim());
    if (stdout && stdout.trim()) console.log(stdout.trim());
  } catch (error) {
    console.error('ERROR al generar el respaldo:');
    console.error(error.stderr || error.message);
    if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
    process.exit(1);
  }

  const stats = fs.statSync(ruta);
  const metadatos = {
    archivo,
    formato: sqlPlano ? 'sql' : 'custom',
    creado_en: new Date().toISOString(),
    tamaño_bytes: stats.size,
    base_datos: DATABASE_URL.split('@').pop()
  };
  fs.writeFileSync(`${ruta}.json`, JSON.stringify(metadatos, null, 2), 'utf8');

  console.log(`\nRespaldo completado: ${ruta}`);
  console.log(`Tamaño: ${formatoBytes(stats.size)}`);
  console.log(`Metadatos: ${ruta}.json`);
}

main();
