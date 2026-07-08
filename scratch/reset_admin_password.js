const fs = require('fs');
const path = require('path');
const mysql = require('../backend/node_modules/mysql2/promise');

async function run() {
  const dbJsonPath = path.join(__dirname, '..', 'backend', 'db.json');
  const dbJson = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
  
  // Find fatima tate
  const school = dbJson.schools.find(s => s.subdomain === 'minima');
  if (school) {
    console.log('Found minima school in db.json. Resetting password to admin123...');
    school.adminPassword = 'admin123';
    fs.writeFileSync(dbJsonPath, JSON.stringify(dbJson, null, 2), 'utf8');
  }

  // Also update MySQL
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'defaultdb',
    port: 3306
  });

  try {
    await pool.query("UPDATE schools SET adminPassword = 'admin123' WHERE subdomain = 'minima'");
    console.log('MySQL schools table updated successfully.');
  } catch (err) {
    console.error('MySQL update failed:', err.message);
  } finally {
    await pool.end();
  }
}

run().catch(console.error);
