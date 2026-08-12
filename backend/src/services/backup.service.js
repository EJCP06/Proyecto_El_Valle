const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const util = require('util');
const env = require('../config/env');

const execFileAsync = util.promisify(execFile);

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
const EXT_VALIDAS = /^[\w.\- ]+\.(dump|sql)$/i;
const MAX_BUFFER = 512 * 1024 * 1024;

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

function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function asegurarDirectorio() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  return BACKUP_DIR;
}

function sanitizarArchivo(archivo) {
  if (!archivo) throw httpError('Nombre de archivo requerido', 400);
  const nombre = path.basename(String(archivo));
  if (nombre !== archivo || !EXT_VALIDAS.test(nombre)) {
    throw httpError('Nombre de archivo no válido', 400);
  }
  return nombre;
}

function rutaDe(archivo) {
  const nombre = sanitizarArchivo(archivo);
  const ruta = path.join(BACKUP_DIR, nombre);
  if (!fs.existsSync(ruta)) {
    throw httpError(`El respaldo "${nombre}" no existe`, 404);
  }
  return ruta;
}

function leerMetadatos(archivo) {
  const rutaJson = path.join(BACKUP_DIR, `${archivo}.json`);
  if (!fs.existsSync(rutaJson)) return null;
  try {
    return JSON.parse(fs.readFileSync(rutaJson, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Crea un respaldo de la base de datos.
 * tipo: 'completo' | 'estructura' | 'datos' | 'tablas' | 'sql'
 */
async function crearBackup({ tipo = 'completo', tablas = [] } = {}) {
  const dir = asegurarDirectorio();
  const base = `elvalle_${timestamp()}`;

  const esSql = tipo === 'sql';
  const ext = esSql ? 'sql' : 'dump';
  const archivo = `${base}.${ext}`;
  const ruta = path.join(dir, archivo);

  const args = [env.DATABASE_URL, '--no-password', '--file', ruta];

  if (esSql) {
    args.push('--format=plain');
  } else {
    args.push('--format=custom');
    if (tipo === 'estructura') args.push('--schema-only');
    if (tipo === 'datos') args.push('--data-only');
    if (tipo === 'tablas') {
      const lista = Array.isArray(tablas) ? tablas.filter(Boolean) : [];
      if (lista.length === 0) {
        throw httpError('Debe indicar al menos una tabla para un respaldo por tablas', 400);
      }
      for (const t of lista) args.push('--table', t);
    }
  }

  try {
    const { stdout, stderr } = await execFileAsync('pg_dump', args, {
      maxBuffer: MAX_BUFFER,
      windowsHide: true,
    });
    if (stderr && stderr.trim()) console.log(stderr.trim());
    if (stdout && stdout.trim()) console.log(stdout.trim());
  } catch (error) {
    if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
    throw httpError(error.stderr || error.message, 500);
  }

  const stats = fs.statSync(ruta);
  const metadatos = {
    archivo,
    tipo,
    formato: esSql ? 'sql' : 'custom',
    creado_en: new Date().toISOString(),
    tamaño_bytes: stats.size,
    base_datos: env.DATABASE_URL ? env.DATABASE_URL.split('@').pop() : null,
  };
  fs.writeFileSync(`${ruta}.json`, JSON.stringify(metadatos, null, 2), 'utf8');

  return { ...metadatos, tamaño_formateado: formatoBytes(stats.size) };
}

function listarBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  const archivos = fs.readdirSync(BACKUP_DIR)
    .filter((f) => /\.(dump|sql)$/i.test(f))
    .sort()
    .reverse();

  return archivos.map((archivo) => {
    const meta = leerMetadatos(archivo);
    const stats = fs.statSync(path.join(BACKUP_DIR, archivo));
    return {
      archivo,
      formato: meta?.formato ?? (archivo.endsWith('.sql') ? 'sql' : 'custom'),
      tipo: meta?.tipo ?? 'completo',
      creado_en: meta?.creado_en ?? stats.mtime.toISOString(),
      tamaño_bytes: meta?.tamaño_bytes ?? stats.size,
      tamaño_formateado: formatoBytes(meta?.tamaño_bytes ?? stats.size),
      base_datos: meta?.base_datos ?? null,
    };
  });
}

function estadisticas() {
  const backups = listarBackups();
  const hoy = new Date().toISOString().slice(0, 10);
  const tamaño_total = backups.reduce((acc, b) => acc + (b.tamaño_bytes || 0), 0);
  const porDia = backups.reduce((acc, b) => {
    const dia = (b.creado_en || '').slice(0, 10);
    if (!dia) return acc;
    acc[dia] = (acc[dia] || 0) + 1;
    return acc;
  }, {});

  return {
    total: backups.length,
    total_hoy: backups.filter((b) => (b.creado_en || '').slice(0, 10) === hoy).length,
    tamaño_total_bytes: tamaño_total,
    tamaño_total_formateado: formatoBytes(tamaño_total),
    ultimo_backup: backups[0] ?? null,
    por_dia: Object.keys(porDia).sort().reverse().map((dia) => ({ dia, cantidad: porDia[dia] })),
  };
}

/** Verifica la integridad de un respaldo. */
async function verificarBackup(archivo) {
  const ruta = rutaDe(archivo);
  const nombre = sanitizarArchivo(archivo);
  const stats = fs.statSync(ruta);
  if (stats.size === 0) {
    return { archivo: nombre, valido: false, mensaje: 'El archivo está vacío' };
  }

  if (nombre.endsWith('.dump')) {
    try {
      const { stdout } = await execFileAsync('pg_restore', ['-l', ruta], {
        maxBuffer: 64 * 1024 * 1024,
        windowsHide: true,
      });
      const lineas = stdout.split('\n').filter((l) => l.trim() && !/^;/.test(l));
      return {
        archivo: nombre,
        valido: true,
        formato: 'custom',
        objetos: lineas.length,
        mensaje: `Respaldo válido (${lineas.length} objetos en el índice)`,
      };
    } catch (error) {
      return {
        archivo: nombre,
        valido: false,
        formato: 'custom',
        mensaje: (error.stderr || error.message).trim().slice(0, 500),
      };
    }
  }

  try {
    const buffer = fs.readFileSync(ruta, { encoding: 'utf8', flag: 'r' });
    if (buffer.trim().length === 0) {
      return { archivo: nombre, valido: false, formato: 'sql', mensaje: 'El archivo SQL está vacío' };
    }
    const encabezado = buffer.slice(0, 2000);
    const marcasOk =
      encabezado.includes('PostgreSQL database dump') ||
      encabezado.includes('CREATE TABLE') ||
      encabezado.includes('CREATE DATABASE');
    return {
      archivo: nombre,
      valido: marcasOk,
      formato: 'sql',
      mensaje: marcasOk
        ? 'Respaldo SQL válido (contiene encabezados de dump)'
        : 'El archivo SQL no parece un dump de PostgreSQL',
    };
  } catch (error) {
    return { archivo: nombre, valido: false, formato: 'sql', mensaje: error.message };
  }
}

function eliminarBackup(archivo) {
  const ruta = rutaDe(archivo);
  const rutaJson = `${ruta}.json`;
  fs.unlinkSync(ruta);
  if (fs.existsSync(rutaJson)) fs.unlinkSync(rutaJson);
  return { archivo: sanitizarArchivo(archivo), eliminado: true };
}

function descargarBackup(res, archivo) {
  const ruta = rutaDe(archivo);
  res.download(ruta, sanitizarArchivo(archivo));
}

function opcionesRestore({ limpiar = false, recrear = false, tablas = [] } = {}) {
  const opciones = ['--no-owner', '--no-privileges'];
  if (limpiar) opciones.push('--clean');
  if (recrear) opciones.push('--create');
  const lista = Array.isArray(tablas) ? tablas.filter(Boolean) : [];
  for (const t of lista) opciones.push('--table', t);
  return opciones;
}

/** Restaura desde un respaldo guardado en backend/backups/. */
async function restaurarBackup({ archivo, limpiar = false, recrear = false, tablas = [] } = {}) {
  const ruta = rutaDe(archivo);
  const nombre = sanitizarArchivo(archivo);

  if (nombre.endsWith('.dump')) {
    const args = [...opcionesRestore({ limpiar, recrear, tablas }), '-d', env.DATABASE_URL, ruta];
    const resultado = await ejecutarRestore('pg_restore', args);
    return { archivo: nombre, ...resultado };
  }

  if (limpiar || recrear || (Array.isArray(tablas) && tablas.length)) {
    throw httpError(
      'Las opciones limpiar/recrear/tablas específicas solo aplican a respaldos .dump (pg_restore). Para .sql se restaura completo.',
      400
    );
  }
  const resultado = await ejecutarRestore('psql', [env.DATABASE_URL, '-f', ruta]);
  return { archivo: nombre, ...resultado };
}

/** Restaura desde un archivo subido por HTTP (multipart). */
async function restaurarArchivoSubido({ rutaArchivo, archivoOriginal, limpiar = false, recrear = false, tablas = [] } = {}) {
  if (!rutaArchivo || !fs.existsSync(rutaArchivo)) {
    throw httpError('Archivo subido no encontrado', 400);
  }
  const nombre = sanitizarArchivo(archivoOriginal);

  try {
    if (nombre.endsWith('.dump')) {
      const args = [...opcionesRestore({ limpiar, recrear, tablas }), '-d', env.DATABASE_URL, rutaArchivo];
      const resultado = await ejecutarRestore('pg_restore', args);
      return { archivo: nombre, ...resultado };
    }

    if (limpiar || recrear || (Array.isArray(tablas) && tablas.length)) {
      throw httpError(
        'Las opciones limpiar/recrear/tablas específicas solo aplican a respaldos .dump (pg_restore). Para .sql se restaura completo.',
        400
      );
    }
    const resultado = await ejecutarRestore('psql', [env.DATABASE_URL, '-f', rutaArchivo]);
    return { archivo: nombre, ...resultado };
  } finally {
    try {
      if (rutaArchivo && fs.existsSync(rutaArchivo) && rutaArchivo.startsWith(os.tmpdir())) {
        fs.unlinkSync(rutaArchivo);
      }
    } catch {
      // ignorar fallo de limpieza temporal
    }
  }
}

async function ejecutarRestore(herramienta, args) {
  try {
    const { stdout, stderr } = await execFileAsync(herramienta, args, {
      maxBuffer: MAX_BUFFER,
      windowsHide: true,
    });
    const salida = [stdout, stderr].filter(Boolean).join('\n').trim();
    return { exito: true, mensaje: 'Restauración completada', salida: salida.slice(0, 2000) };
  } catch (error) {
    throw httpError((error.stderr || error.message).slice(0, 2000), 500);
  }
}

module.exports = {
  BACKUP_DIR,
  crearBackup,
  listarBackups,
  estadisticas,
  verificarBackup,
  eliminarBackup,
  descargarBackup,
  restaurarBackup,
  restaurarArchivoSubido,
  sanitizarArchivo,
  formatoBytes,
};
