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

const router = express.Router();

// Apply auth & tenant context globally to all routes
router.use(auth);
router.use(restoreTenantContext);

// Teacher-scoped routes
router.get('/', checkPermission('teacher-leave', 'view'), getMyLeaves);
router.post('/', checkPermission('teacher-leave', 'create'), applyLeave);
router.put('/:id', checkPermission('teacher-leave', 'edit'), editLeave);
router.delete('/:id', checkPermission('teacher-leave', 'delete'), cancelLeave);

// Admin-scoped routes
router.get('/admin', checkPermission('teacher-leave-management', 'view'), adminGetLeaves);
router.post('/:id/approve', checkPermission('teacher-leave-management', 'approve'), adminApproveLeave);
router.post('/:id/reject', checkPermission('teacher-leave-management', 'approve'), adminRejectLeave);
router.delete('/:id/admin', checkPermission('teacher-leave-management', 'delete'), deleteLeave);

export default router;
