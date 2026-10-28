/**
 * Controller for Auto Class Timetable
 * 
 * Handles:
 * - Single-source-of-truth grade-subject-teacher mappings
 * - Pre-generation diagnostics
 * - Subject periods per week settings
 * - AI rules translation
 * - Draft generation (without saving)
 * - Swap / move live validation
 * - Atomic persistence with server re-validation
 * - Class-wise and Teacher-wise timetable views
 */

import { readDb, writeDb, isSqlActive } from '../utils/db.js';
import {
  generateWeeklyTimetable,
  runTimetableDiagnostics,
  validateSwapMove,
  isBreakSlot,
  normalizeGradeStr
} from '../utils/classTimetableEngine.js';
import { callTimetableAiRules } from '../utils/classTimetableAi.js';

/**
 * Builds the canonical list of (grade, subject, teacher) mappings from existing teacher data.
 * This is the SINGLE SOURCE OF TRUTH.
 */
export function getGradeSubjectTeachers(tenantId) {
  const db = readDb(tenantId);
  const teachers = (db.teachers || []).filter(t => t.status === 'Active' || !t.status);
  const mappings = [];

  teachers.forEach(teacher => {
    const teacherId = teacher.employeeId || teacher.id;
    const teacherName = teacher.fullName || teacher.name || 'Unnamed Teacher';
    const isClassTeacher = Boolean(
      teacher.isClassTeacher === true ||
      teacher.isClassTeacher === 1 ||
      teacher.isClassTeacher === 'Yes' ||
      teacher.isClassTeacher === 'true'
    );
    const assignedGradeId = teacher.assignedGradeId || null;
    const assignedSectionId = teacher.assignedSectionId || null;

    // 1. Gather all subjects for this teacher
    const subjects = new Set();
    if (teacher.primarySubject) {
      teacher.primarySubject.split(/[,/]+/).forEach(s => {
        const clean = s.trim();
        if (clean) subjects.add(clean);
      });
    }
    if (teacher.secondarySubject) {
      teacher.secondarySubject.split(/[,/]+/).forEach(s => {
        const clean = s.trim();
        if (clean) subjects.add(clean);
      });
    }
    if (teacher.subject) subjects.add(teacher.subject.trim());
    if (teacher.subjectSpecialization) subjects.add(teacher.subjectSpecialization.trim());

    // 2. Gather all assigned grades for this teacher
    let teachingGrades = teacher.teachingGrades || [];
    if (typeof teachingGrades === 'string' && teachingGrades.trim()) {
      try {
        teachingGrades = JSON.parse(teachingGrades);
      } catch (e) {
        teachingGrades = teachingGrades.split(',').map(g => g.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(teachingGrades)) teachingGrades = [];

    // Fallback: If no explicit teachingGrades array is set, but assignedGradeId is present
    if (teachingGrades.length === 0 && assignedGradeId) {
      teachingGrades = [assignedGradeId];
    }

    // 3. For every subject S and every grade G, link (G, S, teacher)
    subjects.forEach(subject => {
      teachingGrades.forEach(grade => {
        mappings.push({
          grade: String(grade).trim(),
          subject,
          teacherId,
          teacherName,
          isClassTeacher,
          assignedGradeId,
          assignedSectionId
        });
      });
    });
  });

  // Also incorporate any subjects defined in db.subjects (grade, subject, teacherName)
  (db.subjects || []).forEach(sub => {
    const grade = sub.grade || sub.classId;
    const subject = sub.subjectName || sub.name;
    const teacherName = sub.teacherName || sub.teacher || '';
    if (grade && subject) {
      const exists = mappings.some(m =>
        normalizeGradeStr(m.grade) === normalizeGradeStr(grade) &&
        m.subject.toLowerCase() === subject.trim().toLowerCase()
      );
      if (!exists) {
        mappings.push({
          grade: String(grade).trim(),
          subject: subject.trim(),
          teacherId: '',
          teacherName: teacherName.trim(),
          isClassTeacher: false,
          assignedGradeId: null,
          assignedSectionId: null
        });
      }
    }
  });

  // Also incorporate default subjects from db.grades
  (db.grades || []).forEach(g => {
    const grade = g.name || g.id;
    (g.subjects || []).forEach(subName => {
      const exists = mappings.some(m =>
        normalizeGradeStr(m.grade) === normalizeGradeStr(grade) &&
        m.subject.toLowerCase() === String(subName).trim().toLowerCase()
      );
      if (!exists) {
        mappings.push({
          grade: String(grade).trim(),
          subject: String(subName).trim(),
          teacherId: '',
          teacherName: '',
          isClassTeacher: false,
          assignedGradeId: null,
          assignedSectionId: null
        });
      }
    });
  });

  return mappings;
}

/**
 * 1. GET /api/timetable/grade-subject-teachers
 */
export const getGradeSubjectTeachersHandler = (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    const mappings = getGradeSubjectTeachers(tenantId);
    res.json(mappings);
  } catch (err) {
    console.error('[Timetable Mapping Error]', err);
    res.status(500).json({ error: 'Failed to retrieve grade-subject-teacher mappings.' });
  }
};

/**
 * 2. GET /api/timetable/diagnostics
 */
export const getDiagnosticsHandler = (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    const db = readDb(tenantId);
    const slots = db.timeslots || [];
    const mappings = getGradeSubjectTeachers(tenantId);
    const settings = db.subject_period_settings || [];

    const periodsPerWeek = {};
    settings.forEach(s => {
      periodsPerWeek[`${s.grade}_${s.subject}`] = s.periods_per_week;
    });

    const selectedGrades = req.query.grades ? String(req.query.grades).split(',').map(g => g.trim()).filter(Boolean) : [];

    const diagnostics = runTimetableDiagnostics({
      slots,
      gradeSubjectTeachers: mappings,
      periodsPerWeek,
      selectedGrades
    });

    res.json(diagnostics);
  } catch (err) {
    console.error('[Timetable Diagnostics Error]', err);
    res.status(500).json({ error: 'Failed to run timetable diagnostics.' });
  }
};

