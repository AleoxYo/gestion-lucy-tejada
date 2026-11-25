'use client';
import { useState } from 'react';
import { Alerta, Campo, Encabezado } from '@/components/ui';
import { SoloRoles } from '@/components/SoloRoles';
import { descargar } from '@/lib/cliente';
import { GESTION } from '@/lib/constantes';

const REPORTES = [
  { tipo: 'conciertos', titulo: 'Conciertos', desc: 'Conciertos especiales, retretas y solicitados en el rango de fechas.', fechas: true },
  { tipo: 'asistencia', titulo: 'Asistencia a formación', desc: 'Asistencia y certificación por participante en festivales y procesos.', fechas: true },
  { tipo: 'instrumentos', titulo: 'Salidas de instrumentos', desc: 'Trazabilidad de salidas y regresos por concierto.', fechas: true },
  { tipo: 'inventario', titulo: 'Inventario de instrumentos', desc: 'Estado actual de todos los instrumentos.', fechas: false },
];

export default function Reportes() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState('');

  const bajar = async (tipo: string, formato: 'xlsx' | 'pdf', fechas: boolean) => {
    setError('');
    setOcupado(`${tipo}-${formato}`);
    const qs = new URLSearchParams({ formato, ...(fechas && desde && { desde }), ...(fechas && hasta && { hasta }) });
    try {
      await descargar(`/reportes/${tipo}?${qs}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado('');
    }
  };

  return (
    <SoloRoles roles={GESTION}>
      <Encabezado titulo="Reportes" descripcion="Exporte la información del módulo a Excel o PDF." />
      <div className="tarjeta mb-6 grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Desde"><input type="date" className="input" value={desde} onChange={(e) => setDesde(e.target.value)} /></Campo>
        <Campo etiqueta="Hasta"><input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} /></Campo>
        <p className="self-end text-xs text-slate-500">Deje las fechas vacías para incluir todos los registros.</p>
      </div>
      <Alerta>{error}</Alerta>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {REPORTES.map((r) => (
          <div key={r.tipo} className="tarjeta flex flex-col">
            <h2>{r.titulo}</h2>
            <p className="mt-1 flex-1 text-sm text-slate-600">{r.desc}</p>
            <div className="mt-4 flex gap-2">
              <button className="btn-exito" disabled={!!ocupado} onClick={() => bajar(r.tipo, 'xlsx', r.fechas)}>{ocupado === `${r.tipo}-xlsx` ? 'Generando…' : 'Excel'}</button>
              <button className="btn-peligro" disabled={!!ocupado} onClick={() => bajar(r.tipo, 'pdf', r.fechas)}>{ocupado === `${r.tipo}-pdf` ? 'Generando…' : 'PDF'}</button>
            </div>
          </div>
        ))}
      </div>
    </SoloRoles>
  );
}
