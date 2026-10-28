/**
 * Student Bulk Import Helper
 * Utilities for column aliasing, sanitization, date parsing, master data normalization,
 * duplicate detection, and sibling parent login verification.
 */

import { convertToRoman, slugify } from './db.js';
import { decrypt } from './encryptionHelper.js';

// Standard supported fields metadata
export const FIELD_DEFINITIONS = [
  { key: 'firstName', label: 'First Name', required: true, aliases: ['first name', 'firstname', 'given name', 'student first name'] },
  { key: 'lastName', label: 'Last Name', required: true, aliases: ['last name', 'lastname', 'surname', 'family name', 'student last name'] },
  { key: 'middleName', label: 'Middle Name', required: false, aliases: ['middle name', 'middlename'] },
  { key: 'fullName', label: 'Full Name', required: false, aliases: ['full name', 'fullname', 'student name', 'name'] },
  { key: 'dob', label: 'Date of Birth', required: true, aliases: ['dob', 'date of birth', 'birth date', 'birthdate', 'birthday'] },
  { key: 'gender', label: 'Gender', required: true, aliases: ['gender', 'sex'] },
  { key: 'studentClass', label: 'Class / Grade', required: true, aliases: ['class', 'grade', 'student class', 'standard', 'std', 'target class'] },
  { key: 'section', label: 'Section', required: false, aliases: ['section', 'sec', 'division'] },
  { key: 'rollNumber', label: 'Roll Number', required: false, aliases: ['roll no', 'roll number', 'roll', 'roll #'] },
  { key: 'admissionNumber', label: 'Admission Number', required: false, aliases: ['admission no', 'admission number', 'adm no', 'adm number', 'enrollment no', 'admission #'] },
  { key: 'admissionDate', label: 'Admission Date', required: false, aliases: ['admission date', 'date of admission', 'enrolled date', 'joining date'] },
  { key: 'academicYear', label: 'Academic Session', required: false, aliases: ['academic year', 'academic session', 'session', 'year'] },
  { key: 'admissionType', label: 'Admission Type', required: false, aliases: ['admission type', 'entry type'] },
  
  // Personal & Identity
  { key: 'bloodGroup', label: 'Blood Group', required: false, aliases: ['blood group', 'blood type', 'blood'] },
  { key: 'nationality', label: 'Nationality', required: false, aliases: ['nationality', 'citizenship'] },
  { key: 'category', label: 'Category', required: false, aliases: ['category', 'caste category', 'social category'] },
  { key: 'religion', label: 'Religion', required: false, aliases: ['religion', 'faith'] },
  { key: 'aadhaarNumber', label: 'Aadhaar Number', required: false, aliases: ['aadhaar', 'aadhaar number', 'aadhar', 'aadhar no', 'aadhaar no', 'uid'] },

  // Parent Info
  { key: 'fatherName', label: 'Father Name', required: false, aliases: ['father name', 'father\'s name', 'father'] },
  { key: 'fatherMobile', label: 'Father Mobile', required: false, aliases: ['father mobile', 'father\'s mobile', 'father phone', 'father\'s phone', 'father contact', 'father\'s contact'] },
  { key: 'fatherEmail', label: 'Father Email', required: false, aliases: ['father email', 'father\'s email', 'father mail', 'father\'s mail', 'father login email'] },
  { key: 'fatherOccupation', label: 'Father Occupation', required: false, aliases: ['father occupation', 'father\'s occupation', 'father job'] },
  
  { key: 'motherName', label: 'Mother Name', required: false, aliases: ['mother name', 'mother\'s name', 'mother'] },
  { key: 'motherMobile', label: 'Mother Mobile', required: false, aliases: ['mother mobile', 'mother\'s mobile', 'mother phone', 'mother\'s phone', 'mother contact', 'mother\'s contact'] },
  { key: 'motherEmail', label: 'Mother Email', required: false, aliases: ['mother email', 'mother\'s email', 'mother mail', 'mother\'s mail'] },
  { key: 'motherOccupation', label: 'Mother Occupation', required: false, aliases: ['mother occupation', 'mother\'s occupation', 'mother job'] },

  { key: 'guardianName', label: 'Guardian Name', required: false, aliases: ['guardian name', 'guardian', 'local guardian'] },
  { key: 'guardianRelation', label: 'Guardian Relation', required: false, aliases: ['guardian relation', 'relationship', 'relation'] },
  { key: 'guardianContact', label: 'Guardian Contact', required: false, aliases: ['guardian contact', 'guardian phone', 'guardian mobile'] },

  // Address
  { key: 'currentAddress', label: 'Current Address', required: false, aliases: ['current address', 'address', 'present address', 'residential address'] },
  { key: 'permanentAddress', label: 'Permanent Address', required: false, aliases: ['permanent address'] },
  { key: 'city', label: 'City', required: false, aliases: ['city', 'town'] },
  { key: 'state', label: 'State', required: false, aliases: ['state', 'province'] },
  { key: 'country', label: 'Country', required: false, aliases: ['country'] },
  { key: 'postalCode', label: 'Postal Code', required: false, aliases: ['postal code', 'pincode', 'pin code', 'zip', 'zip code'] },
  { key: 'emergencyContactNumber', label: 'Emergency Contact', required: false, aliases: ['emergency contact', 'emergency phone', 'emergency contact number'] },

  // Medical
  { key: 'medicalConditions', label: 'Medical Conditions', required: false, aliases: ['medical conditions', 'medical history', 'health issues'] },
  { key: 'allergies', label: 'Allergies', required: false, aliases: ['allergies', 'allergy'] },
  { key: 'disabilities', label: 'Disabilities', required: false, aliases: ['disabilities', 'special needs'] },
  { key: 'emergencyNotes', label: 'Emergency Notes', required: false, aliases: ['emergency notes'] },
  { key: 'doctorName', label: 'Doctor Name', required: false, aliases: ['doctor name', 'family doctor'] },
  { key: 'doctorContact', label: 'Doctor Contact', required: false, aliases: ['doctor contact', 'doctor phone'] },

  // Transport & Hostel
  { key: 'transportRequired', label: 'Transport Required', required: false, aliases: ['transport required', 'transport', 'bus required', 'school bus'] },
  { key: 'route', label: 'Route', required: false, aliases: ['route', 'bus route'] },
  { key: 'pickupPoint', label: 'Pickup Point', required: false, aliases: ['pickup point', 'bus stop', 'pick up'] },
  { key: 'dropPoint', label: 'Drop Point', required: false, aliases: ['drop point', 'drop off'] },
  { key: 'hostelRequired', label: 'Hostel Required', required: false, aliases: ['hostel required', 'hostel', 'boarding required'] },

  // Academic History
  { key: 'previousSchoolName', label: 'Previous School', required: false, aliases: ['previous school', 'previous school name', 'last school'] },
  { key: 'previousClassStudied', label: 'Previous Class', required: false, aliases: ['previous class', 'previous grade', 'last class studied'] },
  { key: 'transferCertificateNumber', label: 'TC Number', required: false, aliases: ['tc number', 'transfer certificate number', 'tc no'] },

  // Fee Details
  { key: 'feeStructure', label: 'Fee Structure', required: false, aliases: ['fee structure', 'fee plan'] }
];

