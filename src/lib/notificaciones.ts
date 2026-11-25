// Servicio utilitario de notificaciones.
// En el ambiente local no hay servidor SMTP: los correos se guardan en la "bandeja de salida"
// (tabla Notificacion) y se muestran en consola. Para producción basta con reemplazar
// el cuerpo de enviarCorreo por un proveedor real (SMTP, SendGrid, etc.).
import { prisma } from './prisma';

export type TipoNotificacion = 'CONFIRMACION' | 'RECORDATORIO' | 'RESPUESTA_SOLICITUD' | 'CERTIFICADO';

export async function enviarCorreo(destinatario: string, asunto: string, cuerpo: string, tipo: TipoNotificacion) {
  try {
    await prisma.notificacion.create({ data: { destinatario, asunto, cuerpo, tipo } });
    console.log(`[correo] Para: ${destinatario} | ${asunto}`);
  } catch (e) {
    console.error('Fallo al registrar notificación', e);
  }
}
