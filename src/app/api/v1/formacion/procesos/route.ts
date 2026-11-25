import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, obtenerSesion, ok, paginacion, servicio } from '@/lib/api';
import { procesoSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';

/**
 * Festivales y procesos de formación. Público (para la oferta de inscripción).
 * Filtros: estado, tipo, mios=true (formador autenticado: solo los asignados).
 */
export const GET = servicio(async (req) => {
  const sp = req.nextUrl.searchParams;
  const where: Prisma.ProcesoWhereInput = {};
  if (sp.get('estado')) where.estado = sp.get('estado')!;
  if (sp.get('tipo')) where.tipo = sp.get('tipo')!;
  if (sp.get('mios') === 'true') {
    const s = await exigirSesion(req);
    where.formadorId = s.sub;
  }
  const sesion = await obtenerSesion(req);
  const { skip, take, pagina, tamano } = paginacion(req);
  const [procesos, total] = await Promise.all([
    prisma.proceso.findMany({
      where,
      orderBy: { fechaInicio: 'desc' },
      skip,
      take,
      include: {
        formador: { select: { id: true, nombre: true } },
        _count: { select: { inscripciones: true, jornadas: true } },
        ...(sesion?.rol === 'PARTICIPANTE'
          ? { inscripciones: { where: { participanteId: sesion.sub }, select: { id: true } } }
          : {}),
      },
    }),
    prisma.proceso.count({ where }),
  ]);
  const datos = procesos.map(({ inscripciones, ...p }) => ({
    ...p,
    inscritos: p._count.inscripciones,
    cuposDisponibles: Math.max(0, p.cupo - p._count.inscripciones),
    ...(inscripciones ? { inscrito: inscripciones.length > 0 } : {}),
  }));
  return ok({ datos, total, pagina, tamano });
});

export const POST = servicio(async (req) => {
  await exigirSesion(req, GESTION);
  const d = procesoSchema.parse(await req.json());
  if (d.formadorId) {
    const f = await prisma.usuario.findUnique({ where: { id: d.formadorId } });
    if (!f || f.rol !== 'FORMADOR') throw new ApiError(400, 'El formador asignado no es válido');
  }
  const p = await prisma.proceso.create({ data: { ...d, formadorId: d.formadorId || null } });
  return ok(p, 201);
});
