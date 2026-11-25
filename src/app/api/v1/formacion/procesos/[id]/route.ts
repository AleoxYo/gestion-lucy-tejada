import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';
import { procesoActualizarSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';
import { puedeGestionarProceso } from '@/lib/formacion';

type P = { id: string };

/** Detalle del proceso. Inscritos y asistencia solo para quien lo gestiona. */
export const GET = servicio<P>(async (req, { params }) => {
  const s = await exigirSesion(req);
  const { id } = await params;
  const p = await prisma.proceso.findUnique({
    where: { id },
    include: {
      formador: { select: { id: true, nombre: true, email: true } },
      jornadas: { orderBy: { fecha: 'asc' }, include: { _count: { select: { asistencias: { where: { presente: true } } } } } },
      _count: { select: { inscripciones: true } },
    },
  });
  if (!p) noEncontrado('Proceso');
  const gestiona = puedeGestionarProceso(s, p);
  const inscripciones = gestiona
    ? await prisma.inscripcion.findMany({
        where: { procesoId: id },
        orderBy: { participante: { nombre: 'asc' } },
        include: {
          participante: { select: { id: true, nombre: true, email: true, documento: true } },
          _count: { select: { asistencias: { where: { presente: true } } } },
        },
      })
    : await prisma.inscripcion.findMany({
        where: { procesoId: id, participanteId: s.sub },
        include: {
          participante: { select: { id: true, nombre: true, email: true, documento: true } },
          _count: { select: { asistencias: { where: { presente: true } } } },
        },
      });
  return ok({ ...p, gestiona, inscripciones });
});

export const PATCH = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { id } = await params;
  const d = procesoActualizarSchema.parse(await req.json());
  const p = await prisma.proceso.findUnique({ where: { id } });
  if (!p) noEncontrado('Proceso');
  if (p.estado === 'CERRADO') throw new ApiError(409, 'El proceso ya está cerrado');
  if (d.formadorId) {
    const f = await prisma.usuario.findUnique({ where: { id: d.formadorId } });
    if (!f || f.rol !== 'FORMADOR') throw new ApiError(400, 'El formador asignado no es válido');
  }
  return ok(await prisma.proceso.update({ where: { id }, data: d }));
});
