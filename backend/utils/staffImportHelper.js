/**
 * Staff Bulk Import Helper
 * Utilities for column aliasing, data sanitization, date normalization,
 * duplicate detection, department/designation matching, and Staff ID reservation.
 */

import { decrypt } from './encryptionHelper.js';

// Standard supported fields metadata for Staff Bulk Import
export const STAFF_FIELD_DEFINITIONS = [
  {
    key: 'fullName',
    label: 'Full Name',
    required: true,
    aliases: ['full name', 'fullname', 'staff name', 'name', 'employee name', 'faculty name']
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
    key: 'joiningDate',
    label: 'Joining Date',
    required: false,
    aliases: ['joining date', 'date of joining', 'doj', 'join date', 'appointment date']
  },
  {
    key: 'department',
    label: 'Department',
    required: false,
    aliases: ['department', 'dept', 'division', 'wing']
  },
  {
    key: 'designation',
    label: 'Designation',
    required: false,
    aliases: ['designation', 'position', 'role', 'post', 'job title']
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
    key: 'bloodGroup',
    label: 'Blood Group',
    required: false,
    aliases: ['blood group', 'bloodgroup', 'blood']
  },
  {
    key: 'nationality',
    label: 'Nationality',
    required: false,
    aliases: ['nationality', 'country']
  },
  {
    key: 'maritalStatus',
    label: 'Marital Status',
    required: false,
    aliases: ['marital status', 'maritalstatus', 'marriage status']
  },
  {
    key: 'address',
    label: 'Address',
    required: false,
    aliases: ['address', 'current address', 'residence', 'residential address', 'street', 'permanent address']
  },
  {
    key: 'alternateMobile',
    label: 'Alternate Mobile',
    required: false,
    aliases: ['alternate mobile', 'secondary mobile', 'alternate phone', 'emergency phone']
  }
];

/**
 * Match a spreadsheet header string against standard field definitions
 */
