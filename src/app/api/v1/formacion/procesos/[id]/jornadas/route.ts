import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';
import { jornadaSchema } from '@/lib/validaciones';
import { exigirGestionProceso } from '@/lib/formacion';

type P = { id: string };

/** Cronograma: jornadas del proceso. */
export const GET = servicio<P>(async (req, { params }) => {
  await exigirSesion(req);
  const { id } = await params;
  return ok(await prisma.jornada.findMany({ where: { procesoId: id }, orderBy: { fecha: 'asc' } }));
});

export const POST = servicio<P>(async (req, { params }) => {
  const s = await exigirSesion(req);
  const { id } = await params;
  const p = await prisma.proceso.findUnique({ where: { id } });
  if (!p) noEncontrado('Proceso');
  exigirGestionProceso(s, p);
  if (p.estado === 'CERRADO') throw new ApiError(409, 'El proceso está cerrado');
  const d = jornadaSchema.parse(await req.json());
  return ok(await prisma.jornada.create({ data: { ...d, procesoId: id } }), 201);
});
