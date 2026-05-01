/**
 * Construcción de la app Express (sin levantar servidor).
 *
 * Separado de server.js para que los tests puedan importarla y probarla
 * con supertest sin abrir un puerto.
 */

const express = require('express');

const clienteRoutes = require('./routes/clienteRoutes');
const visitaRoutes = require('./routes/visitaRoutes');

function createApp() {
  const app = express();
  app.use(express.json());

  // Manifiesto
  app.get('/', (req, res) => {
    res.json({
      nombre: 'Bia Visitas API',
      version: '1.0.0',
      descripcion: 'CRUD de clientes y visitas técnicas',
      endpoints: {
        clientes: '/api/clientes',
        visitas: '/api/visitas',
        health: '/health',
      },
    });
  });

  // Healthcheck
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Rutas REST
  app.use('/api/clientes', clienteRoutes);
  app.use('/api/visitas', visitaRoutes);

  // 404 final
  app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'Ruta no encontrada' });
  });

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  });

  return app;
}

module.exports = { createApp };
