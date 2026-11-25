'use client';
import Link from 'next/link';
import { use } from 'react';
import { Alerta, Cargando, Encabezado, Insignia, Vacio, useServicio } from '@/components/ui';
import { SoloRoles } from '@/components/SoloRoles';
import { etiqueta, GESTION } from '@/lib/constantes';
import { fmtFechaHora } from '@/lib/formato';

interface Detalle {
  codigo: string;
  nombre: string;
  familia: string;
  marca: string | null;
  estado: string;
  observaciones: string | null;
  movimientos: {
    id: string;
    responsable: string;
    fechaSalida: string;
    estadoSalida: string;
    fechaRegreso: string | null;
    estadoRegreso: string | null;
    observaciones: string | null;
    registradoPor: string | null;
    concierto: { titulo: string; fecha: string };
  }[];
}

export default function DetalleInstrumento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { datos: i, error, cargando } = useServicio<Detalle>(`/instrumentos/${id}`);
  return (
    <SoloRoles roles={GESTION}>
      <Link href="/panel/instrumentos" className="enlace text-sm">← Volver al inventario</Link>
      {cargando && <Cargando />}
      <Alerta>{error}</Alerta>
      {i && (
        <>
          <div className="mt-3">
            <Encabezado titulo={`${i.codigo} · ${i.nombre}`} descripcion={`${etiqueta(i.familia)}${i.marca ? ` · ${i.marca}` : ''}`} acciones={<Insignia valor={i.estado} />} />
          </div>
          {i.observaciones && <Alerta tipo="info">{i.observaciones}</Alerta>}
          <div className="tarjeta mt-4 overflow-x-auto p-0">
            <div className="border-b border-slate-200 px-4 py-3"><h2>Historial de salidas (trazabilidad)</h2></div>
            <table className="tabla">
              <thead><tr><th>Concierto</th><th>Responsable</th><th>Salida</th><th>Regreso</th><th>Observaciones</th><th>Registró</th></tr></thead>
              <tbody>
                {i.movimientos.map((m) => (
                  <tr key={m.id}>
                    <td>{m.concierto.titulo}<p className="text-xs text-slate-500">{fmtFechaHora(m.concierto.fecha)}</p></td>
                    <td>{m.responsable}</td>
                    <td className="whitespace-nowrap">{fmtFechaHora(m.fechaSalida)} <Insignia valor={m.estadoSalida} /></td>
                    <td className="whitespace-nowrap">{m.fechaRegreso ? <>{fmtFechaHora(m.fechaRegreso)} <Insignia valor={m.estadoRegreso ?? ''} /></> : <Insignia valor="PRESTADO" texto="Sin regresar" />}</td>
                    <td className="text-xs">{m.observaciones}</td>
                    <td className="text-xs">{m.registradoPor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!i.movimientos.length && <Vacio>Este instrumento no ha salido del centro.</Vacio>}
          </div>
        </>
      )}
    </SoloRoles>
  );
}
