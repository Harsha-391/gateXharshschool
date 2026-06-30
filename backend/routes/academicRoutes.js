import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import { restoreTenantContext } from '../utils/db.js';
import {
  getTimetables,
  createTimetable,
  deleteTimetable,
  getExams,
  createExam,
  updateExam,
  deleteExam,
  generateExamSchedule,
  publishExam,
  getGradesSections,
  getExamTimetables,
  createExamTimetable,
  deleteExamTimetable,
  deleteCohortExamTimetable,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarImports,
  uploadCalendarFile,
  confirmCalendarImport,
  downloadCalendarTemplate,
  exportCalendarEvents,
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getResults,
  createResult,
  deleteResult,
  createResultBulk,
  getOverallResults,
  getTimeslots,
  createTimeslot,
  deleteTimeslot,
  getSubjects,
  createSubject,
  deleteSubject,
  createSubjectBulk,
  createTimetableBulk,
  createTimetableBulkTeacher,
  getTeacherTimetables,
  createExamTimetableBulk,
  createResultStudentBulk,
  deleteStudentExamResults,
  getPublishedEvents,
  publishEvent,
  unpublishEvent,
  submitCohortResults,
  getPublishedTimetables,
  publishTimetable,
  getExamTypes,
  updateExamTypes,
  getEventTypes,
  updateEventTypes,
  getNoticeCategories,
  updateNoticeCategories,
  getHolidayClassifications,
  updateHolidayClassifications
} from '../controllers/academicController.js';


const router = express.Router();

// Apply auth and tenant context restore to all endpoints
router.use(auth);
router.use(restoreTenantContext);

import { checkPermission } from '../middleware/permissionMiddleware.js';

const getPermissionParams = (req) => {
  const path = req.path;
  const method = req.method;
  
  const methodActionMap = {
    'GET': 'view',
    'POST': 'create',
    'PUT': 'edit',
    'PATCH': 'edit',
    'DELETE': 'delete'
  };
  const action = methodActionMap[method] || 'view';

  if (path.startsWith('/timetables')) {
    return { module: 'class-timetable', action };
  }
  if (path.startsWith('/teacher-timetables')) {
    return { module: 'teacher-timetable', action };
  }
  if (path.startsWith('/published-timetables')) {
    return { module: 'published-timetable', action };
  }
  if (path.startsWith('/subjects') || path.startsWith('/timeslots')) {
    return { module: 'academic-manager', action };
  }
  if (path.startsWith('/exams') || path.startsWith('/exam-timetables') || path.startsWith('/grades-sections') || path.startsWith('/exam-types')) {
    return { module: 'exam-timetable', action };
  }
  if (path.startsWith('/events') || path.startsWith('/event-types')) {
    return { module: 'events', action };
  }
  if (path.startsWith('/notices') || path.startsWith('/notice-categories')) {
    return { module: 'notices', action };
  }
  if (path.startsWith('/holidays') || path.startsWith('/holiday-classifications')) {
    return { module: 'holidays', action };
  }
  if (path.startsWith('/results') || path.startsWith('/overall-results') || path.startsWith('/cohort-results')) {
    if (action === 'view') {
      return { module: 'results', action };
    }
    return { module: 'results-manager', action };
  }
  if (path.startsWith('/calendar-events') || path.startsWith('/calendar-imports') || path.startsWith('/calendar-upload') || path.startsWith('/calendar-import-confirm') || path.startsWith('/calendar-template') || path.startsWith('/calendar-export') || path.startsWith('/calendar')) {
    return { module: 'academic-calendar', action };
  }
  
  return null;
};

router.use((req, res, next) => {
  const params = getPermissionParams(req);
  if (!params) return next();
  return checkPermission(params.module, params.action)(req, res, next);
});

// Timetables
router.get('/timetables', getTimetables);
router.post('/timetables', createTimetable);
router.delete('/timetables/:id', deleteTimetable);
router.post('/timetables/bulk', createTimetableBulk);
router.post('/timetables/bulk/teacher', createTimetableBulkTeacher);
router.get('/teacher-timetables', getTeacherTimetables);
router.get('/published-timetables', getPublishedTimetables);
router.post('/published-timetables/publish', publishTimetable);

// Subjects
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.post('/subjects/bulk', createSubjectBulk);
router.delete('/subjects/:id', deleteSubject);

// Timeslots
router.get('/timeslots', getTimeslots);
router.post('/timeslots', createTimeslot);
router.delete('/timeslots', deleteTimeslot);

// Exams
router.get('/exams', getExams);
router.post('/exams', createExam);
router.put('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);
router.post('/exams/generate-schedule', generateExamSchedule);
router.put('/exams/:id/publish', publishExam);
router.get('/exam-types', getExamTypes);
router.put('/exam-types', updateExamTypes);

// Grades & Sections
router.get('/grades-sections', getGradesSections);

// Exam Timetables
router.get('/exam-timetables', getExamTimetables);
router.post('/exam-timetables', createExamTimetable);
router.post('/exam-timetables/bulk', createExamTimetableBulk);
router.delete('/exam-timetables/:id', deleteExamTimetable);
router.delete('/exam-timetables/exam/:examId/cohort/:cohort', deleteCohortExamTimetable);


// Events
router.get('/events', getEvents);
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);
router.get('/event-types', getEventTypes);
router.put('/event-types', updateEventTypes);

// Enhanced Academic Calendar Management System
const upload = multer({ storage: multer.memoryStorage() });

router.get('/calendar-events', getCalendarEvents);
router.post('/calendar-events', createCalendarEvent);
router.put('/calendar-events/:id', updateCalendarEvent);
router.delete('/calendar-events/:id', deleteCalendarEvent);
router.get('/calendar-imports', getCalendarImports);
router.post('/calendar-upload', upload.single('file'), uploadCalendarFile);
router.post('/calendar-import-confirm', confirmCalendarImport);
router.get('/calendar-template', downloadCalendarTemplate);
router.get('/calendar-export', exportCalendarEvents);

// Calendar Publish Endpoints
router.get('/calendar/published', getPublishedEvents);
router.post('/calendar/publish', publishEvent);
router.post('/calendar/unpublish', unpublishEvent);

// Notices
router.get('/notices', getNotices);
router.post('/notices', createNotice);
router.put('/notices/:id', updateNotice);
router.delete('/notices/:id', deleteNotice);
router.get('/notice-categories', getNoticeCategories);
router.put('/notice-categories', updateNoticeCategories);

// Holidays
router.get('/holidays', getHolidays);
router.post('/holidays', createHoliday);
router.put('/holidays/:id', updateHoliday);
router.delete('/holidays/:id', deleteHoliday);
router.get('/holiday-classifications', getHolidayClassifications);
router.put('/holiday-classifications', updateHolidayClassifications);

// Results
router.get('/results', getResults);
router.post('/results', createResult);
router.delete('/results/:id', deleteResult);
router.post('/results/bulk', createResultBulk);
router.get('/results/overall', getOverallResults);
router.post('/results/student-bulk', createResultStudentBulk);
router.delete('/results/student/:studentId/exam/:examId', deleteStudentExamResults);
router.post('/results/submit-cohort', submitCohortResults);

export default router;
// Trigger nodemon restart
