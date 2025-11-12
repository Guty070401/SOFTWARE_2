const router = require('express').Router();
const requireAdmin = require('../middlewares/requireAdmin');
const storeService = require('../services/storeService');

// existentes
router.get('/', async (_req, res) => {
  const stores = await storeService.listStores();
  res.json({ stores });
});

// CRUD tiendas (admin)
router.post('/', requireAdmin, async (req, res) => {
  const store = await storeService.createStore(req.body);
  res.status(201).json({ store });
});
router.patch('/:id', requireAdmin, async (req, res) => {
  const store = await storeService.updateStore(req.params.id, req.body);
  res.json({ store });
});
router.delete('/:id', requireAdmin, async (req, res) => {
  await storeService.deleteStore(req.params.id);
  res.status(204).end();
});

// Productos por tienda
router.get('/:id/products', async (req, res) => {
  const products = await storeService.listProductsByStore(req.params.id);
  res.json({ products });
});
router.post('/:id/products', requireAdmin, async (req, res) => {
  const product = await storeService.createProduct({ ...req.body, tiendaId: req.params.id });
  res.status(201).json({ product });
});
router.patch('/products/:productId', requireAdmin, async (req, res) => {
  const product = await storeService.updateProduct(req.params.productId, req.body);
  res.json({ product });
});
router.delete('/products/:productId', requireAdmin, async (req, res) => {
  await storeService.deleteProduct(req.params.productId);
  res.status(204).end();
});

// Export/Import catálogo
router.get('/export/json', requireAdmin, async (_req, res) => {
  const data = await storeService.exportCatalog();
  res.setHeader('Content-Disposition', 'attachment; filename=catalogo.json');
  res.json(data);
});
router.post('/import/json', requireAdmin, async (req, res) => {
  const out = await storeService.importCatalog(req.body); // { tiendas:[], productos:[] }
  res.json(out);
});

module.exports = router;
