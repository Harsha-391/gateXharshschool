import express from 'express';
import {
  getGradeSubjectTeachersHandler,
  getDiagnosticsHandler,
  getSubjectSettingsHandler,
  saveSubjectSettingsHandler,
  aiRulesHandler,
  generateDraftHandler,
  validateMoveHandler,
  saveTimetableHandler,
  getClassViewHandler,
  getTeacherViewHandler
} from '../controllers/classTimetableController.js';
import { restoreTenantContext, ensureTenantSqlLoaded } from '../utils/db.js';

const router = express.Router();

// Middleware to ensure tenant context is established
router.use(restoreTenantContext);
router.use(ensureTenantSqlLoaded);

// 1. Diagnostics & Mappings
router.get('/grade-subject-teachers', getGradeSubjectTeachersHandler);
router.get('/diagnostics', getDiagnosticsHandler);

// 2. Settings per Subject (periods per week, double period)
router.get('/subject-settings', getSubjectSettingsHandler);
router.post('/subject-settings', saveSubjectSettingsHandler);

// 3. AI Assistant Rules (optional text-to-rules)
router.post('/ai/rules', aiRulesHandler);

// 4. In-memory Timetable Generation (draft without saving)
router.post('/generate', generateDraftHandler);

// 5. Swap / Move Live Validation (checks hard rules)
router.post('/validate-move', validateMoveHandler);

// 6. Save Timetable (Server re-validates all hard rules and writes in one transaction)
router.post('/save', saveTimetableHandler);

// 7. Class and Teacher Views
router.get('/class-view', getClassViewHandler);
router.get('/teacher-view', getTeacherViewHandler);

export default router;
