import { sesionActual } from '@/lib/sesionServidor';
import { ListaFestivales } from './ListaFestivales';

export const metadata = { title: 'Festivales y formación' };

export default async function Festivales() {
  const s = await sesionActual();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1>Festivales y procesos de formación</h1>
      <p className="mt-2 text-sm text-slate-600">
        Capacitación para formadores, directores y músicos, y festivales del área de Música. Inscríbase en línea; al cumplir la asistencia mínima
        recibirá su certificado en PDF.
      </p>
      <ListaFestivales rol={s?.rol ?? null} />
    </div>
  );
}
