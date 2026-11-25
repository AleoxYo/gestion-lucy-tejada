import { prisma } from '@/lib/prisma';
import { exigirSesion, ok, paginacion, servicio } from '@/lib/api';

/** Registro de accesos y operaciones (auditoría, CAR-12). Solo Director Técnico. */
export const GET = servicio(async (req) => {
  await exigirSesion(req, ['DIRECTOR']);
  const accion = req.nextUrl.searchParams.get('accion') ?? undefined;
  const where = accion ? { accion } : {};
  const { skip, take, pagina, tamano } = paginacion(req);
  const [datos, total] = await Promise.all([
    prisma.registroAcceso.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { usuario: { select: { nombre: true, rol: true } } },
    }),
    prisma.registroAcceso.count({ where }),
  ]);
  return ok({ datos, total, pagina, tamano });
});
