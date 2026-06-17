import * as sqlDb from '../utils/sqlDb.js';

async function run() {
  try {
    console.log('Connecting to database...');
    const connected = await sqlDb.testConnection();
    if (!connected) {
      console.error('Could not connect to database.');
      process.exit(1);
    }
    
    console.log('Clearing database tables: grade_departments, grades, departments...');
    await sqlDb.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Delete for all tenants
    const res1 = await sqlDb.query('DELETE FROM grade_departments');
    const res2 = await sqlDb.query('DELETE FROM grades');
    const res3 = await sqlDb.query('DELETE FROM departments');
    
    await sqlDb.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Tables successfully cleared!');
    console.log(`Deleted from grade_departments: ${res1.affectedRows || 0} rows`);
    console.log(`Deleted from grades: ${res2.affectedRows || 0} rows`);
    console.log(`Deleted from departments: ${res3.affectedRows || 0} rows`);
    
    process.exit(0);
  } catch (err) {
    console.error('Failed to clear database tables:', err);
    process.exit(1);
  }
}

run();
