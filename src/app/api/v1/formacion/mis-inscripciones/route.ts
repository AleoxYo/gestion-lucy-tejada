import { prisma } from '@/lib/prisma';
import { exigirSesion, ok, servicio } from '@/lib/api';
import { porcentajeAsistencia } from '@/lib/formacion';

/** Inscripciones del participante autenticado, con avance de asistencia y certificado. */
export const GET = servicio(async (req) => {
  const s = await exigirSesion(req);
  const inscripciones = await prisma.inscripcion.findMany({
    where: { participanteId: s.sub },
    orderBy: { createdAt: 'desc' },
    include: {
      proceso: {
        select: {
          id: true,
          nombre: true,
          tipo: true,
          estado: true,
          fechaInicio: true,
          fechaFin: true,
          asistenciaMinima: true,
          _count: { select: { jornadas: true } },
        },
      },
      _count: { select: { asistencias: { where: { presente: true } } } },
    },
  });
  return ok({
    datos: inscripciones.map((i) => ({
      id: i.id,
      proceso: i.proceso,
      asistencias: i._count.asistencias,
      porcentajeActual:
        i.porcentajeAsistencia ?? porcentajeAsistencia(i.proceso._count.jornadas, i._count.asistencias),
      certificado: i.certificado,
      codigoCertificado: i.codigoCertificado,
    })),
  });
});
