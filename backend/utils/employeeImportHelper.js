/**
 * Employee Bulk Import Helper
 * Utilities for column aliasing, sanitization, date parsing, master data normalization,
 * duplicate detection, and formula injection prevention.
 */

import { decrypt } from './encryptionHelper.js';

// Standard supported fields metadata
export const EMPLOYEE_FIELD_DEFINITIONS = [
  { key: 'employeeId', label: 'Employee ID', required: false, aliases: ['employee id', 'empid', 'emp id', 'staff id', 'id', 'employee code', 'code'] },
  { key: 'firstName', label: 'First Name', required: true, aliases: ['first name', 'firstname', 'given name'] },
  { key: 'middleName', label: 'Middle Name', required: false, aliases: ['middle name', 'middlename'] },
  { key: 'lastName', label: 'Last Name', required: true, aliases: ['last name', 'lastname', 'surname', 'family name'] },
  { key: 'fullName', label: 'Full Name', required: false, aliases: ['full name', 'fullname', 'employee name', 'name', 'staff name'] },
  { key: 'designation', label: 'Designation', required: true, aliases: ['designation', 'position', 'role', 'post', 'job title'] },
  { key: 'department', label: 'Department', required: false, aliases: ['department', 'dept', 'division'] },
  { key: 'gender', label: 'Gender', required: true, aliases: ['gender', 'sex'] },
  { key: 'dob', label: 'Date of Birth', required: false, aliases: ['dob', 'date of birth', 'birth date', 'birthdate'] },
  { key: 'joiningDate', label: 'Joining Date', required: false, aliases: ['joining date', 'doj', 'date of joining', 'join date', 'appointment date'] },
  { key: 'mobile', label: 'Mobile Number', required: true, aliases: ['mobile', 'phone', 'contact', 'mobile number', 'phone number', 'contact number', 'cell'] },
  { key: 'email', label: 'Email Address', required: false, aliases: ['email', 'email address', 'mail'] },
  { key: 'aadhaarNumber', label: 'Aadhaar Number', required: false, aliases: ['aadhaar', 'aadhaar number', 'aadhar', 'aadhar no', 'aadhaar no', 'uid'] },
  { key: 'panNumber', label: 'PAN Card Number', required: false, aliases: ['pan', 'pan number', 'pan card', 'pan no'] },
  { key: 'bloodGroup', label: 'Blood Group', required: false, aliases: ['blood group', 'blood type', 'blood'] },
  { key: 'maritalStatus', label: 'Marital Status', required: false, aliases: ['marital status', 'marital'] },
  { key: 'nationality', label: 'Nationality', required: false, aliases: ['nationality', 'citizenship'] },
  { key: 'currentAddress', label: 'Current Address', required: false, aliases: ['address', 'current address', 'present address', 'street'] },
  { key: 'currentCity', label: 'City', required: false, aliases: ['city', 'town'] },
  { key: 'currentState', label: 'State', required: false, aliases: ['state', 'province'] },
  { key: 'currentCountry', label: 'Country', required: false, aliases: ['country'] },
  { key: 'currentPostalCode', label: 'Postal Code', required: false, aliases: ['postal code', 'pincode', 'pin code', 'zip', 'zip code'] },
  { key: 'permanentAddress', label: 'Permanent Address', required: false, aliases: ['permanent address'] },
  { key: 'permanentCity', label: 'Permanent City', required: false, aliases: ['permanent city'] },
  { key: 'permanentState', label: 'Permanent State', required: false, aliases: ['permanent state'] },
  { key: 'permanentPostalCode', label: 'Permanent Postal Code', required: false, aliases: ['permanent postal code', 'permanent pincode'] },
  { key: 'emergencyContact', label: 'Emergency Contact Person', required: false, aliases: ['emergency contact', 'emergency contact person', 'emergency name'] },
  { key: 'emergencyContactNumber', label: 'Emergency Contact Number', required: false, aliases: ['emergency contact number', 'emergency phone', 'emergency mobile'] },
  { key: 'qualification', label: 'Qualification', required: false, aliases: ['qualification', 'highest qualification', 'education', 'degree'] },
  { key: 'experience', label: 'Experience (Years)', required: false, aliases: ['experience', 'total experience', 'experience years', 'years of experience'] },
  { key: 'salaryGrade', label: 'Salary Grade', required: false, aliases: ['salary grade', 'salary', 'basic salary', 'pay grade'] }
];

