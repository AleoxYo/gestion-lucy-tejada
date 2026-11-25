'use client';
import type { Rol } from '@/lib/constantes';
import { useSesion } from './SesionContexto';
import { Alerta } from './ui';

/** Oculta una página del panel a los roles que no tienen permiso (el servicio también lo valida). */
export function SoloRoles({ roles, children }: { roles: Rol[]; children: React.ReactNode }) {
  const s = useSesion();
  if (!roles.includes(s.rol)) return <Alerta>No tiene permisos para ver esta sección.</Alerta>;
  return <>{children}</>;
}
