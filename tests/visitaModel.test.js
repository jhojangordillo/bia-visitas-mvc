/**
 * Unit tests del modelo Visita.
 * Verifica también la cascada al borrar el cliente.
 */

const { db } = require('../src/config/database');
const Cliente = require('../src/models/clienteModel');
const Visita = require('../src/models/visitaModel');

let clienteId;

beforeEach(() => {
  db.exec('DELETE FROM visitas; DELETE FROM clientes;');
  const c = Cliente.create({
    nombre: 'Cliente test',
    documento: '111',
    sector: 'Industrial',
    ciudad: 'Medellín',
  });
  clienteId = c.id;
});

const visitaValida = () => ({
  cliente_id: clienteId,
  fecha: '2026-05-10',
  tipo: 'Mantenimiento',
  tecnico: 'Jhojan Gordillo',
  observaciones: 'Test',
});

describe('Visita.create', () => {
  test('inserta visita con estado por defecto Programada', () => {
    const v = Visita.create(visitaValida());
    expect(v.id).toBeGreaterThan(0);
    expect(v.estado).toBe('Programada');
    expect(v.cliente_nombre).toBe('Cliente test'); // viene del JOIN
  });

  test('respeta estado custom si se envía', () => {
    const v = Visita.create({ ...visitaValida(), estado: 'Completada' });
    expect(v.estado).toBe('Completada');
  });

  test('falla si tipo es inválido', () => {
    expect(() => Visita.create({ ...visitaValida(), tipo: 'Otro' })).toThrow();
  });

  test('falla si cliente_id no existe (FK)', () => {
    expect(() => Visita.create({ ...visitaValida(), cliente_id: 9999 })).toThrow();
  });
});

describe('Visita.findAll / findById / findByCliente', () => {
  test('lista todas las visitas con join a cliente', () => {
    Visita.create(visitaValida());
    const lista = Visita.findAll();
    expect(lista).toHaveLength(1);
    expect(lista[0]).toHaveProperty('cliente_nombre');
  });

  test('findByCliente filtra por cliente', () => {
    const otroCliente = Cliente.create({
      nombre: 'Otro', documento: '222', sector: 'Residencial', ciudad: 'Bello',
    });
    Visita.create(visitaValida());
    Visita.create({ ...visitaValida(), cliente_id: otroCliente.id });

    expect(Visita.findByCliente(clienteId)).toHaveLength(1);
    expect(Visita.findByCliente(otroCliente.id)).toHaveLength(1);
  });

  test('findById devuelve undefined si no existe', () => {
    expect(Visita.findById(9999)).toBeUndefined();
  });
});

describe('Visita.update', () => {
  test('actualiza el estado parcialmente', () => {
    const v = Visita.create(visitaValida());
    const u = Visita.update(v.id, { estado: 'Completada' });
    expect(u.estado).toBe('Completada');
    expect(u.tecnico).toBe(visitaValida().tecnico);
  });
});

describe('Visita.remove + CASCADE', () => {
  test('borra una visita individualmente', () => {
    const v = Visita.create(visitaValida());
    expect(Visita.remove(v.id)).toBe(true);
    expect(Visita.findById(v.id)).toBeUndefined();
  });

  test('al borrar un cliente se borran sus visitas (CASCADE)', () => {
    Visita.create(visitaValida());
    Visita.create({ ...visitaValida(), fecha: '2026-05-15' });
    expect(Visita.findByCliente(clienteId)).toHaveLength(2);

    Cliente.remove(clienteId);
    expect(Visita.findByCliente(clienteId)).toHaveLength(0);
  });
});
