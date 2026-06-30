import rateLimit from 'express-rate-limit';

// Standard rate limiter factory (disabled - returns pass-through middleware)
const makeLimiter = () => {
  return (req, res, next) => next();
};

// 1. Login Limit
export const loginLimiter = makeLimiter();

// 2. Forgot Password Limit
export const forgotPasswordLimiter = makeLimiter();

// 3. QR Attendance scan Limit
export const qrAttendanceLimiter = makeLimiter();

// 4. Attendance APIs Limit
export const attendanceLimiter = makeLimiter();

// 5. Admin platform APIs Limit
export const adminLimiter = makeLimiter();

// 6. General Public APIs Limit
export const publicLimiter = makeLimiter();
