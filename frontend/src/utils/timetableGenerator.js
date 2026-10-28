/**
 * Pure Mathematical Timetable Generation Engine
 * Handles date-only arithmetic (YYYY-MM-DD) avoiding timezone shifts (Asia/Kolkata safe).
 * Supports custom off-days (default: Sunday), single holidays and holiday ranges.
 * Automatically chunks subjects and calculates sequential paper time slots.
 */

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDate(dateObj) {
  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '';
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr, daysToAdd) {
  const dt = parseDate(dateStr);
  if (!dt) return dateStr;
  dt.setUTCDate(dt.getUTCDate() + daysToAdd);
  return formatDate(dt);
}

export function getDayOfWeek(dateStr) {
  const dt = parseDate(dateStr);
  if (!dt) return -1;
  return dt.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
}

export function formatFriendlyDate(dateStr) {
  const dt = parseDate(dateStr);
  if (!dt) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = dt.getUTCDate();
  const month = months[dt.getUTCMonth()];
  const year = dt.getUTCFullYear();
  const weekday = SHORT_DAY_NAMES[dt.getUTCDay()];
  return `${weekday}, ${day} ${month} ${year}`;
}

export function minutesToTimeStr(totalMinutes) {
  const norm = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  let hours = Math.floor(norm / 60);
  const mins = norm % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hStr = String(hours).padStart(2, '0');
  const mStr = String(mins).padStart(2, '0');
  return `${hStr}:${mStr} ${ampm}`;
}

export function timeStrToMinutes(timeStr) {
  if (!timeStr) return 9 * 60; // 09:00 default
  const clean = timeStr.trim();
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hrs = parseInt(match12[1], 10);
    const mins = parseInt(match12[2], 10);
    const ampm = match12[3].toUpperCase();
    if (ampm === 'PM' && hrs < 12) hrs += 12;
    if (ampm === 'AM' && hrs === 12) hrs = 0;
    return hrs * 60 + mins;
  }
  return 9 * 60;
}

/**
 * Normalizes a list of off-day names (e.g. ['Sunday', 'Sun']) to 0-6 day indices.
 */
export function normalizeOffDays(offDays) {
  const defaultOff = [0]; // Sunday by default
  if (!Array.isArray(offDays) || offDays.length === 0) return defaultOff;

  const indices = new Set();
  for (const d of offDays) {
    if (typeof d === 'number' && d >= 0 && d <= 6) {
      indices.add(d);
      continue;
    }
    if (typeof d === 'string') {
      const clean = d.trim().toLowerCase();
      const matchIdx = DAY_NAMES.findIndex(dn => dn.toLowerCase() === clean || dn.toLowerCase().startsWith(clean));
      if (matchIdx !== -1) indices.add(matchIdx);
    }
  }
  return indices.size > 0 ? Array.from(indices) : defaultOff;
}

/**
 * Checks if a given YYYY-MM-DD date falls on a holiday (single date or range).
 */
export function isHolidayDate(dateStr, holidays = []) {
  if (!dateStr || !Array.isArray(holidays) || holidays.length === 0) return false;

  for (const h of holidays) {
    if (!h) continue;
    if (typeof h === 'string') {
      const trimmed = h.trim();
      // Single date
      if (trimmed === dateStr) return true;
      // Date range string: 'YYYY-MM-DD to YYYY-MM-DD' or 'YYYY-MM-DD - YYYY-MM-DD'
      const rangeParts = trimmed.split(/\s+(?:to|-)\s+/i);
      if (rangeParts.length === 2 && rangeParts[0] && rangeParts[1]) {
        if (dateStr >= rangeParts[0].trim() && dateStr <= rangeParts[1].trim()) return true;
      }
    } else if (typeof h === 'object') {
      const start = h.startDate || h.date || h.start;
      const end = h.endDate || h.date || h.end || start;
      if (start && dateStr >= start && dateStr <= end) return true;
    }
  }
  return false;
}

/**
 * Generates an automatic, conflict-free exam timetable.
 * Pure mathematical scheduling algorithm.
 *
 * @param {Object} options
 * @param {Array<string>} options.subjects - List of subject names in master order.
 * @param {string} options.startDate - Exam start date in YYYY-MM-DD.
 * @param {number} [options.subjectsPerDay=1] - Number of subjects scheduled per day.
 * @param {number} [options.marksPerSubject=100] - Marks per subject for all papers.
 * @param {Object} [options.timings]
 * @param {string} [options.timings.startTime='09:00'] - First paper start time.
 * @param {number} [options.timings.durationMinutes=120] - Duration per paper in minutes (default 2 hrs).
 * @param {number} [options.timings.breakMinutes=30] - Break between papers if subjectsPerDay > 1.
 * @param {Array<string|number>} [options.offDays=['Sunday']] - Days to skip.
 * @param {Array<string|Object>} [options.holidays=[]] - Single dates or ranges to skip.
 * @returns {Object} { schedule, summary }
 */
