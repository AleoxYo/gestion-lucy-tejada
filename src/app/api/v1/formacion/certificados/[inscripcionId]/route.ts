import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, noEncontrado, servicio } from '@/lib/api';
import { GESTION } from '@/lib/constantes';
import { generarCertificado } from '@/lib/pdf';

type P = { inscripcionId: string };

/** Descarga el certificado PDF. Lo puede descargar el propio participante o el personal de gestión. */
export const GET = servicio<P>(async (req, { params }) => {
  const s = await exigirSesion(req);
  const { inscripcionId } = await params;
  const i = await prisma.inscripcion.findUnique({
    where: { id: inscripcionId },
    include: { participante: true, proceso: { include: { formador: true } } },
  });
  if (!i) noEncontrado('Inscripción');
  if (i.participanteId !== s.sub && !GESTION.includes(s.rol)) throw new ApiError(403, 'No puede descargar este certificado');
  if (!i.certificado || !i.codigoCertificado) {
    throw new ApiError(409, 'Esta inscripción no tiene certificado (proceso abierto o asistencia insuficiente)');
  }
  const pdf = await generarCertificado({
    participante: i.participante.nombre,
    documento: i.participante.documento,
    proceso: i.proceso.nombre,
    tipo: i.proceso.tipo,
    fechaInicio: i.proceso.fechaInicio,
    fechaFin: i.proceso.fechaFin,
    porcentaje: i.porcentajeAsistencia ?? 0,
    formador: i.proceso.formador?.nombre,
    codigo: i.codigoCertificado,
  });
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificado-${i.codigoCertificado}.pdf"`,
    },
  });
});
