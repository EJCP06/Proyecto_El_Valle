const PDFDocument = require('pdfkit');

const MARGEN = 40;
const FUENTE_TITULO = 15;
const FUENTE_SUBTITULO = 9;
const FUENTE_TABLA = 8;
const ALTO_FILA = 16;

const GRIS = '#64748b';
const GRIS_LINEA = '#cbd5e1';
/**
 * Genera un PDF con el resultado de una consulta.
 *
 * Cuando hay muchas columnas se usa orientación horizontal para que la
 * tabla quepa legible en una hoja, que es como la galería de la alcaldía
 * suele revisar la información.
 *
 * @param {object} resultado Salida de consulta.service.ejecutarParaExportar
 * @param {object} contexto  { nombreSistema, usuario }
 * @returns {Promise<Buffer>}
 */
function generarPdf(resultado, contexto = {}) {
  return new Promise((resolve, reject) => {
    const columnas = resultado.columnas;
    const orientacion = columnas.length > 6 ? 'landscape' : 'portrait';

    const doc = new PDFDocument({
      size: 'LETTER',
      layout: orientacion,
      margin: MARGEN,
      autoFirstPage: true,
      info: {
        Title: `${resultado.label} — ${contexto.nombreSistema || 'El Valle'}`,
        Author: contexto.nombreSistema || 'El Valle',
        Subject: resultado.descripcion || ''
      }
    });

    const trozos = [];
    doc.on('data', (trozo) => trozos.push(trozo));
    doc.on('end', () => resolve(Buffer.concat(trozos)));
    doc.on('error', reject);

    const anchoUtil = doc.page.width - MARGEN * 2;

    escribirCabecera(doc, resultado, contexto, anchoUtil);

    if (columnas.length === 0) {
      doc.moveDown(2);
      doc.fontSize(9).fillColor(GRIS)
        .text('Esta consulta devuelve indicadores resumidos, sin listado de personas.');
      escribirResumen(doc, resultado, anchoUtil);
    } else {
      const anchos = calcularAnchos(columnas, resultado.filas, anchoUtil);
      escribirTabla(doc, resultado, anchos, anchoUtil);
    }

    escribirPie(doc, contexto);

    doc.end();
  });
}

function escribirCabecera(doc, resultado, contexto, anchoUtil) {
  doc.fontSize(FUENTE_TITULO).fillColor('#0f172a').font('Helvetica-Bold')
    .text(resultado.label.toUpperCase(), { align: 'left' });

  doc.moveDown(0.2);
  doc.fontSize(FUENTE_SUBTITULO).font('Helvetica').fillColor(GRIS)
    .text(contexto.nombreSistema || 'El Valle — Gestión Comunal');

  const criterios = (resultado.criterios && resultado.criterios.length > 0)
    ? resultado.criterios.join('  ·  ')
    : 'Sin filtros aplicados';

  doc.text(`Criterios: ${criterios}`, { width: anchoUtil });
  doc.text(
    `Generado: ${new Date().toLocaleString('es-VE')}  ·  Registrado por: ${contexto.usuario || 'sistema'}`,
    { width: anchoUtil }
  );

  doc.moveDown(0.4);
  doc.moveTo(MARGEN, doc.y)
    .lineTo(MARGEN + anchoUtil, doc.y)
    .lineWidth(0.5)
    .strokeColor(GRIS_LINEA)
    .stroke();
  doc.moveDown(0.6);
}

/** Distribuye el ancho disponible según el contenido de cada columna. */
function calcularAnchos(columnas, filas, anchoUtil) {
  const pesos = columnas.map((columna, indice) => {
    let maximo = String(columna.label).length;
    for (const fila of filas.slice(0, 400)) {
      const largo = textoCelda(fila[columna.key]).length;
      if (largo > maximo) maximo = largo;
    }
    return Math.min(Math.max(maximo, 6), 32);
  });

  const total = pesos.reduce((a, b) => a + b, 0);

  return pesos.map((peso) => (peso / total) * anchoUtil);
}

