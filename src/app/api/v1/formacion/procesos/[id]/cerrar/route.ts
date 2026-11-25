import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';
import { GESTION } from '@/lib/constantes';
import { codigoCertificado, porcentajeAsistencia } from '@/lib/formacion';
import { enviarCorreo } from '@/lib/notificaciones';

type P = { id: string };

/**
 * Cierra el proceso: calcula el porcentaje de asistencia de cada inscrito y
 * emite certificado a quienes alcanzan la asistencia mínima.
 */
export const POST = servicio<P>(async (req, { params }) => {
  await exigirSesion(req, GESTION);
  const { id } = await params;
  const p = await prisma.proceso.findUnique({
    where: { id },
    include: {
      _count: { select: { jornadas: true } },
      inscripciones: {
        include: {
          participante: true,
          _count: { select: { asistencias: { where: { presente: true } } } },
        },
      },
    },
  });
  if (!p) noEncontrado('Proceso');
  if (p.estado === 'CERRADO') throw new ApiError(409, 'El proceso ya está cerrado');
  if (p._count.jornadas === 0) throw new ApiError(409, 'El proceso no tiene jornadas registradas');

  const resultados = p.inscripciones.map((i) => {
    const porcentaje = porcentajeAsistencia(p._count.jornadas, i._count.asistencias);
    const certifica = porcentaje >= p.asistenciaMinima;
    return { i, porcentaje, certifica, codigo: certifica ? codigoCertificado() : null };
  });

  await prisma.$transaction([
    ...resultados.map((r) =>
      prisma.inscripcion.update({
        where: { id: r.i.id },
        data: { porcentajeAsistencia: r.porcentaje, certificado: r.certifica, codigoCertificado: r.codigo },
      }),
    ),
    prisma.proceso.update({ where: { id }, data: { estado: 'CERRADO', fechaCierre: new Date() } }),
  ]);

  for (const r of resultados.filter((x) => x.certifica)) {
    await enviarCorreo(
      r.i.participante.email,
      `Su certificado de "${p.nombre}" está disponible`,
      `Hola ${r.i.participante.nombre}, completó el ${r.porcentaje}% de asistencia. Descargue su certificado (código ${r.codigo}) desde "Mis procesos" en la plataforma.`,
      'CERTIFICADO',
    );
  }

  return ok({
    procesoId: id,
    jornadas: p._count.jornadas,
    asistenciaMinima: p.asistenciaMinima,
    certificados: resultados.filter((r) => r.certifica).length,
    resultados: resultados.map((r) => ({
      inscripcionId: r.i.id,
      participante: r.i.participante.nombre,
      porcentaje: r.porcentaje,
      certificado: r.certifica,
      codigo: r.codigo,
    })),
  });
});
