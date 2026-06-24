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
import { restoreTenantContext } from '../utils/db.js';

const router = express.Router();

// Apply auth to all attendance routes
router.use(auth);
router.use(restoreTenantContext);

// Apply checkPermission based on request method
router.use((req, res, next) => {
  const action = req.method === 'GET' ? 'view' : 'create';
  return checkPermission('attendance', action)(req, res, next);
});

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
