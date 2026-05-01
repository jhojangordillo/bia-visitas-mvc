/**
 * ROUTES — Visita
 *
 * Prefijo /api/visitas. Soporta filtro ?cliente_id=N en GET.
 */

const router = require('express').Router();
const ctrl = require('../controllers/visitaController');

router.get('/',       ctrl.list);
router.get('/:id',    ctrl.getOne);
router.post('/',      ctrl.create);
router.put('/:id',    ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
