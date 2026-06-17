import jwt from 'jsonwebtoken';

const JWT_SECRET = 'aether-erp-dashboard-super-secure-key-2026';

export const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For sandbox ease, if it's local development we can permit standard requests or enforce token checks.
    // Let's implement full validation and return a 401 if missing, supporting a token sign in App.jsx.
    return res.status(401).json({ error: 'Access denied. Authorization token missing.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.admin = verified;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired authorization token.' });
  }
};

// Simple utility to sign tokens for sandbox logins
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
