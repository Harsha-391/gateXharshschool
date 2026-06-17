import fs from 'fs';
try {
  const buf = fs.readFileSync('./test.jpg');
  console.log('File size:', buf.length);
  console.log('First 8 bytes:', buf.slice(0, 8).toString('hex').toUpperCase());
  // Cleanup
  fs.unlinkSync('./test.jpg');
} catch (e) {
  console.error(e);
}
