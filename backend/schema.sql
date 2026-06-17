-- MySQL Schema for School Management System (Multi-Tenant ERP)

-- Disable foreign key checks during creation to prevent order issues
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Schools Table (Global/Tenant Identifiers)
CREATE TABLE IF NOT EXISTS schools (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  logo TEXT,
  principalName VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  academicSession VARCHAR(50) DEFAULT '2026-2027',
  subscriptionPlan VARCHAR(50) DEFAULT 'Starter',
  url TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  adminName VARCHAR(255),
  adminEmail VARCHAR(255),
  adminUsername VARCHAR(255),
  adminPassword VARCHAR(255),
  ratePerStudent VARCHAR(50) DEFAULT '250.00',
  createdAt VARCHAR(100)
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(50) PRIMARY KEY,
  firstName VARCHAR(100),
  middleName VARCHAR(100),
  lastName VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  fullName VARCHAR(255) NOT NULL,
  admissionNumber VARCHAR(100) UNIQUE NOT NULL,
  admissionDate VARCHAR(50),
  dob VARCHAR(50),
  gender VARCHAR(50),
  bloodGroup VARCHAR(20),
  nationality VARCHAR(100) DEFAULT 'Indian',
  category VARCHAR(100) DEFAULT 'General',
  religion VARCHAR(100) DEFAULT 'Hinduism',
  aadhaarNumber VARCHAR(100),
  photo TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  photoBg TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  feeStatus VARCHAR(50) DEFAULT 'Pending',
  `rank` VARCHAR(50) DEFAULT 'N/A',
  transportRequired VARCHAR(50) DEFAULT 'No',
  hostelRequired VARCHAR(50) DEFAULT 'No',
  createdAt VARCHAR(100),
  updatedAt VARCHAR(100),
  tenantId VARCHAR(100)
);

-- 3. Student Enrollments Table
CREATE TABLE IF NOT EXISTS student_enrollments (
  id VARCHAR(50) PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL,
  academicYear VARCHAR(50) NOT NULL,
  admissionType VARCHAR(50) DEFAULT 'New Admission',
  studentClass VARCHAR(50) NOT NULL,
  section VARCHAR(50) DEFAULT 'A',
  rollNumber VARCHAR(50),
  previousSchoolName VARCHAR(255),
  previousSchoolAddress TEXT,
  previousClassStudied VARCHAR(50),
  transferCertificateNumber VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Active',
  createdAt VARCHAR(100),
  updatedAt VARCHAR(100),
  tenantId VARCHAR(100),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_enrollment (studentId, academicYear, tenantId)
);

-- 4. Parents Table
CREATE TABLE IF NOT EXISTS parents (
  id VARCHAR(50) PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL,
  fatherName VARCHAR(255),
  fatherOccupation VARCHAR(255),
  fatherMobile VARCHAR(50),
  fatherEmail VARCHAR(255),
  motherName VARCHAR(255),
  motherOccupation VARCHAR(255),
  motherMobile VARCHAR(50),
  motherEmail VARCHAR(255),
  guardianName VARCHAR(255),
  guardianRelation VARCHAR(100),
  guardianContact VARCHAR(50),
  parentUsername VARCHAR(100),
  parentPassword VARCHAR(100),
  createdAt VARCHAR(100),
  updatedAt VARCHAR(100),
  tenantId VARCHAR(100),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_parent (studentId, tenantId)
);

-- 5. Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
  id VARCHAR(50) PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL,
  currentAddress TEXT,
  permanentAddress TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  postalCode VARCHAR(50),
  emergencyContactNumber VARCHAR(50),
  isSameAddress BOOLEAN DEFAULT TRUE,
  createdAt VARCHAR(100),
  updatedAt VARCHAR(100),
  tenantId VARCHAR(100),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_address (studentId, tenantId)
);

-- 6. Medical Records Table
CREATE TABLE IF NOT EXISTS medical_records (
  id VARCHAR(50) PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL,
  bloodGroup VARCHAR(20),
  medicalConditions TEXT,
  allergies TEXT,
  disabilities TEXT,
  emergencyNotes TEXT,
  doctorName VARCHAR(255),
  doctorContact VARCHAR(50),
  createdAt VARCHAR(100),
  updatedAt VARCHAR(100),
  tenantId VARCHAR(100),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_medical (studentId, tenantId)
);

-- 7. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(50) PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL,
  documentType VARCHAR(100) NOT NULL,
  fileName VARCHAR(255),
  filePath TEXT,
  fileSize INT,
  uploadedAt VARCHAR(100),
  tenantId VARCHAR(100),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
);

