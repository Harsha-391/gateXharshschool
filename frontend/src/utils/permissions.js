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
  
  // Grade Management
  'grade-settings': 'grade-management',
  'grade-subjects': 'grade-management',

  // Registry Admissions
  'register-student': 'registry-admissions',
  'add-staff': 'registry-admissions',
  'add-employee': 'registry-admissions',
  'add-teacher': 'registry-admissions',

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

  // Expenses
  'expense-dashboard': 'expenses',
  'expense-all-expenses': 'expenses',
  'expense-tracker': 'expenses',
  'expense-history': 'expenses'
};

/**
 * Checks if the currently logged in user has the required permission for a specific module and action.
 * 
 * @param {string} module - The ERP module name (e.g. 'students', 'teachers', 'finance')
 * @param {string} action - The action type (e.g. 'view', 'create', 'edit', 'delete', 'approve', 'publish', 'export', 'import', 'manage-settings')
 * @returns {boolean} - True if access is permitted, false otherwise.
 */
export function hasPermission(module, action) {
  const role = sessionStorage.getItem('portal_role') || sessionStorage.getItem('role');
  
  // Developer Admin and Super Admins (Main Admin, Admin Dashboard, Principal) have absolute access
  if (
    role === 'Developer Admin' || 
    role === 'Main Admin' || 
    role === 'Admin Dashboard' ||
    role === 'Principal'
  ) {
    return true;
  }

  // Parse permissions from session storage
  let permissions = {};
  let overrides = {};
  
  try {
    const rawPermissions = sessionStorage.getItem('permissions');
    if (rawPermissions) {
      permissions = JSON.parse(rawPermissions);
    }
  } catch (e) {
    console.error('Failed to parse permissions from sessionStorage:', e);
  }

  try {
    const rawOverrides = sessionStorage.getItem('overrides');
    if (rawOverrides) {
      overrides = JSON.parse(rawOverrides);
    }
  } catch (e) {
    console.error('Failed to parse overrides from sessionStorage:', e);
  }

  // 1. Check specific granular module override first (takes priority)
  if (overrides && overrides[module] && overrides[module][action] !== undefined) {
    return !!overrides[module][action];
  }

  // 2. Check specific granular module permission
  if (permissions && permissions[module] && permissions[module][action] !== undefined) {
    return !!permissions[module][action];
  }

  // 3. Fallback to legacy/unified module override or permission
  const legacyModule = LEGACY_MODULE_MAP[module];
  if (legacyModule) {
    if (overrides && overrides[legacyModule] && overrides[legacyModule][action] !== undefined) {
      return !!overrides[legacyModule][action];
    }
    if (permissions && permissions[legacyModule] && permissions[legacyModule][action] !== undefined) {
      return !!permissions[legacyModule][action];
    }
  }

  // Default to access denied for security
  return false;
}

/**
 * Checks if the logged in user is a Super Admin (Main Admin, Admin Dashboard, Developer Admin, or Principal)
 * @returns {boolean}
 */
export function isSuperAdmin() {
  const role = sessionStorage.getItem('portal_role') || sessionStorage.getItem('role');
  return role === 'Developer Admin' || role === 'Main Admin' || role === 'Admin Dashboard' || role === 'Principal';
}
