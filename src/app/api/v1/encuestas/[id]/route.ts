import { prisma } from '@/lib/prisma';
import { exigirSesion, noEncontrado, obtenerSesion, ok, servicio } from '@/lib/api';
import { encuestaEstadoSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';

type P = { id: string };

/** Detalle con preguntas. Público solo si la encuesta está publicada. */
export const GET = servicio<P>(async (req, { params }) => {
  const { id } = await params;
  const s = await obtenerSesion(req);
  const e = await prisma.encuesta.findUnique({
    where: { id },
    include: {
      preguntas: { orderBy: { orden: 'asc' } },
      concierto: { select: { id: true, titulo: true, fecha: true, lugar: true } },
    },
  });
  const gestion = s && GESTION.includes(s.rol);
  if (!e || (!gestion && e.estado !== 'PUBLICADA')) noEncontrado('Encuesta');
  return ok(e);
});

/** Cambia el estado: BORRADOR → PUBLICADA → CERRADA. */
export const PATCH = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { id } = await params;
  const { estado } = encuestaEstadoSchema.parse(await req.json());
  return ok(await prisma.encuesta.update({ where: { id }, data: { estado } }));
});
