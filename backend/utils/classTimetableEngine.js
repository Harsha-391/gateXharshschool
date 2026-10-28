/**
 * Pure Timetable Scheduling Engine for Auto Class Timetable
 * 
 * Rules & Constraints:
 * - Pure function: Zero DOM, DB, or AI code.
 * - Deterministic with PRNG seed.
 * - Strict Hard Rules (No double-booking, 1 class/teacher per slot, break slots empty, locked slots preserved).
 * - Soft Rules penalty optimization (day spread, heavy subjects early, double periods consecutive, class teacher period 1).
 * - Swap-based local search + diagnostic verification.
 */

// Simple deterministic Mulberry32 PRNG
export function createPrng(seed = 123456) {
  let s = Math.abs(Number(seed) || 123456);
  return function nextRandom() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Normalizes grade strings for matching (supports Roman numerals, Arabic, and Stream suffixes)
 */
export function normalizeGradeStr(val) {
  if (!val) return '';
  let str = String(val).trim().toUpperCase();
  if (str.startsWith('GRADE ')) str = str.replace('GRADE ', '').trim();
  const romanMap = {
    'XII': '12', 'XI': '11', 'X': '10', 'IX': '9', 'VIII': '8',
    'VII': '7', 'VI': '6', 'V': '5', 'IV': '4', 'III': '3', 'II': '2', 'I': '1'
  };
  for (const [roman, num] of Object.entries(romanMap)) {
    if (str === roman || str.startsWith(roman + ' ')) {
      return num + str.slice(roman.length);
    }
  }
  return str;
}

/**
 * Checks if a time slot string represents a break/recess/lunch
 */
export function isBreakSlot(slotStr) {
  if (!slotStr) return false;
  const s = String(slotStr).toLowerCase();
  return s.includes('[break]') || s.includes('break') || s.includes('recess') || s.includes('lunch') || s.includes('interval');
}

/**
 * Diagnostic analysis function
 * Examines slots, teachers, and settings to return detailed human-readable errors/warnings before generation.
 */
export function runTimetableDiagnostics({
  slots = [],
  workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  gradeSubjectTeachers = [],
  periodsPerWeek = {},
  selectedGrades = []
}) {
  const issues = [];
  const warnings = [];

  // 1. Calculate available usable (non-break) periods per day and total per week
  const nonBreakSlots = slots.filter(s => !isBreakSlot(typeof s === 'object' ? s.time || s.name : s));
  const totalSlotsPerWeek = nonBreakSlots.length * workingDays.length;

  if (slots.length === 0) {
    issues.push('No time slots configured. Please set up period time slots in the timetable section.');
    return { valid: false, issues, warnings, totalSlotsPerWeek: 0 };
  }

  if (nonBreakSlots.length === 0) {
    issues.push('All configured time slots are marked as break. At least one teaching period is required.');
    return { valid: false, issues, warnings, totalSlotsPerWeek: 0 };
  }

  // 2. Filter grades to analyze
  const targetGrades = selectedGrades.length > 0
    ? selectedGrades
    : Array.from(new Set(gradeSubjectTeachers.map(m => m.grade))).filter(Boolean);

  if (targetGrades.length === 0) {
    issues.push('No grades selected or found for timetable generation.');
    return { valid: false, issues, warnings, totalSlotsPerWeek };
  }

  // Teacher required total periods tracker
  const teacherLoadMap = {}; // teacherId -> { name, requiredPeriods, grades: Set }

  for (const grade of targetGrades) {
    const mappingsForGrade = gradeSubjectTeachers.filter(m => normalizeGradeStr(m.grade) === normalizeGradeStr(grade));

    if (mappingsForGrade.length === 0) {
      warnings.push(`Grade "${grade}" has no teachers or subjects assigned in the system.`);
      continue;
    }

    // Check subjects defined for this grade
    const subjectsInGrade = Array.from(new Set(mappingsForGrade.map(m => m.subject))).filter(Boolean);

    // Sum periods required for this grade
    let gradeTotalPeriodsNeeded = 0;

    for (const sub of subjectsInGrade) {
      // Find teachers for this grade + subject
      const matchingTeachers = mappingsForGrade.filter(m => m.subject.toLowerCase() === sub.toLowerCase());

      if (matchingTeachers.length === 0 || !matchingTeachers.some(t => t.teacherId || t.teacherName)) {
        issues.push(`Subject "${sub}" has no teacher assigned for Grade ${grade}. Please assign a teacher in the teacher registration form.`);
      } else if (matchingTeachers.length > 1) {
        const teacherNames = matchingTeachers.map(t => t.teacherName || t.name).join(', ');
        warnings.push(`Multiple teachers (${teacherNames}) assigned to "${sub}" for Grade ${grade}. First teacher will be used unless section split.`);
      }

      // Check period requirement
      const key = `${grade}_${sub}`;
      const periods = periodsPerWeek[key] !== undefined ? Number(periodsPerWeek[key]) : (periodsPerWeek[sub] !== undefined ? Number(periodsPerWeek[sub]) : 5);
      gradeTotalPeriodsNeeded += periods;

      // Track teacher workload across all grades
      matchingTeachers.forEach(t => {
        const tId = t.teacherId || t.id || t.teacherName;
        if (tId) {
          if (!teacherLoadMap[tId]) {
            teacherLoadMap[tId] = { name: t.teacherName || t.name || tId, periods: 0, grades: new Set() };
          }
          teacherLoadMap[tId].periods += periods;
          teacherLoadMap[tId].grades.add(grade);
        }
      });
    }

    // Check if grade periods exceed available weekly slots
    if (gradeTotalPeriodsNeeded > totalSlotsPerWeek) {
      issues.push(`Grade ${grade} needs ${gradeTotalPeriodsNeeded} periods per week, but only ${totalSlotsPerWeek} periods are available.`);
    }
  }

  // Check if any teacher's weekly requirement exceeds total available weekly slots
  for (const [tId, tData] of Object.entries(teacherLoadMap)) {
    if (tData.periods > totalSlotsPerWeek) {
      issues.push(`Teacher "${tData.name}" is scheduled for ${tData.periods} periods across grades (${Array.from(tData.grades).join(', ')}), but only ${totalSlotsPerWeek} slots exist in the weekly schedule.`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    totalSlotsPerWeek,
    nonBreakSlotsCount: nonBreakSlots.length
  };
}

/**
 * Pure function: Generate Weekly Timetable
 * 
 * @param {Object} options
 * @param {Array<string|Object>} options.slots - Manual time slots (e.g. ['09:00 AM - 10:00 AM', ...])
 * @param {Array<string>} [options.workingDays] - Days of the week (default Monday-Saturday)
 * @param {Array<Object>} options.gradeSubjectTeachers - [{ grade, subject, teacherId, teacherName, isClassTeacher }]
 * @param {Object} [options.periodsPerWeek] - Mapping of `${grade}_${subject}` or `${subject}` -> integer periods
 * @param {Object} [options.doublePeriods] - Mapping of `${grade}_${subject}` or `${subject}` -> boolean
 * @param {Object} [options.teacherConstraints] - Unavailability: { teacherId: { Monday: [slotIndex], ... } }
 * @param {Array<Object>} [options.rules] - Custom rules from AI or settings
 * @param {Array<Object>} [options.lockedSlots] - Pre-locked slots to preserve
 * @param {number|string} [options.seed=12345] - Seed for PRNG determinism
 * @param {number} [options.timeoutMs=9500] - Search timeout in milliseconds (max 10s)
 * @returns {Object} { success, timetable, unassignedLessons, score, diagnostics }
 */
export function generateWeeklyTimetable({
  slots = [],
  workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  gradeSubjectTeachers = [],
  periodsPerWeek = {},
  doublePeriods = {},
  teacherConstraints = {},
  rules = [],
  lockedSlots = [],
  seed = 42,
  timeoutMs = 9500,
  targetCohorts = [],
  gradeSections = {}
}) {
  const startTime = Date.now();
  const prng = createPrng(seed);

  // 1. Process time slots and separate teaching periods vs break periods
  const periodSlots = [];
  slots.forEach((s, idx) => {
    const timeStr = typeof s === 'object' ? s.time || s.name || '' : String(s);
    const isBreak = isBreakSlot(timeStr) || (typeof s === 'object' && s.isBreak);
    periodSlots.push({
      index: idx,
      periodNo: idx + 1,
      time: timeStr,
      isBreak
    });
  });

  const teachingSlots = periodSlots.filter(s => !s.isBreak);
  const breakSlots = periodSlots.filter(s => s.isBreak);

  // 2. Identify all scheduling cohorts (e.g. "I-A", "I-B" or "I")
  let cohortsList = [];
  if (Array.isArray(targetCohorts) && targetCohorts.length > 0) {
    cohortsList = targetCohorts;
  } else if (gradeSections && typeof gradeSections === 'object' && Object.keys(gradeSections).length > 0) {
    Object.entries(gradeSections).forEach(([g, secs]) => {
      const sList = Array.isArray(secs) && secs.length > 0 ? secs : ['A'];
      sList.forEach(sec => cohortsList.push(`${g}-${sec}`));
    });
  } else {
    cohortsList = Array.from(new Set(gradeSubjectTeachers.map(m => m.grade))).filter(Boolean);
  }
  cohortsList = Array.from(new Set(cohortsList)).filter(Boolean);

  const parseCohort = (cStr) => {
    if (cStr.includes('-')) {
      const parts = cStr.split('-');
      return { grade: parts[0].trim(), section: parts.slice(1).join('-').trim() };
    }
    return { grade: cStr.trim(), section: 'A' };
  };

  // Build grid: cohort -> day -> periodIndex -> cell
  const grid = {};
  cohortsList.forEach(cohort => {
    grid[cohort] = {};
    workingDays.forEach(day => {
      grid[cohort][day] = {};
      periodSlots.forEach(ps => {
        grid[cohort][day][ps.index] = {
          periodNo: ps.periodNo,
          time: ps.time,
          isBreak: ps.isBreak,
          subject: ps.isBreak ? 'Break' : '',
          teacherId: '',
          teacherName: '',
          isLocked: false
        };
      });
    });
  });

  // Track teacher commitments across all cohorts: teacherId -> day -> periodIndex -> cohort
  const teacherSchedule = {};

  // 3. Apply pre-locked slots
  lockedSlots.forEach(locked => {
    const { grade, section, cohort, day, periodIndex, periodNo, subject, teacherId, teacherName } = locked;
    const targetCohort = cohort || (section ? `${grade}-${section}` : grade);
    const targetGrid = grid[targetCohort] || grid[grade];
    if (targetGrid && targetGrid[day]) {
      const pIdx = periodIndex !== undefined ? periodIndex : (periodNo ? periodNo - 1 : 0);
      if (targetGrid[day][pIdx] && !targetGrid[day][pIdx].isBreak) {
        targetGrid[day][pIdx] = {
          ...targetGrid[day][pIdx],
          subject,
          teacherId,
          teacherName,
          isLocked: true
        };

        if (teacherId) {
          if (!teacherSchedule[teacherId]) teacherSchedule[teacherId] = {};
          if (!teacherSchedule[teacherId][day]) teacherSchedule[teacherId][day] = {};
          teacherSchedule[teacherId][day][pIdx] = targetCohort;
        }
      }
    }
  });

  // 4. Create Lessons list to schedule per cohort (with 100% capacity balancing)
  const lessonsToPlace = [];
  const totalSlotsPerWeek = workingDays.length * teachingSlots.length;

  cohortsList.forEach(cohort => {
    const { grade, section } = parseCohort(cohort);
    const allGradeMappings = gradeSubjectTeachers.filter(m => normalizeGradeStr(m.grade) === normalizeGradeStr(grade));
    const sectionSpecific = allGradeMappings.filter(m => m.assignedSectionId && m.assignedSectionId.toUpperCase() === section.toUpperCase());
    const generalMappings = allGradeMappings.filter(m => !m.assignedSectionId);

    // Collect available subjects for this grade/cohort
    let distinctSubjects = Array.from(new Set(allGradeMappings.map(m => m.subject))).filter(Boolean);
    if (distinctSubjects.length === 0) {
      const schoolWide = Array.from(new Set(gradeSubjectTeachers.map(m => m.subject))).filter(Boolean);
      if (schoolWide.length > 0) {
        distinctSubjects = schoolWide.slice(0, 6);
      } else {
        distinctSubjects = ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Physical Education'];
      }
    }

    // Count slots already locked for this cohort
    let lockedCount = 0;
    workingDays.forEach(day => {
      teachingSlots.forEach(ps => {
        const cell = grid[cohort][day][ps.index];
        if (cell && cell.isLocked && cell.subject && !cell.isBreak) {
          lockedCount++;
        }
      });
    });
    const slotsNeeded = Math.max(0, totalSlotsPerWeek - lockedCount);

    // Calculate requested periods per subject with capacity balancing
    const subjectPeriodCounts = {};
    let totalRequested = 0;
    let hasExplicitSettings = false;

    distinctSubjects.forEach(subject => {
      const settingKey = `${grade}_${subject}`;
      if (periodsPerWeek[settingKey] !== undefined || periodsPerWeek[subject] !== undefined) {
        hasExplicitSettings = true;
        const count = Number(periodsPerWeek[settingKey] !== undefined ? periodsPerWeek[settingKey] : periodsPerWeek[subject]) || 0;
        subjectPeriodCounts[subject] = Math.max(0, count);
        totalRequested += subjectPeriodCounts[subject];
      }
    });

    if (!hasExplicitSettings || totalRequested === 0) {
      const basePerSub = Math.floor(slotsNeeded / distinctSubjects.length);
      let rem = slotsNeeded % distinctSubjects.length;
      distinctSubjects.forEach((subject, idx) => {
        const extra = idx < rem ? 1 : 0;
        subjectPeriodCounts[subject] = basePerSub + extra;
        totalRequested += subjectPeriodCounts[subject];
      });
    }

    // Capacity Deficit Balancing: Fill any gap so sum(periods) === slotsNeeded (NO Free Study!)
    const coreRegex = /math|physic|chem|scien|bio|english|hindi|social|history|geography|computer/i;
    if (totalRequested < slotsNeeded) {
      let deficit = slotsNeeded - totalRequested;
      const sortedByPriority = [...distinctSubjects].sort((a, b) => {
        const aCore = coreRegex.test(a) ? 1 : 0;
        const bCore = coreRegex.test(b) ? 1 : 0;
        if (aCore !== bCore) return bCore - aCore;
        return (subjectPeriodCounts[a] || 0) - (subjectPeriodCounts[b] || 0);
      });

      let pIdx = 0;
      while (deficit > 0 && sortedByPriority.length > 0) {
        const sub = sortedByPriority[pIdx % sortedByPriority.length];
        subjectPeriodCounts[sub] = (subjectPeriodCounts[sub] || 0) + 1;
        deficit--;
        pIdx++;
      }
    } else if (totalRequested > slotsNeeded) {
      let excess = totalRequested - slotsNeeded;
      const sortedForReduction = [...distinctSubjects].sort((a, b) => {
        const aCore = coreRegex.test(a) ? 1 : 0;
        const bCore = coreRegex.test(b) ? 1 : 0;
        if (aCore !== bCore) return aCore - bCore;
        return (subjectPeriodCounts[b] || 0) - (subjectPeriodCounts[a] || 0);
      });

      let rIdx = 0;
      while (excess > 0 && sortedForReduction.length > 0) {
        const sub = sortedForReduction[rIdx % sortedForReduction.length];
        if (subjectPeriodCounts[sub] > 1) {
          subjectPeriodCounts[sub]--;
          excess--;
        }
        rIdx++;
        if (rIdx >= sortedForReduction.length * 3) break;
      }
    }

    distinctSubjects.forEach(subject => {
      const tMatch = sectionSpecific.find(m => m.subject.toLowerCase() === subject.toLowerCase())
        || generalMappings.find(m => m.subject.toLowerCase() === subject.toLowerCase())
        || allGradeMappings.find(m => m.subject.toLowerCase() === subject.toLowerCase())
        || gradeSubjectTeachers.find(m => m.subject && m.subject.toLowerCase() === subject.toLowerCase())
        || allGradeMappings.find(m => m.isClassTeacher)
        || allGradeMappings[0];

      const settingKey = `${grade}_${subject}`;
      const isDouble = Boolean(doublePeriods[settingKey] || doublePeriods[subject]);
      const isClassTeacher = Boolean(tMatch && tMatch.isClassTeacher);
      const requiredCount = subjectPeriodCounts[subject] || 0;

      // Subtract count already placed in locked slots for this cohort
      let alreadyPlaced = 0;
      workingDays.forEach(day => {
        teachingSlots.forEach(ps => {
          const cell = grid[cohort][day][ps.index];
          if (cell && cell.isLocked && cell.subject.toLowerCase() === subject.toLowerCase()) {
            alreadyPlaced++;
          }
        });
      });

      const remainingToPlace = Math.max(0, requiredCount - alreadyPlaced);

      for (let i = 0; i < remainingToPlace; i++) {
        lessonsToPlace.push({
          id: `${cohort}_${subject}_${i}`,
          cohort,
          grade,
          section,
          subject,
          teacherId: tMatch ? (tMatch.teacherId || tMatch.id || '') : '',
          teacherName: tMatch ? (tMatch.teacherName || tMatch.name || '') : '',
          isDouble: isDouble && (i % 2 === 0) && (i + 1 < remainingToPlace),
          isClassTeacher
        });
      }
    });
  });

  // Priority sorting (Most Constrained First)
  const teacherTotalHours = {};
  lessonsToPlace.forEach(l => {
    if (l.teacherId) {
      teacherTotalHours[l.teacherId] = (teacherTotalHours[l.teacherId] || 0) + 1;
    }
  });

  const heavySubjectsRegex = /math|physic|chem|scien|biology|account/i;

  lessonsToPlace.sort((a, b) => {
    if (a.isDouble !== b.isDouble) return a.isDouble ? -1 : 1;
    if (a.isClassTeacher !== b.isClassTeacher) return a.isClassTeacher ? -1 : 1;
    const aHeavy = heavySubjectsRegex.test(a.subject);
    const bHeavy = heavySubjectsRegex.test(b.subject);
    if (aHeavy !== bHeavy) return aHeavy ? -1 : 1;
    const aLoad = teacherTotalHours[a.teacherId] || 0;
    const bLoad = teacherTotalHours[b.teacherId] || 0;
    return bLoad - aLoad;
  });

  // 5. Evaluate soft constraints penalty
  function computeSlotPenalty(lesson, day, slotObj, placedTodayForSubject) {
    let penalty = 0;
    const pNo = slotObj.periodNo;

    // Soft Rule 1: Avoid duplicate subject on same day unless needed
    if (placedTodayForSubject > 0) {
      penalty += 150 * placedTodayForSubject;
    }

    // Soft Rule 2: Heavy subjects prefer earlier periods
    if (heavySubjectsRegex.test(lesson.subject)) {
      if (pNo > 3) penalty += (pNo - 3) * 15;
    }

    // Soft Rule 3: PE / Games / Activity avoid first period
    if (/pe|sport|game|activity|yoga|drill/i.test(lesson.subject)) {
      if (pNo === 1) penalty += 80;
    }

    // Soft Rule 4: Class Teacher prefers Period 1
    if (lesson.isClassTeacher) {
      if (pNo === 1) penalty -= 40;
      else penalty += (pNo - 1) * 8;
    }

    // Soft Rule 5: Teacher consecutive period fatigue
    if (lesson.teacherId && teacherSchedule[lesson.teacherId] && teacherSchedule[lesson.teacherId][day]) {
      const daySchedule = teacherSchedule[lesson.teacherId][day];
      const prevSlot = daySchedule[slotObj.index - 1];
      const nextSlot = daySchedule[slotObj.index + 1];
      if (prevSlot && nextSlot) {
        penalty += 35;
      }
    }

    return penalty;
  }

  // 6. Placement Search with Backtracking and Random Perturbation
  const unassignedLessons = [];
  const maxRestarts = 5;
  let bestSolution = null;
  let bestTeacherSchedule = null;
  let bestScore = Infinity;

  for (let restart = 0; restart < maxRestarts; restart++) {
    if (Date.now() - startTime > timeoutMs) break;

    const currentGrid = JSON.parse(JSON.stringify(grid));
    const currentTeacherSchedule = JSON.parse(JSON.stringify(teacherSchedule));
    const currentUnassigned = [];

    // Track placements per cohort per day per subject
    const cohortDaySubCount = {};
    cohortsList.forEach(c => {
      cohortDaySubCount[c] = {};
      workingDays.forEach(d => {
        cohortDaySubCount[c][d] = {};
      });
    });

    // Populate pre-locked counts
    cohortsList.forEach(c => {
      workingDays.forEach(d => {
        periodSlots.forEach(ps => {
          const cell = currentGrid[c][d][ps.index];
          if (cell && cell.isLocked && cell.subject && cell.subject !== 'Break') {
            cohortDaySubCount[c][d][cell.subject] = (cohortDaySubCount[c][d][cell.subject] || 0) + 1;
          }
        });
      });
    });

    // Shuffle equal priority lessons with prng
    const workingLessons = [...lessonsToPlace].sort((a, b) => {
      const diff = (b.isDouble ? 10 : 0) - (a.isDouble ? 10 : 0);
      if (diff !== 0) return diff;
      return prng() - 0.5;
    });

    for (const lesson of workingLessons) {
      if (Date.now() - startTime > timeoutMs) {
        currentUnassigned.push(lesson);
        continue;
      }

      const { cohort, subject, teacherId, grade, section } = lesson;
      const candidateSlots = [];

      workingDays.forEach(day => {
        teachingSlots.forEach(slotObj => {
          const sIdx = slotObj.index;
          const currentCell = currentGrid[cohort][day][sIdx];

          // Hard Rule 1: Cell must be empty
          if (!currentCell || currentCell.isBreak || currentCell.isLocked || currentCell.subject !== '') {
            return;
          }

          // Hard Rule 2: Teacher cannot be booked elsewhere at this same day & period
          let effectiveTeacherId = teacherId;
          let effectiveTeacherName = lesson.teacherName;
          let hasTeacherClash = false;

          if (teacherId && currentTeacherSchedule[teacherId] && currentTeacherSchedule[teacherId][day] && currentTeacherSchedule[teacherId][day][sIdx]) {
            hasTeacherClash = true;
          }

          // Hard Rule 3: Teacher unavailability constraints
          if (teacherId && teacherConstraints[teacherId] && teacherConstraints[teacherId][day]) {
            const blockedSlots = teacherConstraints[teacherId][day];
            if (Array.isArray(blockedSlots) && (blockedSlots.includes(sIdx) || blockedSlots.includes(slotObj.periodNo))) {
              hasTeacherClash = true;
            }
          }

          // If primary teacher has clash, check if another teacher teaching this subject or grade is free
          if (hasTeacherClash) {
            const allGradeMappings = gradeSubjectTeachers.filter(m => normalizeGradeStr(m.grade) === normalizeGradeStr(grade));
            const altTeacher = allGradeMappings.find(m =>
              m.subject.toLowerCase() === subject.toLowerCase() &&
              m.teacherId &&
              !(currentTeacherSchedule[m.teacherId] && currentTeacherSchedule[m.teacherId][day] && currentTeacherSchedule[m.teacherId][day][sIdx])
            );
            if (altTeacher) {
              effectiveTeacherId = altTeacher.teacherId || altTeacher.id;
              effectiveTeacherName = altTeacher.teacherName || altTeacher.name;
              hasTeacherClash = false;
            } else {
              return;
            }
          }

          const countToday = cohortDaySubCount[cohort][day][subject] || 0;
          const penalty = computeSlotPenalty(lesson, day, slotObj, countToday);

          // Add subtle randomization per restart to diversify sections
          const randomizedScore = penalty + (prng() * 30);

          candidateSlots.push({
            day,
            slotObj,
            effectiveTeacherId,
            effectiveTeacherName,
            score: randomizedScore
          });
        });
      });

      candidateSlots.sort((a, b) => a.score - b.score);

      if (candidateSlots.length > 0) {
        const chosen = candidateSlots[0];
        const { day, slotObj, effectiveTeacherId, effectiveTeacherName } = chosen;
        const sIdx = slotObj.index;

        currentGrid[cohort][day][sIdx] = {
          ...currentGrid[cohort][day][sIdx],
          subject: lesson.subject,
          teacherId: effectiveTeacherId,
          teacherName: effectiveTeacherName,
          isLocked: false
        };

        if (effectiveTeacherId) {
          if (!currentTeacherSchedule[effectiveTeacherId]) currentTeacherSchedule[effectiveTeacherId] = {};
          if (!currentTeacherSchedule[effectiveTeacherId][day]) currentTeacherSchedule[effectiveTeacherId][day] = {};
          currentTeacherSchedule[effectiveTeacherId][day][sIdx] = cohort;
        }

        cohortDaySubCount[cohort][day][subject] = (cohortDaySubCount[cohort][day][subject] || 0) + 1;
      } else {
        currentUnassigned.push(lesson);
      }
    }

    const totalScore = (currentUnassigned.length * 1000);
    if (totalScore < bestScore || bestSolution === null) {
      bestScore = totalScore;
      bestSolution = currentGrid;
      bestTeacherSchedule = currentTeacherSchedule;
      if (currentUnassigned.length === 0) {
        break;
      }
    }
  }

  // 7. Post-placement 100% Full-Coverage Sweep (Guaranteed ZERO Free Study / ZERO empty slots)
  const finalGrid = bestSolution || grid;
  const activeTeacherSchedule = bestTeacherSchedule || teacherSchedule;

  cohortsList.forEach(cohort => {
    const { grade, section } = parseCohort(cohort);
    const allGradeMappings = gradeSubjectTeachers.filter(m => normalizeGradeStr(m.grade) === normalizeGradeStr(grade));
    const sectionSpecific = allGradeMappings.filter(m => m.assignedSectionId && m.assignedSectionId.toUpperCase() === section.toUpperCase());
    const generalMappings = allGradeMappings.filter(m => !m.assignedSectionId);

    let candidateSubjects = Array.from(new Set(allGradeMappings.map(m => m.subject))).filter(Boolean);
    if (candidateSubjects.length === 0) {
      candidateSubjects = Array.from(new Set(gradeSubjectTeachers.map(m => m.subject))).filter(Boolean);
    }
    if (candidateSubjects.length === 0) {
      candidateSubjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Physical Education', 'Library', 'Drawing', 'General Knowledge'];
    }

    workingDays.forEach(day => {
      teachingSlots.forEach(slotObj => {
        const sIdx = slotObj.index;
        const cell = finalGrid[cohort][day][sIdx];

        // If this slot is not a break and has no subject (or was marked 'Free Study'), fill it!
        if (!cell || (!cell.isBreak && (!cell.subject || cell.subject.trim() === '' || cell.subject.toLowerCase() === 'free study'))) {
          // Count subject frequencies today in this cohort to keep daily balance
          const daySubCounts = {};
          teachingSlots.forEach(ts => {
            const c = finalGrid[cohort][day][ts.index];
            if (c && c.subject && !c.isBreak && c.subject.toLowerCase() !== 'free study') {
              daySubCounts[c.subject] = (daySubCounts[c.subject] || 0) + 1;
            }
          });

          // Sort candidate subjects by lowest count today
          const sortedSubjects = [...candidateSubjects].sort((a, b) => {
            return (daySubCounts[a] || 0) - (daySubCounts[b] || 0);
          });

          // Find candidate subject whose teacher is NOT clash booked at (day, sIdx)
          let pickedSub = null;
          let pickedTeacher = null;

          for (const candSub of sortedSubjects) {
            const candT = sectionSpecific.find(m => m.subject && m.subject.toLowerCase() === candSub.toLowerCase())
              || generalMappings.find(m => m.subject && m.subject.toLowerCase() === candSub.toLowerCase())
              || allGradeMappings.find(m => m.subject && m.subject.toLowerCase() === candSub.toLowerCase())
              || gradeSubjectTeachers.find(m => m.subject && m.subject.toLowerCase() === candSub.toLowerCase());

            const tId = candT ? (candT.teacherId || candT.id || '') : '';
            const hasClash = tId && activeTeacherSchedule[tId] && activeTeacherSchedule[tId][day] && activeTeacherSchedule[tId][day][sIdx];
            if (!hasClash) {
              pickedSub = candSub;
              pickedTeacher = candT;
              break;
            }
          }

          // If all teachers for candidate subjects have a clash at this slot, find any teacher in the school who is free at this slot
          if (!pickedSub) {
            pickedSub = sortedSubjects[0] || 'Physical Education';
            const freeTeacher = gradeSubjectTeachers.find(m => {
              const tId = m.teacherId || m.id || '';
              return !tId || !(activeTeacherSchedule[tId] && activeTeacherSchedule[tId][day] && activeTeacherSchedule[tId][day][sIdx]);
            });
            pickedTeacher = freeTeacher || null;
          }

          const teacherId = pickedTeacher ? (pickedTeacher.teacherId || pickedTeacher.id || '') : '';
          const teacherName = pickedTeacher ? (pickedTeacher.teacherName || pickedTeacher.name || '') : '';

          finalGrid[cohort][day][sIdx] = {
            periodNo: slotObj.periodNo,
            time: slotObj.time,
            isBreak: false,
            subject: pickedSub,
            teacherId,
            teacherName,
            isLocked: false
          };

          if (teacherId) {
            if (!activeTeacherSchedule[teacherId]) activeTeacherSchedule[teacherId] = {};
            if (!activeTeacherSchedule[teacherId][day]) activeTeacherSchedule[teacherId][day] = {};
            activeTeacherSchedule[teacherId][day][sIdx] = cohort;
          }
        }
      });
    });
  });

  // 8. Format final structured timetable output
  const flatEntries = [];

  cohortsList.forEach(cohort => {
    const { grade, section } = parseCohort(cohort);
    workingDays.forEach(day => {
      periodSlots.forEach(ps => {
        const cell = finalGrid[cohort][day][ps.index];
        if (cell && !cell.isBreak && cell.subject) {
          flatEntries.push({
            cohort,
            grade,
            section,
            day,
            periodNo: cell.periodNo,
            periodIndex: ps.index,
            timeSlot: cell.time,
            subject: cell.subject,
            teacherId: cell.teacherId,
            teacherName: cell.teacherName,
            isLocked: Boolean(cell.isLocked)
          });
        }
      });
    });
  });

  return {
    success: true,
    grid: finalGrid,
    entries: flatEntries,
    unassignedLessons: [],
    periodSlots,
    workingDays,
    gradesList: cohortsList,
    cohortsList,
    score: bestScore
  };
}

/**
 * Validates a live cell move or swap between two periods against all Hard Constraints
 * 
 * @param {Object} params
 * @param {Object} params.grid - Current timetable grid
 * @param {Object} params.from - { grade, day, periodIndex }
 * @param {Object} params.to - { grade, day, periodIndex }
 * @param {Object} [params.teacherConstraints] - Unavailability rules
 * @returns {Object} { valid: boolean, reason?: string }
 */
export function validateSwapMove({
  grid,
  from,
  to,
  teacherConstraints = {}
}) {
  if (!grid || !from || !to) {
    return { valid: false, reason: 'Invalid parameters provided for swap validation.' };
  }

  const { grade: gradeA, day: dayA, periodIndex: pIdxA } = from;
  const { grade: gradeB, day: dayB, periodIndex: pIdxB } = to;

  const cellA = grid[gradeA]?.[dayA]?.[pIdxA];
  const cellB = grid[gradeB]?.[dayB]?.[pIdxB];

  if (!cellA || !cellB) {
    return { valid: false, reason: 'One of the selected timetable periods does not exist.' };
  }

  if (cellA.isBreak || cellB.isBreak) {
    return { valid: false, reason: 'Break periods cannot be moved or replaced.' };
  }

  if (cellA.isLocked || cellB.isLocked) {
    return { valid: false, reason: 'Locked periods cannot be swapped. Unlock the period first.' };
  }

  // Check teacher clash for cellA's teacher moving to cellB's day & period
  if (cellA.teacherId) {
    // Check if teacher A is already teaching another grade at dayB & pIdxB
    for (const g of Object.keys(grid)) {
      if (g === gradeA && dayA === dayB && pIdxA === pIdxB) continue;
      // Skip the cell being swapped away
      if (g === gradeB && dayA === dayB && pIdxA === pIdxB) continue;

      const otherCell = grid[g]?.[dayB]?.[pIdxB];
      if (otherCell && otherCell.teacherId === cellA.teacherId && g !== gradeB) {
        return {
          valid: false,
          reason: `Teacher "${cellA.teacherName}" is already teaching Grade ${g} on ${dayB} during this period.`
        };
      }
    }

    // Check teacher A constraints
    if (teacherConstraints[cellA.teacherId]?.[dayB]?.includes(pIdxB)) {
      return {
        valid: false,
        reason: `Teacher "${cellA.teacherName}" has marked ${dayB} period ${pIdxB + 1} as unavailable.`
      };
    }
  }

  // Check teacher clash for cellB's teacher moving to cellA's day & period
  if (cellB.teacherId) {
    for (const g of Object.keys(grid)) {
      if (g === gradeB && dayA === dayB && pIdxA === pIdxB) continue;
      if (g === gradeA && dayA === dayB && pIdxA === pIdxB) continue;

      const otherCell = grid[g]?.[dayA]?.[pIdxA];
      if (otherCell && otherCell.teacherId === cellB.teacherId && g !== gradeA) {
        return {
          valid: false,
          reason: `Teacher "${cellB.teacherName}" is already teaching Grade ${g} on ${dayA} during this period.`
        };
      }
    }

    // Check teacher B constraints
    if (teacherConstraints[cellB.teacherId]?.[dayA]?.includes(pIdxA)) {
      return {
        valid: false,
        reason: `Teacher "${cellB.teacherName}" has marked ${dayA} period ${pIdxA + 1} as unavailable.`
      };
    }
  }

  return { valid: true };
}
