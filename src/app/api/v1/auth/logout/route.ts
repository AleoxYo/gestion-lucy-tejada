import { NextResponse } from 'next/server';
import { obtenerSesion, registrarAcceso, servicio } from '@/lib/api';
import { COOKIE_SESION } from '@/lib/jwt';

export const POST = servicio(async (req) => {
  const s = await obtenerSesion(req);
  if (s) await registrarAcceso(req, 'LOGOUT', { usuarioId: s.sub, email: s.email });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, '', { path: '/', maxAge: 0 });
  return res;
});
