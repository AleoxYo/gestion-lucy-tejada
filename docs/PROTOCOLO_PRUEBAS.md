# Protocolo de pruebas de aceptación · SGM-LT

## Cómo ejecutar

```bash
npm run reset                   # base de datos con datos de demostración
npm run build && npm start      # servidor en http://localhost:3000
# en otra terminal:
npm test                                              # pruebas unitarias
npm run test:aceptacion -- http://localhost:3000      # protocolo automatizado (38 casos)
npm run loadtest -- http://localhost:3000             # CAR-14
```

> La prueba de aceptación crea registros de prueba. Ejecute `npm run reset` antes de una demostración.

## Casos automatizados (`scripts/prueba-aceptacion.mjs`)

| # | Característica | Caso | Resultado esperado |
|---|---|---|---|
| 1 | CAR-12 | Login con contraseña incorrecta | 401 |
| 2 | CAR-11 | Login de los cuatro roles | Se emite JWT |
| 3 | CAR-12 | Servicio protegido sin token | 401 |
| 4 | CAR-11 | Participante consulta inventario | 403 |
| 5 | CAR-11 | Auxiliar consulta registro de accesos | 403 |
| 6 | CAR-12 | El login fallido queda en el registro de accesos | Registro existe |
| 7 | CAR-02/10 | Agenda pública de conciertos | 200, lista |
| 8 | CAR-12 | Solicitud sin autorización de datos (Ley 1581) | 400 |
| 9 | CAR-01 | Solicitud pública | 201 |
| 10 | CAR-01 | Aprobar solicitud | Concierto `SOLICITADO` creado |
| 11 | CAR-01 | Responder dos veces | 409 |
| 12 | CAR-02 | Programar retreta | 201 |
| 13 | CAR-11 | Participante programa concierto | 403 |
| 14 | CAR-03 | Registrar instrumento | 201 |
| 15 | CAR-03 | Salida para concierto | 201 |
| 16 | CAR-03 | Salida de instrumento ya prestado | 409 |
| 17 | CAR-03 | Registrar regreso | 200 |
| 18 | CAR-03 | Historial e instrumento disponible | 1 movimiento, `DISPONIBLE` |
| 19 | CAR-06 | Crear proceso con formador y necesidades | 201 |
| 20 | CAR-06 | Formador asignado y director agregan jornadas | 201 |
| 21 | CAR-07 | Registro público de participante | 201 |
| 22 | CAR-07 | Inscripción en línea | 201 |
| 23 | CAR-07 | Inscripción duplicada | 409 |
| 24 | CAR-08 | Formador registra asistencia | 200 |
| 25 | CAR-09 | Certificado antes del cierre | 409 |
| 26 | CAR-09 | Cierre emite certificado | 1 certificado |
| 27 | CAR-09 | Descarga del certificado | PDF válido |
| 28 | CAR-08 | Modificar asistencia con proceso cerrado | 409 |
| 29 | CAR-04 | Crear encuesta | 201 |
| 30 | CAR-04 | Responder encuesta en borrador | 409 |
| 31 | CAR-04 | Tabulación automática | 3 respuestas, promedio 3.67 |
| 32 | CAR-05 | Plan de mejoramiento | 201 |
| 33-36 | CAR-13 | Cuatro reportes en Excel y PDF | 200, tipo de archivo correcto |
| 37 | CAR-10 | Contrato OpenAPI publicado | OpenAPI 3, 30 o más rutas |
| 38 | Notificaciones | Se registraron los correos | Total > 0 |

**Resultado obtenido (24/11/2026):** 38 de 38 aprobados (100 %). Pruebas unitarias: 7 de 7.

## Prueba de carga (CAR-14)

200 conexiones simultáneas durante 15 s por escenario, en modo producción en el equipo de desarrollo:

| Escenario | Peticiones/s | Latencia p99 | Máx. | Errores |
|---|---|---|---|---|
| Agenda pública de conciertos | 973 | 346 ms | 396 ms | 0 |
| Oferta de festivales y formación | 937 | 247 ms | 569 ms | 0 |
| Inventario (autenticado con JWT) | 1071 | 298 ms | 591 ms | 0 |

**Cumple:** todas las respuestas están muy por debajo de 4 segundos.

## Pruebas manuales en la interfaz (lista de verificación)

- [ ] El sitio se ve bien en celular (menú ☰), tableta y computador.
- [ ] Sin sesión, `/panel` redirige a `/login`.
- [ ] Cada rol solo ve en el menú las opciones que le corresponden.
- [ ] Solicitud pública, luego aprobación en el panel: el concierto aparece en el calendario y en la agenda pública.
- [ ] Salida y regreso de instrumentos desde el panel.
- [ ] Participante se inscribe desde `/festivales`, formador toma asistencia y director cierra el proceso: el participante descarga el certificado y lo verifica en `/verificar`.
- [ ] Encuesta publicada, respondida desde el enlace público, con resultados y plan de mejoramiento.
- [ ] Descarga de los reportes en Excel y PDF.
- [ ] `npm run dev:https`: el sitio abre por HTTPS.
- [ ] `/docs` muestra el contrato y permite probar los servicios con **Authorize** (token de `/auth/login`).
