import { readDb, writeDb, addActivity } from '../utils/db.js';
import { generateQrCode } from '../utils/qrService.js';
import crypto from 'crypto';
import { logAudit, logSecurity } from '../utils/logger.js';

// Helper: Convert time string "HH:MM AM/PM" to minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!parts) return 0;
  let hours = parseInt(parts[1], 10);
  const minutes = parseInt(parts[2], 10);
  const modifier = parts[3].toUpperCase();

  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Helper: Get formatted current time in "HH:MM AM/PM" (Asia/Kolkata timezone)
const getCurrentFormattedTime = (dateObj = new Date()) => {
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return timeStr.toUpperCase();
};

/**
 * 1. PROCESS QR CODE SCAN
 * POST /api/attendance/scan
 */
export const scanEmployeeQr = async (req, res) => {
  try {
    const { employeeId, employeeType, sig } = req.body;
    if (!employeeId || !employeeType) {
      return res.status(400).json({ error: 'Employee ID and Employee Type are required in the payload.' });
    }

    const db = readDb();

    // QR Code signature verification
    const secret = process.env.JWT_SECRET || 'aether-erp-dashboard-super-secure-key-2026';
    const dataToSign = `${employeeId}:${employeeType}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

    if (!sig || sig !== expectedSig) {
      logSecurity('BAD_QR_SIGNATURE', `Employee ID: ${employeeId || 'Unknown'} (${employeeType || 'Unknown'}) - Spoofed or invalid signature`, req);
      if (!db.attendanceLogs) db.attendanceLogs = [];
      db.attendanceLogs.push({
        id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        employeeId: employeeId || 'Unknown',
        employeeType: employeeType || 'Unknown',
        scanTime: getCurrentFormattedTime(new Date()),
        scanType: 'Verification-Failure',
        status: 'Rejected',
        reason: !sig ? 'Signature missing' : 'Signature mismatch / spoofing detected',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      writeDb(db);
      return res.status(401).json({ error: 'Invalid QR Code signature. Spoofing or tampering detected.' });
    }
    
    // 1. Fetch employee details from DB
    let employee = null;
    if (employeeType === 'Teacher') {
      employee = db.teachers.find(t => t.employeeId === employeeId || t.id === employeeId);
    } else if (employeeType === 'Staff') {
      employee = db.staff.find(s => s.id === employeeId);
    }

    if (!employee) {
      return res.status(404).json({ error: `Employee profile not found for ID: ${employeeId} (${employeeType}).` });
    }

    // Server-side current date, time, and timestamp (Asia/Kolkata timezone)
    const nowServer = new Date();
    const todayStr = nowServer.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
    const nowTimeStr = getCurrentFormattedTime(nowServer); // HH:MM AM/PM
    const timestamp = nowServer.toISOString();

    if (!db.attendanceRecords) db.attendanceRecords = [];
    if (!db.attendanceLogs) db.attendanceLogs = [];

    // Load Attendance Settings
    const settings = (db.attendanceSettings && db.attendanceSettings[0]) || {
      checkInStart: '08:00 AM',
      lateTime: '09:00 AM',
      halfDayTime: '11:00 AM',
      checkOutTime: '05:00 PM',
      minWorkingHours: 8.00,
      gracePeriod: 15
    };

    // Find today's attendance record
    const recordIndex = db.attendanceRecords.findIndex(r => r.employeeId === employeeId && r.date === todayStr);

    let statusMsg = '';
    let record = null;

    if (recordIndex === -1) {
      // ----------------------------------------------------
      // CASE 1: CHECK-IN (First scan of the day)
      // ----------------------------------------------------
      const checkInMinutes = parseTimeToMinutes(nowTimeStr);
      const lateTimeMinutes = parseTimeToMinutes(settings.lateTime) + (settings.gracePeriod || 0);
      const halfDayTimeMinutes = parseTimeToMinutes(settings.halfDayTime);

      let attendanceStatus = 'Present';
      if (checkInMinutes > halfDayTimeMinutes) {
        attendanceStatus = 'Half Day';
      } else if (checkInMinutes > lateTimeMinutes) {
        attendanceStatus = 'Late';
      }

      record = {
        id: `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        employeeId,
        employeeType,
        name: employee.fullName || employee.name,
        department: employee.department || 'N/A',
        designation: employee.designation || employee.role || 'N/A',
        date: todayStr,
        checkIn: nowTimeStr,
        checkOut: null,
        workingHours: 0.00,
        status: attendanceStatus,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      db.attendanceRecords.push(record);

      // Add audit log
      db.attendanceLogs.push({
        id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        employeeId,
        employeeType,
        scanTime: nowTimeStr,
        scanType: 'Check-In',
        status: attendanceStatus
      });

      statusMsg = `Checked In successfully as ${attendanceStatus}`;
      
    } else {
      // ----------------------------------------------------
      // CASE 2: CHECK-OUT OR COOLDOWN/COMPLETED WARNINGS
      // ----------------------------------------------------
      const existingRecord = db.attendanceRecords[recordIndex];

      if (existingRecord.checkOut) {
        // Attendance completed for today
        return res.status(400).json({ 
          error: 'Attendance already completed for today.',
          message: 'Attendance already completed for today.',
          alreadyRecorded: true,
          employeeDetails: {
            photo: employee.photo || '',
            name: employee.fullName || employee.name,
            employeeId,
            designation: employee.designation || employee.role || 'N/A',
            date: todayStr,
            checkIn: existingRecord.checkIn,
            checkOut: existingRecord.checkOut,
            workingHours: existingRecord.workingHours,
            status: existingRecord.status
          }
        });
      }

      // Check scan interval (cooldown of 1 minute)
      const checkInTimeMs = new Date(existingRecord.createdAt).getTime();
      const elapsedMs = nowServer.getTime() - checkInTimeMs;
      const elapsedMinutes = elapsedMs / (1000 * 60);

      if (elapsedMinutes < 1.0) {
        // Less than 1 minute since check-in: return error warning
        return res.status(400).json({
          error: 'Attendance already marked. Please scan after 1 minute for Check-Out.',
          message: 'Attendance already marked. Please scan after 1 minute for Check-Out.',
          employeeDetails: {
            photo: employee.photo || '',
            name: employee.fullName || employee.name,
            employeeId,
            designation: employee.designation || employee.role || 'N/A',
            date: todayStr,
            time: existingRecord.checkIn,
            status: existingRecord.status,
            checkIn: existingRecord.checkIn,
            checkOut: '—',
            workingHours: 0
          }
        });
      }

      // Record check-out (after 1 minute)
      const checkInMin = parseTimeToMinutes(existingRecord.checkIn);
      const checkOutMin = parseTimeToMinutes(nowTimeStr);
      let diffMin = checkOutMin - checkInMin;
      if (diffMin < 0) diffMin = 0;
      const hoursDecimal = parseFloat((diffMin / 60).toFixed(2));

      existingRecord.checkOut = nowTimeStr;
      existingRecord.workingHours = hoursDecimal;
      existingRecord.updatedAt = timestamp;

      // Add check-out log
      db.attendanceLogs.push({
        id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        employeeId,
        employeeType,
        scanTime: nowTimeStr,
        scanType: 'Check-Out',
        status: existingRecord.status
      });

      record = existingRecord;
      statusMsg = `Checked Out successfully. Working Hours: ${hoursDecimal} hrs`;
    }

    // Write database and trigger sync
    writeDb(db);
    logAudit('Employee Attendance Scan', `Employee: ${employee.fullName || employee.name} (${employeeType})`, `Action: ${record.checkOut ? 'Check-Out' : 'Check-In'}, Status: ${record.status}`, req);

    res.json({
      success: true,
      message: statusMsg,
      scanType: record.checkOut ? 'Check-Out' : 'Check-In',
      employeeDetails: {
        photo: employee.photo || '',
        name: employee.fullName || employee.name,
        employeeId,
        designation: employee.designation || employee.role || 'N/A',
        date: todayStr,
        time: nowTimeStr,
        status: record.status,
        checkIn: record.checkIn,
        checkOut: record.checkOut || '—',
        workingHours: record.workingHours || 0
      }
    });

  } catch (error) {
    console.error('[Employee Attendance Scan Error]', error);
    res.status(500).json({ error: 'Server error processing attendance scan.' });
  }
};

