import { cookies } from 'next/headers';
import { COOKIE_SESION, verificarToken } from './jwt';

export async function sesionActual() {
  const c = await cookies();
  return verificarToken(c.get(COOKIE_SESION)?.value);
}
