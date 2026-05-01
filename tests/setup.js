/**
 * Setup global de Jest.
 * Apunta la BD a memoria y desactiva el seed automático antes de cargar
 * cualquier módulo de la app. Esto debe ejecutarse ANTES de los tests.
 */

process.env.DB_PATH = ':memory:';
process.env.SEED = '0';
process.env.NODE_ENV = 'test';
