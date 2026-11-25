'use client';
import { createContext, useContext } from 'react';
import type { Sesion } from '@/lib/jwt';
import { GESTION } from '@/lib/constantes';

const Ctx = createContext<Sesion | null>(null);

export function ProveedorSesion({ sesion, children }: { sesion: Sesion; children: React.ReactNode }) {
  return <Ctx.Provider value={sesion}>{children}</Ctx.Provider>;
}

export function useSesion() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSesion fuera del panel');
  return { ...s, esGestion: GESTION.includes(s.rol), esDirector: s.rol === 'DIRECTOR' };
}
