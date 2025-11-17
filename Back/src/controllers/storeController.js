const storeService = require('../services/storeService');

exports.listStores = async (_req, res, next) => {
  try {
    const stores = await storeService.listStores();
    res.json({ stores });
  } catch (error) {
    next(error);
  }
};