// Department / Category mapping lookup based on common designations
export const DESIGNATION_DEPARTMENT_MAP = {
  'Administrative Officer': { category: 'Administration', department: 'Administration' },
  'Administrative Assistant': { category: 'Administration', department: 'Administration' },
  'Office Assistant': { category: 'Administration', department: 'Administration' },
  'Data Entry Operator': { category: 'Administration', department: 'Administration' },
  'Record Keeper': { category: 'Administration', department: 'Administration' },
  'Clerk': { category: 'Administration', department: 'Administration' },
  'Front Desk Executive': { category: 'Administration', department: 'Administration' },
  'Accountant': { category: 'Accounts & Finance', department: 'Accounts & Finance' },
  'Accounts Manager': { category: 'Accounts & Finance', department: 'Accounts & Finance' },
  'Cashier': { category: 'Accounts & Finance', department: 'Accounts & Finance' },
  'Finance Officer': { category: 'Accounts & Finance', department: 'Accounts & Finance' },
  'Fee Collection Officer': { category: 'Accounts & Finance', department: 'Accounts & Finance' },
  'IT Administrator': { category: 'IT & Technical', department: 'IT & Technical' },
  'ERP Administrator': { category: 'IT & Technical', department: 'IT & Technical' },
  'System Administrator': { category: 'IT & Technical', department: 'IT & Technical' },
  'Network Administrator': { category: 'IT & Technical', department: 'IT & Technical' },
  'Computer Operator': { category: 'IT & Technical', department: 'IT & Technical' },
  'Technical Support Executive': { category: 'IT & Technical', department: 'IT & Technical' },
  'Transport Manager': { category: 'Transport & Logistics', department: 'Transport & Logistics' },
  'Transport Coordinator': { category: 'Transport & Logistics', department: 'Transport & Logistics' },
  'Driver': { category: 'Transport & Logistics', department: 'Transport & Logistics' },
  'Assistant Driver': { category: 'Transport & Logistics', department: 'Transport & Logistics' },
  'Bus Attendant': { category: 'Transport & Logistics', department: 'Transport & Logistics' },
  'Vehicle Supervisor': { category: 'Transport & Logistics', department: 'Transport & Logistics' },
  'Hostel Warden': { category: 'Hostel & Boarding', department: 'Hostel & Boarding' },
  'Assistant Warden': { category: 'Hostel & Boarding', department: 'Hostel & Boarding' },
  'Hostel Supervisor': { category: 'Hostel & Boarding', department: 'Hostel & Boarding' },
  'Hostel Caretaker': { category: 'Hostel & Boarding', department: 'Hostel & Boarding' },
  'Security Supervisor': { category: 'Security', department: 'Security' },
  'Security Guard': { category: 'Security', department: 'Security' },
  'Gate Keeper': { category: 'Security', department: 'Security' },
  'Maintenance Manager': { category: 'Maintenance & Facility', department: 'Maintenance & Facility' },
  'Maintenance Staff': { category: 'Maintenance & Facility', department: 'Maintenance & Facility' },
  'Electrician': { category: 'Maintenance & Facility', department: 'Maintenance & Facility' },
  'Plumber': { category: 'Maintenance & Facility', department: 'Maintenance & Facility' },
  'Carpenter': { category: 'Maintenance & Facility', department: 'Maintenance & Facility' },
  'Technician': { category: 'Maintenance & Facility', department: 'Maintenance & Facility' },
  'Housekeeping Supervisor': { category: 'Housekeeping', department: 'Housekeeping' },
  'Housekeeping Staff': { category: 'Housekeeping', department: 'Housekeeping' },
  'Cleaner': { category: 'Housekeeping', department: 'Housekeeping' },
  'Janitor': { category: 'Housekeeping', department: 'Housekeeping' },
  'Sweeper': { category: 'Housekeeping', department: 'Housekeeping' },
  'School Nurse': { category: 'Medical & Infirmary', department: 'Medical & Infirmary' },
  'Medical Officer': { category: 'Medical & Infirmary', department: 'Medical & Infirmary' },
  'Health Assistant': { category: 'Medical & Infirmary', department: 'Medical & Infirmary' },
  'First Aid Assistant': { category: 'Medical & Infirmary', department: 'Medical & Infirmary' },
  'Store Keeper': { category: 'Store & Inventory', department: 'Store & Inventory' },
  'Inventory Manager': { category: 'Store & Inventory', department: 'Store & Inventory' },
  'Stock Assistant': { category: 'Store & Inventory', department: 'Store & Inventory' },
  'Gardener': { category: 'Campus Operations', department: 'Campus Operations' },
  'Groundskeeper': { category: 'Campus Operations', department: 'Campus Operations' },
  'Attendant': { category: 'Campus Operations', department: 'Campus Operations' },
  'Peon': { category: 'Campus Operations', department: 'Campus Operations' },
  'Office Boy': { category: 'Campus Operations', department: 'Campus Operations' },
  'Messenger': { category: 'Campus Operations', department: 'Campus Operations' }
};

