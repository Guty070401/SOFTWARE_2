const storeService = require('../services/storeService');

exports.listStores = async (req, res, next) => {
  try {
    const stores = await storeService.listStores();
    res.json({ stores });
  } catch (error) {
    next(error);
  }
};

exports.createStore = async (req, res, next) => {
  try {
    const store = await storeService.createStore(req.body || {});
    res.status(201).json({ store });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const product = await storeService.createProduct(storeId, req.body || {});
    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
};
