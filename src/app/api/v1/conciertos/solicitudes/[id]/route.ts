import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';
import { responderSolicitudSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';
import { enviarCorreo } from '@/lib/notificaciones';

type P = { id: string };

export const GET = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { id } = await params;
  const s = await prisma.solicitudConcierto.findUnique({ where: { id }, include: { concierto: true } });
  if (!s) noEncontrado('Solicitud');
  return ok(s);
});

/** Responder la solicitud. Si se aprueba, se programa automáticamente el concierto. */
export const PATCH = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { id } = await params;
  const d = responderSolicitudSchema.parse(await req.json());
  const s = await prisma.solicitudConcierto.findUnique({ where: { id } });
  if (!s) noEncontrado('Solicitud');
  if (s.estado !== 'PENDIENTE') throw new ApiError(409, 'La solicitud ya fue respondida');

  const resultado = await prisma.$transaction(async (tx) => {
    const sol = await tx.solicitudConcierto.update({
      where: { id },
      data: { estado: d.decision, respuesta: d.respuesta, fechaRespuesta: new Date() },
    });
    const concierto =
      d.decision === 'APROBADA'
        ? await tx.concierto.create({
            data: {
              titulo: d.concierto.titulo,
              fecha: d.concierto.fecha,
              lugar: d.concierto.lugar,
              agrupacion: d.concierto.agrupacion,
              tipo: 'SOLICITADO',
              descripcion: `Solicitado por ${s.institucion ?? s.solicitante}. ${s.descripcion}`,
              solicitudId: id,
            },
          })
        : null;
    return { solicitud: sol, concierto };
  });

  await enviarCorreo(
    s.email,
    `Su solicitud de concierto fue ${d.decision === 'APROBADA' ? 'aprobada' : 'rechazada'}`,
    d.respuesta,
    'RESPUESTA_SOLICITUD',
  );
  return ok(resultado);
});
