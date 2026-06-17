import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'tenants', 'db_greenvalley.json');

try {
  if (fs.existsSync(dbPath)) {
    const rawData = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(rawData);
    
    // Clear grades, departments and gradeDepartments mappings
    db.grades = [];
    db.departments = [];
    db.gradeDepartments = [];
    
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('Successfully cleared grades, departments, and gradeDepartments in db_greenvalley.json');
  } else {
    console.error('db_greenvalley.json not found at ' + dbPath);
  }
} catch (error) {
  console.error('Error clearing json database:', error);
}