// Clean text for alias matching
export function normalizeHeader(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

// Auto-match an uploaded header against known fields
export function matchHeaderToField(header) {
  const norm = normalizeHeader(header);
  if (!norm) return null;

  for (const def of FIELD_DEFINITIONS) {
    if (normalizeHeader(def.key) === norm || normalizeHeader(def.label) === norm) {
      return def.key;
    }
    for (const alias of def.aliases) {
      if (normalizeHeader(alias) === norm) {
        return def.key;
      }
    }
  }

  // Substring fallback
  for (const def of FIELD_DEFINITIONS) {
    for (const alias of def.aliases) {
      if (norm.includes(alias) || alias.includes(norm)) {
        return def.key;
      }
    }
  }

  return null;
}

// Strip formula injection characters (=, +, -, @) from cell values
export function sanitizeCellValue(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val;

  let str = String(val).trim();
  // Strip formula injection characters at the start of strings
  if (/^[=+\-@]/.test(str)) {
    // If it's a legitimate plain signed number like "-5" or "+91", keep it safe
    if (!/^[-+]?\d+(\.\d+)?$/.test(str)) {
      str = str.replace(/^[=+\-@]+/, '').trim();
    }
  }
  return str;
}

// Format Excel Serial Dates or date strings into YYYY-MM-DD
export function parseDateToIso(val) {
  if (!val) return '';

  // 1. Handle Excel Serial Date Number (e.g. 44561 -> 2022-01-01)
  if (typeof val === 'number' || (!isNaN(val) && String(val).trim() !== '' && !String(val).includes('-') && !String(val).includes('/'))) {
    const serial = Number(val);
    if (serial > 1000 && serial < 80000) {
      // Excel epoch begins Dec 30, 1899 (accounting for leap year 1900 bug)
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const targetDate = new Date(excelEpoch.getTime() + serial * 86400000);
      const y = targetDate.getUTCFullYear();
      const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
      const d = String(targetDate.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  let str = String(val).trim();
  // Strip time part if present
  if (str.includes('T')) str = str.split('T')[0];
  if (str.includes(' ')) str = str.split(' ')[0];

  // 2. Format: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = String(parseInt(ymdMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(ymdMatch[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 3. Format: DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const m = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 4. Fallback Javascript Date Parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
}

// Normalize phone numbers to 10 digits
export function normalizePhone(val) {
  if (!val) return '';
  const digits = String(val).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length > 10 && digits.startsWith('0')) return digits.slice(-10);
  return digits;
}

// Normalize gender
export function normalizeGender(val) {
  if (!val) return '';
  const clean = String(val).trim().toLowerCase();
  if (clean === 'm' || clean === 'male') return 'Male';
  if (clean === 'f' || clean === 'female') return 'Female';
  if (clean === 'o' || clean === 'other') return 'Other';
  return val.trim();
}

// Normalize Blood Group
export function normalizeBloodGroup(val) {
  if (!val) return '';
  const clean = String(val).trim().toUpperCase().replace(/\s+/g, '');
  const lookup = {
    'A+': 'A+', 'APOSITIVE': 'A+', 'A-': 'A-', 'ANEGATIVE': 'A-',
    'B+': 'B+', 'BPOSITIVE': 'B+', 'B-': 'B-', 'BNEGATIVE': 'B-',
    'AB+': 'AB+', 'ABPOSITIVE': 'AB+', 'AB-': 'AB-', 'ABNEGATIVE': 'AB-',
    'O+': 'O+', 'OPOSITIVE': 'O+', 'O-': 'O-', 'ONEGATIVE': 'O-'
  };
  return lookup[clean] || val.trim();
}

// Normalize Category
export function normalizeCategory(val) {
  if (!val) return 'General';
  const clean = String(val).trim().toUpperCase();
  if (clean === 'GEN' || clean === 'GENERAL') return 'General';
  if (clean === 'OBC') return 'OBC';
  if (clean === 'SC') return 'SC';
  if (clean === 'ST') return 'ST';
  if (clean === 'EWS') return 'EWS';
  return val.trim();
}

// Normalize Religion
export function normalizeReligion(val) {
  if (!val) return 'Hinduism';
  const clean = String(val).trim().toLowerCase();
  if (clean.includes('hindu')) return 'Hinduism';
  if (clean.includes('islam') || clean.includes('muslim')) return 'Islam';
  if (clean.includes('christ')) return 'Christianity';
  if (clean.includes('sikh')) return 'Sikhism';
  if (clean.includes('buddh')) return 'Buddhism';
  if (clean.includes('jain')) return 'Jainism';
  return val.trim();
}

// Normalize Class/Grade to match master records
export function matchMasterGrade(rawGrade, existingGrades = []) {
  if (!rawGrade) return '';
  const rawStr = String(rawGrade).trim();
  const cleanWithoutPrefix = rawStr.toUpperCase().replace(/^(GRADE|CLASS|STD|STANDARD)\s*/i, '').trim();
  const romanClean = convertToRoman(cleanWithoutPrefix).toUpperCase();

  // 1. Match with existingGrades (handling prefixes like Grade / Class)
  for (const g of existingGrades) {
    const gName = (g.name || g).trim();
    const gClean = gName.toUpperCase().replace(/^(GRADE|CLASS|STD|STANDARD)\s*/i, '').trim();
    const gRoman = convertToRoman(gClean).toUpperCase();

    if (gName.toUpperCase() === rawStr.toUpperCase()) return gName;
    if (gClean === cleanWithoutPrefix) return gName;
    if (gRoman === romanClean) return gName;
    if (gClean === romanClean || gRoman === cleanWithoutPrefix) return gName;
  }

  // 2. Match with standard early childhood
  if (['NURSERY', 'LKG', 'UKG'].includes(cleanWithoutPrefix)) {
    const match = existingGrades.find(g => (g.name || g).toUpperCase() === cleanWithoutPrefix);
    if (match) return match.name || match;
  }

  // 3. Fallback: return roman conversion or original trimmed
  return convertToRoman(cleanWithoutPrefix) || rawStr;
}

// Validate single student row data
export function validateStudentImportRow(row, index, options = {}) {
  const { existingStudents = [], nonParentEmails = new Set(), activeGrades = [], fileRows = [], useMotherEmailFallback = false } = options;
  const errors = [];
  const warnings = [];

  // Minimum required data per row: first name, last name, date of birth, gender, grade
  const firstName = (row.firstName || '').trim();
  const lastName = (row.lastName || '').trim();
  const dob = row.dob;
  const gender = row.gender;
  const studentClass = row.studentClass;

  if (!firstName) errors.push('First name is required');
  if (!lastName) errors.push('Last name is required');
  if (!dob) errors.push('Date of birth is required');
  if (!gender) errors.push('Gender is required');
  if (!studentClass) errors.push('Grade / Class is required');

  // Validate Date of Birth format
  if (dob) {
    const parsedDob = parseDateToIso(dob);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsedDob)) {
      errors.push(`Invalid Date of Birth format: "${dob}". Accepted: dd-mm-yyyy, yyyy-mm-dd.`);
    } else {
      const birthYear = parseInt(parsedDob.split('-')[0], 10);
      const currYear = new Date().getFullYear();
      if (birthYear < currYear - 30 || birthYear > currYear) {
        warnings.push(`Unusual birth year: ${birthYear}`);
      }
    }
  }

  // Validate Aadhaar if present
  if (row.aadhaarNumber) {
    const cleanAadhaar = String(row.aadhaarNumber).replace(/\s/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      errors.push('Aadhaar number must be exactly 12 digits');
    }
  }

  // Check Grade match against Master Data
  if (studentClass && activeGrades.length > 0) {
    const matched = activeGrades.some(g => {
      const name = (g.name || g).toUpperCase();
      return name === studentClass.toUpperCase() || name === convertToRoman(studentClass).toUpperCase();
    });
    if (!matched) {
      warnings.push(`Grade "${studentClass}" does not match active school grades list`);
    }
  }

  // Validate Parent Email
  let fatherEmail = (row.fatherEmail || '').trim().toLowerCase();
  const motherEmail = (row.motherEmail || '').trim().toLowerCase();

  if (!fatherEmail && useMotherEmailFallback && motherEmail) {
    fatherEmail = motherEmail;
  }

  if (fatherEmail) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fatherEmail)) {
      warnings.push(`Invalid father email format: "${fatherEmail}". Parent login cannot be created with this email.`);
    } else {
      // Check if email belongs to non-parent account (teacher, staff, admin)
      if (nonParentEmails.has(fatherEmail)) {
        errors.push(`Email "${fatherEmail}" belongs to a staff, teacher, or administrative account. Cannot be used for a parent login.`);
      }
    }
  } else {
    warnings.push("Father's email is missing. Student will be imported without an automated parent login.");
  }

  // Validate Phone numbers if present
  if (row.fatherMobile) {
    const normPhone = normalizePhone(row.fatherMobile);
    if (normPhone.length !== 10) {
      warnings.push(`Father mobile "${row.fatherMobile}" is not 10 digits.`);
    }
  }
  if (row.motherMobile) {
    const normPhone = normalizePhone(row.motherMobile);
    if (normPhone.length !== 10) {
      warnings.push(`Mother mobile "${row.motherMobile}" is not 10 digits.`);
    }
  }

  // Duplicate checks against database & intra-file
  const admissionNumber = (row.admissionNumber || '').trim();
  const aadhaarNumber = row.aadhaarNumber ? String(row.aadhaarNumber).replace(/\s/g, '') : '';
  const fatherMobile = row.fatherMobile ? normalizePhone(row.fatherMobile) : '';
  const compositeKey = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${parseDateToIso(dob)}_${fatherMobile}`;

  // 1. Check inside database
  for (const s of existingStudents) {
    if (admissionNumber && s.admissionNumber && s.admissionNumber.toLowerCase() === admissionNumber.toLowerCase()) {
      errors.push(`Admission number "${admissionNumber}" already exists in the system.`);
      break;
    }
    if (aadhaarNumber) {
      const dbAadhaar = s.aadhaarNumber ? decrypt(s.aadhaarNumber).replace(/\s/g, '') : '';
      if (dbAadhaar && dbAadhaar === aadhaarNumber) {
        errors.push(`Aadhaar number "${aadhaarNumber}" already exists for student: ${s.name || s.fullName}.`);
        break;
      }
    }
    if (fatherMobile && dob) {
      const sDob = parseDateToIso(s.dob);
      const sFirst = (s.firstName || (s.name ? s.name.split(' ')[0] : '')).toLowerCase();
      const sLast = (s.lastName || (s.name ? s.name.split(' ').slice(1).join(' ') : '')).toLowerCase();
      const sFatherMobile = s.fatherMobile ? normalizePhone(decrypt(s.fatherMobile)) : '';
      if (sFirst === firstName.toLowerCase() && sLast === lastName.toLowerCase() && sDob === parseDateToIso(dob) && sFatherMobile === fatherMobile) {
        errors.push(`Duplicate student found in database: "${firstName} ${lastName}" (matching name, DOB, and father's mobile).`);
        break;
      }
    }
  }

  // 2. Check inside the file itself (earlier rows)
  for (let i = 0; i < index; i++) {
    const prev = fileRows[i];
    if (!prev) continue;
    if (admissionNumber && prev.admissionNumber && prev.admissionNumber.trim().toLowerCase() === admissionNumber.toLowerCase()) {
      errors.push(`Duplicate admission number "${admissionNumber}" found within the file (Row ${i + 1}).`);
      break;
    }
    if (aadhaarNumber && prev.aadhaarNumber) {
      const prevAadhaar = String(prev.aadhaarNumber).replace(/\s/g, '');
      if (prevAadhaar === aadhaarNumber) {
        errors.push(`Duplicate Aadhaar number "${aadhaarNumber}" found within the file (Row ${i + 1}).`);
        break;
      }
    }
    const prevFirst = (prev.firstName || '').trim().toLowerCase();
    const prevLast = (prev.lastName || '').trim().toLowerCase();
    const prevDob = parseDateToIso(prev.dob);
    const prevFatherMobile = prev.fatherMobile ? normalizePhone(prev.fatherMobile) : '';
    if (fatherMobile && prevFatherMobile && prevFirst === firstName.toLowerCase() && prevLast === lastName.toLowerCase() && prevDob === parseDateToIso(dob) && prevFatherMobile === fatherMobile) {
      errors.push(`Duplicate student row within the file: "${firstName} ${lastName}" (Row ${i + 1}).`);
      break;
    }
  }

  // Check Sibling status
  let isSibling = false;
  if (fatherEmail) {
    // Sibling in DB
    const dbSibling = existingStudents.find(s => {
      const sFatherEmail = s.fatherEmail ? decrypt(s.fatherEmail).toLowerCase().trim() : '';
      const sParentUser = (s.parentUsername || '').toLowerCase().trim();
      return sFatherEmail === fatherEmail || sParentUser === fatherEmail;
    });
    // Sibling earlier in file
    const fileSibling = fileRows.slice(0, index).find(r => {
      return (r.fatherEmail || '').trim().toLowerCase() === fatherEmail;
    });
    if (dbSibling || fileSibling) {
      isSibling = true;
    }
  }

  let status = 'OK';
  if (errors.length > 0) {
    status = 'Error';
  } else if (warnings.length > 0) {
    status = 'Warning';
  }

  return {
    status,
    errors,
    warnings,
    isSibling,
    message: errors.length > 0 ? errors.join('; ') : (warnings.length > 0 ? warnings.join('; ') : 'Valid')
  };
}
