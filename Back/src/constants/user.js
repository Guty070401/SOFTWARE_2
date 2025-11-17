const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]{2,60}$/;
const ALOE_EMAIL_REGEX = /^\d{8}@aloe\.ulima\.edu\.pe$/;
const PHONE_REGEX = /^9\d{8}$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/;

module.exports = {
  NAME_REGEX,
  ALOE_EMAIL_REGEX,
  PHONE_REGEX,
  PASSWORD_REGEX
};
