/**
 * Unit tests del modelo Cliente.
 * Cada test corre contra una BD en memoria fresca.
 */

const { db } = require('../src/config/database');
const Cliente = require('../src/models/clienteModel');

const clienteValido = {
  nombre: 'Tienda La Esquina',
  documento: '900987654',
  sector: 'Comercial',
  ciudad: 'Bello',
  direccion: 'Cl 50 # 30-15',
  telefono: '3001112233',
};

beforeEach(() => {
  db.exec('DELETE FROM visitas; DELETE FROM clientes;');
});

describe('Cliente.create', () => {
  test('inserta y devuelve el cliente con id', () => {
    const c = Cliente.create(clienteValido);
    expect(c.id).toBeGreaterThan(0);
    expect(c.nombre).toBe(clienteValido.nombre);
    expect(c.creado_en).toBeTruthy();
  });

  test('falla si el documento ya existe (UNIQUE)', () => {
    Cliente.create(clienteValido);
    expect(() => Cliente.create({ ...clienteValido, nombre: 'Otro' }))
      .toThrow(/UNIQUE/);
  });

  test('falla si el sector no es válido (CHECK)', () => {
    expect(() => Cliente.create({ ...clienteValido, sector: 'Invalido' }))
      .toThrow();
  });

  test('campos opcionales aceptan undefined', () => {
    const c = Cliente.create({
      nombre: 'X', documento: '123', sector: 'Residencial', ciudad: 'Y',
    });
    expect(c.direccion).toBeNull();
    expect(c.telefono).toBeNull();
  });
});

describe('Cliente.findAll / findById', () => {
  test('devuelve lista vacía si no hay clientes', () => {
    expect(Cliente.findAll()).toEqual([]);
  });

  test('devuelve los clientes ordenados por nombre', () => {
    Cliente.create({ ...clienteValido, nombre: 'Zeta', documento: '1' });
    Cliente.create({ ...clienteValido, nombre: 'Alpha', documento: '2' });
    const lista = Cliente.findAll();
    expect(lista.map((c) => c.nombre)).toEqual(['Alpha', 'Zeta']);
  });

  test('findById devuelve undefined si no existe', () => {
    expect(Cliente.findById(999)).toBeUndefined();
  });
});

describe('Cliente.update', () => {
  test('actualiza solo los campos enviados (parcial)', () => {
    const c = Cliente.create(clienteValido);
    const actualizado = Cliente.update(c.id, { telefono: '3009998877' });
    expect(actualizado.telefono).toBe('3009998877');
    expect(actualizado.nombre).toBe(clienteValido.nombre); // no cambió
  });

  test('devuelve undefined si el id no existe', () => {
    expect(Cliente.update(9999, { nombre: 'X' })).toBeUndefined();
  });
});

describe('Cliente.remove', () => {
  test('borra un cliente y devuelve true', () => {
    const c = Cliente.create(clienteValido);
    expect(Cliente.remove(c.id)).toBe(true);
    expect(Cliente.findById(c.id)).toBeUndefined();
  });

  test('devuelve false si el id no existe', () => {
    expect(Cliente.remove(9999)).toBe(false);
  });
});
