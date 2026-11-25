// Tabulación automática de encuestas de satisfacción (CAR-04).

export interface PreguntaT {
  id: string;
  texto: string;
  tipo: string; // ESCALA | SI_NO | TEXTO
  orden: number;
}

export interface ItemT {
  preguntaId: string;
  valorNumero: number | null;
  valorTexto: string | null;
}

export interface ResultadoPregunta {
  preguntaId: string;
  texto: string;
  tipo: string;
  respuestas: number;
  promedio?: number; // ESCALA
  distribucion?: Record<string, number>; // ESCALA: "1".."5"; SI_NO: "Sí"/"No"
  porcentajeSatisfaccion?: number; // ESCALA: % de 4 y 5; SI_NO: % de "Sí"
  comentarios?: string[]; // TEXTO
}

export function tabular(preguntas: PreguntaT[], items: ItemT[]): ResultadoPregunta[] {
  const porPregunta = new Map<string, ItemT[]>();
  for (const it of items) {
    const lista = porPregunta.get(it.preguntaId) ?? [];
    lista.push(it);
    porPregunta.set(it.preguntaId, lista);
  }

  return [...preguntas]
    .sort((a, b) => a.orden - b.orden)
    .map((p) => {
      const its = porPregunta.get(p.id) ?? [];
      const base = { preguntaId: p.id, texto: p.texto, tipo: p.tipo };

      if (p.tipo === 'ESCALA') {
        const valores = its.map((i) => i.valorNumero).filter((v): v is number => v !== null && v >= 1 && v <= 5);
        const distribucion: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        valores.forEach((v) => distribucion[String(v)]++);
        const suma = valores.reduce((a, b) => a + b, 0);
        return {
          ...base,
          respuestas: valores.length,
          promedio: valores.length ? Math.round((suma / valores.length) * 100) / 100 : 0,
          distribucion,
          porcentajeSatisfaccion: valores.length
            ? Math.round((valores.filter((v) => v >= 4).length / valores.length) * 100)
            : 0,
        };
      }

      if (p.tipo === 'SI_NO') {
        const valores = its.map((i) => i.valorNumero).filter((v): v is number => v === 0 || v === 1);
        const si = valores.filter((v) => v === 1).length;
        return {
          ...base,
          respuestas: valores.length,
          distribucion: { Sí: si, No: valores.length - si },
          porcentajeSatisfaccion: valores.length ? Math.round((si / valores.length) * 100) : 0,
        };
      }

      const comentarios = its.map((i) => i.valorTexto?.trim()).filter((t): t is string => !!t);
      return { ...base, respuestas: comentarios.length, comentarios };
    });
}

/** Índice global: promedio de % de satisfacción de las preguntas cerradas. */
export function indiceSatisfaccion(resultados: ResultadoPregunta[]) {
  const cerradas = resultados.filter((r) => r.porcentajeSatisfaccion !== undefined && r.respuestas > 0);
  if (!cerradas.length) return 0;
  return Math.round(cerradas.reduce((a, r) => a + (r.porcentajeSatisfaccion ?? 0), 0) / cerradas.length);
}
