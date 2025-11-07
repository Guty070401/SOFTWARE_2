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
