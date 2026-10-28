/**
 * Central Navigation & Route Mapping Utility
 * Handles role-prefixed route mappings, view conversions, and permission guards.
 */

import { hasPermission, isSuperAdmin } from './permissions';

export const ROLE_PREFIX_MAP = {
  'developer admin': 'platform',
  'platform owner': 'platform',
  'main admin': 'admin',
  'school admin': 'admin',
  'principal': 'admin',
  'admin dashboard': 'admin',
  'admin': 'admin',
  'master admin': 'admin',
  'academic coordinator': 'academic',
  'academic-coordinator': 'academic',
  'academic_coordinator': 'academic',
  'academic manager': 'academic',
  'academic incharge': 'academic',
  'academic head': 'academic',
  'academic': 'academic',
  'teacher': 'teacher',
  'accountant': 'accountant',
  'receptionist': 'receptionist',
  'staff': 'staff',
  'employee': 'staff',
  'parent': 'parent',
  'student': 'student'
};

export const VALID_ROLE_PREFIXES = [
  'platform',
  'admin',
  'academic',
  'academic-coordinator',
  'academic_coordinator',
  'teacher',
  'accountant',
  'receptionist',
  'staff',
  'parent',
  'student'
];

export const getRolePrefix = (role) => {
  if (!role) return 'admin';
  const r = String(role).trim().toLowerCase();
  if (ROLE_PREFIX_MAP[r]) return ROLE_PREFIX_MAP[r];
  if (r.includes('academic') || r.includes('coordinator')) return 'academic';
  if (r.includes('teacher')) return 'teacher';
  if (r.includes('accountant')) return 'accountant';
  if (r.includes('receptionist')) return 'receptionist';
  if (r.includes('staff') || r.includes('employee')) return 'staff';
  if (r.includes('parent')) return 'parent';
  if (r.includes('student')) return 'student';
  if (r.includes('developer') || r.includes('platform')) return 'platform';
  return 'admin';
};

// Map URL slug (screenName) to component view ID for AdminPanel / Panels
export const SCREEN_TO_VIEW = {
  'dashboard': 'overview',
  'overview': 'overview',
  'student-directory': 'students',
  'students': 'students',
  'teacher-directory': 'teachers',
  'teachers': 'teachers',
  'staff-directory': 'staff',
  'staff': 'staff',
  'employee-directory': 'employees',
  'employees': 'employees',
  'register-student': 'register-student',
  'register-teacher': 'register-teacher',
  'register-staff': 'add-staff',
  'add-staff': 'add-staff',
  'register-employee': 'add-employee',
  'add-employee': 'add-employee',
  'grade-management': 'grade-list',
  'grade-list': 'grade-list',
  'student-manager': 'student-manager',
  'designation-manager': 'designation-manage',
  'designation-manage': 'designation-manage',
  'leave-management': 'leave-management',
  'my-leave': 'my-leave',
  'work-reports': 'report-management',
  'report-management': 'report-management',
  'my-reports': 'my-reports',
  'academic-manager': 'academic-manager',
  'published-timetable': 'academic-published-timetable',
  'academic-published-timetable': 'academic-published-timetable',
  'published-exam': 'academic-published-exam',
  'academic-published-exam': 'academic-published-exam',
  'academic-activities': 'academic-activities',
  'academic-calendar': 'academic-calendar',
  'results-manager': 'results-manager',
  'marks-entry': 'results-marks-entry',
  'results-marks-entry': 'results-marks-entry',
  'academic-history': 'results-history',
  'results-history': 'results-history',
  'employee-attendance': 'employee-attendance',
  'my-attendance': 'employee-attendance',
  'student-attendance': 'attendance',
  'attendance': 'attendance',
  'student-attendance-history': 'attendance-history',
  'attendance-history': 'attendance-history',
  'collect-fees': 'collect-fees',
  'fee-structure': 'fee-structure',
  'fees-history': 'fees-history',
  'staff-payroll': 'staff-payroll-hub',
  'staff-payroll-hub': 'staff-payroll-hub',
  'teacher-payroll': 'teacher-payroll-hub',
  'teacher-payroll-hub': 'teacher-payroll-hub',
  'employee-payroll': 'employee-payroll-hub',
  'employee-payroll-hub': 'employee-payroll-hub',
  'payroll-history': 'payroll-history',
  'expenses': 'expense-dashboard',
  'expense-dashboard': 'expense-dashboard',
  'auxiliary-income': 'auxiliary-income',
  'financial-reports': 'reports',
  'reports': 'reports',
  'roles-permissions': 'roles-permissions',
  'settings': 'settings',
  'profile': 'profile',
  'schools': 'school',
  'school': 'school',
  'plans': 'plans',
  'children': 'children'
};

