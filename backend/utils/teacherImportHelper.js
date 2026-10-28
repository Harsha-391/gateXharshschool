/**
 * Teacher Bulk Import Helper
 * Utilities for column aliasing, data sanitization, date normalization,
 * duplicate detection, designation matching, and Teacher ID reservation.
 */

import { decrypt } from './encryptionHelper.js';

// Standard supported fields metadata for Teacher Bulk Import
export const TEACHER_FIELD_DEFINITIONS = [
  {
    key: 'fullName',
    label: 'Full Name',
    required: true,
    aliases: ['full name', 'fullname', 'teacher name', 'name', 'faculty name', 'staff name']
  },
  {
    key: 'mobile',
    label: 'Mobile Number',
    required: false,
    aliases: ['mobile', 'mobile number', 'phone', 'phone number', 'contact', 'contact number', 'mobile no', 'cell']
  },
  {
    key: 'email',
    label: 'Email Address',
    required: false,
    aliases: ['email', 'email address', 'mail', 'email id', 'e-mail']
  },
  {
    key: 'qualification',
    label: 'Qualification',
    required: false,
    aliases: ['qualification', 'highest qualification', 'education', 'degree', 'qualifications']
  },
  {
    key: 'experience',
    label: 'Experience (years)',
    required: false,
    aliases: ['experience (years)', 'experience', 'total experience', 'exp', 'years of experience', 'experience years']
  },
  {
    key: 'subjects',
    label: 'Subjects',
    required: true,
    aliases: ['subjects', 'subject', 'primary subject', 'teaching subject', 'specialization', 'subject specialization']
  },
  {
    key: 'joiningDate',
    label: 'Joining Date',
    required: false,
    aliases: ['joining date', 'date of joining', 'doj', 'join date', 'appointment date']
  },
  {
    key: 'designation',
    label: 'Designation',
    required: false,
    aliases: ['designation', 'position', 'role', 'post', 'job title']
  },
  {
    key: 'gender',
    label: 'Gender',
    required: false,
    aliases: ['gender', 'sex']
  },
  {
    key: 'dob',
    label: 'Date of Birth',
    required: false,
    aliases: ['dob', 'date of birth', 'birth date', 'birthdate']
  },
  {
    key: 'address',
    label: 'Address',
    required: false,
    aliases: ['address', 'current address', 'residence', 'residential address', 'street']
  }
];

/**
 * Match a spreadsheet header string against standard field definitions
 */
export function matchHeaderToField(header) {
  if (!header) return null;
  const clean = String(header).toLowerCase().trim().replace(/[\*:]/g, '');
  for (const def of TEACHER_FIELD_DEFINITIONS) {
    if (def.key.toLowerCase() === clean || def.label.toLowerCase() === clean) {
      return def.key;
    }
    if (def.aliases.some(alias => alias.toLowerCase() === clean)) {
      return def.key;
    }
  }
  return null;
}

/**
 * Prevent CSV/Excel formula injection by stripping dangerous initial characters
 */
export function sanitizeCellValue(val) {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  while (/^[=+@\-\t\r]/.test(str)) {
    str = str.substring(1).trim();
  }
  return str;
}

/**
 * Normalize diverse date formats to standard ISO YYYY-MM-DD
 */
export function parseDateToIso(dateVal) {
  if (!dateVal) return '';
  if (dateVal instanceof Date) {
    if (!isNaN(dateVal.getTime())) {
      return dateVal.toISOString().split('T')[0];
    }
    return '';
  }

  // Check Excel serial date number
  if (typeof dateVal === 'number' || (!isNaN(dateVal) && String(dateVal).trim().length <= 6)) {
    const serial = Number(dateVal);
    if (serial > 1000 && serial < 100000) {
      const utcDays = Math.floor(serial - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      return dateInfo.toISOString().split('T')[0];
    }
  }

  const str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return str;
}

/**
 * Normalize phone numbers to clean 10-digit format
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/**
 * Normalize gender to standard capitalized form
 */
export function normalizeGender(val) {
  if (!val) return 'Male';
  const clean = String(val).trim().toLowerCase();
  if (clean.startsWith('f') || clean === 'woman' || clean === 'girl') return 'Female';
  if (clean.startsWith('m') || clean === 'man' || clean === 'boy') return 'Male';
  return 'Other';
}

/**
 * Parse full name into firstName, middleName, and lastName
 */
export function splitFullName(fullName) {
  if (!fullName) return { firstName: '', middleName: '', lastName: '' };
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', lastName: '' };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: '', lastName: parts[1] };
  }
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1]
  };
}

/**
 * Validate an individual teacher row from the uploaded spreadsheet
 */
