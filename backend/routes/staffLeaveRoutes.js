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
} from '../controllers/staffLeaveController.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { restoreTenantContext } from '../utils/db.js';

const router = express.Router();

// Apply auth & tenant context globally to all routes
router.use(auth);
router.use(restoreTenantContext);

// Staff-scoped routes
router.get('/', checkPermission('staff-leave', 'view'), getMyLeaves);
router.post('/', checkPermission('staff-leave', 'create'), applyLeave);
router.put('/:id', checkPermission('staff-leave', 'edit'), editLeave);
router.delete('/:id', checkPermission('staff-leave', 'delete'), cancelLeave);

// Admin-scoped routes
router.get('/admin', checkPermission('staff-leave-management', 'view'), adminGetLeaves);
router.post('/:id/approve', checkPermission('staff-leave-management', 'approve'), adminApproveLeave);
router.post('/:id/reject', checkPermission('staff-leave-management', 'approve'), adminRejectLeave);
router.delete('/:id/admin', checkPermission('staff-leave-management', 'delete'), deleteLeave);

export default router;
