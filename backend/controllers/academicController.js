import { readDb, writeDb, addActivity } from '../utils/db.js';
import * as XLSX from 'xlsx';
import { PDFParse } from 'pdf-parse';

// Conflict helper: Checks if two time slots overlap
// e.g. "09:00 AM - 10:00 AM" and "09:30 AM - 10:30 AM"
const isTimeOverlapping = (time1, time2) => {
  if (!time1 || !time2) return false;
  if (time1.trim().toLowerCase() === time2.trim().toLowerCase()) return true;

  const parseTime = (timeStr) => {
    // Format: "HH:MM AM/PM" or "HH:MM AM/PM - HH:MM AM/PM"
    const parts = timeStr.split('-');
    if (parts.length < 2) {
      // Just single time slot
      return { start: parseSingle(timeStr), end: parseSingle(timeStr) + 60 };
    }
    return {
      start: parseSingle(parts[0]),
      end: parseSingle(parts[1])
    };
  };

  const parseSingle = (tStr) => {
    const clean = tStr.trim();
    const match = clean.match(/^(\d+):(\d+)\s*(am|pm)$/i);
    if (!match) return 0;
    let hrs = parseInt(match[1]);
    const mins = parseInt(match[2]);
    const ampm = match[3].toLowerCase();
    
    if (ampm === 'pm' && hrs < 12) hrs += 12;
    if (ampm === 'am' && hrs === 12) hrs = 0;
    
    return hrs * 60 + mins;
  };

  try {
    const t1 = parseTime(time1);
    const t2 = parseTime(time2);
    return t1.start < t2.end && t2.start < t1.end;
  } catch (e) {
    return false; // Fallback in case of parse errors
  }
};

// =============================================
// 1. CLASS TIMETABLE CONTROLLER
// =============================================
export const getTimetables = (req, res) => {
  const db = readDb();
  res.json(db.timetables);
};

export const createTimetable = (req, res) => {
  const { cohort, day, time, subject, teacher = '', room = '', session } = req.body;

  if (!cohort || !day || !time || !subject) {
    return res.status(400).json({ error: 'All fields (cohort, day, time, subject) are required.' });
  }

  const db = readDb();

  const cleanTeacher = (teacher || '').trim();
  const cleanRoom = (room || '').trim();

  // Conflict Detection: Teacher double booking or Room booking conflict (only if values are supplied and not n/a)
  let conflictMsg = null;
  const conflict = db.timetables.find(t => {
    if (t.day.toLowerCase() === day.toLowerCase() && isTimeOverlapping(t.time, time)) {
      // Teacher conflict
      if (cleanTeacher !== '' && cleanTeacher.toLowerCase() !== 'n/a' && t.teacher && t.teacher.trim().toLowerCase() === cleanTeacher.toLowerCase()) {
        conflictMsg = `Faculty ${cleanTeacher} is already assigned to ${t.cohort} on ${day} during ${t.time}.`;
        return true;
      }
      // Room conflict
      if (cleanRoom !== '' && cleanRoom.toLowerCase() !== 'n/a' && t.room && t.room.trim().toLowerCase() === cleanRoom.toLowerCase()) {
        conflictMsg = `Classroom ${cleanRoom} is already booked for ${t.cohort} on ${day} during ${t.time}.`;
        return true;
      }
    }
    return false;
  });

  if (conflict) {
    return res.status(400).json({ error: `Conflict Detected: ${conflictMsg}` });
  }

  const newSlot = {
    id: `TT-${Date.now()}`,
    cohort,
    day,
    time,
    subject,
    teacher,
    room,
    session: session || '2026-2027'
  };

  db.timetables.push(newSlot);
  writeDb(db);

  res.status(201).json(newSlot);
};

export const deleteTimetable = (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const initialCount = db.timetables.length;
  db.timetables = db.timetables.filter(t => t.id !== id);

  if (db.timetables.length === initialCount) {
    return res.status(404).json({ error: 'Timetable period not found.' });
  }

  writeDb(db);
  res.json({ message: 'Timetable period successfully deleted.' });
};

// =============================================
// 2. EXAM MANAGEMENT CONTROLLER
// =============================================
export const getExams = (req, res) => {
  const db = readDb();
  const enriched = (db.exams || []).map(ex => {
    const scheduleCount = db.examTimetables ? db.examTimetables.filter(et => et.examId === ex.id).length : 0;
    return { ...ex, scheduleCount };
  });
  res.json(enriched);
};

export const createExam = (req, res) => {
  const { examName, examType, academicSession, description, gradeSections, totalMarks, subjectMarks, subjectIncluded } = req.body;

  if (!examName || !examType || !academicSession || !gradeSections || gradeSections.length === 0) {
    return res.status(400).json({ error: 'Missing required exam fields.' });
  }

  const db = readDb();

  const now = Date.now();
  const endDates = gradeSections.map(gs => gs.endDate).filter(Boolean);
  const examEndDate = endDates.length === gradeSections.length ? endDates.sort().reverse()[0] : null;

  const newExam = {
    id: `EXM-${now}`,
    examName,
    examType,
    academicSession,
    description: description || '',
    totalMarks: totalMarks || 100,
    subjectMarks: subjectMarks || {},
    subjectIncluded: subjectIncluded || {},
    gradeSections: gradeSections.map(gs => ({
      grade: gs.grade,
      section: gs.section,
      startDate: gs.startDate,
      endDate: gs.endDate || null
    })),
    endDate: examEndDate,
    status: 'Draft',
    createdAt: new Date().toISOString()
  };

  db.exams.push(newExam);
  addActivity(db, 'alert', 'New Examination Created', `${examName} created as Draft`, 'hsl(var(--color-primary))', 'rgba(hsl(var(--color-primary)), 0.1)');
  writeDb(db);

  res.status(201).json(newExam);
};

export const updateExam = (req, res) => {
  const { id } = req.params;
  const { examName, examType, academicSession, description, gradeSections, status, totalMarks, subjectMarks, subjectIncluded, timetablePublished } = req.body;

  const db = readDb();
  const examIndex = db.exams.findIndex(e => e.id === id);

  if (examIndex === -1) {
    return res.status(404).json({ error: 'Exam not found.' });
  }

  if (examName) db.exams[examIndex].examName = examName;
  if (examType) db.exams[examIndex].examType = examType;
  if (academicSession) db.exams[examIndex].academicSession = academicSession;
  if (description !== undefined) db.exams[examIndex].description = description;
  if (gradeSections) db.exams[examIndex].gradeSections = gradeSections;
  
  if (status) {
    db.exams[examIndex].status = status;
  } else if (db.exams[examIndex].status === 'Published') {
    const schedulesCount = db.examTimetables ? db.examTimetables.filter(et => et.examId === id).length : 0;
    db.exams[examIndex].status = schedulesCount > 0 ? 'Scheduled' : 'Draft';
  }

  if (totalMarks !== undefined) db.exams[examIndex].totalMarks = totalMarks;
  if (subjectMarks !== undefined) db.exams[examIndex].subjectMarks = subjectMarks;
  if (subjectIncluded !== undefined) db.exams[examIndex].subjectIncluded = subjectIncluded;
  if (timetablePublished !== undefined) db.exams[examIndex].timetablePublished = timetablePublished;

  if (db.publishedCalendarEvents) {
    db.publishedCalendarEvents = db.publishedCalendarEvents.filter(eventId => eventId !== id);
  }
  writeDb(db);
  res.json(db.exams[examIndex]);
};

export const deleteExam = (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const initialCount = db.exams.length;
  db.exams = db.exams.filter(e => e.id !== id);
  db.examTimetables = (db.examTimetables || []).filter(et => et.examId !== id);
  db.results = (db.results || []).filter(r => r.examId !== id);
  db.overallResults = (db.overallResults || []).filter(o => o.examId !== id);

  if (db.exams.length === initialCount) {
    return res.status(404).json({ error: 'Exam not found.' });
  }

  if (db.publishedCalendarEvents) {
    db.publishedCalendarEvents = db.publishedCalendarEvents.filter(eventId => eventId !== id);
  }
  writeDb(db);
  res.json({ message: 'Exam configuration deleted successfully.' });
};

