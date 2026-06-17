import { readDb, writeDb, addActivity } from '../utils/db.js';
import { generateQrCode } from '../utils/qrService.js';

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

// Helper: Get formatted current time in "HH:MM AM/PM"
const getCurrentFormattedTime = (dateObj = new Date()) => {
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  const hoursStr = hours < 10 ? '0' + hours : hours;
  return `${hoursStr}:${minutesStr} ${ampm}`;
};

/**
 * 1. PROCESS QR CODE SCAN
 * POST /api/attendance/scan
 */
export const scanEmployeeQr = async (req, res) => {
  try {
    const { employeeId, employeeType } = req.body;
    if (!employeeId || !employeeType) {
      return res.status(400).json({ error: 'Employee ID and Employee Type are required in the payload.' });
    }

    const db = readDb();
    
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

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const nowTimeStr = getCurrentFormattedTime(); // HH:MM AM/PM
    const timestamp = new Date().toISOString();

    if (!db.attendanceRecords) db.attendanceRecords = [];
    if (!db.attendanceLogs) db.attendanceLogs = [];

    // Find if employee already checked in today
    const recordIndex = db.attendanceRecords.findIndex(r => r.employeeId === employeeId && r.date === todayStr);

    let statusMsg = '';
    let record = null;

    if (recordIndex === -1) {
      // ----------------------------------------------------
      // CASE 1: CHECK-IN
      // ----------------------------------------------------
      
      // Rule: Before 9:00 AM = Present, After 9:00 AM = Late
      const checkInMinutes = parseTimeToMinutes(nowTimeStr);
      const cutoffMinutes = 9 * 60; // 9:00 AM -> 540 minutes
      const attendanceStatus = checkInMinutes <= cutoffMinutes ? 'Present' : 'Late';

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

      statusMsg = attendanceStatus === 'Present' ? 'Checked In successfully (Present)' : 'Checked In successfully (Late Arrival)';
      
    } else {
      // ----------------------------------------------------
      // CASE 2: CHECK-OUT OR DUPLICATE WARN
      // ----------------------------------------------------
      const existingRecord = db.attendanceRecords[recordIndex];

      if (existingRecord.checkOut) {
        // Prevent duplicate check-ins/scans once day is complete
        return res.status(400).json({ 
          error: 'Attendance completed.',
          message: 'Check-out has already been recorded for this employee today.',
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

      // Record check-out
      const checkInMin = parseTimeToMinutes(existingRecord.checkIn);
      const checkOutMin = parseTimeToMinutes(nowTimeStr);
      const diffMin = checkOutMin - checkInMin;

      // Handle negative minutes in case of crossing midnight (not expected, but safe fallback)
      const totalMinutes = diffMin < 0 ? 0 : diffMin;
      const hoursDecimal = parseFloat((totalMinutes / 60).toFixed(2));

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
    const todayStr = new Date().toISOString().split('T')[0];
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
    const todayStr = new Date().toISOString().split('T')[0];
    
    const records = db.attendanceRecords || [];
    const teachersList = db.teachers || [];
    const staffList = db.staff || [];
    const totalEmployeesCount = teachersList.length + staffList.length;

    // Filter for today's records
    const todayRecords = records.filter(r => r.date === todayStr);
    const checkedInCount = todayRecords.length;
    const checkedOutCount = todayRecords.filter(r => r.checkOut !== null && r.checkOut !== '').length;
    const lateCount = todayRecords.filter(r => r.status === 'Late').length;
    const presentCount = checkedInCount - lateCount;
    
    // Absent count
    const absentCount = Math.max(0, totalEmployeesCount - checkedInCount);

    // Department-wise stats
    const deptStats = {};
    todayRecords.forEach(r => {
      const dept = r.department || 'Other';
      if (!deptStats[dept]) {
        deptStats[dept] = { present: 0, late: 0, absent: 0, total: 0 };
      }
      if (r.status === 'Late') {
        deptStats[dept].late++;
      } else {
        deptStats[dept].present++;
      }
    });

    // Populate total counts per department from registry
    teachersList.forEach(t => {
      const dept = t.department || 'Other';
      if (!deptStats[dept]) deptStats[dept] = { present: 0, late: 0, absent: 0, total: 0 };
      deptStats[dept].total++;
    });
    staffList.forEach(s => {
      const dept = s.department || 'Other';
      if (!deptStats[dept]) deptStats[dept] = { present: 0, late: 0, absent: 0, total: 0 };
      deptStats[dept].total++;
    });

    // Calculate absent counts for departments
    Object.keys(deptStats).forEach(dept => {
      const activeInDept = deptStats[dept].present + deptStats[dept].late;
      deptStats[dept].absent = Math.max(0, deptStats[dept].total - activeInDept);
    });

    // Teacher vs Staff summaries
    const teacherRecords = todayRecords.filter(r => r.employeeType === 'Teacher');
    const staffRecords = todayRecords.filter(r => r.employeeType === 'Staff');

    const teacherSummary = {
      total: teachersList.length,
      present: teacherRecords.filter(r => r.status === 'Present').length,
      late: teacherRecords.filter(r => r.status === 'Late').length,
      absent: Math.max(0, teachersList.length - teacherRecords.length)
    };

    const staffSummary = {
      total: staffList.length,
      present: staffRecords.filter(r => r.status === 'Present').length,
      late: staffRecords.filter(r => r.status === 'Late').length,
      absent: Math.max(0, staffList.length - staffRecords.length)
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
        absent: Math.max(0, totalEmployeesCount - dayRecords.length)
      });
    }

    res.json({
      totalEmployees: totalEmployeesCount,
      presentToday: presentCount,
      absentToday: absentCount,
      lateToday: lateCount,
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
    
    // Filter by ID
    if (employeeId && employeeId.trim() !== '') {
      records = records.filter(r => r.employeeId.toLowerCase().includes(employeeId.toLowerCase()));
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
