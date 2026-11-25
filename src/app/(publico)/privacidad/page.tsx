export const metadata = { title: 'Política de tratamiento de datos' };

export default function Privacidad() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-10 text-sm leading-relaxed text-slate-700">
      <h1>Política de tratamiento de datos personales</h1>
      <p>
        En cumplimiento de la <strong>Ley 1581 de 2012</strong> y del Decreto 1377 de 2013, la Secretaría de Cultura de Pereira informa cómo trata
        los datos personales recogidos por el Sistema de Gestión Musical Lucy Tejada (SGM-LT).
      </p>
      <h2>Responsable del tratamiento</h2>
      <p>Secretaría de Cultura de Pereira · Centro Cultural Lucy Tejada · Área de Música.</p>
      <h2>Datos que se recogen</h2>
      <p>Nombre, documento de identidad, correo electrónico, teléfono, inscripciones, registros de asistencia y certificados emitidos. Las encuestas de satisfacción son anónimas.</p>
      <h2>Finalidades</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Gestionar solicitudes de concierto y responderlas.</li>
        <li>Inscribir participantes en festivales y procesos de formación, registrar su asistencia y emitir certificados.</li>
        <li>Enviar confirmaciones y recordatorios relacionados con los servicios solicitados.</li>
        <li>Elaborar estadísticas e informes de gestión del área de Música.</li>
      </ul>
      <h2>Derechos del titular</h2>
      <p>
        Usted puede conocer, actualizar, rectificar y solicitar la supresión de sus datos, revocar la autorización y presentar quejas ante la
        Superintendencia de Industria y Comercio. Puede consultar sus datos en la sección <em>Mis datos</em> del panel o solicitarlo al área de Música.
      </p>
      <h2>Seguridad</h2>
      <p>
        Las contraseñas se guardan cifradas con bcrypt, la comunicación se hace por HTTPS, el acceso a la información está restringido por roles y
        los ingresos y operaciones quedan registrados para auditoría.
      </p>
    </article>
  );
}