export const generateExamSchedule = (req, res) => {
  const { examId, gapDays = 1 } = req.body;

  if (!examId) {
    return res.status(400).json({ error: 'Exam ID is required.' });
  }

  const db = readDb();
  const exam = db.exams.find(e => e.id === examId);

  if (!exam) {
    return res.status(404).json({ error: 'Exam not found.' });
  }

  const subjectsByGrade = {};
  (db.subjects || []).forEach(sub => {
    if (!subjectsByGrade[sub.grade]) subjectsByGrade[sub.grade] = [];
    subjectsByGrade[sub.grade].push(sub.subjectName);
  });

  const newSchedules = [];
  let anyError = null;

  exam.gradeSections.forEach(gs => {
    const dbGradeSubjects = subjectsByGrade[gs.grade] || [];
    if (dbGradeSubjects.length === 0) {
      return;
    }

    const gradeSubjects = dbGradeSubjects.filter(sub => {
      const subKey = `${gs.grade}-${sub}`;
      return exam.subjectIncluded ? exam.subjectIncluded[subKey] !== false : true;
    });

    const startDate = new Date(gs.startDate + 'T00:00:00');
    const cohort = gs.section ? `${gs.grade}-${gs.section}` : gs.grade;
    const scheduledOnDates = new Set();
    let currentDate = new Date(startDate);
    let subjectIndex = 0;

    const formatDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const isHoliday = (dateStr) => {
      return (db.holidays || []).some(h => {
        if (!h.startDate || !h.endDate) return false;
        return dateStr >= h.startDate && dateStr <= h.endDate;
      });
    };

    while (subjectIndex < gradeSubjects.length) {
      const dateStr = formatDate(currentDate);

      // Skip Sundays (day 0)
      if (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Skip holidays
      if (isHoliday(dateStr)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Prevent duplicate exam on same day for this cohort
      const existingOnDate = (db.examTimetables || []).some(
        et => et.examDate === dateStr && et.cohort === cohort && et.examId !== examId
      );
      if (existingOnDate || scheduledOnDates.has(dateStr)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Remove existing schedule for this exam+cohort+subject to allow regeneration
      const existingIdx = db.examTimetables.findIndex(
        et => et.examId === examId && et.cohort === cohort && et.subject === gradeSubjects[subjectIndex]
      );
      if (existingIdx !== -1) {
        db.examTimetables.splice(existingIdx, 1);
      }

      newSchedules.push({
        id: `EXMT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        examId,
        grade: gs.grade,
        section: gs.section || '',
        cohort,
        subject: gradeSubjects[subjectIndex],
        examDate: dateStr
      });

      scheduledOnDates.add(dateStr);
      subjectIndex++;
      currentDate.setDate(currentDate.getDate() + parseInt(gapDays));
    }

    // Auto-calculate end date if not set manually
    if (!gs.endDate) {
      const cohortSchedules = newSchedules.filter(s => s.cohort === cohort);
      if (cohortSchedules.length > 0) {
        const lastDate = cohortSchedules[cohortSchedules.length - 1].examDate;
        gs.endDate = lastDate;
      }
    }
  });

  if (anyError) {
    return res.status(400).json({ error: anyError });
  }

  // Calculate overall exam endDate if not set manually
  if (!exam.endDate) {
    const endDates = exam.gradeSections.filter(gs => gs.endDate).map(gs => gs.endDate);
    if (endDates.length > 0) {
      endDates.sort();
      exam.endDate = endDates[endDates.length - 1];
    }
  }

  exam.status = 'Scheduled';
  exam.timetablePublished = false;
  db.examTimetables.push(...newSchedules);
  writeDb(db);

  res.status(201).json({
    message: 'Schedule generated successfully.',
    schedules: newSchedules,
    exam
  });
};

export const publishExam = (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const examIndex = db.exams.findIndex(e => e.id === id);

  if (examIndex === -1) {
    return res.status(404).json({ error: 'Exam not found.' });
  }

  db.exams[examIndex].status = 'Published';
  writeDb(db);

  res.json({ message: 'Exam published successfully.', exam: db.exams[examIndex] });
};

export const getGradesSections = (req, res) => {
  const db = readDb();
  const activeGrades = (db.grades || []).filter(g => g.status === 'Active');
  const activeDepartments = (db.departments || []).filter(d => d.status === 'Active');

  const isGrade11or12 = (name) => {
    if (!name) return false;
    const clean = name.trim().toUpperCase();
    return clean.includes('11') || clean.includes('12') || clean.includes('XI') || clean.includes('XII');
  };

  const gradeOptions = [];
  activeGrades.forEach(g => {
    if (isGrade11or12(g.name)) {
      if (activeDepartments.length > 0) {
        activeDepartments.forEach(dept => {
          gradeOptions.push(`${g.name} (${dept.name})`);
        });
      } else {
        gradeOptions.push(g.name);
      }
    } else {
      gradeOptions.push(g.name);
    }
  });

  const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'LKG': -2, 'UKG': -1, 'NURSERY': -3 };
  const sortGrades = (a, b) => {
    const aVal = a.toUpperCase();
    const bVal = b.toUpperCase();
    const aRoman = romanMap[aVal.split(' ')[0]];
    const bRoman = romanMap[bVal.split(' ')[0]];
    if (aRoman !== undefined && bRoman !== undefined) return aRoman - bRoman;
    const aGradeNum = aVal.replace('GRADE', '').trim();
    const bGradeNum = bVal.replace('GRADE', '').trim();
    const aNum = parseInt(aGradeNum);
    const bNum = parseInt(bGradeNum);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return aVal.localeCompare(bVal);
  };

  const grades = gradeOptions.sort(sortGrades);
  const activeSections = (db.sections || []).filter(s => s.status === 'Active');
  const sections = activeSections.map(s => s.name);
  const gradeSectionPairs = [];
  
  grades.forEach(g => {
    sections.forEach(s => {
      gradeSectionPairs.push({ grade: g, section: s });
    });
  });

  res.json({ grades, sections, gradeSectionPairs });
};

// =============================================
// 3. EXAM TIMETABLE CONTROLLER
// =============================================
export const getExamTimetables = (req, res) => {
  const db = readDb();
  res.json(db.examTimetables);
};

export const createExamTimetable = (req, res) => {
  const { examId, subject, examDate, startTime = '', endTime = '', duration = '', roomAllocation = '', invigilator = '', cohort = '', grade = '', section = '' } = req.body;

  if (!examId || !subject || !examDate) {
    return res.status(400).json({ error: 'Missing required exam timetable fields (examId, subject, examDate).' });
  }

  const db = readDb();

  // Conflict Detection: Invigilator or room busy on same day and overlapping time
  if (startTime && endTime) {
    const timeSlot = `${startTime} - ${endTime}`;
    const conflict = db.examTimetables.find(et => {
      if (et.examDate === examDate && et.startTime && et.endTime && isTimeOverlapping(`${et.startTime} - ${et.endTime}`, timeSlot)) {
        if (invigilator && et.invigilator && et.invigilator.toLowerCase() === invigilator.toLowerCase()) {
          return true;
        }
        if (roomAllocation && et.roomAllocation && et.roomAllocation.toLowerCase() === roomAllocation.toLowerCase()) {
          return true;
        }
      }
      return false;
    });

    if (conflict) {
      const foundConflict = db.examTimetables.find(et => et.examDate === examDate && et.startTime && et.endTime && isTimeOverlapping(`${et.startTime} - ${et.endTime}`, timeSlot));
      const msg = invigilator && foundConflict.invigilator && foundConflict.invigilator.toLowerCase() === invigilator.toLowerCase()
        ? `Invigilator ${invigilator} is already scheduled on ${examDate} at ${foundConflict.startTime}.`
        : `Room ${roomAllocation} is already allocated on ${examDate} at ${foundConflict.startTime}.`;
      return res.status(400).json({ error: `Conflict Detected: ${msg}` });
    }
  }

  const newSchedule = {
    id: `EXMT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    examId,
    subject,
    examDate,
    startTime,
    endTime,
    duration: duration || '3 Hours',
    roomAllocation,
    invigilator,
    cohort: cohort || (grade && section ? `${grade}-${section}` : ''),
    grade,
    section
  };

  db.examTimetables.push(newSchedule);

  // Reset published status when editing schedules
  const parentExam = (db.exams || []).find(e => e.id === examId);
  if (parentExam) {
    parentExam.timetablePublished = false;
  }

  writeDb(db);

  res.status(201).json(newSchedule);
};

export const deleteExamTimetable = (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const initialCount = db.examTimetables.length;
  const slot = db.examTimetables.find(et => et.id === id);
  db.examTimetables = db.examTimetables.filter(et => et.id !== id);

  if (db.examTimetables.length === initialCount) {
    return res.status(404).json({ error: 'Exam slot not found.' });
  }

  // Reset published status when deleting schedules
  if (slot) {
    const parentExam = (db.exams || []).find(e => e.id === slot.examId);
    if (parentExam) {
      parentExam.timetablePublished = false;
    }
  }

  writeDb(db);
  res.json({ message: 'Exam slot deleted successfully.' });
};

export const deleteCohortExamTimetable = (req, res) => {
  const { examId, cohort } = req.params;
  const db = readDb();

  const initialCount = db.examTimetables.length;
  db.examTimetables = db.examTimetables.filter(et => !(et.examId === examId && et.cohort === cohort));

  if (db.examTimetables.length === initialCount) {
    return res.status(404).json({ error: 'No schedules found for this exam and cohort.' });
  }

  // Reset published status when deleting cohort schedules
  const parentExam = (db.exams || []).find(e => e.id === examId);
  if (parentExam) {
    parentExam.timetablePublished = false;
  }

  writeDb(db);
  res.json({ message: 'Exam timetable for cohort deleted successfully.' });
};

// =============================================
// 4. EVENTS CONTROLLER
// =============================================
export const getEvents = (req, res) => {
  const db = readDb();
  res.json(db.events || []);
};

export const createEvent = (req, res) => {
  const { title, type, date, time, venue, description, organizer, participants, status } = req.body;

  if (!title || !type || !date || !time || !venue) {
    return res.status(400).json({ error: 'Title, Type, Date, Time, and Venue are required.' });
  }

  const db = readDb();
  const newEvent = {
    id: `EVT-${Date.now()}`,
    title,
    type,
    date,
    time,
    venue,
    description: description || '',
    organizer: organizer || 'School Admin',
    participants: participants || 'All Students',
    status: status || 'Scheduled'
  };

  db.events.push(newEvent);
  addActivity(db, 'alert', 'New School Event', `Event "${title}" scheduled for ${date} at ${venue}`, 'hsl(var(--color-secondary))', 'rgba(hsl(var(--color-secondary)), 0.1)');
  writeDb(db);

  res.status(201).json(newEvent);
};

export const updateEvent = (req, res) => {
  const { id } = req.params;
  const { title, type, date, time, venue, description, organizer, participants, status } = req.body;

  const db = readDb();
  const eventIdx = db.events.findIndex(evt => evt.id === id);

  if (eventIdx === -1) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  db.events[eventIdx] = {
    ...db.events[eventIdx],
    title: title || db.events[eventIdx].title,
    type: type || db.events[eventIdx].type,
    date: date || db.events[eventIdx].date,
    time: time || db.events[eventIdx].time,
    venue: venue || db.events[eventIdx].venue,
    description: description || db.events[eventIdx].description,
    organizer: organizer || db.events[eventIdx].organizer,
    participants: participants || db.events[eventIdx].participants,
    status: status || db.events[eventIdx].status
  };

  if (db.publishedCalendarEvents) {
    db.publishedCalendarEvents = db.publishedCalendarEvents.filter(eventId => eventId !== id);
  }
  writeDb(db);
  res.json(db.events[eventIdx]);
};

export const deleteEvent = (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const initialCount = db.events.length;
  db.events = db.events.filter(evt => evt.id !== id);

  if (db.events.length === initialCount) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  if (db.publishedCalendarEvents) {
    db.publishedCalendarEvents = db.publishedCalendarEvents.filter(eventId => eventId !== id);
  }
  writeDb(db);
  res.json({ message: 'Event deleted successfully.' });
};

// =============================================
// 5. NOTICES CONTROLLER
// =============================================
export const getNotices = (req, res) => {
  const db = readDb();
  res.json(db.notices);
};

export const createNotice = (req, res) => {
  const { title, content, category, priority, publishDate, expiryDate, visibility } = req.body;

  if (!title || !content || !category || !publishDate) {
    return res.status(400).json({ error: 'Title, Content, Category, and Publish Date are required.' });
  }

  const db = readDb();
  const newNotice = {
    id: `NTC-${Date.now()}`,
    title,
    content,
    category,
    priority: priority || 'Medium',
    publishDate,
    expiryDate: expiryDate || '',
    visibility: visibility || 'All'
  };

  db.notices.push(newNotice);
  addActivity(db, 'alert', 'Notice Board Published', `Notice: "${title}" visibility set to: ${newNotice.visibility}`, 'hsl(var(--color-info))', 'rgba(hsl(var(--color-info)), 0.1)');
  writeDb(db);

  res.status(201).json(newNotice);
};

export const updateNotice = (req, res) => {
  const { id } = req.params;
  const { title, content, category, priority, publishDate, expiryDate, visibility } = req.body;

  const db = readDb();
  const index = db.notices.findIndex(n => n.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Notice not found.' });
  }

  db.notices[index] = {
    ...db.notices[index],
    title: title || db.notices[index].title,
    content: content || db.notices[index].content,
    category: category || db.notices[index].category,
    priority: priority || db.notices[index].priority,
    publishDate: publishDate || db.notices[index].publishDate,
    expiryDate: expiryDate || db.notices[index].expiryDate,
    visibility: visibility || db.notices[index].visibility
  };

  writeDb(db);
  res.json(db.notices[index]);
};

export const deleteNotice = (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const initialCount = db.notices.length;
  db.notices = db.notices.filter(n => n.id !== id);

  if (db.notices.length === initialCount) {
    return res.status(404).json({ error: 'Notice not found.' });
  }

  writeDb(db);
  res.json({ message: 'Notice board entry deleted successfully.' });
};

// =============================================
// 6. HOLIDAYS CONTROLLER
// =============================================
export const getHolidays = (req, res) => {
  const db = readDb();
  res.json(db.holidays);
};

export const createHoliday = (req, res) => {
  const { name, type, startDate, endDate, description } = req.body;

  if (!name || !type || !startDate || !endDate) {
    return res.status(400).json({ error: 'Holiday Name, Type, Start Date, and End Date are required.' });
  }

  const db = readDb();
  const newHoliday = {
    id: `HLD-${Date.now()}`,
    name,
    type,
    startDate,
    endDate,
    description: description || ''
  };

  db.holidays.push(newHoliday);
  writeDb(db);

  res.status(201).json(newHoliday);
};

export const deleteHoliday = (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const initialCount = db.holidays.length;
  db.holidays = db.holidays.filter(h => h.id !== id);

  if (db.holidays.length === initialCount) {
    return res.status(404).json({ error: 'Holiday not found.' });
  }

  if (db.publishedCalendarEvents) {
    db.publishedCalendarEvents = db.publishedCalendarEvents.filter(eventId => eventId !== id);
  }
  writeDb(db);
  res.json({ message: 'Holiday schedule removed successfully.' });
};

export const updateHoliday = (req, res) => {
  const { id } = req.params;
  const { name, type, startDate, endDate, description } = req.body;

  const db = readDb();
  const index = db.holidays.findIndex(h => h.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Holiday not found.' });
  }

  db.holidays[index] = {
    ...db.holidays[index],
    name: name || db.holidays[index].name,
    type: type || db.holidays[index].type,
    startDate: startDate || db.holidays[index].startDate,
    endDate: endDate || db.holidays[index].endDate,
    description: description !== undefined ? description : db.holidays[index].description
  };

  if (db.publishedCalendarEvents) {
    db.publishedCalendarEvents = db.publishedCalendarEvents.filter(eventId => eventId !== id);
  }
  writeDb(db);
  res.json(db.holidays[index]);
};

// =============================================
// 7. RESULTS CONTROLLER (GRADES, GPA, MARKSHEETS & RANKS)
// =============================================
export const getResults = (req, res) => {
  const db = readDb();
  
  // Enforce linking student details
  const resultsWithDetails = (db.results || []).map(r => {
    const student = (db.students || []).find(s => s.id === r.studentId);
    const exam = (db.exams || []).find(e => e.id === r.examId);
    return {
      ...r,
      studentName: student ? student.name : 'Unknown Student',
      studentRoll: student ? student.rollNumber || student.roll : 'N/A',
      studentClass: student ? student.studentClass : 'N/A',
      examName: exam ? exam.examName : 'Unknown Exam'
    };
  });

  res.json(resultsWithDetails);
};

export const createResult = (req, res) => {
  const { studentId, examId, subject, obtainedMarks, totalMarks, term } = req.body;

  if (!studentId || !examId || !subject || obtainedMarks === undefined || !totalMarks) {
    return res.status(400).json({ error: 'Student ID, Exam ID, Subject, Obtained Marks, and Total Marks are required.' });
  }

  const db = readDb();
  const obt = parseFloat(obtainedMarks);
  const tot = parseFloat(totalMarks);

  if (obt > tot) {
    return res.status(400).json({ error: 'Obtained Marks cannot be greater than Total Marks.' });
  }

  const percentage = Math.round((obt / tot) * 100);

  // Grade & GPA Mapping
  let grade = 'F';
  let gpa = 0.0;

  if (percentage >= 90) { grade = 'A+'; gpa = 4.0; }
  else if (percentage >= 80) { grade = 'A'; gpa = 3.7; }
  else if (percentage >= 70) { grade = 'B+'; gpa = 3.3; }
  else if (percentage >= 60) { grade = 'B'; gpa = 3.0; }
  else if (percentage >= 50) { grade = 'C'; gpa = 2.0; }
  else if (percentage >= 40) { grade = 'D'; gpa = 1.0; }
  else { grade = 'F'; gpa = 0.0; }

  const newResult = {
    id: `RST-${Date.now()}`,
    studentId,
    examId,
    subject,
    obtainedMarks: obt,
    totalMarks: tot,
    term: term || 'First Term',
    percentage,
    grade,
    gpa,
    rank: '-' // Placeholder, calculated below
  };

  // Check if result already exists for this student, exam, and subject, if so update it
  const matchIdx = db.results.findIndex(r => r.studentId === studentId && r.examId === examId && r.subject.toLowerCase() === subject.toLowerCase());
  if (matchIdx !== -1) {
    db.results[matchIdx] = { ...db.results[matchIdx], ...newResult, id: db.results[matchIdx].id };
  } else {
    db.results.push(newResult);
  }

  // RE-CALCULATE CLASS RANKS FOR THIS SPECIFIC EXAM AND SUBJECT
  // We rank students in the same class/grade
  const student = (db.students || []).find(s => s.id === studentId);
  const targetClass = student ? student.studentClass : null;

  if (targetClass) {
    // 1. Get all students in targetClass
    const classStudentIds = (db.students || [])
      .filter(s => s.studentClass === targetClass && s.status === 'Active')
      .map(s => s.id);

    // 2. Get all results for this subject and exam for these students
    const cohortResults = db.results.filter(r => 
      r.examId === examId && 
      r.subject.toLowerCase() === subject.toLowerCase() &&
      classStudentIds.includes(r.studentId)
    );

    // 3. Sort by percentage descending
    cohortResults.sort((a, b) => b.percentage - a.percentage);

    // 4. Update ranks in the main database array
    cohortResults.forEach((resItem, index) => {
      const idxInDb = db.results.findIndex(r => r.id === resItem.id);
      if (idxInDb !== -1) {
        db.results[idxInDb].rank = index + 1; // 1-based ranking
      }
    });
  }

  writeDb(db);
  res.status(201).json(newResult);
};

export const deleteResult = (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const initialCount = db.results.length;
  db.results = db.results.filter(r => r.id !== id);

  if (db.results.length === initialCount) {
    return res.status(404).json({ error: 'Result entry not found.' });
  }

  writeDb(db);
  res.json({ message: 'Result record deleted successfully.' });
};

// =============================================
// 8. TIMESLOTS CONTROLLER
// =============================================
export const getTimeslots = (req, res) => {
  const db = readDb();
  res.json(db.timeslots || [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM'
  ]);
};

export const createTimeslot = (req, res) => {
  const { timeslot } = req.body;
  if (!timeslot) {
    return res.status(400).json({ error: 'Timeslot value is required.' });
  }

  const db = readDb();
  if (!db.timeslots) {
    db.timeslots = [
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '01:00 PM - 02:00 PM',
      '02:00 PM - 03:00 PM'
    ];
  }

  if (db.timeslots.includes(timeslot)) {
    return res.status(400).json({ error: 'Timeslot already exists.' });
  }

  db.timeslots.push(timeslot);
  writeDb(db);
  res.status(201).json(timeslot);
};

export const deleteTimeslot = (req, res) => {
  const { timeslot } = req.body;
  if (!timeslot) {
    return res.status(400).json({ error: 'Timeslot value is required.' });
  }

  const db = readDb();
  if (!db.timeslots) {
    db.timeslots = [
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '01:00 PM - 02:00 PM',
      '02:00 PM - 03:00 PM'
    ];
  }

  db.timeslots = db.timeslots.filter(t => t !== timeslot);
  writeDb(db);
  res.json({ message: 'Timeslot successfully deleted.' });
};

// =============================================
// 9. SUBJECTS CONTROLLER
// =============================================
export const getSubjects = (req, res) => {
  const db = readDb();
  res.json(db.subjects || []);
};

export const createSubject = (req, res) => {
  const { grade, subjectName } = req.body;
  if (!grade || !subjectName) {
    return res.status(400).json({ error: 'Grade level and Subject Name are required.' });
  }

  const db = readDb();
  if (!db.subjects) db.subjects = [];

  const exists = db.subjects.some(
    s => s.grade.toUpperCase() === grade.toUpperCase() && s.subjectName.toLowerCase() === subjectName.toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: 'Subject already registered for this grade.' });
  }

  const newSubject = {
    id: `SUB-${Date.now()}`,
    grade,
    subjectName
  };

  db.subjects.push(newSubject);
  writeDb(db);
  res.status(201).json(newSubject);
};

export const deleteSubject = (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.subjects) db.subjects = [];

  const initialCount = db.subjects.length;
  db.subjects = db.subjects.filter(s => s.id !== id);

  if (db.subjects.length === initialCount) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  writeDb(db);
  res.json({ message: 'Subject successfully deleted.' });
};

export const createSubjectBulk = (req, res) => {
  const { grade, subjectNames } = req.body;
  if (!grade || !Array.isArray(subjectNames)) {
    return res.status(400).json({ error: 'Grade level and subjectNames list are required.' });
  }

  const db = readDb();
  if (!db.subjects) db.subjects = [];

  const added = [];
  const duplicates = [];

  subjectNames.forEach((name, index) => {
    const cleanName = (name || '').trim();
    if (!cleanName) return;

    const exists = db.subjects.some(
      s => s.grade.toUpperCase() === grade.toUpperCase() && s.subjectName.toLowerCase() === cleanName.toLowerCase()
    );
    if (!exists) {
      const newSub = {
        id: `SUB-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
        grade,
        subjectName: cleanName
      };
      db.subjects.push(newSub);
      added.push(newSub);
    } else {
      duplicates.push(cleanName);
    }
  });

  writeDb(db);
  res.status(201).json({ message: 'Subjects processed.', added, duplicates });
};

// =============================================
// 10. BULK TIMETABLE SAVE CONTROLLER
// =============================================
export const createTimetableBulk = (req, res) => {
  const { cohort, timetables, session = '2026-2027' } = req.body;
  if (!cohort || !Array.isArray(timetables)) {
    return res.status(400).json({ error: 'Cohort and timetables list are required.' });
  }

  const db = readDb();
  if (!db.timetables) db.timetables = [];

  // Remove existing entries for this cohort
  db.timetables = db.timetables.filter(t => t.cohort !== cohort);
  if (timetables.length === 0) {
    if (db.publishedClassTimetables) {
      db.publishedClassTimetables = db.publishedClassTimetables.filter(pt => pt.cohort !== cohort);
    }
  }

  // Push new valid timetable entries
  timetables.forEach((slot, index) => {
    if (slot.subject && slot.subject.trim() !== '') {
      db.timetables.push({
        id: `TT-${Date.now()}-${index}`,
        cohort,
        day: slot.day,
        time: slot.time,
        subject: slot.subject,
        teacher: slot.teacher || '',
        room: slot.room || '',
        session
      });
    }
  });

  writeDb(db);
  res.status(201).json({ message: 'Timetable updated successfully.' });
};

export const createTimetableBulkTeacher = (req, res) => {
  const { teacher, timetables, session = '2026-2027' } = req.body;
  if (!teacher || !Array.isArray(timetables)) {
    return res.status(400).json({ error: 'Teacher and timetables list are required.' });
  }

  const db = readDb();
  if (!db.teacherTimetables) db.teacherTimetables = [];

  // Remove existing entries for this teacher from teacherTimetables
  db.teacherTimetables = db.teacherTimetables.filter(t => !t.teacher || t.teacher.toLowerCase() !== teacher.toLowerCase());
  if (timetables.length === 0) {
    if (db.publishedTeacherTimetables) {
      db.publishedTeacherTimetables = db.publishedTeacherTimetables.filter(pt => !pt.teacher || pt.teacher.toLowerCase() !== teacher.toLowerCase());
    }
  }

  // Push new valid timetable entries
  timetables.forEach((slot, index) => {
    if (slot.cohort && slot.cohort.trim() !== '') {
      db.teacherTimetables.push({
        id: `TT-TEACHER-${Date.now()}-${index}`,
        cohort: slot.cohort,
        day: slot.day,
        time: slot.time,
        subject: slot.subject || '',
        teacher: teacher,
        room: '',
        session
      });
    }
  });

  writeDb(db);
  res.status(201).json({ message: 'Teacher timetable updated successfully.' });
};

export const getTeacherTimetables = (req, res) => {
  const db = readDb();
  res.json(db.teacherTimetables || []);
};

export const getPublishedTimetables = (req, res) => {
  const db = readDb();
  res.json({
    classTimetables: db.publishedClassTimetables || [],
    teacherTimetables: db.publishedTeacherTimetables || []
  });
};

export const publishTimetable = (req, res) => {
  const { type, identifier } = req.body;
  if (!type || !identifier) {
    return res.status(400).json({ error: 'Type (class/teacher) and identifier are required.' });
  }

  const db = readDb();
  if (!db.publishedClassTimetables) db.publishedClassTimetables = [];
  if (!db.publishedTeacherTimetables) db.publishedTeacherTimetables = [];

  if (type === 'class') {
    const slots = db.timetables.filter(t => t.cohort === identifier);
    if (slots.length === 0) {
      return res.status(400).json({ error: `No timetable slots found for cohort ${identifier}.` });
    }

    const existingIdx = db.publishedClassTimetables.findIndex(pt => pt.cohort === identifier);
    const newEntry = {
      cohort: identifier,
      slots: slots.map(s => ({ day: s.day, time: s.time, subject: s.subject, teacher: s.teacher, room: s.room })),
      publishedAt: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      db.publishedClassTimetables[existingIdx] = newEntry;
    } else {
      db.publishedClassTimetables.push(newEntry);
    }
  } else if (type === 'teacher') {
    const slots = db.teacherTimetables.filter(t => t.teacher && t.teacher.toLowerCase() === identifier.toLowerCase());
    if (slots.length === 0) {
      return res.status(400).json({ error: `No timetable slots found for teacher ${identifier}.` });
    }

    const teacherName = slots[0].teacher;
    const existingIdx = db.publishedTeacherTimetables.findIndex(pt => pt.teacher.toLowerCase() === identifier.toLowerCase());
    const newEntry = {
      teacher: teacherName,
      slots: slots.map(s => ({ cohort: s.cohort, day: s.day, time: s.time, subject: s.subject })),
      publishedAt: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      db.publishedTeacherTimetables[existingIdx] = newEntry;
    } else {
      db.publishedTeacherTimetables.push(newEntry);
    }
  } else {
    return res.status(400).json({ error: 'Invalid type. Must be class or teacher.' });
  }

  writeDb(db);
  res.json({ message: 'Timetable published successfully.' });
};

export const createExamTimetableBulk = (req, res) => {
  const { examId, cohort, schedules } = req.body;
  if (!examId || !cohort || !Array.isArray(schedules)) {
    return res.status(400).json({ error: 'Missing required bulk exam timetable fields (examId, cohort, schedules).' });
  }

  const db = readDb();
  if (!db.examTimetables) db.examTimetables = [];

  // Remove existing entries for this exam and cohort
  db.examTimetables = db.examTimetables.filter(et => !(et.examId === examId && et.cohort === cohort));

  const [grade, section] = cohort.split('-');

  schedules.forEach((slot, index) => {
    if (slot.subject && slot.examDate) {
      db.examTimetables.push({
        id: `EXMT-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
        examId,
        subject: slot.subject,
        examDate: slot.examDate,
        startTime: slot.startTime || '',
        endTime: slot.endTime || '',
        duration: slot.duration || '3 Hours',
        roomAllocation: slot.roomAllocation || '',
        invigilator: slot.invigilator || '',
        cohort,
        grade: grade || '',
        section: section || ''
      });
    }
  });

  // Find parent exam and transition its status from Draft or Published to Scheduled, and reset published flag
  const exam = (db.exams || []).find(e => e.id === examId);
  if (exam) {
    if (exam.status === 'Draft' || exam.status === 'Published') {
      exam.status = 'Scheduled';
    }
    exam.timetablePublished = false;
  }

  writeDb(db);
  res.status(201).json({ message: 'Exam timetable updated successfully.' });
};

// =============================================
// 11. BULK RESULTS & CALCULATIONS CONTROLLERS
// =============================================
export const createResultBulk = (req, res) => {
  const { examId, subject, marksList, status, session } = req.body;
  if (!examId || !subject || !Array.isArray(marksList)) {
    return res.status(400).json({ error: 'Missing required bulk marks entry fields.' });
  }

  const db = readDb();
  const added = [];

  marksList.forEach((item, index) => {
    const { studentId, obtainedMarks, totalMarks, remarks } = item;
    if (!studentId || obtainedMarks === undefined || !totalMarks) return;

    const obt = parseFloat(obtainedMarks);
    const tot = parseFloat(totalMarks);
    const percentage = Math.round((obt / tot) * 100);

    // Grade mapping
    let grade = 'F';
    let gpa = 0.0;
    if (percentage >= 90) { grade = 'A+'; gpa = 4.0; }
    else if (percentage >= 80) { grade = 'A'; gpa = 3.7; }
    else if (percentage >= 70) { grade = 'B+'; gpa = 3.3; }
    else if (percentage >= 60) { grade = 'B'; gpa = 3.0; }
    else if (percentage >= 50) { grade = 'C'; gpa = 2.0; }
    else if (percentage >= 40) { grade = 'D'; gpa = 1.0; }
    else { grade = 'F'; gpa = 0.0; }

    const resultEntry = {
      id: `RST-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      studentId,
      examId,
      subject,
      obtainedMarks: obt,
      totalMarks: tot,
      percentage,
      grade,
      gpa,
      remarks: remarks || '',
      status: status || 'Draft',
      session: session || '2026-2027',
      rank: '-',
      updatedAt: new Date().toISOString()
    };

    const matchIdx = db.results.findIndex(r => r.studentId === studentId && r.examId === examId && r.subject.toLowerCase() === subject.toLowerCase());
    if (matchIdx !== -1) {
      if (db.results[matchIdx].locked) {
        return;
      }
      db.results[matchIdx] = { ...db.results[matchIdx], ...resultEntry, id: db.results[matchIdx].id };
      added.push(db.results[matchIdx]);
    } else {
      db.results.push(resultEntry);
      added.push(resultEntry);
    }
  });

  // Calculate subject ranks
  if (marksList.length > 0) {
    const firstStudent = (db.students || []).find(s => s.id === marksList[0].studentId);
    const targetClass = firstStudent ? firstStudent.studentClass : null;
    if (targetClass) {
      const classStudentIds = (db.students || []).filter(s => s.studentClass === targetClass && s.status === 'Active').map(s => s.id);
      const cohortResults = db.results.filter(r => r.examId === examId && r.subject.toLowerCase() === subject.toLowerCase() && classStudentIds.includes(r.studentId));
      cohortResults.sort((a, b) => b.percentage - a.percentage);
      cohortResults.forEach((resItem, index) => {
        const idxInDb = db.results.findIndex(r => r.id === resItem.id);
        if (idxInDb !== -1) {
          db.results[idxInDb].rank = index + 1;
        }
      });
    }
  }

  writeDb(db);
  res.json({ message: 'Bulk marks saved successfully.', count: added.length });
};


export const getOverallResults = (req, res) => {
  const db = readDb();
  const overall = (db.overallResults || []).map(o => {
    const student = (db.students || []).find(s => s.id === o.studentId);
    const exam = (db.exams || []).find(e => e.id === o.examId);
    return {
      ...o,
      studentName: student ? student.name : 'Unknown Student',
      studentRoll: student ? student.rollNumber || student.roll : 'N/A',
      studentPhoto: student ? student.photo : '',
      examName: exam ? exam.examName : 'Unknown Exam'
    };
  });
  res.json(overall);
};

export const createResultStudentBulk = (req, res) => {
  const { studentId, examId, resultsList, status, session } = req.body;
  if (!studentId || !examId || !Array.isArray(resultsList)) {
    return res.status(400).json({ error: 'Missing required student bulk marks entry fields.' });
  }

  const db = readDb();
  const student = (db.students || []).find(s => s.id === studentId);
  const targetClass = student ? student.studentClass : null;
  const added = [];

  resultsList.forEach((item, index) => {
    const { subject, obtainedMarks, totalMarks, remarks } = item;
    if (!subject || obtainedMarks === undefined || !totalMarks) return;

    const obt = parseFloat(obtainedMarks);
    const tot = parseFloat(totalMarks);
    const percentage = Math.round((obt / tot) * 100);

    // Grade mapping
    let grade = 'F';
    let gpa = 0.0;
    if (percentage >= 90) { grade = 'A+'; gpa = 4.0; }
    else if (percentage >= 80) { grade = 'A'; gpa = 3.7; }
    else if (percentage >= 70) { grade = 'B+'; gpa = 3.3; }
    else if (percentage >= 60) { grade = 'B'; gpa = 3.0; }
    else if (percentage >= 50) { grade = 'C'; gpa = 2.0; }
    else if (percentage >= 40) { grade = 'D'; gpa = 1.0; }
    else { grade = 'F'; gpa = 0.0; }

    const resultEntry = {
      id: `RST-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      studentId,
      examId,
      subject,
      obtainedMarks: obt,
      totalMarks: tot,
      percentage,
      grade,
      gpa,
      remarks: remarks || '',
      status: status || 'Draft',
      session: session || '2026-2027',
      rank: '-',
      updatedAt: new Date().toISOString()
    };

    if (!db.results) db.results = [];

    const matchIdx = db.results.findIndex(r => r.studentId === studentId && r.examId === examId && r.subject.toLowerCase() === subject.toLowerCase());
    if (matchIdx !== -1) {
      if (db.results[matchIdx].locked) {
        return;
      }
      db.results[matchIdx] = { ...db.results[matchIdx], ...resultEntry, id: db.results[matchIdx].id };
      added.push(db.results[matchIdx]);
    } else {
      db.results.push(resultEntry);
      added.push(resultEntry);
    }
    
    // Recalculate class ranks for this subject
    if (targetClass) {
      const classStudentIds = (db.students || []).filter(s => s.studentClass === targetClass && s.status === 'Active').map(s => s.id);
      const cohortResults = db.results.filter(r => 
        r.examId === examId && 
        r.subject.toLowerCase() === subject.toLowerCase() && 
        classStudentIds.includes(r.studentId)
      );
      cohortResults.sort((a, b) => b.percentage - a.percentage);
      cohortResults.forEach((resItem, idx) => {
        const idxInDb = db.results.findIndex(r => r.id === resItem.id);
        if (idxInDb !== -1) {
          db.results[idxInDb].rank = idx + 1;
        }
      });
    }
  });

  // Calculate overall result for this student and recalculate cohort ranks
  const studentResults = db.results.filter(r => r.studentId === studentId && r.examId === examId);
  if (studentResults.length > 0 && targetClass) {
    const totalObtained = studentResults.reduce((sum, r) => sum + r.obtainedMarks, 0);
    const totalMax = studentResults.reduce((sum, r) => sum + r.totalMarks, 0);
    const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    const avgGpa = studentResults.reduce((sum, r) => sum + r.gpa, 0) / studentResults.length;

    let overallGrade = 'F';
    if (percentage >= 90) overallGrade = 'A+';
    else if (percentage >= 80) overallGrade = 'A';
    else if (percentage >= 70) overallGrade = 'B+';
    else if (percentage >= 60) overallGrade = 'B';
    else if (percentage >= 50) overallGrade = 'C';
    else if (percentage >= 40) overallGrade = 'D';
    else overallGrade = 'F';

    const overallEntry = {
      id: `OVR-${examId}-${studentId}`,
      examId,
      cohort: targetClass,
      studentId,
      totalObtained,
      totalMax,
      percentage,
      gpa: avgGpa,
      grade: overallGrade,
      rank: '-',
      subjectsCount: studentResults.length,
      passStatus: percentage >= 40 ? 'Pass' : 'Fail',
      updatedAt: new Date().toISOString()
    };

    if (!db.overallResults) db.overallResults = [];
    const idx = db.overallResults.findIndex(o => o.examId === examId && o.studentId === studentId);
    if (idx !== -1) {
      db.overallResults[idx] = { ...db.overallResults[idx], ...overallEntry };
    } else {
      db.overallResults.push(overallEntry);
    }

    // Recalculate ranks for the cohort
    const cohortStudentIds = (db.students || []).filter(s => s.studentClass === targetClass && s.status === 'Active').map(s => s.id);
    const cohortOverallResults = db.overallResults.filter(o => o.examId === examId && cohortStudentIds.includes(o.studentId));
    cohortOverallResults.sort((a, b) => b.percentage - a.percentage);
    cohortOverallResults.forEach((ovItem, idx) => {
      const dbIdx = db.overallResults.findIndex(o => o.id === ovItem.id);
      if (dbIdx !== -1) {
        db.overallResults[dbIdx].rank = idx + 1;
      }
    });
  }

  writeDb(db);
  res.status(201).json({ message: 'Student results saved successfully.', count: added.length });
};

export const deleteStudentExamResults = (req, res) => {
  const { studentId, examId } = req.params;
  if (!studentId || !examId) {
    return res.status(400).json({ error: 'Student ID and Exam ID are required.' });
  }

  const db = readDb();

  // 1. Delete all subject-level results for this student and exam
  if (db.results) {
    db.results = db.results.filter(r => !(r.studentId === studentId && r.examId === examId));
  }

  // 2. Delete the overall result for this student and exam
  if (db.overallResults) {
    db.overallResults = db.overallResults.filter(o => !(o.studentId === studentId && o.examId === examId));
  }

  // 3. Recalculate ranks for the cohort
  const student = (db.students || []).find(s => s.id === studentId);
  const targetClass = student ? student.studentClass : null;
  if (targetClass && db.overallResults) {
    const cohortStudentIds = (db.students || []).filter(s => s.studentClass === targetClass && s.status === 'Active').map(s => s.id);
    const cohortOverallResults = db.overallResults.filter(o => o.examId === examId && cohortStudentIds.includes(o.studentId));
    cohortOverallResults.sort((a, b) => b.percentage - a.percentage);
    cohortOverallResults.forEach((ovItem, idx) => {
      const dbIdx = db.overallResults.findIndex(o => o.id === ovItem.id);
      if (dbIdx !== -1) {
        db.overallResults[dbIdx].rank = idx + 1;
      }
    });
  }

  writeDb(db);
  res.json({ message: 'Student exam result record deleted successfully.' });
};

export const submitCohortResults = (req, res) => {
  const { examId, cohort, section } = req.body;
  if (!examId || !cohort) {
    return res.status(400).json({ error: 'Exam ID and Cohort are required.' });
  }

  const db = readDb();
  
  // 1. Find all active students in this cohort and section
  const cohortStudents = (db.students || []).filter(s => 
    s.studentClass === cohort && 
    (!section || s.section === section) &&
    s.status === 'Active'
  );

  if (cohortStudents.length === 0) {
    return res.status(404).json({ error: 'No students found in this cohort.' });
  }

  const studentIds = cohortStudents.map(s => s.id);

  // 2. Find results for these students and this exam, and update their status to 'Submitted'
  let updatedCount = 0;
  if (db.results) {
    db.results.forEach(r => {
      if (r.examId === examId && studentIds.includes(r.studentId)) {
        r.status = 'Submitted';
        r.updatedAt = new Date().toISOString();
        updatedCount++;
      }
    });
  }

  // 3. Re-calculate overall results for each student in the cohort
  cohortStudents.forEach(student => {
    const studentResults = (db.results || []).filter(r => r.studentId === student.id && r.examId === examId);
    if (studentResults.length > 0) {
      const totalObtained = studentResults.reduce((sum, r) => sum + r.obtainedMarks, 0);
      const totalMax = studentResults.reduce((sum, r) => sum + r.totalMarks, 0);
      const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
      const avgGpa = studentResults.reduce((sum, r) => sum + r.gpa, 0) / studentResults.length;

      let overallGrade = 'F';
      if (percentage >= 90) overallGrade = 'A+';
      else if (percentage >= 80) overallGrade = 'A';
      else if (percentage >= 70) overallGrade = 'B+';
      else if (percentage >= 60) overallGrade = 'B';
      else if (percentage >= 50) overallGrade = 'C';
      else if (percentage >= 40) overallGrade = 'D';
      else overallGrade = 'F';

      const overallEntry = {
        id: `OVR-${examId}-${student.id}`,
        examId,
        cohort: cohort,
        studentId: student.id,
        totalObtained,
        totalMax,
        percentage,
        gpa: avgGpa,
        grade: overallGrade,
        rank: '-',
        subjectsCount: studentResults.length,
        passStatus: percentage >= 40 ? 'Pass' : 'Fail',
        updatedAt: new Date().toISOString()
      };

      if (!db.overallResults) db.overallResults = [];
      const idx = db.overallResults.findIndex(o => o.examId === examId && o.studentId === student.id);
      if (idx !== -1) {
        db.overallResults[idx] = { ...db.overallResults[idx], ...overallEntry };
      } else {
        db.overallResults.push(overallEntry);
      }
    }
  });

  // 4. Recalculate ranks for the cohort
  const cohortStudentIds = (db.students || []).filter(s => s.studentClass === cohort && s.status === 'Active').map(s => s.id);
  if (db.overallResults) {
    const cohortOverallResults = db.overallResults.filter(o => o.examId === examId && cohortStudentIds.includes(o.studentId));
    cohortOverallResults.sort((a, b) => b.percentage - a.percentage);
    cohortOverallResults.forEach((ovItem, idx) => {
      const dbIdx = db.overallResults.findIndex(o => o.id === ovItem.id);
      if (dbIdx !== -1) {
        db.overallResults[dbIdx].rank = idx + 1;
      }
    });
  }

  writeDb(db);
  res.json({ message: 'Cohort results submitted successfully.', count: updatedCount });
};

// =============================================
// 12. ENHANCED ACADEMIC CALENDAR CONTROLLER
// =============================================

const isValidDateString = (dateStr) => {
  if (!dateStr) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d);
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    const d = new Date(parts[2], parts[1] - 1, parts[0]);
    return d instanceof Date && !isNaN(d);
  }
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d);
};

