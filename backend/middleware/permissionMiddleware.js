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
  'expense-dashboard': 'expenses',
  'expense-all-expenses': 'expenses',
  'expense-tracker': 'expenses',
  'expense-history': 'expenses'
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

    const role = user.role;
    const db = readDb();
    
    // Find the user's role and permission configuration in the database
    const access = (db.userAccess || []).find(ua => ua.userId === user.id);
    let roleRecord = access ? (db.roles || []).find(r => r.id === access.roleId) : null;
    
    if (!roleRecord) {
      // Find role from teacher or staff record directly
      let userRoleName = '';
      if (user.userType === 'Staff') {
        const teacher = (db.teachers || []).find(t => t.id === user.id);
        if (teacher) userRoleName = teacher.role;
      } else {
        const staff = (db.staff || []).find(s => s.id === user.id);
        if (staff) userRoleName = staff.role;
      }

      if (userRoleName) {
        roleRecord = (db.roles || []).find(r => r.name.toLowerCase() === userRoleName.toLowerCase());
      }
    }

    if (!roleRecord) {
      const defaultRoleName = user.userType === 'Staff' ? 'Staff' : 'Employee';
      roleRecord = (db.roles || []).find(r => 
        r.id === `role-${defaultRoleName.toLowerCase()}` || 
        r.name.toLowerCase() === defaultRoleName.toLowerCase() ||
        (defaultRoleName === 'Staff' && r.id === 'role-teacher')
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

    if (hasPerm(module)) {
      return next();
    }

    // Support fallback checks for grade-management sub-modules
    if (module === 'grade-management') {
      if (hasPerm('grade-settings') || hasPerm('grade-subjects')) {
        return next();
      }
    }

    return res.status(403).json({ error: `Access denied. Insufficient permissions for module '${module}' and action '${action}'.` });
  };
};
