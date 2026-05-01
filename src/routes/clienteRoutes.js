/**
 * ROUTES — Cliente
 *
 * Mapea verbo HTTP + ruta → método del controlador.
 * Prefijo /api/clientes (lo monta server.js).
 */

const router = require('express').Router();
const ctrl = require('../controllers/clienteController');

router.get('/',       ctrl.list);
router.get('/:id',    ctrl.getOne);
router.post('/',      ctrl.create);
router.put('/:id',    ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
