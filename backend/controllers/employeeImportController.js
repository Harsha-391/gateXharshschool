/**
 * Employee Bulk Import Controller
 * Implements Template Generation, File Upload Preview, Batch Import Execution with
 * Transactional DB writes & AES-256 encryption, Latest Batch Tracking, and 24-Hour Batch Undo.
 */

import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';
import crypto from 'crypto';
import { readDb, writeDb, addActivity, tenantStorage, slugify, isSqlActive, ensureEmployeeTableReady } from '../utils/db.js';
import { logAudit } from '../utils/logger.js';
import { encrypt, decrypt } from '../utils/encryptionHelper.js';
import { generateQrCode } from '../utils/qrService.js';
import {
  EMPLOYEE_FIELD_DEFINITIONS,
  matchHeaderToField,
  sanitizeCellValue,
  parseDateToIso,
  normalizePhone,
  normalizeGender,
  normalizeBloodGroup,
  normalizeMaritalStatus,
  validateEmployeeImportRow,
  DESIGNATION_DEPARTMENT_MAP
} from '../utils/employeeImportHelper.js';

// Limits
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROW_LIMIT = 1000;

// Helper to get school's configured employee designations
const getSchoolDesignations = async (tenantId) => {
  const tId = tenantId ? slugify(tenantId) : 'platform';
  let desigs = [];

  // Try SQL first if active
  if (isSqlActive() && tId !== 'platform') {
    try {
      const sqlDb = await import('../utils/sqlDb.js');
      const rows = await sqlDb.query("SELECT name FROM designations WHERE tenantId = ? OR tenantId IS NULL OR tenantId = ''", [tId], tId);
      if (rows && rows.length > 0) {
        desigs = rows.map(r => r.name).filter(Boolean);
      }
    } catch (e) {
      // Fallback
    }
  }

  // Fallback to JSON DB
  if (desigs.length === 0) {
    try {
      const db = readDb(tenantId) || {};
      if (db.designations && Array.isArray(db.designations)) {
        desigs = db.designations.map(d => typeof d === 'string' ? d : d.name).filter(Boolean);
      }
    } catch (e) {
      // Ignore
    }
  }

  // If no designations created in school yet, provide comprehensive defaults
  if (desigs.length === 0) {
    desigs = Object.keys(DESIGNATION_DEPARTMENT_MAP);
  }

  return desigs;
};

// ==========================================
// 1. DOWNLOAD SAMPLE TEMPLATE (GET /api/employees/import/template)
// ==========================================
export const downloadEmployeeImportTemplate = async (req, res) => {
  try {
    const tenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
    const designations = await getSchoolDesignations(tenantId);

    const d1 = designations[0] || 'Administrative Officer';
    const d2 = designations[1] || 'Accountant';
    const d3 = designations[2] || 'Security Guard';

    // Sample data to guide the administrator
    const sampleRows = [
      {
        'Employee ID': '', // Blank for auto-generation (EMP-2026-2001)
        'First Name': 'Ramesh',
        'Middle Name': 'Kumar',
        'Last Name': 'Sharma',
        'Designation': d1,
        'Gender': 'Male',
        'Date of Birth': '1988-06-15',
        'Joining Date': '2026-04-01',
        'Mobile Number': '9876543210',
        'Email Address': 'ramesh.sharma@example.com',
        'Aadhaar Number': '123456789012',
        'PAN Card Number': 'ABCDE1234F',
        'Blood Group': 'O+',
        'Marital Status': 'Married',
        'Nationality': 'Indian',
        'Current Address': '42 Civil Lines, Rajendra Nagar',
        'City': 'Indore',
        'State': 'Madhya Pradesh',
        'Postal Code': '452001',
        'Emergency Contact Person': 'Sunita Sharma',
        'Emergency Contact Number': '9876543211',
        'Qualification': 'Bachelor of Arts (BA)',
        'Experience (Years)': '5',
        'Salary Grade': 'Grade-A'
      },
      {
        'Employee ID': '',
        'First Name': 'Sunita',
        'Middle Name': '',
        'Last Name': 'Verma',
        'Designation': d2,
        'Gender': 'Female',
        'Date of Birth': '1992-09-20',
        'Joining Date': '2026-04-01',
        'Mobile Number': '9812345678',
        'Email Address': 'sunita.verma@example.com',
        'Aadhaar Number': '234567890123',
        'PAN Card Number': 'BCDEF2345G',
        'Blood Group': 'B+',
        'Marital Status': 'Single',
        'Nationality': 'Indian',
        'Current Address': '15 Shanti Kunj, MG Road',
        'City': 'Indore',
        'State': 'Madhya Pradesh',
        'Postal Code': '452002',
        'Emergency Contact Person': 'Anil Verma',
        'Emergency Contact Number': '9812345679',
        'Qualification': 'Bachelor of Commerce (B.Com)',
        'Experience (Years)': '3',
        'Salary Grade': 'Grade-B'
      },
      {
        'Employee ID': '',
        'First Name': 'Vijay',
        'Middle Name': '',
        'Last Name': 'Singh',
        'Designation': d3,
        'Gender': 'Male',
        'Date of Birth': '1985-03-10',
        'Joining Date': '2026-04-01',
        'Mobile Number': '9823456789',
        'Email Address': 'vijay.singh@example.com',
        'Aadhaar Number': '345678901234',
        'PAN Card Number': 'CDEFG3456H',
        'Blood Group': 'AB+',
        'Marital Status': 'Married',
        'Nationality': 'Indian',
        'Current Address': '108 Subhash Marg',
        'City': 'Indore',
        'State': 'Madhya Pradesh',
        'Postal Code': '452003',
        'Emergency Contact Person': 'Rekha Singh',
        'Emergency Contact Number': '9823456780',
        'Qualification': 'Higher Secondary (12th)',
        'Experience (Years)': '7',
        'Salary Grade': 'Grade-C'
      }
    ];

    const worksheet = xlsx.utils.json_to_sheet(sampleRows);

    // Set column widths for comfortable viewing
    worksheet['!cols'] = Object.keys(sampleRows[0]).map(k => ({
      wch: Math.max(k.length + 4, 16)
    }));

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Employee_Template');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Employee_Import_Template.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating employee import template:', err);
    return res.status(500).json({ error: 'Failed to generate employee import template.' });
  }
};

