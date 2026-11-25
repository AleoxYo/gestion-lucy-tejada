import { prisma } from '@/lib/prisma';
import { exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';
import { planMejoraSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';

type P = { id: string };

/** Diagnóstico y plan de mejoramiento a partir de la encuesta (CAR-05). */
export const GET = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { id } = await params;
  return ok({ datos: await prisma.planMejora.findMany({ where: { encuestaId: id }, orderBy: { createdAt: 'desc' } }) });
});

export const POST = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { id } = await params;
  const e = await prisma.encuesta.findUnique({ where: { id } });
  if (!e) noEncontrado('Encuesta');
  const d = planMejoraSchema.parse(await req.json());
  return ok(await prisma.planMejora.create({ data: { ...d, encuestaId: id } }), 201);
});
