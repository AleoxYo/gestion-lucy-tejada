'use client';
import { useState } from 'react';
import { Alerta, Campo, Cargando, Encabezado, Insignia, Modal, Vacio, formAObjeto, useServicio } from '@/components/ui';
import { SoloRoles } from '@/components/SoloRoles';
import { api, type Pagina } from '@/lib/cliente';
import { etiqueta, GESTION } from '@/lib/constantes';
import { aInputFechaHora, fmtFecha, fmtFechaHora } from '@/lib/formato';

interface Solicitud {
  id: string;
  tipoSolicitante: string;
  solicitante: string;
  institucion: string | null;
  email: string;
  telefono: string | null;
  fechaPropuesta: string;
  lugar: string;
  descripcion: string;
  estado: string;
  respuesta: string | null;
  fechaRespuesta: string | null;
  createdAt: string;
  concierto: { id: string; titulo: string; fecha: string } | null;
}

export default function Solicitudes() {
  const [estado, setEstado] = useState('PENDIENTE');
  const { datos, error, cargando, recargar } = useServicio<Pagina<Solicitud>>(`/conciertos/solicitudes?tamano=100${estado ? `&estado=${estado}` : ''}`);
  const [sel, setSel] = useState<Solicitud | null>(null);
  const [decision, setDecision] = useState<'APROBADA' | 'RECHAZADA'>('APROBADA');
  const [errForm, setErrForm] = useState('');
  const [exito, setExito] = useState('');

  const responder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sel) return;
    const d = formAObjeto(e.currentTarget);
    setErrForm('');
    try {
      await api(`/conciertos/solicitudes/${sel.id}`, {
        method: 'PATCH',
        body:
          decision === 'APROBADA'
            ? { decision, respuesta: d.respuesta, concierto: { titulo: d.titulo, fecha: new Date(d.fecha).toISOString(), lugar: d.lugar, agrupacion: d.agrupacion } }
            : { decision, respuesta: d.respuesta },
      });
      setExito(decision === 'APROBADA' ? 'Solicitud aprobada: el concierto quedó programado en el calendario y se notificó al solicitante.' : 'Solicitud rechazada y notificada al solicitante.');
      setSel(null);
      recargar();
    } catch (err) {
      setErrForm((err as Error).message);
    }
  };

  return (
    <SoloRoles roles={GESTION}>
      <Encabezado titulo="Solicitudes de concierto" descripcion="Solicitudes de instituciones y comunidad recibidas desde el formulario público." />
      <div className="mb-4 flex flex-wrap gap-2">
        {['PENDIENTE', 'APROBADA', 'RECHAZADA', ''].map((e) => (
          <button key={e} onClick={() => setEstado(e)} className={estado === e ? 'btn-primario btn-sm' : 'btn-secundario btn-sm'}>
            {e ? etiqueta(e) + 's' : 'Todas'}
          </button>
        ))}
      </div>
      <Alerta tipo="exito">{exito}</Alerta>
      <Alerta>{error}</Alerta>
      <div className="tarjeta mt-3 overflow-x-auto p-0">
        {cargando && !datos ? <Cargando /> : (
          <table className="tabla">
            <thead>
              <tr><th>Radicada</th><th>Solicitante</th><th>Fecha propuesta</th><th>Lugar</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {datos?.datos.map((s) => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap">{fmtFecha(s.createdAt)}</td>
                  <td>
                    <p className="font-medium">{s.institucion ?? s.solicitante}</p>
                    <p className="text-xs text-slate-500">{etiqueta(s.tipoSolicitante)} · {s.email}</p>
                  </td>
                  <td className="whitespace-nowrap">{fmtFechaHora(s.fechaPropuesta)}</td>
                  <td>{s.lugar}</td>
                  <td><Insignia valor={s.estado} /></td>
                  <td className="text-right">
                    <button className="btn-secundario btn-sm" onClick={() => { setSel(s); setErrForm(''); setExito(''); setDecision('APROBADA'); }}>
                      {s.estado === 'PENDIENTE' ? 'Responder' : 'Ver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {datos?.datos.length === 0 && <Vacio>No hay solicitudes en este estado.</Vacio>}
      </div>

      <Modal abierto={!!sel} titulo="Solicitud de concierto" onCerrar={() => setSel(null)}>
        {sel && (
          <div className="space-y-4 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Solicitante</dt><dd>{sel.solicitante}{sel.institucion && ` · ${sel.institucion}`}</dd></div>
              <div><dt className="text-xs text-slate-500">Contacto</dt><dd>{sel.email}{sel.telefono && ` · ${sel.telefono}`}</dd></div>
              <div><dt className="text-xs text-slate-500">Fecha propuesta</dt><dd>{fmtFechaHora(sel.fechaPropuesta)}</dd></div>
              <div><dt className="text-xs text-slate-500">Lugar</dt><dd>{sel.lugar}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Descripción</dt><dd>{sel.descripcion}</dd></div>
            </dl>
            {sel.estado !== 'PENDIENTE' ? (
              <Alerta tipo="info">
                <p><strong>{etiqueta(sel.estado)}</strong> el {sel.fechaRespuesta && fmtFecha(sel.fechaRespuesta)}: {sel.respuesta}</p>
                {sel.concierto && <p className="mt-1">Concierto programado: {sel.concierto.titulo} ({fmtFechaHora(sel.concierto.fecha)})</p>}
              </Alerta>
            ) : (
              <form onSubmit={responder} className="space-y-3 border-t border-slate-200 pt-4">
                <div className="flex gap-2">
                  <button type="button" className={decision === 'APROBADA' ? 'btn-exito btn-sm' : 'btn-secundario btn-sm'} onClick={() => setDecision('APROBADA')}>Aprobar</button>
                  <button type="button" className={decision === 'RECHAZADA' ? 'btn-peligro btn-sm' : 'btn-secundario btn-sm'} onClick={() => setDecision('RECHAZADA')}>Rechazar</button>
                </div>
                {decision === 'APROBADA' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Campo etiqueta="Título del concierto"><input name="titulo" required className="input" defaultValue={`Concierto para ${sel.institucion ?? sel.solicitante}`} /></Campo>
                    <Campo etiqueta="Fecha y hora"><input name="fecha" type="datetime-local" required className="input" defaultValue={aInputFechaHora(sel.fechaPropuesta)} /></Campo>
                    <Campo etiqueta="Lugar"><input name="lugar" required className="input" defaultValue={sel.lugar} /></Campo>
                    <Campo etiqueta="Agrupación"><input name="agrupacion" className="input" defaultValue="Banda Sinfónica de Pereira" /></Campo>
                  </div>
                )}
                <Campo etiqueta="Respuesta al solicitante (se envía por correo)">
                  <textarea
                    key={decision}
                    name="respuesta"
                    required
                    rows={3}
                    className="input"
                    defaultValue={decision === 'APROBADA' ? 'Con gusto atenderemos su solicitud. El concierto quedó programado en la fecha indicada.' : ''}
                  />
                </Campo>
                <Alerta>{errForm}</Alerta>
                <button className="btn-primario">Enviar respuesta</button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </SoloRoles>
  );
}
