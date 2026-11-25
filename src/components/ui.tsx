'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/cliente';
import { etiqueta } from '@/lib/constantes';

const COLORES: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  APROBADA: 'bg-emerald-100 text-emerald-800',
  RECHAZADA: 'bg-red-100 text-red-700',
  PROGRAMADO: 'bg-marca-100 text-marca-700',
  REALIZADO: 'bg-emerald-100 text-emerald-800',
  CANCELADO: 'bg-red-100 text-red-700',
  DISPONIBLE: 'bg-emerald-100 text-emerald-800',
  PRESTADO: 'bg-amber-100 text-amber-800',
  MANTENIMIENTO: 'bg-orange-100 text-orange-800',
  BAJA: 'bg-slate-200 text-slate-600',
  ABIERTO: 'bg-emerald-100 text-emerald-800',
  EN_CURSO: 'bg-marca-100 text-marca-700',
  CERRADO: 'bg-slate-200 text-slate-600',
  BORRADOR: 'bg-slate-200 text-slate-600',
  PUBLICADA: 'bg-emerald-100 text-emerald-800',
  CERRADA: 'bg-slate-200 text-slate-600',
  ESPECIAL: 'bg-purple-100 text-purple-800',
  RETRETA: 'bg-sky-100 text-sky-800',
  SOLICITADO: 'bg-oro-400/30 text-amber-900',
  BUENO: 'bg-emerald-100 text-emerald-800',
  REGULAR: 'bg-amber-100 text-amber-800',
  MALO: 'bg-red-100 text-red-700',
};

export function Insignia({ valor, texto }: { valor: string; texto?: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${COLORES[valor] ?? 'bg-slate-100 text-slate-700'}`}>
      {texto ?? etiqueta(valor)}
    </span>
  );
}

export function Alerta({ tipo = 'error', children }: { tipo?: 'error' | 'exito' | 'info'; children: React.ReactNode }) {
  if (!children) return null;
  const c = {
    error: 'border-red-200 bg-red-50 text-red-700',
    exito: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-marca-100 bg-marca-50 text-marca-700',
  }[tipo];
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${c}`}>
      {children}
    </div>
  );
}

export function Campo({ etiqueta: et, children, ayuda }: { etiqueta: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className="block">
      {et}
      {children}
      {ayuda && <span className="mt-1 block text-xs font-normal text-slate-500">{ayuda}</span>}
    </label>
  );
}

export function Cargando() {
  return <p className="py-6 text-center text-sm text-slate-500">Cargando…</p>;
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-slate-500">{children}</p>;
}

export function Encabezado({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1>{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function Modal({ abierto, titulo, onCerrar, children }: { abierto: boolean; titulo: string; onCerrar: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!abierto) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [abierto, onCerrar]);
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:items-center" onClick={onCerrar}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className="w-full max-w-2xl rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2>{titulo}</h2>
          <button className="text-2xl leading-none text-slate-400 hover:text-slate-700" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function Indicador({ titulo, valor, detalle }: { titulo: string; valor: number | string; detalle?: string }) {
  return (
    <div className="tarjeta">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{titulo}</p>
      <p className="mt-1 text-3xl font-bold text-marca-700">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </div>
  );
}

/** Hook para cargar datos de un servicio con estado de carga/error y recarga manual. */
export function useServicio<T>(ruta: string | null) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const recargar = useCallback(async () => {
    if (!ruta) return;
    setCargando(true);
    try {
      setDatos(await api<T>(ruta));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [ruta]);
  useEffect(() => {
    recargar();
  }, [recargar]);
  return { datos, error, cargando, recargar, setDatos };
}

/** Convierte un FormData en objeto plano, omitiendo cadenas vacías. */
export function formAObjeto(form: HTMLFormElement): Record<string, string> {
  const o: Record<string, string> = {};
  new FormData(form).forEach((v, k) => {
    if (typeof v === 'string' && v.trim() !== '') o[k] = v.trim();
  });
  return o;
}
