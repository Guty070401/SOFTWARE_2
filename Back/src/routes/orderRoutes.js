const router = require('express').Router();
const { supabase } = require('../data/database');
const requireAuth = require('../middlewares/requireAuth');

// POST /api/orders  -> crear orden
router.post('/', requireAuth, async (req, res) => {
  const { storeId, items = [], tarjetaId = null, direccionEntrega = null, comentarios = null } = req.body || {};
  if (!storeId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'storeId e items son requeridos' });
  }

  // tracking simple
  const tracking = 'ORD-' + Date.now();

  // 1) Orden
  const insertOrden = {
    tracking,
    fecha: new Date(),
    estado: 'CREATED',
    solucion: false,
    tiempo_estimado: 30,
    tienda_id: storeId,
    tarjeta_id: tarjetaId,
    direccion_entrega: direccionEntrega,
    comentarios
  };

  const { data: orden, error: e1 } = await supabase.from('ordenes').insert(insertOrden).select().single();
  if (e1) return res.status(500).json({ message: e1.message });

  // 2) Items
  const rows = items.map(it => ({
    orden_id: orden.id,
    producto_id: it.productoId,
    cantidad: it.cantidad || 1,
    precio_unitario: Number(it.precioUnitario || it.precio || 0)
  }));
  if (rows.length) {
    const { error: e2 } = await supabase.from('orden_productos').insert(rows);
    if (e2) return res.status(500).json({ message: e2.message });
  }

  // 3) Propietario
  const { error: e3 } = await supabase.from('orden_usuarios').insert({
    orden_id: orden.id,
    usuario_id: req.userId,
    es_propietario: true,
    es_repartidor: false
  });
  if (e3) return res.status(500).json({ message: e3.message });

  // 4) Historial inicial
  const { error: e4 } = await supabase.from('historial_estados').insert({
    orden_id: orden.id, estado: 'CREATED', comentarios: 'Orden creada'
  });
  if (e4) return res.status(500).json({ message: e4.message });

  res.status(201).json({ order: { id: orden.id, tracking: orden.tracking } });
});

// GET /api/orders/:id  -> obtener una orden
router.get('/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const { data: o, error: e1 } = await supabase.from('ordenes').select('*').eq('id', id).single();
  if (e1) return res.status(404).json({ message: e1.message });
  const { data: items, error: e2 } = await supabase.from('orden_productos').select('*').eq('orden_id', id);
  if (e2) return res.status(500).json({ message: e2.message });
  res.json({ order: o, items });
});

module.exports = router;
