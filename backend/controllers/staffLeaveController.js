import * as sqlDb from '../utils/sqlDb.js';
import { invalidateTenantCache } from '../utils/db.js';
import { logAudit } from '../utils/logger.js';

// Helper: Calculate days between dates (inclusive)
const calculateDays = (fromDate, toDate, halfDay) => {
  if (halfDay) return 0.5;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

// Helper: Get list of YYYY-MM-DD dates in a range
const getDatesInRange = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
  }
  return dates;
};

// 1. APPLY LEAVE
export const applyLeave = async (req, res) => {
  try {
    const { leaveType, title, reason, fromDate, toDate, halfDay, emergency, attachment, contactNumber } = req.body;
    const staffId = req.admin.id;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    if (!leaveType || !fromDate || !toDate || !title || !reason) {
      return res.status(400).json({ error: 'All fields (leaveType, title, reason, fromDate, toDate) are required.' });
    }

    // Check for overlap
    const overlapQuery = `
      SELECT * FROM staff_leaves 
      WHERE staffId = ? AND tenantId = ? AND status != 'Rejected' AND status != 'Cancelled'
        AND (fromDate <= ? AND toDate >= ?)
    `;
    const overlaps = await sqlDb.query(overlapQuery, [staffId, tenantId, toDate, fromDate]);

    if (overlaps && overlaps.length > 0) {
      return res.status(400).json({ error: 'Overlapping leave request detected for the specified dates.' });
    }

    const totalDays = calculateDays(fromDate, toDate, halfDay);
    const leaveId = `LV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();

    const insertQuery = `
      INSERT INTO staff_leaves (id, staffId, leaveType, title, reason, fromDate, toDate, totalDays, halfDay, emergency, attachment, contactNumber, status, remarks, createdAt, updatedAt, tenantId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '', ?, ?, ?)
    `;
    await sqlDb.query(insertQuery, [
      leaveId, staffId, leaveType, title, reason, fromDate, toDate, totalDays,
      halfDay ? 1 : 0, emergency ? 1 : 0, attachment || '', contactNumber || '', timestamp, timestamp, tenantId
    ]);

    logAudit('Apply Leave', 'Staff Leave', `Applied leave: ${title} (${totalDays} days)`, req);

    try {
      const staffRows = await sqlDb.query('SELECT name FROM staff WHERE id = ? AND tenantId = ?', [staffId, tenantId]);
      const staffName = staffRows && staffRows[0] ? staffRows[0].name : (req.admin.username || 'Staff');
      const notifId = `NT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await sqlDb.query(
        `INSERT INTO notifications (id, title, message, type, recipientId, recipientRole, \`read\`, createdAt, tenantId)
         VALUES (?, ?, ?, 'leave_request', NULL, 'main admin', 0, ?, ?)`,
        [notifId, 'Leave Request', `${staffName} (Staff) requested a leave from ${fromDate} to ${toDate}.`, new Date().toISOString(), tenantId]
      );
    } catch (errNotif) {
      console.error('Error creating leave request notification:', errNotif.message);
    }

    res.json({ success: true, message: 'Leave application submitted successfully.', leaveId });
  } catch (err) {
    console.error('[Staff Leave Apply Error]', err);
    res.status(500).json({ error: 'Server error applying for leave.' });
  }
};

// 2. VIEW MY LEAVES
export const getMyLeaves = async (req, res) => {
  try {
    const staffId = req.admin.id;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    const leaves = await sqlDb.query(
      'SELECT * FROM staff_leaves WHERE staffId = ? AND tenantId = ? ORDER BY createdAt DESC',
      [staffId, tenantId]
    );

    res.json(leaves);
  } catch (err) {
    console.error('[Staff My Leaves Error]', err);
    res.status(500).json({ error: 'Server error fetching leave records.' });
  }
};

// 3. EDIT PENDING LEAVE
export const editLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveType, title, reason, fromDate, toDate, halfDay, emergency, attachment, contactNumber } = req.body;
    const staffId = req.admin.id;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    // Check if leave exists and is pending
    const leaves = await sqlDb.query('SELECT * FROM staff_leaves WHERE id = ? AND tenantId = ?', [id, tenantId]);
    if (!leaves || leaves.length === 0) {
      return res.status(404).json({ error: 'Leave record not found.' });
    }

    const leave = leaves[0];
    if (leave.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending leave requests can be modified.' });
    }

    // Check overlap (excluding this leave ID)
    const overlapQuery = `
      SELECT * FROM staff_leaves 
      WHERE staffId = ? AND tenantId = ? AND id != ? AND status != 'Rejected' AND status != 'Cancelled'
        AND (fromDate <= ? AND toDate >= ?)
    `;
    const overlaps = await sqlDb.query(overlapQuery, [staffId, tenantId, id, toDate, fromDate]);

    if (overlaps && overlaps.length > 0) {
      return res.status(400).json({ error: 'Overlapping leave request detected for the specified dates.' });
    }

    const totalDays = calculateDays(fromDate, toDate, halfDay);
    const timestamp = new Date().toISOString();

    const updateQuery = `
      UPDATE staff_leaves 
      SET leaveType = ?, title = ?, reason = ?, fromDate = ?, toDate = ?, totalDays = ?, halfDay = ?, emergency = ?, attachment = ?, contactNumber = ?, updatedAt = ?
      WHERE id = ? AND tenantId = ?
    `;
    await sqlDb.query(updateQuery, [
      leaveType, title, reason, fromDate, toDate, totalDays,
      halfDay ? 1 : 0, emergency ? 1 : 0, attachment || '', contactNumber || '', timestamp, id, tenantId
    ]);

    logAudit('Edit Leave', 'Staff Leave', `Updated pending leave: ${title}`, req);

    res.json({ success: true, message: 'Leave application updated successfully.' });
  } catch (err) {
    console.error('[Staff Leave Edit Error]', err);
    res.status(500).json({ error: 'Server error updating leave.' });
  }
};