const normalizeDateString = (dateStr) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    let day = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    let year = parseInt(parts[2]);
    if (month > 12 && day <= 12) {
      const tmp = day;
      day = month;
      month = tmp;
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } catch (e) {
    return dateStr;
  }
};

const isValidSessionString = (sessionStr) => {
  if (!sessionStr) return false;
  return /^\d{4}-\d{2,4}$/.test(sessionStr.trim());
};

// iCalendar (.ics) Parser Helper
const parseIcsData = (icsText) => {
  const events = [];
  const lines = icsText.split(/\r?\n/);
  let currentEvent = null;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT') && currentEvent) {
      events.push(currentEvent);
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.substring(8).trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.substring(12).trim();
      } else if (line.startsWith('CATEGORIES:')) {
        currentEvent.eventType = line.substring(11).trim();
      } else if (line.startsWith('COLOR:')) {
        currentEvent.color = line.substring(6).trim();
      } else if (line.startsWith('DTSTART')) {
        const parts = line.split(':');
        const val = parts.slice(1).join(':');
        if (val) {
          const cleanVal = val.replace(/[^0-9T]/g, '');
          const y = cleanVal.substring(0, 4);
          const m = cleanVal.substring(4, 6);
          const d = cleanVal.substring(6, 8);
          currentEvent.eventDate = `${y}-${m}-${d}`;
          if (cleanVal.includes('T')) {
            const timePart = cleanVal.split('T')[1];
            const hh = parseInt(timePart.substring(0, 2));
            const mm = timePart.substring(2, 4);
            const period = hh >= 12 ? 'PM' : 'AM';
            const displayHour = hh % 12 || 12;
            currentEvent.startTime = `${String(displayHour).padStart(2, '0')}:${mm} ${period}`;
          }
        }
      } else if (line.startsWith('DTEND')) {
        const parts = line.split(':');
        const val = parts.slice(1).join(':');
        if (val) {
          const cleanVal = val.replace(/[^0-9T]/g, '');
          if (cleanVal.includes('T')) {
            const timePart = cleanVal.split('T')[1];
            const hh = parseInt(timePart.substring(0, 2));
            const mm = timePart.substring(2, 4);
            const period = hh >= 12 ? 'PM' : 'AM';
            const displayHour = hh % 12 || 12;
            currentEvent.endTime = `${String(displayHour).padStart(2, '0')}:${mm} ${period}`;
          }
        }
      }
    }
  }
  return events;
};

