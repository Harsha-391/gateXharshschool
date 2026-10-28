/**
 * Student Bulk Import Controller
 * Implements Template Generation, File Upload Preview, Batch Import Execution,
 * Job Status Tracking, and 24-Hour Batch Undo.
 */

import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';
import { readDb, writeDb, addActivity, tenantStorage, slugify } from '../utils/db.js';
import { logAudit } from '../utils/logger.js';
import { decrypt } from '../utils/encryptionHelper.js';
import { createStudentEntity } from './studentController.js';
import {
  FIELD_DEFINITIONS,
  matchHeaderToField,
  sanitizeCellValue,
  parseDateToIso,
  normalizePhone,
  normalizeGender,
  normalizeBloodGroup,
  normalizeCategory,
  normalizeReligion,
  matchMasterGrade,
  validateStudentImportRow
} from '../utils/studentImportHelper.js';

// In-memory job progress tracker
const importJobs = new Map();

// Limits
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROW_LIMIT = 2000;

// ==========================================
// 1. DOWNLOAD SAMPLE TEMPLATE (GET /students/import/template)
// ==========================================
export const downloadImportTemplate = async (req, res) => {
  try {
    const tenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
    const db = tenantStorage.run(slugify(tenantId), () => readDb());
    const existingGrades = (db.grades || []).map(g => g.name || g);

    // Default grade examples
    const sampleGrade1 = existingGrades.length > 0 ? existingGrades[0] : 'Grade I';
    const sampleGrade2 = existingGrades.length > 1 ? existingGrades[1] : 'Grade VI';

    // Sample data to guide the administrator
    const sampleRows = [
      {
        'First Name': 'Aarav',
        'Last Name': 'Sharma',
        'Middle Name': 'Kumar',
        'Date of Birth': '2015-05-14',
        'Gender': 'Male',
        'Class / Grade': sampleGrade1,
        'Section': 'A',
        'Roll Number': '101',
        'Admission Number': '', // Empty to test auto-generation
        'Admission Date': '2026-04-01',
        'Father Name': 'Vikram Sharma',
        'Father Mobile': '9876543210',
        'Father Email': 'vikram.sharma@example.com',
        'Mother Name': 'Sunita Sharma',
        'Mother Mobile': '9876543211',
        'Mother Email': 'sunita.sharma@example.com',
        'Aadhaar Number': '123456789012',
        'Category': 'General',
        'Religion': 'Hinduism',
        'Blood Group': 'O+',
        'Current Address': '42 Sunrise Enclave, Park Road',
        'City': 'Indore',
        'State': 'Madhya Pradesh',
        'Postal Code': '452001'
      },
      {
        'First Name': 'Ananya',
        'Last Name': 'Sharma',
        'Middle Name': '',
        'Date of Birth': '2012-09-22',
        'Gender': 'Female',
        'Class / Grade': sampleGrade2,
        'Section': 'B',
        'Roll Number': '102',
        'Admission Number': '',
        'Admission Date': '2026-04-01',
        'Father Name': 'Vikram Sharma',
        'Father Mobile': '9876543210',
        'Father Email': 'vikram.sharma@example.com', // Demonstrates sibling linking to same father account
        'Mother Name': 'Sunita Sharma',
        'Mother Mobile': '9876543211',
        'Mother Email': 'sunita.sharma@example.com',
        'Aadhaar Number': '123456789013',
        'Category': 'General',
        'Religion': 'Hinduism',
        'Blood Group': 'B+',
        'Current Address': '42 Sunrise Enclave, Park Road',
        'City': 'Indore',
        'State': 'Madhya Pradesh',
        'Postal Code': '452001'
      },
      {
        'First Name': 'Priya',
        'Last Name': 'Patel',
        'Middle Name': '',
        'Date of Birth': '2014-11-05',
        'Gender': 'Female',
        'Class / Grade': sampleGrade1,
        'Section': 'A',
        'Roll Number': '103',
        'Admission Number': '',
        'Admission Date': '2026-04-01',
        'Father Name': 'Rajesh Patel',
        'Father Mobile': '9812345678',
        'Father Email': 'rajesh.patel@example.com',
        'Mother Name': 'Geeta Patel',
        'Mother Mobile': '9812345679',
        'Mother Email': '',
        'Aadhaar Number': '987654321098',
        'Category': 'OBC',
        'Religion': 'Hinduism',
        'Blood Group': 'A+',
        'Current Address': '15 Nilgiri Hills',
        'City': 'Ahmedabad',
        'State': 'Gujarat',
        'Postal Code': '380015'
      }
    ];

    const worksheet = xlsx.utils.json_to_sheet(sampleRows);

    // Set column widths for readability
    worksheet['!cols'] = Object.keys(sampleRows[0]).map(k => ({
      wch: Math.max(k.length + 4, 16)
    }));

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Students_Template');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Student_Import_Template.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating import template:', err);
    return res.status(500).json({ error: 'Failed to generate import template.' });
  }
};

