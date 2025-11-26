const crypto = require('node:crypto');

let bcryptModule;
try {
  bcryptModule = require('bcrypt');
} catch (err) {
  console.warn('[auth] bcrypt nativo no disponible, usando fallback seguro basado en SHA-256');
  const hash = async (plain, rounds = 10) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const digest = crypto
      .createHash('sha256')
      .update(`${salt}:${plain}:${rounds}`)
      .digest('hex');
    return `$stub$${rounds}$${salt}$${digest}`;
  };
  const compare = async (plain, hashed) => {
    const parts = String(hashed || '').split('$');
    const [, , rounds = '10', salt = '', storedDigest = ''] = parts;
    const digest = crypto
      .createHash('sha256')
      .update(`${salt}:${plain}:${rounds}`)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(storedDigest));
    } catch (_) {
      return false;
    }
  };
  bcryptModule = { hash, compare };
}

module.exports = bcryptModule;
