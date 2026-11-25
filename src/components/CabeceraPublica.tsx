import Link from 'next/link';
import { sesionActual } from '@/lib/sesionServidor';

export async function CabeceraPublica() {
  const s = await sesionActual();
  return (
    <header className="bg-marca-800 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-oro-400 text-xl text-marca-800" aria-hidden>
            ♪
          </span>
          <span>
            <span className="block text-base leading-tight font-bold">Centro Cultural Lucy Tejada</span>
            <span className="block text-xs text-marca-100">Área de Música · Secretaría de Cultura de Pereira</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <Link className="rounded px-3 py-1.5 hover:bg-white/10" href="/#agenda">Agenda</Link>
          <Link className="rounded px-3 py-1.5 hover:bg-white/10" href="/festivales">Festivales y formación</Link>
          <Link className="rounded px-3 py-1.5 hover:bg-white/10" href="/solicitar">Solicitar concierto</Link>
          {s ? (
            <Link className="ml-1 rounded-lg bg-oro-400 px-3 py-1.5 font-semibold text-marca-800 hover:bg-oro-500" href="/panel">
              Mi panel
            </Link>
          ) : (
            <Link className="ml-1 rounded-lg bg-oro-400 px-3 py-1.5 font-semibold text-marca-800 hover:bg-oro-500" href="/login">
              Ingresar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function PiePublico() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-6 text-xs text-slate-500">
        <p>SGM-LT · Sistema de Gestión Musical Lucy Tejada · Pereira, 2026</p>
        <p className="flex flex-wrap gap-4">
          <Link className="hover:underline" href="/privacidad">Política de tratamiento de datos (Ley 1581 de 2012)</Link>
          <Link className="hover:underline" href="/verificar">Verificar certificado</Link>
          <a className="hover:underline" href="/docs">Servicios REST (OpenAPI)</a>
        </p>
      </div>
    </footer>
  );
}
