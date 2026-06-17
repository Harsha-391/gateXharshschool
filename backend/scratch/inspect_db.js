import fs from 'fs';
import path from 'path';

const dbPath = 'c:/Users/uttam rajpurrohit/OneDrive/Desktop/school/backend/tenants/db_greenvalley.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('--- TEACHERS ---');
console.log(db.teachers.slice(0, 2));
