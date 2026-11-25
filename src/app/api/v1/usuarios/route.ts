import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, ok, paginacion, servicio } from '@/lib/api';
import { usuarioCrearSchema } from '@/lib/validaciones';
import { GESTION } from '@/lib/constantes';

const seleccion = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  documento: true,
  telefono: true,
  activo: true,
  createdAt: true,
} as const;

/** Listado de usuarios. ?rol=FORMADOR lo usan los formularios de formación. */
export const GET = servicio(async (req) => {
  await exigirSesion(req, GESTION);
  const rol = req.nextUrl.searchParams.get('rol') ?? undefined;
  const where = rol ? { rol } : {};
  const { skip, take, pagina, tamano } = paginacion(req);
  const [datos, total] = await Promise.all([
    prisma.usuario.findMany({ where, select: seleccion, orderBy: { nombre: 'asc' }, skip, take }),
    prisma.usuario.count({ where }),
  ]);
  return ok({ datos, total, pagina, tamano });
});

/** Solo el Director Técnico crea cuentas de personal (auxiliares, formadores, otros directores). */
export const POST = servicio(async (req) => {
  await exigirSesion(req, ['DIRECTOR']);
  const d = usuarioCrearSchema.parse(await req.json());
  const existe = await prisma.usuario.findUnique({ where: { email: d.email } });
  if (existe) throw new ApiError(409, 'Ya existe un usuario con ese correo');
  const { password, ...resto } = d;
  const u = await prisma.usuario.create({
    data: { ...resto, passwordHash: await bcrypt.hash(password, 10) },
    select: seleccion,
  });
  return ok(u, 201);
});
