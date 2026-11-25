import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ApiError, registrarAcceso, servicio } from '@/lib/api';
import { registroSchema } from '@/lib/validaciones';
import { respuestaConSesion } from '@/lib/sesionCookie';
import { enviarCorreo } from '@/lib/notificaciones';

/** Autorregistro público: siempre crea usuarios con rol PARTICIPANTE. */
export const POST = servicio(async (req) => {
  const datos = registroSchema.parse(await req.json());
  const existe = await prisma.usuario.findUnique({ where: { email: datos.email } });
  if (existe) throw new ApiError(409, 'Ya existe una cuenta con ese correo');

  const usuario = await prisma.usuario.create({
    data: {
      nombre: datos.nombre,
      email: datos.email,
      documento: datos.documento,
      telefono: datos.telefono,
      passwordHash: await bcrypt.hash(datos.password, 10),
      rol: 'PARTICIPANTE',
      aceptaTratamiento: true,
      fechaAceptacion: new Date(),
    },
  });
  await registrarAcceso(req, 'REGISTRO', { usuarioId: usuario.id, email: usuario.email });
  await enviarCorreo(
    usuario.email,
    'Bienvenido(a) al Sistema de Gestión Musical Lucy Tejada',
    `Hola ${usuario.nombre}, su cuenta fue creada. Ya puede inscribirse en festivales y procesos de formación.`,
    'CONFIRMACION',
  );
  return respuestaConSesion(
    req,
    { sub: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: 'PARTICIPANTE' },
    201,
  );
});
