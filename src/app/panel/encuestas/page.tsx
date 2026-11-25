'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Alerta, Campo, Cargando, Encabezado, Insignia, Modal, Vacio, useServicio } from '@/components/ui';
import { SoloRoles } from '@/components/SoloRoles';
import { api, type Pagina } from '@/lib/cliente';
import { etiqueta, GESTION, TIPOS_PREGUNTA } from '@/lib/constantes';
import { fmtFecha } from '@/lib/formato';

interface Encuesta {
  id: string;
  titulo: string;
  periodo: string;
  estado: string;
  createdAt: string;
  concierto: { titulo: string } | null;
  _count: { respuestas: number; preguntas: number; planes: number };
}

const PREGUNTAS_BASE = [
  { texto: '¿Qué tan satisfecho(a) quedó con el concierto?', tipo: 'ESCALA' },
  { texto: '¿Cómo califica la calidad del sonido?', tipo: 'ESCALA' },
  { texto: '¿Cómo califica la organización y el horario?', tipo: 'ESCALA' },
  { texto: '¿Volvería a asistir?', tipo: 'SI_NO' },
  { texto: 'Comentarios o sugerencias', tipo: 'TEXTO' },
];

function periodoActual() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() < 6 ? 1 : 2}`;
}

export default function Encuestas() {
  const { datos, error, cargando, recargar } = useServicio<{ datos: Encuesta[] }>('/encuestas');
  const conciertos = useServicio<Pagina<{ id: string; titulo: string; fecha: string }>>('/conciertos?tamano=200');
  const [abierto, setAbierto] = useState(false);
  const [preguntas, setPreguntas] = useState(PREGUNTAS_BASE);
  const [form, setForm] = useState({ titulo: '', descripcion: '', periodo: periodoActual(), conciertoId: '' });
  const [errForm, setErrForm] = useState('');

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/encuestas', { method: 'POST', body: { ...form, conciertoId: form.conciertoId || null, preguntas: preguntas.filter((p) => p.texto.trim()) } });
      setAbierto(false);
      setPreguntas(PREGUNTAS_BASE);
      setForm({ titulo: '', descripcion: '', periodo: periodoActual(), conciertoId: '' });
      recargar();
    } catch (err) {
      setErrForm((err as Error).message);
    }
  };

  return (
    <SoloRoles roles={GESTION}>
      <Encabezado
        titulo="Encuestas de satisfacción"
        descripcion="Se aplican cada 6 meses a los asistentes. Los resultados se tabulan automáticamente."
        acciones={<button className="btn-primario" onClick={() => { setErrForm(''); setAbierto(true); }}>+ Nueva encuesta</button>}
      />
      <Alerta>{error}</Alerta>
      <div className="tarjeta overflow-x-auto p-0">
        {cargando && !datos ? <Cargando /> : (
          <table className="tabla">
            <thead><tr><th>Encuesta</th><th>Periodo</th><th>Preguntas</th><th>Respuestas</th><th>Planes</th><th>Estado</th></tr></thead>
            <tbody>
              {datos?.datos.map((e) => (
                <tr key={e.id}>
                  <td><Link className="enlace" href={`/panel/encuestas/${e.id}`}>{e.titulo}</Link><p className="text-xs text-slate-500">{e.concierto ? `Concierto: ${e.concierto.titulo}` : 'General'} · creada {fmtFecha(e.createdAt)}</p></td>
                  <td>{e.periodo}</td>
                  <td>{e._count.preguntas}</td>
                  <td className="font-semibold">{e._count.respuestas}</td>
                  <td>{e._count.planes}</td>
                  <td><Insignia valor={e.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {datos?.datos.length === 0 && <Vacio>No hay encuestas.</Vacio>}
      </div>

      <Modal abierto={abierto} titulo="Nueva encuesta" onCerrar={() => setAbierto(false)}>
        <form onSubmit={crear} className="space-y-3">
          <Campo etiqueta="Título *"><input required minLength={3} className="input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Periodo *" ayuda="AAAA-1 o AAAA-2"><input required pattern="\d{4}-[12]" className="input" value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} /></Campo>
            <Campo etiqueta="Concierto asociado">
              <select className="input" value={form.conciertoId} onChange={(e) => setForm({ ...form, conciertoId: e.target.value })}>
                <option value="">General (todos los conciertos)</option>
                {conciertos.datos?.datos.map((c) => <option key={c.id} value={c.id}>{fmtFecha(c.fecha)} · {c.titulo}</option>)}
              </select>
            </Campo>
          </div>
          <Campo etiqueta="Descripción"><textarea rows={2} className="input" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></Campo>
          <div>
            <p className="text-sm font-medium text-slate-700">Preguntas</p>
            <div className="mt-1 space-y-2">
              {preguntas.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input mt-0 flex-1" value={p.texto} onChange={(e) => setPreguntas(preguntas.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))} />
                  <select className="input mt-0 w-36" value={p.tipo} onChange={(e) => setPreguntas(preguntas.map((x, j) => (j === i ? { ...x, tipo: e.target.value } : x)))}>
                    {TIPOS_PREGUNTA.map((t) => <option key={t} value={t}>{etiqueta(t)}</option>)}
                  </select>
                  <button type="button" className="btn-secundario btn-sm" onClick={() => setPreguntas(preguntas.filter((_, j) => j !== i))} aria-label="Quitar">✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-secundario btn-sm mt-2" onClick={() => setPreguntas([...preguntas, { texto: '', tipo: 'ESCALA' }])}>+ Pregunta</button>
          </div>
          <Alerta>{errForm}</Alerta>
          <button className="btn-primario">Crear (queda en borrador)</button>
        </form>
      </Modal>
    </SoloRoles>
  );
}
