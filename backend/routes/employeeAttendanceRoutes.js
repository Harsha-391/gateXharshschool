import express from 'express';
import { 
  scanEmployeeQr, 
  getTodayAttendance, 
  getAttendanceAnalytics, 
  getAttendanceReports,
  regenerateEmployeeQr
} from '../controllers/employeeAttendanceController.js';
import { restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';

const router = express.Router();

// Apply tenant context restoration and SQL preloading middleware
router.use(restoreTenantContext);
router.use(ensureTenantSqlLoaded);

// Routes
router.post('/scan', scanEmployeeQr);
router.get('/today', getTodayAttendance);
router.get('/analytics', getAttendanceAnalytics);
router.get('/reports', getAttendanceReports);
router.post('/regenerate-qr', regenerateEmployeeQr);

export default router;
