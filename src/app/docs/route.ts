// Documentación interactiva Swagger UI (servida localmente desde /public/swagger).
export const dynamic = 'force-static';

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SGM-LT · Contrato OpenAPI</title>
  <link rel="stylesheet" href="/swagger/swagger-ui.css" />
  <style>body{margin:0;background:#fff} .topbar{display:none}
  .volver{font:14px system-ui;padding:10px 20px;background:#1c3a73;color:#fff}
  .volver a{color:#fff}</style>
</head>
<body>
  <div class="volver">SGM-LT · Servicios REST del Módulo de Música · <a href="/">Volver a la aplicación</a> · <a href="/api/v1/openapi.json">Descargar openapi.json</a></div>
  <div id="swagger"></div>
  <script src="/swagger/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({ url: '/api/v1/openapi.json', dom_id: '#swagger', persistAuthorization: true, docExpansion: 'list' });
  </script>
</body>
</html>`;

export function GET() {
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
