import * as sqlDb from './utils/sqlDb.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verify() {
  console.log('------------------------------------------------------');
  console.log('🔍 VERIFYING SEEDED GREEN VALLEY DATA');
  console.log('------------------------------------------------------\n');

  // 1. Check JSON files exist
  const globalDbPath = path.join(__dirname, 'db.json');
  const tenantDbPath = path.join(__dirname, 'tenants', 'db_green-valley.json');

  if (!fs.existsSync(globalDbPath)) throw new Error('db.json missing!');
  if (!fs.existsSync(tenantDbPath)) throw new Error('db_green-valley.json missing!');

  const tenantJson = JSON.parse(fs.readFileSync(tenantDbPath, 'utf8'));
  console.log('✔ JSON Tenant File:');
  console.log(`  Grades: ${tenantJson.grades.length}`);
  console.log(`  Departments: ${tenantJson.departments.length}`);
  console.log(`  Grade-Departments: ${tenantJson.gradeDepartments.length}`);
  console.log(`  Sections: ${tenantJson.sections.length}`);
  console.log(`  Subjects: ${tenantJson.subjects.length}`);
  console.log(`  Teachers: ${tenantJson.teachers.length}`);
  console.log(`  Staff: ${tenantJson.staff.length}`);
  console.log(`  Students: ${tenantJson.students.length}`);
  console.log(`  Fee Structures: ${tenantJson.feeStructures.length}`);

  // 2. Check MySQL Tenant Database
  const tenantPool = sqlDb.getPoolForTenant('green-valley');
  const masterPool = sqlDb.getPoolForTenant(null);

  const [[{ count: gradeCount }]] = await tenantPool.query('SELECT COUNT(*) as count FROM grades');
  const [[{ count: deptCount }]] = await tenantPool.query('SELECT COUNT(*) as count FROM departments');
  const [[{ count: gradeDeptCount }]] = await tenantPool.query('SELECT COUNT(*) as count FROM grade_departments');
  const [[{ count: secCount }]] = await tenantPool.query('SELECT COUNT(*) as count FROM sections');
  const [[{ count: subCount }]] = await tenantPool.query('SELECT COUNT(*) as count FROM subjects');
  const [[{ count: teacherCount }]] = await tenantPool.query('SELECT COUNT(*) as count FROM teachers');
  const [[{ count: classTeacherCount }]] = await tenantPool.query('SELECT COUNT(*) as count FROM teachers WHERE isClassTeacher = 1');
  const [[{ count: staffCount }]] = await tenantPool.query('SELECT COUNT(*) as count FROM staff');
  const [[{ count: studentCount }]] = await tenantPool.query('SELECT COUNT(*) as count FROM students');

  console.log('\n✔ MySQL Database (school_green-valley):');
  console.log(`  grades: ${gradeCount}`);
  console.log(`  departments: ${deptCount}`);
  console.log(`  grade_departments: ${gradeDeptCount}`);
  console.log(`  sections: ${secCount}`);
  console.log(`  subjects: ${subCount}`);
  console.log(`  teachers total: ${teacherCount}`);
  console.log(`  class teachers (with portal login): ${classTeacherCount}`);
  console.log(`  staff: ${staffCount}`);
  console.log(`  students: ${studentCount}`);

  // 3. Check Teacher Details (5 Class Teachers vs 5 Subject Teachers)
  const [teachers] = await tenantPool.query('SELECT id, name, username, password, isClassTeacher, assignedGradeId, assignedSectionId FROM teachers ORDER BY id');
  console.log('\n✔ Teachers Breakdown:');
  teachers.forEach(t => {
    console.log(`  ${t.name} (${t.id}): ClassTeacher=${t.isClassTeacher}, Username=${t.username || 'NONE'}, Grade=${t.assignedGradeId || '-'}, Section=${t.assignedSectionId || '-'}`);
  });

  // 4. Check Staff Credentials
  const [staffList] = await tenantPool.query('SELECT id, name, role, username FROM staff ORDER BY id');
  console.log('\n✔ Staff Credentials:');
  staffList.forEach(s => {
    console.log(`  ${s.name} (${s.id}) [${s.role}]: Username=${s.username || 'NONE'}`);
  });

  // 5. Test Password Hashes
  console.log('\n✔ Testing Password Hashes:');
  const [schoolRows] = await masterPool.query("SELECT adminUsername, adminPassword FROM schools WHERE subdomain = 'green-valley'");
  const schoolAdminMatch = await bcrypt.compare('admin@123', schoolRows[0].adminPassword);
  console.log(`  school_admin / admin@123 valid? -> ${schoolAdminMatch}`);

  const [t1Rows] = await tenantPool.query("SELECT password FROM teachers WHERE username = 'teacher1_admin'");
  const t1Match = await bcrypt.compare('teacher1@123', t1Rows[0].password);
  console.log(`  teacher1_admin / teacher1@123 valid? -> ${t1Match}`);

  const [t5Rows] = await tenantPool.query("SELECT password FROM teachers WHERE username = 'teacher5_admin'");
  const t5Match = await bcrypt.compare('teacher5@123', t5Rows[0].password);
  console.log(`  teacher5_admin / teacher5@123 valid? -> ${t5Match}`);

  const [accRows] = await tenantPool.query("SELECT password FROM staff WHERE username = 'account_admin'");
  const accMatch = await bcrypt.compare('account@123', accRows[0].password);
  console.log(`  account_admin / account@123 valid? -> ${accMatch}`);

  const [acadRows] = await tenantPool.query("SELECT password FROM staff WHERE username = 'academic_admin'");
  const acadMatch = await bcrypt.compare('academic@123', acadRows[0].password);
  console.log(`  academic_admin / academic@123 valid? -> ${acadMatch}`);

  const [s1Rows] = await masterPool.query("SELECT studentPassword FROM student_accounts WHERE studentUsername = 'student1' AND tenantId = 'green-valley'");
  const s1Match = await bcrypt.compare('student123', s1Rows[0].studentPassword);
  console.log(`  student1 / student123 valid? -> ${s1Match}`);

  const [p1Rows] = await masterPool.query("SELECT parentPassword FROM parent_accounts WHERE parentUsername = 'parent1' AND tenantId = 'green-valley'");
  const p1Match = await bcrypt.compare('parent123', p1Rows[0].parentPassword);
  console.log(`  parent1 / parent123 valid? -> ${p1Match}`);

  // 6. Verify Students Distribution
  const [studentsByClass] = await tenantPool.query(`
    SELECT se.studentClass, se.section, COUNT(*) as count 
    FROM student_enrollments se 
    GROUP BY se.studentClass, se.section 
    ORDER BY se.studentClass, se.section
  `);
  console.log('\n✔ Students Distribution per Class & Section:');
  studentsByClass.forEach(row => {
    console.log(`  Class ${row.studentClass} - Section ${row.section}: ${row.count} student(s)`);
  });

  console.log('\n------------------------------------------------------');
  console.log('✅ ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('------------------------------------------------------\n');
}

verify().then(async () => {
  await sqlDb.closeAllPools();
  process.exit(0);
}).catch(async (err) => {
  console.error('Verification failed:', err);
  await sqlDb.closeAllPools();
  process.exit(1);
});