// PDF Text Calendar Heuristic Extractor Helper
const parsePdfText = (text) => {
  const events = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const regexYMD = /\b(\d{4})-(\d{2})-(\d{2})\b/;
  const regexDMY = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/;
  const regexMonthDayYear = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b/i;

  const monthMap = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let matchedDate = null;
    let title = '';
    let eventType = 'Event';
    let description = '';
    let match;

    if ((match = line.match(regexYMD))) {
      matchedDate = `${match[1]}-${match[2]}-${match[3]}`;
    } else if ((match = line.match(regexDMY))) {
      let d = match[1].padStart(2, '0');
      let m = match[2].padStart(2, '0');
      let y = match[3];
      if (parseInt(m) > 12) {
        const tmp = d;
        d = m;
        m = tmp;
      }
      matchedDate = `${y}-${m}-${d}`;
    } else if ((match = line.match(regexMonthDayYear))) {
      const monthStr = match[1].toLowerCase();
      const m = monthMap[monthStr];
      const d = match[2].padStart(2, '0');
      const y = match[3];
      matchedDate = `${y}-${m}-${d}`;
    }

    if (matchedDate) {
      let cleanLine = line
        .replace(regexYMD, '')
        .replace(regexDMY, '')
        .replace(regexMonthDayYear, '')
        .trim();
      
      cleanLine = cleanLine.replace(/^[:\-\s\t|,]+/, '').trim();
      
      if (cleanLine.length > 0) {
        const lower = cleanLine.toLowerCase();
        if (lower.includes('holiday')) eventType = 'Holiday';
        else if (lower.includes('exam') || lower.includes('test')) eventType = 'Examination';
        else if (lower.includes('admission')) eventType = 'Admission';
        else if (lower.includes('fee') || lower.includes('deadline')) eventType = 'Fee Deadline';
        else if (lower.includes('meeting')) eventType = 'Meeting';
        
        const splitParts = cleanLine.split(/[:\-]/);
        if (splitParts.length > 1) {
          title = splitParts[0].trim();
          description = splitParts.slice(1).join('-').trim();
        } else {
          title = cleanLine;
        }
      } else {
        if (i + 1 < lines.length) {
          title = lines[i + 1].trim();
          i++;
        } else {
          title = 'Scheduled Event';
        }
      }

      if (!description && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!nextLine.match(regexYMD) && !nextLine.match(regexDMY) && !nextLine.match(regexMonthDayYear)) {
          description = nextLine.trim();
          i++;
        }
      }

      events.push({
        eventDate: matchedDate,
        title: title || 'Academic Event',
        eventType,
        description: description || 'Imported from PDF document',
        applicableClasses: 'All',
        session: '2026-27',
        color: '#6366f1',
        audience: 'All',
        recurring: 'None'
      });
    }
  }
  return events;
};

