import express from 'express';
import multer from 'multer';
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
  publishTimetable
} from '../controllers/academicController.js';


const router = express.Router();

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

// Holidays
router.get('/holidays', getHolidays);
router.post('/holidays', createHoliday);
router.put('/holidays/:id', updateHoliday);
router.delete('/holidays/:id', deleteHoliday);

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
