import express from 'express';
import { auth } from '../middleware/auth.js';
import { restoreTenantContext } from '../utils/db.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry
} from '../controllers/auxiliaryIncomeController.js';

const router = express.Router();

// Apply auth and tenant context restore to all endpoints
router.use(auth);
router.use(restoreTenantContext);

// Category CRUD
router.get('/categories', checkPermission('auxiliary-income', 'view'), getCategories);
router.post('/categories', checkPermission('auxiliary-income', 'create'), createCategory);
router.put('/categories/:id', checkPermission('auxiliary-income', 'edit'), updateCategory);
router.delete('/categories/:id', checkPermission('auxiliary-income', 'delete'), deleteCategory);

// Entry CRUD
router.get('/entries', checkPermission('auxiliary-income', 'view'), getEntries);
router.post('/entries', checkPermission('auxiliary-income', 'create'), createEntry);
router.put('/entries/:id', checkPermission('auxiliary-income', 'edit'), updateEntry);
router.delete('/entries/:id', checkPermission('auxiliary-income', 'delete'), deleteEntry);

export default router;
