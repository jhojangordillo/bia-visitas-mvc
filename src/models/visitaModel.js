/**
 * MODEL — Visita
 *
 * Cada visita pertenece a un cliente (relación 1:N).
 * Si se elimina un cliente, sus visitas se borran en cascada (definido en el schema).
 */

const { db } = require('../config/database');

const Visita = {
  findAll() {
    return db.prepare(`
      SELECT v.*, c.nombre AS cliente_nombre
        FROM visitas v
        JOIN clientes c ON c.id = v.cliente_id
       ORDER BY v.fecha DESC
    `).all();
  },

  findById(id) {
    return db.prepare(`
      SELECT v.*, c.nombre AS cliente_nombre
        FROM visitas v
        JOIN clientes c ON c.id = v.cliente_id
       WHERE v.id = ?
    `).get(id);
  },

  /** Devuelve todas las visitas de un cliente específico. */
  findByCliente(clienteId) {
    return db.prepare(`
      SELECT * FROM visitas
       WHERE cliente_id = ?
       ORDER BY fecha DESC
    `).all(clienteId);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO visitas (cliente_id, fecha, tipo, estado, tecnico, observaciones)
      VALUES (@cliente_id, @fecha, @tipo, @estado, @tecnico, @observaciones)
    `);
    const info = stmt.run({
      cliente_id: data.cliente_id,
      fecha: data.fecha,
      tipo: data.tipo,
      estado: data.estado ?? 'Programada',
      tecnico: data.tecnico,
      observaciones: data.observaciones ?? null,
    });
    return this.findById(info.lastInsertRowid);
  },

  update(id, data) {
    const existente = this.findById(id);
    if (!existente) return undefined;

    const merged = { ...existente, ...data };
    db.prepare(`
      UPDATE visitas
         SET cliente_id    = @cliente_id,
             fecha         = @fecha,
             tipo          = @tipo,
             estado        = @estado,
             tecnico       = @tecnico,
             observaciones = @observaciones
       WHERE id = @id
    `).run({
      id,
      cliente_id: merged.cliente_id,
      fecha: merged.fecha,
      tipo: merged.tipo,
      estado: merged.estado,
      tecnico: merged.tecnico,
      observaciones: merged.observaciones,
    });
    return this.findById(id);
  },

  remove(id) {
    const info = db.prepare('DELETE FROM visitas WHERE id = ?').run(id);
    return info.changes > 0;
  },
};

module.exports = Visita;
