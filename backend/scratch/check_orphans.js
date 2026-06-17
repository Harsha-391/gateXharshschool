import fs from 'fs';

const data = JSON.parse(fs.readFileSync('c:/Users/uttam rajpurrohit/OneDrive/Desktop/school/backend/tenants/db_greenvalley.json', 'utf8'));

const teacherIds = new Set(data.teachers.map(t => t.id));
const staffIds = new Set(data.staff.map(s => s.id));

console.log("Teacher IDs in JSON:", Array.from(teacherIds));
console.log("Staff IDs in JSON:", Array.from(staffIds));

data.employeeQrCodes.forEach(q => {
  if (q.employeeType === 'Teacher') {
    if (!teacherIds.has(q.employeeId)) {
      console.log(`Orphan Teacher QR Code found! ID: ${q.id}, employeeId: ${q.employeeId}`);
    } else {
      console.log(`Valid Teacher QR Code: ID: ${q.id}, employeeId: ${q.employeeId}`);
    }
  } else if (q.employeeType === 'Staff') {
    if (!staffIds.has(q.employeeId)) {
      console.log(`Orphan Staff QR Code found! ID: ${q.id}, employeeId: ${q.employeeId}`);
    } else {
      console.log(`Valid Staff QR Code: ID: ${q.id}, employeeId: ${q.employeeId}`);
    }
  } else {
    console.log(`Unknown employee type in QR Code: ID: ${q.id}, type: ${q.employeeType}`);
  }
});
