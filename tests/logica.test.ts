// Pruebas unitarias de la lógica de negocio pura. Ejecutar: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indiceSatisfaccion, tabular } from '../src/lib/encuestas';
import { codigoCertificado, porcentajeAsistencia } from '../src/lib/formacion';
import { procesoSchema, registroSchema, solicitudSchema } from '../src/lib/validaciones';

test('porcentaje de asistencia', () => {
  assert.equal(porcentajeAsistencia(4, 3), 75);
  assert.equal(porcentajeAsistencia(4, 4), 100);
  assert.equal(porcentajeAsistencia(3, 2), 67);
  assert.equal(porcentajeAsistencia(0, 0), 0);
});

test('código de certificado con formato LT-AAAA-XXXXXXXX', () => {
  assert.match(codigoCertificado(), /^LT-\d{4}-[0-9A-F]{8}$/);
  assert.notEqual(codigoCertificado(), codigoCertificado());
});

test('tabulación automática de encuestas', () => {
  const preguntas = [
    { id: 'a', texto: 'Escala', tipo: 'ESCALA', orden: 1 },
    { id: 'b', texto: 'Sí/No', tipo: 'SI_NO', orden: 2 },
    { id: 'c', texto: 'Texto', tipo: 'TEXTO', orden: 3 },
  ];
  const items = [
    { preguntaId: 'a', valorNumero: 5, valorTexto: null },
    { preguntaId: 'a', valorNumero: 4, valorTexto: null },
    { preguntaId: 'a', valorNumero: 2, valorTexto: null },
    { preguntaId: 'a', valorNumero: 1, valorTexto: null },
    { preguntaId: 'b', valorNumero: 1, valorTexto: null },
    { preguntaId: 'b', valorNumero: 0, valorTexto: null },
    { preguntaId: 'c', valorNumero: null, valorTexto: ' Muy bien ' },
    { preguntaId: 'c', valorNumero: null, valorTexto: '' },
  ];
  const r = tabular(preguntas, items);
  assert.equal(r[0].respuestas, 4);
  assert.equal(r[0].promedio, 3);
  assert.deepEqual(r[0].distribucion, { '1': 1, '2': 1, '3': 0, '4': 1, '5': 1 });
  assert.equal(r[0].porcentajeSatisfaccion, 50);
  assert.deepEqual(r[1].distribucion, { Sí: 1, No: 1 });
  assert.equal(r[1].porcentajeSatisfaccion, 50);
  assert.deepEqual(r[2].comentarios, ['Muy bien']);
  assert.equal(indiceSatisfaccion(r), 50);
});

test('Ley 1581: el registro exige aceptar el tratamiento de datos', () => {
  const base = { nombre: 'Ana Pérez', email: 'ana@correo.com', password: 'Clave1234' };
  assert.equal(registroSchema.safeParse({ ...base, aceptaTratamiento: false }).success, false);
  assert.equal(registroSchema.safeParse({ ...base, aceptaTratamiento: true }).success, true);
});

test('política de contraseñas: mínimo 8 caracteres con letras y números', () => {
  const base = { nombre: 'Ana Pérez', email: 'ana@correo.com', aceptaTratamiento: true };
  assert.equal(registroSchema.safeParse({ ...base, password: 'corta1' }).success, false);
  assert.equal(registroSchema.safeParse({ ...base, password: 'sololetras' }).success, false);
  assert.equal(registroSchema.safeParse({ ...base, password: 'Musica2026' }).success, true);
});

test('validación de solicitud de concierto', () => {
  const ok = solicitudSchema.safeParse({
    tipoSolicitante: 'COMUNIDAD',
    solicitante: 'JAC Cuba',
    email: 'jac@correo.com',
    fechaPropuesta: '2026-12-20T10:00:00Z',
    lugar: 'Parque de Cuba',
    descripcion: 'Retreta para la novena del barrio',
    aceptaTratamiento: true,
  });
  assert.equal(ok.success, true);
  assert.equal(solicitudSchema.safeParse({ tipoSolicitante: 'OTRO' }).success, false);
});

test('el proceso no puede terminar antes de iniciar', () => {
  const r = procesoSchema.safeParse({
    nombre: 'Taller',
    tipo: 'FORMACION',
    necesidades: 'Necesidad identificada',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-01',
    cupo: 10,
  });
  assert.equal(r.success, false);
});
