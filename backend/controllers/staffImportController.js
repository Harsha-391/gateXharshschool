/**
 * Staff Bulk Import Controller
 * Implements:
 * 1. Download Sample Template (.xlsx)
 * 2. Upload Preview & Smart Alias Mapping
 * 3. Interactive Department & Designation Resolution
 * 4. Staging Storage & Batch Record Creation (Zero impact on main staff table)
 * 5. Pending Staff Listing, Search, Sort & Deletion
 * 6. Single-Transaction "Complete Setup" to Main Staff Directory
 * 7. 24-Hour "Undo Last Import" (Removes pending rows only)
 * 8. Error Report Export
 */

import path from 'path';
import * as xlsx from 'xlsx';
import { readDb, writeDb, addActivity, isSqlActive, tenantStorage, slugify, getDefaultRoles } from '../utils/db.js';
import { encrypt, decrypt } from '../utils/encryptionHelper.js';
import { hashPassword } from '../utils/authHelper.js';
import { logAudit } from '../utils/logger.js';
import {
  STAFF_FIELD_DEFINITIONS,
  matchHeaderToField,
  sanitizeCellValue,
  parseDateToIso,
  normalizePhone,
  normalizeGender,
  splitFullName,
  validateStaffImportRow,
  reserveStaffIds
} from '../utils/staffImportHelper.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 1000;

// Helper to map designation/role string to role ID
const mapDesignationToRoleId = (designation, dbRoles = []) => {
  if (!designation) return 'role-receptionist';
  const matchedRole = dbRoles.find(r => r.name.toLowerCase() === designation.toLowerCase());
  if (matchedRole) return matchedRole.id;
  const slugId = `role-${designation.toLowerCase().trim().replace(/\s+/g, '-')}`;
  if (dbRoles.some(r => r.id === slugId)) return slugId;
  return 'role-receptionist';
};

