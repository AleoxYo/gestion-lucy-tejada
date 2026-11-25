// Prueba de carga (CAR-14): 200 usuarios simultáneos, respuesta < 4 segundos.
// Requiere el servidor en modo producción: npm run build && npm start
// Uso: node scripts/loadtest.mjs [http://localhost:3000]
import autocannon from 'autocannon';

const BASE = process.argv[2] ?? 'http://localhost:3000';
const LIMITE_MS = 4000;

async function login() {
  const r = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'auxiliar@lucytejada.gov.co', password: 'Musica2026' }),
  });
  return (await r.json()).token;
}

const token = await login();
const escenarios = [
  { titulo: 'Agenda pública de conciertos', url: '/api/v1/conciertos?tamano=50' },
  { titulo: 'Oferta de festivales y formación', url: '/api/v1/formacion/procesos' },
  { titulo: 'Inventario de instrumentos (autenticado)', url: '/api/v1/instrumentos?tamano=50', headers: { Authorization: `Bearer ${token}` } },
];

let cumple = true;
for (const e of escenarios) {
  const r = await autocannon({ url: BASE + e.url, connections: 200, duration: 15, headers: e.headers });
  const p99 = r.latency.p99;
  const max = r.latency.max;
  const ok = p99 < LIMITE_MS && r.non2xx === 0 && r.errors === 0;
  cumple &&= ok;
  console.log(`\n${ok ? '✔' : '✘'} ${e.titulo}`);
  console.log(`   200 conexiones simultáneas · ${r.requests.total} peticiones en 15 s (${Math.round(r.requests.average)}/s)`);
  console.log(`   Latencia: promedio ${Math.round(r.latency.average)} ms · p50 ${r.latency.p50} ms · p99 ${p99} ms · máx ${max} ms`);
  console.log(`   Errores: ${r.errors} · respuestas no 2xx: ${r.non2xx}`);
}
console.log(`\nCAR-14 (${LIMITE_MS} ms con 200 usuarios simultáneos): ${cumple ? 'CUMPLE' : 'NO CUMPLE'}\n`);
process.exit(cumple ? 0 : 1);