-- 8. Fee Assignments Table
CREATE TABLE IF NOT EXISTS fee_assignments (
  id VARCHAR(50) PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL,
  feeStructure VARCHAR(255),
  scholarshipDetails TEXT,
  discountType VARCHAR(100),
  discountAmount DECIMAL(10,2) DEFAULT 0.00,
  initialPaymentStatus VARCHAR(50) DEFAULT 'Pending',
  assignedAt VARCHAR(100),
  tenantId VARCHAR(100),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_fee_assign (studentId, tenantId)
);

-- 9. Student Accounts Table
CREATE TABLE IF NOT EXISTS student_accounts (
  id VARCHAR(50) PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL,
  studentUsername VARCHAR(100) NOT NULL,
  studentPassword VARCHAR(100) NOT NULL,
  createdAt VARCHAR(100),
  tenantId VARCHAR(100),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
);

-- 10. Parent Accounts Table
CREATE TABLE IF NOT EXISTS parent_accounts (
  id VARCHAR(50) PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL,
  parentUsername VARCHAR(100) NOT NULL,
  parentPassword VARCHAR(100) NOT NULL,
  createdAt VARCHAR(100),
  tenantId VARCHAR(100),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
);

-- 11. Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  fullName VARCHAR(255),
  role VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  gender VARCHAR(50),
  qualification VARCHAR(255),
  experience VARCHAR(100),
  dateOfJoining VARCHAR(50),
  salaryGrade VARCHAR(100),
  reportingTo VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(50),
  emergencyContact VARCHAR(255),
  emergencyPhone VARCHAR(50),
  photo TEXT,
  aadharFile TEXT,
  certificateFile TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  avatarBg TEXT,
  password VARCHAR(255),
  tenantId VARCHAR(100),
  designation VARCHAR(100),
  designationLevel VARCHAR(100),
  employmentType VARCHAR(100)
);

-- 12. Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  gender VARCHAR(50),
  qualification TEXT,
  experience TEXT,
  dateOfJoining VARCHAR(50),
  salaryGrade VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(50),
  emergencyContact VARCHAR(255),
  emergencyPhone VARCHAR(50),
  photo TEXT,
  aadharFile TEXT,
  certificateFile TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  avatarBg TEXT,
  tenantId VARCHAR(100),
  firstName VARCHAR(100),
  middleName VARCHAR(100),
  lastName VARCHAR(100),
  fullName VARCHAR(255),
  dob VARCHAR(50),
  bloodGroup VARCHAR(20),
  nationality VARCHAR(100) DEFAULT 'Indian',
  maritalStatus VARCHAR(50),
  aadhaarNumber VARCHAR(100),
  panNumber VARCHAR(100),
  joiningDate VARCHAR(50),
  employmentType VARCHAR(50),
  designation VARCHAR(100),
  department VARCHAR(100),
  primarySubject VARCHAR(100),
  secondarySubject VARCHAR(100),
  alternateMobile VARCHAR(50),
  currentAddress TEXT,
  currentCity VARCHAR(100),
  currentState VARCHAR(100),
  currentCountry VARCHAR(100) DEFAULT 'India',
  currentPostalCode VARCHAR(50),
  permanentAddress TEXT,
  permanentCity VARCHAR(100),
  permanentState VARCHAR(100),
  permanentCountry VARCHAR(100) DEFAULT 'India',
  permanentPostalCode VARCHAR(50),
  sameAsPermanent VARCHAR(10) DEFAULT 'No',
  panFile TEXT,
  resumeFile TEXT,
  joiningLetterFile TEXT,
  otherFile TEXT,
  experiences TEXT
);

-- 13. Timetables Table
CREATE TABLE IF NOT EXISTS timetables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cohort VARCHAR(100) NOT NULL,
  time VARCHAR(100) NOT NULL,
  mon JSON,
  tue JSON,
  wed JSON,
  thu JSON,
  fri JSON,
  sat JSON,
  tenantId VARCHAR(100)
);

-- 14. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  invoiceNo VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  grade VARCHAR(100),
  amount VARCHAR(50),
  date VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Pending',
  method VARCHAR(100),
  tenantId VARCHAR(100)
);

