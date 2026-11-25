// Copia los archivos de Swagger UI a /public para servir la documentación OpenAPI sin internet.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const src = join(process.cwd(), 'node_modules', 'swagger-ui-dist');
const dest = join(process.cwd(), 'public', 'swagger');
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  for (const f of ['swagger-ui.css', 'swagger-ui-bundle.js']) cpSync(join(src, f), join(dest, f));
  console.log('Swagger UI copiado a public/swagger');
}
