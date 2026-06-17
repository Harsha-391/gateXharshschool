import fs from 'fs';
import path from 'path';

const files = [
  'c:/Users/uttam rajpurrohit/OneDrive/Desktop/school/backend/db.json',
  'c:/Users/uttam rajpurrohit/OneDrive/Desktop/school/backend/tenants/db_default.json',
  'c:/Users/uttam rajpurrohit/OneDrive/Desktop/school/backend/tenants/db_greenvalley.json',
  'c:/Users/uttam rajpurrohit/OneDrive/Desktop/school/backend/tenants/db_test-school.json'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  console.log(`\nChecking file: ${path.basename(file)}`);
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const teachers = data.teachers || [];
    const staff = data.staff || [];
    const qrs = data.employeeQrCodes || [];
    
    const teacherIds = new Set(teachers.map(t => t.id));
    const staffIds = new Set(staff.map(s => s.id));
    
    console.log(`- Teachers count: ${teachers.length}`);
    console.log(`- Staff count: ${staff.length}`);
    console.log(`- QR Codes count: ${qrs.length}`);
    
    qrs.forEach(q => {
      if (q.employeeType === 'Teacher') {
        if (!teacherIds.has(q.employeeId)) {
          console.log(`  [ORPHAN] Teacher QR ID: ${q.id}, employeeId: ${q.employeeId}`);
        }
      } else if (q.employeeType === 'Staff') {
        if (!staffIds.has(q.employeeId)) {
          console.log(`  [ORPHAN] Staff QR ID: ${q.id}, employeeId: ${q.employeeId}`);
        }
      } else {
        console.log(`  [UNKNOWN] QR ID: ${q.id}, type: ${q.employeeType}`);
      }
    });
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});
