import * as sqlDb from '../utils/sqlDb.js';
import { invalidateTenantCache } from '../utils/db.js';
import { logAudit } from '../utils/logger.js';
import crypto from 'crypto';

// 1. FETCH ALL LEAVE POLICIES
export const getLeaveSettings = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    
    // Fetch leave settings
    const policies = await sqlDb.query(
      'SELECT * FROM leave_settings WHERE tenantId = ?',
      [tenantId]
    );

    res.json(policies || []);
  } catch (err) {
    console.error('Error fetching leave settings:', err);
    res.status(500).json({ error: 'Failed to load leave settings.' });
  }
};

// 2. UPDATE OR CREATE A LEAVE POLICY
export const updateLeaveSetting = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    const { leaveCode, leaveType, maxDays, maxCarryForward, isPaid, status, description } = req.body;

    if (!leaveCode || !leaveType) {
      return res.status(400).json({ error: 'Leave code and leave name are required.' });
    }

    const now = new Date().toISOString();

    // Fetch existing records for this leaveType (or leaveCode)
    const existing = await sqlDb.query(
      'SELECT id, employeeType FROM leave_settings WHERE tenantId = ? AND leaveType = ?',
      [tenantId, leaveType]
    );

    const hasTeacher = existing.some(e => e.employeeType === 'Teacher');
    const hasStaff = existing.some(e => e.employeeType === 'Staff');

    const carryForwardBool = maxCarryForward > 0 ? 1 : 0;

    // Update or Insert Teacher policy
    if (hasTeacher) {
      await sqlDb.query(
        `UPDATE leave_settings 
         SET leaveCode = ?, maxDays = ?, maxCarryForward = ?, carryForward = ?, isPaid = ?, status = ?, description = ?, updatedAt = ? 
         WHERE tenantId = ? AND leaveType = ? AND employeeType = 'Teacher'`,
        [
          leaveCode,
          maxDays !== undefined ? Number(maxDays) : 0,
          maxCarryForward !== undefined ? Number(maxCarryForward) : 0,
          carryForwardBool,
          isPaid !== undefined ? (isPaid ? 1 : 0) : 1,
          status || 'Active',
          description || '',
          now,
          tenantId,
          leaveType
        ]
      );
    } else {
      const id = crypto.randomUUID();
      await sqlDb.query(
        `INSERT INTO leave_settings 
         (id, employeeType, leaveCode, leaveType, maxDays, maxCarryForward, carryForward, isPaid, encashment, status, description, extraConfig, createdAt, updatedAt, tenantId) 
         VALUES (?, 'Teacher', ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          leaveCode,
          leaveType,
          maxDays !== undefined ? Number(maxDays) : 0,
          maxCarryForward !== undefined ? Number(maxCarryForward) : 0,
          carryForwardBool,
          isPaid !== undefined ? (isPaid ? 1 : 0) : 1,
          status || 'Active',
          description || '',
          JSON.stringify({}),
          now,
          now,
          tenantId
        ]
      );
    }

    // Update or Insert Staff policy
    if (hasStaff) {
      await sqlDb.query(
        `UPDATE leave_settings 
         SET leaveCode = ?, maxDays = ?, maxCarryForward = ?, carryForward = ?, isPaid = ?, status = ?, description = ?, updatedAt = ? 
         WHERE tenantId = ? AND leaveType = ? AND employeeType = 'Staff'`,
        [
          leaveCode,
          maxDays !== undefined ? Number(maxDays) : 0,
          maxCarryForward !== undefined ? Number(maxCarryForward) : 0,
          carryForwardBool,
          isPaid !== undefined ? (isPaid ? 1 : 0) : 1,
          status || 'Active',
          description || '',
          now,
          tenantId,
          leaveType
        ]
      );
    } else {
      const id = crypto.randomUUID();
      await sqlDb.query(
        `INSERT INTO leave_settings 
         (id, employeeType, leaveCode, leaveType, maxDays, maxCarryForward, carryForward, isPaid, encashment, status, description, extraConfig, createdAt, updatedAt, tenantId) 
         VALUES (?, 'Staff', ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          leaveCode,
          leaveType,
          maxDays !== undefined ? Number(maxDays) : 0,
          maxCarryForward !== undefined ? Number(maxCarryForward) : 0,
          carryForwardBool,
          isPaid !== undefined ? (isPaid ? 1 : 0) : 1,
          status || 'Active',
          description || '',
          JSON.stringify({}),
          now,
          now,
          tenantId
        ]
      );
    }

    // Invalidate tenant cache
    invalidateTenantCache(tenantId);

    // Retrieve and return the updated record
    const updated = await sqlDb.query(
      'SELECT * FROM leave_settings WHERE tenantId = ? AND leaveType = ?',
      [tenantId, leaveType]
    );

    // Log Settings update Audit Log
    logAudit(
      'UPDATE_LEAVE_POLICY',
      leaveType,
      `Updated leave policy: ${leaveType} (Code: ${leaveCode}, Days: ${maxDays}, CarryForward: ${maxCarryForward}, Paid: ${isPaid}, Status: ${status})`,
      req
    );

    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating leave settings:', err);
    res.status(500).json({ error: 'Failed to update leave settings.' });
  }
};

// 3. DELETE A LEAVE POLICY (Deletes both Teacher & Staff policies)
export const deleteLeaveSetting = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    const { leaveType } = req.params;

    if (!leaveType) {
      return res.status(400).json({ error: 'Leave type name is required to delete.' });
    }

    await sqlDb.query(
      'DELETE FROM leave_settings WHERE tenantId = ? AND leaveType = ?',
      [tenantId, leaveType]
    );

    // Invalidate tenant cache
    invalidateTenantCache(tenantId);

    // Log Settings delete Audit Log
    logAudit(
      'DELETE_LEAVE_POLICY',
      leaveType,
      `Deleted leave policy: ${leaveType}`,
      req
    );

    res.json({ message: 'Leave policy deleted successfully.' });
  } catch (err) {
    console.error('Error deleting leave settings:', err);
    res.status(500).json({ error: 'Failed to delete leave settings.' });
  }
};
