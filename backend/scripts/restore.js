/**
 * RECUPERAR BASE DE DATOS
 *
 * Restaura la base de datos desde un respaldo de backend/backups/.
 *   npm run restore                    -> lista los respaldos disponibles
 *   npm run restore -- elvalle_....dump  -> restaura con pg_restore
 *   npm run restore -- elvalle_....sql   -> restaura con psql -f
 *   npm run restore -- elvalle_....dump --list  -> contenido del respaldo
 *   npm run restore -- elvalle_....dump --yes   -> sin confirmación
 */
require('dotenv').config();
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const util = require('util');

const execFileAsync = util.promisify(execFile);

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no está definida en backend/.env');
  process.exit(1);
}

function listarRespaldo(archivo) {
  const ruta = path.join(BACKUP_DIR, archivo);
  return new Promise((resolve, reject) => {
    const args = ['-l', ruta];
    execFile('pg_restore', args, { maxBuffer: 64 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          if (stderr && stderr.includes('not a valid archive')) {
            reject(new Error('No es un respaldo custom (-Fc). Usa la lista normal si es .sql.'));
          } else {
            reject(new Error(stderr || error.message));
          }
          return;
        }
        resolve(stdout);
      });
  });
}

function pedirConfirmacion(pregunta) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(pregunta, (respuesta) => {
      rl.close();
      resolve(respuesta.trim().toLowerCase());
    });
  });
}

async function main() {
  const archivo = process.argv.slice(2).find((a) => !a.startsWith('--'));
  const soloLista = process.argv.includes('--list');
  const sinConfirmar = process.argv.includes('--yes');

  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('No existe la carpeta de respaldos (backend/backups/). Genera uno con: npm run backup');
    process.exit(1);
  }

  const disponibles = fs.readdirSync(BACKUP_DIR)
    .filter((f) => /\.(dump|sql)$/.test(f))
    .sort()
    .reverse();

  if (!archivo) {
    console.log('Respaldos disponibles en backend/backups/:');
    if (disponibles.length === 0) {
      console.log('  (ninguno)');
    } else {
      for (const f of disponibles) {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        console.log(`  ${f}  (${stats.size} bytes)`);
      }
    }
    console.log('\nUso: npm run restore -- <archivo> [--yes] [--list]');
    return;
  }

  const ruta = path.join(BACKUP_DIR, archivo);
  if (!fs.existsSync(ruta)) {
    console.error(`ERROR: no existe ${ruta}`);
    process.exit(1);
  }

  if (soloLista) {
    try {
      const contenido = await listarRespaldo(archivo);
      console.log(`Contenido de ${archivo}:`);
      console.log(contenido);
    } catch (error) {
      console.error('ERROR:', error.message);
      process.exit(1);
    }
    return;
  }

  if (!sinConfirmar) {
    const ok = await pedirConfirmacion(
      `¿Restaurar la base de datos desde ${archivo}? Esto sobrescribirá objetos existentes. [s/N]: `
    );
    if (ok !== 's' && ok !== 'si' && ok !== 'y' && ok !== 'yes') {
      console.log('Restauración cancelada.');
      return;
    }
  }

  console.log(`Restaurando ${archivo}...`);
  try {
    let resultado;
    if (archivo.endsWith('.dump')) {
      resultado = await execFileAsync('pg_restore', ['--no-owner', '--no-privileges', '-d', DATABASE_URL, ruta], {
        maxBuffer: 512 * 1024 * 1024,
        windowsHide: true
      });
    } else {
      resultado = await execFileAsync('psql', [DATABASE_URL, '-f', ruta], {
        maxBuffer: 512 * 1024 * 1024,
        windowsHide: true
      });
    }
    if (resultado.stderr && resultado.stderr.trim()) console.log(resultado.stderr.trim());
    if (resultado.stdout && resultado.stdout.trim()) console.log(resultado.stdout.trim());
    console.log('\nRestauración completada.');
  } catch (error) {
    console.error('ERROR durante la restauración:');
    console.error(error.stderr || error.message);
    process.exit(1);
  }
}

main();
