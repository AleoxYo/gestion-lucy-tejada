import { z } from 'zod';
import {
  CONDICION,
  ESTADOS_CONCIERTO,
  ESTADOS_ENCUESTA,
  ESTADOS_INSTRUMENTO,
  ESTADOS_PROCESO,
  FAMILIAS_INSTRUMENTO,
  ROLES,
  TIPOS_CONCIERTO,
  TIPOS_PREGUNTA,
  TIPOS_PROCESO,
  TIPOS_SOLICITANTE,
} from './constantes';

const texto = (min = 1, max = 500) => z.string().trim().min(min, 'Campo obligatorio').max(max);
const opcional = (max = 1000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));
const fecha = z.coerce.date({ errorMap: () => ({ message: 'Fecha inválida' }) });
const consentimiento = z.literal(true, {
  errorMap: () => ({ message: 'Debe aceptar la política de tratamiento de datos (Ley 1581 de 2012)' }),
});

// ---------- Autenticación y usuarios ----------
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string().min(1, 'Ingrese la contraseña'),
});

const password = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Za-z]/, 'Debe contener letras')
  .regex(/\d/, 'Debe contener números');

export const registroSchema = z.object({
  nombre: texto(3, 120),
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  documento: opcional(30),
  telefono: opcional(30),
  password,
  aceptaTratamiento: consentimiento,
});

export const usuarioCrearSchema = z.object({
  nombre: texto(3, 120),
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  documento: opcional(30),
  telefono: opcional(30),
  rol: z.enum(ROLES),
  password,
});

export const usuarioActualizarSchema = z.object({
  nombre: texto(3, 120).optional(),
  rol: z.enum(ROLES).optional(),
  activo: z.boolean().optional(),
  telefono: opcional(30),
});

// ---------- Conciertos ----------
export const solicitudSchema = z.object({
  tipoSolicitante: z.enum(TIPOS_SOLICITANTE),
  solicitante: texto(3, 120),
  institucion: opcional(160),
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  telefono: opcional(30),
  fechaPropuesta: fecha,
  lugar: texto(3, 200),
  descripcion: texto(10, 2000),
  aceptaTratamiento: consentimiento,
});

export const responderSolicitudSchema = z.discriminatedUnion('decision', [
  z.object({
    decision: z.literal('APROBADA'),
    respuesta: texto(3, 2000),
    concierto: z.object({
      titulo: texto(3, 160),
      fecha,
      lugar: texto(3, 200),
      agrupacion: texto(3, 160).optional(),
    }),
  }),
  z.object({ decision: z.literal('RECHAZADA'), respuesta: texto(3, 2000) }),
]);

export const conciertoSchema = z.object({
  titulo: texto(3, 160),
  tipo: z.enum(TIPOS_CONCIERTO),
  fecha,
  lugar: texto(3, 200),
  agrupacion: texto(3, 160).optional(),
  descripcion: opcional(2000),
});

export const conciertoActualizarSchema = conciertoSchema.partial().extend({
  estado: z.enum(ESTADOS_CONCIERTO).optional(),
});

// ---------- Instrumentos ----------
export const instrumentoSchema = z.object({
  codigo: texto(2, 40).transform((v) => v.toUpperCase()),
  nombre: texto(2, 120),
  familia: z.enum(FAMILIAS_INSTRUMENTO),
  marca: opcional(80),
  observaciones: opcional(1000),
});

export const instrumentoActualizarSchema = instrumentoSchema.partial().extend({
  estado: z.enum(ESTADOS_INSTRUMENTO).optional(),
});

export const salidaSchema = z.object({
  conciertoId: texto(1, 40),
  responsable: texto(3, 120),
  instrumentoIds: z.array(z.string()).min(1, 'Seleccione al menos un instrumento'),
  estadoSalida: z.enum(CONDICION).default('BUENO'),
  observaciones: opcional(1000),
});

export const regresoSchema = z.object({
  estadoRegreso: z.enum(CONDICION),
  observaciones: opcional(1000),
});

// ---------- Formación y festivales ----------
export const procesoSchema = z
  .object({
    nombre: texto(3, 160),
    tipo: z.enum(TIPOS_PROCESO),
    descripcion: opcional(2000),
    necesidades: texto(5, 2000),
    formadorId: z.string().optional().nullable(),
    numeroContrato: opcional(60),
    fechaInicio: fecha,
    fechaFin: fecha,
    cupo: z.coerce.number().int().min(1).max(1000),
    asistenciaMinima: z.coerce.number().int().min(0).max(100).default(80),
  })
  .refine((p) => p.fechaFin >= p.fechaInicio, {
    message: 'La fecha de fin debe ser posterior al inicio',
    path: ['fechaFin'],
  });

export const procesoActualizarSchema = z.object({
  nombre: texto(3, 160).optional(),
  descripcion: opcional(2000),
  necesidades: texto(5, 2000).optional(),
  formadorId: z.string().optional().nullable(),
  numeroContrato: opcional(60),
  cupo: z.coerce.number().int().min(1).max(1000).optional(),
  estado: z.enum(['ABIERTO', 'EN_CURSO'] as const).optional(),
});
export { ESTADOS_PROCESO };

export const jornadaSchema = z.object({
  fecha,
  tema: texto(3, 200),
  lugar: opcional(200),
});

export const inscripcionAdminSchema = z.object({ participanteId: z.string().optional() });

export const asistenciaSchema = z.object({
  registros: z.array(z.object({ inscripcionId: z.string(), presente: z.boolean() })),
});

// ---------- Encuestas ----------
export const encuestaSchema = z.object({
  titulo: texto(3, 160),
  descripcion: opcional(1000),
  periodo: z.string().regex(/^\d{4}-[12]$/, 'Formato de periodo: AAAA-1 o AAAA-2'),
  conciertoId: z.string().optional().nullable(),
  preguntas: z
    .array(z.object({ texto: texto(3, 300), tipo: z.enum(TIPOS_PREGUNTA) }))
    .min(1, 'Agregue al menos una pregunta'),
});

export const encuestaEstadoSchema = z.object({ estado: z.enum(ESTADOS_ENCUESTA) });

export const respuestaEncuestaSchema = z.object({
  respuestas: z
    .array(
      z.object({
        preguntaId: z.string(),
        valorNumero: z.number().int().min(0).max(5).optional().nullable(),
        valorTexto: z.string().max(1000).optional().nullable(),
      }),
    )
    .min(1),
});

export const planMejoraSchema = z.object({
  diagnostico: texto(5, 3000),
  acciones: texto(5, 3000),
  responsable: texto(3, 120),
  fechaCompromiso: fecha,
});
