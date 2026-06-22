import express from 'express';
import { 
  scanEmployeeQr, 
  getTodayAttendance, 
  getAttendanceAnalytics, 
  getAttendanceReports,
  regenerateEmployeeQr
} from '../controllers/employeeAttendanceController.js';
import { restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

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
router.post('/scan', scanEmployeeQr);
router.get('/today', getTodayAttendance);
router.get('/analytics', getAttendanceAnalytics);
router.get('/reports', getAttendanceReports);
router.post('/regenerate-qr', regenerateEmployeeQr);

export default router;
