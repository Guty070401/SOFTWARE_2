const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { NAME_REGEX, ALOE_EMAIL_REGEX, PHONE_REGEX, PASSWORD_REGEX } = require('../constants/user');

const router = express.Router();

router.post(
  '/register',
  [
    body('nombre')
      .trim()
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ min: 2, max: 60 }).withMessage('El nombre debe tener entre 2 y 60 caracteres')
      .matches(NAME_REGEX).withMessage('El nombre solo admite letras y espacios'),
    body('correo')
      .trim()
      .notEmpty().withMessage('El correo es obligatorio')
      .matches(ALOE_EMAIL_REGEX).withMessage('Use su correo de la Universidad de Lima (8 dígitos + @aloe.ulima.edu.pe)'),
    body('telefono')
      .trim()
      .notEmpty().withMessage('El teléfono es obligatorio')
      .matches(PHONE_REGEX).withMessage('El teléfono debe tener 9 dígitos y empezar en 9'),
    body('password')
      .notEmpty().withMessage('La contraseña es obligatoria')
      .matches(PASSWORD_REGEX)
      .withMessage('La contraseña debe tener de 8 a 20 caracteres, con 1 mayúscula, 1 número y 1 símbolo'),
    body('confirmacion')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('La confirmación debe coincidir con la contraseña')
  ],
  validationMiddleware,
  authController.register
);

router.post(
  '/login',
  [
    body('correo').notEmpty().withMessage('El correo es obligatorio'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
  ],
  validationMiddleware,
  authController.login
);

module.exports = router;
