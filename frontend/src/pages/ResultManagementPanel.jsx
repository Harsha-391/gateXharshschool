import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchActiveGrades } from '../utils/grades';
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
  RotateCcw
} from 'lucide-react';

const parseStudentClass = (studentClass) => {
  if (!studentClass) return { grade: '-', department: '-' };
  const match = studentClass.match(/^(.+?)\s*\((.+?)\)$/);
  if (match) {
    return { grade: match[1], department: match[2] };
  }
  return { grade: studentClass, department: '-' };
};

export default function ResultManagementPanel({ activeTab: propActiveTab = 'analytics', setAdminView }) {
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
  }, [activeGrades]);

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

  // Memoized search filtered students across all classes with published results
  const reportSearchFilteredStudents = useMemo(() => {
    const query = reportSearchQuery.trim().toLowerCase();
    if (!query) return [];
    return students.filter(s => {
      // Check if student has at least one published exam
      const studentPubs = publishedExams[s.id];
      if (!studentPubs) return false;
      const hasPublished = Object.values(studentPubs).some(val => val === true);
      if (!hasPublished) return false;

      return (
        s.name.toLowerCase().includes(query) ||
        (s.rollNumber || s.roll || '').toString().toLowerCase().includes(query)
      );
    });
  }, [students, reportSearchQuery, publishedExams]);

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



  const reportFilteredStudents = useMemo(() => {
    if (!reportClass) return [];
    return students.filter(s => {
      if (s.studentClass !== targetReportClass) return false;
      const studentPubs = publishedExams[s.id];
      if (!studentPubs) return false;
      // Show if they have at least one exam published
      return Object.values(studentPubs).some(val => val === true);
    });
  }, [students, reportClass, targetReportClass, publishedExams]);

  // Sub-Tab: Academic Records / Search State
  const [historySearch, setHistorySearch] = useState('');
  const [historyClassFilter, setHistoryClassFilter] = useState('');
  const [historySectionFilter, setHistorySectionFilter] = useState('');
  const [historyDepartmentFilter, setHistoryDepartmentFilter] = useState('');

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



  // Notification Toast Helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Resolve session user role
  useEffect(() => {
    const role = sessionStorage.getItem('portal_role') || sessionStorage.getItem('role') || 'Admin';
    setUserRole(role);
    setCurrentUsername(sessionStorage.getItem('name') || sessionStorage.getItem('username') || 'Administrator');
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

  // Load existing marks into the modal form when a student and exam are selected for modal results entry
  useEffect(() => {
    if (activeStudentForModal && activeExamForModal) {
      const cls = activeStudentForModal.studentClass || targetClass;
      const sec = activeStudentForModal.section || selectedSection;
      if (cls) {
        const allScheduled = examTimetables.filter(et => 
          et.examId === activeExamForModal.id && 
          (et.grade === cls || et.cohort === cls || et.cohort.startsWith(`${cls}-`))
        );
        const uniqueSubjectsMap = {};
        allScheduled.forEach(s => {
          uniqueSubjectsMap[s.subject.toLowerCase()] = s;
        });
        // Fallback: also include subjects from existing saved results
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
    const allScheduled = examTimetables.filter(et => 
      et.examId === activeExamForModal.id && 
      (et.grade === cls || et.cohort === cls || et.cohort.startsWith(`${cls}-`))
    );
    const uniqueSubjectsMap = {};
    allScheduled.forEach(s => {
      uniqueSubjectsMap[s.subject.toLowerCase()] = s;
    });
    // Fallback: include subjects from existing saved results
    const existingResults = results.filter(r => 
      r.studentId === activeStudentForModal.id && 
      r.examId === activeExamForModal.id
    );
    existingResults.forEach(r => {
      if (!uniqueSubjectsMap[r.subject.toLowerCase()]) {
        uniqueSubjectsMap[r.subject.toLowerCase()] = { id: r.id, subject: r.subject, examId: r.examId };
      }
    });
    const scheduledSubjects = Object.values(uniqueSubjectsMap);

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
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = `
      <html>
        <head>
          <title>Student Academic Marksheet Report</title>
          <style>
            body { font-family: 'Outfit', 'Inter', sans-serif; color: #1e293b; padding: 20px; background: #fff; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #f8fafc; font-weight: bold; }
            .badge { font-weight: bold; }
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `;
    window.print();
    document.body.innerHTML = originalContents;
    // Reload components to restore react states
    window.location.reload();
  };

  // Computations for Analytics Dashboard
  const analyticsData = useMemo(() => {
    if (overallResults.length === 0) {
      return { passRate: 0, highAchievers: 0, overallAvg: 0, classPerformance: [], gradeDistribution: {} };
    }

    const passCount = overallResults.filter(o => o.passStatus === 'Pass').length;
    const passRate = Math.round((passCount / overallResults.length) * 100);

    const highAchievers = overallResults.filter(o => o.percentage >= 80).length;
    const overallAvg = Math.round(overallResults.reduce((sum, o) => sum + o.percentage, 0) / overallResults.length);

    // Class wise pass averages
    const classes = [...new Set(overallResults.map(o => o.cohort))];
    const classPerformance = classes.map(c => {
      const classRes = overallResults.filter(o => o.cohort === c);
      const avg = Math.round(classRes.reduce((sum, o) => sum + o.percentage, 0) / classRes.length);
      const passPct = Math.round((classRes.filter(o => o.passStatus === 'Pass').length / classRes.length) * 100);
      return { class: c, average: avg, passRate: passPct };
    });

    // Grade Distribution counts
    const grades = {};
    overallResults.forEach(o => {
      grades[o.grade] = (grades[o.grade] || 0) + 1;
    });

    return { passRate, highAchievers, overallAvg, classPerformance, gradeDistribution: grades };
  }, [overallResults]);

  // Computed top performers
  const topPerformers = useMemo(() => {
    return [...overallResults]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
      .map(o => {
        const student = students.find(s => s.id === o.studentId);
        return {
          ...o,
          studentName: student?.name || 'Unknown Student',
          roll: student?.rollNumber || student?.roll || 'N/A'
        };
      });
  }, [overallResults, students]);



  // Load report card details for active report view student — aggregates ALL published exams
  const activeReportCardData = useMemo(() => {
    if (!reportStudentId) return null;
    const studentPubs = publishedExams[reportStudentId];
    if (!studentPubs) return null;
    
    const student = students.find(s => s.id === reportStudentId);
    if (!student) return null;

    // Gather all published exam data
    const publishedExamIds = Object.keys(studentPubs).filter(eid => studentPubs[eid] === true);
    if (publishedExamIds.length === 0) return null;

    const examSections = publishedExamIds.map(examId => {
      const exam = exams.find(e => e.id === examId);
      if (!exam) return null;
      const overall = overallResults.find(o => o.studentId === reportStudentId && o.examId === examId);
      const subjectMarks = results.filter(r => r.studentId === reportStudentId && r.examId === examId);
      return { exam, overall, subjectMarks };
    }).filter(Boolean);

    if (examSections.length === 0) return null;

    // Calculate grand totals across all exams
    const grandTotalObtained = examSections.reduce((sum, sec) => sum + (sec.overall?.totalObtained || 0), 0);
    const grandTotalMax = examSections.reduce((sum, sec) => sum + (sec.overall?.totalMax || 0), 0);
    const grandPercentage = grandTotalMax > 0 ? Math.round((grandTotalObtained / grandTotalMax) * 100) : 0;

    return { student, examSections, grandTotalObtained, grandTotalMax, grandPercentage };
  }, [reportStudentId, students, exams, overallResults, results, publishedExams]);

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

      {/* Sub-navigation Menu Header for Results Manager (Analytics, Marks Entry, Report Cards) */}
      {['analytics', 'marks-entry', 'report-cards'].includes(activeTab) && (
        <div className="glass-panel" style={{ padding: '8px', display: 'flex', gap: '8px', overflowX: 'auto', borderRadius: '12px' }}>
          <button 
            onClick={() => {
              setActiveTab('analytics');
              setAdminView('results-analytics');
            }}
            className={`tab-btn-custom ${activeTab === 'analytics' ? 'active' : ''}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTab === 'analytics' ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: activeTab === 'analytics' ? 'rgb(99,102,241)' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <BarChart3 size={16} /> Analytics Dashboard
          </button>
          <button 
            onClick={() => {
              setActiveTab('marks-entry');
              setAdminView('results-marks-entry');
            }}
            className={`tab-btn-custom ${activeTab === 'marks-entry' ? 'active' : ''}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTab === 'marks-entry' ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: activeTab === 'marks-entry' ? 'rgb(99,102,241)' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <FileSpreadsheet size={16} /> Marks Entry
          </button>
          <button 
            onClick={() => {
              setActiveTab('report-cards');
              setAdminView('results-report-cards');
            }}
            className={`tab-btn-custom ${activeTab === 'report-cards' ? 'active' : ''}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTab === 'report-cards' ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: activeTab === 'report-cards' ? 'rgb(99,102,241)' : 'var(--text-muted)',
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
              {/* Statistics Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Average Pass Rate</span>
                    <strong style={{ fontSize: '1.5rem', fontWeight: 800 }}>{analyticsData.passRate}%</strong>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'hsl(var(--color-primary))', borderRadius: '12px' }}>
                    <Award size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>High Achievers (≥80%)</span>
                    <strong style={{ fontSize: '1.5rem', fontWeight: 800 }}>{analyticsData.highAchievers}</strong>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '12px' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Evaluated Students</span>
                    <strong style={{ fontSize: '1.5rem', fontWeight: 800 }}>{students.length}</strong>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '12px' }}>
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Overall Percentage Average</span>
                    <strong style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      {overallResults.length > 0 ? (overallResults.reduce((sum, o) => sum + o.percentage, 0) / overallResults.length).toFixed(1) : '0.0'}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Graphical Charts and Top Performers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                {/* Visual Chart 1: Grade Distributions */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Overall Grade Distribution</h4>
                  {Object.keys(analyticsData.gradeDistribution).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: 'auto 0' }}>
                      {Object.entries(analyticsData.gradeDistribution).map(([grade, count]) => {
                        const percent = Math.round((count / overallResults.length) * 100);
                        return (
                          <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ width: '40px', fontWeight: 700, fontSize: '0.85rem' }}>{grade}</span>
                            <div style={{ flex: 1, height: '12px', background: 'var(--bg-glass-active)', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ width: `${percent}%`, height: '100%', background: 'hsl(var(--color-primary))', borderRadius: '6px' }} />
                            </div>
                            <span style={{ width: '80px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                              {count} ({percent}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No locked results to render grade distributions.
                    </div>
                  )}
                </div>

                {/* Top Performers List */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Top Performers Leaderboard</h4>
                  {topPerformers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {topPerformers.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-glass-active)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#b45309', color: '#fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                              {idx + 1}
                            </span>
                            <div>
                              <span style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block' }}>{p.studentName}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll: {p.roll} · Grade: {p.cohort}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ color: 'hsl(var(--color-primary))', fontSize: '0.9rem', display: 'block' }}>{p.percentage}%</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Grade: {p.grade}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No calculated rankings available. Go to Result Generation to process data.
                    </div>
                  )}
                </div>
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
                    <select className="select-custom" style={{ width: '100%' }} value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setStudentExamSelections({}); setStudentExamCategories({}); setRosterSearch(''); }}>
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
                      >
                        {availableDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Section</label>
                    <select className="select-custom" style={{ width: '100%' }} value={selectedSection} onChange={e => { setSelectedSection(e.target.value); setStudentExamSelections({}); setStudentExamCategories({}); setRosterSearch(''); }}>
                      {gradesSections.sections.map(s => (
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
                        const hasTimetable = examTimetables.some(et => et.examId === ex.id);
                        return cohortMatches && hasTimetable;
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
                                                    background: 'rgba(99, 102, 241, 0.08)',
                                                    color: 'hsl(var(--color-primary))',
                                                    border: '1px solid rgba(99, 102, 241, 0.15)',
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
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 2, minWidth: '220px', position: 'relative' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Search Student (Name / Roll No)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Search name or roll number..." 
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
                                // Prevent input blur from firing before onClick when clicking a list item
                                e.preventDefault();
                              }}
                              className="search-item-hover"
                            >
                              <strong style={{ color: 'hsl(var(--color-primary))' }}>{student.name}</strong>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Roll {student.rollNumber || student.roll || '-'} · {displayGrade} ({student.section || 'A'})
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

                <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Grade</label>
                  <select className="select-custom" style={{ width: '100%' }} value={reportClass} onChange={e => { setReportClass(e.target.value); setReportStudentId(''); setReportSearchQuery(''); }}>
                    <option value="">Select Grade</option>
                    {uniqueGradeNames.map(g => (
                      <option key={g} value={g}>{g.startsWith('LKG') || g.startsWith('UKG') || g.startsWith('NURSERY') ? g : `Grade ${g}`}</option>
                    ))}
                  </select>
                </div>

                {reportHasDepartments && (
                  <div className="form-group animate-scale-up" style={{ flex: 1, minWidth: '130px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Department</label>
                    <select 
                      className="select-custom" 
                      style={{ width: '100%' }} 
                      value={reportDepartment} 
                      onChange={e => { setReportDepartment(e.target.value); setReportStudentId(''); }}
                    >
                      {reportAvailableDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
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

              {activeReportCardData ? (
                <div className="glass-panel" style={{ padding: '32px' }}>
                  {/* Preview Container formatted for clean printable styling */}
                  <div id="printable-academic-report" style={{ border: '2px solid #e2e8f0', borderRadius: '12px', padding: '30px', background: '#fff', color: '#1e293b' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px double #cbd5e1', paddingBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'hsl(var(--color-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.5rem' }}>
                          GV
                        </div>
                        <div>
                          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Green Valley Public School
                          </h2>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                            Khimel Rani Station Road, Bali, Rajasthan · contact@gmail.com
                          </p>
                        </div>
                      </div>
                       <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 12px', borderRadius: '99px', fontWeight: 700, color: '#334155' }}>
                          Consolidated Academic Report Card
                        </span>
                        <button 
                          className="no-print btn-primary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #4f46e5 100%)',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
                          }}
                          onClick={() => handlePrint('printable-academic-report')}
                        >
                          <Printer size={12} /> Print Report Card
                        </button>
                      </div>
                    </div>

                    {/* Student Metadata Card */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 1fr', gap: '20px', marginTop: '24px', background: '#f8fafc', padding: '20px', borderRadius: '10px' }}>
                      {/* Photo Placeholder */}
                      <div style={{ width: '90px', height: '110px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
                        Student Photo
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                        <div>Student Name: <strong style={{ color: '#0f172a' }}>{activeReportCardData.student.name}</strong></div>
                        <div>Admission No: <strong style={{ color: '#0f172a' }}>{activeReportCardData.student.admissionNumber}</strong></div>
                        <div>Grade/Class: <strong style={{ color: '#0f172a' }}>Class {activeReportCardData.student.studentClass} - Section {activeReportCardData.student.section}</strong></div>
                        <div>Roll Number: <strong style={{ color: '#0f172a' }}>{activeReportCardData.student.rollNumber || activeReportCardData.student.roll}</strong></div>
                        <div>Father Name: <strong style={{ color: '#0f172a' }}>{activeReportCardData.student.fatherName}</strong></div>
                        <div>Total Exams: <strong style={{ color: '#0f172a' }}>{activeReportCardData.examSections.length}</strong></div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>OVERALL %</span>
                        <strong style={{ fontSize: '1.4rem', color: 'hsl(var(--color-primary))' }}>
                          {activeReportCardData.grandPercentage}%
                        </strong>
                      </div>
                    </div>

                    {/* Per-Exam Sections */}
                    {activeReportCardData.examSections.map((section, secIdx) => (
                      <div key={secIdx} style={{ marginTop: '30px' }}>
                        {/* Exam Section Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', padding: '12px 18px', borderRadius: '8px 8px 0 0', borderBottom: '2px solid hsl(var(--color-primary))' }}>
                          <div>
                            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{section.exam.examName}</strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '10px' }}>({section.exam.examType})</span>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Session: <strong>{section.exam.academicSession}</strong></span>
                            {section.overall && (
                              <span style={{ 
                                padding: '3px 10px', 
                                borderRadius: '99px', 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                background: section.overall.passStatus === 'Pass' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                color: section.overall.passStatus === 'Pass' ? '#10b981' : '#ef4444' 
                              }}>
                                {section.overall.passStatus} — {section.overall.percentage}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Subject Breakdown Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700 }}>Subject</th>
                              <th style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}>Max Marks</th>
                              <th style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}>Obtained</th>
                              <th style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}>Grade</th>
                              <th style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.subjectMarks.map((m, idx) => (
                              <tr key={idx}>
                                <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', fontWeight: 600, fontSize: '0.82rem' }}>{m.subject}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', fontSize: '0.82rem' }}>{m.totalMarks}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}>{m.obtainedMarks}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: m.grade === 'F' ? '#ef4444' : '#10b981', fontSize: '0.82rem' }}>{m.grade}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', fontSize: '0.78rem', color: '#475569' }}>{m.remarks || (m.percentage >= 40 ? 'Satisfactory Pass' : 'Academic Alert')}</td>
                              </tr>
                            ))}
                          </tbody>
                          {section.overall && (
                            <tfoot>
                              <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                                <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', fontSize: '0.82rem' }}>Total</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', fontSize: '0.82rem' }}>{section.overall.totalMax}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 800 }}>{section.overall.totalObtained}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', fontSize: '0.82rem', color: 'hsl(var(--color-primary))' }}>{section.overall.grade}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '10px 14px', textAlign: 'center', fontSize: '0.82rem' }}>Rank {section.overall.rank || 'N/A'}</td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    ))}

                    {/* Grand Overall Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', border: '2px solid hsl(var(--color-primary))', background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(79,70,229,0.08) 100%)', padding: '22px', borderRadius: '10px', textAlign: 'center', marginTop: '30px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grand Total Marks</span>
                        <strong style={{ fontSize: '1.3rem', color: '#0f172a' }}>
                          {activeReportCardData.grandTotalObtained} / {activeReportCardData.grandTotalMax}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Percentage</span>
                        <strong style={{ fontSize: '1.3rem', color: 'hsl(var(--color-primary))' }}>
                          {activeReportCardData.grandPercentage}%
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Exams</span>
                        <strong style={{ fontSize: '1.3rem', color: '#16a34a' }}>
                          {activeReportCardData.examSections.length}
                        </strong>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', borderTop: '1px dashed #cbd5e1', paddingTop: '20px', fontSize: '0.8rem', color: '#475569' }}>
                      <div style={{ textAlign: 'center', width: '180px' }}>
                        <div style={{ height: '35px' }} />
                        <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>Class Staff</div>
                      </div>
                      <div style={{ textAlign: 'center', width: '180px' }}>
                        <div style={{ height: '35px' }} />
                        <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>Principal Stamp / Seal</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Please select a Grade and Student to preview the consolidated Report Card.
                </div>
              )}
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
                  >
                    <option value="">All Sections</option>
                    {gradesSections.sections.map(sec => (
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
                          Roll No {student.roll} · Grade {student.studentClass}-{student.section}
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
                        {(() => {
                          const studentPubs = publishedExams[student.studentId] || {};
                          const isAllPublished = student.exams.length > 0 && student.exams.every(exam => studentPubs[exam.examId] === true);
                          return isAllPublished ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.78rem',
                                  borderRadius: '8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'rgba(16, 185, 129, 0.08)',
                                  color: '#10b981',
                                  border: '1px solid rgba(16, 185, 129, 0.15)',
                                  fontWeight: 700
                                }}
                              >
                                <Check size={12} /> Published
                              </span>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.78rem',
                                  borderRadius: '8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  border: '1px solid var(--border-glass)',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleUnpublish(student.studentId, student.exams)}
                              >
                                <RotateCcw size={12} /> Undo
                              </button>
                            </div>
                            ) : (
                              <button
                                className="btn-primary"
                                style={{ 
                                  padding: '6px 14px', 
                                  fontSize: '0.78rem', 
                                  borderRadius: '8px', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #4f46e5 100%)',
                                  border: 'none',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handlePublish(student.studentId, student.exams)}
                              >
                                <Share2 size={12} /> Publish
                              </button>
                            );
                          })()}
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
                  Roll Number: {activeStudentForModal.rollNumber || activeStudentForModal.roll || '-'} · Class {modalClass}-{modalSection}
                </p>
              </div>
              <button className="modal-close" onClick={() => { setActiveStudentForModal(null); setActiveExamForModal(null); setStudentHistoryExams([]); setHistorySelectedExam(null); }} style={{ fontSize: '1.5rem', lineHeight: 1 }}>×</button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '10px', padding: '12px 16px' }}>
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
              <button className="modal-close" onClick={() => { setShowBulkModal(false); setBulkInputText(''); }}>×</button>
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
