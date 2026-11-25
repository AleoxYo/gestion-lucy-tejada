'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Alerta, Cargando, Encabezado, Insignia, Vacio, useServicio } from '@/components/ui';
import { descargar } from '@/lib/cliente';
import { fmtFecha } from '@/lib/formato';

interface Insc {
  id: string;
  asistencias: number;
  porcentajeActual: number;
  certificado: boolean;
  codigoCertificado: string | null;
  proceso: { id: string; nombre: string; tipo: string; estado: string; fechaInicio: string; fechaFin: string; asistenciaMinima: number; _count: { jornadas: number } };
}

export default function MisProcesos() {
  const { datos, error, cargando } = useServicio<{ datos: Insc[] }>('/formacion/mis-inscripciones');
  const [err, setErr] = useState('');

  return (
    <div>
      <Encabezado
        titulo="Mis procesos y certificados"
        descripcion="Festivales y procesos de formación en los que está inscrito(a)."
        acciones={<Link className="btn-primario" href="/festivales">Ver oferta e inscribirme</Link>}
      />
      <Alerta>{error || err}</Alerta>
      {cargando && <Cargando />}
      <div className="grid gap-4 md:grid-cols-2">
        {datos?.datos.map((i) => (
          <article key={i.id} className="tarjeta">
            <div className="flex flex-wrap gap-2"><Insignia valor={i.proceso.tipo} /><Insignia valor={i.proceso.estado} /></div>
            <h2 className="mt-2"><Link className="hover:underline" href={`/panel/formacion/${i.proceso.id}`}>{i.proceso.nombre}</Link></h2>
            <p className="text-sm text-slate-500">{fmtFecha(i.proceso.fechaInicio)} – {fmtFecha(i.proceso.fechaFin)}</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Asistencia: {i.asistencias} de {i.proceso._count.jornadas} jornadas</span>
                <span>{i.porcentajeActual}% (mínimo {i.proceso.asistenciaMinima}%)</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full ${i.porcentajeActual >= i.proceso.asistenciaMinima ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, i.porcentajeActual)}%` }} />
              </div>
            </div>
            <div className="mt-4">
              {i.certificado ? (
                <button className="btn-exito" onClick={() => descargar(`/formacion/certificados/${i.id}`).catch((e) => setErr(e.message))}>
                  Descargar certificado PDF
                </button>
              ) : i.proceso.estado === 'CERRADO' ? (
                <p className="text-sm text-slate-500">No alcanzó la asistencia mínima para certificar.</p>
              ) : (
                <p className="text-sm text-slate-500">El certificado se emite al cerrar el proceso.</p>
              )}
            </div>
          </article>
        ))}
      </div>
      {datos?.datos.length === 0 && <Vacio>Aún no tiene inscripciones.</Vacio>}
    </div>
  );
}
