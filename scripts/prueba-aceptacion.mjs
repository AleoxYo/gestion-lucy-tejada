// Protocolo de pruebas de aceptación automatizado contra los servicios REST.
// Requiere el servidor en ejecución: npm run build && npm start   (o npm run dev)
// Uso: node scripts/prueba-aceptacion.mjs [http://localhost:3000]
// Nota: crea datos de prueba en la base de datos local.

const BASE = (process.argv[2] ?? 'http://localhost:3000') + '/api/v1';
const sufijo = Date.now().toString(36);
let ok = 0;
let fallos = 0;

async function llamar(metodo, ruta, { token, body } = {}) {
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const tipo = res.headers.get('content-type') ?? '';
  const datos = tipo.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer());
  return { status: res.status, datos, tipo };
}

function caso(nombre, condicion, detalle = '') {
  if (condicion) {
    ok++;
    console.log(`  ✔ ${nombre}`);
  } else {
    fallos++;
    console.log(`  ✘ ${nombre} ${detalle}`);
  }
}

async function login(email) {
  const r = await llamar('POST', '/auth/login', { body: { email, password: 'Musica2026' } });
  return r.datos.token;
}

const enDias = (d, h = 10) => {
  const f = new Date();
  f.setDate(f.getDate() + d);
  f.setHours(h, 0, 0, 0);
  return f.toISOString();
};

console.log(`\nPruebas de aceptación SGM-LT contra ${BASE}\n`);

// ---------- Seguridad (CAR-11, CAR-12) ----------
console.log('Seguridad y roles');
let r = await llamar('POST', '/auth/login', { body: { email: 'director@lucytejada.gov.co', password: 'incorrecta' } });
caso('Login con contraseña incorrecta → 401', r.status === 401);
const director = await login('director@lucytejada.gov.co');
const auxiliar = await login('auxiliar@lucytejada.gov.co');
const formador = await login('formador@lucytejada.gov.co');
caso('Login de los cuatro roles devuelve JWT', director && auxiliar && formador && (await login('participante@correo.com')));
r = await llamar('GET', '/instrumentos');
caso('Servicio protegido sin token → 401', r.status === 401);
const participante = await login('participante@correo.com');
r = await llamar('GET', '/instrumentos', { token: participante });
caso('Participante no accede al inventario → 403', r.status === 403);
r = await llamar('GET', '/accesos', { token: auxiliar });
caso('Auxiliar no accede al registro de accesos → 403', r.status === 403);
r = await llamar('GET', '/accesos?accion=LOGIN_FALLIDO', { token: director });
caso('El registro de accesos guarda el login fallido', r.status === 200 && r.datos.total > 0);

// ---------- Conciertos (CAR-01, CAR-02) ----------
console.log('Conciertos');
r = await llamar('GET', '/conciertos');
caso('Agenda pública de conciertos (consumible por otros módulos)', r.status === 200 && Array.isArray(r.datos.datos));
const solicitud = {
  tipoSolicitante: 'INSTITUCION',
  solicitante: 'Prueba Aceptación',
  institucion: 'Colegio de Prueba',
  email: `prueba-${sufijo}@correo.com`,
  fechaPropuesta: enDias(40),
  lugar: 'Coliseo del colegio',
  descripcion: 'Concierto didáctico para estudiantes de primaria',
};
r = await llamar('POST', '/conciertos/solicitudes', { body: solicitud });
caso('Solicitud sin autorización de datos (Ley 1581) → 400', r.status === 400);
r = await llamar('POST', '/conciertos/solicitudes', { body: { ...solicitud, aceptaTratamiento: true } });
caso('Solicitud pública radicada → 201', r.status === 201);
const solicitudId = r.datos.id;
r = await llamar('PATCH', `/conciertos/solicitudes/${solicitudId}`, {
  token: auxiliar,
  body: { decision: 'APROBADA', respuesta: 'Aprobada para la fecha propuesta', concierto: { titulo: `Concierto didáctico ${sufijo}`, fecha: enDias(40), lugar: 'Coliseo del colegio' } },
});
caso('Aprobar solicitud programa el concierto', r.status === 200 && r.datos.concierto?.tipo === 'SOLICITADO');
const conciertoId = r.datos.concierto?.id;
r = await llamar('PATCH', `/conciertos/solicitudes/${solicitudId}`, { token: auxiliar, body: { decision: 'RECHAZADA', respuesta: 'otra vez' } });
caso('No se puede responder dos veces → 409', r.status === 409);
r = await llamar('POST', '/conciertos', { token: director, body: { titulo: `Retreta ${sufijo}`, tipo: 'RETRETA', fecha: enDias(45, 11), lugar: 'Parque El Lago' } });
caso('Programar retreta → 201', r.status === 201);
r = await llamar('POST', '/conciertos', { token: participante, body: { titulo: 'X', tipo: 'RETRETA', fecha: enDias(1), lugar: 'X' } });
caso('Participante no puede programar conciertos → 403', r.status === 403);

