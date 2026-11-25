'use client';
import { useMemo } from 'react';

export interface EventoCal {
  id: string;
  titulo: string;
  fecha: string;
  tipo: string;
  lugar: string;
  estado?: string;
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const COLOR: Record<string, string> = {
  ESPECIAL: 'bg-purple-600',
  RETRETA: 'bg-sky-600',
  SOLICITADO: 'bg-oro-500',
};

export function Calendario({
  mes,
  onCambiarMes,
  eventos,
  onSeleccionar,
  onDiaClick,
}: {
  mes: Date;
  onCambiarMes: (d: Date) => void;
  eventos: EventoCal[];
  onSeleccionar?: (e: EventoCal) => void;
  onDiaClick?: (d: Date) => void;
}) {
  const celdas = useMemo(() => {
    const primero = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const offset = (primero.getDay() + 6) % 7; // lunes = 0
    const inicio = new Date(primero);
    inicio.setDate(1 - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      return d;
    });
  }, [mes]);

  const porDia = useMemo(() => {
    const m = new Map<string, EventoCal[]>();
    for (const e of eventos) {
      const k = new Date(e.fecha).toDateString();
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    return m;
  }, [eventos]);

  const hoy = new Date().toDateString();
  const titulo = mes.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  return (
    <div className="tarjeta p-0">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button className="btn-secundario btn-sm" onClick={() => onCambiarMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} aria-label="Mes anterior">
          ‹
        </button>
        <h2 className="capitalize">{titulo}</h2>
        <button className="btn-secundario btn-sm" onClick={() => onCambiarMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} aria-label="Mes siguiente">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500">
        {DIAS.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {celdas.map((d) => {
          const delMes = d.getMonth() === mes.getMonth();
          const evs = porDia.get(d.toDateString()) ?? [];
          return (
            <div
              key={d.toISOString()}
              onClick={() => onDiaClick?.(d)}
              className={`min-h-20 border-r border-b border-slate-100 p-1 text-xs sm:min-h-24 ${delMes ? 'bg-white' : 'bg-slate-50 text-slate-400'} ${onDiaClick ? 'cursor-pointer hover:bg-marca-50' : ''}`}
            >
              <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full ${d.toDateString() === hoy ? 'bg-marca-700 font-bold text-white' : ''}`}>{d.getDate()}</div>
              <div className="space-y-1">
                {evs.map((e) => (
                  <button
                    key={e.id}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onSeleccionar?.(e);
                    }}
                    title={`${e.titulo} · ${e.lugar}`}
                    className={`block w-full truncate rounded px-1 py-0.5 text-left text-[11px] text-white ${COLOR[e.tipo] ?? 'bg-slate-500'} ${e.estado === 'CANCELADO' ? 'line-through opacity-50' : ''}`}
                  >
                    <span className="hidden sm:inline">{new Date(e.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} </span>
                    {e.titulo}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 px-4 py-3 text-xs text-slate-600">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-purple-600" /> Concierto especial</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-sky-600" /> Retreta</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-oro-500" /> Concierto solicitado</span>
      </div>
    </div>
  );
}

export function rangoMes(mes: Date) {
  const desde = new Date(mes.getFullYear(), mes.getMonth(), 1);
  desde.setDate(desde.getDate() - 7);
  const hasta = new Date(mes.getFullYear(), mes.getMonth() + 1, 7);
  return `desde=${desde.toISOString()}&hasta=${hasta.toISOString()}&tamano=200`;
}
