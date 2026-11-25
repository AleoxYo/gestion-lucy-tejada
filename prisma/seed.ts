// Datos de demostración para el SGM-LT. Ejecutar con: npm run setup
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const CLAVE = 'Musica2026';

const dia = (offsetDias: number, hora = 10, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  d.setHours(hora, min, 0, 0);
  return d;
};

async function main() {
  if ((await prisma.usuario.count()) > 0) {
    console.log('La base de datos ya tiene datos; no se carga la demostración.');
    console.log('Para reiniciarla borre prisma/dev.db y ejecute de nuevo: npm run setup');
    return;
  }
  const hash = await bcrypt.hash(CLAVE, 10);
  const ahora = new Date();
  const usuario = (nombre: string, email: string, rol: string, documento?: string) =>
    prisma.usuario.create({
      data: { nombre, email, rol, documento, passwordHash: hash, aceptaTratamiento: true, fechaAceptacion: ahora },
    });

  const director = await usuario('Carlos Andrés Restrepo', 'director@lucytejada.gov.co', 'DIRECTOR', '10203040');
  await usuario('Lina María Ospina', 'auxiliar@lucytejada.gov.co', 'AUXILIAR', '42123456');
  const formador = await usuario('Jorge Iván Marín', 'formador@lucytejada.gov.co', 'FORMADOR', '18555666');
  const formadora2 = await usuario('Paula Andrea Gómez', 'formadora2@lucytejada.gov.co', 'FORMADOR', '1088111222');
  const participantes = await Promise.all([
    usuario('Ana Sofía Cardona', 'participante@correo.com', 'PARTICIPANTE', '1088234567'),
    usuario('Miguel Ángel Ríos', 'miguel.rios@correo.com', 'PARTICIPANTE', '1088345678'),
    usuario('Valentina Henao', 'valentina.henao@correo.com', 'PARTICIPANTE', '1088456789'),
    usuario('Santiago Londoño', 'santiago.londono@correo.com', 'PARTICIPANTE', '1088567890'),
    usuario('Daniela Arango', 'daniela.arango@correo.com', 'PARTICIPANTE', '1088678901'),
    usuario('Juan Pablo Toro', 'juan.toro@correo.com', 'PARTICIPANTE', '1088789012'),
  ]);

  // ---------- Conciertos ----------
  const conciertoPasado = await prisma.concierto.create({
    data: {
      titulo: 'Concierto de música colombiana',
      tipo: 'ESPECIAL',
      fecha: dia(-12, 19),
      lugar: 'Teatro Santiago Londoño',
      descripcion: 'Concierto especial del mes con repertorio andino colombiano.',
      estado: 'REALIZADO',
    },
  });
  const proximo = await prisma.concierto.create({
    data: {
      titulo: 'Gran concierto de fin de año',
      tipo: 'ESPECIAL',
      fecha: dia(9, 19, 30),
      lugar: 'Plaza de Bolívar de Pereira',
      descripcion: 'Concierto especial de diciembre con invitados de la Escuela de Formación.',
    },
  });
  for (const [i, lugar] of ['Parque El Lago Uribe Uribe', 'Plaza de Bolívar', 'Parque Olaya Herrera', 'Parque de Cuba'].entries()) {
    await prisma.concierto.create({
      data: {
        titulo: `Retreta dominical #${i + 1}`,
        tipo: 'RETRETA',
        fecha: dia(i * 7 + 3, 11),
        lugar,
        descripcion: 'Retreta de la Banda Sinfónica de Pereira abierta a la comunidad.',
      },
    });
  }
  await prisma.concierto.create({
    data: { titulo: 'Retreta del barrio Cuba', tipo: 'RETRETA', fecha: dia(-5, 11), lugar: 'Parque de Cuba', estado: 'REALIZADO' },
  });

  // ---------- Solicitudes ----------
  await prisma.solicitudConcierto.createMany({
    data: [
      {
        tipoSolicitante: 'INSTITUCION',
        solicitante: 'Martha Lucía Valencia',
        institucion: 'Institución Educativa Deogracias Cardona',
        email: 'rectoria@iedeograciascardona.edu.co',
        telefono: '3101234567',
        fechaPropuesta: dia(20, 10),
        lugar: 'Coliseo de la institución',
        descripcion: 'Solicitamos un concierto didáctico para 400 estudiantes en el marco de la semana cultural.',
        aceptaTratamiento: true,
      },
      {
        tipoSolicitante: 'COMUNIDAD',
        solicitante: 'Junta de Acción Comunal Villa Santana',
        email: 'jac.villasantana@correo.com',
        fechaPropuesta: dia(25, 16),
        lugar: 'Polideportivo Villa Santana',
        descripcion: 'Retreta para la celebración de la novena comunitaria del barrio.',
        aceptaTratamiento: true,
      },
      {
        tipoSolicitante: 'INSTITUCION',
        solicitante: 'Hogar Geriátrico San José',
        institucion: 'Fundación San José',
        email: 'contacto@hogarsanjose.org',
        fechaPropuesta: dia(-20, 15),
        lugar: 'Sede del hogar',
        descripcion: 'Concierto para los adultos mayores del hogar en el día de la familia.',
        estado: 'RECHAZADA',
        respuesta: 'La fecha coincide con un concierto programado. Le invitamos a proponer otra fecha.',
        fechaRespuesta: dia(-25),
        aceptaTratamiento: true,
      },
    ],
  });

  // ---------- Instrumentos ----------
  const inventario: [string, string, string, string][] = [
    ['CL-001', 'Clarinete en Si bemol', 'VIENTO_MADERA', 'Yamaha'],
    ['CL-002', 'Clarinete en Si bemol', 'VIENTO_MADERA', 'Buffet'],
    ['FL-001', 'Flauta traversa', 'VIENTO_MADERA', 'Yamaha'],
    ['FL-002', 'Flauta traversa', 'VIENTO_MADERA', 'Jupiter'],
    ['SX-001', 'Saxofón alto', 'VIENTO_MADERA', 'Selmer'],
    ['SX-002', 'Saxofón tenor', 'VIENTO_MADERA', 'Yamaha'],
    ['TP-001', 'Trompeta en Si bemol', 'VIENTO_METAL', 'Bach'],
    ['TP-002', 'Trompeta en Si bemol', 'VIENTO_METAL', 'Yamaha'],
    ['TB-001', 'Trombón tenor', 'VIENTO_METAL', 'Conn'],
    ['TB-002', 'Trombón bajo', 'VIENTO_METAL', 'Bach'],
    ['TU-001', 'Tuba en Si bemol', 'VIENTO_METAL', 'Jupiter'],
    ['CO-001', 'Corno francés', 'VIENTO_METAL', 'Holton'],
    ['EU-001', 'Eufonio', 'VIENTO_METAL', 'Besson'],
    ['PE-001', 'Timbales sinfónicos (juego de 4)', 'PERCUSION', 'Adams'],
    ['PE-002', 'Bombo sinfónico', 'PERCUSION', 'Ludwig'],
    ['PE-003', 'Redoblante', 'PERCUSION', 'Pearl'],
    ['PE-004', 'Platillos de choque', 'PERCUSION', 'Zildjian'],
    ['PE-005', 'Xilófono', 'PERCUSION', 'Yamaha'],
    ['CB-001', 'Contrabajo', 'CUERDA', 'Stentor'],
    ['AT-001', 'Atriles plegables (lote de 10)', 'OTRO', 'K&M'],
  ];
  const instrumentos = [];
  for (const [codigo, nombre, familia, marca] of inventario) {
    instrumentos.push(await prisma.instrumento.create({ data: { codigo, nombre, familia, marca } }));
  }
  await prisma.instrumento.update({ where: { id: instrumentos[9].id }, data: { estado: 'MANTENIMIENTO', observaciones: 'Vara con abolladura, en reparación' } });

  // Movimientos ya cerrados (concierto pasado)
  for (const inst of instrumentos.slice(0, 5)) {
    await prisma.movimientoInstrumento.create({
      data: {
        instrumentoId: inst.id,
        conciertoId: conciertoPasado.id,
        responsable: 'Músicos de la Banda Sinfónica',
        fechaSalida: dia(-12, 16),
        fechaRegreso: dia(-12, 23),
        estadoSalida: 'BUENO',
        estadoRegreso: 'BUENO',
        registradoPor: 'Lina María Ospina',
      },
    });
  }
  // Movimientos abiertos (próximo concierto)
  for (const inst of instrumentos.slice(13, 16)) {
    await prisma.movimientoInstrumento.create({
      data: {
        instrumentoId: inst.id,
        conciertoId: proximo.id,
        responsable: 'Andrés Felipe Patiño (percusión)',
        fechaSalida: dia(-1, 9),
        estadoSalida: 'BUENO',
        observaciones: 'Salen antes para ensayo general en la plaza',
        registradoPor: 'Lina María Ospina',
      },
    });
    await prisma.instrumento.update({ where: { id: inst.id }, data: { estado: 'PRESTADO' } });
  }

  // ---------- Formación y festivales ----------
  // Proceso ya cerrado con certificados
  const cerrado = await prisma.proceso.create({
    data: {
      nombre: 'Taller de dirección de bandas escolares',
      tipo: 'FORMACION',
      descripcion: 'Capacitación para directores de bandas de instituciones educativas del municipio.',
      necesidades: 'Los directores de bandas escolares solicitaron fortalecer técnica de batuta y montaje de repertorio.',
      formadorId: formador.id,
      numeroContrato: 'CPS-2026-0458',
      fechaInicio: dia(-40),
      fechaFin: dia(-19),
      cupo: 20,
      estado: 'CERRADO',
      fechaCierre: dia(-18),
    },
  });
  const jornadasCerrado = [];
  for (let k = 0; k < 4; k++) {
    jornadasCerrado.push(
      await prisma.jornada.create({
        data: { procesoId: cerrado.id, fecha: dia(-40 + k * 7, 14), tema: ['Técnica de batuta', 'Lectura de partitura general', 'Ensayo seccional', 'Montaje de repertorio'][k], lugar: 'Sala de ensayos Lucy Tejada' },
      }),
    );
  }
  const asistenciasCerrado = [4, 3, 2, 4]; // presentes por participante
  for (let p = 0; p < 4; p++) {
    const presentes = asistenciasCerrado[p];
    const pct = Math.round((presentes / 4) * 100);
    const certifica = pct >= 80;
    const ins = await prisma.inscripcion.create({
      data: {
        procesoId: cerrado.id,
        participanteId: participantes[p].id,
        porcentajeAsistencia: pct,
        certificado: certifica,
        codigoCertificado: certifica ? `LT-2026-DEMO000${p + 1}` : null,
      },
    });
    for (let j = 0; j < 4; j++) {
      await prisma.asistencia.create({ data: { jornadaId: jornadasCerrado[j].id, inscripcionId: ins.id, presente: j < presentes } });
    }
  }

  // Proceso en curso
  const enCurso = await prisma.proceso.create({
    data: {
      nombre: 'Formación en técnica vocal para coros',
      tipo: 'FORMACION',
      descripcion: 'Proceso de formación para directores y coristas de coros comunitarios.',
      necesidades: 'Mejorar la técnica vocal y la afinación de los coros comunitarios de las comunas.',
      formadorId: formador.id,
      numeroContrato: 'CPS-2026-0512',
      fechaInicio: dia(-7),
      fechaFin: dia(21),
      cupo: 25,
      estado: 'EN_CURSO',
    },
  });
  const jEnCurso = [];
  for (let k = 0; k < 4; k++) {
    jEnCurso.push(await prisma.jornada.create({ data: { procesoId: enCurso.id, fecha: dia(-7 + k * 7, 15), tema: ['Respiración y apoyo', 'Afinación y empaste', 'Repertorio navideño', 'Muestra final'][k], lugar: 'Auditorio Lucy Tejada' } }));
  }
  for (let p = 1; p < 6; p++) {
    const ins = await prisma.inscripcion.create({ data: { procesoId: enCurso.id, participanteId: participantes[p].id } });
    await prisma.asistencia.create({ data: { jornadaId: jEnCurso[0].id, inscripcionId: ins.id, presente: p !== 3 } });
  }

  // Festival con inscripciones abiertas
  const festival = await prisma.proceso.create({
    data: {
      nombre: 'Festival de Bandas Escolares de Pereira 2026',
      tipo: 'FESTIVAL',
      descripcion: 'Encuentro de bandas escolares del municipio con talleres y muestra en tarima.',
      necesidades: 'Espacio de intercambio y formación para las bandas escolares, identificado en la evaluación del semestre anterior.',
      formadorId: formadora2.id,
      numeroContrato: 'CPS-2026-0601',
      fechaInicio: dia(14),
      fechaFin: dia(16),
      cupo: 40,
    },
  });
  for (let k = 0; k < 3; k++) {
    await prisma.jornada.create({ data: { procesoId: festival.id, fecha: dia(14 + k, 9), tema: ['Talleres por instrumento', 'Ensamble general', 'Muestra en tarima'][k], lugar: 'Centro Cultural Lucy Tejada' } });
  }
  await prisma.inscripcion.create({ data: { procesoId: festival.id, participanteId: participantes[5].id } });

  await prisma.proceso.create({
    data: {
      nombre: 'Taller de lutería básica y mantenimiento de instrumentos',
      tipo: 'FORMACION',
      necesidades: 'Los instrumentos de las bandas escolares presentan daños por falta de mantenimiento preventivo.',
      formadorId: formadora2.id,
      fechaInicio: dia(30),
      fechaFin: dia(45),
      cupo: 15,
    },
  });

  // ---------- Encuestas ----------
  const encuesta = await prisma.encuesta.create({
    data: {
      titulo: 'Encuesta de satisfacción de conciertos 2026-2',
      descripcion: 'Ayúdenos a mejorar los conciertos de la Banda Sinfónica de Pereira.',
      periodo: '2026-2',
      conciertoId: conciertoPasado.id,
      estado: 'PUBLICADA',
      preguntas: {
        create: [
          { texto: '¿Qué tan satisfecho(a) quedó con el repertorio?', tipo: 'ESCALA', orden: 1 },
          { texto: '¿Cómo califica la calidad del sonido?', tipo: 'ESCALA', orden: 2 },
          { texto: '¿Cómo califica la organización y el horario?', tipo: 'ESCALA', orden: 3 },
          { texto: '¿Volvería a asistir a un concierto de la Banda?', tipo: 'SI_NO', orden: 4 },
          { texto: 'Comentarios o sugerencias', tipo: 'TEXTO', orden: 5 },
        ],
      },
    },
    include: { preguntas: true },
  });
  const comentarios = ['Excelente concierto', 'Faltó sombra para el público', 'Más música colombiana por favor', '', 'Sonido muy bueno', '', 'Que lo hagan más seguido en los barrios', ''];
  for (let r = 0; r < 24; r++) {
    const pr = encuesta.preguntas.sort((a, b) => a.orden - b.orden);
    await prisma.respuestaEncuesta.create({
      data: {
        encuestaId: encuesta.id,
        items: {
          create: [
            { preguntaId: pr[0].id, valorNumero: [5, 4, 5, 3, 4, 5][r % 6] },
            { preguntaId: pr[1].id, valorNumero: [4, 3, 5, 4, 2, 4][r % 6] },
            { preguntaId: pr[2].id, valorNumero: [3, 4, 2, 4, 3, 5][r % 6] },
            { preguntaId: pr[3].id, valorNumero: r % 7 === 0 ? 0 : 1 },
            { preguntaId: pr[4].id, valorTexto: comentarios[r % comentarios.length] || null },
          ],
        },
      },
    });
  }
  await prisma.planMejora.create({
    data: {
      encuestaId: encuesta.id,
      diagnostico: 'La organización y el horario obtienen la calificación más baja (promedio 3,5). Los asistentes piden sombra y más presencia en barrios.',
      acciones: '1. Gestionar carpas con el módulo de Escenarios. 2. Programar dos retretas mensuales en comunas. 3. Publicar horarios con una semana de anticipación.',
      responsable: director.nombre,
      fechaCompromiso: dia(30),
    },
  });
  await prisma.encuesta.create({
    data: {
      titulo: 'Evaluación del Festival de Bandas Escolares',
      periodo: '2026-2',
      estado: 'BORRADOR',
      preguntas: {
        create: [
          { texto: '¿Cómo califica los talleres?', tipo: 'ESCALA', orden: 1 },
          { texto: '¿Recomendaría el festival?', tipo: 'SI_NO', orden: 2 },
        ],
      },
    },
  });

  console.log('\nDatos de demostración creados. Contraseña de todos los usuarios:', CLAVE);
  console.log('  director@lucytejada.gov.co   (Director Técnico)');
  console.log('  auxiliar@lucytejada.gov.co   (Auxiliar Administrativo)');
  console.log('  formador@lucytejada.gov.co   (Formador)');
  console.log('  participante@correo.com      (Participante)\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