// ==========================================
// 2. PARSE & PREVIEW IMPORT FILE (POST /students/import/preview)
// ==========================================
export const previewImportFile = async (req, res) => {
  const tenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  let tempFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a .xlsx, .xls, or .csv file.' });
    }

    tempFilePath = req.file.path;
    const originalName = req.file.originalname || '';
    const ext = path.extname(originalName).toLowerCase();

    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ error: 'Unsupported file format. Please upload .xlsx, .xls, or .csv.' });
    }

    if (req.file.size > MAX_FILE_SIZE_BYTES) {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ error: 'File size exceeds maximum allowed limit of 5 MB.' });
    }

    // Read Workbook from buffer or disk
    const workbook = req.file.buffer 
      ? xlsx.read(req.file.buffer, { cellDates: true, raw: false })
      : xlsx.readFile(tempFilePath, { cellDates: true, raw: false });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ error: 'Uploaded spreadsheet is empty.' });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Convert to 2D array: header row + data rows
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Clean up temporary file immediately
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      tempFilePath = null;
    }

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ error: 'Spreadsheet contains no data.' });
    }

    // Header extraction
    const rawHeaders = rawData[0].map(h => sanitizeCellValue(h).toString().trim()).filter(Boolean);
    const dataRows = rawData.slice(1).filter(row => row.some(cell => String(cell).trim() !== ''));

    if (dataRows.length === 0) {
      return res.status(400).json({ error: 'No student data rows found in the uploaded file.' });
    }

    if (dataRows.length > MAX_ROW_LIMIT) {
      return res.status(400).json({ error: `File contains ${dataRows.length} rows, which exceeds the limit of ${MAX_ROW_LIMIT} rows.` });
    }

    // Auto-match headers to system fields
    const detectedMapping = {};
    const unmappedHeaders = [];

    rawHeaders.forEach(header => {
      const matchedFieldKey = matchHeaderToField(header);
      if (matchedFieldKey) {
        detectedMapping[header] = matchedFieldKey;
      } else {
        detectedMapping[header] = '';
        unmappedHeaders.push(header);
      }
    });

    // Tenant database for validation
    const db = tenantStorage.run(slugify(tenantId), () => readDb());
    const existingStudents = (db.students || []).filter(s => s.is_deleted_by_batch !== 'Yes');
    const activeGrades = db.grades || [];

    // Collect emails belonging to non-parents (teachers, staff, employees, admin)
    const nonParentEmails = new Set();
    (db.teachers || []).forEach(t => { if (t.email) nonParentEmails.add(t.email.toLowerCase().trim()); });
    (db.staff || []).forEach(s => { if (s.email) nonParentEmails.add(s.email.toLowerCase().trim()); });
    (db.employees || []).forEach(e => { if (e.email) nonParentEmails.add(e.email.toLowerCase().trim()); });
    if (db.school && db.school.adminEmail) nonParentEmails.add(db.school.adminEmail.toLowerCase().trim());
    if (db.platformOwner && db.platformOwner.email) nonParentEmails.add(db.platformOwner.email.toLowerCase().trim());

    // Map rows into normalized objects
    const parsedRows = dataRows.map((rowArr, rowIndex) => {
      const rowObj = {};
      rawHeaders.forEach((header, colIdx) => {
        const fieldKey = detectedMapping[header];
        let cellVal = sanitizeCellValue(rowArr[colIdx]);
        if (fieldKey) {
          rowObj[fieldKey] = cellVal;
        }
        // Retain original raw cell value keyed by header for custom mapping updates
        rowObj[`_raw_${header}`] = cellVal;
      });

      // Normalize basic fields
      if (rowObj.dob) rowObj.dob = parseDateToIso(rowObj.dob);
      if (rowObj.admissionDate) rowObj.admissionDate = parseDateToIso(rowObj.admissionDate);
      if (rowObj.gender) rowObj.gender = normalizeGender(rowObj.gender);
      if (rowObj.studentClass) rowObj.studentClass = matchMasterGrade(rowObj.studentClass, activeGrades);
      if (rowObj.bloodGroup) rowObj.bloodGroup = normalizeBloodGroup(rowObj.bloodGroup);
      if (rowObj.category) rowObj.category = normalizeCategory(rowObj.category);
      if (rowObj.religion) rowObj.religion = normalizeReligion(rowObj.religion);
      if (rowObj.fatherMobile) rowObj.fatherMobile = normalizePhone(rowObj.fatherMobile);
      if (rowObj.motherMobile) rowObj.motherMobile = normalizePhone(rowObj.motherMobile);

      return rowObj;
    });

    // Validate each row
    const rowResults = parsedRows.map((rowObj, index) => {
      const validation = validateStudentImportRow(rowObj, index, {
        existingStudents,
        nonParentEmails,
        activeGrades,
        fileRows: parsedRows,
        useMotherEmailFallback: req.body.useMotherEmailFallback === 'true'
      });

      return {
        rowIndex: index + 1,
        data: rowObj,
        status: validation.status,
        errors: validation.errors,
        warnings: validation.warnings,
        message: validation.message,
        isSibling: validation.isSibling
      };
    });

    const summary = {
      total: rowResults.length,
      ok: rowResults.filter(r => r.status === 'OK').length,
      warning: rowResults.filter(r => r.status === 'Warning').length,
      error: rowResults.filter(r => r.status === 'Error').length
    };

    return res.json({
      fileName: originalName,
      fileColumns: rawHeaders,
      detectedMapping,
      availableFields: FIELD_DEFINITIONS,
      unmappedHeaders,
      totalRows: rowResults.length,
      rows: rowResults,
      summary
    });

  } catch (err) {
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    console.error('Error previewing student import file:', err);
    return res.status(500).json({ error: 'Failed to parse and preview spreadsheet file: ' + err.message });
  }
};

