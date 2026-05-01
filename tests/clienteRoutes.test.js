/**
 * Integration tests de los endpoints HTTP de clientes.
 * Usa supertest contra la app real (sin abrir puerto).
 */

const request = require('supertest');
const { db } = require('../src/config/database');
const { createApp } = require('../src/app');

const app = createApp();

const clienteValido = {
  nombre: 'Tienda La Esquina',
  documento: '900987654',
  sector: 'Comercial',
  ciudad: 'Bello',
};

beforeEach(() => {
  db.exec('DELETE FROM visitas; DELETE FROM clientes;');
});

describe('GET /', () => {
  test('responde con manifiesto', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Bia Visitas API');
    expect(res.body.endpoints).toHaveProperty('clientes');
  });
});

describe('GET /health', () => {
  test('healthcheck responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });
});

describe('Endpoints inexistentes', () => {
  test('404 para rutas desconocidas', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });
});

describe('GET /api/clientes', () => {
  test('responde 200 con array vacío', async () => {
    const res = await request(app).get('/api/clientes');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });
});

describe('POST /api/clientes', () => {
  test('crea un cliente y devuelve 201', async () => {
    const res = await request(app).post('/api/clientes').send(clienteValido);
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.id).toBeGreaterThan(0);
  });

  test('400 si faltan campos obligatorios', async () => {
    const res = await request(app).post('/api/clientes').send({ nombre: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.errores).toEqual(expect.arrayContaining([
      expect.stringContaining('documento'),
      expect.stringContaining('sector'),
      expect.stringContaining('ciudad'),
    ]));
  });

  test('400 si sector es inválido', async () => {
    const res = await request(app).post('/api/clientes').send({
      ...clienteValido, sector: 'Otro',
    });
    expect(res.status).toBe(400);
  });

  test('409 si el documento se repite', async () => {
    await request(app).post('/api/clientes').send(clienteValido);
    const res = await request(app).post('/api/clientes').send(clienteValido);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/documento/i);
  });
});

describe('GET /api/clientes/:id', () => {
  test('devuelve el cliente por id', async () => {
    const creado = await request(app).post('/api/clientes').send(clienteValido);
    const res = await request(app).get(`/api/clientes/${creado.body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.documento).toBe(clienteValido.documento);
  });

  test('404 si no existe', async () => {
    const res = await request(app).get('/api/clientes/9999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/clientes/:id', () => {
  test('actualiza un campo y devuelve la fila completa', async () => {
    const creado = await request(app).post('/api/clientes').send(clienteValido);
    const res = await request(app)
      .put(`/api/clientes/${creado.body.data.id}`)
      .send({ telefono: '3001112233' });
    expect(res.status).toBe(200);
    expect(res.body.data.telefono).toBe('3001112233');
  });

  test('404 si no existe', async () => {
    const res = await request(app).put('/api/clientes/9999').send({ nombre: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/clientes/:id', () => {
  test('elimina un cliente', async () => {
    const creado = await request(app).post('/api/clientes').send(clienteValido);
    const res = await request(app).delete(`/api/clientes/${creado.body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/cascada/i);
  });

  test('404 si no existe', async () => {
    const res = await request(app).delete('/api/clientes/9999');
    expect(res.status).toBe(404);
  });
});