// Normalize header text for fuzzy matching
export function normalizeHeader(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

// Auto-match uploaded header to system field
export function matchHeaderToField(header) {
  const norm = normalizeHeader(header);
  if (!norm) return null;

  for (const def of EMPLOYEE_FIELD_DEFINITIONS) {
    if (normalizeHeader(def.key) === norm || normalizeHeader(def.label) === norm) {
      return def.key;
    }
    for (const alias of def.aliases) {
      if (normalizeHeader(alias) === norm) {
        return def.key;
      }
    }
  }
  return null;
}

// Prevent CSV/Formula injection and sanitize text
export function sanitizeCellValue(val) {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  // Strip formula trigger characters to prevent spreadsheet execution on export
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = str.replace(/^[=\+\-@\t\r]+/, '');
  }
  return str.trim();
}

// Robust date parsing (supports Excel numeric serials, YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY)
export function parseDateToIso(dateVal) {
  if (!dateVal) return '';

  // Handle Excel Serial Date Number (e.g. 44561)
  if (typeof dateVal === 'number' || (!isNaN(dateVal) && !String(dateVal).includes('-') && !String(dateVal).includes('/'))) {
    const num = Number(dateVal);
    if (num > 20000 && num < 70000) {
      // Excel epoch starts at 1899-12-30
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }

  const str = String(dateVal).trim();
  if (!str) return '';

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return str;
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    const iso = `${year}-${month}-${day}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }

  // YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    const iso = `${year}-${month}-${day}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return str;
}

// Normalize phone to 10 digits
export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

// Normalize Gender
export function normalizeGender(val) {
  if (!val) return 'Male';
  const clean = String(val).trim().toLowerCase();
  if (['m', 'male', 'boy', 'man'].includes(clean)) return 'Male';
  if (['f', 'female', 'girl', 'woman'].includes(clean)) return 'Female';
  if (['other', 'o', 'transgender'].includes(clean)) return 'Other';
  return 'Male';
}

// Normalize Blood Group
export function normalizeBloodGroup(val) {
  if (!val) return '';
  const clean = String(val).trim().toUpperCase().replace(/\s/g, '');
  const valid = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  if (valid.includes(clean)) return clean;
  return val.trim();
}

// Normalize Marital Status
export function normalizeMaritalStatus(val) {
  if (!val) return 'Single';
  const clean = String(val).trim().toLowerCase();
  if (clean.startsWith('sing')) return 'Single';
  if (clean.startsWith('marr')) return 'Married';
  if (clean.startsWith('div')) return 'Divorced';
  if (clean.startsWith('wid')) return 'Widowed';
  return 'Other';
}

/**
 * Validate a single parsed employee row
 * @param {Object} row - Parsed employee data object
 * @param {number} index - 0-based row index in file
 * @param {Object} options - Validation context (existing employees, master designations, file-level duplicate tracking)
 * @returns {Object} { status: 'Valid'|'Error'|'Duplicate', errors: string[], warnings: string[], message: string }
 */
export function validateEmployeeImportRow(row, index, options = {}) {
  const {
    existingEmployees = [],
    schoolDesignations = [],
    seenIds = new Set(),
    seenPhones = new Set(),
    seenEmails = new Set(),
    seenAadhaars = new Set()
  } = options;

  const errors = [];
  const warnings = [];
  let isDuplicate = false;

  // 1. Name Validation
  const firstName = (row.firstName || '').trim();
  const lastName = (row.lastName || '').trim();
  const fullName = (row.fullName || '').trim();

  const derivedFullName = fullName || [firstName, row.middleName, lastName].filter(Boolean).join(' ');
  if (!derivedFullName) {
    errors.push('Employee name is required (First Name and Last Name, or Full Name)');
  } else if (!firstName && fullName) {
    // Derived from full name
    const parts = fullName.split(' ');
    row.firstName = parts[0] || '';
    row.lastName = parts.slice(1).join(' ') || '';
  }

  // 2. Designation Validation
  const designation = (row.designation || '').trim();
  if (!designation) {
    errors.push('Designation is required');
  } else if (schoolDesignations.length > 0) {
    const matched = schoolDesignations.some(d => d.toLowerCase() === designation.toLowerCase());
    if (!matched) {
      warnings.push(`Designation "${designation}" is not in the school's configured designations list`);
    }
  }

  // Auto-fill category and department if empty
  if (designation && (!row.department || !row.staffCategory)) {
    const meta = DESIGNATION_DEPARTMENT_MAP[designation];
    if (meta) {
      if (!row.department) row.department = meta.department;
      if (!row.staffCategory) row.staffCategory = meta.category;
    } else {
      if (!row.department) row.department = 'General';
      if (!row.staffCategory) row.staffCategory = 'Employee';
    }
  }

  // 3. Gender
  if (row.gender) {
    row.gender = normalizeGender(row.gender);
  } else {
    row.gender = 'Male';
  }

  // 4. Date of Birth
  if (row.dob) {
    const isoDob = parseDateToIso(row.dob);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDob)) {
      errors.push(`Invalid Date of Birth format: "${row.dob}". Accepted: YYYY-MM-DD or DD-MM-YYYY`);
    } else {
      row.dob = isoDob;
      const birthYear = parseInt(isoDob.split('-')[0], 10);
      const currYear = new Date().getFullYear();
      if (birthYear > currYear - 16) {
        warnings.push(`Employee age appears to be under 16 (born ${birthYear})`);
      } else if (birthYear < currYear - 85) {
        warnings.push(`Unusual birth year: ${birthYear}`);
      }
    }
  }

  // 5. Joining Date
  if (row.joiningDate) {
    const isoJd = parseDateToIso(row.joiningDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoJd)) {
      errors.push(`Invalid Joining Date format: "${row.joiningDate}". Accepted: YYYY-MM-DD or DD-MM-YYYY`);
    } else {
      row.joiningDate = isoJd;
    }
  } else {
    row.joiningDate = new Date().toISOString().split('T')[0];
  }

  // 6. Mobile / Phone Validation
  const phone = row.mobile ? normalizePhone(row.mobile) : '';
  if (phone) {
    if (!/^\d{10}$/.test(phone)) {
      errors.push(`Invalid mobile number "${row.mobile}". Must be exactly 10 digits`);
    } else {
      row.mobile = phone;
      row.phone = phone;

      // Duplicate check: inside file
      if (seenPhones.has(phone)) {
        errors.push(`Duplicate mobile number "${phone}" found multiple times in uploaded file`);
        isDuplicate = true;
      } else {
        seenPhones.add(phone);
      }

      // Duplicate check: against existing database records
      const existsInDb = existingEmployees.some(e => {
        const existingPhone = normalizePhone(decrypt(e.phone || e.mobile || ''));
        return existingPhone === phone;
      });
      if (existsInDb) {
        errors.push(`Mobile number "${phone}" already exists in employee directory`);
        isDuplicate = true;
      }
    }
  }

  // 7. Email Validation
  const email = (row.email || '').trim().toLowerCase();
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push(`Invalid email format: "${email}"`);
    } else {
      row.email = email;

      // Duplicate check: inside file
      if (seenEmails.has(email)) {
        errors.push(`Duplicate email "${email}" found multiple times in uploaded file`);
        isDuplicate = true;
      } else {
        seenEmails.add(email);
      }

      // Duplicate check: against existing database records
      const existsInDb = existingEmployees.some(e => {
        const existingEmail = (decrypt(e.email || '')).trim().toLowerCase();
        return existingEmail === email;
      });
      if (existsInDb) {
        errors.push(`Email "${email}" already registered to another employee`);
        isDuplicate = true;
      }
    }
  }

  // 8. Aadhaar Validation
  const rawAadhaar = row.aadhaarNumber ? String(row.aadhaarNumber).replace(/\s/g, '') : '';
  if (rawAadhaar) {
    if (!/^\d{12}$/.test(rawAadhaar)) {
      errors.push(`Invalid Aadhaar number "${row.aadhaarNumber}". Must be exactly 12 digits`);
    } else {
      row.aadhaarNumber = rawAadhaar;

      // Duplicate check: inside file
      if (seenAadhaars.has(rawAadhaar)) {
        errors.push(`Duplicate Aadhaar number "${rawAadhaar}" found multiple times in uploaded file`);
        isDuplicate = true;
      } else {
        seenAadhaars.add(rawAadhaar);
      }

      // Duplicate check: against existing database records
      const existsInDb = existingEmployees.some(e => {
        const existingAadhaar = (decrypt(e.aadhaarNumber || '')).replace(/\s/g, '');
        return existingAadhaar === rawAadhaar;
      });
      if (existsInDb) {
        errors.push(`Aadhaar number "${rawAadhaar}" already exists in employee records`);
        isDuplicate = true;
      }
    }
  }

  // 9. PAN Validation
  const pan = row.panNumber ? String(row.panNumber).trim().toUpperCase() : '';
  if (pan) {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      errors.push(`Invalid PAN card format: "${row.panNumber}". Must match ABCDE1234F format`);
    } else {
      row.panNumber = pan;
    }
  }

  // 10. Employee ID Validation (if provided)
  const empId = (row.employeeId || '').trim();
  if (empId) {
    if (seenIds.has(empId)) {
      errors.push(`Duplicate Employee ID "${empId}" found multiple times in uploaded file`);
      isDuplicate = true;
    } else {
      seenIds.add(empId);
    }

    const existsInDb = existingEmployees.some(e => (e.id || e.employeeId) === empId);
    if (existsInDb) {
      errors.push(`Employee ID "${empId}" already exists in the system`);
      isDuplicate = true;
    }
  }

  // Determine overall status
  let status = 'Valid';
  if (isDuplicate) {
    status = 'Duplicate';
  } else if (errors.length > 0) {
    status = 'Error';
  }

  const message = errors.length > 0 
    ? errors.join('; ') 
    : (warnings.length > 0 ? warnings.join('; ') : 'Ready for import');

  return {
    status,
    errors,
    warnings,
    message
  };
}
