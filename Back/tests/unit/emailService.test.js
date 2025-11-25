const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue()
  }))
}));

const nodemailer = require('nodemailer');

function writeSecretFile(dir, name, value) {
  fs.writeFileSync(path.join(dir, name), value, 'utf8');
}

describe('emailService secrets loading', () => {
  const originalEnv = { ...process.env };
  let secretsDir;

  beforeEach(() => {
    jest.clearAllMocks();
    secretsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smtp-secrets-'));
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    fs.rmSync(secretsDir, { recursive: true, force: true });
    jest.resetModules();
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

    let emailService;
    jest.isolateModules(() => {
      emailService = require('../../src/services/emailService');
    });

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
