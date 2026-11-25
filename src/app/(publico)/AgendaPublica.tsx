'use client';
import { useState } from 'react';
import { Calendario, rangoMes, type EventoCal } from '@/components/Calendario';
import { Alerta, Insignia, Modal, useServicio } from '@/components/ui';
import type { Pagina } from '@/lib/cliente';
import { fmtFechaHora } from '@/lib/formato';

interface Concierto extends EventoCal {
  agrupacion: string;
  descripcion: string | null;
  estado: string;
}

export function AgendaPublica() {
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [sel, setSel] = useState<Concierto | null>(null);
  const { datos, error } = useServicio<Pagina<Concierto>>(`/conciertos?${rangoMes(mes)}`);
  const proximos = useServicio<Pagina<Concierto>>(`/conciertos?desde=${new Date().toISOString().slice(0, 10)}&estado=PROGRAMADO&tamano=6`);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h2 className="mb-3 text-xl">Agenda de conciertos</h2>
        <Alerta>{error}</Alerta>
        <Calendario mes={mes} onCambiarMes={setMes} eventos={datos?.datos ?? []} onSeleccionar={(e) => setSel(e as Concierto)} />
      </div>
      <div>
        <h2 className="mb-3 text-xl">Próximos conciertos</h2>
        <div className="space-y-3">
          {proximos.datos?.datos.map((c) => (
            <button key={c.id} onClick={() => setSel(c)} className="tarjeta block w-full p-4 text-left hover:border-marca-500">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-marca-800">{c.titulo}</p>
                <Insignia valor={c.tipo} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{fmtFechaHora(c.fecha)}</p>
              <p className="text-sm text-slate-500">📍 {c.lugar}</p>
            </button>
          ))}
          {proximos.datos?.datos.length === 0 && <p className="text-sm text-slate-500">No hay conciertos programados.</p>}
        </div>
      </div>
      <Modal abierto={!!sel} titulo={sel?.titulo ?? ''} onCerrar={() => setSel(null)}>
        {sel && (
          <div className="space-y-2 text-sm">
            <p className="flex gap-2"><Insignia valor={sel.tipo} /> <Insignia valor={sel.estado} /></p>
            <p><strong>Fecha:</strong> {fmtFechaHora(sel.fecha)}</p>
            <p><strong>Lugar:</strong> {sel.lugar}</p>
            <p><strong>Agrupación:</strong> {sel.agrupacion}</p>
            {sel.descripcion && <p className="text-slate-600">{sel.descripcion}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
