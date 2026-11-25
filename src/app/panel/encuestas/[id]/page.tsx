'use client';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { Alerta, Campo, Cargando, Encabezado, Indicador, Insignia, formAObjeto, useServicio } from '@/components/ui';
import { SoloRoles } from '@/components/SoloRoles';
import { api } from '@/lib/cliente';
import { GESTION } from '@/lib/constantes';
import type { ResultadoPregunta } from '@/lib/encuestas';
import { fmtFecha } from '@/lib/formato';

interface Resultados {
  encuesta: { id: string; titulo: string; periodo: string; estado: string };
  totalRespuestas: number;
  indiceSatisfaccion: number;
  resultados: ResultadoPregunta[];
}
interface Plan {
  id: string;
  diagnostico: string;
  acciones: string;
  responsable: string;
  fechaCompromiso: string;
  createdAt: string;
}

export default function ResultadosEncuesta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { datos: r, error, recargar } = useServicio<Resultados>(`/encuestas/${id}/resultados`);
  const planes = useServicio<{ datos: Plan[] }>(`/encuestas/${id}/planes`);
  const [enlace, setEnlace] = useState('');
  const [errPlan, setErrPlan] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => setEnlace(`${window.location.origin}/encuestas/${id}`), [id]);

  const cambiarEstado = async (estado: string) => {
    await api(`/encuestas/${id}`, { method: 'PATCH', body: { estado } });
    recargar();
  };

  const guardarPlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const d = formAObjeto(form);
    try {
      await api(`/encuestas/${id}/planes`, { method: 'POST', body: { ...d, fechaCompromiso: new Date(`${d.fechaCompromiso}T12:00`).toISOString() } });
      form.reset();
      setErrPlan('');
      setAviso('Plan de mejoramiento registrado.');
      planes.recargar();
    } catch (err) {
      setErrPlan((err as Error).message);
    }
  };

  return (
    <SoloRoles roles={GESTION}>
      <Link href="/panel/encuestas" className="enlace text-sm">← Volver a encuestas</Link>
      <Alerta>{error}</Alerta>
      {!r ? <Cargando /> : (
        <>
          <div className="mt-3">
            <Encabezado
              titulo={r.encuesta.titulo}
              descripcion={`Periodo ${r.encuesta.periodo}`}
              acciones={
                <>
                  <Insignia valor={r.encuesta.estado} />
                  {r.encuesta.estado === 'BORRADOR' && <button className="btn-primario btn-sm" onClick={() => cambiarEstado('PUBLICADA')}>Publicar</button>}
                  {r.encuesta.estado === 'PUBLICADA' && <button className="btn-secundario btn-sm" onClick={() => cambiarEstado('CERRADA')}>Cerrar encuesta</button>}
                  {r.encuesta.estado === 'CERRADA' && <button className="btn-secundario btn-sm" onClick={() => cambiarEstado('PUBLICADA')}>Reabrir</button>}
                </>
              }
            />
          </div>
          {r.encuesta.estado === 'PUBLICADA' && (
            <Alerta tipo="info">
              Enlace público para los asistentes:{' '}
              <a href={enlace} target="_blank" className="font-mono font-semibold underline">{enlace}</a>{' '}
              <button className="btn-secundario btn-sm ml-2" onClick={() => navigator.clipboard?.writeText(enlace)}>Copiar</button>
            </Alerta>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Indicador titulo="Respuestas" valor={r.totalRespuestas} />
            <Indicador titulo="Índice de satisfacción" valor={`${r.indiceSatisfaccion}%`} detalle="% de calificaciones 4-5 y respuestas «Sí»" />
            <Indicador titulo="Planes de mejoramiento" valor={planes.datos?.datos.length ?? 0} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {r.resultados.map((p, i) => (
              <section key={p.preguntaId} className="tarjeta">
                <p className="font-medium">{i + 1}. {p.texto}</p>
                <p className="text-xs text-slate-500">{p.respuestas} respuestas{p.promedio !== undefined && ` · promedio ${p.promedio} / 5`}{p.porcentajeSatisfaccion !== undefined && ` · ${p.porcentajeSatisfaccion}% satisfechos`}</p>
                {p.distribucion && (
                  <div className="mt-3 space-y-1.5">
                    {Object.entries(p.distribucion).map(([k, v]) => {
                      const pct = p.respuestas ? Math.round((v / p.respuestas) * 100) : 0;
                      return (
                        <div key={k} className="flex items-center gap-2 text-xs">
                          <span className="w-6 text-right font-semibold">{k}</span>
                          <div className="h-5 flex-1 rounded bg-slate-100">
                            <div className="h-5 rounded bg-marca-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-16 text-slate-600">{v} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {p.comentarios && (
                  <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm">
                    {p.comentarios.map((c, j) => <li key={j} className="rounded bg-slate-50 px-3 py-1.5">“{c}”</li>)}
                    {!p.comentarios.length && <li className="text-slate-500">Sin comentarios.</li>}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <form onSubmit={guardarPlan} className="tarjeta space-y-3">
              <h2>Registrar diagnóstico y plan de mejoramiento</h2>
              <Campo etiqueta="Diagnóstico *"><textarea name="diagnostico" required minLength={5} rows={3} className="input" placeholder="¿Qué muestran los resultados?" /></Campo>
              <Campo etiqueta="Acciones de mejora *"><textarea name="acciones" required minLength={5} rows={3} className="input" /></Campo>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo etiqueta="Responsable *"><input name="responsable" required className="input" /></Campo>
                <Campo etiqueta="Fecha de compromiso *"><input name="fechaCompromiso" type="date" required className="input" /></Campo>
              </div>
              <Alerta>{errPlan}</Alerta>
              <Alerta tipo="exito">{aviso}</Alerta>
              <button className="btn-primario">Guardar plan</button>
            </form>
            <div className="space-y-3">
              <h2>Planes registrados</h2>
              {planes.datos?.datos.map((p) => (
                <article key={p.id} className="tarjeta text-sm">
                  <p className="text-xs text-slate-500">Registrado {fmtFecha(p.createdAt)} · Responsable: {p.responsable} · Compromiso: {fmtFecha(p.fechaCompromiso)}</p>
                  <p className="mt-2"><strong>Diagnóstico:</strong> {p.diagnostico}</p>
                  <p className="mt-1"><strong>Acciones:</strong> {p.acciones}</p>
                </article>
              ))}
              {planes.datos?.datos.length === 0 && <p className="text-sm text-slate-500">Aún no hay planes.</p>}
            </div>
          </section>
        </>
      )}
    </SoloRoles>
  );
}
