import jwt from 'jsonwebtoken';
import { tenantStorage, readDb, slugify } from '../utils/db.js';
import { logSecurity } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aether-erp-dashboard-super-secure-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'aether-erp-dashboard-refresh-secure-key-2026';

// In-memory blacklist for revoked JWT access tokens
const tokenBlacklist = new Set();

// Periodically clean up expired tokens from the blacklist set
setInterval(() => {
  const nowSec = Math.floor(Date.now() / 1000);
  for (const item of tokenBlacklist) {
    const parts = item.split(':');
    const exp = parseInt(parts[1], 10);
    if (exp < nowSec) {
      tokenBlacklist.delete(item);
    }
  }
}, 5 * 60 * 1000).unref();

export const blacklistToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      tokenBlacklist.add(`${token}:${decoded.exp}`);
    }
  } catch (err) {
    console.error('Failed to blacklist token:', err.message);
  }
};

export const isTokenBlacklisted = (token) => {
  for (const item of tokenBlacklist) {
    if (item.startsWith(token + ':')) {
      return true;
    }
  }
  return false;
};

export const auth = (req, res, next) => {
  let token = null;

  // 1. Try to read token from cookies first
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const val = parts.slice(1).join('=');
        cookies[name] = decodeURIComponent(val);
      }
    });
    if (cookies.token) {
      token = cookies.token;
    }
  }

  // 2. Fallback to Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Access denied. Authorization token missing.' });
  }

  if (isTokenBlacklisted(token)) {
    logSecurity('BLACKLISTED_TOKEN_USE', 'Attempted to use blacklisted/logged-out JWT token', req);
    return res.status(401).json({ error: 'Token is no longer valid (session logged out).' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.admin = verified;

    // Immediate Session Invalidation on Password Change for Main Admin
    if (verified.role === 'Main Admin') {
      try {
        const globalDb = readDb();
        const schoolRecord = (globalDb.schools || []).find(s => slugify(s.subdomain) === slugify(verified.tenantId));
        if (!schoolRecord || schoolRecord.adminPassword !== verified.passwordHash) {
          logSecurity('INVALIDATED_SESSION_USE', `Attempted to use session token with outdated password for '${verified.username}'`, req);
          return res.status(401).json({ error: 'Session invalidated. Password has been updated. Please log in again.' });
        }
      } catch (dbErr) {
        console.error('[Auth Middleware] Failed to check database password for token invalidation:', dbErr.message);
      }
    }

    // Cross-Tenant Access Prevention
    if (verified.role !== 'Developer Admin') {
      const activeTenant = tenantStorage.getStore();
      const tokenTenant = verified.tenantId;
      if (activeTenant && tokenTenant && activeTenant !== tokenTenant) {
        logSecurity('CROSS_TENANT_VIOLATION', `User '${verified.username || verified.id}' (Tenant: ${tokenTenant}) attempted to access Tenant: ${activeTenant}`, req);
        return res.status(403).json({ error: 'Access denied. Cross-tenant access forbidden.' });
      }
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired authorization token.' });
  }
};

// Generates access tokens with role-based expiration (Developer Admin: 365d, Others: 1h)
export const generateToken = (payload) => {
  const isDevAdmin = payload.role === 'Developer Admin';
  const expiresIn = isDevAdmin ? '365d' : '1h';
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Generates longer-lived refresh tokens (configured in .env, default 7 days)
export const generateRefreshToken = (payload) => {
  // Minimize payload size for refresh token
  const refreshPayload = {
    id: payload.id,
    tenantId: payload.tenantId,
    role: payload.role,
    userType: payload.userType,
    username: payload.username
  };
  return jwt.sign(refreshPayload, JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });
};

// Verifies a refresh token
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

// Helper: Sets httpOnly secure session cookie on response
export const setAuthCookie = (res, token, role) => {
  const isDevAdmin = role === 'Developer Admin';
  const maxAge = isDevAdmin ? 365 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // 1 year vs 1 hour
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: maxAge
  });
};

// Helper: Clears the session cookie on response
export const clearAuthCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  });
};
