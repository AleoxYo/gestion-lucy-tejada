import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_SESION, verificarToken } from '@/lib/jwt';

/** Protege el panel: sin JWT válido redirige al inicio de sesión. */
export async function middleware(req: NextRequest) {
  const sesion = await verificarToken(req.cookies.get(COOKIE_SESION)?.value);
  if (!sesion) {
    const url = new URL('/login', req.url);
    url.searchParams.set('volver', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/panel/:path*'] };
