import express from 'express';
import multer from 'multer';
import path from 'path';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';
import {
  downloadStaffImportTemplate,
  previewStaffImport,
  confirmStaffImport,
  getPendingStaff,
  deletePendingStaff,
  bulkDeletePendingStaff,
  completeStaffSetup,
  getLatestStaffImportBatch,
  undoStaffImport,
  downloadStaffErrorReport
} from '../controllers/staffImportController.js';

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

// Multer memory storage for complete setup files (documents, photos)
const uploadSetup = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});
const uploadSetupFields = uploadSetup.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhaarFile', maxCount: 1 },
  { name: 'panFile', maxCount: 1 },
  { name: 'resumeFile', maxCount: 1 },
  { name: 'qualificationFile', maxCount: 1 },
  { name: 'experienceFile', maxCount: 1 },
  { name: 'joiningLetterFile', maxCount: 1 },
  { name: 'otherFile', maxCount: 1 }
]);

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

// RBAC: users with create permission on staff-directory, add-staff or registry-admissions can manage imports
const canManageStaffImport = async (req, res, next) => {
  const user = req.admin || req.user;
  const adminRoles = ['Main Admin', 'Developer Admin', 'Principal', 'Admin Dashboard', 'School Admin', 'Super Admin'];
  if (user && (adminRoles.includes(user.role) || adminRoles.includes(user.roleName))) {
    return next();
  }

  if (
    await evaluatePermission(req, 'staff-directory', 'create') ||
    await evaluatePermission(req, 'add-staff', 'create') ||
    await evaluatePermission(req, 'staff-directory', 'edit') ||
    await evaluatePermission(req, 'registry-admissions', 'create')
  ) {
    return next();
  }

  return res.status(403).json({
    error: "Access denied. Insufficient permissions for module 'staff-directory' or 'add-staff' (requires 'create' permission)."
  });
};

const canViewPendingStaff = async (req, res, next) => {
  const user = req.admin || req.user;
  const adminRoles = ['Main Admin', 'Developer Admin', 'Principal', 'Admin Dashboard', 'School Admin', 'Super Admin'];
  if (user && (adminRoles.includes(user.role) || adminRoles.includes(user.roleName))) {
    return next();
  }

  if (
    await evaluatePermission(req, 'staff-directory', 'view') ||
    await evaluatePermission(req, 'add-staff', 'view') ||
    await evaluatePermission(req, 'registry-admissions', 'view')
  ) {
    return next();
  }

  return res.status(403).json({
    error: "Access denied. Insufficient permissions to view pending staff."
  });
};

// 1. Download Sample Spreadsheet Template
router.get('/template', canManageStaffImport, downloadStaffImportTemplate);

// 2. Upload and Preview File
router.post('/preview', upload.single('file'), canManageStaffImport, previewStaffImport);

// 3. Confirm Batch Import (Saves to staging only)
router.post('/confirm', canManageStaffImport, confirmStaffImport);

// 4. Get Pending Staff List
router.get('/pending', canViewPendingStaff, getPendingStaff);

// 5. Delete Single Pending Staff
router.delete('/pending/:id', canManageStaffImport, deletePendingStaff);

// 6. Bulk Delete Pending Staff
router.post('/pending/bulk-delete', canManageStaffImport, bulkDeletePendingStaff);

// 7. Atomic Setup Completion (Creates in staff table + removes from staging)
router.post('/complete-setup', uploadSetupFields, canManageStaffImport, completeStaffSetup);

// 8. Get Latest Active Batch Info
router.get('/latest-batch', canViewPendingStaff, getLatestStaffImportBatch);

// 9. Undo Recent Import Batch (Pending rows only)
router.post('/undo/:batchId', canManageStaffImport, undoStaffImport);

// 10. Download Error Report
router.post('/error-report', canManageStaffImport, downloadStaffErrorReport);

export default router;
