'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Alerta, Campo } from '@/components/ui';
import { api } from '@/lib/cliente';

const DEMO = [
  ['Director Técnico', 'director@lucytejada.gov.co'],
  ['Auxiliar Administrativo', 'auxiliar@lucytejada.gov.co'],
  ['Formador', 'formador@lucytejada.gov.co'],
  ['Participante', 'participante@correo.com'],
];

function FormLogin() {
  const router = useRouter();
  const volver = useSearchParams().get('volver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await api('/auth/login', { method: 'POST', body: { email, password } });
      const destino = volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/panel';
      router.push(destino);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-12 md:grid-cols-2">
      <form onSubmit={entrar} className="tarjeta space-y-4">
        <h1>Ingresar</h1>
        <Campo etiqueta="Correo electrónico">
          <input type="email" required autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Campo>
        <Campo etiqueta="Contraseña">
          <input type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Campo>
        <Alerta>{error}</Alerta>
        <button className="btn-primario w-full" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
        <p className="text-center text-sm text-slate-600">
          ¿No tiene cuenta? <Link className="enlace" href="/registro">Regístrese como participante</Link>
        </p>
      </form>
      <div className="tarjeta bg-marca-50">
        <h2>Usuarios de demostración</h2>
        <p className="mt-1 text-sm text-slate-600">
          Contraseña de todos: <code className="rounded bg-white px-1.5 py-0.5 font-semibold">Musica2026</code>
        </p>
        <ul className="mt-4 space-y-2">
          {DEMO.map(([rol, correo]) => (
            <li key={correo}>
              <button
                type="button"
                className="w-full rounded-lg border border-marca-100 bg-white px-3 py-2 text-left text-sm hover:border-marca-500"
                onClick={() => {
                  setEmail(correo);
                  setPassword('Musica2026');
                }}
              >
                <span className="block font-semibold text-marca-700">{rol}</span>
                <span className="text-xs text-slate-500">{correo}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense>
      <FormLogin />
    </Suspense>
  );
}
