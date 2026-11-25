import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';
import { salidaSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';

/** Registra la salida de uno o varios instrumentos para un concierto. */
export const POST = servicio(async (req) => {
  const s = await exigirSesion(req, GESTION);
  const d = salidaSchema.parse(await req.json());
  const concierto = await prisma.concierto.findUnique({ where: { id: d.conciertoId } });
  if (!concierto) noEncontrado('Concierto');
  if (concierto.estado === 'CANCELADO') throw new ApiError(409, 'El concierto está cancelado');

  const instrumentos = await prisma.instrumento.findMany({ where: { id: { in: d.instrumentoIds } } });
  if (instrumentos.length !== d.instrumentoIds.length) throw new ApiError(404, 'Algún instrumento no existe');
  const noDisponibles = instrumentos.filter((i) => i.estado !== 'DISPONIBLE');
  if (noDisponibles.length) {
    throw new ApiError(
      409,
      `No están disponibles: ${noDisponibles.map((i) => `${i.codigo} (${i.estado})`).join(', ')}`,
    );
  }

  const movimientos = await prisma.$transaction(async (tx) => {
    await tx.instrumento.updateMany({ where: { id: { in: d.instrumentoIds } }, data: { estado: 'PRESTADO' } });
    return Promise.all(
      d.instrumentoIds.map((instrumentoId) =>
        tx.movimientoInstrumento.create({
          data: {
            instrumentoId,
            conciertoId: d.conciertoId,
            responsable: d.responsable,
            estadoSalida: d.estadoSalida,
            observaciones: d.observaciones,
            registradoPor: s.nombre,
          },
        }),
      ),
    );
  });
  return ok({ movimientos }, 201);
});