/**
 * 3. GET /api/timetable/subject-settings
 */
export const getSubjectSettingsHandler = (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    const db = readDb(tenantId);
    const settings = db.subject_period_settings || [];
    res.json(settings);
  } catch (err) {
    console.error('[Subject Settings Error]', err);
    res.status(500).json({ error: 'Failed to retrieve subject settings.' });
  }
};

/**
 * 4. POST /api/timetable/subject-settings
 */
export const saveSubjectSettingsHandler = (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings payload must be an array.' });
    }

    const db = readDb(tenantId);
    if (!db.subject_period_settings) db.subject_period_settings = [];

    settings.forEach(item => {
      const idx = db.subject_period_settings.findIndex(
        s => normalizeGradeStr(s.grade) === normalizeGradeStr(item.grade) &&
             s.subject.toLowerCase() === item.subject.toLowerCase()
      );

      const entry = {
        id: item.id || `set-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        grade: item.grade,
        subject: item.subject,
        periods_per_week: Number(item.periods_per_week) || 5,
        needs_double_period: Boolean(item.needs_double_period),
        updatedAt: new Date().toISOString()
      };

      if (idx !== -1) {
        db.subject_period_settings[idx] = { ...db.subject_period_settings[idx], ...entry };
      } else {
        db.subject_period_settings.push(entry);
      }
    });

    writeDb(db, tenantId);
    res.json({ success: true, count: settings.length });
  } catch (err) {
    console.error('[Save Subject Settings Error]', err);
    res.status(500).json({ error: 'Failed to save subject settings.' });
  }
};

/**
 * 5. POST /api/timetable/ai/rules
 */
export const aiRulesHandler = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Please provide text description for rule extraction.' });
    }

    const tenantId = req.headers['x-tenant-id'] || 'default';
    const db = readDb(tenantId);
    const mappings = getGradeSubjectTeachers(tenantId);

    const validGrades = Array.from(new Set(mappings.map(m => m.grade))).filter(Boolean);
    const validSubjects = Array.from(new Set(mappings.map(m => m.subject))).filter(Boolean);
    const validTeachers = Array.from(new Set(mappings.map(m => m.teacherName))).filter(Boolean);

    const result = await callTimetableAiRules({
      text,
      validGrades,
      validSubjects,
      validTeachers,
      rateLimitKey: req.ip || tenantId
    });

    res.json(result);
  } catch (err) {
    console.error('[AI Rules Error]', err);
    res.status(500).json({ error: 'Internal error processing AI timetable rules.' });
  }
};

/**
 * 6. POST /api/timetable/generate (In-memory draft generator)
 */
export const generateDraftHandler = (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    const {
      selectedGrades = [],
      targetGrades = [],
      targetCohorts = [],
      gradeSections = {},
      periodsPerWeek = {},
      doublePeriods = {},
      teacherConstraints = {},
      lockedSlots = [],
      seed = 42
    } = req.body;

    const db = readDb(tenantId);
    const slots = db.timeslots || [];
    const allMappings = getGradeSubjectTeachers(tenantId);

    const gradesInput = selectedGrades.length > 0 ? selectedGrades : targetGrades;

    // Expand grades into targetCohorts if targetCohorts not passed
    let cohortsList = Array.isArray(targetCohorts) && targetCohorts.length > 0 ? [...targetCohorts] : [];
    if (cohortsList.length === 0 && gradesInput.length > 0) {
      gradesInput.forEach(g => {
        const gradeObj = (db.grades || []).find(gr => normalizeGradeStr(gr.name || gr.id) === normalizeGradeStr(g));
        const secs = gradeObj && Array.isArray(gradeObj.sections) && gradeObj.sections.length > 0
          ? gradeObj.sections
          : ['A'];
        secs.forEach(s => cohortsList.push(`${g}-${s}`));
      });
    }

    // Determine grades represented in cohorts
    const representedGrades = cohortsList.length > 0
      ? Array.from(new Set(cohortsList.map(c => c.split('-')[0].trim())))
      : gradesInput;

    // Filter mappings to selected/represented grades if specified
    const activeMappings = representedGrades.length > 0
      ? allMappings.filter(m => representedGrades.map(normalizeGradeStr).includes(normalizeGradeStr(m.grade)))
      : allMappings;

    // Fallback if any represented grade has no mapped subjects
    representedGrades.forEach(g => {
      const gMaps = activeMappings.filter(m => normalizeGradeStr(m.grade) === normalizeGradeStr(g));
      if (gMaps.length === 0) {
        const fallbackSubs = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Physical Education'];
        fallbackSubs.forEach(sub => {
          activeMappings.push({
            grade: g,
            subject: sub,
            teacherId: '',
            teacherName: '',
            isClassTeacher: false,
            assignedGradeId: null,
            assignedSectionId: null
          });
        });
      }
    });

    // Load stored settings if not passed in body
    const finalPeriods = { ...periodsPerWeek };
    const finalDoubles = { ...doublePeriods };
    (db.subject_period_settings || []).forEach(s => {
      const key = `${s.grade}_${s.subject}`;
      if (finalPeriods[key] === undefined) finalPeriods[key] = s.periods_per_week;
      if (finalDoubles[key] === undefined) finalDoubles[key] = s.needs_double_period;
    });

    const result = generateWeeklyTimetable({
      slots,
      gradeSubjectTeachers: activeMappings,
      periodsPerWeek: finalPeriods,
      doublePeriods: finalDoubles,
      teacherConstraints,
      lockedSlots,
      targetCohorts: cohortsList,
      gradeSections,
      seed,
      timeoutMs: 9500
    });

    res.json({
      success: true,
      data: result,
      ...result
    });
  } catch (err) {
    console.error('[Timetable Generation Error]', err);
    res.status(500).json({ error: 'Failed to generate timetable draft.' });
  }
};

/**
 * 7. POST /api/timetable/validate-move (Live clash check for swap)
 */
export const validateMoveHandler = (req, res) => {
  try {
    const { grid, from, to, teacherConstraints = {} } = req.body;
    if (!grid || !from || !to) {
      return res.status(400).json({ valid: false, reason: 'Missing grid or move parameters.' });
    }

    const validation = validateSwapMove({ grid, from, to, teacherConstraints });
    res.json(validation);
  } catch (err) {
    console.error('[Validate Move Error]', err);
    res.status(500).json({ valid: false, reason: 'Internal error validating period move.' });
  }
};

/**
 * 8. POST /api/timetable/save (Atomic save with server re-validation)
 */
export const saveTimetableHandler = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    const { entries = [], versionName = 'Weekly Schedule' } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'No timetable entries provided to save.' });
    }

    // SERVER-SIDE RE-VALIDATION OF ALL HARD RULES
    const teacherSlotMap = {}; // teacherId -> slotKey -> cohort

    for (const item of entries) {
      const { grade, day, periodIndex, subject, teacherId, teacherName } = item;
      const cohortKey = item.cohort || `${grade}-${item.section || 'A'}`;

      // Hard Rule 1: Break slots cannot have teaching lessons
      if (isBreakSlot(item.timeSlot)) {
        return res.status(400).json({
          error: `Hard rule violation: Lesson "${subject}" scheduled in break slot "${item.timeSlot}".`
        });
      }

      // Hard Rule 2: Teacher cannot teach two different classes at the same time
      if (teacherId) {
        const slotKey = `${day}_${periodIndex}`;
        if (!teacherSlotMap[teacherId]) teacherSlotMap[teacherId] = {};
        if (teacherSlotMap[teacherId][slotKey] && teacherSlotMap[teacherId][slotKey] !== cohortKey) {
          return res.status(400).json({
            error: `Hard rule violation: Teacher "${teacherName}" is double-booked on ${day} period ${Number(periodIndex) + 1} across ${teacherSlotMap[teacherId][slotKey]} and ${cohortKey}.`
          });
        }
        teacherSlotMap[teacherId][slotKey] = cohortKey;
      }
    }

    const db = readDb(tenantId);
    if (!db.class_timetable_entries) db.class_timetable_entries = [];
    if (!db.class_timetable_versions) db.class_timetable_versions = [];

    // Increment version
    const nextVersion = (db.class_timetable_versions.reduce((max, v) => Math.max(max, v.version || 0), 0)) + 1;

    const formattedEntries = entries.map((e, idx) => ({
      id: `cte-${Date.now()}-${idx}`,
      grade: e.grade,
      section: e.section || 'A',
      day: e.day,
      period_no: Number(e.periodNo || e.period_no || (Number(e.periodIndex) + 1)),
      time_slot: e.timeSlot || e.time_slot || '',
      subject: e.subject,
      teacher_id: e.teacherId || e.teacher_id || '',
      teacher_name: e.teacherName || e.teacher_name || '',
      is_locked: e.isLocked ? 1 : 0,
      version: nextVersion,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Save entries
    db.class_timetable_entries = formattedEntries;

    // Save version metadata
    db.class_timetable_versions.push({
      id: `ver-${Date.now()}`,
      version: nextVersion,
      name: versionName,
      status: 'Published',
      generatedAt: new Date().toISOString(),
      tenantId
    });

    // Sync to db.timetables for seamless display in AcademicPanel
    if (!db.timetables) db.timetables = [];
    const savedCohorts = new Set(formattedEntries.map(e => `${e.grade}-${e.section || 'A'}`));
    db.timetables = db.timetables.filter(t => !savedCohorts.has(t.cohort));
    formattedEntries.forEach((e, idx) => {
      if (e.subject && !isBreakSlot(e.time_slot)) {
        db.timetables.push({
          id: `TT-AUTO-${Date.now()}-${idx}`,
          cohort: `${e.grade}-${e.section || 'A'}`,
          day: e.day,
          time: e.time_slot,
          subject: e.subject,
          teacher: e.teacher_name,
          room: '',
          session: '2026-2027'
        });
      }
    });

    writeDb(db, tenantId);

    res.json({
      success: true,
      message: 'Timetable verified and saved successfully in one transaction.',
      version: nextVersion,
      count: formattedEntries.length
    });
  } catch (err) {
    console.error('[Save Timetable Error]', err);
    res.status(500).json({ error: 'Failed to save class timetable.' });
  }
};

/**
 * 9. GET /api/timetable/class-view
 */
export const getClassViewHandler = (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    const db = readDb(tenantId);
    const entries = db.class_timetable_entries || [];
    const requestedGrade = req.query.grade;

    const filtered = requestedGrade
      ? entries.filter(e => normalizeGradeStr(e.grade) === normalizeGradeStr(requestedGrade))
      : entries;

    res.json(filtered);
  } catch (err) {
    console.error('[Class View Error]', err);
    res.status(500).json({ error: 'Failed to load class timetable view.' });
  }
};

/**
 * 10. GET /api/timetable/teacher-view
 */
export const getTeacherViewHandler = (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    const db = readDb(tenantId);
    const entries = db.class_timetable_entries || [];
    const requestedTeacher = req.query.teacherId || req.query.teacher;

    const filtered = requestedTeacher
      ? entries.filter(e => e.teacher_id === requestedTeacher || e.teacher_name.toLowerCase() === requestedTeacher.toLowerCase())
      : entries;

    res.json(filtered);
  } catch (err) {
    console.error('[Teacher View Error]', err);
    res.status(500).json({ error: 'Failed to load teacher timetable view.' });
  }
};
