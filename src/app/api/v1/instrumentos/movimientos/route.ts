import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { exigirSesion, ok, paginacion, servicio } from '@/lib/api';
import { GESTION } from '@/lib/constantes';

/** Movimientos (salidas/regresos). Filtros: abiertos=true, conciertoId, instrumentoId. */
export const GET = servicio(async (req) => {
  await exigirSesion(req, GESTION);
  const sp = req.nextUrl.searchParams;
  const where: Prisma.MovimientoInstrumentoWhereInput = {};
  if (sp.get('abiertos') === 'true') where.fechaRegreso = null;
  if (sp.get('conciertoId')) where.conciertoId = sp.get('conciertoId')!;
  if (sp.get('instrumentoId')) where.instrumentoId = sp.get('instrumentoId')!;
  const { skip, take, pagina, tamano } = paginacion(req);
  const [datos, total] = await Promise.all([
    prisma.movimientoInstrumento.findMany({
      where,
      orderBy: { fechaSalida: 'desc' },
      skip,
      take,
      include: {
        instrumento: { select: { id: true, codigo: true, nombre: true } },
        concierto: { select: { id: true, titulo: true, fecha: true, lugar: true } },
      },
    }),
    prisma.movimientoInstrumento.count({ where }),
  ]);
  return ok({ datos, total, pagina, tamano });
});
