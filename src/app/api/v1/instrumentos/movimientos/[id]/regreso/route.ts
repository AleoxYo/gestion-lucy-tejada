import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';
import { regresoSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';

type P = { id: string };

/** Registra el regreso del instrumento. Si vuelve en mal estado pasa a mantenimiento. */
export const POST = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { id } = await params;
  const d = regresoSchema.parse(await req.json());
  const m = await prisma.movimientoInstrumento.findUnique({ where: { id } });
  if (!m) noEncontrado('Movimiento');
  if (m.fechaRegreso) throw new ApiError(409, 'El regreso de este instrumento ya fue registrado');

  const [movimiento] = await prisma.$transaction([
    prisma.movimientoInstrumento.update({
      where: { id },
      data: {
        fechaRegreso: new Date(),
        estadoRegreso: d.estadoRegreso,
        observaciones: [m.observaciones, d.observaciones].filter(Boolean).join(' | ') || null,
      },
    }),
    prisma.instrumento.update({
      where: { id: m.instrumentoId },
      data: { estado: d.estadoRegreso === 'MALO' ? 'MANTENIMIENTO' : 'DISPONIBLE' },
    }),
  ]);
  return ok(movimiento);
});
