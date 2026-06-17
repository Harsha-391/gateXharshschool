import fs from 'fs';
import path from 'path';

const filePath = 'C:/Users/uttam rajpurrohit/OneDrive/Desktop/school/backend/controllers/academicController.js';
const code = fs.readFileSync(filePath, 'utf8');
const lines = code.split('\n');

lines.forEach((line, index) => {
  if (line.includes('getExamTimetables') || line.includes('createExamTimetable') || line.includes('deleteExamTimetable')) {
    console.log(`${index + 1}: ${line}`);
  }
});