/**
 * 2. GET TODAY'S ATTENDANCE
 * GET /api/attendance/today
 */
export const getTodayAttendance = (req, res) => {
  try {
    const db = readDb();
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const records = (db.attendanceRecords || []).filter(r => r.date === todayStr);

    res.json(records);
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    res.status(500).json({ error: 'Server error loading today\'s attendance roster.' });
  }
};

/**
 * 3. GET ATTENDANCE ANALYTICS
 * GET /api/attendance/analytics
 */
export const getAttendanceAnalytics = (req, res) => {
  try {
    const db = readDb();
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    
    const records = db.attendanceRecords || [];
    const teachersList = db.teachers || [];
    const staffList = db.staff || [];
    const totalEmployeesCount = teachersList.length + staffList.length;

    // Filter for today's records
    const todayRecords = records.filter(r => r.date === todayStr);
    const checkedInCount = todayRecords.length;
    const checkedOutCount = todayRecords.filter(r => r.checkOut !== null && r.checkOut !== '').length;
    
    const presentCount = todayRecords.filter(r => r.status === 'Present').length;
    const lateCount = todayRecords.filter(r => r.status === 'Late').length;
    const halfDayCount = todayRecords.filter(r => r.status === 'Half Day').length;
    
    // Absent count
    const absentCount = Math.max(0, totalEmployeesCount - checkedInCount);

    // Department-wise stats
    const deptStats = {};
    todayRecords.forEach(r => {
      const dept = r.department || 'Other';
      if (!deptStats[dept]) {
        deptStats[dept] = { present: 0, late: 0, halfDay: 0, absent: 0, total: 0 };
      }
      if (r.status === 'Late') {
        deptStats[dept].late++;
      } else if (r.status === 'Half Day') {
        deptStats[dept].halfDay++;
      } else {
        deptStats[dept].present++;
      }
    });

    // Populate total counts per department from registry
    teachersList.forEach(t => {
      const dept = t.department || 'Other';
      if (!deptStats[dept]) deptStats[dept] = { present: 0, late: 0, halfDay: 0, absent: 0, total: 0 };
      deptStats[dept].total++;
    });
    staffList.forEach(s => {
      const dept = s.department || 'Other';
      if (!deptStats[dept]) deptStats[dept] = { present: 0, late: 0, halfDay: 0, absent: 0, total: 0 };
      deptStats[dept].total++;
    });

    // Calculate absent counts for departments
    Object.keys(deptStats).forEach(dept => {
      const activeInDept = (deptStats[dept].present || 0) + (deptStats[dept].late || 0) + (deptStats[dept].halfDay || 0);
      deptStats[dept].absent = Math.max(0, deptStats[dept].total - activeInDept);
    });

    // Teacher vs Staff summaries
    const teacherRecords = todayRecords.filter(r => r.employeeType === 'Teacher');
    const staffRecords = todayRecords.filter(r => r.employeeType === 'Staff');

    const teacherSummary = {
      total: teachersList.length,
      present: teacherRecords.filter(r => r.status === 'Present').length,
      late: teacherRecords.filter(r => r.status === 'Late').length,
      halfDay: teacherRecords.filter(r => r.status === 'Half Day').length,
      absent: Math.max(0, teachersList.length - teacherRecords.length),
      checkOuts: teacherRecords.filter(r => r.checkOut !== null && r.checkOut !== '').length
    };

    const staffSummary = {
      total: staffList.length,
      present: staffRecords.filter(r => r.status === 'Present').length,
      late: staffRecords.filter(r => r.status === 'Late').length,
      halfDay: staffRecords.filter(r => r.status === 'Half Day').length,
      absent: Math.max(0, staffList.length - staffRecords.length),
      checkOuts: staffRecords.filter(r => r.checkOut !== null && r.checkOut !== '').length
    };

    // Calculate last 7 days trends
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = records.filter(r => r.date === dateStr);
      
      trendData.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        present: dayRecords.filter(r => r.status === 'Present').length,
        late: dayRecords.filter(r => r.status === 'Late').length,
        halfDay: dayRecords.filter(r => r.status === 'Half Day').length,
        absent: Math.max(0, totalEmployeesCount - dayRecords.length)
      });
    }

    res.json({
      totalEmployees: totalEmployeesCount,
      presentToday: presentCount,
      absentToday: absentCount,
      lateToday: lateCount,
      halfDayToday: halfDayCount,
      checkInsToday: checkedInCount,
      checkOutsToday: checkedOutCount,
      departmentStats: deptStats,
      teacherSummary,
      staffSummary,
      trends: trendData
    });
  } catch (error) {
    console.error('Error compiling attendance analytics:', error);
    res.status(500).json({ error: 'Server error compilating analytics.' });
  }
};

