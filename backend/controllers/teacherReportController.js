import * as sqlDb from '../utils/sqlDb.js';
import { invalidateTenantCache } from '../utils/db.js';
import { logAudit } from '../utils/logger.js';

// 1. SUBMIT REPORT
export const submitReport = async (req, res) => {
  try {
    const { reportType, reportDate, subject, className, title, summary, tasksCompleted, hoursWorked, chapterTopic, syllabusPercentage, attachment } = req.body;
    const teacherId = req.admin.id;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    if (!reportType || !reportDate || !title || !summary) {
      return res.status(400).json({ error: 'Report type, date, title, and summary are required.' });
    }

    const reportId = `RPT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();

    await sqlDb.query(
      `INSERT INTO teacher_reports (id, teacherId, reportType, reportDate, subject, className, title, summary, tasksCompleted, hoursWorked, chapterTopic, syllabusPercentage, attachment, status, createdAt, updatedAt, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)`,
      [reportId, teacherId, reportType, reportDate, subject || '', className || '', title, summary, tasksCompleted || '', hoursWorked || 0, chapterTopic || '', syllabusPercentage || 0, attachment || '', timestamp, timestamp, tenantId]
    );

    invalidateTenantCache(tenantId);
    logAudit('Submit Report', 'Teacher Report', `Submitted ${reportType} report: ${title}`, req);

    try {
      const teacherRows = await sqlDb.query('SELECT name FROM teachers WHERE id = ? AND tenantId = ?', [teacherId, tenantId]);
      const teacherName = teacherRows && teacherRows[0] ? teacherRows[0].name : (req.admin.username || 'Teacher');
      const notifId = `NT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await sqlDb.query(
        `INSERT INTO notifications (id, title, message, type, recipientId, recipientRole, \`read\`, createdAt, tenantId)
         VALUES (?, ?, ?, 'task_submission', NULL, 'main admin', 0, ?, ?)`,
        [notifId, 'Task Submitted', `${teacherName} (Teacher) submitted a task report: "${title}".`, new Date().toISOString(), tenantId]
      );
    } catch (errNotif) {
      console.error('Error creating task report submission notification:', errNotif.message);
    }

    res.json({ success: true, message: 'Report submitted successfully.', id: reportId });
  } catch (err) {
    console.error('[Teacher Report Submit Error]', err);
    res.status(500).json({ error: 'Server error submitting report.' });
  }
};

// 2. GET MY REPORTS
export const getMyReports = async (req, res) => {
  try {
    const teacherId = req.admin.id;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    const reports = await sqlDb.query(
      'SELECT * FROM teacher_reports WHERE teacherId = ? AND tenantId = ? ORDER BY createdAt DESC',
      [teacherId, tenantId]
    );

    res.json(reports || []);
  } catch (err) {
    console.error('[Teacher Report Get My Error]', err);
    res.status(500).json({ error: 'Server error loading reports.' });
  }
};

// 3. EDIT REPORT (only Pending reports)
export const editReport = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    const reports = await sqlDb.query('SELECT * FROM teacher_reports WHERE id = ? AND tenantId = ?', [id, tenantId]);
    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    if (reports[0].status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending reports can be edited.' });
    }

    const { reportType, reportDate, subject, className, title, summary, tasksCompleted, hoursWorked, chapterTopic, syllabusPercentage, attachment } = req.body;
    const timestamp = new Date().toISOString();

    await sqlDb.query(
      `UPDATE teacher_reports SET reportType = ?, reportDate = ?, subject = ?, className = ?, title = ?, summary = ?, tasksCompleted = ?, hoursWorked = ?, chapterTopic = ?, syllabusPercentage = ?, attachment = ?, updatedAt = ? WHERE id = ? AND tenantId = ?`,
      [reportType, reportDate, subject || '', className || '', title, summary, tasksCompleted || '', hoursWorked || 0, chapterTopic || '', syllabusPercentage || 0, attachment || '', timestamp, id, tenantId]
    );

    logAudit('Edit Report', 'Teacher Report', `Edited report ID: ${id}`, req);
    res.json({ success: true, message: 'Report updated successfully.' });
  } catch (err) {
    console.error('[Teacher Report Edit Error]', err);
    res.status(500).json({ error: 'Server error updating report.' });
  }
};

// 4. DELETE REPORT (only Pending reports)
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    const reports = await sqlDb.query('SELECT * FROM teacher_reports WHERE id = ? AND tenantId = ?', [id, tenantId]);
    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    if (reports[0].status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending reports can be deleted.' });
    }

    await sqlDb.query('DELETE FROM teacher_reports WHERE id = ? AND tenantId = ?', [id, tenantId]);
    logAudit('Delete Report', 'Teacher Report', `Deleted report ID: ${id}`, req);

    res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (err) {
    console.error('[Teacher Report Delete Error]', err);
    res.status(500).json({ error: 'Server error deleting report.' });
  }
};

// 5. ADMIN GET ALL REPORTS
export const adminGetReports = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    const { search, status, reportType, fromDate, toDate } = req.query;

    let queryStr = `
      SELECT tr.*, t.fullName AS teacherName, t.id AS teacherEmployeeId, t.photo AS teacherPhoto, t.department AS teacherDepartment, t.role AS teacherDesignation
      FROM teacher_reports tr
      JOIN teachers t ON tr.teacherId = t.id
      WHERE tr.tenantId = ?
    `;
    const params = [tenantId];

    if (status && status !== 'All') {
      queryStr += ` AND tr.status = ?`;
      params.push(status);
    }

    if (reportType && reportType !== 'All') {
      queryStr += ` AND tr.reportType = ?`;
      params.push(reportType);
    }

    if (fromDate) {
      queryStr += ` AND tr.reportDate >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      queryStr += ` AND tr.reportDate <= ?`;
      params.push(toDate);
    }

    if (search) {
      queryStr += ` AND (t.fullName LIKE ? OR tr.title LIKE ? OR tr.summary LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    queryStr += ` ORDER BY tr.createdAt DESC`;

    const reports = await sqlDb.query(queryStr, params);
    res.json(reports || []);
  } catch (err) {
    console.error('[Teacher Admin Get Reports Error]', err);
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

    const reports = await sqlDb.query('SELECT * FROM teacher_reports WHERE id = ? AND tenantId = ?', [id, tenantId]);
    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    await sqlDb.query(
      `UPDATE teacher_reports SET status = 'Reviewed', reviewRemarks = ?, reviewedAt = ?, updatedAt = ? WHERE id = ? AND tenantId = ?`,
      [remarks || '', timestamp, timestamp, id, tenantId]
    );

    invalidateTenantCache(tenantId);
    logAudit('Review Report', 'Teacher Report', `Reviewed report ID: ${id}. Remarks: ${remarks || ''}`, req);

    res.json({ success: true, message: 'Report reviewed successfully.' });
  } catch (err) {
    console.error('[Teacher Admin Review Error]', err);
    res.status(500).json({ error: 'Server error reviewing report.' });
  }
};

// 7. ADMIN DELETE REPORT
export const adminDeleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    const reports = await sqlDb.query('SELECT * FROM teacher_reports WHERE id = ? AND tenantId = ?', [id, tenantId]);
    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    await sqlDb.query('DELETE FROM teacher_reports WHERE id = ? AND tenantId = ?', [id, tenantId]);
    invalidateTenantCache(tenantId);
    logAudit('Delete Report', 'Teacher Report', `Admin deleted report ID: ${id}`, req);

    res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (err) {
    console.error('[Teacher Admin Delete Report Error]', err);
    res.status(500).json({ error: 'Server error deleting report.' });
  }
};
