'use client';
import { useState } from 'react';
import { Alerta, Campo, formAObjeto } from '@/components/ui';
import { Consentimiento } from '@/components/Consentimiento';
import { api } from '@/lib/cliente';

export default function SolicitarConcierto() {
  const [error, setError] = useState('');
  const [radicado, setRadicado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [tipo, setTipo] = useState('INSTITUCION');

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    const form = e.currentTarget;
    const d = formAObjeto(form);
    try {
      const r = await api<{ id: string }>('/conciertos/solicitudes', {
        method: 'POST',
        body: { ...d, fechaPropuesta: new Date(d.fechaPropuesta).toISOString(), aceptaTratamiento: !!d.aceptaTratamiento },
      });
      setRadicado(r.id);
      form.reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1>Solicitar un concierto</h1>
      <p className="mt-2 text-sm text-slate-600">
        Instituciones y comunidad pueden solicitar la presentación de la Banda Sinfónica o de los grupos de la Escuela de Formación. El área de Música
        revisará la disponibilidad y le responderá al correo indicado.
      </p>
      {radicado ? (
        <div className="mt-6 space-y-3">
          <Alerta tipo="exito">
            Su solicitud fue radicada con el código <strong>{radicado}</strong>. Le enviamos una confirmación a su correo.
          </Alerta>
          <button className="btn-secundario" onClick={() => setRadicado('')}>Hacer otra solicitud</button>
        </div>
      ) : (
        <form onSubmit={enviar} className="tarjeta mt-6 grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Tipo de solicitante">
            <select name="tipoSolicitante" className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="INSTITUCION">Institución</option>
              <option value="COMUNIDAD">Comunidad / persona natural</option>
            </select>
          </Campo>
          <Campo etiqueta="Nombre del solicitante *">
            <input name="solicitante" required minLength={3} className="input" />
          </Campo>
          {tipo === 'INSTITUCION' && (
            <Campo etiqueta="Institución">
              <input name="institucion" className="input" />
            </Campo>
          )}
          <Campo etiqueta="Correo electrónico *">
            <input name="email" type="email" required className="input" />
          </Campo>
          <Campo etiqueta="Teléfono">
            <input name="telefono" className="input" />
          </Campo>
          <Campo etiqueta="Fecha y hora propuesta *">
            <input name="fechaPropuesta" type="datetime-local" required className="input" />
          </Campo>
          <div className="sm:col-span-2">
            <Campo etiqueta="Lugar del evento *">
              <input name="lugar" required minLength={3} className="input" />
            </Campo>
          </div>
          <div className="sm:col-span-2">
            <Campo etiqueta="Descripción del evento *" ayuda="Motivo, público esperado, duración y requerimientos.">
              <textarea name="descripcion" required minLength={10} rows={4} className="input" />
            </Campo>
          </div>
          <div className="sm:col-span-2">
            <Consentimiento />
          </div>
          <div className="sm:col-span-2">
            <Alerta>{error}</Alerta>
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primario w-full sm:w-auto" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar solicitud'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
