import express from 'express';
import { 
  scanEmployeeQr, 
  getTodayAttendance, 
  getAttendanceAnalytics, 
  getAttendanceReports,
  regenerateEmployeeQr,
  deleteAttendanceRecord,
  manualPunchEmployee,
  updateAttendanceRecord
} from '../controllers/employeeAttendanceController.js';
import { restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { qrAttendanceLimiter, attendanceLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply tenant context restoration and SQL preloading middleware
router.use(restoreTenantContext);
router.use(ensureTenantSqlLoaded);
router.use(auth);

// Apply checkPermission based on request method
router.use((req, res, next) => {
  const action = req.method === 'GET' ? 'view' : 'create';
  return checkPermission('employee-attendance', action)(req, res, next);
});

// Routes
router.post('/scan', qrAttendanceLimiter, scanEmployeeQr);
router.get('/today', attendanceLimiter, getTodayAttendance);
router.get('/analytics', attendanceLimiter, getAttendanceAnalytics);
router.get('/reports', attendanceLimiter, getAttendanceReports);
router.post('/regenerate-qr', attendanceLimiter, regenerateEmployeeQr);
router.delete('/record/:id', attendanceLimiter, deleteAttendanceRecord);
router.post('/manual-punch', attendanceLimiter, manualPunchEmployee);
router.put('/record/:id', attendanceLimiter, updateAttendanceRecord);

export default router;