-- 15. Fees Table
CREATE TABLE IF NOT EXISTS fees (
  id VARCHAR(50) PRIMARY KEY,
  studentId VARCHAR(50),
  studentName VARCHAR(255),
  classId VARCHAR(50),
  sectionId VARCHAR(50),
  feeType VARCHAR(100),
  totalAmount DECIMAL(10,2),
  paidAmount DECIMAL(10,2),
  dueAmount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'Pending',
  paymentDate VARCHAR(50),
  paymentMethod VARCHAR(100),
  remarks TEXT,
  createdAt VARCHAR(100),
  tenantId VARCHAR(100),
  receiptNumber VARCHAR(100),
  transactionId VARCHAR(100),
  discount DECIMAL(10,2) DEFAULT 0.00,
  fine DECIMAL(10,2) DEFAULT 0.00,
  amount DECIMAL(10,2) DEFAULT 0.00,
  studentClass VARCHAR(100),
  section VARCHAR(50),
  paymentStatus VARCHAR(50)
);

-- 16. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  date VARCHAR(50),
  description TEXT,
  status VARCHAR(50) DEFAULT 'Approved',
  paidTo VARCHAR(255),
  paymentMethod VARCHAR(100),
  attachment TEXT,
  createdAt VARCHAR(100),
  tenantId VARCHAR(100),
  grade VARCHAR(100),
  department VARCHAR(100),
  expenseType VARCHAR(100)
);

-- 17. Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
  id VARCHAR(50) PRIMARY KEY,
  staffId VARCHAR(50) NOT NULL,
  staffName VARCHAR(255),
  role VARCHAR(100),
  month VARCHAR(50),
  basicSalary DECIMAL(10,2),
  allowances DECIMAL(10,2),
  deductions DECIMAL(10,2),
  netSalary DECIMAL(10,2),
  paymentStatus VARCHAR(50) DEFAULT 'Pending',
  paymentDate VARCHAR(50),
  paymentMethod VARCHAR(100),
  createdAt VARCHAR(100),
  tenantId VARCHAR(100)
);

-- 18. Staff Payments Table
CREATE TABLE IF NOT EXISTS staff_payments (
  id VARCHAR(50) PRIMARY KEY,
  staffId VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paymentDate VARCHAR(50),
  paymentMethod VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Paid',
  remarks TEXT,
  tenantId VARCHAR(100),
  staffName VARCHAR(255),
  staffRole VARCHAR(255),
  basicSalary DECIMAL(10,2) DEFAULT 0.00,
  allowances DECIMAL(10,2) DEFAULT 0.00,
  bonus DECIMAL(10,2) DEFAULT 0.00,
  deductions DECIMAL(10,2) DEFAULT 0.00,
  pfDeduction DECIMAL(10,2) DEFAULT 0.00,
  taxDeduction DECIMAL(10,2) DEFAULT 0.00,
  netSalary DECIMAL(10,2) DEFAULT 0.00
);

-- 19. Activities Table
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(100),
  title VARCHAR(255),
  description TEXT,
  time VARCHAR(100),
  timestamp VARCHAR(100),
  color VARCHAR(100),
  bg VARCHAR(100),
  tenantId VARCHAR(100)
);

-- 20. Exams Table
CREATE TABLE IF NOT EXISTS exams (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  term VARCHAR(100),
  startDate VARCHAR(50),
  endDate VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Draft',
  timetablePublished TINYINT(1) DEFAULT 0,
  tenantId VARCHAR(100)
);

-- 21. Exam Timetables Table
CREATE TABLE IF NOT EXISTS exam_timetables (
  id VARCHAR(50) PRIMARY KEY,
  examId VARCHAR(50),
  examName VARCHAR(255),
  classId VARCHAR(50),
  subject VARCHAR(100),
  date VARCHAR(50),
  timeSlot VARCHAR(100),
  room VARCHAR(100),
  maxMarks INT,
  tenantId VARCHAR(100)
);

-- 22. Notices Table
CREATE TABLE IF NOT EXISTS notices (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  date VARCHAR(50),
  audience VARCHAR(100) DEFAULT 'All',
  createdBy VARCHAR(255),
  tenantId VARCHAR(100)
);

-- 23. Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  startDate VARCHAR(50),
  endDate VARCHAR(50),
  description TEXT,
  tenantId VARCHAR(100)
);

-- 24. Events Table
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date VARCHAR(50),
  time VARCHAR(50),
  venue VARCHAR(255),
  audience VARCHAR(100) DEFAULT 'All',
  tenantId VARCHAR(100)
);

