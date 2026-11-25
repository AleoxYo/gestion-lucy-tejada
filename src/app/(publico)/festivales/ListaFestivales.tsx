'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Alerta, Cargando, Insignia, useServicio } from '@/components/ui';
import { api, type Pagina } from '@/lib/cliente';
import { fmtFecha } from '@/lib/formato';

interface Proceso {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  necesidades: string;
  fechaInicio: string;
  fechaFin: string;
  cupo: number;
  estado: string;
  inscritos: number;
  cuposDisponibles: number;
  inscrito?: boolean;
  formador: { nombre: string } | null;
  _count: { jornadas: number };
}

export function ListaFestivales({ rol }: { rol: string | null }) {
  const { datos, error, cargando, recargar } = useServicio<Pagina<Proceso>>('/formacion/procesos?tamano=100');
  const [msg, setMsg] = useState<{ tipo: 'error' | 'exito'; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState('');

  const inscribir = async (p: Proceso) => {
    setOcupado(p.id);
    setMsg(null);
    try {
      await api(`/formacion/procesos/${p.id}/inscripciones`, { method: 'POST', body: {} });
      setMsg({ tipo: 'exito', texto: `Quedó inscrito(a) en "${p.nombre}". Le enviamos la confirmación a su correo.` });
      recargar();
    } catch (e) {
      setMsg({ tipo: 'error', texto: (e as Error).message });
    } finally {
      setOcupado('');
    }
  };

  const visibles = datos?.datos.filter((p) => p.estado !== 'CERRADO') ?? [];

  return (
    <div className="mt-6 space-y-4">
      {msg && <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>}
      <Alerta>{error}</Alerta>
      {cargando && !datos && <Cargando />}
      <div className="grid gap-4 md:grid-cols-2">
        {visibles.map((p) => (
          <article key={p.id} className="tarjeta flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <Insignia valor={p.tipo} />
              <Insignia valor={p.estado} />
            </div>
            <h2 className="mt-2">{p.nombre}</h2>
            {p.descripcion && <p className="mt-1 text-sm text-slate-600">{p.descripcion}</p>}
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-xs text-slate-500">Fechas</dt><dd>{fmtFecha(p.fechaInicio)} – {fmtFecha(p.fechaFin)}</dd></div>
              <div><dt className="text-xs text-slate-500">Formador</dt><dd>{p.formador?.nombre ?? 'Por asignar'}</dd></div>
              <div><dt className="text-xs text-slate-500">Jornadas</dt><dd>{p._count.jornadas}</dd></div>
              <div><dt className="text-xs text-slate-500">Cupos disponibles</dt><dd>{p.cuposDisponibles} de {p.cupo}</dd></div>
            </dl>
            <div className="mt-4 flex-1" />
            {p.estado !== 'ABIERTO' ? (
              <p className="text-sm text-slate-500">Inscripciones cerradas (proceso en curso).</p>
            ) : p.inscrito ? (
              <p className="text-sm font-semibold text-emerald-700">✓ Ya está inscrito(a)</p>
            ) : rol === 'PARTICIPANTE' ? (
              <button className="btn-primario" disabled={ocupado === p.id || p.cuposDisponibles === 0} onClick={() => inscribir(p)}>
                {p.cuposDisponibles === 0 ? 'Sin cupos' : ocupado === p.id ? 'Inscribiendo…' : 'Inscribirme'}
              </button>
            ) : rol ? (
              <p className="text-sm text-slate-500">La inscripción en línea es para participantes. Gestione los inscritos desde el panel.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Link href={`/login?volver=/festivales`} className="btn-primario">Ingresar para inscribirme</Link>
                <Link href="/registro" className="btn-secundario">Crear cuenta</Link>
              </div>
            )}
          </article>
        ))}
      </div>
      {datos && visibles.length === 0 && <p className="text-sm text-slate-500">No hay festivales o procesos abiertos en este momento.</p>}
    </div>
  );
}
