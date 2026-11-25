import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';
import { inscripcionAdminSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';
import { exigirGestionProceso } from '@/lib/formacion';
import { enviarCorreo } from '@/lib/notificaciones';

type P = { id: string };

export const GET = servicio<P>(async (req, { params }) => {
  const s = await exigirSesion(req);
  const { id } = await params;
  const p = await prisma.proceso.findUnique({ where: { id } });
  if (!p) noEncontrado('Proceso');
  exigirGestionProceso(s, p);
  const datos = await prisma.inscripcion.findMany({
    where: { procesoId: id },
    include: { participante: { select: { id: true, nombre: true, email: true, documento: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return ok({ datos, total: datos.length });
});

/**
 * Inscripción en línea. Un participante se inscribe a sí mismo;
 * Director o Auxiliar pueden inscribir a otro participante enviando participanteId.
 */
export const POST = servicio<P>(async (req, { params }) => {
  const s = await exigirSesion(req, ['PARTICIPANTE', ...GESTION]);
  const { id } = await params;
  const cuerpo = inscripcionAdminSchema.parse(await req.json().catch(() => ({})));
  const participanteId = s.rol === 'PARTICIPANTE' ? s.sub : cuerpo.participanteId;
  if (!participanteId) throw new ApiError(400, 'Indique el participante a inscribir');

  const participante = await prisma.usuario.findUnique({ where: { id: participanteId } });
  if (!participante || participante.rol !== 'PARTICIPANTE') throw new ApiError(400, 'Participante inválido');

  const insc = await prisma.$transaction(async (tx) => {
    const p = await tx.proceso.findUnique({ where: { id }, include: { _count: { select: { inscripciones: true } } } });
    if (!p) noEncontrado('Proceso');
    if (p.estado !== 'ABIERTO') throw new ApiError(409, 'Las inscripciones de este proceso están cerradas');
    if (p._count.inscripciones >= p.cupo) throw new ApiError(409, 'No hay cupos disponibles');
    const ya = await tx.inscripcion.findUnique({ where: { procesoId_participanteId: { procesoId: id, participanteId } } });
    if (ya) throw new ApiError(409, 'El participante ya está inscrito en este proceso');
    const i = await tx.inscripcion.create({ data: { procesoId: id, participanteId } });
    return { ...i, proceso: p };
  });

  await enviarCorreo(
    participante.email,
    `Inscripción confirmada: ${insc.proceso.nombre}`,
    `Hola ${participante.nombre}, su inscripción en "${insc.proceso.nombre}" quedó registrada. Inicio: ${insc.proceso.fechaInicio.toLocaleDateString('es-CO')}.`,
    'CONFIRMACION',
  );
  const { proceso: _p, ...inscripcion } = insc;
  return ok(inscripcion, 201);
});
