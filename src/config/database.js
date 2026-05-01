/**
 * Configuración de SQLite.
 *
 * Exporta:
 *   - db                  → instancia singleton (la app principal usa esta)
 *   - createDatabase(p)   → factory para crear una BD nueva (útil en tests)
 *   - applySchema(db)     → crea las tablas + índices + foreign keys
 *   - seed(db)            → inserta datos de ejemplo
 *
 * La ruta del archivo se resuelve por env var DB_PATH (default: data/visitas.db).
 * Esto permite que los tests usen `:memory:` sin tocar el archivo de dev.
 */

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DEFAULT_DB_PATH = path.join(__dirname, '..', '..', 'data', 'visitas.db');

function applySchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre      TEXT    NOT NULL,
      documento   TEXT    NOT NULL UNIQUE,
      sector      TEXT    NOT NULL CHECK (sector IN ('Residencial','Comercial','Industrial','Oficial')),
      ciudad      TEXT    NOT NULL,
      direccion   TEXT,
      telefono    TEXT,
      creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS visitas (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id      INTEGER NOT NULL,
      fecha           DATE    NOT NULL,
      tipo            TEXT    NOT NULL CHECK (tipo IN ('Instalación','Mantenimiento','Inspección','Emergencia','Retiro')),
      estado          TEXT    NOT NULL DEFAULT 'Programada'
                              CHECK (estado IN ('Programada','En curso','Completada','Cancelada')),
      tecnico         TEXT    NOT NULL,
      observaciones   TEXT,
      creado_en       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_visitas_cliente ON visitas(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_visitas_fecha   ON visitas(fecha);
  `);
}

function seed(db) {
  const insertarCliente = db.prepare(
    `INSERT INTO clientes (nombre, documento, sector, ciudad, direccion, telefono)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertarVisita = db.prepare(
    `INSERT INTO visitas (cliente_id, fecha, tipo, estado, tecnico, observaciones)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  db.exec('BEGIN');
  try {
    const c1 = insertarCliente.run(
      'Edificio BURO 51', '900111222', 'Comercial', 'Bogotá',
      'Cra 11 # 93-46', '3001234567'
    ).lastInsertRowid;
    const c2 = insertarCliente.run(
      'Plastiquim Ltda', '900123456', 'Industrial', 'Medellín',
      'Cl 30 # 65-12', '3019998877'
    ).lastInsertRowid;
    const c3 = insertarCliente.run(
      'Carlos Ruiz', '71234567', 'Residencial', 'Envigado',
      'Cl 38 sur # 41-22', '3105556677'
    ).lastInsertRowid;

    insertarVisita.run(c1, '2026-05-05', 'Inspección', 'Programada',
      'Jhojan Gordillo', 'Revisar tableros y puesta a tierra');
    insertarVisita.run(c2, '2026-05-06', 'Mantenimiento', 'Programada',
      'Wilson Fernandez', 'Limpieza de banco de condensadores');
    insertarVisita.run(c3, '2026-04-28', 'Instalación', 'Completada',
      'Jhojan Gordillo', 'Medidor Index AMI HW3 instalado y verificado');

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function createDatabase(filename = DEFAULT_DB_PATH) {
  if (filename !== ':memory:') {
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON');
  applySchema(db);
  return db;
}

const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;
const db = createDatabase(DB_PATH);

// Sembrar solo si corresponde (no en tests, no si ya hay datos)
if (process.env.SEED !== '0') {
  const total = db.prepare('SELECT COUNT(*) AS n FROM clientes').get().n;
  if (total === 0) {
    seed(db);
    if (DB_PATH !== ':memory:') {
      console.log('🌱 Datos semilla insertados (3 clientes + 3 visitas).');
    }
  }
}

module.exports = { db, createDatabase, applySchema, seed };
