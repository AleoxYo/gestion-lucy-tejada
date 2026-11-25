'use client';
import { useState } from 'react';
import { Alerta, Campo } from '@/components/ui';
import { api } from '@/lib/cliente';
import { etiqueta } from '@/lib/constantes';
import { fmtFecha } from '@/lib/formato';

interface Verificacion {
  codigo: string;
  participante: string;
  proceso: string;
  tipo: string;
  fechaFin: string;
  porcentajeAsistencia: number;
}

export default function Verificar() {
  const [codigo, setCodigo] = useState('');
  const [res, setRes] = useState<Verificacion | null>(null);
  const [error, setError] = useState('');

  const verificar = async (e: React.FormEvent) => {
    e.preventDefault();
    setRes(null);
    setError('');
    try {
      setRes(await api<Verificacion>(`/formacion/certificados/verificar/${encodeURIComponent(codigo.trim())}`));
    } catch {
      setError('No existe un certificado válido con ese código.');
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1>Verificar certificado</h1>
      <p className="mt-1 text-sm text-slate-600">Ingrese el código impreso en el certificado (por ejemplo LT-2026-DEMO0001).</p>
      <form onSubmit={verificar} className="tarjeta mt-6 space-y-4">
        <Campo etiqueta="Código de verificación">
          <input className="input uppercase" required value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        </Campo>
        <button className="btn-primario">Verificar</button>
        <Alerta>{error}</Alerta>
        {res && (
          <Alerta tipo="exito">
            <p className="font-semibold">✓ Certificado válido</p>
            <p>{res.participante} participó en {etiqueta(res.tipo).toLowerCase()} “{res.proceso}”, finalizado el {fmtFecha(res.fechaFin)}, con {res.porcentajeAsistencia}% de asistencia.</p>
          </Alerta>
        )}
      </form>
    </div>
  );
}
