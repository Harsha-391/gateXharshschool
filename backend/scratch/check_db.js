import * as sqlDb from '../utils/sqlDb.js';

async function checkDb() {
  try {
    const tId = 'greenvalley';
    const grades = await sqlDb.query('SELECT * FROM grades WHERE tenantId = ?', [tId]);
    const departments = await sqlDb.query('SELECT * FROM departments WHERE tenantId = ?', [tId]);
    const gradeDepartments = await sqlDb.query('SELECT * FROM grade_departments WHERE tenantId = ?', [tId]);
    
    console.log('--- DB CHECK ---');
    console.log(`Grades (${grades.length}):`, grades);
    console.log(`Departments (${departments.length}):`, departments);
    console.log(`Mappings (${gradeDepartments.length}):`, gradeDepartments);
    process.exit(0);
  } catch (err) {
    console.error('Error checking DB:', err);
    process.exit(1);
  }
}

checkDb();
