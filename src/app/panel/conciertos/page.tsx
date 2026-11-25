'use client';
import { useState } from 'react';
import { Calendario, rangoMes, type EventoCal } from '@/components/Calendario';
import { Alerta, Campo, Encabezado, Insignia, Modal, formAObjeto, useServicio } from '@/components/ui';
import { SoloRoles } from '@/components/SoloRoles';
import { useSesion } from '@/components/SesionContexto';
import { api, type Pagina } from '@/lib/cliente';
import { GESTION } from '@/lib/constantes';
import { aInputFechaHora, fmtFechaHora } from '@/lib/formato';

interface Concierto extends EventoCal {
  agrupacion: string;
  descripcion: string | null;
  estado: string;
}

type Edicion = { modo: 'nuevo'; fecha: Date } | { modo: 'editar'; c: Concierto };

export default function Conciertos() {
  const s = useSesion();
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const { datos, error, recargar } = useServicio<Pagina<Concierto>>(`/conciertos?${rangoMes(mes)}`);
  const [ed, setEd] = useState<Edicion | null>(null);
  const [errForm, setErrForm] = useState('');
  const [aviso, setAviso] = useState('');

  const abrirNuevo = (fecha = new Date()) => {
    const f = new Date(fecha);
    f.setHours(fecha.getHours() || 11, 0, 0, 0);
    setErrForm('');
    setEd({ modo: 'nuevo', fecha: f });
  };

  const guardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = formAObjeto(e.currentTarget);
    const body = { ...d, fecha: new Date(d.fecha).toISOString(), descripcion: d.descripcion ?? null };
    try {
      if (ed?.modo === 'editar') await api(`/conciertos/${ed.c.id}`, { method: 'PATCH', body });
      else await api('/conciertos', { method: 'POST', body });
      setAviso(ed?.modo === 'editar' ? 'Concierto actualizado.' : 'Concierto programado.');
      setEd(null);
      recargar();
    } catch (err) {
      setErrForm((err as Error).message);
    }
  };

  const eliminar = async (c: Concierto) => {
    if (!confirm(`¿Eliminar "${c.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api(`/conciertos/${c.id}`, { method: 'DELETE' });
      setEd(null);
      recargar();
    } catch (err) {
      setErrForm((err as Error).message);
    }
  };

  const c = ed?.modo === 'editar' ? ed.c : null;

  return (
    <SoloRoles roles={GESTION}>
      <Encabezado
        titulo="Calendario de conciertos"
        descripcion="Programe los conciertos especiales del mes y las retretas de la Banda Sinfónica. Haga clic en un día para programar."
        acciones={<button className="btn-primario" onClick={() => abrirNuevo()}>+ Programar concierto</button>}
      />
      <Alerta tipo="exito">{aviso}</Alerta>
      <Alerta>{error}</Alerta>
      <div className="mt-3">
        <Calendario mes={mes} onCambiarMes={setMes} eventos={datos?.datos ?? []} onDiaClick={abrirNuevo} onSeleccionar={(e) => { setErrForm(''); setEd({ modo: 'editar', c: e as Concierto }); }} />
      </div>

      <div className="tarjeta mt-6 overflow-x-auto p-0">
        <table className="tabla">
          <thead><tr><th>Fecha</th><th>Concierto</th><th>Tipo</th><th>Lugar</th><th>Estado</th></tr></thead>
          <tbody>
            {datos?.datos.filter((x) => new Date(x.fecha).getMonth() === mes.getMonth()).map((x) => (
              <tr key={x.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setEd({ modo: 'editar', c: x })}>
                <td className="whitespace-nowrap">{fmtFechaHora(x.fecha)}</td>
                <td className="font-medium">{x.titulo}</td>
                <td><Insignia valor={x.tipo} /></td>
                <td>{x.lugar}</td>
                <td><Insignia valor={x.estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal abierto={!!ed} titulo={c ? 'Editar concierto' : 'Programar concierto'} onCerrar={() => setEd(null)}>
        {ed && (
          <form key={c?.id ?? 'nuevo'} onSubmit={guardar} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Campo etiqueta="Título *"><input name="titulo" required minLength={3} className="input" defaultValue={c?.titulo} /></Campo>
            </div>
            <Campo etiqueta="Tipo *">
              <select name="tipo" className="input" defaultValue={c?.tipo ?? 'RETRETA'}>
                <option value="RETRETA">Retreta</option>
                <option value="ESPECIAL">Concierto especial del mes</option>
                <option value="SOLICITADO">Concierto solicitado</option>
              </select>
            </Campo>
            <Campo etiqueta="Fecha y hora *">
              <input name="fecha" type="datetime-local" required className="input" defaultValue={aInputFechaHora(c?.fecha ?? (ed.modo === 'nuevo' ? ed.fecha : new Date()))} />
            </Campo>
            <Campo etiqueta="Lugar *"><input name="lugar" required minLength={3} className="input" defaultValue={c?.lugar} /></Campo>
            <Campo etiqueta="Agrupación"><input name="agrupacion" className="input" defaultValue={c?.agrupacion ?? 'Banda Sinfónica de Pereira'} /></Campo>
            {c && (
              <Campo etiqueta="Estado">
                <select name="estado" className="input" defaultValue={c.estado}>
                  <option value="PROGRAMADO">Programado</option>
                  <option value="REALIZADO">Realizado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </Campo>
            )}
            <div className="sm:col-span-2">
              <Campo etiqueta="Descripción"><textarea name="descripcion" rows={3} className="input" defaultValue={c?.descripcion ?? ''} /></Campo>
            </div>
            <div className="sm:col-span-2"><Alerta>{errForm}</Alerta></div>
            <div className="flex flex-wrap justify-between gap-2 sm:col-span-2">
              <button className="btn-primario">Guardar</button>
              {c && s.esDirector && <button type="button" className="btn-peligro" onClick={() => eliminar(c)}>Eliminar</button>}
            </div>
          </form>
        )}
      </Modal>
    </SoloRoles>
  );
}