// ---------- Instrumentos (CAR-03) ----------
console.log('Instrumentos');
r = await llamar('POST', '/instrumentos', { token: auxiliar, body: { codigo: `PR-${sufijo}`, nombre: 'Trompeta de prueba', familia: 'VIENTO_METAL' } });
caso('Registrar instrumento → 201', r.status === 201);
const instrumentoId = r.datos.id;
r = await llamar('POST', '/instrumentos/salidas', { token: auxiliar, body: { conciertoId, responsable: 'Músico de prueba', instrumentoIds: [instrumentoId] } });
caso('Registrar salida para concierto → 201', r.status === 201);
const movimientoId = r.datos.movimientos?.[0]?.id;
r = await llamar('POST', '/instrumentos/salidas', { token: auxiliar, body: { conciertoId, responsable: 'Otro', instrumentoIds: [instrumentoId] } });
caso('Instrumento ya prestado no puede volver a salir → 409', r.status === 409);
r = await llamar('POST', `/instrumentos/movimientos/${movimientoId}/regreso`, { token: auxiliar, body: { estadoRegreso: 'BUENO' } });
caso('Registrar regreso → 200', r.status === 200 && r.datos.fechaRegreso);
r = await llamar('GET', `/instrumentos/${instrumentoId}`, { token: auxiliar });
caso('Trazabilidad: historial e instrumento disponible de nuevo', r.datos.estado === 'DISPONIBLE' && r.datos.movimientos.length === 1);

// ---------- Formación (CAR-06 a CAR-09) ----------
console.log('Formación y festivales');
const formadores = await llamar('GET', '/usuarios?rol=FORMADOR', { token: director });
r = await llamar('POST', '/formacion/procesos', {
  token: director,
  body: { nombre: `Taller de prueba ${sufijo}`, tipo: 'FORMACION', necesidades: 'Necesidad de prueba', formadorId: formadores.datos.datos[0].id, fechaInicio: enDias(1), fechaFin: enDias(10), cupo: 2, asistenciaMinima: 50 },
});
caso('Crear proceso con formador y necesidades → 201', r.status === 201);
const procesoId = r.datos.id;
const j1 = await llamar('POST', `/formacion/procesos/${procesoId}/jornadas`, { token: formador, body: { fecha: enDias(1), tema: 'Jornada 1' } });
const j2 = await llamar('POST', `/formacion/procesos/${procesoId}/jornadas`, { token: director, body: { fecha: enDias(2), tema: 'Jornada 2' } });
caso('Cronograma: formador asignado y director agregan jornadas', j1.status === 201 && j2.status === 201);
r = await llamar('POST', '/auth/registro', { body: { nombre: 'Participante Prueba', email: `p-${sufijo}@correo.com`, password: 'Clave1234', aceptaTratamiento: true } });
caso('Registro público de participante → 201', r.status === 201);
const nuevo = r.datos.token;
r = await llamar('POST', `/formacion/procesos/${procesoId}/inscripciones`, { token: nuevo });
caso('Inscripción en línea → 201', r.status === 201);
const inscripcionId = r.datos.id;
r = await llamar('POST', `/formacion/procesos/${procesoId}/inscripciones`, { token: nuevo });
caso('Inscripción duplicada → 409', r.status === 409);
r = await llamar('PUT', `/formacion/jornadas/${j1.datos.id}/asistencia`, { token: formador, body: { registros: [{ inscripcionId, presente: true }] } });
caso('Formador registra asistencia → 200', r.status === 200);
r = await llamar('GET', `/formacion/certificados/${inscripcionId}`, { token: nuevo });
caso('Sin cerrar el proceso no hay certificado → 409', r.status === 409);
r = await llamar('POST', `/formacion/procesos/${procesoId}/cerrar`, { token: director });
caso('Cerrar proceso emite certificado (50% ≥ mínimo 50%)', r.status === 200 && r.datos.certificados === 1);
r = await llamar('GET', `/formacion/certificados/${inscripcionId}`, { token: nuevo });
caso('Certificado PDF descargable', r.status === 200 && r.tipo.includes('pdf') && r.datos.subarray(0, 4).toString() === '%PDF');
r = await llamar('PUT', `/formacion/jornadas/${j1.datos.id}/asistencia`, { token: formador, body: { registros: [{ inscripcionId, presente: false }] } });
caso('Proceso cerrado no permite modificar asistencia → 409', r.status === 409);

