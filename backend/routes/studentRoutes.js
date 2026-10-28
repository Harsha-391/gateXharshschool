import express from 'express';
import { studentValidation } from '../middleware/validationMiddleware.js';
import { 
  registerStudent, 
  getStudents, 
  updateStudent, 
  deleteStudent,
  bulkDeleteStudents 
} from '../controllers/studentController.js';
import upload from '../middleware/upload.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';

const router = express.Router();

// Fields map for multer handling multiple files
const uploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhaarFile', maxCount: 1 },
  { name: 'birthCertificateFile', maxCount: 1 },
  { name: 'marksheetFile', maxCount: 1 },
  { name: 'transferCertificateFile', maxCount: 1 },
  { name: 'addressProofFile', maxCount: 1 },
  { name: 'medicalCertificateFile', maxCount: 1 },
  { name: 'additionalFile', maxCount: 1 }
]);

import multer from 'multer';
import path from 'path';
import {
  downloadImportTemplate,
  previewImportFile,
  confirmBatchImport,
  getImportStatus,
  undoImportBatch,
  getLatestImportBatch
} from '../controllers/studentImportController.js';

// Dedicated upload middleware for bulk import (.xlsx, .xls, .csv, max 5MB)
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only .xlsx, .xls, and .csv files are allowed.'));
    }
  }
});

// Apply tenant context, SQL loader, and auth globally to all student routes
router.use(restoreTenantContext);
router.use(ensureTenantSqlLoaded);
router.use(auth);

// ==========================================
// STUDENT BULK IMPORT ROUTES (ONLY for Student Directory)
// ==========================================
// 1. Download Sample Template
router.get('/import/template', checkPermission('register-student', 'create'), downloadImportTemplate);

// 2. Upload and Preview Import File
router.post('/import/preview', importUpload.single('file'), restoreTenantContext, checkPermission('register-student', 'create'), previewImportFile);

// 3. Confirm and Process Batch Import
router.post('/import/confirm', restoreTenantContext, checkPermission('register-student', 'create'), confirmBatchImport);

// 4. Check Import Job Status
router.get('/import/status/:jobId', restoreTenantContext, checkPermission('register-student', 'create'), getImportStatus);

// 5. Undo Recent Import Batch (within 24 hours)
router.post('/import/undo/:batchId', restoreTenantContext, checkPermission('register-student', 'create'), undoImportBatch);

// 6. Get Latest Active Import Batch
router.get('/import/latest-batch', restoreTenantContext, checkPermission('student-directory', 'view'), getLatestImportBatch);

// 1. GET ALL STUDENTS (Support Query Search, Filter, Sort, Pagination)
router.get('/', checkPermission('student-directory', 'view'), getStudents);

// 2. REGISTER NEW STUDENT (Multer Files upload + JWT authentication)
router.post('/', uploadFields, restoreTenantContext, checkPermission('register-student', 'create'), studentValidation, registerStudent);

// 3. UPDATE STUDENT PROFILE
router.put('/:id', uploadFields, restoreTenantContext, checkPermission('student-directory', 'edit'), updateStudent);

// 4. BULK DISMISS STUDENTS
router.post('/bulk-delete', restoreTenantContext, checkPermission('student-directory', 'delete'), bulkDeleteStudents);
router.delete('/bulk-delete', restoreTenantContext, checkPermission('student-directory', 'delete'), bulkDeleteStudents);

// 5. DISMISS / REMOVE STUDENT profile
router.delete('/:id', checkPermission('student-directory', 'delete'), deleteStudent);

export default router;

