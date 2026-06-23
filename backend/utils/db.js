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

// Roman numeral conversion helper
export const convertToRoman = (str) => {
  if (!str) return '';
  const clean = str.trim().toUpperCase();
  
  if (['LKG', 'UKG', 'NURSERY'].includes(clean)) {
    return clean;
  }
  
  const match = clean.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    const lookup = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
    };
    if (lookup[num]) {
      return lookup[num];
    }
  }
  
  const wordsLookup = {
    'FIRST': 'I', 'SECOND': 'II', 'THIRD': 'III', 'FOURTH': 'IV', 'FIFTH': 'V', 'SIXTH': 'VI',
    'SEVENTH': 'VII', 'EIGHTH': 'VIII', 'NINTH': 'IX', 'TENTH': 'X', 'ELEVENTH': 'XI', 'TWELFTH': 'XII',
    '1ST': 'I', '2ND': 'II', '3RD': 'III', '4TH': 'IV', '5TH': 'V', '6TH': 'VI', '7TH': 'VII',
    '8TH': 'VIII', '9TH': 'IX', '10TH': 'X', '11TH': 'XI', '12TH': 'XII'
  };
  
  if (wordsLookup[clean]) {
    return wordsLookup[clean];
  }
  
  return str;
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
let sqlInitPromise = null;

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

    // Ensure updatedAt column exists in schools table
    try {
      await sqlDb.query("ALTER TABLE schools ADD COLUMN updatedAt VARCHAR(100)");
      console.log("[SQL Init] Added missing column updatedAt to schools table.");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.warn("[SQL Init WARNING] Failed to check/add updatedAt column:", err.message);
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
      "ALTER TABLE fee_structures ADD COLUMN monthRange VARCHAR(100) DEFAULT NULL",
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
      "ALTER TABLE fees ADD COLUMN billingPeriod VARCHAR(100)",
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
      "ALTER TABLE academic_calendar_events ADD COLUMN notifications JSON NULL",
      "ALTER TABLE grades ADD COLUMN sections JSON NULL",
      "ALTER TABLE grade_departments ADD COLUMN sections JSON NULL",
      "CREATE TABLE IF NOT EXISTS sections (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100) NOT NULL, status VARCHAR(50) DEFAULT 'Active', createdAt VARCHAR(100), updatedAt VARCHAR(100), tenantId VARCHAR(100) NOT NULL, UNIQUE KEY unique_sec_name (name, tenantId))",
      "CREATE TABLE IF NOT EXISTS published_timetables (id VARCHAR(50) PRIMARY KEY, type VARCHAR(50) NOT NULL, identifier VARCHAR(100) NOT NULL, slots JSON NOT NULL, publishedAt VARCHAR(100) NOT NULL, tenantId VARCHAR(100) NOT NULL, UNIQUE KEY unique_pub_tt (type, identifier, tenantId))",
      "CREATE TABLE IF NOT EXISTS fee_periods (id VARCHAR(50) PRIMARY KEY, frequency VARCHAR(50) NOT NULL, name VARCHAR(100) NOT NULL, sortOrder INT DEFAULT 0, tenantId VARCHAR(100) NOT NULL, UNIQUE KEY unique_fp_freq_name (frequency, name, tenantId))",
      "CREATE TABLE IF NOT EXISTS auxiliary_income_categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, tenantId VARCHAR(100) NOT NULL, createdAt VARCHAR(100) NOT NULL, updatedAt VARCHAR(100) NOT NULL, UNIQUE KEY unique_aux_cat_name (name, tenantId))",
      "CREATE TABLE IF NOT EXISTS auxiliary_income (id VARCHAR(50) PRIMARY KEY, categoryId VARCHAR(50) NOT NULL, amount DECIMAL(10,2) NOT NULL, date VARCHAR(50) NOT NULL, receivedFrom VARCHAR(255), paymentMethod VARCHAR(100), referenceNumber VARCHAR(100), description TEXT, receiptNumber VARCHAR(100), tenantId VARCHAR(100) NOT NULL, createdAt VARCHAR(100) NOT NULL, updatedAt VARCHAR(100) NOT NULL, FOREIGN KEY (categoryId) REFERENCES auxiliary_income_categories(id) ON DELETE CASCADE)"
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

    // Performance Optimization: DB Indices on tenantId fields for multi-tenant query speedups
    const indexQueries = [
      "CREATE INDEX idx_students_tenant ON students (tenantId)",
      "CREATE INDEX idx_enrollments_tenant ON student_enrollments (tenantId)",
      "CREATE INDEX idx_parents_tenant ON parents (tenantId)",
      "CREATE INDEX idx_addresses_tenant ON addresses (tenantId)",
      "CREATE INDEX idx_medical_tenant ON medical_records (tenantId)",
      "CREATE INDEX idx_documents_tenant ON documents (tenantId)",
      "CREATE INDEX idx_fee_assign_tenant ON fee_assignments (tenantId)",
      "CREATE INDEX idx_student_acct_tenant ON student_accounts (tenantId)",
      "CREATE INDEX idx_parent_acct_tenant ON parent_accounts (tenantId)",
      "CREATE INDEX idx_employees_tenant ON employees (tenantId)",
      "CREATE INDEX idx_staff_tenant ON staff (tenantId)",
      "CREATE INDEX idx_timetables_tenant ON timetables (tenantId)",
      "CREATE INDEX idx_invoices_tenant ON invoices (tenantId)",
      "CREATE INDEX idx_fees_tenant ON fees (tenantId)",
      "CREATE INDEX idx_expenses_tenant ON expenses (tenantId)",
      "CREATE INDEX idx_payroll_tenant ON payroll (tenantId)",
      "CREATE INDEX idx_staff_pay_tenant ON staff_payments (tenantId)",
      "CREATE INDEX idx_activities_tenant ON activities (tenantId)",
      "CREATE INDEX idx_exams_tenant ON exams (tenantId)",
      "CREATE INDEX idx_exam_time_tenant ON exam_timetables (tenantId)",
      "CREATE INDEX idx_notices_tenant ON notices (tenantId)",
      "CREATE INDEX idx_holidays_tenant ON holidays (tenantId)",
      "CREATE INDEX idx_events_tenant ON events (tenantId)",
      "CREATE INDEX idx_calendar_events_tenant ON academic_calendar_events (tenantId)",
      "CREATE INDEX idx_calendar_imports_tenant ON academic_calendar_imports (tenantId)",
      "CREATE INDEX idx_results_tenant ON results (tenantId)",
      "CREATE INDEX idx_overall_results_tenant ON overall_results (tenantId)",
      "CREATE INDEX idx_subjects_tenant ON subjects (tenantId)",
      "CREATE INDEX idx_fee_struct_tenant ON fee_structures (tenantId)",
      "CREATE INDEX idx_salary_struct_tenant ON salary_structures (tenantId)",
      "CREATE INDEX idx_staff_sal_tenant ON staff_salary_structures (tenantId)",
      "CREATE INDEX idx_income_tenant ON income (tenantId)",
      "CREATE INDEX idx_attendance_tenant ON attendance (tenantId)",
      "CREATE INDEX idx_roles_tenant ON roles (tenantId)",
      "CREATE INDEX idx_user_access_tenant ON user_access (tenantId)",
      "CREATE INDEX idx_audit_logs_tenant ON audit_logs (tenantId)",
      "CREATE INDEX idx_emp_qr_tenant ON employee_qr_codes (tenantId)",
      "CREATE INDEX idx_grades_tenant ON grades (tenantId)",
      "CREATE INDEX idx_departments_tenant ON departments (tenantId)",
      "CREATE INDEX idx_grade_dept_tenant ON grade_departments (tenantId)",
      "CREATE INDEX idx_fee_periods_tenant ON fee_periods (tenantId)",
      "CREATE INDEX idx_aux_income_cat_tenant ON auxiliary_income_categories (tenantId)",
      "CREATE INDEX idx_aux_income_tenant ON auxiliary_income (tenantId)"
    ];

    console.log(`[SQL Init] Constructing performance optimization indexes...`);
    for (const sql of indexQueries) {
      try {
        await sqlDb.query(sql);
      } catch (err) {
        if (err.code !== 'ER_DUP_KEYNAME' && err.code !== 'ER_DUP_UNIQUE') {
          // Ignore duplicate index name warnings (MySQL code 1061 / ER_DUP_KEYNAME)
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

const addTenantIndexes = async () => {
  const tables = [
    'students', 'student_enrollments', 'parents', 'addresses', 'medical_records',
    'documents', 'fee_assignments', 'student_accounts', 'parent_accounts',
    'employees', 'staff', 'timetables', 'invoices', 'fees', 'expenses',
    'payroll', 'staff_payments', 'activities', 'exams', 'exam_timetables',
    'notices', 'holidays', 'events', 'academic_calendar_events', 'academic_calendar_imports',
    'results', 'overall_results', 'subjects', 'timeslots', 'fee_structures',
    'salary_structures', 'staff_salary_structures', 'income', 'attendance',
    'roles', 'user_access', 'audit_logs', 'grades', 'departments', 'grade_departments',
    'sections', 'published_timetables', 'fee_periods'
  ];
  for (const table of tables) {
    try {
      const columns = await sqlDb.query(`SHOW COLUMNS FROM \`${table}\` LIKE 'tenantId'`);
      if (columns && columns.length > 0) {
        const indexes = await sqlDb.query(`SHOW INDEX FROM \`${table}\` WHERE Key_name = 'idx_tenantId'`);
        if (!indexes || indexes.length === 0) {
          await sqlDb.query(`ALTER TABLE \`${table}\` ADD INDEX idx_tenantId (tenantId)`);
          console.log(`[SQL Init] Created index idx_tenantId on ${table}`);
        }
      }
    } catch (err) {
      console.warn(`[SQL Init] Could not add index idx_tenantId on ${table}:`, err.message);
    }
  }
};

// Initial database check called on server boot
export const initSqlDb = async () => {
  const isConnected = await sqlDb.testConnection();
  if (isConnected) {
    // 1. Create tables
    await createTablesFromSchema();
    // Dynamic database indexing
    await addTenantIndexes();
    // 2. JSON migration disabled — all data is now managed directly in MySQL
    // await migrateJsonToSql();
    
    // 3. Ensure live database admin username matches local seed/fallback settings
    try {
      await sqlDb.query("UPDATE schools SET adminUsername = 'school_admin' WHERE subdomain = 'greenvalley' AND adminUsername = 'greenvalley_admin'");
      console.log('[SQL Init] Ensured greenvalley adminUsername is updated to school_admin.');
    } catch (err) {
      console.warn('[SQL Init WARNING] Failed to run school_admin username update query:', err.message);
    }
    // 4. Ensure subjects' classId (grade) are normalized to Roman numerals
    try {
      const subjectsRows = await sqlDb.query("SELECT id, classId FROM subjects");

      if (subjectsRows && subjectsRows.length > 0) {
        for (const sub of subjectsRows) {
          if (sub.classId) {
            const formatted = convertToRoman(sub.classId);
            if (formatted !== sub.classId) {
              await sqlDb.query("UPDATE subjects SET classId = ? WHERE id = ?", [formatted, sub.id]);
              console.log(`[SQL Init] Normalized MySQL subject ID ${sub.id} grade from '${sub.classId}' to '${formatted}'`);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[SQL Init WARNING] Failed to normalize subjects table:', err.message);
    }

    isSqlInitialized = true;
    console.log('[SQL Init] MySQL Caching Adapter is active and running.');
  } else {
    console.warn('[SQL Init WARNING] MySQL Connection unavailable. Falling back to local JSON files.');
    isSqlInitialized = false;
  }
};

// Start the init procedure on boot
export const startSqlDbInit = () => {
  sqlInitPromise = initSqlDb();
  return sqlInitPromise;
};
startSqlDbInit();

// Default roles and permissions seeder data
export const getDefaultRoles = () => {
  const modules = [
    'overview',
    'student-directory',
    'teacher-directory',
    'staff-directory',
    'grade-management',
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
    'expense-history',
    'income',
    'expense-tracker',
    'financial-reports',
    'roles-permissions',
    'auxiliary-income'
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
      id: 'role-teacher',
      name: 'Teacher',
      description: 'Teacher. Records attendance, enters marks, manages academic activities, and views student profiles.',
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
    }
  ];
};

// Load dynamic cached tenant details from MySQL database
export const loadTenantSqlIntoMemory = async (tenantId) => {
  try {
    if (!isSqlActive()) return null;
    
    const isGlobal = !tenantId || tenantId === 'localhost' || tenantId === 'platform';
    const queryTenantId = isGlobal ? 'platform' : tenantId;
    const tId = queryTenantId;
    
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
      feePeriods: [],
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

    // 1. Fetch all datasets from MySQL in parallel to minimize network latency roundtrips
    const [
      dbSections,
      dbPubTT,
      globalSchools,
      plans,
      dbTeachers,
      dbStaff,
      dbInvoices,
      rawFees,
      rawExpenses,
      rawPayroll,
      rawStaffPayments,
      rawIncome,
      dbActivities,
      rawExams,
      rawEt,
      dbNotices,
      dbHolidays,
      dbEvents,
      dbCalendarEvents,
      dbCalendarImports,
      rawPublished,
      rawResults,
      dbSubjects,
      dbAttendance,
      rawOverall,
      dbTimeslots,
      dbSalary,
      dbStaffSalary,
      dbFeeStructures,
      dbTimetables,
      sqlStudents,
      sqlEnrollments,
      sqlParents,
      sqlAddresses,
      sqlMedicals,
      sqlDocs,
      sqlFeesAssigned,
      sqlStudentAccounts,
      sqlParentAccounts,
      dbRoles,
      dbUserAccess,
      dbAuditLogs,
      dbQrCodes,
      dbAttRecords,
      dbAttLogs,
      dbAttReports,
      dbGrades,
      dbDepts,
      dbGradeDepts,
      dbFeePeriods
    ] = await Promise.all([
      !isGlobal ? sqlDb.query('SELECT * FROM sections WHERE tenantId = ?', [tId]) : Promise.resolve([]),
      !isGlobal ? sqlDb.query('SELECT * FROM published_timetables WHERE tenantId = ?', [tId]) : Promise.resolve([]),
      sqlDb.query('SELECT * FROM schools'),
      sqlDb.query('SELECT * FROM subscription_plans'),
      sqlDb.query('SELECT * FROM staff WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM employees WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM invoices WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM fees WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM expenses WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM payroll WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM staff_payments WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM income WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM activities WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM exams WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM exam_timetables WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM notices WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM holidays WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM events WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM academic_calendar_events WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM academic_calendar_imports WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT eventId FROM published_calendar_events WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM results WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM subjects WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM attendance WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM overall_results WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT slotTime FROM timeslots WHERE tenantId = ? ORDER BY id', [tId]),
      sqlDb.query('SELECT * FROM salary_structures WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM staff_salary_structures WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM fee_structures WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM timetables WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM students WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM student_enrollments WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM parents WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM addresses WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM medical_records WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM documents WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM fee_assignments WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM student_accounts WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM parent_accounts WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM roles WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM user_access WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM audit_logs WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM employee_qr_codes WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM attendance_records WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM attendance_logs WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM attendance_reports WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM grades WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM departments WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM grade_departments WHERE tenantId = ?', [tId]),
      sqlDb.query('SELECT * FROM fee_periods WHERE tenantId = ? ORDER BY sortOrder', [tId])
    ]);

    // Load custom fields
    if (!isGlobal) {
      data.sections = dbSections.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status || 'Active',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }));

      data.publishedClassTimetables = dbPubTT
        .filter(pt => pt.type === 'class')
        .map(pt => ({
          cohort: pt.identifier,
          slots: typeof pt.slots === 'string' ? JSON.parse(pt.slots) : pt.slots,
          publishedAt: pt.publishedAt
        }));
      data.publishedTeacherTimetables = dbPubTT
        .filter(pt => pt.type === 'teacher')
        .map(pt => ({
          teacher: pt.identifier,
          slots: typeof pt.slots === 'string' ? JSON.parse(pt.slots) : pt.slots,
          publishedAt: pt.publishedAt
        }));
    }

    if (data.sections === undefined) data.sections = [];
    if (data.publishedClassTimetables === undefined) data.publishedClassTimetables = [];
    if (data.publishedTeacherTimetables === undefined) data.publishedTeacherTimetables = [];

    data.schools = globalSchools;

    // Load platformOwner from local db.json if exists
    try {
      if (fs.existsSync(GLOBAL_DB_FILE)) {
        const fileData = JSON.parse(fs.readFileSync(GLOBAL_DB_FILE, 'utf8'));
        if (fileData.platformOwner) {
          data.platformOwner = fileData.platformOwner;
        }
      }
    } catch (e) {
      console.error('Failed to load platformOwner from JSON:', e);
    }

    data.subscriptionPlans = plans.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || [])
    }));

    if (!isGlobal) {
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

    data.teachers = dbTeachers.map(t => {
      let qual = t.qualification;
      if (qual && (qual.startsWith('[') || qual.startsWith('{'))) {
        try { qual = JSON.parse(qual); } catch (e) {}
      }
      let exp = t.experiences;
      if (exp && (exp.startsWith('[') || exp.startsWith('{'))) {
        try { exp = JSON.parse(exp); } catch (e) {}
      }
      return {
        ...t,
        qualification: qual,
        experiences: exp,
        sameAsPermanent: t.sameAsPermanent === 'Yes' ? true : (t.sameAsPermanent === 'No' ? false : t.sameAsPermanent)
      };
    });

    data.staff = dbStaff;
    data.invoices = dbInvoices;
    
    data.fees = rawFees.map(f => ({
      ...f,
      totalAmount: parseFloat(f.totalAmount || 0),
      paidAmount: parseFloat(f.paidAmount || 0),
      dueAmount: parseFloat(f.dueAmount || 0),
      discount: parseFloat(f.discount || 0),
      fine: parseFloat(f.fine || 0),
      amount: parseFloat(f.amount || 0)
    }));

    data.expenses = rawExpenses.map(e => ({
      ...e,
      amount: parseFloat(e.amount || 0),
      subcategory: e.subcategory || '',
      grade: e.grade || '',
      department: e.department || '',
      expenseType: e.expenseType || ''
    }));

    data.payroll = rawPayroll.map(p => ({
      ...p,
      basicSalary: parseFloat(p.basicSalary || 0),
      allowances: parseFloat(p.allowances || 0),
      deductions: parseFloat(p.deductions || 0),
      netSalary: parseFloat(p.netSalary || 0)
    }));

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

    data.income = rawIncome.map(i => ({ ...i, amount: parseFloat(i.amount || 0) }));
    data.activities = dbActivities;

    data.exams = rawExams.map(ex => {
      let gradeSections = [];
      if (ex.gradeSections) {
        try { gradeSections = typeof ex.gradeSections === 'string' ? JSON.parse(ex.gradeSections) : ex.gradeSections; } catch (e) {}
      }
      let subjectIncluded = {};
      if (ex.subjectIncluded) {
        try { subjectIncluded = typeof ex.subjectIncluded === 'string' ? JSON.parse(ex.subjectIncluded) : ex.subjectIncluded; } catch (e) {}
      }
      let subjectMarks = {};
      if (ex.subjectMarks) {
        try { subjectMarks = typeof ex.subjectMarks === 'string' ? JSON.parse(ex.subjectMarks) : ex.subjectMarks; } catch (e) {}
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

    data.examTimetables = rawEt.map(et => ({
      ...et,
      roomAllocation: et.room || '',
      maxMarks: parseInt(et.maxMarks || 100)
    }));

    data.notices = dbNotices;
    data.holidays = dbHolidays;
    data.events = dbEvents;
    data.academicCalendarEvents = dbCalendarEvents;
    data.academicCalendarImports = dbCalendarImports;
    data.publishedCalendarEvents = rawPublished.map(p => p.eventId);

    data.results = rawResults.map(r => ({
      ...r,
      obtainedMarks: r.obtainedMarks !== undefined ? r.obtainedMarks : 0,
      totalMarks: r.maxMarks !== undefined ? r.maxMarks : 100,
      locked: r.isLocked === 1 || r.isLocked === true,
      published: r.isPublished === 1 || r.isPublished === true,
      status: r.status || 'Draft'
    }));

    data.subjects = dbSubjects.map(s => ({ ...s, subjectName: s.name, grade: s.classId }));
    data.attendance = dbAttendance;

    data.overallResults = rawOverall.map(o => ({
      ...o,
      percentage: parseFloat(o.percentage || 0),
      totalObtained: parseFloat(o.totalObtained || 0),
      totalMax: parseFloat(o.totalMax || 0),
      gpa: parseFloat(o.gpa || 0)
    }));

    data.timeslots = dbTimeslots.map(ts => ts.slotTime);

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
      frequency: fsItem.frequency,
      monthRange: fsItem.monthRange || null
    }));

    data.feePeriods = (dbFeePeriods || []).map(fp => ({
      id: fp.id,
      frequency: fp.frequency,
      name: fp.name,
      sortOrder: fp.sortOrder || 0
    }));

    const loadedSlots = [];
    const dayMap = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };
    for (const t of dbTimetables) {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      for (const d of days) {
        let val = t[d];
        if (typeof val === 'string') {
          try { val = JSON.parse(val); } catch (e) { val = null; }
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
        enrollmentId: enrollment.id || '',
        parentId: parent.id || '',
        addressId: address.id || '',
        medicalId: medical.id || '',
        feeAssignmentId: fee.id || '',

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

        bloodGroup: medical.bloodGroup || s.bloodGroup || '',
        medicalConditions: medical.medicalConditions || '',
        allergies: medical.allergies || '',
        disabilities: medical.disabilities || '',
        emergencyNotes: medical.emergencyNotes || '',
        doctorName: medical.doctorName || '',
        doctorContact: medical.doctorContact || '',

        studentUsername: studAcc.studentUsername || s.admissionNumber || '',
        studentPassword: studAcc.studentPassword || '',
        parentUsername: parentAcc.parentUsername || '',
        parentPassword: parentAcc.parentPassword || '',
        transportRequired: s.transportRequired || 'No',
        hostelRequired: s.hostelRequired || 'No',

        photo: photoDoc ? photoDoc.filePath : s.photo || '',
        aadhaarFile: aadhaarDoc ? aadhaarDoc.filePath : '',
        birthCertificateFile: birthDoc ? birthDoc.filePath : '',
        marksheetFile: marksheetDoc ? marksheetDoc.filePath : '',
        transferCertificateFile: tcDoc ? tcDoc.filePath : '',
        addressProofFile: addProofDoc ? addProofDoc.filePath : '',
        medicalCertificateFile: medCertDoc ? medCertDoc.filePath : '',
        additionalFile: extraDoc ? extraDoc.filePath : '',

        feeStructure: fee.feeStructure || '',
        scholarshipDetails: fee.scholarshipDetails || '',
        discountType: fee.discountType || '',
        discountAmount: fee.discountAmount || 0,
        feeStatus: fee.initialPaymentStatus || 'Pending',
        initialPaymentStatus: fee.initialPaymentStatus || 'Pending'
      };
    });

    data.roles = dbRoles.map(r => ({
      ...r,
      active: r.active === 1 || r.active === true || r.active === '1',
      isSystem: r.isSystem === 1 || r.isSystem === true || r.isSystem === '1',
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || {})
    }));

    if (data.roles.length === 0) {
      data.roles = getDefaultRoles();
      console.log(`[SQL Preload] Seeded default roles for tenant: ${tId}`);
    }

    // Filter out parent, student, librarian roles in memory cache
    data.roles = data.roles.filter(r => r.name !== 'Parent' && r.name !== 'Student' && r.name !== 'Librarian' && r.id !== 'role-parent' && r.id !== 'role-student' && r.id !== 'role-librarian');
    
    // Rename Subject Teacher to Teacher in memory cache
    data.roles.forEach(r => {
      if (r.id === 'role-subject-teacher' || r.name === 'Subject Teacher') {
        r.id = 'role-teacher';
        r.name = 'Teacher';
        r.description = 'Teacher. Records attendance, enters marks, manages academic activities, and views student profiles.';
      }
    });

    data.userAccess = dbUserAccess.map(ua => ({
      ...ua,
      overrides: typeof ua.overrides === 'string' ? JSON.parse(ua.overrides) : (ua.overrides || {})
    }));

    // Clean up userAccess references in memory cache
    data.userAccess.forEach(ua => {
      if (ua.roleId === 'role-subject-teacher') {
        ua.roleId = 'role-teacher';
      }
    });

    // Clean up SQL database roles & user_access table entries if SQL is active
    if (isSqlActive()) {
      sqlDb.query("DELETE FROM roles WHERE tenantId = ? AND (name IN ('Parent', 'Student', 'Librarian') OR id IN ('role-parent', 'role-student', 'role-librarian'))", [tId]).catch(() => {});
      sqlDb.query("UPDATE roles SET id = 'role-teacher', name = 'Teacher', description = 'Teacher. Records attendance, enters marks, manages academic activities, and views student profiles.' WHERE tenantId = ? AND (name = 'Subject Teacher' OR id = 'role-subject-teacher')", [tId]).catch(() => {});
      sqlDb.query("UPDATE user_access SET roleId = 'role-teacher' WHERE tenantId = ? AND roleId = 'role-subject-teacher'", [tId]).catch(() => {});
    }

    data.auditLogs = dbAuditLogs;
    data.employeeQrCodes = dbQrCodes;

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

    data.attendanceRecords = dbAttRecords.map(a => ({
      ...a,
      workingHours: parseFloat(a.workingHours || 0)
    }));

    data.attendanceLogs = dbAttLogs;

    data.attendanceReports = dbAttReports.map(r => ({
      ...r,
      filters: typeof r.filters === 'string' ? JSON.parse(r.filters) : (r.filters || {})
    }));

    data.grades = dbGrades.map(g => ({
      ...g,
      status: g.status || 'Active',
      sections: g.sections ? (typeof g.sections === 'string' ? JSON.parse(g.sections) : g.sections) : []
    }));

    data.departments = dbDepts.map(d => ({
      ...d,
      status: d.status || 'Active'
    }));

    data.gradeDepartments = dbGradeDepts.map(gd => ({
      ...gd,
      status: gd.status || 'Active',
      sections: gd.sections ? (typeof gd.sections === 'string' ? JSON.parse(gd.sections) : gd.sections) : []
    }));

    dbCache[queryTenantId] = data;
    return data;
  } catch (err) {
    console.error(`[SQL Preload ERROR] Failed to load SQL tenant ${tenantId}:`, err);
    return null;
  }
};

