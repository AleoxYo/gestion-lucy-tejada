'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Alerta, Campo, Cargando, Encabezado, Insignia, Modal, Vacio, formAObjeto, useServicio } from '@/components/ui';
import { SoloRoles } from '@/components/SoloRoles';
import { api, type Pagina } from '@/lib/cliente';
import { etiqueta, FAMILIAS_INSTRUMENTO, GESTION } from '@/lib/constantes';
import { fmtFechaHora } from '@/lib/formato';

interface Instrumento {
  id: string;
  codigo: string;
  nombre: string;
  familia: string;
  marca: string | null;
  estado: string;
  observaciones: string | null;
}
interface Movimiento {
  id: string;
  responsable: string;
  fechaSalida: string;
  estadoSalida: string;
  observaciones: string | null;
  instrumento: { id: string; codigo: string; nombre: string };
  concierto: { id: string; titulo: string; fecha: string; lugar: string };
}
interface Concierto {
  id: string;
  titulo: string;
  fecha: string;
}

export default function Instrumentos() {
  const [filtro, setFiltro] = useState({ estado: '', q: '' });
  const qs = new URLSearchParams({ tamano: '200', ...(filtro.estado && { estado: filtro.estado }), ...(filtro.q && { q: filtro.q }) });
  const inv = useServicio<Pagina<Instrumento>>(`/instrumentos?${qs}`);
  const abiertos = useServicio<Pagina<Movimiento>>('/instrumentos/movimientos?abiertos=true&tamano=200');
  const [modal, setModal] = useState<'nuevo' | 'salida' | null>(null);
  const [regreso, setRegreso] = useState<Movimiento | null>(null);
  const [errForm, setErrForm] = useState('');
  const [aviso, setAviso] = useState('');

  const recargarTodo = () => {
    inv.recargar();
    abiertos.recargar();
  };

  const crear = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api('/instrumentos', { method: 'POST', body: formAObjeto(e.currentTarget) });
      setModal(null);
      setAviso('Instrumento registrado en el inventario.');
      recargarTodo();
    } catch (err) {
      setErrForm((err as Error).message);
    }
  };

  const registrarRegreso = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!regreso) return;
    try {
      const d = formAObjeto(e.currentTarget);
      await api(`/instrumentos/movimientos/${regreso.id}/regreso`, { method: 'POST', body: d });
      setAviso(`Regreso de ${regreso.instrumento.codigo} registrado${d.estadoRegreso === 'MALO' ? ' (pasa a mantenimiento)' : ''}.`);
      setRegreso(null);
      recargarTodo();
    } catch (err) {
      setErrForm((err as Error).message);
    }
  };

  const cambiarEstado = async (i: Instrumento, estado: string) => {
    try {
      await api(`/instrumentos/${i.id}`, { method: 'PATCH', body: { estado } });
      recargarTodo();
    } catch (err) {
      setAviso('');
      alert((err as Error).message);
    }
  };

  return (
    <SoloRoles roles={GESTION}>
      <Encabezado
        titulo="Instrumentos"
        descripcion="Inventario y control de salidas y regresos de instrumentos para cada concierto."
        acciones={
          <>
            <button className="btn-secundario" onClick={() => { setErrForm(''); setModal('nuevo'); }}>+ Instrumento</button>
            <button className="btn-primario" onClick={() => { setErrForm(''); setModal('salida'); }}>Registrar salida</button>
          </>
        }
      />
      <Alerta tipo="exito">{aviso}</Alerta>

      <section className="tarjeta mt-3 p-0">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2>Instrumentos fuera del centro ({abiertos.datos?.total ?? 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="tabla">
            <thead><tr><th>Instrumento</th><th>Concierto</th><th>Responsable</th><th>Salida</th><th></th></tr></thead>
            <tbody>
              {abiertos.datos?.datos.map((m) => (
                <tr key={m.id}>
                  <td><span className="font-mono text-xs">{m.instrumento.codigo}</span> {m.instrumento.nombre}</td>
                  <td>{m.concierto.titulo}<p className="text-xs text-slate-500">{fmtFechaHora(m.concierto.fecha)}</p></td>
                  <td>{m.responsable}</td>
                  <td className="whitespace-nowrap">{fmtFechaHora(m.fechaSalida)} <Insignia valor={m.estadoSalida} /></td>
                  <td className="text-right"><button className="btn-exito btn-sm" onClick={() => { setErrForm(''); setRegreso(m); }}>Registrar regreso</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {abiertos.datos?.datos.length === 0 && <Vacio>Todos los instrumentos están en el centro.</Vacio>}
        </div>
      </section>

      <section className="tarjeta mt-6 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2>Inventario ({inv.datos?.total ?? 0})</h2>
          <div className="flex flex-wrap gap-2">
            <input placeholder="Buscar código o nombre" className="input mt-0 w-48" value={filtro.q} onChange={(e) => setFiltro({ ...filtro, q: e.target.value })} />
            <select className="input mt-0 w-40" value={filtro.estado} onChange={(e) => setFiltro({ ...filtro, estado: e.target.value })}>
              <option value="">Todos los estados</option>
              {['DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO', 'BAJA'].map((e) => <option key={e} value={e}>{etiqueta(e)}</option>)}
            </select>
          </div>
        </div>
        <Alerta>{inv.error}</Alerta>
        <div className="overflow-x-auto">
          {inv.cargando && !inv.datos ? <Cargando /> : (
            <table className="tabla">
              <thead><tr><th>Código</th><th>Nombre</th><th>Familia</th><th>Marca</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {inv.datos?.datos.map((i) => (
                  <tr key={i.id}>
                    <td className="font-mono text-xs">{i.codigo}</td>
                    <td><Link className="enlace" href={`/panel/instrumentos/${i.id}`}>{i.nombre}</Link>{i.observaciones && <p className="text-xs text-slate-500">{i.observaciones}</p>}</td>
                    <td>{etiqueta(i.familia)}</td>
                    <td>{i.marca}</td>
                    <td><Insignia valor={i.estado} /></td>
                    <td className="text-right whitespace-nowrap">
                      {i.estado === 'DISPONIBLE' && <button className="btn-secundario btn-sm" onClick={() => cambiarEstado(i, 'MANTENIMIENTO')}>A mantenimiento</button>}
                      {i.estado === 'MANTENIMIENTO' && <button className="btn-secundario btn-sm" onClick={() => cambiarEstado(i, 'DISPONIBLE')}>Marcar disponible</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <Modal abierto={modal === 'nuevo'} titulo="Registrar instrumento" onCerrar={() => setModal(null)}>
        <form onSubmit={crear} className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Código *"><input name="codigo" required className="input uppercase" placeholder="TP-003" /></Campo>
          <Campo etiqueta="Nombre *"><input name="nombre" required className="input" /></Campo>
          <Campo etiqueta="Familia *">
            <select name="familia" className="input">{FAMILIAS_INSTRUMENTO.map((f) => <option key={f} value={f}>{etiqueta(f)}</option>)}</select>
          </Campo>
          <Campo etiqueta="Marca"><input name="marca" className="input" /></Campo>
          <div className="sm:col-span-2"><Campo etiqueta="Observaciones"><textarea name="observaciones" rows={2} className="input" /></Campo></div>
          <div className="sm:col-span-2"><Alerta>{errForm}</Alerta></div>
          <div><button className="btn-primario">Guardar</button></div>
        </form>
      </Modal>

      {modal === 'salida' && (
        <ModalSalida
          onCerrar={() => setModal(null)}
          onListo={(n) => { setModal(null); setAviso(`Salida registrada para ${n} instrumento(s).`); recargarTodo(); }}
        />
      )}

      <Modal abierto={!!regreso} titulo="Registrar regreso" onCerrar={() => setRegreso(null)}>
        {regreso && (
          <form onSubmit={registrarRegreso} className="space-y-3">
            <p className="text-sm"><strong>{regreso.instrumento.codigo}</strong> {regreso.instrumento.nombre} · {regreso.concierto.titulo}</p>
            <Campo etiqueta="Estado en que regresa">
              <select name="estadoRegreso" className="input" defaultValue="BUENO">
                <option value="BUENO">Bueno</option>
                <option value="REGULAR">Regular</option>
                <option value="MALO">Malo (pasa a mantenimiento)</option>
              </select>
            </Campo>
            <Campo etiqueta="Observaciones"><textarea name="observaciones" rows={2} className="input" /></Campo>
            <Alerta>{errForm}</Alerta>
            <button className="btn-exito">Confirmar regreso</button>
          </form>
        )}
      </Modal>
    </SoloRoles>
  );
}

function ModalSalida({ onCerrar, onListo }: { onCerrar: () => void; onListo: (n: number) => void }) {
  const disp = useServicio<Pagina<Instrumento>>('/instrumentos?estado=DISPONIBLE&tamano=200');
  const disponibles = disp.datos?.datos ?? [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const conciertos = useServicio<Pagina<Concierto>>(`/conciertos?desde=${hoy.toISOString()}&estado=PROGRAMADO&tamano=50`);
  const [sel, setSel] = useState<string[]>([]);
  const [error, setError] = useState('');

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = formAObjeto(e.currentTarget);
    try {
      await api('/instrumentos/salidas', { method: 'POST', body: { ...d, instrumentoIds: sel } });
      onListo(sel.length);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Modal abierto titulo="Registrar salida de instrumentos" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-3">
        <Campo etiqueta="Concierto *">
          <select name="conciertoId" required className="input">
            <option value="">Seleccione…</option>
            {conciertos.datos?.datos.map((c) => <option key={c.id} value={c.id}>{fmtFechaHora(c.fecha)} · {c.titulo}</option>)}
          </select>
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Responsable que recibe *"><input name="responsable" required minLength={3} className="input" /></Campo>
          <Campo etiqueta="Estado de salida">
            <select name="estadoSalida" className="input"><option value="BUENO">Bueno</option><option value="REGULAR">Regular</option></select>
          </Campo>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Instrumentos disponibles ({sel.length} seleccionados)</p>
          <div className="mt-1 grid max-h-60 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2">
            {disponibles.map((i) => (
              <label key={i.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm font-normal hover:bg-slate-50">
                <input type="checkbox" checked={sel.includes(i.id)} onChange={(e) => setSel(e.target.checked ? [...sel, i.id] : sel.filter((x) => x !== i.id))} />
                <span className="font-mono text-xs">{i.codigo}</span> {i.nombre}
              </label>
            ))}
            {!disponibles.length && <p className="text-sm text-slate-500">No hay instrumentos disponibles.</p>}
          </div>
        </div>
        <Campo etiqueta="Observaciones"><textarea name="observaciones" rows={2} className="input" /></Campo>
        <Alerta>{error}</Alerta>
        <button className="btn-primario" disabled={!sel.length}>Registrar salida</button>
      </form>
    </Modal>
  );
}
