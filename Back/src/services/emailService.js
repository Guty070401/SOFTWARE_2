// Servicio de correo centralizado (Nodemailer)
const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  APP_BASE_URL
} = process.env;

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

function normalizeBaseUrl(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  // Evita valores de plantilla sin reemplazar como "${APP_BASE_URL}"
  if (!trimmed || /APP_BASE_URL/.test(trimmed) || /\$\{.+\}/.test(trimmed)) return null;

  // Agrega http:// si viene sin protocolo
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return url.origin;
  } catch (_) {
    return null;
  }
}

function resolveBaseUrl(preferredBaseUrl) {
  const candidates = [preferredBaseUrl, APP_BASE_URL, 'http://localhost:5173'];
  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate);
    if (normalized) return normalized.replace(/\/$/, '');
  }
  return 'http://localhost:5173';
}

function buildVerificationLink(token, baseUrl) {
  const base = resolveBaseUrl(baseUrl);
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
}

function getVerificationLink(token, baseUrl) {
  return buildVerificationLink(token, baseUrl);
}

async function sendVerificationEmail({ to, nombre, token, baseUrl }) {
  const url = buildVerificationLink(token, baseUrl);
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
