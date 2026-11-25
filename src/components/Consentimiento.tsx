import Link from 'next/link';

/** Casilla de autorización de tratamiento de datos personales (Ley 1581 de 2012). */
export function Consentimiento() {
  return (
    <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-normal text-slate-600">
      <input type="checkbox" name="aceptaTratamiento" required className="mt-0.5" />
      <span>
        Autorizo a la Secretaría de Cultura de Pereira a tratar mis datos personales para gestionar esta solicitud, conforme a la Ley 1581 de 2012
        y a la{' '}
        <Link href="/privacidad" target="_blank" className="enlace">
          política de tratamiento de datos
        </Link>
        .
      </span>
    </label>
  );
}
