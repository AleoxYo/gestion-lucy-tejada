'use client';
import { useState } from 'react';
import { Alerta, Cargando, Encabezado, Insignia, useServicio } from '@/components/ui';
import { SoloRoles } from '@/components/SoloRoles';
import type { Pagina } from '@/lib/cliente';
import { ROL_LABEL, type Rol } from '@/lib/constantes';
import { fmtFechaHora } from '@/lib/formato';

interface Registro {
  id: string;
  accion: string;
  email: string | null;
  metodo: string | null;
  ruta: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  usuario: { nombre: string; rol: Rol } | null;
}

const ACCIONES: Record<string, [string, string]> = {
  LOGIN_OK: ['DISPONIBLE', 'Ingreso'],
  LOGIN_FALLIDO: ['RECHAZADA', 'Ingreso fallido'],
  LOGOUT: ['BAJA', 'Salida'],
  REGISTRO: ['PROGRAMADO', 'Registro'],
  API: ['PENDIENTE', 'Operación'],
};

export default function Accesos() {
  const [accion, setAccion] = useState('');
  const [pagina, setPagina] = useState(1);
  const { datos, error, cargando } = useServicio<Pagina<Registro>>(`/accesos?pagina=${pagina}&tamano=50${accion ? `&accion=${accion}` : ''}`);
  const paginas = datos ? Math.max(1, Math.ceil(datos.total / 50)) : 1;

  return (
    <SoloRoles roles={['DIRECTOR']}>
      <Encabezado titulo="Registro de accesos" descripcion="Auditoría de ingresos al sistema y operaciones que modifican datos." />
      <div className="mb-4 flex flex-wrap gap-2">
        {['', ...Object.keys(ACCIONES)].map((a) => (
          <button key={a} className={accion === a ? 'btn-primario btn-sm' : 'btn-secundario btn-sm'} onClick={() => { setAccion(a); setPagina(1); }}>
            {a ? ACCIONES[a][1] : 'Todos'}
          </button>
        ))}
      </div>
      <Alerta>{error}</Alerta>
      <div className="tarjeta overflow-x-auto p-0">
        {cargando && !datos ? <Cargando /> : (
          <table className="tabla">
            <thead><tr><th>Fecha</th><th>Acción</th><th>Usuario</th><th>Operación</th><th>IP</th></tr></thead>
            <tbody>
              {datos?.datos.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{fmtFechaHora(r.createdAt)}</td>
                  <td><Insignia valor={ACCIONES[r.accion]?.[0] ?? ''} texto={ACCIONES[r.accion]?.[1] ?? r.accion} /></td>
                  <td>{r.usuario?.nombre ?? r.email ?? 'Anónimo'}{r.usuario && <p className="text-xs text-slate-500">{ROL_LABEL[r.usuario.rol]}</p>}</td>
                  <td className="font-mono text-xs">{r.metodo} {r.ruta}</td>
                  <td className="text-xs">{r.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-sm">
        <button className="btn-secundario btn-sm" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
        <span>Página {pagina} de {paginas}</span>
        <button className="btn-secundario btn-sm" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
      </div>
    </SoloRoles>
  );
}
