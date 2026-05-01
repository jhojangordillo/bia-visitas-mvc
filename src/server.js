/**
 * Entry point en producción/desarrollo.
 *
 * Solo conecta la BD y levanta el servidor. La construcción de Express
 * vive en app.js para poder testearla aislada.
 */

require('./config/database'); // bootstrappea la BD al cargar
const { createApp } = require('./app');

const app = createApp();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bia Visitas API escuchando en http://localhost:${PORT}`);
  console.log('   Endpoints:');
  console.log('     GET  /api/clientes');
  console.log('     POST /api/clientes');
  console.log('     GET  /api/visitas');
  console.log('     POST /api/visitas');
  console.log('     ... y los demás (PUT, DELETE, /:id)');
  console.log('     GET  /health');
});
