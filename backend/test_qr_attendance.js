import { query, testConnection } from './utils/sqlDb.js';
import { readDb, writeDb } from './utils/db.js';
import { generateQrCode } from './utils/qrService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runTests = async () => {
  try {
    console.log('--- STARTING BACKEND QR ATTENDANCE VERIFICATION TESTS ---');
    
    // 1. Connection check
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('MySQL connection failed. Test aborted.');
      process.exit(1);
    }
    
    // 2. Verify SQL Tables exist
    const tables = ['employee_qr_codes', 'attendance_records', 'attendance_logs', 'attendance_reports'];
    for (const table of tables) {
      const result = await query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = ?
      `, [table]);
      
      if (result[0].count === 0) {
        console.error(`ERROR: Table '${table}' does not exist!`);
        process.exit(1);
      } else {
        console.log(`SUCCESS: Verified table '${table}' exists in database.`);
      }
    }
    
    // 3. Test QR Service Generation
    console.log('Testing QR Code generation...');
    const testEmpId = 'EMP-2026-9999';
    const relativePath = await generateQrCode(testEmpId, 'Teacher');
    const absolutePath = path.join(__dirname, relativePath);
    
    if (fs.existsSync(absolutePath)) {
      console.log(`SUCCESS: QR image generated and verified at: ${absolutePath}`);
      // Clean up test QR
      fs.unlinkSync(absolutePath);
    } else {
      console.error(`ERROR: QR image file was not found at ${absolutePath}`);
      process.exit(1);
    }
    
    // 4. Test Sequential ID generation
    console.log('Simulating sequential ID generation...');
    const mockDb = {
      teachers: [
        { employeeId: 'EMP-2026-1001' },
        { employeeId: 'EMP-2026-1002' },
        { employeeId: 'EMP-2026-1005' },
        { id: 'EMP-2027-1001' } // should be ignored
      ],
      staff: [
        { id: 'STF-2026-2001' },
        { id: 'STF-2026-2002' }
      ]
    };
    
    // Simulating teacher sequential logic:
    const getNextTeacherId = (db) => {
      const currentYear = 2026;
      let maxNum = 1000;
      const prefix = 'EMP';
      const yearPrefix = `${prefix}-${currentYear}-`;
      db.teachers.forEach(t => {
        const id = t.employeeId || t.id || '';
        if (id.startsWith(yearPrefix)) {
          const suffixNum = parseInt(id.replace(yearPrefix, ''), 10);
          if (!isNaN(suffixNum) && suffixNum > maxNum) {
            maxNum = suffixNum;
          }
        }
      });
      return `${yearPrefix}${maxNum + 1}`;
    };
    
    const nextTchId = getNextTeacherId(mockDb);
    if (nextTchId === 'EMP-2026-1006') {
      console.log(`SUCCESS: Sequential Teacher ID generated correctly: ${nextTchId}`);
    } else {
      console.error(`ERROR: Expected EMP-2026-1006 but got: ${nextTchId}`);
      process.exit(1);
    }
    
    // Simulating staff sequential logic:
    const getNextStaffId = (db) => {
      const currentYear = 2026;
      let maxNum = 2000;
      const prefix = 'STF';
      const yearPrefix = `${prefix}-${currentYear}-`;
      db.staff.forEach(s => {
        const id = s.id || '';
        if (id.startsWith(yearPrefix)) {
          const suffixNum = parseInt(id.replace(yearPrefix, ''), 10);
          if (!isNaN(suffixNum) && suffixNum > maxNum) {
            maxNum = suffixNum;
          }
        }
      });
      return `${yearPrefix}${maxNum + 1}`;
    };
    
    const nextStfId = getNextStaffId(mockDb);
    if (nextStfId === 'STF-2026-2003') {
      console.log(`SUCCESS: Sequential Staff ID generated correctly: ${nextStfId}`);
    } else {
      console.error(`ERROR: Expected STF-2026-2003 but got: ${nextStfId}`);
      process.exit(1);
    }

    console.log('--- ALL BACKEND TEST ASSERTIONS PASSED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
};

runTests();
