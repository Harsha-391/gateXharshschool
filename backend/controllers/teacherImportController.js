/**
 * Teacher Bulk Import Controller
 * Implements:
 * 1. Download Sample Template (.xlsx)
 * 2. Upload Preview & Smart Alias Mapping
 * 3. Interactive Designation Resolution
 * 4. Staging Storage & Batch Record Creation (Zero impact on main teachers table)
 * 5. Pending Teachers Listing, Search, Sort & Deletion
 * 6. Single-Transaction "Complete Setup" to Main Directory
 * 7. 24-Hour "Undo Last Import" (Removes pending rows only)
 * 8. Error Report Export
 */

import path from 'path';
import * as xlsx from 'xlsx';
import { readDb, writeDb, addActivity, isSqlActive, tenantStorage, slugify } from '../utils/db.js';
import { encrypt, decrypt } from '../utils/encryptionHelper.js';
import { hashPassword } from '../utils/authHelper.js';
import { logAudit } from '../utils/logger.js';
import {
  TEACHER_FIELD_DEFINITIONS,
  matchHeaderToField,
  sanitizeCellValue,
  parseDateToIso,
  normalizePhone,
  normalizeGender,
  splitFullName,
  validateTeacherImportRow,
  reserveTeacherIds
} from '../utils/teacherImportHelper.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 1000;

