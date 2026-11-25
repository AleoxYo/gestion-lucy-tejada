export const ROLES = ['DIRECTOR', 'AUXILIAR', 'FORMADOR', 'PARTICIPANTE'] as const;
export type Rol = (typeof ROLES)[number];

export const ROL_LABEL: Record<Rol, string> = {
  DIRECTOR: 'Director Técnico',
  AUXILIAR: 'Auxiliar Administrativo',
  FORMADOR: 'Formador',
  PARTICIPANTE: 'Participante',
};

/** Roles con permisos de gestión administrativa del área de Música. */
export const GESTION: Rol[] = ['DIRECTOR', 'AUXILIAR'];

export const TIPOS_CONCIERTO = ['ESPECIAL', 'RETRETA', 'SOLICITADO'] as const;
export const ESTADOS_CONCIERTO = ['PROGRAMADO', 'REALIZADO', 'CANCELADO'] as const;
export const TIPOS_SOLICITANTE = ['INSTITUCION', 'COMUNIDAD'] as const;
export const ESTADOS_SOLICITUD = ['PENDIENTE', 'APROBADA', 'RECHAZADA'] as const;
export const FAMILIAS_INSTRUMENTO = ['VIENTO_MADERA', 'VIENTO_METAL', 'PERCUSION', 'CUERDA', 'OTRO'] as const;
export const ESTADOS_INSTRUMENTO = ['DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO', 'BAJA'] as const;
export const CONDICION = ['BUENO', 'REGULAR', 'MALO'] as const;
export const TIPOS_PROCESO = ['FESTIVAL', 'FORMACION'] as const;
export const ESTADOS_PROCESO = ['ABIERTO', 'EN_CURSO', 'CERRADO'] as const;
export const ESTADOS_ENCUESTA = ['BORRADOR', 'PUBLICADA', 'CERRADA'] as const;
export const TIPOS_PREGUNTA = ['ESCALA', 'SI_NO', 'TEXTO'] as const;

export const ETIQUETAS: Record<string, string> = {
  ESPECIAL: 'Concierto especial',
  RETRETA: 'Retreta',
  SOLICITADO: 'Concierto solicitado',
  PROGRAMADO: 'Programado',
  REALIZADO: 'Realizado',
  CANCELADO: 'Cancelado',
  INSTITUCION: 'Institución',
  COMUNIDAD: 'Comunidad',
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  VIENTO_MADERA: 'Viento madera',
  VIENTO_METAL: 'Viento metal',
  PERCUSION: 'Percusión',
  CUERDA: 'Cuerda',
  OTRO: 'Otro',
  DISPONIBLE: 'Disponible',
  PRESTADO: 'Prestado',
  MANTENIMIENTO: 'Mantenimiento',
  BAJA: 'De baja',
  BUENO: 'Bueno',
  REGULAR: 'Regular',
  MALO: 'Malo',
  FESTIVAL: 'Festival',
  FORMACION: 'Proceso de formación',
  ABIERTO: 'Inscripciones abiertas',
  EN_CURSO: 'En curso',
  CERRADO: 'Cerrado',
  BORRADOR: 'Borrador',
  PUBLICADA: 'Publicada',
  CERRADA: 'Cerrada',
  ESCALA: 'Escala 1 a 5',
  SI_NO: 'Sí / No',
  TEXTO: 'Texto libre',
};

export const etiqueta = (v: string | null | undefined) => (v ? (ETIQUETAS[v] ?? v) : '');
