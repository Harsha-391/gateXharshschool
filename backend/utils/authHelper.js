import bcrypt from 'bcrypt';

// In-memory tracker for failed login attempts
const failedAttempts = new Map();

// Check if a string matches the standard bcrypt hash formatting
export const isBcryptHash = (str) => {
  return typeof str === 'string' && /^\$2[ayb]\$[0-9]{2}\$[./A-Za-z0-9]{53}$/.test(str);
};

// Hash password with salt rounds = 10
export const hashPassword = async (password) => {
  if (!password) return '';
  return await bcrypt.hash(password, 10);
};

// Verify password using bcrypt if hashed, else fall back to direct comparison
export const comparePassword = async (plaintext, storedPassword) => {
  if (!plaintext || !storedPassword) return false;
  if (isBcryptHash(storedPassword)) {
    try {
      return await bcrypt.compare(plaintext, storedPassword);
    } catch (e) {
      return false;
    }
  }
  // Plaintext comparison for migration
  return plaintext === storedPassword;
};

// Strong password strength policy (Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character)
export const validatePasswordStrength = (password) => {
  if (typeof password !== 'string') return false;
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return minLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;
};

// Lock check helper (5 failed attempts -> 15 min lock)
export const checkLoginLock = (key) => {
  const record = failedAttempts.get(key);
  if (!record) return { locked: false };
  
  const now = Date.now();
  if (record.lockUntil && now < record.lockUntil) {
    const remainingMinutes = Math.ceil((record.lockUntil - now) / (60 * 1000));
    return { locked: true, remainingMinutes };
  }
  
  if (record.lockUntil && now >= record.lockUntil) {
    failedAttempts.delete(key);
  }
  
  return { locked: false };
};

// Record a failed login attempt
export const recordFailedAttempt = (key) => {
  const now = Date.now();
  let record = failedAttempts.get(key);
  if (!record) {
    record = { count: 0, lockUntil: null };
  }
  
  // If count is reset because lock period expired but record was not deleted
  if (record.lockUntil && now >= record.lockUntil) {
    record.count = 0;
    record.lockUntil = null;
  }

  record.count += 1;
  if (record.count >= 5) {
    record.lockUntil = now + 15 * 60 * 1000; // 15-minute lock
  }
  failedAttempts.set(key, record);
  return record;
};

// Reset failed login attempt counter upon successful login
export const resetFailedAttempts = (key) => {
  failedAttempts.delete(key);
};
