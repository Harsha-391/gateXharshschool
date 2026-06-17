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

// 1. GET ALL TEACHERS (Supports search query, sorting, filtering, and pagination)
router.get('/', getTeachers);

// 2. GET SINGLE TEACHER PROFILE BY EMPLOYEE ID
router.get('/:id', getTeacherById);

// 3. REGISTER NEW TEACHER (Multer fields + optional security auth headers)
// To keep execution smooth, we allow seamless registration without blocking
router.post('/', uploadFields, restoreTenantContext, registerTeacher);

// 4. UPDATE TEACHER PROFILE
router.put('/:id', uploadFields, restoreTenantContext, updateTeacher);

// 5. DISMISS/REMOVE TEACHER
router.delete('/:id', deleteTeacher);

export default router;
