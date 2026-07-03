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
  'results': 'results-manager',
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
  'expense-dashboard': 'expenses',
  'expense-all-expenses': 'expenses',
  'expense-tracker': 'expenses',
  'expense-history': 'expenses',
  'settings': 'employee-attendance',
  'leave-settings': 'teacher-leave-management'
};

export const checkPermission = (module, action) => {
  return (req, res, next) => {
    const user = req.admin;
    if (!user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' });
    }

    // Always permit overview/panel view
    if (module === 'overview' && action === 'view') {
      return next();
    }

    // Allow reading directory list counts for overview dashboard if authenticated
    if (action === 'view' && (module === 'student-directory' || module === 'teacher-directory' || module === 'staff-directory' || module === 'employee-directory')) {
      if (req.query.purpose === 'overview') {
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

    const permissions = roleRecord ? (typeof roleRecord.permissions === 'string' ? JSON.parse(roleRecord.permissions) : roleRecord.permissions) : {};

    const hasPerm = (mod) => {
      if (permissions[mod] && permissions[mod][action] !== undefined) {
        return !!permissions[mod][action];
      }

      // Backward compatibility mappings
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

      const legacyModule = LEGACY_MODULE_MAP[mod];
      if (legacyModule && permissions[legacyModule] && permissions[legacyModule][action] !== undefined) {
        return !!permissions[legacyModule][action];
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