-- 24a. Academic Calendar Events Table
CREATE TABLE IF NOT EXISTS academic_calendar_events (
  id VARCHAR(50) PRIMARY KEY,
  eventDate VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  eventType VARCHAR(100) NOT NULL,
  description TEXT,
  applicableClasses VARCHAR(255),
  startTime VARCHAR(50),
  endTime VARCHAR(50),
  session VARCHAR(50) NOT NULL,
  color VARCHAR(50) DEFAULT '#6366f1',
  audience VARCHAR(255) DEFAULT 'All',
  recurring VARCHAR(50) DEFAULT 'None',
  reminders JSON NULL,
  attachments JSON NULL,
  notifications JSON NULL,
  tenantId VARCHAR(100) NOT NULL,
  createdAt VARCHAR(100) NOT NULL,
  updatedAt VARCHAR(100) NOT NULL
);

-- 24b. Academic Calendar Imports Table
CREATE TABLE IF NOT EXISTS academic_calendar_imports (
  id VARCHAR(50) PRIMARY KEY,
  fileName VARCHAR(255) NOT NULL,
  importDate VARCHAR(100) NOT NULL,
  importedBy VARCHAR(255) NOT NULL,
  totalRecords INT DEFAULT 0,
  session VARCHAR(50) NOT NULL,
  tenantId VARCHAR(100) NOT NULL
);

-- 25. Results Table
CREATE TABLE IF NOT EXISTS results (
  id VARCHAR(50) PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL,
  studentName VARCHAR(255),
  examId VARCHAR(50),
  examName VARCHAR(255),
  subject VARCHAR(100),
  marksObtained INT,
  maxMarks INT DEFAULT 100,
  grade VARCHAR(10),
  remarks TEXT,
  isLocked BOOLEAN DEFAULT FALSE,
  isPublished BOOLEAN DEFAULT FALSE,
  tenantId VARCHAR(100)
);

-- 26. Overall Results Table
CREATE TABLE IF NOT EXISTS overall_results (
  id VARCHAR(50) PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL,
  studentName VARCHAR(255),
  classId VARCHAR(50),
  sectionId VARCHAR(50),
  percentage DECIMAL(5,2),
  grade VARCHAR(10),
  status VARCHAR(50),
  tenantId VARCHAR(100)
);

-- 27. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  classId VARCHAR(50),
  teacherId VARCHAR(50),
  teacherName VARCHAR(255),
  tenantId VARCHAR(100)
);

-- 28. Timeslots Table
CREATE TABLE IF NOT EXISTS timeslots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slotTime VARCHAR(100) NOT NULL,
  tenantId VARCHAR(100)
);

-- 29. Fee Structures Table
CREATE TABLE IF NOT EXISTS fee_structures (
  id VARCHAR(50) PRIMARY KEY,
  classId VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency VARCHAR(50) DEFAULT 'Yearly',
  tenantId VARCHAR(100)
);

-- 30. Salary Structures Table
CREATE TABLE IF NOT EXISTS salary_structures (
  id VARCHAR(50) PRIMARY KEY,
  gradeName VARCHAR(100) NOT NULL,
  basicSalary DECIMAL(10,2) NOT NULL,
  allowances JSON,
  deductions JSON,
  tenantId VARCHAR(100)
);

-- 31. Staff Salary Structures Table
CREATE TABLE IF NOT EXISTS staff_salary_structures (
  id VARCHAR(50) PRIMARY KEY,
  position VARCHAR(255) NOT NULL,
  basicSalary DECIMAL(10,2) NOT NULL,
  allowances JSON,
  deductions JSON,
  tenantId VARCHAR(100),
  designation VARCHAR(255),
  bonus DECIMAL(10,2) DEFAULT 0.00,
  pfDeduction DECIMAL(10,2) DEFAULT 0.00,
  taxDeduction DECIMAL(10,2) DEFAULT 0.00,
  netSalary DECIMAL(10,2) DEFAULT 0.00,
  designationLevel VARCHAR(100),
  employmentType VARCHAR(100)
);

-- 32. Income Table
CREATE TABLE IF NOT EXISTS income (
  id VARCHAR(50) PRIMARY KEY,
  source VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date VARCHAR(50),
  description TEXT,
  tenantId VARCHAR(100)
);

-- 33. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  attendanceId VARCHAR(100) PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL,
  classId VARCHAR(50),
  sectionId VARCHAR(50),
  attendanceDate VARCHAR(50),
  attendanceStatus VARCHAR(50),
  remarks TEXT,
  markedBy VARCHAR(255),
  createdAt VARCHAR(100),
  updatedAt VARCHAR(100),
  tenantId VARCHAR(100)
);

