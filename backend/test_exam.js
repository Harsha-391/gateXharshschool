import { createExam } from './controllers/academicController.js';

const req = {
  body: {
    examName: 'Midterm Test',
    examType: 'Unit Test',
    grade: 'X',
    section: 'A',
    startDate: '2026-06-10',
    endDate: '2026-06-15',
    totalMarks: 100,
    passingMarks: 40,
    status: 'Scheduled'
  }
};

const res = {
  status: function(code) {
    console.log('Status code:', code);
    return this;
  },
  json: function(data) {
    console.log('JSON response:', data);
    return this;
  }
};

try {
  createExam(req, res);
} catch (e) {
  console.error('CRASH ERROR:', e);
}
