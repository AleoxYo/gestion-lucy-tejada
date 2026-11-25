'use client';
import { use, useState } from 'react';
import { Alerta, Cargando, useServicio } from '@/components/ui';
import { api } from '@/lib/cliente';

interface Encuesta {
  id: string;
  titulo: string;
  descripcion: string | null;
  periodo: string;
  concierto: { titulo: string } | null;
  preguntas: { id: string; texto: string; tipo: string }[];
}

export default function ResponderEncuesta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { datos: e, error: errCarga, cargando } = useServicio<Encuesta>(`/encuestas/${id}`);
  const [valores, setValores] = useState<Record<string, number | string>>({});
  const [error, setError] = useState('');
  const [enviada, setEnviada] = useState(false);

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!e) return;
    setError('');
    try {
      await api(`/encuestas/${id}/respuestas`, {
        method: 'POST',
        body: {
          respuestas: e.preguntas.map((p) =>
            p.tipo === 'TEXTO'
              ? { preguntaId: p.id, valorTexto: String(valores[p.id] ?? '') }
              : { preguntaId: p.id, valorNumero: typeof valores[p.id] === 'number' ? valores[p.id] : null },
          ),
        },
      });
      setEnviada(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (cargando) return <Cargando />;
  if (errCarga || !e) return <div className="mx-auto max-w-xl px-4 py-10"><Alerta>Esta encuesta no existe o ya no recibe respuestas.</Alerta></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-semibold tracking-wider text-oro-500 uppercase">Encuesta de satisfacción · {e.periodo}</p>
      <h1 className="mt-1">{e.titulo}</h1>
      {e.concierto && <p className="text-sm text-slate-500">Sobre: {e.concierto.titulo}</p>}
      {e.descripcion && <p className="mt-2 text-sm text-slate-600">{e.descripcion}</p>}
      {enviada ? (
        <div className="mt-6"><Alerta tipo="exito">¡Gracias por responder! Su opinión nos ayuda a mejorar.</Alerta></div>
      ) : (
        <form onSubmit={enviar} className="mt-6 space-y-4">
          {e.preguntas.map((p, i) => (
            <fieldset key={p.id} className="tarjeta">
              <legend className="sr-only">{p.texto}</legend>
              <p className="font-medium">{i + 1}. {p.texto}</p>
              {p.tipo === 'ESCALA' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setValores({ ...valores, [p.id]: n })}
                      className={`h-11 w-11 rounded-full border text-sm font-semibold ${valores[p.id] === n ? 'border-marca-700 bg-marca-700 text-white' : 'border-slate-300 bg-white hover:border-marca-500'}`}
                      aria-pressed={valores[p.id] === n}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="self-center text-xs text-slate-500">1 = muy insatisfecho · 5 = muy satisfecho</span>
                </div>
              )}
              {p.tipo === 'SI_NO' && (
                <div className="mt-3 flex gap-2">
                  {[['Sí', 1], ['No', 0]].map(([t, v]) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setValores({ ...valores, [p.id]: v as number })}
                      className={`rounded-lg border px-5 py-2 text-sm font-semibold ${valores[p.id] === v ? 'border-marca-700 bg-marca-700 text-white' : 'border-slate-300 bg-white'}`}
                      aria-pressed={valores[p.id] === v}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              {p.tipo === 'TEXTO' && (
                <textarea className="input mt-2" rows={3} maxLength={1000} value={String(valores[p.id] ?? '')} onChange={(ev) => setValores({ ...valores, [p.id]: ev.target.value })} placeholder="Opcional" />
              )}
            </fieldset>
          ))}
          <Alerta>{error}</Alerta>
          <button className="btn-primario">Enviar respuestas</button>
        </form>
      )}
    </div>
  );
}
