import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AsyncLocalStorage } from 'async_hooks';
import * as sqlDb from './sqlDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GLOBAL_DB_FILE = path.join(__dirname, '..', 'db.json');
const TENANTS_DIR = path.join(__dirname, '..', 'tenants');
const SCHEMA_FILE = path.join(__dirname, '..', 'schema.sql');

// Ensure tenants directory exists
if (!fs.existsSync(TENANTS_DIR)) {
  fs.mkdirSync(TENANTS_DIR, { recursive: true });
}

// Global AsyncLocalStorage to store tenant subdomain for the active request context
export const tenantStorage = new AsyncLocalStorage();

// Slugify helper
export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
};

// Middleware to restore tenant context lost during async processing
export const restoreTenantContext = (req, res, next) => {
  let tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
  if (!tenantId && req.headers.host) {
    const host = req.headers.host.split(':')[0]; // Remove port
    // Skip tenant parsing for IP addresses (e.g. 127.0.0.1, 192.168.x.x)
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
    if (!isIp) {
      const parts = host.split('.');
      if (parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost')) {
        tenantId = parts[0];
      }
    }
  }
  
  if (tenantId) {
    tenantStorage.run(slugify(tenantId), () => {
      next();
    });
  } else {
    tenantStorage.run(null, () => {
      next();
    });
  }
};

// Dynamic database path selector (JSON fallback)
export const getDbPath = () => {
  const tenantId = tenantStorage.getStore();
  if (tenantId && tenantId !== 'platform' && tenantId !== 'localhost') {
    return path.join(TENANTS_DIR, `db_${tenantId}.json`);
  }
  return GLOBAL_DB_FILE;
};

// ==========================================
// SQL CACHING & SYNC ADAPTER
// ==========================================

// Global in-memory cache for tenants.
// Map of tenantId -> database object structure
const dbCache = {};
let isSqlInitialized = false;

// Helper to check if MySQL is running and active
export const isSqlActive = () => {
  const pool = sqlDb.getPool();
  return !!pool && isSqlInitialized;
};

// Execute schema.sql to initialize database tables
const createTablesFromSchema = async () => {
  try {
    if (!fs.existsSync(SCHEMA_FILE)) {
      console.warn(`[SQL Init] Schema file not found at ${SCHEMA_FILE}`);
      return;
    }
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

    console.log(`[SQL Init] Executing ${queries.length} DDL statements to construct tables...`);
    for (const sql of queries) {
      try {
        await sqlDb.query(sql);
      } catch (err) {
        console.error('[SQL Schema Execute Error]', err.message);
        console.error('Failed statement:', sql);
      }
    }
    console.log('[SQL Init] Database tables verified/created successfully.');

    // Ensure ratePerStudent column exists in schools table
    try {
      await sqlDb.query("ALTER TABLE schools ADD COLUMN ratePerStudent VARCHAR(50) DEFAULT '250.00'");
      console.log("[SQL Init] Added missing column ratePerStudent to schools table.");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.warn("[SQL Init WARNING] Failed to check/add ratePerStudent column:", err.message);
      }
    }

    // Ensure transportRequired and hostelRequired columns exist in students table
    try {
      await sqlDb.query("ALTER TABLE students ADD COLUMN transportRequired VARCHAR(50) DEFAULT 'No'");
      console.log("[SQL Init] Added missing column transportRequired to students table.");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.warn("[SQL Init WARNING] Failed to check/add transportRequired column:", err.message);
      }
    }
    try {
      await sqlDb.query("ALTER TABLE students ADD COLUMN hostelRequired VARCHAR(50) DEFAULT 'No'");
      console.log("[SQL Init] Added missing column hostelRequired to students table.");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.warn("[SQL Init WARNING] Failed to check/add hostelRequired column:", err.message);
      }
    }

    // Ensure new teacher columns exist in staff table
    const teacherAlters = [
      "ALTER TABLE staff MODIFY COLUMN qualification TEXT",
      "ALTER TABLE staff MODIFY COLUMN experience TEXT",
      "ALTER TABLE staff ADD COLUMN firstName VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN middleName VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN lastName VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN fullName VARCHAR(255)",
      "ALTER TABLE staff ADD COLUMN dob VARCHAR(50)",
      "ALTER TABLE staff ADD COLUMN bloodGroup VARCHAR(20)",
      "ALTER TABLE staff ADD COLUMN nationality VARCHAR(100) DEFAULT 'Indian'",
      "ALTER TABLE staff ADD COLUMN maritalStatus VARCHAR(50)",
      "ALTER TABLE staff ADD COLUMN aadhaarNumber VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN panNumber VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN joiningDate VARCHAR(50)",
      "ALTER TABLE staff ADD COLUMN employmentType VARCHAR(50)",
      "ALTER TABLE staff ADD COLUMN designation VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN department VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN primarySubject VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN secondarySubject VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN alternateMobile VARCHAR(50)",
      "ALTER TABLE staff ADD COLUMN currentAddress TEXT",
      "ALTER TABLE staff ADD COLUMN currentCity VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN currentState VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN currentCountry VARCHAR(100) DEFAULT 'India'",
      "ALTER TABLE staff ADD COLUMN currentPostalCode VARCHAR(50)",
      "ALTER TABLE staff ADD COLUMN permanentAddress TEXT",
      "ALTER TABLE staff ADD COLUMN permanentCity VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN permanentState VARCHAR(100)",
      "ALTER TABLE staff ADD COLUMN permanentCountry VARCHAR(100) DEFAULT 'India'",
      "ALTER TABLE staff ADD COLUMN permanentPostalCode VARCHAR(50)",
      "ALTER TABLE staff ADD COLUMN sameAsPermanent VARCHAR(10) DEFAULT 'No'",
      "ALTER TABLE staff ADD COLUMN panFile TEXT",
      "ALTER TABLE staff ADD COLUMN resumeFile TEXT",
      "ALTER TABLE staff ADD COLUMN joiningLetterFile TEXT",
      "ALTER TABLE staff ADD COLUMN otherFile TEXT",
      "ALTER TABLE staff ADD COLUMN experiences TEXT"
    ];

    for (const sql of teacherAlters) {
      try {
        await sqlDb.query(sql);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON') {
          // Ignore duplicate field names or unsupported alters
        }
      }
    }

    // Dynamic alters to align schema with memory data models
    const extraSchemaAlters = [
      "ALTER TABLE employees ADD COLUMN designation VARCHAR(100)",
      "ALTER TABLE timetables ADD COLUMN sat JSON",
      "ALTER TABLE exam_timetables ADD COLUMN startTime VARCHAR(50)",
      "ALTER TABLE exam_timetables ADD COLUMN endTime VARCHAR(50)",
      "ALTER TABLE exam_timetables ADD COLUMN duration VARCHAR(50)",
      "ALTER TABLE exam_timetables ADD COLUMN invigilator VARCHAR(255)",
      "ALTER TABLE exam_timetables ADD COLUMN cohort VARCHAR(100)",
      "ALTER TABLE exam_timetables ADD COLUMN grade VARCHAR(50)",
      "ALTER TABLE exam_timetables ADD COLUMN section VARCHAR(50)",
      "ALTER TABLE exam_timetables ADD COLUMN examDate VARCHAR(50)",
      "ALTER TABLE results ADD COLUMN term VARCHAR(100)",
      "ALTER TABLE results ADD COLUMN percentage INT",
      "ALTER TABLE results ADD COLUMN gpa DECIMAL(3,2)",
      "ALTER TABLE results ADD COLUMN `rank` VARCHAR(50)",
      "ALTER TABLE overall_results ADD COLUMN examId VARCHAR(50)",
      "ALTER TABLE overall_results ADD COLUMN cohort VARCHAR(100)",
      "ALTER TABLE overall_results ADD COLUMN totalObtained DECIMAL(10,2)",
      "ALTER TABLE overall_results ADD COLUMN totalMax DECIMAL(10,2)",
      "ALTER TABLE overall_results ADD COLUMN gpa DECIMAL(3,2)",
      "ALTER TABLE overall_results ADD COLUMN `rank` VARCHAR(50)",
      "ALTER TABLE overall_results ADD COLUMN subjectsCount INT",
      "ALTER TABLE overall_results ADD COLUMN passStatus VARCHAR(50)",
      "ALTER TABLE exams ADD COLUMN description TEXT",
      "ALTER TABLE exams ADD COLUMN totalMarks INT",
      "ALTER TABLE exams ADD COLUMN gradeSections JSON",
      "ALTER TABLE exams ADD COLUMN subjectIncluded JSON",
      "ALTER TABLE exams ADD COLUMN subjectMarks JSON",
      "ALTER TABLE exams ADD COLUMN createdAt VARCHAR(100)",
      "ALTER TABLE exams ADD COLUMN timetablePublished TINYINT(1) DEFAULT 0",
      "ALTER TABLE results ADD COLUMN status VARCHAR(50) DEFAULT 'Draft'",
      "ALTER TABLE fee_structures ADD COLUMN studentClass VARCHAR(100)",
      "ALTER TABLE fee_structures ADD COLUMN admissionFee DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE fee_structures ADD COLUMN tuitionFee DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE fee_structures ADD COLUMN examFee DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE fee_structures ADD COLUMN transportFee DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE fee_structures ADD COLUMN hostelFee DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE fee_structures ADD COLUMN libraryFee DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE fee_structures ADD COLUMN otherCharges DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE fee_structures ADD COLUMN totalFee DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE salary_structures ADD COLUMN designation VARCHAR(255)",
      "ALTER TABLE salary_structures ADD COLUMN pfDeduction DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE salary_structures ADD COLUMN taxDeduction DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE salary_structures ADD COLUMN netSalary DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE salary_structures MODIFY COLUMN allowances DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE salary_structures MODIFY COLUMN deductions DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE staff_salary_structures ADD COLUMN designation VARCHAR(255)",
      "ALTER TABLE staff_salary_structures ADD COLUMN bonus DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE staff_salary_structures ADD COLUMN pfDeduction DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE staff_salary_structures ADD COLUMN taxDeduction DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE staff_salary_structures ADD COLUMN netSalary DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE staff_salary_structures MODIFY COLUMN allowances DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE staff_salary_structures MODIFY COLUMN deductions DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE fees ADD COLUMN receiptNumber VARCHAR(100)",
      "ALTER TABLE fees ADD COLUMN transactionId VARCHAR(100)",
      "ALTER TABLE fees ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE fees ADD COLUMN fine DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE fees ADD COLUMN amount DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE fees ADD COLUMN studentClass VARCHAR(100)",
      "ALTER TABLE fees ADD COLUMN section VARCHAR(50)",
      "ALTER TABLE fees ADD COLUMN paymentStatus VARCHAR(50)",
      "ALTER TABLE employees ADD COLUMN designationLevel VARCHAR(100)",
      "ALTER TABLE employees ADD COLUMN employmentType VARCHAR(100)",
      "ALTER TABLE staff_salary_structures ADD COLUMN designationLevel VARCHAR(100)",
      "ALTER TABLE staff_salary_structures ADD COLUMN employmentType VARCHAR(100)",
      "ALTER TABLE staff_payments ADD COLUMN staffName VARCHAR(255)",
      "ALTER TABLE staff_payments ADD COLUMN staffRole VARCHAR(255)",
      "ALTER TABLE staff_payments ADD COLUMN basicSalary DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE staff_payments ADD COLUMN allowances DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE staff_payments ADD COLUMN bonus DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE staff_payments ADD COLUMN deductions DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE staff_payments ADD COLUMN pfDeduction DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE staff_payments ADD COLUMN taxDeduction DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE staff_payments ADD COLUMN netSalary DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE expenses ADD COLUMN grade VARCHAR(100)",
      "ALTER TABLE expenses ADD COLUMN department VARCHAR(100)",
      "ALTER TABLE expenses ADD COLUMN expenseType VARCHAR(100)",
      "ALTER TABLE expenses ADD COLUMN subcategory VARCHAR(100)",
      "ALTER TABLE academic_calendar_events ADD COLUMN color VARCHAR(50) DEFAULT '#6366f1'",
      "ALTER TABLE academic_calendar_events ADD COLUMN audience VARCHAR(255) DEFAULT 'All'",
      "ALTER TABLE academic_calendar_events ADD COLUMN recurring VARCHAR(50) DEFAULT 'None'",
      "ALTER TABLE academic_calendar_events ADD COLUMN reminders JSON NULL",
      "ALTER TABLE academic_calendar_events ADD COLUMN attachments JSON NULL",
      "ALTER TABLE academic_calendar_events ADD COLUMN notifications JSON NULL"
    ];

    for (const sql of extraSchemaAlters) {
      try {
        await sqlDb.query(sql);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON') {
          // Ignore duplicate field names or unsupported alters
        }
      }
    }
  } catch (err) {
    console.error('[SQL Init ERROR] Failed to run schema DDL:', err);
  }
};