const activeLoads = {};
export const lastCheckTimes = {};

// Express middleware to ensure SQL cache is loaded on incoming requests
export const ensureTenantSqlLoaded = async (req, res, next) => {
  if (sqlInitPromise) {
    try {
      await sqlInitPromise;
    } catch (err) {
      console.error('[SQL Init Wait Error]', err);
    }
  }

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
  
  const now = Date.now();
  const cachedData = dbCache[activeTenant];
  const lastCheck = lastCheckTimes[activeTenant];
  const hasValidCache = cachedData && lastCheck && (now - lastCheck < 2000);
  const hasValidPlatform = dbCache['platform'] && lastCheckTimes['platform'] && (now - lastCheckTimes['platform'] < 2000);

  if (hasValidCache && (activeTenant === 'platform' || hasValidPlatform)) {
    return next();
  }

  try {
    // 1. Validate both platform schools and active tenant context in parallel
    const promises = [
      sqlDb.query('SELECT id, name, code, subdomain, logo, principalName, email, phone, address, city, state, country, academicSession, subscriptionPlan, url, status, adminName, adminEmail, adminUsername, adminPassword, createdAt FROM schools')
    ];
    if (activeTenant !== 'platform') {
      promises.push(sqlDb.query('SELECT updatedAt FROM schools WHERE subdomain = ?', [activeTenant]));
    }
    const [schoolRows, tenantRows] = await Promise.all(promises);

    lastCheckTimes['platform'] = now;
    if (activeTenant !== 'platform') {
      lastCheckTimes[activeTenant] = now;
    }

    const platformSignature = schoolRows.map(s => `${s.id}-${s.name || ''}-${s.code || ''}-${s.subdomain || ''}-${s.logo || ''}-${s.principalName || ''}-${s.email || ''}-${s.phone || ''}-${s.address || ''}-${s.city || ''}-${s.state || ''}-${s.country || ''}-${s.academicSession || ''}-${s.subscriptionPlan || ''}-${s.url || ''}-${s.status || ''}-${s.adminName || ''}-${s.adminEmail || ''}-${s.adminUsername || ''}-${s.adminPassword || ''}-${s.createdAt || ''}`).join('|');
    
    // Check if platform cache needs invalidation
    if (!dbCache['platform'] || dbCache['platform']._signature !== platformSignature) {
      if (activeLoads['platform']) {
        await activeLoads['platform'];
      } else {
        console.log(`[SQL Cache] Invalidating platform cache (Local: ${dbCache['platform']?._signature || 'None'} != SQL: ${platformSignature})`);
        activeLoads['platform'] = (async () => {
          const data = await loadTenantSqlIntoMemory('platform');
          if (data) {
            data._signature = platformSignature;
            dbCache['platform'] = data;
          }
        })();
        try {
          await activeLoads['platform'];
        } finally {
          delete activeLoads['platform'];
        }
      }
    }

    // 2. Validate and load tenant cache if we are inside a tenant context
    if (activeTenant !== 'platform') {
      const dbUpdatedAt = tenantRows[0]?.updatedAt || '';
      
      const dbUpdatedAtStr = dbUpdatedAt instanceof Date ? dbUpdatedAt.toISOString() : (dbUpdatedAt || '');
      const localUpdatedAtStr = (dbCache[activeTenant] && dbCache[activeTenant]._updatedAt)
        ? (dbCache[activeTenant]._updatedAt instanceof Date ? dbCache[activeTenant]._updatedAt.toISOString() : dbCache[activeTenant]._updatedAt)
        : '';

      if (!dbCache[activeTenant] || localUpdatedAtStr !== dbUpdatedAtStr) {
        if (activeLoads[activeTenant]) {
          await activeLoads[activeTenant];
        } else {
          console.log(`[SQL Cache] Invalidating cache for tenant: ${activeTenant} (Local: ${localUpdatedAtStr} != SQL: ${dbUpdatedAtStr})`);
          activeLoads[activeTenant] = (async () => {
            const data = await loadTenantSqlIntoMemory(activeTenant);
            if (data) {
              data._updatedAt = dbUpdatedAt;
              dbCache[activeTenant] = data;
            }
          })();
          try {
            await activeLoads[activeTenant];
          } finally {
            delete activeLoads[activeTenant];
          }
        }
      }
    }
  } catch (err) {
    console.error('[SQL Cache Validation Error]', err.message);
    const isConnectionError = ['ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'lost', 'handshake'].some(
      term => err.message.toUpperCase().includes(term)
    );
    if (isConnectionError) {
      console.warn('[SQL Cache] SQL connection lost or timed out. Gracefully disabling SQL mode and falling back to JSON.');
      isSqlInitialized = false;
    }
  }
  next();
};