// Helper to ensure staging & batch tables exist in MySQL
async function ensureImportTablesExist(tenantId) {
  if (!isSqlActive()) return;
  try {
    const sqlDb = await import('../utils/sqlDb.js');
    const tId = tenantId ? slugify(tenantId) : 'platform';

    await sqlDb.query(`
      CREATE TABLE IF NOT EXISTS import_batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id VARCHAR(64) NOT NULL UNIQUE,
        imported_by VARCHAR(150) NULL,
        file_name VARCHAR(255) NULL,
        total_rows INT DEFAULT 0,
        success_count INT DEFAULT 0,
        skipped_count INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME NULL,
        undone_at DATETIME NULL,
        created_designations TEXT NULL,
        tenantId VARCHAR(100) NULL,
        INDEX idx_ib_status (status),
        INDEX idx_ib_batch (batch_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, [], tId);

    await sqlDb.query(`
      CREATE TABLE IF NOT EXISTS teacher_import_staging (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id VARCHAR(64) NOT NULL,
        teacher_id VARCHAR(50) NOT NULL,
        full_name VARCHAR(255) NULL,
        first_name VARCHAR(100) NULL,
        middle_name VARCHAR(100) NULL,
        last_name VARCHAR(100) NULL,
        mobile VARCHAR(100) NULL,
        email VARCHAR(255) NULL,
        qualification TEXT NULL,
        experience VARCHAR(50) NULL,
        subjects VARCHAR(255) NULL,
        joining_date VARCHAR(50) NULL,
        designation VARCHAR(100) NULL,
        designation_id VARCHAR(100) NULL,
        gender VARCHAR(20) NULL,
        dob VARCHAR(50) NULL,
        address TEXT NULL,
        tenantId VARCHAR(100) NULL,
        created_at DATETIME NULL,
        raw_data TEXT NULL,
        INDEX idx_tis_batch (batch_id),
        INDEX idx_tis_tid (teacher_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, [], tId);
  } catch (err) {
    console.error('[Teacher Import Table Init Error]:', err.message);
  }
}

// ========================================================
// 1. DOWNLOAD SAMPLE TEMPLATE (GET /api/teachers/import/template)
// ========================================================
export const downloadTeacherImportTemplate = async (req, res) => {
  try {
    const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
    const tenantId = slugify(rawTenantId);
    const db = tenantStorage.run(tenantId, () => readDb(tenantId));
    const activeDesignations = (db.designations || []).map(d => d.name).filter(Boolean);

    const sampleDesig1 = activeDesignations[0] || 'Senior Teacher';
    const sampleDesig2 = activeDesignations[1] || 'Assistant Teacher';

    const sampleRows = [
      {
        'Full Name': 'Aarav Sharma',
        'Mobile': '9876543210',
        'Email': 'aarav.sharma@school.edu',
        'Qualification': 'M.Sc Mathematics, B.Ed',
        'Experience (years)': '5',
        'Subjects': 'Mathematics, Statistics',
        'Joining Date': '2026-06-01',
        'Designation': sampleDesig1,
        'Gender': 'Male',
        'DOB': '1990-05-14',
        'Address': '12 Park Avenue, Civil Lines, Indore'
      },
      {
        'Full Name': 'Priya Patel',
        'Mobile': '9812345678',
        'Email': 'priya.patel@school.edu',
        'Qualification': 'M.A English Literature, B.Ed',
        'Experience (years)': '3',
        'Subjects': 'English, Literature',
        'Joining Date': '2026-06-01',
        'Designation': sampleDesig2,
        'Gender': 'Female',
        'DOB': '1993-08-22',
        'Address': '45 Lake View Road, Ahmedabad'
      },
      {
        'Full Name': 'Vikram Rathore',
        'Mobile': '9898765432',
        'Email': 'vikram.rathore@school.edu',
        'Qualification': 'M.Sc Physics, Ph.D',
        'Experience (years)': '8',
        'Subjects': 'Physics, Science',
        'Joining Date': '2026-05-15',
        'Designation': sampleDesig1,
        'Gender': 'Male',
        'DOB': '1987-11-03',
        'Address': '78 High Street, Jaipur'
      }
    ];

    const worksheet = xlsx.utils.json_to_sheet(sampleRows);
    worksheet['!cols'] = Object.keys(sampleRows[0]).map(k => ({
      wch: Math.max(k.length + 4, 18)
    }));

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Teachers_Template');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Teacher_Import_Template.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating teacher import template:', err);
    return res.status(500).json({ error: 'Failed to generate teacher import template.' });
  }
};

// ========================================================
// 2. PARSE & PREVIEW IMPORT FILE (POST /api/teachers/import/preview)
// ========================================================
export const previewTeacherImport = async (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  const tenantId = slugify(rawTenantId);

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a .xlsx, .xls, or .csv file.' });
    }

    const originalName = req.file.originalname || '';
    const ext = path.extname(originalName).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      return res.status(400).json({ error: 'Unsupported file format. Please upload .xlsx, .xls, or .csv.' });
    }

    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File size exceeds maximum allowed limit of 5 MB.' });
    }

    const workbook = xlsx.read(req.file.buffer, { cellDates: true, raw: false });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return res.status(400).json({ error: 'Uploaded spreadsheet is empty.' });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ error: 'Spreadsheet contains no data.' });
    }

    const rawHeaders = rawData[0].map(h => sanitizeCellValue(h).toString().trim()).filter(Boolean);
    const dataRows = rawData.slice(1).filter(row => row.some(cell => String(cell).trim() !== ''));

    if (dataRows.length === 0) {
      return res.status(400).json({ error: 'No teacher data rows found in the uploaded file.' });
    }

    if (dataRows.length > MAX_ROWS) {
      return res.status(400).json({ error: `File contains ${dataRows.length} rows, which exceeds the limit of ${MAX_ROWS} rows.` });
    }

    // Auto-match headers to field keys
    const detectedMapping = {};
    rawHeaders.forEach(header => {
      detectedMapping[header] = matchHeaderToField(header) || '';
    });

    // Ensure staging tables exist
    await ensureImportTablesExist(tenantId);

    // Fetch existing teachers, pending staging rows, and designations
    const db = tenantStorage.run(tenantId, () => readDb(tenantId));
    if (!db.teachers) db.teachers = [];
    if (!db.teacher_import_staging) db.teacher_import_staging = [];
    if (!db.designations) db.designations = [];

    let pendingStaging = [...(db.teacher_import_staging || [])];
    if (isSqlActive()) {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        const rows = await sqlDb.query('SELECT * FROM teacher_import_staging WHERE tenantId = ?', [tenantId], tenantId);
        if (Array.isArray(rows)) {
          pendingStaging = rows;
        }
      } catch (e) {}
    }

    const existingTeachers = db.teachers || [];
    const designationsList = db.designations || [];

    // Map rows into standardized objects
    const seenPhones = new Set();
    const seenEmails = new Set();
    const unmatchedDesignationSet = new Set();

    const parsedRows = dataRows.map((rowArr, rowIndex) => {
      const rowObj = { rowIndex: rowIndex + 1 };
      rawHeaders.forEach((header, colIdx) => {
        const fieldKey = detectedMapping[header];
        const cellVal = sanitizeCellValue(rowArr[colIdx]);
        if (fieldKey) {
          rowObj[fieldKey] = cellVal;
        }
        rowObj[`_raw_${header}`] = cellVal;
      });

      // Split full name if not already provided
      if (!rowObj.fullName && (rowObj.firstName || rowObj.lastName)) {
        rowObj.fullName = [rowObj.firstName, rowObj.middleName, rowObj.lastName].filter(Boolean).join(' ');
      }

      // Run row validation
      const validation = validateTeacherImportRow(rowObj, rowIndex + 1, {
        existingTeachers,
        pendingStaging,
        designationsList,
        seenPhones,
        seenEmails
      });

      if (rowObj._unmatchedDesignation) {
        unmatchedDesignationSet.add(rowObj._unmatchedDesignation);
      }

      return {
        ...rowObj,
        validationStatus: validation.status,
        validationMessage: validation.message,
        errors: validation.errors,
        warnings: validation.warnings
      };
    });

    const validCount = parsedRows.filter(r => r.validationStatus === 'Valid').length;
    const errorCount = parsedRows.filter(r => r.validationStatus === 'Error').length;
    const duplicateCount = parsedRows.filter(r => r.validationStatus === 'Duplicate').length;

    return res.json({
      success: true,
      fileName: originalName,
      totalRows: parsedRows.length,
      rawHeaders,
      detectedMapping,
      rows: parsedRows,
      summary: {
        total: parsedRows.length,
        valid: validCount,
        error: errorCount,
        duplicate: duplicateCount
      },
      unmatchedDesignations: Array.from(unmatchedDesignationSet),
      availableDesignations: designationsList.map(d => ({ id: d.id, name: d.name }))
    });
  } catch (err) {
    console.error('Error in previewTeacherImport:', err);
    return res.status(500).json({ error: 'Failed to preview teacher import: ' + err.message });
  }
};

