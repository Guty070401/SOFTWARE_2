const router = require('express').Router();
const requireAuth = require('../middlewares/requireAuth');
const { supabase } = require('../data/database');

const num = (v, d = 0) => (v == null ? d : Number(v));

router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { catalog = [] } = req.body || {};
    if (!Array.isArray(catalog) || !catalog.length) {
      return res.status(400).json({ message: 'catalog requerido' });
    }

    // 1) tiendas
    const stores = catalog.map(c => ({
      id: c.store.id,
      nombre_origen: c.store.nombre,
      descripcion: c.store.descripcion ?? null,
      logo: c.store.logo ?? null
    }));
    const { error: eS } = await supabase.from('tiendas').upsert(stores, { onConflict: 'id' });
    if (eS) return res.status(500).json({ message: eS.message });

    // 2) productos
    const products = catalog.flatMap(c =>
      (c.products || []).map(p => ({
        id: p.id,
        tienda_id: p.tienda_id || c.store.id,
        nombre: p.nombre,
        descripcion: p.descripcion ?? null,
        precio: num(p.precio),
        foto: p.foto ?? null
      }))
    );
    if (products.length) {
      const { error: eP } = await supabase.from('productos').upsert(products, { onConflict: 'id' });
      if (eP) return res.status(500).json({ message: eP.message });
    }

    res.json({ ok: true, stores: stores.length, products: products.length });
  } catch (err) {
    res.status(500).json({ message: err.message || 'sync error' });
  }
});

module.exports = router;
