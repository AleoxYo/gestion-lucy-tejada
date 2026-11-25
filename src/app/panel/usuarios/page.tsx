'use client';
import { useState } from 'react';
import { Alerta, Campo, Cargando, Encabezado, Insignia, Modal, formAObjeto, useServicio } from '@/components/ui';
import { SoloRoles } from '@/components/SoloRoles';
import { useSesion } from '@/components/SesionContexto';
import { api, type Pagina } from '@/lib/cliente';
import { ROL_LABEL, ROLES, type Rol } from '@/lib/constantes';
import { fmtFecha } from '@/lib/formato';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  documento: string | null;
  activo: boolean;
  createdAt: string;
}

export default function Usuarios() {
  const s = useSesion();
  const [rol, setRol] = useState('');
  const { datos, error, cargando, recargar } = useServicio<Pagina<Usuario>>(`/usuarios?tamano=200${rol ? `&rol=${rol}` : ''}`);
  const [abierto, setAbierto] = useState(false);
  const [errForm, setErrForm] = useState('');
  const [errLista, setErrLista] = useState('');

  const crear = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api('/usuarios', { method: 'POST', body: formAObjeto(e.currentTarget) });
      setAbierto(false);
      recargar();
    } catch (err) {
      setErrForm((err as Error).message);
    }
  };

  const actualizar = async (u: Usuario, cambios: Partial<Usuario>) => {
    setErrLista('');
    try {
      await api(`/usuarios/${u.id}`, { method: 'PATCH', body: cambios });
      recargar();
    } catch (err) {
      setErrLista((err as Error).message);
    }
  };

  return (
    <SoloRoles roles={['DIRECTOR']}>
      <Encabezado
        titulo="Usuarios y roles"
        descripcion="Cuentas de Director Técnico, Auxiliar Administrativo, Formador y Participante."
        acciones={<button className="btn-primario" onClick={() => { setErrForm(''); setAbierto(true); }}>+ Crear usuario</button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {['', ...ROLES].map((r) => (
          <button key={r} className={rol === r ? 'btn-primario btn-sm' : 'btn-secundario btn-sm'} onClick={() => setRol(r)}>{r ? ROL_LABEL[r as Rol] : 'Todos'}</button>
        ))}
      </div>
      <Alerta>{error || errLista}</Alerta>
      <div className="tarjeta mt-3 overflow-x-auto p-0">
        {cargando && !datos ? <Cargando /> : (
          <table className="tabla">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Creado</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {datos?.datos.map((u) => (
                <tr key={u.id} className={u.activo ? '' : 'opacity-60'}>
                  <td className="font-medium">{u.nombre}<p className="text-xs text-slate-500">{u.documento}</p></td>
                  <td>{u.email}</td>
                  <td>
                    <select className="input mt-0 w-48 py-1" value={u.rol} disabled={u.id === s.sub} onChange={(e) => actualizar(u, { rol: e.target.value as Rol })}>
                      {ROLES.map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
                    </select>
                  </td>
                  <td>{fmtFecha(u.createdAt)}</td>
                  <td><Insignia valor={u.activo ? 'DISPONIBLE' : 'BAJA'} texto={u.activo ? 'Activo' : 'Inactivo'} /></td>
                  <td className="text-right">
                    {u.id !== s.sub && (
                      <button className="btn-secundario btn-sm" onClick={() => actualizar(u, { activo: !u.activo })}>{u.activo ? 'Desactivar' : 'Activar'}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal abierto={abierto} titulo="Crear usuario" onCerrar={() => setAbierto(false)}>
        <form onSubmit={crear} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Campo etiqueta="Nombre completo *"><input name="nombre" required className="input" /></Campo></div>
          <Campo etiqueta="Correo *"><input name="email" type="email" required className="input" /></Campo>
          <Campo etiqueta="Rol *">
            <select name="rol" className="input" defaultValue="FORMADOR">{ROLES.map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}</select>
          </Campo>
          <Campo etiqueta="Documento"><input name="documento" className="input" /></Campo>
          <Campo etiqueta="Teléfono"><input name="telefono" className="input" /></Campo>
          <Campo etiqueta="Contraseña inicial *" ayuda="Mínimo 8 caracteres con letras y números."><input name="password" type="password" required minLength={8} className="input" /></Campo>
          <div className="sm:col-span-2"><Alerta>{errForm}</Alerta></div>
          <div><button className="btn-primario">Crear</button></div>
        </form>
      </Modal>
    </SoloRoles>
  );
}