// Map internal component view ID to URL slug (screenName)
export const VIEW_TO_SCREEN = {
  'overview': 'dashboard',
  'dashboard': 'dashboard',
  'students': 'student-directory',
  'student-directory': 'student-directory',
  'teachers': 'teacher-directory',
  'teacher-directory': 'teacher-directory',
  'staff': 'staff-directory',
  'staff-directory': 'staff-directory',
  'employees': 'employee-directory',
  'employee-directory': 'employee-directory',
  'register-student': 'register-student',
  'register-teacher': 'register-teacher',
  'add-staff': 'register-staff',
  'register-staff': 'register-staff',
  'add-employee': 'register-employee',
  'register-employee': 'register-employee',
  'grade-management': 'grade-management',
  'grade-list': 'grade-management',
  'add-grade': 'grade-management',
  'grade-departments': 'grade-management',
  'grade-dept-mapping': 'grade-management',
  'grade-academic-settings': 'grade-management',
  'academic-grade-subjects': 'grade-management',
  'student-manager': 'student-manager',
  'designation-manage': 'designation-manager',
  'designation-manager': 'designation-manager',
  'leave-management': 'leave-management',
  'my-leave': 'my-leave',
  'report-management': 'work-reports',
  'work-reports': 'work-reports',
  'my-reports': 'my-reports',
  'academic-manager': 'academic-manager',
  'academic-class-timetable': 'academic-manager',
  'academic-exams': 'academic-manager',
  'academic-exams-history': 'academic-manager',
  'academic-published-timetable': 'published-timetable',
  'published-timetable': 'published-timetable',
  'academic-published-exam': 'published-exam',
  'published-exam': 'published-exam',
  'academic-activities': 'academic-activities',
  'academic-events': 'academic-activities',
  'academic-notices': 'academic-activities',
  'academic-holidays': 'academic-activities',
  'academic-calendar': 'academic-calendar',
  'results-manager': 'results-manager',
  'results-analytics': 'results-manager',
  'results-report-cards': 'results-manager',
  'academic-results': 'results-manager',
  'results-marks-entry': 'marks-entry',
  'marks-entry': 'marks-entry',
  'results-history': 'academic-history',
  'academic-history': 'academic-history',
  'employee-attendance': 'employee-attendance',
  'attendance': 'student-attendance',
  'student-attendance': 'student-attendance',
  'attendance-history': 'student-attendance-history',
  'student-attendance-history': 'student-attendance-history',
  'collect-fees': 'collect-fees',
  'fee-structure': 'fee-structure',
  'fees-history': 'fees-history',
  'staff-payroll-hub': 'staff-payroll',
  'staff-payroll': 'staff-payroll',
  'staff-pay-structure': 'staff-payroll',
  'teacher-payroll-hub': 'teacher-payroll',
  'teacher-payroll': 'teacher-payroll',
  'teacher-pay-structure': 'teacher-payroll',
  'employee-payroll-hub': 'employee-payroll',
  'employee-payroll': 'employee-payroll',
  'employee-pay-structure': 'employee-payroll',
  'payroll-history': 'payroll-history',
  'expenses': 'expenses',
  'expense-dashboard': 'expenses',
  'expense-all-expenses': 'expenses',
  'expense-tracker': 'expenses',
  'expense-history': 'expenses',
  'auxiliary-income': 'auxiliary-income',
  'reports': 'financial-reports',
  'financial-reports': 'financial-reports',
  'roles-permissions': 'roles-permissions',
  'settings': 'settings',
  'profile': 'profile',
  'school': 'schools',
  'plans': 'plans'
};

// Generates role-prefixed route URL for any view
export const getRouteForView = (viewId, role) => {
  const prefix = getRolePrefix(role);
  
  if (prefix === 'parent') {
    const parentTab = viewId === 'children' || viewId === 'overview' || viewId === 'students' || viewId === 'dashboard' ? 'dashboard' : viewId;
    return `/parent/${parentTab}`;
  }

  if (prefix === 'platform') {
    const platTab = viewId === 'school' ? 'schools' : (viewId === 'plans' ? 'plans' : (viewId === 'profile' ? 'profile' : 'dashboard'));
    return `/platform/${platTab}`;
  }

  // Role-specific slug customization for attendance
  if (viewId === 'employee-attendance') {
    if (prefix === 'teacher') return '/teacher/my-attendance';
    if (prefix === 'accountant') return '/accountant/my-attendance';
    if (prefix === 'staff') return '/staff/attendance';
    return `/${prefix}/employee-attendance`;
  }

  const screen = VIEW_TO_SCREEN[viewId] || viewId;
  return `/${prefix}/${screen}`;
};

