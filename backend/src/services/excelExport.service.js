const ExcelJS = require('exceljs');

const AZUL = 'FF1D4ED8';
const GRIS = 'FF64748B';

function anchoPorTexto(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return Math.min(Math.max(texto.length + 2, 10), 45);
}

/**
 * Genera un .xlsx con el resultado de una consulta.
 *
 * El archivo lleva una cabecera con los criterios aplicados: así el
 * reporte entregado a la alcaldía documenta exactamente qué se consultó,
 * en lugar de ser una tabla de números sin contexto.
 *
 * @param {object} resultado Salida de consulta.service.ejecutarParaExportar
 * @param {object} contexto  { nombreSistema, usuario }
 * @returns {Promise<Buffer>}
 */
async function generarExcel(resultado, contexto = {}) {
  const libro = new ExcelJS.Workbook();
  libro.creator = contexto.nombreSistema || 'El Valle';
  libro.created = new Date();

  const hoja = libro.addWorksheet(recortar(resultado.label, 31), {
    views: [{ state: 'frozen', ySplit: 6 }]
  });

  hoja.mergeCells('A1:D1');
  const titulo = hoja.getCell('A1');
  titulo.value = resultado.label.toUpperCase();
  titulo.font = { size: 14, bold: true, color: { argb: AZUL } };
  titulo.alignment = { vertical: 'middle' };
  hoja.getRow(1).height = 24;

  hoja.mergeCells('A2:D2');
  const sistema = hoja.getCell('A2');
  sistema.value = contexto.nombreSistema || 'El Valle — Gestión Comunal';
  sistema.font = { size: 10, bold: true, color: { argb: GRIS } };

  const criterios = (resultado.criterios && resultado.criterios.length > 0)
    ? resultado.criterios.join('  ·  ')
    : 'Sin filtros aplicados (todas las familias a las que tiene acceso)';

  hoja.mergeCells('A3:D3');
  const celdaCriterios = hoja.getCell('A3');
  celdaCriterios.value = `Criterios: ${criterios}`;
  celdaCriterios.font = { size: 10, color: { argb: GRIS } };

  hoja.mergeCells('A4:D4');
  const celdaGenerado = hoja.getCell('A4');
  celdaGenerado.value = `Generado: ${formatearFecha(new Date())} · Por: ${contexto.usuario || 'sistema'}`;
  celdaGenerado.font = { size: 10, color: { argb: GRIS } };

  if (resultado.columnas.length === 0) {
    hoja.getCell('A6').value = 'Esta consulta no devuelve detalle, solo indicadores resumidos.';
    hoja.getCell('A6').font = { italic: true, color: { argb: GRIS } };
    agregarResumen(libro, resultado);
    return libro.xlsx.writeBuffer();
  }

  const filaHeader = hoja.getRow(6);
  resultado.columnas.forEach((columna, indice) => {
    const celda = filaHeader.getCell(indice + 1);
    celda.value = columna.label;
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
    celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  filaHeader.height = 22;

  resultado.filas.forEach((fila) => {
    const valores = resultado.columnas.map((columna) => normalizar(fila[columna.key]));
    const nuevaFila = hoja.addRow(valores);
    nuevaFila.eachCell((celda) => {
      celda.alignment = { vertical: 'middle' };
    });
  });

  hoja.autoFilter = {
    from: { row: 6, column: 1 },
    to: { row: 6, column: resultado.columnas.length }
  };

  // Ancho de columna proporcional al contenido más largo.
  resultado.columnas.forEach((columna, indice) => {
    const largos = resultado.filas
      .slice(0, 500)
      .map((fila) => anchoPorTexto(fila[columna.key]));
    hoja.getColumn(indice + 1).width = Math.min(
      Math.max(anchoPorTexto(columna.label), ...largos, 12),
      45
    );
  });

  const totalFila = hoja.addRow([
    ...resultado.columnas.map((c, i) => (i === 0 ? `TOTAL: ${resultado.filas.length}` : null))
  ]);
  totalFila.eachCell((celda) => {
    celda.font = { bold: true };
    celda.border = { top: { style: 'thin' } };
  });

  agregarResumen(libro, resultado);

  return libro.xlsx.writeBuffer();
}

function agregarResumen(libro, resultado) {
  if (!resultado.resumen || resultado.resumen.length === 0) return;

  const hoja = libro.addWorksheet('Resumen');
  hoja.columns = [
    { header: 'Indicador', key: 'etiqueta', width: 34 },
    { header: 'Detalle', key: 'valor', width: 22 }
  ];

  hoja.getRow(1).eachCell((celda) => {
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
  });

  for (const fila of resultado.resumen) {
    for (const [clave, valor] of Object.entries(fila)) {
      hoja.addRow({ etiqueta: clave, valor: normalizar(valor) });
    }
    hoja.addRow({});
  }
}

function normalizar(valor) {
  if (valor === null || valor === undefined) return '';
  if (valor instanceof Date) return formatearFecha(valor);
  return valor;
}

function recortar(texto, maximo) {
  return texto.length > maximo ? texto.slice(0, maximo) : texto;
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Nombre de archivo seguro: `reporte-personas-2026-10-15.xlsx` */
function nombreArchivo(slug, extension) {
  const fecha = new Date().toISOString().slice(0, 10);
  return `reporte-${slug}-${fecha}.${extension}`;
}

module.exports = { generarExcel, nombreArchivo };
