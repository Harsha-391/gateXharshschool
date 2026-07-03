import express from 'express';
import { 
  applyLeave, 
  getMyLeaves, 
  editLeave, 
  cancelLeave, 
  adminGetLeaves, 
  adminApproveLeave, 
  adminRejectLeave, 
  deleteLeave 
} from '../controllers/teacherLeaveController.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { restoreTenantContext } from '../utils/db.js';
import * as sqlDb from '../utils/sqlDb.js';

const router = express.Router();

// Apply auth & tenant context globally to all routes
router.use(auth);
router.use(restoreTenantContext);

// Public: Get active Teacher leave policies (no admin permission needed)
router.get('/policies', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    const policies = await sqlDb.query(
      "SELECT * FROM leave_settings WHERE tenantId = ? AND employeeType = 'Teacher' AND status = 'Active'",
      [tenantId]
    );
    res.json(policies || []);
  } catch (err) {
    console.error('[Teacher Leave Policies Error]', err);
    res.status(500).json({ error: 'Failed to load leave policies.' });
  }
});

// Teacher-scoped routes
router.get('/', getMyLeaves);
router.post('/', applyLeave);
router.put('/:id', editLeave);
router.delete('/:id', cancelLeave);

// Admin-scoped routes
router.get('/admin', checkPermission('teacher-leave-management', 'view'), adminGetLeaves);
router.post('/:id/approve', checkPermission('teacher-leave-management', 'approve'), adminApproveLeave);
router.post('/:id/reject', checkPermission('teacher-leave-management', 'approve'), adminRejectLeave);
router.delete('/:id/admin', checkPermission('teacher-leave-management', 'delete'), deleteLeave);

export default router;
