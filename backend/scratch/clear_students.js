import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'uttam@2004',
  database: 'school_management'
};

const subdomain = 'greenvalley';

async function run() {
  let connection;
  try {
    // 1. Clear MySQL records
    connection = await mysql.createConnection(config);
    console.log('Connected to MySQL database successfully.');

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // List of student tables that cascade or contain student data
    const studentTables = [
      'student_enrollments',
      'parents',
      'addresses',
      'medical_records',
      'documents',
      'fee_assignments',
      'student_accounts',
      'parent_accounts',
      'students',
      'attendance',
      'results',
      'overall_results',
      'fees',
      'invoices'
    ];

    for (const table of studentTables) {
      // Delete rows matching tenantId
      const [res] = await connection.query(`DELETE FROM \`${table}\` WHERE tenantId = ?`, [subdomain]);
      console.log(`Deleted ${res.affectedRows || 0} rows from MySQL table '${table}'`);
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('MySQL student cleanup completed successfully.');

    // 2. Clear local JSON database
    const dbPath = path.join(__dirname, '..', 'tenants', `db_${subdomain}.json`);
    if (fs.existsSync(dbPath)) {
      const rawData = fs.readFileSync(dbPath, 'utf8');
      const db = JSON.parse(rawData);

      // Clear student related arrays
      db.students = [];
      db.attendance = [];
      db.results = [];
      db.overallResults = [];
      db.fees = [];
      db.invoices = [];
      db.feeStructures = []; // Clear fee structures if they are student class related

      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
      console.log(`Successfully cleared student-related lists in JSON fallback: ${dbPath}`);
    } else {
      console.warn(`JSON file not found: ${dbPath}`);
    }

  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
