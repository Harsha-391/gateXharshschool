import fs from 'fs';

const filePath = 'C:/Users/uttam rajpurrohit/OneDrive/Desktop/school/backend/controllers/academicController.js';
const code = fs.readFileSync(filePath, 'utf8');
const lines = code.split('\n');

lines.forEach((line, index) => {
  if (line.includes('createExam') || line.includes('updateExam') || line.includes('export const createExam') || line.includes('export const updateExam')) {
    console.log(`${index + 1}: ${line}`);
  }
});
