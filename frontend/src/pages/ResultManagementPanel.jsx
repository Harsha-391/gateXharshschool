import React, { useState, useEffect, useMemo, useRef } from 'react';
import './ResultManagementPanel.css';
import { createPortal } from 'react-dom';
import { fetchActiveGrades } from '../utils/grades';
import { DEFAULT_TEMPLATES, compileTemplate } from '../utils/reportTemplates';
import {
  Award,
  Search,
  Download,
  Printer,
  Edit,
  Save,
  Check,
  Lock,
  Unlock,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  Users,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  RefreshCw,
  Clock,
  Share2,
  Trash2,
  RotateCcw,
  Code,
  SlidersHorizontal
} from 'lucide-react';

const parseStudentClass = (studentClass) => {
  if (!studentClass) return { grade: '-', department: '-' };
  const match = studentClass.match(/^(.+?)\s*\((.+?)\)$/);
  if (match) {
    return { grade: match[1], department: match[2] };
  }
  return { grade: studentClass, department: '-' };
};

export default function ResultManagementPanel({ activeTab: propActiveTab = 'analytics', setAdminView, userProfile }) {
  const [activeTab, setActiveTab] = useState(propActiveTab);

  useEffect(() => {
    setActiveTab(propActiveTab);
  }, [propActiveTab]);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeGrades, setActiveGrades] = useState([]);

  useEffect(() => {
    const loadGrades = async () => {
      const grades = await fetchActiveGrades();
      setActiveGrades(grades);
    };
    loadGrades();
  }, []);

  // Auth/Role State
  const [userRole, setUserRole] = useState('Admin');
  const [currentUsername, setCurrentUsername] = useState('');

  // Dropdown options loaded from DB
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradesSections, setGradesSections] = useState({ grades: [], sections: [], gradeSectionPairs: [] });
  const [examTimetables, setExamTimetables] = useState([]);

  // Core Result States
  const [results, setResults] = useState([]);
  const [overallResults, setOverallResults] = useState([]);

  // Sub-Tab: Marks Entry Form State
  const [selectedSession, setSelectedSession] = useState('2026-2027');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [rosterSearch, setRosterSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [marksDraft, setMarksDraft] = useState({}); // studentId -> obtainedMarks
  const [remarksDraft, setRemarksDraft] = useState({}); // studentId -> remarks
  const [bulkInputText, setBulkInputText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Department selection state (for XI & XII)
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Analytics Dashboard Filter States
  const [analyticsSession, setAnalyticsSession] = useState('2026-2027');
  const [analyticsClass, setAnalyticsClass] = useState('');
  const [analyticsDepartment, setAnalyticsDepartment] = useState('');
  const [analyticsSection, setAnalyticsSection] = useState('All');
  const [analyticsExam, setAnalyticsExam] = useState('All');

  // Exam student attendance status: key format: `${selectedExam}_${studentId}` -> 'Present' | 'Absent'
  const [examAttendance, setExamAttendance] = useState(() => {
    try {
      const stored = localStorage.getItem('exam_student_attendance');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('exam_student_attendance', JSON.stringify(examAttendance));
  }, [examAttendance]);

  // Published student exams: mapping studentId -> { [examId]: true }
  const [publishedExams, setPublishedExams] = useState(() => {
    try {
      const stored = localStorage.getItem('published_student_exams');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('published_student_exams', JSON.stringify(publishedExams));
  }, [publishedExams]);

  const teacherGradeName = useMemo(() => {
    if (!userProfile) return '';
    const matched = activeGrades.find(g => 
      g.id === userProfile.assignedGradeId || 
      g.gradeId === userProfile.assignedGradeId ||
      g.name === userProfile.assignedGradeId ||
      g.gradeName === userProfile.assignedGradeId
    );
    return matched ? matched.gradeName : (userProfile.assignedGradeName || userProfile.assignedGradeId || '');
  }, [userProfile, activeGrades]);

  const teacherSectionName = useMemo(() => {
    if (!userProfile) return '';
    return userProfile.assignedSectionName || userProfile.assignedSectionId || '';
  }, [userProfile]);

  // Handle department resetting on class change
  useEffect(() => {
    if (selectedClass) {
      const hasDepts = activeGrades.some(g => g.gradeName === selectedClass && g.departmentName);
      if (hasDepts) {
        const depts = activeGrades.filter(g => g.gradeName === selectedClass && g.departmentName);
        if (depts.length > 0) {
          setSelectedDepartment(depts[0].departmentName);
        } else {
          setSelectedDepartment('');
        }
      } else {
        setSelectedDepartment('');
      }
    } else {
      setSelectedDepartment('');
    }
  }, [selectedClass, activeGrades]);

  const targetClass = useMemo(() => {
    if (!selectedClass) return '';
    const hasDepts = activeGrades.some(g => g.gradeName === selectedClass && g.departmentName);
    if (hasDepts && selectedDepartment) {
      return `${selectedClass} (${selectedDepartment})`;
    }
    return selectedClass;
  }, [selectedClass, selectedDepartment, activeGrades]);

  const allowedSections = useMemo(() => {
    if (userProfile?.role === 'Teacher') {
      return teacherSectionName ? [teacherSectionName] : [];
    }
    if (!targetClass) return [];
    const matchedGrade = activeGrades.find(g => g.name === targetClass);
    return matchedGrade ? (matchedGrade.sections || []) : [];
  }, [targetClass, activeGrades, userProfile, teacherSectionName]);

  useEffect(() => {
    if (allowedSections.length > 0) {
      if (!allowedSections.includes(selectedSection)) {
        setSelectedSection(allowedSections[0]);
      }
    } else {
      setSelectedSection('');
    }
  }, [allowedSections, selectedSection]);

  const analyticsHasDepartments = useMemo(() => {
    if (!analyticsClass) return false;
    return activeGrades.some(g => g.gradeName === analyticsClass && g.departmentName);
  }, [analyticsClass, activeGrades]);

  const analyticsAvailableDepartments = useMemo(() => {
    if (!analyticsClass) return [];
    const depts = activeGrades
      .filter(g => g.gradeName === analyticsClass && g.departmentName)
      .map(g => g.departmentName);
    return [...new Set(depts)].filter(Boolean);
  }, [analyticsClass, activeGrades]);

  // Handle department resetting on analytics class change
  useEffect(() => {
    if (analyticsClass) {
      const hasDepts = activeGrades.some(g => g.gradeName === analyticsClass && g.departmentName);
      if (hasDepts) {
        const depts = activeGrades.filter(g => g.gradeName === analyticsClass && g.departmentName);
        if (depts.length > 0) {
          setAnalyticsDepartment(depts[0].departmentName);
        } else {
          setAnalyticsDepartment('');
        }
      } else {
        setAnalyticsDepartment('');
      }
    } else {
      setAnalyticsDepartment('');
    }
  }, [analyticsClass, activeGrades]);

  const analyticsTargetClass = useMemo(() => {
    if (!analyticsClass) return '';
    const hasDepts = activeGrades.some(g => g.gradeName === analyticsClass && g.departmentName);
    if (hasDepts && analyticsDepartment) {
      return `${analyticsClass} (${analyticsDepartment})`;
    }
    return analyticsClass;
  }, [analyticsClass, analyticsDepartment, activeGrades]);

  const analyticsAllowedSections = useMemo(() => {
    if (userProfile?.role === 'Teacher') {
      return teacherSectionName ? [teacherSectionName] : [];
    }
    if (!analyticsTargetClass) return [];
    const matchedGrade = activeGrades.find(g => g.name === analyticsTargetClass || g.gradeName === analyticsTargetClass);
    return matchedGrade ? (matchedGrade.sections || []) : [];
  }, [analyticsTargetClass, activeGrades, userProfile, teacherSectionName]);

  useEffect(() => {
    if (analyticsAllowedSections.length > 0) {
      if (!analyticsAllowedSections.includes(analyticsSection)) {
        setAnalyticsSection(analyticsAllowedSections[0]);
      }
    } else {
      setAnalyticsSection('All');
    }
  }, [analyticsAllowedSections, analyticsSection]);

  const hasDepartments = useMemo(() => {
    if (!selectedClass) return false;
    return activeGrades.some(g => g.gradeName === selectedClass && g.departmentName);
  }, [selectedClass, activeGrades]);

  const availableDepartments = useMemo(() => {
    if (!selectedClass) return [];
    const depts = activeGrades
      .filter(g => g.gradeName === selectedClass && g.departmentName)
      .map(g => g.departmentName);
    return [...new Set(depts)].filter(Boolean);
  }, [selectedClass, activeGrades]);

  const uniqueGradeNames = useMemo(() => {
    if (userProfile?.role === 'Teacher') {
      return teacherGradeName ? [teacherGradeName] : [];
    }
    const names = new Set();
    activeGrades.forEach(g => {
      if (g.gradeName) {
        names.add(g.gradeName);
      } else if (g.name) {
        const base = g.name.split(' ')[0];
        names.add(base);
      }
    });
    return Array.from(names);
  }, [activeGrades, userProfile]);

  // Per-student Result Modal States
  const [studentExamSelections, setStudentExamSelections] = useState({}); // studentId -> examId
  const [studentExamCategories, setStudentExamCategories] = useState({}); // studentId -> examType/category
  const [activeStudentForModal, setActiveStudentForModal] = useState(null);
  const [activeExamForModal, setActiveExamForModal] = useState(null);
  const [modalViewOnly, setModalViewOnly] = useState(false);
  const [studentHistoryExams, setStudentHistoryExams] = useState([]);
  const [historySelectedExam, setHistorySelectedExam] = useState(null);
  const [formMarks, setFormMarks] = useState({}); // subject -> obtainedMarks
  const [formRemarks, setFormRemarks] = useState({}); // subject -> remarks
  const [modalAttendance, setModalAttendance] = useState('Present');

  // Initialize modal attendance state when student or exam changes
  useEffect(() => {
    if (activeStudentForModal && activeExamForModal) {
      // 1. Check if there are saved results indicating 'Absent'
      const studentResults = results.filter(r => 
        r.studentId === activeStudentForModal.id && 
        r.examId === activeExamForModal.id
      );
      const hasAbsentRecord = studentResults.some(r => r.remarks === 'Absent');
      if (hasAbsentRecord) {
        setModalAttendance('Absent');
      } else {
        // 2. Fallback to roster page attendance selection
        const rosterStatus = examAttendance[`${activeExamForModal.id}_${activeStudentForModal.id}`] || 'Present';
        setModalAttendance(rosterStatus);
      }
    } else {
      setModalAttendance('Present');
    }
  }, [activeStudentForModal, activeExamForModal, results, examAttendance]);


  // Sub-Tab: Report Card Preview State
  const [reportStudentId, setReportStudentId] = useState('');
  const [reportClass, setReportClass] = useState('');
  const [reportDepartment, setReportDepartment] = useState('');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [showReportSearchResults, setShowReportSearchResults] = useState(false);

  // New States for Dynamic Template System
  const [reportSession, setReportSession] = useState('2026-2027');
  const [reportExamId, setReportExamId] = useState('All');
  const [reportSection, setReportSection] = useState('All');
  const [reportTemplateId, setReportTemplateId] = useState(() => {
    return localStorage.getItem(`report_card_template_id_${localStorage.getItem('tenant_subdomain') || 'default'}`) || 'classic';
  });
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkExportProgress, setBulkExportProgress] = useState(0);

  // School profile & staff list states for dynamic data populating
  const [schoolInfo, setSchoolInfo] = useState({ name: 'Green Valley Public School', address: 'Khimel Rani Station Road, Bali, Rajasthan', email: 'contact@gmail.com', phone: '', logo: '' });
  const [staffList, setStaffList] = useState([]);

  // Memoized search filtered students across all classes with results
  const reportSearchFilteredStudents = useMemo(() => {
    const query = reportSearchQuery.trim().toLowerCase();
    if (!query) return [];
    return students.filter(s => {
      // Find if student has any result in overallResults
      const hasResult = overallResults.some(o => {
        if (o.studentId !== s.id) return false;
        const exam = exams.find(e => e.id === o.examId);
        return exam && exam.academicSession === reportSession;
      });
      if (!hasResult) return false;

      return (
        s.name.toLowerCase().includes(query) ||
        (s.rollNumber || s.roll || '').toString().toLowerCase().includes(query)
      );
    });
  }, [students, reportSearchQuery, overallResults, exams, reportSession]);

  // Handle department resetting on report class change
  useEffect(() => {
    if (reportClass) {
      const hasDepts = activeGrades.some(g => g.gradeName === reportClass && g.departmentName);
      if (hasDepts) {
        const depts = activeGrades.filter(g => g.gradeName === reportClass && g.departmentName);
        if (depts.length > 0) {
          setReportDepartment(depts[0].departmentName);
        } else {
          setReportDepartment('');
        }
      } else {
        setReportDepartment('');
      }
    } else {
      setReportDepartment('');
    }
  }, [reportClass, activeGrades]);

  const targetReportClass = useMemo(() => {
    if (!reportClass) return '';
    const hasDepts = activeGrades.some(g => g.gradeName === reportClass && g.departmentName);
    if (hasDepts && reportDepartment) {
      return `${reportClass} (${reportDepartment})`;
    }
    return reportClass;
  }, [reportClass, reportDepartment, activeGrades]);

  const reportHasDepartments = useMemo(() => {
    if (!reportClass) return false;
    return activeGrades.some(g => g.gradeName === reportClass && g.departmentName);
  }, [reportClass, activeGrades]);

  const reportAvailableDepartments = useMemo(() => {
    if (!reportClass) return [];
    const depts = activeGrades
      .filter(g => g.gradeName === reportClass && g.departmentName)
      .map(g => g.departmentName);
    return [...new Set(depts)].filter(Boolean);
  }, [reportClass, activeGrades]);



  const reportAllowedSections = useMemo(() => {
    if (userProfile?.role === 'Teacher') {
      return teacherSectionName ? [teacherSectionName] : [];
    }
    if (!targetReportClass) return [];
    const matchedGrade = activeGrades.find(g => g.name === targetReportClass);
    return matchedGrade ? (matchedGrade.sections || []) : [];
  }, [targetReportClass, activeGrades, userProfile, teacherSectionName]);

  useEffect(() => {
    if (reportAllowedSections.length > 0) {
      if (reportSection !== 'All' && !reportAllowedSections.includes(reportSection)) {
        setReportSection('All');
      }
    } else {
      setReportSection('All');
    }
  }, [reportAllowedSections, reportSection]);

  const reportFilteredStudents = useMemo(() => {
    if (!reportClass) return [];
    return students.filter(s => {
      // 1. Class filter
      if (s.studentClass !== targetReportClass) return false;
      
      // 2. Section filter
      if (reportSection !== 'All' && (s.section || 'A') !== reportSection) return false;

      // 3. Check if student has overall results for the selected session and exam (without needing published status!)
      if (reportExamId !== 'All') {
        return overallResults.some(o => o.studentId === s.id && o.examId === reportExamId);
      } else {
        return overallResults.some(o => {
          if (o.studentId !== s.id) return false;
          const exam = exams.find(e => e.id === o.examId);
          return exam && exam.academicSession === reportSession;
        });
      }
    });
  }, [students, reportClass, targetReportClass, reportSection, reportExamId, reportSession, exams, overallResults]);

  const reportClassTeacherName = useMemo(() => {
    if (!targetReportClass || !reportStudentId) return 'N/A';
    const student = students.find(s => s.id === reportStudentId);
    if (!student) return 'N/A';
    const studentSection = student.section || 'A';
    
    // Safely wrap staffList to ensure it's always an array
    const staffArr = Array.isArray(staffList) ? staffList : [];
    if (staffArr.length === 0) return 'N/A';
    
    // Find teacher assigned to this grade and section who isClassTeacher === true
    const teacher = staffArr.find(s => 
      s.assignedGradeId === targetReportClass && 
      s.assignedSectionId === studentSection &&
      (s.isClassTeacher === true || s.isClassTeacher === 'true' || s.isClassTeacher === 1 || s.isClassTeacher === 'Yes')
    );
    if (teacher) return teacher.name;
    
    // Fallback: find any teacher assigned to this grade and section
    const fallbackTeacher = staffArr.find(s => 
      s.assignedGradeId === targetReportClass && 
      s.assignedSectionId === studentSection
    );
    if (fallbackTeacher) return fallbackTeacher.name;

    // Second fallback: find any class teacher for this grade
    const secondFallback = staffArr.find(s => 
      s.assignedGradeId === targetReportClass && 
      (s.isClassTeacher === true || s.isClassTeacher === 'true' || s.isClassTeacher === 1 || s.isClassTeacher === 'Yes')
    );
    return secondFallback ? secondFallback.name : 'N/A';
  }, [staffList, targetReportClass, reportStudentId, students]);


  // Sub-Tab: Academic Records / Search State
  const [historySearch, setHistorySearch] = useState('');
  const [historyClassFilter, setHistoryClassFilter] = useState('');
  const [historySectionFilter, setHistorySectionFilter] = useState('');
  const [historyDepartmentFilter, setHistoryDepartmentFilter] = useState('');

  // Handle pre-populating teacher class and section filters
  useEffect(() => {
    if (userProfile?.role === 'Teacher') {
      if (teacherGradeName) {
        setSelectedClass(teacherGradeName);
        setReportClass(teacherGradeName);
        setHistoryClassFilter(teacherGradeName);
      }
      if (teacherSectionName) {
        setSelectedSection(teacherSectionName);
        setReportSection(teacherSectionName);
        setHistorySectionFilter(teacherSectionName);
      }
    }
  }, [userProfile, teacherGradeName, teacherSectionName]);

  // Handle department resetting on history class change
  useEffect(() => {
    if (historyClassFilter) {
      const hasDepts = activeGrades.some(g => g.gradeName === historyClassFilter && g.departmentName);
      if (hasDepts) {
        const depts = activeGrades.filter(g => g.gradeName === historyClassFilter && g.departmentName);
        if (depts.length > 0) {
          setHistoryDepartmentFilter(depts[0].departmentName);
        } else {
          setHistoryDepartmentFilter('');
        }
      } else {
        setHistoryDepartmentFilter('');
      }
    } else {
      setHistoryDepartmentFilter('');
    }
  }, [historyClassFilter, activeGrades]);

  const targetHistoryClass = useMemo(() => {
    if (!historyClassFilter) return '';
    const hasDepts = activeGrades.some(g => g.gradeName === historyClassFilter && g.departmentName);
    if (hasDepts && historyDepartmentFilter) {
      return `${historyClassFilter} (${historyDepartmentFilter})`;
    }
    return historyClassFilter;
  }, [historyClassFilter, historyDepartmentFilter, activeGrades]);

  const historyHasDepartments = useMemo(() => {
    if (!historyClassFilter) return false;
    return activeGrades.some(g => g.gradeName === historyClassFilter && g.departmentName);
  }, [historyClassFilter, activeGrades]);

  const historyAvailableDepartments = useMemo(() => {
    if (!historyClassFilter) return [];
    const depts = activeGrades
      .filter(g => g.gradeName === historyClassFilter && g.departmentName)
      .map(g => g.departmentName);
    return [...new Set(depts)].filter(Boolean);
  }, [historyClassFilter, activeGrades]);

  const historyAllowedSections = useMemo(() => {
    if (userProfile?.role === 'Teacher') {
      return teacherSectionName ? [teacherSectionName] : [];
    }
    if (!targetHistoryClass) return [];
    const matchedGrade = activeGrades.find(g => g.name === targetHistoryClass);
    return matchedGrade ? (matchedGrade.sections || []) : [];
  }, [targetHistoryClass, activeGrades, userProfile, teacherSectionName]);

  useEffect(() => {
    if (historyAllowedSections.length > 0) {
      if (historySectionFilter !== '' && !historyAllowedSections.includes(historySectionFilter)) {
        setHistorySectionFilter('');
      }
    } else {
      setHistorySectionFilter('');
    }
  }, [historyAllowedSections, historySectionFilter]);



  // Notification Toast Helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Resolve session user role
  useEffect(() => {
    const role = localStorage.getItem('portal_role') || localStorage.getItem('role') || 'Admin';
    setUserRole(role);
    setCurrentUsername(localStorage.getItem('name') || localStorage.getItem('username') || 'Administrator');
  }, []);

  // Fetch all initial data from existing APIs
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [examsRes, studentsRes, subjectsRes, gradesRes, resultsRes, overallRes, timetablesRes] = await Promise.all([
        fetch('/api/academics/exams'),
        fetch('/api/students?limit=10000'),
        fetch('/api/academics/subjects'),
        fetch('/api/academics/grades-sections'),
        fetch('/api/academics/results'),
        fetch('/api/academics/results/overall'),
        fetch('/api/academics/exam-timetables')
      ]);

      if (examsRes.ok) setExams(await examsRes.json());
      if (studentsRes.ok) {
        const studentData = await studentsRes.json();
        setStudents(studentData.students || []);
      }
      if (subjectsRes.ok) setSubjects(await subjectsRes.json());
      if (gradesRes.ok) {
        const gsData = await gradesRes.json();
        setGradesSections(gsData);
        if (gsData.sections && gsData.sections.length > 0) {
          setSelectedSection(gsData.sections[0]);
        }
      }
      if (resultsRes.ok) setResults(await resultsRes.json());
      if (overallRes.ok) setOverallResults(await overallRes.json());
      if (timetablesRes.ok) setExamTimetables(await timetablesRes.json());

      // Fetch School Profile and Staff list
      try {
        const schoolRes = await fetch('/api/school');
        if (schoolRes.ok) setSchoolInfo(await schoolRes.json());
      } catch (e) {
        console.error('Failed to load school details:', e);
      }
      try {
        const staffRes = await fetch('/api/staff');
        if (staffRes.ok) setStaffList(await staffRes.json());
      } catch (e) {
        console.error('Failed to load staff list:', e);
      }
    } catch (err) {
      console.error('Error fetching academic results records:', err);
      showToast('Network error loading result data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter students based on selection (for Marks Entry and Generation)
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(
      s => s.studentClass === targetClass && (!selectedSection || s.section === selectedSection)
    );
  }, [students, selectedClass, targetClass, selectedSection]);

  const searchedStudents = useMemo(() => {
    const query = rosterSearch.trim().toLowerCase();
    if (!query) return filteredStudents;
    return filteredStudents.filter(s => s.name.toLowerCase().includes(query));
  }, [filteredStudents, rosterSearch]);

  // Load existing marks into draft form if already saved
  useEffect(() => {
    if (selectedExam && selectedClass && selectedSubject) {
      const newMarks = {};
      const newRemarks = {};
      results.forEach(r => {
        if (
          r.examId === selectedExam &&
          r.studentClass === targetClass &&
          r.subject.toLowerCase() === selectedSubject.toLowerCase()
        ) {
          newMarks[r.studentId] = r.obtainedMarks;
          newRemarks[r.studentId] = r.remarks || '';
        }
      });
      setMarksDraft(newMarks);
      setRemarksDraft(newRemarks);
    } else {
      setMarksDraft({});
      setRemarksDraft({});
    }
  }, [selectedExam, selectedClass, targetClass, selectedSubject, results]);

  // Helper to retrieve all subjects linked to an exam for a class (timetables, saved results, and subjectIncluded fallback)
  const getExamSubjectsForClass = (examObj, cls, studentId) => {
    if (!examObj) return [];
    const uniqueSubjectsMap = {};

    // 1. Timetables
    const allScheduled = examTimetables.filter(et => 
      et.examId === examObj.id && 
      (et.grade === cls || et.cohort === cls || (et.cohort && et.cohort.startsWith(`${cls}-`)))
    );
    allScheduled.forEach(s => {
      uniqueSubjectsMap[s.subject.toLowerCase()] = { subject: s.subject, examId: examObj.id };
    });

    // 2. Existing results
    if (studentId) {
      const existing = results.filter(r => 
        r.studentId === studentId && 
        r.examId === examObj.id
      );
      existing.forEach(r => {
        if (!uniqueSubjectsMap[r.subject.toLowerCase()]) {
          uniqueSubjectsMap[r.subject.toLowerCase()] = { id: r.id, subject: r.subject, examId: r.examId };
        }
      });
    }

    // 3. subjectIncluded
    if (examObj.subjectIncluded) {
      Object.keys(examObj.subjectIncluded).forEach(key => {
        if (examObj.subjectIncluded[key] !== false) {
          const prefix = `${cls}-`;
          if (key.toLowerCase().startsWith(prefix.toLowerCase())) {
            const subName = key.substring(prefix.length);
            if (!uniqueSubjectsMap[subName.toLowerCase()]) {
              uniqueSubjectsMap[subName.toLowerCase()] = { subject: subName, examId: examObj.id };
            }
          }
        }
      });
    }

    // 4. Fallback 4: subjectMarks
    if (examObj.subjectMarks) {
      Object.keys(examObj.subjectMarks).forEach(key => {
        const prefix = `${cls}-`;
        if (key.toLowerCase().startsWith(prefix.toLowerCase())) {
          const subName = key.substring(prefix.length);
          if (!uniqueSubjectsMap[subName.toLowerCase()]) {
            uniqueSubjectsMap[subName.toLowerCase()] = { subject: subName, examId: examObj.id };
          }
        }
      });
    }

    return Object.values(uniqueSubjectsMap);
  };

  // Load existing marks into the modal form when a student and exam are selected for modal results entry
  useEffect(() => {
    if (activeStudentForModal && activeExamForModal) {
      const cls = activeStudentForModal.studentClass || targetClass;
      const sec = activeStudentForModal.section || selectedSection;
      if (cls) {
        const scheduledSubjects = getExamSubjectsForClass(activeExamForModal, cls, activeStudentForModal.id);
        const newFormMarks = {};
        const newFormRemarks = {};
        
        scheduledSubjects.forEach(s => {
          const record = results.find(r => 
            r.studentId === activeStudentForModal.id && 
            r.examId === activeExamForModal.id && 
            r.subject.toLowerCase() === s.subject.toLowerCase()
          );
          if (record) {
            newFormMarks[s.subject] = record.obtainedMarks;
            newFormRemarks[s.subject] = record.remarks || '';
          } else {
            newFormMarks[s.subject] = '';
            newFormRemarks[s.subject] = '';
          }
        });
        setFormMarks(newFormMarks);
        setFormRemarks(newFormRemarks);
      }
    }
  }, [activeStudentForModal, activeExamForModal, selectedClass, selectedSection, examTimetables, results]);

  // Save results for a single student across all their subjects
  const handleSaveStudentBulk = async (statusVal = 'Draft') => {
    if (!activeStudentForModal || !activeExamForModal) return;

    const cls = activeStudentForModal.studentClass || selectedClass;
    const scheduledSubjects = getExamSubjectsForClass(activeExamForModal, cls, activeStudentForModal.id);

    // Validate that no obtained marks exceed the max marks
    let validationError = null;
    const resultsList = modalAttendance === 'Absent'
      ? scheduledSubjects.map(s => {
          const subKey = `${cls}-${s.subject}`;
          const maxMarks = (activeExamForModal.subjectMarks && activeExamForModal.subjectMarks[subKey] !== undefined)
            ? activeExamForModal.subjectMarks[subKey]
            : (activeExamForModal.totalMarks || 100);
          return {
            subject: s.subject,
            obtainedMarks: 0,
            totalMarks: maxMarks,
            remarks: 'Absent'
          };
        })
      : scheduledSubjects.map(s => {
          const subKey = `${cls}-${s.subject}`;
          const maxMarks = (activeExamForModal.subjectMarks && activeExamForModal.subjectMarks[subKey] !== undefined)
            ? activeExamForModal.subjectMarks[subKey]
            : (activeExamForModal.totalMarks || 100);

          const obtVal = formMarks[s.subject];
          if (obtVal === undefined || obtVal === '') {
            return {
              subject: s.subject,
              obtainedMarks: 0,
              totalMarks: maxMarks,
              remarks: formRemarks[s.subject] || ''
            };
          }

          const obt = parseFloat(obtVal);
          if (isNaN(obt) || obt < 0 || obt > maxMarks) {
            validationError = `Obtained marks for ${s.subject} must be between 0 and ${maxMarks}.`;
          }

          return {
            subject: s.subject,
            obtainedMarks: obt,
            totalMarks: maxMarks,
            remarks: formRemarks[s.subject] || ''
          };
        });

    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/academics/results/student-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: activeStudentForModal.id,
          examId: activeExamForModal.id,
          resultsList,
          status: statusVal,
          session: selectedSession
        })
      });

      if (res.ok) {
        showToast(statusVal === 'Draft' ? 'Draft results saved successfully!' : 'Results submitted successfully!', 'success');
        // Sync back to roster exam attendance
        setExamAttendance(prev => ({
          ...prev,
          [`${activeExamForModal.id}_${activeStudentForModal.id}`]: modalAttendance
        }));
        setActiveStudentForModal(null);
        setActiveExamForModal(null);
        fetchAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save student results.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error saving results.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudentResult = async (studentId, examId) => {
    if (!window.confirm('Are you sure you want to delete all results for this student? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/academics/results/student/${studentId}/exam/${examId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Student results deleted successfully.', 'success');
        await fetchAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete student results.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while deleting results.', 'error');
    } finally {
      setLoading(false);
    }
  };



  // Handle saving marks (Draft or Final)
  const handleSaveMarks = async (status = 'Draft') => {
    if (!selectedExam || !selectedClass || !selectedSubject) {
      showToast('Please specify all selectors (Exam, Class, Subject) before saving.', 'error');
      return;
    }

    const targetExam = exams.find(e => e.id === selectedExam);
    const totalMarks = targetExam?.totalMarks || 100;

    // Build the bulk array payload
    const marksList = filteredStudents.map(student => {
      const obt = parseFloat(marksDraft[student.id]);
      return {
        studentId: student.id,
        obtainedMarks: isNaN(obt) ? 0 : obt,
        totalMarks: totalMarks,
        remarks: remarksDraft[student.id] || ''
      };
    });

    if (marksList.length === 0) {
      showToast('No students found in the selected cohort to save score records.', 'error');
      return;
    }

    // Validation: make sure no score is greater than maximum marks
    const invalidScore = marksList.find(m => m.obtainedMarks > totalMarks || m.obtainedMarks < 0);
    if (invalidScore) {
      showToast(`Invalid Score: Obtained marks cannot be less than 0 or greater than max marks (${totalMarks}).`, 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/academics/results/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam,
          subject: selectedSubject,
          marksList,
          status,
          session: selectedSession
        })
      });

      if (res.ok) {
        showToast(`Marks saved successfully as ${status}!`, 'success');
        await fetchAllData();
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to submit marks.', 'error');
      }
    } catch (e) {
      showToast('Network error while saving marks.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Bulk Import Parse (simulates Excel/CSV parsing)
  const handleBulkImport = () => {
    if (!bulkInputText.trim()) {
      showToast('Please paste valid CSV or text content.', 'error');
      return;
    }

    // Expecting structure: RollNumber,Marks,Remarks
    // e.g.
    // 1,85,Excellent
    // 2,92,Very Good
    const lines = bulkInputText.trim().split('\n');
    const newMarks = { ...marksDraft };
    const newRemarks = { ...remarksDraft };
    let importCount = 0;

    lines.forEach(line => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const roll = parts[0].trim();
        const score = parseFloat(parts[1].trim());
        const remark = parts[2] ? parts[2].trim() : '';

        // Match student in active cohort by roll number
        const matchingStudent = filteredStudents.find(
          s => (s.rollNumber || s.roll || '').toString() === roll
        );

        if (matchingStudent && !isNaN(score)) {
          newMarks[matchingStudent.id] = score;
          if (remark) newRemarks[matchingStudent.id] = remark;
          importCount++;
        }
      }
    });

    setMarksDraft(newMarks);
    setRemarksDraft(newRemarks);
    setShowBulkModal(false);
    setBulkInputText('');
    showToast(`Successfully parsed and loaded ${importCount} students' marks! Review scores below before saving.`, 'success');
  };

  // Publish all results for a student
  const handlePublish = (studentId, studentExams) => {
    if (!studentExams || studentExams.length === 0) return;
    setPublishedExams(prev => {
      const updated = { ...prev };
      if (!updated[studentId]) {
        updated[studentId] = {};
      }
      studentExams.forEach(exam => {
        updated[studentId][exam.examId] = true;
      });
      return updated;
    });
    showToast('Student results published successfully!', 'success');
  };

  // Unpublish all results for a student (Undo Publish)
  const handleUnpublish = (studentId, studentExams) => {
    if (!studentExams || studentExams.length === 0) return;
    setPublishedExams(prev => {
      const updated = { ...prev };
      if (updated[studentId]) {
        studentExams.forEach(exam => {
          updated[studentId][exam.examId] = false;
        });
      }
      return updated;
    });
    showToast('Student results unpublished successfully.', 'info');
  };


  // Print report card helper
  const handlePrint = (divId) => {
    const printContents = document.getElementById(divId).innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) {
      showToast('Popup blocked! Please allow popups to print.', 'error');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Academic Marksheet Report</title>
          <style>
            body { font-family: 'Outfit', 'Inter', sans-serif; color: #1e293b; padding: 20px; background: #fff; display: flex; justify-content: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #f8fafc; font-weight: bold; }
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; padding: 0; display: block; }
            }
          </style>
        </head>
        <body>
          ${printContents}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Computations for Analytics Dashboard (SaaS Cumulative Grouping)
  const analyticsFilteredStudents = useMemo(() => {
    return students.filter(s => {
      if (analyticsTargetClass) {
        if (s.studentClass !== analyticsTargetClass) return false;
      }
      if (analyticsSection !== 'All' && s.section !== analyticsSection) {
        return false;
      }
      return true;
    });
  }, [students, analyticsTargetClass, analyticsSection]);

  const cumulativeStudentResults = useMemo(() => {
    return analyticsFilteredStudents.map(student => {
      // Find overall results for this student
      const studentOverallRes = overallResults.filter(o => {
        if (o.studentId !== student.id) return false;
        
        if (analyticsExam === 'All') {
          const exam = exams.find(e => e.id === o.examId);
          if (!exam || exam.academicSession !== analyticsSession) return false;
          return true;
        } else {
          return o.examId === analyticsExam;
        }
      });

      if (studentOverallRes.length === 0) return null;

      const totalObtained = studentOverallRes.reduce((sum, o) => sum + (o.totalObtained || 0), 0);
      const totalMax = studentOverallRes.reduce((sum, o) => sum + (o.totalMax || 100), 0);
      const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
      
      const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 40 ? 'D' : 'F';
      const passStatus = percentage >= 40 ? 'Pass' : 'Fail';

      return {
        studentId: student.id,
        studentName: student.name,
        roll: student.rollNumber || student.roll || 'N/A',
        cohort: student.studentClass + (student.section ? `-${student.section}` : ''),
        totalObtained,
        totalMax,
        percentage,
        grade,
        passStatus
      };
    }).filter(Boolean);
  }, [analyticsFilteredStudents, overallResults, exams, analyticsSession, analyticsExam]);

  const analyticsData = useMemo(() => {
    const totalStudentsCount = analyticsFilteredStudents.length;
    const evaluatedCount = cumulativeStudentResults.length;
    
    if (evaluatedCount === 0) {
      return {
        totalStudentsCount,
        passCount: 0,
        failCount: 0,
        passRate: 0,
        failRate: 0,
        gradeDistribution: {}
      };
    }

    const passCount = cumulativeStudentResults.filter(r => r.passStatus === 'Pass').length;
    const failCount = cumulativeStudentResults.filter(r => r.passStatus === 'Fail').length;
    
    const passRate = Math.round((passCount / evaluatedCount) * 100);
    const failRate = Math.round((failCount / evaluatedCount) * 100);

    // Grade Distribution counts based on student final cumulative results
    const grades = {};
    cumulativeStudentResults.forEach(r => {
      grades[r.grade] = (grades[r.grade] || 0) + 1;
    });

    return {
      totalStudentsCount,
      passCount,
      failCount,
      passRate,
      failRate,
      gradeDistribution: grades
    };
  }, [analyticsFilteredStudents, cumulativeStudentResults]);

  const topPerformers = useMemo(() => {
    return [...cumulativeStudentResults]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  }, [cumulativeStudentResults]);

  const subjectBreakdown = useMemo(() => {
    const subjectStats = {};
    const studentIds = new Set(cumulativeStudentResults.map(r => r.studentId));
    
    results.forEach(r => {
      if (studentIds.has(r.studentId)) {
        let matchesExam = false;
        if (analyticsExam === 'All') {
          const exam = exams.find(e => e.id === r.examId);
          matchesExam = exam && exam.academicSession === analyticsSession;
        } else {
          matchesExam = r.examId === analyticsExam;
        }

        if (matchesExam) {
          const key = r.subject;
          if (!subjectStats[key]) {
            subjectStats[key] = { name: r.subject, totalObtained: 0, totalMax: 0, count: 0, passes: 0 };
          }
          subjectStats[key].totalObtained += (r.obtainedMarks || 0);
          subjectStats[key].totalMax += (r.totalMarks || 100);
          subjectStats[key].count += 1;
          
          const pct = r.totalMarks > 0 ? (r.obtainedMarks / r.totalMarks) * 100 : 0;
          if (pct >= 40 || r.remarks !== 'Fail') {
            subjectStats[key].passes += 1;
          }
        }
      }
    });
    
    return Object.values(subjectStats).map(stat => {
      const avgPct = stat.totalMax > 0 ? Math.round((stat.totalObtained / stat.totalMax) * 100) : 0;
      const passRate = stat.count > 0 ? Math.round((stat.passes / stat.count) * 100) : 0;
      return {
        subject: stat.name,
        averagePct: avgPct,
        passRate: passRate,
        totalStudents: stat.count
      };
    }).sort((a, b) => b.averagePct - a.averagePct);
  }, [cumulativeStudentResults, results, exams, analyticsSession, analyticsExam]);



  // Reusable helper to get report card data for any student
  const getStudentReportCardData = (studentId) => {
    if (!studentId) return null;
    
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    // Gather all exams for this student in this academic session
    const studentOverallResults = overallResults.filter(o => {
      if (o.studentId !== studentId) return false;
      const exam = exams.find(e => e.id === o.examId);
      if (!exam || exam.academicSession !== reportSession) return false;
      if (reportExamId !== 'All' && o.examId !== reportExamId) return false;
      return true;
    });

    if (studentOverallResults.length === 0) return null;

    const examSections = studentOverallResults.map(overall => {
      const exam = exams.find(e => e.id === overall.examId);
      if (!exam) return null;

      const subjectMarks = results.filter(r => r.studentId === studentId && r.examId === overall.examId);
      return { exam, overall, subjectMarks };
    }).filter(Boolean);

    if (examSections.length === 0) return null;

    // Calculate grand totals across selected/filtered exams
    const grandTotalObtained = examSections.reduce((sum, sec) => sum + (sec.overall?.totalObtained || 0), 0);
    const grandTotalMax = examSections.reduce((sum, sec) => sum + (sec.overall?.totalMax || 0), 0);
    const grandPercentage = grandTotalMax > 0 ? Math.round((grandTotalObtained / grandTotalMax) * 100) : 0;

    return { student, examSections, grandTotalObtained, grandTotalMax, grandPercentage };
  };

  // Load report card details for active report view student — filters by selected session and exam
  const activeReportCardData = useMemo(() => {
    return getStudentReportCardData(reportStudentId);
  }, [reportStudentId, reportSession, reportExamId, students, exams, overallResults, results]);

  const activeTemplateHtml = useMemo(() => {
    const template = DEFAULT_TEMPLATES.find(t => t.id === reportTemplateId);
    return template ? template.html : DEFAULT_TEMPLATES[0].html;
  }, [reportTemplateId]);

  // Get class teacher name helper
  const getTeacherNameForStudent = (student) => {
    if (!targetReportClass || !student) return 'N/A';
    const studentSection = student.section || 'A';
    
    const staffArr = Array.isArray(staffList) ? staffList : [];
    if (staffArr.length === 0) return 'N/A';
    
    // Find teacher assigned to this grade and section who isClassTeacher === true
    const teacher = staffArr.find(s => 
      s.assignedGradeId === targetReportClass && 
      s.assignedSectionId === studentSection &&
      (s.isClassTeacher === true || s.isClassTeacher === 'true' || s.isClassTeacher === 1 || s.isClassTeacher === 'Yes')
    );
    if (teacher) return teacher.name;
    
    // Fallback: find any teacher assigned to this grade and section
    const fallbackTeacher = staffArr.find(s => 
      s.assignedGradeId === targetReportClass && 
      s.assignedSectionId === studentSection
    );
    if (fallbackTeacher) return fallbackTeacher.name;

    // Second fallback: find any class teacher for this grade
    const secondFallback = staffArr.find(s => 
      s.assignedGradeId === targetReportClass && 
      (s.isClassTeacher === true || s.isClassTeacher === 'true' || s.isClassTeacher === 1 || s.isClassTeacher === 'Yes')
    );
    return secondFallback ? secondFallback.name : 'N/A';
  };

  // Reusable helper to generate subject marks HTML table
  const getSubjectMarksTableHtml = (reportCardData) => {
    if (!reportCardData) return '';
    const { examSections } = reportCardData;
    
    if (examSections.length === 0) return '<p style="text-align: center; color: #64748b;">No subject marks available.</p>';

    // Extract unique subjects
    const subjects = [...new Set(examSections.flatMap(sec => sec.subjectMarks.map(m => m.subject)))].sort();
    // Extract exams list
    const examsInSession = examSections.map(sec => sec.exam);

    let html = `<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.82rem;">
      <thead>
        <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
          <th rowspan="2" style="border: 1px solid #cbd5e1; padding: 10px 8px; text-align: left; font-weight: 700; vertical-align: middle;">Subject</th>`;

    // Exam headers
    examsInSession.forEach(ex => {
      html += `<th colspan="2" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: 700;">${ex.examName}</th>`;
    });

    html += `
          <th colspan="2" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: 700;">Grand Total</th>
          <th rowspan="2" style="border: 1px solid #cbd5e1; padding: 10px 8px; text-align: center; font-weight: 700; vertical-align: middle;">Aggregate %</th>
          <th rowspan="2" style="border: 1px solid #cbd5e1; padding: 10px 8px; text-align: center; font-weight: 700; vertical-align: middle;">Grade</th>
        </tr>
        <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">`;

    // Sub-headers (Obt / Max)
    examsInSession.forEach(() => {
      html += `
        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-size: 0.75rem; font-weight: 600; width: 60px;">Obt</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-size: 0.75rem; font-weight: 600; width: 60px;">Max</th>`;
    });

    // Grand Total sub-headers
    html += `
        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-size: 0.75rem; font-weight: 600; width: 60px;">Obt</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-size: 0.75rem; font-weight: 600; width: 60px;">Max</th>
      </tr>
    </thead>
    <tbody>`;

    subjects.forEach(subject => {
      let subObtainedTotal = 0;
      let subMaxTotal = 0;

      html += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: 600; text-align: left;">${subject}</td>`;

      examsInSession.forEach(ex => {
        const sec = examSections.find(s => s.exam.id === ex.id);
        const match = sec ? sec.subjectMarks.find(sm => sm.subject === subject) : null;
        if (match) {
          html += `
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${match.obtainedMarks}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${match.totalMarks}</td>`;
          subObtainedTotal += match.obtainedMarks || 0;
          subMaxTotal += match.totalMarks || 0;
        } else {
          html += `
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #cbd5e1;">-</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #cbd5e1;">-</td>`;
        }
      });

      const pct = subMaxTotal > 0 ? Math.round((subObtainedTotal / subMaxTotal) * 100) : 0;
      const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F';
      const color = grade === 'F' ? '#ef4444' : '#10b981';

      html += `
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: 700;">${subObtainedTotal}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${subMaxTotal}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${pct}%</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: 700; color: ${color};">${grade}</td>
        </tr>`;
    });

    // Overall summary footer row
    const grandTotalObtained = examSections.reduce((sum, sec) => sum + (sec.overall?.totalObtained || 0), 0);
    const grandTotalMax = examSections.reduce((sum, sec) => sum + (sec.overall?.totalMax || 0), 0);
    const grandPercentage = grandTotalMax > 0 ? Math.round((grandTotalObtained / grandTotalMax) * 100) : 0;
    const grandGrade = grandPercentage >= 90 ? 'A+' : grandPercentage >= 80 ? 'A' : grandPercentage >= 70 ? 'B+' : grandPercentage >= 60 ? 'B' : grandPercentage >= 50 ? 'C' : grandPercentage >= 40 ? 'D' : 'F';

    html += `
      <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Total / Overall</td>`;

    // Exam-wise totals
    examsInSession.forEach(ex => {
      const sec = examSections.find(s => s.exam.id === ex.id);
      if (sec && sec.overall) {
        html += `
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: 700;">${sec.overall.totalObtained}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${sec.overall.totalMax}</td>`;
      } else {
        html += `
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #cbd5e1;">-</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #cbd5e1;">-</td>`;
      }
    });

    html += `
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: 800;">${grandTotalObtained}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: 700;">${grandTotalMax}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #1e3a8a;">${grandPercentage}%</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #1e3a8a; font-weight: 800;">${grandGrade}</td>
      </tr>
    </tbody></table>`;

    return html;
  };

  // Reusable helper to compile full report card HTML for a student
  const compileReportCardHtmlForStudent = (studentReportData) => {
    if (!studentReportData) return '';
    const { student, examSections, grandTotalObtained, grandTotalMax, grandPercentage } = studentReportData;
    
    // Determine exam name display
    let examNameDisplay = 'Consolidated Evaluation';
    if (reportExamId !== 'All') {
      const exam = exams.find(e => e.id === reportExamId);
      if (exam) examNameDisplay = exam.examName;
    }

    const { grade: gradeBase } = parseStudentClass(student.studentClass);

    // Calculate final grade
    const finalGrade = grandPercentage >= 90 ? 'A+' : grandPercentage >= 80 ? 'A' : grandPercentage >= 70 ? 'B+' : grandPercentage >= 60 ? 'B' : grandPercentage >= 50 ? 'C' : grandPercentage >= 40 ? 'D' : 'F';
    const finalResult = grandPercentage >= 40 ? 'Pass' : 'Fail';

    // Gather remarks
    let finalRemarks = 'Keep up the good work!';
    if (reportExamId !== 'All') {
      const overall = overallResults.find(o => o.studentId === student.id && o.examId === reportExamId);
      if (overall && overall.remarks) {
        finalRemarks = overall.remarks;
      } else {
        const studentExamResults = results.filter(sr => sr.studentId === student.id && sr.examId === reportExamId);
        const firstWithRemarks = studentExamResults.find(sr => sr.remarks);
        if (firstWithRemarks) finalRemarks = firstWithRemarks.remarks;
      }
    } else {
      const overallRemarksList = overallResults
        .filter(o => o.studentId === student.id)
        .map(o => o.remarks)
        .filter(Boolean);
      if (overallRemarksList.length > 0) {
        finalRemarks = overallRemarksList.join(' | ');
      }
    }

    const studentSubjectMarksTableHtml = getSubjectMarksTableHtml(studentReportData);
    const teacherName = getTeacherNameForStudent(student);

    const dataToCompile = {
      schoolName: schoolInfo.name || 'Green Valley Public School',
      schoolAddress: schoolInfo.address || 'Khimel Rani Station Road, Bali, Rajasthan',
      schoolContact: schoolInfo.phone || schoolInfo.email || 'contact@gmail.com',
      studentName: student.name,
      admissionNo: student.admissionNumber || '',
      rollNo: student.rollNumber || student.roll || '',
      class: gradeBase,
      section: student.section || 'A',
      fatherName: student.fatherName || 'N/A',
      motherName: student.motherName || 'N/A',
      mobile: student.mobile || student.phone || 'N/A',
      dob: student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A',
      gender: student.gender || 'N/A',
      examName: examNameDisplay,
      session: reportSession,
      totalMarks: grandTotalMax,
      obtainedMarks: grandTotalObtained,
      percentage: grandPercentage,
      grade: finalGrade,
      result: finalResult,
      remarks: finalRemarks,
      rank: 'N/A',
      attendance: 'Present',
      classTeacherName: teacherName,
      principalName: 'Alex Devlin',
      generatedDate: new Date().toLocaleDateString(),
      schoolLogoUrl: schoolInfo.logo,
      studentPhotoUrl: student.photo,
      subjectMarksTableHtml: studentSubjectMarksTableHtml
    };

    if (reportExamId !== 'All') {
      const overall = overallResults.find(o => o.studentId === student.id && o.examId === reportExamId);
      if (overall) {
        if (overall.rank) dataToCompile.rank = overall.rank;
      }
    }

    // 1. Gather all subject marks
    const subjectMarksList = [];
    examSections.forEach(sec => {
      sec.subjectMarks.forEach(m => {
        subjectMarksList.push(m);
      });
    });

    // 2. Create marks mapping by lowercased subject name
    const marksMap = {};
    subjectMarksList.forEach(m => {
      marksMap[m.subject.toLowerCase()] = m;
    });
    const subjectsSorted = Object.keys(marksMap).sort();

    // 3. Inject dynamic subject key placeholders (e.g. {{english_obt}}, {{english_max}}, etc.)
    Object.entries(marksMap).forEach(([subName, subData]) => {
      const cleanSubName = subName.replace(/[^a-z0-9]/g, '');
      
      dataToCompile[`{{subject_${cleanSubName}_obt}}`] = subData.obtainedMarks;
      dataToCompile[`{{subject_${cleanSubName}_max}}`] = subData.totalMarks;
      dataToCompile[`{{subject_${cleanSubName}_grade}}`] = subData.grade || '';
      dataToCompile[`{{subject_${cleanSubName}_pct}}`] = (subData.percentage || '') + '%';

      // Shorthand versions
      dataToCompile[`{{${cleanSubName}_obt}}`] = subData.obtainedMarks;
      dataToCompile[`{{${cleanSubName}_max}}`] = subData.totalMarks;
      dataToCompile[`{{${cleanSubName}_grade}}`] = subData.grade || '';
      dataToCompile[`{{${cleanSubName}_pct}}`] = (subData.percentage || '') + '%';
    });

    // 4. Inject dynamic index-based placeholders (e.g. {{subject1_name}}, {{subject1_obt}})
    subjectsSorted.forEach((subName, i) => {
      const idx = i + 1;
      const subData = marksMap[subName];
      dataToCompile[`{{subject${idx}_name}}`] = subData.subject;
      dataToCompile[`{{subject${idx}_obt}}`] = subData.obtainedMarks;
      dataToCompile[`{{subject${idx}_max}}`] = subData.totalMarks;
      dataToCompile[`{{subject${idx}_grade}}`] = subData.grade || '';
      dataToCompile[`{{subject${idx}_pct}}`] = (subData.percentage || '') + '%';
    });

    return compileTemplate(activeTemplateHtml, dataToCompile);
  };

  const subjectMarksTableHtml = useMemo(() => {
    return getSubjectMarksTableHtml(activeReportCardData);
  }, [activeReportCardData]);

  const compiledReportCardHtml = useMemo(() => {
    return compileReportCardHtmlForStudent(activeReportCardData);
  }, [activeReportCardData, activeTemplateHtml, reportExamId, exams, reportSession, schoolInfo, overallResults, results, staffList, targetReportClass]);

  const handleExportCSV = () => {
    if (!activeReportCardData) return;
    const { student, examSections, grandPercentage } = activeReportCardData;
    
    // Construct CSV lines
    const csvRows = [];
    
    // Student Info
    csvRows.push(['Green Valley Public School']);
    csvRows.push(['Consolidated Academic Report Card']);
    csvRows.push([]);
    csvRows.push(['Student Information']);
    csvRows.push(['Name', student.name]);
    csvRows.push(['Admission No', student.admissionNumber || '']);
    csvRows.push(['Class', `Class ${student.studentClass}`]);
    csvRows.push(['Section', student.section || 'A']);
    csvRows.push(['Roll Number', student.rollNumber || student.roll || '']);
    csvRows.push(['Father Name', student.fatherName || '']);
    csvRows.push(['Overall Percentage', `${grandPercentage}%`]);
    csvRows.push([]);
    
    // Exam Data headers
    csvRows.push(['Exam Name', 'Subject', 'Max Marks', 'Obtained Marks', 'Grade', 'Remarks']);
    
    examSections.forEach(section => {
      section.subjectMarks.forEach(m => {
        csvRows.push([
          section.exam.examName,
          m.subject,
          m.totalMarks,
          m.obtainedMarks,
          m.grade,
          m.remarks || (m.percentage >= 40 ? 'Pass' : 'Fail')
        ]);
      });
      // Add exam overall row
      if (section.overall) {
        csvRows.push([
          `${section.exam.examName} Total`,
          'All Subjects',
          section.overall.totalMax,
          section.overall.totalObtained,
          section.overall.grade,
          `Rank: ${section.overall.rank || 'N/A'}`
        ]);
      }
      csvRows.push([]); // blank line between exams
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + csvRows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = `Report_Card_${student.name.replace(/\s+/g, '_')}_${student.rollNumber || student.roll || ''}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  // Bulk HTML print function
  const handleBulkPrintPDF = () => {
    if (reportFilteredStudents.length === 0) {
      showToast('No students to print report cards for.', 'warning');
      return;
    }

    let combinedHtml = '';
    reportFilteredStudents.forEach((student, index) => {
      const studentReportData = getStudentReportCardData(student.id);
      if (studentReportData) {
        const studentHtml = compileReportCardHtmlForStudent(studentReportData);
        combinedHtml += `
          <div class="report-card-page" style="${index > 0 ? 'page-break-before: always; break-before: page;' : ''}">
            ${studentHtml}
          </div>
        `;
      }
    });

    if (!combinedHtml) {
      showToast('Could not compile report cards for any student.', 'error');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) {
      showToast('Popup blocked! Please allow popups to print.', 'error');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Bulk Student Academic Marksheet Reports</title>
          <style>
            body { font-family: 'Outfit', 'Inter', sans-serif; color: #1e293b; padding: 20px; background: #fff; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #f8fafc; font-weight: bold; }
            .report-card-page {
              width: 100%;
              box-sizing: border-box;
            }
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; padding: 0; }
              .report-card-page {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${combinedHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Bulk CSV export function


  const filteredHistoryEntries = useMemo(() => {
    // Start with overallResults entries
    const entriesMap = {};
    
    overallResults.forEach(o => {
      const key = `${o.studentId}-${o.examId}`;
      const student = students.find(s => s.id === o.studentId);
      const exam = exams.find(e => e.id === o.examId);
      // Determine if student was absent for this exam set
      const studentExamResults = results.filter(sr => sr.studentId === o.studentId && sr.examId === o.examId);
      const isAbsent = studentExamResults.length > 0 && studentExamResults.every(sr => sr.remarks === 'Absent');

      entriesMap[key] = {
        ...o,
        isAbsent,
        roll: student?.rollNumber || student?.roll || o.studentRoll || 'N/A',
        studentName: student?.name || o.studentName || 'Unknown Student',
        studentClass: student?.studentClass || o.cohort || 'N/A',
        section: student?.section || 'A',
        examName: exam?.examName || o.examName || 'Unknown Exam',
        studentObj: student,
        examObj: exam
      };
    });

    // Also include entries from submitted results that don't have overallResults yet
    results.forEach(r => {
      if (r.status !== 'Submitted') return;
      const key = `${r.studentId}-${r.examId}`;
      if (entriesMap[key]) return;
      
      const student = students.find(s => s.id === r.studentId);
      const exam = exams.find(e => e.id === r.examId);
      
      // Calculate basic stats from all results for this student+exam
      const studentExamResults = results.filter(sr => sr.studentId === r.studentId && sr.examId === r.examId);
      const isAbsent = studentExamResults.length > 0 && studentExamResults.every(sr => sr.remarks === 'Absent');
      const totalObtained = studentExamResults.reduce((sum, sr) => sum + (sr.obtainedMarks || 0), 0);
      const totalMax = studentExamResults.reduce((sum, sr) => sum + (sr.totalMarks || 0), 0);
      const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

      const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 40 ? 'D' : 'F';
      const passStatus = percentage >= 40 ? 'Pass' : 'Fail';
      
      entriesMap[key] = {
        id: `SYN-${r.studentId}-${r.examId}`,
        examId: r.examId,
        studentId: r.studentId,
        cohort: student?.studentClass || 'N/A',
        totalObtained,
        totalMax,
        percentage,
        isAbsent,
        grade,
        passStatus,
        roll: student?.rollNumber || student?.roll || 'N/A',
        studentName: student?.name || 'Unknown Student',
        studentClass: student?.studentClass || 'N/A',
        section: student?.section || 'A',
        examName: exam?.examName || 'Unknown Exam',
        studentObj: student,
        examObj: exam
      };
    });
    
    const mapped = Object.values(entriesMap);

    return mapped.filter(entry => {
      const matchesClass = historyClassFilter ? entry.studentClass === targetHistoryClass : true;
      const matchesSection = historySectionFilter ? entry.section === historySectionFilter : true;
      
      const query = historySearch.trim().toLowerCase();
      if (!query) return matchesClass && matchesSection;

      const matchesSearch = 
        entry.studentName.toLowerCase().includes(query) ||
        entry.roll.toString().toLowerCase().includes(query) ||
        entry.examName.toLowerCase().includes(query);

      return matchesClass && matchesSection && matchesSearch;
    });
  }, [overallResults, results, students, exams, historySearch, historyClassFilter, targetHistoryClass, historySectionFilter]);

  const groupedStudentEntries = useMemo(() => {
    const studentMap = {};
    filteredHistoryEntries.forEach(entry => {
      const sid = entry.studentId;
      if (!studentMap[sid]) {
        studentMap[sid] = {
          studentId: sid,
          studentName: entry.studentName,
          studentClass: entry.studentClass,
          section: entry.section,
          roll: entry.roll,
          studentObj: entry.studentObj,
          exams: []
        };
      }
      studentMap[sid].exams.push({
        examId: entry.examId,
        examName: entry.examName,
        percentage: entry.percentage,
        grade: entry.grade,
        isAbsent: entry.isAbsent,
        passStatus: entry.passStatus,
        examObj: entry.examObj
      });
    });
    return Object.values(studentMap);
  }, [filteredHistoryEntries]);

  const modalClass = activeStudentForModal?.studentClass || selectedClass;
  const modalSection = activeStudentForModal?.section || selectedSection;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', borderRadius: '12px',
          background: notification.type === 'success' ? '#10b981' : '#ef4444', color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px',
          zIndex: 999999, fontWeight: 600, animation: 'slideInRight 0.3s ease forwards'
        }}>
          <AlertCircle size={20} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Sub-navigation Menu Header for Results Manager (Analytics, Report Cards) */}
      {['analytics', 'report-cards'].includes(activeTab) && (
        <div className="glass-panel" style={{ padding: '8px', display: 'flex', gap: '8px', overflowX: 'auto', borderRadius: '12px' }}>
          <button 
            onClick={() => {
              setActiveTab('analytics');
              setAdminView('results-analytics');
            }}
            className={`tab-btn-custom ${activeTab === 'analytics' ? 'active' : ''}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTab === 'analytics' ? 'rgba(255, 107, 0,0.1)' : 'transparent',
              color: activeTab === 'analytics' ? 'rgb(255, 107, 0)' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <BarChart3 size={16} /> Analytics Dashboard
          </button>
          <button 
            onClick={() => {
              setActiveTab('report-cards');
              setAdminView('results-report-cards');
            }}
            className={`tab-btn-custom ${activeTab === 'report-cards' ? 'active' : ''}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTab === 'report-cards' ? 'rgba(255, 107, 0,0.1)' : 'transparent',
              color: activeTab === 'report-cards' ? 'rgb(255, 107, 0)' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <Award size={16} /> Report Cards
          </button>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      {loading && results.length === 0 ? (
        <div className="glass-panel" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={40} className="animate-spin" style={{ margin: '0 auto 16px', display: 'block', color: 'hsl(var(--color-primary))' }} />
          Loading secure academic database...
        </div>
      ) : (
        <>
          {/* TAB 1: ANALYTICS DASHBOARD */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* SaaS Interactive Filters Bar */}
              <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SlidersHorizontal size={18} style={{ color: 'hsl(var(--color-primary))' }} />
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Dashboard Filters</strong>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end', maxWidth: '800px' }}>
                  
                  {/* Session Selection */}
                  <div style={{ minWidth: '150px', flex: 1 }}>
                    <select 
                      className="select-custom" 
                      style={{ width: '100%' }} 
                      value={analyticsSession} 
                      onChange={e => {
                        setAnalyticsSession(e.target.value);
                        setAnalyticsExam('All');
                      }}
                    >
                      {Array.from({ length: 2030 - 2026 + 1 }, (_, i) => {
                        const s = 2026 + i;
                        return `${s}-${s + 1}`;
                      }).map(sy => (
                        <option key={sy} value={sy}>{sy}</option>
                      ))}
                    </select>
                  </div>

                  {/* Class Selection */}
                  <div style={{ minWidth: '180px', flex: 1 }}>
                    <select 
                      className="select-custom" 
                      style={{ width: '100%' }} 
                      value={analyticsClass} 
                      onChange={e => {
                        setAnalyticsClass(e.target.value);
                        setAnalyticsExam('All');
                      }} 
                      disabled={userProfile?.role === 'Teacher'}
                    >
                      <option value="">All Grades</option>
                      {uniqueGradeNames.map(g => (
                        <option key={g} value={g}>{g.startsWith('LKG') || g.startsWith('UKG') || g.startsWith('NURSERY') ? g : `Grade ${g}`}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department Selection (Only if class has departments) */}
                  {analyticsHasDepartments && (
                    <div style={{ minWidth: '180px', flex: 1 }} className="animate-scale-up">
                      <select 
                        className="select-custom" 
                        style={{ width: '100%' }} 
                        value={analyticsDepartment} 
                        onChange={e => {
                          setAnalyticsDepartment(e.target.value);
                          setAnalyticsExam('All');
                        }}
                        disabled={userProfile?.role === 'Teacher'}
                      >
                        {analyticsAvailableDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Section Selection */}
                  <div style={{ minWidth: '180px', flex: 1 }}>
                    <select 
                      className="select-custom" 
                      style={{ width: '100%' }} 
                      value={analyticsSection} 
                      onChange={e => {
                        setAnalyticsSection(e.target.value);
                        setAnalyticsExam('All');
                      }} 
                      disabled={!analyticsTargetClass || userProfile?.role === 'Teacher'}
                    >
                      {userProfile?.role !== 'Teacher' && <option value="All">All Sections</option>}
                      {analyticsAllowedSections.map(sec => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                  </div>

                  {/* Exam Selection */}
                  <div style={{ minWidth: '180px', flex: 1 }}>
                    <select 
                      className="select-custom" 
                      style={{ width: '100%' }} 
                      value={analyticsExam} 
                      onChange={e => setAnalyticsExam(e.target.value)}
                    >
                      <option value="All">All Exams (Cumulative)</option>
                      {exams.filter(ex => {
                        if (ex.academicSession !== analyticsSession) return false;
                        if (analyticsTargetClass) {
                          const matches = (ex.gradeSections || []).some(gs => gs.grade === analyticsTargetClass && (analyticsSection === 'All' || gs.section === analyticsSection || !gs.section));
                          if (!matches) return false;
                        }
                        return true;
                      }).map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.examName}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* Statistics KPI Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                
                {/* KPI 1: Total Students */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', borderLeft: '4px solid hsl(var(--color-primary))' }}>
                  <div style={{ padding: '12px', background: 'rgba(255, 107, 0, 0.1)', color: 'hsl(var(--color-primary))', borderRadius: '12px' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Students</span>
                    <strong style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{analyticsData.totalStudentsCount}</strong>
                  </div>
                </div>

                {/* KPI 2: Passed Students */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', borderLeft: '4px solid #10b981' }}>
                  <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px' }}>
                    <Check size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passed Students</span>
                    <strong style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{analyticsData.passCount}</strong>
                  </div>
                </div>

                {/* KPI 3: Failed Students */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px' }}>
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Failed Students</span>
                    <strong style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{analyticsData.failCount}</strong>
                  </div>
                </div>

                {/* KPI 4: Pass Rate */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', borderLeft: '4px solid #3b82f6' }}>
                  <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '12px' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pass Rate</span>
                    <strong style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{analyticsData.passRate}%</strong>
                  </div>
                </div>

                {/* KPI 5: Fail Rate */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', borderLeft: '4px solid #f43f5e' }}>
                  <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#f43f5e', borderRadius: '12px' }}>
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fail Rate</span>
                    <strong style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{analyticsData.failRate}%</strong>
                  </div>
                </div>

              </div>

              {/* Graphical Charts and Top Performers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                
                {/* Grade Distribution List */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Overall Grade Distribution</h4>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Student score spreads grouped by letter grade marks</span>
                  </div>
                  {Object.keys(analyticsData.gradeDistribution).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {Object.entries(analyticsData.gradeDistribution).map(([grade, count]) => {
                        const percent = Math.round((count / cumulativeStudentResults.length) * 100);
                        return (
                          <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ width: '40px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{grade}</span>
                            <div style={{ flex: 1, height: '10px', background: 'var(--bg-glass-active, #f1f5f9)', borderRadius: '5px', overflow: 'hidden' }}>
                              <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--color-primary)) 0%, #818cf8 100%)', borderRadius: '5px' }} />
                            </div>
                            <span style={{ width: '80px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right', fontWeight: 600 }}>
                              {count} student{count > 1 ? 's' : ''} ({percent}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No locked results to render grade distributions.
                    </div>
                  )}
                </div>

                {/* Top Performers Leaderboard */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Top Performers Leaderboard</h4>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Highest ranking student percentage averages</span>
                  </div>
                  {topPerformers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {topPerformers.map((p, idx) => {
                        const initials = p.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                        const rankColor = idx === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : idx === 1 ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)' : idx === 2 ? 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)' : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-glass-active, rgba(255,255,255,0.4))', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: rankColor, color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                {idx + 1}
                              </span>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#e07830', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                                {initials}
                              </div>
                              <div>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block', color: 'var(--text-main)' }}>{p.studentName}</span>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Roll: {p.roll} Â· Class: {p.cohort}</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ color: 'hsl(var(--color-primary))', fontSize: '0.95rem', display: 'block', fontWeight: 800 }}>{p.percentage}%</strong>
                              <span style={{ fontSize: '0.74rem', background: 'rgba(255, 107, 0,0.08)', color: '#e07830', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Grade {p.grade}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No calculated rankings available. Go to Result Generation to process data.
                    </div>
                  )}
                </div>

              </div>

              {/* SaaS Subject-wise Performance Breakdown Card */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Subject-wise Performance Insights</h4>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Granular breakdown of subject average scores and success pass percentages</span>
                </div>
                {subjectBreakdown.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid var(--border-glass)', textAlign: 'left' }}>
                          <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>Subject Name</th>
                          <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>Average Percentage Score</th>
                          <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>Subject Pass Rate</th>
                          <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>Evaluated Submissions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectBreakdown.map((s, idx) => {
                          const avgColor = s.averagePct >= 80 ? '#10b981' : s.averagePct >= 60 ? 'hsl(var(--color-primary))' : '#f59e0b';
                          const passColor = s.passRate >= 90 ? '#10b981' : s.passRate >= 75 ? '#3b82f6' : '#ef4444';
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass, rgba(0,0,0,0.03))' }}>
                              <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--text-main)' }}>{s.subject}</td>
                              <td style={{ padding: '12px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <strong style={{ color: avgColor, minWidth: '35px' }}>{s.averagePct}%</strong>
                                  <div style={{ width: '100px', height: '6px', background: 'var(--bg-glass-active, #f1f5f9)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${s.averagePct}%`, height: '100%', background: avgColor, borderRadius: '3px' }} />
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                <span style={{ 
                                  background: s.passRate >= 90 ? 'rgba(16,185,129,0.08)' : s.passRate >= 75 ? 'rgba(59,130,246,0.08)' : 'rgba(239,68,68,0.08)',
                                  color: passColor,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.76rem'
                                }}>
                                  {s.passRate}% Pass
                                </span>
                              </td>
                              <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                                {s.totalStudents} papers
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No subject scores calculated. Run evaluations to populate subject insights.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MARKS ENTRY */}
          {activeTab === 'marks-entry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Selectors Bar */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flex: 1, gap: '12px', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Session</label>
                    <select className="select-custom" style={{ width: '100%' }} value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                      {Array.from({ length: 2030 - 2026 + 1 }, (_, i) => {
                        const s = 2026 + i;
                        return `${s}-${s + 1}`;
                      }).map(sy => (
                        <option key={sy} value={sy}>{sy}</option>
                      ))}
                    </select>
                  </div>
 
                  <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Class</label>
                    <select className="select-custom" style={{ width: '100%' }} value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setStudentExamSelections({}); setStudentExamCategories({}); setRosterSearch(''); }} disabled={userProfile?.role === 'Teacher'}>
                      <option value="">Select Grade</option>
                      {uniqueGradeNames.map(g => (
                        <option key={g} value={g}>{g.startsWith('LKG') || g.startsWith('UKG') || g.startsWith('NURSERY') ? g : `Grade ${g}`}</option>
                      ))}
                    </select>
                  </div>

                  {hasDepartments && (
                    <div className="form-group animate-scale-up" style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Department</label>
                      <select 
                        className="select-custom" 
                        style={{ width: '100%' }} 
                        value={selectedDepartment} 
                        onChange={e => { setSelectedDepartment(e.target.value); setStudentExamSelections({}); setStudentExamCategories({}); setRosterSearch(''); }}
                        disabled={userProfile?.role === 'Teacher'}
                      >
                        {availableDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Section</label>
                    <select className="select-custom" style={{ width: '100%' }} value={selectedSection} onChange={e => { setSelectedSection(e.target.value); setStudentExamSelections({}); setStudentExamCategories({}); setRosterSearch(''); }} disabled={userProfile?.role === 'Teacher'}>
                      <option value="">Select Section</option>
                      {allowedSections.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Exam Set</label>
                    <select 
                      className="select-custom" 
                      style={{ width: '100%' }} 
                      value={selectedExam} 
                      onChange={e => setSelectedExam(e.target.value)}
                    >
                      <option value="">Select Exam</option>
                      {exams.filter(ex => {
                        if (ex.academicSession !== selectedSession) return false;
                        const cohortMatches = (ex.gradeSections || []).some(gs => gs.grade === targetClass && (!selectedSection || gs.section === selectedSection || !gs.section));
                        return cohortMatches;
                      }).map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.examName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
 
              {/* Roster & Exam Setup list */}
              {selectedClass && selectedSection ? (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '250px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                        Student Roster: Grade {selectedClass} - Section {selectedSection}
                      </h3>
                      <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          className="form-control"
                          style={{ paddingLeft: '30px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.8rem', borderRadius: '8px', width: '100%' }}
                          value={rosterSearch}
                          onChange={e => setRosterSearch(e.target.value)}
                          placeholder="Search student by name..."
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Total Students: <strong>{searchedStudents.length}</strong> {rosterSearch && `(filtered from ${filteredStudents.length})`}
                      </span>
                    </div>
                  </div>

                  {filteredStudents.length > 0 ? (
                    <>
                      {searchedStudents.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="custom-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                            <thead>
                              <tr>
                                <th style={{ width: '15%', textAlign: 'left' }}>Roll Number</th>
                                <th style={{ width: hasDepartments ? '25%' : '30%', textAlign: 'left' }}>Student Name</th>
                                <th style={{ width: hasDepartments ? '15%' : '20%', textAlign: 'left' }}>Grade</th>
                                <th style={{ width: hasDepartments ? '15%' : '15%', textAlign: 'left' }}>Section</th>
                                {hasDepartments && <th style={{ width: '15%', textAlign: 'left' }}>Department</th>}
                                <th style={{ width: hasDepartments ? '15%' : '20%', textAlign: 'center' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {searchedStudents.map(student => {
                                const globalExamObj = exams.find(ex => ex.id === selectedExam);
                                const attendanceKey = `${selectedExam}_${student.id}`;
                                const studentResults = results.filter(r => r.studentId === student.id && r.examId === selectedExam);
                                const hasAbsentRecord = studentResults.length > 0 && studentResults.every(r => r.remarks === 'Absent');
                                const isPresent = !hasAbsentRecord && (examAttendance[attendanceKey] || 'Present') === 'Present';

                                return (
                                  <tr key={student.id} style={{ opacity: isPresent ? 1 : 0.75, transition: 'opacity 0.2s ease' }}>
                                    <td style={{ fontWeight: 700, textAlign: 'left' }}>{student.rollNumber || student.roll || '-'}</td>
                                    <td style={{ textAlign: 'left' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{student.name}</span>
                                        {!isPresent && (
                                          <span style={{
                                            padding: '2px 8px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            background: 'rgba(239, 68, 68, 0.08)',
                                            color: '#ef4444',
                                            borderRadius: '99px',
                                            textTransform: 'uppercase',
                                            border: '1px solid rgba(239, 68, 68, 0.15)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}>
                                            <AlertCircle size={10} /> Absent
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    {(() => {
                                      const { grade, department } = parseStudentClass(student.studentClass);
                                      const displayGrade = grade.startsWith('LKG') || grade.startsWith('UKG') || grade.startsWith('NURSERY') ? grade : `Grade ${grade}`;
                                      return (
                                        <>
                                          <td style={{ textAlign: 'left' }}>{displayGrade}</td>
                                          <td style={{ textAlign: 'left', fontWeight: 600 }}>{student.section || 'A'}</td>
                                          {hasDepartments && (
                                            <td style={{ textAlign: 'left', fontWeight: department !== '-' ? 700 : 400, color: department !== '-' ? 'hsl(var(--color-primary))' : 'var(--text-muted)' }}>{department}</td>
                                          )}
                                        </>
                                      );
                                    })()}
                                    <td style={{ textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                        {(() => {
                                          const hasResult = results.some(r => r.studentId === student.id && r.examId === selectedExam);
                                          const isActionDisabled = !globalExamObj;
                                          return (
                                            <>
                                              {hasResult ? (
                                                <button
                                                  className="btn-secondary"
                                                  style={{ 
                                                    padding: '8px', 
                                                    borderRadius: '8px', 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    background: 'rgba(255, 107, 0, 0.08)',
                                                    color: 'hsl(var(--color-primary))',
                                                    border: '1px solid rgba(255, 107, 0, 0.15)',
                                                    opacity: isActionDisabled ? 0.5 : 1,
                                                    cursor: isActionDisabled ? 'not-allowed' : 'pointer'
                                                  }}
                                                  disabled={isActionDisabled}
                                                  onClick={() => {
                                                    if (!globalExamObj) {
                                                      showToast('Please select an exam set first.', 'error');
                                                      return;
                                                    }
                                                    setModalViewOnly(false);
                                                    setActiveStudentForModal(student);
                                                    setActiveExamForModal(globalExamObj);
                                                  }}
                                                  title="Edit Result"
                                                >
                                                  <Edit size={16} />
                                                </button>
                                              ) : (
                                                <button
                                                  className="btn-primary"
                                                  style={{ 
                                                    padding: '6px 12px', 
                                                    fontSize: '0.78rem', 
                                                    borderRadius: '8px', 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px',
                                                    opacity: isActionDisabled ? 0.5 : 1,
                                                    cursor: isActionDisabled ? 'not-allowed' : 'pointer'
                                                  }}
                                                  disabled={isActionDisabled}
                                                  onClick={() => {
                                                    if (!globalExamObj) {
                                                      showToast('Please select an exam set first.', 'error');
                                                      return;
                                                    }
                                                    setModalViewOnly(false);
                                                    setActiveStudentForModal(student);
                                                    setActiveExamForModal(globalExamObj);
                                                  }}
                                                >
                                                  Add Result
                                                </button>
                                              )}
                                              {hasResult && (
                                                <button
                                                  className="btn-secondary"
                                                  style={{ 
                                                    padding: '8px', 
                                                    borderRadius: '8px', 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    background: 'rgba(239, 68, 68, 0.08)',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.15)'
                                                  }}
                                                  onClick={() => handleDeleteStudentResult(student.id, selectedExam)}
                                                  title="Delete Result"
                                                >
                                                  <Trash2 size={16} />
                                                </button>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No students found matching "{rosterSearch}" in Grade {selectedClass}-{selectedSection}.
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No active students found registered in Class {selectedClass}-{selectedSection}.
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Please select Session, Class, and Section to load the student list.
                </div>
              )}
            </div>
          )}


          {/* TAB 4: REPORT CARDS */}
          {activeTab === 'report-cards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Template Configuration */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Code size={16} /> Template Configuration
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div className="form-group" style={{ maxWidth: '400px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Select Template</label>
                    <select 
                      className="select-custom" 
                      style={{ width: '100%' }}
                      value={reportTemplateId}
                      onChange={e => {
                        const tid = e.target.value;
                        setReportTemplateId(tid);
                        localStorage.setItem(`report_card_template_id_${localStorage.getItem('tenant_subdomain') || 'default'}`, tid);
                      }}
                    >
                      {DEFAULT_TEMPLATES.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Selectors Bar */}
              <div className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                {/* 1. Academic Session */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Academic Session</label>
                  <select className="select-custom" style={{ width: '100%' }} value={reportSession} onChange={e => { setReportSession(e.target.value); setReportStudentId(''); setReportSearchQuery(''); }}>
                    {Array.from({ length: 2030 - 2026 + 1 }, (_, i) => {
                      const s = 2026 + i;
                      return `${s}-${s + 1}`;
                    }).map(sy => (
                      <option key={sy} value={sy}>{sy}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Class */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Class / Grade</label>
                  <select className="select-custom" style={{ width: '100%' }} value={reportClass} onChange={e => { setReportClass(e.target.value); setReportStudentId(''); setReportSearchQuery(''); }} disabled={userProfile?.role === 'Teacher'}>
                    <option value="">Select Grade</option>
                    {uniqueGradeNames.map(g => (
                      <option key={g} value={g}>{g.startsWith('LKG') || g.startsWith('UKG') || g.startsWith('NURSERY') ? g : `Grade ${g}`}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Department (Conditional) */}
                {reportHasDepartments && (
                  <div className="form-group animate-scale-up">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Department</label>
                    <select 
                      className="select-custom" 
                      style={{ width: '100%' }} 
                      value={reportDepartment} 
                      onChange={e => { setReportDepartment(e.target.value); setReportStudentId(''); setReportSearchQuery(''); }}
                      disabled={userProfile?.role === 'Teacher'}
                    >
                      {reportAvailableDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 5. Section */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Section</label>
                  <select 
                    className="select-custom" 
                    style={{ width: '100%' }} 
                    value={reportSection} 
                    onChange={e => { setReportSection(e.target.value); setReportStudentId(''); setReportSearchQuery(''); }}
                    disabled={!reportClass || userProfile?.role === 'Teacher'}
                  >
                    {userProfile?.role !== 'Teacher' && <option value="All">All Sections</option>}
                    {reportAllowedSections.map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>

                {/* 6. Quick Student Lookup */}
                <div className="form-group" style={{ position: 'relative' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Quick Search Student</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Search student..." 
                      value={reportSearchQuery}
                      onChange={e => {
                        setReportSearchQuery(e.target.value);
                        setShowReportSearchResults(true);
                      }}
                      onFocus={() => setShowReportSearchResults(true)}
                      onBlur={() => setTimeout(() => setShowReportSearchResults(false), 200)}
                      style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}
                    />
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  {showReportSearchResults && reportSearchQuery.trim() !== '' && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--bg-glass-active, #ffffff)',
                      border: '1px solid var(--border-glass, #cbd5e1)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}>
                      {reportSearchFilteredStudents.length > 0 ? (
                        reportSearchFilteredStudents.map(student => {
                          const { grade } = parseStudentClass(student.studentClass);
                          const displayGrade = grade.startsWith('LKG') || grade.startsWith('UKG') || grade.startsWith('NURSERY') ? grade : `Grade ${grade}`;
                          return (
                            <div 
                              key={student.id} 
                              onClick={() => {
                                const { grade, department } = parseStudentClass(student.studentClass);
                                setReportClass(grade);
                                if (department && department !== '-') {
                                  setReportDepartment(department);
                                } else {
                                  setReportDepartment('');
                                }
                                if (student.section) {
                                  setReportSection(student.section);
                                } else {
                                  setReportSection('All');
                                }
                                setReportStudentId(student.id);
                                setReportSearchQuery(student.name);
                                setShowReportSearchResults(false);
                              }}
                              style={{
                                padding: '10px 14px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border-glass, rgba(0,0,0,0.05))',
                                fontSize: '0.82rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                color: 'var(--text-main, #0f172a)'
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                              }}
                              className="search-item-hover"
                            >
                              <strong style={{ color: 'hsl(var(--color-primary))' }}>{student.name}</strong>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Roll {student.rollNumber || student.roll || '-'} Â· {displayGrade} ({student.section || 'A'})
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                          No students found with published exams
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 7. Student Selector */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Select Student</label>
                  <select className="select-custom" style={{ width: '100%' }} value={reportStudentId} onChange={e => {
                    const studentId = e.target.value;
                    setReportStudentId(studentId);
                    const selected = students.find(s => s.id === studentId);
                    if (selected) {
                      setReportSearchQuery(selected.name);
                    } else {
                      setReportSearchQuery('');
                    }
                  }} disabled={!reportClass}>
                    <option value="">Select Student</option>
                    {reportFilteredStudents.map(s => (
                      <option key={s.id} value={s.id}>Roll {s.rollNumber || s.roll} - {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Directory Roster Table & Bulk Actions */}
              {reportClass && (
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} /> Student Roster & Academic Status
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                        Showing {reportFilteredStudents.length} student entries with published marks in {reportClass} (Section: {reportSection})
                      </span>
                    </div>
                    
                    {/* Bulk Actions */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-primary"
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.78rem',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #e07830 100%)',
                          border: 'none',
                          color: '#ffffff',
                          cursor: isBulkExporting ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(255, 107, 0, 0.2)'
                        }}
                        onClick={handleBulkPrintPDF}
                        disabled={isBulkExporting}
                      >
                        {isBulkExporting ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" /> Filling PDFs ({bulkExportProgress}%)...
                          </>
                        ) : (
                          <>
                            <Printer size={13} /> Bulk Export PDF Report Cards
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Table Container */}
                  <div style={{ overflowX: 'auto' }}>
                    {reportFilteredStudents.length > 0 ? (
                      <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-glass, #cbd5e1)', textAlign: 'left', background: 'rgba(0,0,0,0.02)' }}>
                            <th style={{ padding: '10px 8px', fontWeight: 600 }}>Roll No</th>
                            <th style={{ padding: '10px 8px', fontWeight: 600 }}>Admission No</th>
                            <th style={{ padding: '10px 8px', fontWeight: 600 }}>Name</th>
                            <th style={{ padding: '10px 8px', fontWeight: 600 }}>Section</th>
                            <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Obtained / Max Marks</th>
                            <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Percentage</th>
                            <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Grade</th>
                            <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportFilteredStudents.map(student => {
                            const rData = getStudentReportCardData(student.id);
                            if (!rData) return null;
                            
                            const { grandTotalObtained, grandTotalMax, grandPercentage } = rData;
                            const overallGrade = grandPercentage >= 90 ? 'A+' : grandPercentage >= 80 ? 'A' : grandPercentage >= 70 ? 'B+' : grandPercentage >= 60 ? 'B' : grandPercentage >= 50 ? 'C' : grandPercentage >= 40 ? 'D' : 'F';
                            const isPass = grandPercentage >= 40;
                            const isSelected = reportStudentId === student.id;

                            return (
                              <tr 
                                key={student.id} 
                                style={{ 
                                  borderBottom: '1px solid var(--border-glass, rgba(0,0,0,0.05))',
                                  background: isSelected ? 'rgba(255, 107, 0, 0.08)' : 'transparent',
                                  transition: 'background 0.2s ease'
                                }}
                              >
                                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{student.rollNumber || student.roll || '-'}</td>
                                <td style={{ padding: '10px 8px' }}>{student.admissionNumber || '-'}</td>
                                <td style={{ padding: '10px 8px', fontWeight: 700, color: 'hsl(var(--color-primary))' }}>{student.name}</td>
                                <td style={{ padding: '10px 8px' }}>{student.section || 'A'}</td>
                                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>{grandTotalObtained} / {grandTotalMax}</td>
                                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700 }}>{grandPercentage}%</td>
                                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800 }}>{overallGrade}</td>
                                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '3px 6px',
                                    borderRadius: '12px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    background: isPass ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: isPass ? '#10b981' : '#ef4444',
                                    border: isPass ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)'
                                  }}>
                                    {isPass ? 'Pass' : 'Fail'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                                    <button
                                      title="Preview Report Card"
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '0.75rem',
                                        background: isSelected ? 'hsl(var(--color-primary))' : 'var(--bg-glass-active, #f1f5f9)',
                                        border: isSelected ? 'none' : '1px solid var(--border-glass)',
                                        color: isSelected ? '#ffffff' : 'var(--text-main)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                      onClick={() => {
                                        if (isSelected) {
                                          setReportStudentId('');
                                          setReportSearchQuery('');
                                        } else {
                                          setReportStudentId(student.id);
                                          setReportSearchQuery(student.name);
                                        }
                                      }}
                                    >
                                      <Eye size={12} /> {isSelected ? 'Previewing' : 'Preview'}
                                    </button>
                                    <button
                                      title="Export PDF / Download"
                                      style={{
                                        padding: '5px 8px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                        color: '#10b981',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.74rem',
                                        fontWeight: 600
                                      }}
                                      onClick={() => {
                                        setReportStudentId(student.id);
                                        setReportSearchQuery(student.name);
                                        setTimeout(() => {
                                          handlePrint('printable-dynamic-report');
                                        }, 200);
                                      }}
                                    >
                                      <Download size={11} /> PDF
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No student entries found for the selected Grade and Section. Ensure marks are entered and published.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Live Preview Container (Centered & Full-width) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeReportCardData ? (
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Action Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          Viewing template preview for <strong>{activeReportCardData.student.name}</strong>
                        </span>
                        <button
                          onClick={() => {
                            setReportStudentId('');
                            setReportSearchQuery('');
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          className="btn-danger-hover"
                          title="Close Live Preview"
                        >
                          Close Preview {"\u00d7"}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-primary"
                          style={{
                            padding: '8px 14px',
                            fontSize: '0.78rem',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #e07830 100%)',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(255, 107, 0, 0.2)'
                          }}
                          onClick={() => handlePrint('printable-dynamic-report')}
                        >
                          <Printer size={13} /> Print
                        </button>
                        <button 
                          className="btn-primary"
                          style={{
                            padding: '8px 14px',
                            fontSize: '0.78rem',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                          }}
                          onClick={() => {
                            handlePrint('printable-dynamic-report');
                          }}
                        >
                          <Download size={13} /> Export PDF
                        </button>
                        <button 
                          className="btn-primary"
                          style={{
                            padding: '8px 14px',
                            fontSize: '0.78rem',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)'
                          }}
                          onClick={handleExportCSV}
                        >
                          <Download size={13} /> Export CSV
                        </button>
                      </div>
                    </div>

                    {/* Real-time Compiled Frame */}
                    <div 
                      id="printable-dynamic-report"
                      className="compiled-report-html-frame"
                      style={{
                        background: '#ffffff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        overflow: 'auto',
                        padding: '24px',
                        border: '1px solid #cbd5e1',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      dangerouslySetInnerHTML={{ __html: compiledReportCardHtml }}
                    />
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Please select a Session, Grade, Section, and Student to preview and compile the Report Card.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ACADEMIC HISTORY / TRANSCRIPTS */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Filter Bar */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '36px' }}
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Search by student name, roll number, or exam name..."
                  />
                </div>
                <div style={{ minWidth: '180px' }}>
                  <select 
                    className="select-custom" 
                    style={{ width: '100%' }}
                    value={historyClassFilter} 
                    onChange={e => setHistoryClassFilter(e.target.value)}
                    disabled={userProfile?.role === 'Teacher'}
                  >
                    <option value="">All Grades</option>
                    {uniqueGradeNames.map(g => (
                      <option key={g} value={g}>{g.startsWith('LKG') || g.startsWith('UKG') || g.startsWith('NURSERY') ? g : `Grade ${g}`}</option>
                    ))}
                  </select>
                </div>
                {historyHasDepartments && (
                  <div style={{ minWidth: '180px' }} className="animate-scale-up">
                    <select 
                      className="select-custom" 
                      style={{ width: '100%' }}
                      value={historyDepartmentFilter} 
                      onChange={e => setHistoryDepartmentFilter(e.target.value)}
                      disabled={userProfile?.role === 'Teacher'}
                    >
                      {historyAvailableDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ minWidth: '180px' }}>
                  <select 
                    className="select-custom" 
                    style={{ width: '100%' }}
                    value={historySectionFilter} 
                    onChange={e => setHistorySectionFilter(e.target.value)}
                    disabled={userProfile?.role === 'Teacher'}
                  >
                    {userProfile?.role !== 'Teacher' && <option value="">All Sections</option>}
                    {historyAllowedSections.map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cards Grid */}
              {groupedStudentEntries.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {groupedStudentEntries.map(student => (
                    <div 
                      key={student.studentId} 
                      className="glass-panel" 
                      style={{ 
                        padding: '20px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '14px', 
                        border: '1px solid var(--border-glass)',
                        background: 'var(--bg-glass-active)',
                        borderRadius: '12px',
                        position: 'relative'
                      }}
                    >
                      {/* Student Details */}
                      <div>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                          {student.studentName}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Roll No {student.roll} Â· Grade {student.studentClass}-{student.section}
                        </span>
                      </div>

                      {/* Exams Summary */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {student.exams.map(exam => (
                          <div key={exam.examId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{exam.examName}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {exam.isAbsent ? (
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ef4444' }}>
                                  Absent
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: exam.passStatus === 'Pass' ? '#10b981' : '#ef4444' }}>
                                  {exam.percentage}% ({exam.grade})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer Actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                        <button
                          className="btn-primary"
                          style={{ 
                            padding: '6px 14px', 
                            fontSize: '0.78rem', 
                            borderRadius: '8px', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px' 
                          }}
                          onClick={() => {
                            if (student.studentObj && student.exams.length > 0) {
                              setModalViewOnly(true);
                              setActiveStudentForModal(student.studentObj);
                              setStudentHistoryExams(student.exams);
                              const firstExam = exams.find(e => e.id === student.exams[0].examId);
                              setActiveExamForModal(firstExam || student.exams[0].examObj);
                              setHistorySelectedExam(student.exams[0].examId);
                            } else {
                              showToast('Failed to load student details.', 'error');
                            }
                          }}
                        >
                          <Eye size={12} /> View Results
                        </button>


                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-muted)' }} />
                  {historySearch || historyClassFilter || historySectionFilter ? (
                    <span>No submitted result records found matching search filters.</span>
                  ) : (
                    <span>No submitted result records on file. Ranks must be calculated first.</span>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Student Result Modal */}
      {activeStudentForModal && activeExamForModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '650px', borderRadius: '16px', padding: '24px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  Add/Edit Result: {activeStudentForModal.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Roll Number: {activeStudentForModal.rollNumber || activeStudentForModal.roll || '-'} Â· Class {modalClass}-{modalSection}
                </p>
              </div>
              <button className="modal-close" onClick={() => { setActiveStudentForModal(null); setActiveExamForModal(null); setStudentHistoryExams([]); setHistorySelectedExam(null); }} style={{ fontSize: '1.5rem', lineHeight: 1 }}>{"\u00d7"}</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {studentHistoryExams.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Select Exam:</label>
                  <select className="form-control" value={historySelectedExam || ''}
                    onChange={(e) => {
                      const examId = e.target.value;
                      setHistorySelectedExam(examId);
                      const examObj = exams.find(ex => ex.id === examId) || studentHistoryExams.find(ex => ex.examId === examId)?.examObj;
                      if (examObj) setActiveExamForModal(examObj);
                    }}
                    style={{ marginTop: '4px', flex: 1 }}
                  >
                    {studentHistoryExams.map(ex => (
                      <option key={ex.examId} value={ex.examId}>{ex.examName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 107, 0, 0.06)', border: '1px solid rgba(255, 107, 0, 0.15)', borderRadius: '10px', padding: '12px 16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Exam Target</span>
                  <strong style={{ fontSize: '0.9rem', color: 'hsl(var(--color-primary))' }}>
                    {activeExamForModal.examName} ({activeExamForModal.examType})
                  </strong>
                </div>
                
                {/* Attendance Toggles */}
                {!modalViewOnly && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
                    <div style={{ display: 'flex', background: 'var(--bg-glass-active)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-glass)' }}>
                      <button
                        type="button"
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          cursor: modalViewOnly ? 'default' : 'pointer',
                          background: modalAttendance === 'Present' ? '#10b981' : 'transparent',
                          color: modalAttendance === 'Present' ? '#ffffff' : 'var(--text-muted)',
                          border: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        disabled={modalViewOnly}
                        onClick={() => setModalAttendance('Present')}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          cursor: modalViewOnly ? 'default' : 'pointer',
                          background: modalAttendance === 'Absent' ? '#ef4444' : 'transparent',
                          color: modalAttendance === 'Absent' ? '#ffffff' : 'var(--text-muted)',
                          border: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        disabled={modalViewOnly}
                        onClick={() => setModalAttendance('Absent')}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {(() => {
                const allScheduled = examTimetables.filter(et => 
                  et.examId === activeExamForModal.id && 
                  (et.grade === modalClass || et.cohort === modalClass || et.cohort.startsWith(`${modalClass}-`))
                );
                const uniqueSubjectsMap = {};
                allScheduled.forEach(s => {
                  uniqueSubjectsMap[s.subject.toLowerCase()] = s;
                });
                // Fallback: include subjects from existing saved results
                const studentResults = results.filter(r => 
                  r.studentId === activeStudentForModal.id && 
                  r.examId === activeExamForModal.id
                );
                studentResults.forEach(r => {
                  if (!uniqueSubjectsMap[r.subject.toLowerCase()]) {
                    uniqueSubjectsMap[r.subject.toLowerCase()] = { id: r.id, subject: r.subject, examId: r.examId };
                  }
                });
                const scheduledSubjects = Object.values(uniqueSubjectsMap);

                if (modalAttendance === 'Absent') {
                  return (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.25)', borderRadius: '12px' }}>
                      <AlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block', color: '#ef4444' }} />
                      <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '4px' }}>Absent</strong>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Student has been marked as Absent for this exam set. {modalViewOnly ? '' : 'Click Save to persist.'}</span>
                    </div>
                  );
                }

                if (scheduledSubjects.length === 0) {
                  return (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <AlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block', color: '#f59e0b' }} />
                      No timetable has been generated for this exam and class cohort. Please generate/create a timetable schedule first.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 2fr', gap: '12px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                      <div>Subject</div>
                      <div style={{ textAlign: 'center' }}>Obtained Marks</div>
                      <div style={{ textAlign: 'center' }}>Max Marks</div>
                      <div>Remarks</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                      {scheduledSubjects.map(s => {
                        const subKey = `${modalClass}-${s.subject}`;
                        const maxMarks = (activeExamForModal.subjectMarks && activeExamForModal.subjectMarks[subKey] !== undefined)
                          ? activeExamForModal.subjectMarks[subKey]
                          : (activeExamForModal.totalMarks || 100);

                        return (
                          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 2fr', gap: '12px', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{s.subject}</div>
                            <div>
                              <input
                                type="number"
                                className="form-control"
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  textAlign: 'center',
                                  fontSize: '0.85rem'
                                }}
                                value={formMarks[s.subject] !== undefined ? formMarks[s.subject] : ''}
                                onKeyDown={e => {
                                  if (['-', '+', 'e', 'E'].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '') {
                                    setFormMarks({ ...formMarks, [s.subject]: '' });
                                    return;
                                  }
                                  const parsed = parseFloat(val);
                                  if (!isNaN(parsed)) {
                                    const clamped = Math.min(Math.max(parsed, 0), maxMarks);
                                    setFormMarks({ ...formMarks, [s.subject]: clamped });
                                  }
                                }}
                                placeholder="Score"
                                min={0}
                                max={maxMarks}
                                disabled={modalViewOnly}
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                className="form-control"
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  textAlign: 'center',
                                  background: 'rgba(100, 116, 139, 0.08)',
                                  color: 'var(--text-muted)',
                                  border: '1.5px solid rgba(100, 116, 139, 0.2)',
                                  cursor: 'not-allowed',
                                  fontSize: '0.85rem'
                                }}
                                value={maxMarks}
                                disabled
                                readOnly
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                className="form-control"
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.85rem'
                                }}
                                value={formRemarks[s.subject] || ''}
                                onChange={e => {
                                  const sanitized = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                  setFormRemarks({ ...formRemarks, [s.subject]: sanitized });
                                }}
                                placeholder="Remarks"
                                disabled={modalViewOnly}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              {modalViewOnly ? (
                <button className="btn-primary" onClick={() => { setActiveStudentForModal(null); setActiveExamForModal(null); setStudentHistoryExams([]); setHistorySelectedExam(null); }}>
                  Close
                </button>
              ) : (
                <>
                  <button className="btn-secondary" onClick={() => { setActiveStudentForModal(null); setActiveExamForModal(null); setStudentHistoryExams([]); setHistorySelectedExam(null); }}>
                    Cancel
                  </button>
                  {(() => {
                    const allScheduled = examTimetables.filter(et => 
                      et.examId === activeExamForModal.id && 
                      (et.grade === modalClass || et.cohort === modalClass || et.cohort.startsWith(`${modalClass}-`))
                    );
                    const uniqueSubjectsMap = {};
                    allScheduled.forEach(s => {
                      uniqueSubjectsMap[s.subject.toLowerCase()] = s;
                    });
                    // Fallback: include subjects from existing saved results
                    const footerResults = results.filter(r => 
                      r.studentId === activeStudentForModal.id && 
                      r.examId === activeExamForModal.id
                    );
                    footerResults.forEach(r => {
                      if (!uniqueSubjectsMap[r.subject.toLowerCase()]) {
                        uniqueSubjectsMap[r.subject.toLowerCase()] = { id: r.id, subject: r.subject, examId: r.examId };
                      }
                    });
                    const scheduledSubjects = Object.values(uniqueSubjectsMap);
                    const disabled = scheduledSubjects.length === 0;

                    return (
                      <button 
                        className="btn-primary" 
                        onClick={() => handleSaveStudentBulk('Submitted')}
                        disabled={disabled}
                      >
                        Save
                      </button>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CSV Bulk Marks Import Simulator Modal */}
      {showBulkModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px', borderRadius: '16px', padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>CSV Bulk Scores Import</h3>
              <button className="modal-close" onClick={() => { setShowBulkModal(false); setBulkInputText(''); }}>{"\u00d7"}</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Paste CSV content formatted as: <strong>RollNumber,ObtainedMarks,Remarks</strong>. One student per line.
              </p>
              <textarea
                className="form-control"
                rows={6}
                style={{ fontFamily: 'monospace', padding: '12px', fontSize: '0.82rem', resize: 'vertical' }}
                value={bulkInputText}
                onChange={e => setBulkInputText(e.target.value)}
                placeholder={`1,85,Excellent\n2,94,Satisfactory\n3,42,Needs practice`}
              />
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => { setShowBulkModal(false); setBulkInputText(''); }}>Cancel</button>
              <button className="btn-primary" onClick={handleBulkImport}>Parse & Populate</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

