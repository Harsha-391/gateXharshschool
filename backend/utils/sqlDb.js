import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { tenantStorage } from './tenantContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const masterConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'uttam@2004',
  database: process.env.DB_NAME || 'school_management',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '5'),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

let masterPool;
const tenantPools = {};

try {
  masterPool = mysql.createPool(masterConfig);
  console.log(`[SQL Init] Created Master MySQL pool connecting to ${masterConfig.host}:${masterConfig.port}/${masterConfig.database}`);
} catch (error) {
  console.error('[SQL Init ERROR] Failed to initialize Master MySQL pool:', error);
}

// Slugify subdomain to use as database name safe identifier
const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export let dbMappings = {};

export const registerDbMapping = (subdomain, dbName) => {
  dbMappings[slugify(subdomain)] = dbName;
};

export const loadDbMappings = async () => {
  try {
    const [rows] = await masterPool.query('SELECT subdomain, dbName FROM schools');
    dbMappings = {};
    for (const r of rows) {
      if (r.subdomain) {
        dbMappings[slugify(r.subdomain)] = r.dbName || `school_${slugify(r.subdomain)}`;
      }
    }
    console.log('[SQL Map] Loaded subdomain database mappings:', dbMappings);
  } catch (err) {
    console.error('[SQL Map ERROR] Failed to load database mappings:', err.message);
  }
};

const getTenantDatabaseName = (tenantId) => {
  if (!tenantId || tenantId === 'platform' || tenantId === 'localhost') {
    return masterConfig.database;
  }
  const subdomain = slugify(tenantId);
  return dbMappings[subdomain] || `school_${subdomain}`;
};

export const getPoolForTenant = (tenantId) => {
  const dbName = getTenantDatabaseName(tenantId);
  if (dbName === masterConfig.database) {
    return masterPool;
  }

  if (tenantPools[dbName]) {
    return tenantPools[dbName];
  }

  const poolConfig = {
    ...masterConfig,
    database: dbName,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT_TENANT || '3') // Safe limit per school database
  };

  const pool = mysql.createPool(poolConfig);
  tenantPools[dbName] = pool;
  console.log(`[SQL Pool] Created pool for tenant database: ${dbName}`);
  return pool;
};

export const query = async (sql, params, explicitTenantId) => {
  let tenantId = explicitTenantId !== undefined ? explicitTenantId : tenantStorage.getStore();

  // If query targets global master tables, redirect it to the master pool
  const isGlobalQuery = /(?:FROM|INTO|UPDATE|JOIN|DELETE|TABLE|ON|DESCRIBE|DESC)\s+(?:IF\s+NOT\s+EXISTS\s+)?[\`"]?(schools|subscription_plans|roles|user_access|student_accounts|parent_accounts)[\`"]?/i.test(sql);
  if (isGlobalQuery) {
    tenantId = null; // force master pool
  }

  const pool = getPoolForTenant(tenantId);
  if (!pool) {
    throw new Error(`MySQL pool is not initialized for tenant: ${tenantId}`);
  }

  let safeParams = params;
  if (Array.isArray(params)) {
    safeParams = params.map(v => v === undefined ? null : v);
  }

  const [results] = await pool.query(sql, safeParams);
  return results;
};

export const getPool = () => masterPool;

export const testConnection = async () => {
  try {
    const conn = await masterPool.getConnection();
    console.log('[SQL Connect] Master MySQL Server Connected Successfully!');
    conn.release();
    return true;
  } catch (err) {
    console.error('[SQL Connect ERROR] Failed to connect to Master MySQL:', err.message);
    return false;
  }
};
