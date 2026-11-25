'use client';
import Link from 'next/link';
import { Alerta, Cargando, Encabezado, useServicio } from '@/components/ui';
import { ROL_LABEL, type Rol } from '@/lib/constantes';
import { fmtFechaHora } from '@/lib/formato';

interface Yo {
  nombre: string;
  email: string;
  rol: Rol;
  documento: string | null;
  telefono: string | null;
  aceptaTratamiento: boolean;
  fechaAceptacion: string | null;
  createdAt: string;
}

export default function MisDatos() {
  const { datos: u, error } = useServicio<Yo>('/auth/me');
  return (
    <div className="max-w-2xl">
      <Encabezado titulo="Mis datos personales" descripcion="Derecho de consulta del titular (Ley 1581 de 2012)." />
      <Alerta>{error}</Alerta>
      {!u ? <Cargando /> : (
        <dl className="tarjeta grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-slate-500">Nombre</dt><dd>{u.nombre}</dd></div>
          <div><dt className="text-xs text-slate-500">Correo</dt><dd>{u.email}</dd></div>
          <div><dt className="text-xs text-slate-500">Rol</dt><dd>{ROL_LABEL[u.rol]}</dd></div>
          <div><dt className="text-xs text-slate-500">Documento</dt><dd>{u.documento ?? '—'}</dd></div>
          <div><dt className="text-xs text-slate-500">Teléfono</dt><dd>{u.telefono ?? '—'}</dd></div>
          <div><dt className="text-xs text-slate-500">Cuenta creada</dt><dd>{fmtFechaHora(u.createdAt)}</dd></div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-slate-500">Autorización de tratamiento de datos</dt>
            <dd>{u.aceptaTratamiento ? `Otorgada el ${u.fechaAceptacion ? fmtFechaHora(u.fechaAceptacion) : '—'}` : 'No registrada'}</dd>
          </div>
          <p className="text-xs text-slate-500 sm:col-span-2">
            Para actualizar, rectificar o suprimir sus datos, o revocar la autorización, comuníquese con el área de Música. Consulte la{' '}
            <Link className="enlace" href="/privacidad">política de tratamiento de datos</Link>.
          </p>
        </dl>
      )}
    </div>
  );
}
