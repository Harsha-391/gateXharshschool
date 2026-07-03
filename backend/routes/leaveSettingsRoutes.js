import express from 'express';
import { 
  getLeaveSettings, 
  updateLeaveSetting,
  deleteLeaveSetting
} from '../controllers/leaveSettingsController.js';
import { restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(restoreTenantContext);
router.use(ensureTenantSqlLoaded);
router.use(auth);

// Require permission for leave settings
router.use((req, res, next) => {
  // DELETE should map to 'edit' or 'delete' permission
  const action = req.method === 'GET' ? 'view' : (req.method === 'DELETE' ? 'delete' : 'edit');
  return checkPermission('leave-settings', action)(req, res, next);
});

router.get('/', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
}, getLeaveSettings);
router.post('/', updateLeaveSetting);
router.delete('/:leaveType', deleteLeaveSetting);

export default router;
