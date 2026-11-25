import { prisma } from '@/lib/prisma';
import { ApiError, noEncontrado, ok, servicio } from '@/lib/api';
import { respuestaEncuestaSchema } from '@/lib/validaciones';

type P = { id: string };

/** Recepción pública y anónima de respuestas de los asistentes. */
export const POST = servicio<P>(async (req, { params }) => {
  const { id } = await params;
  const e = await prisma.encuesta.findUnique({ where: { id }, include: { preguntas: true } });
  if (!e) noEncontrado('Encuesta');
  if (e.estado !== 'PUBLICADA') throw new ApiError(409, 'La encuesta no está recibiendo respuestas');
  const { respuestas } = respuestaEncuestaSchema.parse(await req.json());

  const preguntas = new Map(e.preguntas.map((p) => [p.id, p]));
  const items = respuestas.map((r) => {
    const p = preguntas.get(r.preguntaId);
    if (!p) throw new ApiError(400, 'Pregunta inválida para esta encuesta');
    if (p.tipo === 'ESCALA' && (r.valorNumero == null || r.valorNumero < 1 || r.valorNumero > 5)) {
      throw new ApiError(400, `Responda de 1 a 5: "${p.texto}"`);
    }
    if (p.tipo === 'SI_NO' && r.valorNumero !== 0 && r.valorNumero !== 1) {
      throw new ApiError(400, `Responda sí o no: "${p.texto}"`);
    }
    return {
      preguntaId: p.id,
      valorNumero: p.tipo === 'TEXTO' ? null : r.valorNumero!,
      valorTexto: p.tipo === 'TEXTO' ? (r.valorTexto?.trim() || null) : null,
    };
  });
  const faltan = e.preguntas.filter((p) => p.tipo !== 'TEXTO' && !items.some((i) => i.preguntaId === p.id));
  if (faltan.length) throw new ApiError(400, `Faltan respuestas obligatorias (${faltan.length})`);

  const r = await prisma.respuestaEncuesta.create({ data: { encuestaId: id, items: { create: items } } });
  return ok({ id: r.id, mensaje: '¡Gracias por responder!' }, 201);
});