// ==========================================
// 2. PARSE & PREVIEW IMPORT FILE (POST /api/employees/import/preview)
// ==========================================
export const previewEmployeeImport = async (req, res) => {
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

    // Read workbook
    const workbook = req.file.buffer 
      ? xlsx.read(req.file.buffer, { cellDates: true, raw: false })
      : xlsx.readFile(tempFilePath, { cellDates: true, raw: false });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ error: 'Uploaded spreadsheet is empty.' });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

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
      return res.status(400).json({ error: 'No employee data rows found in the uploaded file.' });
    }

    if (dataRows.length > MAX_ROW_LIMIT) {
      return res.status(400).json({ error: `File contains ${dataRows.length} rows, which exceeds the limit of ${MAX_ROW_LIMIT} rows per batch.` });
    }

    // Smart column aliasing
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

    // Load existing employees for duplicate checks
    const tId = tenantId ? slugify(tenantId) : 'platform';
    let existingEmployees = [];

    if (isSqlActive() && tId !== 'platform') {
      try {
        await ensureEmployeeTableReady(tId);
        const sqlDb = await import('../utils/sqlDb.js');
        const rows = await sqlDb.query("SELECT id, name, fullName, email, phone, aadhaarNumber, panNumber FROM employees WHERE tenantId = ? OR tenantId IS NULL OR tenantId = ''", [tId], tId);
        if (rows && Array.isArray(rows)) {
          existingEmployees = rows;
        }
      } catch (err) {
        console.error('[Preview] SQL fetch employees warning:', err.message);
      }
    }

    if (existingEmployees.length === 0) {
      const db = readDb(tenantId) || {};
      existingEmployees = db.employees || [];
    }

    const schoolDesignations = await getSchoolDesignations(tenantId);

    // Map rows into normalized objects
    const parsedRows = dataRows.map((rowArr) => {
      const rowObj = {};
      rawHeaders.forEach((header, colIdx) => {
        const fieldKey = detectedMapping[header];
        const cellVal = sanitizeCellValue(rowArr[colIdx]);
        if (fieldKey) {
          rowObj[fieldKey] = cellVal;
        }
        rowObj[`_raw_${header}`] = cellVal;
      });

      // Basic normalizations
      if (rowObj.gender) rowObj.gender = normalizeGender(rowObj.gender);
      if (rowObj.dob) rowObj.dob = parseDateToIso(rowObj.dob);
      if (rowObj.joiningDate) rowObj.joiningDate = parseDateToIso(rowObj.joiningDate);
      if (rowObj.mobile) rowObj.mobile = normalizePhone(rowObj.mobile);
      if (rowObj.bloodGroup) rowObj.bloodGroup = normalizeBloodGroup(rowObj.bloodGroup);
      if (rowObj.maritalStatus) rowObj.maritalStatus = normalizeMaritalStatus(rowObj.maritalStatus);

      return rowObj;
    });

    // Tracking for intra-file duplicate detection
    const seenIds = new Set();
    const seenPhones = new Set();
    const seenEmails = new Set();
    const seenAadhaars = new Set();

    // Validate each row
    const rowResults = parsedRows.map((rowObj, index) => {
      const validation = validateEmployeeImportRow(rowObj, index, {
        existingEmployees,
        schoolDesignations,
        seenIds,
        seenPhones,
        seenEmails,
        seenAadhaars
      });

      return {
        rowIndex: index + 1,
        data: rowObj,
        status: validation.status, // 'Valid' | 'Error' | 'Duplicate'
        errors: validation.errors,
        warnings: validation.warnings,
        message: validation.message
      };
    });

    const summary = {
      total: rowResults.length,
      valid: rowResults.filter(r => r.status === 'Valid').length,
      duplicate: rowResults.filter(r => r.status === 'Duplicate').length,
      error: rowResults.filter(r => r.status === 'Error').length,
      hasErrors: rowResults.some(r => r.status !== 'Valid')
    };

    return res.json({
      fileName: originalName,
      fileColumns: rawHeaders,
      detectedMapping,
      availableFields: EMPLOYEE_FIELD_DEFINITIONS,
      unmappedHeaders,
      totalRows: rowResults.length,
      rows: rowResults,
      summary
    });

  } catch (err) {
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    console.error('Error previewing employee import file:', err);
    return res.status(500).json({ error: 'Failed to parse and preview spreadsheet: ' + err.message });
  }
};

