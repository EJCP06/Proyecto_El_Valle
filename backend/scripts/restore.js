/**
 * RECUPERAR BASE DE DATOS
 *
 * Restaura la base de datos desde un respaldo de backend/backups/.
 *   npm run restore                          -> lista los respaldos disponibles
 *   npm run restore -- elvalle_....dump      -> restaura con pg_restore
 *   npm run restore -- elvalle_....sql       -> restaura con psql -f
 *   npm run restore -- elvalle_....dump --list -> contenido del respaldo
 *   npm run restore -- elvalle_....dump --yes  -> sin confirmación
 */
const readline = require('readline');
const { listarBackups, verificarBackup, restaurarBackup } = require('../src/services/backup.service');

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

  const disponibles = listarBackups();

  if (!archivo) {
    console.log('Respaldos disponibles en backend/backups/:');
    if (disponibles.length === 0) {
      console.log('  (ninguno)');
    } else {
      for (const b of disponibles) {
        console.log(`  ${b.archivo}  (${b.tamaño_bytes} bytes)`);
      }
    }
    console.log('\nUso: npm run restore -- <archivo> [--yes] [--list]');
    return;
  }

  if (!disponibles.some((b) => b.archivo === archivo)) {
    console.error(`ERROR: no existe el respaldo "${archivo}" en backend/backups/`);
    process.exit(1);
  }

  if (soloLista) {
    try {
      const resultado = await verificarBackup(archivo);
      if (!resultado.valido) {
        console.error('ERROR:', resultado.mensaje);
        process.exit(1);
      }
      console.log(`Contenido de ${archivo}:`);
      console.log(`${resultado.objetos ?? 'N/A'} objetos en el índice`);
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
    const resultado = await restaurarBackup({ archivo });
    console.log(resultado.salida || '');
    console.log(`\n${resultado.mensaje}`);
  } catch (error) {
    console.error('ERROR durante la restauración:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
