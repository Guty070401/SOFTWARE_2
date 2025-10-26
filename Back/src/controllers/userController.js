const userService = require('../services/userService');

exports.getMe = (req, res, next) => {
  try {
    const profile = userService.getProfile(req.user.id);
    res.json({ user: profile });
  } catch (error) {
    next(error);
  }
};

exports.updateMe = (req, res, next) => {
  try {
    const profile = userService.updateProfile(req.user.id, {
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

exports.listCards = (req, res, next) => {
  try {
    const cards = userService.listCards(req.user.id);
    res.json({ cards });
  } catch (error) {
    next(error);
  }
};

exports.addCard = (req, res, next) => {
  try {
    const card = userService.addCard(req.user.id, {
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

exports.removeCard = (req, res, next) => {
  try {
    userService.removeCard(req.user.id, req.params.cardId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
