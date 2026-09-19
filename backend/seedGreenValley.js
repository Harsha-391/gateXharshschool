import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import * as sqlDb from './utils/sqlDb.js';
import { 
  executeSchemaOnPool, 
  applySchemaUpdates, 
  getDefaultRoles, 
  convertToRoman, 
  slugify, 
  readDb, 
  writeDb, 
  tenantStorage,
  saveMemoryDbToSql
} from './utils/db.js';
import { encrypt } from './utils/encryptionHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GLOBAL_DB_FILE = path.join(__dirname, 'db.json');
const TENANTS_DIR = path.join(__dirname, 'tenants');
const TENANT_DB_FILE = path.join(TENANTS_DIR, 'db_green-valley.json');

const hashPassword = async (password) => {
  if (!password) return '';
  return await bcrypt.hash(password, 10);
};

export const seedGreenValley = async () => {
  console.log('\n======================================================');
  console.log('🚀 SEEDING GREEN VALLEY SCHOOL (SMS)');
  console.log('======================================================\n');

  if (!fs.existsSync(TENANTS_DIR)) {
    fs.mkdirSync(TENANTS_DIR, { recursive: true });
  }

  const tenantId = 'green-valley';
  const dbName = `school_${tenantId}`;

  // 1. School Information
  const schoolRecord = {
    id: 'SCH-701',
    name: 'Green Valley',
    code: 'SCH-701',
    subdomain: 'green-valley',
    logo: '',
    principalName: 'Dr. Robert Green',
    email: 'admin@greenvalleyschool.edu',
    phone: '9876543210',
    address: '123 Valley Road, Green Valley Campus',
    city: 'Greenfield',
    state: 'California',
    country: 'India',
    academicSession: '2026-2027',
    subscriptionPlan: 'Enterprise',
    url: 'https://green-valley.myschoolerp.com',
    status: 'Active',
    adminName: 'School Admin',
    adminEmail: 'admin@greenvalleyschool.edu',
    adminUsername: 'school_admin',
    adminPassword: await hashPassword('admin@123'),
    dbName: dbName,
    ratePerStudent: '250.00',
    examTypes: JSON.stringify(['Term 1', 'Term 2', 'Final Exam']),
    eventTypes: JSON.stringify(['Sports', 'Cultural', 'Academic', 'Holiday']),
    noticeCategories: JSON.stringify(['Academic', 'Administrative', 'Examination', 'General']),
    holidayClassifications: JSON.stringify(['National Holiday', 'Festival', 'Vacation']),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 2. Grades, Department, and Sections
  const grades = [
    { id: 'grade-green-valley-i', name: 'I', status: 'Active', sections: ['A', 'B'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'grade-green-valley-ii', name: 'II', status: 'Active', sections: ['A', 'B'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'grade-green-valley-iii', name: 'III', status: 'Active', sections: ['A', 'B'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'grade-green-valley-iv', name: 'IV', status: 'Active', sections: ['A', 'B'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'grade-green-valley-xi', name: 'XI', status: 'Active', sections: ['A', 'B'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  const departments = [
    { id: 'dept-green-valley-arts', name: 'Arts', status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  const gradeDepartments = [
    {
      id: 'map-grade-green-valley-xi-dept-green-valley-arts',
      gradeId: 'grade-green-valley-xi',
      departmentId: 'dept-green-valley-arts',
      status: 'Active',
      sections: ['A', 'B'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const sections = [
    { id: 'sec-green-valley-a', name: 'A', status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sec-green-valley-b', name: 'B', status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  // 3. Subjects (Min 3 per class)
  const subjects = [
    // Class 1 (I)
    { id: 'SUB-GV-101', name: 'English', subjectName: 'English', code: 'ENG-101', classId: 'I', grade: 'I', teacherId: 'TCH-2026-1001', teacherName: 'Sarah Jenkins' },
    { id: 'SUB-GV-102', name: 'Mathematics', subjectName: 'Mathematics', code: 'MTH-101', classId: 'I', grade: 'I', teacherId: 'TCH-2026-1006', teacherName: 'James Wilson' },
    { id: 'SUB-GV-103', name: 'Environmental Studies', subjectName: 'Environmental Studies', code: 'EVS-101', classId: 'I', grade: 'I', teacherId: 'TCH-2026-1009', teacherName: 'Sophia Martinez' },
    // Class 2 (II)
    { id: 'SUB-GV-201', name: 'English', subjectName: 'English', code: 'ENG-102', classId: 'II', grade: 'II', teacherId: 'TCH-2026-1001', teacherName: 'Sarah Jenkins' },
    { id: 'SUB-GV-202', name: 'Mathematics', subjectName: 'Mathematics', code: 'MTH-102', classId: 'II', grade: 'II', teacherId: 'TCH-2026-1002', teacherName: 'Michael Chang' },
    { id: 'SUB-GV-203', name: 'Environmental Studies', subjectName: 'Environmental Studies', code: 'EVS-102', classId: 'II', grade: 'II', teacherId: 'TCH-2026-1009', teacherName: 'Sophia Martinez' },
    // Class 3 (III)
    { id: 'SUB-GV-301', name: 'English', subjectName: 'English', code: 'ENG-103', classId: 'III', grade: 'III', teacherId: 'TCH-2026-1001', teacherName: 'Sarah Jenkins' },
    { id: 'SUB-GV-302', name: 'Mathematics', subjectName: 'Mathematics', code: 'MTH-103', classId: 'III', grade: 'III', teacherId: 'TCH-2026-1002', teacherName: 'Michael Chang' },
    { id: 'SUB-GV-303', name: 'General Science', subjectName: 'General Science', code: 'SCI-103', classId: 'III', grade: 'III', teacherId: 'TCH-2026-1003', teacherName: 'Emily Rodriguez' },
    { id: 'SUB-GV-304', name: 'Social Studies', subjectName: 'Social Studies', code: 'SST-103', classId: 'III', grade: 'III', teacherId: 'TCH-2026-1004', teacherName: 'David Miller' },
    // Class 4 (IV)
    { id: 'SUB-GV-401', name: 'English', subjectName: 'English', code: 'ENG-104', classId: 'IV', grade: 'IV', teacherId: 'TCH-2026-1001', teacherName: 'Sarah Jenkins' },
    { id: 'SUB-GV-402', name: 'Mathematics', subjectName: 'Mathematics', code: 'MTH-104', classId: 'IV', grade: 'IV', teacherId: 'TCH-2026-1002', teacherName: 'Michael Chang' },
    { id: 'SUB-GV-403', name: 'General Science', subjectName: 'General Science', code: 'SCI-104', classId: 'IV', grade: 'IV', teacherId: 'TCH-2026-1003', teacherName: 'Emily Rodriguez' },
    { id: 'SUB-GV-404', name: 'Social Studies', subjectName: 'Social Studies', code: 'SST-104', classId: 'IV', grade: 'IV', teacherId: 'TCH-2026-1004', teacherName: 'David Miller' },
    // Class 11 Arts (XI (Arts))
    { id: 'SUB-GV-1101', name: 'History', subjectName: 'History', code: 'HIS-111', classId: 'XI (Arts)', grade: 'XI (Arts)', teacherId: 'TCH-2026-1005', teacherName: 'Ananya Sharma' },
    { id: 'SUB-GV-1102', name: 'Political Science', subjectName: 'Political Science', code: 'POL-111', classId: 'XI (Arts)', grade: 'XI (Arts)', teacherId: 'TCH-2026-1007', teacherName: 'Priya Patel' },
    { id: 'SUB-GV-1103', name: 'Economics', subjectName: 'Economics', code: 'ECO-111', classId: 'XI (Arts)', grade: 'XI (Arts)', teacherId: 'TCH-2026-1008', teacherName: 'Robert Brown' },
    { id: 'SUB-GV-1104', name: 'English Literature', subjectName: 'English Literature', code: 'ENG-111', classId: 'XI (Arts)', grade: 'XI (Arts)', teacherId: 'TCH-2026-1010', teacherName: 'Daniel Lee' }
  ];

  // 4. 10 Teachers (5 Class Teachers with login credentials, 5 Subject Teachers without credentials)
  const teachers = [
    // Class Teacher 1 -> Class I
    {
      id: 'TCH-2026-1001',
      employeeId: 'TCH-2026-1001',
      name: 'Sarah Jenkins',
      fullName: 'Sarah Jenkins',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah.jenkins@greenvalley.edu',
      phone: '9871000001',
      username: 'teacher1_admin',
      password: await hashPassword('teacher1@123'),
      gender: 'Female',
      isClassTeacher: 1,
      attendancePermission: 1,
      assignedGradeId: 'grade-green-valley-i',
      assignedSectionId: 'A',
      primarySubject: 'English',
      secondarySubject: 'Environmental Studies',
      department: 'Primary Department',
      qualification: 'M.A. English, B.Ed',
      experience: '6 Years',
      status: 'Active',
      joiningDate: '2022-06-15',
      salaryGrade: 'Grade-A'
    },
    // Class Teacher 2 -> Class II
    {
      id: 'TCH-2026-1002',
      employeeId: 'TCH-2026-1002',
      name: 'Michael Chang',
      fullName: 'Michael Chang',
      firstName: 'Michael',
      lastName: 'Chang',
      email: 'michael.chang@greenvalley.edu',
      phone: '9871000002',
      username: 'teacher2_admin',
      password: await hashPassword('teacher2@123'),
      gender: 'Male',
      isClassTeacher: 1,
      attendancePermission: 1,
      assignedGradeId: 'grade-green-valley-ii',
      assignedSectionId: 'A',
      primarySubject: 'Mathematics',
      secondarySubject: 'Science',
      department: 'Primary Department',
      qualification: 'M.Sc Mathematics, B.Ed',
      experience: '7 Years',
      status: 'Active',
      joiningDate: '2021-07-10',
      salaryGrade: 'Grade-A'
    },
    // Class Teacher 3 -> Class III
    {
      id: 'TCH-2026-1003',
      employeeId: 'TCH-2026-1003',
      name: 'Emily Rodriguez',
      fullName: 'Emily Rodriguez',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.rodriguez@greenvalley.edu',
      phone: '9871000003',
      username: 'teacher3_admin',
      password: await hashPassword('teacher3@123'),
      gender: 'Female',
      isClassTeacher: 1,
      attendancePermission: 1,
      assignedGradeId: 'grade-green-valley-iii',
      assignedSectionId: 'A',
      primarySubject: 'General Science',
      secondarySubject: 'Biology',
      department: 'Primary Department',
      qualification: 'M.Sc Biology, B.Ed',
      experience: '5 Years',
      status: 'Active',
      joiningDate: '2023-04-01',
      salaryGrade: 'Grade-A'
    },
    // Class Teacher 4 -> Class IV
    {
      id: 'TCH-2026-1004',
      employeeId: 'TCH-2026-1004',
      name: 'David Miller',
      fullName: 'David Miller',
      firstName: 'David',
      lastName: 'Miller',
      email: 'david.miller@greenvalley.edu',
      phone: '9871000004',
      username: 'teacher4_admin',
      password: await hashPassword('teacher4@123'),
      gender: 'Male',
      isClassTeacher: 1,
      attendancePermission: 1,
      assignedGradeId: 'grade-green-valley-iv',
      assignedSectionId: 'A',
      primarySubject: 'Social Studies',
      secondarySubject: 'Geography',
      department: 'Primary Department',
      qualification: 'M.A. History, B.Ed',
      experience: '8 Years',
      status: 'Active',
      joiningDate: '2020-08-15',
      salaryGrade: 'Grade-A'
    },
    // Class Teacher 5 -> Class XI (Arts)
    {
      id: 'TCH-2026-1005',
      employeeId: 'TCH-2026-1005',
      name: 'Ananya Sharma',
      fullName: 'Ananya Sharma',
      firstName: 'Ananya',
      lastName: 'Sharma',
      email: 'ananya.sharma@greenvalley.edu',
      phone: '9871000005',
      username: 'teacher5_admin',
      password: await hashPassword('teacher5@123'),
      gender: 'Female',
      isClassTeacher: 1,
      attendancePermission: 1,
      assignedGradeId: 'grade-green-valley-xi',
      assignedSectionId: 'A',
      primarySubject: 'History',
      secondarySubject: 'Political Science',
      department: 'Arts Department',
      qualification: 'Ph.D History, M.Ed',
      experience: '10 Years',
      status: 'Active',
      joiningDate: '2019-06-20',
      salaryGrade: 'Grade-A'
    },
    // Subject Teachers (6 - 10, No Portal Credentials)
    {
      id: 'TCH-2026-1006',
      employeeId: 'TCH-2026-1006',
      name: 'James Wilson',
      fullName: 'James Wilson',
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@greenvalley.edu',
      phone: '9871000006',
      username: null,
      password: null,
      gender: 'Male',
      isClassTeacher: 0,
      attendancePermission: 0,
      primarySubject: 'Mathematics',
      department: 'Secondary Department',
      qualification: 'M.Sc Mathematics',
      experience: '4 Years',
      status: 'Active',
      joiningDate: '2023-08-01'
    },
    {
      id: 'TCH-2026-1007',
      employeeId: 'TCH-2026-1007',
      name: 'Priya Patel',
      fullName: 'Priya Patel',
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@greenvalley.edu',
      phone: '9871000007',
      username: null,
      password: null,
      gender: 'Female',
      isClassTeacher: 0,
      attendancePermission: 0,
      primarySubject: 'Political Science',
      department: 'Arts Department',
      qualification: 'M.A. Political Science',
      experience: '5 Years',
      status: 'Active',
      joiningDate: '2022-09-10'
    },
    {
      id: 'TCH-2026-1008',
      employeeId: 'TCH-2026-1008',
      name: 'Robert Brown',
      fullName: 'Robert Brown',
      firstName: 'Robert',
      lastName: 'Brown',
      email: 'robert.brown@greenvalley.edu',
      phone: '9871000008',
      username: null,
      password: null,
      gender: 'Male',
      isClassTeacher: 0,
      attendancePermission: 0,
      primarySubject: 'Economics',
      department: 'Arts Department',
      qualification: 'M.A. Economics',
      experience: '6 Years',
      status: 'Active',
      joiningDate: '2021-11-05'
    },
    {
      id: 'TCH-2026-1009',
      employeeId: 'TCH-2026-1009',
      name: 'Sophia Martinez',
      fullName: 'Sophia Martinez',
      firstName: 'Sophia',
      lastName: 'Martinez',
      email: 'sophia.martinez@greenvalley.edu',
      phone: '9871000009',
      username: null,
      password: null,
      gender: 'Female',
      isClassTeacher: 0,
      attendancePermission: 0,
      primarySubject: 'Environmental Studies',
      department: 'Primary Department',
      qualification: 'M.Sc Environmental Science',
      experience: '3 Years',
      status: 'Active',
      joiningDate: '2024-02-01'
    },
    {
      id: 'TCH-2026-1010',
      employeeId: 'TCH-2026-1010',
      name: 'Daniel Lee',
      fullName: 'Daniel Lee',
      firstName: 'Daniel',
      lastName: 'Lee',
      email: 'daniel.lee@greenvalley.edu',
      phone: '9871000010',
      username: null,
      password: null,
      gender: 'Male',
      isClassTeacher: 0,
      attendancePermission: 0,
      primarySubject: 'English Literature',
      department: 'Arts Department',
      qualification: 'M.A. English Literature',
      experience: '7 Years',
      status: 'Active',
      joiningDate: '2020-03-15'
    }
  ];

  // 5. 10 Staff Entries
  const staff = [
    // Staff 1 - Accountant (account_admin / account@123)
    {
      id: 'STF-2026-1001',
      employeeId: 'STF-2026-1001',
      name: 'Thomas Wright',
      fullName: 'Thomas Wright',
      firstName: 'Thomas',
      lastName: 'Wright',
      email: 'accountant@greenvalley.edu',
      phone: '9872000001',
      username: 'account_admin',
      password: await hashPassword('account@123'),
      gender: 'Male',
      role: 'Accountant',
      designation: 'Accountant',
      department: 'Accounts & Finance',
      status: 'Active',
      hasRole: 'Yes',
      joiningDate: '2021-04-10',
      employmentType: 'Full-Time'
    },
    // Staff 2 - Academic Manager (academic_admin / academic@123)
    {
      id: 'STF-2026-1002',
      employeeId: 'STF-2026-1002',
      name: 'Dr. Eleanor Vance',
      fullName: 'Dr. Eleanor Vance',
      firstName: 'Eleanor',
      lastName: 'Vance',
      email: 'academic@greenvalley.edu',
      phone: '9872000002',
      username: 'academic_admin',
      password: await hashPassword('academic@123'),
      gender: 'Female',
      role: 'Academic Coordinator',
      designation: 'Academic Coordinator',
      department: 'Academic Administration',
      status: 'Active',
      hasRole: 'Yes',
      joiningDate: '2020-06-01',
      employmentType: 'Full-Time'
    },
    // Staff 3 - Receptionist (reception_admin / reception@123)
    {
      id: 'STF-2026-1003',
      employeeId: 'STF-2026-1003',
      name: 'Clara Oswald',
      fullName: 'Clara Oswald',
      firstName: 'Clara',
      lastName: 'Oswald',
      email: 'reception@greenvalley.edu',
      phone: '9872000003',
      username: 'reception_admin',
      password: await hashPassword('reception@123'),
      gender: 'Female',
      role: 'Receptionist',
      designation: 'Receptionist',
      department: 'Front Office',
      status: 'Active',
      hasRole: 'Yes',
      joiningDate: '2023-01-15',
      employmentType: 'Full-Time'
    },
    // Staff 4 - Expense Manager (expense_admin / expense@123)
    {
      id: 'STF-2026-1004',
      employeeId: 'STF-2026-1004',
      name: 'Arthur Pendelton',
      fullName: 'Arthur Pendelton',
      firstName: 'Arthur',
      lastName: 'Pendelton',
      email: 'expense@greenvalley.edu',
      phone: '9872000004',
      username: 'expense_admin',
      password: await hashPassword('expense@123'),
      gender: 'Male',
      role: 'Expense Manager',
      designation: 'Expense Manager',
      department: 'Accounts & Finance',
      status: 'Active',
      hasRole: 'Yes',
      joiningDate: '2022-03-20',
      employmentType: 'Full-Time'
    },
    // Staff 5 - Senior Accountant (account2_admin / account2@123)
    {
      id: 'STF-2026-1005',
      employeeId: 'STF-2026-1005',
      name: 'George Costanza',
      fullName: 'George Costanza',
      firstName: 'George',
      lastName: 'Costanza',
      email: 'george.c@greenvalley.edu',
      phone: '9872000005',
      username: 'account2_admin',
      password: await hashPassword('account2@123'),
      gender: 'Male',
      role: 'Accountant',
      designation: 'Accountant',
      department: 'Accounts & Finance',
      status: 'Active',
      hasRole: 'Yes',
      joiningDate: '2022-08-01',
      employmentType: 'Full-Time'
    },
    // Staff 6 - Associate Academic Coordinator (academic2_admin / academic2@123)
    {
      id: 'STF-2026-1006',
      employeeId: 'STF-2026-1006',
      name: 'Rachel Green',
      fullName: 'Rachel Green',
      firstName: 'Rachel',
      lastName: 'Green',
      email: 'rachel.g@greenvalley.edu',
      phone: '9872000006',
      username: 'academic2_admin',
      password: await hashPassword('academic2@123'),
      gender: 'Female',
      role: 'Academic Coordinator',
      designation: 'Academic Coordinator',
      department: 'Academic Administration',
      status: 'Active',
      hasRole: 'Yes',
      joiningDate: '2023-05-10',
      employmentType: 'Full-Time'
    },
    // Staff 7 - Front Desk Assistant (reception2_admin / reception2@123)
    {
      id: 'STF-2026-1007',
      employeeId: 'STF-2026-1007',
      name: 'Pam Beesly',
      fullName: 'Pam Beesly',
      firstName: 'Pam',
      lastName: 'Beesly',
      email: 'pam.b@greenvalley.edu',
      phone: '9872000007',
      username: 'reception2_admin',
      password: await hashPassword('reception2@123'),
      gender: 'Female',
      role: 'Receptionist',
      designation: 'Receptionist',
      department: 'Front Office',
      status: 'Active',
      hasRole: 'Yes',
      joiningDate: '2024-01-10',
      employmentType: 'Full-Time'
    },
    // Staff 8 - Accounts Officer (account3_admin / account3@123)
    {
      id: 'STF-2026-1008',
      employeeId: 'STF-2026-1008',
      name: 'Kevin Malone',
      fullName: 'Kevin Malone',
      firstName: 'Kevin',
      lastName: 'Malone',
      email: 'kevin.m@greenvalley.edu',
      phone: '9872000008',
      username: 'account3_admin',
      password: await hashPassword('account3@123'),
      gender: 'Male',
      role: 'Accountant',
      designation: 'Accountant',
      department: 'Accounts & Finance',
      status: 'Active',
      hasRole: 'Yes',
      joiningDate: '2023-09-01',
      employmentType: 'Full-Time'
    },
    // Staff 9 - Curriculum Supervisor (academic3_admin / academic3@123)
    {
      id: 'STF-2026-1009',
      employeeId: 'STF-2026-1009',
      name: 'Monica Geller',
      fullName: 'Monica Geller',
      firstName: 'Monica',
      lastName: 'Geller',
      email: 'monica.g@greenvalley.edu',
      phone: '9872000009',
      username: 'academic3_admin',
      password: await hashPassword('academic3@123'),
      gender: 'Female',
      role: 'Academic Coordinator',
      designation: 'Academic Coordinator',
      department: 'Academic Administration',
      status: 'Active',
      hasRole: 'Yes',
      joiningDate: '2021-12-01',
      employmentType: 'Full-Time'
    },
    // Staff 10 - Expense Officer (expense2_admin / expense2@123)
    {
      id: 'STF-2026-1010',
      employeeId: 'STF-2026-1010',
      name: 'Oscar Martinez',
      fullName: 'Oscar Martinez',
      firstName: 'Oscar',
      lastName: 'Martinez',
      email: 'oscar.m@greenvalley.edu',
      phone: '9872000010',
      username: 'expense2_admin',
      password: await hashPassword('expense2@123'),
      gender: 'Male',
      role: 'Expense Manager',
      designation: 'Expense Manager',
      department: 'Accounts & Finance',
      status: 'Active',
      hasRole: 'Yes',
      joiningDate: '2022-10-15',
      employmentType: 'Full-Time'
    }
  ];

  // User access mappings for Staff
  const userAccess = staff.map(s => {
    let roleId = 'role-receptionist';
    if (s.role === 'Accountant') roleId = 'role-accountant';
    else if (s.role === 'Academic Coordinator') roleId = 'role-academic-coordinator';
    else if (s.role === 'Expense Manager') roleId = 'role-expense-manager';

    return {
      id: `access-${s.id}`,
      userId: s.id,
      userName: s.fullName,
      userType: 'Staff',
      roleId: roleId,
      status: 'Active',
      overrides: {},
      updatedAt: new Date().toISOString()
    };
  });

  // 6. 10 Students (Distributed across Grade I, II, III, IV, and XI (Arts), Sec A & B)
  const students = [
    {
      id: 'STU-2026-0001',
      admissionNumber: 'GV-2026-0001',
      rollNumber: '1',
      name: 'Aarav Sharma',
      fullName: 'Aarav Sharma',
      firstName: 'Aarav',
      lastName: 'Sharma',
      studentClass: 'I',
      section: 'A',
      dob: '2020-04-12',
      gender: 'Male',
      bloodGroup: 'B+',
      email: 'aarav.sharma@example.com',
      phone: '9811000001',
      status: 'Active',
      admissionDate: '2026-04-01',
      fatherName: 'Rajesh Sharma',
      fatherMobile: '9811000011',
      motherName: 'Sunita Sharma',
      motherMobile: '9811000021',
      address: 'House 11, Green Valley Avenue',
      city: 'Greenfield',
      state: 'California',
      pincode: '94016',
      studentUsername: 'student1',
      studentPassword: await hashPassword('student123'),
      parentUsername: 'parent1',
      parentPassword: await hashPassword('parent123'),
      feeStatus: 'Paid'
    },
    {
      id: 'STU-2026-0002',
      admissionNumber: 'GV-2026-0002',
      rollNumber: '2',
      name: 'Diya Patel',
      fullName: 'Diya Patel',
      firstName: 'Diya',
      lastName: 'Patel',
      studentClass: 'I',
      section: 'B',
      dob: '2020-07-22',
      gender: 'Female',
      bloodGroup: 'O+',
      email: 'diya.patel@example.com',
      phone: '9811000002',
      status: 'Active',
      admissionDate: '2026-04-01',
      fatherName: 'Vikram Patel',
      fatherMobile: '9811000012',
      motherName: 'Kavita Patel',
      motherMobile: '9811000022',
      address: 'Flat 202, Valley Heights',
      city: 'Greenfield',
      state: 'California',
      pincode: '94016',
      studentUsername: 'student2',
      studentPassword: await hashPassword('student123'),
      parentUsername: 'parent2',
      parentPassword: await hashPassword('parent123'),
      feeStatus: 'Pending'
    },
    {
      id: 'STU-2026-0003',
      admissionNumber: 'GV-2026-0003',
      rollNumber: '1',
      name: 'Rohan Gupta',
      fullName: 'Rohan Gupta',
      firstName: 'Rohan',
      lastName: 'Gupta',
      studentClass: 'II',
      section: 'A',
      dob: '2019-03-15',
      gender: 'Male',
      bloodGroup: 'A+',
      email: 'rohan.gupta@example.com',
      phone: '9811000003',
      status: 'Active',
      admissionDate: '2025-04-01',
      fatherName: 'Sanjay Gupta',
      fatherMobile: '9811000013',
      motherName: 'Pooja Gupta',
      motherMobile: '9811000023',
      address: 'Plot 45, Pine Crest Street',
      city: 'Greenfield',
      state: 'California',
      pincode: '94016',
      studentUsername: 'student3',
      studentPassword: await hashPassword('student123'),
      parentUsername: 'parent3',
      parentPassword: await hashPassword('parent123'),
      feeStatus: 'Paid'
    },
    {
      id: 'STU-2026-0004',
      admissionNumber: 'GV-2026-0004',
      rollNumber: '2',
      name: 'Ananya Iyer',
      fullName: 'Ananya Iyer',
      firstName: 'Ananya',
      lastName: 'Iyer',
      studentClass: 'II',
      section: 'B',
      dob: '2019-09-08',
      gender: 'Female',
      bloodGroup: 'AB+',
      email: 'ananya.iyer@example.com',
      phone: '9811000004',
      status: 'Active',
      admissionDate: '2025-04-01',
      fatherName: 'Ramesh Iyer',
      fatherMobile: '9811000014',
      motherName: 'Lakshmi Iyer',
      motherMobile: '9811000024',
      address: 'Bunglow 9, Riverfront View',
      city: 'Greenfield',
      state: 'California',
      pincode: '94016',
      studentUsername: 'student4',
      studentPassword: await hashPassword('student123'),
      parentUsername: 'parent4',
      parentPassword: await hashPassword('parent123'),
      feeStatus: 'Paid'
    },
    {
      id: 'STU-2026-0005',
      admissionNumber: 'GV-2026-0005',
      rollNumber: '1',
      name: 'Kabir Mehta',
      fullName: 'Kabir Mehta',
      firstName: 'Kabir',
      lastName: 'Mehta',
      studentClass: 'III',
      section: 'A',
      dob: '2018-05-19',
      gender: 'Male',
      bloodGroup: 'O-',
      email: 'kabir.mehta@example.com',
      phone: '9811000005',
      status: 'Active',
      admissionDate: '2024-04-01',
      fatherName: 'Amit Mehta',
      fatherMobile: '9811000015',
      motherName: 'Ritu Mehta',
      motherMobile: '9811000025',
      address: 'Villa 14, Orchard Lane',
      city: 'Greenfield',
      state: 'California',
      pincode: '94016',
      studentUsername: 'student5',
      studentPassword: await hashPassword('student123'),
      parentUsername: 'parent5',
      parentPassword: await hashPassword('parent123'),
      feeStatus: 'Pending'
    },
    {
      id: 'STU-2026-0006',
      admissionNumber: 'GV-2026-0006',
      rollNumber: '2',
      name: 'Ishita Joshi',
      fullName: 'Ishita Joshi',
      firstName: 'Ishita',
      lastName: 'Joshi',
      studentClass: 'III',
      section: 'B',
      dob: '2018-11-28',
      gender: 'Female',
      bloodGroup: 'B+',
      email: 'ishita.joshi@example.com',
      phone: '9811000006',
      status: 'Active',
      admissionDate: '2024-04-01',
      fatherName: 'Manoj Joshi',
      fatherMobile: '9811000016',
      motherName: 'Deepa Joshi',
      motherMobile: '9811000026',
      address: '77 Hillside Drive',
      city: 'Greenfield',
      state: 'California',
      pincode: '94016',
      studentUsername: 'student6',
      studentPassword: await hashPassword('student123'),
      parentUsername: 'parent6',
      parentPassword: await hashPassword('parent123'),
      feeStatus: 'Paid'
    },
    {
      id: 'STU-2026-0007',
      admissionNumber: 'GV-2026-0007',
      rollNumber: '1',
      name: 'Vihaan Singh',
      fullName: 'Vihaan Singh',
      firstName: 'Vihaan',
      lastName: 'Singh',
      studentClass: 'IV',
      section: 'A',
      dob: '2017-02-14',
      gender: 'Male',
      bloodGroup: 'A-',
      email: 'vihaan.singh@example.com',
      phone: '9811000007',
      status: 'Active',
      admissionDate: '2023-04-01',
      fatherName: 'Kuldeep Singh',
      fatherMobile: '9811000017',
      motherName: 'Harpreet Kaur',
      motherMobile: '9811000027',
      address: 'Sector 5, Garden City',
      city: 'Greenfield',
      state: 'California',
      pincode: '94016',
      studentUsername: 'student7',
      studentPassword: await hashPassword('student123'),
      parentUsername: 'parent7',
      parentPassword: await hashPassword('parent123'),
      feeStatus: 'Paid'
    },
    {
      id: 'STU-2026-0008',
      admissionNumber: 'GV-2026-0008',
      rollNumber: '2',
      name: 'Meera Nair',
      fullName: 'Meera Nair',
      firstName: 'Meera',
      lastName: 'Nair',
      studentClass: 'IV',
      section: 'B',
      dob: '2017-08-30',
      gender: 'Female',
      bloodGroup: 'O+',
      email: 'meera.nair@example.com',
      phone: '9811000008',
      status: 'Active',
      admissionDate: '2023-04-01',
      fatherName: 'Pradeep Nair',
      fatherMobile: '9811000018',
      motherName: 'Radhika Nair',
      motherMobile: '9811000028',
      address: 'Flat 401, Sapphire Court',
      city: 'Greenfield',
      state: 'California',
      pincode: '94016',
      studentUsername: 'student8',
      studentPassword: await hashPassword('student123'),
      parentUsername: 'parent8',
      parentPassword: await hashPassword('parent123'),
      feeStatus: 'Pending'
    },
    {
      id: 'STU-2026-0009',
      admissionNumber: 'GV-2026-0009',
      rollNumber: '1',
      name: 'Aryan Verma',
      fullName: 'Aryan Verma',
      firstName: 'Aryan',
      lastName: 'Verma',
      studentClass: 'XI (Arts)',
      section: 'A',
      dob: '2010-01-18',
      gender: 'Male',
      bloodGroup: 'B-',
      email: 'aryan.verma@example.com',
      phone: '9811000009',
      status: 'Active',
      admissionDate: '2026-04-01',
      fatherName: 'Suresh Verma',
      fatherMobile: '9811000019',
      motherName: 'Anita Verma',
      motherMobile: '9811000029',
      address: '88 Heritage Enclave',
      city: 'Greenfield',
      state: 'California',
      pincode: '94016',
      studentUsername: 'student9',
      studentPassword: await hashPassword('student123'),
      parentUsername: 'parent9',
      parentPassword: await hashPassword('parent123'),
      feeStatus: 'Paid'
    },
    {
      id: 'STU-2026-0010',
      admissionNumber: 'GV-2026-0010',
      rollNumber: '2',
      name: 'Riya Sen',
      fullName: 'Riya Sen',
      firstName: 'Riya',
      lastName: 'Sen',
      studentClass: 'XI (Arts)',
      section: 'B',
      dob: '2010-06-25',
      gender: 'Female',
      bloodGroup: 'AB-',
      email: 'riya.sen@example.com',
      phone: '9811000010',
      status: 'Active',
      admissionDate: '2026-04-01',
      fatherName: 'Subhash Sen',
      fatherMobile: '9811000020',
      motherName: 'Madhavi Sen',
      motherMobile: '9811000030',
      address: 'Penthouse 12, Skyline Towers',
      city: 'Greenfield',
      state: 'California',
      pincode: '94016',
      studentUsername: 'student10',
      studentPassword: await hashPassword('student123'),
      parentUsername: 'parent10',
      parentPassword: await hashPassword('parent123'),
      feeStatus: 'Paid'
    }
  ];

  // 7. Assemble Complete Tenant DB object
  const defaultRoles = getDefaultRoles();
  const tenantDbData = {
    school: {
      name: schoolRecord.name,
      subdomain: schoolRecord.subdomain,
      logo: schoolRecord.logo,
      address: schoolRecord.address,
      city: schoolRecord.city,
      state: schoolRecord.state,
      phone: schoolRecord.phone,
      email: schoolRecord.email,
      ratePerStudent: schoolRecord.ratePerStudent,
      adminName: schoolRecord.adminName,
      adminEmail: schoolRecord.adminEmail,
      adminUsername: schoolRecord.adminUsername,
      adminPassword: schoolRecord.adminPassword,
      principal: schoolRecord.principalName,
      academicSession: schoolRecord.academicSession,
      examTypes: ['Term 1', 'Term 2', 'Final Exam'],
      eventTypes: ['Sports', 'Cultural', 'Academic', 'Holiday'],
      noticeCategories: ['Academic', 'Administrative', 'Examination', 'General'],
      holidayClassifications: ['National Holiday', 'Festival', 'Vacation']
    },
    roles: defaultRoles,
    userAccess: userAccess,
    grades: grades,
    departments: departments,
    gradeDepartments: gradeDepartments,
    sections: sections,
    subjects: subjects,
    teachers: teachers,
    staff: staff,
    students: students,
    employees: [],
    invoices: [],
    fees: [],
    expenses: [],
    payroll: [],
    staffPayments: [],
    activities: [
      {
        id: 'act-1',
        type: 'alert',
        title: 'Academic Session Initialized',
        description: 'Green Valley School session 2026-2027 ready.',
        time: 'Just now',
        timestamp: new Date().toISOString()
      }
    ],
    exams: [
      {
        id: 'EXAM-001',
        name: 'Mid Term Assessment',
        term: 'Term 1',
        startDate: '2026-10-10',
        endDate: '2026-10-20',
        status: 'Draft',
        totalMarks: 100,
        gradeSections: [
          { grade: 'I', section: 'A' },
          { grade: 'II', section: 'A' },
          { grade: 'III', section: 'A' },
          { grade: 'IV', section: 'A' },
          { grade: 'XI (Arts)', section: 'A' }
        ],
        academicSession: '2026-2027'
      }
    ],
    examTimetables: [],
    notices: [
      {
        id: 'NOT-001',
        title: 'Welcome to Green Valley Academic Year 2026-2027',
        content: 'Welcome students, parents, and faculty to the new academic year. Classes commence on schedule.',
        date: new Date().toISOString().split('T')[0],
        publishDate: new Date().toISOString().split('T')[0],
        audience: 'All',
        category: 'General',
        priority: 'High',
        status: 'Published'
      }
    ],
    holidays: [
      {
        id: 'HOL-001',
        title: 'Independence Day',
        name: 'Independence Day',
        startDate: '2026-08-15',
        endDate: '2026-08-15',
        description: 'National Holiday',
        status: 'Published'
      }
    ],
    events: [
      {
        id: 'EVT-001',
        title: 'Annual Sports Meet',
        date: '2026-11-20',
        startDate: '2026-11-20',
        endDate: '2026-11-21',
        time: '09:00 AM',
        startTime: '09:00 AM',
        endTime: '04:00 PM',
        venue: 'Main Sports Complex',
        type: 'Sports',
        status: 'Scheduled'
      }
    ],
    results: [],
    overallResults: [],
    timeslots: [
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '01:00 PM - 02:00 PM',
      '02:00 PM - 03:00 PM'
    ],
    feeStructures: [
      { id: 'FS-1', grade: 'I', studentClass: 'I', amount: 35000, frequency: 'Yearly' },
      { id: 'FS-2', grade: 'II', studentClass: 'II', amount: 38000, frequency: 'Yearly' },
      { id: 'FS-3', grade: 'III', studentClass: 'III', amount: 40000, frequency: 'Yearly' },
      { id: 'FS-4', grade: 'IV', studentClass: 'IV', amount: 42000, frequency: 'Yearly' },
      { id: 'FS-5', grade: 'XI (Arts)', studentClass: 'XI (Arts)', amount: 55000, frequency: 'Yearly' }
    ],
    salaryStructures: [],
    staffSalaryStructures: [],
    income: [],
    attendance: [],
    timetables: [],
    teacherTimetables: [],
    publishedClassTimetables: [],
    publishedTeacherTimetables: []
  };

  // 8. Update Global db.json
  let globalDb = { schools: [], platformOwner: null };
  if (fs.existsSync(GLOBAL_DB_FILE)) {
    try {
      globalDb = JSON.parse(fs.readFileSync(GLOBAL_DB_FILE, 'utf8'));
    } catch (e) {}
  }
  if (!globalDb.schools) globalDb.schools = [];
  if (!globalDb.platformOwner) {
    globalDb.platformOwner = {
      name: 'Platform Owner',
      username: 'dev@admin.com',
      password: await hashPassword('admin123'),
      email: 'dev@admin.com',
      phone: '',
      photo: ''
    };
  }

  const existingSchoolIdx = globalDb.schools.findIndex(s => s.subdomain === tenantId);
  if (existingSchoolIdx !== -1) {
    globalDb.schools[existingSchoolIdx] = schoolRecord;
  } else {
    globalDb.schools.push(schoolRecord);
  }
  fs.writeFileSync(GLOBAL_DB_FILE, JSON.stringify(globalDb, null, 2), 'utf8');
  console.log('✔ Updated global db.json with Green Valley school profile');

  // 9. Write Tenant JSON file (for JSON fallback and Git repo tracking)
  fs.writeFileSync(TENANT_DB_FILE, JSON.stringify(tenantDbData, null, 2), 'utf8');
  console.log(`✔ Written tenant JSON to: ${TENANT_DB_FILE}`);

  // 10. Seed MySQL Database if available
  const isConnected = await sqlDb.testConnection();
  if (isConnected) {
    console.log('✔ MySQL connection active. Seeding into MySQL tables...');
    const masterPool = sqlDb.getPoolForTenant(null);

    // 10a. Ensure school in master DB
    try {
      await masterPool.query(`
        INSERT INTO schools (
          id, name, code, subdomain, logo, principalName, email, phone, address, city, state, country,
          academicSession, subscriptionPlan, url, status, adminName, adminEmail, adminUsername, adminPassword,
          ratePerStudent, examTypes, eventTypes, noticeCategories, holidayClassifications, createdAt, dbName
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name), code = VALUES(code), principalName = VALUES(principalName), email = VALUES(email),
          phone = VALUES(phone), address = VALUES(address), city = VALUES(city), state = VALUES(state),
          country = VALUES(country), academicSession = VALUES(academicSession), subscriptionPlan = VALUES(subscriptionPlan),
          status = VALUES(status), adminName = VALUES(adminName), adminEmail = VALUES(adminEmail),
          adminUsername = VALUES(adminUsername), adminPassword = VALUES(adminPassword), ratePerStudent = VALUES(ratePerStudent),
          dbName = VALUES(dbName)
      `, [
        schoolRecord.id, schoolRecord.name, schoolRecord.code, schoolRecord.subdomain, schoolRecord.logo,
        schoolRecord.principalName, schoolRecord.email, schoolRecord.phone, schoolRecord.address, schoolRecord.city,
        schoolRecord.state, schoolRecord.country, schoolRecord.academicSession, schoolRecord.subscriptionPlan,
        schoolRecord.url, schoolRecord.status, schoolRecord.adminName, schoolRecord.adminEmail,
        schoolRecord.adminUsername, schoolRecord.adminPassword, schoolRecord.ratePerStudent,
        schoolRecord.examTypes, schoolRecord.eventTypes, schoolRecord.noticeCategories,
        schoolRecord.holidayClassifications, schoolRecord.createdAt, schoolRecord.dbName
      ]);
      console.log('✔ Seeded school into master database table.');
    } catch (err) {
      console.warn('Warning on master school insert:', err.message);
    }

    // 10b. Provision tenant database
    try {
      await sqlDb.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, [], 'platform');
      sqlDb.registerDbMapping(tenantId, dbName);
      console.log(`✔ Created / verified database: ${dbName}`);

      const tenantPool = sqlDb.getPoolForTenant(tenantId);
      await executeSchemaOnPool(tenantPool, false);
      await applySchemaUpdates(tenantPool, false, tenantId);
      console.log('✔ Applied schema and structural updates to tenant database.');

      // 10c. Seed Master Database tables for tenant (roles, user_access, student_accounts, parent_accounts)
      await masterPool.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const r of defaultRoles) {
        await masterPool.query(`
          INSERT INTO roles (id, name, description, active, isSystem, permissions, tenantId)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), permissions=VALUES(permissions)
        `, [r.id, r.name, r.description, r.active ? 1 : 0, r.isSystem ? 1 : 0, JSON.stringify(r.permissions), tenantId]);
      }
      for (const ua of userAccess) {
        await masterPool.query(`
          INSERT INTO user_access (id, userId, userName, userType, roleId, status, overrides, tenantId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE userName=VALUES(userName), roleId=VALUES(roleId), overrides=VALUES(overrides)
        `, [ua.id, ua.userId, ua.userName, ua.userType, ua.roleId, ua.status, JSON.stringify(ua.overrides || {}), tenantId]);
      }
      for (const s of students) {
        await masterPool.query(`
          INSERT INTO student_accounts (id, studentId, studentUsername, studentPassword, createdAt, tenantId)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE studentUsername=VALUES(studentUsername), studentPassword=VALUES(studentPassword)
        `, [`ACT-S-${s.id}`, s.id, s.studentUsername, s.studentPassword, new Date().toISOString(), tenantId]);

        await masterPool.query(`
          INSERT INTO parent_accounts (id, studentId, parentUsername, parentPassword, createdAt, tenantId)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE parentUsername=VALUES(parentUsername), parentPassword=VALUES(parentPassword)
        `, [`ACT-P-${s.id}`, s.id, s.parentUsername, s.parentPassword, new Date().toISOString(), tenantId]);
      }
      await masterPool.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✔ Seeded master pool tables (roles, user_access, student_accounts, parent_accounts).');

      // 10d. Seed School Tenant tables
      await tenantPool.query('SET FOREIGN_KEY_CHECKS = 0');

      // Grades
      for (const g of grades) {
        await tenantPool.query(`
          INSERT INTO grades (id, name, status, createdAt, updatedAt, tenantId, sections)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sections=VALUES(sections)
        `, [g.id, g.name, g.status, g.createdAt, g.updatedAt, tenantId, JSON.stringify(g.sections)]);
      }

      // Departments
      for (const d of departments) {
        await tenantPool.query(`
          INSERT INTO departments (id, name, status, createdAt, updatedAt, tenantId)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status)
        `, [d.id, d.name, d.status, d.createdAt, d.updatedAt, tenantId]);
      }

      // Grade-Department Mappings
      for (const m of gradeDepartments) {
        await tenantPool.query(`
          INSERT INTO grade_departments (id, gradeId, departmentId, status, tenantId, createdAt, updatedAt, sections)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE status=VALUES(status), sections=VALUES(sections)
        `, [m.id, m.gradeId, m.departmentId, m.status, tenantId, m.createdAt, m.updatedAt, JSON.stringify(m.sections)]);
      }

      // Sections
      for (const sec of sections) {
        await tenantPool.query(`
          INSERT INTO sections (id, name, status, createdAt, updatedAt, tenantId)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE status=VALUES(status)
        `, [sec.id, sec.name, sec.status, sec.createdAt, sec.updatedAt, tenantId]);
      }

      // Subjects
      for (const sub of subjects) {
        await tenantPool.query(`
          INSERT INTO subjects (id, name, code, classId, teacherId, teacherName, tenantId)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code), classId=VALUES(classId), teacherId=VALUES(teacherId), teacherName=VALUES(teacherName)
        `, [sub.id, sub.name, sub.code, sub.classId, sub.teacherId, sub.teacherName, tenantId]);
      }

      // Teachers
      for (const t of teachers) {
        await tenantPool.query(`
          INSERT INTO teachers (
            id, name, fullName, firstName, lastName, email, phone, username, password, gender,
            isClassTeacher, attendancePermission, assignedGradeId, assignedSectionId, primarySubject,
            secondarySubject, department, qualification, experience, status, joiningDate, salaryGrade, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            fullName=VALUES(fullName), email=VALUES(email), phone=VALUES(phone), username=VALUES(username),
            password=VALUES(password), isClassTeacher=VALUES(isClassTeacher), attendancePermission=VALUES(attendancePermission),
            assignedGradeId=VALUES(assignedGradeId), assignedSectionId=VALUES(assignedSectionId),
            primarySubject=VALUES(primarySubject), status=VALUES(status)
        `, [
          t.id, t.name, t.fullName, t.firstName, t.lastName, t.email, t.phone, t.username, t.password,
          t.gender, t.isClassTeacher, t.attendancePermission, t.assignedGradeId || null, t.assignedSectionId || null,
          t.primarySubject || '', t.secondarySubject || '', t.department || '', t.qualification || '',
          t.experience || '', t.status, t.joiningDate || '', t.salaryGrade || '', tenantId
        ]);
      }

      // Staff
      for (const s of staff) {
        await tenantPool.query(`
          INSERT INTO staff (
            id, name, fullName, firstName, lastName, email, phone, username, password, gender,
            role, department, status, joiningDate, employmentType, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            fullName=VALUES(fullName), email=VALUES(email), phone=VALUES(phone), username=VALUES(username),
            password=VALUES(password), role=VALUES(role), status=VALUES(status)
        `, [
          s.id, s.name, s.fullName, s.firstName, s.lastName, s.email, s.phone, s.username, s.password,
          s.gender, s.role, s.department, s.status, s.joiningDate, s.employmentType, tenantId
        ]);
      }

      // Students and sub-tables
      for (const stu of students) {
        // Core student
        await tenantPool.query(`
          INSERT INTO students (
            id, name, fullName, firstName, lastName, admissionNumber, admissionDate, dob, gender,
            bloodGroup, email, phone, status, feeStatus, createdAt, updatedAt, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            fullName=VALUES(fullName), admissionNumber=VALUES(admissionNumber), status=VALUES(status), feeStatus=VALUES(feeStatus)
        `, [
          stu.id, stu.name, stu.fullName, stu.firstName, stu.lastName, stu.admissionNumber, stu.admissionDate,
          stu.dob, stu.gender, stu.bloodGroup, stu.email, stu.phone, stu.status, stu.feeStatus,
          new Date().toISOString(), new Date().toISOString(), tenantId
        ]);

        // Enrollment
        await tenantPool.query(`
          INSERT INTO student_enrollments (
            id, studentId, academicYear, admissionType, studentClass, section, rollNumber, status, createdAt, updatedAt, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE studentClass=VALUES(studentClass), section=VALUES(section), rollNumber=VALUES(rollNumber)
        `, [
          `ENR-${stu.id}`, stu.id, '2026-2027', 'New Admission', stu.studentClass, stu.section, stu.rollNumber,
          'Active', new Date().toISOString(), new Date().toISOString(), tenantId
        ]);

        // Parents
        await tenantPool.query(`
          INSERT INTO parents (
            id, studentId, fatherName, fatherMobile, motherName, motherMobile, parentUsername, parentPassword, createdAt, updatedAt, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            fatherName=VALUES(fatherName), fatherMobile=VALUES(fatherMobile), motherName=VALUES(motherName),
            motherMobile=VALUES(motherMobile), parentUsername=VALUES(parentUsername), parentPassword=VALUES(parentPassword)
        `, [
          `PAR-${stu.id}`, stu.id, stu.fatherName, stu.fatherMobile, stu.motherName, stu.motherMobile,
          stu.parentUsername, stu.parentPassword, new Date().toISOString(), new Date().toISOString(), tenantId
        ]);

        // Address
        await tenantPool.query(`
          INSERT INTO addresses (
            id, studentId, currentAddress, permanentAddress, city, state, country, postalCode, emergencyContactNumber, createdAt, updatedAt, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE currentAddress=VALUES(currentAddress)
        `, [
          `ADD-${stu.id}`, stu.id, stu.address, stu.address, stu.city, stu.state, 'India', stu.pincode,
          stu.phone, new Date().toISOString(), new Date().toISOString(), tenantId
        ]);

        // Medical
        await tenantPool.query(`
          INSERT INTO medical_records (id, studentId, bloodGroup, createdAt, updatedAt, tenantId)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE bloodGroup=VALUES(bloodGroup)
        `, [`MED-${stu.id}`, stu.id, stu.bloodGroup, new Date().toISOString(), new Date().toISOString(), tenantId]);

        // Fee assignment
        await tenantPool.query(`
          INSERT INTO fee_assignments (id, studentId, initialPaymentStatus, assignedAt, tenantId)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE initialPaymentStatus=VALUES(initialPaymentStatus)
        `, [`FEE-${stu.id}`, stu.id, stu.feeStatus, new Date().toISOString(), tenantId]);
      }

      // Fee structures
      for (const fs of tenantDbData.feeStructures) {
        await tenantPool.query(`
          INSERT INTO fee_structures (id, classId, amount, frequency, studentClass, tenantId)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE amount=VALUES(amount)
        `, [fs.id, fs.grade, fs.amount, fs.frequency, fs.studentClass, tenantId]);
      }

      // Timeslots
      await tenantPool.query('DELETE FROM timeslots WHERE tenantId = ?', [tenantId]);
      for (const ts of tenantDbData.timeslots) {
        await tenantPool.query(`
          INSERT INTO timeslots (slotTime, tenantId)
          VALUES (?, ?)
        `, [ts, tenantId]);
      }

      // Activities
      for (const act of tenantDbData.activities) {
        await tenantPool.query(`
          INSERT INTO activities (id, type, title, description, time, timestamp, tenantId)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE title=VALUES(title)
        `, [act.id, act.type, act.title, act.description, act.time, act.timestamp, tenantId]);
      }

      // Exams
      for (const ex of tenantDbData.exams) {
        await tenantPool.query(`
          INSERT INTO exams (id, name, term, startDate, endDate, status, totalMarks, academicSession, timetablePublished, gradeSections, tenantId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), gradeSections=VALUES(gradeSections)
        `, [ex.id, ex.name, ex.term, ex.startDate, ex.endDate, ex.status, ex.totalMarks, ex.academicSession, 0, JSON.stringify(ex.gradeSections || []), tenantId]);
      }

      // Notices
      for (const not of tenantDbData.notices) {
        await tenantPool.query(`
          INSERT INTO notices (id, title, content, date, publishDate, audience, category, priority, status, tenantId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content)
        `, [not.id, not.title, not.content, not.date, not.publishDate, not.audience, not.category, not.priority, not.status, tenantId]);
      }

      // Holidays
      for (const hol of tenantDbData.holidays) {
        await tenantPool.query(`
          INSERT INTO holidays (id, title, name, startDate, endDate, description, status, tenantId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE title=VALUES(title)
        `, [hol.id, hol.title, hol.name, hol.startDate, hol.endDate, hol.description, hol.status, tenantId]);
      }

      // Events
      for (const evt of tenantDbData.events) {
        await tenantPool.query(`
          INSERT INTO events (id, title, date, startTime, endTime, venue, type, status, tenantId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE title=VALUES(title)
        `, [evt.id, evt.title, evt.date, evt.startTime, evt.endTime, evt.venue, evt.type, evt.status, tenantId]);
      }

      await tenantPool.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✔ Synchronized all grades, subjects, teachers, staff, students, and user access into MySQL tables.');
    } catch (err) {
      console.error('Error provisioning tenant SQL database:', err.message);
    }
  } else {
    console.log('ℹ MySQL is not currently running. JSON data successfully generated and saved.');
  }

  console.log('\n======================================================');
  console.log('🎉 GREEN VALLEY SCHOOL DATA SUCCESSFULLY SEEDED!');
  console.log('======================================================');
  console.log('School: Green Valley (Subdomain: green-valley)');
  console.log('School Admin: school_admin / admin@123');
  console.log('Class Teachers (with portal credentials):');
  console.log('  Class 1: teacher1_admin / teacher1@123 (Sarah Jenkins)');
  console.log('  Class 2: teacher2_admin / teacher2@123 (Michael Chang)');
  console.log('  Class 3: teacher3_admin / teacher3@123 (Emily Rodriguez)');
  console.log('  Class 4: teacher4_admin / teacher4@123 (David Miller)');
  console.log('  Class 11 Arts: teacher5_admin / teacher5@123 (Ananya Sharma)');
  console.log('Subject Teachers: 5 subject teachers (without portal credentials)');
  console.log('Staff:');
  console.log('  Accountant: account_admin / account@123');
  console.log('  Academic Manager: academic_admin / academic@123');
  console.log('  Receptionist: reception_admin / reception@123');
  console.log('  Expense Manager: expense_admin / expense@123');
  console.log('Students: student1 to student10 / student123 (10 students across classes)');
  console.log('Parents: parent1 to parent10 / parent123');
  console.log('======================================================\n');
};

// If run directly via `node seedGreenValley.js`
if (process.argv[1] && process.argv[1].endsWith('seedGreenValley.js')) {
  seedGreenValley().then(async () => {
    await sqlDb.closeAllPools();
    process.exit(0);
  }).catch(async (err) => {
    console.error('Fatal seed error:', err);
    await sqlDb.closeAllPools();
    process.exit(1);
  });
}
