'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alerta, Campo, formAObjeto } from '@/components/ui';
import { Consentimiento } from '@/components/Consentimiento';
import { api } from '@/lib/cliente';

export default function Registro() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const registrar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = formAObjeto(e.currentTarget);
    if (d.password !== d.confirmar) return setError('Las contraseñas no coinciden');
    setError('');
    setEnviando(true);
    try {
      await api('/auth/registro', {
        method: 'POST',
        body: { nombre: d.nombre, email: d.email, documento: d.documento, telefono: d.telefono, password: d.password, aceptaTratamiento: !!d.aceptaTratamiento },
      });
      router.push('/festivales');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <form onSubmit={registrar} className="tarjeta grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h1>Crear cuenta de participante</h1>
          <p className="mt-1 text-sm text-slate-500">Para inscribirse en festivales y procesos de formación y descargar sus certificados.</p>
        </div>
        <div className="sm:col-span-2">
          <Campo etiqueta="Nombre completo *"><input name="nombre" required minLength={3} className="input" /></Campo>
        </div>
        <Campo etiqueta="Correo electrónico *"><input name="email" type="email" required className="input" /></Campo>
        <Campo etiqueta="Documento de identidad"><input name="documento" className="input" /></Campo>
        <Campo etiqueta="Teléfono"><input name="telefono" className="input" /></Campo>
        <div />
        <Campo etiqueta="Contraseña *" ayuda="Mínimo 8 caracteres, con letras y números.">
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </Campo>
        <Campo etiqueta="Confirmar contraseña *">
          <input name="confirmar" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </Campo>
        <div className="sm:col-span-2"><Consentimiento /></div>
        <div className="sm:col-span-2"><Alerta>{error}</Alerta></div>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
          <button className="btn-primario" disabled={enviando}>{enviando ? 'Creando…' : 'Crear cuenta'}</button>
          <Link className="enlace text-sm" href="/login">Ya tengo cuenta</Link>
        </div>
      </form>
    </div>
  );
}
