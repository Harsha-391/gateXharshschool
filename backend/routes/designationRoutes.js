import express from 'express';
import { readDb, writeDb, slugify, tenantStorage, restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

const getActiveTenantId = () => {
  return tenantStorage.getStore() || 'platform';
};

// Helper to log audit trails
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
  db.auditLogs = [log, ...db.auditLogs].slice(0, 500);
};

// Check reference usages before deleting designation
const checkDesignationUsage = (db, designationName) => {
  // 1. Check Staff table
  const hasStaff = (db.staff || []).some(s => s.designation === designationName);
  if (hasStaff) return 'This designation is currently assigned to one or more staff members.';

  // 2. Check Employees table
  const hasEmployee = (db.employees || []).some(e => e.designation === designationName);
  if (hasEmployee) return 'This designation is currently assigned to one or more employees.';

  return null;
};

// Inline helper for GET request viewing permission fallback
const checkViewDesignationPermission = (req, res, next) => {
  const user = req.admin;
  if (!user) {
    return res.status(401).json({ error: 'Access denied. User not authenticated.' });
  }

  const role = user.role;
  if (
    role === 'Developer Admin' || 
    role === 'Main Admin' || 
    role === 'Admin Dashboard' ||
    role === 'Principal'
  ) {
    return next();
  }

  const db = readDb();
  const access = (db.userAccess || []).find(ua => ua.userId === user.id);
  let roleRecord = access ? (db.roles || []).find(r => r.id === access.roleId) : null;
  
  if (!roleRecord && role) {
    roleRecord = (db.roles || []).find(r => r.name.toLowerCase() === role.toLowerCase());
  }
  
  if (!roleRecord) {
    const defaultRoleName = user.userType === 'Teacher' ? 'Teacher' : 'Staff';
    roleRecord = (db.roles || []).find(r => r.id === `role-${defaultRoleName.toLowerCase()}` || r.name.toLowerCase() === defaultRoleName.toLowerCase());
  }

  const permissions = roleRecord ? (typeof roleRecord.permissions === 'string' ? JSON.parse(roleRecord.permissions) : roleRecord.permissions) : {};

  // Check if user has view on designation-manager, OR any permission on add-employee, add-staff, staff-directory, teacher-directory, or finance
  const allowedModules = ['designation-manager', 'add-employee', 'add-staff', 'staff-directory', 'teacher-directory', 'finance'];
  const actions = ['view', 'create', 'edit', 'delete'];

  const hasAnyPerm = allowedModules.some(mod => {
    return actions.some(action => {
      if (permissions[mod] && permissions[mod][action] !== undefined) {
        return !!permissions[mod][action];
      }
      return false;
    });
  });

  if (hasAnyPerm) {
    return next();
  }

  return res.status(403).json({ error: "Access denied. Insufficient permissions to view designations lookup." });
};

router.use(auth);
router.use(restoreTenantContext);
router.use(ensureTenantSqlLoaded);

// GET /api/designations
router.get('/', checkViewDesignationPermission, (req, res) => {
  try {
    const db = readDb();
    res.json(db.designations || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch designations: ' + error.message });
  }
});

// POST /api/designations
router.post('/', checkPermission('designation-manager', 'create'), (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Designation name is required.' });
    }

    const db = readDb();
    if (!db.designations) db.designations = [];

    const exists = db.designations.some(d => d.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'A designation with this name already exists.' });
    }

    const desigId = `desig-${getActiveTenantId()}-${slugify(name)}`;
    const newDesig = {
      id: desigId,
      name: name.trim(),
      status: status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.designations.push(newDesig);
    logAudit(db, req, 'Create Designation', `Created designation: ${name}`);
    writeDb(db);

    res.status(201).json(newDesig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create designation: ' + error.message });
  }
});

// PUT /api/designations/:id
router.put('/:id', checkPermission('designation-manager', 'edit'), (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const db = readDb();
    const index = db.designations.findIndex(d => d.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Designation not found.' });
    }

    const desig = db.designations[index];

    if (name && name.trim().toLowerCase() !== desig.name.toLowerCase()) {
      const exists = db.designations.some(d => d.name.trim().toLowerCase() === name.trim().toLowerCase() && d.id !== id);
      if (exists) {
        return res.status(400).json({ error: 'Another designation with this name already exists.' });
      }
      
      const oldName = desig.name;
      const newName = name.trim();
      desig.name = newName;
      
      if (db.staff) {
        db.staff.forEach(s => {
          if (s.designation === oldName) s.designation = newName;
        });
      }
      if (db.employees) {
        db.employees.forEach(e => {
          if (e.designation === oldName) e.designation = newName;
        });
      }
    }

    if (status) {
      desig.status = status;
    }

    desig.updatedAt = new Date().toISOString();
    db.designations[index] = desig;

    logAudit(db, req, 'Update Designation', `Updated designation: ${desig.name}`);
    writeDb(db);

    res.json(desig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update designation: ' + error.message });
  }
});

// DELETE /api/designations/:id
router.delete('/:id', checkPermission('designation-manager', 'delete'), (req, res) => {
  try {
    const { id } = req.params;

    const db = readDb();
    const desig = db.designations.find(d => d.id === id);
    if (!desig) {
      return res.status(404).json({ error: 'Designation not found.' });
    }

    const usageError = checkDesignationUsage(db, desig.name);
    if (usageError) {
      return res.status(400).json({ error: usageError });
    }

    db.designations = db.designations.filter(d => d.id !== id);
    logAudit(db, req, 'Delete Designation', `Deleted designation: ${desig.name}`);
    writeDb(db);

    res.json({ message: 'Designation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete designation: ' + error.message });
  }
});

export default router;
