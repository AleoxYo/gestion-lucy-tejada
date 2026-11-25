import Link from 'next/link';
import { AgendaPublica } from './AgendaPublica';

export default function Inicio() {
  return (
    <>
      <section className="bg-gradient-to-br from-marca-800 to-marca-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <p className="text-sm font-semibold tracking-wider text-oro-400 uppercase">Banda Sinfónica de Pereira · Escuela de Formación</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold text-white sm:text-4xl">La música de Pereira, en un solo lugar</h1>
          <p className="mt-4 max-w-2xl text-marca-100">
            Consulte la agenda de conciertos y retretas, solicite un concierto para su institución o comunidad e inscríbase en los festivales y
            procesos de formación del Centro Cultural Lucy Tejada.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/solicitar" className="btn bg-oro-400 text-marca-800 hover:bg-oro-500">Solicitar un concierto</Link>
            <Link href="/festivales" className="btn border border-white/40 text-white hover:bg-white/10">Ver festivales y formación</Link>
          </div>
        </div>
      </section>
      <section id="agenda" className="mx-auto max-w-6xl px-4 py-10">
        <AgendaPublica />
      </section>
    </>
  );
}