// ==========================================
// 3. CONFIRM & EXECUTE BATCH IMPORT (POST /students/import/confirm)
// ==========================================
export const confirmBatchImport = async (req, res) => {
  const tenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  
  try {
    const {
      rows = [],
      columnMapping = {},
      skipWarnings = false,
      skipDuplicates = true,
      useMotherEmailFallback = false,
      selectedRowIndexes = null,
      fileName = 'students_import.xlsx'
    } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided for import.' });
    }

    const db = tenantStorage.run(slugify(tenantId), () => readDb());
    const existingStudents = (db.students || []).filter(s => s.is_deleted_by_batch !== 'Yes');
    const activeGrades = db.grades || [];

    // Collect non-parent emails
    const nonParentEmails = new Set();
    (db.teachers || []).forEach(t => { if (t.email) nonParentEmails.add(t.email.toLowerCase().trim()); });
    (db.staff || []).forEach(s => { if (s.email) nonParentEmails.add(s.email.toLowerCase().trim()); });
    (db.employees || []).forEach(e => { if (e.email) nonParentEmails.add(e.email.toLowerCase().trim()); });
    if (db.school?.adminEmail) nonParentEmails.add(db.school.adminEmail.toLowerCase().trim());

    const jobId = `JOB-${Date.now()}`;
    const batchId = `BATCH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const importedAt = new Date().toISOString();

    // Initialize progress tracking
    importJobs.set(jobId, {
      jobId,
      batchId,
      status: 'processing',
      progress: 0,
      total: rows.length,
      importedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      failedRows: [],
      importedStudents: [],
      createdAt: importedAt
    });

    // Send immediate response with Job ID for async progress polling
    res.json({
      message: 'Import processing initiated.',
      jobId,
      batchId,
      totalRows: rows.length
    });

    // Execute import in background event tick
    setImmediate(async () => {
      tenantStorage.run(slugify(tenantId), async () => {
        const activeDb = readDb(tenantId) || {};
        if (!activeDb.students) activeDb.students = [];
        const job = importJobs.get(jobId);
        const importedEntities = [];
        let skipped = 0;
        let failed = 0;

        for (let i = 0; i < rows.length; i++) {
          const rawRow = rows[i];
          const rowIndex = i + 1;

          // Check if admin manually deselected this row
          if (selectedRowIndexes && !selectedRowIndexes.includes(rowIndex)) {
            skipped++;
            job.skippedCount = skipped;
            continue;
          }

          // Remap row data using updated columnMapping if provided
          const studentData = { ...rawRow };
          if (Object.keys(columnMapping).length > 0) {
            Object.entries(columnMapping).forEach(([colHeader, fieldKey]) => {
              if (fieldKey && rawRow[`_raw_${colHeader}`] !== undefined) {
                studentData[fieldKey] = rawRow[`_raw_${colHeader}`];
              }
            });
          }

          // Re-normalize values
          if (studentData.dob) studentData.dob = parseDateToIso(studentData.dob);
          if (studentData.admissionDate) studentData.admissionDate = parseDateToIso(studentData.admissionDate);
          if (studentData.gender) studentData.gender = normalizeGender(studentData.gender);
          if (studentData.studentClass) studentData.studentClass = matchMasterGrade(studentData.studentClass, activeGrades);
          if (studentData.bloodGroup) studentData.bloodGroup = normalizeBloodGroup(studentData.bloodGroup);
          if (studentData.category) studentData.category = normalizeCategory(studentData.category);
          if (studentData.religion) studentData.religion = normalizeReligion(studentData.religion);
          if (studentData.fatherMobile) studentData.fatherMobile = normalizePhone(studentData.fatherMobile);
          if (studentData.motherMobile) studentData.motherMobile = normalizePhone(studentData.motherMobile);

          // Full validation
          const validation = validateStudentImportRow(studentData, i, {
            existingStudents: [...existingStudents, ...importedEntities],
            nonParentEmails,
            activeGrades,
            fileRows: rows,
            useMotherEmailFallback
          });

          // Check error condition
          if (validation.errors.length > 0) {
            // If duplicate and skipDuplicates is true, skip silently
            const isDuplicate = validation.errors.some(e => e.toLowerCase().includes('duplicate') || e.toLowerCase().includes('already exists'));
            if (isDuplicate && skipDuplicates) {
              skipped++;
              job.skippedCount = skipped;
              continue;
            }

            failed++;
            job.failedCount = failed;
            job.failedRows.push({
              rowIndex,
              name: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Unknown',
              reason: validation.errors.join('; ')
            });
            continue;
          }

          // Check warning condition
          if (validation.warnings.length > 0 && skipWarnings) {
            skipped++;
            job.skippedCount = skipped;
            continue;
          }

          // Row is valid -> Create student entity in isolated try/catch
          try {
            const newStudent = await createStudentEntity(studentData, {
              tenantId,
              db: { students: [...existingStudents, ...importedEntities] },
              isImport: true,
              importBatchId: batchId,
              importedAt,
              mustChangePassword: true,
              useMotherEmailFallback
            });

            importedEntities.push(newStudent);
            job.importedCount = importedEntities.length;
          } catch (rowErr) {
            console.error(`[Import Row Error] Failed to process row ${rowIndex}:`, rowErr);
            failed++;
            job.failedCount = failed;
            job.failedRows.push({
              rowIndex,
              name: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Unknown',
              reason: rowErr.message || 'Entity creation failure'
            });
          }

          // Update progress
          job.progress = Math.round(((i + 1) / rows.length) * 100);
        }

        // Commit all successfully imported students to DB
        if (importedEntities.length > 0) {
          activeDb.students.push(...importedEntities);
          activeDb.students = [...activeDb.students];
          addActivity(
            activeDb,
            'registration',
            'Bulk Student Import',
            `Imported ${importedEntities.length} students via bulk file upload.`,
            'hsl(var(--color-primary))',
            'rgba(hsl(var(--color-primary)), 0.1)'
          );
          writeDb(activeDb, ['students'], tenantId);
          const safeReq = (req && req.headers) ? req : { headers: {}, ip: '127.0.0.1' };
          logAudit(
            'Student Bulk Import',
            `Imported ${importedEntities.length} students (Batch ID: ${batchId}, File: ${fileName})`,
            `Success: ${importedEntities.length}, Skipped: ${skipped}, Failed: ${failed}`,
            safeReq
          );
        }

        job.status = 'completed';
        job.progress = 100;
        job.importedStudents = importedEntities.map(s => ({
          id: s.id,
          name: s.name,
          admissionNumber: s.admissionNumber,
          grade: s.grade,
          parentUsername: s.parentUsername
        }));
      });
    });

  } catch (err) {
    console.error('Error confirming batch import:', err);
    return res.status(500).json({ error: 'Failed to process bulk import: ' + err.message });
  }
};

// ==========================================
// 4. CHECK IMPORT JOB STATUS (GET /students/import/status/:jobId)
// ==========================================
export const getImportStatus = async (req, res) => {
  const { jobId } = req.params;
  const job = importJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Import job not found or expired.' });
  }

  return res.json({
    jobId: job.jobId,
    batchId: job.batchId,
    status: job.status,
    progress: job.progress,
    total: job.total,
    imported: job.importedCount,
    skipped: job.skippedCount,
    failed: job.failedCount,
    failedRows: job.failedRows
  });
};

// ==========================================
// 5. UNDO RECENT IMPORT BATCH (POST /students/import/undo/:batchId)
// ==========================================
export const undoImportBatch = async (req, res) => {
  const tenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  const { batchId } = req.params;

  return tenantStorage.run(slugify(tenantId), async () => {
    try {
      const db = readDb(tenantId);
      const batchStudents = (db.students || []).filter(s => s.import_batch_id === batchId);

      if (batchStudents.length === 0) {
        return res.status(404).json({ error: 'No imported students found for this batch ID.' });
      }

      // Check 24-hour expiration window
      const firstStudent = batchStudents[0];
      const importTime = firstStudent.imported_at ? new Date(firstStudent.imported_at).getTime() : 0;
      const hoursPassed = (Date.now() - importTime) / (1000 * 60 * 60);

      if (importTime > 0 && hoursPassed > 24) {
        return res.status(400).json({ error: 'Undo window has expired. Batches can only be undone within 24 hours of import.' });
      }

      const batchStudentIds = new Set(batchStudents.map(s => String(s.id)));

      // Completely remove batch students from db.students so they are removed from directory
      db.students = (db.students || []).filter(s => !batchStudentIds.has(String(s.id)));

      // Clean up linked attendance records if any were created
      if (db.attendanceRecords && Array.isArray(db.attendanceRecords)) {
        db.attendanceRecords = db.attendanceRecords.filter(a => !batchStudentIds.has(String(a.studentId)));
      }

      writeDb(db, ['students', 'attendanceRecords'], tenantId);

      addActivity(
        db,
        'registration',
        'Batch Import Reverted',
        `Reverted import batch ${batchId} (${batchStudents.length} students removed).`,
        'hsl(var(--color-primary))',
        'rgba(hsl(var(--color-primary)), 0.1)'
      );
      const safeReq = (req && req.headers) ? req : { headers: {}, ip: '127.0.0.1' };
      logAudit(
        'Undo Bulk Import',
        `Batch: ${batchId} (${batchStudents.length} students removed)`,
        'Import batch reverted by administrator within 24 hours',
        safeReq
      );

      return res.json({
        success: true,
        batchId,
        undoneCount: batchStudents.length,
        message: `Successfully undone import batch: ${batchStudents.length} students removed from directory.`
      });

    } catch (err) {
      console.error('Error undoing import batch:', err);
      return res.status(500).json({ error: 'Failed to undo import batch: ' + err.message });
    }
  });
};

// 6. GET LATEST ACTIVE IMPORT BATCH (GET /students/import/latest-batch)
// ==========================================
export const getLatestImportBatch = async (req, res) => {
  const tenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  return tenantStorage.run(slugify(tenantId), async () => {
    try {
      const db = readDb(tenantId);
      const importedStudents = (db.students || []).filter(s => s.import_batch_id);
      if (importedStudents.length === 0) {
        return res.json({ batchId: null });
      }
      importedStudents.sort((a, b) => new Date(b.imported_at || 0) - new Date(a.imported_at || 0));
      const latest = importedStudents[0];
      const hoursPassed = (Date.now() - new Date(latest.imported_at || 0).getTime()) / (1000 * 60 * 60);
      if (hoursPassed <= 24) {
        const count = importedStudents.filter(s => s.import_batch_id === latest.import_batch_id).length;
        return res.json({
          batchId: latest.import_batch_id,
          importedAt: latest.imported_at,
          count
        });
      }
      return res.json({ batchId: null });
    } catch (e) {
      return res.json({ batchId: null });
    }
  });
};
