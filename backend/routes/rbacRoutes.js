import express from 'express';
import { readDb, writeDb, getDefaultRoles } from '../utils/db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Middleware to ensure the user is an authorized Super Admin for configuring permissions
const checkSuperAdmin = (req, res, next) => {
  const role = req.admin ? req.admin.role : null;
  if (role === 'Main Admin' || role === 'Admin Dashboard') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Only Super Admin can configure roles and permissions.' });
};

// Helper function to log audit trails
const logAudit = (db, req, action, details) => {
  if (!db.auditLogs) db.auditLogs = [];
  const log = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: req.admin ? (req.admin.id || req.admin.username) : 'System',
    userName: req.admin ? (req.admin.username || 'System') : 'System',
    userRole: req.admin ? req.admin.role : 'System',
    action,
    details,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    timestamp: new Date().toISOString()
  };
  // Prepend to show latest logs first, keeping last 500 logs max for sanity
  db.auditLogs = [log, ...db.auditLogs].slice(0, 500);
};

// Apply auth and checkSuperAdmin to all RBAC endpoints
router.use(auth);
router.use(checkSuperAdmin);

// ==========================================
// ROLES CRUD ENDPOINTS
// ==========================================

// 1. Get all roles
router.get('/roles', (req, res) => {
  try {
    const db = readDb();
    if (!db.roles) {
      db.roles = [];
    }
    // Auto-seed default roles if no roles exist in the database
    if (db.roles.length === 0) {
      db.roles = getDefaultRoles();
      writeDb(db);
      console.log('[RBAC] Seeded default roles and permissions for this tenant.');
    }
    res.json(db.roles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles: ' + error.message });
  }
});

// 2. Create new role
router.post('/roles', (req, res) => {
  try {
    const { name, description, active, permissions } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Role name is required.' });
    }

    const db = readDb();
    if (!db.roles) db.roles = [];

    // Check if role name already exists
    const exists = db.roles.some(r => r.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'A role with this name already exists.' });
    }

    const newRole = {
      id: `role-${Date.now()}`,
      name,
      description: description || '',
      active: active !== undefined ? active : true,
      isSystem: false,
      permissions: permissions || {},
      createdAt: new Date().toISOString()
    };

    db.roles.push(newRole);
    logAudit(db, req, 'Create Role', `Created new subadmin role: ${name}`);
    writeDb(db);

    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create role: ' + error.message });
  }
});

// 3. Edit / Duplicate role
router.put('/roles/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, active, permissions } = req.body;

    const db = readDb();
    if (!db.roles) db.roles = [];

    const roleIndex = db.roles.findIndex(r => r.id === id);
    if (roleIndex === -1) {
      return res.status(404).json({ error: 'Role not found.' });
    }

    const existingRole = db.roles[roleIndex];
    const oldName = existingRole.name;

    // Propagate role name updates to teachers and staff
    if (name && name !== oldName) {
      existingRole.name = name;
      if (db.staff) {
        db.staff.forEach(s => {
          if (s.role === oldName) s.role = name;
          if (s.staffCategory === oldName) s.staffCategory = name;
          if (s.position === oldName) s.position = name;
        });
      }
      if (db.teachers) {
        db.teachers.forEach(t => {
          if (t.role === oldName) t.role = name;
          if (t.staffCategory === oldName) t.staffCategory = name;
          if (t.designation === oldName) t.designation = name;
        });
      }
    }

    // Update fields
    if (description !== undefined) existingRole.description = description;
    if (active !== undefined) existingRole.active = active;
    if (permissions) existingRole.permissions = permissions;

    db.roles[roleIndex] = existingRole;
    logAudit(db, req, 'Update Role', `Updated role: ${existingRole.name}`);
    writeDb(db);

    res.json(existingRole);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role: ' + error.message });
  }
});

