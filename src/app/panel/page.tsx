'use client';
import Link from 'next/link';
import { Alerta, Cargando, Encabezado, Indicador, Insignia, useServicio } from '@/components/ui';
import { useSesion } from '@/components/SesionContexto';
import { fmtFechaHora } from '@/lib/formato';

interface Est {
  rol: string;
  proximos: { id: string; titulo: string; fecha: string; lugar: string; tipo: string }[];
  indicadores: Record<string, number>;
  proximasJornadas?: { id: string; fecha: string; tema: string; proceso: { id: string; nombre: string } }[];
}

export default function Inicio() {
  const s = useSesion();
  const { datos, error, cargando } = useServicio<Est>('/estadisticas');
  const i = datos?.indicadores ?? {};

  return (
    <div>
      <Encabezado titulo={`Hola, ${s.nombre.split(' ')[0]}`} descripcion="Resumen del área de Música" />
      <Alerta>{error}</Alerta>
      {cargando && <Cargando />}
      {datos && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {s.esGestion && (
              <>
                <Link href="/panel/solicitudes"><Indicador titulo="Solicitudes pendientes" valor={i.solicitudesPendientes} detalle="por responder" /></Link>
                <Link href="/panel/conciertos"><Indicador titulo="Conciertos del mes" valor={i.conciertosMes} /></Link>
                <Link href="/panel/instrumentos"><Indicador titulo="Instrumentos prestados" valor={i.instrumentosPrestados} detalle="sin regresar" /></Link>
                <Link href="/panel/formacion"><Indicador titulo="Procesos activos" valor={i.procesosActivos} /></Link>
                <Link href="/panel/encuestas"><Indicador titulo="Encuestas publicadas" valor={i.encuestasPublicadas} /></Link>
              </>
            )}
            {s.rol === 'FORMADOR' && <Indicador titulo="Mis procesos activos" valor={i.procesosActivos} />}
            {s.rol === 'PARTICIPANTE' && (
              <>
                <Link href="/panel/mis-procesos"><Indicador titulo="Mis inscripciones" valor={i.inscripciones} /></Link>
                <Link href="/panel/mis-procesos"><Indicador titulo="Certificados" valor={i.certificados} /></Link>
                <Link href="/festivales"><Indicador titulo="Procesos con inscripción abierta" valor={i.procesosAbiertos} /></Link>
              </>
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="tarjeta">
              <h2>Próximos conciertos</h2>
              <ul className="mt-3 divide-y divide-slate-100">
                {datos.proximos.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{c.titulo}</p>
                      <p className="text-xs text-slate-500">{fmtFechaHora(c.fecha)} · {c.lugar}</p>
                    </div>
                    <Insignia valor={c.tipo} />
                  </li>
                ))}
                {!datos.proximos.length && <li className="py-2 text-sm text-slate-500">No hay conciertos programados.</li>}
              </ul>
            </section>
            {datos.proximasJornadas && (
              <section className="tarjeta">
                <h2>Mis próximas jornadas</h2>
                <ul className="mt-3 divide-y divide-slate-100">
                  {datos.proximasJornadas.map((j) => (
                    <li key={j.id} className="py-2 text-sm">
                      <Link className="enlace" href={`/panel/formacion/${j.proceso.id}`}>{j.proceso.nombre}</Link>
                      <p className="text-xs text-slate-500">{fmtFechaHora(j.fecha)} · {j.tema}</p>
                    </li>
                  ))}
                  {!datos.proximasJornadas.length && <li className="py-2 text-sm text-slate-500">Sin jornadas próximas.</li>}
                </ul>
              </section>
            )}
            {s.esGestion && (
              <section className="tarjeta">
                <h2>Accesos rápidos</h2>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <Link className="btn-secundario" href="/panel/conciertos">Programar concierto</Link>
                  <Link className="btn-secundario" href="/panel/instrumentos">Registrar salida</Link>
                  <Link className="btn-secundario" href="/panel/formacion">Crear festival</Link>
                  <Link className="btn-secundario" href="/panel/reportes">Exportar reportes</Link>
                  <a className="btn-secundario col-span-2" href="/docs" target="_blank">Ver contrato OpenAPI de los servicios</a>
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