// ==========================================
// 3. CONFIRM & EXECUTE BATCH IMPORT (POST /api/employees/import/confirm)
// ==========================================
export const confirmEmployeeImport = async (req, res) => {
  const tenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  const tId = tenantId ? slugify(tenantId) : 'platform';

  try {
    const {
      rows = [],
      columnMapping = {},
      skipInvalid = true,
      fileName = 'employee_import.xlsx'
    } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided for import.' });
    }

    // Load existing employees to compute sequential ID without collisions
    const db = readDb(tenantId) || {};
    if (!db.employees) db.employees = [];

    let existingEmployees = [...db.employees];
    if (isSqlActive() && tId !== 'platform') {
      try {
        await ensureEmployeeTableReady(tId);
        const sqlDb = await import('../utils/sqlDb.js');
        const sqlRows = await sqlDb.query("SELECT id FROM employees WHERE tenantId = ? OR tenantId IS NULL OR tenantId = ''", [tId], tId);
        if (sqlRows && Array.isArray(sqlRows)) {
          existingEmployees = sqlRows;
        }
      } catch (e) {
        // Fallback
      }
    }

    // Compute max employee numeric suffix for EMP-2026-XXXX
    const currentYear = 2026;
    const prefix = 'EMP';
    const yearPrefix = `${prefix}-${currentYear}-`;
    let maxNum = 2000;

    existingEmployees.forEach(e => {
      const id = e.id || '';
      if (id.startsWith(yearPrefix)) {
        const num = parseInt(id.replace(yearPrefix, ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const batchId = `BATCH-EMP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const importedAt = new Date().toISOString();
    const importedBy = req.admin?.name || req.admin?.email || req.user?.username || 'Administrator';

    const successfulEntities = [];
    const skippedRows = [];

    // Process rows
    for (let i = 0; i < rows.length; i++) {
      const rowItem = rows[i];
      const rawData = rowItem.data || rowItem;
      const status = rowItem.status || 'Valid';

      // If skipping invalid rows, skip anything flagged with Error or Duplicate
      if (skipInvalid && status !== 'Valid') {
        skippedRows.push({
          row: i + 1,
          name: rawData.fullName || `${rawData.firstName || ''} ${rawData.lastName || ''}`.trim() || 'N/A',
          designation: rawData.designation || 'N/A',
          reason: rowItem.message || 'Validation error'
        });
        continue;
      }

      // Re-map row data if custom columnMapping provided
      const empData = { ...rawData };
      if (Object.keys(columnMapping).length > 0) {
        Object.entries(columnMapping).forEach(([header, fieldKey]) => {
          if (fieldKey && rawData[`_raw_${header}`] !== undefined) {
            empData[fieldKey] = rawData[`_raw_${header}`];
          }
        });
      }

      // ID generation: if blank or invalid, auto-generate sequential ID
      let staffId = (empData.employeeId || '').trim();
      if (!staffId) {
        maxNum += 1;
        staffId = `${yearPrefix}${maxNum}`;
      }

      const firstName = (empData.firstName || '').trim();
      const middleName = (empData.middleName || '').trim();
      const lastName = (empData.lastName || '').trim();
      const derivedFullName = empData.fullName || [firstName, middleName, lastName].filter(Boolean).join(' ') || staffId;

      const designation = empData.designation || 'Employee';
      const meta = DESIGNATION_DEPARTMENT_MAP[designation] || { category: 'Employee', department: 'General' };
      const department = empData.department || meta.department;
      const staffCategory = empData.staffCategory || meta.category;

      const rawPhone = empData.mobile || empData.phone || '';
      const rawEmail = empData.email || '';
      const rawAadhaar = empData.aadhaarNumber ? String(empData.aadhaarNumber).replace(/\s/g, '') : '';
      const rawPan = empData.panNumber ? String(empData.panNumber).toUpperCase() : '';

      // Generate digital QR Badge URL/data
      let qrPath = '';
      try {
        qrPath = await generateQrCode(staffId, 'Employee', tId);
      } catch (qrErr) {
        console.error(`Failed to generate QR for imported employee ${staffId}:`, qrErr.message);
      }

      const newEmployee = {
        id: staffId,
        name: derivedFullName,
        fullName: derivedFullName,
        firstName: firstName || derivedFullName.split(' ')[0] || '',
        middleName: middleName || '',
        lastName: lastName || derivedFullName.split(' ').slice(1).join(' ') || '',
        gender: normalizeGender(empData.gender),
        dob: empData.dob ? parseDateToIso(empData.dob) : '',
        bloodGroup: empData.bloodGroup ? normalizeBloodGroup(empData.bloodGroup) : '',
        nationality: empData.nationality || 'Indian',
        maritalStatus: empData.maritalStatus ? normalizeMaritalStatus(empData.maritalStatus) : 'Single',
        // AES-256 encrypted sensitive fields
        aadhaarNumber: rawAadhaar ? encrypt(rawAadhaar) : '',
        panNumber: rawPan ? encrypt(rawPan) : '',
        phone: rawPhone ? encrypt(rawPhone) : '',
        mobile: rawPhone ? encrypt(rawPhone) : '',
        email: rawEmail ? encrypt(rawEmail) : '',
        joiningDate: empData.joiningDate ? parseDateToIso(empData.joiningDate) : new Date().toISOString().split('T')[0],
        dateOfJoining: empData.joiningDate ? parseDateToIso(empData.joiningDate) : new Date().toISOString().split('T')[0],
        staffCategory,
        role: designation,
        designation,
        department,
        employeeStatus: 'Active',
        status: 'Active',
        currentAddress: empData.currentAddress || '',
        address: empData.currentAddress || '',
        currentCity: empData.currentCity || '',
        city: empData.currentCity || '',
        currentState: empData.currentState || '',
        state: empData.currentState || '',
        currentCountry: empData.currentCountry || 'India',
        currentPostalCode: empData.currentPostalCode || '',
        pincode: empData.currentPostalCode || '',
        permanentAddress: empData.permanentAddress || '',
        permanentCity: empData.permanentCity || '',
        permanentState: empData.permanentState || '',
        permanentCountry: empData.permanentCountry || 'India',
        permanentPostalCode: empData.permanentPostalCode || '',
        sameAsPermanent: 'No',
        emergencyContact: empData.emergencyContact || '',
        emergencyContactNumber: empData.emergencyContactNumber ? encrypt(empData.emergencyContactNumber) : '',
        emergencyPhone: empData.emergencyContactNumber ? encrypt(empData.emergencyContactNumber) : '',
        qualification: empData.qualification || '',
        experience: empData.experience ? String(empData.experience) : '0',
        experiences: [],
        salaryGrade: empData.salaryGrade || '',
        reportingTo: '',
        position: designation,
        photo: '',
        aadharFile: '',
        panFile: '',
        resumeFile: '',
        joiningLetterFile: '',
        certificateFile: '',
        otherFile: '',
        qrCodePath: qrPath,
        batch_id: batchId,
        imported_at: importedAt,
        createdAt: importedAt,
        updatedAt: importedAt,
        password: '', // Employees have NO password and NO login
        avatarBg: `linear-gradient(135deg, hsl(${Math.random() * 360}, 75%, 60%) 0%, hsl(${Math.random() * 360}, 85%, 50%) 100%)`
      };

      successfulEntities.push({
        employee: newEmployee,
        qr: {
          id: `QR-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          employeeId: staffId,
          employeeType: 'Employee',
          qrPath,
          createdAt: importedAt
        }
      });
    }

    if (successfulEntities.length === 0) {
      return res.status(400).json({
        error: 'No valid rows to import. All rows contained errors or duplicates.',
        skippedCount: skippedRows.length,
        skippedRows
      });
    }

    // ==========================================
    // TRANSACTIONAL DATABASE PERSISTENCE
    // ==========================================
    if (isSqlActive() && tId !== 'platform') {
      const sqlDb = await import('../utils/sqlDb.js');
      const pool = sqlDb.getPoolForTenant(tId);

      if (pool) {
        await ensureEmployeeTableReady(tId);
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();

          // 1. Record Batch in import_batches table
          await connection.query(
            `INSERT INTO import_batches (batch_id, imported_by, file_name, total_rows, success_count, skipped_count, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
            [batchId, importedBy, fileName, rows.length, successfulEntities.length, skippedRows.length]
          );

          // 2. Insert all employees in this batch
          const columns = [
            'id', 'name', 'fullName', 'firstName', 'middleName', 'lastName', 'role', 'department', 'email', 'phone',
            'gender', 'dob', 'bloodGroup', 'nationality', 'maritalStatus', 'aadhaarNumber', 'panNumber',
            'qualification', 'experience', 'dateOfJoining', 'joiningDate', 'salaryGrade',
            'address', 'city', 'state', 'country', 'pincode', 'currentAddress', 'currentCity', 'currentState', 'currentCountry',
            'currentPostalCode', 'permanentAddress', 'permanentCity', 'permanentState', 'permanentCountry', 'permanentPostalCode',
            'sameAsPermanent', 'emergencyContact', 'emergencyPhone', 'emergencyContactNumber',
            'avatarBg', 'password', 'tenantId', 'designation', 'staffCategory', 'qrCodePath', 'batch_id'
          ];

          for (const item of successfulEntities) {
            const e = item.employee;
            const values = [
              e.id, e.name, e.fullName, e.firstName, e.middleName, e.lastName, e.role, e.department, e.email, e.phone,
              e.gender, e.dob, e.bloodGroup, e.nationality, e.maritalStatus, e.aadhaarNumber, e.panNumber,
              typeof e.qualification === 'object' ? JSON.stringify(e.qualification) : e.qualification,
              typeof e.experience === 'object' ? JSON.stringify(e.experience) : e.experience,
              e.dateOfJoining, e.joiningDate, e.salaryGrade,
              e.address, e.city, e.state, e.country, e.pincode, e.currentAddress, e.currentCity, e.currentState, e.currentCountry,
              e.currentPostalCode, e.permanentAddress, e.permanentCity, e.permanentState, e.permanentCountry, e.permanentPostalCode,
              e.sameAsPermanent, e.emergencyContact, e.emergencyPhone, e.emergencyContactNumber,
              e.avatarBg, '', tId, e.designation, e.staffCategory, e.qrCodePath, batchId
            ];

            const placeholders = columns.map(() => '?').join(', ');
            const updateClause = columns.map(c => `\`${c}\`=VALUES(\`${c}\`)`).join(', ');
            const insertSql = `INSERT INTO employees (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
            await connection.query(insertSql, values);

            // Insert QR code
            if (item.qr.qrPath) {
              await connection.query(
                `INSERT INTO employee_qr_codes (id, employeeId, employeeType, qrPath, createdAt, tenantId)
                 VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE qrPath=VALUES(qrPath)`,
                [item.qr.id, e.id, 'Employee', item.qr.qrPath, item.qr.createdAt, tId]
              );
            }
          }

          await connection.commit();
        } catch (trxErr) {
          await connection.rollback();
          console.error('[Batch Import Transaction Rollback Error]:', trxErr);
          throw new Error('Database transaction failed during bulk import. All changes rolled back: ' + trxErr.message);
        } finally {
          connection.release();
        }
      }
    }

    // Mirror to JSON DB for consistency across fallback layers
    const activeDb = readDb(tenantId) || {};
    if (!activeDb.employees) activeDb.employees = [];
    if (!activeDb.employeeQrCodes) activeDb.employeeQrCodes = [];
    if (!activeDb.importBatches) activeDb.importBatches = [];

    successfulEntities.forEach(item => {
      activeDb.employees.push(item.employee);
      activeDb.employeeQrCodes.push(item.qr);
    });

    activeDb.importBatches.push({
      batch_id: batchId,
      imported_by: importedBy,
      file_name: fileName,
      total_rows: rows.length,
      success_count: successfulEntities.length,
      skipped_count: skippedRows.length,
      status: 'active',
      created_at: importedAt,
      undone_at: null
    });

    writeDb(activeDb, ['employees', 'employeeQrCodes', 'importBatches'], tenantId);

    // Activity & Audit Logging
    addActivity(
      activeDb,
      'registration',
      'Bulk Employee Import',
      `Imported ${successfulEntities.length} employees (Batch ID: ${batchId}).`,
      'hsl(var(--color-primary))',
      'rgba(hsl(var(--color-primary)), 0.1)'
    );

    const safeReq = (req && req.headers) ? req : { headers: {}, ip: '127.0.0.1' };
    logAudit(
      'Bulk Employee Import',
      `Batch: ${batchId} (${successfulEntities.length} imported, ${skippedRows.length} skipped)`,
      `Bulk imported from file ${fileName}`,
      safeReq
    );

    return res.status(201).json({
      success: true,
      batchId,
      importedCount: successfulEntities.length,
      skippedCount: skippedRows.length,
      totalRows: rows.length,
      importedEmployees: successfulEntities.map(i => ({
        id: i.employee.id,
        name: i.employee.name,
        designation: i.employee.designation,
        phone: decrypt(i.employee.phone),
        email: decrypt(i.employee.email)
      })),
      skippedRows
    });

  } catch (err) {
    console.error('Error confirming employee batch import:', err);
    return res.status(500).json({ error: 'Failed to process bulk import: ' + err.message });
  }
};

// ==========================================
// 4. GET LATEST ACTIVE IMPORT BATCH (GET /api/employees/import/latest-batch)
// ==========================================
export const getLatestEmployeeImportBatch = async (req, res) => {
  const tenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  const tId = tenantId ? slugify(tenantId) : 'platform';

  try {
    let latestBatch = null;

    if (tId && tId !== 'platform') {
      try {
        await ensureEmployeeTableReady(tId);
        const sqlDb = await import('../utils/sqlDb.js');
        const pool = sqlDb.getPoolForTenant(tId);
        if (pool) {
          const [rows] = await pool.query(
            "SELECT * FROM import_batches WHERE status = 'active' ORDER BY created_at DESC LIMIT 1"
          );
          if (rows && rows.length > 0) {
            latestBatch = rows[0];
          }

          // Fallback: Check if employees table has batch_id
          if (!latestBatch) {
            try {
              const [empRows] = await pool.query(
                "SELECT batch_id, COUNT(*) as cnt FROM employees WHERE batch_id IS NOT NULL AND batch_id != '' GROUP BY batch_id ORDER BY MAX(id) DESC LIMIT 1"
              );
              if (empRows && empRows.length > 0) {
                latestBatch = {
                  batch_id: empRows[0].batch_id,
                  success_count: empRows[0].cnt,
                  created_at: new Date().toISOString(),
                  file_name: 'Employee Import'
                };
              }
            } catch (fallbackErr) {
              // Ignore fallback query error
            }
          }
        }
      } catch (e) {
        console.error('Error fetching latest import batch from SQL pool:', e.message);
      }
    }

    if (!latestBatch) {
      const db = readDb(tenantId) || {};
      const batches = (db.importBatches || []).filter(b => b.status === 'active');
      if (batches.length > 0) {
        batches.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        latestBatch = batches[0];
      }
    }

    if (!latestBatch) {
      return res.json({ batchId: null });
    }

    // Check 24-hour expiration window
    const createdAt = latestBatch.created_at ? new Date(latestBatch.created_at).getTime() : Date.now();
    const hoursPassed = (Date.now() - createdAt) / (1000 * 60 * 60);

    if (hoursPassed > 24) {
      return res.json({ batchId: null });
    }

    // Check dependent records for employees in this batch
    let dependentData = {
      hasDependentData: false,
      attendanceCount: 0,
      payrollCount: 0,
      leaveCount: 0,
      totalDependentCount: 0
    };

    if (tId && tId !== 'platform') {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        const pool = sqlDb.getPoolForTenant(tId);
        if (pool) {
          // Count attendance
          const [attRows] = await pool.query(
            `SELECT COUNT(*) as cnt FROM employee_attendance 
             WHERE employeeId IN (SELECT id FROM employees WHERE batch_id = ?)`,
            [latestBatch.batch_id]
          );
          dependentData.attendanceCount = attRows?.[0]?.cnt || 0;

          // Count leave records
          const [leaveRows] = await pool.query(
            `SELECT COUNT(*) as cnt FROM staff_leaves 
             WHERE staffId IN (SELECT id FROM employees WHERE batch_id = ?)`,
            [latestBatch.batch_id]
          );
          dependentData.leaveCount = leaveRows?.[0]?.cnt || 0;

          // Count payroll records if table exists
          try {
            const [payRows] = await pool.query(
              `SELECT COUNT(*) as cnt FROM payroll_transactions 
               WHERE employeeId IN (SELECT id FROM employees WHERE batch_id = ?)`,
              [latestBatch.batch_id]
            );
            dependentData.payrollCount = payRows?.[0]?.cnt || 0;
          } catch (payErr) {}

          dependentData.totalDependentCount = dependentData.attendanceCount + dependentData.leaveCount + dependentData.payrollCount;
          dependentData.hasDependentData = dependentData.totalDependentCount > 0;
        }
      } catch (depErr) {
        console.error('[Check Dependent Data Warning]:', depErr.message);
      }
    }

    return res.json({
      batchId: latestBatch.batch_id,
      importedAt: latestBatch.created_at,
      count: latestBatch.success_count || 10,
      fileName: latestBatch.file_name,
      dependentData
    });

  } catch (err) {
    console.error('Error fetching latest employee import batch:', err);
    return res.json({ batchId: null });
  }
};

// ==========================================
// 5. UNDO RECENT IMPORT BATCH (POST /api/employees/import/undo/:batchId)
// ==========================================
export const undoEmployeeImport = async (req, res) => {
  const tenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
  const tId = tenantId ? slugify(tenantId) : 'platform';
  const { batchId } = req.params;
  const { force = false } = req.body || {};

  try {
    let batch = null;

    if (tId && tId !== 'platform') {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        const pool = sqlDb.getPoolForTenant(tId);
        if (pool) {
          const [rows] = await pool.query("SELECT * FROM import_batches WHERE batch_id = ?", [batchId]);
          if (rows && rows.length > 0) batch = rows[0];
        }
      } catch (e) {
        console.error('Error fetching batch for undo from SQL pool:', e.message);
      }
    }

    if (!batch) {
      const db = readDb(tenantId) || {};
      batch = (db.importBatches || []).find(b => b.batch_id === batchId);
    }

    if (!batch) {
      return res.status(404).json({ error: 'Import batch not found.' });
    }

    if (batch.status === 'undone') {
      return res.status(400).json({ error: 'This import batch has already been undone.' });
    }

    // Enforce 24-hour limit
    const createdAt = new Date(batch.created_at).getTime();
    const hoursPassed = (Date.now() - createdAt) / (1000 * 60 * 60);
    if (hoursPassed > 24) {
      return res.status(400).json({ error: 'Undo window expired. Imports can only be undone within 24 hours.' });
    }

    let undoneCount = batch.success_count || 0;

    // Execute undo in a single MySQL transaction
    if (tId && tId !== 'platform') {
      const sqlDb = await import('../utils/sqlDb.js');
      const pool = sqlDb.getPoolForTenant(tId);

      if (pool) {
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();

          // Check dependent data if force not yet confirmed
          if (!force) {
            const attRows = await connection.query(
              `SELECT COUNT(*) as cnt FROM employee_attendance 
               WHERE employeeId IN (SELECT id FROM employees WHERE batch_id = ?)`,
              [batchId]
            );
            const attendanceCount = attRows?.[0]?.cnt || 0;

            const leaveRows = await connection.query(
              `SELECT COUNT(*) as cnt FROM staff_leaves 
               WHERE staffId IN (SELECT id FROM employees WHERE batch_id = ?)`,
              [batchId]
            );
            const leaveCount = leaveRows?.[0]?.cnt || 0;

            const totalDep = attendanceCount + leaveCount;
            if (totalDep > 0) {
              await connection.rollback();
              connection.release();
              return res.status(409).json({
                requiresConfirmation: true,
                attendanceCount,
                leaveCount,
                totalDependentCount: totalDep,
                message: `Warning: Employees in this batch have ${totalDep} dependent records (attendance/leaves). Do you want to proceed and delete them?`
              });
            }
          } else {
            // Delete dependent records if forced
            try {
              await connection.query(
                `DELETE FROM employee_attendance WHERE employeeId IN (SELECT id FROM employees WHERE batch_id = ?)`,
                [batchId]
              );
            } catch (e) {}
            try {
              await connection.query(
                `DELETE FROM staff_leaves WHERE staffId IN (SELECT id FROM employees WHERE batch_id = ?)`,
                [batchId]
              );
            } catch (e) {}
          }

          // Delete QR codes for these employees
          await connection.query(
            `DELETE FROM employee_qr_codes WHERE employeeId IN (SELECT id FROM employees WHERE batch_id = ?)`,
            [batchId]
          );

          // Delete the employees belonging strictly to this batch
          const [delRes] = await connection.query(
            `DELETE FROM employees WHERE batch_id = ?`,
            [batchId]
          );
          undoneCount = delRes.affectedRows || undoneCount;

          // Update batch status to 'undone'
          await connection.query(
            `UPDATE import_batches SET status = 'undone', undone_at = NOW() WHERE batch_id = ?`,
            [batchId]
          );

          await connection.commit();
        } catch (trxErr) {
          await connection.rollback();
          console.error('[Undo Import Rollback Error]:', trxErr);
          throw new Error('Database transaction failed during undo: ' + trxErr.message);
        } finally {
          connection.release();
        }
      }
    }

    // Mirror in JSON DB
    const db = readDb(tenantId) || {};
    if (db.employees && Array.isArray(db.employees)) {
      db.employees = db.employees.filter(e => e.batch_id !== batchId);
    }
    if (db.importBatches && Array.isArray(db.importBatches)) {
      const bObj = db.importBatches.find(b => b.batch_id === batchId);
      if (bObj) {
        bObj.status = 'undone';
        bObj.undone_at = new Date().toISOString();
      }
    }
    writeDb(db, ['employees', 'importBatches'], tenantId);

    // Audit & Activity log
    addActivity(
      db,
      'registration',
      'Batch Import Reverted',
      `Reverted employee import batch ${batchId} (${undoneCount} employees removed).`,
      'hsl(var(--color-primary))',
      'rgba(hsl(var(--color-primary)), 0.1)'
    );

    const safeReq = (req && req.headers) ? req : { headers: {}, ip: '127.0.0.1' };
    logAudit(
      'Undo Bulk Employee Import',
      `Batch: ${batchId} (${undoneCount} employees removed)`,
      'Employee batch reverted by administrator within 24 hours',
      safeReq
    );

    return res.json({
      success: true,
      batchId,
      undoneCount,
      message: `Successfully undone import batch: ${undoneCount} employees removed.`
    });

  } catch (err) {
    console.error('Error undoing employee import batch:', err);
    return res.status(500).json({ error: 'Failed to undo import batch: ' + err.message });
  }
};

// ==========================================
// 6. DOWNLOAD ERROR REPORT (POST /api/employees/import/error-report)
// ==========================================
export const downloadEmployeeErrorReport = async (req, res) => {
  try {
    const { skippedRows = [] } = req.body;
    if (!Array.isArray(skippedRows) || skippedRows.length === 0) {
      return res.status(400).json({ error: 'No error records provided for report generation.' });
    }

    const reportData = skippedRows.map(r => ({
      'Row Number': r.row || 'N/A',
      'Employee Name': r.name || 'N/A',
      'Designation': r.designation || 'N/A',
      'Error Reason / Failure Cause': r.reason || 'Validation failure'
    }));

    const worksheet = xlsx.utils.json_to_sheet(reportData);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 25 },
      { wch: 22 },
      { wch: 60 }
    ];

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Skipped_Rows');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Employee_Import_Error_Report.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating error report:', err);
    return res.status(500).json({ error: 'Failed to generate error report.' });
  }
};