export const getCalendarEvents = (req, res) => {
  const db = readDb();
  let events = db.academicCalendarEvents || [];
  const { session } = req.query;
  if (session) {
    events = events.filter(e => e.session === session);
  }
  res.json(events);
};

export const createCalendarEvent = (req, res) => {
  const { 
    eventDate, title, eventType, description, applicableClasses, startTime, endTime, session,
    color, audience, recurring, reminders, attachments, notifications 
  } = req.body;
  if (!eventDate || !title || !eventType || !session) {
    return res.status(400).json({ error: 'Date, Title, Type, and Session are required.' });
  }
  const db = readDb();
  const newEvent = {
    id: `EVTCAL-${Date.now()}`,
    eventDate,
    title,
    eventType,
    description: description || '',
    applicableClasses: applicableClasses || 'All',
    startTime: startTime || '',
    endTime: endTime || '',
    session,
    color: color || '#6366f1',
    audience: audience || 'All',
    recurring: recurring || 'None',
    reminders: reminders || null,
    attachments: attachments || null,
    notifications: notifications || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!db.academicCalendarEvents) db.academicCalendarEvents = [];
  db.academicCalendarEvents.push(newEvent);
  addActivity(db, 'alert', 'New Calendar Event', `Event "${title}" declared for ${eventDate}`, 'hsl(var(--color-primary))', 'rgba(hsl(var(--color-primary)), 0.1)');
  writeDb(db);
  res.status(201).json(newEvent);
};