// Queue to serialize SQL sync operations per tenant to prevent concurrent write race conditions
const sqlSyncQueues = {};

// Helpers to perform bulk insertions/updates in single queries
const bulkInsertOrUpdate = async (tableName, columns, valueRows, updateColumns) => {
  if (!valueRows || valueRows.length === 0) return;
  const chunkSize = 100;
  for (let i = 0; i < valueRows.length; i += chunkSize) {
    const chunk = valueRows.slice(i, i + chunkSize);
    const valuePlaceholders = chunk.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const sql = `INSERT INTO \`${tableName}\` (${columns.map(col => `\`${col}\``).join(', ')}) VALUES ${valuePlaceholders} ON DUPLICATE KEY UPDATE ${updateColumns.map(col => `\`${col}\`=VALUES(\`${col}\`)`).join(', ')}`;
    const params = chunk.flat();
    await sqlDb.query(sql, params);
  }
};

const bulkInsertOnly = async (tableName, columns, valueRows) => {
  if (!valueRows || valueRows.length === 0) return;
  const chunkSize = 100;
  for (let i = 0; i < valueRows.length; i += chunkSize) {
    const chunk = valueRows.slice(i, i + chunkSize);
    const valuePlaceholders = chunk.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const sql = `INSERT INTO \`${tableName}\` (${columns.map(col => `\`${col}\``).join(', ')}) VALUES ${valuePlaceholders}`;
    const params = chunk.flat();
    await sqlDb.query(sql, params);
  }
};

// Asynchronous write dispatcher to MySQL
export const saveMemoryDbToSql = async (tenantId, db, previousDb) => {
  const tId = tenantId || 'platform';
  if (!isSqlActive()) return;

  if (!sqlSyncQueues[tId]) {
    sqlSyncQueues[tId] = Promise.resolve();
  }

  const syncPromise = sqlSyncQueues[tId].then(async () => {
    try {
      const hasTableChanged = (key) => {
        if (!previousDb) return true;
        if (!db[key] && !previousDb[key]) return false;
        if (!db[key] || !previousDb[key]) return true;
        return JSON.stringify(db[key]) !== JSON.stringify(previousDb[key]);
      };

      console.log(`[SQL Sync] Initiating async MySQL database update for tenant: ${tId}`);

      const tasks = [];

      // 1. Sync global platforms
      if (tId === 'platform' && db.schools && Array.isArray(db.schools) && hasTableChanged('schools')) {
        tasks.push((async () => {
          const activeSchoolIds = db.schools.map(s => s.id).filter(Boolean);
          let deletedSubdomains = [];
          if (activeSchoolIds.length > 0) {
            const rows = await sqlDb.query(`SELECT subdomain FROM schools WHERE id NOT IN (${activeSchoolIds.map(() => '?').join(',')})`, activeSchoolIds);
            deletedSubdomains = (rows || []).map(r => r.subdomain);
            await sqlDb.query(`DELETE FROM schools WHERE id NOT IN (${activeSchoolIds.map(() => '?').join(',')})`, activeSchoolIds);
          } else {
            const rows = await sqlDb.query(`SELECT subdomain FROM schools`);
            deletedSubdomains = (rows || []).map(r => r.subdomain);
            await sqlDb.query('DELETE FROM schools');
          }

          if (deletedSubdomains.length > 0) {
            const tenantTables = [
              'employees', 'staff', 'students', 'invoices', 'fees', 'expenses', 'payroll',
              'staff_payments', 'activities', 'exams', 'exam_timetables', 'notices',
              'holidays', 'events', 'results', 'overall_results', 'subjects', 'timeslots',
              'fee_structures', 'salary_structures', 'staff_salary_structures', 'income',
              'attendance', 'roles', 'user_access', 'audit_logs', 'employee_qr_codes',
              'attendance_records', 'attendance_logs', 'attendance_reports'
            ];
            await Promise.all(deletedSubdomains.flatMap(sub => 
              tenantTables.map(tbl => 
                sqlDb.query(`DELETE FROM \`${tbl}\` WHERE tenantId = ?`, [sub]).catch(() => {})
              )
            ));
            deletedSubdomains.forEach(sub => {
              delete dbCache[sub];
            });
          }

          const columns = [
            'id', 'name', 'code', 'subdomain', 'logo', 'principalName', 'email', 'phone', 'address', 'city', 'state', 'country', 
            'academicSession', 'subscriptionPlan', 'url', 'status', 'adminName', 'adminEmail', 'adminUsername', 'adminPassword', 
            'createdAt', 'updatedAt'
          ];
          const updateColumns = [
            'name', 'logo', 'principalName', 'email', 'phone', 'address', 'city', 'state',
            'academicSession', 'subscriptionPlan', 'status', 'adminName', 'adminEmail',
            'adminUsername', 'adminPassword', 'updatedAt'
          ];
          const valueRows = db.schools.map(s => [
            s.id, s.name, s.code, s.subdomain, s.logo, s.principalName || s.principal || '', s.email, 
            s.phone, s.address, s.city, s.state, s.country || 'India', s.academicSession || '2026-2027', 
            s.subscriptionPlan || 'Starter', s.url, s.status || 'Active', s.adminName || '', s.adminEmail || '', 
            s.adminUsername || '', s.adminPassword || '', 
            s.createdAt, s.updatedAt || s.createdAt || new Date().toISOString()
          ]);
          await bulkInsertOrUpdate('schools', columns, valueRows, updateColumns);
        })());
      }

      // 2. Sync school details
      if (tId !== 'platform' && db.school && hasTableChanged('school')) {
        const sch = db.school;
        tasks.push(sqlDb.query(
          `UPDATE schools SET 
            name = ?, address = ?, city = ?, state = ?, phone = ?, email = ?, 
            principalName = ?, adminName = ?, adminEmail = ?, adminUsername = ?, adminPassword = ?, ratePerStudent = ?, updatedAt = ?
           WHERE subdomain = ?`,
          [
            sch.name, sch.address, sch.city, sch.state, sch.phone, sch.email, 
            sch.principal, sch.adminName, sch.adminEmail, sch.adminUsername || '', sch.adminPassword, sch.ratePerStudent || '250.00',
            sch.updatedAt || new Date().toISOString(), tId
          ]
        ));
      }

      // 3. Sync Teachers
      if (db.teachers && Array.isArray(db.teachers) && hasTableChanged('teachers')) {
        tasks.push((async () => {
          const activeTeacherIds = db.teachers.map(t => t.id).filter(Boolean);
          if (activeTeacherIds.length > 0) {
            await sqlDb.query(`DELETE FROM staff WHERE tenantId = ? AND id NOT IN (${activeTeacherIds.map(() => '?').join(',')})`, [tId, ...activeTeacherIds]);
          } else {
            await sqlDb.query('DELETE FROM staff WHERE tenantId = ?', [tId]);
          }

          const columns = [
            'id', 'name', 'email', 'phone', 'username', 'password', 'gender', 'qualification', 'experience', 'dateOfJoining', 
            'salaryGrade', 'address', 'city', 'state', 'pincode', 'emergencyContact', 'emergencyPhone', 'photo', 'aadharFile', 
            'certificateFile', 'status', 'avatarBg', 'tenantId',
            'firstName', 'middleName', 'lastName', 'fullName', 'dob', 'bloodGroup', 'nationality', 'maritalStatus',
            'aadhaarNumber', 'panNumber', 'joiningDate', 'employmentType', 'designation', 'department', 'primarySubject',
            'secondarySubject', 'alternateMobile', 'currentAddress', 'currentCity', 'currentState', 'currentCountry',
            'currentPostalCode', 'permanentAddress', 'permanentCity', 'permanentState', 'permanentCountry',
            'permanentPostalCode', 'sameAsPermanent', 'panFile', 'resumeFile', 'joiningLetterFile', 'otherFile', 'experiences'
          ];
          const updateColumns = [
            'name', 'email', 'phone', 'username', 'password', 'status', 'address', 'qualification', 'experience',
            'firstName', 'middleName', 'lastName', 'fullName', 'dob', 'bloodGroup', 'nationality', 'maritalStatus',
            'aadhaarNumber', 'panNumber', 'joiningDate', 'employmentType', 'designation', 'department', 'primarySubject',
            'secondarySubject', 'alternateMobile', 'currentAddress', 'currentCity', 'currentState', 'currentCountry',
            'currentPostalCode', 'permanentAddress', 'permanentCity', 'permanentState', 'permanentCountry',
            'permanentPostalCode', 'sameAsPermanent', 'panFile', 'resumeFile', 'joiningLetterFile', 'otherFile', 'experiences'
          ];
          const valueRows = db.teachers.map(t => [
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
          ]);
          await bulkInsertOrUpdate('staff', columns, valueRows, updateColumns);
        })());
      }

      // 4. Sync Staff
      if (db.staff && Array.isArray(db.staff) && hasTableChanged('staff')) {
        tasks.push((async () => {
          const activeStaffIds = db.staff.map(s => s.id).filter(Boolean);
          if (activeStaffIds.length > 0) {
            await sqlDb.query(`DELETE FROM employees WHERE tenantId = ? AND id NOT IN (${activeStaffIds.map(() => '?').join(',')})`, [tId, ...activeStaffIds]);
          } else {
            await sqlDb.query('DELETE FROM employees WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'name', 'fullName', 'role', 'department', 'email', 'phone', 'gender', 'qualification', 'experience', 'dateOfJoining', 'salaryGrade', 'reportingTo', 'address', 'city', 'state', 'pincode', 'emergencyContact', 'emergencyPhone', 'photo', 'aadharFile', 'certificateFile', 'status', 'avatarBg', 'password', 'tenantId', 'designation', 'designationLevel', 'employmentType'];
          const updateColumns = ['name', 'role', 'department', 'email', 'phone', 'status', 'password', 'designation', 'designationLevel', 'employmentType'];
          const valueRows = db.staff.filter(s => s.id).map(s => [
            s.id, s.name, s.fullName, s.role, s.department, s.email, s.phone, s.gender, s.qualification, 
            s.experience, s.dateOfJoining, s.salaryGrade, s.reportingTo, s.address, s.city, s.state, s.pincode, 
            s.emergencyContact, s.emergencyPhone, s.photo, s.aadharFile, s.certificateFile, s.status || 'Active', 
            s.avatarBg, s.password, tId, s.designation || '', s.designationLevel || '', s.employmentType || ''
          ].map(v => v === undefined ? null : v));
          await bulkInsertOrUpdate('employees', columns, valueRows, updateColumns);
        })());
      }

      // 5. Sync Students & Sub-Tables (Students first, then child tables concurrently)
      if (db.students && Array.isArray(db.students) && hasTableChanged('students')) {
        tasks.push((async () => {
          const activeStudentIds = db.students.map(s => s.id).filter(Boolean);
          if (activeStudentIds.length > 0) {
            await sqlDb.query(`DELETE FROM students WHERE tenantId = ? AND id NOT IN (${activeStudentIds.map(() => '?').join(',')})`, [tId, ...activeStudentIds]);
          } else {
            await sqlDb.query('DELETE FROM students WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'firstName', 'middleName', 'lastName', 'name', 'fullName', 'admissionNumber', 'admissionDate', 'dob', 'gender', 'bloodGroup', 'nationality', 'category', 'religion', 'aadhaarNumber', 'photo', 'status', 'photoBg', 'email', 'phone', 'feeStatus', 'rank', 'createdAt', 'updatedAt', 'tenantId', 'transportRequired', 'hostelRequired'];
          const updateColumns = ['name', 'fullName', 'photo', 'status', 'email', 'phone', 'feeStatus', 'updatedAt', 'transportRequired', 'hostelRequired'];
          const valueRows = db.students.filter(s => s.id).map(s => [
            s.id, s.firstName || s.fullName.split(' ')[0], s.middleName || '', s.lastName || s.fullName.split(' ').slice(1).join(' '),
            s.fullName || s.name, s.fullName || s.name, s.admissionNumber || `ADM-${Date.now().toString().slice(-6)}`,
            s.admissionDate || new Date().toISOString().split('T')[0], s.dob, s.gender, s.bloodGroup, 
            s.nationality || 'Indian', s.category || 'General', s.religion || 'Hinduism', s.aadhaarNumber, s.photo, 
            s.status || 'Active', s.photoBg, s.email, s.phone, s.feeStatus || 'Pending', s.rank || 'N/A', 
            s.createdAt || new Date().toISOString(), s.updatedAt || new Date().toISOString(), tId,
            s.transportRequired || 'No', s.hostelRequired || 'No'
          ]);
          await bulkInsertOrUpdate('students', columns, valueRows, updateColumns);

          // Sub-Tables Sync in Parallel (respecting FK constraints after students are written)
          const childTasks = [];

          // Enrollments
          const enrColumns = ['id', 'studentId', 'academicYear', 'admissionType', 'studentClass', 'section', 'rollNumber', 'previousSchoolName', 'previousSchoolAddress', 'previousClassStudied', 'transferCertificateNumber', 'status', 'createdAt', 'updatedAt', 'tenantId'];
          const enrUpdateColumns = ['academicYear', 'studentClass', 'section', 'rollNumber', 'previousSchoolName', 'status', 'updatedAt'];
          const enrRows = db.students.filter(s => s.id).map(s => [
            s.enrollmentId || `ENR-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.academicYear || '2026-2027', 
            s.admissionType || 'New Admission', s.studentClass || 'I', s.section || '', s.rollNumber || s.roll || '', 
            s.previousSchoolName || s.previousSchool || '', s.previousSchoolAddress || '', s.previousClassStudied || '', 
            s.transferCertificateNumber || '', s.status || 'Active', new Date().toISOString(), new Date().toISOString(), tId
          ]);
          childTasks.push(bulkInsertOrUpdate('student_enrollments', enrColumns, enrRows, enrUpdateColumns));

          // Parents
          const parColumns = ['id', 'studentId', 'fatherName', 'fatherOccupation', 'fatherMobile', 'fatherEmail', 'motherName', 'motherOccupation', 'motherMobile', 'motherEmail', 'guardianName', 'guardianRelation', 'guardianContact', 'parentUsername', 'parentPassword', 'createdAt', 'updatedAt', 'tenantId'];
          const parUpdateColumns = ['fatherName', 'fatherOccupation', 'fatherMobile', 'fatherEmail', 'motherName', 'motherOccupation', 'motherMobile', 'motherEmail', 'guardianName', 'guardianRelation', 'guardianContact', 'parentUsername', 'parentPassword', 'updatedAt'];
          const parRows = db.students.filter(s => s.id).map(s => [
            s.parentId || `PAR-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.fatherName || '', s.fatherOccupation || '', s.fatherMobile || '', 
            s.fatherEmail || '', s.motherName || '', s.motherOccupation || '', s.motherMobile || '', s.motherEmail || '', s.guardianName || s.guardian || '', 
            s.guardianRelation || '', s.guardianContact || '', s.parentUsername || `parent_${s.admissionNumber}`, s.parentPassword || 'parent123', 
            new Date().toISOString(), new Date().toISOString(), tId
          ]);
          childTasks.push(bulkInsertOrUpdate('parents', parColumns, parRows, parUpdateColumns));

          // Addresses
          const addrColumns = ['id', 'studentId', 'currentAddress', 'permanentAddress', 'city', 'state', 'country', 'postalCode', 'emergencyContactNumber', 'isSameAddress', 'createdAt', 'updatedAt', 'tenantId'];
          const addrUpdateColumns = ['currentAddress', 'permanentAddress', 'city', 'state', 'postalCode', 'emergencyContactNumber', 'isSameAddress', 'updatedAt'];
          const addrRows = db.students.filter(s => s.id).map(s => [
            s.addressId || `ADD-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.currentAddress || s.address || '', s.permanentAddress || s.address || '', 
            s.city || '', s.state || '', s.country || 'India', s.postalCode || s.pincode || '', s.emergencyContactNumber || s.phone || '', s.isSameAddress !== undefined ? s.isSameAddress : true, 
            new Date().toISOString(), new Date().toISOString(), tId
          ]);
          childTasks.push(bulkInsertOrUpdate('addresses', addrColumns, addrRows, addrUpdateColumns));

          // Medical Records
          const medColumns = ['id', 'studentId', 'bloodGroup', 'medicalConditions', 'allergies', 'disabilities', 'emergencyNotes', 'doctorName', 'doctorContact', 'createdAt', 'updatedAt', 'tenantId'];
          const medUpdateColumns = ['bloodGroup', 'medicalConditions', 'allergies', 'disabilities', 'emergencyNotes', 'doctorName', 'doctorContact', 'updatedAt'];
          const medRows = db.students.filter(s => s.id).map(s => [
            s.medicalId || `MED-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.bloodGroup || '', s.medicalConditions || '', s.allergies || '', s.disabilities || '', s.emergencyNotes || '', s.doctorName || '', s.doctorContact || '', 
            new Date().toISOString(), new Date().toISOString(), tId
          ]);
          childTasks.push(bulkInsertOrUpdate('medical_records', medColumns, medRows, medUpdateColumns));

          // Documents (Delete & Re-insert)
          if (activeStudentIds.length > 0) {
            childTasks.push((async () => {
              await sqlDb.query('DELETE FROM documents WHERE tenantId = ? AND studentId IN (' + activeStudentIds.map(() => '?').join(',') + ')', [tId, ...activeStudentIds]);
              const docColumns = ['id', 'studentId', 'documentType', 'fileName', 'filePath', 'fileSize', 'uploadedAt', 'tenantId'];
              const docRows = [];
              for (const s of db.students) {
                if (!s.id) continue;
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
                    docRows.push([
                      `DOC-${Math.floor(100000 + Math.random() * 900000)}`, s.id, df.type, df.path.split('/').pop(), df.path, 0, new Date().toISOString(), tId
                    ]);
                  }
                }
              }
              await bulkInsertOnly('documents', docColumns, docRows);
            })());
          }

          // Fee Assignments
          const feeAsnColumns = ['id', 'studentId', 'feeStructure', 'scholarshipDetails', 'discountType', 'discountAmount', 'initialPaymentStatus', 'assignedAt', 'tenantId'];
          const feeAsnUpdateColumns = ['feeStructure', 'scholarshipDetails', 'discountType', 'discountAmount', 'initialPaymentStatus'];
          const feeAsnRows = db.students.filter(s => s.id).map(s => [
            s.feeAssignmentId || `FEE-ASN-${Math.floor(100000 + Math.random() * 900000)}`, s.id, s.feeStructure || '', s.scholarshipDetails || '', s.discountType || '', 
            parseFloat(s.discountAmount || 0), s.feeStatus || s.initialPaymentStatus || 'Pending', new Date().toISOString(), tId
          ]);
          childTasks.push(bulkInsertOrUpdate('fee_assignments', feeAsnColumns, feeAsnRows, feeAsnUpdateColumns));

          // Logins
          const loginSColumns = ['id', 'studentId', 'studentUsername', 'studentPassword', 'createdAt', 'tenantId'];
          const loginSUpdateColumns = ['studentPassword'];
          const loginSRows = db.students.filter(s => s.id).map(s => [
            `ACT-S-${s.id}`, s.id, s.studentUsername || s.admissionNumber, s.studentPassword || `stu@${s.fullName.split(' ')[0].toLowerCase()}`, new Date().toISOString(), tId
          ]);
          childTasks.push(bulkInsertOrUpdate('student_accounts', loginSColumns, loginSRows, loginSUpdateColumns));

          const loginPColumns = ['id', 'studentId', 'parentUsername', 'parentPassword', 'createdAt', 'tenantId'];
          const loginPUpdateColumns = ['parentPassword'];
          const loginPRows = db.students.filter(s => s.id).map(s => [
            `ACT-P-${s.id}`, s.id, s.parentUsername || `parent_${s.admissionNumber}`, s.parentPassword || 'parent123', new Date().toISOString(), tId
          ]);
          childTasks.push(bulkInsertOrUpdate('parent_accounts', loginPColumns, loginPRows, loginPUpdateColumns));

          await Promise.all(childTasks);
        })());
      }

      // 6. Sync Timetables
      if (db.timetables && Array.isArray(db.timetables) && hasTableChanged('timetables')) {
        tasks.push((async () => {
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

          const columns = ['cohort', 'time', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'tenantId'];
          const valueRows = Object.keys(weekRows).map(key => {
            const row = weekRows[key];
            return [
              row.cohort,
              row.time,
              row.mon ? JSON.stringify(row.mon) : null,
              row.tue ? JSON.stringify(row.tue) : null,
              row.wed ? JSON.stringify(row.wed) : null,
              row.thu ? JSON.stringify(row.thu) : null,
              row.fri ? JSON.stringify(row.fri) : null,
              row.sat ? JSON.stringify(row.sat) : null,
              tId
            ];
          });
          await bulkInsertOnly('timetables', columns, valueRows);
        })());
      }

      // 7. Sync Invoices
      if (db.invoices && Array.isArray(db.invoices) && hasTableChanged('invoices')) {
        tasks.push((async () => {
          const activeInvNos = db.invoices.map(i => i.invoiceNo).filter(Boolean);
          if (activeInvNos.length > 0) {
            await sqlDb.query(`DELETE FROM invoices WHERE tenantId = ? AND invoiceNo NOT IN (${activeInvNos.map(() => '?').join(',')})`, [tId, ...activeInvNos]);
          } else {
            await sqlDb.query('DELETE FROM invoices WHERE tenantId = ?', [tId]);
          }

          const columns = ['invoiceNo', 'name', 'grade', 'amount', 'date', 'status', 'method', 'tenantId'];
          const updateColumns = ['status', 'method'];
          const valueRows = db.invoices.filter(inv => inv.invoiceNo).map(inv => [
            inv.invoiceNo, inv.name || '', inv.grade || '', inv.amount || '', inv.date || '', inv.status || 'Pending', inv.method || 'N/A', tId
          ]);
          await bulkInsertOrUpdate('invoices', columns, valueRows, updateColumns);
        })());
      }

      // 8. Sync Fees
      if (db.fees && Array.isArray(db.fees) && hasTableChanged('fees')) {
        tasks.push((async () => {
          const activeFeeIds = db.fees.map(f => f.id || f.feeId).filter(Boolean);
          if (activeFeeIds.length > 0) {
            await sqlDb.query(`DELETE FROM fees WHERE tenantId = ? AND id NOT IN (${activeFeeIds.map(() => '?').join(',')})`, [tId, ...activeFeeIds]);
          } else {
            await sqlDb.query('DELETE FROM fees WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'studentId', 'studentName', 'classId', 'sectionId', 'feeType', 'totalAmount', 'paidAmount', 'dueAmount', 'status', 'paymentDate', 'paymentMethod', 'remarks', 'createdAt', 'tenantId', 'receiptNumber', 'transactionId', 'discount', 'fine', 'amount', 'studentClass', 'section', 'paymentStatus', 'billingPeriod'];
          const updateColumns = ['paidAmount', 'dueAmount', 'status', 'paymentDate', 'paymentMethod', 'receiptNumber', 'transactionId', 'discount', 'fine', 'amount', 'studentClass', 'section', 'paymentStatus', 'billingPeriod'];
          const valueRows = db.fees.filter(f => f.id || f.feeId).map(f => {
            const id = f.id || f.feeId;
            const classId = f.classId || f.studentClass || '';
            const sectionId = f.sectionId || f.section || '';
            const status = f.status || f.paymentStatus || 'Pending';
            return [
              id, f.studentId || '', f.studentName || '', classId, sectionId, f.feeType || '', parseFloat(f.totalAmount || 0), parseFloat(f.paidAmount || 0), parseFloat(f.dueAmount || 0), status, f.paymentDate || '', f.paymentMethod || '', f.remarks || '', f.createdAt || '', tId,
              f.receiptNumber || '', f.transactionId || '', parseFloat(f.discount || 0), parseFloat(f.fine || 0), parseFloat(f.amount || 0), f.studentClass || '', f.section || '', f.paymentStatus || status, f.billingPeriod || 'Yearly'
            ];
          });
          await bulkInsertOrUpdate('fees', columns, valueRows, updateColumns);
        })());
      }

      // 9. Sync Expenses
      if (db.expenses && Array.isArray(db.expenses) && hasTableChanged('expenses')) {
        tasks.push((async () => {
          const activeExpIds = db.expenses.map(e => e.id).filter(Boolean);
          if (activeExpIds.length > 0) {
            await sqlDb.query(`DELETE FROM expenses WHERE tenantId = ? AND id NOT IN (${activeExpIds.map(() => '?').join(',')})`, [tId, ...activeExpIds]);
          } else {
            await sqlDb.query('DELETE FROM expenses WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'category', 'subcategory', 'amount', 'date', 'description', 'status', 'paidTo', 'paymentMethod', 'attachment', 'createdAt', 'tenantId', 'grade', 'department', 'expenseType'];
          const updateColumns = ['amount', 'status', 'subcategory', 'grade', 'department', 'expenseType'];
          const valueRows = db.expenses.filter(e => e.id).map(e => [
            e.id, e.category || '', e.subcategory || '', parseFloat(e.amount || 0), e.date || '', e.description || '', e.status || 'Approved', e.paidTo || '', e.paymentMethod || '', e.attachment || '', e.createdAt || new Date().toISOString(), tId, e.grade || '', e.department || '', e.expenseType || ''
          ]);
          await bulkInsertOrUpdate('expenses', columns, valueRows, updateColumns);
        })());
      }

      // 10. Sync Payroll
      if (db.payroll && Array.isArray(db.payroll) && hasTableChanged('payroll')) {
        tasks.push((async () => {
          const activePayIds = db.payroll.map(p => p.id).filter(Boolean);
          if (activePayIds.length > 0) {
            await sqlDb.query(`DELETE FROM payroll WHERE tenantId = ? AND id NOT IN (${activePayIds.map(() => '?').join(',')})`, [tId, ...activePayIds]);
          } else {
            await sqlDb.query('DELETE FROM payroll WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'staffId', 'staffName', 'role', 'month', 'basicSalary', 'allowances', 'deductions', 'netSalary', 'paymentStatus', 'paymentDate', 'paymentMethod', 'createdAt', 'tenantId'];
          const updateColumns = ['paymentStatus', 'paymentDate', 'paymentMethod'];
          const valueRows = db.payroll.filter(p => p.id).map(p => [
            p.id, p.staffId || '', p.staffName || '', p.role || '', p.month || '', parseFloat(p.basicSalary || 0), parseFloat(p.allowances || 0), parseFloat(p.deductions || 0), parseFloat(p.netSalary || 0), p.paymentStatus || 'Pending', p.paymentDate || '', p.paymentMethod || '', p.createdAt || new Date().toISOString(), tId
          ]);
          await bulkInsertOrUpdate('payroll', columns, valueRows, updateColumns);
        })());
      }

      // 11. Sync Staff Payments
      if (db.staffPayments && Array.isArray(db.staffPayments) && hasTableChanged('staffPayments')) {
        tasks.push((async () => {
          const activeSpIds = db.staffPayments.map(sp => sp.id || sp.paymentId).filter(Boolean);
          if (activeSpIds.length > 0) {
            await sqlDb.query(`DELETE FROM staff_payments WHERE tenantId = ? AND id NOT IN (${activeSpIds.map(() => '?').join(',')})`, [tId, ...activeSpIds]);
          } else {
            await sqlDb.query('DELETE FROM staff_payments WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'staffId', 'amount', 'paymentDate', 'paymentMethod', 'status', 'remarks', 'tenantId', 'staffName', 'staffRole', 'basicSalary', 'allowances', 'bonus', 'deductions', 'pfDeduction', 'taxDeduction', 'netSalary'];
          const updateColumns = ['amount', 'status', 'staffName', 'staffRole', 'basicSalary', 'allowances', 'bonus', 'deductions', 'pfDeduction', 'taxDeduction', 'netSalary'];
          const valueRows = db.staffPayments.filter(sp => sp.id || sp.paymentId).map(sp => {
            const spId = sp.id || sp.paymentId;
            const netSal = sp.netSalary || sp.amount || 0;
            return [
              spId, sp.staffId || '', parseFloat(netSal), sp.paymentDate || '', sp.paymentMethod || '', 
              sp.status || sp.paymentStatus || 'Paid', sp.remarks || '', tId,
              sp.staffName || '', sp.staffRole || '',
              parseFloat(sp.basicSalary || 0), parseFloat(sp.allowances || 0), parseFloat(sp.bonus || 0),
              parseFloat(sp.deductions || 0), parseFloat(sp.pfDeduction || 0), parseFloat(sp.taxDeduction || 0),
              parseFloat(netSal)
            ];
          });
          await bulkInsertOrUpdate('staff_payments', columns, valueRows, updateColumns);
        })());
      }

      // 12. Sync Activities
      if (db.activities && Array.isArray(db.activities) && hasTableChanged('activities')) {
        tasks.push((async () => {
          const itemsToKeep = db.activities.slice(0, 50);
          const activeActIds = itemsToKeep.map(act => act.id).filter(Boolean);
          if (activeActIds.length > 0) {
            await sqlDb.query(`DELETE FROM activities WHERE tenantId = ? AND id NOT IN (${activeActIds.map(() => '?').join(',')})`, [tId, ...activeActIds]);
          } else {
            await sqlDb.query('DELETE FROM activities WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'type', 'title', 'description', 'time', 'timestamp', 'color', 'bg', 'tenantId'];
          const updateColumns = ['time'];
          const valueRows = itemsToKeep.filter(act => act.id).map(act => [
            act.id, act.type || '', act.title || '', act.desc || act.description || '', act.time || 'Just now', act.timestamp || '', act.color || '', act.bg || '', tId
          ]);
          await bulkInsertOrUpdate('activities', columns, valueRows, updateColumns);
        })());
      }

      // 13. Sync Exams
      if (db.exams && Array.isArray(db.exams) && hasTableChanged('exams')) {
        tasks.push((async () => {
          const activeExamIds = db.exams.map(ex => ex.id).filter(Boolean);
          if (activeExamIds.length > 0) {
            await sqlDb.query(`DELETE FROM exams WHERE tenantId = ? AND id NOT IN (${activeExamIds.map(() => '?').join(',')})`, [tId, ...activeExamIds]);
          } else {
            await sqlDb.query('DELETE FROM exams WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'name', 'term', 'startDate', 'endDate', 'status', 'tenantId', 'description', 'totalMarks', 'gradeSections', 'subjectIncluded', 'subjectMarks', 'createdAt', 'timetablePublished'];
          const updateColumns = ['name', 'term', 'status', 'startDate', 'endDate', 'description', 'totalMarks', 'gradeSections', 'subjectIncluded', 'subjectMarks', 'createdAt', 'timetablePublished'];
          const valueRows = db.exams.filter(ex => ex.id).map(ex => {
            const earliestStart = ex.startDate || (ex.gradeSections && ex.gradeSections.length > 0 
              ? ex.gradeSections.map(g => g.startDate).filter(Boolean).sort()[0] 
              : '') || '';
            const latestEnd = ex.endDate || (ex.gradeSections && ex.gradeSections.length > 0 
              ? ex.gradeSections.map(g => g.endDate).filter(Boolean).sort().reverse()[0] 
              : '') || '';
            return [
              ex.id, ex.examName || ex.name || '', ex.term || ex.examType || '', earliestStart, latestEnd, ex.status || 'Draft', tId,
              ex.description || '', ex.totalMarks || 100,
              ex.gradeSections ? JSON.stringify(ex.gradeSections) : '[]',
              ex.subjectIncluded ? JSON.stringify(ex.subjectIncluded) : '{}',
              ex.subjectMarks ? JSON.stringify(ex.subjectMarks) : '{}',
              ex.createdAt || new Date().toISOString(), ex.timetablePublished ? 1 : 0
            ];
          });
          await bulkInsertOrUpdate('exams', columns, valueRows, updateColumns);
        })());
      }

      // 13b. Sync Exam Timetables
      if (db.examTimetables && Array.isArray(db.examTimetables) && hasTableChanged('examTimetables')) {
        tasks.push((async () => {
          const activeEtIds = db.examTimetables.map(et => et.id).filter(Boolean);
          if (activeEtIds.length > 0) {
            await sqlDb.query(`DELETE FROM exam_timetables WHERE tenantId = ? AND id NOT IN (${activeEtIds.map(() => '?').join(',')})`, [tId, ...activeEtIds]);
          } else {
            await sqlDb.query('DELETE FROM exam_timetables WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'examId', 'examName', 'classId', 'subject', 'date', 'timeSlot', 'room', 'maxMarks', 'tenantId', 'startTime', 'endTime', 'duration', 'invigilator', 'cohort', 'grade', 'section', 'examDate'];
          const updateColumns = ['examId', 'examName', 'classId', 'subject', 'date', 'timeSlot', 'room', 'maxMarks', 'startTime', 'endTime', 'duration', 'invigilator', 'cohort', 'grade', 'section', 'examDate'];
          const valueRows = db.examTimetables.filter(et => et.id).map(et => [
            et.id, et.examId || '', et.examName || '', et.classId || et.cohort || '', et.subject || '', et.date || et.examDate || '',
            et.timeSlot || (et.startTime && et.endTime ? `${et.startTime} - ${et.endTime}` : et.duration || ''),
            et.room || et.roomAllocation || '', et.maxMarks || 100, tId,
            et.startTime || '', et.endTime || '', et.duration || '', et.invigilator || '', et.cohort || '', et.grade || '', et.section || '', et.examDate || ''
          ]);
          await bulkInsertOrUpdate('exam_timetables', columns, valueRows, updateColumns);
        })());
      }

      // 13c. Sync Results
      if (db.results && Array.isArray(db.results) && hasTableChanged('results')) {
        tasks.push((async () => {
          const activeResIds = db.results.map(r => r.id).filter(Boolean);
          if (activeResIds.length > 0) {
            await sqlDb.query(`DELETE FROM results WHERE tenantId = ? AND id NOT IN (${activeResIds.map(() => '?').join(',')})`, [tId, ...activeResIds]);
          } else {
            await sqlDb.query('DELETE FROM results WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'studentId', 'studentName', 'examId', 'examName', 'subject', 'marksObtained', 'maxMarks', 'grade', 'remarks', 'isLocked', 'isPublished', 'tenantId', 'term', 'percentage', 'gpa', 'rank', 'status'];
          const updateColumns = ['marksObtained', 'grade', 'isLocked', 'isPublished', 'status'];
          const valueRows = db.results.filter(r => r.id).map(r => {
            const marksObt = r.obtainedMarks !== undefined ? r.obtainedMarks : (r.marksObtained !== undefined ? r.marksObtained : 0);
            const maxM = r.totalMarks !== undefined ? r.totalMarks : (r.maxMarks !== undefined ? r.maxMarks : 100);
            const isL = r.locked !== undefined ? r.locked : (r.isLocked !== undefined ? r.isLocked : false);
            const isP = r.published !== undefined ? r.published : (r.isPublished !== undefined ? r.isPublished : false);
            return [
              r.id, r.studentId || '', r.studentName || '', r.examId || '', r.examName || '', r.subject || '', marksObt, maxM, r.grade || '', r.remarks || '', isL ? 1 : 0, isP ? 1 : 0, tId,
              r.term || '', r.percentage !== undefined ? r.percentage : 0, r.gpa !== undefined ? parseFloat(r.gpa) : 0.0, r.rank !== undefined ? String(r.rank) : '-', r.status || 'Draft'
            ];
          });
          await bulkInsertOrUpdate('results', columns, valueRows, updateColumns);
        })());
      }

      // 13d. Sync Overall Results
      if (db.overallResults && Array.isArray(db.overallResults) && hasTableChanged('overallResults')) {
        tasks.push((async () => {
          const activeOrIds = db.overallResults.map(o => o.id || `OR-${o.studentId}`).filter(Boolean);
          if (activeOrIds.length > 0) {
            await sqlDb.query(`DELETE FROM overall_results WHERE tenantId = ? AND id NOT IN (${activeOrIds.map(() => '?').join(',')})`, [tId, ...activeOrIds]);
          } else {
            await sqlDb.query('DELETE FROM overall_results WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'studentId', 'studentName', 'classId', 'sectionId', 'percentage', 'grade', 'status', 'tenantId', 'examId', 'cohort', 'totalObtained', 'totalMax', 'gpa', 'rank', 'subjectsCount', 'passStatus'];
          const updateColumns = ['percentage', 'grade', 'status'];
          const valueRows = db.overallResults.filter(o => o.studentId).map(o => {
            const studentId = o.studentId || '';
            const classId = o.classId || (o.cohort ? o.cohort.split('-')[0] : '');
            const sectionId = o.sectionId || (o.cohort ? o.cohort.split('-')[1] : '');
            const passStat = o.status || o.passStatus || '';
            return [
              o.id || `OR-${studentId}`, studentId, o.studentName || '', classId, sectionId, parseFloat(o.percentage || 0), o.grade || '', passStat, tId,
              o.examId || '', o.cohort || '', o.totalObtained !== undefined ? parseFloat(o.totalObtained) : 0, o.totalMax !== undefined ? parseFloat(o.totalMax) : 0,
              o.gpa !== undefined ? parseFloat(o.gpa) : 0.0, o.rank !== undefined ? String(o.rank) : '-', o.subjectsCount !== undefined ? parseInt(o.subjectsCount) : 0, passStat
            ];
          });
          await bulkInsertOrUpdate('overall_results', columns, valueRows, updateColumns);
        })());
      }

      // 14. Sync Notices
      if (db.notices && Array.isArray(db.notices) && hasTableChanged('notices')) {
        tasks.push((async () => {
          const activeNoticeIds = db.notices.map(n => n.id).filter(Boolean);
          if (activeNoticeIds.length > 0) {
            await sqlDb.query(`DELETE FROM notices WHERE tenantId = ? AND id NOT IN (${activeNoticeIds.map(() => '?').join(',')})`, [tId, ...activeNoticeIds]);
          } else {
            await sqlDb.query('DELETE FROM notices WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'title', 'content', 'date', 'audience', 'createdBy', 'tenantId'];
          const updateColumns = ['title', 'content', 'audience'];
          const valueRows = db.notices.filter(n => n.id).map(n => [
            n.id, n.title || '', n.content || '', n.date || '', n.audience || 'All', n.createdBy || '', tId
          ]);
          await bulkInsertOrUpdate('notices', columns, valueRows, updateColumns);
        })());
      }

      // 14b. Sync Holidays
      if (db.holidays && Array.isArray(db.holidays) && hasTableChanged('holidays')) {
        tasks.push((async () => {
          const activeHolidayIds = db.holidays.map(h => h.id).filter(Boolean);
          if (activeHolidayIds.length > 0) {
            await sqlDb.query(`DELETE FROM holidays WHERE tenantId = ? AND id NOT IN (${activeHolidayIds.map(() => '?').join(',')})`, [tId, ...activeHolidayIds]);
          } else {
            await sqlDb.query('DELETE FROM holidays WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'title', 'startDate', 'endDate', 'description', 'tenantId'];
          const updateColumns = ['title', 'startDate', 'endDate', 'description'];
          const valueRows = db.holidays.filter(h => h.id).map(h => [
            h.id, h.title || '', h.startDate || '', h.endDate || '', h.description || '', tId
          ]);
          await bulkInsertOrUpdate('holidays', columns, valueRows, updateColumns);
        })());
      }

      // 14c. Sync Events
      if (db.events && Array.isArray(db.events) && hasTableChanged('events')) {
        tasks.push((async () => {
          const activeEventIds = db.events.map(ev => ev.id).filter(Boolean);
          if (activeEventIds.length > 0) {
            await sqlDb.query(`DELETE FROM events WHERE tenantId = ? AND id NOT IN (${activeEventIds.map(() => '?').join(',')})`, [tId, ...activeEventIds]);
          } else {
            await sqlDb.query('DELETE FROM events WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'title', 'description', 'date', 'time', 'venue', 'audience', 'tenantId'];
          const updateColumns = ['title', 'description', 'date', 'time', 'venue', 'audience'];
          const valueRows = db.events.filter(ev => ev.id).map(ev => [
            ev.id, ev.title || '', ev.description || '', ev.date || '', ev.time || '', ev.venue || '', ev.audience || 'All', tId
          ]);
          await bulkInsertOrUpdate('events', columns, valueRows, updateColumns);
        })());
      }

      // 14d. Sync Subjects
      if (db.subjects && Array.isArray(db.subjects) && hasTableChanged('subjects')) {
        tasks.push((async () => {
          const activeSubjectIds = db.subjects.map(sub => sub.id).filter(Boolean);
          if (activeSubjectIds.length > 0) {
            await sqlDb.query(`DELETE FROM subjects WHERE tenantId = ? AND id NOT IN (${activeSubjectIds.map(() => '?').join(',')})`, [tId, ...activeSubjectIds]);
          } else {
            await sqlDb.query('DELETE FROM subjects WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'name', 'code', 'classId', 'teacherId', 'teacherName', 'tenantId'];
          const updateColumns = ['name', 'teacherId', 'teacherName'];
          const valueRows = db.subjects.filter(sub => sub.id).map(sub => [
            sub.id, sub.subjectName || sub.name || '', sub.code || '', sub.grade || sub.classId || '', sub.teacherId || '', sub.teacherName || '', tId
          ]);
          await bulkInsertOrUpdate('subjects', columns, valueRows, updateColumns);
        })());
      }

      // 15. Sync Timeslots
      if (db.timeslots && Array.isArray(db.timeslots) && hasTableChanged('timeslots')) {
        tasks.push((async () => {
          await sqlDb.query('DELETE FROM timeslots WHERE tenantId = ?', [tId]);
          const columns = ['slotTime', 'tenantId'];
          const valueRows = db.timeslots.map(slot => [slot, tId]);
          await bulkInsertOnly('timeslots', columns, valueRows);
        })());
      }

      // 16. Sync Fee Structures
      if (db.feeStructures && Array.isArray(db.feeStructures) && hasTableChanged('feeStructures')) {
        tasks.push((async () => {
          const activeFsIds = db.feeStructures.map(fsItem => fsItem.id || `FS-${fsItem.grade || fsItem.studentClass}`);
          if (activeFsIds.length > 0) {
            await sqlDb.query(`DELETE FROM fee_structures WHERE tenantId = ? AND id NOT IN (${activeFsIds.map(() => '?').join(',')})`, [tId, ...activeFsIds]);
          } else {
            await sqlDb.query('DELETE FROM fee_structures WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'classId', 'amount', 'frequency', 'tenantId', 'studentClass', 'admissionFee', 'tuitionFee', 'examFee', 'transportFee', 'hostelFee', 'libraryFee', 'otherCharges', 'totalFee', 'monthRange'];
          const updateColumns = ['amount', 'frequency', 'studentClass', 'admissionFee', 'tuitionFee', 'examFee', 'transportFee', 'hostelFee', 'libraryFee', 'otherCharges', 'totalFee', 'monthRange'];
          const valueRows = db.feeStructures.map(fsItem => {
            const classVal = fsItem.grade || fsItem.studentClass;
            const totalVal = parseFloat(fsItem.totalFee || fsItem.amount || 0);
            return [
              fsItem.id || `FS-${classVal}`, classVal, totalVal, fsItem.frequency || 'Yearly', tId,
              fsItem.studentClass || classVal,
              parseFloat(fsItem.admissionFee || 0), parseFloat(fsItem.tuitionFee || 0), parseFloat(fsItem.examFee || 0),
              parseFloat(fsItem.transportFee || 0), parseFloat(fsItem.hostelFee || 0), parseFloat(fsItem.libraryFee || 0),
              parseFloat(fsItem.otherCharges || 0), totalVal,
              fsItem.monthRange || null
            ];
          });
          await bulkInsertOrUpdate('fee_structures', columns, valueRows, updateColumns);
        })());
      }

      // 16a. Sync Fee Periods
      if (db.feePeriods && Array.isArray(db.feePeriods) && hasTableChanged('feePeriods')) {
        tasks.push((async () => {
          await sqlDb.query('DELETE FROM fee_periods WHERE tenantId = ?', [tId]);
          if (db.feePeriods.length > 0) {
            const columns = ['id', 'frequency', 'name', 'sortOrder', 'tenantId'];
            const valueRows = db.feePeriods.map(fp => [
              fp.id, fp.frequency, fp.name, fp.sortOrder || 0, tId
            ]);
            await bulkInsertOnly('fee_periods', columns, valueRows);
          }
        })());
      }

      // 16b. Sync Salary Structures
      if (db.salaryStructures && Array.isArray(db.salaryStructures) && hasTableChanged('salaryStructures')) {
        tasks.push((async () => {
          const activeSsIds = db.salaryStructures.map(ss => ss.id || `SS-${ss.gradeName || ss.designation}`);
          if (activeSsIds.length > 0) {
            await sqlDb.query(`DELETE FROM salary_structures WHERE tenantId = ? AND id NOT IN (${activeSsIds.map(() => '?').join(',')})`, [tId, ...activeSsIds]);
          } else {
            await sqlDb.query('DELETE FROM salary_structures WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'gradeName', 'basicSalary', 'allowances', 'deductions', 'tenantId', 'designation', 'pfDeduction', 'taxDeduction', 'netSalary'];
          const updateColumns = ['basicSalary', 'allowances', 'deductions', 'designation', 'pfDeduction', 'taxDeduction', 'netSalary'];
          const valueRows = db.salaryStructures.map(ss => {
            const gradeVal = ss.gradeName || ss.designation;
            const basicVal = parseFloat(ss.basicSalary || 0);
            const allowVal = parseFloat(ss.allowances || 0);
            const dedVal = parseFloat(ss.deductions || 0);
            const netVal = parseFloat(ss.netSalary || (basicVal + allowVal - dedVal));
            return [
              ss.id || `SS-${gradeVal}`, gradeVal, basicVal, allowVal, dedVal, tId,
              ss.designation || gradeVal,
              parseFloat(ss.pfDeduction || 0), parseFloat(ss.taxDeduction || 0), netVal
            ];
          });
          await bulkInsertOrUpdate('salary_structures', columns, valueRows, updateColumns);
        })());
      }

      // 16c. Sync Staff Salary Structures
      if (db.staffSalaryStructures && Array.isArray(db.staffSalaryStructures) && hasTableChanged('staffSalaryStructures')) {
        tasks.push((async () => {
          const activeSssIds = db.staffSalaryStructures.map(sss => sss.id || `SSS-${sss.position || sss.designation}`);
          if (activeSssIds.length > 0) {
            await sqlDb.query(`DELETE FROM staff_salary_structures WHERE tenantId = ? AND id NOT IN (${activeSssIds.map(() => '?').join(',')})`, [tId, ...activeSssIds]);
          } else {
            await sqlDb.query('DELETE FROM staff_salary_structures WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'position', 'basicSalary', 'allowances', 'deductions', 'tenantId', 'designation', 'bonus', 'pfDeduction', 'taxDeduction', 'netSalary', 'designationLevel', 'employmentType'];
          const updateColumns = ['basicSalary', 'allowances', 'deductions', 'designation', 'bonus', 'pfDeduction', 'taxDeduction', 'netSalary', 'designationLevel', 'employmentType'];
          const valueRows = db.staffSalaryStructures.map(sss => {
            const posVal = sss.position || sss.designation;
            const basicVal = parseFloat(sss.basicSalary || 0);
            const allowVal = parseFloat(sss.allowances || 0);
            const dedVal = parseFloat(sss.deductions || 0);
            const bonusVal = parseFloat(sss.bonus || 0);
            const netVal = parseFloat(sss.netSalary || (basicVal + allowVal + bonusVal - dedVal));
            return [
              sss.id || `SSS-${posVal}`, posVal, basicVal, allowVal, dedVal, tId,
              sss.designation || posVal,
              bonusVal, parseFloat(sss.pfDeduction || 0), parseFloat(sss.taxDeduction || 0), netVal,
              sss.designationLevel || '', sss.employmentType || ''
            ];
          });
          await bulkInsertOrUpdate('staff_salary_structures', columns, valueRows, updateColumns);
        })());
      }

      // 16d. Sync Income
      if (db.income && Array.isArray(db.income) && hasTableChanged('income')) {
        tasks.push((async () => {
          const activeIncIds = db.income.map(inc => inc.id);
          if (activeIncIds.length > 0) {
            await sqlDb.query(`DELETE FROM income WHERE tenantId = ? AND id NOT IN (${activeIncIds.map(() => '?').join(',')})`, [tId, ...activeIncIds]);
          } else {
            await sqlDb.query('DELETE FROM income WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'source', 'amount', 'date', 'description', 'tenantId'];
          const updateColumns = ['source', 'amount', 'date', 'description'];
          const valueRows = db.income.map(inc => [
            inc.id, inc.source, parseFloat(inc.amount || 0), inc.date || inc.paymentDate, inc.description || '', tId
          ]);
          await bulkInsertOrUpdate('income', columns, valueRows, updateColumns);
        })());
      }

      // 16e. Sync Attendance
      if (db.attendance && Array.isArray(db.attendance) && hasTableChanged('attendance')) {
        tasks.push((async () => {
          const activeAttIds = db.attendance.map(att => att.attendanceId);
          if (activeAttIds.length > 0) {
            await sqlDb.query(`DELETE FROM attendance WHERE tenantId = ? AND attendanceId NOT IN (${activeAttIds.map(() => '?').join(',')})`, [tId, ...activeAttIds]);
          } else {
            await sqlDb.query('DELETE FROM attendance WHERE tenantId = ?', [tId]);
          }

          const columns = ['attendanceId', 'studentId', 'classId', 'sectionId', 'attendanceDate', 'attendanceStatus', 'remarks', 'markedBy', 'createdAt', 'updatedAt', 'tenantId'];
          const updateColumns = ['attendanceStatus', 'remarks', 'updatedAt'];
          const valueRows = db.attendance.map(att => [
            att.attendanceId, att.studentId, att.classId, att.sectionId, att.attendanceDate, att.attendanceStatus, att.remarks || '', att.markedBy || '', att.createdAt, att.updatedAt, tId
          ]);
          await bulkInsertOrUpdate('attendance', columns, valueRows, updateColumns);
        })());
      }

      // 17. Sync Roles
      if (db.roles && Array.isArray(db.roles) && hasTableChanged('roles')) {
        tasks.push((async () => {
          const activeRoleIds = db.roles.map(r => r.id).filter(Boolean);
          if (activeRoleIds.length > 0) {
            await sqlDb.query(`DELETE FROM roles WHERE tenantId = ? AND id NOT IN (${activeRoleIds.map(() => '?').join(',')})`, [tId, ...activeRoleIds]);
          } else {
            await sqlDb.query('DELETE FROM roles WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'name', 'description', 'active', 'isSystem', 'permissions', 'createdAt', 'tenantId'];
          const updateColumns = ['name', 'description', 'active', 'permissions'];
          const valueRows = db.roles.filter(r => r.id).map(r => [
            r.id, r.name, r.description || '', r.active ? 1 : 0, r.isSystem ? 1 : 0,
            typeof r.permissions === 'object' ? JSON.stringify(r.permissions) : (r.permissions || '{}'),
            r.createdAt || new Date().toISOString(), tId
          ]);
          await bulkInsertOrUpdate('roles', columns, valueRows, updateColumns);
        })());
      }

      // 18. Sync User Access
      if (db.userAccess && Array.isArray(db.userAccess) && hasTableChanged('userAccess')) {
        tasks.push((async () => {
          const activeUaIds = db.userAccess.map(ua => ua.id).filter(Boolean);
          if (activeUaIds.length > 0) {
            await sqlDb.query(`DELETE FROM user_access WHERE tenantId = ? AND id NOT IN (${activeUaIds.map(() => '?').join(',')})`, [tId, ...activeUaIds]);
          } else {
            await sqlDb.query('DELETE FROM user_access WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'userId', 'userName', 'userType', 'roleId', 'status', 'overrides', 'updatedAt', 'tenantId'];
          const updateColumns = ['roleId', 'status', 'overrides', 'userName', 'updatedAt'];
          const valueRows = db.userAccess.filter(ua => ua.id).map(ua => [
            ua.id, ua.userId, ua.userName, ua.userType, ua.roleId || null, ua.status || 'Active',
            typeof ua.overrides === 'object' ? JSON.stringify(ua.overrides) : (ua.overrides || '{}'),
            ua.updatedAt || new Date().toISOString(), tId
          ]);
          await bulkInsertOrUpdate('user_access', columns, valueRows, updateColumns);
        })());
      }

      // 19. Sync Audit Logs
      if (db.auditLogs && Array.isArray(db.auditLogs) && hasTableChanged('auditLogs')) {
        tasks.push((async () => {
          const activeLogIds = db.auditLogs.map(l => l.id).filter(Boolean);
          if (activeLogIds.length > 0) {
            await sqlDb.query(`DELETE FROM audit_logs WHERE tenantId = ? AND id NOT IN (${activeLogIds.map(() => '?').join(',')})`, [tId, ...activeLogIds]);
          } else {
            await sqlDb.query('DELETE FROM audit_logs WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'userId', 'userName', 'userRole', 'action', 'details', 'ipAddress', 'timestamp', 'tenantId'];
          const updateColumns = ['action'];
          const valueRows = db.auditLogs.filter(l => l.id).map(l => [
            l.id, l.userId || null, l.userName || '', l.userRole || '', l.action, l.details || '', l.ipAddress || '', l.timestamp || new Date().toISOString(), tId
          ]);
          await bulkInsertOrUpdate('audit_logs', columns, valueRows, updateColumns);
        })());
      }

      // 20. Sync Employee QR Codes
      if (db.employeeQrCodes && Array.isArray(db.employeeQrCodes) && hasTableChanged('employeeQrCodes')) {
        tasks.push((async () => {
          const activeQrIds = db.employeeQrCodes.map(q => q.id).filter(Boolean);
          if (activeQrIds.length > 0) {
            await sqlDb.query(`DELETE FROM employee_qr_codes WHERE tenantId = ? AND id NOT IN (${activeQrIds.map(() => '?').join(',')})`, [tId, ...activeQrIds]);
          } else {
            await sqlDb.query('DELETE FROM employee_qr_codes WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'employeeId', 'employeeType', 'qrPath', 'createdAt', 'tenantId', 'teacherId', 'staffId'];
          const updateColumns = ['qrPath'];
          const valueRows = [];
          for (const q of db.employeeQrCodes) {
            if (!q.id) continue;
            if (q.employeeType === 'Teacher') {
              const teacherExists = db.teachers && db.teachers.some(t => t.id === q.employeeId || t.employeeId === q.employeeId);
              if (!teacherExists) continue;
            } else if (q.employeeType === 'Staff') {
              const staffExists = db.staff && db.staff.some(s => s.id === q.employeeId);
              if (!staffExists) continue;
            }
            valueRows.push([
              q.id, q.employeeId, q.employeeType, q.qrPath, q.createdAt || new Date().toISOString(), tId,
              q.employeeType === 'Teacher' ? q.employeeId : null,
              q.employeeType === 'Staff' ? q.employeeId : null
            ]);
          }
          await bulkInsertOrUpdate('employee_qr_codes', columns, valueRows, updateColumns);
        })());
      }

      // 21. Sync Attendance Records
      if (db.attendanceRecords && Array.isArray(db.attendanceRecords) && hasTableChanged('attendanceRecords')) {
        tasks.push((async () => {
          const activeAttIds = db.attendanceRecords.map(a => a.id).filter(Boolean);
          if (activeAttIds.length > 0) {
            await sqlDb.query(`DELETE FROM attendance_records WHERE tenantId = ? AND id NOT IN (${activeAttIds.map(() => '?').join(',')})`, [tId, ...activeAttIds]);
          } else {
            await sqlDb.query('DELETE FROM attendance_records WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'employeeId', 'employeeType', 'name', 'department', 'designation', 'date', 'checkIn', 'checkOut', 'workingHours', 'status', 'createdAt', 'tenantId', 'teacherId', 'staffId'];
          const updateColumns = ['checkIn', 'checkOut', 'workingHours', 'status'];
          const valueRows = [];
          for (const a of db.attendanceRecords) {
            if (!a.id) continue;
            if (a.employeeType === 'Teacher') {
              const teacherExists = db.teachers && db.teachers.some(t => t.id === a.employeeId || t.employeeId === a.employeeId);
              if (!teacherExists) continue;
            } else if (a.employeeType === 'Staff') {
              const staffExists = db.staff && db.staff.some(s => s.id === a.employeeId);
              if (!staffExists) continue;
            }
            valueRows.push([
              a.id, a.employeeId, a.employeeType, a.name, a.department || '', a.designation || '', a.date, a.checkIn || null, a.checkOut || null, parseFloat(a.workingHours || 0), a.status || 'Present', a.createdAt || new Date().toISOString(), tId,
              a.employeeType === 'Teacher' ? a.employeeId : null,
              a.employeeType === 'Staff' ? a.employeeId : null
            ]);
          }
          await bulkInsertOrUpdate('attendance_records', columns, valueRows, updateColumns);
        })());
      }

      // 22. Sync Attendance Logs
      if (db.attendanceLogs && Array.isArray(db.attendanceLogs) && hasTableChanged('attendanceLogs')) {
        tasks.push((async () => {
          const activeLogIds = db.attendanceLogs.map(l => l.id).filter(Boolean);
          if (activeLogIds.length > 0) {
            await sqlDb.query(`DELETE FROM attendance_logs WHERE tenantId = ? AND id NOT IN (${activeLogIds.map(() => '?').join(',')})`, [tId, ...activeLogIds]);
          } else {
            await sqlDb.query('DELETE FROM attendance_logs WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'employeeId', 'employeeType', 'scanTime', 'scanType', 'status', 'tenantId', 'teacherId', 'staffId'];
          const updateColumns = ['scanTime', 'scanType', 'status'];
          const valueRows = [];
          for (const l of db.attendanceLogs) {
            if (!l.id) continue;
            if (l.employeeType === 'Teacher') {
              const teacherExists = db.teachers && db.teachers.some(t => t.id === l.employeeId || t.employeeId === l.employeeId);
              if (!teacherExists) continue;
            } else if (l.employeeType === 'Staff') {
              const staffExists = db.staff && db.staff.some(s => s.id === l.employeeId);
              if (!staffExists) continue;
            }
            valueRows.push([
              l.id, l.employeeId, l.employeeType, l.scanTime, l.scanType, l.status, tId,
              l.employeeType === 'Teacher' ? l.employeeId : null,
              l.employeeType === 'Staff' ? l.employeeId : null
            ]);
          }
          await bulkInsertOrUpdate('attendance_logs', columns, valueRows, updateColumns);
        })());
      }

      // 23. Sync Attendance Reports
      if (db.attendanceReports && Array.isArray(db.attendanceReports) && hasTableChanged('attendanceReports')) {
        tasks.push((async () => {
          const activeRepIds = db.attendanceReports.map(r => r.id).filter(Boolean);
          if (activeRepIds.length > 0) {
            await sqlDb.query(`DELETE FROM attendance_reports WHERE tenantId = ? AND id NOT IN (${activeRepIds.map(() => '?').join(',')})`, [tId, ...activeRepIds]);
          } else {
            await sqlDb.query('DELETE FROM attendance_reports WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'reportName', 'reportType', 'generatedAt', 'filters', 'filePath', 'tenantId'];
          const updateColumns = ['reportName', 'filePath'];
          const valueRows = db.attendanceReports.filter(r => r.id).map(r => [
            r.id, r.reportName, r.reportType, r.generatedAt,
            typeof r.filters === 'object' ? JSON.stringify(r.filters) : (r.filters || '{}'),
            r.filePath, tId
          ]);
          await bulkInsertOrUpdate('attendance_reports', columns, valueRows, updateColumns);
        })());
      }

      // 24. Sync Academic Calendar Events
      if (db.academicCalendarEvents && Array.isArray(db.academicCalendarEvents) && hasTableChanged('academicCalendarEvents')) {
        tasks.push((async () => {
          const activeEventIds = db.academicCalendarEvents.map(e => e.id).filter(Boolean);
          if (activeEventIds.length > 0) {
            await sqlDb.query(`DELETE FROM academic_calendar_events WHERE tenantId = ? AND id NOT IN (${activeEventIds.map(() => '?').join(',')})`, [tId, ...activeEventIds]);
          } else {
            await sqlDb.query('DELETE FROM academic_calendar_events WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'eventDate', 'title', 'eventType', 'description', 'applicableClasses', 'startTime', 'endTime', 'session', 'color', 'audience', 'recurring', 'reminders', 'attachments', 'notifications', 'tenantId', 'createdAt', 'updatedAt'];
          const updateColumns = ['eventDate', 'title', 'eventType', 'description', 'applicableClasses', 'startTime', 'endTime', 'session', 'color', 'audience', 'recurring', 'reminders', 'attachments', 'notifications', 'updatedAt'];
          const valueRows = db.academicCalendarEvents.filter(e => e.id).map(e => [
            e.id, e.eventDate, e.title, e.eventType, e.description || '', e.applicableClasses || '',
            e.startTime || '', e.endTime || '', e.session, e.color || '#6366f1', e.audience || 'All',
            e.recurring || 'None',
            e.reminders ? (typeof e.reminders === 'string' ? e.reminders : JSON.stringify(e.reminders)) : null,
            e.attachments ? (typeof e.attachments === 'string' ? e.attachments : JSON.stringify(e.attachments)) : null,
            e.notifications ? (typeof e.notifications === 'string' ? e.notifications : JSON.stringify(e.notifications)) : null,
            tId, e.createdAt || new Date().toISOString(), e.updatedAt || new Date().toISOString()
          ]);
          await bulkInsertOrUpdate('academic_calendar_events', columns, valueRows, updateColumns);
        })());
      }

      // 25. Sync Academic Calendar Imports
      if (db.academicCalendarImports && Array.isArray(db.academicCalendarImports) && hasTableChanged('academicCalendarImports')) {
        tasks.push((async () => {
          const activeImportIds = db.academicCalendarImports.map(i => i.id).filter(Boolean);
          if (activeImportIds.length > 0) {
            await sqlDb.query(`DELETE FROM academic_calendar_imports WHERE tenantId = ? AND id NOT IN (${activeImportIds.map(() => '?').join(',')})`, [tId, ...activeImportIds]);
          } else {
            await sqlDb.query('DELETE FROM academic_calendar_imports WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'fileName', 'importDate', 'importedBy', 'totalRecords', 'session', 'tenantId'];
          const updateColumns = ['fileName', 'importDate', 'importedBy', 'totalRecords', 'session'];
          const valueRows = db.academicCalendarImports.filter(i => i.id).map(i => [
            i.id, i.fileName, i.importDate, i.importedBy, i.totalRecords || 0, i.session, tId
          ]);
          await bulkInsertOrUpdate('academic_calendar_imports', columns, valueRows, updateColumns);
        })());
      }

      // 26. Sync Published Calendar Events
      if (db.publishedCalendarEvents && Array.isArray(db.publishedCalendarEvents) && hasTableChanged('publishedCalendarEvents')) {
        tasks.push((async () => {
          const activePublishedIds = db.publishedCalendarEvents.filter(Boolean);
          if (activePublishedIds.length > 0) {
            await sqlDb.query(`DELETE FROM published_calendar_events WHERE tenantId = ? AND eventId NOT IN (${activePublishedIds.map(() => '?').join(',')})`, [tId, ...activePublishedIds]);
          } else {
            await sqlDb.query('DELETE FROM published_calendar_events WHERE tenantId = ?', [tId]);
          }

          const valueRows = db.publishedCalendarEvents.filter(Boolean).map(eventId => [eventId, tId]);
          if (valueRows.length > 0) {
            const placeholders = valueRows.map(() => '(?, ?)').join(', ');
            await sqlDb.query(`INSERT IGNORE INTO published_calendar_events (eventId, tenantId) VALUES ${placeholders}`, valueRows.flat());
          }
        })());
      }

      // Sync central grades
      if (db.grades && Array.isArray(db.grades) && hasTableChanged('grades')) {
        tasks.push((async () => {
          const activeGradeIds = db.grades.map(g => g.id).filter(Boolean);
          if (activeGradeIds.length > 0) {
            await sqlDb.query(`DELETE FROM grades WHERE tenantId = ? AND id NOT IN (${activeGradeIds.map(() => '?').join(',')})`, [tId, ...activeGradeIds]);
          } else {
            await sqlDb.query('DELETE FROM grades WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'name', 'status', 'createdAt', 'updatedAt', 'tenantId', 'sections'];
          const updateColumns = ['name', 'status', 'updatedAt', 'sections'];
          const valueRows = db.grades.filter(g => g.id).map(g => [
            g.id, g.name, g.status || 'Active', g.createdAt || new Date().toISOString(), g.updatedAt || new Date().toISOString(), tId,
            g.sections ? (typeof g.sections === 'string' ? g.sections : JSON.stringify(g.sections)) : '[]'
          ]);
          await bulkInsertOrUpdate('grades', columns, valueRows, updateColumns);
        })());
      }

      // Sync central departments
      if (db.departments && Array.isArray(db.departments) && hasTableChanged('departments')) {
        tasks.push((async () => {
          const activeDeptIds = db.departments.map(d => d.id).filter(Boolean);
          if (activeDeptIds.length > 0) {
            await sqlDb.query(`DELETE FROM departments WHERE tenantId = ? AND id NOT IN (${activeDeptIds.map(() => '?').join(',')})`, [tId, ...activeDeptIds]);
          } else {
            await sqlDb.query('DELETE FROM departments WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'name', 'status', 'createdAt', 'updatedAt', 'tenantId'];
          const updateColumns = ['name', 'status', 'updatedAt'];
          const valueRows = db.departments.filter(d => d.id).map(d => [
            d.id, d.name, d.status || 'Active', d.createdAt || new Date().toISOString(), d.updatedAt || new Date().toISOString(), tId
          ]);
          await bulkInsertOrUpdate('departments', columns, valueRows, updateColumns);
        })());
      }

      // Sync central grade mappings
      if (db.gradeDepartments && Array.isArray(db.gradeDepartments) && hasTableChanged('gradeDepartments')) {
        tasks.push((async () => {
          const activeMappingIds = db.gradeDepartments.map(gd => gd.id).filter(Boolean);
          if (activeMappingIds.length > 0) {
            await sqlDb.query(`DELETE FROM grade_departments WHERE tenantId = ? AND id NOT IN (${activeMappingIds.map(() => '?').join(',')})`, [tId, ...activeMappingIds]);
          } else {
            await sqlDb.query('DELETE FROM grade_departments WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'gradeId', 'departmentId', 'status', 'tenantId', 'createdAt', 'updatedAt', 'sections'];
          const updateColumns = ['status', 'updatedAt', 'sections'];
          const valueRows = db.gradeDepartments.filter(gd => gd.id).map(gd => [
            gd.id, gd.gradeId, gd.departmentId, gd.status || 'Active', tId, gd.createdAt || new Date().toISOString(), gd.updatedAt || new Date().toISOString(), gd.sections ? (typeof gd.sections === 'string' ? gd.sections : JSON.stringify(gd.sections)) : null
          ]);
          await bulkInsertOrUpdate('grade_departments', columns, valueRows, updateColumns);
        })());
      }

      // Sync sections
      if (db.sections && Array.isArray(db.sections) && hasTableChanged('sections')) {
        tasks.push((async () => {
          const activeSecIds = db.sections.map(s => s.id).filter(Boolean);
          if (activeSecIds.length > 0) {
            await sqlDb.query(`DELETE FROM sections WHERE tenantId = ? AND id NOT IN (${activeSecIds.map(() => '?').join(',')})`, [tId, ...activeSecIds]);
          } else {
            await sqlDb.query('DELETE FROM sections WHERE tenantId = ?', [tId]);
          }

          const columns = ['id', 'name', 'status', 'createdAt', 'updatedAt', 'tenantId'];
          const updateColumns = ['name', 'status', 'updatedAt'];
          const valueRows = db.sections.filter(s => s.id).map(s => [
            s.id, s.name, s.status || 'Active', s.createdAt || new Date().toISOString(), s.updatedAt || new Date().toISOString(), tId
          ]);
          await bulkInsertOrUpdate('sections', columns, valueRows, updateColumns);
        })());
      }

      // Sync published timetables
      if (hasTableChanged('publishedClassTimetables') || hasTableChanged('publishedTeacherTimetables')) {
        tasks.push((async () => {
          await sqlDb.query('DELETE FROM published_timetables WHERE tenantId = ?', [tId]);

          const valueRows = [];
          if (db.publishedClassTimetables && Array.isArray(db.publishedClassTimetables)) {
            db.publishedClassTimetables.forEach(pt => {
              if (pt.cohort) {
                valueRows.push([
                  `pub-class-${pt.cohort}-${tId}`,
                  'class',
                  pt.cohort,
                  JSON.stringify(pt.slots || []),
                  pt.publishedAt || new Date().toISOString(),
                  tId
                ]);
              }
            });
          }
          if (db.publishedTeacherTimetables && Array.isArray(db.publishedTeacherTimetables)) {
            db.publishedTeacherTimetables.forEach(pt => {
              if (pt.teacher) {
                valueRows.push([
                  `pub-teacher-${slugify(pt.teacher)}-${tId}`,
                  'teacher',
                  pt.teacher,
                  JSON.stringify(pt.slots || []),
                  pt.publishedAt || new Date().toISOString(),
                  tId
                ]);
              }
            });
          }

          if (valueRows.length > 0) {
            const columns = ['id', 'type', 'identifier', 'slots', 'publishedAt', 'tenantId'];
            const updateColumns = ['slots', 'publishedAt'];
            await bulkInsertOrUpdate('published_timetables', columns, valueRows, updateColumns);
          }
        })());
      }

      // Execute all synchronization tasks concurrently!
      await Promise.all(tasks);

      // 27. Update schools.updatedAt timestamp to trigger cache validation for other instances
      if (tId !== 'platform' && tasks.length > 0) {
        const nowStr = new Date().toISOString();
        await sqlDb.query("UPDATE schools SET updatedAt = ? WHERE subdomain = ?", [nowStr, tId]);
        if (dbCache[tId]) {
          dbCache[tId]._updatedAt = nowStr;
        }
      }

      console.log(`[SQL Sync SUCCESS] Finished database sync for tenant: ${tId}`);
    } catch (err) {
      console.error(`[SQL Sync ERROR] Sync query failed for tenant ${tId || 'platform'}:`, err);
      const isConnectionError = ['ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'lost', 'handshake'].some(
        term => err.message.toUpperCase().includes(term)
      );
      if (isConnectionError) {
        console.warn('[SQL Sync] SQL connection lost or timed out. Gracefully disabling SQL mode and falling back to JSON.');
        isSqlInitialized = false;
      }
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
    return JSON.parse(JSON.stringify(dbCache[activeTenant]));
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
    if (db.grades && Array.isArray(db.grades)) {
      db.grades.forEach(g => {
        if (!g.sections) g.sections = [];
      });
    }
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
    // Clean up Parent, Student, and Librarian roles from local JSON DB
    if (db.roles) {
      db.roles = db.roles.filter(r => r.name !== 'Parent' && r.name !== 'Student' && r.name !== 'Librarian' && r.id !== 'role-parent' && r.id !== 'role-student' && r.id !== 'role-librarian');
      db.roles.forEach(r => {
        if (r.id === 'role-subject-teacher' || r.name === 'Subject Teacher') {
          r.id = 'role-teacher';
          r.name = 'Teacher';
          r.description = 'Teacher. Records attendance, enters marks, manages academic activities, and views student profiles.';
        }
      });
    }
    if (db.userAccess) {
      db.userAccess.forEach(ua => {
        if (ua.roleId === 'role-subject-teacher') {
          ua.roleId = 'role-teacher';
        }
      });
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

  // Invalidate cache timing checks on database modifications
  delete lastCheckTimes[activeTenant];
  delete lastCheckTimes['platform'];

  if (isSqlActive()) {
    const previousData = dbCache[activeTenant] ? JSON.parse(JSON.stringify(dbCache[activeTenant])) : null;
    
    // Preserve cache validation tokens when updating cache
    if (previousData) {
      if (previousData._updatedAt) data._updatedAt = previousData._updatedAt;
      if (previousData._signature) data._signature = previousData._signature;
    }

    const clonedData = JSON.parse(JSON.stringify(data));

    // 1. Update memory cache instantly
    dbCache[activeTenant] = clonedData;
    // 2. Dispatch MySQL sync asynchronously in the background
    saveMemoryDbToSql(activeTenant, clonedData, previousData);
  }

  // Backup to JSON file asynchronously to avoid blocking (always for platform owner, or when SQL is inactive)
  if (activeTenant === 'platform' || !isSqlActive()) {
    const dbFile = getDbPath();
    if (!isSqlActive() && !fs.existsSync(TENANTS_DIR)) {
      try {
        fs.mkdirSync(TENANTS_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create tenants directory:', err);
      }
    }
    fs.writeFile(dbFile, JSON.stringify(data, null, 2), 'utf8', (err) => {
      if (err) {
        console.error(`[JSON Backup ERROR] Failed writing local backup:`, err);
      }
    });
  }
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
