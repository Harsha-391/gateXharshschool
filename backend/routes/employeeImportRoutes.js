import express from 'express';
import multer from 'multer';
import path from 'path';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';
import {
  downloadEmployeeImportTemplate,
  previewEmployeeImport,
  confirmEmployeeImport,
  getLatestEmployeeImportBatch,
  undoEmployeeImport,
  downloadEmployeeErrorReport
} from '../controllers/employeeImportController.js';

const router = express.Router();

// Multer memory storage for spreadsheet files (max 5 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .xlsx, .xls, and .csv files are supported.'));
    }
  }
});

// Global middlewares
router.use(restoreTenantContext);
router.use(ensureTenantSqlLoaded);
router.use(auth);

// Module permission helpers (checks employee-directory or add-employee)
const canImportEmployees = (req, res, next) => {
  checkPermission('employee-directory', 'create')(req, res, (err) => {
    if (!err) return next();
    checkPermission('add-employee', 'create')(req, res, next);
  });
};

const canViewEmployeeBatch = (req, res, next) => {
  checkPermission('employee-directory', 'view')(req, res, (err) => {
    if (!err) return next();
    checkPermission('add-employee', 'view')(req, res, next);
  });
};

// 1. Download Sample Template
router.get('/template', canImportEmployees, downloadEmployeeImportTemplate);

// 2. Upload and Preview File
router.post('/preview', upload.single('file'), canImportEmployees, previewEmployeeImport);

// 3. Confirm Batch Import
router.post('/confirm', canImportEmployees, confirmEmployeeImport);

// 4. Get Latest Active Import Batch (within 24 hours)
router.get('/latest-batch', canViewEmployeeBatch, getLatestEmployeeImportBatch);

// 5. Undo Recent Import Batch
router.post('/undo/:batchId', canImportEmployees, undoEmployeeImport);

// 6. Download Error Report
router.post('/error-report', canImportEmployees, downloadEmployeeErrorReport);

export default router;