export const updateCalendarEvent = (req, res) => {
  const { id } = req.params;
  const { 
    eventDate, title, eventType, description, applicableClasses, startTime, endTime, session,
    color, audience, recurring, reminders, attachments, notifications 
  } = req.body;
  const db = readDb();
  if (!db.academicCalendarEvents) db.academicCalendarEvents = [];
  const idx = db.academicCalendarEvents.findIndex(e => e.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Calendar event not found.' });
  }
  db.academicCalendarEvents[idx] = {
    ...db.academicCalendarEvents[idx],
    eventDate: eventDate || db.academicCalendarEvents[idx].eventDate,
    title: title || db.academicCalendarEvents[idx].title,
    eventType: eventType || db.academicCalendarEvents[idx].eventType,
    description: description !== undefined ? description : db.academicCalendarEvents[idx].description,
    applicableClasses: applicableClasses !== undefined ? applicableClasses : db.academicCalendarEvents[idx].applicableClasses,
    startTime: startTime !== undefined ? startTime : db.academicCalendarEvents[idx].startTime,
    endTime: endTime !== undefined ? endTime : db.academicCalendarEvents[idx].endTime,
    session: session || db.academicCalendarEvents[idx].session,
    color: color || db.academicCalendarEvents[idx].color || '#6366f1',
    audience: audience || db.academicCalendarEvents[idx].audience || 'All',
    recurring: recurring || db.academicCalendarEvents[idx].recurring || 'None',
    reminders: reminders !== undefined ? reminders : db.academicCalendarEvents[idx].reminders,
    attachments: attachments !== undefined ? attachments : db.academicCalendarEvents[idx].attachments,
    notifications: notifications !== undefined ? notifications : db.academicCalendarEvents[idx].notifications,
    updatedAt: new Date().toISOString()
  };
  if (db.publishedCalendarEvents) {
    db.publishedCalendarEvents = db.publishedCalendarEvents.filter(eventId => eventId !== id);
  }
  writeDb(db);
  res.json(db.academicCalendarEvents[idx]);
};

