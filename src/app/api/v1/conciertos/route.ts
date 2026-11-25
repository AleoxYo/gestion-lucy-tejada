import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { exigirSesion, ok, paginacion, servicio } from '@/lib/api';
import { conciertoSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';

/**
 * Agenda de conciertos (pública). La consumen la web del módulo y otros módulos
 * como Escenarios o Emisora. Filtros: desde, hasta, tipo, estado.
 */
export const GET = servicio(async (req) => {
  const q = req.nextUrl.searchParams;
  const where: Prisma.ConciertoWhereInput = {};
  const desde = q.get('desde');
  const hasta = q.get('hasta');
  if (desde || hasta) {
    where.fecha = {
      ...(desde ? { gte: new Date(desde) } : {}),
      ...(hasta ? { lte: new Date(hasta) } : {}),
    };
  }
  if (q.get('tipo')) where.tipo = q.get('tipo')!;
  if (q.get('estado')) where.estado = q.get('estado')!;
  const { skip, take, pagina, tamano } = paginacion(req);
  const [datos, total] = await Promise.all([
    prisma.concierto.findMany({
      where,
      orderBy: { fecha: 'asc' },
      skip,
      take,
      select: {
        id: true,
        titulo: true,
        tipo: true,
        fecha: true,
        lugar: true,
        agrupacion: true,
        descripcion: true,
        estado: true,
      },
    }),
    prisma.concierto.count({ where }),
  ]);
  return ok({ datos, total, pagina, tamano });
});

export const POST = servicio(async (req) => {
  await exigirSesion(req, GESTION);
  const d = conciertoSchema.parse(await req.json());
  const concierto = await prisma.concierto.create({ data: { ...d, agrupacion: d.agrupacion ?? undefined } });
  return ok(concierto, 201);
});
