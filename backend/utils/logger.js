import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.join(__dirname, '..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Low-level write helper
const writeLog = (filename, message) => {
  const logPath = path.join(LOGS_DIR, filename);
  const timestamp = new Date().toISOString();
  fs.appendFile(logPath, `[${timestamp}] ${message}\n`, (err) => {
    if (err) {
      console.error(`[Logger Error] Failed to write log to ${filename}:`, err.message);
    }
  });
};

// 1. HTTP Access logging
export const logAccess = (req, res, responseTime) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const method = req.method;
  const url = req.originalUrl || req.url;
  const status = res.statusCode;
  const tenantId = req.headers['x-tenant-id'] || 'platform';
  const username = req.admin ? (req.admin.username || req.admin.id) : 'Anonymous';
  writeLog('access.log', `${ip} - ${tenantId} - ${username} - "${method} ${url}" ${status} - ${responseTime}ms`);
};

// 2. Exception/Error logging
export const logError = (err, req) => {
  const method = req ? req.method : 'N/A';
  const url = req ? (req.originalUrl || req.url) : 'N/A';
  const details = err.stack || err.message || err;
  writeLog('error.log', `[${method} ${url}] ${details}`);
};

// 3. Security logs (Failed logins, locks, cross-tenant blockades, bad signatures)
export const logSecurity = (event, details, req) => {
  const ip = req ? (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress) : '127.0.0.1';
  const tenantId = req ? (req.headers['x-tenant-id'] || 'platform') : 'platform';
  const username = req && req.admin ? (req.admin.username || req.admin.id) : 'Anonymous';
  writeLog('security.log', `${ip} - ${tenantId} - ${username} - EVENT: ${event} - DETAILS: ${details}`);
};

// 4. Critical business actions (CRUD, salary adjustments, structures)
export const logAudit = (action, target, details, req) => {
  const ip = req ? (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress) : '127.0.0.1';
  const tenantId = req ? (req.headers['x-tenant-id'] || 'platform') : 'platform';
  const username = req && req.admin ? (req.admin.username || req.admin.id) : 'System';
  writeLog('audit.log', `${ip} - ${tenantId} - ${username} - ACTION: ${action} - TARGET: ${target} - DETAILS: ${details}`);
};
