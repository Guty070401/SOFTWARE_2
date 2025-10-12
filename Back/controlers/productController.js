// src/controllers/productController.js
const productService = require('../services/productService');

exports.createProduct = async (req, res, next) => {
  try {
    const nuevoProd = await productService.createProduct(req.body);
    res.status(201).json(nuevoProd);
  } catch (error) {
    next(error);
  }
};

exports.listProducts = async (req, res, next) => {
  try {
    const productos = await productService.listProducts();
    res.json(productos);
  } catch (error) {
    next(error);
  }
};
