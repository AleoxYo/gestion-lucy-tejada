'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Sesion } from '@/lib/jwt';
import { ROL_LABEL, type Rol } from '@/lib/constantes';
import { api } from '@/lib/cliente';
import { ProveedorSesion } from './SesionContexto';

interface Item {
  href: string;
  texto: string;
  icono: string;
  roles: Rol[];
}

const G: Rol[] = ['DIRECTOR', 'AUXILIAR'];
const MENU: { grupo: string; items: Item[] }[] = [
  { grupo: 'General', items: [{ href: '/panel', texto: 'Inicio', icono: '🏠', roles: ['DIRECTOR', 'AUXILIAR', 'FORMADOR', 'PARTICIPANTE'] }] },
  {
    grupo: 'Conciertos',
    items: [
      { href: '/panel/solicitudes', texto: 'Solicitudes', icono: '📨', roles: G },
      { href: '/panel/conciertos', texto: 'Calendario', icono: '📅', roles: G },
      { href: '/panel/instrumentos', texto: 'Instrumentos', icono: '🎺', roles: G },
    ],
  },
  {
    grupo: 'Formación',
    items: [
      { href: '/panel/formacion', texto: 'Festivales y procesos', icono: '🎓', roles: ['DIRECTOR', 'AUXILIAR', 'FORMADOR'] },
      { href: '/panel/mis-procesos', texto: 'Mis procesos', icono: '🎓', roles: ['PARTICIPANTE'] },
      { href: '/festivales', texto: 'Oferta e inscripción', icono: '📝', roles: ['PARTICIPANTE'] },
    ],
  },
  {
    grupo: 'Seguimiento',
    items: [
      { href: '/panel/encuestas', texto: 'Encuestas', icono: '📊', roles: G },
      { href: '/panel/reportes', texto: 'Reportes', icono: '📄', roles: G },
      { href: '/panel/notificaciones', texto: 'Notificaciones', icono: '✉️', roles: G },
    ],
  },
  {
    grupo: 'Administración',
    items: [
      { href: '/panel/usuarios', texto: 'Usuarios y roles', icono: '👥', roles: ['DIRECTOR'] },
      { href: '/panel/accesos', texto: 'Registro de accesos', icono: '🔐', roles: ['DIRECTOR'] },
    ],
  },
  { grupo: 'Cuenta', items: [{ href: '/panel/mis-datos', texto: 'Mis datos', icono: '👤', roles: ['DIRECTOR', 'AUXILIAR', 'FORMADOR', 'PARTICIPANTE'] }] },
];

export function PanelShell({ sesion, children }: { sesion: Sesion; children: React.ReactNode }) {
  const ruta = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const salir = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => null);
    router.push('/login');
    router.refresh();
  };

  const activo = (href: string) => (href === '/panel' ? ruta === '/panel' : ruta.startsWith(href));

  const nav = (
    <nav className="space-y-5 p-4">
      {MENU.map((g) => {
        const items = g.items.filter((i) => i.roles.includes(sesion.rol));
        if (!items.length) return null;
        return (
          <div key={g.grupo}>
            <p className="mb-1 px-3 text-[11px] font-semibold tracking-wider text-marca-100/70 uppercase">{g.grupo}</p>
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setMenuAbierto(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${activo(i.href) ? 'bg-white/15 font-semibold text-white' : 'text-marca-100 hover:bg-white/10'}`}
              >
                <span aria-hidden>{i.icono}</span>
                {i.texto}
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );

  return (
    <ProveedorSesion sesion={sesion}>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 bg-marca-800 lg:block">
          <Link href="/" className="flex items-center gap-2 border-b border-white/10 px-5 py-4 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-oro-400 text-lg text-marca-800">♪</span>
            <span className="text-sm leading-tight font-bold">
              SGM-LT
              <span className="block text-[11px] font-normal text-marca-100">Módulo de Música</span>
            </span>
          </Link>
          {nav}
        </aside>

        {menuAbierto && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenuAbierto(false)}>
            <div className="absolute inset-0 bg-slate-900/50" />
            <aside className="absolute top-0 left-0 h-full w-64 overflow-y-auto bg-marca-800" onClick={(e) => e.stopPropagation()}>
              {nav}
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
            <button className="btn-secundario btn-sm lg:hidden" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
              ☰ Menú
            </button>
            <div className="hidden text-sm text-slate-500 lg:block">Plataforma de Gestión del Centro Cultural Lucy Tejada</div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <p className="font-semibold text-slate-800">{sesion.nombre}</p>
                <p className="text-xs text-slate-500">{ROL_LABEL[sesion.rol]}</p>
              </div>
              <button className="btn-secundario btn-sm" onClick={salir}>
                Salir
              </button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ProveedorSesion>
  );
}