function escribirTabla(doc, resultado, anchos, anchoUtil) {
  const { columnas, filas } = resultado;

  // Cabecera de la tabla, con salto de página si no queda espacio.
  const dibujarHeader = () => {
    const y = doc.y;
    doc.rect(MARGEN, y, anchoUtil, ALTO_FILA).fill('#1d4ed8');
    let x = MARGEN;
    columnas.forEach((columna, indice) => {
      doc.fontSize(FUENTE_TABLA).font('Helvetica-Bold').fillColor('#ffffff')
        .text(recortar(columna.label, anchos[indice] / 4.6), x + 3, y + 4, {
          width: anchos[indice] - 6,
          ellipsis: true,
          lineBreak: false
        });
      x += anchos[indice];
    });
    doc.y = y + ALTO_FILA;
  };

  dibujarHeader();

  filas.forEach((fila, indiceFila) => {
    if (doc.y > doc.page.height - MARGEN - ALTO_FILA - 20) {
      doc.addPage();
      dibujarHeader();
    }

    const y = doc.y;
    if (indiceFila % 2 === 1) {
      doc.rect(MARGEN, y, anchoUtil, ALTO_FILA).fill('#f8fafc');
    }

    let x = MARGEN;
    columnas.forEach((columna, indice) => {
      doc.fontSize(FUENTE_TABLA).font('Helvetica').fillColor('#0f172a')
        .text(textoCelda(fila[columna.key]), x + 3, y + 4, {
          width: anchos[indice] - 6,
          ellipsis: true,
          lineBreak: false
        });
      x += anchos[indice];
    });

    doc.moveTo(MARGEN, y + ALTO_FILA)
      .lineTo(MARGEN + anchoUtil, y + ALTO_FILA)
      .lineWidth(0.25)
      .strokeColor(GRIS_LINEA)
      .stroke();

    doc.y = y + ALTO_FILA;
  });

  doc.moveDown(0.8);
  doc.fontSize(FUENTE_SUBTITULO).font('Helvetica-Bold').fillColor('#0f172a')
    .text(`Total de registros: ${filas.length}`);
}

const ALTO_FILLA_CORRECTA = ALTO_FILA;

function escribirResumen(doc, resultado, anchoUtil) {
  if (!resultado.resumen || resultado.resumen.length === 0) return;

  doc.moveDown(1);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Detalle de indicadores');

  for (const fila of resultado.resumen) {
    if (doc.y > doc.page.height - MARGEN - 60) doc.addPage();

    doc.moveDown(0.4);
    doc.fontSize(FUENTE_TABLA).font('Helvetica-Bold').fillColor(GRIS)
      .text(JSON.stringify(fila), { width: anchoUtil });
  }
}

function escribirPie(doc, contexto) {
  const rango = doc.bufferedPageRange();
  for (let i = rango.start; i < rango.start + rango.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - MARGEN + 8;
    doc.fontSize(7).font('Helvetica').fillColor(GRIS)
      .text(
        `${contexto.nombreSistema || 'El Valle'}  ·  Página ${i - rango.start + 1} de ${rango.count}`,
        MARGEN,
        y,
        { width: doc.page.width - MARGEN * 2, align: 'center', lineBreak: false }
      );
  }
}

function textoCelda(valor) {
  if (valor === null || valor === undefined) return '';
  if (valor instanceof Date) {
    return valor.toLocaleDateString('es-VE');
  }
  return String(valor);
}

function recortar(texto, anchoAproximado) {
  const maximo = Math.max(Math.floor(anchoAproximado), 3);
  return texto.length > maximo ? `${texto.slice(0, maximo - 1)}…` : texto;
}

/** Nombre de archivo seguro: `reporte-personas-2026-10-15.pdf` */
function nombreArchivo(slug, extension) {
  const fecha = new Date().toISOString().slice(0, 10);
  return `reporte-${slug}-${fecha}.${extension}`;
}

module.exports = { generarPdf, nombreArchivo };
