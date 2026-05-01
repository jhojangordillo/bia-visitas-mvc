/**
 * CONTROLLER — Cliente
 *
 * Recibe el request HTTP, valida lo mínimo, llama al modelo, devuelve la respuesta.
 * Sin lógica de SQL aquí — eso es problema del modelo.
 */

const Cliente = require('../models/clienteModel');

const SECTORES_VALIDOS = ['Residencial', 'Comercial', 'Industrial', 'Oficial'];

function validarPayload(body, esCreacion = true) {
  const errores = [];
  if (esCreacion || body.nombre !== undefined) {
    if (!body.nombre || body.nombre.trim() === '') errores.push('nombre es obligatorio');
  }
  if (esCreacion || body.documento !== undefined) {
    if (!body.documento || body.documento.trim() === '') errores.push('documento es obligatorio');
  }
  if (esCreacion || body.sector !== undefined) {
    if (!SECTORES_VALIDOS.includes(body.sector)) {
      errores.push(`sector debe ser uno de: ${SECTORES_VALIDOS.join(', ')}`);
    }
  }
  if (esCreacion || body.ciudad !== undefined) {
    if (!body.ciudad || body.ciudad.trim() === '') errores.push('ciudad es obligatoria');
  }
  return errores;
}

const ClienteController = {
  // GET /api/clientes
  list(req, res) {
    const data = Cliente.findAll();
    res.json({ ok: true, data, total: data.length });
  },

  // GET /api/clientes/:id
  getOne(req, res) {
    const cliente = Cliente.findById(Number(req.params.id));
    if (!cliente) return res.status(404).json({ ok: false, error: 'Cliente no encontrado' });
    res.json({ ok: true, data: cliente });
  },

  // POST /api/clientes
  create(req, res) {
    const errores = validarPayload(req.body, true);
    if (errores.length) return res.status(400).json({ ok: false, errores });

    try {
      const nuevo = Cliente.create(req.body);
      res.status(201).json({ ok: true, data: nuevo });
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        return res.status(409).json({ ok: false, error: 'Ya existe un cliente con ese documento' });
      }
      res.status(500).json({ ok: false, error: err.message });
    }
  },

  // PUT /api/clientes/:id
  update(req, res) {
    const errores = validarPayload(req.body, false);
    if (errores.length) return res.status(400).json({ ok: false, errores });

    const actualizado = Cliente.update(Number(req.params.id), req.body);
    if (!actualizado) return res.status(404).json({ ok: false, error: 'Cliente no encontrado' });
    res.json({ ok: true, data: actualizado });
  },

  // DELETE /api/clientes/:id
  remove(req, res) {
    const eliminado = Cliente.remove(Number(req.params.id));
    if (!eliminado) return res.status(404).json({ ok: false, error: 'Cliente no encontrado' });
    res.json({ ok: true, mensaje: 'Cliente eliminado (y sus visitas en cascada)' });
  },
};

module.exports = ClienteController;
