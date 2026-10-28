import express from 'express';
import multer from 'multer';
import path from 'path';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';
import {
  downloadTeacherImportTemplate,
  previewTeacherImport,
  confirmTeacherImport,
  getPendingTeachers,
  deletePendingTeacher,
  bulkDeletePendingTeachers,
  completeTeacherSetup,
  getLatestTeacherImportBatch,
  undoTeacherImport,
  downloadTeacherErrorReport
} from '../controllers/teacherImportController.js';

const router = express.Router();

// Multer memory storage for spreadsheet files (max 5 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .xlsx, .xls, and .csv files are supported.'));
    }
  }
});

// Global middlewares for tenant context and auth
router.use(restoreTenantContext);
router.use(ensureTenantSqlLoaded);
router.use(auth);

// Helper to evaluate permission against checkPermission without terminating the HTTP response
const evaluatePermission = (req, module, action) => {
  return new Promise((resolve) => {
    let finished = false;
    const mockRes = {
      status: () => mockRes,
      json: () => {
        if (!finished) {
          finished = true;
          resolve(false);
        }
      }
    };
    const mockNext = () => {
      if (!finished) {
        finished = true;
        resolve(true);
      }
    };
    try {
      checkPermission(module, action)(req, mockRes, mockNext);
    } catch (e) {
      resolve(false);
    }
  });
};

// RBAC: users with create permission on teachers or teacher directory can manage imports
const canManageTeacherImport = async (req, res, next) => {
  if (
    await evaluatePermission(req, 'teacher-directory', 'create') ||
    await evaluatePermission(req, 'register-teacher', 'create') ||
    await evaluatePermission(req, 'teacher-directory', 'edit') ||
    await evaluatePermission(req, 'registry-admissions', 'create')
  ) {
    return next();
  }

  return res.status(403).json({
    error: "Access denied. Insufficient permissions for module 'teacher-directory' or 'register-teacher' (requires 'create' permission)."
  });
};

const canViewPendingTeachers = async (req, res, next) => {
  if (
    await evaluatePermission(req, 'teacher-directory', 'view') ||
    await evaluatePermission(req, 'register-teacher', 'view') ||
    await evaluatePermission(req, 'registry-admissions', 'view')
  ) {
    return next();
  }

  return res.status(403).json({
    error: "Access denied. Insufficient permissions to view pending teachers."
  });
};

// 1. Download Sample Spreadsheet Template
router.get('/template', canManageTeacherImport, downloadTeacherImportTemplate);

// 2. Upload and Preview File
router.post('/preview', upload.single('file'), canManageTeacherImport, previewTeacherImport);

// 3. Confirm Batch Import (Saves to staging only)
router.post('/confirm', canManageTeacherImport, confirmTeacherImport);

// 4. Get Pending Teachers List
router.get('/pending', canViewPendingTeachers, getPendingTeachers);

// 5. Delete Single Pending Teacher
router.delete('/pending/:id', canManageTeacherImport, deletePendingTeacher);

// 6. Bulk Delete Pending Teachers
router.post('/pending/bulk-delete', canManageTeacherImport, bulkDeletePendingTeachers);

// 7. Atomic Setup Completion (Creates in teachers table + removes from staging)
router.post('/complete-setup', canManageTeacherImport, completeTeacherSetup);

// 8. Get Latest Active Batch Info
router.get('/latest-batch', canViewPendingTeachers, getLatestTeacherImportBatch);

// 9. Undo Recent Import Batch (Pending rows only)
router.post('/undo/:batchId', canManageTeacherImport, undoTeacherImport);

// 10. Download Error Report
router.post('/error-report', canManageTeacherImport, downloadTeacherErrorReport);

export default router;