// 4. Delete role
router.delete('/roles/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    if (!db.roles) db.roles = [];

    const role = db.roles.find(r => r.id === id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found.' });
    }

    const deletedRoleName = role.name;
    db.roles = db.roles.filter(r => r.id !== id);

    // Clean up matching userAccess entries (by roleId)
    if (db.userAccess) {
      db.userAccess = db.userAccess.filter(ua => ua.roleId !== id);
    }
    // Clean up staff matching roles
    if (db.staff) {
      db.staff.forEach(s => {
        if (s.role === deletedRoleName || s.staffCategory === deletedRoleName) {
          s.role = '';
          s.staffCategory = '';
          s.position = '';
        }
      });
    }
    // Clean up teachers matching roles
    if (db.teachers) {
      db.teachers.forEach(t => {
        if (t.role === deletedRoleName || t.staffCategory === deletedRoleName || t.designation === deletedRoleName) {
          t.role = '';
          t.staffCategory = '';
          t.designation = '';
        }
      });
    }

    logAudit(db, req, 'Delete Role', `Deleted role: ${role.name}`);
    writeDb(db);

    res.json({ success: true, message: `Role ${role.name} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete role: ' + error.message });
  }
});

// ==========================================
// USER ACCESS MANAGEMENT ENDPOINTS
// ==========================================

// 5. Get all users (Teachers & Staff) with their access details
router.get('/users', (req, res) => {
  try {
    const db = readDb();
    const teachers = db.teachers || [];
    const staff = db.staff || [];
    const userAccessList = db.userAccess || [];
    const rolesList = db.roles || [];

    const responseUsers = [];

    // Map Teachers
    teachers.forEach(t => {
      const access = userAccessList.find(ua => ua.userId === t.id && ua.userType === 'Teacher');
      const assignedRole = access ? rolesList.find(r => r.id === access.roleId) : null;
      responseUsers.push({
        id: t.id,
        name: t.fullName || t.name,
        email: t.email || '',
        phone: t.phone || '',
        userType: 'Teacher',
        roleId: access ? access.roleId : 'role-subject-teacher', // default
        roleName: assignedRole ? assignedRole.name : 'Subject Teacher',
        status: access ? access.status : (t.status || 'Active'),
        overrides: access ? access.overrides : {}
      });
    });

    // Map Staff
    staff.forEach(s => {
      const access = userAccessList.find(ua => ua.userId === s.id && ua.userType === 'Staff');
      const assignedRole = access ? rolesList.find(r => r.id === access.roleId) : null;
      
      // Attempt to match default role name if not customized
      let matchedDefaultRoleId = null;
      let matchedDefaultRoleName = s.role || 'Staff';
      if (!access) {
        const found = rolesList.find(r => r.name.toLowerCase() === matchedDefaultRoleName.toLowerCase());
        if (found) {
          matchedDefaultRoleId = found.id;
          matchedDefaultRoleName = found.name;
        }
      }

      responseUsers.push({
        id: s.id,
        name: s.fullName || s.name,
        email: s.email || '',
        phone: s.phone || '',
        userType: 'Staff',
        roleId: access ? access.roleId : matchedDefaultRoleId,
        roleName: assignedRole ? assignedRole.name : matchedDefaultRoleName,
        status: access ? access.status : (s.status || 'Active'),
        overrides: access ? access.overrides : {}
      });
    });

    res.json(responseUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users: ' + error.message });
  }
});

// 6. Update user role, status, or overrides
router.put('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { roleId, status, overrides, userType, userName } = req.body;

    if (!userType) {
      return res.status(400).json({ error: 'User type (Teacher or Staff) is required.' });
    }

    const db = readDb();
    if (!db.userAccess) db.userAccess = [];

    let accessIndex = db.userAccess.findIndex(ua => ua.userId === id && ua.userType === userType);
    let updatedRecord = null;

    if (accessIndex === -1) {
      // Create new mapping record
      updatedRecord = {
        id: `access-${Date.now()}`,
        userId: id,
        userName: userName || 'User',
        userType,
        roleId: roleId || null,
        status: status || 'Active',
        overrides: overrides || {},
        updatedAt: new Date().toISOString()
      };
      db.userAccess.push(updatedRecord);
    } else {
      // Update existing mapping record
      updatedRecord = db.userAccess[accessIndex];
      if (roleId !== undefined) updatedRecord.roleId = roleId;
      if (status !== undefined) updatedRecord.status = status;
      if (overrides !== undefined) updatedRecord.overrides = overrides;
      updatedRecord.updatedAt = new Date().toISOString();
      if (userName) updatedRecord.userName = userName;
      db.userAccess[accessIndex] = updatedRecord;
    }

    // Update teacher/staff table status to align
    if (status) {
      if (userType === 'Teacher') {
        const teacher = db.teachers.find(t => t.id === id);
        if (teacher) teacher.status = status;
      } else if (userType === 'Staff') {
        const s = db.staff.find(sm => sm.id === id);
        if (s) s.status = status;
      }
    }

    const rolesList = db.roles || [];
    const roleRecord = rolesList.find(r => r.id === roleId);
    const roleName = roleRecord ? roleRecord.name : 'None';

    logAudit(db, req, 'Update User Access', `Assigned user ${userName || id} to role ${roleName} with overrides.`);
    writeDb(db);

    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user access: ' + error.message });
  }
});

// ==========================================
// AUDIT LOGS ENDPOINTS
// ==========================================

// 7. Get system audit logs
router.get('/audit-logs', (req, res) => {
  try {
    const db = readDb();
    res.json(db.auditLogs || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs: ' + error.message });
  }
});

// 8. Create custom audit log entry
router.post('/audit-logs', (req, res) => {
  try {
    const { action, details } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Action parameter is required.' });
    }

    const db = readDb();
    logAudit(db, req, action, details || '');
    writeDb(db);

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create audit log: ' + error.message });
  }
});

export default router;
