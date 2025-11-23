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
