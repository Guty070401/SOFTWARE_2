const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcrypt');
const { supabase } = require('../data/database');
const Usuario = require('../models/Usuario');
const emailService = require('./emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function resolveJwtExpires(raw) {
  const fallback = '24h';
  if (raw === undefined || raw === null) return fallback;
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return fallback;
  if (/\$\{[^}]+\}/.test(trimmed)) return fallback;

  try {
    // Valida el formato permitido por jsonwebtoken (número de segundos o timespan tipo "1d")
    jwt.sign({ ping: true }, 'tmp', { expiresIn: trimmed });
    return trimmed;
  } catch (err) {
    console.warn(`[auth] JWT_EXPIRES inválido ("${trimmed}"): ${err.message}. Usando ${fallback}.`);
    return fallback;
  }
}

const JWT_EXPIRES = resolveJwtExpires(process.env.JWT_EXPIRES);


async function findByEmail(email) {
  const normalized = email.toLowerCase();
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('correo', normalized)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function buildTokenPayload(user) {
  return { id: user.id, rol: user.rol };
}

function toPublicUser(row) {
  return {
    id: row.id,
    nombre: row.nombre_usuario,
    correo: row.correo,
    celular: row.celular,
    foto: row.foto,
    rol: row.rol,
    solucion: row.solucion,
    emailVerificado: !!row.email_verificado
  };
}

async function register({ nombre, correo, password, celular = '', rol = 'customer' }, { baseUrl } = {}) {
  const existing = await findByEmail(correo);
  if (existing) {
    const err = new Error('El correo ya esta registrado');
    err.status = 409;
    throw err;
  }

  const verificationToken = randomUUID();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const passwordHash = await bcrypt.hash(password, 10);

  const temp = new Usuario({
    nombreUsuario: nombre,
    correo,
    passwordHash,
    celular,
    rol
  });

  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      id: temp.id,
      nombre_usuario: temp.nombreUsuario,
      correo: temp.correo,
      celular: temp.celular,
      password_hash: temp.passwordHash,
      foto: temp.foto,
      rol: temp.rol,
      solucion: temp.solucion,
      email_verificado: false,
      email_verificacion_token: verificationToken,
      email_verificacion_expira: verificationExpires
    })
    .select()
    .single();

  if (error) throw error;

  emailService
    .sendVerificationEmail({ to: temp.correo, nombre: temp.nombreUsuario, token: verificationToken, baseUrl })
    .catch(err => console.error('[email] verification', err));

  return { user: toPublicUser(data) };
}

async function issueVerification(user, { baseUrl } = {}) {
  const now = Date.now();
  let verificationToken = user.email_verificacion_token;
  let verificationExpires = user.email_verificacion_expira;
  let verificationUrl = verificationToken ? emailService.getVerificationLink(verificationToken, baseUrl) : null;

  // Reutiliza el token vigente o genera uno nuevo si no existe o venció
  if (!verificationToken || !verificationExpires || new Date(verificationExpires).getTime() <= now) {
    verificationToken = randomUUID();
    verificationExpires = new Date(now + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('usuarios')
      .update({
        email_verificado: false,
        email_verificacion_token: verificationToken,
        email_verificacion_expira: verificationExpires
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    user = data;
    verificationUrl = emailService.getVerificationLink(verificationToken, baseUrl);
  }

  try {
    await emailService.sendVerificationEmail({
      to: user.correo,
      nombre: user.nombre_usuario,
      token: verificationToken,
      baseUrl
    });
    return { sent: true, token: verificationToken, verificationUrl };
  } catch (err) {
    console.error('[email] verification', err);
    return {
      sent: false,
      token: verificationToken,
      verificationUrl,
      reason: 'No se pudo enviar el correo de verificación. Usa el enlace directo para continuar.'
    };
  }
}

async function login({ correo, password }, { baseUrl } = {}) {
  const user = await findByEmail(correo);
  if (!user) {
    const err = new Error('Credenciales invalidas');
    err.status = 401;
    throw err;
  }
  let matches = false;
  if (user.password_hash) {
    try { matches = await bcrypt.compare(password, user.password_hash); } catch (_) {}
    if (!matches && user.password_hash === password) matches = true; // compatibilidad si guardado en plano
  }
  if (!matches) {
    const err = new Error('Credenciales invalidas');
    err.status = 401;
    throw err;
  }
  if (!user.email_verificado) {
    const verification = await issueVerification(user, { baseUrl });
    const err = new Error(
      verification.sent
        ? 'Debes verificar tu correo antes de iniciar sesion'
        : verification.reason || 'No se pudo enviar el correo de verificación'
    );
    err.status = 403;
    err.meta = {
      emailSent: verification.sent,
      verificationUrl: verification.verificationUrl,
      verificationToken: verification.token
    };
    throw err;
  }
  const token = jwt.sign(buildTokenPayload(user), JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { user: toPublicUser(user), token };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function getUserById(id) {
  const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data || null;
}

async function verifyEmail(token) {
  if (!token) {
    const err = new Error('Token requerido');
    err.status = 400;
    throw err;
  }
  const now = new Date().toISOString();
  const { data: user, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email_verificacion_token', token)
    .gt('email_verificacion_expira', now)
    .maybeSingle();
  if (error) throw error;
  if (!user) {
    const err = new Error('Token invalido o expirado');
    err.status = 400;
    throw err;
  }

  const { data: updated, error: errUpd } = await supabase
    .from('usuarios')
    .update({
      email_verificado: true,
      email_verificacion_token: null,
      email_verificacion_expira: null
    })
    .eq('id', user.id)
    .select()
    .single();
  if (errUpd) throw errUpd;

  const tokenJwt = jwt.sign(buildTokenPayload(updated), JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { user: toPublicUser(updated), token: tokenJwt };
}

module.exports = {
  register,
  login,
  verifyToken,
  getUserById,
  toPublicUser,
  verifyEmail,
  _resolveJwtExpires: resolveJwtExpires
};
