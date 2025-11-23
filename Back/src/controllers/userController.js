const userService = require('../services/userService');

exports.getMe = (req, res, next) => {
  try {
    const result = userService.getProfile(req.user.id);
    if (result && typeof result.then === 'function') {
      result.then(profile => res.json({ user: profile })).catch(next);
    } else {
      res.json({ user: result });
    }
  } catch (error) {
    next(error);
  }
};

exports.updateMe = (req, res, next) => {
  try {
    const result = userService.updateProfile(req.user.id, {
      nombre: req.body.nombre ?? req.body.name,
      celular: req.body.celular ?? req.body.phone,
      foto: req.body.foto ?? req.body.photo,
      rol: req.body.rol
    });
    if (result && typeof result.then === 'function') {
      result.then(profile => res.json({ user: profile })).catch(next);
    } else {
      res.json({ user: result });
    }
  } catch (error) {
    next(error);
  }
};

exports.listCards = (req, res, next) => {
  try {
    const result = userService.listCards(req.user.id);
    if (result && typeof result.then === 'function') {
      result.then(cards => res.json({ cards })).catch(next);
    } else {
      res.json({ cards: result });
    }
  } catch (error) {
    next(error);
  }
};

exports.addCard = (req, res, next) => {
  try {
    const result = userService.addCard(req.user.id, {
      numeroTarjeta: req.body.numeroTarjeta ?? req.body.numero ?? req.body.number,
      vencimiento: req.body.vencimiento ?? req.body.expiration,
      csv: req.body.csv ?? req.body.cvv,
      titulo: req.body.titulo ?? req.body.title,
      foto: req.body.foto ?? null
    });
    if (result && typeof result.then === 'function') {
      result.then(card => res.status(201).json({ card })).catch(next);
    } else {
      res.status(201).json({ card: result });
    }
  } catch (error) {
    next(error);
  }
};

exports.removeCard = (req, res, next) => {
  try {
    const result = userService.removeCard(req.user.id, req.params.cardId);
    if (result && typeof result.then === 'function') {
      result.then(() => res.status(204).send()).catch(next);
    } else {
      res.status(204).send();
    }
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    await userService.changePassword(req.user.id, {
      oldPassword: req.body.oldPassword ?? req.body.current ?? req.body.actual,
      newPassword: req.body.newPassword ?? req.body.nueva ?? req.body.password
    });
    res.json({ message: 'Password actualizada' });
  } catch (error) {
    next(error);
  }
};
