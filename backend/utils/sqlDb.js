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
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  idleTimeout: 30000
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
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT_TENANT || '10') // Safe limit per school database
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

export const closeAllPools = async () => {
  if (masterPool) {
    try { await masterPool.end(); } catch (e) {}
  }
  for (const dbName in tenantPools) {
    try { await tenantPools[dbName].end(); } catch (e) {}
  }
};

export const testConnection = async () => {
  const maxRetries = 3;
  const retryDelay = 2000;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`[SQL Connect] Retrying connection to Master MySQL (${masterConfig.host}:${masterConfig.port})... Attempt ${attempt}/${maxRetries}`);
      }
      const conn = await masterPool.getConnection();
      console.log(`[SQL Connect] Master MySQL Server (${masterConfig.host}) Connected Successfully!`);
      conn.release();
      return true;
    } catch (err) {
      lastError = err;
      console.warn(`[SQL Connect Warning] Connection attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // If we reach here, the configured connection has failed all retries.
  // Check if we can fallback to local MySQL database.
  const isLocalHost = masterConfig.host === '127.0.0.1' || masterConfig.host === 'localhost';
  if (!isLocalHost) {
    console.log('[SQL Connect] Configured remote MySQL connection failed. Checking local MySQL fallback...');
    const localConfigs = [
      { host: '127.0.0.1', port: 3306, user: 'root', password: 'uttam@2004', database: 'school_management' },
      { host: 'localhost', port: 3306, user: 'root', password: 'uttam@2004', database: 'school_management' }
    ];

    for (const localConf of localConfigs) {
      try {
        const localConn = await mysql.createConnection({
          host: localConf.host,
          port: localConf.port,
          user: localConf.user,
          password: localConf.password,
          database: localConf.database,
          connectTimeout: 3000
        });
        await localConn.end();

        console.log(`\n======================================================================`);
        console.log(`[SQL Connect] WARNING: Failed to connect to remote MySQL server.`);
        console.log(`[SQL Connect] Automatically falling back to LOCAL MySQL (${localConf.host}:${localConf.port}).`);
        console.log(`======================================================================\n`);

        // Close current master pool
        if (masterPool) {
          try { await masterPool.end(); } catch (e) {}
        }

        // Dynamically override masterConfig properties in-place
        masterConfig.host = localConf.host;
        masterConfig.port = localConf.port;
        masterConfig.user = localConf.user;
        masterConfig.password = localConf.password;
        masterConfig.database = localConf.database;
        masterConfig.ssl = undefined;

        // Recreate masterPool with local credentials
        masterPool = mysql.createPool(masterConfig);
        return true;
      } catch (localErr) {
        // Silent fail on local attempt, try next one
      }
    }
  }

  console.error('[SQL Connect ERROR] Failed to connect to Master MySQL after all attempts:', lastError.message);
  return false;
};

export const removePoolForTenant = async (tenantId) => {
  const subdomain = slugify(tenantId);
  const dbName = dbMappings[subdomain] || `school_${subdomain}`;
  delete dbMappings[subdomain];
  
  if (tenantPools[dbName]) {
    try {
      await tenantPools[dbName].end();
    } catch (e) {
      console.error(`[SQL Pool] Failed to close pool for database ${dbName}:`, e.message);
    }
    delete tenantPools[dbName];
  }
  console.log(`[SQL Pool] Removed mapping and closed pool for tenant subdomain: ${subdomain}`);
};