/**
 * 4. GET FILTERED REPORTS
 * GET /api/attendance/reports
 */
export const getAttendanceReports = (req, res) => {
  try {
    const { employeeId, department, designation, employeeType, startDate, endDate, month, year } = req.query;
    
    const db = readDb();
    let records = [...(db.attendanceRecords || [])];

    // Filter by type
    if (employeeType && employeeType !== 'All') {
      records = records.filter(r => r.employeeType === employeeType);
    }
    
    // Filter by starting characters of Name or ID
    if (employeeId && employeeId.trim() !== '') {
      const searchLower = employeeId.toLowerCase();
      records = records.filter(r => 
        r.name.toLowerCase().startsWith(searchLower) ||
        r.employeeId.toLowerCase().startsWith(searchLower)
      );
    }

    // Filter by department
    if (department && department !== 'All') {
      records = records.filter(r => r.department === department);
    }

    // Filter by designation
    if (designation && designation !== 'All') {
      records = records.filter(r => r.designation.toLowerCase().includes(designation.toLowerCase()));
    }

    // Filter by month/year
    if (month && month !== 'All' && year && year !== 'All') {
      const monthStr = parseInt(month) < 10 ? `0${parseInt(month)}` : `${month}`;
      const prefix = `${year}-${monthStr}`;
      records = records.filter(r => r.date.startsWith(prefix));
    } else if (year && year !== 'All') {
      records = records.filter(r => r.date.startsWith(`${year}-`));
    }

    // Filter by date range
    if (startDate && endDate) {
      records = records.filter(r => r.date >= startDate && r.date <= endDate);
    }

    // Sort by date desc
    records.sort((a, b) => b.date.localeCompare(a.date));

    res.json(records);
  } catch (error) {
    console.error('Error loading attendance reports:', error);
    res.status(500).json({ error: 'Server error loading attendance reports.' });
  }
};

