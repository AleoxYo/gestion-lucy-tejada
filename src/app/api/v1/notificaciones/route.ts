import { prisma } from '@/lib/prisma';
import { exigirSesion, ok, paginacion, servicio } from '@/lib/api';
import { GESTION } from '@/lib/constantes';
import { enviarCorreo } from '@/lib/notificaciones';
import { z } from 'zod';

/** Bandeja de salida del servicio utilitario de notificaciones. */
export const GET = servicio(async (req) => {
  await exigirSesion(req, GESTION);
  const { skip, take, pagina, tamano } = paginacion(req);
  const [datos, total] = await Promise.all([
    prisma.notificacion.findMany({ orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.notificacion.count(),
  ]);
  return ok({ datos, total, pagina, tamano });
});

const recordatorioSchema = z.object({ procesoId: z.string() });

/** Envía un recordatorio a todos los inscritos de un proceso o festival. */
export const POST = servicio(async (req) => {
  await exigirSesion(req, GESTION);
  const { procesoId } = recordatorioSchema.parse(await req.json());
  const p = await prisma.proceso.findUniqueOrThrow({
    where: { id: procesoId },
    include: {
      inscripciones: { include: { participante: true } },
      jornadas: { where: { fecha: { gte: new Date() } }, orderBy: { fecha: 'asc' }, take: 1 },
    },
  });
  const prox = p.jornadas[0];
  for (const i of p.inscripciones) {
    await enviarCorreo(
      i.participante.email,
      `Recordatorio: ${p.nombre}`,
      prox
        ? `Hola ${i.participante.nombre}, le recordamos la próxima jornada "${prox.tema}" el ${prox.fecha.toLocaleString('es-CO')}${prox.lugar ? ` en ${prox.lugar}` : ''}.`
        : `Hola ${i.participante.nombre}, le recordamos su participación en ${p.nombre}.`,
      'RECORDATORIO',
    );
  }
  return ok({ enviados: p.inscripciones.length });
});
