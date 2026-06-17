import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Clock, 
  BookOpen, 
  Award, 
  Calendar, 
  Bell, 
  Plus, 
  Trash2, 
  Printer, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle, 
  Users, 
  UserCheck, 
  Loader2, 
  ChevronRight, 
  TrendingUp, 
  Activity, 
  ArrowLeft,
  ChevronLeft,
  Settings,
  Eye,
  Edit3,
  Send,
  Zap,
  ChevronDown,
  GripVertical,
  Download,
  Upload,
  X
} from 'lucide-react';
import ResultManagementPanel from './ResultManagementPanel';
import EXAM_TYPES from '../utils/examTypes';
import { getGradesWithSubjects, getGradeOptions, GRADE_ORDER, fetchActiveGrades } from '../utils/grades';


export default function AcademicPanel({ subView, setAdminView }) {
  // Master API states
  const [timetables, setTimetables] = useState([]);
  const [activeGrades, setActiveGrades] = useState([]);

  useEffect(() => {
    const loadGrades = async () => {
      const grades = await fetchActiveGrades();
      setActiveGrades(grades);
    };
    loadGrades();
  }, []);
  const [teacherTimetables, setTeacherTimetables] = useState([]);
  const [exams, setExams] = useState([]);
  const [examTimetables, setExamTimetables] = useState([]);
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [newSubjectGrade, setNewSubjectGrade] = useState('I');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectsList, setNewSubjectsList] = useState(Array(10).fill(''));
  const [editingSubjects, setEditingSubjects] = useState([]);
  const [quickSubjectInputs, setQuickSubjectInputs] = useState({});
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkGrid, setBulkGrid] = useState({});
  const [showTeacherBulkModal, setShowTeacherBulkModal] = useState(false);
  const [teacherBulkGrid, setTeacherBulkGrid] = useState({});
  const [teacherBulkSearchQuery, setTeacherBulkSearchQuery] = useState('');
  const [teacherBulkGradeSearch, setTeacherBulkGradeSearch] = useState('All');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchGrade, setSearchGrade] = useState('All');
  const [searchSection, setSearchSection] = useState('All');

  // Active view filters
  const [activeClass, setActiveClass] = useState('I-A');
  const [activeTeacher, setActiveTeacher] = useState('');
  const [activeExam, setActiveExam] = useState('');
  const [timetableSession, setTimetableSession] = useState('2026-2027');
  const [activeSubject, setActiveSubject] = useState('Mathematics');
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth()); // 0-11
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  
  // Modal toggles
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeMarksheetStudent, setActiveMarksheetStudent] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cohortToDelete, setCohortToDelete] = useState(null);
  const [exportFormats, setExportFormats] = useState({});

  // Form states
  const [timetableForm, setTimetableForm] = useState({
    day: 'Monday', time: '09:00 AM - 10:00 AM', subject: '', teacher: '', room: '', session: '2026-2027'
  });
  const [examForm, setExamForm] = useState({
    examName: '', examType: EXAM_TYPES[0], grade: 'IX', section: 'A', startDate: '', endDate: '', totalMarks: 100, passingMarks: 40, status: 'Scheduled'
  });
  const [showExamWizard, setShowExamWizard] = useState(false);
  const [examWizardStep, setExamWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState({
    examName: '',
    examType: EXAM_TYPES[0],
    customExamName: '',
    academicSession: '2026-2027',
    description: '',
    totalMarks: 100,
    selectedGrades: [],
    startDates: {},
    endDates: {},
    subjectMarks: {},
    subjectIncluded: {},
    gapDays: 1
  });

  const resetWizardForm = () => {
    setWizardForm({
      examName: '',
      examType: EXAM_TYPES[0],
      customExamName: '',
      academicSession: '2026-2027',
      description: '',
      totalMarks: 100,
      selectedGrades: [],
      startDates: {},
      endDates: {},
      subjectMarks: {},
      subjectIncluded: {},
      gapDays: 1
    });
    setExamWizardStep(1);
  };

  const [availableGradeSections, setAvailableGradeSections] = useState([]);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [examSearch, setExamSearch] = useState('');
  const [examSessionFilter, setExamSessionFilter] = useState('2026-2027');
  const [examStatusFilter, setExamStatusFilter] = useState('All');
  const [examTypeFilter, setExamTypeFilter] = useState('All');
  const [selectedCustomExamFilter, setSelectedCustomExamFilter] = useState('All');
  const [examGradeFilter, setExamGradeFilter] = useState('All');
  const [examSectionFilter, setExamSectionFilter] = useState('All');
  const [viewScheduleExam, setViewScheduleExam] = useState(null);
  const [examTimetableForm, setExamTimetableForm] = useState({
    examId: '', subject: 'Mathematics', examDate: '', startTime: '09:00 AM', endTime: '12:00 PM', duration: '3 Hours', roomAllocation: '', invigilator: ''
  });
  const [manualGrade, setManualGrade] = useState('');
  const [manualSection, setManualSection] = useState('');
  const [manualSlots, setManualSlots] = useState([]);
  const [isManualSchedulerOpen, setIsManualSchedulerOpen] = useState(false);
  const [draggedSlotIndex, setDraggedSlotIndex] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '', type: 'Academic', date: '', time: '', venue: '', description: '', organizer: 'School Admin', participants: 'All Students', status: 'Scheduled'
  });
  const [eventTypeOpen, setEventTypeOpen] = useState(false);
  const eventTypeRef = useRef(null);
  const eventTypes = ['Academic', 'Examination', 'Sports', 'Cultural', 'Competition', 'Workshop', 'Seminar', 'Meeting', 'Orientation', 'Celebration', 'Holiday', 'National Event', 'Educational Tour', 'Exhibition', 'Guest Lecture', 'Health & Wellness', 'Administrative', 'Other'];
  const [noticeForm, setNoticeForm] = useState({
    title: '', content: '', category: 'General', priority: 'Medium', publishDate: new Date().toISOString().split('T')[0], expiryDate: '', visibility: 'All'
  });
  const [holidayForm, setHolidayForm] = useState({
    name: '', type: 'Public', startDate: '', endDate: '', description: ''
  });
  
  // Results Entry state: maps studentId -> obtainedMarks
  const [resultsEntry, setResultsEntry] = useState({});

  // Academic Calendar Management System State
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarImports, setCalendarImports] = useState([]);
  const [calendarSession, setCalendarSession] = useState('2026-27');
  const [calendarViewMode, setCalendarViewMode] = useState('month'); // month, week, list
  const [calendarSearchQuery, setCalendarSearchQuery] = useState('');
  const [calendarTypeFilter, setCalendarTypeFilter] = useState('All');
  const [calendarStartDateFilter, setCalendarStartDateFilter] = useState('');
  const [calendarEndDateFilter, setCalendarEndDateFilter] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPreviewRows, setUploadPreviewRows] = useState([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSession, setUploadSession] = useState('2026-27');
  const [showImportHistoryModal, setShowImportHistoryModal] = useState(false);
  const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);
  const [editingCalendarEventId, setEditingCalendarEventId] = useState(null);
  const [publishedEventIds, setPublishedEventIds] = useState([]);
  const [modalType, setModalType] = useState('');
  const [calendarEventForm, setCalendarEventForm] = useState({
    title: '', eventType: 'Holiday', eventDate: '', startTime: '', endTime: '', description: '', applicableClasses: 'All', session: '2026-27'
  });
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const calendarEventTypes = [
    'Holiday', 'Examination', 'Result Declaration', 'Sports Event', 'Cultural Event', 
    'Workshop', 'Parent-Staff Meeting', 'Vacation', 'Admissions Activity', 'Other Important School Event'
  ];

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper arrays for lookups
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const [timeslots, setTimeslots] = useState([
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM'
  ]);
  const [showTimeslotsModal, setShowTimeslotsModal] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [timeslotType, setTimeslotType] = useState('Regular');

  const convertTo12HourFormat = (time24) => {
    if (!time24) return '';
    const [hrsStr, minsStr] = time24.split(':');
    let hrs = parseInt(hrsStr);
    const mins = parseInt(minsStr);
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12;
    hrs = hrs ? hrs : 12; // the hour '0' should be '12'
    const padHrs = String(hrs).padStart(2, '0');
    const padMins = String(mins).padStart(2, '0');
    return `${padHrs}:${padMins} ${ampm}`;
  };
  const handleAddTimeslot = async (e) => {
    e.preventDefault();
    if (!startTimeInput || !endTimeInput) {
      alert('Please select both start and end times.');
      return;
    }
    const suffix = timeslotType !== 'Regular' ? ` [${timeslotType}]` : '';
    const finalSlot = `${convertTo12HourFormat(startTimeInput)} - ${convertTo12HourFormat(endTimeInput)}${suffix}`;
    try {
      const res = await fetch('/api/academics/timeslots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeslot: finalSlot })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Time slot registered successfully!', 'success');
        setStartTimeInput('');
        setEndTimeInput('');
        setTimeslotType('Regular');
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to add time slot.', 'error');
      }
    } catch (err) {
      showToast('Network error during operation.', 'error');
    }
  };
  const handleDeleteTimeslot = async (slotToDelete) => {
    if (!confirm(`Are you sure you want to delete the time slot: ${slotToDelete}?`)) return;
    try {
      const res = await fetch('/api/academics/timeslots', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeslot: slotToDelete })
      });
      if (res.ok) {
        showToast('Time slot removed successfully.', 'success');
        fetchAllData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to remove time slot.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const classesList = availableGradeSections
    .filter(pair => subjects.some(s => s.grade === pair.grade))
    .map(pair => `${pair.grade}-${pair.section}`);
  const subjectsList = ['Mathematics', 'Physics', 'Chemistry', 'English Literature', 'History'];
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchAllData = async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const endpoints = [
        { url: '/api/academics/timetables', setter: setTimetables },
        { url: '/api/academics/teacher-timetables', setter: setTeacherTimetables },
        { url: '/api/academics/exams', setter: setExams },
        { url: '/api/academics/exam-timetables', setter: setExamTimetables },
        { url: '/api/academics/events', setter: setEvents },
        { url: '/api/academics/notices', setter: setNotices },
        { url: '/api/academics/holidays', setter: setHolidays },
        { url: '/api/academics/results', setter: setResults },
        { url: '/api/academics/timeslots', setter: setTimeslots },
        { url: '/api/academics/subjects', setter: setSubjects },
        { url: '/api/students?limit=10000', setter: (data) => setStudents(data.students || []) },
        { url: '/api/teachers?limit=10000', setter: (data) => setTeachers(data.teachers || []) },
        { url: '/api/academics/grades-sections', setter: (data) => setAvailableGradeSections(data.gradeSectionPairs || []) },
        { url: '/api/academics/calendar-events', setter: setCalendarEvents },
        { url: '/api/academics/calendar-imports', setter: setCalendarImports },
        { url: '/api/academics/calendar/published', setter: setPublishedEventIds }
      ];

      await Promise.all(
        endpoints.map(async (ep) => {
          try {
            const separator = ep.url.includes('?') ? '&' : '?';
            const res = await fetch(`${ep.url}${separator}_t=${Date.now()}`);
            if (res.ok) {
              const data = await res.json();
              ep.setter(data);
            }
          } catch (e) {
            console.error(`Failed to fetch ${ep.url}:`, e);
          }
        })
      );
    } catch (err) {
      console.error('Error loading academic data:', err);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAllData(true);
  }, []);

  useEffect(() => {
    if (showExamWizard) {
      fetchAllData();
    }
  }, [showExamWizard]);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      const res = await fetch('/api/academics/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: newSubjectGrade, subjectName: newSubjectName.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Subject created successfully!', 'success');
        setNewSubjectName('');
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to create subject.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      const res = await fetch(`/api/academics/subjects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Subject deleted.', 'success');
        fetchAllData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const handleDeleteAllGradeSubjects = async (grade) => {
    if (!confirm(`Are you sure you want to delete all subjects for Grade ${grade}?`)) return;
    
    const gradeSubjects = subjects.filter(s => s.grade === grade);
    if (gradeSubjects.length === 0) return;

    try {
      await Promise.all(
        gradeSubjects.map(sub => fetch(`/api/academics/subjects/${sub.id}`, { method: 'DELETE' }))
      );
      showToast(`All subjects for Grade ${grade} deleted successfully.`, 'success');
      fetchAllData();
    } catch (err) {
      showToast('Network error during bulk deletion.', 'error');
    }
  };

  const handleBulkSubjectsSubmit = async (e) => {
    e.preventDefault();
    const subjectNames = newSubjectsList.filter(name => name.trim() !== '');
    if (subjectNames.length === 0) {
      showToast('Please enter at least one subject name.', 'error');
      return;
    }

    try {
      // Find existing subjects that were removed or renamed, and delete them server-side
      const normalizedNew = subjectNames.map(n => n.trim().toLowerCase());
      const subjectsToDelete = editingSubjects.filter(
        es => !normalizedNew.includes(es.subjectName.trim().toLowerCase())
      );

      // Delete any removed/renamed existing subjects
      if (subjectsToDelete.length > 0) {
        await Promise.all(
          subjectsToDelete.map(sub =>
            fetch(`/api/academics/subjects/${sub.id}`, { method: 'DELETE' })
          )
        );
      }

      const res = await fetch('/api/academics/subjects/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: newSubjectGrade, subjectNames })
      });
      const data = await res.json();
      if (res.ok) {
        let msg = 'Subjects saved successfully!';
        if (data.duplicates && data.duplicates.length > 0) {
          msg += ` (Skipped duplicate: ${data.duplicates.join(', ')})`;
        }
        showToast(msg, 'success');
        setNewSubjectsList(Array(10).fill(''));
        setEditingSubjects([]);
        setShowSubjectsModal(false);
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to save subjects.', 'error');
      }
    } catch (err) {
      showToast('Network error during operation.', 'error');
    }
  };

  // Sync activeClass to match available classes in classesList
  useEffect(() => {
    if (classesList.length > 0 && !classesList.includes(activeClass)) {
      setActiveClass(classesList[0]);
    }
  }, [classesList, activeClass]);

  // Sync activeSubject to match the activeClass grade subjects
  useEffect(() => {
    const grade = activeClass.split('-')[0];
    const gradeSubjects = subjects.filter(s => s.grade === grade);
    if (gradeSubjects.length > 0) {
      const match = gradeSubjects.find(s => s.subjectName === activeSubject);
      if (!match) {
        setActiveSubject(gradeSubjects[0].subjectName);
      }
    } else {
      setActiveSubject('');
    }
  }, [activeClass, subjects]);

  const handleOpenBulkModalForCohort = (cohort) => {
    setActiveClass(cohort);
    const currentGrid = {};
    daysOfWeek.forEach(day => {
      timeslots.forEach(slot => {
        const match = timetables.find(t => t.cohort === cohort && t.day === day && t.time === slot);
        currentGrid[`${day}_${slot}`] = {
          subject: match ? match.subject : '',
          teacher: match ? match.teacher : '',
          room: match ? match.room : ''
        };
      });
    });
    setBulkGrid(currentGrid);
    setShowBulkModal(true);
  };

  const handleOpenBulkModal = () => {
    handleOpenBulkModalForCohort(activeClass);
  };

  const handleBulkCellChange = (day, slot, field, value) => {
    setBulkGrid(prev => {
      const key = `${day}_${slot}`;
      const cell = { ...(prev[key] || { subject: '', teacher: '', room: '' }) };
      cell[field] = value;
      if (field === 'subject' && !value) {
        cell.teacher = '';
        cell.room = '';
      }
      return {
        ...prev,
        [key]: cell
      };
    });
  };

  const handleClearBulkGrid = () => {
    if (!confirm('Are you sure you want to clear all slots in this bulk editor? This will not be saved until you submit the form.')) return;
    const cleared = {};
    daysOfWeek.forEach(day => {
      timeslots.forEach(slot => {
        cleared[`${day}_${slot}`] = { subject: '', teacher: '', room: '' };
      });
    });
    setBulkGrid(cleared);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const formattedTimetables = [];
    Object.entries(bulkGrid).forEach(([key, cell]) => {
      const [day, slot] = key.split('_');
      if (cell.subject && cell.subject.trim() !== '') {
        formattedTimetables.push({
          day,
          time: slot,
          subject: cell.subject,
          teacher: cell.teacher,
          room: cell.room
        });
      }
    });

    try {
      const res = await fetch('/api/academics/timetables/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohort: activeClass,
          timetables: formattedTimetables
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Weekly timetable matrix updated successfully!', 'success');
        setShowBulkModal(false);
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to update timetable matrix.', 'error');
      }
    } catch (err) {
      showToast('Network error during bulk operation.', 'error');
    }
  };

  const handleOpenTeacherBulkModalForName = (tName) => {
    if (!tName) return;
    const currentGrid = {};
    daysOfWeek.forEach(day => {
      timeslots.forEach(slot => {
        const match = teacherTimetables.find(t => 
          t.teacher && 
          t.teacher.toLowerCase() === tName.toLowerCase() && 
          t.day === day && 
          t.time === slot
        );
        currentGrid[`${day}_${slot}`] = {
          cohort: match ? match.cohort : '',
          subject: match ? match.subject : ''
        };
      });
    });
    setTeacherBulkGrid(currentGrid);
    setShowTeacherBulkModal(true);
  };

  const handleOpenTeacherBulkModal = () => {
    if (!activeTeacher) {
      showToast('Please select a teacher first.', 'error');
      return;
    }
    setTeacherBulkSearchQuery('');
    setTeacherBulkGradeSearch('All');
    handleOpenTeacherBulkModalForName(activeTeacher);
  };

  const handleDeleteWholeTeacherTimetable = async (tName) => {
    if (!confirm(`Are you sure you want to clear the entire weekly timetable for teacher: ${tName}? This action cannot be undone.`)) return;
    try {
      const res = await fetch('/api/academics/timetables/bulk/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher: tName,
          timetables: []
        })
      });
      if (res.ok) {
        showToast(`Teacher ${tName} timetable cleared successfully.`, 'success');
        fetchAllData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to clear teacher timetable.', 'error');
      }
    } catch (e) {
      showToast('Network error during operation.', 'error');
    }
  };

  const handleTeacherBulkCellChange = (day, slot, field, value) => {
    setTeacherBulkGrid(prev => {
      const key = `${day}_${slot}`;
      const cell = { ...(prev[key] || { cohort: '', subject: '' }) };
      cell[field] = value;
      if (field === 'cohort' && !value) {
        cell.subject = '';
      }
      return {
        ...prev,
        [key]: cell
      };
    });
  };

  const handleClearTeacherBulkGrid = () => {
    if (!confirm('Are you sure you want to clear all slots in this bulk editor? This will not be saved until you submit the form.')) return;
    const cleared = {};
    daysOfWeek.forEach(day => {
      timeslots.forEach(slot => {
        cleared[`${day}_${slot}`] = { cohort: '', subject: '' };
      });
    });
    setTeacherBulkGrid(cleared);
  };

  const handleTeacherBulkSubmit = async (e) => {
    e.preventDefault();
    const currentTeacherObj = Array.isArray(teachers)
      ? teachers.find(t => t.name.toLowerCase() === activeTeacher.toLowerCase())
      : null;
    const teacherSubject = currentTeacherObj
      ? (currentTeacherObj.subject || currentTeacherObj.subjectSpecialization || '')
      : '';

    const formattedTimetables = [];
    Object.entries(teacherBulkGrid).forEach(([key, cell]) => {
      const [day, slot] = key.split('_');
      if (cell.cohort && cell.cohort.trim() !== '') {
        formattedTimetables.push({
          day,
          time: slot,
          cohort: cell.cohort,
          subject: teacherSubject || cell.subject || ''
        });
      }
    });

    try {
      const res = await fetch('/api/academics/timetables/bulk/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher: activeTeacher,
          timetables: formattedTimetables
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Teacher's weekly timetable matrix updated successfully!", 'success');
        setShowTeacherBulkModal(false);
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to update teacher timetable matrix.', 'error');
      }
    } catch (err) {
      showToast('Network error during bulk operation.', 'error');
    }
  };

  // Sync active teacher selection on load
  useEffect(() => {
    if (Array.isArray(teachers) && teachers.length > 0 && !activeTeacher) {
      setActiveTeacher(teachers[0].name);
    }
  }, [teachers]);

  // Sync active exam selection on load
  useEffect(() => {
    if (exams.length > 0 && !activeExam) {
      setActiveExam(exams[0].id);
    }
  }, [exams]);

  // Close event type dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (eventTypeRef.current && !eventTypeRef.current.contains(e.target)) {
        setEventTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '500px', flexDirection: 'column', gap: '16px' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'hsl(var(--color-primary))' }} />
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Synchronizing Academic Records...</p>
      </div>
    );
  }

  // =============================================
  // POST & DELETE API HANDLERS
  // =============================================
  
  // 1. Timetable Slot
  const handleTimetableSubmit = async (e) => {
    e.preventDefault();
    const payload = { cohort: activeClass, ...timetableForm };
    try {
      const res = await fetch('/api/academics/timetables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Timetable slot scheduled successfully!', 'success');
        setShowAddModal(false);
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to save timetable period.', 'error');
      }
    } catch (e) {
      showToast('Network error during operation.', 'error');
    }
  };

  const deleteTimetablePeriod = async (id) => {
    try {
      const res = await fetch(`/api/academics/timetables/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Period removed from schedule.', 'success');
        fetchAllData();
      }
    } catch (e) {
      showToast('Deletion failed.', 'error');
    }
  };

  const handleDeleteWholeTimetable = (cohort) => {
    setCohortToDelete(cohort);
    setShowConfirmModal(true);
  };

  const confirmDeleteWholeTimetable = async () => {
    if (!cohortToDelete) return;
    try {
      const res = await fetch('/api/academics/timetables/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohort: cohortToDelete, timetables: [] })
      });
      if (res.ok) {
        showToast(`Class ${cohortToDelete} timetable cleared successfully.`, 'success');
        fetchAllData();
      } else {
        let errMsg = 'Failed to clear timetable.';
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch (parseErr) {
          errMsg = `Server Error (${res.status}): ${res.statusText || 'Unable to process request'}`;
        }
        showToast(errMsg, 'error');
      }
    } catch (e) {
      showToast(`Network error: ${e.message || 'Connection failed'}`, 'error');
    } finally {
      setShowConfirmModal(false);
      setCohortToDelete(null);
    }
  };

  const cancelDeleteWholeTimetable = () => {
    setShowConfirmModal(false);
    setCohortToDelete(null);
  };

  // 2. Exam Configuration
  const handleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/academics/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examForm)
      });
      
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (err) {
        showToast(`Server Error: ${res.status} - ${text.slice(0, 80)}`, 'error');
        return;
      }

      if (res.ok) {
        showToast(`Term exam configuration created.`, 'success');
        setShowAddModal(false);
        fetchAllData();
      } else {
        showToast(data.error || 'Invalid configuration parameters.', 'error');
      }
    } catch (e) {
      showToast('Operation error: ' + e.message, 'error');
    }
  };

  const deleteExamConfig = async (id) => {
    try {
      const res = await fetch(`/api/academics/exams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Exam configuration purged.', 'success');
        fetchAllData();
      }
    } catch (e) {
      showToast('Purging failed.', 'error');
    }
  };

  // 3. Exam Timetable Slot
  const handleExamTimetableSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...examTimetableForm, examId: activeExam };
    try {
      const res = await fetch('/api/academics/exam-timetables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Exam date/invigilator slot assigned.', 'success');
        setShowAddModal(false);
        fetchAllData();
      } else {
        showToast(data.error || 'Conflict or error.', 'error');
      }
    } catch (e) {
      showToast('Database call failed.', 'error');
    }
  };

  const deleteExamTimetableSlot = async (id) => {
    try {
      const res = await fetch(`/api/academics/exam-timetables/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Exam schedule period deleted.', 'success');
        fetchAllData();
      }
    } catch (e) {
      showToast('Error removing schedule slot.', 'error');
    }
  };

  // 4. Events
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/academics/events/${editingId}` : '/api/academics/events';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm)
      });
      if (res.ok) {
        showToast(editingId ? 'School event updated successfully.' : 'School event scheduled and logged.', 'success');
        setShowAddModal(false);
        setEditingId(null);
        fetchAllData();
      }
    } catch (e) {
      showToast(editingId ? 'Could not update event.' : 'Could not record event.', 'error');
    }
  };

  const deleteEventLog = async (id) => {
    try {
      const res = await fetch(`/api/academics/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Event listing removed.', 'success');
        fetchAllData();
      }
    } catch (e) {
      showToast('Could not delete event.', 'error');
    }
  };

  // 5. Notices
  const handleNoticeSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/academics/notices/${editingId}` : '/api/academics/notices';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeForm)
      });
      if (res.ok) {
        showToast(editingId ? 'Notice updated successfully.' : 'Notice published successfully.', 'success');
        setShowAddModal(false);
        setEditingId(null);
        fetchAllData();
      }
    } catch (e) {
      showToast(editingId ? 'Notice update failed.' : 'Notice publication failed.', 'error');
    }
  };

  const deleteNoticeBoard = async (id) => {
    try {
      const res = await fetch(`/api/academics/notices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Notice deleted.', 'success');
        fetchAllData();
      }
    } catch (e) {
      showToast('Operation failed.', 'error');
    }
  };

  // 6. Holidays
  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/academics/holidays/${editingId}` : '/api/academics/holidays';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayForm)
      });
      if (res.ok) {
        showToast(editingId ? 'Holiday updated successfully.' : 'Holiday declared.', 'success');
        setShowAddModal(false);
        setEditingId(null);
        fetchAllData();
      }
    } catch (e) {
      showToast(editingId ? 'Holiday update failed.' : 'Database update failed.', 'error');
    }
  };

  const deleteHolidaySchedule = async (id) => {
    try {
      const res = await fetch(`/api/academics/holidays/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Holiday designation removed.', 'success');
        fetchAllData();
      }
    } catch (e) {
      showToast('Holiday deletion failed.', 'error');
    }
  };

  const deleteResult = async (id) => {
    try {
      const res = await fetch(`/api/academics/results/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Result record deleted successfully.', 'success');
        fetchAllData();
      } else {
        showToast('Failed to delete result.', 'error');
      }
    } catch (e) {
      showToast('Error deleting result.', 'error');
    }
  };

  // 7. Results entry
  const handleSaveMarks = async (studentId, examItem) => {
    const score = resultsEntry[studentId];
    if (score === undefined || score === '') {
      showToast('Please input score.', 'error');
      return;
    }
    const payload = {
      studentId,
      examId: examItem.id,
      subject: activeSubject,
      obtainedMarks: parseFloat(score),
      totalMarks: examItem.totalMarks,
      term: examItem.examName
    };
    try {
      const res = await fetch('/api/academics/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Student grades stored and class rank re-evaluated.', 'success');
        fetchAllData();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Failed to register grades.', 'error');
      }
    } catch (e) {
      showToast('Grades registration error.', 'error');
    }
  };

  // Printable View Helper
  const handlePrint = (elementId) => {
    const prtContent = document.getElementById(elementId);
    const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    WinPrint.document.write(`
      <html>
        <head>
          <title>Academic Report Printout</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background: #f8fafc; font-weight: 700; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0f172a; padding-bottom: 15px; }
            .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
            .print-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
            .print-badge { font-weight: bold; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          ${prtContent.innerHTML}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
  };

  const handlePrintCalendar = () => {
    handlePrint('printable-calendar-view');
  };

  const handleExportTimetable = (cohort, format, schedules, examName) => {
    const cohortSchedules = schedules.filter(s => s.cohort === cohort);
    if (cohortSchedules.length === 0) {
      showToast('No timetable data to export.', 'error');
      return;
    }
    
    if (format === 'csv') {
      const headers = ['Subject', 'Exam Date', 'Start Time', 'End Time', 'Duration', 'Room', 'Invigilator'];
      const rows = cohortSchedules.map(s => [
        s.subject || '',
        s.examDate || '',
        s.startTime || '',
        s.endTime || '',
        s.duration || '',
        s.roomAllocation || s.room || '',
        s.invigilator || ''
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Exam_Timetable_${examName.replace(/\s+/g, '_')}_${cohort}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Timetable exported as CSV.', 'success');
    } else if (format === 'excel') {
      const headers = ['Subject', 'Exam Date', 'Start Time', 'End Time', 'Duration', 'Room', 'Invigilator'];
      const rows = cohortSchedules.map(s => [
        s.subject || '',
        s.examDate || '',
        s.startTime || '',
        s.endTime || '',
        s.duration || '',
        s.roomAllocation || s.room || '',
        s.invigilator || ''
      ]);
      const tsvContent = [headers.join('\t'), ...rows.map(e => e.map(val => val.replace(/\t/g, ' ')).join('\t'))].join('\n');
      const blob = new Blob(["\ufeff" + tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Exam_Timetable_${examName.replace(/\s+/g, '_')}_${cohort}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Timetable exported as Excel.', 'success');
    } else if (format === 'json') {
      const jsonStr = JSON.stringify(cohortSchedules, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Exam_Timetable_${examName.replace(/\s+/g, '_')}_${cohort}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Timetable exported as JSON.', 'success');
    } else if (format === 'pdf') {
      handlePrint(`printable-exam-timetable-${cohort}`);
    }
  };

  const handleExportEvent = (evt, format) => {
    if (format === 'pdf') {
      const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
      WinPrint.document.write(`
        <html>
          <head>
            <title>Event Details - ${evt.title}</title>
            <style>
              body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; line-height: 1.6; }
              .card { border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 600px; margin: 0 auto; }
              .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
              .header h1 { margin: 0; font-size: 24px; color: #0f172a; }
              .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; background: #f1f5f9; color: #475569; margin-top: 8px; text-transform: uppercase; }
              .description { font-size: 15px; color: #334155; margin-bottom: 20px; }
              .details { display: grid; grid-template-columns: auto 1fr; gap: 10px; font-size: 14px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
              .details-label { font-weight: bold; color: #64748b; }
              .details-value { color: #0f172a; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <h1>${evt.title}</h1>
                <span class="badge">${evt.type}</span>
              </div>
              <div class="description">
                ${evt.description || 'No description provided.'}
              </div>
              <div class="details">
                <div class="details-label">Date:</div>
                <div class="details-value">${new Date(evt.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div class="details-label">Time:</div>
                <div class="details-value">${evt.time || 'N/A'}</div>
                <div class="details-label">Venue:</div>
                <div class="details-value">${evt.venue || 'N/A'}</div>
                <div class="details-label">Target Audience:</div>
                <div class="details-value">${evt.participants || 'All Students'}</div>
                <div class="details-label">Organizer:</div>
                <div class="details-value">${evt.organizer || 'School Admin'}</div>
              </div>
            </div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      WinPrint.document.close();
      WinPrint.focus();
    } else if (format === 'json') {
      const jsonStr = JSON.stringify(evt, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Event_${evt.title.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Event exported as JSON.', 'success');
    } else if (format === 'csv') {
      const headers = ['Field', 'Value'];
      const rows = [
        ['Title', evt.title],
        ['Type', evt.type],
        ['Description', evt.description || ''],
        ['Date', new Date(evt.date).toLocaleDateString('en-US')],
        ['Time', evt.time || ''],
        ['Venue', evt.venue || ''],
        ['Target Participants', evt.participants || ''],
        ['Organizer', evt.organizer || '']
      ];
      const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Event_${evt.title.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Event exported as CSV.', 'success');
    }
  };

  const handleExportNotice = (nt, format) => {
    if (format === 'pdf') {
      const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
      WinPrint.document.write(`
        <html>
          <head>
            <title>Notice - ${nt.title}</title>
            <style>
              body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; line-height: 1.6; }
              .card { border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 600px; margin: 0 auto; }
              .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
              .header h1 { margin: 0; font-size: 24px; color: #0f172a; }
              .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; background: #f1f5f9; color: #475569; margin-top: 8px; text-transform: uppercase; }
              .badge-high { background: #fee2e2; color: #991b1b; }
              .content { font-size: 15px; color: #334155; margin-bottom: 20px; white-space: pre-wrap; }
              .details { display: grid; grid-template-columns: auto 1fr; gap: 10px; font-size: 14px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
              .details-label { font-weight: bold; color: #64748b; }
              .details-value { color: #0f172a; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <h1>${nt.title}</h1>
                <span class="badge ${nt.priority === 'High' ? 'badge-high' : ''}">${nt.priority} Priority Notice</span>
              </div>
              <div class="content">
                ${nt.content}
              </div>
              <div class="details">
                <div class="details-label">Category:</div>
                <div class="details-value">${nt.category || 'General'}</div>
                <div class="details-label">Date Published:</div>
                <div class="details-value">${nt.publishDate}</div>
                <div class="details-label">Visibility:</div>
                <div class="details-value">${nt.visibility || 'All'}</div>
              </div>
            </div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      WinPrint.document.close();
      WinPrint.focus();
    } else if (format === 'json') {
      const jsonStr = JSON.stringify(nt, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Notice_${nt.title.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Notice exported as JSON.', 'success');
    } else if (format === 'csv') {
      const headers = ['Field', 'Value'];
      const rows = [
        ['Title', nt.title],
        ['Content', nt.content],
        ['Category', nt.category || ''],
        ['Priority', nt.priority || ''],
        ['Date Published', nt.publishDate],
        ['Visibility', nt.visibility || '']
      ];
      const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Notice_${nt.title.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Notice exported as CSV.', 'success');
    }
  };

  const handleExportHoliday = (h, format) => {
    if (format === 'pdf') {
      const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
      WinPrint.document.write(`
        <html>
          <head>
            <title>Holiday Declaration - ${h.name}</title>
            <style>
              body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; line-height: 1.6; }
              .card { border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 600px; margin: 0 auto; }
              .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
              .header h1 { margin: 0; font-size: 24px; color: #0f172a; }
              .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; background: #fef3c7; color: #d97706; margin-top: 8px; text-transform: uppercase; }
              .badge-emergency { background: #fee2e2; color: #ef4444; }
              .description { font-size: 15px; color: #334155; margin-bottom: 20px; }
              .details { display: grid; grid-template-columns: auto 1fr; gap: 10px; font-size: 14px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
              .details-label { font-weight: bold; color: #64748b; }
              .details-value { color: #0f172a; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <h1>${h.name}</h1>
                <span class="badge ${h.type === 'Emergency' ? 'badge-emergency' : ''}">${h.type} Holiday</span>
              </div>
              <div class="description">
                ${h.description || 'No description/notes provided.'}
              </div>
              <div class="details">
                <div class="details-label">Start Date:</div>
                <div class="details-value">${new Date(h.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div class="details-label">End Date:</div>
                <div class="details-value">${new Date(h.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
            </div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      WinPrint.document.close();
      WinPrint.focus();
    } else if (format === 'json') {
      const jsonStr = JSON.stringify(h, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Holiday_${h.name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Holiday exported as JSON.', 'success');
    } else if (format === 'csv') {
      const headers = ['Field', 'Value'];
      const rows = [
        ['Name', h.name],
        ['Type', h.type],
        ['Description', h.description || ''],
        ['Start Date', new Date(h.startDate).toLocaleDateString('en-US')],
        ['End Date', new Date(h.endDate).toLocaleDateString('en-US')]
      ];
      const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Holiday_${h.name.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Holiday exported as CSV.', 'success');
    }
  };

  const handleDeleteCohortTimetable = async (examId, cohort) => {
    if (!window.confirm(`Are you sure you want to delete the exam timetable for ${cohort}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/academics/exam-timetables/exam/${examId}/cohort/${cohort}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Exam timetable deleted successfully.', 'success');
        fetchAllData();
      } else {
        let errMsg = 'Failed to delete exam timetable.';
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch (parseErr) {
          errMsg = `Server Error (${res.status}): ${res.statusText || 'Unable to process request'}`;
        }
        showToast(errMsg, 'error');
      }
    } catch (err) {
      showToast(`Network error: ${err.message || 'Connection failed'}`, 'error');
    }
  };

  // Filter students based on active grade/section
  // e.g. activeClass is "XII-A" -> matches Grade XII, Section A
  const filteredStudents = Array.isArray(students) ? students.filter(s => {
    const classCode = `${s.studentClass || 'I'}-${s.section || 'A'}`;
    return classCode.toUpperCase() === activeClass.toUpperCase();
  }) : [];

  // =============================================
  // SUB-VIEW RENDERERS
  // =============================================
  const renderGradeSubjects = () => {
    const gradesList = activeGrades.map(g => g.name);
    
    // Find grades that have subjects configured
    const activeGradesWithSubjects = gradesList.filter(g => subjects.some(s => s.grade === g));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Main Configuration Card (Original dropdown panel restored) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: 'fit-content' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.08)', color: 'hsl(var(--color-primary))' }}>
                <BookOpen size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Grade Subjects</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Configure subjects per grade.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', width: '100%' }}>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Grade Level</label>
                <select 
                  className="select-custom" 
                  value={newSubjectGrade} 
                  onChange={(e) => setNewSubjectGrade(e.target.value)}
                  style={{ width: '100%', marginTop: '4px', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)' }}
                >
                  {gradesList.map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  const gradeSubjects = subjects.filter(s => s.grade === newSubjectGrade);
                  setEditingSubjects(gradeSubjects);
                  const prefilled = Array(10).fill('');
                  gradeSubjects.slice(0, 10).forEach((sub, idx) => {
                    prefilled[idx] = sub.subjectName;
                  });
                  setNewSubjectsList(prefilled);
                  setShowSubjectsModal(true);
                }} 
                style={{ borderRadius: '8px', padding: '10px 24px', justifyContent: 'center', height: '38px', minWidth: '160px' }}
              >
                Manage Subjects
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Grade Cards Section (Show only when subjects exist for some grades) */}
        {activeGradesWithSubjects.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Configured Grade Subjects
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {activeGradesWithSubjects.map((g, idx) => {
                const gradeSubjects = subjects.filter(s => s.grade === g);
                const gradients = [
                  'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                  'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                  'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                  'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'
                ];
                const borderGrad = gradients[idx % gradients.length];

                return (
                  <div 
                    key={g} 
                    className="glass-panel animate-scale-up" 
                    style={{ 
                      padding: '20px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '16px',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '12px',
                      minHeight: '180px',
                      justifyContent: 'space-between'
                    }}
                  >
                    {/* Decorative Top Accent Bar */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: borderGrad }} />

                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                        Grade {g}
                      </h4>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        background: 'rgba(99, 102, 241, 0.08)', 
                        color: 'hsl(var(--color-primary))' 
                      }}>
                        {gradeSubjects.length} {gradeSubjects.length === 1 ? 'Subject' : 'Subjects'}
                      </span>
                    </div>
                    {/* Configured subjects list - rendered one below another without scroll */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px'
                    }}>
                      {gradeSubjects.map((sub) => (
                        <div 
                          key={sub.id} 
                          style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            color: 'var(--text-main)',
                            padding: '6px 0',
                            borderBottom: '1px solid var(--border-glass)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <span style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            background: borderGrad 
                          }} />
                          {sub.subjectName}
                        </div>
                      ))}
                    </div>

                    {/* Actions Row */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '10px', 
                      borderTop: '1px solid var(--border-glass)', 
                      paddingTop: '12px',
                      marginTop: 'auto'
                    }}>
                      <button 
                        onClick={() => {
                          const gradeSubjects = subjects.filter(s => s.grade === g);
                          setNewSubjectGrade(g);
                          setEditingSubjects(gradeSubjects);
                          const prefilled = Array(10).fill('');
                          gradeSubjects.slice(0, 10).forEach((sub, idx) => {
                            prefilled[idx] = sub.subjectName;
                          });
                          setNewSubjectsList(prefilled);
                          setShowSubjectsModal(true);
                        }}
                        className="btn-secondary"
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.75rem', 
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          border: '1px solid var(--border-glass)'
                        }}
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteAllGradeSubjects(g)}
                        className="btn-secondary"
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.75rem', 
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          border: '1px solid rgb(var(--color-danger-rgb))',
                          color: 'rgb(var(--color-danger-rgb))'
                        }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderClassTimetable = () => {
    const classSlots = timetables.filter(t => t.cohort === activeClass);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Operations Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* Card 1: Time Slots Management */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.08)', color: 'hsl(var(--color-info))' }}>
                <Clock size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Period Slots</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Register and delete daily school hours.</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', justifyContent: 'flex-end' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                Active slots configured: <strong>{timeslots.length} slots</strong>
              </p>
              <button 
                className="btn-secondary" 
                onClick={() => setShowTimeslotsModal(true)} 
                style={{ width: '100%', borderRadius: '8px', padding: '10px', justifyContent: 'center' }}
              >
                Manage Slots
              </button>
            </div>
          </div>

          {/* Card 3: Bulk Timetable Creation */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6' }}>
                <Calendar size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Create Bulk Timetable</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Setup the weekly matrix for a cohort.</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Grade</label>
                  <select 
                    className="select-custom" 
                    value={activeClass.split('-')[0] || 'I'} 
                    onChange={(e) => {
                      const currentSection = activeClass.split('-')[1] || 'A';
                      setActiveClass(`${e.target.value}-${currentSection}`);
                    }}
                    style={{ width: '100%', marginTop: '4px', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)' }}
                  >
                    {getGradesWithSubjects(subjects).map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Section</label>
                  <select 
                    className="select-custom" 
                    value={activeClass.split('-')[1] || 'A'} 
                    onChange={(e) => {
                      const currentGrade = activeClass.split('-')[0] || 'I';
                      setActiveClass(`${currentGrade}-${e.target.value}`);
                    }}
                    style={{ width: '100%', marginTop: '4px', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)' }}
                  >
                    {['A', 'B', 'C', 'D', 'E'].map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                className="btn-primary" 
                onClick={handleOpenBulkModal} 
                style={{ 
                  width: '100%', 
                  background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #4f46e5 100%)', 
                  borderRadius: '8px', 
                  padding: '10px', 
                  justifyContent: 'center',
                  fontWeight: 700
                }}
              >
                Create Bulk Timetable
              </button>
            </div>
          </div>

        </div>

        {/* Search & Filter Bar */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Search & Filter Timetables</h4>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search cohort (e.g. IX-A)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '220px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }}
            />
            
            <select 
              className="select-custom" 
              value={searchGrade}
              onChange={(e) => setSearchGrade(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }}
            >
              <option value="All">All Grades</option>
              {getGradesWithSubjects(subjects).map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>

            <select 
              className="select-custom" 
              value={searchSection}
              onChange={(e) => setSearchSection(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }}
            >
              <option value="All">All Sections</option>
              {['A', 'B', 'C', 'D', 'E'].map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>

            {(searchQuery || searchGrade !== 'All' || searchSection !== 'All') && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSearchGrade('All');
                  setSearchSection('All');
                }}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #ef4444', color: '#ef4444' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Timetable Grid Views */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {(() => {
            const cohortsWithTimetables = [...new Set(timetables.map(t => t.cohort))].sort();
            const filteredCohorts = cohortsWithTimetables.filter(cohort => {
              const matchesQuery = searchQuery.trim() === '' || cohort.toLowerCase().includes(searchQuery.toLowerCase());
              const [g, s] = cohort.split('-');
              const matchesGrade = searchGrade === 'All' || g === searchGrade;
              const matchesSection = searchSection === 'All' || s === searchSection;
              return matchesQuery && matchesGrade && matchesSection;
            });

            return filteredCohorts.length > 0 ? (
              filteredCohorts.map(cohort => {
                const classSlots = timetables.filter(t => t.cohort === cohort);
                return (
                  <div key={cohort} className="glass-panel" style={{ padding: '24px', overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                          Class Timetable: <span style={{ color: 'hsl(var(--color-primary))' }}>{cohort}</span>
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          Weekly schedule grid mapping all structured hours for Class {cohort}.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-secondary" 
                          onClick={() => handleOpenBulkModalForCohort(cohort)}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-glass)' }}
                        >
                          <Settings size={13} /> Edit Timetable
                        </button>
                        <button 
                          className="btn-secondary" 
                          onClick={() => handleDeleteWholeTimetable(cohort)}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgb(var(--color-danger-rgb))', color: 'rgb(var(--color-danger-rgb))' }}
                        >
                          <Trash2 size={13} /> Delete Timetable
                        </button>
                      </div>
                    </div>

                    <table className="table-custom" style={{ width: '100%', minWidth: '700px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '150px' }}>Time Slot</th>
                          {daysOfWeek.map(d => <th key={d}>{d}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {timeslots.map(slot => {
                          const breakMatch = slot.match(/\[(.*?)\]/);
                          const breakType = breakMatch ? breakMatch[1] : null;
                          const isBreak = !!breakType;

                          if (isBreak) {
                            return (
                              <tr key={slot} style={{ background: 'rgba(245, 158, 11, 0.02)' }}>
                                <td style={{ fontWeight: 700, color: 'hsl(var(--color-primary))', fontSize: '0.8rem', padding: '12px' }}>{slot}</td>
                                <td colSpan={6} style={{ 
                                  textAlign: 'center', 
                                  verticalAlign: 'middle', 
                                  padding: '12px', 
                                  fontWeight: 800, 
                                  color: '#d97706', 
                                  letterSpacing: '3px', 
                                  fontSize: '0.85rem',
                                  textTransform: 'uppercase',
                                  background: 'rgba(245, 158, 11, 0.04)',
                                  borderLeft: '1px solid var(--border-glass)',
                                  borderRadius: '8px'
                                }}>
                                  {breakType === 'Lunch Break' ? '≡ƒì▒ ' : breakType === 'Short Break' ? 'Γÿò ' : breakType === 'Recess' ? '≡ƒÅâ ' : breakType === 'Assembly' ? '≡ƒôó ' : 'ΓÜí '}{breakType}
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={slot}>
                              <td style={{ fontWeight: 700, color: 'hsl(var(--color-primary))', fontSize: '0.8rem' }}>{slot}</td>
                              {daysOfWeek.map(day => {
                                const matched = classSlots.find(t => t.day === day && t.time === slot);
                                return (
                                  <td key={day} style={{ padding: '8px' }}>
                                    {matched ? (
                                      <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px'
                                      }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>{matched.subject}</span>
                                        {matched.teacher && matched.teacher.trim() !== '' && matched.teacher.toLowerCase() !== 'n/a' && (
                                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <UserCheck size={9} /> {matched.teacher}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic', padding: '12px', textAlign: 'center' }}>
                                        Free Study
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}                      </tbody>
                    </table>
                  </div>
                );
              })
            ) : (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No timetables scheduled yet. Use the "Create Bulk Timetable" card above to set up a schedule for a grade and section.
              </div>
            );
          })()}
        </div>

      </div>
    );
  };

  const renderTeacherTimetable = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Operations Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Card: Configure Teacher Timetable */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.08)', color: 'hsl(var(--color-primary))' }}>
                <Calendar size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Configure Staff Schedule</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Setup the weekly matrix for a faculty member.</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select Staff</label>
                <select 
                  className="select-custom" 
                  value={activeTeacher} 
                  onChange={(e) => setActiveTeacher(e.target.value)}
                  style={{ width: '100%', marginTop: '4px', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)' }}
                >
                  {Array.isArray(teachers) && teachers.map((t, idx) => (
                    <option key={idx} value={t.name}>{t.name} ({t.department || 'Academic'})</option>
                  ))}
                </select>
              </div>
              <button 
                className="btn-primary" 
                onClick={handleOpenTeacherBulkModal} 
                style={{ 
                  width: '100%', 
                  background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #4f46e5 100%)', 
                  borderRadius: '8px', 
                  padding: '10px', 
                  justifyContent: 'center',
                  fontWeight: 700
                }}
              >
                Configure / Edit Timetable
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
               <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Search Staff Timetables</h4>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search staff by name..." 
              value={teacherSearchQuery}
              onChange={(e) => setTeacherSearchQuery(e.target.value)}
              style={{ width: '250px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }}
            />
            {teacherSearchQuery && (
              <button 
                onClick={() => setTeacherSearchQuery('')}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #ef4444', color: '#ef4444' }}
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {/* Timetable Grid Views */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {(() => {
            const teachersWithTimetables = [...new Set(teacherTimetables.filter(t => t.teacher && t.teacher.trim() !== '').map(t => t.teacher))].sort();
            const filteredTeachers = teachersWithTimetables.filter(tName => 
              teacherSearchQuery.trim() === '' || tName.toLowerCase().includes(teacherSearchQuery.toLowerCase())
            );

            return filteredTeachers.length > 0 ? (
              filteredTeachers.map(tName => {
                const teacherSlots = teacherTimetables.filter(t => t.teacher && t.teacher.toLowerCase() === tName.toLowerCase());
                
                // Get teacher details for department/specialization
                const teacherObj = Array.isArray(teachers) ? teachers.find(t => t.name.toLowerCase() === tName.toLowerCase()) : null;
                const deptStr = teacherObj ? (teacherObj.department || teacherObj.subjectSpecialization || 'Academic') : 'Academic';

                return (
                  <div key={tName} className="glass-panel" style={{ padding: '24px', overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                          Staff Timetable: <span style={{ color: 'hsl(var(--color-info))' }}>{tName}</span> <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>({deptStr})</span>
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          Weekly matrix layout mapping classroom workloads for {tName}.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-secondary" 
                          onClick={() => {
                            setActiveTeacher(tName);
                            handleOpenTeacherBulkModalForName(tName);
                          }}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-glass)' }}
                        >
                          <Settings size={13} /> Edit Timetable
                        </button>
                        <button 
                          className="btn-secondary" 
                          onClick={() => handleDeleteWholeTeacherTimetable(tName)}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgb(var(--color-danger-rgb))', color: 'rgb(var(--color-danger-rgb))' }}
                        >
                          <Trash2 size={13} /> Delete Timetable
                        </button>
                      </div>
                    </div>

                    <table className="table-custom" style={{ width: '100%', minWidth: '700px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '150px' }}>Time Slot</th>
                          {daysOfWeek.map(d => <th key={d}>{d}</th>)}
                        </tr>
                      </thead>
                      <tbody>{timeslots.map(slot => {
                          const breakMatch = slot.match(/\[(.*?)\]/);
                          const breakType = breakMatch ? breakMatch[1] : null;
                          const isBreak = !!breakType;

                          if (isBreak) {
                            return (
                              <tr key={slot} style={{ background: 'rgba(245, 158, 11, 0.02)' }}>
                                <td style={{ fontWeight: 700, color: 'hsl(var(--color-info))', fontSize: '0.8rem', padding: '12px' }}>{slot}</td>
                                <td colSpan={6} style={{ 
                                  textAlign: 'center', 
                                  verticalAlign: 'middle', 
                                  padding: '12px', 
                                  fontWeight: 800, 
                                  color: '#d97706', 
                                  letterSpacing: '3px', 
                                  fontSize: '0.85rem',
                                  textTransform: 'uppercase',
                                  background: 'rgba(245, 158, 11, 0.04)',
                                  borderLeft: '1px solid var(--border-glass)',
                                  borderRadius: '8px'
                                }}>
                                  {breakType === 'Lunch Break' ? '≡ƒì▒ ' : breakType === 'Short Break' ? 'Γÿò ' : breakType === 'Recess' ? '≡ƒÅâ ' : breakType === 'Assembly' ? '≡ƒôó ' : 'ΓÜí '}{breakType}
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={slot}>
                              <td style={{ fontWeight: 700, color: 'hsl(var(--color-info))', fontSize: '0.8rem' }}>{slot}</td>
                              {daysOfWeek.map(day => {
                                const matched = teacherSlots.find(t => t.day === day && t.time === slot);
                                return (
                                  <td key={day} style={{ padding: '8px' }}>
                                    {matched ? (
                                      <div style={{
                                         display: 'flex',
                                         alignItems: 'center',
                                         gap: '4px'
                                       }}>
                                         <Users size={12} style={{ color: 'hsl(var(--color-info))' }} />
                                         <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Grade {matched.cohort}</span>
                                       </div>
                                    ) : (
                                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic', padding: '12px', textAlign: 'center' }}>
                                        Free Study
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })
            ) : (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No staff timetables scheduled yet. Use the card above to set up a schedule for a staff member.
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  const renderExams = () => {
    const sessions = [...new Set(exams.map(e => e.academicSession).filter(Boolean))].sort().reverse();

    const filteredExams = exams.filter(ex => ex.status !== 'Completed').filter(ex => {
      const matchSearch = examSearch === '' || ex.examName.toLowerCase().includes(examSearch.toLowerCase());
      const matchSession = examSessionFilter === 'All' || ex.academicSession === examSessionFilter;
      const matchType = examTypeFilter === 'All' || ex.examType === examTypeFilter;
      const matchCustomName = examTypeFilter !== 'Custom Exam' || selectedCustomExamFilter === 'All' || ex.examName === selectedCustomExamFilter;
      const matchGrade = examGradeFilter === 'All' || (ex.gradeSections || []).some(gs => gs.grade === examGradeFilter);
      const matchSection = examSectionFilter === 'All' || (ex.gradeSections || []).some(gs => gs.section === examSectionFilter);
      return matchSearch && matchSession && matchType && matchCustomName && matchGrade && matchSection;
    });

    const handlePublishExam = async (examId) => {
      try {
        const res = await fetch(`/api/academics/exams/${examId}/publish`, { method: 'PUT' });
        if (res.ok) {
          showToast('Exam published successfully!', 'success');
          fetchAllData();
        } else {
          const data = await res.json();
          showToast(data.error || 'Failed to publish.', 'error');
        }
      } catch (e) {
        showToast('Network error.', 'error');
      }
    };

    const handleViewSchedule = (examId) => {
      const exam = exams.find(e => e.id === examId);
      if (exam) setViewScheduleExam(exam);
    };

    const handleDelete = async (id) => {
      if (!confirm('Delete this exam configuration? This will also remove all schedules.')) return;
      try {
        const res = await fetch(`/api/academics/exams/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Exam deleted.', 'success');
          fetchAllData();
        }
      } catch (e) {
        showToast('Delete failed.', 'error');
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Exam Management</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Create and manage exams with auto schedule generation.</p>
          </div>
          <button className="btn-primary" onClick={() => {
            resetWizardForm();
            setShowExamWizard(true);
          }}>
            <Plus size={16} /> Create New Exam
          </button>
        </div>

        {/* Search & Filter */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Filter Exams</h4>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" className="form-control" placeholder="Search exam name..." value={examSearch} onChange={e => setExamSearch(e.target.value)} style={{ width: '200px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }} />
            <select className="select-custom" value={examSessionFilter} onChange={e => setExamSessionFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)' }}>
              <option value="All">All Sessions</option>
              {sessions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="select-custom" value={examTypeFilter} onChange={e => { setExamTypeFilter(e.target.value); setSelectedCustomExamFilter('All'); }} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)' }}>
              <option value="All">All Types</option>
              {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {examTypeFilter === 'Custom Exam' && (
              <select className="select-custom animate-slide-down" value={selectedCustomExamFilter} onChange={e => setSelectedCustomExamFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)' }}>
                <option value="All">All Custom Exams</option>
                {[...new Set(exams.filter(ex => ex.examType === 'Custom Exam').map(ex => ex.examName).filter(Boolean))].sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
            <select className="select-custom" value={examGradeFilter} onChange={e => setExamGradeFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)' }}>
              <option value="All">All Grades</option>
              {getGradesWithSubjects(subjects).map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
        </div>

        {/* Exam Cards */}
        {filteredExams.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {filteredExams.flatMap(ex => {
              const gsList = ex.gradeSections || [];
              if (gsList.length === 0) return [{ ex, gs: null }];
              return gsList.map(gs => ({ ex, gs }));
            }).map(({ ex, gs }) => {
              const earliestStart = gs ? gs.startDate : '';
              const endDate = gs ? gs.endDate : ex.endDate;
              
              // Compute subjects specifically for this grade
              const gradeSubs = gs ? subjects.filter(sub => sub.grade === gs.grade).map(sub => sub.subjectName) : [];
              const uniqueGradeSubs = [...new Set(gradeSubs)];
              const cohortSubjects = uniqueGradeSubs.filter(sub => {
                const subKey = `${gs.grade}-${sub}`;
                return ex.subjectIncluded ? ex.subjectIncluded[subKey] !== false : true;
              });
              const totalSubjects = gs ? cohortSubjects.length : (ex.scheduleCount || 0);

              const statusColors = { Draft: { bg: 'rgba(107,114,128,0.08)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.15)' }, Scheduled: { bg: 'rgba(99,102,241,0.08)', color: 'hsl(var(--color-primary))', border: '1px solid rgba(99,102,241,0.15)' }, Published: { bg: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)' }, Completed: { bg: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.15)' } };
              const sc = statusColors[ex.status] || statusColors.Draft;

              const handleEditExam = (examObj) => {
                const startDates = {};
                const endDates = {};
                (examObj.gradeSections || []).forEach(gsItem => {
                  const key = `${gsItem.grade}-${gsItem.section}`;
                  startDates[key] = gsItem.startDate;
                  endDates[key] = gsItem.endDate || '';
                });

                setWizardForm({
                  id: examObj.id,
                  examName: examObj.examName,
                  examType: examObj.examType,
                  customExamName: examObj.examType === 'Custom Exam' ? examObj.examName : '',
                  academicSession: examObj.academicSession,
                  description: examObj.description || '',
                  totalMarks: examObj.totalMarks || 100,
                  selectedGrades: (examObj.gradeSections || []).map(gsItem => ({ grade: gsItem.grade, section: gsItem.section })),
                  startDates,
                  endDates,
                  subjectMarks: examObj.subjectMarks || {},
                  subjectIncluded: examObj.subjectIncluded || {},
                  gapDays: examObj.gapDays || 1
                });
                setExamWizardStep(1);
                setShowExamWizard(true);
              };

              return (
                <div 
                  key={`${ex.id}-${gs ? `${gs.grade}-${gs.section || ''}` : 'none'}`}
                  className="glass-panel" 
                  style={{ 
                    padding: '0', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        {gs ? (gs.section ? `Grade - ${gs.grade}-${gs.section}` : `Grade - ${gs.grade}`) : 'No Grades'}
                        {ex.academicSession && ` ┬╖ Session ${ex.academicSession}`}
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{ex.examName}</h3>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.08)', color: 'hsl(var(--color-primary))', border: '1px solid rgba(99, 102, 241, 0.15)', fontWeight: 600 }}>{ex.examType}</span>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.15)', fontWeight: 600 }}>Total Marks: {ex.totalMarks || 100}</span>
                      </div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, ...sc }}>{ex.status}</span>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', fontSize: '0.8rem' }}>

                      <div style={{ color: 'var(--text-muted)' }}>Total Subjects</div>
                      <div style={{ fontWeight: 600, textAlign: 'right' }}>{totalSubjects}</div>
                      <div style={{ color: 'var(--text-muted)' }}>Start Date</div>
                      <div style={{ fontWeight: 600, textAlign: 'right' }}>{earliestStart || '-'}</div>
                      <div style={{ color: 'var(--text-muted)' }}>End Date</div>
                      <div style={{ fontWeight: 600, textAlign: 'right' }}>{endDate || 'Not scheduled'}</div>
                    </div>

                    {/* Subjects and corresponding marks */}
                    <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '1px dashed var(--border-glass)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subjects & Marks</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(() => {
                          const list = [];
                          if (gs) {
                            const gradeSubs = subjects.filter(sub => sub.grade === gs.grade).map(sub => sub.subjectName);
                            const uniqueGradeSubs = [...new Set(gradeSubs)];
                            uniqueGradeSubs.forEach(sub => {
                              const subKey = `${gs.grade}-${sub}`;
                              const isIncluded = ex.subjectIncluded ? ex.subjectIncluded[subKey] !== false : true;
                              if (isIncluded) {
                                const marks = ex.subjectMarks && ex.subjectMarks[subKey] !== undefined ? ex.subjectMarks[subKey] : (ex.totalMarks || 100);
                                list.push({ grade: gs.grade, section: gs.section, subject: sub, marks });
                              }
                            });
                          }
                          if (list.length === 0) {
                            return <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No subjects added</div>;
                          }
                          return list.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center', padding: '4px 0' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                {item.subject}
                              </span>
                              <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.78rem' }}>{item.marks} Marks</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {ex.status === 'Published' && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginRight: 'auto' }}>
                        <CheckCircle size={14} /> Published
                      </span>
                    )}
                    {ex.status !== 'Published' && ex.status !== 'Completed' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePublishExam(ex.id); }} 
                        className="btn-primary" 
                        style={{ padding: '6px 10px', fontSize: '0.72rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#fff' }}
                      >
                        <Send size={13} /> Publish
                      </button>
                    )}
                    {ex.status !== 'Completed' && (
                      <button 
                        onClick={async (e) => { 
                          e.stopPropagation(); 
                          if (confirm('Are you sure you want to mark this exam as completed? It will be moved to Exam History.')) {
                            try {
                              const res = await fetch(`/api/academics/exams/${ex.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'Completed' })
                              });
                              if (res.ok) {
                                showToast('Exam marked as completed!', 'success');
                                fetchAllData();
                              } else {
                                const data = await res.json();
                                showToast(data.error || 'Failed to complete exam.', 'error');
                              }
                            } catch (err) {
                              showToast('Network error.', 'error');
                            }
                          }
                        }} 
                        className="btn-primary" 
                        style={{ padding: '6px 10px', fontSize: '0.72rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#fff' }}
                      >
                        <CheckCircle size={13} /> Mark Completed
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditExam(ex); }} 
                      className="btn-secondary" 
                      style={{ padding: '6px 10px', fontSize: '0.72rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(99,102,241,0.3)', color: 'hsl(var(--color-primary))' }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button 
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        if (window.confirm('Are you sure you want to delete this exam configuration? This will permanently delete the exam, all its timetable schedules, and all related results.')) {
                          await deleteExamConfig(ex.id);
                        }
                      }} 
                      className="btn-secondary" 
                      style={{ padding: '6px 10px', fontSize: '0.72rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '16px', textAlign: 'center' }}>
            <BookOpen size={48} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>No exams found</span>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Click "Create New Exam" to get started with the multi-step wizard.</p>
          </div>
        )}
      </div>
    );
  };

  const renderExamTimetable = () => {
    const selectedExamObj = exams.find(e => e.id === activeExam);
    const timetableExamName = selectedExamObj ? selectedExamObj.examName : null;
    const matchingExams = timetableExamName ? exams.filter(e => e.examName === timetableExamName && e.status !== 'Completed') : [];
    const matchingExamIds = matchingExams.map(e => e.id);
    const schedules = examTimetables.filter(et => matchingExamIds.includes(et.examId));
    const cohorts = [...new Set(schedules.map(s => s.cohort).filter(Boolean))].sort();
    const sessions = [...new Set(exams.map(e => e.academicSession).filter(Boolean))].sort().reverse();
    const visibleExams = activeExam
      ? matchingExams
      : exams.filter(ex => ex.status !== 'Completed' && (timetableSession === 'All' || ex.academicSession === timetableSession));

    const examsWithSchedules = visibleExams.filter(ex => {
      const examSchedules = examTimetables.filter(et => et.examId === ex.id);
      return examSchedules.length > 0;
    });


    const examGradeSections = selectedExamObj ? (selectedExamObj.gradeSections || []) : [];
    const earliestStart = examGradeSections.length > 0 ? examGradeSections.map(g => g.startDate).filter(Boolean).sort()[0] : '';
    const allExamGradeSections = matchingExams.flatMap(e => e.gradeSections || []);
    const uniqueGrades = activeExam
      ? [...new Set(allExamGradeSections.map(gs => gs.grade))].filter(g => subjects.some(s => s.grade === g))
      : [];
    const filteredSectionsForGrade = allExamGradeSections.filter(gs => gs.grade === manualGrade).map(gs => gs.section);


    const handleDeleteSlot = async (id) => {
      if (!confirm('Remove this exam slot from schedule?')) return;
      try {
        const res = await fetch(`/api/academics/exam-timetables/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Schedule slot removed.', 'success');
          fetchAllData();
        }
      } catch (e) {
        showToast('Error removing slot.', 'error');
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      try {
        const dateObj = new Date(dateStr + 'T00:00:00');
        const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${weekday},\u00a0\u00a0\u00a0${day}/${month}/${year}`;
      } catch (e) {
        return dateStr;
      }
    };

    const getDayOfWeek = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
    };

    const getConsecutiveExamDates = (startStr, count) => {
      if (!startStr) return [];
      const dates = [];
      let current = new Date(startStr + 'T00:00:00');
      while (dates.length < count) {
        const dayOfWeek = current.getDay(); // 0 = Sunday
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        const isSunday = dayOfWeek === 0;
        const isHoliday = holidays.some(h => dateStr >= h.startDate && dateStr <= h.endDate);
        
        if (!isSunday && !isHoliday) {
          dates.push(dateStr);
        }
        current.setDate(current.getDate() + 1);
      }
      return dates;
    };

    const handleOpenManualScheduler = (gradeVal = manualGrade, sectionVal = manualSection, examIdVal = activeExam) => {
      const targetGrade = gradeVal;
      const targetSection = sectionVal;
      const targetExamId = examIdVal;
      
      const targetExamObj = exams.find(e => e.id === targetExamId);
      const targetGradeSections = targetExamObj ? (targetExamObj.gradeSections || []) : [];
      const gsObj = targetGradeSections.find(gs => gs.grade === targetGrade && gs.section === targetSection);
      const gradeSubjects = subjects.filter(s => s.grade === targetGrade);
      if (gradeSubjects.length === 0) {
        showToast(`No subjects configured for Grade ${targetGrade}. Please configure subjects first.`, 'error');
        return;
      }
      const startStr = gsObj ? gsObj.startDate : new Date().toISOString().split('T')[0];
      
      const examSchedules = examTimetables.filter(s => s.examId === targetExamId);
      const existingCohortSlots = examSchedules.filter(s => s.cohort === `${targetGrade}-${targetSection}`);
      let initialSlots = [];
      if (existingCohortSlots.length > 0) {
        initialSlots = existingCohortSlots.map(s => ({
          subject: s.subject,
          examDate: s.examDate,
          startTime: s.startTime || '09:00 AM',
          endTime: s.endTime || '12:00 PM'
        }));
      } else {
        const dates = getConsecutiveExamDates(startStr, gradeSubjects.length);
        initialSlots = gradeSubjects.map((sub, idx) => ({
          subject: sub.subjectName,
          examDate: dates[idx] || startStr,
          startTime: '09:00 AM',
          endTime: '12:00 PM'
        }));
      }
      
      if (targetExamId) {
        setActiveExam(targetExamId);
      }
      setManualGrade(targetGrade);
      setManualSection(targetSection);
      setManualSlots(initialSlots);
      setIsManualSchedulerOpen(true);
    };

    const handleDragStart = (e, index) => {
      setDraggedSlotIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
      e.preventDefault();
    };

    const handleDrop = (e, targetIndex) => {
      e.preventDefault();
      if (draggedSlotIndex === null || draggedSlotIndex === targetIndex) return;

      const updatedSlots = [...manualSlots];
      const [draggedItem] = updatedSlots.splice(draggedSlotIndex, 1);
      updatedSlots.splice(targetIndex, 0, draggedItem);

      const gsObj = examGradeSections.find(gs => gs.grade === manualGrade && gs.section === manualSection);
      const startStr = gsObj ? gsObj.startDate : new Date().toISOString().split('T')[0];
      const dates = getConsecutiveExamDates(startStr, updatedSlots.length);
      
      const reSequencedSlots = updatedSlots.map((slot, idx) => ({
        ...slot,
        examDate: dates[idx] || slot.examDate
      }));

      setManualSlots(reSequencedSlots);
      setDraggedSlotIndex(null);
    };

    const handleDragEnd = () => {
      setDraggedSlotIndex(null);
    };

    const handleDateChange = (index, newDate) => {
      const updated = [...manualSlots];
      updated[index].examDate = newDate;
      setManualSlots(updated);
    };

    const handleStartTimeChange = (index, newTime) => {
      const updated = [...manualSlots];
      updated[index].startTime = newTime;
      setManualSlots(updated);
    };

    const handleEndTimeChange = (index, newTime) => {
      const updated = [...manualSlots];
      updated[index].endTime = newTime;
      setManualSlots(updated);
    };

    const convertTo24HourFormat = (time12) => {
      if (!time12) return '09:00';
      const match = time12.trim().match(/^(\d+):(\d+)\s*(am|pm)$/i);
      if (!match) return '09:00';
      let hrs = parseInt(match[1]);
      const mins = parseInt(match[2]);
      const ampm = match[3].toLowerCase();
      
      if (ampm === 'pm' && hrs < 12) hrs += 12;
      if (ampm === 'am' && hrs === 12) hrs = 0;
      
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    const convertTo12HourFormat = (time24) => {
      if (!time24) return '09:00 AM';
      const [hrsStr, minsStr] = time24.split(':');
      let hrs = parseInt(hrsStr);
      const mins = parseInt(minsStr);
      if (isNaN(hrs) || isNaN(mins)) return '09:00 AM';
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12;
      if (hrs === 0) hrs = 12;
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
    };

    const handleSaveCustomTimetable = async () => {
      try {
        const sectionsToSave = filteredSectionsForGrade.length > 0 ? filteredSectionsForGrade : [manualSection || 'A'];
        const promises = sectionsToSave.map(sec => 
          fetch('/api/academics/exam-timetables/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              examId: activeExam,
              cohort: `${manualGrade}-${sec}`,
              schedules: manualSlots
            })
          })
        );
        const responses = await Promise.all(promises);
        const allOk = responses.every(res => res.ok);
        if (allOk) {
          // Reset published status when editing schedules
          await fetch(`/api/academics/exams/${activeExam}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timetablePublished: false })
          });
          showToast('Custom exam timetable saved successfully!', 'success');
          setIsManualSchedulerOpen(false);
          fetchAllData();
        } else {
          showToast('Failed to save custom timetable.', 'error');
        }
      } catch (err) {
        showToast('Network error while saving.', 'error');
      }
    };

    if (isManualSchedulerOpen) {
      const gsObj = examGradeSections.find(gs => gs.grade === manualGrade && gs.section === manualSection);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Custom Exam Timetable Editor</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Grade {manualGrade}{manualSection ? ` - Section ${manualSection}` : ''} | Exam: {selectedExamObj?.examName}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setIsManualSchedulerOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveCustomTimetable} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #4f46e5 100%)', fontWeight: 700 }}>
                Save Timetable
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {manualSlots.map((slot, index) => {
                const isDragged = draggedSlotIndex === index;
                return (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: isDragged ? 'rgba(99,102,241,0.04)' : 'var(--bg-glass-active)',
                      border: isDragged ? '2px dashed hsl(var(--color-primary))' : '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      opacity: isDragged ? 0.5 : 1,
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                      boxShadow: 'var(--shadow-glass)'
                    }}
                  >
                    <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      <GripVertical size={18} />
                    </div>

                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-primary))', fontWeight: 800, fontSize: '0.9rem' }}>
                      {index + 1}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {slot.subject}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.06)', color: 'hsl(var(--color-primary))', fontWeight: 700 }}>
                          {getDayOfWeek(slot.examDate) || 'No day'}
                        </span>
                      </div>
                    </div>

                    <div style={{ width: '180px' }}>
                      <input
                        type="date"
                        className="form-control"
                        value={slot.examDate}
                        onChange={(e) => handleDateChange(index, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-main)'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="time"
                        className="form-control"
                        value={convertTo24HourFormat(slot.startTime || '09:00 AM')}
                        onChange={(e) => handleStartTimeChange(index, convertTo12HourFormat(e.target.value))}
                        style={{
                          width: '110px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-main)'
                        }}
                      />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>to</span>
                      <input
                        type="time"
                        className="form-control"
                        value={convertTo24HourFormat(slot.endTime || '12:00 PM')}
                        onChange={(e) => handleEndTimeChange(index, convertTo12HourFormat(e.target.value))}
                        style={{
                          width: '110px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-main)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Exam Timetable</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure and view exam schedules manually.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select 
              className="select-custom" 
              value={timetableSession} 
              onChange={(e) => { 
                setTimetableSession(e.target.value); 
                setActiveExam(''); 
                setManualGrade(''); 
                setManualSection(''); 
              }} 
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem' }}
            >
              <option value="All">All Sessions</option>
              {sessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select 
              className="select-custom" 
              value={activeExam} 
              onChange={(e) => { 
                const selectedVal = e.target.value;
                // Find the first non-completed exam with this name
                const firstExam = exams.find(ex => ex.examName === selectedVal && ex.status !== 'Completed');
                setActiveExam(firstExam ? firstExam.id : selectedVal); 
                setManualGrade(''); 
                setManualSection(''); 
              }} 
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem' }}
            >
              <option value="">All Exams</option>
              {(() => {
                const seen = new Set();
                return exams
                  .filter(ex => ex.status !== 'Completed')
                  .filter(ex => timetableSession === 'All' || ex.academicSession === timetableSession)
                  .filter(ex => {
                    const isDuplicate = seen.has(ex.examName);
                    seen.add(ex.examName);
                    return !isDuplicate;
                  })
                  .map(ex => (
                    <option key={ex.id} value={ex.examName}>
                      {ex.examName}
                    </option>
                  ));
              })()}
            </select>

            {activeExam && (
              <>
                <select 
                  className="select-custom" 
                  value={manualGrade} 
                  onChange={(e) => { 
                    const gradeVal = e.target.value;
                    setManualGrade(gradeVal); 
                    if (gradeVal) {
                      const sections = allExamGradeSections.filter(gs => gs.grade === gradeVal).map(gs => gs.section);
                      setManualSection(sections[0] !== undefined ? sections[0] : 'A');
                    } else {
                      setManualSection('');
                    }
                  }} 
                  style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem' }}
                >
                  <option value="">Select Grade</option>
                  {uniqueGrades.map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
                <button 
                  className="btn-primary" 
                  disabled={!manualGrade} 
                  onClick={() => {
                    const matchingExam = matchingExams.find(e => (e.gradeSections || []).some(gs => gs.grade === manualGrade));
                    const examId = matchingExam?.id || activeExam;
                    handleOpenManualScheduler(manualGrade, manualSection, examId);
                  }} 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #4f46e5 100%)' }}
                >
                  <Plus size={14} /> Create Timetable
                </button>

              </>
            )}
          </div>
        </div>

        {(() => {
          const flatSchedules = [];
          examsWithSchedules.forEach(ex => {
            const examSchedules = examTimetables.filter(et => et.examId === ex.id);
            const examCohorts = [...new Set(examSchedules.map(s => s.cohort).filter(Boolean))].sort();
            examCohorts.forEach(cohort => {
              flatSchedules.push({ ex, cohort, examSchedules });
            });
          });

          if (flatSchedules.length === 0) {
            return (
              <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Calendar size={40} style={{ opacity: 0.3 }} />
                <p style={{ fontWeight: 600, marginTop: '12px' }}>No active exam schedules found</p>
              </div>
            );
          }

          return flatSchedules.map(({ ex, cohort, examSchedules }) => {
            const cohortSchedules = examSchedules.filter(s => s.cohort === cohort);
            const [grade, section] = cohort.split('-');
            const gsObj = (ex.gradeSections || []).find(gs => gs.grade === grade && (gs.section === section || (!gs.section && !section)));
            const earliestStart = gsObj ? gsObj.startDate : '';
            const endDate = gsObj ? gsObj.endDate : ex.endDate;

            return (
              <div key={`${ex.id}-${cohort}`} id={`printable-exam-timetable-${cohort}`} className="glass-panel animate-scale-up" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ borderBottom: '2px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Top Row: Title on Left, Actions on Right */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        {section ? `Grade ${grade} - Section ${section}` : `Grade ${grade}`}
                      </div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{ex.examName}</h2>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }} className="no-print">
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleOpenManualScheduler(grade, section, ex.id)} 
                        style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--border-glass)' }}
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleDeleteCohortTimetable(ex.id, cohort)} 
                        style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--border-glass)', borderColor: 'rgb(var(--color-danger-rgb))', color: 'rgb(var(--color-danger-rgb))' }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleExportTimetable(cohort, 'pdf', examSchedules, ex.examName)} 
                        style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--border-glass)' }}
                      >
                        <Download size={13} /> Export PDF
                      </button>
                      <div style={{ width: '1px', height: '24px', background: 'var(--border-glass)', margin: '0 4px' }} />
                      {ex.timetablePublished ? (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.08)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.15)' }}>
                          <CheckCircle size={14} /> Published
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/academics/exams/${ex.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ timetablePublished: true })
                              });
                              if (res.ok) {
                                showToast('Exam timetable published successfully!', 'success');
                                fetchAllData();
                              } else {
                                const data = await res.json();
                                showToast(data.error || 'Failed to publish timetable.', 'error');
                              }
                            } catch (err) {
                              showToast('Network error.', 'error');
                            }
                          }}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#fff' }}
                        >
                          <Send size={12} /> Publish Timetable
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Metadata Info */}
                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span>Type: <strong>{ex.examType}</strong></span>
                    <span>Session: <strong>{ex.academicSession || '-'}</strong></span>
                    {earliestStart && <span>Starts: <strong>{formatDate(earliestStart)}</strong></span>}
                    {endDate && <span>Ends: <strong>{formatDate(endDate)}</strong></span>}
                    <span>Total Marks: <strong>{ex.totalMarks || '-'}</strong></span>
                  </div>
                </div>

                <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px' }}>Subject</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px' }}>Exam Date</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px' }}>Time Slot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortSchedules.map(slot => (
                      <tr key={slot.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ fontWeight: 700, textAlign: 'left', padding: '12px 16px' }}>{slot.subject}</td>
                        <td style={{ textAlign: 'left', padding: '12px 16px' }}>{formatDate(slot.examDate)}</td>
                        <td style={{ textAlign: 'left', padding: '12px 16px' }}>
                          {slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : (slot.timeSlot || slot.duration || '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          });
        })()}
      </div>
    );
  };

  const renderExamsHistory = () => {
    const sessions = [...new Set(exams.map(e => e.academicSession).filter(Boolean))].sort().reverse();
    const completedExams = exams.filter(ex => ex.status === 'Completed');

    const filteredHistory = completedExams.filter(ex => {
      const matchSearch = examSearch === '' || ex.examName.toLowerCase().includes(examSearch.toLowerCase());
      const matchSession = examSessionFilter === 'All' || ex.academicSession === examSessionFilter;
      const matchType = examTypeFilter === 'All' || ex.examType === examTypeFilter;
      const matchCustomName = examTypeFilter !== 'Custom Exam' || selectedCustomExamFilter === 'All' || ex.examName === selectedCustomExamFilter;
      const matchGrade = examGradeFilter === 'All' || (ex.gradeSections || []).some(gs => gs.grade === examGradeFilter);
      const matchSection = examSectionFilter === 'All' || (ex.gradeSections || []).some(gs => gs.section === examSectionFilter);
      return matchSearch && matchSession && matchType && matchCustomName && matchGrade && matchSection;
    });

    const handleViewSchedule = (examId) => {
      const exam = exams.find(e => e.id === examId);
      if (exam) setViewScheduleExam(exam);
    };

    const handleDelete = async (id) => {
      if (!confirm('Delete this completed exam history? This will permanently remove the record.')) return;
      try {
        const res = await fetch(`/api/academics/exams/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Exam history deleted.', 'success');
          fetchAllData();
        }
      } catch (e) {
        showToast('Delete failed.', 'error');
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Exam History</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>View and audit historical completed examinations and schedules.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Select Session:</span>
            <select className="select-custom" value={examSessionFilter} onChange={e => setExamSessionFilter(e.target.value)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', minWidth: '150px' }}>
              <option value="All">All Sessions</option>
              {sessions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Filter History</h4>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" className="form-control" placeholder="Search exam name..." value={examSearch} onChange={e => setExamSearch(e.target.value)} style={{ width: '200px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }} />
            <select className="select-custom" value={examTypeFilter} onChange={e => { setExamTypeFilter(e.target.value); setSelectedCustomExamFilter('All'); }} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)' }}>
              <option value="All">All Types</option>
              {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {examTypeFilter === 'Custom Exam' && (
              <select className="select-custom animate-slide-down" value={selectedCustomExamFilter} onChange={e => setSelectedCustomExamFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)' }}>
                <option value="All">All Custom Exams</option>
                {[...new Set(exams.filter(ex => ex.examType === 'Custom Exam').map(ex => ex.examName).filter(Boolean))].sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
            <select className="select-custom" value={examGradeFilter} onChange={e => setExamGradeFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)' }}>
              <option value="All">All Grades</option>
              {getGradesWithSubjects(subjects).map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
        </div>

        {/* History Cards */}
        {filteredHistory.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {filteredHistory.flatMap(ex => {
              const gsList = ex.gradeSections || [];
              if (gsList.length === 0) return [{ ex, gs: null }];
              return gsList.map(gs => ({ ex, gs }));
            }).map(({ ex, gs }) => {
              const earliestStart = gs ? gs.startDate : '';
              const endDate = gs ? gs.endDate : ex.endDate;

              // Compute subjects specifically for this grade
              const gradeSubs = gs ? subjects.filter(sub => sub.grade === gs.grade).map(sub => sub.subjectName) : [];
              const uniqueGradeSubs = [...new Set(gradeSubs)];
              const cohortSubjects = uniqueGradeSubs.filter(sub => {
                const subKey = `${gs.grade}-${sub}`;
                return ex.subjectIncluded ? ex.subjectIncluded[subKey] !== false : true;
              });
              const totalSubjects = gs ? cohortSubjects.length : (ex.scheduleCount || 0);

              const statusColors = { Draft: { bg: 'rgba(107,114,128,0.08)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.15)' }, Scheduled: { bg: 'rgba(99,102,241,0.08)', color: 'hsl(var(--color-primary))', border: '1px solid rgba(99,102,241,0.15)' }, Published: { bg: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)' }, Completed: { bg: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.15)' } };
              const sc = statusColors[ex.status] || statusColors.Draft;

              return (
                <div 
                  key={`${ex.id}-${gs ? `${gs.grade}-${gs.section || ''}` : 'none'}`}
                  className="glass-panel" 
                  style={{ 
                    padding: '0', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        {gs ? (gs.section ? `Grade - ${gs.grade}-${gs.section}` : `Grade - ${gs.grade}`) : 'No Grades'}
                        {ex.academicSession && ` ┬╖ Session ${ex.academicSession}`}
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{ex.examName}</h3>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.08)', color: 'hsl(var(--color-primary))', border: '1px solid rgba(99, 102, 241, 0.15)', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>{ex.examType}</span>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, ...sc }}>{ex.status}</span>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', fontSize: '0.8rem' }}>

                      <div style={{ color: 'var(--text-muted)' }}>Total Subjects</div>
                      <div style={{ fontWeight: 600, textAlign: 'right' }}>{totalSubjects}</div>
                      <div style={{ color: 'var(--text-muted)' }}>Start Date</div>
                      <div style={{ fontWeight: 600, textAlign: 'right' }}>{earliestStart || '-'}</div>
                      <div style={{ color: 'var(--text-muted)' }}>End Date</div>
                      <div style={{ fontWeight: 600, textAlign: 'right' }}>{endDate || 'Not scheduled'}</div>
                    </div>

                    {/* Subjects and corresponding marks */}
                    <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '1px dashed var(--border-glass)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subjects & Marks</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(() => {
                          const list = [];
                          if (gs) {
                            const gradeSubs = subjects.filter(sub => sub.grade === gs.grade).map(sub => sub.subjectName);
                            const uniqueGradeSubs = [...new Set(gradeSubs)];
                            uniqueGradeSubs.forEach(sub => {
                              const subKey = `${gs.grade}-${sub}`;
                              const isIncluded = ex.subjectIncluded ? ex.subjectIncluded[subKey] !== false : true;
                              if (isIncluded) {
                                const marks = ex.subjectMarks && ex.subjectMarks[subKey] !== undefined ? ex.subjectMarks[subKey] : (ex.totalMarks || 100);
                                list.push({ grade: gs.grade, section: gs.section, subject: sub, marks });
                              }
                            });
                          }
                          if (list.length === 0) {
                            return <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No subjects added</div>;
                          }
                          return list.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center', padding: '4px 0' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                {item.subject}
                              </span>
                              <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.78rem' }}>{item.marks} Marks</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {examTimetables.some(et => et.examId === ex.id) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleViewSchedule(ex.id); }} 
                        className="btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.72rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--border-glass)' }}
                      >
                        <Eye size={13} /> View Timetable
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(ex.id); }} 
                      className="btn-secondary" 
                      style={{ padding: '6px 10px', fontSize: '0.72rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '16px', textAlign: 'center' }}>
            <BookOpen size={48} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>No completed exams found</span>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Completed exams will appear here after being marked as completed.</p>
          </div>
        )}
      </div>
    );
  };

  const renderPublishedExams = () => {
    const publishedExams = exams.filter(ex => ex.status === 'Published');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Published Exams</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Official active examination configurations visible to students/teachers.</p>
          </div>
        </div>

        {/* Exam Cards */}
        {publishedExams.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {publishedExams.flatMap(ex => {
              const gsList = ex.gradeSections || [];
              if (gsList.length === 0) return [{ ex, gs: null }];
              return gsList.map(gs => ({ ex, gs }));
            }).map(({ ex, gs }) => {
              const earliestStart = gs ? gs.startDate : '';
              const endDate = gs ? gs.endDate : ex.endDate;

              // Compute subjects specifically for this grade
              const gradeSubs = gs ? subjects.filter(sub => sub.grade === gs.grade).map(sub => sub.subjectName) : [];
              const uniqueGradeSubs = [...new Set(gradeSubs)];
              const cohortSubjects = uniqueGradeSubs.filter(sub => {
                const subKey = `${gs.grade}-${sub}`;
                return ex.subjectIncluded ? ex.subjectIncluded[subKey] !== false : true;
              });
              const totalSubjects = gs ? cohortSubjects.length : (ex.scheduleCount || 0);

              const statusColors = { Published: { bg: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)' } };
              const sc = statusColors.Published;

              return (
                <div 
                  key={`${ex.id}-${gs ? `${gs.grade}-${gs.section || ''}` : 'none'}`}
                  className="glass-panel" 
                  style={{ 
                    padding: '0', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        {gs ? (gs.section ? `Grade - ${gs.grade}-${gs.section}` : `Grade - ${gs.grade}`) : 'No Grades'}
                        {ex.academicSession && ` ┬╖ Session ${ex.academicSession}`}
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{ex.examName}</h3>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.08)', color: 'hsl(var(--color-primary))', border: '1px solid rgba(99, 102, 241, 0.15)', fontWeight: 600 }}>{ex.examType}</span>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.15)', fontWeight: 600 }}>Total Marks: {ex.totalMarks || 100}</span>
                      </div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, ...sc }}>{ex.status}</span>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', fontSize: '0.8rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Total Subjects</div>
                      <div style={{ fontWeight: 600, textAlign: 'right' }}>{totalSubjects}</div>
                      <div style={{ color: 'var(--text-muted)' }}>Start Date</div>
                      <div style={{ fontWeight: 600, textAlign: 'right' }}>{earliestStart || '-'}</div>
                      <div style={{ color: 'var(--text-muted)' }}>End Date</div>
                      <div style={{ fontWeight: 600, textAlign: 'right' }}>{endDate || 'Not scheduled'}</div>
                    </div>

                    <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '1px dashed var(--border-glass)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subjects & Marks</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(() => {
                          const list = [];
                          if (gs) {
                            const gradeSubs = subjects.filter(sub => sub.grade === gs.grade).map(sub => sub.subjectName);
                            const uniqueGradeSubs = [...new Set(gradeSubs)];
                            uniqueGradeSubs.forEach(sub => {
                              const subKey = `${gs.grade}-${sub}`;
                              const isIncluded = ex.subjectIncluded ? ex.subjectIncluded[subKey] !== false : true;
                              if (isIncluded) {
                                const marks = ex.subjectMarks && ex.subjectMarks[subKey] !== undefined ? ex.subjectMarks[subKey] : (ex.totalMarks || 100);
                                list.push({ grade: gs.grade, section: gs.section, subject: sub, marks });
                              }
                            });
                          }
                          if (list.length === 0) {
                            return <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No subjects added</div>;
                          }
                          return list.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center', padding: '4px 0' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                {item.subject}
                              </span>
                              <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.78rem' }}>{item.marks} Marks</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BookOpen size={40} style={{ opacity: 0.3 }} />
            <p style={{ fontWeight: 600, marginTop: '12px' }}>No published exams found</p>
          </div>
        )}
      </div>
    );
  };

  const renderPublishedTimetables = () => {
    const publishedTimetableExams = exams.filter(ex => ex.timetablePublished === true && ex.status !== 'Completed');

    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const flatPublishedSchedules = [];
    publishedTimetableExams.forEach(ex => {
      const examSchedules = examTimetables.filter(et => et.examId === ex.id);
      const examCohorts = [...new Set(examSchedules.map(s => s.cohort).filter(Boolean))].sort();
      examCohorts.forEach(cohort => {
        flatPublishedSchedules.push({ ex, cohort, examSchedules });
      });
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Published Exam Timetables</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Official active examination timetables visible to students/teachers.</p>
          </div>
        </div>

        {flatPublishedSchedules.length > 0 ? (
          flatPublishedSchedules.map(({ ex, cohort, examSchedules }) => {
            const cohortSchedules = examSchedules.filter(s => s.cohort === cohort);
            const [grade, section] = cohort.split('-');
            const gsObj = (ex.gradeSections || []).find(gs => gs.grade === grade && (gs.section === section || (!gs.section && !section)));
            const earliestStart = gsObj ? gsObj.startDate : '';
            const endDate = gsObj ? gsObj.endDate : ex.endDate;

            return (
              <div key={`${ex.id}-${cohort}`} id={`printable-exam-timetable-${cohort}`} className="glass-panel animate-scale-up" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ borderBottom: '2px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Top Row: Title on Left, Actions on Right */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        {section ? `Grade ${grade} - Section ${section}` : `Grade ${grade}`}
                      </div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{ex.examName}</h2>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }} className="no-print">
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleExportTimetable(cohort, 'pdf', examSchedules, ex.examName)} 
                        style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--border-glass)' }}
                      >
                        <Download size={13} /> Export PDF
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Metadata Info */}
                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span>Type: <strong>{ex.examType}</strong></span>
                    <span>Session: <strong>{ex.academicSession || '-'}</strong></span>
                    {earliestStart && <span>Starts: <strong>{formatDate(earliestStart)}</strong></span>}
                    {endDate && <span>Ends: <strong>{formatDate(endDate)}</strong></span>}
                    <span>Total Marks: <strong>{ex.totalMarks || '-'}</strong></span>
                  </div>
                </div>

                <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px' }}>Subject</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px' }}>Exam Date</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px' }}>Time Slot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortSchedules.map(slot => (
                      <tr key={slot.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ fontWeight: 700, textAlign: 'left', padding: '12px 16px' }}>{slot.subject}</td>
                        <td style={{ textAlign: 'left', padding: '12px 16px' }}>{formatDate(slot.examDate)}</td>
                        <td style={{ textAlign: 'left', padding: '12px 16px' }}>
                          {slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : (slot.timeSlot || slot.duration || '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        ) : (
          <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Calendar size={40} style={{ opacity: 0.3 }} />
            <p style={{ fontWeight: 600, marginTop: '12px' }}>No published timetables found</p>
          </div>
        )}
      </div>
    );
  };

  const renderEvents = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Event Operations Coordinator</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Schedule school functions, PTA meets, competitions, and manage their status.</p>
          </div>
          <button className="btn-primary" onClick={() => {
            setEventForm({ title: '', type: 'Academic', date: '', time: '', venue: '', description: '', organizer: 'School Admin', participants: 'All Students', status: 'Scheduled' });
            setEditingId(null);
            setShowAddModal(true);
          }}>
            <Plus size={16} /> Create New Event
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {events.length > 0 ? (
            events.map(evt => (
              <div key={evt.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700,
                    background: evt.type === 'Examination' ? 'rgba(236,72,153,0.1)' : evt.type === 'Holiday' ? 'rgba(245,158,11,0.1)' : evt.type === 'Sports' ? 'rgba(34,197,94,0.1)' : evt.type === 'Health & Wellness' ? 'rgba(34,197,94,0.1)' : evt.type === 'Celebration' ? 'rgba(251,146,60,0.1)' : evt.type === 'Cultural' ? 'rgba(168,85,247,0.1)' : 'rgba(99,102,241,0.1)',
                    color: evt.type === 'Examination' ? '#ec4899' : evt.type === 'Holiday' ? '#f59e0b' : evt.type === 'Sports' ? '#16a34a' : evt.type === 'Health & Wellness' ? '#16a34a' : evt.type === 'Celebration' ? '#ea580c' : evt.type === 'Cultural' ? '#9333ea' : 'hsl(var(--color-primary))',
                  }}>{evt.type}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="btn-secondary" onClick={() => {
                      setEventForm({
                        title: evt.title,
                        type: evt.type,
                        date: evt.date,
                        time: evt.time,
                        venue: evt.venue,
                        description: evt.description || '',
                        organizer: evt.organizer || 'School Admin',
                        participants: evt.participants || 'All Students',
                        status: evt.status || 'Scheduled'
                      });
                      setEditingId(evt.id);
                      setShowAddModal(true);
                    }} style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'hsl(var(--color-primary))' }}>
                      <Edit3 size={14} />
                    </button>
                    <button className="btn-secondary" onClick={() => deleteEventLog(evt.id)} style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'rgb(var(--color-danger-rgb))' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{evt.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{evt.description || 'No description provided.'}</p>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem',
                  borderTop: '1px solid var(--border-glass)', paddingTop: '10px', color: 'var(--text-muted)'
                }}>
                  <span>≡ƒôà Date: <strong>{new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                  <span>ΓÅ░ Time: {evt.time}</span>
                  <span>≡ƒôì Venue: {evt.venue}</span>
                  <span>≡ƒæÑ Target: {evt.participants}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '8px', 
                  borderTop: '1px solid var(--border-glass)', 
                  paddingTop: '10px', 
                  marginTop: '4px', 
                  alignItems: 'center' 
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Download size={12} /> Export:
                  </span>
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        handleExportEvent(evt, e.target.value);
                        e.target.value = ''; // Reset select
                      }
                    }}
                    className="select-custom"
                    style={{ 
                      padding: '2px 8px', 
                      fontSize: '0.75rem', 
                      borderRadius: '6px', 
                      height: '28px', 
                      background: 'var(--bg-glass-active)', 
                      border: '1px solid var(--border-glass)', 
                      color: 'var(--text-main)', 
                      cursor: 'pointer',
                      width: 'auto'
                    }}
                  >
                    <option value="">Select format...</option>
                    <option value="csv">CSV File</option>
                    <option value="json">JSON File</option>
                  </select>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel" style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
              No school events registered. Click "Create New Event" to register academic activities.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNotices = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Notice & Announcements Board</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Publish official announcements mapping targeted reader visibility groups.</p>
          </div>
          <button className="btn-primary" onClick={() => {
            setNoticeForm({ title: '', content: '', category: 'General', priority: 'Medium', publishDate: new Date().toISOString().split('T')[0], expiryDate: '', visibility: 'All' });
            setEditingId(null);
            setShowAddModal(true);
          }}>
            <Plus size={16} /> Broadcast Notice
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {notices.length > 0 ? (
            notices.map(nt => (
              <div key={nt.id} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start', position: 'relative' }}>
                <div style={{
                  padding: '10px', borderRadius: '10px',
                  background: nt.priority === 'High' ? 'rgba(239, 68, 68, 0.08)' : nt.priority === 'Medium' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                  color: nt.priority === 'High' ? '#ef4444' : nt.priority === 'Medium' ? '#f59e0b' : 'hsl(var(--color-primary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Bell size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{nt.title}</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '10px', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', fontWeight: 600 }}>Audience: {nt.visibility}</span>
                      <button className="btn-secondary" onClick={() => {
                        setNoticeForm({
                          title: nt.title,
                          content: nt.content,
                          category: nt.category,
                          priority: nt.priority,
                          publishDate: nt.publishDate,
                          expiryDate: nt.expiryDate || '',
                          visibility: nt.visibility
                        });
                        setEditingId(nt.id);
                        setShowAddModal(true);
                      }} style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'hsl(var(--color-primary))' }}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn-secondary" onClick={() => deleteNoticeBoard(nt.id)} style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'rgb(var(--color-danger-rgb))' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0', lineHeight: 1.4 }}>{nt.content}</p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <span>Category: <strong>{nt.category}</strong></span>
                      <span style={{ marginLeft: '16px' }}>Date Published: {nt.publishDate}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Download size={12} /> Export:
                      </span>
                      <select 
                        onChange={(e) => {
                          if (e.target.value) {
                            handleExportNotice(nt, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="select-custom"
                        style={{ 
                          padding: '2px 8px', 
                          fontSize: '0.75rem', 
                          borderRadius: '6px', 
                          height: '28px', 
                          background: 'var(--bg-glass-active)', 
                          border: '1px solid var(--border-glass)', 
                          color: 'var(--text-main)', 
                          cursor: 'pointer',
                          width: 'auto'
                        }}
                      >
                        <option value="">Select format...</option>
                        <option value="csv">CSV File</option>
                        <option value="json">JSON File</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Notice board is empty. Click "Broadcast Notice" to publish statements.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHolidays = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Holidays & Calendar Closures</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure festival recesses, official holidays, and emergency closures.</p>
          </div>
          <button className="btn-primary" onClick={() => {
            setHolidayForm({ name: '', type: 'Public', startDate: '', endDate: '', description: '' });
            setEditingId(null);
            setShowAddModal(true);
          }}>
            <Plus size={16} /> Declare Holiday
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {holidays.length > 0 ? (
            holidays.map(h => (
              <div key={h.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700,
                    background: h.type === 'Emergency' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    color: h.type === 'Emergency' ? '#ef4444' : '#f59e0b',
                    border: h.type === 'Emergency' ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(245, 158, 11, 0.15)'
                  }}>{h.type}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="btn-secondary" onClick={() => {
                      setHolidayForm({
                        name: h.name,
                        type: h.type,
                        startDate: h.startDate,
                        endDate: h.endDate,
                        description: h.description || ''
                      });
                      setEditingId(h.id);
                      setShowAddModal(true);
                    }} style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'hsl(var(--color-primary))' }}>
                      <Edit3 size={14} />
                    </button>
                    <button className="btn-secondary" onClick={() => deleteHolidaySchedule(h.id)} style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'rgb(var(--color-danger-rgb))' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{h.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{h.description || 'No notes provided.'}</p>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem',
                  borderTop: '1px solid var(--border-glass)', paddingTop: '10px', color: 'var(--text-muted)'
                }}>
                  <span>≡ƒôà Start Date: <strong>{new Date(h.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                  <span>≡ƒôà End Date: <strong>{new Date(h.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '8px', 
                  borderTop: '1px solid var(--border-glass)', 
                  paddingTop: '10px', 
                  marginTop: '4px', 
                  alignItems: 'center' 
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Download size={12} /> Export:
                  </span>
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        handleExportHoliday(h, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="select-custom"
                    style={{ 
                      padding: '2px 8px', 
                      fontSize: '0.75rem', 
                      borderRadius: '6px', 
                      height: '28px', 
                      background: 'var(--bg-glass-active)', 
                      border: '1px solid var(--border-glass)', 
                      color: 'var(--text-main)', 
                      cursor: 'pointer',
                      width: 'auto'
                    }}
                  >
                    <option value="">Select format...</option>
                    <option value="csv">CSV File</option>
                    <option value="json">JSON File</option>
                  </select>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel" style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
              No holidays currently registered. Click "Declare Holiday".
            </div>
          )}
        </div>
      </div>
    );
  };

  const getMergedCalendarEvents = () => {
    const dbEvents = calendarEvents.map(e => ({
      ...e,
      isEditable: true,
      source: 'Calendar Module'
    }));

    // Merge Holidays from legacy database
    const mappedHolidays = holidays.map(h => {
      const start = h.startDate || '';
      return {
        id: h.id,
        title: h.title || h.name || 'Holiday',
        eventType: 'Holiday',
        eventDate: start,
        endDate: h.endDate || start,
        description: h.description || `Holiday break: ${h.startDate} to ${h.endDate}`,
        applicableClasses: 'All',
        startTime: '',
        endTime: '',
        session: calendarSession,
        isEditable: false,
        source: 'Holidays'
      };
    });

    // Merge Exam schedules from legacy database (Consolidated parent exams)
    const mappedExams = exams
      .filter(ex => {
        const name = (ex.examName || '').toLowerCase();
        const type = (ex.examType || '').toLowerCase();
        return name.includes('half') || name.includes('final') || name.includes('mid') ||
               type.includes('half') || type.includes('final') || type.includes('mid');
      })
      .map(ex => {
        const startDates = (ex.gradeSections || []).map(gs => gs.startDate).filter(Boolean);
        const endDates = (ex.gradeSections || []).map(gs => gs.endDate).filter(Boolean);
        const start = startDates.length > 0 ? startDates.sort()[0] : '';
        const end = endDates.length > 0 ? endDates.sort().reverse()[0] : '';
        return {
          id: ex.id,
          title: ex.examName || 'Examination',
          eventType: 'Examination',
          eventDate: start,
          endDate: end || start,
          description: ex.description || 'Examination period',
          applicableClasses: ex.gradeSections ? [...new Set(ex.gradeSections.map(gs => gs.grade))].join(', ') : 'All',
          startTime: '',
          endTime: '',
          session: ex.academicSession || calendarSession,
          isEditable: false,
          source: 'Exams'
        };
      });

    // Merge School events from legacy database
    const mappedEvents = events.map(evt => ({
      id: evt.id,
      title: evt.title || 'Event',
      eventType: evt.type || 'Sports Event',
      eventDate: evt.date,
      description: evt.description || `Venue: ${evt.venue}`,
      applicableClasses: evt.audience || 'All',
      startTime: evt.time || '',
      endTime: '',
      session: calendarSession,
      isEditable: false,
      source: 'Events'
    }));

    const allMerged = [...dbEvents, ...mappedHolidays, ...mappedExams, ...mappedEvents];

    // Filter by Session
    let filtered = allMerged.filter(e => e.session === calendarSession);

    // Filter by Event Type
    if (calendarTypeFilter !== 'All') {
      filtered = filtered.filter(e => e.eventType.toLowerCase().includes(calendarTypeFilter.toLowerCase()) || (calendarTypeFilter === 'Sports Event' && e.eventType.toLowerCase().includes('sport')));
    }

    // Filter by Search Query
    if (calendarSearchQuery.trim() !== '') {
      const q = calendarSearchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // Filter by Date Range
    if (calendarStartDateFilter) {
      filtered = filtered.filter(e => e.eventDate >= calendarStartDateFilter);
    }
    if (calendarEndDateFilter) {
      filtered = filtered.filter(e => e.eventDate <= calendarEndDateFilter);
    }

    // Sort chronologically
    return filtered.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  };

  const handleCalendarEventSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingCalendarEventId;
    const url = isEdit ? `/api/academics/calendar-events/${editingCalendarEventId}` : '/api/academics/calendar-events';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...calendarEventForm, session: calendarSession })
      });
      if (res.ok) {
        // If editing a published event, auto-unpublish so user must re-publish
        if (isEdit && publishedEventIds.includes(editingCalendarEventId)) {
          try {
            await fetch('/api/academics/calendar/unpublish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventId: editingCalendarEventId })
            });
          } catch (_) { /* silent */ }
        }
        showToast(isEdit ? 'Calendar event updated successfully!' : 'Calendar event declared successfully!', 'success');
        setShowCalendarEventModal(false);
        setEditingCalendarEventId(null);
        setCalendarEventForm({
          title: '', eventType: 'Holiday', eventDate: '', startTime: '', endTime: '', description: '', applicableClasses: 'All', session: '2026-27'
        });
        fetchAllData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save event.', 'error');
      }
    } catch (err) {
      showToast('Network error during operation.', 'error');
    }
  };

  const handleDeleteCalendarEvent = async (id) => {
    if (!confirm('Are you sure you want to delete this calendar event?')) return;
    try {
      const res = await fetch(`/api/academics/calendar-events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Calendar event deleted successfully.', 'success');
        fetchAllData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete event.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const handlePublishEvent = async (eventId) => {
    try {
      const res = await fetch('/api/academics/calendar/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      if (res.ok) {
        showToast('Event published successfully!', 'success');
        fetchAllData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to publish event.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const handleUnpublishEvent = async (eventId) => {
    try {
      const res = await fetch('/api/academics/calendar/unpublish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      if (res.ok) {
        showToast('Event unpublished successfully.', 'success');
        fetchAllData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to unpublish event.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const handleCalendarFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/academics/calendar-upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setUploading(false);
      if (res.ok) {
        setUploadPreviewRows(data.rows || []);
      } else {
        showToast(data.error || 'Failed to upload/validate file.', 'error');
        setUploadPreviewRows([]);
      }
    } catch (err) {
      setUploading(false);
      showToast('Network error during file validation.', 'error');
    }
  };

  const handleConfirmCalendarImport = async () => {
    const validEvents = uploadPreviewRows.filter(r => r.isValid).map(r => r.data);
    if (validEvents.length === 0) {
      showToast('No valid events to import.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/academics/calendar-import-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadFileName,
          session: uploadSession,
          events: validEvents
        })
      });
      if (res.ok) {
        showToast(`Successfully imported ${validEvents.length} events!`, 'success');
        setShowUploadModal(false);
        setUploadPreviewRows([]);
        setUploadFileName('');
        fetchAllData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to confirm import.', 'error');
      }
    } catch (err) {
      showToast('Network error during confirmation.', 'error');
    }
  };

  const handleDownloadCalendarTemplate = () => {
    window.open('/api/academics/calendar-template', '_blank');
  };

  const handleExportCalendarCSV = (eventsToExport) => {
    const headers = ['Date', 'Event Title', 'Event Type', 'Description', 'Applicable Classes', 'Start Time', 'End Time', 'Academic Session'];
    const csvRows = [headers.join(',')];
    for (const e of eventsToExport) {
      const row = [
        e.eventDate,
        e.title,
        e.eventType,
        e.description,
        e.applicableClasses,
        e.startTime || '',
        e.endTime || '',
        e.session
      ];
      csvRows.push(row.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Academic_Calendar_${calendarSession}.csv`);
    a.click();
  };

  const getEventColorStyle = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('holiday')) {
      return { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', dot: '#f59e0b' };
    } else if (t.includes('exam')) {
      return { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', dot: '#ec4899' };
    } else if (t.includes('result')) {
      return { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.15)', text: '#10b981', dot: '#10b981' };
    } else if (t.includes('sport')) {
      return { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', dot: '#3b82f6' };
    } else if (t.includes('cultural')) {
      return { bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', dot: '#8b5cf6' };
    } else if (t.includes('workshop') || t.includes('seminar')) {
      return { bg: 'rgba(6, 182, 212, 0.08)', border: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', dot: '#06b6d4' };
    } else if (t.includes('meeting') || t.includes('parent-teacher')) {
      return { bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.15)', text: '#6366f1', dot: '#6366f1' };
    } else if (t.includes('vacation')) {
      return { bg: 'rgba(244, 63, 94, 0.08)', border: 'rgba(244, 63, 94, 0.15)', text: '#f43f5e', dot: '#f43f5e' };
    } else if (t.includes('admissions') || t.includes('admission')) {
      return { bg: 'rgba(79, 70, 229, 0.08)', border: 'rgba(79, 70, 229, 0.15)', text: '#4f46e5', dot: '#4f46e5' };
    }
    return { bg: 'rgba(107, 114, 128, 0.08)', border: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', dot: '#6b7280' };
  };

  const renderAcademicCalendar = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearsList = [];
    for (let y = currentYear - 3; y <= currentYear + 5; y++) {
      yearsList.push(y);
    }

    const currentWeekDays = (() => {
      const current = new Date(weekAnchor);
      const dayVal = current.getDay();
      const diff = current.getDate() - dayVal;
      const startOfWeek = new Date(current.setDate(diff));
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push(d);
      }
      return days;
    })();

    const firstDayIndex = new Date(calendarYear, activeMonth, 1).getDay();
    const totalDays = new Date(calendarYear, activeMonth + 1, 0).getDate();
    const calendarGrid = [];
    for (let i = 0; i < firstDayIndex; i++) {
      calendarGrid.push({ empty: true });
    }
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${calendarYear}-${String(activeMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = getMergedCalendarEvents().filter(e => e.eventDate === dateStr);
      calendarGrid.push({
        empty: false,
        day,
        dateStr,
        events: dayEvents
      });
    }

    const filteredEvents = getMergedCalendarEvents();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Printable View Styling Wrapper */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-calendar-view, #printable-calendar-view * {
              visibility: visible;
            }
            #printable-calendar-view {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: #fff !important;
              color: #000 !important;
              box-shadow: none !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Master Control Header */}
        <div className="glass-panel no-print" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Academic Calendar Management</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Plan, validate, import, and coordinate all events and milestones across academic sessions.</p>
            </div>
            
            {/* Display-only consolidated calendar panel (Holidays, Events, and Exams are managed in their respective pages) */}
          </div>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            {/* View Switching Tab Filters */}
            <div style={{ display: 'flex', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '3px' }}>
              <button 
                onClick={() => setCalendarViewMode('month')} 
                style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '6px', border: 'none', background: calendarViewMode === 'month' ? 'hsl(var(--color-primary))' : 'transparent', color: calendarViewMode === 'month' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                Month View
              </button>
              <button 
                onClick={() => setCalendarViewMode('week')} 
                style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '6px', border: 'none', background: calendarViewMode === 'week' ? 'hsl(var(--color-primary))' : 'transparent', color: calendarViewMode === 'week' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                Week View
              </button>
              <button 
                onClick={() => setCalendarViewMode('list')} 
                style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '6px', border: 'none', background: calendarViewMode === 'list' ? 'hsl(var(--color-primary))' : 'transparent', color: calendarViewMode === 'list' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                List View
              </button>
            </div>

            {/* Advanced Filters */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Session:</span>
                <select className="select-custom" value={calendarSession} onChange={(e) => setCalendarSession(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', height: '36px', width: '110px' }}>
                  <option value="2026-27">2026-27</option>
                  <option value="2027-28">2027-28</option>
                  <option value="2028-29">2028-29</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type:</span>
                <select className="select-custom" value={calendarTypeFilter} onChange={(e) => setCalendarTypeFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', height: '36px', width: '130px' }}>
                  <option value="All">All Types</option>
                  {calendarEventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="date" className="form-control" value={calendarStartDateFilter} onChange={(e) => setCalendarStartDateFilter(e.target.value)} style={{ padding: '5px 8px', borderRadius: '8px', height: '36px', width: '125px', fontSize: '0.8rem' }} placeholder="Start" />
                <span style={{ color: 'var(--text-muted)' }}>-</span>
                <input type="date" className="form-control" value={calendarEndDateFilter} onChange={(e) => setCalendarEndDateFilter(e.target.value)} style={{ padding: '5px 8px', borderRadius: '8px', height: '36px', width: '125px', fontSize: '0.8rem' }} placeholder="End" />
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                <input type="text" className="form-control" placeholder="Search events..." value={calendarSearchQuery} onChange={(e) => setCalendarSearchQuery(e.target.value)} style={{ padding: '6px 10px 6px 30px', borderRadius: '8px', height: '36px', width: '160px', fontSize: '0.82rem' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Viewport Render Block */}
        <div id="printable-calendar-view" className="glass-panel" style={{ padding: '24px' }}>
          
          {/* Calendar Title (Only printed or visible at top of sheet) */}
          <div style={{ display: 'none' }} className="print-header">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', margin: '0 0 10px 0' }}>Academic Master Calendar</h2>
            <p style={{ textAlign: 'center', margin: '0 0 20px 0', fontSize: '0.9rem', color: '#6b7280' }}>
              Academic Session: {calendarSession} | Month: {monthsList[activeMonth]} {calendarYear}
            </p>
          </div>

          {calendarViewMode === 'month' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Monthly Nav Toolbar */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => {
                    if (activeMonth === 0) {
                      setActiveMonth(11);
                      setCalendarYear(calendarYear - 1);
                    } else {
                      setActiveMonth(activeMonth - 1);
                    }
                  }} style={{ padding: '6px 12px', borderRadius: '8px' }}>ΓåÉ Prev</button>
                  <button className="btn-secondary" onClick={() => {
                    if (activeMonth === 11) {
                      setActiveMonth(0);
                      setCalendarYear(calendarYear + 1);
                    } else {
                      setActiveMonth(activeMonth + 1);
                    }
                  }} style={{ padding: '6px 12px', borderRadius: '8px' }}>Next ΓåÆ</button>
                </div>
                
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {monthsList[activeMonth]} {calendarYear}
                </h4>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px', borderRadius: '8px' }} onClick={() => handleExportCalendarCSV(filteredEvents)}>
                    Export CSV
                  </button>
                  <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px', borderRadius: '8px' }} onClick={handlePrintCalendar}>
                    <Printer size={15} /> Print Sheet
                  </button>
                </div>
              </div>

              {/* Days of Week Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid var(--border-glass)' }}>
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Monthly Days Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', minHeight: '400px' }}>
                {calendarGrid.map((cell, idx) => {
                  if (cell.empty) {
                    return <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--border-glass)' }} />;
                  }

                  const isToday = now.getDate() === cell.day && now.getMonth() === activeMonth && now.getFullYear() === calendarYear;
                  return (
                    <div key={idx} style={{
                      background: isToday ? 'var(--bg-glass-active)' : 'rgba(255,255,255,0.02)',
                      border: isToday ? '2px solid hsl(var(--color-primary))' : '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      minHeight: '100px',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      position: 'relative'
                    }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isToday ? 'hsl(var(--color-primary))' : 'var(--text-main)' }}>{cell.day}</span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '70px', paddingRight: '2px' }}>
                        {cell.events.map(e => {
                          const style = getEventColorStyle(e.eventType);
                          return (
                            <span 
                              key={e.id} 
                              onClick={() => {
                                if (e.isEditable) {
                                  setEditingCalendarEventId(e.id);
                                  setCalendarEventForm({
                                    title: e.title, eventType: e.eventType, eventDate: e.eventDate, startTime: e.startTime || '', endTime: e.endTime || '', description: e.description || '', applicableClasses: e.applicableClasses || 'All', session: e.session
                                  });
                                  setShowCalendarEventModal(true);
                                } else {
                                  alert(`Integrated Event:\n\nTitle: ${e.title}\nType: ${e.eventType}\nDescription: ${e.description}\nClasses: ${e.applicableClasses}`);
                                }
                              }}
                              style={{
                                fontSize: '0.62rem', 
                                fontWeight: 700, 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                background: style.bg, 
                                color: style.text, 
                                border: `1px solid ${style.border}`,
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }} 
                              title={e.title}
                              onMouseEnter={el => el.target.style.opacity = '0.8'}
                              onMouseLeave={el => el.target.style.opacity = '1'}
                            >
                              ΓÇó {e.title}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {calendarViewMode === 'week' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Weekly Navigation */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => {
                    const prev = new Date(weekAnchor);
                    prev.setDate(prev.getDate() - 7);
                    setWeekAnchor(prev);
                  }} style={{ padding: '6px 12px', borderRadius: '8px' }}>ΓåÉ Prev Week</button>
                  <button className="btn-secondary" onClick={() => {
                    const next = new Date(weekAnchor);
                    next.setDate(next.getDate() + 7);
                    setWeekAnchor(next);
                  }} style={{ padding: '6px 12px', borderRadius: '8px' }}>Next Week ΓåÆ</button>
                </div>

                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Week Range: {currentWeekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {currentWeekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h4>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px', borderRadius: '8px' }} onClick={() => handleExportCalendarCSV(filteredEvents)}>
                    Export CSV
                  </button>
                  <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px', borderRadius: '8px' }} onClick={handlePrintCalendar}>
                    <Printer size={15} /> Print Sheet
                  </button>
                </div>
              </div>

              {/* Weekly Days Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', minHeight: '300px' }}>
                {currentWeekDays.map((date, idx) => {
                  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                  const dayEvents = getMergedCalendarEvents().filter(e => e.eventDate === dateStr);
                  const isToday = now.getDate() === date.getDate() && now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear();

                  return (
                    <div key={idx} style={{
                      background: isToday ? 'var(--bg-glass-active)' : 'rgba(255,255,255,0.02)',
                      border: isToday ? '2px solid hsl(var(--color-primary))' : '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      minHeight: '280px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: isToday ? 'hsl(var(--color-primary))' : 'var(--text-main)', marginTop: '2px' }}>
                          {date.getDate()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                        {dayEvents.length > 0 ? (
                          dayEvents.map(e => {
                            const colors = getEventColorStyle(e.eventType);
                            return (
                              <div 
                                key={e.id}
                                onClick={() => {
                                  if (e.isEditable) {
                                    setEditingCalendarEventId(e.id);
                                    setCalendarEventForm({
                                      title: e.title, eventType: e.eventType, eventDate: e.eventDate, startTime: e.startTime || '', endTime: e.endTime || '', description: e.description || '', applicableClasses: e.applicableClasses || 'All', session: e.session
                                    });
                                    setShowCalendarEventModal(true);
                                  } else {
                                    alert(`Integrated Event:\n\nTitle: ${e.title}\nType: ${e.eventType}\nDescription: ${e.description}`);
                                  }
                                }}
                                style={{
                                  background: colors.bg,
                                  border: `1px solid ${colors.border}`,
                                  borderRadius: '8px',
                                  padding: '8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  transition: 'transform 0.15s ease'
                                }}
                                onMouseEnter={el => el.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={el => el.currentTarget.style.transform = 'translateY(0)'}
                              >
                                <strong style={{ fontSize: '0.75rem', color: colors.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {e.title}
                                </strong>
                                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>
                                  {e.startTime ? `${e.startTime}` : 'All Day'}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '12px' }}>No events</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {calendarViewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* List View Header Controls */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Chronological Events List ({filteredEvents.length} items found)
                </h4>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px', borderRadius: '8px' }} onClick={() => handleExportCalendarCSV(filteredEvents)}>
                    Export CSV
                  </button>
                  <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px', borderRadius: '8px' }} onClick={handlePrintCalendar}>
                    <Printer size={15} /> Print Sheet
                  </button>
                </div>
              </div>

              {/* Events Table */}
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-glass-active)', borderBottom: '2px solid var(--border-glass)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', width: '110px' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Event Title</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', width: '140px' }}>Event Type</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Description</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', width: '100px' }}>Source</th>
                      <th className="no-print" style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', width: '200px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.length > 0 ? (
                      filteredEvents.map(e => {
                        const style = getEventColorStyle(e.eventType);
                        const isPublished = publishedEventIds.includes(e.id);
                        return (
                          <tr key={e.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }}>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                              {new Date(e.eventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {e.endDate && e.endDate !== e.eventDate && (
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                                  to {new Date(e.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>{e.title}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700,
                                background: style.bg, color: style.text, border: `1px solid ${style.border}`,
                                display: 'inline-block'
                              }}>{e.eventType}</span>
                            </td>
                            <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{e.description || '-'}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontSize: '0.72rem', color: e.isEditable ? 'hsl(var(--color-primary))' : 'var(--text-muted)', fontWeight: 600 }}>{e.source}</span>
                            </td>
                            <td className="no-print" style={{ padding: '10px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                                {/* Edit Button */}
                                {e.isEditable && (
                                  <button 
                                    onClick={() => {
                                      setEditingCalendarEventId(e.id);
                                      setCalendarEventForm({
                                        title: e.title, eventType: e.eventType, eventDate: e.eventDate, startTime: e.startTime || '', endTime: e.endTime || '', description: e.description || '', applicableClasses: e.applicableClasses || 'All', session: e.session
                                      });
                                      setShowCalendarEventModal(true);
                                    }}
                                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border-glass)', background: 'rgba(99,102,241,0.06)', cursor: 'pointer', color: 'hsl(var(--color-primary))', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s ease' }}
                                    onMouseEnter={el => el.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                                    onMouseLeave={el => el.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                                  >
                                    <Edit3 size={12} /> Edit
                                  </button>
                                )}
                                {/* Delete Button */}
                                {e.isEditable && (
                                  <button 
                                    onClick={() => handleDeleteCalendarEvent(e.id)}
                                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s ease' }}
                                    onMouseEnter={el => el.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                                    onMouseLeave={el => el.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                )}
                                {/* Publish / Published Badge */}
                                {isPublished ? (
                                  <span style={{ 
                                    padding: '5px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                                    background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                  }}>
                                    <CheckCircle size={12} /> Published
                                  </span>
                                ) : (
                                  <button 
                                    onClick={() => handlePublishEvent(e.id)}
                                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.06)', cursor: 'pointer', color: '#10b981', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s ease' }}
                                    onMouseEnter={el => el.currentTarget.style.background = 'rgba(16,185,129,0.15)'}
                                    onMouseLeave={el => el.currentTarget.style.background = 'rgba(16,185,129,0.06)'}
                                  >
                                    <Send size={12} /> Publish
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No academic events found matching the active session and filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* MODAL PORTALS (MANUAL EVENT, FILE UPLOAD WIZARD, LOGS)   */}
        {/* ======================================================== */}

        {/* Modal 1: Manual Calendar Event Add/Edit Modal */}
        {showCalendarEventModal && createPortal(
          <div className="modal-overlay" style={{ zIndex: 30000000 }}>
            <div className="modal-content glass-panel animate-scale-up" style={{ maxWidth: '500px', borderRadius: '16px', padding: '24px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  {editingCalendarEventId ? 'Edit Event Details' : 'Declare New Academic Event'}
                </h3>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.6rem' }} onClick={() => setShowCalendarEventModal(false)}>├ù</button>
              </div>

              <form onSubmit={handleCalendarEventSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Event Title *</label>
                    <input type="text" className="form-control" placeholder="e.g. Science Exhibition" value={calendarEventForm.title} onChange={e => setCalendarEventForm({ ...calendarEventForm, title: e.target.value })} required />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Event Type *</label>
                    <select className="form-control" value={calendarEventForm.eventType} onChange={e => setCalendarEventForm({ ...calendarEventForm, eventType: e.target.value })}>
                      {calendarEventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Event Date *</label>
                    <input type="date" className="form-control" value={calendarEventForm.eventDate} onChange={e => setCalendarEventForm({ ...calendarEventForm, eventDate: e.target.value })} required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Start Time (Optional)</label>
                      <input type="text" className="form-control" placeholder="e.g. 09:30 AM" value={calendarEventForm.startTime} onChange={e => setCalendarEventForm({ ...calendarEventForm, startTime: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>End Time (Optional)</label>
                      <input type="text" className="form-control" placeholder="e.g. 03:00 PM" value={calendarEventForm.endTime} onChange={e => setCalendarEventForm({ ...calendarEventForm, endTime: e.target.value })} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Applicable Classes (Optional)</label>
                    <input type="text" className="form-control" placeholder="e.g. All, or Grade V, Grade VI" value={calendarEventForm.applicableClasses} onChange={e => setCalendarEventForm({ ...calendarEventForm, applicableClasses: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Description Details</label>
                    <textarea className="form-control" placeholder="Additional instructions..." value={calendarEventForm.description} onChange={e => setCalendarEventForm({ ...calendarEventForm, description: e.target.value })} style={{ height: '70px', resize: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                  <button type="button" className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '8px' }} onClick={() => setShowCalendarEventModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 24px', borderRadius: '8px', fontWeight: 700 }}>Save Event</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Modal 2: CSV/Excel Upload Validation preview Wizard */}
        {showUploadModal && createPortal(
          <div className="modal-overlay" style={{ zIndex: 30000000 }}>
            <div className="modal-content glass-panel animate-scale-up" style={{ width: '90%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto', borderRadius: '20px', padding: '32px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Upload size={22} style={{ color: 'hsl(var(--color-primary))' }} /> Upload Academic Calendar
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Supports both CSV and Excel (.xlsx) templates. Upload to validate and confirm import.</p>
                </div>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.8rem', lineHeight: 1 }} onClick={() => { setShowUploadModal(false); setUploadPreviewRows([]); setUploadFileName(''); }}>├ù</button>
              </div>

              {uploadPreviewRows.length === 0 ? (
                /* Stage 1: File selection drag & drop area */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '40px 20px', border: '2px dashed var(--border-glass)', borderRadius: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-primary))' }}>
                    <Upload size={32} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Drag and drop your template file here</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Accepts only pre-formatted CSV and .xlsx Excel files</p>
                  </div>
                  
                  <label className="btn-primary" style={{ padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                    Choose Local File
                    <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleCalendarFileUpload} style={{ display: 'none' }} />
                  </label>

                  {uploading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', color: 'hsl(var(--color-primary))' }}>
                      <Loader2 size={16} className="animate-spin" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Reading & validating sheet...</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Stage 2: Preview table and validation highlight logs */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--bg-glass-active)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem' }}>File Loaded: <strong>{uploadFileName}</strong></span>
                      <span style={{ marginLeft: '20px', fontSize: '0.85rem' }}>Total Rows: <strong>{uploadPreviewRows.length}</strong></span>
                      <span style={{ marginLeft: '20px', fontSize: '0.85rem', color: uploadPreviewRows.some(r => !r.isValid) ? '#ef4444' : '#10b981' }}>
                        Errors: <strong>{uploadPreviewRows.filter(r => !r.isValid).length}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Session:</span>
                      <select className="select-custom" value={uploadSession} onChange={e => setUploadSession(e.target.value)} style={{ padding: '4px 10px', borderRadius: '6px', height: '30px' }}>
                        <option value="2026-27">2026-27</option>
                        <option value="2027-28">2027-28</option>
                        <option value="2028-29">2028-29</option>
                      </select>
                    </div>
                  </div>

                  {uploadPreviewRows.some(r => !r.isValid) && (
                    <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px', color: '#ef4444', fontSize: '0.8rem' }}>
                      <strong>Validation Warnings detected:</strong> Malformed cells must be corrected in your sheet before importing to SQL database. Review the red highlighted rows below.
                    </div>
                  )}

                  {/* Validation Table */}
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)', maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-glass-active)', position: 'sticky', top: 0, zIndex: 10 }}>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>Row #</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', width: '110px' }}>Date</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Event Title</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', width: '120px' }}>Event Type</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', width: '100px' }}>Session</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', width: '100px' }}>Status</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Validation Logs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadPreviewRows.map((row, idx) => (
                          <tr key={idx} style={{ 
                            borderBottom: '1px solid var(--border-glass)', 
                            background: row.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.04)',
                            opacity: row.isValid ? 1 : 0.95
                          }}>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{row.rowNumber}</td>
                            <td style={{ padding: '10px 12px', color: row.isValid ? 'inherit' : '#ef4444' }}>{row.data.eventDate || '-'}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.data.title || '-'}</td>
                            <td style={{ padding: '10px 12px' }}>{row.data.eventType || '-'}</td>
                            <td style={{ padding: '10px 12px' }}>{row.data.session || '-'}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{
                                padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700,
                                background: row.isValid ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                color: row.isValid ? '#10b981' : '#ef4444'
                              }}>{row.isValid ? 'Valid' : 'Invalid'}</span>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#ef4444', fontStyle: 'italic', fontSize: '0.75rem' }}>
                              {row.isValid ? '-' : row.errors.join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '10px' }}>
                    <button className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '8px' }} onClick={() => { setUploadPreviewRows([]); setUploadFileName(''); }}>
                      ΓåÉ Upload Different File
                    </button>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '8px' }} onClick={() => { setShowUploadModal(false); setUploadPreviewRows([]); setUploadFileName(''); }}>
                        Cancel
                      </button>
                      <button 
                        className="btn-primary" 
                        disabled={uploadPreviewRows.some(r => !r.isValid)} 
                        onClick={handleConfirmCalendarImport} 
                        style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700, opacity: uploadPreviewRows.some(r => !r.isValid) ? 0.5 : 1, cursor: uploadPreviewRows.some(r => !r.isValid) ? 'not-allowed' : 'pointer' }}
                      >
                        Confirm Import ({uploadPreviewRows.filter(r => r.isValid).length} Events)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* Modal 3: Import History Logs tracker modal */}
        {showImportHistoryModal && createPortal(
          <div className="modal-overlay" style={{ zIndex: 30000000 }}>
            <div className="modal-content glass-panel animate-scale-up" style={{ width: '90%', maxWidth: '650px', borderRadius: '16px', padding: '24px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Import History & Track Logs</h3>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.6rem' }} onClick={() => setShowImportHistoryModal(false)}>├ù</button>
              </div>

              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)', maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-glass-active)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>File Name</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', width: '150px' }}>Import Date</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>Records</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', width: '80px' }}>Session</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', width: '110px' }}>Uploaded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendarImports.length > 0 ? (
                      calendarImports.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{log.fileName}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                            {new Date(log.importDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                            {new Date(log.importDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'hsl(var(--color-primary))' }}>{log.totalRecords}</td>
                          <td style={{ padding: '10px 12px' }}>{log.session}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{log.importedBy}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No calendar import files recorded in history.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '16px' }}>
                <button className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '8px' }} onClick={() => setShowImportHistoryModal(false)}>Close Tracker</button>
              </div>
            </div>
          </div>,
          document.body
        )}

      </div>
    );
  };

  const renderPublishedAcademicCalendar = () => {
    // Get all merged events and filter to only published ones
    const allEvents = getMergedCalendarEvents();
    const publishedEvents = allEvents.filter(e => publishedEventIds.includes(e.id));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={22} style={{ color: '#10b981' }} /> Published Academic Calendar
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Official published academic events visible to all stakeholders. Only events published from the Academic Calendar appear here.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px', borderRadius: '8px' }} onClick={() => handleExportCalendarCSV(publishedEvents)}>
                <Download size={15} /> Export CSV
              </button>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px', borderRadius: '8px' }} onClick={() => window.print()}>
                <Printer size={15} /> Print
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
              <CheckCircle size={16} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>{publishedEvents.length} Published Events</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <Calendar size={16} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b' }}>
                {publishedEvents.filter(e => e.eventType === 'Holiday').length} Holidays
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.12)' }}>
              <BookOpen size={16} style={{ color: '#ec4899' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ec4899' }}>
                {publishedEvents.filter(e => e.eventType === 'Examination').length} Examinations
              </span>
            </div>
          </div>
        </div>

        {/* Published Events Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {publishedEvents.length > 0 ? (
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-glass-active)', borderBottom: '2px solid var(--border-glass)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', width: '120px' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Event Title</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', width: '150px' }}>Event Type</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Description</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', width: '100px' }}>Classes</th>
                    <th className="no-print" style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {publishedEvents.map(e => {
                    const style = getEventColorStyle(e.eventType);
                    return (
                      <tr key={e.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {new Date(e.eventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {e.endDate && e.endDate !== e.eventDate && (
                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                              to {new Date(e.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>{e.title}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700,
                            background: style.bg, color: style.text, border: `1px solid ${style.border}`,
                            display: 'inline-block'
                          }}>{e.eventType}</span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{e.description || '-'}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.8rem' }}>{e.applicableClasses || 'All'}</td>
                        <td className="no-print" style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleUnpublishEvent(e.id)}
                            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s ease', margin: '0 auto' }}
                            onMouseEnter={el => el.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                            onMouseLeave={el => el.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                          >
                            <X size={12} /> Unpublish
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
            }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(107,114,128,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={28} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>No Published Events Yet</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, maxWidth: '420px' }}>
                  Go to the Academic Calendar section, switch to List View, and click the <strong>Publish</strong> button on events you want to make official.
                </p>
              </div>
              <button 
                className="btn-primary" 
                onClick={() => setAdminView('academic-calendar')}
                style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}
              >
                <Calendar size={16} /> Go to Academic Calendar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const activeExamObj = exams.find(e => e.id === activeExam);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Results & Marksheet Manager</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Input student marks, calculate class rankings, GPA, and render printable marksheet report cards.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select className="select-custom" value={activeClass} onChange={(e) => { setActiveClass(e.target.value); setResultsEntry({}); }}>
              {classesList.map((cls, idx) => <option key={idx} value={cls}>Class {cls}</option>)}
            </select>
             <select className="select-custom" value={activeSubject} onChange={(e) => { setActiveSubject(e.target.value); setResultsEntry({}); }}>
              <option value="">Select Subject</option>
              {subjects.filter(s => s.grade === activeClass.split('-')[0]).map(sub => (
                <option key={sub.id} value={sub.subjectName}>{sub.subjectName}</option>
              ))}
            </select>
            <select className="select-custom" value={activeExam} onChange={(e) => { setActiveExam(e.target.value); setResultsEntry({}); }}>
              <option value="">Select Exam Set</option>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.examName}</option>)}
            </select>
          </div>
        </div>

        {activeExam && activeExamObj ? (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Score Entry Sheet: {activeSubject} | Total Marks: {activeExamObj.totalMarks}
              </h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Passing Marks: <strong>{activeExamObj.passingMarks}</strong></span>
            </div>

            {filteredStudents.length > 0 ? (
              <table className="table-custom" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th style={{ width: '200px' }}>Marks Obtained</th>
                    <th>Calculated Grade</th>
                    <th>Class Rank</th>
                    <th style={{ width: '250px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => {
                    const studentResult = results.find(r => r.studentId === student.id && r.examId === activeExam && r.subject && activeSubject && r.subject.toLowerCase() === activeSubject.toLowerCase());
                    
                    return (
                      <tr key={student.id}>
                        <td style={{ fontWeight: 700 }}>{student.rollNumber || student.roll}</td>
                        <td>{student.name}</td>
                        <td>
                          {studentResult ? (
                            <strong style={{ fontSize: '0.9rem', color: studentResult.percentage >= activeExamObj.passingMarks ? '#10b981' : '#ef4444' }}>
                              {studentResult.obtainedMarks} / {studentResult.totalMarks}
                            </strong>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="number"
                                className="form-control"
                                style={{ width: '100px', padding: '6px' }}
                                min="0"
                                max={activeExamObj.totalMarks}
                                placeholder="Marks"
                                value={resultsEntry[student.id] || ''}
                                onChange={(e) => setResultsEntry({ ...resultsEntry, [student.id]: e.target.value })}
                              />
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {activeExamObj.totalMarks}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          {studentResult ? (
                            <span style={{
                              padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700,
                              background: studentResult.grade === 'F' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                              color: studentResult.grade === 'F' ? '#ef4444' : '#10b981',
                              border: studentResult.grade === 'F' ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(16, 185, 129, 0.15)'
                            }}>{studentResult.grade} (GPA {studentResult.gpa.toFixed(1)})</span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 700 }}>{studentResult ? `Rank ${studentResult.rank}` : '-'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {!studentResult ? (
                              <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handleSaveMarks(student.id, activeExamObj)}>
                                Save Score
                              </button>
                            ) : (
                              <>
                                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => {
                                  // Clear result logic: delete result record to allow re-entry
                                  deleteResult(studentResult.id);
                                }}>
                                  Reset Score
                                </button>
                                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => {
                                  setActiveMarksheetStudent({ student, result: studentResult });
                                }}>
                                  View Marksheet
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active students registered in Class {activeClass}.
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Please select an exam to display score records sheets.
          </div>
        )}

        {/* Marksheet Modal */}
        {activeMarksheetStudent && createPortal(
          <div className="modal-overlay">
            <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={20} /> Academic Progress Marksheet</h2>
                <button className="modal-close" onClick={() => setActiveMarksheetStudent(null)}>├ù</button>
              </div>
              <div className="modal-body" id="printable-marksheet" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
                <div style={{ borderBottom: '2px solid var(--border-glass)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>AETHER ACADEMY REPORT</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Academic Transcript Record</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Session: 2026-2027</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <div>Name: <strong>{activeMarksheetStudent.student.name}</strong></div>
                  <div>Roll Number: <strong>{activeMarksheetStudent.student.rollNumber || activeMarksheetStudent.student.roll}</strong></div>
                  <div>Grade / Class: <strong>{activeMarksheetStudent.student.studentClass}-{activeMarksheetStudent.student.section}</strong></div>
                  <div>Term ID: <strong>{activeMarksheetStudent.result.term}</strong></div>
                </div>

                <table className="table-custom" style={{ width: '100%', marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th>Subject Field</th>
                      <th>Max Marks</th>
                      <th>Marks Obtained</th>
                      <th>Grade Achieved</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 700 }}>{activeMarksheetStudent.result.subject}</td>
                      <td>{activeMarksheetStudent.result.totalMarks}</td>
                      <td style={{ fontWeight: 700 }}>{activeMarksheetStudent.result.obtainedMarks}</td>
                      <td style={{ fontWeight: 700 }}>{activeMarksheetStudent.result.grade}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
                  background: 'var(--bg-glass-active)', padding: '16px', borderRadius: '12px',
                  border: '1px solid var(--border-glass)', textAlign: 'center', marginTop: '10px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>PERCENTAGE</span>
                    <strong style={{ fontSize: '1.1rem', color: 'hsl(var(--color-primary))' }}>{activeMarksheetStudent.result.percentage}%</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>CGPA</span>
                    <strong style={{ fontSize: '1.1rem', color: 'hsl(var(--color-info))' }}>{activeMarksheetStudent.result.gpa.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>CLASS RANK</span>
                    <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>Rank {activeMarksheetStudent.result.rank}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', borderTop: '1px dashed var(--border-glass)', paddingTop: '20px', fontSize: '0.8rem' }}>
                  <div style={{ textAlign: 'center', width: '150px' }}>
                    <div style={{ height: '40px' }} />
                    <div style={{ borderTop: '1px solid var(--text-muted)', paddingTop: '4px' }}>Class Staff</div>
                  </div>
                  <div style={{ textAlign: 'center', width: '150px' }}>
                    <div style={{ height: '40px' }} />
                    <div style={{ borderTop: '1px solid var(--text-muted)', paddingTop: '4px' }}>Principal Director</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setActiveMarksheetStudent(null)}>Close</button>
                <button className="btn-primary" onClick={() => handlePrint('printable-marksheet')}>Print Transcript</button>
              </div>
            </div>
          </div>,
          document.body
        )}

      </div>
    );
  };



  // Render modal forms dynamically based on active subView
  const renderModalForm = () => {
    switch (subView) {
      case 'academic-grade-subjects':
        return (
          <div className="modal-body" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Use the "Manage Subjects" button in the Grade Subjects page.</p>
          </div>
        );
      case 'academic-class-timetable':
        {
          const gradeSubjects = subjects.filter(s => s.grade === (activeClass.split('-')[0] || 'I'));
          return (
            <form onSubmit={handleTimetableSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Day of Week</label>
                  <select className="form-control" value={timetableForm.day} onChange={(e) => setTimetableForm({ ...timetableForm, day: e.target.value })}>
                    {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Time Slot</label>
                  <select className="form-control" value={timetableForm.time} onChange={(e) => setTimetableForm({ ...timetableForm, time: e.target.value })}>
                    {timeslots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <select 
                    className="form-control" 
                    value={timetableForm.subject} 
                    onChange={(e) => setTimetableForm({ ...timetableForm, subject: e.target.value })}
                    required
                  >
                    <option value="">Select Subject</option>
                    {gradeSubjects.map(sub => <option key={sub.id} value={sub.subjectName}>{sub.subjectName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Staff Assignment</label>
                  <select 
                    className="form-control" 
                    value={timetableForm.teacher} 
                    onChange={(e) => setTimetableForm({ ...timetableForm, teacher: e.target.value })}
                  >
                    <option value="">Select Staff</option>
                    {Array.isArray(teachers) && teachers.map((t, idx) => (
                      <option key={idx} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Room Allocation</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Room 101" 
                    value={timetableForm.room} 
                    onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })} 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Schedule Period</button>
              </div>
            </form>
          );
        }

      case 'academic-exams':
        return (
          <div className="modal-body" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Use the "Create New Exam" wizard for multi-step exam creation.</p>
            <button className="btn-primary" onClick={() => { resetWizardForm(); setShowAddModal(false); setShowExamWizard(true); }} style={{ marginTop: '12px' }}>
              Open Exam Wizard
            </button>
          </div>
        );

      case 'academic-exam-timetable':
        {
          return (
            <div className="modal-body" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Calendar size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>Configure exam timetables under the Exam Timetable tab.</p>
              <p style={{ fontSize: '0.8rem' }}>Select the exam, grade, section, and click "Create Timetable" to configure slots manually.</p>
            </div>
          );
        }

      case 'academic-events':
        return (
          <form onSubmit={handleEventSubmit}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '200px' }}>
              <div className="form-group">
                <label>Event Title</label>
                <input type="text" className="form-control" placeholder="e.g. Sports Carnival" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Event Type</label>
                <div className="form-control" ref={eventTypeRef} style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', userSelect: 'none' }} onClick={() => setEventTypeOpen(!eventTypeOpen)}>
                  <span>{eventForm.type}</span>
                  <ChevronDown size={16} style={{ transform: eventTypeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  {eventTypeOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                      {eventTypes.map(type => (
                        <div key={type} style={{ padding: '8px 12px', cursor: 'pointer', background: eventForm.type === type ? 'rgba(99,102,241,0.15)' : 'transparent', color: eventForm.type === type ? 'hsl(var(--color-primary))' : 'inherit' }} onClick={() => { setEventForm({ ...eventForm, type }); setEventTypeOpen(false); }} onMouseEnter={e => e.target.style.background = 'rgba(99,102,241,0.08)'} onMouseLeave={e => e.target.style.background = eventForm.type === type ? 'rgba(99,102,241,0.15)' : 'transparent'}>
                          {type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-control" value={eventForm.date} onChange={(e) => { const val = e.target.value; if (!val || val.split('-')[0].length <= 4) setEventForm({ ...eventForm, date: val }); }} required />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input type="text" className="form-control" placeholder="e.g. 10:00 AM" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Venue</label>
                <input type="text" className="form-control" placeholder="e.g. School Playground" value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description Details</label>
                <textarea className="form-control" placeholder="..." value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Publish Event'}</button>
            </div>
          </form>
        );

      case 'academic-notices':
        return (
          <form onSubmit={handleNoticeSubmit}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Notice Headline</label>
                <input type="text" className="form-control" placeholder="e.g. Exam Schedule Alterations" value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Announcement Content</label>
                <textarea className="form-control" placeholder="Enter instructions details..." value={noticeForm.content} onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-control" value={noticeForm.category} onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}>
                  <option value="General">General Notice</option>
                  <option value="Academic">Academic Notice</option>
                  <option value="Admissions">Admissions Board</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-control" value={noticeForm.priority} onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}>
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
              <div className="form-group">
                <label>Target Audience Visibility</label>
                <select className="form-control" value={noticeForm.visibility} onChange={(e) => setNoticeForm({ ...noticeForm, visibility: e.target.value })}>
                  <option value="All">All School</option>
                  <option value="Students">Students Only</option>
                  <option value="Teachers">Staff Only</option>
                  <option value="Staff">Employee Only</option>
                  <option value="Parents">Parents Only</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Broadcast'}</button>
            </div>
          </form>
        );

      case 'academic-holidays':
        return (
          <form onSubmit={handleHolidaySubmit}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Holiday Name</label>
                <input type="text" className="form-control" placeholder="e.g. Diwali Break" value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Classification Type</label>
                <select className="form-control" value={holidayForm.type} onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}>
                  <option value="Public">Public Holiday</option>
                  <option value="Festival">Festival Break</option>
                  <option value="School">School Holiday</option>
                  <option value="Emergency">Emergency Closure</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" className="form-control" value={holidayForm.startDate} onChange={(e) => setHolidayForm({ ...holidayForm, startDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" className="form-control" value={holidayForm.endDate} onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Remarks / Notes</label>
                <input type="text" className="form-control" placeholder="Optional notes" value={holidayForm.description} onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Declare Holiday'}</button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  // Switch Render core content page views
  const renderSubViewContent = () => {
    switch (subView) {
      case 'academic-grade-subjects':
        return renderGradeSubjects();
      case 'academic-class-timetable':
        return renderClassTimetable();
      case 'academic-teacher-timetable':
        return renderTeacherTimetable();
      case 'academic-exams':
        return renderExams();
      case 'academic-exams-history':
        return renderExamsHistory();
      case 'academic-exam-timetable':
        return renderExamTimetable();
      case 'academic-published-timetable':
        return renderPublishedTimetables();
      case 'academic-published-exam':
        return renderPublishedExams();
      case 'academic-events':
        return renderEvents();
      case 'academic-notices':
        return renderNotices();
      case 'academic-holidays':
        return renderHolidays();
      case 'academic-calendar':
        return renderAcademicCalendar();
      case 'published-academic-calendar':
        return renderPublishedAcademicCalendar();
      case 'academic-results':
      case 'results-analytics':
        return <ResultManagementPanel activeTab="analytics" setAdminView={setAdminView} />;
      case 'results-marks-entry':
        return <ResultManagementPanel activeTab="marks-entry" setAdminView={setAdminView} />;
      case 'results-report-cards':
        return <ResultManagementPanel activeTab="report-cards" setAdminView={setAdminView} />;
      case 'results-history':
        return <ResultManagementPanel activeTab="history" setAdminView={setAdminView} />;

      default:
        return renderClassTimetable();
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Toast notifications */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 24px',
          borderRadius: '12px',
          background: notification.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 999999,
          fontWeight: 600,
          animation: 'slideInRight 0.3s ease forwards'
        }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Render selected Tab Panel Content */}
      {renderSubViewContent()}

      {/* Dynamic Modal Renderer */}
      {showAddModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '24px', alignSelf: 'flex-start', marginTop: '5vh' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', textTransform: 'capitalize' }}>
                {editingId ? 'Edit' : 'Add'} {subView.replace('academic-', '').replace('-', ' ')}
              </h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>├ù</button>
            </div>
            {renderModalForm()}
          </div>
        </div>,
        document.body
      )}

      {/* Exam Creation Wizard Modal */}
      {showExamWizard && createPortal(
        <div className="modal-overlay" style={{ zIndex: 20000000 }}>
          <div className="animate-scale-up" style={{
            width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '20px',
            background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '24px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={20} style={{ color: 'hsl(var(--color-primary))' }} /> Create New Exam
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Step {examWizardStep} of 4
                </p>
              </div>
              <button onClick={() => { resetWizardForm(); setShowExamWizard(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.8rem', lineHeight: 1, padding: '4px' }}>├ù</button>
            </div>

            {/* Step Progress */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {[1, 2, 3, 4].map(step => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                    background: step <= examWizardStep ? 'hsl(var(--color-primary))' : 'var(--bg-glass-active)', color: step <= examWizardStep ? '#fff' : 'var(--text-muted)'
                  }}>{step}</div>
                  <div style={{ flex: 1, height: '2px', background: step < examWizardStep ? 'hsl(var(--color-primary))' : 'var(--border-glass)', borderRadius: '1px' }} />
                </div>
              ))}
            </div>

            {/* Step 1: Basic Information */}
            {examWizardStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Basic Information</h4>
                <div className="form-group">
                  <label>Academic Session *</label>
                  <select className="form-control" value={wizardForm.academicSession} onChange={e => setWizardForm({ ...wizardForm, academicSession: e.target.value })} style={{ marginTop: '4px' }}>
                    {Array.from({ length: 2030 - 2026 + 1 }, (_, i) => {
  const s = 2026 + i;
  return `${s}-${s + 1}`;
}).map(sy => <option key={sy} value={sy}>{sy}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Exam Type *</label>
                  <select className="form-control" value={wizardForm.examType} onChange={e => setWizardForm({ ...wizardForm, examType: e.target.value })} style={{ marginTop: '4px' }}>
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {wizardForm.examType === 'Custom Exam' && (
                  <div className="form-group animate-slide-down">
                    <label>Name of Custom Exam *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Monthly Test October" 
                      value={wizardForm.customExamName || ''} 
                      onChange={e => setWizardForm({ ...wizardForm, customExamName: e.target.value })} 
                      style={{ marginTop: '4px' }} 
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" placeholder="Optional description..." value={wizardForm.description} onChange={e => setWizardForm({ ...wizardForm, description: e.target.value })} rows={3} style={{ marginTop: '4px', resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label>Total Marks (per subject) *</label>
                  <input type="number" className="form-control" placeholder="e.g. 100" min="1" value={wizardForm.totalMarks} onChange={e => setWizardForm({ ...wizardForm, totalMarks: parseInt(e.target.value) || 0 })} style={{ marginTop: '4px' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Default marks for each subject. You can override per subject in Step 3.</p>
                </div>
              </div>
            )}

            {/* Step 2: Select Grades */}
            {examWizardStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Select Grades</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Select one or more grades.</p>
                {(() => {
                  const currentExamName = wizardForm.examType === 'Custom Exam' ? wizardForm.customExamName : wizardForm.examType;
                  
                  const normalizeSession = (session) => {
                    if (!session) return '';
                    const clean = session.replace(/\s+/g, '');
                    const match = clean.match(/^(\d{4})-(\d{2})$/);
                    if (match) {
                      const century = match[1].slice(0, 2);
                      return `${match[1]}-${century}${match[2]}`;
                    }
                    return clean;
                  };

                  const targetSessionNorm = normalizeSession(wizardForm.academicSession);
                  const alreadyUsedGrades = new Set();
                  
                  exams.forEach(ex => {
                    if (wizardForm.id && ex.id === wizardForm.id) return;
                    
                    const exNameMatch = (ex.examName || '').trim().toLowerCase() === (currentExamName || '').trim().toLowerCase();
                    const exSessionNorm = normalizeSession(ex.academicSession);
                    
                    if (exNameMatch && (!exSessionNorm || exSessionNorm === targetSessionNorm)) {
                      (ex.gradeSections || []).forEach(gs => {
                        alreadyUsedGrades.add(gs.grade);
                      });
                    }
                  });

                  const uniqueGradesWithSubjects = [...new Set(subjects.map(s => s.grade))]
                    .filter(g => !alreadyUsedGrades.has(g) || wizardForm.selectedGrades.some(sg => sg.grade === g))
                    .sort((a, b) => {
                      const currentGradeOrder = activeGrades.map(g => g.name);
                      return currentGradeOrder.indexOf(a) - currentGradeOrder.indexOf(b);
                    });
                  return uniqueGradesWithSubjects.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                      {uniqueGradesWithSubjects.map((g, idx) => {
                        const isSelected = wizardForm.selectedGrades.some(sg => sg.grade === g);
                        return (
                          <div key={idx} onClick={() => {
                            const updated = isSelected
                              ? wizardForm.selectedGrades.filter(sg => sg.grade !== g)
                              : [...wizardForm.selectedGrades, { grade: g, section: "" }];
                            const newStartDates = { ...wizardForm.startDates };
                            const newEndDates = { ...wizardForm.endDates };
                            const key = `${g}-`;
                            if (!isSelected) {
                              newStartDates[key] = '';
                              newEndDates[key] = '';
                            } else {
                              delete newStartDates[key];
                              delete newEndDates[key];
                            }
                            setWizardForm({ ...wizardForm, selectedGrades: updated, startDates: newStartDates, endDates: newEndDates });
                          }} style={{
                            padding: '12px', borderRadius: '10px', cursor: 'pointer', userSelect: 'none',
                            background: isSelected ? 'rgba(99,102,241,0.12)' : 'var(--bg-glass-active)',
                            border: isSelected ? '2px solid hsl(var(--color-primary))' : '1px solid var(--border-glass)',
                            textAlign: 'center', fontWeight: 600, fontSize: '0.85rem',
                            transition: 'all 0.15s'
                          }}>
                            Grade {g}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No grades found with subjects. Please add subjects to a grade first.
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Step 3: Subject Assignment & Configuration */}
            {examWizardStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Subject Configuration</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Set marks per subject and choose which subjects to include in the exam schedule.
                </p>
                {(() => {
                  const uniqueGrades = [...new Set(wizardForm.selectedGrades.map(g => g.grade))];
                  return uniqueGrades.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                      {uniqueGrades.map(grade => {
                        const gradeSubjects = subjects.filter(s => s.grade === grade).map(s => s.subjectName);
                        return (
                          <div key={grade} className="glass-panel" style={{ padding: '16px 20px', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', borderRadius: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
                              <h5 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'hsl(var(--color-primary))' }}>
                                Grade {grade}
                              </h5>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                {gradeSubjects.filter(sub => wizardForm.subjectIncluded[`${grade}-${sub}`] !== false).length} / {gradeSubjects.length} subjects included
                              </span>
                            </div>
                            {gradeSubjects.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {/* Header Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px', gap: '12px', padding: '0 4px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject</span>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Marks</span>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Include</span>
                                </div>
                                {gradeSubjects.map((sub, i) => {
                                  const subKey = `${grade}-${sub}`;
                                  const isIncluded = wizardForm.subjectIncluded[subKey] !== false;
                                  const subMarks = wizardForm.subjectMarks[subKey] !== undefined ? wizardForm.subjectMarks[subKey] : wizardForm.totalMarks;
                                  return (
                                    <div key={i} style={{
                                      display: 'grid', gridTemplateColumns: '1fr 120px 100px', gap: '12px', padding: '10px 12px',
                                      background: isIncluded ? 'rgba(99,102,241,0.04)' : 'rgba(239,68,68,0.03)',
                                      border: isIncluded ? '1px solid rgba(99,102,241,0.15)' : '1px solid rgba(239,68,68,0.12)',
                                      borderRadius: '10px', alignItems: 'center',
                                      opacity: isIncluded ? 1 : 0.6,
                                      transition: 'all 0.2s ease'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                        <div style={{
                                          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                          background: isIncluded ? 'hsl(var(--color-primary))' : 'rgb(var(--color-danger-rgb))'
                                        }} />
                                        <span style={{
                                          fontSize: '0.88rem', fontWeight: 600,
                                          textDecoration: isIncluded ? 'none' : 'line-through',
                                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                        }}>{sub}</span>
                                      </div>
                                      <input
                                        type="number"
                                        min="1"
                                        value={subMarks}
                                        onChange={e => setWizardForm({
                                          ...wizardForm,
                                          subjectMarks: { ...wizardForm.subjectMarks, [subKey]: parseInt(e.target.value) || 0 }
                                        })}
                                        disabled={!isIncluded}
                                        className="form-control"
                                        style={{
                                          padding: '6px 10px', fontSize: '0.82rem', textAlign: 'center',
                                          borderRadius: '8px', width: '100%',
                                          opacity: isIncluded ? 1 : 0.4
                                        }}
                                      />
                                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button
                                          type="button"
                                          onClick={() => setWizardForm({
                                            ...wizardForm,
                                            subjectIncluded: { ...wizardForm.subjectIncluded, [subKey]: !isIncluded }
                                          })}
                                          style={{
                                            padding: '5px 16px', borderRadius: '20px', cursor: 'pointer',
                                            fontSize: '0.78rem', fontWeight: 700, border: 'none',
                                            background: isIncluded
                                              ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'
                                              : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08))',
                                            color: isIncluded ? '#10b981' : 'rgb(var(--color-danger-rgb))',
                                            transition: 'all 0.2s ease'
                                          }}
                                        >
                                          {isIncluded ? 'Yes' : 'No'}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                No subjects configured for Grade {grade}. Please add subjects in the Grade & Subjects section.
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No grades selected.
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Step 4: Schedule Configuration */}
            {examWizardStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Schedule Configuration</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Set the exam start and end dates for each grade-section.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {wizardForm.selectedGrades.map((gs, idx) => {
                    const key = `${gs.grade}-${gs.section}`;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', borderRadius: '10px', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: '120px', fontWeight: 700, fontSize: '0.9rem' }}>
                          Grade {gs.grade} - {gs.section}
                        </div>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Start Date *</label>
                          <input type="date" className="form-control" value={wizardForm.startDates[key] || ''} onChange={e => setWizardForm({ ...wizardForm, startDates: { ...wizardForm.startDates, [key]: e.target.value } })} required style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '0.82rem' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>End Date *</label>
                          <input type="date" className="form-control" value={wizardForm.endDates[key] || ''} onChange={e => setWizardForm({ ...wizardForm, endDates: { ...wizardForm.endDates, [key]: e.target.value } })} required style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '0.82rem' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              <div>
                {examWizardStep > 1 && (
                  <button className="btn-secondary" onClick={() => setExamWizardStep(examWizardStep - 1)} style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 600 }}>
                    ΓåÉ Back
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" onClick={() => { resetWizardForm(); setShowExamWizard(false); }} style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 600 }}>
                  Cancel
                </button>
                {examWizardStep < 4 ? (
                  <button className="btn-primary" onClick={() => {
                    if (examWizardStep === 1 && !wizardForm.examType.trim()) { showToast('Please select an exam type.', 'error'); return; }
                    if (examWizardStep === 1 && wizardForm.examType === 'Custom Exam' && !(wizardForm.customExamName || '').trim()) { showToast('Please enter the custom exam name.', 'error'); return; }
                    if (examWizardStep === 2 && wizardForm.selectedGrades.length === 0) { showToast('Please select at least one grade-section.', 'error'); return; }
                    setExamWizardStep(examWizardStep + 1);
                  }} style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 700 }}>
                    Next ΓåÆ
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--color-primary))', background: 'rgba(99,102,241,0.1)', padding: '6px 12px', borderRadius: '6px' }}>
                      {wizardForm.examType === 'Custom Exam' ? wizardForm.customExamName : wizardForm.examType}
                    </span>
                    <button className="btn-primary" onClick={async () => {
                      // Auto-generate examName from examType / customExamName
                      const examName = wizardForm.examType === 'Custom Exam' ? wizardForm.customExamName : wizardForm.examType;
                      // Validate: all start and end dates required
                      const missingDates = wizardForm.selectedGrades.filter(gs => {
                        const key = `${gs.grade}-${gs.section}`;
                        return !wizardForm.startDates[key] || !wizardForm.endDates[key];
                      });
                      if (missingDates.length > 0) {
                        showToast('Please set start and end dates for all grade-sections.', 'error');
                        return;
                      }

                    // Check: end date must not be earlier than start date
                    const invalidDates = wizardForm.selectedGrades.filter(gs => {
                      const key = `${gs.grade}-${gs.section}`;
                      return new Date(wizardForm.startDates[key]) > new Date(wizardForm.endDates[key]);
                    });
                    if (invalidDates.length > 0) {
                      showToast('End date cannot be earlier than start date.', 'error');
                      return;
                    }

                    const gradeSections = wizardForm.selectedGrades.map(gs => ({
                      grade: gs.grade,
                      section: gs.section,
                      startDate: wizardForm.startDates[`${gs.grade}-${gs.section}`],
                      endDate: wizardForm.endDates[`${gs.grade}-${gs.section}`]
                    }));

                    try {
                      const url = wizardForm.id ? `/api/academics/exams/${wizardForm.id}` : '/api/academics/exams';
                      const method = wizardForm.id ? 'PUT' : 'POST';
                      
                      const existingExam = wizardForm.id ? exams.find(e => e.id === wizardForm.id) : null;
                      const hasSchedules = wizardForm.id ? examTimetables.some(et => et.examId === wizardForm.id) : false;
                      const statusVal = existingExam ? (hasSchedules ? 'Scheduled' : 'Draft') : 'Draft';

                      const res = await fetch(url, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          examName: examName,
                          examType: wizardForm.examType,
                          academicSession: wizardForm.academicSession,
                          description: wizardForm.description,
                          totalMarks: wizardForm.totalMarks,
                          subjectMarks: wizardForm.subjectMarks,
                          subjectIncluded: wizardForm.subjectIncluded,
                          gradeSections,
                          status: statusVal
                        })
                      });
                      if (res.ok) {
                        showToast(wizardForm.id ? 'Exam updated successfully!' : 'Exam created successfully!', 'success');
                        resetWizardForm();
                        setShowExamWizard(false);
                        fetchAllData();
                      } else {
                        const data = await res.json();
                        showToast(data.error || 'Failed to save exam.', 'error');
                      }
                    } catch (e) {
                      showToast('Network error.', 'error');
                    }
                  }} style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700, background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #4f46e5 100%)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                    {wizardForm.id ? 'Save Exam' : 'Create Exam'}
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Schedule View Modal */}
      {viewScheduleExam && createPortal(
        <div className="modal-overlay" style={{ zIndex: 20000001 }}>
          <div className="animate-scale-up glass-panel" style={{
            width: '100%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto', padding: '28px', borderRadius: '20px',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{viewScheduleExam.examName}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  {viewScheduleExam.examType} ┬╖ {viewScheduleExam.academicSession || 'N/A'}
                </p>
              </div>
              <button onClick={() => setViewScheduleExam(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.8rem', lineHeight: 1, padding: '4px' }}>├ù</button>
            </div>

            {(() => {
              const schedules = examTimetables.filter(et => et.examId === viewScheduleExam.id);
              const cohorts = [...new Set(schedules.map(s => s.cohort).filter(Boolean))].sort();
              if (schedules.length === 0) {
                return (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Calendar size={32} style={{ opacity: 0.3 }} />
                    <p style={{ marginTop: '8px' }}>No timetable created yet. Please manually configure the exam timetable in the Exam Timetable section.</p>
                  </div>
                );
              }
              const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '-';
              return cohorts.map(cohort => {
                const cs = schedules.filter(s => s.cohort === cohort);
                const [g, sec] = cohort.split('-');
                return (
                  <div key={cohort} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'hsl(var(--color-primary))' }}>
                      {sec ? `Grade ${g} - Section ${sec}` : `Grade ${g}`}
                    </h4>
                    <table className="table-custom" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '10px 0', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-muted)', fontWeight: 700 }}>Subject</th>
                          <th style={{ textAlign: 'center', padding: '10px 0', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-muted)', fontWeight: 700 }}>Marks</th>
                          <th style={{ textAlign: 'center', padding: '10px 0', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-muted)', fontWeight: 700 }}>Time Slot</th>
                          <th style={{ textAlign: 'right', padding: '10px 0', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-muted)', fontWeight: 700 }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cs.map(s => {
                          const subKey = `${s.grade}-${s.subject}`;
                          const subMarks = (viewScheduleExam.subjectMarks && viewScheduleExam.subjectMarks[subKey] !== undefined)
                            ? viewScheduleExam.subjectMarks[subKey]
                            : (viewScheduleExam.totalMarks || 100);
                          return (
                            <tr key={s.id}>
                              <td style={{ fontWeight: 600, padding: '12px 0', borderBottom: '1px solid var(--border-glass)' }}>{s.subject}</td>
                              <td style={{ textAlign: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-glass)', fontWeight: 600, color: 'hsl(var(--color-primary))' }}>{subMarks}</td>
                              <td style={{ textAlign: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-main)' }}>
                                {s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.timeSlot || s.duration || '-')}
                              </td>
                              <td style={{ textAlign: 'right', padding: '12px 0', borderBottom: '1px solid var(--border-glass)' }}>{formatDate(s.examDate)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              });
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setViewScheduleExam(null)} style={{ borderRadius: '8px', padding: '8px 20px', fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showTimeslotsModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 20000000 }}>
          <div className="animate-scale-up" style={{
            width: '100%', maxWidth: '440px', padding: '28px', borderRadius: '16px',
            background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} /> Manage Time Slots
              </h3>
              <button 
                type="button" 
                onClick={() => setShowTimeslotsModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
              >
                ├ù
              </button>
            </div>

            {/* List of Time Slots */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
              {timeslots.length > 0 ? (
                timeslots.map((slot, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{slot}</span>
                    <button 
                      onClick={() => handleDeleteTimeslot(slot)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>No time slots found</span>
              )}
            </div>

            {/* Add New Time Slot form */}
            <form onSubmit={handleAddTimeslot} style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(var(--color-primary))', textTransform: 'uppercase' }}>Add New Period Slot</span>              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>Start Time *</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={startTimeInput} 
                    onChange={e => setStartTimeInput(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>End Time *</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={endTimeInput} 
                    onChange={e => setEndTimeInput(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem' }}>Slot Type</label>
                <select 
                  className="form-control" 
                  value={timeslotType} 
                  onChange={e => setTimeslotType(e.target.value)}
                  style={{ marginTop: '4px' }}
                >
                  <option value="Regular">Regular Period</option>
                  <option value="Lunch Break">Lunch Break</option>
                  <option value="Short Break">Short Break</option>
                  <option value="Recess">Recess</option>
                  <option value="Assembly">Assembly</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ borderRadius: '8px', padding: '10px', fontSize: '0.85rem' }}>
                Register Time Slot
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showSubjectsModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 20000000 }}>
          <div className="animate-scale-up" style={{
            width: '100%', maxWidth: '550px', padding: '28px', borderRadius: '16px',
            background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} /> Manage Grade Subjects
              </h3>
              <button 
                type="button" 
                onClick={() => setShowSubjectsModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
              >
                ├ù
              </button>
            </div>

            {/* Filter by Grade */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Select Grade Level</label>
              <select 
                className="form-control" 
                value={newSubjectGrade} 
                onChange={(e) => {
                  const newGrade = e.target.value;
                  setNewSubjectGrade(newGrade);
                  const gradeSubjects = subjects.filter(s => s.grade === newGrade);
                  setEditingSubjects(gradeSubjects);
                  const prefilled = Array(10).fill('');
                  gradeSubjects.slice(0, 10).forEach((sub, idx) => {
                    prefilled[idx] = sub.subjectName;
                  });
                  setNewSubjectsList(prefilled);
                }}
                style={{ marginTop: '4px' }}
              >
                {activeGrades.map(g => g.name).map(g => (
                  <option key={g} value={g}>{g.startsWith('LKG') || g.startsWith('UKG') || g.startsWith('NURSERY') ? g : `Grade ${g}`}</option>
                ))}
              </select>
            </div>

            {/* List of custom subjects for the selected grade */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subjects for Grade {newSubjectGrade}</span>
              {subjects.filter(s => s.grade === newSubjectGrade).length > 0 ? (
                subjects.filter(s => s.grade === newSubjectGrade).map((sub, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{sub.subjectName}</span>
                    <button 
                      onClick={async () => {
                        await handleDeleteSubject(sub.id);
                        // Also clear this subject from the form list so it reflects the deletion
                        const cleared = [...newSubjectsList];
                        const inputIdx = cleared.findIndex(v => v.trim().toLowerCase() === sub.subjectName.trim().toLowerCase());
                        if (inputIdx !== -1) cleared[inputIdx] = '';
                        setNewSubjectsList(cleared);
                        setEditingSubjects(prev => prev.filter(es => es.id !== sub.id));
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>No subjects defined for Grade {newSubjectGrade}</span>
              )}
            </div>

            {/* Add New Subjects form in Bulk */}
            <form onSubmit={handleBulkSubjectsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(var(--color-primary))', textTransform: 'uppercase' }}>Edit / Add Subjects (Up to 10)</span>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '4px'
              }}>
                {newSubjectsList.map((val, idx) => (
                  <div key={idx} className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Subject {idx + 1}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={`e.g. Subject ${idx + 1}`}
                      value={val} 
                      onChange={e => {
                        const updated = [...newSubjectsList];
                        updated[idx] = e.target.value;
                        setNewSubjectsList(updated);
                      }} 
                      style={{ marginTop: '2px', padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                  </div>
                ))}
              </div>

              <button type="submit" className="btn-primary" style={{ borderRadius: '8px', padding: '10px', fontSize: '0.85rem', marginTop: '4px' }}>
                Save Subjects for Grade {newSubjectGrade}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showBulkModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 20000000 }}>
          <div className="animate-scale-up glass-panel" style={{
            width: '100%', maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto',
            padding: '32px', borderRadius: '20px',
            background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={22} style={{ color: 'hsl(var(--color-primary))' }} /> Weekly Timetable Bulk Editor
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Configure the entire weekly schedule for Class <strong style={{ color: 'hsl(var(--color-primary))' }}>{activeClass}</strong> at once.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowBulkModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '2rem', lineHeight: 1, padding: '4px' }}
              >
                ├ù
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass-active)' }}>
                <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-glass-active)' }}>
                      <th style={{ padding: '16px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', width: '120px' }}>Day</th>
                      {timeslots.map(slot => (
                        <th key={slot} style={{ padding: '16px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>
                          {slot}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {daysOfWeek.map(day => (
                      <tr key={day} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '16px', fontWeight: 800, color: 'hsl(var(--color-primary))', fontSize: '0.85rem', background: 'rgba(255,255,255,0.01)' }}>
                          {day}
                        </td>
                        {timeslots.map(slot => {
                          const key = `${day}_${slot}`;
                          const cell = bulkGrid[key] || { subject: '', teacher: '', room: '' };
                          const gradeSubjects = subjects.filter(s => s.grade === activeClass.split('-')[0]);

                          const breakMatch = slot.match(/\[(.*?)\]/);
                          const breakType = breakMatch ? breakMatch[1] : null;
                          const isBreak = !!breakType;

                          if (isBreak) {
                            return (
                              <td key={slot} style={{ 
                                padding: '12px', 
                                verticalAlign: 'middle', 
                                borderLeft: '1px solid var(--border-glass)',
                                background: 'rgba(245, 158, 11, 0.03)',
                                textAlign: 'center',
                                fontWeight: 700,
                                color: '#d97706',
                                fontSize: '0.8rem'
                              }}>
                                {breakType === 'Lunch Break' ? '≡ƒì▒ ' : breakType === 'Short Break' ? 'Γÿò ' : breakType === 'Recess' ? '≡ƒÅâ ' : breakType === 'Assembly' ? '≡ƒôó ' : 'ΓÜí '}{breakType}
                              </td>
                            );
                          }

                          return (
                            <td key={slot} style={{ padding: '12px', verticalAlign: 'top', borderLeft: '1px solid var(--border-glass)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <select 
                                  value={cell.subject}
                                  onChange={(e) => handleBulkCellChange(day, slot, 'subject', e.target.value)}
                                  style={{ 
                                    width: '100%', 
                                    padding: '6px 18px 6px 8px', 
                                    borderRadius: '6px', 
                                    border: '1px solid var(--border-glass)', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 600,
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden'
                                  }}
                                >
                                  <option value="">Select Subject</option>
                                  {gradeSubjects.map(s => <option key={s.id} value={s.subjectName}>{s.subjectName}</option>)}
                                </select>
                                <select 
                                  value={cell.teacher}
                                  onChange={(e) => handleBulkCellChange(day, slot, 'teacher', e.target.value)}
                                  style={{ 
                                    width: '100%', 
                                    padding: '6px 18px 6px 8px', 
                                    borderRadius: '6px', 
                                    border: '1px solid var(--border-glass)', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 600,
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden'
                                  }}
                                >
                                  <option value="">Select Staff</option>
                                  {Array.isArray(teachers) && teachers.map((t, idx) => (
                                    <option key={idx} value={t.name}>{t.name}</option>
                                  ))}
                                </select>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={handleClearBulkGrid}
                  className="btn-secondary" 
                  style={{ borderColor: '#ef4444', color: '#ef4444', borderRadius: '8px', padding: '10px 18px', fontWeight: 600 }}
                >
                  Clear All Slots
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowBulkModal(false)} 
                    className="btn-secondary"
                    style={{ borderRadius: '8px', padding: '10px 18px', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #4f46e5 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 24px',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    Save Timetable Matrix
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showTeacherBulkModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 20000000 }}>
          <div className="animate-scale-up glass-panel" style={{
            width: '100%', maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto',
            padding: '32px', borderRadius: '20px',
            background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={22} style={{ color: 'hsl(var(--color-primary))' }} /> Weekly Staff Timetable Bulk Editor
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                   Configure the entire weekly schedule workload for staff member <strong style={{ color: 'hsl(var(--color-primary))' }}>{activeTeacher}</strong> at once.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowTeacherBulkModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '2rem', lineHeight: 1, padding: '4px' }}
              >
                ├ù
              </button>
            </div>



            <form onSubmit={handleTeacherBulkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass-active)' }}>
                <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-glass-active)' }}>
                      <th style={{ padding: '16px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', width: '120px' }}>Day</th>
                      {timeslots.map(slot => (
                        <th key={slot} style={{ padding: '16px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>
                          {slot}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {daysOfWeek.map(day => (
                      <tr key={day} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '16px', fontWeight: 800, color: 'hsl(var(--color-primary))', fontSize: '0.85rem', background: 'rgba(255,255,255,0.01)' }}>
                          {day}
                        </td>
                        {timeslots.map(slot => {
                          const key = `${day}_${slot}`;
                          const cell = teacherBulkGrid[key] || { cohort: '', subject: '' };
                          const grades = getGradesWithSubjects(subjects);
                          const sections = ['A', 'B', 'C', 'D', 'E'];
                          const allCohortsSet = new Set();
                          grades.forEach(g => {
                            sections.forEach(sec => {
                              allCohortsSet.add(`${g}-${sec}`);
                            });
                          });
                          if (Array.isArray(students)) {
                            students.forEach(s => {
                              const c = s.grade || `${s.studentClass || 'I'}-${s.section || 'A'}`;
                              if (c) allCohortsSet.add(c);
                            });
                          }
                          const allCohorts = [...allCohortsSet];

                          // Ensure current cell's cohort is always included
                          const cellCohorts = [...allCohorts];
                          if (cell.cohort && !cellCohorts.includes(cell.cohort)) {
                            cellCohorts.push(cell.cohort);
                          }

                          // Sort cohorts: Grade order first, then Section order
                          cellCohorts.sort((a, b) => {
                            const [gA, sA] = a.split('-');
                            const [gB, sB] = b.split('-');
                            const currentGradeOrder = activeGrades.map(g => g.name);
                            const idxA = currentGradeOrder.indexOf(gA);
                            const idxB = currentGradeOrder.indexOf(gB);
                            if (idxA !== idxB) {
                              return idxA - idxB;
                            }
                            return (sA || '').localeCompare(sB || '');
                          });
                          return (() => {
                            const breakMatch = slot.match(/\[(.*?)\]/);
                            const breakType = breakMatch ? breakMatch[1] : null;
                            const isBreak = !!breakType;

                            if (isBreak) {
                              return (
                                <td key={slot} style={{ 
                                  padding: '12px', 
                                  verticalAlign: 'middle', 
                                  borderLeft: '1px solid var(--border-glass)',
                                  background: 'rgba(245, 158, 11, 0.03)',
                                  textAlign: 'center',
                                  fontWeight: 700,
                                  color: '#d97706',
                                  fontSize: '0.8rem'
                                }}>
                                  {breakType === 'Lunch Break' ? '≡ƒì▒ ' : breakType === 'Short Break' ? 'Γÿò ' : breakType === 'Recess' ? '≡ƒÅâ ' : breakType === 'Assembly' ? '≡ƒôó ' : 'ΓÜí '}{breakType}
                                </td>
                              );
                            }

                            return (
                              <td key={slot} style={{ padding: '12px', verticalAlign: 'top', borderLeft: '1px solid var(--border-glass)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <select 
                                    value={cell.cohort}
                                    onChange={(e) => handleTeacherBulkCellChange(day, slot, 'cohort', e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '6px 18px 6px 8px',
                                      borderRadius: '6px',
                                      background: 'var(--bg-glass-active)',
                                      border: '1px solid var(--border-glass)',
                                      color: 'var(--text-main)',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      outline: 'none',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <option value="">-- Off / Free --</option>
                                    {cellCohorts.map(cohort => {
                                      const parts = cohort.split('-');
                                      const displayLabel = parts.length === 2 ? `${parts[0]} (${parts[1]})` : cohort;
                                      return (
                                        <option key={cohort} value={cohort}>{displayLabel}</option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </td>
                            );
                          })();
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={handleClearTeacherBulkGrid}
                  className="btn-secondary" 
                  style={{ borderColor: '#ef4444', color: '#ef4444', borderRadius: '8px', padding: '10px 18px', fontWeight: 600 }}
                >
                  Clear All Slots
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowTeacherBulkModal(false)} 
                    className="btn-secondary"
                    style={{ borderRadius: '8px', padding: '10px 18px', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #4f46e5 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 24px',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    Save Timetable Matrix
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showConfirmModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 20000000 }}>
          <div className="animate-scale-up glass-panel" style={{
            width: '100%', maxWidth: '400px', padding: '28px', borderRadius: '16px',
            background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px',
            textAlign: 'center', alignItems: 'center'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: '8px'
            }}>
              <AlertCircle size={32} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Are you sure to delete?
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                This will completely delete the timetable for Class <strong>{cohortToDelete}</strong>. This action cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={cancelDeleteWholeTimetable} 
                className="btn-secondary"
                style={{ flex: 1, borderRadius: '8px', padding: '10px 18px', fontWeight: 600, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={confirmDeleteWholeTimetable}
                className="btn-primary"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: 700,
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  justifyContent: 'center'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
