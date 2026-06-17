import { readDb, writeDb, addActivity } from '../utils/db.js';

// 1. GET ATTENDANCE ROSTER FOR GIVEN DATE, CLASS, SECTION
export const getAttendanceRoster = (req, res) => {
  try {
    const { date, studentClass, section, search } = req.query;

    if (!date || !studentClass || !section) {
      return res.status(400).json({ error: 'Date, Class, and Section are required filters.' });
    }

    const db = readDb();
    
    // Filter students by class & section (only Active students)
    let filteredStudents = db.students.filter(stu => {
      if (stu.status !== 'Active') return false;
      const matchClass = stu.studentClass === studentClass || stu.grade?.split('-')[0] === studentClass;
      const matchSec = stu.section === section || stu.grade?.split('-')[1] === section;
      return matchClass && matchSec;
    });

    // Apply search filter if present
    if (search && search.trim() !== '') {
      const query = search.toLowerCase();
      filteredStudents = filteredStudents.filter(stu => 
        stu.name.toLowerCase().includes(query) || 
        stu.fullName.toLowerCase().includes(query) ||
        stu.admissionNumber.toLowerCase().includes(query) ||
        (stu.rollNumber && stu.rollNumber.toString().includes(query))
      );
    }

    // Map existing attendance for this date
    const attendanceRecords = db.attendance || [];
    let dateRecords = attendanceRecords.filter(att => att.attendanceDate === date);

    // Filter by submitted status if requested
    if (req.query.submitted !== undefined) {
      const isSubmitted = req.query.submitted === 'true';
      dateRecords = dateRecords.filter(att => att.submitted === isSubmitted);
    }

    const roster = filteredStudents.map(stu => {
      const existing = dateRecords.find(att => att.studentId === stu.id);
      return {
        id: stu.id,
        rollNumber: stu.rollNumber || stu.roll || 'N/A',
        admissionNumber: stu.admissionNumber,
        fullName: stu.fullName || stu.name,
        photo: stu.photo || '',
        photoBg: stu.photoBg || '',
        studentClass: stu.studentClass || studentClass,
        section: stu.section || section,
        attendanceStatus: existing ? existing.attendanceStatus : '',
        remarks: existing ? existing.remarks : '',
        attendanceId: existing ? existing.attendanceId : null,
        submitted: existing ? existing.submitted || false : false
      };
    });

    res.json(roster);
  } catch (err) {
    console.error('Error fetching attendance roster:', err);
    res.status(500).json({ error: 'Server error loading roster.' });
  }
};

