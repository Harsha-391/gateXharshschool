import fs from 'fs';
import path from 'path';

const dbPath = 'c:/Users/uttam rajpurrohit/OneDrive/Desktop/school/backend/tenants/db_greenvalley.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('--- ROLES ---');
console.log(db.roles.map(r => ({ name: r.name, active: r.active })));

console.log('--- STAFF CATEGORIES IN DB ---');
const staffCats = (db.staff || []).map(s => s.staffCategory || s.role);
console.log([...new Set(staffCats)]);