export function generateTimetable({
  subjects = [],
  startDate,
  subjectsPerDay = 1,
  marksPerSubject = 100,
  timings = {},
  offDays = ['Sunday'],
  holidays = []
}) {
  const marks = Number(marksPerSubject) > 0 ? Number(marksPerSubject) : 100;
  const perDay = Math.max(1, parseInt(subjectsPerDay, 10) || 1);

  if (!startDate) {
    throw new Error('Start date is required to generate timetable.');
  }

  const offDayIndices = normalizeOffDays(offDays);
  const notices = [];

  const isOffDay = (dateStr) => offDayIndices.includes(getDayOfWeek(dateStr));
  const isHoliday = (dateStr) => isHolidayDate(dateStr, holidays);
  const isNonWorkingDay = (dateStr) => isOffDay(dateStr) || isHoliday(dateStr);

  let currentDate = startDate.trim();

  // 1. Shift start date if it falls on an off-day or holiday
  if (isNonWorkingDay(currentDate)) {
    const originalDate = currentDate;
    while (isNonWorkingDay(currentDate)) {
      currentDate = addDays(currentDate, 1);
    }
    const dayName = DAY_NAMES[getDayOfWeek(currentDate)];
    notices.push(`Start date ${originalDate} is an off-day or holiday; automatically shifted to ${dayName} (${currentDate}).`);
  }

  // Deduplicate subjects to ensure no duplicate papers
  const cleanSubjects = Array.isArray(subjects)
    ? [...new Set(subjects.map(s => (typeof s === 'string' ? s.trim() : String(s))).filter(Boolean))]
    : [];

  if (cleanSubjects.length === 0) {
    return {
      schedule: [],
      summary: {
        totalSubjects: 0,
        subjectsPerDay: perDay,
        marksPerSubject: marks,
        totalMarks: 0,
        totalExamDays: 0,
        startDate: currentDate || '',
        endDate: currentDate || '',
        notices: [...notices, 'No subjects configured for scheduling.']
      }
    };
  }

  // 2. Chunk subjects into groups of size subjectsPerDay
  const groups = [];
  for (let i = 0; i < cleanSubjects.length; i += perDay) {
    groups.push(cleanSubjects.slice(i, i + perDay));
  }

  // 3. Timings setup
  const startMinutes = timeStrToMinutes(timings.startTime || timings.firstPaperStart || '09:00');
  const duration = parseInt(timings.durationMinutes || timings.paperDurationMinutes, 10) || 120;
  const paperBreak = parseInt(timings.breakMinutes, 10) >= 0 ? parseInt(timings.breakMinutes, 10) : 30;

  const durationLabel = duration % 60 === 0
    ? `${duration / 60} Hour${duration / 60 > 1 ? 's' : ''}`
    : `${duration} Mins`;

  const schedule = [];
  let dayCounter = 1;

  for (let gIdx = 0; gIdx < groups.length; gIdx++) {
    // Skip any off-days or holidays encountered
    while (isNonWorkingDay(currentDate)) {
      const skippedDay = currentDate;
      const dayName = DAY_NAMES[getDayOfWeek(skippedDay)];
      const reason = isHoliday(skippedDay) ? 'holiday' : 'off-day';
      notices.push(`${dayName} ${skippedDay} skipped (${reason}).`);
      currentDate = addDays(currentDate, 1);
    }

    const group = groups[gIdx];
    let currentSlotStart = startMinutes;

    for (let slotIdx = 0; slotIdx < group.length; slotIdx++) {
      const sub = group[slotIdx];
      const slotEnd = currentSlotStart + duration;
      const timeSlotStr = `${minutesToTimeStr(currentSlotStart)} - ${minutesToTimeStr(slotEnd)}`;

      schedule.push({
        dayNumber: dayCounter,
        date: currentDate,
        dayOfWeek: DAY_NAMES[getDayOfWeek(currentDate)],
        timeSlot: timeSlotStr,
        startTime: minutesToTimeStr(currentSlotStart),
        endTime: minutesToTimeStr(slotEnd),
        duration: durationLabel,
        subject: sub,
        marks,
        slotIndex: slotIdx
      });

      // Next slot on same day begins after break
      currentSlotStart = slotEnd + paperBreak;
    }

    dayCounter++;
    // Advance to next day for subsequent group
    if (gIdx < groups.length - 1) {
      currentDate = addDays(currentDate, 1);
    }
  }

  const firstDay = schedule.length > 0 ? schedule[0].date : startDate;
  const lastDay = schedule.length > 0 ? schedule[schedule.length - 1].date : startDate;

  return {
    schedule,
    summary: {
      totalSubjects: cleanSubjects.length,
      subjectsPerDay: perDay,
      marksPerSubject: marks,
      totalMarks: cleanSubjects.length * marks,
      totalExamDays: groups.length,
      startDate: firstDay,
      endDate: lastDay,
      notices
    }
  };
}
