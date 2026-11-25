# SGM-LT · Sistema de Gestión Musical Lucy Tejada

Módulo de Música de la Plataforma de Gestión del Centro Cultural Lucy Tejada (Secretaría de Cultura de Pereira).
Aplicación web con Next.js, TypeScript y React. Toda la funcionalidad se ofrece como **servicios REST documentados con OpenAPI 3**, y la interfaz web es un consumidor más de esos servicios (enfoque SOA del documento de visión).

> Este README es el **manual técnico**. El manual de usuario está en [`docs/MANUAL_USUARIO.md`](docs/MANUAL_USUARIO.md) y el protocolo de pruebas en [`docs/PROTOCOLO_PRUEBAS.md`](docs/PROTOCOLO_PRUEBAS.md).

## 1. Requisitos

- Node.js 20 o superior (probado con Node 24) y npm.
- No necesita servidor de base de datos: usa **SQLite** (archivo `prisma/dev.db`).

## 2. Instalación y ejecución local

```bash
cd sgm-lt
npm install          # instala dependencias, genera Prisma Client y copia Swagger UI
npm run setup        # crea la base de datos SQLite y carga datos de demostración
npm run dev          # http://localhost:3000
```

| Comando | Uso |
|---|---|
| `npm run dev` | Desarrollo en http://localhost:3000 |
| `npm run dev:https` | Desarrollo por **HTTPS** en https://localhost:3000 (certificado autofirmado generado por Next.js) |
| `npm run build` y `npm start` | Modo producción (más rápido; recomendado para la demostración y la prueba de carga) |
| `npm run reset` | Borra la base local y vuelve a cargar los datos de demostración |
| `npm test` | Pruebas unitarias de la lógica de negocio |
| `npm run test:aceptacion -- http://localhost:3000` | Protocolo de aceptación automatizado contra la API (con el servidor corriendo) |
| `npm run loadtest -- http://localhost:3000` | Prueba de carga: 200 usuarios simultáneos (CAR-14) |
| `npm run openapi` | Exporta el contrato a `docs/openapi.json` |

### Usuarios de demostración (contraseña `Musica2026`)

| Rol | Correo |
|---|---|
| Director Técnico | director@lucytejada.gov.co |
| Auxiliar Administrativo | auxiliar@lucytejada.gov.co |
| Formador | formador@lucytejada.gov.co |
| Participante | participante@correo.com |

### Direcciones útiles

- Aplicación: http://localhost:3000
- Contrato OpenAPI interactivo (Swagger UI): http://localhost:3000/docs
- Contrato en JSON: http://localhost:3000/api/v1/openapi.json (copia en `docs/openapi.json`)

## 3. Arquitectura

```
Navegador (React) ──fetch JSON + JWT──┐
Módulo de Escenarios / Emisora / Escuela ──HTTP + Bearer JWT──┤
                                      ▼
                    /api/v1  (Route Handlers de Next.js)
       ┌──────────────┬──────────────┬──────────────┬──────────────┐
       │  Conciertos  │  Formación   │ Instrumentos │  Encuestas   │  + Reportes, Usuarios, Accesos
       └──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┘
              │      Notificaciones (servicio utilitario)   │
              ▼                                             ▼
                      Prisma ORM  →  SQLite (dev.db)
```

- **Contrato estandarizado:** `src/lib/openapi.ts` define el contrato OpenAPI 3; se publica en `/api/v1/openapi.json` y en `/docs`.
- **Bajo acoplamiento:** los consumidores solo conocen el contrato. La web usa `src/lib/cliente.ts` y nunca accede a la base de datos.
- **Servicios sin estado:** cada petición lleva su JWT (HS256, 8 h) en `Authorization: Bearer …` o en la cookie httpOnly `sgm_token`, que usa la web.
- **Reutilización:** la agenda `GET /api/v1/conciertos` es pública y la consumen la web y los demás módulos.
- Mensajería asíncrona y ESB quedan fuera de alcance, como dice el documento: los servicios se comunican por HTTP directo.

### Estructura de carpetas

```
prisma/schema.prisma        Modelo de datos
prisma/seed.ts              Datos de demostración
src/lib/                    Lógica compartida
  api.ts                    Autenticación/autorización, manejo de errores, auditoría, paginación
  jwt.ts                    Firma y verificación de JWT (compatible con Edge)
  validaciones.ts           Esquemas Zod de entrada de cada servicio
  openapi.ts                Contrato OpenAPI 3
  encuestas.ts              Tabulación automática
  formacion.ts              Permisos de procesos, % de asistencia, códigos de certificado
  pdf.ts                    Certificados y reportes PDF (pdf-lib)
  reportes.ts               Reportes y exportación a Excel (exceljs)
  notificaciones.ts         Servicio utilitario de correo
src/app/api/v1/…            Servicios REST
src/app/(publico)/…         Páginas públicas (agenda, solicitud, festivales, encuestas, login…)
src/app/panel/…             Panel por rol
src/middleware.ts           Protección de /panel
tests/                      Pruebas unitarias
scripts/                    Prueba de aceptación, prueba de carga, exportación de OpenAPI
```

## 4. Trazabilidad de requisitos

