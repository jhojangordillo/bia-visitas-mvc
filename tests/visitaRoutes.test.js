/**
 * Integration tests de los endpoints HTTP de visitas.
 */

const request = require('supertest');
const { db } = require('../src/config/database');
const { createApp } = require('../src/app');

const app = createApp();

let clienteId;

beforeEach(async () => {
  db.exec('DELETE FROM visitas; DELETE FROM clientes;');
  const res = await request(app).post('/api/clientes').send({
    nombre: 'Cliente Test', documento: '123', sector: 'Industrial', ciudad: 'Medellín',
  });
  clienteId = res.body.data.id;
});

const visitaValida = () => ({
  cliente_id: clienteId,
  fecha: '2026-05-12',
  tipo: 'Mantenimiento',
  tecnico: 'Jhojan Gordillo',
});

describe('POST /api/visitas', () => {
  test('crea una visita (201)', async () => {
    const res = await request(app).post('/api/visitas').send(visitaValida());
    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('Programada');
  });

  test('400 con fecha en formato inválido', async () => {
    const res = await request(app)
      .post('/api/visitas')
      .send({ ...visitaValida(), fecha: '12/05/2026' });
    expect(res.status).toBe(400);
    expect(res.body.errores[0]).toMatch(/fecha/);
  });

  test('400 con cliente_id inexistente', async () => {
    const res = await request(app)
      .post('/api/visitas')
      .send({ ...visitaValida(), cliente_id: 9999 });
    expect(res.status).toBe(400);
    expect(res.body.errores[0]).toMatch(/cliente/);
  });

  test('400 con tipo inválido', async () => {
    const res = await request(app)
      .post('/api/visitas')
      .send({ ...visitaValida(), tipo: 'Tornillo' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/visitas', () => {
  test('lista todas y trae cliente_nombre del JOIN', async () => {
    await request(app).post('/api/visitas').send(visitaValida());
    const res = await request(app).get('/api/visitas');
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toHaveProperty('cliente_nombre', 'Cliente Test');
  });

  test('filtra por ?cliente_id=N', async () => {
    await request(app).post('/api/visitas').send(visitaValida());
    const res = await request(app).get(`/api/visitas?cliente_id=${clienteId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('PUT /api/visitas/:id', () => {
  test('cambia estado de la visita', async () => {
    const c = await request(app).post('/api/visitas').send(visitaValida());
    const res = await request(app)
      .put(`/api/visitas/${c.body.data.id}`)
      .send({ estado: 'Completada' });
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('Completada');
  });

  test('400 si estado es inválido', async () => {
    const c = await request(app).post('/api/visitas').send(visitaValida());
    const res = await request(app)
      .put(`/api/visitas/${c.body.data.id}`)
      .send({ estado: 'XYZ' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/visitas/:id', () => {
  test('elimina una visita', async () => {
    const c = await request(app).post('/api/visitas').send(visitaValida());
    const res = await request(app).delete(`/api/visitas/${c.body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('404 si no existe', async () => {
    const res = await request(app).delete('/api/visitas/9999');
    expect(res.status).toBe(404);
  });
});
