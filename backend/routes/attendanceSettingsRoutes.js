import express from 'express';
import { 
  getAttendanceSettings, 
  updateAttendanceSettings 
} from '../controllers/attendanceSettingsController.js';
import { restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(restoreTenantContext);
router.use(ensureTenantSqlLoaded);
router.use(auth);

// Require permission for attendance settings
router.use((req, res, next) => {
  const action = req.method === 'GET' ? 'view' : 'edit';
  return checkPermission('employee-attendance', action)(req, res, next);
});

router.get('/', getAttendanceSettings);
router.post('/', updateAttendanceSettings);

export default router;