| Característica | Implementación |
|---|---|
| CAR-01 Solicitudes de concierto | `/solicitar` (pública), `POST/GET /conciertos/solicitudes`, `PATCH /conciertos/solicitudes/{id}`; al aprobar se crea el concierto y se notifica al solicitante |
| CAR-02 Calendario de conciertos y retretas | `/panel/conciertos` (calendario mensual), `/` (agenda pública), `GET/POST/PATCH/DELETE /conciertos` |
| CAR-03 Salida y regreso de instrumentos | `/panel/instrumentos`, `POST /instrumentos/salidas`, `POST /instrumentos/movimientos/{id}/regreso`, historial por instrumento |
| CAR-04 Encuestas en línea y tabulación | `/encuestas/{id}` (pública y anónima), `GET /encuestas/{id}/resultados` |
| CAR-05 Diagnóstico y plan de mejoramiento | `/panel/encuestas/{id}`, `POST /encuestas/{id}/planes` |
| CAR-06 Festivales y procesos con cronograma, formador y necesidades | `/panel/formacion`, `POST /formacion/procesos`, `POST …/jornadas` |
| CAR-07 Inscripción en línea | `/festivales`, `POST /formacion/procesos/{id}/inscripciones` (control de cupo y duplicados) |
| CAR-08 Asistencia por jornada | `PUT /formacion/jornadas/{id}/asistencia` (formador asignado o gestión) |
| CAR-09 Certificados PDF al cerrar | `POST /formacion/procesos/{id}/cerrar`, `GET /formacion/certificados/{id}`, verificación pública en `/verificar` |
| CAR-10 Servicios REST con OpenAPI | `/docs`, `/api/v1/openapi.json`, `docs/openapi.json` |
| CAR-11 Cuatro roles | `Usuario.rol`, `exigirSesion(req, roles)` en cada servicio y menú por rol; gestión de roles en `/panel/usuarios` |
| CAR-12 Protección de datos | bcrypt (costo 10); JWT; cookie httpOnly/SameSite; HTTPS con `dev:https`; cabeceras HSTS, X-Frame-Options y nosniff; registro de accesos (`/panel/accesos`); consentimiento Ley 1581 en registro y solicitudes; `/privacidad`; consulta de datos propios en `/panel/mis-datos` |
| CAR-13 Reportes Excel y PDF | `/panel/reportes`, `GET /reportes/{conciertos\|asistencia\|instrumentos\|inventario}?formato=xlsx\|pdf` |
| CAR-14 200 usuarios simultáneos, menos de 4 s | Paginación (máx. 200), índices en la base, `npm run loadtest` |

## 5. Reglas de negocio principales

- Una solicitud solo se responde una vez. Si se aprueba, se crea un concierto de tipo `SOLICITADO` enlazado a la solicitud.
- Un instrumento solo sale si está `DISPONIBLE`. Al salir queda `PRESTADO`. Si regresa en estado `MALO` pasa a `MANTENIMIENTO`; si no, vuelve a `DISPONIBLE`.
- La inscripción solo se permite con el proceso `ABIERTO` y cupo disponible, y sin duplicados.
- Al registrar la primera asistencia, el proceso pasa a `EN_CURSO`.
- Al cerrar el proceso: % de asistencia = presentes / jornadas. Quien alcanza la asistencia mínima (80 % por defecto) recibe certificado con un código verificable. Después del cierre la asistencia no se puede modificar.
- Las encuestas solo reciben respuestas cuando están `PUBLICADA`. Las preguntas de escala (1 a 5) y de sí/no son obligatorias.
- El índice de satisfacción es el promedio del % de respuestas 4-5 y de respuestas «Sí».

## 6. Demostración en Render (plan gratuito)

El archivo `render.yaml` define el servicio. Para crearlo:
1. Entre a https://render.com con su cuenta de GitHub.
2. **New → Blueprint**.
3. Elija el repositorio `gestion-lucy-tejada` y pulse **Apply**.

Render ejecuta `npm ci && npm run build` y arranca con `npm run start:render`, que crea la base SQLite, carga los datos de demostración e inicia Next.js. El `JWT_SECRET` lo genera Render y la app queda publicada por HTTPS.

- **Modo demostración:** el disco del plan gratuito es temporal. Cada despliegue o reinicio (por ejemplo, cuando el servicio despierta) deja los datos como al inicio.
- **Inactividad:** el servicio se duerme tras unos 15 minutos sin visitas. La primera visita después tarda entre 30 y 60 segundos.
- **Despliegue automático:** cada `git push` a `main` despliega de nuevo.
- **Deshabilitar:** en el servicio, **Settings → Suspend Web Service** (se reactiva con **Resume**) o **Delete Web Service** para eliminarlo. Para que los push no desplieguen, desactive **Auto-Deploy**.
- **Rendimiento:** la instancia gratuita tiene recursos limitados. La prueba de carga de CAR-14 se documenta con el resultado local de `docs/PROTOCOLO_PRUEBAS.md`.

## 7. Notas para producción

- Cambiar `JWT_SECRET` en `.env` por un valor aleatorio largo.
- Servir detrás de un proxy con certificado TLS real (Nginx o IIS) o en la nube de la Alcaldía, con ambiente de staging.
- Para más carga o concurrencia de escritura, cambiar `provider = "sqlite"` por `"postgresql"` en `prisma/schema.prisma`. El código no cambia.
- Conectar `src/lib/notificaciones.ts` a un proveedor SMTP real. Hoy los correos quedan en la tabla `Notificacion` y en `/panel/notificaciones`.
