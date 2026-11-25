import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';
import { instrumentoActualizarSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';

type P = { id: string };

/** Ficha del instrumento con su historial de salidas (trazabilidad). */
export const GET = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { id } = await params;
  const i = await prisma.instrumento.findUnique({
    where: { id },
    include: {
      movimientos: {
        orderBy: { fechaSalida: 'desc' },
        include: { concierto: { select: { id: true, titulo: true, fecha: true } } },
      },
    },
  });
  if (!i) noEncontrado('Instrumento');
  return ok(i);
});

export const PATCH = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { id } = await params;
  const d = instrumentoActualizarSchema.parse(await req.json());
  const actual = await prisma.instrumento.findUnique({ where: { id } });
  if (!actual) noEncontrado('Instrumento');
  if (d.estado && d.estado !== 'PRESTADO' && actual.estado === 'PRESTADO') {
    throw new ApiError(409, 'El instrumento está prestado: registre primero su regreso');
  }
  if (d.estado === 'PRESTADO') throw new ApiError(400, 'Use el registro de salida para prestar un instrumento');
  return ok(await prisma.instrumento.update({ where: { id }, data: d }));
});