// 4. CANCEL PENDING LEAVE
export const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const staffId = req.admin.id;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    const leaves = await sqlDb.query('SELECT * FROM staff_leaves WHERE id = ? AND tenantId = ?', [id, tenantId]);
    if (!leaves || leaves.length === 0) {
      return res.status(404).json({ error: 'Leave record not found.' });
    }

    const leave = leaves[0];
    if (leave.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending leave requests can be cancelled.' });
    }

    await sqlDb.query('DELETE FROM staff_leaves WHERE id = ? AND tenantId = ?', [id, tenantId]);

    logAudit('Cancel Leave', 'Staff Leave', `Cancelled pending leave ID: ${id}`, req);

    res.json({ success: true, message: 'Leave application cancelled and deleted successfully.' });
  } catch (err) {
    console.error('[Staff Leave Cancel Error]', err);
    res.status(500).json({ error: 'Server error cancelling leave.' });
  }
};

// 5. ADMIN VIEW ALL LEAVES (with filter/search support)
export const adminGetLeaves = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    const { search, status, fromDate, toDate } = req.query;

    let queryStr = `
      SELECT sl.*, s.fullName AS staffName, s.id AS staffEmployeeId, s.photo AS staffPhoto, s.department AS staffDepartment, s.role AS staffDesignation
      FROM staff_leaves sl
      JOIN staff s ON sl.staffId = s.id
      WHERE sl.tenantId = ?
    `;
    const params = [tenantId];

    if (status && status !== 'All') {
      if (status === 'TodayPending') {
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        queryStr += ` AND sl.status = 'Pending' AND (sl.fromDate <= ? AND sl.toDate >= ?)`;
        params.push(todayStr, todayStr);
      } else if (status === 'CurrentlyOnLeave') {
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        queryStr += ` AND sl.status = 'Approved' AND (sl.fromDate <= ? AND sl.toDate >= ?)`;
        params.push(todayStr, todayStr);
      } else {
        queryStr += ` AND sl.status = ?`;
        params.push(status);
      }
    }

    if (fromDate) {
      queryStr += ` AND sl.fromDate >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      queryStr += ` AND sl.toDate <= ?`;
      params.push(toDate);
    }

    if (search) {
      queryStr += ` AND (s.fullName LIKE ? OR sl.title LIKE ? OR sl.leaveType LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    queryStr += ` ORDER BY sl.createdAt DESC`;

    const leaves = await sqlDb.query(queryStr, params);
    res.json(leaves);
  } catch (err) {
    console.error('[Staff Admin Get Leaves Error]', err);
    res.status(500).json({ error: 'Server error loading leave applications.' });
  }
};