// Helper to ensure staging & batch tables exist in MySQL
async function ensureStaffImportTablesExist(tenantId) {
  if (!isSqlActive()) return;
  try {
    const sqlDb = await import('../utils/sqlDb.js');
    const tId = tenantId ? slugify(tenantId) : 'platform';

    await sqlDb.query(`
      CREATE TABLE IF NOT EXISTS import_batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id VARCHAR(64) NOT NULL UNIQUE,
        module VARCHAR(50) DEFAULT 'staff',
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
      CREATE TABLE IF NOT EXISTS staff_import_staging (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id VARCHAR(64) NOT NULL,
        staff_id VARCHAR(50) NOT NULL,
        full_name VARCHAR(255) NULL,
        first_name VARCHAR(100) NULL,
        middle_name VARCHAR(100) NULL,
        last_name VARCHAR(100) NULL,
        mobile VARCHAR(100) NULL,
        email VARCHAR(255) NULL,
        gender VARCHAR(20) NULL,
        dob VARCHAR(50) NULL,
        joining_date VARCHAR(50) NULL,
        qualification TEXT NULL,
        experience VARCHAR(50) NULL,
        department VARCHAR(100) NULL,
        designation VARCHAR(100) NULL,
        designation_id VARCHAR(100) NULL,
        blood_group VARCHAR(10) NULL,
        nationality VARCHAR(50) NULL,
        marital_status VARCHAR(50) NULL,
        address TEXT NULL,
        alternate_mobile VARCHAR(100) NULL,
        tenantId VARCHAR(100) NULL,
        created_at DATETIME NULL,
        raw_data TEXT NULL,
        INDEX idx_sis_batch (batch_id),
        INDEX idx_sis_sid (staff_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, [], tId);

    const alters = [
      "ALTER TABLE import_batches ADD COLUMN module VARCHAR(50) DEFAULT 'staff' NULL",
      "ALTER TABLE import_batches ADD COLUMN created_designations TEXT NULL",
      "ALTER TABLE import_batches ADD COLUMN tenantId VARCHAR(100) NULL",
      "ALTER TABLE staff_import_staging ADD COLUMN designation_id VARCHAR(100) NULL",
      "ALTER TABLE staff_import_staging ADD COLUMN alternate_mobile VARCHAR(100) NULL",
      "ALTER TABLE staff_import_staging ADD COLUMN raw_data TEXT NULL",
      "ALTER TABLE staff_import_staging ADD COLUMN tenantId VARCHAR(100) NULL"
    ];
    for (const sql of alters) {
      try {
        await sqlDb.query(sql, [], tId);
      } catch (e) {
        // Ignore column already exists or table issue
      }
    }
  } catch (err) {
    console.error('[Staff Import Table Init Error]:', err.message);
  }
}

// ========================================================
// 1. DOWNLOAD SAMPLE TEMPLATE (GET /api/staff/import/template)
// ========================================================
export const downloadStaffImportTemplate = async (req, res) => {
  try {
    const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
    const tenantId = slugify(rawTenantId);
    const db = tenantStorage.run(tenantId, () => readDb(tenantId));
    const activeDesignations = (db.designations || []).map(d => d.name).filter(Boolean);
    const activeDepartments = (db.departments || []).map(d => d.name).filter(Boolean);

    const sampleDesig1 = activeDesignations[0] || 'Receptionist';
    const sampleDesig2 = activeDesignations[1] || 'Accountant';
    const sampleDept1 = activeDepartments[0] || 'Administration';
    const sampleDept2 = activeDepartments[1] || 'Finance';

    const sampleRows = [
      {
        'Full Name': 'Sunita Sharma',
        'Mobile': '9876543210',
        'Email': 'sunita.sharma@school.edu',
        'Gender': 'Female',
        'DOB': '1992-06-15',
        'Joining Date': '2026-06-01',
        'Department': sampleDept1,
        'Designation': sampleDesig1,
        'Qualification': 'B.Com, MBA',
        'Experience (years)': '4',
        'Blood Group': 'O+',
        'Address': '14 Civil Lines, Near City Mall, Indore'
      },
      {
        'Full Name': 'Rajesh Verma',
        'Mobile': '9812345678',
        'Email': 'rajesh.verma@school.edu',
        'Gender': 'Male',
        'DOB': '1988-11-20',
        'Joining Date': '2026-06-01',
        'Department': sampleDept2,
        'Designation': sampleDesig2,
        'Qualification': 'M.Com, Tally Certified',
        'Experience (years)': '6',
        'Blood Group': 'B+',
        'Address': '55 Lake View Apartments, Ahmedabad'
      },
      {
        'Full Name': 'Anita Deshmukh',
        'Mobile': '9898765432',
        'Email': 'anita.deshmukh@school.edu',
        'Gender': 'Female',
        'DOB': '1995-04-10',
        'Joining Date': '2026-05-15',
        'Department': sampleDept1,
        'Designation': sampleDesig1,
        'Qualification': 'B.A, Diploma in Secretarial Practice',
        'Experience (years)': '2',
        'Blood Group': 'A+',
        'Address': '22 Park Street, Jaipur'
      }
    ];

    const worksheet = xlsx.utils.json_to_sheet(sampleRows);
    worksheet['!cols'] = Object.keys(sampleRows[0]).map(k => ({
      wch: Math.max(k.length + 4, 18)
    }));

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Staff_Template');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Staff_Import_Template.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating staff import template:', err);
    return res.status(500).json({ error: 'Failed to generate staff template: ' + err.message });
  }
};

// ========================================================
// 2. PREVIEW FILE & COLUMN MAPPING (POST /api/staff/import/preview)
// ========================================================
export const previewStaffImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a spreadsheet file (.xlsx, .xls, .csv).' });
    }

    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File size exceeds 5 MB limit. Please upload a smaller file.' });
    }

    const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
    const tenantId = slugify(rawTenantId);
    await ensureStaffImportTablesExist(tenantId);

    // Read spreadsheet from buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return res.status(400).json({ error: 'The uploaded workbook does not contain any sheets.' });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawRows || rawRows.length < 2) {
      return res.status(400).json({ error: 'File is empty or has no data rows.' });
    }

    const headers = rawRows[0].map(h => sanitizeCellValue(h));
    const dataRows = rawRows.slice(1).filter(row => row.some(cell => String(cell).trim() !== ''));

    if (dataRows.length === 0) {
      return res.status(400).json({ error: 'No non-empty data rows found in the spreadsheet.' });
    }

    if (dataRows.length > MAX_ROWS) {
      return res.status(400).json({ error: `File contains ${dataRows.length} rows. Maximum allowed per batch is ${MAX_ROWS} rows.` });
    }

    // Auto-detect column mappings: mapping header string -> fieldKey
    const detectedMapping = {};
    const unmappedHeaders = [];
    headers.forEach(h => {
      const fieldKey = matchHeaderToField(h);
      if (fieldKey) {
        detectedMapping[h] = fieldKey;
      } else {
        detectedMapping[h] = '';
        unmappedHeaders.push(h);
      }
    });

    // Check required fields
    const missingRequired = STAFF_FIELD_DEFINITIONS
      .filter(f => f.required && !Object.values(detectedMapping).includes(f.key))
      .map(f => f.label);

    // Load active records for duplicate detection
    const db = tenantStorage.run(tenantId, () => readDb(tenantId));
    const existingStaff = db.staff || [];
    const pendingStaging = db.staff_import_staging || [];
    const departmentsList = db.departments || [];
    const designationsList = db.designations || [];

    // Parse and validate rows
    const seenInFile = { mobiles: new Set(), emails: new Set() };
    const parsedRows = [];
    const unmatchedDepartments = new Set();
    const unmatchedDesignations = new Set();

    dataRows.forEach((rowArr, index) => {
      const rowObj = {};
      headers.forEach((h, colIndex) => {
        rowObj[h] = sanitizeCellValue(rowArr[colIndex]);
      });

      // Map to standard fields
      const normalizedRow = { _rawRowNumber: index + 2 };
      STAFF_FIELD_DEFINITIONS.forEach(def => {
        const headerName = headers.find(h => detectedMapping[h] === def.key);
        normalizedRow[def.key] = headerName ? sanitizeCellValue(rowObj[headerName]) : '';
      });

      // Validate
      const validation = validateStaffImportRow(
        normalizedRow,
        index + 1,
        existingStaff,
        pendingStaging,
        seenInFile,
        departmentsList,
        designationsList
      );

      if (normalizedRow._unmatchedDepartment) {
        unmatchedDepartments.add(normalizedRow._unmatchedDepartment);
      }
      if (normalizedRow._unmatchedDesignation) {
        unmatchedDesignations.add(normalizedRow._unmatchedDesignation);
      }

      parsedRows.push({
        rowIndex: index + 1,
        rowNumber: index + 1,
        data: normalizedRow,
        status: validation.status,
        validationStatus: validation.status,
        errors: validation.errors,
        validationErrors: validation.errors,
        warnings: validation.warnings,
        validationWarnings: validation.warnings,
        message: validation.message
      });
    });

    const validCount = parsedRows.filter(r => r.status === 'Valid').length;
    const errorCount = parsedRows.filter(r => r.status === 'Error').length;
    const duplicateCount = parsedRows.filter(r => r.status === 'Duplicate').length;

    return res.json({
      success: true,
      fileName: req.file.originalname,
      totalRows: parsedRows.length,
      validCount,
      errorCount,
      duplicateCount,
      summary: {
        total: parsedRows.length,
        valid: validCount,
        error: errorCount,
        duplicate: duplicateCount
      },
      headers,
      rawHeaders: headers,
      detectedMapping,
      unmappedHeaders,
      missingRequired,
      unmatchedDepartments: Array.from(unmatchedDepartments),
      unmatchedDesignations: Array.from(unmatchedDesignations),
      activeDesignations: designationsList.map(d => d.name),
      availableDepartments: departmentsList.map(d => ({ id: d.id, name: d.name })),
      availableDesignations: designationsList.map(d => ({ id: d.id, name: d.name })),
      fieldDefinitions: STAFF_FIELD_DEFINITIONS,
      rows: parsedRows
    });
  } catch (err) {
    console.error('Error in previewStaffImport:', err);
    return res.status(500).json({ error: 'Failed to preview file: ' + err.message });
  }
};

// ========================================================
// 3. CONFIRM & STAGE IMPORT (POST /api/staff/import/confirm)
// ========================================================
export const confirmStaffImport = async (req, res) => {
  try {
    const { rows, columnMapping, departmentResolutions = {}, designationResolutions = {}, fileName } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No valid rows provided for import.' });
    }

    const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
    const tenantId = slugify(rawTenantId);
    await ensureStaffImportTablesExist(tenantId);

    const db = tenantStorage.run(tenantId, () => readDb(tenantId));
    if (!db.staff) db.staff = [];
    if (!db.staff_import_staging) db.staff_import_staging = [];
    if (!db.import_batches) db.import_batches = [];
    if (!db.departments) db.departments = [];
    if (!db.designations) db.designations = [];

    // Filter to valid rows only
    const validRows = rows.filter(r => (r.status === 'Valid' || r.validationStatus === 'Valid') && r.data);
    if (validRows.length === 0) {
      return res.status(400).json({ error: 'No valid rows to import. All rows contained errors or duplicates.' });
    }

    // Process Department Resolutions
    for (const [deptName, resObj] of Object.entries(departmentResolutions)) {
      if (resObj && resObj.action === 'create' && resObj.name) {
        const cleanName = resObj.name.trim();
        const exists = db.departments.some(d => (d.name || '').toLowerCase() === cleanName.toLowerCase());
        if (!exists) {
          const newDept = {
            id: `dept-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: cleanName,
            status: 'Active',
            createdAt: new Date().toISOString()
          };
          db.departments.push(newDept);
        }
      }
    }

    // Process Designation Resolutions
    const createdDesignationsList = [];
    for (const [desigName, resObj] of Object.entries(designationResolutions)) {
      if (resObj && resObj.action === 'create' && resObj.name) {
        const cleanName = resObj.name.trim();
        const exists = db.designations.some(d => (d.name || '').toLowerCase() === cleanName.toLowerCase());
        if (!exists) {
          const newDesig = {
            id: `desig-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: cleanName,
            description: 'Imported via Staff Bulk Import',
            createdAt: new Date().toISOString()
          };
          db.designations.push(newDesig);
          createdDesignationsList.push(cleanName);
        }
      }
    }

    // Generate unique batch ID
    const batchId = `BATCH-STF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Reserve collision-free Staff IDs (STF-2026-XXXX)
    const reservedIds = reserveStaffIds(
      validRows.length,
      db.staff,
      db.staff_import_staging,
      new Date().getFullYear()
    );

    const stagedRecords = [];
    const timestamp = new Date().toISOString();

    validRows.forEach((rowItem, idx) => {
      const data = rowItem.data;
      const reservedStaffId = reservedIds[idx];
      const { firstName, middleName, lastName } = splitFullName(data.fullName);

      // Resolve final department
      let finalDepartment = data.department || '';
      if (data._unmatchedDepartment && departmentResolutions[data._unmatchedDepartment]) {
        const r = departmentResolutions[data._unmatchedDepartment];
        if (r.action === 'map' && r.name) finalDepartment = r.name;
        else if (r.action === 'create' && r.name) finalDepartment = r.name;
        else if (r.action === 'ignore') finalDepartment = '';
      }

      // Resolve final designation
      let finalDesignation = data.designation || 'Staff';
      let finalDesignationId = data.designationId || '';
      if (data._unmatchedDesignation && designationResolutions[data._unmatchedDesignation]) {
        const r = designationResolutions[data._unmatchedDesignation];
        if (r.action === 'map' && r.name) {
          finalDesignation = r.name;
          const found = db.designations.find(d => d.name === r.name);
          finalDesignationId = found?.id || '';
        } else if (r.action === 'create' && r.name) {
          finalDesignation = r.name;
          const found = db.designations.find(d => d.name === r.name);
          finalDesignationId = found?.id || '';
        } else if (r.action === 'ignore') {
          finalDesignation = 'Staff';
          finalDesignationId = '';
        }
      }

      // Prepare staged record with sensitive data encryption
      const stagedRow = {
        id: `staging-stf-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        batch_id: batchId,
        staff_id: reservedStaffId,
        staffId: reservedStaffId,
        full_name: data.fullName,
        fullName: data.fullName,
        first_name: firstName,
        firstName,
        middle_name: middleName,
        middleName,
        last_name: lastName,
        lastName,
        mobile: data.mobile ? encrypt(data.mobile) : '',
        phone: data.mobile ? encrypt(data.mobile) : '',
        email: data.email ? encrypt(data.email) : '',
        gender: data.gender || 'Male',
        dob: data.dob || '',
        joining_date: data.joiningDate || timestamp.split('T')[0],
        joiningDate: data.joiningDate || timestamp.split('T')[0],
        qualification: data.qualification || '',
        experience: data.experience || '0',
        department: finalDepartment,
        designation: finalDesignation,
        designation_id: finalDesignationId,
        blood_group: data.bloodGroup || '',
        bloodGroup: data.bloodGroup || '',
        nationality: data.nationality || 'Indian',
        marital_status: data.maritalStatus || '',
        maritalStatus: data.maritalStatus || '',
        address: data.address ? encrypt(data.address) : '',
        alternate_mobile: data.alternateMobile ? encrypt(data.alternateMobile) : '',
        tenantId,
        created_at: timestamp,
        createdAt: timestamp,
        raw_data: JSON.stringify(data)
      };

      stagedRecords.push(stagedRow);
      db.staff_import_staging.push(stagedRow);
    });

    // Create batch record
    const batchRecord = {
      id: `batch-${Date.now()}`,
      batch_id: batchId,
      module: 'staff',
      imported_by: req.user?.username || req.user?.name || req.admin?.username || 'Admin',
      file_name: fileName || 'staff_import.xlsx',
      total_rows: rows.length,
      success_count: stagedRecords.length,
      skipped_count: rows.length - stagedRecords.length,
      status: 'active',
      created_at: timestamp,
      undone_at: null,
      created_designations: JSON.stringify(createdDesignationsList),
      tenantId
    };

    db.import_batches.push(batchRecord);

    // Persist to database
    writeDb(db, ['staff_import_staging', 'import_batches', 'departments', 'designations'], tenantId);

    // Sync to MySQL if active
    if (isSqlActive()) {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        const tId = tenantId ? slugify(tenantId) : 'platform';

        try {
          await sqlDb.query(
            `INSERT INTO import_batches 
            (batch_id, module, imported_by, file_name, total_rows, success_count, skipped_count, status, created_at, created_designations, tenantId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
            [
              batchRecord.batch_id,
              batchRecord.module || 'staff',
              batchRecord.imported_by,
              batchRecord.file_name,
              batchRecord.total_rows,
              batchRecord.success_count,
              batchRecord.skipped_count,
              batchRecord.status,
              batchRecord.created_designations,
              tId
            ],
            tId
          );
        } catch (batchErr) {
          console.error('[Staff Import Batch SQL Error]:', batchErr.message);
        }

        for (const s of stagedRecords) {
          try {
            await sqlDb.query(
              `INSERT INTO staff_import_staging 
              (batch_id, staff_id, full_name, first_name, middle_name, last_name, mobile, email, gender, dob, joining_date, qualification, experience, department, designation, designation_id, blood_group, nationality, marital_status, address, alternate_mobile, tenantId, created_at, raw_data)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
              [
                s.batch_id, s.staff_id, s.full_name, s.first_name, s.middle_name, s.last_name,
                s.mobile, s.email, s.gender, s.dob, s.joining_date, s.qualification, s.experience,
                s.department, s.designation, s.designation_id, s.blood_group, s.nationality, s.marital_status,
                s.address, s.alternate_mobile, tId, s.raw_data
              ],
              tId
            );
          } catch (stgErr) {
            console.error('[Staff Import Staging Row SQL Error]:', stgErr.message);
          }
        }
      } catch (sqlErr) {
        console.error('[Staff Import SQL Insert Error]:', sqlErr.message);
      }
    }

    // Audit Log
    logAudit('Staff Bulk Import Staged', `Batch: ${batchId}`, `Imported ${stagedRecords.length} staff records to pending setup staging.`, req);
    addActivity(db, 'import', 'Staff Bulk Import Staged', `${stagedRecords.length} staff members imported and queued for setup.`, 'hsl(var(--color-primary))', 'rgba(hsl(var(--color-primary)), 0.1)');

    return res.json({
      success: true,
      batchId,
      importedCount: stagedRecords.length,
      stagedCount: stagedRecords.length,
      skippedCount: rows.length - stagedRecords.length,
      totalRows: rows.length,
      reservedRange: reservedIds.length > 0 ? `${reservedIds[0]} - ${reservedIds[reservedIds.length - 1]}` : null,
      message: `Successfully staged ${stagedRecords.length} staff member(s). They are now visible in the Pending Staff Setup section.`
    });
  } catch (err) {
    console.error('Error confirming staff import:', err);
    return res.status(500).json({ error: 'Failed to stage staff import: ' + err.message });
  }
};

// ========================================================
// 4. GET PENDING STAFF (GET /api/staff/import/pending)
// ========================================================
export const getPendingStaff = async (req, res) => {
  try {
    const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
    const tenantId = slugify(rawTenantId);
    await ensureStaffImportTablesExist(tenantId);

    const db = tenantStorage.run(tenantId, () => readDb(tenantId));
    let stagingList = [...(db.staff_import_staging || [])];

    // Read from MySQL if active
    if (isSqlActive()) {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        const tId = tenantId ? slugify(tenantId) : 'platform';
        const rows = await sqlDb.query(
          'SELECT * FROM staff_import_staging WHERE tenantId = ? OR tenantId IS NULL ORDER BY created_at DESC',
          [tId],
          tId
        );
        if (Array.isArray(rows)) {
          stagingList = rows.map(r => ({
            id: r.id,
            batch_id: r.batch_id,
            staff_id: r.staff_id,
            staffId: r.staff_id,
            full_name: r.full_name,
            fullName: r.full_name,
            first_name: r.first_name,
            firstName: r.first_name,
            middle_name: r.middle_name,
            middleName: r.middle_name,
            last_name: r.last_name,
            lastName: r.last_name,
            mobile: r.mobile,
            email: r.email,
            gender: r.gender,
            dob: r.dob,
            joining_date: r.joining_date,
            joiningDate: r.joining_date,
            qualification: r.qualification,
            experience: r.experience,
            department: r.department,
            designation: r.designation,
            designation_id: r.designation_id,
            blood_group: r.blood_group,
            bloodGroup: r.blood_group,
            nationality: r.nationality,
            marital_status: r.marital_status,
            maritalStatus: r.marital_status,
            address: r.address,
            alternate_mobile: r.alternate_mobile,
            tenantId: r.tenantId,
            created_at: r.created_at,
            createdAt: r.created_at
          }));
        }
      } catch (sqlErr) {
        console.error('[Get Pending Staff SQL Error]:', sqlErr.message);
      }
    }

    // Decrypt sensitive contact fields
    const decryptedList = stagingList.map(s => {
      let mobile = s.mobile || s.phone || '';
      let email = s.email || '';
      let address = s.address || '';
      let alternateMobile = s.alternate_mobile || '';

      if (mobile && mobile.includes(':')) {
        try { mobile = decrypt(mobile); } catch (e) {}
      }
      if (email && email.includes(':')) {
        try { email = decrypt(email); } catch (e) {}
      }
      if (address && address.includes(':')) {
        try { address = decrypt(address); } catch (e) {}
      }
      if (alternateMobile && alternateMobile.includes(':')) {
        try { alternateMobile = decrypt(alternateMobile); } catch (e) {}
      }

      return {
        ...s,
        mobile,
        phone: mobile,
        email,
        address,
        alternateMobile,
        staffId: s.staff_id || s.staffId
      };
    });

    // Search filter
    const search = (req.query.search || '').trim().toLowerCase();
    let filtered = decryptedList;
    if (search) {
      filtered = filtered.filter(s =>
        (s.full_name || s.fullName || '').toLowerCase().includes(search) ||
        (s.staff_id || s.staffId || '').toLowerCase().includes(search) ||
        (s.mobile || '').toLowerCase().includes(search) ||
        (s.email || '').toLowerCase().includes(search) ||
        (s.department || '').toLowerCase().includes(search) ||
        (s.designation || '').toLowerCase().includes(search)
      );
    }

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return res.json({
      pendingStaff: paginated,
      totalCount,
      totalPages,
      page,
      limit
    });
  } catch (err) {
    console.error('Error fetching pending staff list:', err);
    return res.status(500).json({ error: 'Failed to fetch pending staff: ' + err.message });
  }
};

// ========================================================
// 5. DELETE PENDING STAFF ROW (DELETE /api/staff/import/pending/:id)
// ========================================================
export const deletePendingStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
    const tenantId = slugify(rawTenantId);

    const db = tenantStorage.run(tenantId, () => readDb(tenantId));
    if (!db.staff_import_staging) db.staff_import_staging = [];

    const initialLen = db.staff_import_staging.length;
    db.staff_import_staging = db.staff_import_staging.filter(
      s => String(s.id) !== String(id) && String(s.staff_id) !== String(id) && String(s.staffId) !== String(id)
    );

    writeDb(db, ['staff_import_staging'], tenantId);

    if (isSqlActive()) {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        const tId = tenantId ? slugify(tenantId) : 'platform';
        const isNumeric = /^\d+$/.test(String(id).trim());
        if (isNumeric) {
          await sqlDb.query(
            'DELETE FROM staff_import_staging WHERE (id = ? OR staff_id = ?) AND (tenantId = ? OR tenantId IS NULL)',
            [Number(id), String(id), tId],
            tId
          );
        } else {
          await sqlDb.query(
            'DELETE FROM staff_import_staging WHERE staff_id = ? AND (tenantId = ? OR tenantId IS NULL)',
            [String(id), tId],
            tId
          );
        }
      } catch (sqlErr) {
        console.error('[Delete Pending Staff SQL Error]:', sqlErr.message);
      }
    }

    logAudit('Staff Staging Delete', `ID: ${id}`, `Dismissed pending staff from staging.`, req);

    return res.json({
      success: true,
      message: 'Pending staff member removed from import staging.'
    });
  } catch (err) {
    console.error('Error deleting pending staff row:', err);
    return res.status(500).json({ error: 'Failed to delete pending staff: ' + err.message });
  }
};

// ========================================================
// 6. BULK DELETE PENDING STAFF (POST /api/staff/import/pending/bulk-delete)
// ========================================================
export const bulkDeletePendingStaff = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of IDs to delete.' });
    }

    const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
    const tenantId = slugify(rawTenantId);

    const db = tenantStorage.run(tenantId, () => readDb(tenantId));
    if (!db.staff_import_staging) db.staff_import_staging = [];

    const idSet = new Set(ids.map(x => String(x)));
    const initialCount = db.staff_import_staging.length;
    db.staff_import_staging = db.staff_import_staging.filter(
      s => !idSet.has(String(s.id)) && !idSet.has(String(s.staff_id)) && !idSet.has(String(s.staffId))
    );

    writeDb(db, ['staff_import_staging'], tenantId);

    if (isSqlActive()) {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        const tId = tenantId ? slugify(tenantId) : 'platform';

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
          conditions.push(`staff_id IN (${strPlaceholders})`);
          params.push(...stringIds);
        }

        if (conditions.length > 0) {
          await sqlDb.query(
            `DELETE FROM staff_import_staging WHERE (${conditions.join(' OR ')}) AND (tenantId = ? OR tenantId IS NULL)`,
            [...params, tId],
            tId
          );
        }
      } catch (sqlErr) {
        console.error('[Bulk Delete Staff Staging SQL Error]:', sqlErr.message);
      }
    }

    logAudit('Staff Staging Bulk Delete', `Count: ${ids.length}`, `Bulk deleted ${ids.length} pending staff members from staging`, req);

    return res.json({
      success: true,
      deletedCount: initialCount - db.staff_import_staging.length,
      message: `Successfully removed ${ids.length} pending staff member(s).`
    });
  } catch (err) {
    console.error('Error bulk deleting pending staff:', err);
    return res.status(500).json({ error: 'Failed to bulk delete pending staff: ' + err.message });
  }
};

// ========================================================
// 7. COMPLETE SETUP ATOMICALLY (POST /api/staff/import/complete-setup)
// ========================================================
export const completeStaffSetup = async (req, res) => {
  try {
    const {
      stagingId,
      firstName,
      middleName,
      lastName,
      email,
      phone,
      mobile,
      gender,
      dob,
      bloodGroup,
      nationality,
      maritalStatus,
      aadhaarNumber,
      panNumber,
      joiningDate,
      employmentType,
      department,
      primarySubject,
      secondarySubject,
      alternateMobile,
      currentAddress,
      currentCity,
      currentState,
      currentCountry,
      currentPostalCode,
      permanentAddress,
      permanentCity,
      permanentState,
      permanentCountry,
      permanentPostalCode,
      sameAsPermanent,
      qualification,
      experience,
      experiences,
      salary,
      username,
      password,
      role,
      hasRole,
      designation
    } = req.body;

    if (!stagingId) {
      return res.status(400).json({ error: 'stagingId is required to complete pending staff setup.' });
    }

    const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
    const tenantId = slugify(rawTenantId);

    const db = tenantStorage.run(tenantId, () => readDb(tenantId));
    if (!db.staff) db.staff = [];
    if (!db.staff_import_staging) db.staff_import_staging = [];

    // Locate row in staging
    const stagingIndex = db.staff_import_staging.findIndex(
      s => String(s.id) === String(stagingId) || String(s.staff_id) === String(stagingId) || String(s.staffId) === String(stagingId)
    );

    let stagedRow = stagingIndex !== -1 ? db.staff_import_staging[stagingIndex] : null;

    if (!stagedRow && isSqlActive()) {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        const isNumeric = /^\d+$/.test(String(stagingId).trim());
        const querySql = isNumeric
          ? 'SELECT * FROM staff_import_staging WHERE (id = ? OR staff_id = ?) AND (tenantId = ? OR tenantId IS NULL) LIMIT 1'
          : 'SELECT * FROM staff_import_staging WHERE staff_id = ? AND (tenantId = ? OR tenantId IS NULL) LIMIT 1';
        const queryParams = isNumeric ? [Number(stagingId), String(stagingId), tenantId] : [String(stagingId), tenantId];
        const rows = await sqlDb.query(querySql, queryParams, tenantId);
        if (rows && rows[0]) stagedRow = rows[0];
      } catch (sqlErr) {
        console.error('[Find Staging Row SQL Error]:', sqlErr.message);
      }
    }

    if (!stagedRow) {
      return res.status(404).json({ error: 'Pending staff staging record not found.' });
    }

    // Role setup
    const isRoleAccount = hasRole !== 'No';
    const activeRole = isRoleAccount ? role : (designation || stagedRow.designation || 'Staff');

    const derivedFullName = [firstName, middleName, lastName].filter(Boolean).join(' ') || stagedRow.full_name || stagedRow.fullName;
    if (!derivedFullName) {
      return res.status(400).json({ error: 'Staff name is required.' });
    }

    // Lock to the exact reserved Staff ID from staging
    const employeeId = stagedRow.staff_id || stagedRow.staffId;

    // Generate QR Code
    let qrPath = '';
    try {
      const { generateQrCode } = await import('../utils/qrService.js');
      qrPath = await generateQrCode(employeeId, 'Staff', tenantId);
    } catch (qrErr) {
      console.error('Failed to generate QR Code during staff setup completion:', qrErr);
    }

    let generatedUsername = null;
    let generatedPassword = null;
    let targetRoleId = null;

    if (isRoleAccount && activeRole) {
      generatedUsername = username || `staff_${employeeId.toLowerCase().replace(/-/g, '_')}`;
      generatedPassword = await hashPassword(password || 'staff123');

      // Check username uniqueness
      const usernameExists = db.staff.some(s => s.username === generatedUsername && s.id !== employeeId);
      if (usernameExists) {
        return res.status(400).json({ error: 'Username already exists. Please choose a different login username.' });
      }

      targetRoleId = mapDesignationToRoleId(activeRole, db.roles || getDefaultRoles());
    }

    // Clean phone
    let rawPhone = req.body.mobile || mobile || phone || stagedRow.mobile || stagedRow.phone || '';
    if (rawPhone && rawPhone.includes(':')) {
      try { rawPhone = decrypt(rawPhone); } catch (e) {}
    }
    const cleanPhone = normalizePhone(rawPhone);

    let parsedQualifications = qualification || stagedRow.qualification;
    if (typeof parsedQualifications === 'string') {
      try { parsedQualifications = JSON.parse(parsedQualifications); } catch (e) { parsedQualifications = []; }
    }
    let parsedExperiences = experiences;
    if (typeof experiences === 'string') {
      try { parsedExperiences = JSON.parse(experiences); } catch (e) { parsedExperiences = []; }
    }

    // Decrypt address from staging if not passed
    let finalAddress = permanentAddress || currentAddress;
    if (!finalAddress && stagedRow.address) {
      try {
        finalAddress = stagedRow.address.includes(':') ? decrypt(stagedRow.address) : stagedRow.address;
      } catch (e) {}
    }

    // Handle document / photo uploads if provided
    const files = req.files || {};
    const folder = `school/${tenantId}/staff`;
    const processUpload = async (fileArray) => {
      if (!fileArray || !fileArray[0]) return '';
      try {
        const { uploadToImageKit } = await import('../utils/imagekit.js');
        const uploadRes = await uploadToImageKit(fileArray[0].buffer, fileArray[0].originalname, folder);
        return uploadRes.url;
      } catch (e) {
        console.error('File upload error during staff setup:', e);
        return '';
      }
    };

    const photoPath = await processUpload(files.photo);
    const aadhaarPath = await processUpload(files.aadhaarFile);
    const panPath = await processUpload(files.panFile);
    const resumePath = await processUpload(files.resumeFile);
    const qualificationPath = await processUpload(files.qualificationFile);
    const experiencePath = await processUpload(files.experienceFile);
    const joiningLetterPath = await processUpload(files.joiningLetterFile);
    const otherPath = await processUpload(files.otherFile);

    const newStaff = {
      id: employeeId,
      employeeId,
      photo: photoPath,
      aadhaarFile: aadhaarPath,
      panFile: panPath,
      resumeFile: resumePath,
      qualificationFile: qualificationPath,
      experienceFile: experiencePath,
      joiningLetterFile: joiningLetterPath,
      otherFile: otherPath,
      fullName: derivedFullName,
      name: derivedFullName,
      firstName: firstName || stagedRow.first_name || stagedRow.firstName || '',
      middleName: middleName || stagedRow.middle_name || stagedRow.middleName || '',
      lastName: lastName || stagedRow.last_name || stagedRow.lastName || '',
      email: email || (stagedRow.email ? (stagedRow.email.includes(':') ? decrypt(stagedRow.email) : stagedRow.email) : ''),
      phone: cleanPhone,
      mobile: cleanPhone,
      gender: gender || stagedRow.gender || 'Male',
      dob: dob || stagedRow.dob || '',
      bloodGroup: bloodGroup || stagedRow.blood_group || stagedRow.bloodGroup || '',
      nationality: nationality || stagedRow.nationality || 'Indian',
      maritalStatus: maritalStatus || stagedRow.marital_status || stagedRow.maritalStatus || '',
      aadhaarNumber: aadhaarNumber || '',
      panNumber: panNumber || '',
      joiningDate: joiningDate || stagedRow.joining_date || stagedRow.joiningDate || new Date().toISOString().split('T')[0],
      employmentType: employmentType || 'Full Time',
      department: department || stagedRow.department || '',
      primarySubject: primarySubject || '',
      secondarySubject: secondarySubject || '',
      alternateMobile: alternateMobile || '',
      currentAddress: currentAddress || finalAddress || '',
      currentCity: currentCity || '',
      currentState: currentState || '',
      currentCountry: currentCountry || 'India',
      currentPostalCode: currentPostalCode || '',
      permanentAddress: permanentAddress || finalAddress || '',
      permanentCity: permanentCity || '',
      permanentState: permanentState || '',
      permanentCountry: permanentCountry || 'India',
      permanentPostalCode: permanentPostalCode || '',
      sameAsPermanent: sameAsPermanent ?? true,
      qualification: parsedQualifications,
      experience: experience || stagedRow.experience || '0',
      experiences: parsedExperiences,
      salary: salary || 0,
      role: activeRole,
      roleId: targetRoleId,
      hasRole: isRoleAccount ? 'Yes' : 'No',
      designation: designation || stagedRow.designation || 'Staff',
      username: generatedUsername,
      password: generatedPassword,
      qrCodePath: qrPath,
      status: 'Active',
      importBatchId: stagedRow.batch_id,
      importedAt: stagedRow.created_at || stagedRow.createdAt,
      setupCompletedAt: new Date().toISOString(),
      tenantId
    };

    // 1. Commit to main staff table
    const existingIndex = db.staff.findIndex(s => s.id === employeeId || s.employeeId === employeeId);
    if (existingIndex !== -1) {
      db.staff[existingIndex] = newStaff;
    } else {
      db.staff.push(newStaff);
    }

    // 2. Create User Access login record if role account is enabled
    if (isRoleAccount && generatedUsername) {
      if (!db.userAccess) db.userAccess = [];
      const userIdx = db.userAccess.findIndex(u => u.username === generatedUsername || u.employeeId === employeeId);
      const userRecord = {
        id: `user-${Date.now()}`,
        employeeId,
        username: generatedUsername,
        password: generatedPassword,
        role: activeRole,
        roleId: targetRoleId,
        name: derivedFullName,
        email: newStaff.email,
        phone: cleanPhone,
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      if (userIdx !== -1) {
        db.userAccess[userIdx] = userRecord;
      } else {
        db.userAccess.push(userRecord);
      }
    }

    // 3. Atomically remove from staging table
    if (stagingIndex !== -1) {
      db.staff_import_staging.splice(stagingIndex, 1);
    } else {
      db.staff_import_staging = db.staff_import_staging.filter(
        s => String(s.id) !== String(stagingId) && String(s.staff_id) !== String(employeeId)
      );
    }

    addActivity(db, 'registration', 'New Staff Registered via Bulk Import', `${derivedFullName} (${employeeId}) setup completed with role: ${activeRole}.`, 'hsl(var(--color-primary))', 'rgba(hsl(var(--color-primary)), 0.1)');
    writeDb(db, ['staff', 'staff_import_staging', 'userAccess', 'employeeQrCodes'], tenantId);

    // SQL sync
    if (isSqlActive()) {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        const tId = tenantId ? slugify(tenantId) : 'platform';

        await sqlDb.query(
          `INSERT INTO staff 
          (id, employeeId, name, fullName, email, phone, gender, dob, role, roleId, designation, department, joiningDate, status, username, password, tenantId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            name = VALUES(name), fullName = VALUES(fullName), email = VALUES(email), phone = VALUES(phone),
            role = VALUES(role), roleId = VALUES(roleId), designation = VALUES(designation), status = 'Active'`,
          [
            employeeId, employeeId, derivedFullName, derivedFullName,
            newStaff.email ? encrypt(newStaff.email) : '',
            cleanPhone ? encrypt(cleanPhone) : '',
            newStaff.gender, newStaff.dob, activeRole, targetRoleId,
            newStaff.designation, newStaff.department, newStaff.joiningDate,
            generatedUsername, generatedPassword, tId
          ],
          tId
        );

        // Delete from staging
        const isNumericStaging = /^\d+$/.test(String(stagingId).trim());
        if (isNumericStaging) {
          await sqlDb.query(
            'DELETE FROM staff_import_staging WHERE (id = ? OR staff_id = ?) AND (tenantId = ? OR tenantId IS NULL)',
            [Number(stagingId), String(employeeId), tId],
            tId
          );
        } else {
          await sqlDb.query(
            'DELETE FROM staff_import_staging WHERE (staff_id = ? OR staff_id = ?) AND (tenantId = ? OR tenantId IS NULL)',
            [String(employeeId), String(stagingId), tId],
            tId
          );
        }
      } catch (sqlErr) {
        console.error('[Complete Staff Setup SQL Error]:', sqlErr.message);
      }
    }

    logAudit('Staff Setup Completed', `Staff ID: ${employeeId}`, `Completed setup for imported staff member ${derivedFullName}. Assigned role: ${activeRole}.`, req);

    return res.json({
      success: true,
      staff: newStaff,
      message: `Setup completed successfully for ${derivedFullName} (${employeeId}). They are now an active staff member in the Staff Directory!`
    });
  } catch (err) {
    console.error('Error completing staff setup:', err);
    return res.status(500).json({ error: 'Failed to complete staff setup: ' + err.message });
  }
};

// ========================================================
// 8. GET LATEST ACTIVE BATCH (GET /api/staff/import/latest-batch)
// ========================================================
export const getLatestStaffImportBatch = async (req, res) => {
  try {
    const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
    const tenantId = slugify(rawTenantId);
    await ensureStaffImportTablesExist(tenantId);

    const db = tenantStorage.run(tenantId, () => readDb(tenantId));
    if (!db.import_batches) db.import_batches = [];
    if (!db.staff_import_staging) db.staff_import_staging = [];

    let activeBatches = (db.import_batches || [])
      .filter(b => b.status === 'active' && b.batch_id && (b.batch_id.startsWith('BATCH-STF-') || b.module === 'staff'))
      .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

    let latestBatch = activeBatches[0] || null;

    if (isSqlActive()) {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        const tId = tenantId ? slugify(tenantId) : 'platform';
        const rows = await sqlDb.query(
          "SELECT * FROM import_batches WHERE status = 'active' AND (batch_id LIKE 'BATCH-STF-%' OR module = 'staff') AND (tenantId = ? OR tenantId IS NULL) ORDER BY created_at DESC LIMIT 1",
          [tId],
          tId
        );
        if (rows && rows[0]) {
          latestBatch = rows[0];
        }
      } catch (sqlErr) {
        console.error('[Get Latest Staff Batch SQL Error]:', sqlErr.message);
      }
    }

    if (!latestBatch) {
      return res.json({ hasBatch: false, message: 'No active staff import batch eligible for undo.' });
    }

    // Check 24-hour expiration window
    const batchTime = new Date(latestBatch.created_at || latestBatch.createdAt).getTime();
    const now = Date.now();
    const hoursElapsed = (now - batchTime) / (1000 * 60 * 60);

    if (hoursElapsed > 24) {
      return res.json({
        hasBatch: false,
        message: 'The latest staff import batch was created over 24 hours ago and can no longer be undone.'
      });
    }

    // Check how many rows belonging to this batch are STILL PENDING in staging
    let pendingInBatch = db.staff_import_staging.filter(
      s => s.batch_id === latestBatch.batch_id
    ).length;

    if (isSqlActive()) {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        const tId = tenantId ? slugify(tenantId) : 'platform';
        const countRows = await sqlDb.query(
          'SELECT COUNT(*) as cnt FROM staff_import_staging WHERE batch_id = ? AND tenantId = ?',
          [latestBatch.batch_id, tId],
          tId
        );
        if (countRows && countRows[0]) {
          pendingInBatch = countRows[0].cnt;
        }
      } catch (sqlErr) {
        console.error('[Pending In Batch Count SQL Error]:', sqlErr.message);
      }
    }

    return res.json({
      hasBatch: true,
      batchId: latestBatch.batch_id,
      fileName: latestBatch.file_name,
      createdAt: latestBatch.created_at,
      totalImported: latestBatch.success_count || latestBatch.total_rows,
      pendingCount: pendingInBatch,
      hoursRemaining: Math.max(0, 24 - hoursElapsed).toFixed(1)
    });
  } catch (err) {
    console.error('Error fetching latest staff import batch:', err);
    return res.status(500).json({ error: 'Failed to fetch latest batch info: ' + err.message });
  }
};

// ========================================================
// 9. UNDO LAST IMPORT (POST /api/staff/import/undo/:batchId)
// ========================================================
export const undoStaffImport = async (req, res) => {
  try {
    const { batchId } = req.params;
    if (!batchId) {
      return res.status(400).json({ error: 'batchId is required to undo an import.' });
    }

    const rawTenantId = req.admin?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'platform';
    const tenantId = slugify(rawTenantId);

    const db = tenantStorage.run(tenantId, () => readDb(tenantId));
    if (!db.import_batches) db.import_batches = [];
    if (!db.staff_import_staging) db.staff_import_staging = [];

    const batch = db.import_batches.find(b => b.batch_id === batchId);
    if (!batch) {
      return res.status(404).json({ error: `Import batch ${batchId} not found.` });
    }

    if (batch.status === 'undone') {
      return res.status(400).json({ error: 'This import batch has already been undone.' });
    }

    // Check 24-hour limit
    const batchTime = new Date(batch.created_at || batch.createdAt).getTime();
    const hoursElapsed = (Date.now() - batchTime) / (1000 * 60 * 60);
    if (hoursElapsed > 24) {
      return res.status(400).json({ error: 'This import batch is older than 24 hours and can no longer be undone.' });
    }

    // Count and remove ONLY rows still in staging belonging to this batch
    const initialStagingCount = db.staff_import_staging.length;
    db.staff_import_staging = db.staff_import_staging.filter(
      s => s.batch_id !== batchId
    );
    const removedCount = initialStagingCount - db.staff_import_staging.length;

    // Mark batch status as undone
    batch.status = 'undone';
    batch.undone_at = new Date().toISOString();

    // Clean up designations created by this batch IF not used by active staff or remaining staging rows
    if (batch.created_designations) {
      try {
        const createdDesigs = JSON.parse(batch.created_designations);
        if (Array.isArray(createdDesigs) && db.designations) {
          createdDesigs.forEach(desigName => {
            const usedInStaff = (db.staff || []).some(s => (s.designation || '').toLowerCase() === desigName.toLowerCase());
            const usedInStaging = db.staff_import_staging.some(s => (s.designation || '').toLowerCase() === desigName.toLowerCase());
            if (!usedInStaff && !usedInStaging) {
              db.designations = db.designations.filter(d => (d.name || '').toLowerCase() !== desigName.toLowerCase());
            }
          });
        }
      } catch (e) {}
    }

    writeDb(db, ['staff_import_staging', 'import_batches', 'designations'], tenantId);

    // Sync to MySQL
    if (isSqlActive()) {
      try {
        const sqlDb = await import('../utils/sqlDb.js');
        const tId = tenantId ? slugify(tenantId) : 'platform';

        await sqlDb.query(
          'DELETE FROM staff_import_staging WHERE batch_id = ? AND tenantId = ?',
          [batchId, tId],
          tId
        );

        await sqlDb.query(
          "UPDATE import_batches SET status = 'undone', undone_at = NOW() WHERE batch_id = ? AND tenantId = ?",
          [batchId, tId],
          tId
        );
      } catch (sqlErr) {
        console.error('[Undo Staff Import SQL Error]:', sqlErr.message);
      }
    }

    logAudit(
      'Undo Staff Bulk Import',
      `Batch: ${batchId}`,
      `Undid import batch. Removed ${removedCount} pending staff from staging roster. Staff members already set up were untouched.`,
      req
    );

    return res.json({
      success: true,
      batchId,
      removedCount,
      message: `Successfully removed ${removedCount} pending staff member(s) from the import batch. Staff members already set up were not affected.`
    });
  } catch (err) {
    console.error('Error undoing staff import:', err);
    return res.status(500).json({ error: 'Failed to undo staff import: ' + err.message });
  }
};

// ========================================================
// 10. DOWNLOAD ERROR REPORT (POST /api/staff/import/error-report)
// ========================================================
export const downloadStaffErrorReport = async (req, res) => {
  try {
    const { rows, fileName = 'staff_import' } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided to generate error report.' });
    }

    const errorRows = rows.filter(r => r.status === 'Error' || r.status === 'Duplicate');
    if (errorRows.length === 0) {
      return res.status(400).json({ error: 'No error rows found to generate report.' });
    }

    const reportData = errorRows.map(r => ({
      'Row Number': r.rowIndex,
      'Status': r.status,
      'Failure Reason': r.message || (r.errors || []).join(', '),
      'Full Name': r.data?.fullName || '',
      'Mobile': r.data?.mobile || '',
      'Email': r.data?.email || '',
      'Department': r.data?.department || '',
      'Designation': r.data?.designation || '',
      'Gender': r.data?.gender || '',
      'DOB': r.data?.dob || '',
      'Qualification': r.data?.qualification || '',
      'Experience': r.data?.experience || '',
      'Address': r.data?.address || ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(reportData);
    worksheet['!cols'] = Object.keys(reportData[0]).map(k => ({
      wch: Math.max(k.length + 4, 18)
    }));

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Error_Report');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Staff_Import_Error_Report.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating staff error report:', err);
    return res.status(500).json({ error: 'Failed to generate error report: ' + err.message });
  }
};