export function matchHeaderToField(header) {
  if (!header) return null;
  const clean = String(header).toLowerCase().trim().replace(/[\*:]/g, '');
  for (const def of STAFF_FIELD_DEFINITIONS) {
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
 * Normalize phone number: strip non-digits, keep last 10 digits
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Normalize gender value to standard Male, Female, Other
 */
export function normalizeGender(gender) {
  if (!gender) return 'Male';
  const clean = String(gender).trim().toLowerCase();
  if (clean.startsWith('m')) return 'Male';
  if (clean.startsWith('f')) return 'Female';
  return 'Other';
}

/**
 * Split Full Name into First Name, Middle Name, Last Name
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
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const middleName = parts.slice(1, -1).join(' ');
  return { firstName, middleName, lastName };
}

/**
 * Validate an individual staff import row against rules and duplicates
 */
export function validateStaffImportRow(row, rowIndex, existingStaff = [], pendingStaging = [], seenInFile = { mobiles: new Set(), emails: new Set() }, departmentsList = [], designationsList = []) {
  const errors = [];
  const warnings = [];
  let isDuplicate = false;

  // 1. Full Name (Required)
  if (!row.fullName || String(row.fullName).trim().length === 0) {
    errors.push('Full Name is required');
  } else if (String(row.fullName).trim().length < 2) {
    errors.push('Full Name must have at least 2 characters');
  }

  // 2. Mobile validation and duplicate checks
  if (row.mobile) {
    const cleanPhone = normalizePhone(row.mobile);
    if (cleanPhone.length !== 10) {
      errors.push(`Mobile must be exactly 10 digits (found: "${row.mobile}")`);
    } else {
      row.mobile = cleanPhone;

      // Duplicate in same file
      if (seenInFile.mobiles.has(cleanPhone)) {
        errors.push(`Duplicate mobile number in this file (${cleanPhone})`);
        isDuplicate = true;
      } else {
        seenInFile.mobiles.add(cleanPhone);
      }

      // Duplicate against existing active staff
      const existsInStaff = existingStaff.some(s => {
        let decPhone = s.phone || s.mobile || '';
        if (decPhone && decPhone.includes(':')) {
          try { decPhone = decrypt(decPhone); } catch (e) {}
        }
        return normalizePhone(decPhone) === cleanPhone;
      });
      if (existsInStaff) {
        errors.push(`Mobile ${cleanPhone} already registered for an existing staff member`);
        isDuplicate = true;
      }

      // Duplicate against pending staging staff
      const existsInPending = pendingStaging.some(p => {
        let decPhone = p.mobile || '';
        if (decPhone && decPhone.includes(':')) {
          try { decPhone = decrypt(decPhone); } catch (e) {}
        }
        return normalizePhone(decPhone) === cleanPhone;
      });
      if (existsInPending) {
        errors.push(`Mobile ${cleanPhone} already in pending staff setup`);
        isDuplicate = true;
      }
    }
  }

  // 3. Email validation and duplicate checks
  if (row.email) {
    const cleanEmail = String(row.email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      errors.push(`Invalid email format: "${row.email}"`);
    } else {
      row.email = cleanEmail;

      // Duplicate in same file
      if (seenInFile.emails.has(cleanEmail)) {
        errors.push(`Duplicate email in this file (${cleanEmail})`);
        isDuplicate = true;
      } else {
        seenInFile.emails.add(cleanEmail);
      }

      // Duplicate against existing staff
      const existsInStaff = existingStaff.some(s => {
        let decEmail = s.email || '';
        if (decEmail && decEmail.includes(':')) {
          try { decEmail = decrypt(decEmail); } catch (e) {}
        }
        return (decEmail || '').trim().toLowerCase() === cleanEmail;
      });
      if (existsInStaff) {
        errors.push(`Email ${cleanEmail} already registered for an existing staff member`);
        isDuplicate = true;
      }

      // Duplicate against pending staging
      const existsInPending = pendingStaging.some(p => {
        let decEmail = p.email || '';
        if (decEmail && decEmail.includes(':')) {
          try { decEmail = decrypt(decEmail); } catch (e) {}
        }
        return (decEmail || '').trim().toLowerCase() === cleanEmail;
      });
      if (existsInPending) {
        errors.push(`Email ${cleanEmail} already in pending staff setup`);
        isDuplicate = true;
      }
    }
  }

  // 4. Gender
  if (row.gender) {
    row.gender = normalizeGender(row.gender);
  } else {
    row.gender = 'Male';
  }

  // 5. Date of Birth
  if (row.dob) {
    const isoDob = parseDateToIso(row.dob);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDob)) {
      errors.push(`Invalid Date of Birth format: "${row.dob}". Accepted: YYYY-MM-DD or DD-MM-YYYY`);
    } else {
      row.dob = isoDob;
    }
  }

  // 6. Joining Date
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

  // 7. Experience
  if (row.experience) {
    const cleanExp = String(row.experience).replace(/[^0-9.]/g, '');
    row.experience = cleanExp || '0';
  } else {
    row.experience = '0';
  }

  // 8. Department check
  const rawDept = (row.department || '').trim();
  if (rawDept) {
    const matchedDept = departmentsList.find(d => 
      (d.name || '').trim().toLowerCase() === rawDept.toLowerCase()
    );
    if (matchedDept) {
      row.department = matchedDept.name;
    } else {
      row._unmatchedDepartment = rawDept;
      warnings.push(`Department "${rawDept}" not found in school's department list`);
    }
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
      row._unmatchedDesignation = rawDesig;
      warnings.push(`Designation "${rawDesig}" not found in school's designation master list`);
    }
  } else {
    row.designation = 'Staff';
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
 * Reserve sequential Staff IDs (STF-YYYY-XXXX) without colliding with
 * main staff table or existing rows in staff staging.
 */
export function reserveStaffIds(count, existingStaff = [], pendingStaging = [], currentYear = 2026) {
  const prefix = 'STF';
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

  existingStaff.forEach(s => extractMax(s.employeeId || s.id));
  pendingStaging.forEach(p => extractMax(p.staff_id || p.staffId));

  const reserved = [];
  for (let i = 1; i <= count; i++) {
    maxNum += 1;
    reserved.push(`${yearPrefix}${maxNum}`);
  }
  return reserved;
}
