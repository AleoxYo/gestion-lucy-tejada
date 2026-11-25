import { NextResponse } from 'next/server';
import { openapi } from '@/lib/openapi';

export const dynamic = 'force-static';

/** Contrato OpenAPI publicado (lo leen Swagger UI y los demás módulos). */
export function GET() {
  return NextResponse.json(openapi, { headers: { 'Access-Control-Allow-Origin': '*' } });
}