export const deleteCalendarEvent = (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.academicCalendarEvents) db.academicCalendarEvents = [];
  const initialLen = db.academicCalendarEvents.length;
  db.academicCalendarEvents = db.academicCalendarEvents.filter(e => e.id !== id);
  if (db.academicCalendarEvents.length === initialLen) {
    return res.status(404).json({ error: 'Calendar event not found.' });
  }
  if (db.publishedCalendarEvents) {
    db.publishedCalendarEvents = db.publishedCalendarEvents.filter(eventId => eventId !== id);
  }
  writeDb(db);
  res.json({ message: 'Calendar event deleted successfully.' });
};

export const getCalendarImports = (req, res) => {
  const db = readDb();
  res.json(db.academicCalendarImports || []);
};

export const uploadCalendarFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const fileName = req.file.originalname;
  const lowerName = fileName.toLowerCase();

  try {
    let rawEvents = [];

    if (lowerName.endsWith('.ics')) {
      const icsText = req.file.buffer.toString('utf8');
      rawEvents = parseIcsData(icsText);
    } else if (lowerName.endsWith('.pdf')) {
      const parser = new PDFParse({ data: req.file.buffer });
      const parsedPdf = await parser.getText();
      rawEvents = parsePdfText(parsedPdf.text);
    } else {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, defval: '' });

      const getVal = (row, possibleKeys) => {
        for (const key of Object.keys(row)) {
          const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '');
          if (possibleKeys.includes(cleanKey)) {
            return String(row[key]).trim();
          }
        }
        return '';
      };

      rawEvents = rawRows.map(row => ({
        eventDate: getVal(row, ['date']),
        title: getVal(row, ['eventtitle', 'title']),
        eventType: getVal(row, ['eventtype', 'type']),
        description: getVal(row, ['description', 'desc']),
        applicableClasses: getVal(row, ['applicableclasses', 'classes']) || 'All',
        startTime: getVal(row, ['starttime']),
        endTime: getVal(row, ['endtime']),
        session: getVal(row, ['academicsession', 'session']),
        color: getVal(row, ['color']) || '#6366f1',
        audience: getVal(row, ['audience']) || 'All',
        recurring: getVal(row, ['recurring', 'repeat']) || 'None'
      }));
    }

    const validatedRows = rawEvents.map((evt, index) => {
      const rowNum = index + 1;
      const errors = [];
      
      const rawDate = evt.eventDate;
      const title = evt.title;
      const eventType = evt.eventType;
      const session = evt.session || '2026-27';

      if (!title) {
        errors.push('Event Title is required.');
      }
      if (!eventType) {
        errors.push('Event Type is required.');
      }
      if (!rawDate) {
        errors.push('Date is required.');
      } else if (!isValidDateString(rawDate)) {
        errors.push(`Invalid Date format: "${rawDate}". Use YYYY-MM-DD or DD/MM/YYYY.`);
      }
      if (!session) {
        errors.push('Academic Session is required.');
      } else if (!isValidSessionString(session)) {
        errors.push(`Invalid Academic Session format: "${session}". Use YYYY-YY or YYYY-YYYY.`);
      }

      const normalizedDate = rawDate && isValidDateString(rawDate) ? normalizeDateString(rawDate) : rawDate;

      return {
        rowNumber: rowNum,
        isValid: errors.length === 0,
        errors,
        data: {
          eventDate: normalizedDate,
          title: title || 'Academic Event',
          eventType: eventType || 'Custom Event',
          description: evt.description || '',
          applicableClasses: evt.applicableClasses || 'All',
          startTime: evt.startTime || '',
          endTime: evt.endTime || '',
          session,
          color: evt.color || '#6366f1',
          audience: evt.audience || 'All',
          recurring: evt.recurring || 'None',
          reminders: evt.reminders || null,
          attachments: evt.attachments || null,
          notifications: evt.notifications || null
        }
      };
    });

    const totalRecords = validatedRows.length;
    const invalidRecords = validatedRows.filter(r => !r.isValid).length;

    res.json({
      fileName,
      totalRecords,
      invalidRecords,
      rows: validatedRows
    });
  } catch (err) {
    console.error('[Upload Parse Error]', err);
    res.status(500).json({ error: 'Failed to process file. Ensure it is a valid format (Excel, CSV, ICS, or PDF).' });
  }
};

