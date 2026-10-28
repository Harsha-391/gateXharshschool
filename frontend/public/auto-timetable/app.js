/**
 * Auto Class Timetable Generator
 * Plain Vanilla JavaScript - Zero Frameworks
 * Implements full scheduling matrix, cell locking, swap validation, AI assistant, and diagnostics
 */

(function () {
  'use strict';

  // --- State ---
  const state = {
    allGrades: [],
    gradeSubjectTeachers: [],
    selectedGrades: new Set(),
    timeSlots: [],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    activeTimetable: null, // { schedule: { [grade]: { [day]: [entry] } }, timeSlots: [] }
    currentView: 'class', // 'class' | 'teacher'
    activeSubTab: null, // grade or teacherId
    swapSelection: null, // { grade, day, slotIndex, entry }
    verifiedAiRules: [],
    subjectSettings: []
  };

  // --- API Helper ---
  function getAuthHeaders() {
    const token = localStorage.getItem('token') || '';
    const tenant = localStorage.getItem('tenant_subdomain') || localStorage.getItem('school_id') || 'default';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenant) {
      headers['x-tenant-id'] = tenant;
      headers['x-school-id'] = tenant;
    }
    return headers;
  }

  async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: getAuthHeaders()
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(endpoint, options);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast-notice ${type}`;
    setTimeout(() => {
      toast.className = 'toast-notice hide';
    }, 4500);
  }

  // --- Roman & Grade Parsers ---
  function parseGradeNumber(grade) {
    if (!grade) return 0;
    const g = String(grade).trim().toUpperCase();
    const romanMap = {
      'XII': 12, 'XI': 11, 'X': 10, 'IX': 9, 'VIII': 8,
      'VII': 7, 'VI': 6, 'V': 5, 'IV': 4, 'III': 3, 'II': 2, 'I': 1
    };
    for (const [roman, num] of Object.entries(romanMap)) {
      if (g.startsWith(roman)) return num;
    }
    const match = g.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  // --- Initial Data Load ---
  async function init() {
    try {
      await loadDiagnostics();
      await loadGradeSubjectTeachers();
      setupEventListeners();
      handleUrlParameters();
    } catch (err) {
      console.error('Initialization error:', err);
      showToast('Error loading school timetable data: ' + err.message, 'error');
    }
  }

  function handleUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const range = params.get('range');
    const prompt = params.get('prompt');

    if (range) {
      applyRangeString(range);
    }

    if (prompt) {
      const textarea = document.getElementById('aiRulesPrompt');
      if (textarea) {
        textarea.value = prompt;
        parseAiRules().then(() => {
          if (state.selectedGrades.size > 0) {
            generateTimetable();
          }
        });
      }
    } else if (range && state.selectedGrades.size > 0) {
      generateTimetable();
    }
  }

  function applyRangeString(rangeStr) {
    const s = String(rangeStr).trim().toLowerCase();
    state.selectedGrades.clear();

    if (s === 'all' || s === 'all grades' || s === 'all classes') {
      state.allGrades.forEach(g => state.selectedGrades.add(g));
    } else {
      const match = s.match(/(?:classes?|grades?)?\s*([0-9ivx]+)\s*(?:to|-)\s*([0-9ivx]+)/i);
      if (match) {
        const from = parseGradeNumber(match[1]);
        const to = parseGradeNumber(match[2]);
        const min = Math.min(from, to);
        const max = Math.max(from, to);
        state.allGrades.forEach(g => {
          const num = parseGradeNumber(g);
          if (num >= min && num <= max) state.selectedGrades.add(g);
        });
      } else {
        const nums = (s.match(/\d+/g) || []).map(n => parseInt(n, 10));
        if (nums.length > 0) {
          const numSet = new Set(nums);
          state.allGrades.forEach(g => {
            if (numSet.has(parseGradeNumber(g))) state.selectedGrades.add(g);
          });
        }
      }
    }
    renderGradeChips();
  }

  async function loadDiagnostics() {
    const container = document.getElementById('diagnosticsContainer');
    try {
      const res = await apiCall('/api/timetable/diagnostics');
      const diag = res.data;
      state.timeSlots = diag.timeSlots || [];
      state.workingDays = diag.workingDays || state.workingDays;

      container.innerHTML = '';
      if (diag.isReady) {
        container.className = 'diagnostics-panel diagnostics-ready';
        container.innerHTML = `
          <div class="diag-item">
            <span>✅</span>
            <span><strong>System Ready:</strong> ${diag.timeSlots.length} daily time slots defined (${diag.breakSlots.length} break slots, ${diag.workingDays.length} working days/week).</span>
          </div>
        `;
      } else {
        container.className = 'diagnostics-panel diagnostics-warning';
        let html = '';
        if (diag.missingTeachers.length > 0) {
          html += `
            <div class="diag-item">
              <span>⚠️</span>
              <span><strong>Missing Teacher Mappings:</strong> ${diag.missingTeachers.length} subjects have no assigned teachers. (These subjects will be skipped during generation).</span>
            </div>
          `;
        }
        if (diag.periodOverflows.length > 0) {
          html += `
            <div class="diag-item">
              <span>⚠️</span>
              <span><strong>Slot Overflows:</strong> Required periods exceed total available weekly slots for some grades.</span>
            </div>
          `;
        }
        container.innerHTML = html || '<div class="diag-item"><span>⚠️</span> Diagnostics returned warnings.</div>';
      }
    } catch (err) {
      container.className = 'diagnostics-panel diagnostics-error';
      container.innerHTML = `<div class="diag-item"><span>❌</span> Failed to run diagnostics: ${err.message}</div>`;
    }
  }

  async function loadGradeSubjectTeachers() {
    const res = await apiCall('/api/timetable/grade-subject-teachers');
    state.gradeSubjectTeachers = res.data || [];

    const gradesSet = new Set();
    state.gradeSubjectTeachers.forEach(item => {
      if (item.grade) gradesSet.add(item.grade);
    });

    state.allGrades = Array.from(gradesSet).sort((a, b) => {
      const numA = parseGradeNumber(a);
      const numB = parseGradeNumber(b);
      return numA !== numB ? numA - numB : a.localeCompare(b);
    });

    renderGradeChips();
  }

  // --- Grade Chips & Presets ---
  function renderGradeChips() {
    const container = document.getElementById('gradeChipsContainer');
    container.innerHTML = '';

    if (state.allGrades.length === 0) {
      container.innerHTML = '<span class="text-muted">No grades found in teacher directory.</span>';
      return;
    }

    state.allGrades.forEach(grade => {
      const isSelected = state.selectedGrades.has(grade);
      const chip = document.createElement('div');
      chip.className = `grade-chip ${isSelected ? 'active' : ''}`;
      chip.innerHTML = `
        <span class="chip-check">${isSelected ? '✓' : '+'}</span>
        <span>Grade ${grade}</span>
      `;
      chip.addEventListener('click', () => {
        toggleGradeSelection(grade);
      });
      container.appendChild(chip);
    });
  }

  function toggleGradeSelection(grade) {
    if (state.selectedGrades.has(grade)) {
      state.selectedGrades.delete(grade);
    } else {
      state.selectedGrades.add(grade);
    }
    renderGradeChips();
  }

  function applyGradePreset(minNum, maxNum) {
    state.selectedGrades.clear();
    state.allGrades.forEach(grade => {
      const num = parseGradeNumber(grade);
      if (num >= minNum && num <= maxNum) {
        state.selectedGrades.add(grade);
      }
    });
    renderGradeChips();
  }

  // --- AI Rules Assistant ---
  async function parseAiRules() {
    const promptInput = document.getElementById('aiRulesPrompt');
    const prompt = promptInput.value.trim();
    const statusText = document.getElementById('aiStatusText');
    const confirmBox = document.getElementById('aiConfirmBox');
    const rulesList = document.getElementById('aiRulesList');

    if (!prompt) {
      showToast('Please type your scheduling preferences in the text box.', 'error');
      return;
    }

    try {
      statusText.textContent = 'Parsing rules with AI...';
      const res = await apiCall('/api/timetable/ai/rules', 'POST', {
        prompt,
        targetGrades: Array.from(state.selectedGrades)
      });

      statusText.textContent = '';
      if (res.rules && res.rules.length > 0) {
        state.verifiedAiRules = res.rules;
        confirmBox.classList.remove('hide');
        rulesList.innerHTML = '';
        res.rules.forEach(r => {
          const li = document.createElement('li');
          li.textContent = `Grade ${r.grade}: Subject "${r.subject}" -> Max ${r.maxPerDay || 'N/A'} per day, preferred period ${r.preferredSlotIndex !== undefined ? r.preferredSlotIndex + 1 : 'any'}`;
          rulesList.appendChild(li);
        });
        showToast(`AI extracted ${res.rules.length} valid rule(s)!`, 'success');
      } else {
        confirmBox.classList.add('hide');
        state.verifiedAiRules = [];
        showToast('No actionable constraints detected. Using standard balanced scheduling.', 'info');
      }
    } catch (err) {
      statusText.textContent = '';
      showToast('AI Rule extraction error: ' + err.message, 'error');
    }
  }

  // --- Timetable Generation ---
  async function generateTimetable() {
    const grades = Array.from(state.selectedGrades);
    if (grades.length === 0) {
      showToast('Please select at least one grade to generate a timetable.', 'error');
      return;
    }

    const genStatus = document.getElementById('genStatusText');
    const btnGen = document.getElementById('btnGenerate');

    try {
      btnGen.disabled = true;
      genStatus.textContent = 'Generating zero-clash schedule...';

      const payload = {
        targetGrades: grades,
        aiRules: state.verifiedAiRules,
        seed: Date.now()
      };

      const res = await apiCall('/api/timetable/generate', 'POST', payload);
      state.activeTimetable = res.data;

      // Set initial subtab
      state.activeSubTab = grades[0];
      state.currentView = 'class';

      document.getElementById('timetableDisplaySection').classList.remove('hide');
      renderSubTabs();
      renderMatrix();

      showToast(`Generated timetable for ${grades.length} grade(s) with 0 clashes!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Generation failed: ' + err.message, 'error');
    } finally {
      btnGen.disabled = false;
      genStatus.textContent = '';
    }
  }

  // --- Sub-Tabs & Matrix Grid ---
  function renderSubTabs() {
    const container = document.getElementById('subTabsContainer');
    container.innerHTML = '';

    if (state.currentView === 'class') {
      const grades = Array.from(state.selectedGrades);
      grades.forEach(grade => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `sub-tab-btn ${state.activeSubTab === grade ? 'active' : ''}`;
        btn.textContent = `Grade ${grade}`;
        btn.addEventListener('click', () => {
          state.activeSubTab = grade;
          renderSubTabs();
          renderMatrix();
        });
        container.appendChild(btn);
      });
    } else {
      // Teacher view: extract teachers with at least one allocated period
      const teacherMap = new Map();
      const sched = state.activeTimetable?.schedule || {};
      for (const grade of Object.keys(sched)) {
        for (const day of Object.keys(sched[grade])) {
          (sched[grade][day] || []).forEach(e => {
            if (e && e.teacherId && e.teacherName) {
              teacherMap.set(e.teacherId, e.teacherName);
            }
          });
        }
      }

      if (teacherMap.size === 0) {
        container.innerHTML = '<span class="text-muted">No teachers assigned in generated schedule.</span>';
        return;
      }

      const teachers = Array.from(teacherMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
      if (!state.activeSubTab || !teacherMap.has(state.activeSubTab)) {
        state.activeSubTab = teachers[0][0];
      }

      teachers.forEach(([id, name]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `sub-tab-btn ${state.activeSubTab === id ? 'active' : ''}`;
        btn.textContent = name;
        btn.addEventListener('click', () => {
          state.activeSubTab = id;
          renderSubTabs();
          renderMatrix();
        });
        container.appendChild(btn);
      });
    }
  }

  function renderMatrix() {
    const container = document.getElementById('matrixContainer');
    container.innerHTML = '';

    if (!state.activeTimetable) return;

    const timeSlots = state.activeTimetable.timeSlots || state.timeSlots;
    const workingDays = state.activeTimetable.workingDays || state.workingDays;

    // Update Print Header
    const printTitle = document.getElementById('printTitle');
    const printSubTitle = document.getElementById('printSubTitle');
    if (state.currentView === 'class') {
      printTitle.textContent = `Weekly Timetable - Grade ${state.activeSubTab}`;
      printSubTitle.textContent = `School Timetable Matrix | Generated: ${new Date().toLocaleDateString()}`;
    } else {
      // Find teacher name
      let tName = 'Teacher';
      const sched = state.activeTimetable.schedule || {};
      for (const g of Object.keys(sched)) {
        for (const d of Object.keys(sched[g])) {
          const found = (sched[g][d] || []).find(e => e && e.teacherId === state.activeSubTab);
          if (found) { tName = found.teacherName; break; }
        }
        if (tName !== 'Teacher') break;
      }
      printTitle.textContent = `Teacher Timetable - ${tName}`;
      printSubTitle.textContent = `Weekly Schedule Matrix | Generated: ${new Date().toLocaleDateString()}`;
    }

    const table = document.createElement('table');
    table.className = 'matrix-table';

    // Header Row: Period, Monday, Tuesday...
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const thPeriod = document.createElement('th');
    thPeriod.className = 'col-period';
    thPeriod.textContent = 'Period / Time';
    headerRow.appendChild(thPeriod);

    workingDays.forEach(day => {
      const th = document.createElement('th');
      th.textContent = day;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body Rows
    const tbody = document.createElement('tbody');

    timeSlots.forEach((slot, slotIndex) => {
      const tr = document.createElement('tr');

      // Slot info column
      const tdSlot = document.createElement('td');
      tdSlot.className = 'col-period';
      const isBreak = isBreakSlot(slot);
      tdSlot.innerHTML = `
        <div class="period-title">${isBreak ? 'Break' : `Period ${slotIndex + 1}`}</div>
        <div class="period-time">${slot}</div>
      `;
      tr.appendChild(tdSlot);

      // Day columns
      workingDays.forEach(day => {
        const td = document.createElement('td');
        const cell = document.createElement('div');
        cell.className = 'tt-cell';

        if (isBreak) {
          cell.classList.add('break-cell');
          cell.textContent = 'Break';
          td.appendChild(cell);
          tr.appendChild(td);
          return;
        }

        if (state.currentView === 'class') {
          renderClassCell(cell, day, slotIndex);
        } else {
          renderTeacherCell(cell, day, slotIndex);
        }

        td.appendChild(cell);
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  }

  function isBreakSlot(slotStr) {
    if (!slotStr) return false;
    const s = String(slotStr).toLowerCase();
    return s.includes('[break]') || s.includes('break') || s.includes('recess') || s.includes('lunch');
  }

  function renderClassCell(cell, day, slotIndex) {
    const grade = state.activeSubTab;
    const daySchedule = state.activeTimetable.schedule?.[grade]?.[day] || [];
    const entry = daySchedule[slotIndex];

    if (!entry || !entry.subject) {
      cell.innerHTML = '<span class="text-dim">Free</span>';
      return;
    }

    if (entry.isLocked) {
      cell.classList.add('locked');
    }

    if (state.swapSelection && 
        state.swapSelection.grade === grade && 
        state.swapSelection.day === day && 
        state.swapSelection.slotIndex === slotIndex) {
      cell.classList.add('selected-swap');
    }

    cell.innerHTML = `
      <div class="cell-subject">${entry.subject}</div>
      <div class="cell-teacher">${entry.teacherName || 'No Teacher'}</div>
      <span class="cell-lock-badge" title="Click to toggle lock">${entry.isLocked ? '🔒' : '🔓'}</span>
    `;

    // Lock toggle event on the lock icon
    const lockBadge = cell.querySelector('.cell-lock-badge');
    lockBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      entry.isLocked = !entry.isLocked;
      renderMatrix();
      showToast(`${entry.subject} on ${day} Period ${slotIndex + 1} ${entry.isLocked ? 'Locked' : 'Unlocked'}`, 'info');
    });

    // Swap selection event on cell
    cell.addEventListener('click', () => {
      handleCellSwapClick(grade, day, slotIndex, entry);
    });
  }

  function renderTeacherCell(cell, day, slotIndex) {
    const teacherId = state.activeSubTab;
    const sched = state.activeTimetable.schedule || {};
    let foundEntry = null;
    let foundGrade = null;

    for (const grade of Object.keys(sched)) {
      const entry = sched[grade]?.[day]?.[slotIndex];
      if (entry && entry.teacherId === teacherId) {
        foundEntry = entry;
        foundGrade = grade;
        break;
      }
    }

    if (!foundEntry) {
      cell.innerHTML = '<span class="text-dim">Free</span>';
      return;
    }

    cell.innerHTML = `
      <div class="cell-subject">Grade ${foundGrade}</div>
      <div class="cell-teacher">${foundEntry.subject}</div>
    `;
  }

  // --- Real-time Cell Swapping & Validation ---
  async function handleCellSwapClick(grade, day, slotIndex, entry) {
    if (!state.swapSelection) {
      // First slot selected
      if (entry.isLocked) {
        showToast('This slot is locked. Unlock it first before swapping.', 'error');
        return;
      }
      state.swapSelection = { grade, day, slotIndex, entry };
      renderMatrix();
      showToast(`Selected Period ${slotIndex + 1} (${entry.subject}). Now click another period on ${day} to swap.`, 'info');
    } else {
      // Second slot selected
      const first = state.swapSelection;
      state.swapSelection = null;

      if (first.day !== day) {
        renderMatrix();
        showToast('Swapping is currently supported across periods within the same day.', 'info');
        return;
      }

      if (first.slotIndex === slotIndex) {
        // Deselect
        renderMatrix();
        return;
      }

      if (entry.isLocked) {
        renderMatrix();
        showToast('Target slot is locked and cannot be swapped.', 'error');
        return;
      }

      // Call live swap validator API
      try {
        const payload = {
          targetGrades: Array.from(state.selectedGrades),
          timetable: state.activeTimetable,
          move: {
            grade,
            day,
            slotIndex1: first.slotIndex,
            slotIndex2: slotIndex
          }
        };

        const res = await apiCall('/api/timetable/validate-move', 'POST', payload);
        if (res.valid) {
          // Perform swap in active timetable
          const dayList = state.activeTimetable.schedule[grade][day];
          const temp = dayList[first.slotIndex];
          dayList[first.slotIndex] = dayList[slotIndex];
          dayList[slotIndex] = temp;

          renderMatrix();
          showToast(`Swapped Period ${first.slotIndex + 1} with Period ${slotIndex + 1}! Zero clashes.`, 'success');
        } else {
          renderMatrix();
          showToast(`Cannot swap: ${res.conflictReason || 'Creates a teacher or scheduling clash'}`, 'error');
        }
      } catch (err) {
        renderMatrix();
        showToast('Swap validation error: ' + err.message, 'error');
      }
    }
  }

  // --- Save Timetable ---
  async function saveTimetable() {
    if (!state.activeTimetable) {
      showToast('No active timetable to save. Generate one first.', 'error');
      return;
    }

    try {
      const payload = {
        targetGrades: Array.from(state.selectedGrades),
        timetable: state.activeTimetable,
        note: 'Saved via Auto Class Timetable Generator'
      };

      const res = await apiCall('/api/timetable/save', 'POST', payload);
      showToast(`Timetable successfully saved! Version #${res.version || 1} stored in database.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Save failed: ' + err.message, 'error');
    }
  }

  // --- Subject Settings Modal ---
  async function openSubjectSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const tbody = document.getElementById('settingsTableBody');
    modal.classList.remove('hide');
    tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Loading settings...</td></tr>';

    try {
      const res = await apiCall('/api/timetable/subject-settings');
      const settingsMap = new Map();
      (res.data || []).forEach(s => {
        settingsMap.set(`${s.grade}__${s.subject}`, s);
      });

      tbody.innerHTML = '';
      if (state.gradeSubjectTeachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-muted">No grade-subject assignments found.</td></tr>';
        return;
      }

      state.gradeSubjectTeachers.forEach((item, index) => {
        const key = `${item.grade}__${item.subject}`;
        const existing = settingsMap.get(key);
        const periods = existing ? existing.periods_per_week : 5;
        const isDouble = existing ? Boolean(existing.needs_double_period) : false;

        const tr = document.createElement('tr');
        tr.dataset.grade = item.grade;
        tr.dataset.subject = item.subject;
        tr.dataset.teacherId = item.teacherId || '';

        tr.innerHTML = `
          <td><strong>Grade ${item.grade}</strong></td>
          <td>${item.subject}</td>
          <td>${item.teacherName || '<span class="text-dim">Unassigned</span>'}</td>
          <td>
            <input type="number" class="input-num settings-periods" min="1" max="15" value="${periods}">
          </td>
          <td class="text-center">
            <input type="checkbox" class="settings-double" ${isDouble ? 'checked' : ''}>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-danger">Failed to load: ${err.message}</td></tr>`;
    }
  }

  function closeSubjectSettingsModal() {
    document.getElementById('settingsModal').classList.add('hide');
  }

  function applyDefaultPeriodsToAll() {
    const inputs = document.querySelectorAll('.settings-periods');
    inputs.forEach(input => {
      input.value = 5;
    });
    showToast('All subjects set to 5 periods/week.', 'info');
  }

  async function saveSubjectSettings() {
    const rows = document.querySelectorAll('#settingsTableBody tr');
    const settings = [];

    rows.forEach(row => {
      const grade = row.dataset.grade;
      const subject = row.dataset.subject;
      const teacherId = row.dataset.teacherId;
      const periodsInput = row.querySelector('.settings-periods');
      const doubleInput = row.querySelector('.settings-double');

      if (grade && subject && periodsInput) {
        settings.push({
          grade,
          subject,
          teacherId: teacherId || null,
          periods_per_week: parseInt(periodsInput.value, 10) || 5,
          needs_double_period: doubleInput?.checked ? 1 : 0
        });
      }
    });

    try {
      await apiCall('/api/timetable/subject-settings', 'POST', { settings });
      closeSubjectSettingsModal();
      showToast('Subject period settings saved successfully!', 'success');
      loadDiagnostics();
    } catch (err) {
      showToast('Error saving settings: ' + err.message, 'error');
    }
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Preset buttons
    document.getElementById('presetPrimary')?.addEventListener('click', () => applyGradePreset(1, 5));
    document.getElementById('presetMiddle')?.addEventListener('click', () => applyGradePreset(6, 10));
    document.getElementById('presetSenior')?.addEventListener('click', () => applyGradePreset(11, 12));
    document.getElementById('presetAll')?.addEventListener('click', () => {
      state.selectedGrades = new Set(state.allGrades);
      renderGradeChips();
    });
    document.getElementById('presetClear')?.addEventListener('click', () => {
      state.selectedGrades.clear();
      renderGradeChips();
    });

    // AI Assistant
    document.getElementById('btnParseAiRules')?.addEventListener('click', parseAiRules);

    // Generation
    document.getElementById('btnGenerate')?.addEventListener('click', generateTimetable);

    // Save
    document.getElementById('btnSaveTimetable')?.addEventListener('click', saveTimetable);

    // Print
    document.getElementById('btnPrint')?.addEventListener('click', () => window.print());

    // Tabs
    const tabClass = document.getElementById('tabClassView');
    const tabTeacher = document.getElementById('tabTeacherView');
    tabClass?.addEventListener('click', () => {
      state.currentView = 'class';
      tabClass.classList.add('active');
      tabTeacher.classList.remove('active');
      state.activeSubTab = Array.from(state.selectedGrades)[0];
      renderSubTabs();
      renderMatrix();
    });
    tabTeacher?.addEventListener('click', () => {
      state.currentView = 'teacher';
      tabTeacher.classList.add('active');
      tabClass.classList.remove('active');
      state.activeSubTab = null;
      renderSubTabs();
      renderMatrix();
    });

    // Settings Modal
    document.getElementById('btnSubjectSettings')?.addEventListener('click', openSubjectSettingsModal);
    document.getElementById('btnCloseModal')?.addEventListener('click', closeSubjectSettingsModal);
    document.getElementById('btnCancelSettings')?.addEventListener('click', closeSubjectSettingsModal);
    document.getElementById('btnApplyDefaultPeriods')?.addEventListener('click', applyDefaultPeriodsToAll);
    document.getElementById('btnSaveSettings')?.addEventListener('click', saveSubjectSettings);
  }

  // Boot on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
