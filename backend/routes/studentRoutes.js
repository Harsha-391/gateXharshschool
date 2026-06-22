import express from 'express';
import { 
  registerStudent, 
  getStudents, 
  updateStudent, 
  deleteStudent 
} from '../controllers/studentController.js';
import upload from '../middleware/upload.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { restoreTenantContext } from '../utils/db.js';

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

// Apply auth globally to all student routes
router.use(auth);

// 1. GET ALL STUDENTS (Support Query Search, Filter, Sort, Pagination)
router.get('/', restoreTenantContext, checkPermission('student-directory', 'view'), getStudents);

// 2. REGISTER NEW STUDENT (Multer Files upload + JWT authentication)
router.post('/', uploadFields, restoreTenantContext, checkPermission('register-student', 'create'), registerStudent);

// 3. UPDATE STUDENT PROFILE
router.put('/:id', uploadFields, restoreTenantContext, checkPermission('student-directory', 'edit'), updateStudent);

// 4. DISMISS / REMOVE STUDENT profile
router.delete('/:id', restoreTenantContext, checkPermission('student-directory', 'delete'), deleteStudent);

export default router;
