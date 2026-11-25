'use client';
import Link from 'next/link';
import { use, useState } from 'react';
import { Alerta, Campo, Cargando, Encabezado, Insignia, Modal, Vacio, formAObjeto, useServicio } from '@/components/ui';
import { useSesion } from '@/components/SesionContexto';
import { api, descargar, type Pagina } from '@/lib/cliente';
import { aInputFechaHora, fmtFecha, fmtFechaHora } from '@/lib/formato';

interface Detalle {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  necesidades: string;
  numeroContrato: string | null;
  fechaInicio: string;
  fechaFin: string;
  cupo: number;
  asistenciaMinima: number;
  estado: string;
  gestiona: boolean;
  formador: { id: string; nombre: string; email: string } | null;
  jornadas: { id: string; fecha: string; tema: string; lugar: string | null; _count: { asistencias: number } }[];
  inscripciones: {
    id: string;
    certificado: boolean;
    codigoCertificado: string | null;
    porcentajeAsistencia: number | null;
    participante: { id: string; nombre: string; email: string; documento: string | null };
    _count: { asistencias: number };
  }[];
}

interface Planilla {
  jornada: { id: string; fecha: string; tema: string };
  registros: { inscripcionId: string; participante: string; documento: string | null; presente: boolean }[];
}

export default function DetalleProceso({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const s = useSesion();
  const { datos: p, error, cargando, recargar } = useServicio<Detalle>(`/formacion/procesos/${id}`);
  const [modal, setModal] = useState<'jornada' | 'inscribir' | null>(null);
  const [planilla, setPlanilla] = useState<Planilla | null>(null);
  const [errForm, setErrForm] = useState('');
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  if (cargando && !p) return <Cargando />;
  if (error || !p) return <Alerta>{error || 'No encontrado'}</Alerta>;

  const total = p.jornadas.length;
  const cerrado = p.estado === 'CERRADO';
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const agregarJornada = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = formAObjeto(e.currentTarget);
    try {
      await api(`/formacion/procesos/${id}/jornadas`, { method: 'POST', body: { ...d, fecha: new Date(d.fecha).toISOString() } });
      setModal(null);
      recargar();
    } catch (err) {
      setErrForm((err as Error).message);
    }
  };

  const abrirPlanilla = async (jornadaId: string) => {
    setErrForm('');
    try {
      setPlanilla(await api<Planilla>(`/formacion/jornadas/${jornadaId}/asistencia`));
    } catch (err) {
      setAviso({ tipo: 'error', texto: (err as Error).message });
    }
  };

  const guardarAsistencia = async () => {
    if (!planilla) return;
    try {
      await api(`/formacion/jornadas/${planilla.jornada.id}/asistencia`, {
        method: 'PUT',
        body: { registros: planilla.registros.map((r) => ({ inscripcionId: r.inscripcionId, presente: r.presente })) },
      });
      setAviso({ tipo: 'exito', texto: `Asistencia de "${planilla.jornada.tema}" guardada.` });
      setPlanilla(null);
      recargar();
    } catch (err) {
      setErrForm((err as Error).message);
    }
  };

  const cerrar = async () => {
    if (!confirm(`¿Cerrar "${p.nombre}"? Se calculará la asistencia y se emitirán certificados a quienes tengan ${p.asistenciaMinima}% o más. Después no se podrá modificar la asistencia.`)) return;
    try {
      const r = await api<{ certificados: number; resultados: unknown[] }>(`/formacion/procesos/${id}/cerrar`, { method: 'POST' });
      setAviso({ tipo: 'exito', texto: `Proceso cerrado. Se emitieron ${r.certificados} certificado(s) de ${r.resultados.length} inscrito(s); se notificó a los participantes.` });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: (err as Error).message });
    }
  };

  const recordatorio = async () => {
    try {
      const r = await api<{ enviados: number }>('/notificaciones', { method: 'POST', body: { procesoId: id } });
      setAviso({ tipo: 'exito', texto: `Recordatorio enviado a ${r.enviados} inscrito(s).` });
    } catch (err) {
      setAviso({ tipo: 'error', texto: (err as Error).message });
    }
  };

  const cambiarEstado = async (estado: string) => {
    try {
      await api(`/formacion/procesos/${id}`, { method: 'PATCH', body: { estado } });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: (err as Error).message });
    }
  };

  const bajarCert = (inscripcionId: string) => descargar(`/formacion/certificados/${inscripcionId}`).catch((e) => setAviso({ tipo: 'error', texto: e.message }));

  return (
    <div>
      <Link href={s.rol === 'PARTICIPANTE' ? '/panel/mis-procesos' : '/panel/formacion'} className="enlace text-sm">← Volver</Link>
      <div className="mt-3">
        <Encabezado
          titulo={p.nombre}
          descripcion={`${fmtFecha(p.fechaInicio)} – ${fmtFecha(p.fechaFin)} · Formador: ${p.formador?.nombre ?? 'por asignar'}`}
          acciones={
            <>
              <Insignia valor={p.tipo} />
              <Insignia valor={p.estado} />
            </>
          }
        />
      </div>
      {aviso && <div className="mb-4"><Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="tarjeta space-y-3 text-sm lg:col-span-1">
          <h2>Información</h2>
          <div><p className="text-xs text-slate-500">Necesidades identificadas</p><p>{p.necesidades}</p></div>
          {p.descripcion && <div><p className="text-xs text-slate-500">Descripción</p><p>{p.descripcion}</p></div>}
          <div className="grid grid-cols-2 gap-2">
            <div><p className="text-xs text-slate-500">Cupo</p><p>{p.inscripciones.length} / {p.cupo}</p></div>
            <div><p className="text-xs text-slate-500">Asistencia mínima</p><p>{p.asistenciaMinima}%</p></div>
            {p.numeroContrato && <div><p className="text-xs text-slate-500">Contrato</p><p>{p.numeroContrato}</p></div>}
          </div>
          {s.esGestion && !cerrado && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {p.estado === 'ABIERTO' ? (
                <button className="btn-secundario btn-sm" onClick={() => cambiarEstado('EN_CURSO')}>Cerrar inscripciones</button>
              ) : (
                <button className="btn-secundario btn-sm" onClick={() => cambiarEstado('ABIERTO')}>Reabrir inscripciones</button>
              )}
              <button className="btn-secundario btn-sm" onClick={recordatorio}>Enviar recordatorio</button>
              <button className="btn-peligro btn-sm" onClick={cerrar}>Cerrar proceso y emitir certificados</button>
            </div>
          )}
        </section>

        <section className="tarjeta p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2>Cronograma ({total} jornadas)</h2>
            {p.gestiona && !cerrado && <button className="btn-primario btn-sm" onClick={() => { setErrForm(''); setModal('jornada'); }}>+ Jornada</button>}
          </div>
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead><tr><th>#</th><th>Fecha</th><th>Tema</th><th>Lugar</th>{p.gestiona && <th>Presentes</th>}{p.gestiona && <th></th>}</tr></thead>
              <tbody>
                {p.jornadas.map((j, i) => (
                  <tr key={j.id}>
                    <td>{i + 1}</td>
                    <td className="whitespace-nowrap">{fmtFechaHora(j.fecha)}</td>
                    <td>{j.tema}</td>
                    <td>{j.lugar}</td>
                    {p.gestiona && <td>{j._count.asistencias} / {p.inscripciones.length}</td>}
                    {p.gestiona && (
                      <td className="text-right">
                        <button className="btn-secundario btn-sm" onClick={() => abrirPlanilla(j.id)}>{cerrado ? 'Ver asistencia' : 'Tomar asistencia'}</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!total && <Vacio>Aún no hay jornadas en el cronograma.</Vacio>}
          </div>
        </section>
      </div>

      <section className="tarjeta mt-6 p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2>{p.gestiona ? `Inscritos (${p.inscripciones.length})` : 'Mi inscripción'}</h2>
          {s.esGestion && p.estado === 'ABIERTO' && <button className="btn-secundario btn-sm" onClick={() => { setErrForm(''); setModal('inscribir'); }}>+ Inscribir participante</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="tabla">
            <thead><tr><th>Participante</th><th>Documento</th><th>Asistencias</th><th>%</th><th>Certificado</th></tr></thead>
            <tbody>
              {p.inscripciones.map((i) => {
                const porcentaje = i.porcentajeAsistencia ?? pct(i._count.asistencias);
                return (
                  <tr key={i.id}>
                    <td>{i.participante.nombre}<p className="text-xs text-slate-500">{i.participante.email}</p></td>
                    <td>{i.participante.documento}</td>
                    <td>{i._count.asistencias} / {total}</td>
                    <td>
                      <span className={porcentaje >= p.asistenciaMinima ? 'font-semibold text-emerald-700' : 'text-amber-700'}>{porcentaje}%</span>
                    </td>
                    <td>
                      {i.certificado ? (
                        <button className="btn-exito btn-sm" onClick={() => bajarCert(i.id)}>PDF {i.codigoCertificado}</button>
                      ) : cerrado ? (
                        <span className="text-xs text-slate-500">No alcanzó el mínimo</span>
                      ) : (
                        <span className="text-xs text-slate-500">Al cerrar el proceso</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!p.inscripciones.length && <Vacio>Sin inscritos.</Vacio>}
        </div>
      </section>

      <Modal abierto={modal === 'jornada'} titulo="Agregar jornada" onCerrar={() => setModal(null)}>
        <form onSubmit={agregarJornada} className="space-y-3">
          <Campo etiqueta="Fecha y hora *"><input name="fecha" type="datetime-local" required className="input" defaultValue={aInputFechaHora(p.fechaInicio)} /></Campo>
          <Campo etiqueta="Tema *"><input name="tema" required minLength={3} className="input" /></Campo>
          <Campo etiqueta="Lugar"><input name="lugar" className="input" defaultValue="Centro Cultural Lucy Tejada" /></Campo>
          <Alerta>{errForm}</Alerta>
          <button className="btn-primario">Agregar</button>
        </form>
      </Modal>

      {modal === 'inscribir' && (
        <ModalInscribir
          procesoId={id}
          inscritos={p.inscripciones.map((i) => i.participante.id)}
          onCerrar={() => setModal(null)}
          onListo={() => { setModal(null); recargar(); }}
        />
      )}

      <Modal abierto={!!planilla} titulo={planilla ? `Asistencia · ${planilla.jornada.tema}` : ''} onCerrar={() => setPlanilla(null)}>
        {planilla && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">{fmtFechaHora(planilla.jornada.fecha)}</p>
            {!cerrado && (
              <div className="flex gap-2">
                <button className="btn-secundario btn-sm" onClick={() => setPlanilla({ ...planilla, registros: planilla.registros.map((r) => ({ ...r, presente: true })) })}>Marcar todos</button>
                <button className="btn-secundario btn-sm" onClick={() => setPlanilla({ ...planilla, registros: planilla.registros.map((r) => ({ ...r, presente: false })) })}>Desmarcar todos</button>
              </div>
            )}
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {planilla.registros.map((r, idx) => (
                <li key={r.inscripcionId}>
                  <label className="flex items-center gap-3 px-3 py-2 font-normal">
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      disabled={cerrado}
                      checked={r.presente}
                      onChange={(e) => {
                        const regs = [...planilla.registros];
                        regs[idx] = { ...r, presente: e.target.checked };
                        setPlanilla({ ...planilla, registros: regs });
                      }}
                    />
                    <span className="flex-1">{r.participante}</span>
                    <span className="text-xs text-slate-500">{r.documento}</span>
                  </label>
                </li>
              ))}
              {!planilla.registros.length && <li className="p-3 text-sm text-slate-500">No hay inscritos.</li>}
            </ul>
            <Alerta>{errForm}</Alerta>
            {!cerrado && <button className="btn-primario" onClick={guardarAsistencia}>Guardar asistencia ({planilla.registros.filter((r) => r.presente).length} presentes)</button>}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ModalInscribir({ procesoId, inscritos, onCerrar, onListo }: { procesoId: string; inscritos: string[]; onCerrar: () => void; onListo: () => void }) {
  const { datos } = useServicio<Pagina<{ id: string; nombre: string; email: string }>>('/usuarios?rol=PARTICIPANTE&tamano=200');
  const [error, setError] = useState('');
  const disponibles = datos?.datos.filter((u) => !inscritos.includes(u.id)) ?? [];
  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api(`/formacion/procesos/${procesoId}/inscripciones`, { method: 'POST', body: formAObjeto(e.currentTarget) });
      onListo();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  return (
    <Modal abierto titulo="Inscribir participante" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-3">
        <Campo etiqueta="Participante" ayuda="Si la persona no tiene cuenta, puede registrarse en /registro.">
          <select name="participanteId" required className="input">
            <option value="">Seleccione…</option>
            {disponibles.map((u) => <option key={u.id} value={u.id}>{u.nombre} · {u.email}</option>)}
          </select>
        </Campo>
        <Alerta>{error}</Alerta>
        <button className="btn-primario">Inscribir</button>
      </form>
    </Modal>
  );
}