// ---------- Encuestas (CAR-04, CAR-05) ----------
console.log('Encuestas');
r = await llamar('POST', '/encuestas', {
  token: auxiliar,
  body: { titulo: `Encuesta ${sufijo}`, periodo: '2026-2', preguntas: [{ texto: '¿Satisfecho?', tipo: 'ESCALA' }, { texto: '¿Volvería?', tipo: 'SI_NO' }] },
});
caso('Crear encuesta → 201', r.status === 201);
const encuesta = r.datos;
r = await llamar('POST', `/encuestas/${encuesta.id}/respuestas`, { body: { respuestas: [{ preguntaId: encuesta.preguntas[0].id, valorNumero: 5 }] } });
caso('Encuesta en borrador no recibe respuestas → 409', r.status === 409);
await llamar('PATCH', `/encuestas/${encuesta.id}`, { token: auxiliar, body: { estado: 'PUBLICADA' } });
for (const [a, b] of [[5, 1], [4, 1], [2, 0]]) {
  await llamar('POST', `/encuestas/${encuesta.id}/respuestas`, {
    body: { respuestas: [{ preguntaId: encuesta.preguntas[0].id, valorNumero: a }, { preguntaId: encuesta.preguntas[1].id, valorNumero: b }] },
  });
}
r = await llamar('GET', `/encuestas/${encuesta.id}/resultados`, { token: auxiliar });
caso('Tabulación automática (3 respuestas, promedio 3.67)', r.datos.totalRespuestas === 3 && r.datos.resultados[0].promedio === 3.67);
r = await llamar('POST', `/encuestas/${encuesta.id}/planes`, { token: director, body: { diagnostico: 'Diagnóstico de prueba', acciones: 'Acciones de prueba', responsable: 'Director', fechaCompromiso: enDias(30) } });
caso('Registrar plan de mejoramiento → 201', r.status === 201);

// ---------- Reportes y contrato (CAR-10, CAR-13) ----------
console.log('Reportes y contrato OpenAPI');
for (const t of ['conciertos', 'asistencia', 'instrumentos', 'inventario']) {
  const x = await llamar('GET', `/reportes/${t}?formato=xlsx`, { token: auxiliar });
  const p = await llamar('GET', `/reportes/${t}?formato=pdf`, { token: auxiliar });
  caso(`Reporte ${t} en Excel y PDF`, x.status === 200 && x.tipo.includes('spreadsheet') && p.status === 200 && p.tipo.includes('pdf'));
}
r = await llamar('GET', '/openapi.json');
caso('Contrato OpenAPI publicado', r.status === 200 && r.datos.openapi?.startsWith('3') && Object.keys(r.datos.paths).length >= 30);
r = await llamar('GET', '/notificaciones', { token: director });
caso('Servicio de notificaciones registró los correos', r.status === 200 && r.datos.total > 0);

console.log(`\nResultado: ${ok} aprobadas, ${fallos} fallidas (${Math.round((ok / (ok + fallos)) * 100)}%)\n`);
process.exit(fallos ? 1 : 0);