/**
 * 5. REGENERATE QR CODE
 * POST /api/qr-code/regenerate
 */
export const regenerateEmployeeQr = async (req, res) => {
  try {
    const { employeeId, employeeType } = req.body;
    if (!employeeId || !employeeType) {
      return res.status(400).json({ error: 'Employee ID and Employee Type are required.' });
    }

    const db = readDb();

    // Verify employee exists
    let employee = null;
    if (employeeType === 'Teacher') {
      employee = db.teachers.find(t => t.employeeId === employeeId || t.id === employeeId);
    } else if (employeeType === 'Staff') {
      employee = db.staff.find(s => s.id === employeeId);
    }

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Generate new QR code file
    const qrPath = await generateQrCode(employeeId, employeeType);

    // Save in DB
    if (!db.employeeQrCodes) db.employeeQrCodes = [];
    const qrIndex = db.employeeQrCodes.findIndex(q => q.employeeId === employeeId);

    if (qrIndex > -1) {
      db.employeeQrCodes[qrIndex].qrPath = qrPath;
      db.employeeQrCodes[qrIndex].updatedAt = new Date().toISOString();
    } else {
      db.employeeQrCodes.push({
        id: `QR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        employeeId,
        employeeType,
        qrPath,
        createdAt: new Date().toISOString()
      });
    }

    // Update path on employee profile directly for quick load
    if (employeeType === 'Teacher') {
      const idx = db.teachers.findIndex(t => t.employeeId === employeeId || t.id === employeeId);
      if (idx > -1) db.teachers[idx].qrCodePath = qrPath;
    } else {
      const idx = db.staff.findIndex(s => s.id === employeeId);
      if (idx > -1) db.staff[idx].qrCodePath = qrPath;
    }

    writeDb(db);

    res.json({ success: true, qrPath });
  } catch (error) {
    console.error('Error regenerating QR Code:', error);
    res.status(500).json({ error: 'Server error regenerating QR code.' });
  }
};

/**
 * 6. DELETE ATTENDANCE RECORD
 * DELETE /api/employee-attendance/record/:id
 */
export const deleteAttendanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    
    if (!db.attendanceRecords) db.attendanceRecords = [];
    const index = db.attendanceRecords.findIndex(r => r.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Attendance record not found.' });
    }
    
    // Remove the record
    db.attendanceRecords.splice(index, 1);
    writeDb(db);
    
    res.json({ message: 'Attendance record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ error: 'Server error deleting attendance record.' });
  }
};
