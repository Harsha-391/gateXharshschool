import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'uttam@2004',
  database: process.env.DB_NAME || 'school_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

try {
  pool = mysql.createPool(config);
  console.log(`[SQL Init] Created MySQL pool connecting to ${config.host}:${config.port}/${config.database}`);
} catch (error) {
  console.error('[SQL Init ERROR] Failed to initialize MySQL pool:', error);
}

export const query = async (sql, params) => {
  if (!pool) {
    throw new Error('MySQL pool is not initialized');
  }
  let safeParams = params;
  if (Array.isArray(params)) {
    safeParams = params.map(v => v === undefined ? null : v);
  }
  const [results] = await pool.execute(sql, safeParams);
  return results;
};

export const getPool = () => pool;

export const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('[SQL Connect] MySQL Server Connected Successfully!');
    conn.release();
    return true;
  } catch (err) {
    console.error('[SQL Connect ERROR] Failed to connect to MySQL:', err.message);
    return false;
  }
};
