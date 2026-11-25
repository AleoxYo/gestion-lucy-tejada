import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ApiError, registrarAcceso, servicio } from '@/lib/api';
import { loginSchema } from '@/lib/validaciones';
import { respuestaConSesion } from '@/lib/sesionCookie';
import type { Rol } from '@/lib/constantes';

export const POST = servicio(async (req) => {
  const { email, password } = loginSchema.parse(await req.json());
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  const valido = usuario && usuario.activo && (await bcrypt.compare(password, usuario.passwordHash));
  if (!usuario || !valido) {
    await registrarAcceso(req, 'LOGIN_FALLIDO', { usuarioId: usuario?.id, email });
    throw new ApiError(401, 'Correo o contraseña incorrectos');
  }
  await registrarAcceso(req, 'LOGIN_OK', { usuarioId: usuario.id, email });
  return respuestaConSesion(req, {
    sub: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol as Rol,
  });
});