// 2. SAVE OR UPDATE ATTENDANCE ROSTER
export const saveAttendanceRoster = (req, res) => {
  try {
    const { date, records, markedBy, studentClass, section } = req.body;

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid payload. Date and records roster list are required.' });
    }

    const db = readDb();
    if (!db.attendance) db.attendance = [];

    let updatedCount = 0;
    let createdCount = 0;
    const now = new Date().toISOString();

    records.forEach(rec => {
      const { studentId, status, remarks } = rec;
      if (!studentId || !status) return;

      // Find if entry already exists for student on this date
      const existingIndex = db.attendance.findIndex(att => 
        att.studentId === studentId && 
        att.attendanceDate === date
      );

      if (existingIndex > -1) {
        // Update existing record
        db.attendance[existingIndex] = {
          ...db.attendance[existingIndex],
          attendanceStatus: status,
          remarks: remarks || '',
          markedBy: markedBy || 'Teacher',
          updatedAt: now
        };
        updatedCount++;
      } else {
        // Find student details to copy class & section
        const stu = db.students.find(s => s.id === studentId);
        
        // Create new record
        const newRecord = {
          attendanceId: `ATT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          studentId,
          classId: stu?.studentClass || studentClass || 'Unknown',
          sectionId: stu?.section || section || 'Unknown',
          attendanceDate: date,
          attendanceStatus: status,
          remarks: remarks || '',
          markedBy: markedBy || 'Teacher',
          submitted: false,
          createdAt: now,
          updatedAt: now
        };
        db.attendance.push(newRecord);
        createdCount++;
      }
    });

    // Log Activity
    const classSecLabel = studentClass && section ? `Grade ${studentClass}-${section}` : 'roster';
    addActivity(
      db, 
      'registration', 
      'Attendance Roster Saved', 
      `Saved ${records.length} records for ${classSecLabel} on ${date}`, 
      'hsl(var(--color-secondary))', 
      'rgba(hsl(var(--color-secondary)), 0.1)'
    );

    writeDb(db);
    res.json({ 
      success: true, 
      message: `Attendance marked successfully. Created: ${createdCount}, Updated: ${updatedCount}.` 
    });
  } catch (err) {
    console.error('Error saving attendance roster:', err);
    res.status(500).json({ error: 'Server error saving records.' });
  }
};

// 3. STUDENT REPORT
export const getStudentAttendanceReport = (req, res) => {
  try {
    const { studentClass, section, search } = req.query;

    const db = readDb();
    let filteredStudents = (db.students || []).filter(stu => stu.status === 'Active');

    // Filters
    if (studentClass && studentClass !== 'All') {
      filteredStudents = filteredStudents.filter(stu => stu.studentClass === studentClass || (stu.grade && stu.grade.split('-')[0] === studentClass));
    }
    if (section && section !== 'All') {
      filteredStudents = filteredStudents.filter(stu => stu.section === section || stu.grade?.endsWith(section));
    }
    if (search && search.trim() !== '') {
      const query = search.toLowerCase();
      filteredStudents = filteredStudents.filter(stu => 
        stu.name.toLowerCase().includes(query) || 
        stu.fullName.toLowerCase().includes(query) ||
        stu.admissionNumber.toLowerCase().includes(query)
      );
    }

    const attendanceRecords = db.attendance || [];

    const reports = filteredStudents.map(stu => {
      const studentLogs = attendanceRecords.filter(att => att.studentId === stu.id);
      const totalWorkingDays = studentLogs.length;

      const present = studentLogs.filter(att => att.attendanceStatus === 'Present').length;
      const absent = studentLogs.filter(att => att.attendanceStatus === 'Absent').length;
      const leave = studentLogs.filter(att => att.attendanceStatus === 'Leave').length;
      const late = studentLogs.filter(att => att.attendanceStatus === 'Late').length;

      // Late counts as Present in percentage. Leave is excused (excludes from denominator, or counts as 0, or counts fully).
      // Standard SaaS metric: Percentage = (Present + Late) / Total Evaluated Days * 100. If Total is 0, default to 100%.
      let attendancePercentage = 100;
      if (totalWorkingDays > 0) {
        attendancePercentage = Math.round(((present + late) / totalWorkingDays) * 100);
      }

      return {
        id: stu.id,
        fullName: stu.fullName || stu.name,
        rollNumber: stu.rollNumber || stu.roll || '—',
        admissionNumber: stu.admissionNumber,
        studentClass: stu.studentClass || stu.grade?.split('-')[0] || 'IX',
        section: stu.section || stu.grade?.split('-')[1] || 'A',
        totalWorkingDays,
        present,
        absent,
        leave,
        late,
        attendancePercentage
      };
    });

    res.json(reports);
  } catch (err) {
    console.error('Error generating student attendance report:', err);
    res.status(500).json({ error: 'Server error generating reports.' });
  }
};

// 4. CLASS COHORT REPORT
export const getClassAttendanceReport = (req, res) => {
  try {
    const { date } = req.query;
    const todayStr = date || new Date().toLocaleDateString('en-CA'); // 'en-CA' outputs YYYY-MM-DD in local time
    
    const db = readDb();
    const students = (db.students || []).filter(stu => stu.status === 'Active');
    const attendanceRecords = db.attendance || [];

    // Group students by Class & Section
    const cohortGroups = {};
    students.forEach(stu => {
      const c = stu.studentClass || stu.grade?.split('-')[0] || 'Unknown';
      const s = stu.section || stu.grade?.split('-')[1] || 'Unknown';
      const key = `${c}-${s}`;
      if (!cohortGroups[key]) {
        cohortGroups[key] = {
          studentClass: c,
          section: s,
          studentIds: []
        };
      }
      cohortGroups[key].studentIds.push(stu.id);
    });

    const reports = Object.entries(cohortGroups).map(([key, group]) => {
      const totalStudents = group.studentIds.length;
      
      // Calculate overall counts for all student logs in this class
      const classLogs = attendanceRecords.filter(att => group.studentIds.includes(att.studentId));
      
      // Filter for target date records
      const targetDateLogs = classLogs.filter(att => att.attendanceDate === todayStr);

      const present = targetDateLogs.filter(att => att.attendanceStatus === 'Present').length;
      const absent = targetDateLogs.filter(att => att.attendanceStatus === 'Absent').length;
      const leave = targetDateLogs.filter(att => att.attendanceStatus === 'Leave').length;
      const late = targetDateLogs.filter(att => att.attendanceStatus === 'Late').length;

      let attendancePercentage = 100;
      const markedCount = targetDateLogs.length;
      if (markedCount > 0) {
        attendancePercentage = Math.round(((present + late) / markedCount) * 100);
      } else {
        // If no records marked for this specific date, default percentage to 100% or 0% depending on style
        // Let's use 100% or calculate historical average
        const totalLogs = classLogs.length;
        if (totalLogs > 0) {
          const histPresent = classLogs.filter(att => att.attendanceStatus === 'Present').length;
          const histLate = classLogs.filter(att => att.attendanceStatus === 'Late').length;
          attendancePercentage = Math.round(((histPresent + histLate) / totalLogs) * 100);
        }
      }

      return {
        studentClass: group.studentClass,
        section: group.section,
        totalStudents,
        presentStudents: present,
        absentStudents: absent,
        leaveStudents: leave,
        lateStudents: late,
        markedStudents: markedCount,
        attendancePercentage
      };
    });

    res.json(reports);
  } catch (err) {
    console.error('Error generating class attendance report:', err);
    res.status(500).json({ error: 'Server error generating cohort reports.' });
  }
};

// 5. MONTHLY CALENDAR ATTENDANCE DATA FOR SINGLE STUDENT
export const getMonthlyCalendarData = (req, res) => {
  try {
    const { studentId, month, year } = req.query;

    if (!studentId || !month || !year) {
      return res.status(400).json({ error: 'Student ID, Month, and Year are required.' });
    }

    const db = readDb();
    const attendanceRecords = db.attendance || [];

    // Filter records for student
    const studentLogs = attendanceRecords.filter(att => att.studentId === studentId);

    // Filter by Month and Year: e.g. YYYY-MM
    // Note: month from query is 1-indexed or 0-indexed. Let's normalize:
    // We will parse month as integer (e.g. 5 for May if 1-indexed, or 4 if 0-indexed). Let's assume standard 1-indexed YYYY-MM string match,
    // but support prefix padding.
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const monthString = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
    const datePrefix = `${yearNum}-${monthString}`; // e.2026-06

    const filteredLogs = studentLogs.filter(att => att.attendanceDate.startsWith(datePrefix));

    // Map as dictionary date -> log
    const calendarData = {};
    filteredLogs.forEach(log => {
      calendarData[log.attendanceDate] = {
        status: log.attendanceStatus,
        remarks: log.remarks || '',
        markedBy: log.markedBy || 'Teacher'
      };
    });

    res.json(calendarData);
  } catch (err) {
    console.error('Error generating monthly calendar data:', err);
    res.status(500).json({ error: 'Server error loading calendar statistics.' });
  }
};

// 6. SUBMIT ATTENDANCE FOR A DATE/CLASS/SECTION
export const submitAttendanceRoster = (req, res) => {
  try {
    const { date, studentClass, section } = req.body;

    if (!date || !studentClass || !section) {
      return res.status(400).json({ error: 'Date, Class, and Section are required.' });
    }

    const db = readDb();
    if (!db.attendance) db.attendance = [];

    let updatedCount = 0;
    db.attendance.forEach((att, idx) => {
      if (
        att.attendanceDate === date &&
        att.classId === studentClass &&
        att.sectionId === section &&
        !att.submitted
      ) {
        db.attendance[idx] = {
          ...att,
          submitted: true,
          updatedAt: new Date().toISOString()
        };
        updatedCount++;
      }
    });

    addActivity(
      db,
      'registration',
      'Attendance Submitted',
      `Attendance for Grade ${studentClass}-${section} on ${date} submitted (${updatedCount} records)`,
      'rgb(var(--color-success-rgb))',
      'rgba(var(--color-success-rgb), 0.1)'
    );

    writeDb(db);
    res.json({ success: true, message: `Attendance submitted successfully. ${updatedCount} records finalized.` });
  } catch (err) {
    console.error('Error submitting attendance:', err);
    res.status(500).json({ error: 'Server error submitting attendance.' });
  }
};

// 7. GET SUBMITTED ATTENDANCE DATES FOR A CLASS/SECTION
export const getSubmittedAttendanceDates = (req, res) => {
  try {
    const { studentClass, section } = req.query;

    if (!studentClass || !section) {
      return res.status(400).json({ error: 'Class and Section are required.' });
    }

    const db = readDb();
    const attendanceRecords = db.attendance || [];

    // Group by date, count submitted records for this class/section
    const dateMap = {};
    attendanceRecords.forEach(att => {
      if (att.classId === studentClass && att.sectionId === section && att.submitted) {
        if (!dateMap[att.attendanceDate]) {
          dateMap[att.attendanceDate] = { date: att.attendanceDate, count: 0 };
        }
        dateMap[att.attendanceDate].count++;
      }
    });

    const result = Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));

    res.json(result);
  } catch (err) {
    console.error('Error fetching submitted dates:', err);
    res.status(500).json({ error: 'Server error fetching submitted dates.' });
  }
};
