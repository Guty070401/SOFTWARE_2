const storeService = require('../services/storeService');

exports.listStores = (req, res, next) => {
  try {
    const stores = storeService.listStores();
    res.json({ stores });
  } catch (error) {
    next(error);
  }
};
