import { readDb } from '../utils/db.js';

const LEGACY_MODULE_MAP = {
  'student-directory': 'core-registers',
  'teacher-directory': 'core-registers',
  'staff-directory': 'core-registers',
  'employee-directory': 'core-registers',
  'grade-settings': 'grade-management',
  'grade-subjects': 'grade-management',
  'grade-management': 'grade-settings',
  'register-student': 'registry-admissions',
  'add-staff': 'registry-admissions',
  'add-employee': 'registry-admissions',
  'add-teacher': 'registry-admissions',
  'employee-attendance': 'attendance',
  'attendance-manager': 'attendance',
  'attendance-history': 'attendance',
  'class-timetable': 'academic-manager',
  'teacher-timetable': 'academic-manager',
  'exam-timetable': 'academic-manager',
  'published-timetable': 'academic-manager',
  'published-exam': 'academic-manager',
  'events': 'academic-activities',
  'notices': 'academic-activities',
  'holidays': 'academic-activities',
  'academic-calendar': 'academic-activities',
  'results-marks-entry': 'results-marks-entry',
  'results-history': 'results-manager',
  'academic-history': 'results-manager',
  'register-teacher': 'registry-admissions',
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
  'expense-dashboard': 'expenses',
  'expense-all-expenses': 'expenses',
  'expense-tracker': 'expenses',
  'expense-history': 'expenses',
  'settings': 'employee-attendance',
  'leave-settings': 'teacher-leave-management'
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

export const checkPermission = (module, action) => {
  return (req, res, next) => {
    const user = req.admin;
    if (!user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' });
    }

    // Parents have read-only view access to student-related modules
    if (user.role === 'Parent' && action === 'view') {
      return next();
    }

    // Always permit overview/panel view
    if (module === 'overview' && action === 'view') {
      return next();
    }

    // Allow reading directory list counts for overview dashboard if authenticated
    if (action === 'view' && (module === 'student-directory' || module === 'teacher-directory' || module === 'staff-directory' || module === 'employee-directory')) {
      if (req.query.purpose === 'overview' || req.query.purpose === 'dropdown') {
        return next();
      }
    }

    const role = user.role;
    const db = readDb();
    
    // Find the user's role and permission configuration in the database
    const access = (db.userAccess || []).find(ua => ua.userId === user.id);
    let roleRecord = access ? (db.roles || []).find(r => r.id === access.roleId) : null;
    
    if (!roleRecord && role) {
      roleRecord = (db.roles || []).find(r => r.name.toLowerCase() === role.toLowerCase());
    }

    if (!roleRecord) {
      // Find role from teacher, staff, or employee record directly
      let userRoleName = '';
      let userEmail = '';
      if (user.userType === 'Teacher') {
        const teacher = (db.teachers || []).find(t => t.id === user.id);
        if (teacher) {
          userRoleName = 'Teacher';
          userEmail = teacher.email;
        }
      } else if (user.userType === 'Staff') {
        const staff = (db.staff || []).find(s => s.id === user.id);
        if (staff) {
          userRoleName = staff.designation || staff.role;
          userEmail = staff.email;
        }
      } else if (user.userType === 'Employee') {
        const employee = (db.employees || []).find(e => e.id === user.id);
        if (employee) {
          userRoleName = employee.designation || employee.role;
          userEmail = employee.email;
        }
      }

      if (userRoleName) {
        roleRecord = (db.roles || []).find(r => r.name.toLowerCase() === userRoleName.toLowerCase());
      }

      if (!roleRecord && userEmail) {
        const emailLower = userEmail.toLowerCase();
        if (emailLower.includes('receptionist')) {
          roleRecord = (db.roles || []).find(r => r.name.toLowerCase() === 'receptionist');
        } else if (emailLower.includes('accountant')) {
          roleRecord = (db.roles || []).find(r => r.name.toLowerCase() === 'accountant');
        } else if (emailLower.includes('academic')) {
          roleRecord = (db.roles || []).find(r => r.name.toLowerCase() === 'academic coordinator');
        } else if (emailLower.includes('expense')) {
          roleRecord = (db.roles || []).find(r => r.name.toLowerCase() === 'expense manager');
        } else if (emailLower.includes('teacher')) {
          roleRecord = (db.roles || []).find(r => r.name.toLowerCase() === 'teacher');
        }
      }
    }

    if (!roleRecord) {
      const defaultRoleName = user.userType === 'Teacher' ? 'Teacher' : (user.userType === 'Staff' ? 'Staff' : 'Employee');
      roleRecord = (db.roles || []).find(r => 
        r.id === `role-${defaultRoleName.toLowerCase()}` || 
        r.name.toLowerCase() === defaultRoleName.toLowerCase()
      );
    }

    const roleName = roleRecord ? roleRecord.name : role;

    // Super Admins retain absolute access
    if (
      roleName === 'Developer Admin' || 
      roleName === 'Main Admin' || 
      roleName === 'Admin Dashboard' ||
      roleName === 'Principal' ||
      role === 'Developer Admin' || 
      role === 'Main Admin' || 
      role === 'Admin Dashboard' ||
      role === 'Principal'
    ) {
      return next();
    }

    // Accountants have access to all finance, payroll, and expense modules
    if (
      roleName === 'Accountant' ||
      role === 'Accountant' ||
      (roleName && roleName.toLowerCase() === 'accountant') ||
      (role && role.toLowerCase() === 'accountant')
    ) {
      const financeModules = [
        'finance',
        'expenses',
        'teacher-payroll',
        'staff-payroll',
        'employee-payroll',
        'financial-reports',
        'auxiliary-income',
        'income',
        'fee-structures',
        'fee-periods',
        'teacher-pay-structure',
        'staff-pay-structure',
        'employee-pay-structure',
        'payroll-history',
        'expense-dashboard',
        'expense-all-expenses',
        'expense-tracker',
        'expense-history',
        'overview',
        'dashboard'
      ];
      if (financeModules.includes(module)) {
        return next();
      }
    }

    // Expense Managers have access to all expense modules
    if (
      roleName === 'Expense Manager' ||
      role === 'Expense Manager' ||
      (roleName && roleName.toLowerCase() === 'expense manager') ||
      (role && role.toLowerCase() === 'expense manager')
    ) {
      const expenseModules = [
        'expenses',
        'expense-dashboard',
        'expense-all-expenses',
        'expense-tracker',
        'expense-history',
        'overview',
        'dashboard'
      ];
      if (expenseModules.includes(module)) {
        return next();
      }
    }


    // Teachers are always permitted to view timetable, exam, and calendar schedules
    if (action === 'view') {
      if (
        user.userType === 'Teacher' || 
        (roleName && roleName.toLowerCase() === 'teacher')
      ) {
        const allowedTeacherViewModules = [
          'class-timetable',
          'teacher-timetable',
          'published-timetable',
          'exam-timetable',
          'academic-manager',
          'academic-calendar',
          'results',
          'results-manager',
          'results-marks-entry',
          'student-directory',
          'teacher-directory'
        ];
        if (allowedTeacherViewModules.includes(module)) {
          return next();
        }
      }
    }

    const permissions = roleRecord ? (typeof roleRecord.permissions === 'string' ? JSON.parse(roleRecord.permissions) : roleRecord.permissions) : {};

    const hasPerm = (mod) => {
      if (mod === 'results') {
        const hasManager = permissions['results-manager'] && permissions['results-manager'][action] !== undefined && !!permissions['results-manager'][action];
        const hasMarks = permissions['results-marks-entry'] && permissions['results-marks-entry'][action] !== undefined && !!permissions['results-marks-entry'][action];
        return hasManager || hasMarks;
      }

      if (mod === 'expenses') {
        const hasAllExpenses = permissions['expense-all-expenses'] && permissions['expense-all-expenses'][action] !== undefined && !!permissions['expense-all-expenses'][action];
        const hasTracker = permissions['expense-tracker'] && permissions['expense-tracker'][action] !== undefined && !!permissions['expense-tracker'][action];
        const hasDashboard = permissions['expense-dashboard'] && permissions['expense-dashboard'][action] !== undefined && !!permissions['expense-dashboard'][action];
        const hasHistory = permissions['expense-history'] && permissions['expense-history'][action] !== undefined && !!permissions['expense-history'][action];
        return hasAllExpenses || hasTracker || hasDashboard || hasHistory;
      }

      if (permissions[mod] && permissions[mod][action] === true) {
        return true;
      }

      if (MATRIX_CONFIGURABLE_MODULES.includes(mod)) {
        if (permissions[mod] && permissions[mod][action] !== undefined) {
          return !!permissions[mod][action];
        }
      }

      // Backward compatibility mappings (takes priority if true)
      if (mod === 'staff-directory') {
        if (permissions['teacher-directory'] && permissions['teacher-directory'][action] === true) {
          return true;
        }
      }
      if (mod === 'employee-directory') {
        if (permissions['staff-directory'] && permissions['staff-directory'][action] === true) {
          return true;
        }
      }
      if (mod === 'add-staff') {
        if (permissions['add-teacher'] && permissions['add-teacher'][action] === true) {
          return true;
        }
      }
      if (mod === 'add-employee') {
        if (permissions['add-staff'] && permissions['add-staff'][action] === true) {
          return true;
        }
      }

      if (mod === 'teacher-leave-management' || mod === 'leave-settings') {
        if (
          roleName === 'Academic Coordinator' ||
          role === 'Academic Coordinator' ||
          (permissions['academic-manager'] && permissions['academic-manager'][action] !== undefined && !!permissions['academic-manager'][action])
        ) {
          return true;
        }
      }

      const legacyModule = LEGACY_MODULE_MAP[mod];
      if (legacyModule && permissions[legacyModule] && permissions[legacyModule][action] !== undefined) {
        return !!permissions[legacyModule][action];
      }

      // Default to explicit specific false values if no legacy check succeeded
      if (permissions[mod] && permissions[mod][action] !== undefined) {
        return !!permissions[mod][action];
      }
      if (mod === 'staff-directory') {
        if (permissions['teacher-directory'] && permissions['teacher-directory'][action] !== undefined) {
          return !!permissions['teacher-directory'][action];
        }
      }
      if (mod === 'employee-directory') {
        if (permissions['staff-directory'] && permissions['staff-directory'][action] !== undefined) {
          return !!permissions['staff-directory'][action];
        }
      }
      if (mod === 'add-staff') {
        if (permissions['add-teacher'] && permissions['add-teacher'][action] !== undefined) {
          return !!permissions['add-teacher'][action];
        }
      }
      if (mod === 'add-employee') {
        if (permissions['add-staff'] && permissions['add-staff'][action] !== undefined) {
          return !!permissions['add-staff'][action];
        }
      }

      return false;
    };

    // Cross-module directory view fallback permissions (e.g. Academic Coordinators / Student Managers / Accountants listing teachers/students)
    if (action === 'view') {
      if (module === 'staff-directory' || module === 'employee-directory' || module === 'teacher-directory') {
        if (
          hasPerm('academic-manager') ||
          hasPerm('attendance') ||
          hasPerm('results-manager') ||
          hasPerm('payroll') ||
          hasPerm('finance') ||
          hasPerm('expense-dashboard') ||
          hasPerm('expense-all-expenses') ||
          hasPerm('expense-tracker') ||
          hasPerm('financial-reports') ||
          hasPerm('income') ||
          hasPerm('auxiliary-income')
        ) {
          return next();
        }
      }
      if (module === 'student-directory') {
        if (
          hasPerm('academic-manager') ||
          hasPerm('attendance') ||
          hasPerm('attendance-history') ||
          hasPerm('results-manager') ||
          hasPerm('results-history') ||
          hasPerm('student-manager') ||
          hasPerm('finance') ||
          hasPerm('expense-dashboard') ||
          hasPerm('expense-all-expenses') ||
          hasPerm('expense-tracker') ||
          hasPerm('financial-reports') ||
          hasPerm('income') ||
          hasPerm('auxiliary-income')
        ) {
          return next();
        }
      }
    }

    if (module === 'salaries') {
      if (hasPerm('finance')) {
        return next();
      }
    }

    if (hasPerm(module)) {
      return next();
    }

    // Support fallback checks for grade-management sub-modules
    if (module === 'grade-management') {
      if (hasPerm('grade-settings') || hasPerm('grade-subjects')) {
        return next();
      }
    }

    console.log('[Permission Check Failed]', { userId: user.id, role: user.role, module, action, query: req.query });
    return res.status(403).json({ error: `Access denied. Insufficient permissions for module '${module}' and action '${action}'.` });
  };
};
