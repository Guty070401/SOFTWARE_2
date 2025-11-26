const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue()
  }))
}));

let nodemailer;

function writeSecretFile(dir, name, value) {
  fs.writeFileSync(path.join(dir, name), value, 'utf8');
}

describe('emailService secrets loading', () => {
  const originalEnv = { ...process.env };
  let secretsDir;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    secretsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smtp-secrets-'));
    process.env = { ...originalEnv };
    nodemailer = require('nodemailer');
  });

  afterEach(() => {
    fs.rmSync(secretsDir, { recursive: true, force: true });
    jest.resetModules();
  });

  it('rechaza configuraciones SMTP con placeholders y arroja un error claro', async () => {
    process.env = {
      ...originalEnv,
      BACKEND_SECRETS_DIR: secretsDir,
      SMTP_HOST: '${SMTP_HOST:-}',
      SMTP_PORT: '${SMTP_PORT:-}',
      SMTP_USER: '${SMTP_USER:-}',
      SMTP_PASS: '${SMTP_PASS:-}'
    };

    const emailService = require('../../src/services/emailService');
    emailService._test.resetTransport();

    await expect(
      emailService.sendVerificationEmail({
        to: 'user@example.com',
        nombre: 'User',
        token: 'token123',
        baseUrl: 'http://frontend.local'
      })
    ).rejects.toThrow('SMTP');

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('prefers Kubernetes secret files over environment variables for SMTP config', async () => {
    writeSecretFile(secretsDir, 'SMTP_HOST', 'secret-host');
    writeSecretFile(secretsDir, 'SMTP_PORT', '587');
    writeSecretFile(secretsDir, 'SMTP_USER', 'secret-user');
    writeSecretFile(secretsDir, 'SMTP_PASS', 'secret-pass');
    writeSecretFile(secretsDir, 'SMTP_FROM', 'secret-from@example.com');

    process.env = {
      ...originalEnv,
      BACKEND_SECRETS_DIR: secretsDir,
      SMTP_HOST: 'env-host',
      SMTP_PORT: '465',
      SMTP_USER: 'env-user',
      SMTP_PASS: 'env-pass',
      SMTP_FROM: 'env-from@example.com'
    };

    const emailService = require('../../src/services/emailService');
    emailService._test.resetTransport();

    await emailService.sendVerificationEmail({
      to: 'user@example.com',
      nombre: 'User',
      token: 'token123',
      baseUrl: 'http://frontend.local'
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'secret-host',
      port: 587,
      secure: false,
      auth: {
        user: 'secret-user',
        pass: 'secret-pass'
      }
    });
  });
});
