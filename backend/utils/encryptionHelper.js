import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const secretKeyBase = process.env.JWT_SECRET || 'aether-erp-dashboard-super-secure-key-2026';
// Generate exact 32-byte key via hashing
const KEY = crypto.createHash('sha256').update(secretKeyBase).digest();
const ENCRYPTION_PREFIX = 'ENC::';

export const encrypt = (text) => {
  if (text === null || text === undefined || text === '') return '';
  const strText = String(text).trim();
  if (strText.startsWith(ENCRYPTION_PREFIX)) return strText; // Already encrypted

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(strText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return ENCRYPTION_PREFIX + iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (cipherText) => {
  if (cipherText === null || cipherText === undefined || cipherText === '') return '';
  const strText = String(cipherText).trim();
  if (!strText.startsWith(ENCRYPTION_PREFIX)) return strText; // Plaintext fallback

  try {
    const rawCipher = strText.substring(ENCRYPTION_PREFIX.length);
    const parts = rawCipher.split(':');
    if (parts.length !== 2) return strText;

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Decryption Error] Failed to decrypt field:', err.message);
    return strText; // Safe plaintext fallback
  }
};
