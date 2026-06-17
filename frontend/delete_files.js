import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/RecepLogin.jsx',
  'src/pages/RecepPanel.jsx',
  'src/pages/TeacherLogin.jsx',
  'src/pages/TeacherPanel.jsx'
];

files.forEach(f => {
  const p = path.resolve(f);
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`Successfully deleted ${f}`);
    } else {
      console.log(`${f} does not exist`);
    }
  } catch (err) {
    console.error(`Error deleting ${f}:`, err);
  }
});