export const confirmCalendarImport = (req, res) => {
  const { fileName, session, events, replaceExisting } = req.body;
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'No events provided for import.' });
  }

  const db = readDb();
  if (!db.academicCalendarEvents) db.academicCalendarEvents = [];
  if (!db.academicCalendarImports) db.academicCalendarImports = [];

  const targetSession = session || events[0].session || '2026-27';

  if (replaceExisting) {
    db.academicCalendarEvents = db.academicCalendarEvents.filter(e => e.session !== targetSession);
  }

  const importedEvents = events.map(evt => ({
    id: `EVTCAL-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    eventDate: evt.eventDate,
    title: evt.title,
    eventType: evt.eventType,
    description: evt.description || '',
    applicableClasses: evt.applicableClasses || 'All',
    startTime: evt.startTime || '',
    endTime: evt.endTime || '',
    session: evt.session,
    color: evt.color || '#6366f1',
    audience: evt.audience || 'All',
    recurring: evt.recurring || 'None',
    reminders: evt.reminders || null,
    attachments: evt.attachments || null,
    notifications: evt.notifications || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  db.academicCalendarEvents.push(...importedEvents);

  const newImport = {
    id: `IMP-${Date.now()}`,
    fileName: fileName || 'Uploaded_File',
    importDate: new Date().toISOString(),
    importedBy: 'School Admin',
    totalRecords: importedEvents.length,
    session: session || importedEvents[0].session || '2026-27'
  };
  db.academicCalendarImports.push(newImport);

  addActivity(db, 'alert', 'Academic Calendar Imported', `Imported ${importedEvents.length} events from ${newImport.fileName}`, 'hsl(var(--color-primary))', 'rgba(hsl(var(--color-primary)), 0.1)');
  
  writeDb(db);
  res.status(201).json({ message: 'Import confirmed successfully.', totalRecords: importedEvents.length });
};

export const downloadCalendarTemplate = (req, res) => {
  const headers = ['Date', 'Event Title', 'Event Type', 'Description', 'Applicable Classes', 'Start Time', 'End Time', 'Academic Session', 'Color', 'Audience', 'Recurring'];
  const sampleRow = ['2026-07-15', 'Annual Sports Meet', 'Sports Event', 'Annual track and field championship events', 'All', '09:00 AM', '04:00 PM', '2026-27', '#3b82f6', 'All', 'None'];
  const sampleRow2 = ['2026-08-10', 'Mid-Term Examinations', 'Examination', 'First semester written tests', 'Grade I, Grade II', '10:00 AM', '01:00 PM', '2026-27', '#ec4899', 'Student,Parent', 'None'];
  
  const csvContent = [
    headers.join(','),
    sampleRow.map(v => `"${v.replace(/"/g, '""')}"`).join(','),
    sampleRow2.map(v => `"${v.replace(/"/g, '""')}"`).join(',')
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=Academic_Calendar_Template.csv');
  res.status(200).send(csvContent);
};

export const exportCalendarEvents = (req, res) => {
  const db = readDb();
  let events = db.academicCalendarEvents || [];
  const { session, format = 'ics' } = req.query;

  if (session) {
    events = events.filter(e => e.session === session);
  }

  if (format === 'ics') {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//School Management ERP//Academic Calendar//EN\nCALSCALE:GREGORIAN\n';
    
    events.forEach(e => {
      icsContent += 'BEGIN:VEVENT\n';
      icsContent += `UID:EVT-${e.id}@school-erp.com\n`;
      icsContent += `DTSTAMP:${new Date(e.createdAt || Date.now()).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}\n`;
      
      const dateNoDash = e.eventDate.replace(/-/g, '');
      icsContent += `DTSTART;VALUE=DATE:${dateNoDash}\n`;
      const nextDay = new Date(new Date(e.eventDate).getTime() + 24 * 60 * 60 * 1000);
      const nextDayStr = nextDay.toISOString().split('T')[0].replace(/-/g, '');
      icsContent += `DTEND;VALUE=DATE:${nextDayStr}\n`;
      
      icsContent += `SUMMARY:${e.title}\n`;
      icsContent += `DESCRIPTION:${(e.description || '').replace(/\n/g, '\\n')}\n`;
      icsContent += `CATEGORIES:${e.eventType}\n`;
      icsContent += `COLOR:${e.color || '#6366f1'}\n`;
      icsContent += 'END:VEVENT\n';
    });
    
    icsContent += 'END:VCALENDAR';
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename=Academic_Calendar_${session || 'All'}.ics`);
    return res.status(200).send(icsContent);
  } else if (format === 'excel' || format === 'csv') {
    const headers = [
      'Date', 'Event Title', 'Event Type', 'Description', 'Applicable Classes', 
      'Start Time', 'End Time', 'Academic Session', 'Color', 'Audience', 'Recurring'
    ];
    const dataRows = events.map(e => [
      e.eventDate, e.title, e.eventType, e.description || '', e.applicableClasses || 'All',
      e.startTime || '', e.endTime || '', e.session, e.color || '#6366f1', e.audience || 'All', e.recurring || 'None'
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Academic Calendar');
    
    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Academic_Calendar_${session || 'All'}.csv`);
      return res.status(200).send(csv);
    } else {
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Academic_Calendar_${session || 'All'}.xlsx`);
      return res.status(200).send(buffer);
    }
  } else {
    return res.status(400).json({ error: 'Unsupported format. Use ics, excel, or csv.' });
  }
};

export const getPublishedEvents = (req, res) => {
  const db = readDb();
  res.json(db.publishedCalendarEvents || []);
};

export const publishEvent = (req, res) => {
  const { eventId } = req.body;
  if (!eventId) return res.status(400).json({ error: 'eventId is required' });
  const db = readDb();
  if (!db.publishedCalendarEvents) db.publishedCalendarEvents = [];
  if (!db.publishedCalendarEvents.includes(eventId)) {
    db.publishedCalendarEvents.push(eventId);
  }
  writeDb(db);
  res.json({ message: 'Event published successfully', publishedEvents: db.publishedCalendarEvents });
};

export const unpublishEvent = (req, res) => {
  const { eventId } = req.body;
  if (!eventId) return res.status(400).json({ error: 'eventId is required' });
  const db = readDb();
  if (!db.publishedCalendarEvents) db.publishedCalendarEvents = [];
  db.publishedCalendarEvents = db.publishedCalendarEvents.filter(id => id !== eventId);
  writeDb(db);
  res.json({ message: 'Event unpublished successfully', publishedEvents: db.publishedCalendarEvents });
};




