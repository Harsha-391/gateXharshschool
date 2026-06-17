import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment config
dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'uttam@2004',
  database: process.env.DB_NAME || 'school_management'
};

const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

async function seed() {
  console.log(`[Seeder] Connecting to MySQL server at ${dbConfig.host}:${dbConfig.port}...`);
  let connection;
  try {
    // 1. Establish initial connection without database to ensure it exists
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    console.log(`[Seeder] Verified/Created database: ${dbConfig.database}`);
    await connection.end();

    // 2. Reconnect with target database
    connection = await mysql.createConnection(dbConfig);
    console.log(`[Seeder] Connected to database: ${dbConfig.database}`);

    // 3. Read and execute schema.sql
    if (!fs.existsSync(SCHEMA_FILE)) {
      throw new Error(`Schema file not found at ${SCHEMA_FILE}`);
    }
    console.log(`[Seeder] Reading database schema definitions from ${SCHEMA_FILE}...`);
    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
    // Strip single-line comments and split by semicolon
    const cleanLines = schemaSql
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('--') && !line.startsWith('#'));
    
    const queries = cleanLines
      .join(' ')
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log(`[Seeder] Executing DDL statements (${queries.length} queries)...`);
    for (const sql of queries) {
      await connection.query(sql);
    }
    console.log(`[Seeder] Database tables created/verified successfully.`);

    // 4. Clean old tables before seeding
    console.log(`[Seeder] Purging old records to ensure clean seed...`);
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'schools', 'students', 'student_enrollments', 'parents', 'addresses', 'medical_records',
      'documents', 'fee_assignments', 'student_accounts', 'parent_accounts', 'teachers', 'staff',
      'timetables', 'invoices', 'fees', 'expenses', 'payroll', 'staff_payments', 'activities',
      'exams', 'exam_timetables', 'notices', 'holidays', 'events', 'results', 'overall_results',
      'subjects', 'timeslots', 'fee_structures', 'salary_structures', 'staff_salary_structures',
      'income', 'attendance', 'subscription_plans'
    ];
    for (const table of tables) {
      await connection.query(`TRUNCATE TABLE \`${table}\``);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 5. Seed Subscription Plans
    console.log(`[Seeder] Seeding subscription plans...`);
    const plans = [
      { id: 'PLAN-001', name: 'Starter', price: '$99/mo', features: ['Up to 100 Students', 'Basic Analytics', 'Standard Support'] },
      { id: 'PLAN-002', name: 'Growth', price: '$249/mo', features: ['Up to 500 Students', 'Full Reports', 'Priority Support'] },
      { id: 'PLAN-003', name: 'Premium', price: '$499/mo', features: ['Unlimited Students', 'Advanced Account Management', '24/7 Dedicated Support'] }
    ];
    for (const plan of plans) {
      await connection.query(
        'INSERT INTO subscription_plans (id, name, price, features) VALUES (?, ?, ?, ?)',
        [plan.id, plan.name, plan.price, JSON.stringify(plan.features)]
      );
    }

    // 6. Seed default school (Green Valley Public School, subdomain: greenvalley)
    console.log(`[Seeder] Seeding default multi-tenant school...`);
    const schoolId = 'SCH-GV-001';
    const tenantId = 'greenvalley';
    await connection.query(
      `INSERT INTO schools (
        id, name, code, subdomain, logo, principalName, email, phone, address, city, state, country,
        academicSession, subscriptionPlan, url, status, adminName, adminEmail, adminUsername, adminPassword,
        createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId, 'Green Valley Public School', 'SCH-GV-001', tenantId, '', 'Dr. John Miller', 
        'contact@greenvalley.edu', '1234567890', 'Khimel Rani Station Rd', 'Bali', 'Rajasthan', 'India', 
        '2026-2027', 'Growth', `http://${tenantId}.localhost:3000`, 'Active', 'Zachary Langley', 
        'qino@mailinator.com', 'greenvalley_admin', 'uttam@2004', 
        new Date().toISOString()
      ]
    );

    // 7. Seed teachers (Sarah Connor, Bruce Wayne)
    console.log(`[Seeder] Seeding teacher profiles...`);
    const teachers = [
      {
        id: 'TCH-101', name: 'Sarah Connor', email: 'sarah@greenvalley.edu', phone: '9876543210', 
        username: 'sarah_connor', password: 'password123', gender: 'Female', qualification: 'M.Ed in Science', 
        experience: '8 Years', dateOfJoining: '2022-06-01', salaryGrade: 'Grade A', address: '45 Blue St', 
        city: 'Bali', state: 'Rajasthan', pincode: '306115', emergencyContact: 'John Connor', 
        emergencyPhone: '9876543211', photo: '', aadharFile: '', certificateFile: '', status: 'Active', 
        avatarBg: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', tenantId
      },
      {
        id: 'TCH-102', name: 'Bruce Wayne', email: 'bruce@greenvalley.edu', phone: '9876543220', 
        username: 'bruce_wayne', password: 'password123', gender: 'Male', qualification: 'Ph.D. in Literature', 
        experience: '12 Years', dateOfJoining: '2020-08-15', salaryGrade: 'Grade S', address: 'Wayne Manor', 
        city: 'Bali', state: 'Rajasthan', pincode: '306115', emergencyContact: 'Alfred Pennyworth', 
        emergencyPhone: '9876543221', photo: '', aadharFile: '', certificateFile: '', status: 'Active', 
        avatarBg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', tenantId
      }
    ];
    for (const t of teachers) {
      await connection.query(
        `INSERT INTO teachers (
          id, name, email, phone, username, password, gender, qualification, experience, dateOfJoining,
          salaryGrade, address, city, state, pincode, emergencyContact, emergencyPhone, photo, aadharFile,
          certificateFile, status, avatarBg, tenantId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.values(t)
      );
    }

    // 8. Seed staff (Clark Kent as accountant/finance, Diana Prince as front desk)
    console.log(`[Seeder] Seeding staff profiles...`);
    const staffList = [
      {
        id: 'STF-201', name: 'Clark Kent', fullName: 'Clark Kent', role: 'Finance Manager', 
        department: 'Accounts', email: 'clark@greenvalley.edu', phone: '9876543230', gender: 'Male', 
        qualification: 'B.Com, CA', experience: '5 Years', dateOfJoining: '2023-01-10', salaryGrade: 'Grade B', 
        reportingTo: 'Zachary Langley', address: 'Daily Planet', city: 'Bali', state: 'Rajasthan', 
        pincode: '306115', emergencyContact: 'Lois Lane', emergencyPhone: '9876543231', photo: '', 
        aadharFile: '', certificateFile: '', status: 'Active', avatarBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
        password: 'password123', tenantId
      },
      {
        id: 'STF-202', name: 'Diana Prince', fullName: 'Diana Prince', role: 'Receptionist', 
        department: 'Front Desk', email: 'diana@greenvalley.edu', phone: '9876543240', gender: 'Female', 
        qualification: 'B.A. in Hospitality', experience: '6 Years', dateOfJoining: '2024-03-01', salaryGrade: 'Grade C', 
        reportingTo: 'Zachary Langley', address: 'Themyscira Rd', city: 'Bali', state: 'Rajasthan', 
        pincode: '306115', emergencyContact: 'Steve Trevor', emergencyPhone: '9876543241', photo: '', 
        aadharFile: '', certificateFile: '', status: 'Active', avatarBg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
        password: 'password123', tenantId
      }
    ];
    for (const stf of staffList) {
      await connection.query(
        `INSERT INTO employees (
          id, name, fullName, role, department, email, phone, gender, qualification, experience,
          dateOfJoining, salaryGrade, reportingTo, address, city, state, pincode, emergencyContact,
          emergencyPhone, photo, aadharFile, certificateFile, status, avatarBg, password, tenantId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.values(stf)
      );
    }

    // 9. Seed 3 mock students with normalized tables and logins
    console.log(`[Seeder] Seeding student profiles and linked records...`);
    const studentData = [
      {
        id: 'STU-1001',
        first: 'John', middle: '', last: 'Doe',
        admNum: 'ADM-100001', classVal: 'IV', sectionVal: 'A', roll: '12',
        father: 'Robert Doe', fatherMobile: '9876543110', mother: 'Sarah Doe', motherMobile: '9876543111',
        address: '123 Main St, Bali', pincode: '306115', blood: 'A+',
        fee: 'STANDARD-2026', initialStatus: 'Paid'
      },
      {
        id: 'STU-1002',
        first: 'Jane', middle: '', last: 'Smith',
        admNum: 'ADM-100002', classVal: 'IV', sectionVal: 'A', roll: '15',
        father: 'Michael Smith', fatherMobile: '9876543220', mother: 'Emma Smith', motherMobile: '9876543221',
        address: '456 Elm St, Bali', pincode: '306115', blood: 'O+',
        fee: 'STANDARD-2026', initialStatus: 'Pending'
      },
      {
        id: 'STU-1003',
        first: 'Alex', middle: 'J.', last: 'Johnson',
        admNum: 'ADM-100003', classVal: 'V', sectionVal: 'B', roll: '22',
        father: 'David Johnson', fatherMobile: '9876543330', mother: 'Lisa Johnson', motherMobile: '9876543331',
        address: '789 Pine St, Bali', pincode: '306115', blood: 'B+',
        fee: 'PREMIUM-2026', initialStatus: 'Partial'
      }
    ];

    for (const s of studentData) {
      const fullname = [s.first, s.middle, s.last].filter(Boolean).join(' ');
      
      // 1. Insert Student core profile
      await connection.query(
        `INSERT INTO students (
          id, firstName, middleName, lastName, name, fullName, admissionNumber, admissionDate, dob,
          gender, bloodGroup, nationality, category, religion, aadhaarNumber, photo, status, photoBg,
          email, phone, feeStatus, \`rank\`, createdAt, updatedAt, tenantId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id, s.first, s.middle, s.last, fullname, fullname, s.admNum,
          '2026-06-01', '2016-05-12', s.id === 'STU-1002' ? 'Female' : 'Male', s.blood, 'Indian', 'General',
          'Hinduism', '', '', 'Active', 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
          s.fatherMobile ? `parent_${s.admNum}@greenvalley.edu` : 'parent@greenvalley.edu',
          s.fatherMobile || s.motherMobile, s.initialStatus, 'N/A',
          new Date().toISOString(), new Date().toISOString(), tenantId
        ]
      );

      // 2. Insert Student Enrollment history record
      await connection.query(
        `INSERT INTO student_enrollments (
          id, studentId, academicYear, admissionType, studentClass, section, rollNumber, previousSchoolName,
          previousSchoolAddress, previousClassStudied, transferCertificateNumber, status, createdAt, updatedAt, tenantId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `ENR-${s.id}`, s.id, '2026-2027', 'New Admission', s.classVal, s.sectionVal, s.roll,
          'Bali Play School', 'Bali, Rajasthan', 'Class III', '', 'Active',
          new Date().toISOString(), new Date().toISOString(), tenantId
        ]
      );

      // 3. Insert Parent Contact profiles
      await connection.query(
        `INSERT INTO parents (
          id, studentId, fatherName, fatherOccupation, fatherMobile, fatherEmail, motherName, motherOccupation,
          motherMobile, motherEmail, guardianName, guardianRelation, guardianContact, parentUsername, parentPassword,
          createdAt, updatedAt, tenantId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `PAR-${s.id}`, s.id, s.father, 'Business', s.fatherMobile, `${s.first.toLowerCase()}.father@mail.com`,
          s.mother, 'Homemaker', s.motherMobile, `${s.first.toLowerCase()}.mother@mail.com`,
          '', '', '', `parent_${s.admNum}`, 'parent123',
          new Date().toISOString(), new Date().toISOString(), tenantId
        ]
      );

      // 4. Insert Address record
      await connection.query(
        `INSERT INTO addresses (
          id, studentId, currentAddress, permanentAddress, city, state, country, postalCode,
          emergencyContactNumber, isSameAddress, createdAt, updatedAt, tenantId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `ADD-${s.id}`, s.id, s.address, s.address, 'Bali', 'Rajasthan', 'India', s.pincode,
          s.fatherMobile, true, new Date().toISOString(), new Date().toISOString(), tenantId
        ]
      );

      // 5. Insert Medical Record
      await connection.query(
        `INSERT INTO medical_records (
          id, studentId, bloodGroup, medicalConditions, allergies, disabilities, emergencyNotes,
          doctorName, doctorContact, createdAt, updatedAt, tenantId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `MED-${s.id}`, s.id, s.blood, 'None', 'None', 'None', 'Emergency contact father if any issue',
          'Dr. Kumar', '9876543000', new Date().toISOString(), new Date().toISOString(), tenantId
        ]
      );

      // 6. Insert Logins
      await connection.query(
        'INSERT INTO student_accounts (id, studentId, studentUsername, studentPassword, createdAt, tenantId) VALUES (?, ?, ?, ?, ?, ?)',
        [`ACT-S-${s.id}`, s.id, s.admNum, `stu@${s.first.toLowerCase()}`, new Date().toISOString(), tenantId]
      );
      await connection.query(
        'INSERT INTO parent_accounts (id, studentId, parentUsername, parentPassword, createdAt, tenantId) VALUES (?, ?, ?, ?, ?, ?)',
        [`ACT-P-${s.id}`, s.id, `parent_${s.admNum}`, 'parent123', new Date().toISOString(), tenantId]
      );

      // 7. Insert Fee Assignment
      await connection.query(
        `INSERT INTO fee_assignments (
          id, studentId, feeStructure, scholarshipDetails, discountType, discountAmount, initialPaymentStatus, assignedAt, tenantId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `FA-${s.id}`, s.id, s.fee, '', '', 0.00, s.initialStatus, new Date().toISOString(), tenantId
        ]
      );
    }

    // 10. Seed Timeslots
    console.log(`[Seeder] Seeding academic timeslots...`);
    const slots = [
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '01:00 PM - 02:00 PM',
      '02:00 PM - 03:00 PM'
    ];
    for (const slot of slots) {
      await connection.query('INSERT INTO timeslots (slotTime, tenantId) VALUES (?, ?)', [slot, tenantId]);
    }

    // 11. Seed Subjects
    console.log(`[Seeder] Seeding subjects list...`);
    const subjects = [
      { id: 'SUB-401', name: 'Mathematics', code: 'MATH-4', classId: 'IV', teacherId: 'TCH-101', teacherName: 'Sarah Connor', tenantId },
      { id: 'SUB-402', name: 'English Literature', code: 'ENG-4', classId: 'IV', teacherId: 'TCH-102', teacherName: 'Bruce Wayne', tenantId },
      { id: 'SUB-403', name: 'General Science', code: 'SCI-4', classId: 'IV', teacherId: 'TCH-101', teacherName: 'Sarah Connor', tenantId }
    ];
    for (const sub of subjects) {
      await connection.query('INSERT INTO subjects (id, name, code, classId, teacherId, teacherName, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?)', Object.values(sub));
    }

    // 12. Seed Timetables
    console.log(`[Seeder] Seeding weekly class schedules...`);
    const mathClass = { subject: 'Mathematics', teacher: 'Sarah Connor', room: 'Room 201' };
    const engClass = { subject: 'English Literature', teacher: 'Bruce Wayne', room: 'Room 202' };
    const sciClass = { subject: 'General Science', teacher: 'Sarah Connor', room: 'Room 201' };
    const freePeriod = { subject: 'Self Study', teacher: 'N/A', room: 'Library' };

    const timetableData = [
      {
        cohort: 'IV-A', time: '09:00 AM - 10:00 AM',
        mon: mathClass, tue: engClass, wed: mathClass, thu: engClass, fri: mathClass, tenantId
      },
      {
        cohort: 'IV-A', time: '10:00 AM - 11:00 AM',
        mon: engClass, tue: sciClass, wed: engClass, thu: sciClass, fri: engClass, tenantId
      },
      {
        cohort: 'IV-A', time: '11:00 AM - 12:00 PM',
        mon: sciClass, tue: freePeriod, wed: sciClass, thu: freePeriod, fri: sciClass, tenantId
      }
    ];
    for (const tt of timetableData) {
      await connection.query(
        'INSERT INTO timetables (cohort, time, mon, tue, wed, thu, fri, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [tt.cohort, tt.time, JSON.stringify(tt.mon), JSON.stringify(tt.tue), JSON.stringify(tt.wed), JSON.stringify(tt.thu), JSON.stringify(tt.fri), tenantId]
      );
    }

    // 13. Seed Invoices
    console.log(`[Seeder] Seeding tuition invoices...`);
    const invoices = [
      { invoiceNo: 'INV-4001', name: 'John Doe', grade: 'IV-A', amount: '₹25,000', date: 'Jun 01, 2026', status: 'Paid', method: 'Direct Cash', tenantId },
      { invoiceNo: 'INV-4002', name: 'Jane Smith', grade: 'IV-A', amount: '₹25,000', date: 'Jun 02, 2026', status: 'Pending', method: 'N/A', tenantId }
    ];
    for (const inv of invoices) {
      await connection.query(
        'INSERT INTO invoices (invoiceNo, name, grade, amount, date, status, method, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        Object.values(inv)
      );
    }

    // 14. Seed Fee Structures
    console.log(`[Seeder] Seeding structural grade fees...`);
    await connection.query(
      'INSERT INTO fee_structures (id, classId, amount, frequency, tenantId) VALUES (?, ?, ?, ?, ?)',
      ['FS-IV', 'IV', 25000.00, 'Yearly', tenantId]
    );
    await connection.query(
      'INSERT INTO fee_structures (id, classId, amount, frequency, tenantId) VALUES (?, ?, ?, ?, ?)',
      ['FS-V', 'V', 28000.00, 'Yearly', tenantId]
    );

    // 15. Seed Activities Log
    console.log(`[Seeder] Seeding activities ledger...`);
    const activities = [
      { id: 'ACT-001', type: 'registration', title: 'Admissions Opened', description: 'Academic year 2026-27 admission registrations opened.', time: '1 week ago', timestamp: new Date(Date.now() - 7*24*3600*1000).toISOString(), color: 'hsl(var(--color-primary))', bg: 'rgba(99, 102, 241, 0.1)', tenantId },
      { id: 'ACT-002', type: 'account_management', title: 'Fee Schedule Configured', description: 'Assigned Yearly fee schedules for Classes I-X.', time: '5 days ago', timestamp: new Date(Date.now() - 5*24*3600*1000).toISOString(), color: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.1)', tenantId }
    ];
    for (const act of activities) {
      await connection.query(
        'INSERT INTO activities (id, type, title, description, time, timestamp, color, bg, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        Object.values(act)
      );
    }

    console.log('[Seeder SUCCESS] MySQL Database initialized and seeded with dummy data successfully!');
  } catch (err) {
    console.error('[Seeder ERROR] Database initialization failed:', err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