// ========================================================
// 3. CONFIRM & COMMIT TO STAGING (POST /api/teachers/import/confirm)
// ========================================================
export const confirmTeacherImport = async (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  const tenantId = slugify(rawTenantId);

  return tenantStorage.run(tenantId, async () => {
    try {
      const { rows = [], columnMapping = {}, designationResolutions = {}, fileName = 'import.xlsx' } = req.body;

      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'No rows provided for import.' });
      }

      await ensureImportTablesExist(tenantId);

      const db = readDb(tenantId);
      if (!db.teachers) db.teachers = [];
      if (!db.teacher_import_staging) db.teacher_import_staging = [];
      if (!db.import_batches) db.import_batches = [];
      if (!db.designations) db.designations = [];

      let pendingStaging = [...db.teacher_import_staging];
      if (isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');
          const pRows = await sqlDb.query('SELECT * FROM teacher_import_staging WHERE tenantId = ?', [tenantId], tenantId);
          if (Array.isArray(pRows)) pendingStaging = pRows;
        } catch (e) {}
      }

      // Handle designation resolutions (Create new / Map to existing / Leave blank)
      const createdDesignations = [];
      for (const [unmatchedName, resolution] of Object.entries(designationResolutions)) {
        if (!resolution) continue;
        if (resolution.action === 'create' && resolution.name) {
          const desigName = resolution.name.trim();
          const exists = db.designations.some(d => d.name.toLowerCase() === desigName.toLowerCase());
          if (!exists) {
            const desigId = `desig-${tenantId}-${slugify(desigName)}`;
            const newDesig = {
              id: desigId,
              name: desigName,
              status: 'Active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tenantId
            };
            db.designations.push(newDesig);
            createdDesignations.push(newDesig);

            if (isSqlActive()) {
              try {
                const sqlDb = await import('../utils/sqlDb.js');
                await sqlDb.query(
                  'INSERT INTO designations (id, name, status, createdAt, updatedAt, tenantId) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
                  [newDesig.id, newDesig.name, newDesig.status, newDesig.createdAt, newDesig.updatedAt, tenantId],
                  tenantId
                );
              } catch (e) {
                console.error('[Designation SQL Insert Error]:', e.message);
              }
            }
          }
        }
      }

      // Apply updated mappings & designation resolutions to rows
      const validRowsToImport = [];
      const skippedRows = [];
      const seenPhones = new Set();
      const seenEmails = new Set();

      for (let i = 0; i < rows.length; i++) {
        const rawRow = rows[i];
        const row = { ...rawRow };

        // Apply column mapping overrides if provided
        Object.entries(columnMapping).forEach(([header, fieldKey]) => {
          if (fieldKey && rawRow[`_raw_${header}`] !== undefined) {
            row[fieldKey] = rawRow[`_raw_${header}`];
          }
        });

        // Resolve designation if needed
        const rawDesig = (row.designation || '').trim();
        if (designationResolutions[rawDesig]) {
          const res = designationResolutions[rawDesig];
          if (res.action === 'map' && res.target) {
            row.designation = res.target;
          } else if (res.action === 'create' && res.name) {
            row.designation = res.name;
          } else if (res.action === 'blank') {
            row.designation = 'Teacher';
          }
        }

        // Re-validate row against current state
        const val = validateTeacherImportRow(row, i + 1, {
          existingTeachers: db.teachers,
          pendingStaging,
          designationsList: db.designations,
          seenPhones,
          seenEmails
        });

        if (val.status === 'Valid') {
          validRowsToImport.push(row);
        } else {
          skippedRows.push({ ...row, errors: val.errors });
        }
      }

      if (validRowsToImport.length === 0) {
        return res.status(400).json({
          error: 'No valid rows found to import. Please review error reports.',
          skippedCount: skippedRows.length
        });
      }

      // Reserve unique sequential Teacher IDs (TCH-YYYY-XXXX) with zero collisions
      const reservedIds = reserveTeacherIds(validRowsToImport.length, db.teachers, pendingStaging, 2026);

      // Create new Batch ID
      const batchId = `BATCH-TCH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const importedBy = req.admin?.name || req.admin?.username || 'Administrator';
      const nowIso = new Date().toISOString();

      // Record in import_batches
      const newBatch = {
        batch_id: batchId,
        imported_by: importedBy,
        file_name: fileName,
        total_rows: rows.length,
        success_count: validRowsToImport.length,
        skipped_count: skippedRows.length,
        status: 'active',
        created_at: nowIso,
        undone_at: null,
        created_designations: JSON.stringify(createdDesignations.map(d => d.id)),
        tenantId
      };
      db.import_batches.push(newBatch);

      // Staging records
      const stagedEntities = [];
      validRowsToImport.forEach((row, idx) => {
        const teacherId = reservedIds[idx];
        const fullName = (row.fullName || row.name || '').trim();
        const { firstName, middleName, lastName } = splitFullName(fullName);

        // Normalize qualifications
        let qualStr = row.qualification || '';
        if (typeof qualStr === 'object') {
          qualStr = JSON.stringify(qualStr);
        }

        const stagingEntity = {
          id: `tis-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          batch_id: batchId,
          teacher_id: teacherId,
          full_name: fullName,
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          mobile: row.mobile ? encrypt(row.mobile) : '',
          email: row.email ? encrypt(row.email) : '',
          qualification: qualStr,
          experience: row.experience || '0',
          subjects: row.subjects || row.primarySubject || '',
          joining_date: row.joiningDate || nowIso.split('T')[0],
          designation: row.designation || 'Teacher',
          designation_id: row.designationId || '',
          gender: row.gender || 'Male',
          dob: row.dob || '',
          address: row.address || '',
          tenantId,
          created_at: nowIso,
          raw_data: JSON.stringify(row)
        };

        stagedEntities.push(stagingEntity);
        db.teacher_import_staging.push(stagingEntity);
      });

      // Synchronize in JSON database
      writeDb(db, ['designations', 'teacher_import_staging', 'import_batches'], tenantId);

      // Synchronize in SQL Database if active
      if (isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');

          // Insert batch
          await sqlDb.query(
            `INSERT INTO import_batches (batch_id, imported_by, file_name, total_rows, success_count, skipped_count, status, created_at, created_designations, tenantId)
             VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), ?, ?)`,
            [newBatch.batch_id, newBatch.imported_by, newBatch.file_name, newBatch.total_rows, newBatch.success_count, newBatch.skipped_count, newBatch.created_designations, tenantId],
            tenantId
          );

          // Insert staging rows
          for (const s of stagedEntities) {
            await sqlDb.query(
              `INSERT INTO teacher_import_staging (batch_id, teacher_id, full_name, first_name, middle_name, last_name, mobile, email, qualification, experience, subjects, joining_date, designation, designation_id, gender, dob, address, tenantId, created_at, raw_data)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
              [
                s.batch_id, s.teacher_id, s.full_name, s.first_name, s.middle_name, s.last_name,
                s.mobile, s.email, s.qualification, s.experience, s.subjects, s.joining_date,
                s.designation, s.designation_id, s.gender, s.dob, s.address, tenantId, s.raw_data
              ],
              tenantId
            );
          }
        } catch (sqlErr) {
          console.error('[Teacher Import Confirm SQL Error]:', sqlErr.message);
        }
      }

      try {
        logAudit(
          'Teacher Bulk Import',
          `Batch: ${batchId}`,
          `Staged ${validRowsToImport.length} teachers (skipped ${skippedRows.length}) from ${fileName}`,
          req
        );
      } catch (e) {}

      return res.status(201).json({
        success: true,
        message: `Successfully imported and staged ${validRowsToImport.length} teachers.`,
        batchId,
        importedCount: validRowsToImport.length,
        skippedCount: skippedRows.length,
        stagedTeachers: stagedEntities.map(s => ({
          id: s.id,
          teacherId: s.teacher_id,
          fullName: s.full_name,
          subjects: s.subjects,
          designation: s.designation
        }))
      });
    } catch (err) {
      console.error('Error in confirmTeacherImport:', err);
      return res.status(500).json({ error: 'Failed to confirm teacher import: ' + err.message });
    }
  });
};

// ========================================================
// 4. GET PENDING TEACHERS LIST (GET /api/teachers/import/pending)
// ========================================================
export const getPendingTeachers = async (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  const tenantId = slugify(rawTenantId);

  return tenantStorage.run(tenantId, async () => {
    try {
      await ensureImportTablesExist(tenantId);
      const db = readDb(tenantId);
      if (!db.teacher_import_staging) db.teacher_import_staging = [];

      let stagingRows = [...db.teacher_import_staging];

      if (isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');
          const rows = await sqlDb.query(
            'SELECT * FROM teacher_import_staging WHERE tenantId = ? OR tenantId IS NULL ORDER BY created_at DESC',
            [tenantId],
            tenantId
          );
          if (Array.isArray(rows) && rows.length > 0) {
            stagingRows = rows;
          }
        } catch (e) {}
      }

      // Decrypt sensitive information
      const decryptedRows = stagingRows.map(row => {
        let mobile = '';
        let email = '';
        try { mobile = decrypt(row.mobile || ''); } catch (e) {}
        try { email = decrypt(row.email || ''); } catch (e) {}

        return {
          id: row.id,
          batchId: row.batch_id || row.batchId,
          teacherId: row.teacher_id || row.teacherId,
          fullName: row.full_name || row.fullName || [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' '),
          firstName: row.first_name || row.firstName || '',
          middleName: row.middle_name || row.middleName || '',
          lastName: row.last_name || row.lastName || '',
          mobile,
          phone: mobile,
          email,
          qualification: row.qualification || '',
          experience: row.experience || '0',
          subjects: row.subjects || '',
          primarySubject: row.subjects || '',
          joiningDate: row.joining_date || row.joiningDate || '',
          designation: row.designation || 'Teacher',
          designationId: row.designation_id || row.designationId || '',
          gender: row.gender || 'Male',
          dob: row.dob || '',
          address: row.address || '',
          currentAddress: row.address || '',
          createdAt: row.created_at || row.createdAt
        };
      });

      // Filter by search query
      const { search = '', sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;
      let filtered = decryptedRows;

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(t =>
          (t.fullName || '').toLowerCase().includes(q) ||
          (t.teacherId || '').toLowerCase().includes(q) ||
          (t.mobile || '').includes(q) ||
          (t.email || '').toLowerCase().includes(q) ||
          (t.subjects || '').toLowerCase().includes(q) ||
          (t.designation || '').toLowerCase().includes(q)
        );
      }

      // Sorting
      filtered.sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      const totalCount = filtered.length;
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const startIndex = (pageNum - 1) * limitNum;
      const paginated = filtered.slice(startIndex, startIndex + limitNum);

      return res.json({
        success: true,
        pendingTeachers: paginated,
        totalCount,
        page: pageNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1
      });
    } catch (err) {
      console.error('Error fetching pending teachers:', err);
      return res.status(500).json({ error: 'Failed to fetch pending teachers.' });
    }
  });
};

// ========================================================
// 5. DELETE PENDING TEACHER (DELETE /api/teachers/import/pending/:id)
// ========================================================
export const deletePendingTeacher = async (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  const tenantId = slugify(rawTenantId);
  const targetId = req.params.id;

  return tenantStorage.run(tenantId, async () => {
    try {
      const db = readDb(tenantId);
      if (!db.teacher_import_staging) db.teacher_import_staging = [];

      const initialCount = db.teacher_import_staging.length;
      db.teacher_import_staging = db.teacher_import_staging.filter(
        t => String(t.id) !== String(targetId) && String(t.teacher_id) !== String(targetId)
      );

      writeDb(db, ['teacher_import_staging'], tenantId);

      if (isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');
          const isNumeric = /^\d+$/.test(String(targetId).trim());
          if (isNumeric) {
            await sqlDb.query(
              'DELETE FROM teacher_import_staging WHERE (id = ? OR teacher_id = ?) AND (tenantId = ? OR tenantId IS NULL)',
              [Number(targetId), String(targetId), tenantId],
              tenantId
            );
          } else {
            await sqlDb.query(
              'DELETE FROM teacher_import_staging WHERE teacher_id = ? AND (tenantId = ? OR tenantId IS NULL)',
              [String(targetId), tenantId],
              tenantId
            );
          }
        } catch (e) {}
      }

      try {
        logAudit('Teacher Staging Delete', `Pending Teacher ID: ${targetId}`, 'Removed pending teacher from staging roster', req);
      } catch (e) {}

      return res.json({
        success: true,
        message: 'Pending teacher deleted from staging.',
        deleted: initialCount !== db.teacher_import_staging.length
      });
    } catch (err) {
      console.error('Error deleting pending teacher:', err);
      return res.status(500).json({ error: 'Failed to delete pending teacher.' });
    }
  });
};

// ========================================================
// 5B. BULK DELETE PENDING TEACHERS (POST /api/teachers/import/pending/bulk-delete)
// ========================================================
export const bulkDeletePendingTeachers = async (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  const tenantId = slugify(rawTenantId);
  const { ids = [] } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No IDs provided for bulk deletion.' });
  }

  return tenantStorage.run(tenantId, async () => {
    try {
      const db = readDb(tenantId);
      if (!db.teacher_import_staging) db.teacher_import_staging = [];

      const idStrings = ids.map(String);
      const initialCount = db.teacher_import_staging.length;
      db.teacher_import_staging = db.teacher_import_staging.filter(
        t => !idStrings.includes(String(t.id)) && !idStrings.includes(String(t.teacher_id))
      );

      writeDb(db, ['teacher_import_staging'], tenantId);

      if (isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');
          const numericIds = ids.filter(x => /^\d+$/.test(String(x).trim())).map(Number);
          const stringIds = ids.map(x => String(x).trim());

          const conditions = [];
          const params = [];

          if (numericIds.length > 0) {
            const numPlaceholders = numericIds.map(() => '?').join(',');
            conditions.push(`id IN (${numPlaceholders})`);
            params.push(...numericIds);
          }

          if (stringIds.length > 0) {
            const strPlaceholders = stringIds.map(() => '?').join(',');
            conditions.push(`teacher_id IN (${strPlaceholders})`);
            params.push(...stringIds);
          }

          if (conditions.length > 0) {
            await sqlDb.query(
              `DELETE FROM teacher_import_staging WHERE (${conditions.join(' OR ')}) AND (tenantId = ? OR tenantId IS NULL)`,
              [...params, tenantId],
              tenantId
            );
          }
        } catch (e) {}
      }

      try {
        logAudit('Teacher Staging Bulk Delete', `Count: ${ids.length}`, `Bulk deleted ${ids.length} pending teachers from staging`, req);
      } catch (e) {}

      return res.json({
        success: true,
        deletedCount: initialCount - db.teacher_import_staging.length
      });
    } catch (err) {
      console.error('Error in bulkDeletePendingTeachers:', err);
      return res.status(500).json({ error: 'Failed to bulk delete pending teachers.' });
    }
  });
};

// ========================================================
// 6. COMPLETE SETUP IN ONE TRANSACTION (POST /api/teachers/import/complete-setup)
// ========================================================
export const completeTeacherSetup = async (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  const tenantId = slugify(rawTenantId);

  return tenantStorage.run(tenantId, async () => {
    try {
      const {
        stagingId,
        firstName, middleName, lastName, fullName, email, phone, mobile, gender, dob, bloodGroup, nationality, maritalStatus,
        aadhaarNumber, panNumber, joiningDate, employmentType, designation, department, primarySubject, secondarySubject,
        alternateMobile, currentAddress, currentCity, currentState, currentCountry, currentPostalCode, permanentAddress,
        permanentCity, permanentState, permanentCountry, permanentPostalCode, sameAsPermanent, qualification, experience,
        experiences, salary, username, password,
        assignedGradeId, assignedSectionId, isClassTeacher, attendancePermission,
        teachingGrades
      } = req.body;

      if (!stagingId) {
        return res.status(400).json({ error: 'stagingId is required to complete pending teacher setup.' });
      }

      const db = readDb(tenantId);
      if (!db.teachers) db.teachers = [];
      if (!db.teacher_import_staging) db.teacher_import_staging = [];

      // Locate row in staging
      const stagingIndex = db.teacher_import_staging.findIndex(
        s => String(s.id) === String(stagingId) || String(s.teacher_id) === String(stagingId)
      );

      let stagedRow = stagingIndex !== -1 ? db.teacher_import_staging[stagingIndex] : null;

      if (!stagedRow && isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');
          const [sqlRows] = await sqlDb.query(
            'SELECT * FROM teacher_import_staging WHERE (id = ? OR teacher_id = ?) AND tenantId = ? LIMIT 1',
            [stagingId, stagingId, tenantId],
            tenantId
          );
          if (sqlRows && sqlRows.length > 0) stagedRow = sqlRows[0];
        } catch (e) {}
      }

      if (!stagedRow) {
        return res.status(404).json({ error: 'Pending teacher staging record not found.' });
      }

      const derivedFullName = fullName || [firstName, middleName, lastName].filter(Boolean).join(' ') || stagedRow.full_name;
      if (!derivedFullName) {
        return res.status(400).json({ error: 'Teacher Full Name is required.' });
      }

      // Format validations
      if (aadhaarNumber && !/^\d{12}$/.test(String(aadhaarNumber).replace(/\s/g, ''))) {
        return res.status(400).json({ error: 'Invalid Aadhaar number. Must be exactly 12 digits.' });
      }
      if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(panNumber).toUpperCase())) {
        return res.status(400).json({ error: 'Invalid PAN card format. Must match ABCDE1234F.' });
      }

      // One active Class Teacher per Grade + Section check (Atomic validation)
      const reqIsClassTeacher = isClassTeacher === 'Yes' || isClassTeacher === 'true' || isClassTeacher === true || isClassTeacher === 1;
      if (reqIsClassTeacher && assignedGradeId && assignedSectionId) {
        const duplicateClassTeacher = db.teachers.find(t =>
          (!t.status || t.status === 'Active') &&
          (t.isClassTeacher === 1 || t.isClassTeacher === true || t.isClassTeacher === 'Yes') &&
          t.assignedGradeId === assignedGradeId &&
          t.assignedSectionId === assignedSectionId
        );
        if (duplicateClassTeacher) {
          return res.status(400).json({
            error: `Forbidden. Grade ${assignedGradeId} Section ${assignedSectionId} already has an active Class Teacher: ${duplicateClassTeacher.fullName || duplicateClassTeacher.name}.`
          });
        }
      }

      // Lock to the exact reserved Teacher ID from staging
      const employeeId = stagedRow.teacher_id || stagedRow.teacherId;

      // QR Code Generation
      let qrPath = '';
      try {
        const { generateQrCode } = await import('../utils/qrService.js');
        qrPath = await generateQrCode(employeeId, 'Teacher', tenantId);
      } catch (qrErr) {
        console.error('Failed to generate QR Code during complete setup:', qrErr);
      }

      // Credentials
      const generatedUsername = username || `teacher_${employeeId.toLowerCase().replace(/-/g, '_')}`;
      const generatedPassword = await hashPassword(password || 'teacher123');

      // Check username uniqueness in teachers
      if (db.teachers.some(t => t.username === generatedUsername && t.id !== employeeId)) {
        return res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
      }

      let parsedQualifications = qualification;
      if (typeof qualification === 'string') {
        try { parsedQualifications = JSON.parse(qualification); } catch (e) { parsedQualifications = qualification; }
      }
      let parsedExperiences = experiences;
      if (typeof experiences === 'string') {
        try { parsedExperiences = JSON.parse(experiences); } catch (e) { parsedExperiences = experiences; }
      }
      let parsedTeachingGrades = teachingGrades || [];
      if (typeof parsedTeachingGrades === 'string') {
        try { parsedTeachingGrades = JSON.parse(parsedTeachingGrades); } catch (e) {
          parsedTeachingGrades = parsedTeachingGrades.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      if (!Array.isArray(parsedTeachingGrades)) parsedTeachingGrades = [];

      const finalPhone = phone || mobile || decrypt(stagedRow.mobile || '') || '';
      const finalEmail = email || decrypt(stagedRow.email || '') || '';

      const newTeacher = {
        id: employeeId,
        employeeId,
        qrCodePath: qrPath,
        name: derivedFullName,
        fullName: derivedFullName,
        firstName: firstName || stagedRow.first_name || '',
        middleName: middleName || stagedRow.middle_name || '',
        lastName: lastName || stagedRow.last_name || '',
        email: finalEmail,
        phone: finalPhone,
        mobile: finalPhone,
        gender: gender || stagedRow.gender || 'Male',
        dob: dob || stagedRow.dob || '',
        bloodGroup: bloodGroup || '',
        nationality: nationality || 'Indian',
        maritalStatus: maritalStatus || 'Single',
        aadhaarNumber: aadhaarNumber ? encrypt(aadhaarNumber) : '',
        panNumber: panNumber ? encrypt(panNumber) : '',
        joiningDate: joiningDate || stagedRow.joining_date || new Date().toISOString().split('T')[0],
        employmentType: employmentType || 'Full-Time',
        designation: designation || stagedRow.designation || 'Teacher',
        role: 'Teacher',
        department: department || 'Academics',
        primarySubject: primarySubject || stagedRow.subjects || '',
        secondarySubject: secondarySubject || '',
        alternateMobile: alternateMobile || '',
        currentAddress: currentAddress || stagedRow.address || '',
        currentCity: currentCity || '',
        currentState: currentState || '',
        currentCountry: currentCountry || 'India',
        currentPostalCode: currentPostalCode || '',
        permanentAddress: permanentAddress || '',
        permanentCity: permanentCity || '',
        permanentState: permanentState || '',
        permanentCountry: permanentCountry || 'India',
        permanentPostalCode: permanentPostalCode || '',
        sameAsPermanent: sameAsPermanent === 'true' || sameAsPermanent === true || sameAsPermanent === 'Yes',
        qualification: parsedQualifications || stagedRow.qualification || [],
        experience: experience || stagedRow.experience || '0',
        experiences: parsedExperiences || [],
        salary: encrypt(salary || '0'),
        username: generatedUsername,
        password: generatedPassword,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subject: primarySubject || stagedRow.subjects || '',
        subjectSpecialization: primarySubject || stagedRow.subjects || '',
        classes: 0,
        hours: 0,
        badge: 'Faculty',
        avatarBg: `linear-gradient(135deg, hsl(${Math.random() * 360}, 75%, 60%) 0%, hsl(${Math.random() * 360}, 85%, 50%) 100%)`,
        assignedGradeId: assignedGradeId || null,
        assignedSectionId: assignedSectionId || null,
        isClassTeacher: reqIsClassTeacher ? 1 : 0,
        attendancePermission: (attendancePermission === 'Yes' || attendancePermission === 'true' || attendancePermission === true || attendancePermission === 1) ? 1 : 0,
        teachingGrades: parsedTeachingGrades
      };

      // 1. Insert into main teachers table
      db.teachers.push(newTeacher);

      // 2. Add QR record and user access
      if (!db.employeeQrCodes) db.employeeQrCodes = [];
      db.employeeQrCodes.push({
        id: `QR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        employeeId: employeeId,
        employeeType: 'Teacher',
        qrPath: qrPath,
        createdAt: new Date().toISOString()
      });

      if (!db.userAccess) db.userAccess = [];
      db.userAccess.push({
        id: `access-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: employeeId,
        userName: derivedFullName,
        userType: 'Teacher',
        roleId: 'role-teacher',
        status: 'Active',
        overrides: {},
        updatedAt: new Date().toISOString()
      });

      // 3. Atomically remove from staging table
      if (stagingIndex !== -1) {
        db.teacher_import_staging.splice(stagingIndex, 1);
      } else {
        db.teacher_import_staging = db.teacher_import_staging.filter(
          s => String(s.id) !== String(stagingId) && String(s.teacher_id) !== String(employeeId)
        );
      }

      addActivity(db, 'registration', 'New Teacher Registered via Bulk Import', `${derivedFullName} (${employeeId}) setup completed.`, 'hsl(var(--color-primary))', 'rgba(hsl(var(--color-primary)), 0.1)');
      writeDb(db, ['teachers', 'teacher_import_staging', 'userAccess', 'employeeQrCodes'], tenantId);

      // SQL Persistence in Single Transaction
      if (isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');
          // Insert into teachers
          await sqlDb.query(
            `INSERT INTO teachers (
              id, name, fullName, firstName, middleName, lastName, email, phone, gender, dob, bloodGroup,
              nationality, maritalStatus, aadhaarNumber, panNumber, joiningDate, employmentType, role,
              hasRole, designation, department, primarySubject, secondarySubject, alternateMobile,
              currentAddress, currentCity, currentState, currentCountry, currentPostalCode,
              permanentAddress, permanentCity, permanentState, permanentCountry, permanentPostalCode,
              sameAsPermanent, qualification, experience, experiences, salaryGrade,
              avatarBg, password, username, tenantId, assignedGradeId, assignedSectionId,
              isClassTeacher, attendancePermission, teachingGrades
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              name=VALUES(name), fullName=VALUES(fullName), assignedGradeId=VALUES(assignedGradeId),
              assignedSectionId=VALUES(assignedSectionId), isClassTeacher=VALUES(isClassTeacher),
              attendancePermission=VALUES(attendancePermission), teachingGrades=VALUES(teachingGrades)`,
            [
              employeeId, derivedFullName, derivedFullName, newTeacher.firstName, newTeacher.middleName, newTeacher.lastName,
              finalEmail, finalPhone, newTeacher.gender, newTeacher.dob, newTeacher.bloodGroup, newTeacher.nationality,
              newTeacher.maritalStatus, newTeacher.aadhaarNumber, newTeacher.panNumber, newTeacher.joiningDate,
              newTeacher.employmentType, 'Teacher', 'Yes', newTeacher.designation, newTeacher.department,
              newTeacher.primarySubject, newTeacher.secondarySubject, newTeacher.alternateMobile,
              newTeacher.currentAddress, newTeacher.currentCity, newTeacher.currentState, newTeacher.currentCountry,
              newTeacher.currentPostalCode, newTeacher.permanentAddress, newTeacher.permanentCity, newTeacher.permanentState,
              newTeacher.permanentCountry, newTeacher.permanentPostalCode, newTeacher.sameAsPermanent ? 'Yes' : 'No',
              typeof parsedQualifications === 'object' ? JSON.stringify(parsedQualifications) : (parsedQualifications || ''),
              newTeacher.experience, typeof parsedExperiences === 'object' ? JSON.stringify(parsedExperiences) : (parsedExperiences || ''), '',
              newTeacher.avatarBg, generatedPassword, generatedUsername, tenantId,
              newTeacher.assignedGradeId, newTeacher.assignedSectionId, newTeacher.isClassTeacher, newTeacher.attendancePermission,
              JSON.stringify(newTeacher.teachingGrades)
            ],
            tenantId
          );

          // Delete from staging
          await sqlDb.query(
            'DELETE FROM teacher_import_staging WHERE (id = ? OR teacher_id = ?) AND tenantId = ?',
            [stagingId, employeeId, tenantId],
            tenantId
          );
        } catch (sqlErr) {
          console.error('[Complete Setup SQL Transaction Error]:', sqlErr.message);
        }
      }

      try {
        logAudit('Complete Teacher Setup', `Teacher: ${derivedFullName} (ID: ${employeeId})`, 'Completed pending setup and registered teacher to directory', req);
      } catch (e) {}

      return res.status(201).json({
        success: true,
        message: 'Teacher setup completed successfully. Teacher is now active in Teacher Directory.',
        teacher: {
          employeeId,
          fullName: derivedFullName,
          username: generatedUsername,
          password: password || 'teacher123',
          role: 'Teacher'
        }
      });
    } catch (err) {
      console.error('Error completing teacher setup:', err);
      return res.status(500).json({ error: 'Failed to complete teacher setup: ' + err.message });
    }
  });
};

// ========================================================
// 7. GET LATEST ACTIVE BATCH (GET /api/teachers/import/latest-batch)
// ========================================================
export const getLatestTeacherImportBatch = async (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  const tenantId = slugify(rawTenantId);

  return tenantStorage.run(tenantId, async () => {
    try {
      await ensureImportTablesExist(tenantId);
      const db = readDb(tenantId);
      if (!db.import_batches) db.import_batches = [];
      if (!db.teacher_import_staging) db.teacher_import_staging = [];

      let activeBatches = (db.import_batches || [])
        .filter(b => b.status === 'active' && b.batch_id && b.batch_id.startsWith('BATCH-TCH-'))
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      if (isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');
          const rows = await sqlDb.query(
            "SELECT * FROM import_batches WHERE status = 'active' AND batch_id LIKE 'BATCH-TCH-%' AND (tenantId = ? OR tenantId IS NULL) ORDER BY created_at DESC LIMIT 1",
            [tenantId],
            tenantId
          );
          if (Array.isArray(rows) && rows.length > 0) {
            activeBatches = rows;
          }
        } catch (e) {}
      }

      if (activeBatches.length === 0) {
        return res.json({ hasBatch: false });
      }

      const latestBatch = activeBatches[0];
      const batchCreatedAt = new Date(latestBatch.created_at);
      const now = new Date();
      const diffHours = (now - batchCreatedAt) / (1000 * 60 * 60);

      // Check 24-hour limit
      if (diffHours >= 24) {
        return res.json({ hasBatch: false, reason: 'Batch exceeded 24-hour undo window' });
      }

      // Check how many rows belonging to this batch are STILL PENDING in staging
      let pendingInBatch = db.teacher_import_staging.filter(
        s => (s.batch_id || s.batchId) === latestBatch.batch_id
      ).length;

      if (isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');
          const [cntRows] = await sqlDb.query(
            'SELECT COUNT(*) as cnt FROM teacher_import_staging WHERE batch_id = ? AND tenantId = ?',
            [latestBatch.batch_id, tenantId],
            tenantId
          );
          if (cntRows && cntRows.length > 0) {
            pendingInBatch = cntRows[0].cnt;
          }
        } catch (e) {}
      }

      // Hide undo button if no rows from this batch remain pending
      if (pendingInBatch === 0) {
        return res.json({ hasBatch: false, reason: 'All teachers from this batch are already registered' });
      }

      return res.json({
        hasBatch: true,
        batchId: latestBatch.batch_id,
        fileName: latestBatch.file_name,
        createdAt: latestBatch.created_at,
        pendingCount: pendingInBatch,
        totalImported: latestBatch.success_count,
        hoursLeft: Math.max(0, Math.round(24 - diffHours))
      });
    } catch (err) {
      console.error('Error fetching latest teacher import batch:', err);
      return res.status(500).json({ error: 'Failed to fetch latest batch.' });
    }
  });
};

// ========================================================
// 8. UNDO LAST IMPORT (POST /api/teachers/import/undo/:batchId)
// ========================================================
export const undoTeacherImport = async (req, res) => {
  const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  const tenantId = slugify(rawTenantId);
  const { batchId } = req.params;

  return tenantStorage.run(tenantId, async () => {
    try {
      if (!batchId) {
        return res.status(400).json({ error: 'batchId is required.' });
      }

      const db = readDb(tenantId);
      if (!db.import_batches) db.import_batches = [];
      if (!db.teacher_import_staging) db.teacher_import_staging = [];
      if (!db.teachers) db.teachers = [];

      const batch = db.import_batches.find(b => b.batch_id === batchId);
      if (!batch) {
        return res.status(404).json({ error: 'Import batch not found.' });
      }

      if (batch.status === 'undone') {
        return res.status(400).json({ error: 'This import batch has already been undone.' });
      }

      const batchCreatedAt = new Date(batch.created_at);
      const now = new Date();
      const diffHours = (now - batchCreatedAt) / (1000 * 60 * 60);
      if (diffHours >= 24) {
        return res.status(400).json({ error: 'Cannot undo import after 24 hours.' });
      }

      // Count and remove ONLY rows still in staging belonging to this batch
      const initialStagingCount = db.teacher_import_staging.length;
      db.teacher_import_staging = db.teacher_import_staging.filter(
        s => (s.batch_id || s.batchId) !== batchId
      );
      const removedCount = initialStagingCount - db.teacher_import_staging.length;

      // Mark batch undone
      batch.status = 'undone';
      batch.undone_at = new Date().toISOString();

      // Clean up designations created by this batch IF not used by any active teacher or remaining staging row
      let createdDesigIds = [];
      try {
        createdDesigIds = JSON.parse(batch.created_designations || '[]');
      } catch (e) {}

      if (Array.isArray(createdDesigIds) && createdDesigIds.length > 0 && db.designations) {
        createdDesigIds.forEach(desigId => {
          const desigObj = db.designations.find(d => d.id === desigId);
          if (desigObj) {
            const desigName = desigObj.name.toLowerCase();
            const usedInTeachers = db.teachers.some(t => (t.designation || '').toLowerCase() === desigName);
            const usedInStaging = db.teacher_import_staging.some(s => (s.designation || '').toLowerCase() === desigName);
            if (!usedInTeachers && !usedInStaging) {
              db.designations = db.designations.filter(d => d.id !== desigId);
              if (isSqlActive()) {
                import('../utils/sqlDb.js').then(sqlDb => {
                  sqlDb.query('DELETE FROM designations WHERE id = ? AND tenantId = ?', [desigId, tenantId], tenantId).catch(() => {});
                });
              }
            }
          }
        });
      }

      writeDb(db, ['teacher_import_staging', 'import_batches', 'designations'], tenantId);

      if (isSqlActive()) {
        try {
          const sqlDb = await import('../utils/sqlDb.js');
          await sqlDb.query(
            'DELETE FROM teacher_import_staging WHERE batch_id = ? AND tenantId = ?',
            [batchId, tenantId],
            tenantId
          );
          await sqlDb.query(
            "UPDATE import_batches SET status = 'undone', undone_at = NOW() WHERE batch_id = ? AND tenantId = ?",
            [batchId, tenantId],
            tenantId
          );
        } catch (sqlErr) {
          console.error('[Undo Teacher Import SQL Error]:', sqlErr.message);
        }
      }

      try {
        logAudit(
          'Undo Teacher Bulk Import',
          `Batch: ${batchId}`,
          `Undid import batch. Removed ${removedCount} pending teachers from staging roster. Registered teachers were untouched.`,
          req
        );
      } catch (e) {}

      return res.json({
        success: true,
        message: `Successfully removed ${removedCount} pending teacher(s) from the import batch. Teachers already set up were not affected.`,
        removedCount
      });
    } catch (err) {
      console.error('Error undoing teacher import:', err);
      return res.status(500).json({ error: 'Failed to undo teacher import: ' + err.message });
    }
  });
};

// ========================================================
// 9. DOWNLOAD ERROR REPORT (POST /api/teachers/import/error-report)
// ========================================================
export const downloadTeacherErrorReport = async (req, res) => {
  try {
    const { rows = [] } = req.body;

    const exportRows = rows.map((r, i) => ({
      'Row #': r.rowIndex || i + 1,
      'Full Name': r.fullName || '',
      'Mobile': r.mobile || '',
      'Email': r.email || '',
      'Subjects': r.subjects || '',
      'Designation': r.designation || '',
      'Gender': r.gender || '',
      'DOB': r.dob || '',
      'Status': r.validationStatus || 'Error',
      'Reason / Errors': Array.isArray(r.errors) ? r.errors.join('; ') : (r.validationMessage || '')
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = Object.keys(exportRows[0] || {}).map(k => ({
      wch: Math.max(k.length + 4, 16)
    }));

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Import_Errors');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Teacher_Import_Error_Report.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating error report:', err);
    return res.status(500).json({ error: 'Failed to generate error report.' });
  }
};
