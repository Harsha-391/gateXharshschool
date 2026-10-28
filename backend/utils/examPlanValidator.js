/**
 * Exam Plan Validator & Database Normalizer
 * Validates raw AI JSON output against actual school DB records (grades, subjects, sessions).
 * Enforces strict business rules, defaults, deduplication, and missing-field extraction.
 */

import { convertToRoman, getGradeSortRank } from './db.js';

// Standard Roman numerals mapping to ordinal indices (1-indexed)
const ROMAN_NUMERALS_MAP = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
  'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12
};

export function romanOrNumToNumber(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim().toUpperCase().replace(/^(GRADE|CLASS|STD|STANDARD)\s*/i, '');
  if (ROMAN_NUMERALS_MAP[str]) return ROMAN_NUMERALS_MAP[str];
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) return num;
  return null;
}

/**
 * Maps a gradeFrom and gradeTo pair to matching active grades from the database.
 * If 11 or 12 without stream is requested, matches all stream variations.
 */
export function resolveGradeRange(gradeFrom, gradeTo, availableGrades = []) {
  const fromNum = romanOrNumToNumber(gradeFrom);
  const toNum = romanOrNumToNumber(gradeTo) || fromNum;

  if (!fromNum && !toNum) {
    // If not standard 1-12 range, try matching by name directly
    const directMatches = availableGrades.filter(g => {
      const gName = (g.name || g).toString().toLowerCase();
      const target = (gradeFrom || '').toString().toLowerCase();
      return gName === target || gName.includes(target);
    });
    return directMatches.map(g => g.name || g);
  }

  const start = Math.min(fromNum || toNum, toNum || fromNum);
  const end = Math.max(fromNum || toNum, toNum || fromNum);

  const matchedGradeNames = [];

  for (let n = start; n <= end; n++) {
    // Find all grades matching this standard number
    const matching = availableGrades.filter(g => {
      const name = (g.name || g).toString();
      const num = romanOrNumToNumber(name);
      return num === n;
    });

    if (matching.length > 0) {
      matching.forEach(m => matchedGradeNames.push(m.name || m));
    } else {
      // Fallback synthetic name if not found in db
      matchedGradeNames.push(`Grade ${n}`);
    }
  }

  return [...new Set(matchedGradeNames)];
}

/**
 * Validates and normalizes AI plan against school database.
 *
 * @param {Object} aiOutput - Raw JSON output from AI model
 * @param {Object} context
 * @param {Array<Object>} context.dbGrades - Active grades from database
 * @param {Array<Object>} context.dbSubjects - Active subjects from database
 * @param {Array<string>} context.allowedExamTypes - Valid exam types
 * @param {string} context.currentSession - Current active session
 * @param {string} context.today - Current local date (YYYY-MM-DD)
 * @returns {Object} Validated plan result
 */
