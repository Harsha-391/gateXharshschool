import { loadTenantSqlIntoMemory, isSqlActive, initSqlDb } from './utils/db.js';
import * as sqlDb from './utils/sqlDb.js';

async function test() {
  console.log('Testing connection to Aiven MySQL...');
  const connected = await sqlDb.testConnection();
  console.log('Connected:', connected);
  if (!connected) return;

  try {
    console.log('Initializing SQL db (loading mappings)...');
    await initSqlDb();
    console.log('SQL initialized successfully. isSqlActive():', isSqlActive());
  } catch (err) {
    console.error('SQL init error:', err);
  }

  try {
    console.log('Attempting to load tenant SQL for "aliquam"...');
    const data = await loadTenantSqlIntoMemory('aliquam');
    console.log('Successfully loaded tenant data! Keys found:', Object.keys(data));
  } catch (err) {
    console.error('FAILED to load tenant SQL for "aliquam":');
    console.error(err);
  }

  await sqlDb.closeAllPools();
}

test().catch(console.error);
