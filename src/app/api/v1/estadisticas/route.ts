import { prisma } from '@/lib/prisma';
import { exigirSesion, ok, servicio } from '@/lib/api';

/** Indicadores para el tablero de inicio, según el rol. */
export const GET = servicio(async (req) => {
  const s = await exigirSesion(req);
  const ahora = new Date();
  const proximos = await prisma.concierto.findMany({
    where: { fecha: { gte: ahora }, estado: 'PROGRAMADO' },
    orderBy: { fecha: 'asc' },
    take: 5,
    select: { id: true, titulo: true, fecha: true, lugar: true, tipo: true },
  });

  if (s.rol === 'PARTICIPANTE') {
    const [inscripciones, certificados, abiertos] = await Promise.all([
      prisma.inscripcion.count({ where: { participanteId: s.sub } }),
      prisma.inscripcion.count({ where: { participanteId: s.sub, certificado: true } }),
      prisma.proceso.count({ where: { estado: 'ABIERTO' } }),
    ]);
    return ok({ rol: s.rol, proximos, indicadores: { inscripciones, certificados, procesosAbiertos: abiertos } });
  }

  if (s.rol === 'FORMADOR') {
    const [procesos, proximasJornadas] = await Promise.all([
      prisma.proceso.count({ where: { formadorId: s.sub, estado: { not: 'CERRADO' } } }),
      prisma.jornada.findMany({
        where: { proceso: { formadorId: s.sub }, fecha: { gte: ahora } },
        orderBy: { fecha: 'asc' },
        take: 5,
        include: { proceso: { select: { id: true, nombre: true } } },
      }),
    ]);
    return ok({ rol: s.rol, proximos, indicadores: { procesosActivos: procesos }, proximasJornadas });
  }

  const [solicitudesPendientes, conciertosMes, instrumentosPrestados, procesosActivos, encuestasPublicadas] =
    await Promise.all([
      prisma.solicitudConcierto.count({ where: { estado: 'PENDIENTE' } }),
      prisma.concierto.count({
        where: {
          fecha: {
            gte: new Date(ahora.getFullYear(), ahora.getMonth(), 1),
            lt: new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1),
          },
        },
      }),
      prisma.instrumento.count({ where: { estado: 'PRESTADO' } }),
      prisma.proceso.count({ where: { estado: { not: 'CERRADO' } } }),
      prisma.encuesta.count({ where: { estado: 'PUBLICADA' } }),
    ]);
  return ok({
    rol: s.rol,
    proximos,
    indicadores: { solicitudesPendientes, conciertosMes, instrumentosPrestados, procesosActivos, encuestasPublicadas },
  });
});
