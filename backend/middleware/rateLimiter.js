import rateLimit from 'express-rate-limit';

// Standard rate limiter factory
const makeLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message || 'Too many requests, please try again later.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
      // Dynamic TenantID + Client IP key generator
      const tenantId = req.headers['x-tenant-id'] || req.query.tenantId || 'platform';
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      return `${tenantId}_${clientIp}`;
    }
  });
};

// 1. Login Limit: max 10 requests per 15 minutes
export const loginLimiter = makeLimiter(
  15 * 60 * 1000,
  10,
  'Too many login attempts, please try again after 15 minutes.'
);

// 2. Forgot Password Limit: max 5 requests per 15 minutes
export const forgotPasswordLimiter = makeLimiter(
  15 * 60 * 1000,
  5,
  'Too many password reset requests, please try again after 15 minutes.'
);

// 3. QR Attendance scan Limit: max 30 requests per minute
export const qrAttendanceLimiter = makeLimiter(
  1 * 60 * 1000,
  30,
  'Too many QR attendance scans. Please wait a minute.'
);

// 4. Attendance APIs Limit: max 100 requests per 5 minutes
export const attendanceLimiter = makeLimiter(
  5 * 60 * 1000,
  100,
  'Too many attendance requests. Please wait a few minutes.'
);

// 5. Admin platform APIs Limit: max 300 requests per 5 minutes
export const adminLimiter = makeLimiter(
  5 * 60 * 1000,
  300,
  'Too many admin API requests.'
);

// 6. General Public APIs Limit: max 100 requests per 5 minutes
export const publicLimiter = makeLimiter(
  5 * 60 * 1000,
  100,
  'Too many requests.'
);
