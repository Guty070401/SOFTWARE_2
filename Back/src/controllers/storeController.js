const storeService = require('../services/storeService');

exports.listStores = async (_req, res, next) => {
  try {
    const stores = await storeService.listStores();
    res.json({ stores });
  } catch (error) {
    next(error);
  }
};

exports.createStore = async (req, res, next) => {
  try {
    const store = await storeService.createStore(req.body);
    res.status(201).json({ store });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await storeService.createProduct(req.params.storeId, req.body);
    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
};

exports.deleteStore = async (req, res, next) => {
  try {
    const store = await storeService.deleteStore(req.params.storeId);
    res.json({ store });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await storeService.deleteProduct(req.params.storeId, req.params.productId);
    res.json({ product });
  } catch (error) {
    next(error);
  }
};
