const userService = require('../services/userService');

exports.profile = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.userEntity.id);
    res.json({ user: profile });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const profile = await userService.updateProfile(req.userEntity.id, {
      nombre: req.body.nombre,
      celular: req.body.telefono || req.body.celular,
      foto: req.body.foto,
      rol: req.body.rol
    });
    res.json({ user: profile });
  } catch (error) {
    next(error);
  }
};

exports.listCards = async (req, res, next) => {
  try {
    const cards = await userService.listCards(req.userEntity.id);
    res.json({ cards });
  } catch (error) {
    next(error);
  }
};

exports.addCard = async (req, res, next) => {
  try {
    const card = await userService.addCard(req.userEntity.id, req.body);
    res.status(201).json({ card });
  } catch (error) {
    next(error);
  }
};

exports.removeCard = async (req, res, next) => {
  try {
    await userService.removeCard(req.userEntity.id, req.params.cardId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
