// Contrato OpenAPI 3 de los servicios del Módulo de Música (CAR-10).
// Los consumidores (web del módulo, Escenarios, Emisora, Escuela) solo conocen este contrato.

type Obj = Record<string, unknown>;

const ref = (n: string) => ({ $ref: `#/components/schemas/${n}` });
const json = (schema: Obj) => ({ content: { 'application/json': { schema } } });
const cuerpo = (n: string) => ({ required: true, ...json(ref(n)) });
const resp = (desc: string, schema?: Obj) => (schema ? { description: desc, ...json(schema) } : { description: desc });
const lista = (n: string) => ({
  type: 'object',
  properties: {
    datos: { type: 'array', items: ref(n) },
    total: { type: 'integer' },
    pagina: { type: 'integer' },
    tamano: { type: 'integer' },
  },
});
const errores = {
  '400': { $ref: '#/components/responses/Invalido' },
  '401': { $ref: '#/components/responses/NoAutenticado' },
  '403': { $ref: '#/components/responses/SinPermiso' },
  '404': { $ref: '#/components/responses/NoEncontrado' },
};
const idPath = (name = 'id') => ({ name, in: 'path', required: true, schema: { type: 'string' } });
const q = (name: string, desc: string, schema: Obj = { type: 'string' }) => ({ name, in: 'query', description: desc, schema });
const pag = [q('pagina', 'Número de página', { type: 'integer', default: 1 }), q('tamano', 'Tamaño de página (máx. 200)', { type: 'integer', default: 50 })];
const publico = { security: [] };
const roles = (...r: string[]) => ({ 'x-roles': r });
const fecha = { type: 'string', format: 'date-time' };
const en = (...v: string[]) => ({ type: 'string', enum: v });
const archivo = (mime: string) => ({ description: 'Archivo', content: { [mime]: { schema: { type: 'string', format: 'binary' } } } });

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'SGM-LT · Servicios del Módulo de Música',
    version: '1.0.0',
    description:
      'Servicios REST del Sistema de Gestión Musical Lucy Tejada (Secretaría de Cultura de Pereira).\n\n' +
      '**Autenticación:** obtenga un token con `POST /auth/login` y envíelo en la cabecera `Authorization: Bearer <token>`. ' +
      'Los servicios no guardan estado de sesión (JWT, 8 horas de vigencia).\n\n' +
      '**Roles:** DIRECTOR, AUXILIAR, FORMADOR, PARTICIPANTE (ver `x-roles` en cada operación).\n\n' +
      '**Errores:** todas las respuestas de error tienen la forma `{ "error": string, "detalles"?: any }`.',
  },
  servers: [{ url: '/api/v1', description: 'Servidor actual' }],
  tags: [
    { name: 'Autenticación' },
    { name: 'Conciertos', description: 'Agenda, solicitudes y programación (consumidores: Web, Escenarios, Emisora)' },
    { name: 'Instrumentos', description: 'Inventario y trazabilidad de salidas' },
    { name: 'Formación', description: 'Festivales, procesos de formación, inscripción, asistencia y certificados (consumidores: Web, Escuela)' },
    { name: 'Encuestas', description: 'Encuestas de satisfacción y planes de mejoramiento' },
    { name: 'Reportes' },
    { name: 'Notificaciones', description: 'Servicio utilitario de correo' },
    { name: 'Administración' },
  ],
  security: [{ bearerAuth: [] }],
  paths: {
    // ---------------- Autenticación ----------------
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión y obtener JWT',
        ...publico,
        requestBody: cuerpo('Login'),
        responses: { '200': resp('Token emitido', ref('Sesion')), '401': { $ref: '#/components/responses/NoAutenticado' } },
      },
    },
    '/auth/registro': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registro público de participantes (requiere aceptar tratamiento de datos, Ley 1581)',
        ...publico,
        requestBody: cuerpo('Registro'),
        responses: { '201': resp('Cuenta creada', ref('Sesion')), '400': errores['400'], '409': resp('Correo ya registrado') },
      },
    },
    '/auth/logout': { post: { tags: ['Autenticación'], summary: 'Cerrar sesión', responses: { '200': resp('OK') } } },
    '/auth/me': {
      get: { tags: ['Autenticación'], summary: 'Datos del usuario autenticado', responses: { '200': resp('Usuario', ref('Usuario')), '401': errores['401'] } },
    },

    // ---------------- Conciertos ----------------
    '/conciertos': {
      get: {
        tags: ['Conciertos'],
        summary: 'Consultar agenda de conciertos (pública)',
        ...publico,
        parameters: [q('desde', 'Fecha inicial (ISO)', fecha), q('hasta', 'Fecha final (ISO)', fecha), q('tipo', 'Tipo', en('ESPECIAL', 'RETRETA', 'SOLICITADO')), q('estado', 'Estado', en('PROGRAMADO', 'REALIZADO', 'CANCELADO')), ...pag],
        responses: { '200': resp('Agenda', lista('Concierto')) },
      },
      post: {
        tags: ['Conciertos'],
        summary: 'Programar concierto especial o retreta',
        ...roles('DIRECTOR', 'AUXILIAR'),
        requestBody: cuerpo('ConciertoEntrada'),
        responses: { '201': resp('Creado', ref('Concierto')), ...errores },
      },
    },
    '/conciertos/{id}': {
      parameters: [idPath()],
      get: { tags: ['Conciertos'], summary: 'Detalle de concierto', ...publico, responses: { '200': resp('Concierto', ref('Concierto')), '404': errores['404'] } },
      patch: {
        tags: ['Conciertos'],
        summary: 'Actualizar concierto (incluye cambio de estado)',
        ...roles('DIRECTOR', 'AUXILIAR'),
        requestBody: cuerpo('ConciertoActualizar'),
        responses: { '200': resp('Actualizado', ref('Concierto')), ...errores },
      },
      delete: { tags: ['Conciertos'], summary: 'Eliminar concierto', ...roles('DIRECTOR'), responses: { '200': resp('Eliminado'), ...errores } },
    },
    '/conciertos/solicitudes': {
      get: {
        tags: ['Conciertos'],
        summary: 'Listar solicitudes de concierto',
        ...roles('DIRECTOR', 'AUXILIAR'),
        parameters: [q('estado', 'Estado', en('PENDIENTE', 'APROBADA', 'RECHAZADA')), ...pag],
        responses: { '200': resp('Solicitudes', lista('Solicitud')), ...errores },
      },
      post: {
        tags: ['Conciertos'],
        summary: 'Crear solicitud de concierto (pública: instituciones y comunidad)',
        ...publico,
        requestBody: cuerpo('SolicitudEntrada'),
        responses: { '201': resp('Radicada', { type: 'object', properties: { id: { type: 'string' }, estado: { type: 'string' } } }), '400': errores['400'] },
      },
    },
    '/conciertos/solicitudes/{id}': {
      parameters: [idPath()],
      get: { tags: ['Conciertos'], summary: 'Detalle de solicitud', ...roles('DIRECTOR', 'AUXILIAR'), responses: { '200': resp('Solicitud', ref('Solicitud')), ...errores } },
      patch: {
        tags: ['Conciertos'],
        summary: 'Responder solicitud. Si se aprueba se programa el concierto y se notifica al solicitante.',
        ...roles('DIRECTOR', 'AUXILIAR'),
        requestBody: cuerpo('RespuestaSolicitud'),
        responses: { '200': resp('Respondida'), '409': resp('Ya respondida'), ...errores },
      },
    },

    // ---------------- Instrumentos ----------------
    '/instrumentos': {
      get: {
        tags: ['Instrumentos'],
        summary: 'Consultar inventario',
        ...roles('DIRECTOR', 'AUXILIAR'),
        parameters: [q('estado', 'Estado', en('DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO', 'BAJA')), q('familia', 'Familia'), q('q', 'Búsqueda por código o nombre'), ...pag],
        responses: { '200': resp('Inventario', lista('Instrumento')), ...errores },
      },
      post: { tags: ['Instrumentos'], summary: 'Registrar instrumento', ...roles('DIRECTOR', 'AUXILIAR'), requestBody: cuerpo('InstrumentoEntrada'), responses: { '201': resp('Creado', ref('Instrumento')), '409': resp('Código repetido'), ...errores } },
    },
    '/instrumentos/{id}': {
      parameters: [idPath()],
      get: { tags: ['Instrumentos'], summary: 'Ficha e historial del instrumento', ...roles('DIRECTOR', 'AUXILIAR'), responses: { '200': resp('Instrumento', ref('Instrumento')), ...errores } },
      patch: { tags: ['Instrumentos'], summary: 'Actualizar instrumento (estado MANTENIMIENTO, BAJA…)', ...roles('DIRECTOR', 'AUXILIAR'), requestBody: cuerpo('InstrumentoEntrada'), responses: { '200': resp('Actualizado'), ...errores } },
    },
    '/instrumentos/salidas': {
      post: {
        tags: ['Instrumentos'],
        summary: 'Registrar salida de instrumentos para un concierto',
        ...roles('DIRECTOR', 'AUXILIAR'),
        requestBody: cuerpo('Salida'),
        responses: { '201': resp('Salida registrada'), '409': resp('Instrumento no disponible o concierto cancelado'), ...errores },
      },
    },
    '/instrumentos/movimientos': {
      get: {
        tags: ['Instrumentos'],
        summary: 'Consultar movimientos (salidas y regresos)',
        ...roles('DIRECTOR', 'AUXILIAR'),
        parameters: [q('abiertos', 'Solo instrumentos sin regresar', { type: 'boolean' }), q('conciertoId', 'Concierto'), q('instrumentoId', 'Instrumento'), ...pag],
        responses: { '200': resp('Movimientos', lista('Movimiento')), ...errores },
      },
    },
    '/instrumentos/movimientos/{id}/regreso': {
      parameters: [idPath()],
      post: {
        tags: ['Instrumentos'],
        summary: 'Registrar regreso del instrumento (si vuelve MALO pasa a MANTENIMIENTO)',
        ...roles('DIRECTOR', 'AUXILIAR'),
        requestBody: cuerpo('Regreso'),
        responses: { '200': resp('Regreso registrado', ref('Movimiento')), '409': resp('Ya regresó'), ...errores },
      },
    },

    // ---------------- Formación ----------------
    '/formacion/procesos': {
      get: {
        tags: ['Formación'],
        summary: 'Listar festivales y procesos de formación (público)',
        ...publico,
        parameters: [q('estado', 'Estado', en('ABIERTO', 'EN_CURSO', 'CERRADO')), q('tipo', 'Tipo', en('FESTIVAL', 'FORMACION')), q('mios', 'Solo los asignados al formador autenticado', { type: 'boolean' }), ...pag],
        responses: { '200': resp('Procesos', lista('Proceso')) },
      },
      post: { tags: ['Formación'], summary: 'Crear festival o proceso de formación', ...roles('DIRECTOR', 'AUXILIAR'), requestBody: cuerpo('ProcesoEntrada'), responses: { '201': resp('Creado', ref('Proceso')), ...errores } },
    },
    '/formacion/procesos/{id}': {
      parameters: [idPath()],
      get: { tags: ['Formación'], summary: 'Detalle con cronograma (e inscritos si gestiona el proceso)', responses: { '200': resp('Proceso', ref('Proceso')), ...errores } },
      patch: { tags: ['Formación'], summary: 'Actualizar proceso', ...roles('DIRECTOR', 'AUXILIAR'), requestBody: cuerpo('ProcesoEntrada'), responses: { '200': resp('Actualizado'), ...errores } },
    },
    '/formacion/procesos/{id}/jornadas': {
      parameters: [idPath()],
      get: { tags: ['Formación'], summary: 'Cronograma de jornadas', responses: { '200': resp('Jornadas', { type: 'array', items: ref('Jornada') }) } },
      post: { tags: ['Formación'], summary: 'Agregar jornada al cronograma', ...roles('DIRECTOR', 'AUXILIAR', 'FORMADOR (asignado)'), requestBody: cuerpo('JornadaEntrada'), responses: { '201': resp('Creada', ref('Jornada')), ...errores } },
    },
    '/formacion/procesos/{id}/inscripciones': {
      parameters: [idPath()],
      get: { tags: ['Formación'], summary: 'Listar inscritos', ...roles('DIRECTOR', 'AUXILIAR', 'FORMADOR (asignado)'), responses: { '200': resp('Inscritos'), ...errores } },
      post: {
        tags: ['Formación'],
        summary: 'Inscribir participante (el participante se inscribe a sí mismo; gestión puede enviar participanteId)',
        ...roles('PARTICIPANTE', 'DIRECTOR', 'AUXILIAR'),
        requestBody: { required: false, ...json({ type: 'object', properties: { participanteId: { type: 'string' } } }) },
        responses: { '201': resp('Inscrito'), '409': resp('Sin cupo, cerrado o ya inscrito'), ...errores },
      },
    },
    '/formacion/jornadas/{id}/asistencia': {
      parameters: [idPath()],
      get: { tags: ['Formación'], summary: 'Planilla de asistencia de la jornada', ...roles('DIRECTOR', 'AUXILIAR', 'FORMADOR (asignado)'), responses: { '200': resp('Planilla'), ...errores } },
      put: { tags: ['Formación'], summary: 'Registrar asistencia de la jornada', ...roles('DIRECTOR', 'AUXILIAR', 'FORMADOR (asignado)'), requestBody: cuerpo('Asistencia'), responses: { '200': resp('Guardada'), ...errores } },
    },
    '/formacion/procesos/{id}/cerrar': {
      parameters: [idPath()],
      post: {
        tags: ['Formación'],
        summary: 'Cerrar proceso y emitir certificados a quienes cumplen la asistencia mínima',
        ...roles('DIRECTOR', 'AUXILIAR'),
        responses: { '200': resp('Proceso cerrado con resultados'), '409': resp('Ya cerrado o sin jornadas'), ...errores },
      },
    },
    '/formacion/mis-inscripciones': {
      get: { tags: ['Formación'], summary: 'Inscripciones del usuario autenticado', responses: { '200': resp('Inscripciones'), '401': errores['401'] } },
    },
    '/formacion/certificados/{inscripcionId}': {
      parameters: [idPath('inscripcionId')],
      get: { tags: ['Formación'], summary: 'Emitir/descargar certificado PDF', responses: { '200': archivo('application/pdf'), '409': resp('Sin certificado'), ...errores } },
    },
    '/formacion/certificados/verificar/{codigo}': {
      parameters: [idPath('codigo')],
      get: { tags: ['Formación'], summary: 'Verificar autenticidad de un certificado (público)', ...publico, responses: { '200': resp('Certificado válido'), '404': errores['404'] } },
    },

    // ---------------- Encuestas ----------------
    '/encuestas': {
      get: { tags: ['Encuestas'], summary: 'Listar encuestas (sin rol de gestión: solo publicadas)', ...publico, responses: { '200': resp('Encuestas', lista('Encuesta')) } },
      post: { tags: ['Encuestas'], summary: 'Crear encuesta con preguntas', ...roles('DIRECTOR', 'AUXILIAR'), requestBody: cuerpo('EncuestaEntrada'), responses: { '201': resp('Creada', ref('Encuesta')), ...errores } },
    },
    '/encuestas/{id}': {
      parameters: [idPath()],
      get: { tags: ['Encuestas'], summary: 'Detalle con preguntas (público si está publicada)', ...publico, responses: { '200': resp('Encuesta', ref('Encuesta')), '404': errores['404'] } },
      patch: {
        tags: ['Encuestas'],
        summary: 'Publicar o cerrar encuesta',
        ...roles('DIRECTOR', 'AUXILIAR'),
        requestBody: { required: true, ...json({ type: 'object', required: ['estado'], properties: { estado: en('BORRADOR', 'PUBLICADA', 'CERRADA') } }) },
        responses: { '200': resp('Actualizada'), ...errores },
      },
    },
    '/encuestas/{id}/respuestas': {
      parameters: [idPath()],
      post: { tags: ['Encuestas'], summary: 'Recibir respuesta de un asistente (pública y anónima)', ...publico, requestBody: cuerpo('RespuestaEncuesta'), responses: { '201': resp('Recibida'), '409': resp('Encuesta no publicada'), '400': errores['400'] } },
    },
    '/encuestas/{id}/resultados': {
      parameters: [idPath()],
      get: { tags: ['Encuestas'], summary: 'Consultar resultados tabulados', ...roles('DIRECTOR', 'AUXILIAR'), responses: { '200': resp('Resultados', ref('Resultados')), ...errores } },
    },
    '/encuestas/{id}/planes': {
      parameters: [idPath()],
      get: { tags: ['Encuestas'], summary: 'Diagnósticos y planes de mejoramiento', ...roles('DIRECTOR', 'AUXILIAR'), responses: { '200': resp('Planes') } },
      post: { tags: ['Encuestas'], summary: 'Registrar diagnóstico y plan de mejoramiento', ...roles('DIRECTOR', 'AUXILIAR'), requestBody: cuerpo('PlanMejora'), responses: { '201': resp('Creado'), ...errores } },
    },

    // ---------------- Reportes ----------------
    '/reportes/{tipo}': {
      parameters: [
        { name: 'tipo', in: 'path', required: true, schema: en('conciertos', 'asistencia', 'instrumentos', 'inventario') },
        q('formato', 'Formato', en('xlsx', 'pdf')),
        q('desde', 'Desde (AAAA-MM-DD)', { type: 'string', format: 'date' }),
        q('hasta', 'Hasta (AAAA-MM-DD)', { type: 'string', format: 'date' }),
      ],
      get: {
        tags: ['Reportes'],
        summary: 'Exportar reporte a Excel o PDF',
        ...roles('DIRECTOR', 'AUXILIAR'),
        responses: { '200': { description: 'Archivo', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } }, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } } } }, ...errores },
      },
    },

    // ---------------- Notificaciones ----------------
    '/notificaciones': {
      get: { tags: ['Notificaciones'], summary: 'Bandeja de salida de correos', ...roles('DIRECTOR', 'AUXILIAR'), parameters: pag, responses: { '200': resp('Notificaciones') } },
      post: {
        tags: ['Notificaciones'],
        summary: 'Enviar recordatorio a los inscritos de un proceso',
        ...roles('DIRECTOR', 'AUXILIAR'),
        requestBody: { required: true, ...json({ type: 'object', required: ['procesoId'], properties: { procesoId: { type: 'string' } } }) },
        responses: { '200': resp('Enviados') },
      },
    },

    // ---------------- Administración ----------------
    '/usuarios': {
      get: { tags: ['Administración'], summary: 'Listar usuarios', ...roles('DIRECTOR', 'AUXILIAR'), parameters: [q('rol', 'Rol', en('DIRECTOR', 'AUXILIAR', 'FORMADOR', 'PARTICIPANTE')), ...pag], responses: { '200': resp('Usuarios', lista('Usuario')) } },
      post: { tags: ['Administración'], summary: 'Crear usuario con rol', ...roles('DIRECTOR'), requestBody: cuerpo('UsuarioEntrada'), responses: { '201': resp('Creado', ref('Usuario')), ...errores } },
    },
    '/usuarios/{id}': {
      parameters: [idPath()],
      patch: {
        tags: ['Administración'],
        summary: 'Cambiar rol o activar/desactivar usuario',
        ...roles('DIRECTOR'),
        requestBody: { required: true, ...json({ type: 'object', properties: { nombre: { type: 'string' }, rol: en('DIRECTOR', 'AUXILIAR', 'FORMADOR', 'PARTICIPANTE'), activo: { type: 'boolean' } } }) },
        responses: { '200': resp('Actualizado'), ...errores },
      },
    },
    '/accesos': {
      get: { tags: ['Administración'], summary: 'Registro de accesos y operaciones', ...roles('DIRECTOR'), parameters: [q('accion', 'Acción', en('LOGIN_OK', 'LOGIN_FALLIDO', 'LOGOUT', 'REGISTRO', 'API')), ...pag], responses: { '200': resp('Registros') } },
    },
    '/estadisticas': { get: { tags: ['Administración'], summary: 'Indicadores del tablero según rol', responses: { '200': resp('Indicadores') } } },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    responses: {
      Invalido: resp('Datos inválidos', ref('Error')),
      NoAutenticado: resp('No autenticado', ref('Error')),
      SinPermiso: resp('Sin permisos para el rol', ref('Error')),
      NoEncontrado: resp('No encontrado', ref('Error')),
    },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string' }, detalles: {} }, required: ['error'] },
      Login: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email', example: 'director@lucytejada.gov.co' }, password: { type: 'string', example: 'Musica2026' } } },
      Registro: {
        type: 'object',
        required: ['nombre', 'email', 'password', 'aceptaTratamiento'],
        properties: { nombre: { type: 'string' }, email: { type: 'string', format: 'email' }, documento: { type: 'string' }, telefono: { type: 'string' }, password: { type: 'string', minLength: 8 }, aceptaTratamiento: { type: 'boolean', enum: [true] } },
      },
      Sesion: { type: 'object', properties: { token: { type: 'string' }, usuario: ref('Usuario') } },
      Usuario: { type: 'object', properties: { id: { type: 'string' }, nombre: { type: 'string' }, email: { type: 'string' }, rol: en('DIRECTOR', 'AUXILIAR', 'FORMADOR', 'PARTICIPANTE'), activo: { type: 'boolean' } } },
      UsuarioEntrada: {
        type: 'object',
        required: ['nombre', 'email', 'rol', 'password'],
        properties: { nombre: { type: 'string' }, email: { type: 'string' }, documento: { type: 'string' }, telefono: { type: 'string' }, rol: en('DIRECTOR', 'AUXILIAR', 'FORMADOR', 'PARTICIPANTE'), password: { type: 'string' } },
      },
      Concierto: {
        type: 'object',
        properties: { id: { type: 'string' }, titulo: { type: 'string' }, tipo: en('ESPECIAL', 'RETRETA', 'SOLICITADO'), fecha, lugar: { type: 'string' }, agrupacion: { type: 'string' }, descripcion: { type: 'string', nullable: true }, estado: en('PROGRAMADO', 'REALIZADO', 'CANCELADO') },
      },
      ConciertoEntrada: {
        type: 'object',
        required: ['titulo', 'tipo', 'fecha', 'lugar'],
        properties: { titulo: { type: 'string' }, tipo: en('ESPECIAL', 'RETRETA', 'SOLICITADO'), fecha, lugar: { type: 'string' }, agrupacion: { type: 'string' }, descripcion: { type: 'string' } },
      },
      ConciertoActualizar: { allOf: [ref('ConciertoEntrada'), { type: 'object', properties: { estado: en('PROGRAMADO', 'REALIZADO', 'CANCELADO') } }] },
      SolicitudEntrada: {
        type: 'object',
        required: ['tipoSolicitante', 'solicitante', 'email', 'fechaPropuesta', 'lugar', 'descripcion', 'aceptaTratamiento'],
        properties: { tipoSolicitante: en('INSTITUCION', 'COMUNIDAD'), solicitante: { type: 'string' }, institucion: { type: 'string' }, email: { type: 'string' }, telefono: { type: 'string' }, fechaPropuesta: fecha, lugar: { type: 'string' }, descripcion: { type: 'string', minLength: 10 }, aceptaTratamiento: { type: 'boolean', enum: [true] } },
      },
      Solicitud: { allOf: [ref('SolicitudEntrada'), { type: 'object', properties: { id: { type: 'string' }, estado: en('PENDIENTE', 'APROBADA', 'RECHAZADA'), respuesta: { type: 'string', nullable: true }, fechaRespuesta: { ...fecha, nullable: true } } }] },
      RespuestaSolicitud: {
        type: 'object',
        required: ['decision', 'respuesta'],
        properties: {
          decision: en('APROBADA', 'RECHAZADA'),
          respuesta: { type: 'string' },
          concierto: { type: 'object', description: 'Obligatorio si decision = APROBADA', properties: { titulo: { type: 'string' }, fecha, lugar: { type: 'string' }, agrupacion: { type: 'string' } } },
        },
      },
      Instrumento: {
        type: 'object',
        properties: { id: { type: 'string' }, codigo: { type: 'string' }, nombre: { type: 'string' }, familia: en('VIENTO_MADERA', 'VIENTO_METAL', 'PERCUSION', 'CUERDA', 'OTRO'), marca: { type: 'string' }, estado: en('DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO', 'BAJA'), observaciones: { type: 'string' } },
      },
      InstrumentoEntrada: {
        type: 'object',
        required: ['codigo', 'nombre', 'familia'],
        properties: { codigo: { type: 'string' }, nombre: { type: 'string' }, familia: en('VIENTO_MADERA', 'VIENTO_METAL', 'PERCUSION', 'CUERDA', 'OTRO'), marca: { type: 'string' }, observaciones: { type: 'string' }, estado: en('DISPONIBLE', 'MANTENIMIENTO', 'BAJA') },
      },
      Salida: {
        type: 'object',
        required: ['conciertoId', 'responsable', 'instrumentoIds'],
        properties: { conciertoId: { type: 'string' }, responsable: { type: 'string' }, instrumentoIds: { type: 'array', items: { type: 'string' } }, estadoSalida: en('BUENO', 'REGULAR', 'MALO'), observaciones: { type: 'string' } },
      },
      Regreso: { type: 'object', required: ['estadoRegreso'], properties: { estadoRegreso: en('BUENO', 'REGULAR', 'MALO'), observaciones: { type: 'string' } } },
      Movimiento: {
        type: 'object',
        properties: { id: { type: 'string' }, instrumentoId: { type: 'string' }, conciertoId: { type: 'string' }, responsable: { type: 'string' }, fechaSalida: fecha, estadoSalida: { type: 'string' }, fechaRegreso: { ...fecha, nullable: true }, estadoRegreso: { type: 'string', nullable: true }, observaciones: { type: 'string', nullable: true } },
      },
      ProcesoEntrada: {
        type: 'object',
        required: ['nombre', 'tipo', 'necesidades', 'fechaInicio', 'fechaFin', 'cupo'],
        properties: { nombre: { type: 'string' }, tipo: en('FESTIVAL', 'FORMACION'), descripcion: { type: 'string' }, necesidades: { type: 'string', description: 'Necesidades de formación identificadas' }, formadorId: { type: 'string' }, numeroContrato: { type: 'string', description: 'Referencia del contrato de la Alcaldía' }, fechaInicio: fecha, fechaFin: fecha, cupo: { type: 'integer' }, asistenciaMinima: { type: 'integer', default: 80, description: '% mínimo para certificar' } },
      },
      Proceso: { allOf: [ref('ProcesoEntrada'), { type: 'object', properties: { id: { type: 'string' }, estado: en('ABIERTO', 'EN_CURSO', 'CERRADO'), inscritos: { type: 'integer' }, cuposDisponibles: { type: 'integer' } } }] },
      JornadaEntrada: { type: 'object', required: ['fecha', 'tema'], properties: { fecha, tema: { type: 'string' }, lugar: { type: 'string' } } },
      Jornada: { allOf: [ref('JornadaEntrada'), { type: 'object', properties: { id: { type: 'string' }, procesoId: { type: 'string' } } }] },
      Asistencia: {
        type: 'object',
        required: ['registros'],
        properties: { registros: { type: 'array', items: { type: 'object', required: ['inscripcionId', 'presente'], properties: { inscripcionId: { type: 'string' }, presente: { type: 'boolean' } } } } },
      },
      EncuestaEntrada: {
        type: 'object',
        required: ['titulo', 'periodo', 'preguntas'],
        properties: {
          titulo: { type: 'string' },
          descripcion: { type: 'string' },
          periodo: { type: 'string', example: '2026-2', description: 'Semestre (encuesta cada 6 meses)' },
          conciertoId: { type: 'string' },
          preguntas: { type: 'array', items: { type: 'object', required: ['texto', 'tipo'], properties: { texto: { type: 'string' }, tipo: en('ESCALA', 'SI_NO', 'TEXTO') } } },
        },
      },
      Encuesta: { allOf: [ref('EncuestaEntrada'), { type: 'object', properties: { id: { type: 'string' }, estado: en('BORRADOR', 'PUBLICADA', 'CERRADA') } }] },
      RespuestaEncuesta: {
        type: 'object',
        required: ['respuestas'],
        properties: {
          respuestas: {
            type: 'array',
            items: { type: 'object', required: ['preguntaId'], properties: { preguntaId: { type: 'string' }, valorNumero: { type: 'integer', description: 'ESCALA: 1-5; SI_NO: 1 = sí, 0 = no' }, valorTexto: { type: 'string' } } },
          },
        },
      },
      Resultados: {
        type: 'object',
        properties: {
          totalRespuestas: { type: 'integer' },
          indiceSatisfaccion: { type: 'integer', description: '% promedio de satisfacción' },
          resultados: {
            type: 'array',
            items: { type: 'object', properties: { preguntaId: { type: 'string' }, texto: { type: 'string' }, tipo: { type: 'string' }, respuestas: { type: 'integer' }, promedio: { type: 'number' }, distribucion: { type: 'object', additionalProperties: { type: 'integer' } }, porcentajeSatisfaccion: { type: 'integer' }, comentarios: { type: 'array', items: { type: 'string' } } } },
          },
        },
      },
      PlanMejora: { type: 'object', required: ['diagnostico', 'acciones', 'responsable', 'fechaCompromiso'], properties: { diagnostico: { type: 'string' }, acciones: { type: 'string' }, responsable: { type: 'string' }, fechaCompromiso: fecha } },
    },
  },
} as const;
