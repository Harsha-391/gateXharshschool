import express from 'express';
import { 
  getAttendanceRoster, 
  saveAttendanceRoster, 
  submitAttendanceRoster,
  getSubmittedAttendanceDates,
  getStudentAttendanceReport, 
  getClassAttendanceReport, 
  getMonthlyCalendarData 
} from '../controllers/attendanceController.js';

import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { restoreTenantContext, ensureTenantSqlLoaded, readDb } from '../utils/db.js';
import { attendanceLimiter } from '../middleware/rateLimiter.js';
import { normalizeGradeStr, areGradesMatch, normalizeSectionStr, areSectionsMatch } from '../utils/gradeUtils.js';

const router = express.Router();

// Apply auth to all attendance routes
router.use(auth);
router.use(restoreTenantContext);
router.use(ensureTenantSqlLoaded);
router.use(attendanceLimiter);


// Apply checkPermission based on request method
router.use((req, res, next) => {
  const action = req.method === 'GET' ? 'view' : 'create';
  return checkPermission('attendance', action)(req, res, next);
});

// Guard: validate teacher's assigned class/section & attendance permission
const validateTeacherAttendanceAccess = (req, res, next) => {
  const user = req.admin;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Session missing.' });
  }

  // Main Admins, Staff, and Developer Admins bypass this validation
  const isTeacher = user.role === 'Teacher' || user.userType === 'Teacher';
  if (!isTeacher) {
    return next();
  }

  const db = readDb();
  const teacher = (db.teachers || []).find(t => t.id === user.id || (user.username && t.username === user.username)) || user;

  // 1. Class teacher check
  const isClassTeacher = teacher.isClassTeacher === true || teacher.isClassTeacher === 1 || teacher.isClassTeacher === 'Yes' ||
    user.isClassTeacher === true || user.isClassTeacher === 1 || user.isClassTeacher === 'Yes';
  if (!isClassTeacher) {
    return res.status(403).json({ error: 'Forbidden. Only class teachers are authorized to access student attendance.' });
  }

  // 2. Attendance permission check
  const hasAttPerm = teacher.attendancePermission === true || teacher.attendancePermission === 1 || teacher.attendancePermission === 'Yes' ||
    user.attendancePermission === true || user.attendancePermission === 1 || user.attendancePermission === 'Yes';
  if (!hasAttPerm) {
    return res.status(403).json({ error: 'Forbidden. You do not have student attendance permission.' });
  }

  // 2. Extract requested class and section from body or query
  let requestedClass = req.query.studentClass || req.body.studentClass || req.query.classId || req.body.classId || req.query.class;
  let requestedSection = req.query.section || req.body.section || req.query.sectionId || req.body.sectionId;
  const requestedStudentId = req.query.studentId || req.body.studentId;

  const assignedGrade = teacher.assignedGradeId || user.assignedGradeId;
  const assignedSection = teacher.assignedSectionId || user.assignedSectionId;

  if (!assignedGrade || !assignedSection) {
    return res.status(403).json({ error: 'Forbidden. You have not been assigned to any class or section.' });
  }

  const matchedGradeObj = (db.grades || []).find(g => g.id === assignedGrade || g.name === assignedGrade);
  const assignedGradeName = matchedGradeObj ? matchedGradeObj.name : assignedGrade;

  // Check if class/section matches teacher assignment
  if (requestedClass) {
    const isClassMatch = areGradesMatch(requestedClass, assignedGrade) || areGradesMatch(requestedClass, assignedGradeName);
    if (!isClassMatch) {
      return res.status(403).json({ error: `Forbidden. You are not authorized to access Grade ${requestedClass}.` });
    }
  }
  if (requestedSection) {
    const isSectionMatch = areSectionsMatch(requestedSection, assignedSection);
    if (!isSectionMatch) {
      return res.status(403).json({ error: `Forbidden. You are not authorized to access Section ${requestedSection}.` });
    }
  }

  // Validate student requested is inside the teacher's class
  if (requestedStudentId) {
    const student = (db.students || []).find(s => s.id === requestedStudentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    const matchClass = areGradesMatch(student.studentClass, assignedGrade) || 
                       areGradesMatch(student.studentClass, assignedGradeName) ||
                       areGradesMatch(student.grade?.split('-')[0], assignedGrade) ||
                       areGradesMatch(student.grade?.split('-')[0], assignedGradeName);
    const matchSec = areSectionsMatch(student.section, assignedSection) || 
                     areSectionsMatch(student.grade?.split('-')[1], assignedSection);
    if (!matchClass || !matchSec) {
      return res.status(403).json({ error: 'Forbidden. Requested student is not in your assigned class and section.' });
    }
  }

  // Automatically inject/force the assigned values for query-less or bulk requests
  if (req.method === 'GET') {
    req.query.studentClass = requestedClass || assignedGradeName || assignedGrade;
    req.query.section = requestedSection || assignedSection;
  } else {
    req.body.studentClass = requestedClass || assignedGradeName || assignedGrade;
    req.body.section = requestedSection || assignedSection;
  }

  next();
};

router.use(validateTeacherAttendanceAccess);

// 1. GET ATTENDANCE ROSTER FOR CLASS/SECTION/DATE
router.get('/', getAttendanceRoster);

// 2. SAVE OR UPDATE BATCH ATTENDANCE RECORDS
router.post('/', saveAttendanceRoster);

// 3. SUBMIT ATTENDANCE FOR A DATE (finalize)
router.post('/submit', submitAttendanceRoster);

// 4. GET SUBMITTED ATTENDANCE DATES
router.get('/submitted-dates', getSubmittedAttendanceDates);

// 5. GET AGGREGATED STUDENT METRICS REPORT
router.get('/reports/student', getStudentAttendanceReport);

// 4. GET AGGREGATED COHORT CLASS REPORT
router.get('/reports/class', getClassAttendanceReport);

// 5. GET MONTHLY GRID ATTENDANCE HISTORY FOR SINGLE STUDENT
router.get('/calendar', getMonthlyCalendarData);

export default router;
