'use client';
// Cliente HTTP de la interfaz web: la web es un consumidor más de los servicios REST (SOA).

export class ErrorApi extends Error {
  constructor(
    public status: number,
    message: string,
    public detalles?: { campo: string; mensaje: string }[],
  ) {
    super(message);
  }
}

export async function api<T = unknown>(ruta: string, opciones: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/v1${ruta}`, {
    method: opciones.method ?? 'GET',
    headers: opciones.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opciones.body !== undefined ? JSON.stringify(opciones.body) : undefined,
    credentials: 'same-origin',
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detalles = Array.isArray(datos.detalles) ? datos.detalles : undefined;
    const msg = detalles?.length ? `${datos.error}: ${detalles.map((d: { mensaje: string }) => d.mensaje).join('; ')}` : datos.error;
    throw new ErrorApi(res.status, msg ?? 'Error de comunicación con el servidor', detalles);
  }
  return datos as T;
}

/** Descarga un archivo (PDF/Excel) generado por un servicio. */
export async function descargar(ruta: string) {
  const res = await fetch(`/api/v1${ruta}`, { credentials: 'same-origin' });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new ErrorApi(res.status, d.error ?? 'No se pudo descargar el archivo');
  }
  const cd = res.headers.get('content-disposition') ?? '';
  const nombre = /filename="([^"]+)"/.exec(cd)?.[1] ?? 'archivo';
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export interface Pagina<T> {
  datos: T[];
  total: number;
  pagina?: number;
  tamano?: number;
}
