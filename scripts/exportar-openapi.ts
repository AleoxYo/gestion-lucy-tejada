// Exporta el contrato OpenAPI a docs/openapi.json. Uso: npm run openapi
import { mkdirSync, writeFileSync } from 'node:fs';
import { openapi } from '../src/lib/openapi';

mkdirSync('docs', { recursive: true });
writeFileSync('docs/openapi.json', JSON.stringify(openapi, null, 2) + '\n', 'utf-8');
console.log(`Contrato exportado a docs/openapi.json (${Object.keys(openapi.paths).length} rutas)`);