// 6. ADMIN APPROVE LEAVE (Create On Leave attendance records)
export const adminApproveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    const timestamp = new Date().toISOString();

    const leaves = await sqlDb.query(
      `SELECT sl.*, s.fullName, s.department, s.role AS designation 
       FROM staff_leaves sl 
       JOIN staff s ON sl.staffId = s.id 
       WHERE sl.id = ? AND sl.tenantId = ?`, 
      [id, tenantId]
    );

    if (!leaves || leaves.length === 0) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    const leave = leaves[0];
    if (leave.status === 'Approved') {
      return res.status(400).json({ error: 'Leave is already approved.' });
    }

    // Update leave status to Approved
    await sqlDb.query(
      `UPDATE staff_leaves SET status = 'Approved', remarks = ?, updatedAt = ? WHERE id = ? AND tenantId = ?`,
      [remarks || '', timestamp, id, tenantId]
    );

    try {
      const notifId = `NT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await sqlDb.query(
        `INSERT INTO notifications (id, title, message, type, recipientId, recipientRole, \`read\`, createdAt, tenantId)
         VALUES (?, ?, ?, 'leave_status', ?, NULL, 0, ?, ?)`,
        [notifId, 'Leave Approved', `Your leave request "${leave.title}" has been approved.`, leave.staffId, new Date().toISOString(), tenantId]
      );
    } catch (errNotif) {
      console.error('Error creating leave status approved notification:', errNotif.message);
    }

    // Automatically create/update "On Leave" attendance records
    const dates = getDatesInRange(leave.fromDate, leave.toDate);
    
    for (const dateStr of dates) {
      // Check check-in/attendance already exists for this employee
      const existing = await sqlDb.query(
        `SELECT id FROM attendance_records WHERE employeeId = ? AND date = ? AND tenantId = ?`,
        [leave.staffId, dateStr, tenantId]
      );

      if (existing && existing.length > 0) {
        // Update to On Leave
        await sqlDb.query(
          `UPDATE attendance_records 
           SET status = 'On Leave', checkIn = null, checkOut = null, workingHours = 0.00, updatedAt = ? 
           WHERE employeeId = ? AND date = ? AND tenantId = ?`,
          [timestamp, leave.staffId, dateStr, tenantId]
        );
      } else {
        // Insert new On Leave record
        const recordId = `REC-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
        await sqlDb.query(
          `INSERT INTO attendance_records (id, employeeId, employeeType, name, department, designation, date, status, checkIn, checkOut, workingHours, createdAt, tenantId, staffId)
           VALUES (?, ?, 'Staff', ?, ?, ?, ?, 'On Leave', null, null, 0.00, ?, ?, ?)`,
          [
            recordId, leave.staffId, leave.fullName || 'Staff', leave.department || 'N/A', 
            leave.designation || 'Staff', dateStr, timestamp, tenantId, leave.staffId
          ]
        );
      }
    }

    // Invalidate tenant cache to force front-end sync
    invalidateTenantCache(tenantId);

    logAudit('Approve Leave', 'Staff Leave', `Approved leave request ID: ${id}. Remarks: ${remarks || ''}`, req);

    res.json({ success: true, message: 'Leave request approved successfully.' });
  } catch (err) {
    console.error('[Staff Admin Approve Error]', err);
    res.status(500).json({ error: 'Server error approving leave request.' });
  }
};

// 7. ADMIN REJECT LEAVE (Remove corresponding On Leave records if any)
export const adminRejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    const timestamp = new Date().toISOString();

    const leaves = await sqlDb.query('SELECT * FROM staff_leaves WHERE id = ? AND tenantId = ?', [id, tenantId]);
    if (!leaves || leaves.length === 0) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    const leave = leaves[0];
    const previousStatus = leave.status;

    await sqlDb.query(
      `UPDATE staff_leaves SET status = 'Rejected', remarks = ?, updatedAt = ? WHERE id = ? AND tenantId = ?`,
      [remarks || '', timestamp, id, tenantId]
    );

    try {
      const notifId = `NT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await sqlDb.query(
        `INSERT INTO notifications (id, title, message, type, recipientId, recipientRole, \`read\`, createdAt, tenantId)
         VALUES (?, ?, ?, 'leave_status', ?, NULL, 0, ?, ?)`,
        [notifId, 'Leave Rejected', `Your leave request "${leave.title}" has been rejected.`, leave.staffId, new Date().toISOString(), tenantId]
      );
    } catch (errNotif) {
      console.error('Error creating leave status rejected notification:', errNotif.message);
    }

    // If it was previously approved, delete "On Leave" attendance records in the range
    if (previousStatus === 'Approved') {
      const dates = getDatesInRange(leave.fromDate, leave.toDate);
      if (dates.length > 0) {
        await sqlDb.query(
          `DELETE FROM attendance_records 
           WHERE employeeId = ? AND tenantId = ? AND status = 'On Leave' AND date IN (${dates.map(() => '?').join(',')})`,
          [leave.staffId, tenantId, ...dates]
        );
      }
      invalidateTenantCache(tenantId);
    }

    logAudit('Reject Leave', 'Staff Leave', `Rejected leave request ID: ${id}. Remarks: ${remarks || ''}`, req);

    res.json({ success: true, message: 'Leave request rejected successfully.' });
  } catch (err) {
    console.error('[Staff Admin Reject Error]', err);
    res.status(500).json({ error: 'Server error rejecting leave request.' });
  }
};

// 8. ADMIN DELETE LEAVE
export const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    const leaves = await sqlDb.query('SELECT * FROM staff_leaves WHERE id = ? AND tenantId = ?', [id, tenantId]);
    if (!leaves || leaves.length === 0) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    const leave = leaves[0];

    await sqlDb.query('DELETE FROM staff_leaves WHERE id = ? AND tenantId = ?', [id, tenantId]);

    // If approved, delete "On Leave" attendance records in the range
    if (leave.status === 'Approved') {
      const dates = getDatesInRange(leave.fromDate, leave.toDate);
      if (dates.length > 0) {
        await sqlDb.query(
          `DELETE FROM attendance_records 
           WHERE employeeId = ? AND tenantId = ? AND status = 'On Leave' AND date IN (${dates.map(() => '?').join(',')})`,
          [leave.staffId, tenantId, ...dates]
        );
      }
      invalidateTenantCache(tenantId);
    }

    logAudit('Delete Leave', 'Staff Leave', `Deleted leave request ID: ${id}`, req);

    res.json({ success: true, message: 'Leave application deleted successfully.' });
  } catch (err) {
    console.error('[Staff Admin Delete Error]', err);
    res.status(500).json({ error: 'Server error deleting leave request.' });
  }
};
