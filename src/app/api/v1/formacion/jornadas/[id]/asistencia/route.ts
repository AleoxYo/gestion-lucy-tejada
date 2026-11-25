import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';
import { asistenciaSchema } from '@/lib/validaciones';
import { exigirGestionProceso } from '@/lib/formacion';

type P = { id: string };

async function cargarJornada(id: string) {
  const j = await prisma.jornada.findUnique({ where: { id }, include: { proceso: true } });
  if (!j) noEncontrado('Jornada');
  return j;
}

/** Lista de inscritos con su marca de asistencia para la jornada. */
export const GET = servicio<P>(async (req, { params }) => {
  const s = await exigirSesion(req);
  const { id } = await params;
  const j = await cargarJornada(id);
  exigirGestionProceso(s, j.proceso);
  const inscripciones = await prisma.inscripcion.findMany({
    where: { procesoId: j.procesoId },
    include: {
      participante: { select: { nombre: true, documento: true } },
      asistencias: { where: { jornadaId: id } },
    },
    orderBy: { participante: { nombre: 'asc' } },
  });
  return ok({
    jornada: { id: j.id, fecha: j.fecha, tema: j.tema, lugar: j.lugar },
    registros: inscripciones.map((i) => ({
      inscripcionId: i.id,
      participante: i.participante.nombre,
      documento: i.participante.documento,
      presente: i.asistencias[0]?.presente ?? false,
      registrado: i.asistencias.length > 0,
    })),
  });
});

/** Registra (o corrige) la asistencia de la jornada. */
export const PUT = servicio<P>(async (req, { params }) => {
  const s = await exigirSesion(req);
  const { id } = await params;
  const j = await cargarJornada(id);
  exigirGestionProceso(s, j.proceso);
  if (j.proceso.estado === 'CERRADO') throw new ApiError(409, 'El proceso está cerrado; no se puede modificar la asistencia');
  const { registros } = asistenciaSchema.parse(await req.json());

  const validas = await prisma.inscripcion.findMany({
    where: { procesoId: j.procesoId, id: { in: registros.map((r) => r.inscripcionId) } },
    select: { id: true },
  });
  if (validas.length !== registros.length) throw new ApiError(400, 'Hay inscripciones que no pertenecen al proceso');

  await prisma.$transaction(
    registros.map((r) =>
      prisma.asistencia.upsert({
        where: { jornadaId_inscripcionId: { jornadaId: id, inscripcionId: r.inscripcionId } },
        create: { jornadaId: id, inscripcionId: r.inscripcionId, presente: r.presente },
        update: { presente: r.presente },
      }),
    ),
  );
  if (j.proceso.estado === 'ABIERTO') {
    await prisma.proceso.update({ where: { id: j.procesoId }, data: { estado: 'EN_CURSO' } });
  }
  return ok({ guardados: registros.length, presentes: registros.filter((r) => r.presente).length });
});
