// Utilidades comunes de los servicios REST: autenticación, autorización, errores y auditoría.
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { COOKIE_SESION, verificarToken, type Sesion } from './jwt';
import type { Rol } from './constantes';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detalles?: unknown,
  ) {
    super(message);
  }
}

/** Servicios sin estado: cada petición trae su JWT (cabecera Authorization: Bearer o cookie de la web). */
export async function obtenerSesion(req: NextRequest): Promise<Sesion | null> {
  const auth = req.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : req.cookies.get(COOKIE_SESION)?.value;
  return verificarToken(token);
}

export async function exigirSesion(req: NextRequest, roles?: Rol[]): Promise<Sesion> {
  const sesion = await obtenerSesion(req);
  if (!sesion) throw new ApiError(401, 'Debe iniciar sesión');
  if (roles && !roles.includes(sesion.rol)) throw new ApiError(403, 'No tiene permisos para esta operación');
  return sesion;
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function datosCliente(req: NextRequest) {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local',
    userAgent: req.headers.get('user-agent')?.slice(0, 250) ?? null,
  };
}

export async function registrarAcceso(
  req: NextRequest,
  accion: string,
  datos: { usuarioId?: string | null; email?: string | null } = {},
) {
  try {
    await prisma.registroAcceso.create({
      data: {
        accion,
        usuarioId: datos.usuarioId ?? null,
        email: datos.email ?? null,
        metodo: req.method,
        ruta: req.nextUrl.pathname,
        ...datosCliente(req),
      },
    });
  } catch (e) {
    console.error('No se pudo registrar el acceso', e);
  }
}

type Contexto<P> = { params: Promise<P> };

/**
 * Envuelve un manejador de ruta: traduce errores a respuestas JSON coherentes
 * y deja traza en el registro de accesos de toda operación que modifica datos.
 */
export function servicio<P = Record<string, string>>(fn: (req: NextRequest, ctx: Contexto<P>) => Promise<Response>) {
  return async (req: NextRequest, ctx: Contexto<P>): Promise<Response> => {
    try {
      const res = await fn(req, ctx);
      if (req.method !== 'GET' && res.ok && !req.nextUrl.pathname.startsWith('/api/v1/auth')) {
        const s = await obtenerSesion(req);
        await registrarAcceso(req, 'API', { usuarioId: s?.sub, email: s?.email });
      }
      return res;
    } catch (e) {
      return manejarError(e);
    }
  };
}

export function manejarError(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message, detalles: e.detalles }, { status: e.status });
  }
  if (e instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Datos inválidos',
        detalles: e.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
      },
      { status: 400 },
    );
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'El registro ya existe' }, { status: 409 });
    if (e.code === 'P2025') return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
  }
  if (e instanceof SyntaxError) {
    return NextResponse.json({ error: 'El cuerpo de la petición no es JSON válido' }, { status: 400 });
  }
  console.error(e);
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
}

export function noEncontrado(recurso = 'Recurso'): never {
  throw new ApiError(404, `${recurso} no encontrado`);
}

/** Paginación simple ?pagina=1&tamano=50 (máximo 200) para mantener tiempos de respuesta bajos (CAR-14). */
export function paginacion(req: NextRequest) {
  const pagina = Math.max(1, Number(req.nextUrl.searchParams.get('pagina')) || 1);
  const tamano = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get('tamano')) || 50));
  return { skip: (pagina - 1) * tamano, take: tamano, pagina, tamano };
}