export function validateAndNormalizeExamPlan(aiOutput, {
  dbGrades = [],
  dbSubjects = [],
  allowedExamTypes = [],
  currentSession = '2026-2027',
  today = new Date().toISOString().split('T')[0]
}) {
  const notices = [];
  const warnings = [];
  const missingQuestions = [];

  if (!aiOutput || typeof aiOutput !== 'object') {
    return {
      ok: false,
      error: 'Invalid AI response structure. Please specify details manually.'
    };
  }

  // Text is unrelated to exams or missing required schema
  if (!aiOutput.examType && (!Array.isArray(aiOutput.groups) || aiOutput.groups.length === 0)) {
    return {
      ok: false,
      error: 'I could not find exam details. Please rewrite or fill manually.'
    };
  }

  // 1. Exam Type Validation
  let examType = aiOutput.examType || null;
  if (examType) {
    const match = allowedExamTypes.find(t => t.toLowerCase() === examType.toLowerCase());
    if (match) {
      examType = match;
    } else {
      warnings.push(`Exam type "${examType}" is not in standard list; listed in missing.`);
      examType = null;
    }
  }
  if (!examType) {
    missingQuestions.push({
      field: 'examType',
      question: 'Which type of examination is this?',
      type: 'select',
      options: allowedExamTypes
    });
  }

  // 2. Session
  const session = aiOutput.session && typeof aiOutput.session === 'string' && aiOutput.session.trim()
    ? aiOutput.session.trim()
    : currentSession;

  // 3. Global settings: offDays & holidays
  const rawOffDays = aiOutput.global?.offDays || ['Sunday'];
  const offDays = Array.isArray(rawOffDays) && rawOffDays.length > 0 ? rawOffDays : ['Sunday'];
  const holidays = Array.isArray(aiOutput.global?.holidays) ? aiOutput.global.holidays : [];

  // 4. Groups validation
  const rawGroups = Array.isArray(aiOutput.groups) && aiOutput.groups.length > 0
    ? aiOutput.groups
    : [{ name: 'Group 1', gradeFrom: null, gradeTo: null, startDate: null }];

  const seenGradesAcrossGroups = new Map();
  const normalizedGroups = [];

  // Group default timings
  const DEFAULT_START_TIME = '09:00';
  const DEFAULT_DURATION = 120;
  const DEFAULT_BREAK = 30;

function gradeMatches(gradeA, gradeB) {
  if (!gradeA || !gradeB) return false;
  if (String(gradeA).trim().toLowerCase() === String(gradeB).trim().toLowerCase()) return true;
  const numA = romanOrNumToNumber(gradeA);
  const numB = romanOrNumToNumber(gradeB);
  return numA !== null && numB !== null && numA === numB;
}

  for (let i = 0; i < rawGroups.length; i++) {
    const grp = rawGroups[i];
    const groupName = grp.name || `Group ${i + 1}`;

    // Resolve grades
    const grades = resolveGradeRange(grp.gradeFrom, grp.gradeTo, dbGrades);
    const validGradesForGroup = [];

    for (const g of grades) {
      // Check if already assigned to another group
      if (seenGradesAcrossGroups.has(g)) {
        const prevGroup = seenGradesAcrossGroups.get(g);
        return {
          ok: false,
          error: `Conflict: ${g} is included in two groups ("${prevGroup}" and "${groupName}"). A grade must not appear in two groups.`
        };
      }
      seenGradesAcrossGroups.set(g, groupName);

      // Check if grade has subjects configured (if subjects exist in database)
      const gradeSubs = dbSubjects.filter(s => s && gradeMatches(s.grade, g)).map(s => s.subjectName);
      if (dbSubjects.length > 0 && gradeSubs.length === 0) {
        warnings.push(`${g} has no subjects configured in Subject Master; skipped.`);
      } else {
        validGradesForGroup.push({
          grade: g,
          subjects: [...new Set(gradeSubs)]
        });
      }
    }

    if (validGradesForGroup.length === 0 && grades.length > 0) {
      warnings.push(`No subjects found for ${groupName} in Subject Master.`);
    }

    // Start Date validation
    let startDate = grp.startDate;
    if (startDate && typeof startDate === 'string') {
      startDate = startDate.trim();
      const dateMatch = startDate.match(/^\d{4}-\d{2}-\d{2}$/);
      if (!dateMatch || startDate < today) {
        warnings.push(`Start date ${startDate} for ${groupName} is invalid or in the past.`);
        startDate = null;
      }
    } else {
      startDate = null;
    }

    if (!startDate) {
      missingQuestions.push({
        groupId: i,
        groupName,
        field: 'startDate',
        question: `Start date for ${groupName}?`,
        type: 'date',
        minDate: today
      });
    }

    // Subjects Per Day validation (1 to 6, default 1)
    let subjectsPerDay = parseInt(grp.subjectsPerDay, 10);
    if (isNaN(subjectsPerDay) || subjectsPerDay < 1 || subjectsPerDay > 6) {
      subjectsPerDay = 1;
    }

    // Marks Per Subject validation (NO default, must ask if missing)
    let marksPerSubject = parseInt(grp.marksPerSubject, 10);
    if (isNaN(marksPerSubject) || marksPerSubject <= 0) {
      marksPerSubject = null;
      missingQuestions.push({
        groupId: i,
        groupName,
        field: 'marksPerSubject',
        question: `Marks per subject for ${groupName}?`,
        type: 'number',
        min: 1
      });
    }

    // Timings validation
    const firstPaperStart = grp.firstPaperStart || DEFAULT_START_TIME;
    const paperDurationMinutes = parseInt(grp.paperDurationMinutes, 10) || DEFAULT_DURATION;
    const breakMinutes = grp.breakMinutes !== undefined && grp.breakMinutes !== null
      ? parseInt(grp.breakMinutes, 10)
      : DEFAULT_BREAK;

    normalizedGroups.push({
      groupId: i,
      name: groupName,
      gradeFrom: grp.gradeFrom || '',
      gradeTo: grp.gradeTo || '',
      grades: validGradesForGroup.length > 0 ? validGradesForGroup.map(vg => vg.grade) : grades,
      gradesDetails: validGradesForGroup,
      startDate,
      subjectsPerDay,
      marksPerSubject,
      timings: {
        startTime: firstPaperStart,
        durationMinutes: paperDurationMinutes,
        breakMinutes: breakMinutes >= 0 ? breakMinutes : 30
      }
    });
  }

  return {
    ok: true,
    plan: {
      examType,
      academicSession: session,
      global: {
        offDays,
        holidays
      },
      groups: normalizedGroups
    },
    missingQuestions,
    warnings,
    notices
  };
}
