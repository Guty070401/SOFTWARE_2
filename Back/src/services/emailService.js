// Servicio de correo centralizado (Nodemailer)
const nodemailer = require('nodemailer');

const SMTP_CONFIG = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para 465, false para otros puertos
  auth: {
    user: 'pierogutierrez0704@gmail.com', // <--- CAMBIA ESTO
    pass: 'bioa agwz coyh bijc'       // <--- CAMBIA ESTO POR TU CLAVE DE 16 LETRAS
  },
  from: 'pierogutierrez0704@gmail.com'    // <--- CAMBIA ESTO (Debe ser igual al user)
};

let transporter = null;

function ensureTransport() {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Faltan variables SMTP en el entorno');
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const tx = ensureTransport();
  const from = SMTP_FROM || SMTP_USER;
  await tx.sendMail({ from, to, subject, text, html });
}

function buildVerificationLink(token) {
  const base = APP_BASE_URL || 'http://localhost:5173';
  return `${base.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
}

function getVerificationLink(token) {
  return buildVerificationLink(token);
}

async function sendVerificationEmail({ to, nombre, token }) {
  const url = buildVerificationLink(token);
  const subject = 'Verifica tu correo';
  const html = `
    <p>Hola ${nombre || ''},</p>
    <p>Confirma tu correo haciendo clic en el siguiente enlace:</p>
    <p><a href="${url}">${url}</a></p>
    <p>Si no solicitaste esta cuenta, ignora este mensaje.</p>
  `;
  const text = `Hola ${nombre || ''},\nConfirma tu correo: ${url}\nSi no solicitaste esta cuenta, ignora este mensaje.`;
  await sendMail({ to, subject, html, text });
}

async function sendCardChargedEmail({ to, nombre, monto, orderId }) {
  const subject = 'Pago con tarjeta confirmado';
  const html = `
    <p>Hola ${nombre || ''},</p>
    <p>Tu pedido ${orderId} ha sido entregado. Se ha cobrado ${monto} a tu tarjeta.</p>
  `;
  const text = `Hola ${nombre || ''},\nTu pedido ${orderId} ha sido entregado. Se ha cobrado ${monto} a tu tarjeta.`;
  await sendMail({ to, subject, html, text });
}

async function sendCashAcceptedEmail({ to, nombre, monto, repartidor, orderId }) {
  const subject = 'Pedido aceptado - Pago en efectivo';
  const rider = repartidor ? ` Repartidor: ${repartidor}.` : '';
  const html = `
    <p>Hola ${nombre || ''},</p>
    <p>Tu pedido ${orderId} fue aceptado. Deberas pagar ${monto} en efectivo al entregar.${rider}</p>
  `;
  const text = `Hola ${nombre || ''},\nTu pedido ${orderId} fue aceptado. Deberas pagar ${monto} en efectivo al entregar.${rider}`;
  await sendMail({ to, subject, html, text });
}

async function sendCashDeliveredEmail({ to, nombre, monto, orderId }) {
  const subject = 'Pago en efectivo confirmado';
  const html = `
    <p>Hola ${nombre || ''},</p>
    <p>Tu pedido ${orderId} fue entregado y se confirmó el pago de ${monto} en efectivo.</p>
  `;
  const text = `Hola ${nombre || ''},\nTu pedido ${orderId} fue entregado y se confirmó el pago de ${monto} en efectivo.`;
  await sendMail({ to, subject, html, text });
}

module.exports = {
  sendMail,
  sendVerificationEmail,
  getVerificationLink,
  sendCardChargedEmail,
  sendCashAcceptedEmail,
  sendCashDeliveredEmail
};
