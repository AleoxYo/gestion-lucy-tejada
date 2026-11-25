// Generación de PDF (certificados y reportes) con pdf-lib.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

const AZUL = rgb(0.11, 0.23, 0.45);
const DORADO = rgb(0.72, 0.55, 0.2);
const GRIS = rgb(0.35, 0.35, 0.35);

/** Las fuentes estándar usan WinAnsi: se reemplazan caracteres que no se pueden codificar. */
const limpiar = (t: string) => t.replace(/[^\x20-\x7E -ÿ]/g, '-');

function centrado(page: PDFPage, texto: string, y: number, font: PDFFont, size: number, color = GRIS) {
  const t = limpiar(texto);
  const w = font.widthOfTextAtSize(t, size);
  page.drawText(t, { x: (page.getWidth() - w) / 2, y, size, font, color });
}

export interface DatosCertificado {
  participante: string;
  documento?: string | null;
  proceso: string;
  tipo: string;
  fechaInicio: Date;
  fechaFin: Date;
  porcentaje: number;
  formador?: string | null;
  codigo: string;
}

export async function generarCertificado(d: DatosCertificado): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificado ${d.codigo}`);
  pdf.setAuthor('Centro Cultural Lucy Tejada - Secretaría de Cultura de Pereira');
  const page = pdf.addPage([842, 595]); // A4 horizontal
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const cursiva = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);

  page.drawRectangle({ x: 20, y: 20, width: 802, height: 555, borderColor: AZUL, borderWidth: 4 });
  page.drawRectangle({ x: 32, y: 32, width: 778, height: 531, borderColor: DORADO, borderWidth: 1.5 });

  centrado(page, 'SECRETARÍA DE CULTURA DE PEREIRA', 510, negrita, 14, AZUL);
  centrado(page, 'Centro Cultural Lucy Tejada · Área de Música', 490, normal, 11);
  centrado(page, 'CERTIFICADO DE PARTICIPACIÓN', 430, negrita, 28, AZUL);
  centrado(page, 'Se certifica que', 390, normal, 13);
  centrado(page, d.participante, 350, cursiva, 30, rgb(0.1, 0.1, 0.1));
  if (d.documento) centrado(page, `Documento: ${d.documento}`, 325, normal, 11);
  centrado(
    page,
    `participó en el ${d.tipo === 'FESTIVAL' ? 'festival' : 'proceso de formación'}`,
    295,
    normal,
    13,
  );
  centrado(page, `"${d.proceso}"`, 265, negrita, 18, AZUL);
  const f = (x: Date) => x.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  centrado(page, `realizado del ${f(d.fechaInicio)} al ${f(d.fechaFin)},`, 235, normal, 12);
  centrado(page, `con una asistencia del ${d.porcentaje}%.`, 217, normal, 12);

  page.drawLine({ start: { x: 120, y: 120 }, end: { x: 360, y: 120 }, thickness: 1, color: GRIS });
  page.drawLine({ start: { x: 482, y: 120 }, end: { x: 722, y: 120 }, thickness: 1, color: GRIS });
  page.drawText('Director Técnico Banda Sinfónica', { x: 150, y: 104, size: 10, font: normal, color: GRIS });
  page.drawText(limpiar(d.formador ? `Formador: ${d.formador}` : 'Coordinación de formación'), {
    x: 505,
    y: 104,
    size: 10,
    font: normal,
    color: GRIS,
  });
  centrado(
    page,
    `Código de verificación: ${d.codigo} · Expedido en Pereira el ${f(new Date())}`,
    55,
    normal,
    9,
  );
  return pdf.save();
}

/** Reporte tabular simple en PDF con paginación automática. */
export async function generarReportePdf(
  titulo: string,
  columnas: { titulo: string; ancho: number }[],
  filas: string[][],
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(titulo);
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ancho = 842;
  const alto = 595;
  const margen = 36;
  const altoFila = 16;
  const size = 8;

  const recortar = (t: string, w: number) => {
    let s = limpiar(t);
    if (normal.widthOfTextAtSize(s, size) <= w - 6) return s;
    while (s.length > 1 && normal.widthOfTextAtSize(s + '...', size) > w - 6) s = s.slice(0, -1);
    return s + '...';
  };

  let page = pdf.addPage([ancho, alto]);
  let y = 0;
  let numPagina = 0;

  const encabezado = () => {
    numPagina++;
    page.drawText(limpiar(titulo), { x: margen, y: alto - margen - 10, size: 14, font: negrita, color: AZUL });
    page.drawText(
      limpiar(`SGM-LT · Centro Cultural Lucy Tejada · Generado ${new Date().toLocaleString('es-CO')} · Pág. ${numPagina}`),
      { x: margen, y: alto - margen - 26, size: 8, font: normal, color: GRIS },
    );
    y = alto - margen - 50;
    let x = margen;
    page.drawRectangle({ x: margen, y: y - 4, width: ancho - 2 * margen, height: altoFila, color: AZUL });
    for (const c of columnas) {
      page.drawText(recortar(c.titulo, c.ancho), { x: x + 3, y, size, font: negrita, color: rgb(1, 1, 1) });
      x += c.ancho;
    }
    y -= altoFila;
  };

  encabezado();
  filas.forEach((fila, idx) => {
    if (y < margen + altoFila) {
      page = pdf.addPage([ancho, alto]);
      encabezado();
    }
    if (idx % 2 === 0) {
      page.drawRectangle({
        x: margen,
        y: y - 4,
        width: ancho - 2 * margen,
        height: altoFila,
        color: rgb(0.94, 0.95, 0.98),
      });
    }
    let x = margen;
    fila.forEach((celda, i) => {
      page.drawText(recortar(celda ?? '', columnas[i].ancho), { x: x + 3, y, size, font: normal });
      x += columnas[i].ancho;
    });
    y -= altoFila;
  });
  if (!filas.length) page.drawText('Sin registros para los filtros seleccionados.', { x: margen, y, size: 10, font: normal });
  return pdf.save();
}
