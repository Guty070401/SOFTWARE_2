const userService = require('../services/userService');

exports.getMe = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.id);
    res.json({ user: profile });
  } catch (error) {
    next(error);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const profile = await userService.updateProfile(req.user.id, {
      nombre: req.body.nombre ?? req.body.name,
      celular: req.body.celular ?? req.body.phone,
      foto: req.body.foto ?? req.body.photo,
      rol: req.body.rol
    });
    res.json({ user: profile });
  } catch (error) {
    next(error);
  }
};

exports.listCards = async (req, res, next) => {
  try {
    const cards = await userService.listCards(req.user.id);
    res.json({ cards });
  } catch (error) {
    next(error);
  }
};

exports.addCard = async (req, res, next) => {
  try {
    const card = await userService.addCard(req.user.id, {
      numeroTarjeta: req.body.numeroTarjeta ?? req.body.numero ?? req.body.number,
      vencimiento: req.body.vencimiento ?? req.body.expiration,
      csv: req.body.csv ?? req.body.cvv,
      titulo: req.body.titulo ?? req.body.title,
      foto: req.body.foto ?? null
    });
    res.status(201).json({ card });
  } catch (error) {
    next(error);
  }
};

exports.removeCard = async (req, res, next) => {
  try {
    await userService.removeCard(req.user.id, req.params.cardId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
