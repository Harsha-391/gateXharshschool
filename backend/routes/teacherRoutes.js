import express from 'express';
import { teacherValidation } from '../middleware/validationMiddleware.js';
import { 
  registerTeacher, 
  getTeachers, 
  getTeacherById,
  updateTeacher, 
  deleteTeacher,
  bulkDeleteTeachers 
} from '../controllers/teacherController.js';
import upload from '../middleware/upload.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';

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

// Apply tenant context, SQL database loader, and auth globally to all teacher routes
router.use(restoreTenantContext);
router.use(ensureTenantSqlLoaded);
router.use(auth);

// 1. GET ALL TEACHERS
router.get('/', checkPermission('teacher-directory', 'view'), getTeachers);

// 2. GET SINGLE TEACHER PROFILE BY EMPLOYEE ID
router.get('/:id', checkPermission('teacher-directory', 'view'), getTeacherById);

// 3. REGISTER NEW TEACHER
router.post('/', uploadFields, restoreTenantContext, checkPermission('register-teacher', 'create'), teacherValidation, registerTeacher);

// 4. UPDATE TEACHER PROFILE
router.put('/:id', uploadFields, restoreTenantContext, checkPermission('teacher-directory', 'edit'), updateTeacher);

// 5. BULK DISMISS TEACHERS
router.post('/bulk-delete', checkPermission('teacher-directory', 'delete'), bulkDeleteTeachers);
router.delete('/bulk-delete', checkPermission('teacher-directory', 'delete'), bulkDeleteTeachers);

// 6. DISMISS/REMOVE TEACHER
router.delete('/:id', checkPermission('teacher-directory', 'delete'), deleteTeacher);

export default router;
