/**
 * Checks if the currently logged in user has the required permission for a specific module and action.
 * 
 * @param {string} module - The ERP module name (e.g. 'students', 'teachers', 'finance')
 * @param {string} action - The action type (e.g. 'view', 'create', 'edit', 'delete', 'approve', 'publish', 'export', 'import', 'manage-settings')
 * @returns {boolean} - True if access is permitted, false otherwise.
 */
const LEGACY_MODULE_MAP = {
  // Core Registers
  'student-directory': 'core-registers',
  'teacher-directory': 'core-registers',
  'staff-directory': 'core-registers',
  'employee-directory': 'core-registers',
  
  // Grade Management
  'grade-settings': 'grade-management',
  'grade-subjects': 'grade-management',
  'grade-management': 'grade-settings',

  // Registry Admissions
  'register-student': 'registry-admissions',
  'add-staff': 'registry-admissions',
  'add-employee': 'registry-admissions',
  'add-teacher': 'registry-admissions',
  'register-teacher': 'registry-admissions',

  // Attendance
  'employee-attendance': 'attendance',
  'attendance-manager': 'attendance',
  'attendance-history': 'attendance',
  
  // Academic Manager
  'class-timetable': 'academic-manager',
  'teacher-timetable': 'academic-manager',
  'exam-timetable': 'academic-manager',
  'published-timetable': 'academic-manager',
  'published-exam': 'academic-manager',
  
  // Academic Activities
  'events': 'academic-activities',
  'notices': 'academic-activities',
  'holidays': 'academic-activities',
  'academic-calendar': 'academic-activities',
  
  // Results Manager
  'results': 'results-manager',
  'results-history': 'results-manager',
  'academic-history': 'results-manager',
  'results-marks-entry': 'results-marks-entry',

  // Payroll and Fees fallback
  'staff-payroll': 'finance',
  'staff-pay-structure': 'finance',
  'teacher-payroll': 'finance',
  'teacher-pay-structure': 'finance',
  'employee-payroll': 'finance',
  'employee-pay-structure': 'finance',
  'payroll-history': 'finance',
  'income': 'finance',
  'fee-structures': 'finance',
  'fee-periods': 'finance',
  'financial-reports': 'finance',
  'auxiliary-income': 'finance',

  // Expenses
  'expense-dashboard': 'expenses',
  'expense-all-expenses': 'expenses',
  'expense-tracker': 'expenses',
  'expense-history': 'expenses'
};

const MATRIX_CONFIGURABLE_MODULES = [
  'overview',
  'student-directory',
  'teacher-directory',
  'staff-directory',
  'employee-directory',
  'grade-management',
  'register-student',
  'register-teacher',
  'add-staff',
  'add-employee',
  'designation-manager',
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
  'results-marks-entry',
  'results-history',
  'finance',
  'expense-dashboard',
  'expense-all-expenses',
  'expense-history',
  'financial-reports',
  'auxiliary-income',
  'roles-permissions',
  'settings'
];

const COMPATIBILITY_MAP = {
  'staff-directory': 'teacher-directory',
  'employee-directory': 'staff-directory',
  'add-staff': 'add-teacher',
  'add-employee': 'add-staff'
};

/**
 * Checks if the currently logged in user has the required permission for a specific module and action.
 * 
 * @param {string} module - The ERP module name (e.g. 'students', 'teachers', 'finance')
 * @param {string} action - The action type (e.g. 'view', 'create', 'edit', 'delete', 'approve', 'publish', 'export', 'import', 'manage-settings')
 * @returns {boolean} - True if access is permitted, false otherwise.
 */
export function hasPermission(module, action) {
  const role = localStorage.getItem('portal_role') || localStorage.getItem('role');
  
  // Developer Admin and Master Admin accounts have absolute system configuration access
  if (
    role === 'Developer Admin' || 
    role === 'Main Admin' || 
    role === 'Admin Dashboard'
  ) {
    return true;
  }

  // Parse permissions from storage
  let permissions = {};
  let overrides = {};
  
  try {
    const rawPermissions = localStorage.getItem('permissions');
    if (rawPermissions) {
      permissions = JSON.parse(rawPermissions);
    }
  } catch (e) {
    console.error('Failed to parse permissions from localStorage:', e);
  }

  try {
    const rawOverrides = localStorage.getItem('overrides');
    if (rawOverrides) {
      overrides = JSON.parse(rawOverrides);
    }
  } catch (e) {
    console.error('Failed to parse overrides from localStorage:', e);
  }

  // 1. Check specific granular module override first (if explicitly defined, respect it directly)
  if (overrides && overrides[module] && overrides[module][action] !== undefined) {
    return Boolean(overrides[module][action]);
  }

  // 2. Check specific granular module permission in permissions matrix
  if (permissions && permissions[module] && permissions[module][action] !== undefined) {
    return Boolean(permissions[module][action]);
  }

  // Compatibility fallback for renamed modules (e.g. staff-directory -> teacher-directory)
  const compatModule = COMPATIBILITY_MAP[module];
  if (compatModule) {
    if (overrides && overrides[compatModule] && overrides[compatModule][action] !== undefined) {
      return Boolean(overrides[compatModule][action]);
    }
    if (permissions && permissions[compatModule] && permissions[compatModule][action] !== undefined) {
      return Boolean(permissions[compatModule][action]);
    }
  }

  // 3. Fallback to legacy/unified module override or permission
  const legacyModule = LEGACY_MODULE_MAP[module];
  if (legacyModule) {
    if (overrides && overrides[legacyModule] && overrides[legacyModule][action] !== undefined) {
      return Boolean(overrides[legacyModule][action]);
    }
    if (permissions && permissions[legacyModule] && permissions[legacyModule][action] !== undefined) {
      return Boolean(permissions[legacyModule][action]);
    }
  }

  // Always permit overview dashboard for logged-in users
  if ((module === 'overview' || module === 'dashboard') && action === 'view') {
    return true;
  }

  // Teacher role built-in view access for teaching & academic modules
  const userType = localStorage.getItem('userType');
  if (role === 'Teacher' || userType === 'Teacher') {
    const teacherAllowedModules = [
      'overview', 'dashboard', 'class-timetable', 'teacher-timetable',
      'published-timetable', 'published-exam', 'exam-timetable',
      'academic-manager', 'academic-calendar', 'academic-activities',
      'events', 'notices', 'holidays', 'results', 'results-manager',
      'results-marks-entry', 'student-directory', 'teacher-directory',
      'attendance', 'teacher-leave', 'teacher-work-report'
    ];
    if (action === 'view' && teacherAllowedModules.includes(module)) {
      return true;
    }
  }

  // Receptionist role built-in view access
  if (role === 'Receptionist') {
    const receptionistAllowedModules = [
      'overview', 'dashboard', 'student-directory', 'teacher-directory',
      'staff-directory', 'employee-directory', 'register-student',
      'register-teacher', 'add-staff', 'add-employee', 'designation-manager'
    ];
    if (receptionistAllowedModules.includes(module)) {
      return true;
    }
  }

  // Default to access denied for security (if not explicitly granted in the matrix, denied)
  return false;
}

/**
 * Checks if the logged in user is a Super Admin (Main Admin, Admin Dashboard, or Developer Admin)
 * @returns {boolean}
 */
export function isSuperAdmin() {
  const role = localStorage.getItem('portal_role') || localStorage.getItem('role');
  return role === 'Developer Admin' || role === 'Main Admin' || role === 'Admin Dashboard';
}