// Converts URL slug to view ID with role-awareness
export const getViewFromSlug = (slug, role) => {
  const prefix = getRolePrefix(role);
  if (prefix === 'parent') {
    if (slug === 'dashboard' || slug === 'children' || slug === 'students') {
      return 'children';
    }
  }
  if (slug === 'attendance' && prefix === 'staff') {
    return 'employee-attendance';
  }
  if (slug === 'my-attendance' && (prefix === 'teacher' || prefix === 'accountant')) {
    return 'employee-attendance';
  }
  return SCREEN_TO_VIEW[slug] || slug;
};

// Checks if slug is recognized
export const isValidScreenSlug = (slug, rolePrefix) => {
  if (!slug) return false;
  if (rolePrefix === 'parent') {
    return ['dashboard', 'children', 'students', 'attendance', 'results', 'timetable', 'fees', 'notices', 'settings'].includes(slug);
  }
  if (rolePrefix === 'platform') {
    return ['dashboard', 'schools', 'plans', 'profile'].includes(slug);
  }
  return !!SCREEN_TO_VIEW[slug];
};

// Evaluates whether current user has permission to access the screen
export const canAccessScreen = (screenName, role, userProfile) => {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  if (['developer admin', 'platform owner', 'main admin', 'admin dashboard', 'principal', 'school admin', 'master admin'].includes(r)) {
    return true; // Super / School admins have full dashboard access
  }

  const viewId = getViewFromSlug(screenName, role);

  // Overview and Profile are accessible to all authenticated users
  if (viewId === 'overview' || viewId === 'dashboard' || viewId === 'profile' || viewId === 'my-leave' || viewId === 'my-reports') {
    return true;
  }

  // Teacher specific class-teacher restrictions
  const isTeacher = r === 'teacher' || userProfile?.userType === 'Teacher';
  const isClassTeacher = userProfile?.isClassTeacher === true || userProfile?.isClassTeacher === 'Yes' || userProfile?.isClassTeacher === 1;
  if (isTeacher && !isClassTeacher) {
    if (['attendance', 'attendance-history', 'results-manager', 'results-marks-entry', 'results-history'].includes(viewId)) {
      return false;
    }
  }

  // Module permission checks
  const permissionMap = {
    'students': { module: 'student-directory', action: 'view' },
    'teachers': { module: 'teacher-directory', action: 'view' },
    'staff': { module: 'staff-directory', action: 'view' },
    'employees': { module: 'employee-directory', action: 'view' },
    'register-student': { module: 'register-student', action: 'create' },
    'register-teacher': { module: 'register-teacher', action: 'create' },
    'add-staff': { module: 'add-staff', action: 'create' },
    'add-employee': { module: 'add-employee', action: 'create' },
    'grade-management': { module: 'grade-management', action: 'view' },
    'grade-list': { module: 'grade-management', action: 'view' },
    'student-manager': { module: 'student-manager', action: 'view' },
    'designation-manage': { module: 'designation-manager', action: 'view' },
    'leave-management': { module: 'teacher-leave-management', action: 'view' },
    'report-management': { module: 'report-management', action: 'view' },
    'academic-manager': { module: 'academic-manager', action: 'view' },
    'academic-published-timetable': { module: 'published-timetable', action: 'view' },
    'academic-published-exam': { module: 'published-exam', action: 'view' },
    'academic-activities': { module: 'academic-activities', action: 'view' },
    'academic-calendar': { module: 'academic-calendar', action: 'view' },
    'results-manager': { module: 'results-manager', action: 'view' },
    'results-marks-entry': { module: 'results-marks-entry', action: 'view' },
    'results-history': { module: 'results-history', action: 'view' },
    'employee-attendance': { module: 'employee-attendance', action: 'view' },
    'attendance': { module: 'attendance', action: 'view' },
    'attendance-history': { module: 'attendance-history', action: 'view' },
    'collect-fees': { module: 'finance', action: 'view' },
    'fee-structure': { module: 'finance', action: 'view' },
    'fees-history': { module: 'finance', action: 'view' },
    'staff-payroll-hub': { module: 'staff-payroll', action: 'view' },
    'teacher-payroll-hub': { module: 'teacher-payroll', action: 'view' },
    'employee-payroll-hub': { module: 'employee-payroll', action: 'view' },
    'payroll-history': { module: 'payroll-history', action: 'view' },
    'expenses': { module: 'expense-dashboard', action: 'view' },
    'expense-dashboard': { module: 'expense-dashboard', action: 'view' },
    'auxiliary-income': { module: 'auxiliary-income', action: 'view' },
    'reports': { module: 'financial-reports', action: 'view' },
    'roles-permissions': { module: 'roles-permissions', action: 'view' },
    'settings': { module: 'settings', action: 'view' }
  };

  const reqPerm = permissionMap[viewId];
  if (!reqPerm) return true;
  return hasPermission(reqPerm.module, reqPerm.action);
};
