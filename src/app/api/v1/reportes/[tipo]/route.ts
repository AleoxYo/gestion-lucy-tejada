import { ApiError, exigirSesion, servicio } from '@/lib/api';
import { GESTION } from '@/lib/constantes';
import { construirReporte, reporteAExcel, TIPOS_REPORTE, type TipoReporte } from '@/lib/reportes';
import { generarReportePdf } from '@/lib/pdf';

export const runtime = 'nodejs';

type P = { tipo: string };

/** Exporta reportes: /reportes/{conciertos|asistencia|instrumentos|inventario}?formato=xlsx|pdf&desde=&hasta= */
export const GET = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { tipo } = await params;
  if (!TIPOS_REPORTE.includes(tipo as TipoReporte)) throw new ApiError(404, 'Tipo de reporte no existe');
  const sp = req.nextUrl.searchParams;
  const formato = sp.get('formato') ?? 'xlsx';
  if (formato !== 'xlsx' && formato !== 'pdf') throw new ApiError(400, 'Formato debe ser xlsx o pdf');
  const desde = sp.get('desde') ? new Date(sp.get('desde')!) : undefined;
  const hasta = sp.get('hasta') ? new Date(`${sp.get('hasta')}T23:59:59`) : undefined;

  const reporte = await construirReporte(tipo as TipoReporte, desde, hasta);
  const nombre = `reporte-${tipo}-${new Date().toISOString().slice(0, 10)}`;

  if (formato === 'pdf') {
    const pdf = await generarReportePdf(reporte.titulo, reporte.columnas, reporte.filas);
    return new Response(Buffer.from(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${nombre}.pdf"` },
    });
  }
  const xlsx = await reporteAExcel(reporte);
  return new Response(new Uint8Array(xlsx), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombre}.xlsx"`,
    },
  });
});
