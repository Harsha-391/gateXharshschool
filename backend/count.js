import fs from 'fs';
const dbStr = fs.readFileSync('./tenants/db_greenvalley.json', 'utf8');
const db = JSON.parse(dbStr);
console.log('Total students:', db.students.length);
const statuses = {};
const classes = {};
const sections = {};
db.students.forEach(s => {
  statuses[s.status] = (statuses[s.status] || 0) + 1;
  classes[s.studentClass] = (classes[s.studentClass] || 0) + 1;
  sections[s.section] = (sections[s.section] || 0) + 1;
});
console.log('Statuses:', statuses);
console.log('Classes:', classes);
console.log('Sections:', sections);
console.log('First 5 students:', db.students.slice(0, 5).map(s => ({ id: s.id, name: s.name, status: s.status, class: s.studentClass, section: s.section, academicYear: s.academicYear })));
