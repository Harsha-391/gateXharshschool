import * as sqlDb from '../utils/sqlDb.js';
import { invalidateTenantCache } from '../utils/db.js';
import { logAudit } from '../utils/logger.js';

// 1. SUBMIT REPORT
export const submitReport = async (req, res) => {
  try {
    const { reportType, reportDate, department, title, summary, tasksCompleted, hoursWorked, attachment } = req.body;
    const staffId = req.admin.id;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    if (!reportType || !reportDate || !title || !summary) {
      return res.status(400).json({ error: 'Report type, date, title, and summary are required.' });
    }

    const reportId = `RPT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();

    await sqlDb.query(
      `INSERT INTO staff_reports (id, staffId, reportType, reportDate, department, title, summary, tasksCompleted, hoursWorked, attachment, status, createdAt, updatedAt, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)`,
      [reportId, staffId, reportType, reportDate, department || '', title, summary, tasksCompleted || '', hoursWorked || 0, attachment || '', timestamp, timestamp, tenantId]
    );

    invalidateTenantCache(tenantId);
    logAudit('Submit Report', 'Staff Report', `Submitted ${reportType} report: ${title}`, req);

    res.json({ success: true, message: 'Report submitted successfully.', id: reportId });
  } catch (err) {
    console.error('[Staff Report Submit Error]', err);
    res.status(500).json({ error: 'Server error submitting report.' });
  }
};

// 2. GET MY REPORTS
export const getMyReports = async (req, res) => {
  try {
    const staffId = req.admin.id;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    const reports = await sqlDb.query(
      'SELECT * FROM staff_reports WHERE staffId = ? AND tenantId = ? ORDER BY createdAt DESC',
      [staffId, tenantId]
    );

    res.json(reports || []);
  } catch (err) {
    console.error('[Staff Report Get My Error]', err);
    res.status(500).json({ error: 'Server error loading reports.' });
  }
};

// 3. EDIT REPORT (only Pending reports)
export const editReport = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    const reports = await sqlDb.query('SELECT * FROM staff_reports WHERE id = ? AND tenantId = ?', [id, tenantId]);
    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    if (reports[0].status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending reports can be edited.' });
    }

    const { reportType, reportDate, department, title, summary, tasksCompleted, hoursWorked, attachment } = req.body;
    const timestamp = new Date().toISOString();

    await sqlDb.query(
      `UPDATE staff_reports SET reportType = ?, reportDate = ?, department = ?, title = ?, summary = ?, tasksCompleted = ?, hoursWorked = ?, attachment = ?, updatedAt = ? WHERE id = ? AND tenantId = ?`,
      [reportType, reportDate, department || '', title, summary, tasksCompleted || '', hoursWorked || 0, attachment || '', timestamp, id, tenantId]
    );

    logAudit('Edit Report', 'Staff Report', `Edited report ID: ${id}`, req);
    res.json({ success: true, message: 'Report updated successfully.' });
  } catch (err) {
    console.error('[Staff Report Edit Error]', err);
    res.status(500).json({ error: 'Server error updating report.' });
  }
};

// 4. DELETE REPORT (only Pending reports)
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    const reports = await sqlDb.query('SELECT * FROM staff_reports WHERE id = ? AND tenantId = ?', [id, tenantId]);
    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    if (reports[0].status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending reports can be deleted.' });
    }

    await sqlDb.query('DELETE FROM staff_reports WHERE id = ? AND tenantId = ?', [id, tenantId]);
    logAudit('Delete Report', 'Staff Report', `Deleted report ID: ${id}`, req);

    res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (err) {
    console.error('[Staff Report Delete Error]', err);
    res.status(500).json({ error: 'Server error deleting report.' });
  }
};

// 5. ADMIN GET ALL REPORTS
export const adminGetReports = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    const { search, status, reportType, fromDate, toDate } = req.query;

    let queryStr = `
      SELECT sr.*, s.fullName AS staffName, s.id AS staffEmployeeId, s.photo AS staffPhoto, s.department AS staffDepartment, s.role AS staffDesignation
      FROM staff_reports sr
      JOIN staff s ON sr.staffId = s.id
      WHERE sr.tenantId = ?
    `;
    const params = [tenantId];

    if (status && status !== 'All') {
      queryStr += ` AND sr.status = ?`;
      params.push(status);
    }

    if (reportType && reportType !== 'All') {
      queryStr += ` AND sr.reportType = ?`;
      params.push(reportType);
    }

    if (fromDate) {
      queryStr += ` AND sr.reportDate >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      queryStr += ` AND sr.reportDate <= ?`;
      params.push(toDate);
    }

    if (search) {
      queryStr += ` AND (s.fullName LIKE ? OR sr.title LIKE ? OR sr.summary LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    queryStr += ` ORDER BY sr.createdAt DESC`;

    const reports = await sqlDb.query(queryStr, params);
    res.json(reports || []);
  } catch (err) {
    console.error('[Staff Admin Get Reports Error]', err);
    res.status(500).json({ error: 'Server error loading reports.' });
  }
};

// 6. ADMIN REVIEW REPORT
export const adminReviewReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    const timestamp = new Date().toISOString();

    const reports = await sqlDb.query('SELECT * FROM staff_reports WHERE id = ? AND tenantId = ?', [id, tenantId]);
    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    await sqlDb.query(
      `UPDATE staff_reports SET status = 'Reviewed', reviewRemarks = ?, reviewedAt = ?, updatedAt = ? WHERE id = ? AND tenantId = ?`,
      [remarks || '', timestamp, timestamp, id, tenantId]
    );

    invalidateTenantCache(tenantId);
    logAudit('Review Report', 'Staff Report', `Reviewed report ID: ${id}. Remarks: ${remarks || ''}`, req);

    res.json({ success: true, message: 'Report reviewed successfully.' });
  } catch (err) {
    console.error('[Staff Admin Review Error]', err);
    res.status(500).json({ error: 'Server error reviewing report.' });
  }
};

// 7. ADMIN DELETE REPORT
export const adminDeleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    const reports = await sqlDb.query('SELECT * FROM staff_reports WHERE id = ? AND tenantId = ?', [id, tenantId]);
    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    await sqlDb.query('DELETE FROM staff_reports WHERE id = ? AND tenantId = ?', [id, tenantId]);
    invalidateTenantCache(tenantId);
    logAudit('Delete Report', 'Staff Report', `Admin deleted report ID: ${id}`, req);

    res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (err) {
    console.error('[Staff Admin Delete Report Error]', err);
    res.status(500).json({ error: 'Server error deleting report.' });
  }
};