// Migrate legacy JSON databases (db.json and tenant files) to MySQL
const migrateJsonToSql = async () => {
  try {
    // Check if schools table is empty
    const existingSchools = await sqlDb.query('SELECT COUNT(*) as cnt FROM schools');
    if (existingSchools[0].cnt > 0) {
      console.log('[SQL Migrate] Database is already populated. Skipping migration.');
      return;
    }

    console.log('[SQL Migrate] No schools found. Starting legacy JSON database migration to MySQL...');

    // 1. Read Global Platform DB
    let globalDb = {};
    if (fs.existsSync(GLOBAL_DB_FILE)) {
      globalDb = JSON.parse(fs.readFileSync(GLOBAL_DB_FILE, 'utf8'));
    }

    const schools = globalDb.schools || [];
    const subscriptionPlans = globalDb.subscriptionPlans || [];

    // Seed subscription plans
    for (const plan of subscriptionPlans) {
      await sqlDb.query(
        'INSERT INTO subscription_plans (id, name, price, features) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
        [plan.id, plan.name, plan.price, JSON.stringify(plan.features || [])]
      );
    }

    // Seed global platform activities
    const globalActivities = globalDb.activities || [];
    for (const act of globalActivities) {
      const actType = act.type === 'finance' ? 'account_management' : act.type;
      await sqlDb.query(
        'INSERT INTO activities (id, type, title, description, time, timestamp, color, bg, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [act.id, actType, act.title, act.desc || act.description, act.time, act.timestamp, act.color, act.bg, 'platform']
      );
    }

    // 2. Scan and migrate schools & tenants
    for (const school of schools) {
      console.log(`[SQL Migrate] Migrating school: ${school.name} (${school.subdomain})...`);
      
      // Save school profile
      await sqlDb.query(
        `INSERT INTO schools (
          id, name, code, subdomain, logo, principalName, email, phone, address, city, state, country, 
          academicSession, subscriptionPlan, url, status, adminName, adminEmail, adminUsername, adminPassword, 
          createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          school.id, school.name, school.code, school.subdomain, school.logo, school.principalName, school.email, 
          school.phone, school.address, school.city, school.state, school.country, school.academicSession, 
          school.subscriptionPlan, school.url, school.status, school.adminName, school.adminEmail, 
          school.adminUsername, school.adminPassword, 
          school.createdAt
        ]
      );

      // Try loading tenant db.json
      const tenantFile = path.join(TENANTS_DIR, `db_${school.subdomain}.json`);
      if (fs.existsSync(tenantFile)) {
        try {
          const tenantDb = JSON.parse(fs.readFileSync(tenantFile, 'utf8'));
          const tenantId = school.subdomain;

          // Seed teachers
          const teachers = tenantDb.teachers || [];
          for (const t of teachers) {
            await sqlDb.query(
              `INSERT INTO staff (
                id, name, email, phone, username, password, gender, qualification, experience, dateOfJoining, 
                salaryGrade, address, city, state, pincode, emergencyContact, emergencyPhone, photo, aadharFile, 
                certificateFile, status, avatarBg, tenantId
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                t.id, t.name, t.email, t.phone, t.username, t.password, t.gender, t.qualification, t.experience, 
                t.dateOfJoining, t.salaryGrade, t.address, t.city, t.state, t.pincode, t.emergencyContact, 
                t.emergencyPhone, t.photo, t.aadharFile, t.certificateFile, t.status || 'Active', t.avatarBg, tenantId
              ]
            );
          }

          // Seed staff
          const staff = tenantDb.staff || [];
          for (const s of staff) {
            await sqlDb.query(
              `INSERT INTO employees (
                id, name, fullName, role, department, email, phone, gender, qualification, experience, 
                dateOfJoining, salaryGrade, reportingTo, address, city, state, pincode, emergencyContact, 
                emergencyPhone, photo, aadharFile, certificateFile, status, avatarBg, password, tenantId, designation
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                s.id, s.name, s.fullName, s.role, s.department, s.email, s.phone, s.gender, s.qualification, 
                s.experience, s.dateOfJoining, s.salaryGrade, s.reportingTo, s.address, s.city, s.state, s.pincode, 
                s.emergencyContact, s.emergencyPhone, s.photo, s.aadharFile, s.certificateFile, s.status || 'Active', 
                s.avatarBg, s.password, tenantId, s.designation || ''
              ]
            );
          }

          // Seed students (Normalized Tables)
          const students = tenantDb.students || [];
          for (const s of students) {
            // Write core student profile
            await sqlDb.query(
              `INSERT INTO students (
                id, firstName, middleName, lastName, name, fullName, admissionNumber, admissionDate, dob, 
                gender, bloodGroup, nationality, category, religion, aadhaarNumber, photo, status, photoBg, 
                email, phone, feeStatus, \`rank\`, createdAt, updatedAt, tenantId
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                s.id, s.firstName || s.fullName.split(' ')[0], s.middleName || '', s.lastName || s.fullName.split(' ').slice(1).join(' '),
                s.fullName || s.name, s.fullName || s.name, s.admissionNumber || `ADM-${Date.now().toString().slice(-6)}`,
                s.admissionDate || new Date().toISOString().split('T')[0], s.dob, s.gender, s.bloodGroup, 
                s.nationality || 'Indian', s.category || 'General', s.religion || 'Hinduism', s.aadhaarNumber, s.photo, 
                s.status || 'Active', s.photoBg, s.email, s.phone, s.feeStatus || 'Pending', s.rank || 'N/A', 
                s.createdAt || new Date().toISOString(), s.updatedAt || new Date().toISOString(), tenantId
              ]
            );

            // Write active student enrollment
            await sqlDb.query(
              `INSERT INTO student_enrollments (
                id, studentId, academicYear, admissionType, studentClass, section, rollNumber, previousSchoolName, 
                previousSchoolAddress, previousClassStudied, transferCertificateNumber, status, createdAt, updatedAt, tenantId
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                `ENR-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.academicYear || '2026-2027', 
                s.admissionType || 'New Admission', s.studentClass || 'I', s.section || 'A', s.rollNumber || s.roll || '', 
                s.previousSchool || '', '', '', '', s.status || 'Active', new Date().toISOString(), new Date().toISOString(), tenantId
              ]
            );

            // Write parent info
            await sqlDb.query(
              `INSERT INTO parents (
                id, studentId, fatherName, fatherOccupation, fatherMobile, fatherEmail, motherName, motherOccupation, 
                motherMobile, motherEmail, guardianName, guardianRelation, guardianContact, parentUsername, parentPassword, 
                createdAt, updatedAt, tenantId
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                `PAR-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.fatherName || '', '', s.fatherMobile || '', 
                '', s.motherName || '', '', s.motherMobile || '', '', s.guardianName || s.guardian || '', 
                s.guardianRelation || '', s.guardianContact || '', `parent_${s.admissionNumber}`, 'parent123', 
                new Date().toISOString(), new Date().toISOString(), tenantId
              ]
            );

            // Write address details
            await sqlDb.query(
              `INSERT INTO addresses (
                id, studentId, currentAddress, permanentAddress, city, state, country, postalCode, 
                emergencyContactNumber, isSameAddress, createdAt, updatedAt, tenantId
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                `ADD-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.address || '', s.address || '', 
                s.city || '', s.state || '', 'India', s.pincode || '', s.phone || '', true, 
                new Date().toISOString(), new Date().toISOString(), tenantId
              ]
            );

            // Write medical records
            await sqlDb.query(
              `INSERT INTO medical_records (
                id, studentId, bloodGroup, medicalConditions, allergies, disabilities, emergencyNotes, 
                doctorName, doctorContact, createdAt, updatedAt, tenantId
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                `MED-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.bloodGroup || '', '', '', '', '', '', '', 
                new Date().toISOString(), new Date().toISOString(), tenantId
              ]
            );

            // Save documents (photo, aadhaar, tc etc.)
            if (s.photo) {
              await sqlDb.query(
                'INSERT INTO documents (id, studentId, documentType, fileName, filePath, fileSize, uploadedAt, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [`DOC-${Math.floor(100000 + Math.random() * 900000)}`, s.id, 'photo', s.photo.split('/').pop(), s.photo, 0, new Date().toISOString(), tenantId]
              );
            }

            // Write fee assignments
            await sqlDb.query(
              `INSERT INTO fee_assignments (
                id, studentId, feeStructure, scholarshipDetails, discountType, discountAmount, initialPaymentStatus, assignedAt, tenantId
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                `FEE-ASN-${Math.floor(100000 + Math.random() * 900000)}`, s.id, '', '', '', 0, s.feeStatus || 'Pending', new Date().toISOString(), tenantId
              ]
            );

            // Create account logins
            await sqlDb.query(
              'INSERT INTO student_accounts (id, studentId, studentUsername, studentPassword, createdAt, tenantId) VALUES (?, ?, ?, ?, ?, ?)',
              [`ACT-S-${s.id}`, s.id, s.admissionNumber, `stu@${s.fullName.split(' ')[0].toLowerCase()}`, new Date().toISOString(), tenantId]
            );
            await sqlDb.query(
              'INSERT INTO parent_accounts (id, studentId, parentUsername, parentPassword, createdAt, tenantId) VALUES (?, ?, ?, ?, ?, ?)',
              [`ACT-P-${s.id}`, s.id, `parent_${s.admissionNumber}`, 'parent123', new Date().toISOString(), tenantId]
            );
          }

          // Seed timetables
          const timetables = tenantDb.timetables || [];
          for (const t of timetables) {
            await sqlDb.query(
              'INSERT INTO timetables (cohort, time, mon, tue, wed, thu, fri, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [t.cohort, t.time, JSON.stringify(t.mon), JSON.stringify(t.tue), JSON.stringify(t.wed), JSON.stringify(t.thu), JSON.stringify(t.fri), tenantId]
            );
          }

          // Seed invoices
          const invoices = tenantDb.invoices || [];
          for (const inv of invoices) {
            await sqlDb.query(
              'INSERT INTO invoices (invoiceNo, name, grade, amount, date, status, method, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [inv.invoiceNo, inv.name, inv.grade, inv.amount, inv.date, inv.status, inv.method || 'N/A', tenantId]
            );
          }

          // Seed fees
          const fees = tenantDb.fees || [];
          for (const f of fees) {
            await sqlDb.query(
              `INSERT INTO fees (
                id, studentId, studentName, classId, sectionId, feeType, totalAmount, paidAmount, dueAmount, status, paymentDate, paymentMethod, remarks, createdAt, tenantId,
                receiptNumber, transactionId, discount, fine, amount, studentClass, section, paymentStatus
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                f.id || f.feeId, f.studentId, f.studentName, f.classId || f.studentClass || '', f.sectionId || f.section || '', f.feeType, f.totalAmount, f.paidAmount, f.dueAmount, f.status || f.paymentStatus || 'Pending', f.paymentDate, f.paymentMethod, f.remarks, f.createdAt, tenantId,
                f.receiptNumber || '', f.transactionId || '', parseFloat(f.discount || 0), parseFloat(f.fine || 0), parseFloat(f.amount || 0), f.studentClass || '', f.section || '', f.paymentStatus || f.status || 'Pending'
              ]
            );
          }

          // Seed expenses
          const expenses = tenantDb.expenses || [];
          for (const e of expenses) {
            await sqlDb.query(
              'INSERT INTO expenses (id, category, amount, date, description, status, paidTo, paymentMethod, attachment, createdAt, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [e.id, e.category, e.amount, e.date || e.paymentDate, e.description || '', e.status || 'Approved', e.paidTo || '', e.paymentMethod || '', e.attachment || '', e.createdAt || new Date().toISOString(), tenantId]
            );
          }

          // Seed payroll
          const payroll = tenantDb.payroll || [];
          for (const p of payroll) {
            await sqlDb.query(
              'INSERT INTO payroll (id, staffId, staffName, role, month, basicSalary, allowances, deductions, netSalary, paymentStatus, paymentDate, paymentMethod, createdAt, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [p.id, p.staffId, p.staffName, p.role, p.month, p.basicSalary, p.allowances, p.deductions, p.netSalary, p.paymentStatus, p.paymentDate, p.paymentMethod, p.createdAt || new Date().toISOString(), tenantId]
            );
          }

          // Seed staff payments
          const staffPayments = tenantDb.staffPayments || [];
          for (const sp of staffPayments) {
            await sqlDb.query(
              'INSERT INTO staff_payments (id, staffId, amount, paymentDate, paymentMethod, status, remarks, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [sp.id || `SP-${Date.now()}`, sp.staffId, sp.amount, sp.paymentDate, sp.paymentMethod, sp.status || 'Paid', sp.remarks || '', tenantId]
            );
          }

          // Seed activities
          const activities = tenantDb.activities || [];
          for (const act of activities) {
            const actType = act.type === 'finance' ? 'account_management' : act.type;
            await sqlDb.query(
              'INSERT INTO activities (id, type, title, description, time, timestamp, color, bg, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [act.id, actType, act.title, act.desc || act.description, act.time, act.timestamp, act.color, act.bg, tenantId]
            );
          }

          // Seed exams
          const exams = tenantDb.exams || [];
          for (const ex of exams) {
            await sqlDb.query(
              'INSERT INTO exams (id, name, term, startDate, endDate, status, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [ex.id, ex.name, ex.term, ex.startDate, ex.endDate, ex.status, tenantId]
            );
          }

          // Seed exam timetables
          const examTimetables = tenantDb.examTimetables || [];
          for (const et of examTimetables) {
            await sqlDb.query(
              'INSERT INTO exam_timetables (id, examId, examName, classId, subject, date, timeSlot, room, maxMarks, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [et.id, et.examId, et.examName, et.classId, et.subject, et.date, et.timeSlot, et.room, et.maxMarks || 100, tenantId]
            );
          }

          // Seed notices
          const notices = tenantDb.notices || [];
          for (const n of notices) {
            await sqlDb.query(
              'INSERT INTO notices (id, title, content, date, audience, createdBy, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [n.id, n.title, n.content, n.date, n.audience || 'All', n.createdBy || '', tenantId]
            );
          }

          // Seed holidays
          const holidays = tenantDb.holidays || [];
          for (const h of holidays) {
            await sqlDb.query(
              'INSERT INTO holidays (id, title, startDate, endDate, description, tenantId) VALUES (?, ?, ?, ?, ?, ?)',
              [h.id, h.title, h.startDate, h.endDate, h.description || '', tenantId]
            );
          }

          // Seed events
          const events = tenantDb.events || [];
          for (const ev of events) {
            await sqlDb.query(
              'INSERT INTO events (id, title, description, date, time, venue, audience, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [ev.id, ev.title, ev.description || '', ev.date, ev.time, ev.venue || '', ev.audience || 'All', tenantId]
            );
          }

          // Seed results
          const results = tenantDb.results || [];
          for (const r of results) {
            await sqlDb.query(
              'INSERT INTO results (id, studentId, studentName, examId, examName, subject, marksObtained, maxMarks, grade, remarks, isLocked, isPublished, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [r.id, r.studentId, r.studentName, r.examId, r.examName, r.subject, r.marksObtained, r.maxMarks || 100, r.grade || '', r.remarks || '', r.isLocked || false, r.isPublished || false, tenantId]
            );
          }

          // Seed overall results
          const overallResults = tenantDb.overallResults || [];
          for (const o of overallResults) {
            await sqlDb.query(
              'INSERT INTO overall_results (id, studentId, studentName, classId, sectionId, percentage, grade, status, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [o.id || `OR-${o.studentId}`, o.studentId, o.studentName, o.classId, o.sectionId, o.percentage, o.grade, o.status, tenantId]
            );
          }

          // Seed subjects
          const subjects = tenantDb.subjects || [];
          for (const sub of subjects) {
            await sqlDb.query(
              'INSERT INTO subjects (id, name, code, classId, teacherId, teacherName, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [sub.id, sub.subjectName || sub.name || '', sub.code || '', sub.grade || sub.classId || '', sub.teacherId || '', sub.teacherName || '', tenantId]
            );
          }

          // Seed timeslots
          const timeslots = tenantDb.timeslots || [];
          for (const slot of timeslots) {
            await sqlDb.query(
              'INSERT INTO timeslots (slotTime, tenantId) VALUES (?, ?)',
              [slot, tenantId]
            );
          }

          // Seed fee structures
          const feeStructures = tenantDb.feeStructures || [];
          for (const fsItem of feeStructures) {
            await sqlDb.query(
              'INSERT INTO fee_structures (id, classId, amount, frequency, tenantId) VALUES (?, ?, ?, ?, ?)',
              [fsItem.id || `FS-${fsItem.grade}`, fsItem.grade, fsItem.amount, fsItem.frequency || 'Yearly', tenantId]
            );
          }

          // Seed salary structures
          const salaryStructures = tenantDb.salaryStructures || [];
          for (const ss of salaryStructures) {
            await sqlDb.query(
              'INSERT INTO salary_structures (id, gradeName, basicSalary, allowances, deductions, tenantId) VALUES (?, ?, ?, ?, ?, ?)',
              [ss.id || `SS-${ss.gradeName}`, ss.gradeName, ss.basicSalary, JSON.stringify(ss.allowances || []), JSON.stringify(ss.deductions || []), tenantId]
            );
          }

          // Seed staff salary structures
          const staffSalaryStructures = tenantDb.staffSalaryStructures || [];
          for (const sss of staffSalaryStructures) {
            await sqlDb.query(
              'INSERT INTO staff_salary_structures (id, position, basicSalary, allowances, deductions, tenantId) VALUES (?, ?, ?, ?, ?, ?)',
              [sss.id || `SSS-${sss.position}`, sss.position, sss.basicSalary, JSON.stringify(sss.allowances || []), JSON.stringify(sss.deductions || []), tenantId]
            );
          }

          // Seed income
          const income = tenantDb.income || [];
          for (const inc of income) {
            await sqlDb.query(
              'INSERT INTO income (id, source, amount, date, description, tenantId) VALUES (?, ?, ?, ?, ?, ?)',
              [inc.id, inc.source, inc.amount, inc.date || inc.paymentDate, inc.description || '', tenantId]
            );
          }

          // Seed attendance
          const attendance = tenantDb.attendance || [];
          for (const att of attendance) {
            await sqlDb.query(
              `INSERT INTO attendance (
                attendanceId, studentId, classId, sectionId, attendanceDate, attendanceStatus, remarks, markedBy, createdAt, updatedAt, tenantId
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [att.attendanceId, att.studentId, att.classId, att.sectionId, att.attendanceDate, att.attendanceStatus, att.remarks || '', att.markedBy || '', att.createdAt, att.updatedAt, tenantId]
            );
          }

          console.log(`[SQL Migrate] Finished migration for tenant subdomain: ${school.subdomain}`);
        } catch (err) {
          console.error(`[SQL Migrate ERROR] Failed to migrate tenant JSON file ${tenantFile}:`, err);
        }
      }
    }

    console.log('[SQL Migrate] Legacy JSON data migration completed successfully!');
  } catch (err) {
    console.error('[SQL Migrate ERROR] JSON Migration triggered error:', err);
  }
};

// Initial database check called on server boot
export const initSqlDb = async () => {
  const isConnected = await sqlDb.testConnection();
  if (isConnected) {
    // 1. Create tables
    await createTablesFromSchema();
    // 2. Run data migration
    await migrateJsonToSql();
    isSqlInitialized = true;
    console.log('[SQL Init] MySQL Caching Adapter is active and running.');
  } else {
    console.warn('[SQL Init WARNING] MySQL Connection unavailable. Falling back to local JSON files.');
    isSqlInitialized = false;
  }
};

// Start the init procedure on boot
initSqlDb();

// Default roles and permissions seeder data
export const getDefaultRoles = () => {
  const modules = [
    'overview',
    'student-directory',
    'teacher-directory',
    'staff-directory',
    'grade-settings',
    'grade-subjects',
    'register-student',
    'add-staff',
    'add-employee',
    'student-manager',
    'employee-attendance',
    'attendance',
    'attendance-history',
    'academic-manager',
    'published-timetable',
    'published-exam',
    'academic-activities',
    'academic-calendar',
    'results-manager',
    'results-history',
    'finance',
    'expense-dashboard',
    'expense-all-expenses',
    'expense-tracker',
    'expense-history',
    'income',
    'financial-reports',
    'roles-permissions'
  ];
  const actions = ['view', 'create', 'edit', 'delete', 'approve', 'publish', 'export', 'import', 'manage-settings'];

  const createEmptyMatrix = () => {
    const matrix = {};
    modules.forEach(m => {
      matrix[m] = {};
      actions.forEach(a => {
        matrix[m][a] = false;
      });
    });
    return matrix;
  };

  return [
    // ===== STAFF ROLES =====
    {
      id: 'role-principal',
      name: 'Principal',
      description: 'School principal with full administrative access to all modules and system settings.',
      active: true,
      isSystem: true,
      permissions: createEmptyMatrix()
    },
    {
      id: 'role-vice-principal',
      name: 'Vice Principal',
      description: 'Vice principal with broad access to academics, staff, and student management.',
      active: true,
      isSystem: true,
      permissions: createEmptyMatrix()
    },
    {
      id: 'role-academic-coordinator',
      name: 'Academic Coordinator',
      description: 'Coordinates academic programs, timetables, exam schedules, and curriculum planning.',
      active: true,
      isSystem: true,
      permissions: createEmptyMatrix()
    },
    {
      id: 'role-subject-teacher',
      name: 'Subject Teacher',
      description: 'Subject teacher. Records attendance, enters marks, manages academic activities, and views student profiles.',
      active: true,
      isSystem: true,
      permissions: createEmptyMatrix()
    },
    {
      id: 'role-librarian',
      name: 'Librarian',
      description: 'School librarian. Manages library resources, student access, and catalog records.',
      active: true,
      isSystem: true,
      permissions: createEmptyMatrix()
    },
    {
      id: 'role-receptionist',
      name: 'Receptionist',
      description: 'Front-office receptionist. Manages admissions, visitor records, and inquiry handling.',
      active: true,
      isSystem: true,
      permissions: createEmptyMatrix()
    },
    {
      id: 'role-accountant',
      name: 'Accountant',
      description: 'Accounts administrator. Manages fee structures, collections, invoices, salaries, and financial reports.',
      active: true,
      isSystem: true,
      permissions: createEmptyMatrix()
    },
    {
      id: 'role-expense-manager',
      name: 'Expense Manager',
      description: 'Expense manager. Oversees school expenses, financial reporting, and budgeting.',
      active: true,
      isSystem: true,
      permissions: createEmptyMatrix()
    },
    // ===== PORTAL ROLES =====
    {
      id: 'role-student',
      name: 'Student',
      description: 'Student portal. Views timetables, exam reports, notices, and events.',
      active: true,
      isSystem: true,
      permissions: createEmptyMatrix()
    },
    {
      id: 'role-parent',
      name: 'Parent',
      description: 'Parent portal. Views children attendance, fees, academic cards, and school notices.',
      active: true,
      isSystem: true,
      permissions: createEmptyMatrix()
    }
  ];
};

// Load dynamic cached tenant details from MySQL database
export const loadTenantSqlIntoMemory = async (tenantId) => {
  try {
    if (!isSqlActive()) return null;
    
    const isGlobal = !tenantId || tenantId === 'localhost' || tenantId === 'platform';
    const queryTenantId = isGlobal ? 'platform' : tenantId;
    
    // Create base data structure
    const data = {
      school: {},
      students: [],
      teachers: [],
      staff: [],
      timetables: [],
      invoices: [],
      fees: [],
      expenses: [],
      payroll: [],
      staffPayments: [],
      activities: [],
      exams: [],
      examTimetables: [],
      notices: [],
      holidays: [],
      events: [],
      results: [],
      overallResults: [],
      subjects: [],
      timeslots: [],
      feeStructures: [],
      salaryStructures: [],
      staffSalaryStructures: [],
      income: [],
      attendance: [],
      subscriptionPlans: [],
      schools: [],
      roles: [],
      userAccess: [],
      auditLogs: [],
      grades: [],
      departments: [],
      gradeDepartments: [],
      sections: [],
      publishedClassTimetables: [],
      publishedTeacherTimetables: []
    };

    // Load existing sections and published timetables from local JSON backup file to preserve custom config
    if (!isGlobal) {
      const tenantFile = path.join(TENANTS_DIR, `db_${tenantId}.json`);
      if (fs.existsSync(tenantFile)) {
        try {
          const tenantData = JSON.parse(fs.readFileSync(tenantFile, 'utf8'));
          if (tenantData.sections) {
            data.sections = tenantData.sections;
          }
          if (tenantData.publishedClassTimetables) {
            data.publishedClassTimetables = tenantData.publishedClassTimetables;
          }
          if (tenantData.publishedTeacherTimetables) {
            data.publishedTeacherTimetables = tenantData.publishedTeacherTimetables;
          }
        } catch (e) {
          console.error(`Failed to read tenant custom fields from JSON:`, e);
        }
      }
    }

    if (data.sections === undefined) {
      data.sections = [];
    }

    // 1. Get Global Platform details
    const globalSchools = await sqlDb.query('SELECT * FROM schools');
    data.schools = globalSchools;

    const plans = await sqlDb.query('SELECT * FROM subscription_plans');
    data.subscriptionPlans = plans.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || [])
    }));

    if (!isGlobal) {
      // Find school info
      const matchedSchool = globalSchools.find(s => s.subdomain === tenantId);
      if (matchedSchool) {
        data.school = {
          name: matchedSchool.name,
          subdomain: matchedSchool.subdomain,
          address: matchedSchool.address || '',
          city: matchedSchool.city || '',
          state: matchedSchool.state || '',
          phone: matchedSchool.phone || '',
          email: matchedSchool.email || '',
          ratePerStudent: matchedSchool.ratePerStudent || '250.00',
          adminName: matchedSchool.adminName || '',
          adminEmail: matchedSchool.adminEmail || '',
          adminPassword: matchedSchool.adminPassword || '',
          principal: matchedSchool.principalName || ''
        };
      }
    }

    // 2. Fetch specific tables filtered by tenantId
    const tId = queryTenantId;

    // Load simple fields
    const dbTeachers = await sqlDb.query('SELECT * FROM staff WHERE tenantId = ?', [tId]);
    data.teachers = dbTeachers.map(t => {
      let qual = t.qualification;
      if (qual && (qual.startsWith('[') || qual.startsWith('{'))) {
        try {
          qual = JSON.parse(qual);
        } catch (e) {}
      }
      let exp = t.experiences;
      if (exp && (exp.startsWith('[') || exp.startsWith('{'))) {
        try {
          exp = JSON.parse(exp);
        } catch (e) {}
      }
      return {
        ...t,
        qualification: qual,
        experiences: exp,
        sameAsPermanent: t.sameAsPermanent === 'Yes' ? true : (t.sameAsPermanent === 'No' ? false : t.sameAsPermanent)
      };
    });
    data.staff = await sqlDb.query('SELECT * FROM employees WHERE tenantId = ?', [tId]);
    data.invoices = await sqlDb.query('SELECT * FROM invoices WHERE tenantId = ?', [tId]);
    
    // Parse decimals back to floats for finance metrics
    const rawFees = await sqlDb.query('SELECT * FROM fees WHERE tenantId = ?', [tId]);
    data.fees = rawFees.map(f => ({
      ...f,
      totalAmount: parseFloat(f.totalAmount || 0),
      paidAmount: parseFloat(f.paidAmount || 0),
      dueAmount: parseFloat(f.dueAmount || 0),
      discount: parseFloat(f.discount || 0),
      fine: parseFloat(f.fine || 0),
      amount: parseFloat(f.amount || 0)
    }));

    const rawExpenses = await sqlDb.query('SELECT * FROM expenses WHERE tenantId = ?', [tId]);
    data.expenses = rawExpenses.map(e => ({
      ...e,
      amount: parseFloat(e.amount || 0),
      subcategory: e.subcategory || '',
      grade: e.grade || '',
      department: e.department || '',
      expenseType: e.expenseType || ''
    }));

    const rawPayroll = await sqlDb.query('SELECT * FROM payroll WHERE tenantId = ?', [tId]);
    data.payroll = rawPayroll.map(p => ({
      ...p,
      basicSalary: parseFloat(p.basicSalary || 0),
      allowances: parseFloat(p.allowances || 0),
      deductions: parseFloat(p.deductions || 0),
      netSalary: parseFloat(p.netSalary || 0)
    }));

    const rawStaffPayments = await sqlDb.query('SELECT * FROM staff_payments WHERE tenantId = ?', [tId]);
    data.staffPayments = rawStaffPayments.map(sp => ({
      id: sp.id,
      paymentId: sp.id,
      staffId: sp.staffId,
      amount: parseFloat(sp.amount || 0),
      paymentDate: sp.paymentDate,
      paymentMethod: sp.paymentMethod,
      paymentStatus: sp.status || 'Paid',
      status: sp.status || 'Paid',
      remarks: sp.remarks,
      staffName: sp.staffName || '',
      staffRole: sp.staffRole || '',
      basicSalary: parseFloat(sp.basicSalary || 0),
      allowances: parseFloat(sp.allowances || 0),
      bonus: parseFloat(sp.bonus || 0),
      deductions: parseFloat(sp.deductions || 0),
      pfDeduction: parseFloat(sp.pfDeduction || 0),
      taxDeduction: parseFloat(sp.taxDeduction || 0),
      netSalary: parseFloat(sp.netSalary || sp.amount || 0)
    }));

    const rawIncome = await sqlDb.query('SELECT * FROM income WHERE tenantId = ?', [tId]);
    data.income = rawIncome.map(i => ({ ...i, amount: parseFloat(i.amount || 0) }));

    data.activities = await sqlDb.query('SELECT * FROM activities WHERE tenantId = ?', [tId]);
    const rawExams = await sqlDb.query('SELECT * FROM exams WHERE tenantId = ?', [tId]);
    data.exams = rawExams.map(ex => {
      let gradeSections = [];
      if (ex.gradeSections) {
        try {
          gradeSections = typeof ex.gradeSections === 'string' ? JSON.parse(ex.gradeSections) : ex.gradeSections;
        } catch (e) {}
      }
      let subjectIncluded = {};
      if (ex.subjectIncluded) {
        try {
          subjectIncluded = typeof ex.subjectIncluded === 'string' ? JSON.parse(ex.subjectIncluded) : ex.subjectIncluded;
        } catch (e) {}
      }
      let subjectMarks = {};
      if (ex.subjectMarks) {
        try {
          subjectMarks = typeof ex.subjectMarks === 'string' ? JSON.parse(ex.subjectMarks) : ex.subjectMarks;
        } catch (e) {}
      }
      return {
        id: ex.id,
        examName: ex.name || '',
        name: ex.name || '',
        examType: ex.term || '',
        term: ex.term || '',
        startDate: ex.startDate || '',
        endDate: ex.endDate || '',
        status: ex.status || 'Draft',
        description: ex.description || '',
        totalMarks: ex.totalMarks || 100,
        gradeSections,
        subjectIncluded,
        subjectMarks,
        createdAt: ex.createdAt || '',
        timetablePublished: ex.timetablePublished === 1 || ex.timetablePublished === true
      };
    });

    const rawEt = await sqlDb.query('SELECT * FROM exam_timetables WHERE tenantId = ?', [tId]);
    data.examTimetables = rawEt.map(et => ({
      ...et,
      roomAllocation: et.room || '',
      maxMarks: parseInt(et.maxMarks || 100)
    }));

    data.notices = await sqlDb.query('SELECT * FROM notices WHERE tenantId = ?', [tId]);
    data.holidays = await sqlDb.query('SELECT * FROM holidays WHERE tenantId = ?', [tId]);
    data.events = await sqlDb.query('SELECT * FROM events WHERE tenantId = ?', [tId]);
    data.academicCalendarEvents = await sqlDb.query('SELECT * FROM academic_calendar_events WHERE tenantId = ?', [tId]);
    data.academicCalendarImports = await sqlDb.query('SELECT * FROM academic_calendar_imports WHERE tenantId = ?', [tId]);
    const rawPublished = await sqlDb.query('SELECT eventId FROM published_calendar_events WHERE tenantId = ?', [tId]);
    data.publishedCalendarEvents = rawPublished.map(p => p.eventId);

    const rawResults = await sqlDb.query('SELECT * FROM results WHERE tenantId = ?', [tId]);
    data.results = rawResults.map(r => ({
      ...r,
      obtainedMarks: r.marksObtained !== undefined ? r.marksObtained : 0,
      totalMarks: r.maxMarks !== undefined ? r.maxMarks : 100,
      locked: r.isLocked === 1 || r.isLocked === true,
      published: r.isPublished === 1 || r.isPublished === true,
      status: r.status || 'Draft'
    }));

    data.subjects = (await sqlDb.query('SELECT * FROM subjects WHERE tenantId = ?', [tId]))
      .map(s => ({ ...s, subjectName: s.name, grade: s.classId }));
    data.attendance = await sqlDb.query('SELECT * FROM attendance WHERE tenantId = ?', [tId]);

    const rawOverall = await sqlDb.query('SELECT * FROM overall_results WHERE tenantId = ?', [tId]);
    data.overallResults = rawOverall.map(o => ({
      ...o,
      percentage: parseFloat(o.percentage || 0),
      totalObtained: parseFloat(o.totalObtained || 0),
      totalMax: parseFloat(o.totalMax || 0),
      gpa: parseFloat(o.gpa || 0)
    }));

    // Load timeslots (flat list mapping)
    const dbTimeslots = await sqlDb.query('SELECT slotTime FROM timeslots WHERE tenantId = ? ORDER BY id', [tId]);
    data.timeslots = dbTimeslots.map(ts => ts.slotTime);

    // Load JSON config tables
    const dbSalary = await sqlDb.query('SELECT * FROM salary_structures WHERE tenantId = ?', [tId]);
    data.salaryStructures = dbSalary.map(ss => ({
      id: ss.id,
      gradeName: ss.gradeName || ss.designation,
      designation: ss.designation || ss.gradeName,
      basicSalary: parseFloat(ss.basicSalary || 0),
      allowances: parseFloat(ss.allowances || 0),
      deductions: parseFloat(ss.deductions || 0),
      pfDeduction: parseFloat(ss.pfDeduction || 0),
      taxDeduction: parseFloat(ss.taxDeduction || 0),
      netSalary: parseFloat(ss.netSalary || 0)
    }));

    const dbStaffSalary = await sqlDb.query('SELECT * FROM staff_salary_structures WHERE tenantId = ?', [tId]);
    data.staffSalaryStructures = dbStaffSalary.map(sss => ({
      id: sss.id,
      position: sss.position || sss.designation,
      designation: sss.designation || sss.position,
      basicSalary: parseFloat(sss.basicSalary || 0),
      allowances: parseFloat(sss.allowances || 0),
      bonus: parseFloat(sss.bonus || 0),
      deductions: parseFloat(sss.deductions || 0),
      pfDeduction: parseFloat(sss.pfDeduction || 0),
      taxDeduction: parseFloat(sss.taxDeduction || 0),
      netSalary: parseFloat(sss.netSalary || 0),
      designationLevel: sss.designationLevel || '',
      employmentType: sss.employmentType || ''
    }));

    const dbFeeStructures = await sqlDb.query('SELECT * FROM fee_structures WHERE tenantId = ?', [tId]);
    data.feeStructures = dbFeeStructures.map(fsItem => ({
      id: fsItem.id,
      grade: fsItem.classId || fsItem.studentClass,
      studentClass: fsItem.studentClass || fsItem.classId,
      admissionFee: parseFloat(fsItem.admissionFee || 0),
      tuitionFee: parseFloat(fsItem.tuitionFee || 0),
      examFee: parseFloat(fsItem.examFee || 0),
      transportFee: parseFloat(fsItem.transportFee || 0),
      hostelFee: parseFloat(fsItem.hostelFee || 0),
      libraryFee: parseFloat(fsItem.libraryFee || 0),
      otherCharges: parseFloat(fsItem.otherCharges || 0),
      totalFee: parseFloat(fsItem.totalFee || fsItem.amount || 0),
      amount: parseFloat(fsItem.amount || fsItem.totalFee || 0),
      frequency: fsItem.frequency
    }));

    const dbTimetables = await sqlDb.query('SELECT * FROM timetables WHERE tenantId = ?', [tId]);
    const loadedSlots = [];
    const dayMap = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };
    for (const t of dbTimetables) {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      for (const d of days) {
        let val = t[d];
        if (typeof val === 'string') {
          try {
            val = JSON.parse(val);
          } catch (e) {
            val = null;
          }
        }
        if (val && val.subject && val.subject.trim() !== '') {
          loadedSlots.push({
            id: `TT-${t.cohort}-${t.time}-${d}`.replace(/\s+/g, '-'),
            cohort: t.cohort,
            day: dayMap[d],
            time: t.time,
            subject: val.subject,
            teacher: val.teacher || '',
            room: val.room || '',
            session: '2026-2027'
          });
        }
      }
    }
    data.timetables = loadedSlots;

    // 3. Reconstruct students (Joining Normalized Tables in memory)
    const sqlStudents = await sqlDb.query('SELECT * FROM students WHERE tenantId = ?', [tId]);
    const sqlEnrollments = await sqlDb.query('SELECT * FROM student_enrollments WHERE tenantId = ?', [tId]);
    const sqlParents = await sqlDb.query('SELECT * FROM parents WHERE tenantId = ?', [tId]);
    const sqlAddresses = await sqlDb.query('SELECT * FROM addresses WHERE tenantId = ?', [tId]);
    const sqlMedicals = await sqlDb.query('SELECT * FROM medical_records WHERE tenantId = ?', [tId]);
    const sqlDocs = await sqlDb.query('SELECT * FROM documents WHERE tenantId = ?', [tId]);
    const sqlFeesAssigned = await sqlDb.query('SELECT * FROM fee_assignments WHERE tenantId = ?', [tId]);
    const sqlStudentAccounts = await sqlDb.query('SELECT * FROM student_accounts WHERE tenantId = ?', [tId]);
    const sqlParentAccounts = await sqlDb.query('SELECT * FROM parent_accounts WHERE tenantId = ?', [tId]);

    data.students = sqlStudents.map(s => {
      const enrollment = sqlEnrollments.find(e => e.studentId === s.id) || {};
      const parent = sqlParents.find(p => p.studentId === s.id) || {};
      const address = sqlAddresses.find(a => a.studentId === s.id) || {};
      const medical = sqlMedicals.find(m => m.studentId === s.id) || {};
      const fee = sqlFeesAssigned.find(f => f.studentId === s.id) || {};
      const studAcc = sqlStudentAccounts.find(sa => sa.studentId === s.id) || {};
      const parentAcc = sqlParentAccounts.find(pa => pa.studentId === s.id) || {};

      const docList = sqlDocs.filter(d => d.studentId === s.id);
      const photoDoc = docList.find(d => d.documentType === 'photo');
      const aadhaarDoc = docList.find(d => d.documentType === 'aadhaar');
      const birthDoc = docList.find(d => d.documentType === 'birthCertificate');
      const marksheetDoc = docList.find(d => d.documentType === 'marksheet');
      const tcDoc = docList.find(d => d.documentType === 'tc');
      const addProofDoc = docList.find(d => d.documentType === 'addressProof');
      const medCertDoc = docList.find(d => d.documentType === 'medicalCertificate');
      const extraDoc = docList.find(d => d.documentType === 'additional');

      return {
        ...s,
        // Record primary key IDs to keep synchronization unique and prevent duplications
        enrollmentId: enrollment.id || '',
        parentId: parent.id || '',
        addressId: address.id || '',
        medicalId: medical.id || '',
        feeAssignmentId: fee.id || '',

        // Academic
        academicYear: enrollment.academicYear || '2026-2027',
        admissionType: enrollment.admissionType || 'New Admission',
        studentClass: enrollment.studentClass || 'I',
        section: enrollment.section || '',
        rollNumber: enrollment.rollNumber || '',
        roll: enrollment.rollNumber || '',
        grade: enrollment.section ? `${enrollment.studentClass || 'I'}-${enrollment.section}` : (enrollment.studentClass || 'I'),
        previousSchool: enrollment.previousSchoolName || '',
        previousSchoolName: enrollment.previousSchoolName || '',
        previousSchoolAddress: enrollment.previousSchoolAddress || '',
        previousClassStudied: enrollment.previousClassStudied || '',
        transferCertificateNumber: enrollment.transferCertificateNumber || '',

        // Parent
        fatherName: parent.fatherName || '',
        fatherOccupation: parent.fatherOccupation || '',
        fatherMobile: parent.fatherMobile || '',
        fatherEmail: parent.fatherEmail || '',
        motherName: parent.motherName || '',
        motherOccupation: parent.motherOccupation || '',
        motherMobile: parent.motherMobile || '',
        motherEmail: parent.motherEmail || '',
        guardianName: parent.guardianName || '',
        guardianRelation: parent.guardianRelation || '',
        guardianContact: parent.guardianContact || '',
        guardian: parent.guardianName || parent.fatherName || parent.motherName || '',
        phone: parent.guardianContact || parent.fatherMobile || parent.motherMobile || '',

        // Address
        currentAddress: address.currentAddress || '',
        permanentAddress: address.permanentAddress || '',
        address: address.currentAddress || '',
        city: address.city || '',
        state: address.state || '',
        country: address.country || 'India',
        postalCode: address.postalCode || '',
        pincode: address.postalCode || '',
        emergencyContactNumber: address.emergencyContactNumber || '',
        isSameAddress: address.isSameAddress !== undefined ? address.isSameAddress : true,

        // Medical
        bloodGroup: medical.bloodGroup || s.bloodGroup || '',
        medicalConditions: medical.medicalConditions || '',
        allergies: medical.allergies || '',
        disabilities: medical.disabilities || '',
        emergencyNotes: medical.emergencyNotes || '',
        doctorName: medical.doctorName || '',
        doctorContact: medical.doctorContact || '',

        // Logins
        studentUsername: studAcc.studentUsername || s.admissionNumber || '',
        studentPassword: studAcc.studentPassword || '',
        parentUsername: parentAcc.parentUsername || '',
        parentPassword: parentAcc.parentPassword || '',
        transportRequired: s.transportRequired || 'No',
        hostelRequired: s.hostelRequired || 'No',

        // Files
        photo: photoDoc ? photoDoc.filePath : s.photo || '',
        aadhaarFile: aadhaarDoc ? aadhaarDoc.filePath : '',
        birthCertificateFile: birthDoc ? birthDoc.filePath : '',
        marksheetFile: marksheetDoc ? marksheetDoc.filePath : '',
        transferCertificateFile: tcDoc ? tcDoc.filePath : '',
        addressProofFile: addProofDoc ? addProofDoc.filePath : '',
        medicalCertificateFile: medCertDoc ? medCertDoc.filePath : '',
        additionalFile: extraDoc ? extraDoc.filePath : '',

        // Fees
        feeStructure: fee.feeStructure || '',
        scholarshipDetails: fee.scholarshipDetails || '',
        discountType: fee.discountType || '',
        discountAmount: fee.discountAmount || 0,
        feeStatus: fee.initialPaymentStatus || 'Pending',
        initialPaymentStatus: fee.initialPaymentStatus || 'Pending'
      };
    });

    // Load Roles & Permissions details
    const dbRoles = await sqlDb.query('SELECT * FROM roles WHERE tenantId = ?', [tId]);
    data.roles = dbRoles.map(r => ({
      ...r,
      active: r.active === 1 || r.active === true || r.active === '1',
      isSystem: r.isSystem === 1 || r.isSystem === true || r.isSystem === '1',
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || {})
    }));

    // Auto-seed default roles if none exist for this tenant
    if (data.roles.length === 0) {
      data.roles = getDefaultRoles();
      console.log(`[SQL Preload] Seeded default roles for tenant: ${tId}`);
    }

    const dbUserAccess = await sqlDb.query('SELECT * FROM user_access WHERE tenantId = ?', [tId]);
    data.userAccess = dbUserAccess.map(ua => ({
      ...ua,
      overrides: typeof ua.overrides === 'string' ? JSON.parse(ua.overrides) : (ua.overrides || {})
    }));

    data.auditLogs = await sqlDb.query('SELECT * FROM audit_logs WHERE tenantId = ?', [tId]);

    const dbQrCodes = await sqlDb.query('SELECT * FROM employee_qr_codes WHERE tenantId = ?', [tId]);
    data.employeeQrCodes = dbQrCodes;

    // Link qrCodePath onto teachers and staff in memory for quick frontend access
    if (data.teachers && Array.isArray(data.teachers)) {
      data.teachers.forEach(t => {
        const qr = dbQrCodes.find(q => q.employeeId === t.employeeId || q.employeeId === t.id);
        if (qr) t.qrCodePath = qr.qrPath;
      });
    }
    if (data.staff && Array.isArray(data.staff)) {
      data.staff.forEach(s => {
        const qr = dbQrCodes.find(q => q.employeeId === s.id);
        if (qr) s.qrCodePath = qr.qrPath;
      });
    }


    const dbAttRecords = await sqlDb.query('SELECT * FROM attendance_records WHERE tenantId = ?', [tId]);
    data.attendanceRecords = dbAttRecords.map(a => ({
      ...a,
      workingHours: parseFloat(a.workingHours || 0)
    }));

    const dbAttLogs = await sqlDb.query('SELECT * FROM attendance_logs WHERE tenantId = ?', [tId]);
    data.attendanceLogs = dbAttLogs;

    const dbAttReports = await sqlDb.query('SELECT * FROM attendance_reports WHERE tenantId = ?', [tId]);
    data.attendanceReports = dbAttReports.map(r => ({
      ...r,
      filters: typeof r.filters === 'string' ? JSON.parse(r.filters) : (r.filters || {})
    }));

    // Load centralized grades, departments, and grade mappings
    const dbGrades = await sqlDb.query('SELECT * FROM grades WHERE tenantId = ?', [tId]);
    data.grades = dbGrades.map(g => ({
      ...g,
      status: g.status || 'Active'
    }));

    const dbDepts = await sqlDb.query('SELECT * FROM departments WHERE tenantId = ?', [tId]);
    data.departments = dbDepts.map(d => ({
      ...d,
      status: d.status || 'Active'
    }));

    const dbGradeDepts = await sqlDb.query('SELECT * FROM grade_departments WHERE tenantId = ?', [tId]);
    data.gradeDepartments = dbGradeDepts.map(gd => ({
      ...gd,
      status: gd.status || 'Active'
    }));

    // Seeder disabled: User wishes grade list to start empty until manually configured

    dbCache[queryTenantId] = data;
    return data;
  } catch (err) {
    console.error(`[SQL Preload ERROR] Failed to load SQL tenant ${tenantId}:`, err);
    return null;
  }
};

