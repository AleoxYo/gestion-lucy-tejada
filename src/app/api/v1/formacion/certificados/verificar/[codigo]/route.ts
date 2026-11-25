import { prisma } from '@/lib/prisma';
import { noEncontrado, ok, servicio } from '@/lib/api';

type P = { codigo: string };

/** Verificación pública de autenticidad de un certificado por su código. */
export const GET = servicio<P>(async (_req, { params }) => {
  const { codigo } = await params;
  const i = await prisma.inscripcion.findUnique({
    where: { codigoCertificado: codigo.toUpperCase() },
    include: { participante: { select: { nombre: true } }, proceso: { select: { nombre: true, tipo: true, fechaFin: true } } },
  });
  if (!i || !i.certificado) noEncontrado('Certificado');
  return ok({
    valido: true,
    codigo: i.codigoCertificado,
    participante: i.participante.nombre,
    proceso: i.proceso.nombre,
    tipo: i.proceso.tipo,
    fechaFin: i.proceso.fechaFin,
    porcentajeAsistencia: i.porcentajeAsistencia,
  });
});