export function validateTeacherImportRow(row, rowIndex, options = {}) {
  const {
    existingTeachers = [],
    pendingStaging = [],
    designationsList = [],
    seenPhones = new Set(),
    seenEmails = new Set()
  } = options;

  const errors = [];
  const warnings = [];
  let isDuplicate = false;

  // 1. Full Name (Required)
  const fullName = (row.fullName || row.name || '').trim();
  if (!fullName) {
    errors.push('Full Name is required');
  }

  // 2. Subjects (Required)
  const subjects = (row.subjects || row.primarySubject || '').trim();
  if (!subjects) {
    errors.push('Subjects is required');
  }

  // 3. Mobile Number (Optional, but validated for format & duplicates if provided)
  const rawMobile = row.mobile ? String(row.mobile).trim() : '';
  if (rawMobile) {
    const cleanMobile = normalizePhone(rawMobile);
    if (!/^\d{10}$/.test(cleanMobile)) {
      errors.push(`Invalid mobile number "${rawMobile}". Must be exactly 10 digits`);
    } else {
      row.mobile = cleanMobile;

      // Duplicate check: within the same uploaded file
      if (seenPhones.has(cleanMobile)) {
        errors.push(`Duplicate mobile number "${cleanMobile}" found multiple times in uploaded file`);
        isDuplicate = true;
      } else {
        seenPhones.add(cleanMobile);
      }

      // Duplicate check: against main teachers table
      const existsInMain = existingTeachers.some(t => {
        const phone = normalizePhone(decrypt(t.phone || t.mobile || ''));
        return phone === cleanMobile;
      });
      if (existsInMain) {
        errors.push(`Mobile number "${cleanMobile}" already registered in main Teacher Directory`);
        isDuplicate = true;
      }

      // Duplicate check: against pending staging list
      const existsInPending = pendingStaging.some(s => {
        const phone = normalizePhone(decrypt(s.mobile || ''));
        return phone === cleanMobile;
      });
      if (existsInPending) {
        errors.push(`Mobile number "${cleanMobile}" already exists in Pending Setup list`);
        isDuplicate = true;
      }
    }
  }

  // 4. Email Address (Optional, validated format & duplicates if provided)
  const rawEmail = row.email ? String(row.email).trim().toLowerCase() : '';
  if (rawEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      errors.push(`Invalid email address format: "${rawEmail}"`);
    } else {
      row.email = rawEmail;

      // Duplicate check: within uploaded file
      if (seenEmails.has(rawEmail)) {
        errors.push(`Duplicate email "${rawEmail}" found multiple times in uploaded file`);
        isDuplicate = true;
      } else {
        seenEmails.add(rawEmail);
      }

      // Duplicate check: against main teachers table
      const existsInMain = existingTeachers.some(t => {
        const email = (decrypt(t.email || '')).trim().toLowerCase();
        return email === rawEmail;
      });
      if (existsInMain) {
        errors.push(`Email "${rawEmail}" already registered in main Teacher Directory`);
        isDuplicate = true;
      }

      // Duplicate check: against pending staging list
      const existsInPending = pendingStaging.some(s => {
        const email = (decrypt(s.email || '')).trim().toLowerCase();
        return email === rawEmail;
      });
      if (existsInPending) {
        errors.push(`Email "${rawEmail}" already exists in Pending Setup list`);
        isDuplicate = true;
      }
    }
  }

  // 5. Gender
  if (row.gender) {
    row.gender = normalizeGender(row.gender);
  } else {
    row.gender = 'Male';
  }

  // 6. Date of Birth
  if (row.dob) {
    const isoDob = parseDateToIso(row.dob);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDob)) {
      errors.push(`Invalid Date of Birth format: "${row.dob}". Accepted: YYYY-MM-DD or DD-MM-YYYY`);
    } else {
      row.dob = isoDob;
    }
  }

  // 7. Joining Date
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

  // 8. Experience
  if (row.experience) {
    const cleanExp = String(row.experience).replace(/[^0-9.]/g, '');
    row.experience = cleanExp || '0';
  } else {
    row.experience = '0';
  }

  // 9. Designation check
  let matchedDesignation = null;
  const rawDesig = (row.designation || '').trim();
  if (rawDesig) {
    matchedDesignation = designationsList.find(d => 
      (d.name || '').trim().toLowerCase() === rawDesig.toLowerCase()
    );
    if (matchedDesignation) {
      row.designation = matchedDesignation.name;
      row.designationId = matchedDesignation.id;
    } else {
      // Flag as unmatched designation for interactive resolution
      row._unmatchedDesignation = rawDesig;
      warnings.push(`Designation "${rawDesig}" not found in school's designation master list`);
    }
  } else {
    row.designation = 'Teacher';
    row.designationId = '';
  }

  const status = errors.length > 0 ? (isDuplicate ? 'Duplicate' : 'Error') : 'Valid';

  return {
    rowIndex,
    status,
    errors,
    warnings,
    isDuplicate,
    message: errors.length > 0 ? errors.join(', ') : (warnings.length > 0 ? warnings.join(', ') : 'Valid')
  };
}

/**
 * Reserve sequential Teacher IDs (TCH-YYYY-XXXX) without colliding with
 * main teachers table or existing rows in staging.
 */
export function reserveTeacherIds(count, existingTeachers = [], pendingStaging = [], currentYear = 2026) {
  const prefix = 'TCH';
  const yearPrefix = `${prefix}-${currentYear}-`;
  let maxNum = 1000;

  const extractMax = (id) => {
    if (typeof id === 'string' && id.startsWith(yearPrefix)) {
      const suffixNum = parseInt(id.replace(yearPrefix, ''), 10);
      if (!isNaN(suffixNum) && suffixNum > maxNum) {
        maxNum = suffixNum;
      }
    }
  };

  existingTeachers.forEach(t => extractMax(t.employeeId || t.id));
  pendingStaging.forEach(s => extractMax(s.teacher_id || s.teacherId));

  const reserved = [];
  for (let i = 1; i <= count; i++) {
    maxNum += 1;
    reserved.push(`${yearPrefix}${maxNum}`);
  }
  return reserved;
}
