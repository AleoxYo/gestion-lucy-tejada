import { prisma } from '@/lib/prisma';
import { exigirSesion, noEncontrado, ok, servicio } from '@/lib/api';

/** Datos del usuario autenticado (derecho de consulta, Ley 1581). */
export const GET = servicio(async (req) => {
  const s = await exigirSesion(req);
  const u = await prisma.usuario.findUnique({
    where: { id: s.sub },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      documento: true,
      telefono: true,
      aceptaTratamiento: true,
      fechaAceptacion: true,
      createdAt: true,
    },
  });
  if (!u) noEncontrado('Usuario');
  return ok(u);
});
