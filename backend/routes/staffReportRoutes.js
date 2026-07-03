import express from 'express';
import {
  submitReport,
  getMyReports,
  editReport,
  deleteReport,
  adminGetReports,
  adminReviewReport,
  adminDeleteReport
} from '../controllers/staffReportController.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { restoreTenantContext } from '../utils/db.js';

const router = express.Router();

router.use(auth);
router.use(restoreTenantContext);

// Staff-scoped routes
router.get('/', getMyReports);
router.post('/', submitReport);
router.put('/:id', editReport);
router.delete('/:id', deleteReport);

// Admin-scoped routes
router.get('/admin', adminGetReports);
router.post('/:id/review', adminReviewReport);
router.delete('/:id/admin', adminDeleteReport);

export default router;
