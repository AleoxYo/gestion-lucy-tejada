import { prisma } from '@/lib/prisma';
import { ApiError, exigirSesion, ok, servicio } from '@/lib/api';
import { usuarioActualizarSchema } from '@/lib/validaciones';

type P = { id: string };

export const PATCH = servicio<P>(async (req, { params }) => {
  const s = await exigirSesion(req, ['DIRECTOR']);
  const { id } = await params;
  const d = usuarioActualizarSchema.parse(await req.json());
  if (id === s.sub && (d.activo === false || (d.rol && d.rol !== 'DIRECTOR'))) {
    throw new ApiError(400, 'No puede desactivarse ni quitarse el rol de Director a sí mismo');
  }
  const u = await prisma.usuario.update({
    where: { id },
    data: d,
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });
  return ok(u);
});
