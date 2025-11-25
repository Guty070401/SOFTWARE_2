// Servicio de correo centralizado (Nodemailer)
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const { APP_BASE_URL, BACKEND_SECRETS_DIR } = process.env;
const SECRET_BASE_PATH = BACKEND_SECRETS_DIR || '/var/run/secrets/backend';

let transporter = null;
let cachedConfig = null;

function readSecretValue(name) {
  try {
    const value = fs.readFileSync(path.join(SECRET_BASE_PATH, name), 'utf8');
    return value.trim();
  } catch (err) {
    return null;
  }
}

function getSmtpConfig() {
  if (cachedConfig) return cachedConfig;

  const host = readSecretValue('SMTP_HOST') || process.env.SMTP_HOST;
  const port = readSecretValue('SMTP_PORT') || process.env.SMTP_PORT;
  const user = readSecretValue('SMTP_USER') || process.env.SMTP_USER;
  const pass = readSecretValue('SMTP_PASS') || process.env.SMTP_PASS;
  const from = readSecretValue('SMTP_FROM') || process.env.SMTP_FROM;

  cachedConfig = { host, port, user, pass, from };
  return cachedConfig;
}

function ensureTransport() {
  if (transporter) return transporter;
  const { host, port, user, pass } = getSmtpConfig();
  if (!host || !port || !user || !pass) {
    throw new Error('Faltan variables SMTP en el entorno');
  }
  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: {
      user,
      pass
    }
  });
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const tx = ensureTransport();
  const { from, user } = getSmtpConfig();
  await tx.sendMail({ from: from || user, to, subject, text, html });
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
