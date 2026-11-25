import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { exigirSesion, ok, paginacion, servicio } from '@/lib/api';
import { instrumentoSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';

/** Inventario de instrumentos. Filtros: estado, familia, q (código o nombre). */
export const GET = servicio(async (req) => {
  await exigirSesion(req, GESTION);
  const sp = req.nextUrl.searchParams;
  const where: Prisma.InstrumentoWhereInput = {};
  if (sp.get('estado')) where.estado = sp.get('estado')!;
  if (sp.get('familia')) where.familia = sp.get('familia')!;
  const q = sp.get('q');
  if (q) where.OR = [{ codigo: { contains: q } }, { nombre: { contains: q } }];
  const { skip, take, pagina, tamano } = paginacion(req);
  const [datos, total] = await Promise.all([
    prisma.instrumento.findMany({ where, orderBy: { codigo: 'asc' }, skip, take }),
    prisma.instrumento.count({ where }),
  ]);
  return ok({ datos, total, pagina, tamano });
});

export const POST = servicio(async (req) => {
  await exigirSesion(req, GESTION);
  const d = instrumentoSchema.parse(await req.json());
  return ok(await prisma.instrumento.create({ data: d }), 201);
});
