import { ApiError } from './api';
import type { Sesion } from './jwt';
import { GESTION } from './constantes';

/** Gestión del proceso: Director, Auxiliar o el formador asignado. */
export function puedeGestionarProceso(s: Sesion, proceso: { formadorId: string | null }) {
  return GESTION.includes(s.rol) || (s.rol === 'FORMADOR' && proceso.formadorId === s.sub);
}

export function exigirGestionProceso(s: Sesion, proceso: { formadorId: string | null }) {
  if (!puedeGestionarProceso(s, proceso)) throw new ApiError(403, 'No tiene permisos sobre este proceso');
}

/** Porcentaje de asistencia de una inscripción sobre el total de jornadas del proceso. */
export function porcentajeAsistencia(totalJornadas: number, presentes: number) {
  if (totalJornadas === 0) return 0;
  return Math.round((presentes / totalJornadas) * 100);
}

export function codigoCertificado() {
  const año = new Date().getFullYear();
  const aleatorio = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `LT-${año}-${aleatorio}`;
}
