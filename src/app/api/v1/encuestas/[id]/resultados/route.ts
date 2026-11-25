import { prisma } from '@/lib/prisma';
import { exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';
import { GESTION } from '@/lib/constantes';
import { indiceSatisfaccion, tabular } from '@/lib/encuestas';

type P = { id: string };

/** Resultados tabulados automáticamente. */
export const GET = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { id } = await params;
  const e = await prisma.encuesta.findUnique({
    where: { id },
    include: { preguntas: true, _count: { select: { respuestas: true } } },
  });
  if (!e) noEncontrado('Encuesta');
  const items = await prisma.respuestaItem.findMany({
    where: { preguntaId: { in: e.preguntas.map((p) => p.id) } },
    select: { preguntaId: true, valorNumero: true, valorTexto: true },
  });
  const resultados = tabular(e.preguntas, items);
  return ok({
    encuesta: { id: e.id, titulo: e.titulo, periodo: e.periodo, estado: e.estado },
    totalRespuestas: e._count.respuestas,
    indiceSatisfaccion: indiceSatisfaccion(resultados),
    resultados,
  });
});
