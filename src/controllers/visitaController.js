/**
 * CONTROLLER — Visita
 */

const Visita = require('../models/visitaModel');
const Cliente = require('../models/clienteModel');

const TIPOS_VALIDOS = ['Instalación', 'Mantenimiento', 'Inspección', 'Emergencia', 'Retiro'];
const ESTADOS_VALIDOS = ['Programada', 'En curso', 'Completada', 'Cancelada'];

function validarPayload(body, esCreacion = true) {
  const errores = [];
  if (esCreacion || body.cliente_id !== undefined) {
    if (!body.cliente_id) errores.push('cliente_id es obligatorio');
    else if (!Cliente.findById(body.cliente_id)) {
      errores.push(`No existe cliente con id ${body.cliente_id}`);
    }
  }
  if (esCreacion || body.fecha !== undefined) {
    if (!body.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(body.fecha)) {
      errores.push('fecha debe estar en formato YYYY-MM-DD');
    }
  }
  if (esCreacion || body.tipo !== undefined) {
    if (!TIPOS_VALIDOS.includes(body.tipo)) {
      errores.push(`tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}`);
    }
  }
  if (body.estado !== undefined && !ESTADOS_VALIDOS.includes(body.estado)) {
    errores.push(`estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
  }
  if (esCreacion || body.tecnico !== undefined) {
    if (!body.tecnico || body.tecnico.trim() === '') errores.push('tecnico es obligatorio');
  }
  return errores;
}

const VisitaController = {
  list(req, res) {
    const { cliente_id } = req.query;
    if (cliente_id) {
      const data = Visita.findByCliente(Number(cliente_id));
      return res.json({ ok: true, data, total: data.length });
    }
    const data = Visita.findAll();
    res.json({ ok: true, data, total: data.length });
  },

  getOne(req, res) {
    const v = Visita.findById(Number(req.params.id));
    if (!v) return res.status(404).json({ ok: false, error: 'Visita no encontrada' });
    res.json({ ok: true, data: v });
  },

  create(req, res) {
    const errores = validarPayload(req.body, true);
    if (errores.length) return res.status(400).json({ ok: false, errores });
    const nuevo = Visita.create(req.body);
    res.status(201).json({ ok: true, data: nuevo });
  },

  update(req, res) {
    const errores = validarPayload(req.body, false);
    if (errores.length) return res.status(400).json({ ok: false, errores });
    const v = Visita.update(Number(req.params.id), req.body);
    if (!v) return res.status(404).json({ ok: false, error: 'Visita no encontrada' });
    res.json({ ok: true, data: v });
  },

  remove(req, res) {
    const eliminada = Visita.remove(Number(req.params.id));
    if (!eliminada) return res.status(404).json({ ok: false, error: 'Visita no encontrada' });
    res.json({ ok: true, mensaje: 'Visita eliminada' });
  },
};

module.exports = VisitaController;
