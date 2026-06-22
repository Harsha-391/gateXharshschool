import express from 'express';
import { 
  registerTeacher, 
  getTeachers, 
  getTeacherById,
  updateTeacher, 
  deleteTeacher 
} from '../controllers/teacherController.js';
import upload from '../middleware/upload.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { restoreTenantContext } from '../utils/db.js';

const router = express.Router();

// Multer fields map for handling multiple file uploads
const uploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhaarFile', maxCount: 1 },
  { name: 'panFile', maxCount: 1 },
  { name: 'resumeFile', maxCount: 1 },
  { name: 'qualificationFile', maxCount: 1 },
  { name: 'experienceFile', maxCount: 1 },
  { name: 'joiningLetterFile', maxCount: 1 },
  { name: 'otherFile', maxCount: 1 }
]);

// Apply auth globally to all teacher routes
router.use(auth);

// 1. GET ALL TEACHERS (Supports search query, sorting, filtering, and pagination)
router.get('/', restoreTenantContext, checkPermission('teacher-directory', 'view'), getTeachers);

// 2. GET SINGLE TEACHER PROFILE BY EMPLOYEE ID
router.get('/:id', restoreTenantContext, checkPermission('teacher-directory', 'view'), getTeacherById);

// 3. REGISTER NEW TEACHER (Multer fields + optional security auth headers)
router.post('/', uploadFields, restoreTenantContext, checkPermission('add-teacher', 'create'), registerTeacher);

// 4. UPDATE TEACHER PROFILE
router.put('/:id', uploadFields, restoreTenantContext, checkPermission('teacher-directory', 'edit'), updateTeacher);

// 5. DISMISS/REMOVE TEACHER
router.delete('/:id', restoreTenantContext, checkPermission('teacher-directory', 'delete'), deleteTeacher);

export default router;
