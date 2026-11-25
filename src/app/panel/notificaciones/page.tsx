'use client';
import { Alerta, Cargando, Encabezado, Insignia, Vacio, useServicio } from '@/components/ui';
import { SoloRoles } from '@/components/SoloRoles';
import type { Pagina } from '@/lib/cliente';
import { GESTION } from '@/lib/constantes';
import { fmtFechaHora } from '@/lib/formato';

interface Notif {
  id: string;
  destinatario: string;
  asunto: string;
  cuerpo: string;
  tipo: string;
  createdAt: string;
}

export default function Notificaciones() {
  const { datos, error, cargando } = useServicio<Pagina<Notif>>('/notificaciones?tamano=100');
  return (
    <SoloRoles roles={GESTION}>
      <Encabezado
        titulo="Notificaciones enviadas"
        descripcion="Bandeja de salida del servicio utilitario de correo (confirmaciones, respuestas a solicitudes, recordatorios y certificados)."
      />
      <Alerta tipo="info">En el ambiente local los correos no salen a internet: se registran aquí y en la consola del servidor.</Alerta>
      <Alerta>{error}</Alerta>
      {cargando && !datos && <Cargando />}
      <div className="mt-4 space-y-3">
        {datos?.datos.map((n) => (
          <article key={n.id} className="tarjeta p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{n.asunto}</p>
              <Insignia valor="PROGRAMADO" texto={n.tipo.replace('_', ' ').toLowerCase()} />
            </div>
            <p className="text-xs text-slate-500">Para: {n.destinatario} · {fmtFechaHora(n.createdAt)}</p>
            <p className="mt-2 text-slate-700">{n.cuerpo}</p>
          </article>
        ))}
        {datos?.datos.length === 0 && <Vacio>No se han enviado notificaciones.</Vacio>}
      </div>
    </SoloRoles>
  );
}
