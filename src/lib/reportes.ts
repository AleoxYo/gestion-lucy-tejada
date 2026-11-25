import ExcelJS from 'exceljs';
import { prisma } from './prisma';
import { etiqueta } from './constantes';
import { porcentajeAsistencia } from './formacion';

export const TIPOS_REPORTE = ['conciertos', 'asistencia', 'instrumentos', 'inventario'] as const;
export type TipoReporte = (typeof TIPOS_REPORTE)[number];

export interface Reporte {
  titulo: string;
  columnas: { titulo: string; ancho: number }[]; // ancho en puntos para PDF
  filas: string[][];
}

const f = (d: Date | null | undefined) => (d ? d.toLocaleDateString('es-CO') : '');
const fh = (d: Date | null | undefined) =>
  d ? d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '';

export async function construirReporte(tipo: TipoReporte, desde?: Date, hasta?: Date): Promise<Reporte> {
  const rango = desde || hasta ? { ...(desde ? { gte: desde } : {}), ...(hasta ? { lte: hasta } : {}) } : undefined;

  if (tipo === 'conciertos') {
    const cs = await prisma.concierto.findMany({
      where: rango ? { fecha: rango } : {},
      orderBy: { fecha: 'asc' },
      include: { _count: { select: { movimientos: true } } },
    });
    return {
      titulo: 'Reporte de conciertos',
      columnas: [
        { titulo: 'Fecha', ancho: 95 },
        { titulo: 'Título', ancho: 200 },
        { titulo: 'Tipo', ancho: 105 },
        { titulo: 'Lugar', ancho: 160 },
        { titulo: 'Agrupación', ancho: 125 },
        { titulo: 'Estado', ancho: 60 },
        { titulo: 'Instr.', ancho: 25 },
      ],
      filas: cs.map((c) => [
        fh(c.fecha),
        c.titulo,
        etiqueta(c.tipo),
        c.lugar,
        c.agrupacion,
        etiqueta(c.estado),
        String(c._count.movimientos),
      ]),
    };
  }

  if (tipo === 'asistencia') {
    const ins = await prisma.inscripcion.findMany({
      where: rango ? { proceso: { fechaInicio: rango } } : {},
      orderBy: [{ proceso: { nombre: 'asc' } }, { participante: { nombre: 'asc' } }],
      include: {
        participante: { select: { nombre: true, documento: true } },
        proceso: { select: { nombre: true, tipo: true, estado: true, _count: { select: { jornadas: true } } } },
        _count: { select: { asistencias: { where: { presente: true } } } },
      },
    });
    return {
      titulo: 'Reporte de asistencia a formación y festivales',
      columnas: [
        { titulo: 'Proceso', ancho: 190 },
        { titulo: 'Tipo', ancho: 100 },
        { titulo: 'Participante', ancho: 150 },
        { titulo: 'Documento', ancho: 80 },
        { titulo: 'Asistencias', ancho: 65 },
        { titulo: 'Jornadas', ancho: 55 },
        { titulo: '% Asist.', ancho: 50 },
        { titulo: 'Certificado', ancho: 80 },
      ],
      filas: ins.map((i) => [
        i.proceso.nombre,
        etiqueta(i.proceso.tipo),
        i.participante.nombre,
        i.participante.documento ?? '',
        String(i._count.asistencias),
        String(i.proceso._count.jornadas),
        `${i.porcentajeAsistencia ?? porcentajeAsistencia(i.proceso._count.jornadas, i._count.asistencias)}%`,
        i.certificado ? (i.codigoCertificado ?? 'Sí') : i.proceso.estado === 'CERRADO' ? 'No' : 'Pendiente',
      ]),
    };
  }

  if (tipo === 'instrumentos') {
    const ms = await prisma.movimientoInstrumento.findMany({
      where: rango ? { fechaSalida: rango } : {},
      orderBy: { fechaSalida: 'desc' },
      include: { instrumento: true, concierto: { select: { titulo: true } } },
    });
    return {
      titulo: 'Reporte de salidas y regresos de instrumentos',
      columnas: [
        { titulo: 'Código', ancho: 60 },
        { titulo: 'Instrumento', ancho: 110 },
        { titulo: 'Concierto', ancho: 160 },
        { titulo: 'Responsable', ancho: 120 },
        { titulo: 'Salida', ancho: 85 },
        { titulo: 'Est. salida', ancho: 55 },
        { titulo: 'Regreso', ancho: 85 },
        { titulo: 'Est. regreso', ancho: 55 },
        { titulo: 'Observaciones', ancho: 40 },
      ],
      filas: ms.map((m) => [
        m.instrumento.codigo,
        m.instrumento.nombre,
        m.concierto.titulo,
        m.responsable,
        fh(m.fechaSalida),
        etiqueta(m.estadoSalida),
        m.fechaRegreso ? fh(m.fechaRegreso) : 'SIN REGRESAR',
        etiqueta(m.estadoRegreso),
        m.observaciones ?? '',
      ]),
    };
  }

  const inst = await prisma.instrumento.findMany({
    orderBy: { codigo: 'asc' },
    include: { _count: { select: { movimientos: true } } },
  });
  return {
    titulo: 'Inventario de instrumentos',
    columnas: [
      { titulo: 'Código', ancho: 80 },
      { titulo: 'Nombre', ancho: 180 },
      { titulo: 'Familia', ancho: 110 },
      { titulo: 'Marca', ancho: 100 },
      { titulo: 'Estado', ancho: 90 },
      { titulo: 'Salidas', ancho: 60 },
      { titulo: 'Observaciones', ancho: 150 },
    ],
    filas: inst.map((i) => [
      i.codigo,
      i.nombre,
      etiqueta(i.familia),
      i.marca ?? '',
      etiqueta(i.estado),
      String(i._count.movimientos),
      i.observaciones ?? '',
    ]),
  };
}

export async function reporteAExcel(r: Reporte): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SGM-LT';
  wb.created = new Date();
  const ws = wb.addWorksheet(r.titulo.slice(0, 31));
  ws.addRow([r.titulo]).font = { bold: true, size: 14 };
  ws.addRow([`Generado: ${new Date().toLocaleString('es-CO')}`]).font = { italic: true, size: 9 };
  ws.addRow([]);
  const enc = ws.addRow(r.columnas.map((c) => c.titulo));
  enc.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C3A73' } };
  });
  r.filas.forEach((fila) => ws.addRow(fila));
  ws.columns.forEach((col, i) => {
    col.width = Math.max(10, Math.round((r.columnas[i]?.ancho ?? 80) / 5.5));
  });
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: r.columnas.length } };
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}
