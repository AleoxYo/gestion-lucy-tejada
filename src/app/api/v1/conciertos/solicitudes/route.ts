import { prisma } from '@/lib/prisma';
import { exigirSesion, ok, paginacion, servicio } from '@/lib/api';
import { solicitudSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';
import { enviarCorreo } from '@/lib/notificaciones';

export const GET = servicio(async (req) => {
  await exigirSesion(req, GESTION);
  const estado = req.nextUrl.searchParams.get('estado') ?? undefined;
  const { skip, take, pagina, tamano } = paginacion(req);
  const where = estado ? { estado } : {};
  const [datos, total] = await Promise.all([
    prisma.solicitudConcierto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { concierto: { select: { id: true, titulo: true, fecha: true } } },
    }),
    prisma.solicitudConcierto.count({ where }),
  ]);
  return ok({ datos, total, pagina, tamano });
});

/** Solicitud pública de concierto por parte de instituciones o comunidad. */
export const POST = servicio(async (req) => {
  const d = solicitudSchema.parse(await req.json());
  const s = await prisma.solicitudConcierto.create({ data: { ...d, aceptaTratamiento: true } });
  await enviarCorreo(
    s.email,
    'Recibimos su solicitud de concierto',
    `Hola ${s.solicitante}, su solicitud para el ${s.fechaPropuesta.toLocaleDateString('es-CO')} en ${s.lugar} fue radicada con el código ${s.id}. Le responderemos pronto.`,
    'CONFIRMACION',
  );
  return ok({ id: s.id, estado: s.estado }, 201);
});
