/**
 * MODEL — Cliente
 *
 * Esta capa habla DIRECTO con la base de datos. No sabe de HTTP, no sabe de Express.
 * Solo expone métodos puros: dame todos los clientes, dame uno por id, crea uno, etc.
 *
 * El controlador es el que orquesta cuándo llamar a estos métodos.
 */

const { db } = require('../config/database');

const Cliente = {
  /** Lista todos los clientes. */
  findAll() {
    return db.prepare('SELECT * FROM clientes ORDER BY nombre').all();
  },

  /** Busca un cliente por su id. Devuelve undefined si no existe. */
  findById(id) {
    return db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
  },

  /** Crea un cliente y devuelve la fila completa con su id nuevo. */
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO clientes (nombre, documento, sector, ciudad, direccion, telefono)
      VALUES (@nombre, @documento, @sector, @ciudad, @direccion, @telefono)
    `);
    const info = stmt.run({
      nombre: data.nombre,
      documento: data.documento,
      sector: data.sector,
      ciudad: data.ciudad,
      direccion: data.direccion ?? null,
      telefono: data.telefono ?? null,
    });
    return this.findById(info.lastInsertRowid);
  },

  /** Actualiza un cliente. Devuelve la fila actualizada o undefined si no existe. */
  update(id, data) {
    const existente = this.findById(id);
    if (!existente) return undefined;

    const merged = { ...existente, ...data };
    db.prepare(`
      UPDATE clientes
         SET nombre    = @nombre,
             documento = @documento,
             sector    = @sector,
             ciudad    = @ciudad,
             direccion = @direccion,
             telefono  = @telefono
       WHERE id = @id
    `).run({
      id,
      nombre: merged.nombre,
      documento: merged.documento,
      sector: merged.sector,
      ciudad: merged.ciudad,
      direccion: merged.direccion,
      telefono: merged.telefono,
    });
    return this.findById(id);
  },

  /** Borra un cliente y por CASCADE arrastra sus visitas. */
  remove(id) {
    const info = db.prepare('DELETE FROM clientes WHERE id = ?').run(id);
    return info.changes > 0;
  },
};

module.exports = Cliente;
