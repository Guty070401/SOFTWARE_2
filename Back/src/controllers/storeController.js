const storeService = require('../services/storeService');

exports.listStores = (_req, res, next) => {
  try {
    const result = storeService.listStores();
    if (result && typeof result.then === 'function') {
      result.then(stores => res.json({ stores })).catch(next);
    } else {
      res.json({ stores: result });
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteStore = async (req, res, next) => {
  try {
    await storeService.deleteStore(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await storeService.deleteProduct(req.params.productId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
