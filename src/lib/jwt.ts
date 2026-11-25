// Funciones JWT compatibles con el runtime Edge (se usan también en el middleware).
import { SignJWT, jwtVerify } from 'jose';
import type { Rol } from './constantes';

export const COOKIE_SESION = 'sgm_token';
export const DURACION_SESION_SEG = 60 * 60 * 8; // 8 horas

export interface Sesion {
  sub: string; // id del usuario
  nombre: string;
  email: string;
  rol: Rol;
}

function clave() {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) throw new Error('Falta la variable de entorno JWT_SECRET');
  return new TextEncoder().encode(secreto);
}

export async function firmarToken(s: Sesion): Promise<string> {
  return new SignJWT({ nombre: s.nombre, email: s.email, rol: s.rol })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(s.sub)
    .setIssuer('sgm-lt')
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_SEG}s`)
    .sign(clave());
}

export async function verificarToken(token: string | undefined | null): Promise<Sesion | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave(), { issuer: 'sgm-lt' });
    return {
      sub: String(payload.sub),
      nombre: String(payload.nombre),
      email: String(payload.email),
      rol: payload.rol as Rol,
    };
  } catch {
    return null;
  }
}
