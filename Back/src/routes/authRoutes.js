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
      .custom((value, { req }) => {
        const nombre = (value || req.body.name || '').trim();
        if (!nombre) {
          throw new Error('El nombre es obligatorio');
        }
        if (nombre.length < 2 || nombre.length > 60) {
          throw new Error('El nombre debe tener entre 2 y 60 caracteres');
        }
        if (!NAME_REGEX.test(nombre)) {
          throw new Error('El nombre solo admite letras y espacios');
        }
        req.body.nombre = nombre;
        return true;
      }),
    body('correo')
      .custom((value, { req }) => {
        const correo = (value || req.body.email || '').trim().toLowerCase();
        if (!correo) {
          throw new Error('El correo es obligatorio');
        }
        if (!ALOE_EMAIL_REGEX.test(correo)) {
          throw new Error('Use su correo de la Universidad de Lima (8 dígitos + @aloe.ulima.edu.pe)');
        }
        req.body.correo = correo;
        return true;
      }),
    body('telefono')
      .custom((value, { req }) => {
        const telefono = (value || req.body.celular || req.body.phone || '').trim();
        if (!telefono) {
          throw new Error('El teléfono es obligatorio');
        }
        if (!PHONE_REGEX.test(telefono)) {
          throw new Error('El teléfono debe tener 9 dígitos y empezar en 9');
        }
        req.body.telefono = telefono;
        return true;
      }),
    body('password')
      .notEmpty().withMessage('La contraseña es obligatoria')
      .matches(PASSWORD_REGEX)
      .withMessage('La contraseña debe tener de 8 a 20 caracteres, con 1 mayúscula, 1 número y 1 símbolo'),
    body('confirmacion')
      .custom((value, { req }) => {
        const confirmacion = value ?? req.body.confirm ?? req.body.confirmation;
        if (confirmacion === undefined || confirmacion === null || confirmacion === '') {
          req.body.confirmacion = req.body.password;
          return true;
        }
        if (confirmacion !== req.body.password) {
          throw new Error('La confirmación debe coincidir con la contraseña');
        }
        return true;
      })
  ],
  validationMiddleware,
  authController.register
);

router.post(
  '/login',
  [
    body('correo')
      .custom((value, { req }) => {
        const correo = (value || req.body.email || '').trim();
        if (!correo) {
          throw new Error('El correo es obligatorio');
        }
        req.body.correo = correo;
        return true;
      }),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
  ],
  validationMiddleware,
  authController.login
);

module.exports = router;