// Express middleware to ensure SQL cache is loaded on incoming requests
export const ensureTenantSqlLoaded = async (req, res, next) => {
  if (!isSqlActive()) {
    return next(); // Fail-safe fallback to local JSON file operations
  }

  let tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
  if (!tenantId && req.headers.host) {
    const host = req.headers.host.split(':')[0]; // Remove port
    const parts = host.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost')) {
      tenantId = parts[0];
    }
  }

  const activeTenant = tenantId ? slugify(tenantId) : 'platform';
  
  // Only load from SQL if cache doesn't exist yet.
  // Once loaded, writeDb() updates the in-memory cache instantly, so reloading
  // from SQL would race with async saveMemoryDbToSql and overwrite fresh data with stale.
  if (!dbCache[activeTenant]) {
    await loadTenantSqlIntoMemory(activeTenant);
  }
  next();
};

// Queue to serialize SQL sync operations per tenant to prevent concurrent write race conditions
const sqlSyncQueues = {};

// Asynchronous write dispatcher to MySQL
export const saveMemoryDbToSql = async (tenantId, db) => {
  const tId = tenantId || 'platform';
  if (!isSqlActive()) return;

  if (!sqlSyncQueues[tId]) {
    sqlSyncQueues[tId] = Promise.resolve();
  }

  const syncPromise = sqlSyncQueues[tId].then(async () => {
    try {
      console.log(`[SQL Sync] Initiating async MySQL database update for tenant: ${tId}`);

    // 1. Sync global platforms
    if (db.schools && Array.isArray(db.schools)) {
      // Synchronize deleted schools from MySQL
      const activeSchoolIds = db.schools.map(s => s.id).filter(Boolean);
      let deletedSubdomains = [];
      try {
        if (activeSchoolIds.length > 0) {
          const rows = await sqlDb.query(`SELECT subdomain FROM schools WHERE id NOT IN (${activeSchoolIds.map(() => '?').join(',')})`, activeSchoolIds);
          deletedSubdomains = (rows || []).map(r => r.subdomain);
          await sqlDb.query(`DELETE FROM schools WHERE id NOT IN (${activeSchoolIds.map(() => '?').join(',')})`, activeSchoolIds);
        } else {
          const rows = await sqlDb.query(`SELECT subdomain FROM schools`);
          deletedSubdomains = (rows || []).map(r => r.subdomain);
          await sqlDb.query('DELETE FROM schools');
        }
      } catch (dbErr) {
        console.error('[SQL Sync delete schools error]', dbErr.message);
      }

      // Cleanup deleted tenant subdomains data completely in MySQL
      if (deletedSubdomains.length > 0) {
        const tenantTables = [
          'employees', 'staff', 'students', 'invoices', 'fees', 'expenses', 'payroll',
          'staff_payments', 'activities', 'exams', 'exam_timetables', 'notices',
          'holidays', 'events', 'results', 'overall_results', 'subjects', 'timeslots',
          'fee_structures', 'salary_structures', 'staff_salary_structures', 'income',
          'attendance', 'roles', 'user_access', 'audit_logs', 'employee_qr_codes',
          'attendance_records', 'attendance_logs', 'attendance_reports'
        ];
        for (const sub of deletedSubdomains) {
          for (const tbl of tenantTables) {
            try {
              await sqlDb.query(`DELETE FROM ${tbl} WHERE tenantId = ?`, [sub]);
            } catch (tblErr) {
              // Ignore table/field missing errors
            }
          }
        }
      }

      for (const s of db.schools) {
        await sqlDb.query(
          `INSERT INTO schools (
            id, name, code, subdomain, logo, principalName, email, phone, address, city, state, country, 
            academicSession, subscriptionPlan, url, status, adminName, adminEmail, adminUsername, adminPassword, 
            createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            name=VALUES(name), logo=VALUES(logo), principalName=VALUES(principalName), email=VALUES(email),
            phone=VALUES(phone), address=VALUES(address), city=VALUES(city), state=VALUES(state),
            academicSession=VALUES(academicSession), subscriptionPlan=VALUES(subscriptionPlan),
            status=VALUES(status), adminName=VALUES(adminName), adminEmail=VALUES(adminEmail),
            adminUsername=VALUES(adminUsername), adminPassword=VALUES(adminPassword)`,
          [
            s.id, s.name, s.code, s.subdomain, s.logo, s.principalName || s.principal || '', s.email, 
            s.phone, s.address, s.city, s.state, s.country || 'India', s.academicSession || '2026-2027', 
            s.subscriptionPlan || 'Starter', s.url, s.status || 'Active', s.adminName || '', s.adminEmail || '', 
            s.adminUsername || '', s.adminPassword || '', 
            s.createdAt
          ]
        );
      }
    }

    // 2. Sync school details
    if (tId !== 'platform' && db.school) {
      const sch = db.school;
      await sqlDb.query(
        `UPDATE schools SET 
          name = ?, address = ?, city = ?, state = ?, phone = ?, email = ?, 
          principalName = ?, adminName = ?, adminEmail = ?, adminPassword = ?, ratePerStudent = ?
         WHERE subdomain = ?`,
        [
          sch.name, sch.address, sch.city, sch.state, sch.phone, sch.email, 
          sch.principal, sch.adminName, sch.adminEmail, sch.adminPassword, sch.ratePerStudent || '250.00', tId
        ]
      );
    }

    // 3. Sync Teachers
    if (db.teachers && Array.isArray(db.teachers)) {
      // Clean deleted
      const activeTeacherIds = db.teachers.map(t => t.id).filter(Boolean);
      if (activeTeacherIds.length > 0) {
        await sqlDb.query(`DELETE FROM staff WHERE tenantId = ? AND id NOT IN (${activeTeacherIds.map(() => '?').join(',')})`, [tId, ...activeTeacherIds]);
      } else {
        await sqlDb.query('DELETE FROM staff WHERE tenantId = ?', [tId]);
      }

      for (const t of db.teachers) {
        await sqlDb.query(
          `INSERT INTO staff (
            id, name, email, phone, username, password, gender, qualification, experience, dateOfJoining, 
            salaryGrade, address, city, state, pincode, emergencyContact, emergencyPhone, photo, aadharFile, 
            certificateFile, status, avatarBg, tenantId,
            firstName, middleName, lastName, fullName, dob, bloodGroup, nationality, maritalStatus,
            aadhaarNumber, panNumber, joiningDate, employmentType, designation, department, primarySubject,
            secondarySubject, alternateMobile, currentAddress, currentCity, currentState, currentCountry,
            currentPostalCode, permanentAddress, permanentCity, permanentState, permanentCountry,
            permanentPostalCode, sameAsPermanent, panFile, resumeFile, joiningLetterFile, otherFile, experiences
          ) VALUES (${new Array(56).fill('?').join(', ')})
          ON DUPLICATE KEY UPDATE 
            name=VALUES(name), email=VALUES(email), phone=VALUES(phone), username=VALUES(username),
            password=VALUES(password), status=VALUES(status), address=VALUES(address),
            qualification=VALUES(qualification), experience=VALUES(experience),
            firstName=VALUES(firstName), middleName=VALUES(middleName), lastName=VALUES(lastName),
            fullName=VALUES(fullName), dob=VALUES(dob), bloodGroup=VALUES(bloodGroup), nationality=VALUES(nationality),
            maritalStatus=VALUES(maritalStatus), aadhaarNumber=VALUES(aadhaarNumber), panNumber=VALUES(panNumber),
            joiningDate=VALUES(joiningDate), employmentType=VALUES(employmentType), designation=VALUES(designation),
            department=VALUES(department), primarySubject=VALUES(primarySubject), secondarySubject=VALUES(secondarySubject),
            alternateMobile=VALUES(alternateMobile), currentAddress=VALUES(currentAddress), currentCity=VALUES(currentCity),
            currentState=VALUES(currentState), currentCountry=VALUES(currentCountry), currentPostalCode=VALUES(currentPostalCode),
            permanentAddress=VALUES(permanentAddress), permanentCity=VALUES(permanentCity), permanentState=VALUES(permanentState),
            permanentCountry=VALUES(permanentCountry), permanentPostalCode=VALUES(permanentPostalCode),
            sameAsPermanent=VALUES(sameAsPermanent), panFile=VALUES(panFile), resumeFile=VALUES(resumeFile),
            joiningLetterFile=VALUES(joiningLetterFile), otherFile=VALUES(otherFile), experiences=VALUES(experiences)`,
          [
            t.id, t.fullName || t.name || '', t.email || '', t.mobile || t.phone || '', t.username || '', t.password || '', t.gender || '', 
            typeof t.qualification === 'object' ? JSON.stringify(t.qualification) : (t.qualification || ''),
            typeof t.experience === 'object' ? JSON.stringify(t.experience) : (t.experience || ''),
            t.joiningDate || t.dateOfJoining || '', t.salaryGrade || '', 
            t.currentAddress || t.address || '', t.currentCity || t.city || '', t.currentState || t.state || '', t.currentPostalCode || t.pincode || '', 
            t.emergencyContact || '', t.emergencyContactNumber || t.emergencyPhone || '', t.photo || '', t.aadharFile || '', 
            t.qualificationFile || t.certificateFile || '', t.status || 'Active', t.avatarBg || '', tId,
            t.firstName || '', t.middleName || '', t.lastName || '', t.fullName || '', t.dob || '', t.bloodGroup || '', t.nationality || '', t.maritalStatus || '',
            t.aadhaarNumber || '', t.panNumber || '', t.joiningDate || '', t.employmentType || '', t.designation || '', t.department || '', t.primarySubject || '',
            t.secondarySubject || '', t.alternateMobile || '', t.currentAddress || '', t.currentCity || '', t.currentState || '', t.currentCountry || '',
            t.currentPostalCode || '', t.permanentAddress || '', t.permanentCity || '', t.permanentState || '', t.permanentCountry || '',
            t.permanentPostalCode || '', typeof t.sameAsPermanent === 'boolean' ? (t.sameAsPermanent ? 'Yes' : 'No') : (t.sameAsPermanent || 'No'),
            t.panFile || '', t.resumeFile || '', t.joiningLetterFile || '', t.otherFile || '',
            typeof t.experiences === 'object' ? JSON.stringify(t.experiences) : (t.experiences || '')
          ]
        );
      }
    }

    // 4. Sync Staff
    if (db.staff && Array.isArray(db.staff)) {
      const activeStaffIds = db.staff.map(s => s.id).filter(Boolean);
      if (activeStaffIds.length > 0) {
        await sqlDb.query(`DELETE FROM employees WHERE tenantId = ? AND id NOT IN (${activeStaffIds.map(() => '?').join(',')})`, [tId, ...activeStaffIds]);
      } else {
        await sqlDb.query('DELETE FROM employees WHERE tenantId = ?', [tId]);
      }

      for (const s of db.staff) {
        if (!s.id) continue;
        const params = [
          s.id, s.name, s.fullName, s.role, s.department, s.email, s.phone, s.gender, s.qualification, 
          s.experience, s.dateOfJoining, s.salaryGrade, s.reportingTo, s.address, s.city, s.state, s.pincode, 
          s.emergencyContact, s.emergencyPhone, s.photo, s.aadharFile, s.certificateFile, s.status || 'Active', 
          s.avatarBg, s.password, tId, s.designation || '', s.designationLevel || '', s.employmentType || ''
        ].map(v => v === undefined ? null : v);
        await sqlDb.query(
          `INSERT INTO employees (
            id, name, fullName, role, department, email, phone, gender, qualification, experience, 
            dateOfJoining, salaryGrade, reportingTo, address, city, state, pincode, emergencyContact, 
            emergencyPhone, photo, aadharFile, certificateFile, status, avatarBg, password, tenantId, 
            designation, designationLevel, employmentType
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name=VALUES(name), role=VALUES(role), department=VALUES(department), email=VALUES(email),
            phone=VALUES(phone), status=VALUES(status), password=VALUES(password), designation=VALUES(designation),
            designationLevel=VALUES(designationLevel), employmentType=VALUES(employmentType)`,
          params
        );
      }
    }

    // 5. Sync Students & Sub-Tables
    if (db.students && Array.isArray(db.students)) {
      const activeStudentIds = db.students.map(s => s.id).filter(Boolean);
      if (activeStudentIds.length > 0) {
        // Cascade delete will automatically handle enrollments, parents, addresses, medical, documents, fee_assignments, student_accounts, parent_accounts
        await sqlDb.query(`DELETE FROM students WHERE tenantId = ? AND id NOT IN (${activeStudentIds.map(() => '?').join(',')})`, [tId, ...activeStudentIds]);
      } else {
        await sqlDb.query('DELETE FROM students WHERE tenantId = ?', [tId]);
      }

      for (const s of db.students) {
        if (!s.id) continue;
        // Core student
        await sqlDb.query(
          `INSERT INTO students (
            id, firstName, middleName, lastName, name, fullName, admissionNumber, admissionDate, dob, 
            gender, bloodGroup, nationality, category, religion, aadhaarNumber, photo, status, photoBg, 
            email, phone, feeStatus, \`rank\`, createdAt, updatedAt, tenantId, transportRequired, hostelRequired
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name=VALUES(name), fullName=VALUES(fullName), photo=VALUES(photo), status=VALUES(status),
            email=VALUES(email), phone=VALUES(phone), feeStatus=VALUES(feeStatus), updatedAt=VALUES(updatedAt),
            transportRequired=VALUES(transportRequired), hostelRequired=VALUES(hostelRequired)`,
          [
            s.id, s.firstName || s.fullName.split(' ')[0], s.middleName || '', s.lastName || s.fullName.split(' ').slice(1).join(' '),
            s.fullName || s.name, s.fullName || s.name, s.admissionNumber || `ADM-${Date.now().toString().slice(-6)}`,
            s.admissionDate || new Date().toISOString().split('T')[0], s.dob, s.gender, s.bloodGroup, 
            s.nationality || 'Indian', s.category || 'General', s.religion || 'Hinduism', s.aadhaarNumber, s.photo, 
            s.status || 'Active', s.photoBg, s.email, s.phone, s.feeStatus || 'Pending', s.rank || 'N/A', 
            s.createdAt || new Date().toISOString(), s.updatedAt || new Date().toISOString(), tId,
            s.transportRequired || 'No', s.hostelRequired || 'No'
          ]
        );

        // Enrollment
        await sqlDb.query(
          `INSERT INTO student_enrollments (
            id, studentId, academicYear, admissionType, studentClass, section, rollNumber, previousSchoolName, 
            previousSchoolAddress, previousClassStudied, transferCertificateNumber, status, createdAt, updatedAt, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            academicYear=VALUES(academicYear), studentClass=VALUES(studentClass), section=VALUES(section),
            rollNumber=VALUES(rollNumber), previousSchoolName=VALUES(previousSchoolName), status=VALUES(status), updatedAt=VALUES(updatedAt)`,
          [
            s.enrollmentId || `ENR-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.academicYear || '2026-2027', 
            s.admissionType || 'New Admission', s.studentClass || 'I', s.section || '', s.rollNumber || s.roll || '', 
            s.previousSchoolName || s.previousSchool || '', s.previousSchoolAddress || '', s.previousClassStudied || '', 
            s.transferCertificateNumber || '', s.status || 'Active', new Date().toISOString(), new Date().toISOString(), tId
          ]
        );

        // Parent
        await sqlDb.query(
          `INSERT INTO parents (
            id, studentId, fatherName, fatherOccupation, fatherMobile, fatherEmail, motherName, motherOccupation, 
            motherMobile, motherEmail, guardianName, guardianRelation, guardianContact, parentUsername, parentPassword, 
            createdAt, updatedAt, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            fatherName=VALUES(fatherName), fatherOccupation=VALUES(fatherOccupation), fatherMobile=VALUES(fatherMobile), fatherEmail=VALUES(fatherEmail),
            motherName=VALUES(motherName), motherOccupation=VALUES(motherOccupation), motherMobile=VALUES(motherMobile), motherEmail=VALUES(motherEmail),
            guardianName=VALUES(guardianName), guardianRelation=VALUES(guardianRelation), guardianContact=VALUES(guardianContact), parentUsername=VALUES(parentUsername), parentPassword=VALUES(parentPassword), updatedAt=VALUES(updatedAt)`,
          [
            s.parentId || `PAR-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.fatherName || '', s.fatherOccupation || '', s.fatherMobile || '', 
            s.fatherEmail || '', s.motherName || '', s.motherOccupation || '', s.motherMobile || '', s.motherEmail || '', s.guardianName || s.guardian || '', 
            s.guardianRelation || '', s.guardianContact || '', s.parentUsername || `parent_${s.admissionNumber}`, s.parentPassword || 'parent123', 
            new Date().toISOString(), new Date().toISOString(), tId
          ]
        );

        // Address
        await sqlDb.query(
          `INSERT INTO addresses (
            id, studentId, currentAddress, permanentAddress, city, state, country, postalCode, 
            emergencyContactNumber, isSameAddress, createdAt, updatedAt, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            currentAddress=VALUES(currentAddress), permanentAddress=VALUES(permanentAddress), city=VALUES(city),
            state=VALUES(state), postalCode=VALUES(postalCode), emergencyContactNumber=VALUES(emergencyContactNumber),
            isSameAddress=VALUES(isSameAddress), updatedAt=VALUES(updatedAt)`,
          [
            s.addressId || `ADD-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.currentAddress || s.address || '', s.permanentAddress || s.address || '', 
            s.city || '', s.state || '', s.country || 'India', s.postalCode || s.pincode || '', s.emergencyContactNumber || s.phone || '', s.isSameAddress !== undefined ? s.isSameAddress : true, 
            new Date().toISOString(), new Date().toISOString(), tId
          ]
        );

        // Medical
        await sqlDb.query(
          `INSERT INTO medical_records (
            id, studentId, bloodGroup, medicalConditions, allergies, disabilities, emergencyNotes, 
            doctorName, doctorContact, createdAt, updatedAt, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            bloodGroup=VALUES(bloodGroup), medicalConditions=VALUES(medicalConditions), allergies=VALUES(allergies),
            disabilities=VALUES(disabilities), emergencyNotes=VALUES(emergencyNotes), doctorName=VALUES(doctorName), doctorContact=VALUES(doctorContact), updatedAt=VALUES(updatedAt)`,
          [
            s.medicalId || `MED-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.bloodGroup || '', s.medicalConditions || '', s.allergies || '', s.disabilities || '', s.emergencyNotes || '', s.doctorName || '', s.doctorContact || '', 
            new Date().toISOString(), new Date().toISOString(), tId
          ]
        );

        // Documents sync (delete old docs metadata and write current ones)
        await sqlDb.query('DELETE FROM documents WHERE tenantId = ? AND studentId = ?', [tId, s.id]);
        const docFields = [
          { type: 'photo', path: s.photo },
          { type: 'aadhaar', path: s.aadhaarFile },
          { type: 'birthCertificate', path: s.birthCertificateFile },
          { type: 'marksheet', path: s.marksheetFile },
          { type: 'tc', path: s.transferCertificateFile },
          { type: 'addressProof', path: s.addressProofFile },
          { type: 'medicalCertificate', path: s.medicalCertificateFile },
          { type: 'additional', path: s.additionalFile }
        ];
        for (const df of docFields) {
          if (df.path) {
            await sqlDb.query(
              'INSERT INTO documents (id, studentId, documentType, fileName, filePath, fileSize, uploadedAt, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [`DOC-${Math.floor(100000 + Math.random() * 900000)}`, s.id, df.type, df.path.split('/').pop(), df.path, 0, new Date().toISOString(), tId]
            );
          }
        }

        // Fee Assignment
        await sqlDb.query(
          `INSERT INTO fee_assignments (
            id, studentId, feeStructure, scholarshipDetails, discountType, discountAmount, initialPaymentStatus, assignedAt, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            feeStructure=VALUES(feeStructure), scholarshipDetails=VALUES(scholarshipDetails),
            discountType=VALUES(discountType), discountAmount=VALUES(discountAmount), initialPaymentStatus=VALUES(initialPaymentStatus)`,
          [
            s.feeAssignmentId || `FEE-ASN-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.feeStructure || '', s.scholarshipDetails || '', s.discountType || '', 
            parseFloat(s.discountAmount || 0), s.feeStatus || s.initialPaymentStatus || 'Pending', new Date().toISOString(), tId
          ]
        );

        // Account Logins
        await sqlDb.query(
          `INSERT INTO student_accounts (id, studentId, studentUsername, studentPassword, createdAt, tenantId) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE studentPassword=VALUES(studentPassword)`,
          [`ACT-S-${s.id}`, s.id, s.studentUsername || s.admissionNumber, s.studentPassword || `stu@${s.fullName.split(' ')[0].toLowerCase()}`, new Date().toISOString(), tId]
        );
        await sqlDb.query(
          `INSERT INTO parent_accounts (id, studentId, parentUsername, parentPassword, createdAt, tenantId) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE parentPassword=VALUES(parentPassword)`,
          [`ACT-P-${s.id}`, s.id, s.parentUsername || `parent_${s.admissionNumber}`, s.parentPassword || 'parent123', new Date().toISOString(), tId]
        );
      }
    }

    // 6. Sync Timetables
    if (db.timetables && Array.isArray(db.timetables)) {
      await sqlDb.query('DELETE FROM timetables WHERE tenantId = ?', [tId]);
      
      const weekRows = {};
      const dayKeyMap = {
        monday: 'mon', mon: 'mon',
        tuesday: 'tue', tue: 'tue',
        wednesday: 'wed', wed: 'wed',
        thursday: 'thu', thu: 'thu',
        friday: 'fri', fri: 'fri',
        saturday: 'sat', sat: 'sat'
      };

      for (const t of db.timetables) {
        if (!t.cohort || !t.time) continue;
        const key = `${t.cohort}_${t.time}`;
        if (!weekRows[key]) {
          weekRows[key] = {
            cohort: t.cohort,
            time: t.time,
            mon: null,
            tue: null,
            wed: null,
            thu: null,
            fri: null,
            sat: null
          };
        }

        if (t.day) {
          const dKey = dayKeyMap[t.day.toLowerCase()];
          if (dKey) {
            weekRows[key][dKey] = {
              subject: t.subject || '',
              teacher: t.teacher || '',
              room: t.room || ''
            };
          }
        } else {
          const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          for (const d of days) {
            if (t[d]) {
              let val = t[d];
              if (typeof val === 'string') {
                try { val = JSON.parse(val); } catch (e) { val = null; }
              }
              if (val) {
                weekRows[key][d] = val;
              }
            }
          }
        }
      }

      for (const key of Object.keys(weekRows)) {
        const row = weekRows[key];
        await sqlDb.query(
          'INSERT INTO timetables (cohort, time, mon, tue, wed, thu, fri, sat, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            row.cohort,
            row.time,
            row.mon ? JSON.stringify(row.mon) : null,
            row.tue ? JSON.stringify(row.tue) : null,
            row.wed ? JSON.stringify(row.wed) : null,
            row.thu ? JSON.stringify(row.thu) : null,
            row.fri ? JSON.stringify(row.fri) : null,
            row.sat ? JSON.stringify(row.sat) : null,
            tId
          ]
        );
      }
    }

    // 7. Sync Invoices
    if (db.invoices && Array.isArray(db.invoices)) {
      const activeInvNos = db.invoices.map(i => i.invoiceNo).filter(Boolean);
      if (activeInvNos.length > 0) {
        await sqlDb.query(`DELETE FROM invoices WHERE tenantId = ? AND invoiceNo NOT IN (${activeInvNos.map(() => '?').join(',')})`, [tId, ...activeInvNos]);
      } else {
        await sqlDb.query('DELETE FROM invoices WHERE tenantId = ?', [tId]);
      }

      for (const inv of db.invoices) {
        if (!inv.invoiceNo) continue;
        await sqlDb.query(
          `INSERT INTO invoices (invoiceNo, name, grade, amount, date, status, method, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status=VALUES(status), method=VALUES(method)`,
          [inv.invoiceNo, inv.name || '', inv.grade || '', inv.amount || '', inv.date || '', inv.status || 'Pending', inv.method || 'N/A', tId]
        );
      }
    }

    // 8. Sync Fees
    if (db.fees && Array.isArray(db.fees)) {
      const activeFeeIds = db.fees.map(f => f.id || f.feeId).filter(Boolean);
      if (activeFeeIds.length > 0) {
        await sqlDb.query(`DELETE FROM fees WHERE tenantId = ? AND id NOT IN (${activeFeeIds.map(() => '?').join(',')})`, [tId, ...activeFeeIds]);
      } else {
        await sqlDb.query('DELETE FROM fees WHERE tenantId = ?', [tId]);
      }

      for (const f of db.fees) {
        const id = f.id || f.feeId;
        if (!id) continue;
        const classId = f.classId || f.studentClass || '';
        const sectionId = f.sectionId || f.section || '';
        const status = f.status || f.paymentStatus || 'Pending';
        await sqlDb.query(
          `INSERT INTO fees (
            id, studentId, studentName, classId, sectionId, feeType, totalAmount, paidAmount, dueAmount, status, paymentDate, paymentMethod, remarks, createdAt, tenantId,
            receiptNumber, transactionId, discount, fine, amount, studentClass, section, paymentStatus
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            paidAmount=VALUES(paidAmount), dueAmount=VALUES(dueAmount), status=VALUES(status), paymentDate=VALUES(paymentDate), paymentMethod=VALUES(paymentMethod),
            receiptNumber=VALUES(receiptNumber), transactionId=VALUES(transactionId), discount=VALUES(discount), fine=VALUES(fine), amount=VALUES(amount),
            studentClass=VALUES(studentClass), section=VALUES(section), paymentStatus=VALUES(paymentStatus)`,
          [
            id, f.studentId || '', f.studentName || '', classId, sectionId, f.feeType || '', parseFloat(f.totalAmount || 0), parseFloat(f.paidAmount || 0), parseFloat(f.dueAmount || 0), status, f.paymentDate || '', f.paymentMethod || '', f.remarks || '', f.createdAt || '', tId,
            f.receiptNumber || '', f.transactionId || '', parseFloat(f.discount || 0), parseFloat(f.fine || 0), parseFloat(f.amount || 0), f.studentClass || '', f.section || '', f.paymentStatus || status
          ]
        );
      }
    }

    // 9. Sync Expenses
    if (db.expenses && Array.isArray(db.expenses)) {
      const activeExpIds = db.expenses.map(e => e.id).filter(Boolean);
      if (activeExpIds.length > 0) {
        await sqlDb.query(`DELETE FROM expenses WHERE tenantId = ? AND id NOT IN (${activeExpIds.map(() => '?').join(',')})`, [tId, ...activeExpIds]);
      } else {
        await sqlDb.query('DELETE FROM expenses WHERE tenantId = ?', [tId]);
      }

      for (const e of db.expenses) {
        if (!e.id) continue;
        await sqlDb.query(
          `INSERT INTO expenses (id, category, subcategory, amount, date, description, status, paidTo, paymentMethod, attachment, createdAt, tenantId, grade, department, expenseType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE amount=VALUES(amount), status=VALUES(status), subcategory=VALUES(subcategory), grade=VALUES(grade), department=VALUES(department), expenseType=VALUES(expenseType)`,
          [e.id, e.category || '', e.subcategory || '', parseFloat(e.amount || 0), e.date || '', e.description || '', e.status || 'Approved', e.paidTo || '', e.paymentMethod || '', e.attachment || '', e.createdAt || new Date().toISOString(), tId, e.grade || '', e.department || '', e.expenseType || '']
        );
      }
    }

    // 10. Sync Payroll
    if (db.payroll && Array.isArray(db.payroll)) {
      const activePayIds = db.payroll.map(p => p.id).filter(Boolean);
      if (activePayIds.length > 0) {
        await sqlDb.query(`DELETE FROM payroll WHERE tenantId = ? AND id NOT IN (${activePayIds.map(() => '?').join(',')})`, [tId, ...activePayIds]);
      } else {
        await sqlDb.query('DELETE FROM payroll WHERE tenantId = ?', [tId]);
      }

      for (const p of db.payroll) {
        if (!p.id) continue;
        await sqlDb.query(
          `INSERT INTO payroll (id, staffId, staffName, role, month, basicSalary, allowances, deductions, netSalary, paymentStatus, paymentDate, paymentMethod, createdAt, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE paymentStatus=VALUES(paymentStatus), paymentDate=VALUES(paymentDate), paymentMethod=VALUES(paymentMethod)`,
          [p.id, p.staffId || '', p.staffName || '', p.role || '', p.month || '', parseFloat(p.basicSalary || 0), parseFloat(p.allowances || 0), parseFloat(p.deductions || 0), parseFloat(p.netSalary || 0), p.paymentStatus || 'Pending', p.paymentDate || '', p.paymentMethod || '', p.createdAt || new Date().toISOString(), tId]
        );
      }
    }

    // 11. Sync Staff Payments
    if (db.staffPayments && Array.isArray(db.staffPayments)) {
      const activeSpIds = db.staffPayments.map(sp => sp.id || sp.paymentId).filter(Boolean);
      if (activeSpIds.length > 0) {
        await sqlDb.query(`DELETE FROM staff_payments WHERE tenantId = ? AND id NOT IN (${activeSpIds.map(() => '?').join(',')})`, [tId, ...activeSpIds]);
      } else {
        await sqlDb.query('DELETE FROM staff_payments WHERE tenantId = ?', [tId]);
      }

      for (const sp of db.staffPayments) {
        const spId = sp.id || sp.paymentId;
        if (!spId) continue;
        const netSal = sp.netSalary || sp.amount || 0;
        await sqlDb.query(
          `INSERT INTO staff_payments (
            id, staffId, amount, paymentDate, paymentMethod, status, remarks, tenantId,
            staffName, staffRole, basicSalary, allowances, bonus, deductions, pfDeduction, taxDeduction, netSalary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
            amount=VALUES(amount), status=VALUES(status),
            staffName=VALUES(staffName), staffRole=VALUES(staffRole),
            basicSalary=VALUES(basicSalary), allowances=VALUES(allowances), bonus=VALUES(bonus),
            deductions=VALUES(deductions), pfDeduction=VALUES(pfDeduction), taxDeduction=VALUES(taxDeduction),
            netSalary=VALUES(netSalary)`,
          [
            spId, sp.staffId || '', parseFloat(netSal), sp.paymentDate || '', sp.paymentMethod || '', 
            sp.status || sp.paymentStatus || 'Paid', sp.remarks || '', tId,
            sp.staffName || '', sp.staffRole || '',
            parseFloat(sp.basicSalary || 0), parseFloat(sp.allowances || 0), parseFloat(sp.bonus || 0),
            parseFloat(sp.deductions || 0), parseFloat(sp.pfDeduction || 0), parseFloat(sp.taxDeduction || 0),
            parseFloat(netSal)
          ]
        );
      }
    }

    // 12. Sync Activities
    if (db.activities && Array.isArray(db.activities)) {
      // Keep last 50 only in database to match JSON limit
      const itemsToKeep = db.activities.slice(0, 50);
      const activeActIds = itemsToKeep.map(act => act.id).filter(Boolean);
      if (activeActIds.length > 0) {
        await sqlDb.query(`DELETE FROM activities WHERE tenantId = ? AND id NOT IN (${activeActIds.map(() => '?').join(',')})`, [tId, ...activeActIds]);
      } else {
        await sqlDb.query('DELETE FROM activities WHERE tenantId = ?', [tId]);
      }

      for (const act of itemsToKeep) {
        if (!act.id) continue;
        await sqlDb.query(
          `INSERT INTO activities (id, type, title, description, time, timestamp, color, bg, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE time=VALUES(time)`,
          [act.id, act.type || '', act.title || '', act.desc || act.description || '', act.time || 'Just now', act.timestamp || '', act.color || '', act.bg || '', tId]
        );
      }
    }

    // 13. Sync Exams & Results
    if (db.exams && Array.isArray(db.exams)) {
      const activeExamIds = db.exams.map(ex => ex.id).filter(Boolean);
      if (activeExamIds.length > 0) {
        await sqlDb.query(`DELETE FROM exams WHERE tenantId = ? AND id NOT IN (${activeExamIds.map(() => '?').join(',')})`, [tId, ...activeExamIds]);
      } else {
        await sqlDb.query('DELETE FROM exams WHERE tenantId = ?', [tId]);
      }

      for (const ex of db.exams) {
        if (!ex.id) continue;
        const earliestStart = ex.startDate || (ex.gradeSections && ex.gradeSections.length > 0 
          ? ex.gradeSections.map(g => g.startDate).filter(Boolean).sort()[0] 
          : '') || '';
        const latestEnd = ex.endDate || (ex.gradeSections && ex.gradeSections.length > 0 
          ? ex.gradeSections.map(g => g.endDate).filter(Boolean).sort().reverse()[0] 
          : '') || '';

        await sqlDb.query(
          `INSERT INTO exams (
            id, name, term, startDate, endDate, status, tenantId,
            description, totalMarks, gradeSections, subjectIncluded, subjectMarks, createdAt, timetablePublished
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
            name=VALUES(name), term=VALUES(term), status=VALUES(status), 
            startDate=VALUES(startDate), endDate=VALUES(endDate),
            description=VALUES(description), totalMarks=VALUES(totalMarks),
            gradeSections=VALUES(gradeSections), subjectIncluded=VALUES(subjectIncluded),
            subjectMarks=VALUES(subjectMarks), createdAt=VALUES(createdAt),
            timetablePublished=VALUES(timetablePublished)`,
          [
            ex.id,
            ex.examName || ex.name || '',
            ex.term || ex.examType || '',
            earliestStart,
            latestEnd,
            ex.status || 'Draft',
            tId,
            ex.description || '',
            ex.totalMarks || 100,
            ex.gradeSections ? JSON.stringify(ex.gradeSections) : '[]',
            ex.subjectIncluded ? JSON.stringify(ex.subjectIncluded) : '{}',
            ex.subjectMarks ? JSON.stringify(ex.subjectMarks) : '{}',
            ex.createdAt || new Date().toISOString(),
            ex.timetablePublished ? 1 : 0
          ]
        );
      }
    }

    if (db.examTimetables && Array.isArray(db.examTimetables)) {
      const activeEtIds = db.examTimetables.map(et => et.id).filter(Boolean);
      if (activeEtIds.length > 0) {
        await sqlDb.query(`DELETE FROM exam_timetables WHERE tenantId = ? AND id NOT IN (${activeEtIds.map(() => '?').join(',')})`, [tId, ...activeEtIds]);
      } else {
        await sqlDb.query('DELETE FROM exam_timetables WHERE tenantId = ?', [tId]);
      }

      for (const et of db.examTimetables) {
        if (!et.id) continue;
        await sqlDb.query(
          `INSERT INTO exam_timetables (
            id, examId, examName, classId, subject, date, timeSlot, room, maxMarks, tenantId,
            startTime, endTime, duration, invigilator, cohort, grade, section, examDate
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            examId=VALUES(examId), examName=VALUES(examName), classId=VALUES(classId), subject=VALUES(subject),
            date=VALUES(date), timeSlot=VALUES(timeSlot), room=VALUES(room), maxMarks=VALUES(maxMarks),
            startTime=VALUES(startTime), endTime=VALUES(endTime), duration=VALUES(duration),
            invigilator=VALUES(invigilator), cohort=VALUES(cohort), grade=VALUES(grade), section=VALUES(section), examDate=VALUES(examDate)`,
          [
            et.id,
            et.examId || '',
            et.examName || '',
            et.classId || et.cohort || '',
            et.subject || '',
            et.date || et.examDate || '',
            et.timeSlot || (et.startTime && et.endTime ? `${et.startTime} - ${et.endTime}` : et.duration || ''),
            et.room || et.roomAllocation || '',
            et.maxMarks || 100,
            tId,
            et.startTime || '',
            et.endTime || '',
            et.duration || '',
            et.invigilator || '',
            et.cohort || '',
            et.grade || '',
            et.section || '',
            et.examDate || ''
          ]
        );
      }
    }

    if (db.results && Array.isArray(db.results)) {
      const activeResIds = db.results.map(r => r.id).filter(Boolean);
      if (activeResIds.length > 0) {
        await sqlDb.query(`DELETE FROM results WHERE tenantId = ? AND id NOT IN (${activeResIds.map(() => '?').join(',')})`, [tId, ...activeResIds]);
      } else {
        await sqlDb.query('DELETE FROM results WHERE tenantId = ?', [tId]);
      }

      for (const r of db.results) {
        if (!r.id) continue;
        const marksObt = r.obtainedMarks !== undefined ? r.obtainedMarks : (r.marksObtained !== undefined ? r.marksObtained : 0);
        const maxM = r.totalMarks !== undefined ? r.totalMarks : (r.maxMarks !== undefined ? r.maxMarks : 100);
        const isL = r.locked !== undefined ? r.locked : (r.isLocked !== undefined ? r.isLocked : false);
        const isP = r.published !== undefined ? r.published : (r.isPublished !== undefined ? r.isPublished : false);

        await sqlDb.query(
          `INSERT INTO results (
            id, studentId, studentName, examId, examName, subject, marksObtained, maxMarks, grade, remarks, isLocked, isPublished, tenantId,
            term, percentage, gpa, \`rank\`, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE marksObtained=VALUES(marksObtained), grade=VALUES(grade), isLocked=VALUES(isLocked), isPublished=VALUES(isPublished), status=VALUES(status)`,
          [
            r.id,
            r.studentId || '',
            r.studentName || '',
            r.examId || '',
            r.examName || '',
            r.subject || '',
            marksObt,
            maxM,
            r.grade || '',
            r.remarks || '',
            isL ? 1 : 0,
            isP ? 1 : 0,
            tId,
            r.term || '',
            r.percentage !== undefined ? r.percentage : 0,
            r.gpa !== undefined ? parseFloat(r.gpa) : 0.0,
            r.rank !== undefined ? String(r.rank) : '-',
            r.status || 'Draft'
          ]
        );
      }
    }

    if (db.overallResults && Array.isArray(db.overallResults)) {
      const activeOrIds = db.overallResults.map(o => o.id || `OR-${o.studentId}`).filter(Boolean);
      if (activeOrIds.length > 0) {
        await sqlDb.query(`DELETE FROM overall_results WHERE tenantId = ? AND id NOT IN (${activeOrIds.map(() => '?').join(',')})`, [tId, ...activeOrIds]);
      } else {
        await sqlDb.query('DELETE FROM overall_results WHERE tenantId = ?', [tId]);
      }

      for (const o of db.overallResults) {
        const studentId = o.studentId || '';
        if (!studentId) continue;
        const classId = o.classId || (o.cohort ? o.cohort.split('-')[0] : '');
        const sectionId = o.sectionId || (o.cohort ? o.cohort.split('-')[1] : '');
        const passStat = o.status || o.passStatus || '';

        await sqlDb.query(
          `INSERT INTO overall_results (
            id, studentId, studentName, classId, sectionId, percentage, grade, status, tenantId,
            examId, cohort, totalObtained, totalMax, gpa, \`rank\`, subjectsCount, passStatus
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE percentage=VALUES(percentage), grade=VALUES(grade), status=VALUES(status)`,
          [
            o.id || `OR-${studentId}`,
            studentId,
            o.studentName || '',
            classId,
            sectionId,
            parseFloat(o.percentage || 0),
            o.grade || '',
            passStat,
            tId,
            o.examId || '',
            o.cohort || '',
            o.totalObtained !== undefined ? parseFloat(o.totalObtained) : 0,
            o.totalMax !== undefined ? parseFloat(o.totalMax) : 0,
            o.gpa !== undefined ? parseFloat(o.gpa) : 0.0,
            o.rank !== undefined ? String(o.rank) : '-',
            o.subjectsCount !== undefined ? parseInt(o.subjectsCount) : 0,
            passStat
          ]
        );
      }
    }

    // 14. Sync Notices, Holidays, Events, Subjects
    if (db.notices && Array.isArray(db.notices)) {
      const activeNoticeIds = db.notices.map(n => n.id).filter(Boolean);
      if (activeNoticeIds.length > 0) {
        await sqlDb.query(`DELETE FROM notices WHERE tenantId = ? AND id NOT IN (${activeNoticeIds.map(() => '?').join(',')})`, [tId, ...activeNoticeIds]);
      } else {
        await sqlDb.query('DELETE FROM notices WHERE tenantId = ?', [tId]);
      }

      for (const n of db.notices) {
        if (!n.id) continue;
        await sqlDb.query(
          `INSERT INTO notices (id, title, content, date, audience, createdBy, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), audience=VALUES(audience)`,
          [n.id, n.title || '', n.content || '', n.date || '', n.audience || 'All', n.createdBy || '', tId]
        );
      }
    }

    if (db.holidays && Array.isArray(db.holidays)) {
      const activeHolidayIds = db.holidays.map(h => h.id).filter(Boolean);
      if (activeHolidayIds.length > 0) {
        await sqlDb.query(`DELETE FROM holidays WHERE tenantId = ? AND id NOT IN (${activeHolidayIds.map(() => '?').join(',')})`, [tId, ...activeHolidayIds]);
      } else {
        await sqlDb.query('DELETE FROM holidays WHERE tenantId = ?', [tId]);
      }

      for (const h of db.holidays) {
        if (!h.id) continue;
        await sqlDb.query(
          `INSERT INTO holidays (id, title, startDate, endDate, description, tenantId) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title=VALUES(title), startDate=VALUES(startDate), endDate=VALUES(endDate), description=VALUES(description)`,
          [h.id, h.title || '', h.startDate || '', h.endDate || '', h.description || '', tId]
        );
      }
    }

    if (db.events && Array.isArray(db.events)) {
      const activeEventIds = db.events.map(ev => ev.id).filter(Boolean);
      if (activeEventIds.length > 0) {
        await sqlDb.query(`DELETE FROM events WHERE tenantId = ? AND id NOT IN (${activeEventIds.map(() => '?').join(',')})`, [tId, ...activeEventIds]);
      } else {
        await sqlDb.query('DELETE FROM events WHERE tenantId = ?', [tId]);
      }

      for (const ev of db.events) {
        if (!ev.id) continue;
        await sqlDb.query(
          `INSERT INTO events (id, title, description, date, time, venue, audience, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), date=VALUES(date), time=VALUES(time), venue=VALUES(venue), audience=VALUES(audience)`,
          [ev.id, ev.title || '', ev.description || '', ev.date || '', ev.time || '', ev.venue || '', ev.audience || 'All', tId]
        );
      }
    }

    if (db.subjects && Array.isArray(db.subjects)) {
      const activeSubjectIds = db.subjects.map(sub => sub.id).filter(Boolean);
      if (activeSubjectIds.length > 0) {
        await sqlDb.query(`DELETE FROM subjects WHERE tenantId = ? AND id NOT IN (${activeSubjectIds.map(() => '?').join(',')})`, [tId, ...activeSubjectIds]);
      } else {
        await sqlDb.query('DELETE FROM subjects WHERE tenantId = ?', [tId]);
      }

      for (const sub of db.subjects) {
        if (!sub.id) continue;
        await sqlDb.query(
          `INSERT INTO subjects (id, name, code, classId, teacherId, teacherName, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), teacherId=VALUES(teacherId), teacherName=VALUES(teacherName)`,
          [sub.id, sub.subjectName || sub.name || '', sub.code || '', sub.grade || sub.classId || '', sub.teacherId || '', sub.teacherName || '', tId]
        );
      }
    }

    // 15. Sync Timeslots
    if (db.timeslots && Array.isArray(db.timeslots)) {
      await sqlDb.query('DELETE FROM timeslots WHERE tenantId = ?', [tId]);
      for (const slot of db.timeslots) {
        await sqlDb.query('INSERT INTO timeslots (slotTime, tenantId) VALUES (?, ?)', [slot, tId]);
      }
    }

    // 16. Sync structures: feeStructures, salaryStructures, staffSalaryStructures, income, attendance
    if (db.feeStructures && Array.isArray(db.feeStructures)) {
      const activeFsIds = db.feeStructures.map(fsItem => fsItem.id || `FS-${fsItem.grade || fsItem.studentClass}`);
      if (activeFsIds.length > 0) {
        await sqlDb.query(`DELETE FROM fee_structures WHERE tenantId = ? AND id NOT IN (${activeFsIds.map(() => '?').join(',')})`, [tId, ...activeFsIds]);
      } else {
        await sqlDb.query('DELETE FROM fee_structures WHERE tenantId = ?', [tId]);
      }

      for (const fsItem of db.feeStructures) {
        const classVal = fsItem.grade || fsItem.studentClass;
        const totalVal = parseFloat(fsItem.totalFee || fsItem.amount || 0);
        await sqlDb.query(
          `INSERT INTO fee_structures (
             id, classId, amount, frequency, tenantId,
             studentClass, admissionFee, tuitionFee, examFee, transportFee, hostelFee, libraryFee, otherCharges, totalFee
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             amount=VALUES(amount), frequency=VALUES(frequency),
             studentClass=VALUES(studentClass), admissionFee=VALUES(admissionFee), tuitionFee=VALUES(tuitionFee),
             examFee=VALUES(examFee), transportFee=VALUES(transportFee), hostelFee=VALUES(hostelFee),
             libraryFee=VALUES(libraryFee), otherCharges=VALUES(otherCharges), totalFee=VALUES(totalFee)`,
          [
            fsItem.id || `FS-${classVal}`, classVal, totalVal, fsItem.frequency || 'Yearly', tId,
            fsItem.studentClass || classVal,
            parseFloat(fsItem.admissionFee || 0),
            parseFloat(fsItem.tuitionFee || 0),
            parseFloat(fsItem.examFee || 0),
            parseFloat(fsItem.transportFee || 0),
            parseFloat(fsItem.hostelFee || 0),
            parseFloat(fsItem.libraryFee || 0),
            parseFloat(fsItem.otherCharges || 0),
            totalVal
          ]
        );
      }
    }

    if (db.salaryStructures && Array.isArray(db.salaryStructures)) {
      const activeSsIds = db.salaryStructures.map(ss => ss.id || `SS-${ss.gradeName || ss.designation}`);
      if (activeSsIds.length > 0) {
        await sqlDb.query(`DELETE FROM salary_structures WHERE tenantId = ? AND id NOT IN (${activeSsIds.map(() => '?').join(',')})`, [tId, ...activeSsIds]);
      } else {
        await sqlDb.query('DELETE FROM salary_structures WHERE tenantId = ?', [tId]);
      }

      for (const ss of db.salaryStructures) {
        const gradeVal = ss.gradeName || ss.designation;
        const basicVal = parseFloat(ss.basicSalary || 0);
        const allowVal = parseFloat(ss.allowances || 0);
        const dedVal = parseFloat(ss.deductions || 0);
        const netVal = parseFloat(ss.netSalary || (basicVal + allowVal - dedVal));
        await sqlDb.query(
          `INSERT INTO salary_structures (
             id, gradeName, basicSalary, allowances, deductions, tenantId,
             designation, pfDeduction, taxDeduction, netSalary
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             basicSalary=VALUES(basicSalary), allowances=VALUES(allowances), deductions=VALUES(deductions),
             designation=VALUES(designation), pfDeduction=VALUES(pfDeduction), taxDeduction=VALUES(taxDeduction), netSalary=VALUES(netSalary)`,
          [
            ss.id || `SS-${gradeVal}`, gradeVal, basicVal, allowVal, dedVal, tId,
            ss.designation || gradeVal,
            parseFloat(ss.pfDeduction || 0),
            parseFloat(ss.taxDeduction || 0),
            netVal
          ]
        );
      }
    }

    if (db.staffSalaryStructures && Array.isArray(db.staffSalaryStructures)) {
      const activeSssIds = db.staffSalaryStructures.map(sss => sss.id || `SSS-${sss.position || sss.designation}`);
      if (activeSssIds.length > 0) {
        await sqlDb.query(`DELETE FROM staff_salary_structures WHERE tenantId = ? AND id NOT IN (${activeSssIds.map(() => '?').join(',')})`, [tId, ...activeSssIds]);
      } else {
        await sqlDb.query('DELETE FROM staff_salary_structures WHERE tenantId = ?', [tId]);
      }

      for (const sss of db.staffSalaryStructures) {
        const posVal = sss.position || sss.designation;
        const basicVal = parseFloat(sss.basicSalary || 0);
        const allowVal = parseFloat(sss.allowances || 0);
        const dedVal = parseFloat(sss.deductions || 0);
        const bonusVal = parseFloat(sss.bonus || 0);
        const netVal = parseFloat(sss.netSalary || (basicVal + allowVal + bonusVal - dedVal));
        await sqlDb.query(
          `INSERT INTO staff_salary_structures (
             id, position, basicSalary, allowances, deductions, tenantId,
             designation, bonus, pfDeduction, taxDeduction, netSalary, designationLevel, employmentType
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             basicSalary=VALUES(basicSalary), allowances=VALUES(allowances), deductions=VALUES(deductions),
             designation=VALUES(designation), bonus=VALUES(bonus), pfDeduction=VALUES(pfDeduction), taxDeduction=VALUES(taxDeduction), 
             netSalary=VALUES(netSalary), designationLevel=VALUES(designationLevel), employmentType=VALUES(employmentType)`,
          [
            sss.id || `SSS-${posVal}`, posVal, basicVal, allowVal, dedVal, tId,
            sss.designation || posVal,
            bonusVal,
            parseFloat(sss.pfDeduction || 0),
            parseFloat(sss.taxDeduction || 0),
            netVal,
            sss.designationLevel || '',
            sss.employmentType || ''
          ]
        );
      }
    }

    if (db.income && Array.isArray(db.income)) {
      const activeIncIds = db.income.map(inc => inc.id);
      if (activeIncIds.length > 0) {
        await sqlDb.query(`DELETE FROM income WHERE tenantId = ? AND id NOT IN (${activeIncIds.map(() => '?').join(',')})`, [tId, ...activeIncIds]);
      } else {
        await sqlDb.query('DELETE FROM income WHERE tenantId = ?', [tId]);
      }

      for (const inc of db.income) {
        await sqlDb.query(
          `INSERT INTO income (id, source, amount, date, description, tenantId) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE source=VALUES(source), amount=VALUES(amount), date=VALUES(date), description=VALUES(description)`,
          [inc.id, inc.source, parseFloat(inc.amount || 0), inc.date || inc.paymentDate, inc.description || '', tId]
        );
      }
    }

    if (db.attendance && Array.isArray(db.attendance)) {
      const activeAttIds = db.attendance.map(att => att.attendanceId);
      if (activeAttIds.length > 0) {
        await sqlDb.query(`DELETE FROM attendance WHERE tenantId = ? AND attendanceId NOT IN (${activeAttIds.map(() => '?').join(',')})`, [tId, ...activeAttIds]);
      } else {
        await sqlDb.query('DELETE FROM attendance WHERE tenantId = ?', [tId]);
      }

      for (const att of db.attendance) {
        await sqlDb.query(
          `INSERT INTO attendance (
            attendanceId, studentId, classId, sectionId, attendanceDate, attendanceStatus, remarks, markedBy, createdAt, updatedAt, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE attendanceStatus=VALUES(attendanceStatus), remarks=VALUES(remarks), updatedAt=VALUES(updatedAt)`,
          [att.attendanceId, att.studentId, att.classId, att.sectionId, att.attendanceDate, att.attendanceStatus, att.remarks || '', att.markedBy || '', att.createdAt, att.updatedAt, tId]
        );
      }
    }

    // 17. Sync Roles
    if (db.roles && Array.isArray(db.roles)) {
      const activeRoleIds = db.roles.map(r => r.id).filter(Boolean);
      if (activeRoleIds.length > 0) {
        await sqlDb.query(`DELETE FROM roles WHERE tenantId = ? AND id NOT IN (${activeRoleIds.map(() => '?').join(',')})`, [tId, ...activeRoleIds]);
      } else {
        await sqlDb.query('DELETE FROM roles WHERE tenantId = ?', [tId]);
      }

      for (const r of db.roles) {
        if (!r.id) continue;
        await sqlDb.query(
          `INSERT INTO roles (id, name, description, active, isSystem, permissions, createdAt, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), active=VALUES(active), permissions=VALUES(permissions)`,
          [
            r.id,
            r.name,
            r.description || '',
            r.active ? 1 : 0,
            r.isSystem ? 1 : 0,
            typeof r.permissions === 'object' ? JSON.stringify(r.permissions) : (r.permissions || '{}'),
            r.createdAt || new Date().toISOString(),
            tId
          ]
        );
      }
    }

    // 18. Sync User Access
    if (db.userAccess && Array.isArray(db.userAccess)) {
      const activeUaIds = db.userAccess.map(ua => ua.id).filter(Boolean);
      if (activeUaIds.length > 0) {
        await sqlDb.query(`DELETE FROM user_access WHERE tenantId = ? AND id NOT IN (${activeUaIds.map(() => '?').join(',')})`, [tId, ...activeUaIds]);
      } else {
        await sqlDb.query('DELETE FROM user_access WHERE tenantId = ?', [tId]);
      }

      for (const ua of db.userAccess) {
        if (!ua.id) continue;
        await sqlDb.query(
          `INSERT INTO user_access (id, userId, userName, userType, roleId, status, overrides, updatedAt, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE roleId=VALUES(roleId), status=VALUES(status), overrides=VALUES(overrides), userName=VALUES(userName), updatedAt=VALUES(updatedAt)`,
          [
            ua.id,
            ua.userId,
            ua.userName,
            ua.userType,
            ua.roleId || null,
            ua.status || 'Active',
            typeof ua.overrides === 'object' ? JSON.stringify(ua.overrides) : (ua.overrides || '{}'),
            ua.updatedAt || new Date().toISOString(),
            tId
          ]
        );
      }
    }

    // 19. Sync Audit Logs
    if (db.auditLogs && Array.isArray(db.auditLogs)) {
      const activeLogIds = db.auditLogs.map(l => l.id).filter(Boolean);
      if (activeLogIds.length > 0) {
        await sqlDb.query(`DELETE FROM audit_logs WHERE tenantId = ? AND id NOT IN (${activeLogIds.map(() => '?').join(',')})`, [tId, ...activeLogIds]);
      } else {
        await sqlDb.query('DELETE FROM audit_logs WHERE tenantId = ?', [tId]);
      }

      for (const l of db.auditLogs) {
        if (!l.id) continue;
        await sqlDb.query(
          `INSERT INTO audit_logs (id, userId, userName, userRole, action, details, ipAddress, timestamp, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE action=VALUES(action)`,
          [
            l.id,
            l.userId || null,
            l.userName || '',
            l.userRole || '',
            l.action,
            l.details || '',
            l.ipAddress || '',
            l.timestamp || new Date().toISOString(),
            tId
          ]
        );
      }
    }

    // 20. Sync Employee QR Codes
    if (db.employeeQrCodes && Array.isArray(db.employeeQrCodes)) {
      const activeQrIds = db.employeeQrCodes.map(q => q.id).filter(Boolean);
      if (activeQrIds.length > 0) {
        await sqlDb.query(`DELETE FROM employee_qr_codes WHERE tenantId = ? AND id NOT IN (${activeQrIds.map(() => '?').join(',')})`, [tId, ...activeQrIds]);
      } else {
        await sqlDb.query('DELETE FROM employee_qr_codes WHERE tenantId = ?', [tId]);
      }
      for (const q of db.employeeQrCodes) {
        if (!q.id) continue;
        // Skip orphan QR records to prevent foreign key constraint violations
        if (q.employeeType === 'Teacher') {
          const teacherExists = db.teachers && db.teachers.some(t => t.id === q.employeeId || t.employeeId === q.employeeId);
          if (!teacherExists) {
            console.warn(`[SQL Sync WARNING] Skipping orphan employee_qr_code record for non-existent teacher: ${q.employeeId}`);
            continue;
          }
        } else if (q.employeeType === 'Staff') {
          const staffExists = db.staff && db.staff.some(s => s.id === q.employeeId);
          if (!staffExists) {
            console.warn(`[SQL Sync WARNING] Skipping orphan employee_qr_code record for non-existent staff: ${q.employeeId}`);
            continue;
          }
        }
        await sqlDb.query(
          `INSERT INTO employee_qr_codes (id, employeeId, employeeType, qrPath, createdAt, tenantId, teacherId, staffId)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE qrPath=VALUES(qrPath)`,
          [
            q.id, q.employeeId, q.employeeType, q.qrPath, q.createdAt || new Date().toISOString(), tId,
            q.employeeType === 'Teacher' ? q.employeeId : null,
            q.employeeType === 'Staff' ? q.employeeId : null
          ]
        );
      }
    }

    // 21. Sync Attendance Records
    if (db.attendanceRecords && Array.isArray(db.attendanceRecords)) {
      const activeAttIds = db.attendanceRecords.map(a => a.id).filter(Boolean);
      if (activeAttIds.length > 0) {
        await sqlDb.query(`DELETE FROM attendance_records WHERE tenantId = ? AND id NOT IN (${activeAttIds.map(() => '?').join(',')})`, [tId, ...activeAttIds]);
      } else {
        await sqlDb.query('DELETE FROM attendance_records WHERE tenantId = ?', [tId]);
      }
      for (const a of db.attendanceRecords) {
        if (!a.id) continue;
        // Skip orphan attendance records to prevent foreign key constraint violations
        if (a.employeeType === 'Teacher') {
          const teacherExists = db.teachers && db.teachers.some(t => t.id === a.employeeId || t.employeeId === a.employeeId);
          if (!teacherExists) {
            console.warn(`[SQL Sync WARNING] Skipping orphan attendance record for non-existent teacher: ${a.employeeId}`);
            continue;
          }
        } else if (a.employeeType === 'Staff') {
          const staffExists = db.staff && db.staff.some(s => s.id === a.employeeId);
          if (!staffExists) {
            console.warn(`[SQL Sync WARNING] Skipping orphan attendance record for non-existent staff: ${a.employeeId}`);
            continue;
          }
        }
        await sqlDb.query(
          `INSERT INTO attendance_records (id, employeeId, employeeType, name, department, designation, date, checkIn, checkOut, workingHours, status, createdAt, tenantId, teacherId, staffId)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE checkIn=VALUES(checkIn), checkOut=VALUES(checkOut), workingHours=VALUES(workingHours), status=VALUES(status)`,
          [
            a.id, a.employeeId, a.employeeType, a.name, a.department || '', a.designation || '', a.date, a.checkIn || null, a.checkOut || null, parseFloat(a.workingHours || 0), a.status || 'Present', a.createdAt || new Date().toISOString(), tId,
            a.employeeType === 'Teacher' ? a.employeeId : null,
            a.employeeType === 'Staff' ? a.employeeId : null
          ]
        );
      }
    }

    // 22. Sync Attendance Logs
    if (db.attendanceLogs && Array.isArray(db.attendanceLogs)) {
      const activeLogIds = db.attendanceLogs.map(l => l.id).filter(Boolean);
      if (activeLogIds.length > 0) {
        await sqlDb.query(`DELETE FROM attendance_logs WHERE tenantId = ? AND id NOT IN (${activeLogIds.map(() => '?').join(',')})`, [tId, ...activeLogIds]);
      } else {
        await sqlDb.query('DELETE FROM attendance_logs WHERE tenantId = ?', [tId]);
      }
      for (const l of db.attendanceLogs) {
        if (!l.id) continue;
        // Skip orphan attendance logs to prevent foreign key constraint violations
        if (l.employeeType === 'Teacher') {
          const teacherExists = db.teachers && db.teachers.some(t => t.id === l.employeeId || t.employeeId === l.employeeId);
          if (!teacherExists) {
            console.warn(`[SQL Sync WARNING] Skipping orphan attendance log for non-existent teacher: ${l.employeeId}`);
            continue;
          }
        } else if (l.employeeType === 'Staff') {
          const staffExists = db.staff && db.staff.some(s => s.id === l.employeeId);
          if (!staffExists) {
            console.warn(`[SQL Sync WARNING] Skipping orphan attendance log for non-existent staff: ${l.employeeId}`);
            continue;
          }
        }
        await sqlDb.query(
          `INSERT INTO attendance_logs (id, employeeId, employeeType, scanTime, scanType, status, tenantId, teacherId, staffId)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE scanTime=VALUES(scanTime), scanType=VALUES(scanType), status=VALUES(status)`,
          [
            l.id, l.employeeId, l.employeeType, l.scanTime, l.scanType, l.status, tId,
            l.employeeType === 'Teacher' ? l.employeeId : null,
            l.employeeType === 'Staff' ? l.employeeId : null
          ]
        );
      }
    }

    // 23. Sync Attendance Reports
    if (db.attendanceReports && Array.isArray(db.attendanceReports)) {
      const activeRepIds = db.attendanceReports.map(r => r.id).filter(Boolean);
      if (activeRepIds.length > 0) {
        await sqlDb.query(`DELETE FROM attendance_reports WHERE tenantId = ? AND id NOT IN (${activeRepIds.map(() => '?').join(',')})`, [tId, ...activeRepIds]);
      } else {
        await sqlDb.query('DELETE FROM attendance_reports WHERE tenantId = ?', [tId]);
      }
      for (const r of db.attendanceReports) {
        if (!r.id) continue;
        await sqlDb.query(
          `INSERT INTO attendance_reports (id, reportName, reportType, generatedAt, filters, filePath, tenantId)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE reportName=VALUES(reportName), filePath=VALUES(filePath)`,
          [
            r.id, r.reportName, r.reportType, r.generatedAt,
            typeof r.filters === 'object' ? JSON.stringify(r.filters) : (r.filters || '{}'),
            r.filePath, tId
          ]
        );
      }
    }

    // 24. Sync Academic Calendar Events
    if (db.academicCalendarEvents && Array.isArray(db.academicCalendarEvents)) {
      const activeEventIds = db.academicCalendarEvents.map(e => e.id).filter(Boolean);
      if (activeEventIds.length > 0) {
        await sqlDb.query(`DELETE FROM academic_calendar_events WHERE tenantId = ? AND id NOT IN (${activeEventIds.map(() => '?').join(',')})`, [tId, ...activeEventIds]);
      } else {
        await sqlDb.query('DELETE FROM academic_calendar_events WHERE tenantId = ?', [tId]);
      }

      for (const e of db.academicCalendarEvents) {
        if (!e.id) continue;
        await sqlDb.query(
          `INSERT INTO academic_calendar_events (
            id, eventDate, title, eventType, description, applicableClasses, startTime, endTime, session, color, audience, recurring, reminders, attachments, notifications, tenantId, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            eventDate=VALUES(eventDate), title=VALUES(title), eventType=VALUES(eventType), 
            description=VALUES(description), applicableClasses=VALUES(applicableClasses), 
            startTime=VALUES(startTime), endTime=VALUES(endTime), session=VALUES(session),
            color=VALUES(color), audience=VALUES(audience), recurring=VALUES(recurring),
            reminders=VALUES(reminders), attachments=VALUES(attachments), notifications=VALUES(notifications),
            updatedAt=VALUES(updatedAt)`,
          [
            e.id, e.eventDate, e.title, e.eventType, e.description || '', e.applicableClasses || '',
            e.startTime || '', e.endTime || '', e.session, e.color || '#6366f1', e.audience || 'All',
            e.recurring || 'None',
            e.reminders ? (typeof e.reminders === 'string' ? e.reminders : JSON.stringify(e.reminders)) : null,
            e.attachments ? (typeof e.attachments === 'string' ? e.attachments : JSON.stringify(e.attachments)) : null,
            e.notifications ? (typeof e.notifications === 'string' ? e.notifications : JSON.stringify(e.notifications)) : null,
            tId, e.createdAt || new Date().toISOString(), e.updatedAt || new Date().toISOString()
          ]
        );
      }
    }

    // 25. Sync Academic Calendar Imports
    if (db.academicCalendarImports && Array.isArray(db.academicCalendarImports)) {
      const activeImportIds = db.academicCalendarImports.map(i => i.id).filter(Boolean);
      if (activeImportIds.length > 0) {
        await sqlDb.query(`DELETE FROM academic_calendar_imports WHERE tenantId = ? AND id NOT IN (${activeImportIds.map(() => '?').join(',')})`, [tId, ...activeImportIds]);
      } else {
        await sqlDb.query('DELETE FROM academic_calendar_imports WHERE tenantId = ?', [tId]);
      }

      for (const i of db.academicCalendarImports) {
        if (!i.id) continue;
        await sqlDb.query(
          `INSERT INTO academic_calendar_imports (
            id, fileName, importDate, importedBy, totalRecords, session, tenantId
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            fileName=VALUES(fileName), importDate=VALUES(importDate), 
            importedBy=VALUES(importedBy), totalRecords=VALUES(totalRecords), session=VALUES(session)`,
          [
            i.id, i.fileName, i.importDate, i.importedBy, i.totalRecords || 0, i.session, tId
          ]
        );
      }
    }

    // 26. Sync Published Calendar Events
    if (db.publishedCalendarEvents && Array.isArray(db.publishedCalendarEvents)) {
      const activePublishedIds = db.publishedCalendarEvents.filter(Boolean);
      if (activePublishedIds.length > 0) {
        await sqlDb.query(`DELETE FROM published_calendar_events WHERE tenantId = ? AND eventId NOT IN (${activePublishedIds.map(() => '?').join(',')})`, [tId, ...activePublishedIds]);
      } else {
        await sqlDb.query('DELETE FROM published_calendar_events WHERE tenantId = ?', [tId]);
      }

      for (const eventId of db.publishedCalendarEvents) {
        if (!eventId) continue;
        await sqlDb.query(
          `INSERT IGNORE INTO published_calendar_events (eventId, tenantId) VALUES (?, ?)`,
          [eventId, tId]
        );
      }
    }

    // Sync central grades
    if (db.grades && Array.isArray(db.grades)) {
      const activeGradeIds = db.grades.map(g => g.id).filter(Boolean);
      if (activeGradeIds.length > 0) {
        await sqlDb.query(`DELETE FROM grades WHERE tenantId = ? AND id NOT IN (${activeGradeIds.map(() => '?').join(',')})`, [tId, ...activeGradeIds]);
      } else {
        await sqlDb.query('DELETE FROM grades WHERE tenantId = ?', [tId]);
      }
      for (const g of db.grades) {
        if (!g.id) continue;
        await sqlDb.query(
          `INSERT INTO grades (id, name, status, createdAt, updatedAt, tenantId)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), updatedAt=VALUES(updatedAt)`,
          [g.id, g.name, g.status || 'Active', g.createdAt || new Date().toISOString(), g.updatedAt || new Date().toISOString(), tId]
        );
      }
    }

    // Sync central departments
    if (db.departments && Array.isArray(db.departments)) {
      const activeDeptIds = db.departments.map(d => d.id).filter(Boolean);
      if (activeDeptIds.length > 0) {
        await sqlDb.query(`DELETE FROM departments WHERE tenantId = ? AND id NOT IN (${activeDeptIds.map(() => '?').join(',')})`, [tId, ...activeDeptIds]);
      } else {
        await sqlDb.query('DELETE FROM departments WHERE tenantId = ?', [tId]);
      }
      for (const d of db.departments) {
        if (!d.id) continue;
        await sqlDb.query(
          `INSERT INTO departments (id, name, status, createdAt, updatedAt, tenantId)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), updatedAt=VALUES(updatedAt)`,
          [d.id, d.name, d.status || 'Active', d.createdAt || new Date().toISOString(), d.updatedAt || new Date().toISOString(), tId]
        );
      }
    }

    // Sync central grade mappings
    if (db.gradeDepartments && Array.isArray(db.gradeDepartments)) {
      const activeMappingIds = db.gradeDepartments.map(gd => gd.id).filter(Boolean);
      if (activeMappingIds.length > 0) {
        await sqlDb.query(`DELETE FROM grade_departments WHERE tenantId = ? AND id NOT IN (${activeMappingIds.map(() => '?').join(',')})`, [tId, ...activeMappingIds]);
      } else {
        await sqlDb.query('DELETE FROM grade_departments WHERE tenantId = ?', [tId]);
      }
      for (const gd of db.gradeDepartments) {
        if (!gd.id) continue;
        await sqlDb.query(
          `INSERT INTO grade_departments (id, gradeId, departmentId, status, tenantId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status=VALUES(status), updatedAt=VALUES(updatedAt)`,
          [gd.id, gd.gradeId, gd.departmentId, gd.status || 'Active', tId, gd.createdAt || new Date().toISOString(), gd.updatedAt || new Date().toISOString()]
        );
      }
    }

    console.log(`[SQL Sync SUCCESS] Finished database sync for tenant: ${tId}`);
    } catch (err) {
      console.error(`[SQL Sync ERROR] Sync query failed for tenant ${tId || 'platform'}:`, err);
    }
  });

  sqlSyncQueues[tId] = syncPromise;
  return syncPromise;
};

// Central Database Reader (Preserves synchronous signature)
export const readDb = () => {
  const tenantId = tenantStorage.getStore();
  const activeTenant = tenantId ? slugify(tenantId) : 'platform';
  
  if (isSqlActive() && dbCache[activeTenant]) {
    return dbCache[activeTenant];
  }

  // Fallback to synchronous local file read
  const dbFile = getDbPath();
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    const db = JSON.parse(data);
    
    // Ensure all standard collections exist defensively
    if (!db.schools) db.schools = [];
    if (!db.roles) db.roles = [];
    // Auto-seed default roles if roles array is empty
    if (db.roles.length === 0) {
      db.roles = getDefaultRoles();
    }
    if (!db.subscriptionPlans) db.subscriptionPlans = [];
    if (!db.activities) db.activities = [];
    if (!db.students) db.students = [];
    if (!db.teachers) db.teachers = [];
    if (!db.staff) db.staff = [];
    if (!db.timetables) db.timetables = [];
    if (!db.teacherTimetables) db.teacherTimetables = [];
    if (!db.invoices) db.invoices = [];
    if (!db.fees) db.fees = [];
    if (!db.expenses) db.expenses = [];
    if (!db.payroll) db.payroll = [];
    if (!db.staffPayments) db.staffPayments = [];
    if (!db.exams) db.exams = [];
    if (!db.examTimetables) db.examTimetables = [];
    if (!db.notices) db.notices = [];
    if (!db.holidays) db.holidays = [];
    if (!db.events) db.events = [];
    if (!db.results) db.results = [];
    if (!db.academicCalendarEvents) db.academicCalendarEvents = [];
    if (!db.academicCalendarImports) db.academicCalendarImports = [];
    if (!db.overallResults) db.overallResults = [];
    if (!db.publishedCalendarEvents) db.publishedCalendarEvents = [];
    if (!db.subjects) db.subjects = [];
    if (!db.employeeQrCodes) db.employeeQrCodes = [];
    if (!db.attendanceRecords) db.attendanceRecords = [];
    if (!db.attendanceLogs) db.attendanceLogs = [];
    if (!db.attendanceReports) db.attendanceReports = [];
    if (!db.grades) db.grades = [];
    if (!db.departments) db.departments = [];
    if (!db.gradeDepartments) db.gradeDepartments = [];
    if (!db.sections) {
      db.sections = [];
    }
    if (!db.timeslots) {
      db.timeslots = [
        '09:00 AM - 10:00 AM',
        '10:00 AM - 11:00 AM',
        '11:00 AM - 12:00 PM',
        '01:00 PM - 02:00 PM',
        '02:00 PM - 03:00 PM'
      ];
    }
    return db;
  } catch (error) {
    const defaultDb = {
      schools: [],
      roles: [],
      activities: [],
      students: [],
      teachers: [],
      staff: [],
      timetables: [],
      invoices: [],
      fees: [],
      expenses: [],
      payroll: [],
      staffPayments: [],
      exams: [],
      examTimetables: [],
      notices: [],
      holidays: [],
      events: [],
      results: [],
      academicCalendarEvents: [],
      academicCalendarImports: [],
      publishedCalendarEvents: [],
      overallResults: [],
      employeeQrCodes: [],
      attendanceRecords: [],
      attendanceLogs: [],
      attendanceReports: [],
      grades: [],
      departments: [],
      gradeDepartments: [],
      sections: [],
      timeslots: [
        '09:00 AM - 10:00 AM',
        '10:00 AM - 11:00 AM',
        '11:00 AM - 12:00 PM',
        '01:00 PM - 02:00 PM',
        '02:00 PM - 03:00 PM'
      ]
    };
    return defaultDb;
  }
};

// Central Database Writer (Preserves synchronous signature)
export const writeDb = (data) => {
  const tenantId = tenantStorage.getStore();
  const activeTenant = tenantId ? slugify(tenantId) : 'platform';

  if (isSqlActive()) {
    // 1. Update memory cache instantly
    dbCache[activeTenant] = data;
    // 2. Dispatch MySQL sync asynchronously in the background
    saveMemoryDbToSql(activeTenant, data);
  }

  // Backup to JSON file asynchronously to avoid blocking
  const dbFile = getDbPath();
  fs.writeFile(dbFile, JSON.stringify(data, null, 2), 'utf8', (err) => {
    if (err) {
      console.error(`[JSON Backup ERROR] Failed writing local backup:`, err);
    }
  });
};

// Helper to log system activities
export const addActivity = (db, type, title, desc, color = 'hsl(var(--color-primary))', bg = 'rgba(hsl(var(--color-primary)), 0.1)') => {
  const newActivity = {
    id: `ACT-${Date.now()}`,
    type,
    title,
    desc,
    time: 'Just now',
    timestamp: new Date().toISOString(),
    color,
    bg
  };
  db.activities = [newActivity, ...(db.activities || [])].slice(0, 50); // Keep last 50
};
