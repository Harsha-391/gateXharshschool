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

// Lock check helper (Disabled - security lock removed)
export const checkLoginLock = (key) => {
  return { locked: false };
};

// Record a failed login attempt (Disabled - security lock removed)
export const recordFailedAttempt = (key) => {
  return { count: 0, lockUntil: null };
};

// Reset failed login attempt counter (Disabled - security lock removed)
export const resetFailedAttempts = (key) => {
  // Lock disabled
};
