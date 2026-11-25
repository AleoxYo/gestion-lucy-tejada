import { prisma } from '@/lib/prisma';
import { exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';
import { conciertoActualizarSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';

type P = { id: string };

export const GET = servicio<P>(async (_req, { params }) => {
  const { id } = await params;
  const c = await prisma.concierto.findUnique({
    where: { id },
    include: {
      solicitud: { select: { id: true, solicitante: true, institucion: true } },
      movimientos: { include: { instrumento: { select: { codigo: true, nombre: true } } } },
    },
  });
  if (!c) noEncontrado('Concierto');
  return ok(c);
});

export const PATCH = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { id } = await params;
  const d = conciertoActualizarSchema.parse(await req.json());
  const c = await prisma.concierto.update({ where: { id }, data: d });
  return ok(c);
});

export const DELETE = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, ['DIRECTOR']);
  const { id } = await params;
  await prisma.concierto.delete({ where: { id } });
  return ok({ ok: true });
});
