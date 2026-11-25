import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_SESION, DURACION_SESION_SEG, firmarToken, type Sesion } from './jwt';

export function usuarioPublico(u: { id: string; nombre: string; email: string; rol: string }) {
  return { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol };
}

/** Responde con el token en el cuerpo (para otros módulos) y en cookie httpOnly (para la web). */
export async function respuestaConSesion(req: NextRequest, s: Sesion, status = 200) {
  const token = await firmarToken(s);
  const res = NextResponse.json(
    { token, usuario: { id: s.sub, nombre: s.nombre, email: s.email, rol: s.rol } },
    { status },
  );
  res.cookies.set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Detrás de un proxy (Render) el protocolo original llega en x-forwarded-proto.
    secure: req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: DURACION_SESION_SEG,
  });
  return res;
}