-- 34. Subscription Plans Table (Global Platforms)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price VARCHAR(50),
  features JSON
);

-- 35. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  isSystem BOOLEAN DEFAULT FALSE,
  permissions JSON,
  createdAt VARCHAR(100),
  tenantId VARCHAR(100)
);

-- 36. User Access Table
CREATE TABLE IF NOT EXISTS user_access (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  userName VARCHAR(255) NOT NULL,
  userType VARCHAR(50) NOT NULL,
  roleId VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Active',
  overrides JSON,
  updatedAt VARCHAR(100),
  tenantId VARCHAR(100)
);

-- 37. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50),
  userName VARCHAR(255),
  userRole VARCHAR(100),
  action VARCHAR(255) NOT NULL,
  details TEXT,
  ipAddress VARCHAR(100),
  timestamp VARCHAR(100) NOT NULL,
  tenantId VARCHAR(100)
);

-- 38. Employee QR Codes Table
CREATE TABLE IF NOT EXISTS employee_qr_codes (
  id VARCHAR(50) PRIMARY KEY,
  employeeId VARCHAR(50) NOT NULL,
  employeeType VARCHAR(50) NOT NULL,
  qrPath TEXT NOT NULL,
  createdAt VARCHAR(100),
  tenantId VARCHAR(100),
  teacherId VARCHAR(50) NULL,
  staffId VARCHAR(50) NULL,
  FOREIGN KEY (teacherId) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (staffId) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_qr (employeeId, tenantId)
);

-- 39. Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
  id VARCHAR(50) PRIMARY KEY,
  employeeId VARCHAR(50) NOT NULL,
  employeeType VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  designation VARCHAR(100),
  date VARCHAR(50) NOT NULL,
  checkIn VARCHAR(50),
  checkOut VARCHAR(50),
  workingHours DECIMAL(5,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Present',
  createdAt VARCHAR(100),
  tenantId VARCHAR(100),
  teacherId VARCHAR(50) NULL,
  staffId VARCHAR(50) NULL,
  FOREIGN KEY (teacherId) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (staffId) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_att_emp (employeeId),
  INDEX idx_att_date (date),
  INDEX idx_att_tenant (tenantId),
  INDEX idx_att_status (status)
);

-- 40. Attendance Logs Table
CREATE TABLE IF NOT EXISTS attendance_logs (
  id VARCHAR(50) PRIMARY KEY,
  employeeId VARCHAR(50) NOT NULL,
  employeeType VARCHAR(50) NOT NULL,
  scanTime VARCHAR(100) NOT NULL,
  scanType VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  tenantId VARCHAR(100),
  teacherId VARCHAR(50) NULL,
  staffId VARCHAR(50) NULL,
  FOREIGN KEY (teacherId) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (staffId) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_log_emp (employeeId),
  INDEX idx_log_tenant (tenantId)
);

-- 41. Attendance Reports Table
CREATE TABLE IF NOT EXISTS attendance_reports (
  id VARCHAR(50) PRIMARY KEY,
  reportName VARCHAR(255) NOT NULL,
  reportType VARCHAR(50) NOT NULL,
  generatedAt VARCHAR(100) NOT NULL,
  filters JSON,
  filePath TEXT,
  tenantId VARCHAR(100),
  INDEX idx_rep_tenant (tenantId)
);

-- 42. Published Calendar Events Table
CREATE TABLE IF NOT EXISTS published_calendar_events (
  eventId VARCHAR(100) NOT NULL,
  tenantId VARCHAR(100) NOT NULL,
  PRIMARY KEY (eventId, tenantId)
);

-- 43. Grades Table
CREATE TABLE IF NOT EXISTS grades (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  createdAt VARCHAR(100),
  updatedAt VARCHAR(100),
  tenantId VARCHAR(100)
);

-- 44. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  createdAt VARCHAR(100),
  updatedAt VARCHAR(100),
  tenantId VARCHAR(100)
);

-- 45. Grade-Department Mapping Table
CREATE TABLE IF NOT EXISTS grade_departments (
  id VARCHAR(50) PRIMARY KEY,
  gradeId VARCHAR(50) NOT NULL,
  departmentId VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  tenantId VARCHAR(100),
  createdAt VARCHAR(100),
  updatedAt VARCHAR(100),
  FOREIGN KEY (gradeId) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_grade_dept (gradeId, departmentId, tenantId)
);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;


