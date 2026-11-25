'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Alerta, Campo, Cargando, Encabezado, Insignia, Modal, Vacio, formAObjeto, useServicio } from '@/components/ui';
import { SoloRoles } from '@/components/SoloRoles';
import { useSesion } from '@/components/SesionContexto';
import { api, type Pagina } from '@/lib/cliente';
import { fmtFecha } from '@/lib/formato';

interface Proceso {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  cupo: number;
  inscritos: number;
  formador: { nombre: string } | null;
  numeroContrato: string | null;
  _count: { jornadas: number };
}

export default function Formacion() {
  const s = useSesion();
  const [estado, setEstado] = useState('');
  const ruta = `/formacion/procesos?tamano=100${estado ? `&estado=${estado}` : ''}${s.rol === 'FORMADOR' ? '&mios=true' : ''}`;
  const { datos, error, cargando, recargar } = useServicio<Pagina<Proceso>>(ruta);
  const formadores = useServicio<Pagina<{ id: string; nombre: string }>>(s.esGestion ? '/usuarios?rol=FORMADOR' : null);
  const [abierto, setAbierto] = useState(false);
  const [errForm, setErrForm] = useState('');

  const crear = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = formAObjeto(e.currentTarget);
    try {
      await api('/formacion/procesos', {
        method: 'POST',
        body: { ...d, fechaInicio: new Date(`${d.fechaInicio}T00:00`).toISOString(), fechaFin: new Date(`${d.fechaFin}T23:59`).toISOString(), formadorId: d.formadorId ?? null },
      });
      setAbierto(false);
      recargar();
    } catch (err) {
      setErrForm((err as Error).message);
    }
  };

  return (
    <SoloRoles roles={['DIRECTOR', 'AUXILIAR', 'FORMADOR']}>
      <Encabezado
        titulo={s.rol === 'FORMADOR' ? 'Mis procesos asignados' : 'Festivales y procesos de formación'}
        descripcion="Cronograma, formador asignado, necesidades identificadas, inscritos, asistencia y certificados."
        acciones={s.esGestion && <button className="btn-primario" onClick={() => { setErrForm(''); setAbierto(true); }}>+ Crear festival o proceso</button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {[['', 'Todos'], ['ABIERTO', 'Inscripciones abiertas'], ['EN_CURSO', 'En curso'], ['CERRADO', 'Cerrados']].map(([v, t]) => (
          <button key={v} onClick={() => setEstado(v)} className={estado === v ? 'btn-primario btn-sm' : 'btn-secundario btn-sm'}>{t}</button>
        ))}
      </div>
      <Alerta>{error}</Alerta>
      <div className="tarjeta overflow-x-auto p-0">
        {cargando && !datos ? <Cargando /> : (
          <table className="tabla">
            <thead><tr><th>Nombre</th><th>Tipo</th><th>Fechas</th><th>Formador</th><th>Jornadas</th><th>Inscritos</th><th>Estado</th></tr></thead>
            <tbody>
              {datos?.datos.map((p) => (
                <tr key={p.id}>
                  <td><Link className="enlace" href={`/panel/formacion/${p.id}`}>{p.nombre}</Link>{p.numeroContrato && <p className="text-xs text-slate-500">Contrato {p.numeroContrato}</p>}</td>
                  <td><Insignia valor={p.tipo} /></td>
                  <td className="whitespace-nowrap">{fmtFecha(p.fechaInicio)} – {fmtFecha(p.fechaFin)}</td>
                  <td>{p.formador?.nombre ?? <span className="text-slate-400">Sin asignar</span>}</td>
                  <td>{p._count.jornadas}</td>
                  <td>{p.inscritos} / {p.cupo}</td>
                  <td><Insignia valor={p.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {datos?.datos.length === 0 && <Vacio>No hay procesos.</Vacio>}
      </div>

      <Modal abierto={abierto} titulo="Crear festival o proceso de formación" onCerrar={() => setAbierto(false)}>
        <form onSubmit={crear} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Campo etiqueta="Nombre *"><input name="nombre" required minLength={3} className="input" /></Campo></div>
          <Campo etiqueta="Tipo *">
            <select name="tipo" className="input"><option value="FORMACION">Proceso de formación</option><option value="FESTIVAL">Festival</option></select>
          </Campo>
          <Campo etiqueta="Formador asignado">
            <select name="formadorId" className="input">
              <option value="">Por asignar</option>
              {formadores.datos?.datos.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Fecha de inicio *"><input name="fechaInicio" type="date" required className="input" /></Campo>
          <Campo etiqueta="Fecha de fin *"><input name="fechaFin" type="date" required className="input" /></Campo>
          <Campo etiqueta="Cupo *"><input name="cupo" type="number" min={1} defaultValue={30} required className="input" /></Campo>
          <Campo etiqueta="Asistencia mínima para certificar (%)"><input name="asistenciaMinima" type="number" min={0} max={100} defaultValue={80} className="input" /></Campo>
          <Campo etiqueta="N.º de contrato (referencia)" ayuda="La contratación la realiza la Alcaldía."><input name="numeroContrato" className="input" /></Campo>
          <div />
          <div className="sm:col-span-2"><Campo etiqueta="Necesidades de formación identificadas *"><textarea name="necesidades" required minLength={5} rows={3} className="input" /></Campo></div>
          <div className="sm:col-span-2"><Campo etiqueta="Descripción"><textarea name="descripcion" rows={2} className="input" /></Campo></div>
          <div className="sm:col-span-2"><Alerta>{errForm}</Alerta></div>
          <div><button className="btn-primario">Crear</button></div>
        </form>
      </Modal>
    </SoloRoles>
  );
}
