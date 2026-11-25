export const fmtFecha = (d: string | Date) =>
  new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

export const fmtFechaHora = (d: string | Date) =>
  new Date(d).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Convierte una fecha al valor de un input datetime-local (hora local). */
export const aInputFechaHora = (d: string | Date) => {
  const f = new Date(d);
  const off = f.getTimezoneOffset() * 60000;
  return new Date(f.getTime() - off).toISOString().slice(0, 16);
};

export const aInputFecha = (d: string | Date) => aInputFechaHora(d).slice(0, 10);
