import { prisma } from '@/lib/prisma';
import { exigirSesion, obtenerSesion, ok, servicio } from '@/lib/api';
import { encuestaSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';

/** Encuestas. Sin sesión de gestión solo se listan las publicadas (para responderlas). */
export const GET = servicio(async (req) => {
  const s = await obtenerSesion(req);
  const gestion = s && GESTION.includes(s.rol);
  const datos = await prisma.encuesta.findMany({
    where: gestion ? {} : { estado: 'PUBLICADA' },
    orderBy: { createdAt: 'desc' },
    include: {
      concierto: { select: { id: true, titulo: true, fecha: true } },
      _count: { select: { respuestas: true, preguntas: true, planes: true } },
    },
  });
  return ok({
    datos: gestion
      ? datos
      : datos.map((e) => ({ id: e.id, titulo: e.titulo, descripcion: e.descripcion, periodo: e.periodo, concierto: e.concierto })),
  });
});

export const POST = servicio(async (req) => {
  await exigirSesion(req, GESTION);
  const { preguntas, ...d } = encuestaSchema.parse(await req.json());
  const e = await prisma.encuesta.create({
    data: {
      ...d,
      conciertoId: d.conciertoId || null,
      preguntas: { create: preguntas.map((p, i) => ({ ...p, orden: i + 1 })) },
    },
    include: { preguntas: true },
  });
  return ok(e, 201);
});
