import React, { useState, useEffect } from 'react';
import { 
  Users, 
  LogOut, 
  GraduationCap, 
  ClipboardCheck, 
  List, 
  School, 
  Search, 
  Calendar, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  UserCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  Info,
  LayoutDashboard,
  Clock
} from 'lucide-react';
import StudentDirectory from './StudentDirectory';
import TeacherList from './TeacherList';
import { fetchActiveGrades, fetchActiveSections } from '../utils/grades';

const parseGradeName = (fullName) => {
  if (!fullName) return { baseGrade: '', department: '' };
  const match = fullName.match(/^(.+?)\s*\((.+?)\)$/);
  if (match) {
    return { baseGrade: match[1], department: match[2] };
  }
  return { baseGrade: fullName, department: '' };
};

const isGrade11or12 = (name) => {
  if (!name) return false;
  const clean = name.trim().toUpperCase();
  return clean.includes('11') || clean.includes('12') || clean.includes('XI') || clean.includes('XII');
};

export default function TeacherPanel({ setActiveView, onLogout, teacherView, setTeacherView, onBackToMain }) {
  // Global filter states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [studentSearch, setStudentSearch] = useState('');

  // Load active grades and sections for top level selection
  const [topActiveGrades, setTopActiveGrades] = useState([]);
  const [topActiveSections, setTopActiveSections] = useState([]);
  useEffect(() => {
    const loadGradesAndSections = async () => {
      const [grades, secs] = await Promise.all([
        fetchActiveGrades(),
        fetchActiveSections()
      ]);
      setTopActiveGrades(grades);
      if (grades.length > 0) {
        setSelectedClass(grades[0].name);
      }
      setTopActiveSections(secs);
      if (secs.length > 0) {
        setSelectedSection(secs[0].name);
      }
    };
    loadGradesAndSections();
  }, []);

  // Notification states
  const [notification, setNotification] = useState(null);

  // Cohort states for today's status cards
  const [cohortData, setCohortData] = useState([]);
  const [loadingCohort, setLoadingCohort] = useState(false);

  // Trigger notification helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchCohortData = async () => {
    try {
      setLoadingCohort(true);
      // Fetch for today's present date '2026-06-01'
      const res = await fetch('/api/attendance/reports/class?date=2026-06-01');
      if (res.ok) {
        const data = await res.json();
        setCohortData(data);
      }
    } catch (err) {
      console.error('Error loading dashboard cohort data:', err);
    } finally {
      setLoadingCohort(false);
    }
  };

  useEffect(() => {
    if (teacherView === 'mark-attendance') {
      fetchCohortData();
    }
  }, [teacherView]);

  // Subheader Text
  const getSubheaderText = () => {
    switch (teacherView) {
      case 'dashboard': return 'Staff Dashboard - manage attendance and student records';
      case 'mark-attendance': return 'Mark and review today\'s student attendance';

      case 'attendance-history': return 'Search, review, and modify historical rosters';
      case 'student-reports': return 'Generate attendance metrics and export spreadsheets';
      case 'class-reports': return 'Evaluate overall cohort averages and stats';
      case 'monthly-calendar': return 'Monthly calendar tracker grid per student';
      case 'class-timetable': return 'View weekly class timetables';
      case 'students': return 'Access complete student academic records directory';
      case 'teacher-list': return 'View faculty roster and staff profiles';
      default: return 'Mark and review today\'s student attendance';
    }
  };

  // Rendering switch
  const renderTeacherContent = () => {
    switch (teacherView) {
      case 'dashboard':
        return (
          <MarkAttendanceView 
            date={selectedDate}
            setDate={setSelectedDate}
            studentClass={selectedClass}
            setClass={setSelectedClass}
            section={selectedSection}
            setSection={setSelectedSection}
            search={studentSearch}
            setSearch={setStudentSearch}
            showToast={showToast}
          />
        );
      case 'mark-attendance':
        return (
          <MarkAttendanceView 
            date={selectedDate}
            setDate={setSelectedDate}
            studentClass={selectedClass}
            setClass={setSelectedClass}
            section={selectedSection}
            setSection={setSelectedSection}
            search={studentSearch}
            setSearch={setStudentSearch}
            showToast={showToast}
          />
        );

      case 'attendance-history':
        return (
          <AttendanceHistoryView 
            showToast={showToast}
          />
        );
      case 'student-reports':
        return (
          <StudentReportsView 
            showToast={showToast}
          />
        );
      case 'monthly-calendar':
        return (
          <MonthlyCalendarView 
            showToast={showToast}
          />
        );
      case 'class-timetable':
        return (
          <ClassTimetableView 
            showToast={showToast}
          />
        );
      case 'students':
        return <StudentDirectory readOnly={true} />;
      case 'teacher-list':
        return <TeacherList setActiveView={setActiveView} readOnly={true} />;
      default:
        return (
          <MarkAttendanceView 
            date={selectedDate}
            setDate={setSelectedDate}
            studentClass={selectedClass}
            setClass={setSelectedClass}
            section={selectedSection}
            setSection={setSelectedSection}
            search={studentSearch}
            setSearch={setStudentSearch}
            showToast={showToast}
          />
        );
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Toast Notification */}
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

      {/* Header Block */}
      <div className="admin-panel-header glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: 'rgba(hsl(var(--color-secondary)), 0.1)',
            color: 'hsl(var(--color-secondary))'
          }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Staff Dashboard</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {getSubheaderText()}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        </div>
      </div>

      {/* Dynamic Content */}
      {renderTeacherContent()}
    </div>
  );
}

// ============================================================================
// TAB A: ROSTER DAILY MARKING VIEW
// ============================================================================
export function MarkAttendanceView({ date, setDate, studentClass, setClass, section, setSection, search, setSearch, showToast }) {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeGrades, setActiveGrades] = useState([]);
  const [activeSections, setActiveSections] = useState([]);

  const { baseGrade: baseClass, department: selectedDept } = parseGradeName(studentClass);
  const isHighGrade = isGrade11or12(baseClass);

  // Compute unique base grades from activeGrades
  const baseGrades = [];
  const seenBase = new Set();
  activeGrades.forEach(g => {
    const base = parseGradeName(g.name).baseGrade;
    if (!seenBase.has(base)) {
      seenBase.add(base);
      baseGrades.push(base);
    }
  });

  // Compute departments for the currently selected baseClass
  const departmentsForSelectedGrade = activeGrades
    .filter(g => parseGradeName(g.name).baseGrade === baseClass)
    .map(g => parseGradeName(g.name).department)
    .filter(Boolean);

  const handleBaseClassChange = (newBaseClass) => {
    if (isGrade11or12(newBaseClass)) {
      const depts = activeGrades
        .filter(g => parseGradeName(g.name).baseGrade === newBaseClass)
        .map(g => parseGradeName(g.name).department)
        .filter(Boolean);
      if (depts.length > 0) {
        const targetDept = depts.includes(selectedDept) ? selectedDept : depts[0];
        setClass(`${newBaseClass} (${targetDept})`);
      } else {
        setClass(newBaseClass);
      }
    } else {
      setClass(newBaseClass);
    }
  };

  const handleDeptChange = (newDept) => {
    setClass(`${baseClass} (${newDept})`);
  };

  useEffect(() => {
    const loadGradesAndSections = async () => {
      const [grades, secs] = await Promise.all([
        fetchActiveGrades(),
        fetchActiveSections()
      ]);
      setActiveGrades(grades);
      setActiveSections(secs);
    };
    loadGradesAndSections();
  }, []);

  // Check if attendance is already submitted
  const isSubmitted = roster.length > 0 && roster.some(s => s.submitted);

  // Load roster
  const fetchRoster = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        date,
        studentClass,
        section,
        search
      }).toString();
      const res = await fetch(`/api/attendance?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setRoster(data);
      }
    } catch (err) {
      console.error('Error loading daily attendance roster:', err);
      showToast('Error loading students registry list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [date, studentClass, section, search]);

  // Handle single student toggle
  const handleStatusToggle = (stuId, status) => {
    setRoster(prev => prev.map(s => {
      if (s.id === stuId) {
        return { ...s, attendanceStatus: s.attendanceStatus === status ? '' : status };
      }
      return s;
    }));
  };

  // Handle inline remarks modification
  const handleRemarksChange = (stuId, remarks) => {
    setRoster(prev => prev.map(s => {
      if (s.id === stuId) {
        return { ...s, remarks };
      }
      return s;
    }));
  };

  // Mark all as Present
  const markAllPresent = () => {
    setRoster(prev => prev.map(s => ({ ...s, attendanceStatus: 'Present' })));
    showToast('All roster students marked Present!', 'success');
  };

  // Save Attendance to DB
  const saveAttendance = async () => {
    try {
      // Validations
      const unlogged = roster.filter(r => !r.attendanceStatus);
      if (unlogged.length > 0) {
        if (!window.confirm(`You have ${unlogged.length} unmarked students. Would you like to submit and save remaining records?`)) {
          return;
        }
      }

      setSaving(true);
      const recordsToSave = roster
        .filter(r => r.attendanceStatus) // Save only marked ones
        .map(r => ({
          studentId: r.id,
          status: r.attendanceStatus,
          remarks: r.remarks
        }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          studentClass,
          section,
          records: recordsToSave,
          markedBy: 'uttam306115@gmail.com'
        })
      });

      if (res.ok) {
        showToast('Daily attendance saved successfully!', 'success');
        fetchRoster(); // Reload to show saved state
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save attendance logs.', 'error');
      }
    } catch (err) {
      console.error('Error saving attendance records:', err);
      showToast('API network connection error.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Submit Attendance (finalize)
  const submitAttendance = async () => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, studentClass, section })
      });
      if (res.ok) {
        showToast('Attendance submitted successfully!', 'success');
        setRoster(prev => prev.map(s => ({ ...s, submitted: true })));
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to submit attendance.', 'error');
      }
    } catch (err) {
      console.error('Error submitting attendance:', err);
      showToast('Network error submitting attendance.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Statistics calculation
  const totalStudents = roster.length;
  const presentCount = roster.filter(s => s.attendanceStatus === 'Present').length;
  const absentCount = roster.filter(s => s.attendanceStatus === 'Absent').length;
  const leaveCount = roster.filter(s => s.attendanceStatus === 'Leave').length;
  const lateCount = roster.filter(s => s.attendanceStatus === 'Late').length;
  const markedCount = roster.filter(s => s.attendanceStatus).length;
  const attendanceRate = markedCount > 0 ? Math.round(((presentCount + lateCount) / markedCount) * 100) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. FILTER CONTROLS CARD */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            
            {/* Date Filter */}
            <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Attendance Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => {
                  const val = e.target.value;
                  const todayStr = new Date().toLocaleDateString('en-CA');
                  if (val > todayStr) return;
                  setDate(val);
                }}
                max={new Date().toLocaleDateString('en-CA')}
                className="form-control"
                style={{ height: '38px', borderRadius: '8px', padding: '8px 12px' }}
              />
            </div>

            {/* Class Filter */}
            <div className="form-group" style={{ margin: 0, minWidth: '110px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Grade Class</label>
              <select 
                className="select-custom" 
                value={baseClass} 
                onChange={(e) => handleBaseClassChange(e.target.value)}
                style={{ height: '38px', borderRadius: '8px' }}
              >
                {baseGrades.map(g => (
                  <option key={g} value={g}>
                    {g.startsWith('LKG') || g.startsWith('UKG') || g.startsWith('NURSERY') ? g : `Grade ${g}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter (Only for Grade XI/XII) */}
            {isHighGrade && departmentsForSelectedGrade.length > 0 && (
              <div className="form-group" style={{ margin: 0, minWidth: '130px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Department</label>
                <select 
                  className="select-custom" 
                  value={selectedDept} 
                  onChange={(e) => handleDeptChange(e.target.value)}
                  style={{ height: '38px', borderRadius: '8px' }}
                >
                  {departmentsForSelectedGrade.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Section Filter */}
            <div className="form-group" style={{ margin: 0, minWidth: '100px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Section</label>
              <select 
                className="select-custom" 
                value={section} 
                onChange={(e) => setSection(e.target.value)}
                style={{ height: '38px', borderRadius: '8px' }}
              >
                {activeSections.map(s => (
                  <option key={s.id || s.name} value={s.name}>Section {s.name}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="search-bar-container" style={{ margin: 0, maxWidth: '280px', flex: 1, height: '38px', marginTop: '16px' }}>
              <Search size={16} className="search-bar-icon" />
              <input 
                type="text" 
                placeholder="Search roll, admission, name..."
                className="search-bar-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
              />
            </div>

          </div>

          {/* Mark All Button */}
          <div style={{ marginTop: '16px' }}>
            <button 
              onClick={markAllPresent}
              disabled={totalStudents === 0}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', height: '38px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <CheckCircle size={16} /> Mark All Present
            </button>
          </div>

        </div>
      </div>

      {/* 3. ROSTER LIST TABLE */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'hsl(var(--color-primary))' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading student rosters...</p>
          </div>
        ) : roster.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>No Students Registered</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>There are no students registered in Grade {studentClass} - Section {section}.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <table className="student-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-glass-active)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border-glass)' }}>
                <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Roll No</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Photo</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student Name</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Class/Sec</th>
                  {isHighGrade && (
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</th>
                  )}
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Attendance Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remarks / Reasons</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((stu, index) => (
                  <tr key={stu.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s ease' }} className="table-row-hover">
                    
                    {/* Roll No */}
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{stu.rollNumber}</td>
                    
                    {/* Photo */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50px',
                        background: stu.photoBg || 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        overflow: 'hidden'
                      }}>
                        {stu.photo ? <img src={stu.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : stu.fullName.substring(0, 2).toUpperCase()}
                      </div>
                    </td>

                    {/* Name */}
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{stu.fullName}</td>
                    
                    {/* Class/Sec */}
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid var(--border-glass)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {isHighGrade ? `${parseGradeName(stu.studentClass).baseGrade || baseClass}-${stu.section}` : `${stu.studentClass}-${stu.section}`}
                      </span>
                    </td>

                    {/* Department (Only for Grade XI/XII) */}
                    {isHighGrade && (
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          background: 'rgba(99, 102, 241, 0.08)', 
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          color: 'hsl(var(--color-primary))',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {parseGradeName(stu.studentClass).department || selectedDept || '—'}
                        </span>
                      </td>
                    )}

                    {/* Attendance Buttons */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        
                        {stu.attendanceStatus ? (
                          <button 
                            onClick={() => handleStatusToggle(stu.id, stu.attendanceStatus)}
                            style={{
                              padding: '6px 16px',
                              borderRadius: '6px',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              background: stu.attendanceStatus === 'Present' ? '#10b981' : stu.attendanceStatus === 'Absent' ? '#ef4444' : stu.attendanceStatus === 'Leave' ? '#f59e0b' : '#f97316',
                              color: '#ffffff',
                              opacity: 0.85
                            }}
                          >
                            {stu.attendanceStatus} ✕
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleStatusToggle(stu.id, 'Present')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: 'rgba(255,255,255,0.02)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-glass)'
                              }}
                            >
                              Present
                            </button>

                            <button 
                              onClick={() => handleStatusToggle(stu.id, 'Absent')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: 'rgba(255,255,255,0.02)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-glass)'
                              }}
                            >
                              Absent
                            </button>

                            <button 
                              onClick={() => handleStatusToggle(stu.id, 'Leave')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: 'rgba(255,255,255,0.02)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-glass)'
                              }}
                            >
                              Leave
                            </button>

                            <button 
                              onClick={() => handleStatusToggle(stu.id, 'Late')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: 'rgba(255,255,255,0.02)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-glass)'
                              }}
                            >
                              Late
                            </button>
                          </>
                        )}

                      </div>
                    </td>

                    {/* Remarks Input */}
                    <td style={{ padding: '14px 20px', width: '220px' }}>
                      <input 
                        type="text" 
                        placeholder="Add reason/remark..."
                        className="form-control"
                        value={stu.remarks}
                        onChange={(e) => handleRemarksChange(stu.id, e.target.value)}
                        style={{ height: '32px', borderRadius: '6px', fontSize: '0.8rem', padding: '6px 10px' }}
                      />
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. ACTIONS BOTTOM BAR */}
      <div className="glass-panel" style={{ 
        padding: '16px 24px', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center', 
        border: '1px solid rgba(255,255,255,0.08)',
        marginTop: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={saveAttendance}
            disabled={saving || roster.length === 0}
            className="btn-primary"
            style={{ 
              background: '#6366f1', 
              border: 'none', 
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 700
            }}
          >
            {saving ? (
              <><Loader2 className="animate-spin" size={16} /> Saving Attendance...</>
            ) : (
              <><ClipboardCheck size={18} /> Save Attendance</>
            )}
          </button>
          <button 
            onClick={submitAttendance}
            disabled={submitting}
            className="btn-primary"
            style={{ 
              background: '#10b981', 
              border: 'none', 
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {submitting ? (
              <><Loader2 className="animate-spin" size={16} /> Submitting...</>
            ) : (
              <><CheckCircle size={18} /> Submit Attendance</>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// TAB B: ATTENDANCE HISTORY LOG VIEW
// ============================================================================
export function AttendanceHistoryView({ showToast }) {
  const [studentClass, setClass] = useState('');
  const [section, setSection] = useState('A');
  const [search, setSearch] = useState('');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeGrades, setActiveGrades] = useState([]);
  const [activeSections, setActiveSections] = useState([]);

  const { baseGrade: baseClass, department: selectedDept } = parseGradeName(studentClass);
  const isHighGrade = isGrade11or12(baseClass);

  // Compute unique base grades from activeGrades
  const baseGrades = [];
  const seenBase = new Set();
  activeGrades.forEach(g => {
    const base = parseGradeName(g.name).baseGrade;
    if (!seenBase.has(base)) {
      seenBase.add(base);
      baseGrades.push(base);
    }
  });

  // Compute departments for the currently selected baseClass
  const departmentsForSelectedGrade = activeGrades
    .filter(g => parseGradeName(g.name).baseGrade === baseClass)
    .map(g => parseGradeName(g.name).department)
    .filter(Boolean);

  const handleBaseClassChange = (newBaseClass) => {
    if (isGrade11or12(newBaseClass)) {
      const depts = activeGrades
        .filter(g => parseGradeName(g.name).baseGrade === newBaseClass)
        .map(g => parseGradeName(g.name).department)
        .filter(Boolean);
      if (depts.length > 0) {
        const targetDept = depts.includes(selectedDept) ? selectedDept : depts[0];
        setClass(`${newBaseClass} (${targetDept})`);
      } else {
        setClass(newBaseClass);
      }
    } else {
      setClass(newBaseClass);
    }
  };

  const handleDeptChange = (newDept) => {
    setClass(`${baseClass} (${newDept})`);
  };

  useEffect(() => {
    const loadGradesAndSections = async () => {
      const [grades, secs] = await Promise.all([
        fetchActiveGrades(),
        fetchActiveSections()
      ]);
      setActiveGrades(grades);
      if (grades.length > 0) {
        setClass(grades[0].name);
      }
      setActiveSections(secs);
      if (secs.length > 0) {
        setSection(secs[0].name);
      }
    };
    loadGradesAndSections();
  }, []);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'submitted'
  const [submittedDates, setSubmittedDates] = useState([]);
  const [loadingSubmitted, setLoadingSubmitted] = useState(false);

  const fetchSubmittedDates = async () => {
    try {
      setLoadingSubmitted(true);
      const res = await fetch('/api/attendance/submitted-dates');
      if (res.ok) {
        const data = await res.json();
        setSubmittedDates(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubmitted(false);
    }
  };

  const fetchRoster = async (submittedOnly = false) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        date,
        studentClass,
        section,
        search
      });
      if (submittedOnly) queryParams.set('submitted', 'true');
      const res = await fetch(`/api/attendance?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRoster(data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading history roster list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmittedView = async () => {
    await fetchSubmittedDates();
    await fetchRoster(true);
  };

  useEffect(() => {
    if (activeTab === 'all') {
      fetchRoster(false);
    } else {
      loadSubmittedView();
    }
  }, [date, studentClass, section, search, activeTab]);

  const handleStatusToggle = (stuId, status) => {
    setRoster(prev => prev.map(s => {
      if (s.id === stuId) {
        return { ...s, attendanceStatus: s.attendanceStatus === status ? '' : status };
      }
      return s;
    }));
  };

  const handleRemarksChange = (stuId, remarks) => {
    setRoster(prev => prev.map(s => {
      if (s.id === stuId) {
        return { ...s, remarks };
      }
      return s;
    }));
  };

  const saveAttendanceUpdates = async () => {
    try {
      setSaving(true);
      const recordsToSave = roster
        .filter(r => r.attendanceStatus)
        .map(r => ({
          studentId: r.id,
          status: r.attendanceStatus,
          remarks: r.remarks
        }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          studentClass,
          section,
          records: recordsToSave,
          markedBy: 'uttam306115@gmail.com'
        })
      });

      if (res.ok) {
        showToast('History records updated successfully!', 'success');
        fetchRoster();
      } else {
        showToast('Failed to update logs.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network request failure.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Export attendance report as CSV
  const exportAttendanceCSV = () => {
    const headers = ['Roll No', 'Student Name', 'Grade', 'Section', 'Attendance Status', 'Remarks'];
    const rows = roster.map(stu => [
      stu.rollNumber,
      stu.fullName,
      studentClass,
      section,
      stu.attendanceStatus || 'Unmarked',
      stu.remarks || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_Report_Grade${studentClass}_Section${section}_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Attendance report exported successfully!', 'success');
  };

  // Find percentage
  const total = roster.length;
  const marked = roster.filter(s => s.attendanceStatus).length;
  const present = roster.filter(s => s.attendanceStatus === 'Present').length;
  const late = roster.filter(s => s.attendanceStatus === 'Late').length;
  const rate = marked > 0 ? Math.round(((present + late) / marked) * 100) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Tab Switcher */}
      <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
            background: activeTab === 'all' ? '#6366f1' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'all' ? '#fff' : 'var(--text-muted)',
            border: activeTab === 'all' ? 'none' : '1px solid var(--border-glass)'
          }}
        >
          Attendance History
        </button>
        <button
          onClick={() => setActiveTab('submitted')}
          style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
            background: activeTab === 'submitted' ? '#10b981' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'submitted' ? '#fff' : 'var(--text-muted)',
            border: activeTab === 'submitted' ? 'none' : '1px solid var(--border-glass)'
          }}
        >
          Submitted Records
        </button>
      </div>

      {activeTab === 'submitted' && (
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} style={{ color: '#10b981' }} /> Submitted Attendance Dates
          </h4>
          {loadingSubmitted ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : submittedDates.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              No submitted attendance records found for Grade {studentClass}-{section}.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {submittedDates.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => { setDate(item.date); setActiveTab('all'); }}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)',
                    background: 'rgba(16,185,129,0.06)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                    color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <CheckCircle size={14} /> {item.date} ({item.count} students)
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Past Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => {
                const val = e.target.value;
                const todayStr = new Date().toLocaleDateString('en-CA');
                if (val > todayStr) return;
                setDate(val);
              }}
              max={new Date().toLocaleDateString('en-CA')}
              className="form-control"
              style={{ height: '38px', borderRadius: '8px', padding: '8px 12px' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0, minWidth: '110px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Grade Class</label>
              <select 
                className="select-custom" 
                value={baseClass} 
                onChange={(e) => handleBaseClassChange(e.target.value)}
                style={{ height: '38px', borderRadius: '8px' }}
              >
                {baseGrades.map(g => (
                  <option key={g} value={g}>
                    {g.startsWith('LKG') || g.startsWith('UKG') || g.startsWith('NURSERY') ? g : `Grade ${g}`}
                  </option>
                ))}
              </select>
          </div>

          {/* Department Filter (Only for Grade XI/XII) */}
          {isHighGrade && departmentsForSelectedGrade.length > 0 && (
            <div className="form-group" style={{ margin: 0, minWidth: '130px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Department</label>
              <select 
                className="select-custom" 
                value={selectedDept} 
                onChange={(e) => handleDeptChange(e.target.value)}
                style={{ height: '38px', borderRadius: '8px' }}
              >
                {departmentsForSelectedGrade.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group" style={{ margin: 0, minWidth: '100px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Section</label>
            <select 
              className="select-custom" 
              value={section} 
              onChange={(e) => setSection(e.target.value)}
              style={{ height: '38px', borderRadius: '8px' }}
            >
              {activeSections.map(s => (
                <option key={s.id || s.name} value={s.name}>Section {s.name}</option>
              ))}
            </select>
          </div>

          <div className="search-bar-container" style={{ margin: 0, maxWidth: '280px', flex: 1, height: '38px', marginTop: '16px' }}>
            <Search size={16} className="search-bar-icon" />
            <input 
              type="text" 
              placeholder="Search roll, name..."
              className="search-bar-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', fontSize: '0.85rem', marginTop: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Marked Rate:</span>
            <strong style={{ color: 'hsl(var(--color-primary))', fontWeight: 700 }}>{rate}% ({marked}/{total} marked)</strong>
          </div>

        </div>
      </div>

      {/* Roster Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'hsl(var(--color-primary))' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading logs history...</p>
          </div>
        ) : roster.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>No Students Registered</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>There are no students registered or saved attendance records in Grade {studentClass} - Section {section}.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <table className="student-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-glass-active)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border-glass)' }}>
                <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Roll No</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student Name</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Class/Sec</th>
                  {isHighGrade && (
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</th>
                  )}
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Attendance Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((stu) => (
                  <tr key={stu.id} style={{ borderBottom: '1px solid var(--border-glass)' }} className="table-row-hover">
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700 }}>{stu.rollNumber}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700 }}>{stu.fullName}</td>

                    {/* Class/Sec */}
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid var(--border-glass)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {isHighGrade ? `${parseGradeName(stu.studentClass).baseGrade || baseClass}-${stu.section}` : `${stu.studentClass}-${stu.section}`}
                      </span>
                    </td>

                    {/* Department (Only for Grade XI/XII) */}
                    {isHighGrade && (
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          background: 'rgba(99, 102, 241, 0.08)', 
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          color: 'hsl(var(--color-primary))',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {parseGradeName(stu.studentClass).department || selectedDept || '—'}
                        </span>
                      </td>
                    )}
                    
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleStatusToggle(stu.id, 'Present')}
                          style={{
                            padding: '5px 10px', borderRadius: '4px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                            background: stu.attendanceStatus === 'Present' ? '#10b981' : 'rgba(255,255,255,0.02)',
                            color: stu.attendanceStatus === 'Present' ? '#ffffff' : 'var(--text-muted)',
                            border: stu.attendanceStatus === 'Present' ? 'none' : '1px solid var(--border-glass)'
                          }}
                        >
                          Present
                        </button>
                        <button 
                          onClick={() => handleStatusToggle(stu.id, 'Absent')}
                          style={{
                            padding: '5px 10px', borderRadius: '4px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                            background: stu.attendanceStatus === 'Absent' ? '#ef4444' : 'rgba(255,255,255,0.02)',
                            color: stu.attendanceStatus === 'Absent' ? '#ffffff' : 'var(--text-muted)',
                            border: stu.attendanceStatus === 'Absent' ? 'none' : '1px solid var(--border-glass)'
                          }}
                        >
                          Absent
                        </button>
                        <button 
                          onClick={() => handleStatusToggle(stu.id, 'Leave')}
                          style={{
                            padding: '5px 10px', borderRadius: '4px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                            background: stu.attendanceStatus === 'Leave' ? '#f59e0b' : 'rgba(255,255,255,0.02)',
                            color: stu.attendanceStatus === 'Leave' ? '#ffffff' : 'var(--text-muted)',
                            border: stu.attendanceStatus === 'Leave' ? 'none' : '1px solid var(--border-glass)'
                          }}
                        >
                          Leave
                        </button>
                        <button 
                          onClick={() => handleStatusToggle(stu.id, 'Late')}
                          style={{
                            padding: '5px 10px', borderRadius: '4px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                            background: stu.attendanceStatus === 'Late' ? '#f97316' : 'rgba(255,255,255,0.02)',
                            color: stu.attendanceStatus === 'Late' ? '#ffffff' : 'var(--text-muted)',
                            border: stu.attendanceStatus === 'Late' ? 'none' : '1px solid var(--border-glass)'
                          }}
                        >
                          Late
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px', width: '220px' }}>
                      <input 
                        type="text" 
                        placeholder="Add reason/remark..."
                        className="form-control"
                        value={stu.remarks || ''}
                        onChange={(e) => handleRemarksChange(stu.id, e.target.value)}
                        style={{ height: '32px', borderRadius: '6px', fontSize: '0.8rem', padding: '6px 10px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {roster.length > 0 && !loading && (
        <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '16px', gap: '12px' }}>
          <button 
            onClick={exportAttendanceCSV}
            className="btn-secondary"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', fontWeight: 700,
              border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-main)', cursor: 'pointer'
            }}
          >
            <Download size={18} /> Export CSV
          </button>
          <button 
            onClick={saveAttendanceUpdates}
            disabled={saving}
            className="btn-primary"
            style={{ 
              background: '#6366f1', border: 'none', 
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', fontWeight: 700
            }}
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={18} />} Update History Records
          </button>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// TAB C: STUDENT REPORT VIEW WITH PDF/CSV EXPORTS
// ============================================================================
export function StudentReportsView({ showToast }) {
  const [studentClass, setClass] = useState('All');
  const [section, setSection] = useState('All');
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeGrades, setActiveGrades] = useState([]);
  const [activeSections, setActiveSections] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('All');

  useEffect(() => {
    const loadGradesAndSections = async () => {
      const [grades, secs] = await Promise.all([
        fetchActiveGrades(),
        fetchActiveSections()
      ]);
      setActiveGrades(grades);
      setActiveSections(secs);
    };
    loadGradesAndSections();
  }, []);

  useEffect(() => {
    setSelectedStudentId('All');
  }, [studentClass, section, search, reports]);

  const displayedReports = selectedStudentId === 'All'
    ? reports
    : reports.filter(r => r.id === selectedStudentId);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        studentClass,
        section,
        search
      }).toString();
      const res = await fetch(`/api/attendance/reports/student?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error fetching report analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [studentClass, section, search]);

  // EXPORT TO CSV
  const handleExportCSV = () => {
    if (displayedReports.length === 0) {
      showToast('No records available to export.', 'error');
      return;
    }

    const headers = ['Roll No,Student Name,Class,Section,Total Working Days,Present Days,Absent Days,Leave Days,Late Days,Attendance Percentage'];
    const rows = displayedReports.map(r => 
      `"${r.rollNumber || '—'}","${r.fullName}","${r.studentClass}","${r.section}","${r.totalWorkingDays}","${r.present}","${r.absent}","${r.leave}","${r.late}","${r.attendancePercentage}%"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Student_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Spreadsheet download triggered successfully!', 'success');
  };

  // Export to PDF / Print Window
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Controls Card */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            
            <div className="form-group" style={{ margin: 0, minWidth: '130px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Class Filter</label>
              <select className="select-custom" value={studentClass} onChange={(e) => setClass(e.target.value)} style={{ height: '38px', borderRadius: '8px' }}>
                <option value="All">All Classes</option>
                {activeGrades.map(g => g.name).map(g => (
                  <option key={g} value={g}>
                    {g.startsWith('LKG') || g.startsWith('UKG') || g.startsWith('NURSERY') ? g : `Grade ${g}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0, minWidth: '120px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Section</label>
              <select className="select-custom" value={section} onChange={(e) => setSection(e.target.value)} style={{ height: '38px', borderRadius: '8px' }}>
                <option value="All">All Sections</option>
                {activeSections.map(s => (
                  <option key={s.id || s.name} value={s.name}>Section {s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0, minWidth: '160px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Select Student</label>
              <select className="select-custom" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} style={{ height: '38px', borderRadius: '8px' }}>
                <option value="All">All Students</option>
                {reports.map(r => (
                  <option key={r.id} value={r.id}>{r.fullName}</option>
                ))}
              </select>
            </div>

            <div className="search-bar-container" style={{ margin: 0, maxWidth: '280px', flex: 1, height: '38px', marginTop: '16px' }}>
              <Search size={16} className="search-bar-icon" />
              <input 
                type="text" 
                placeholder="Search name, admission..."
                className="search-bar-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
              />
            </div>

          </div>

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button onClick={handleExportCSV} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', fontSize: '0.85rem' }}>
              <Download size={16} /> Export CSV
            </button>
            <button onClick={handleExportPDF} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', fontSize: '0.85rem' }}>
              <FileText size={16} /> Print PDF
            </button>
          </div>

        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }} id="printable-report">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'hsl(var(--color-primary))' }} />
            <p style={{ color: 'var(--text-muted)' }}>Compiling statistics report...</p>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>No Students Registered</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              {studentClass === 'All' && section === 'All' 
                ? 'There are no students registered in the system.'
                : `There are no students registered in Grade ${studentClass} - Section ${section}.`
              }
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="student-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Roll No</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student Name</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Class/Sec</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Total Days</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center', color: '#10b981' }}>Present</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center', color: '#ef4444' }}>Absent</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center', color: '#f59e0b' }}>Leave</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center', color: '#f97316' }}>Late</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Rate %</th>
                </tr>
              </thead>
              <tbody>
                {displayedReports.map((r) => {
                  let rateColor = '#10b981'; // green
                  if (r.attendancePercentage < 75) rateColor = '#ef4444'; // red
                  else if (r.attendancePercentage < 90) rateColor = '#f59e0b'; // amber

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-glass)' }} className="table-row-hover">
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{r.rollNumber}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700 }}>{r.fullName}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem' }}>{r.studentClass}-{r.section}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>{r.totalWorkingDays}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', color: '#10b981' }}>{r.present}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', color: '#ef4444' }}>{r.absent}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', color: '#f59e0b' }}>{r.leave}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', color: '#f97316' }}>{r.late}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '50px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: `rgba(${rateColor === '#10b981' ? '16,185,129' : (rateColor === '#ef4444' ? '239,68,68' : '245,158,11')}, 0.1)`,
                          color: rateColor,
                          border: `1px solid ${rateColor}`
                        }}>
                          {r.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// ============================================================================
// TAB D: CLASS COHORT REPORT VIEW
// ============================================================================
export function ClassReportsView({ showToast }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/attendance/reports/class');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error compiling cohort averages.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Summary Analytics Cards grid */}
      <div className="admin-dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', width: '100%' }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>No cohort averages available.</div>
        ) : (
          reports.map((r, i) => {
            let color = 'hsl(var(--color-primary))';
            if (r.attendancePercentage < 75) color = 'hsl(var(--color-danger))';
            else if (r.attendancePercentage < 90) color = 'hsl(var(--color-warning))';

            return (
              <div className="glass-panel" key={i} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                      Grade {r.studentClass} - Section {r.section}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>Cohort Metrics</h3>
                  </div>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    border: `3px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color
                  }}>
                    {r.attendancePercentage}%
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Enrollment Size</span>
                    <strong>{r.totalStudents} Students</strong>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.attendancePercentage}%`, background: color, borderRadius: '4px' }}></div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

// ============================================================================
// TAB E: MONTHLY INTERACTIVE CALENDAR VIEW
// ============================================================================
export function MonthlyCalendarView({ showToast }) {
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [searchName, setSearchName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [calendarLogs, setCalendarLogs] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [activeGrades, setActiveGrades] = useState([]);
  const [activeSections, setActiveSections] = useState([]);

  useEffect(() => {
    const loadGradesAndSections = async () => {
      const [grades, secs] = await Promise.all([
        fetchActiveGrades(),
        fetchActiveSections()
      ]);
      setActiveGrades(grades);
      if (grades.length > 0) {
        setSelectedGrade(grades[0].name);
      }
      setActiveSections(secs);
      if (secs.length > 0) {
        setSelectedSection(secs[0].name);
      }
    };
    loadGradesAndSections();
  }, []);

  const grades = activeGrades.map(g => g.name);
  const sections = activeSections.map(s => s.name);

  // Load filtered students
  const loadFilteredStudents = async () => {
    try {
      const queryParams = new URLSearchParams({
        class: selectedGrade,
        section: selectedSection,
        search: searchName,
        limit: 100
      }).toString();
      const res = await fetch(`/api/students?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setStudentsList(data.students || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFilteredStudents();
  }, [selectedGrade, selectedSection, searchName]);

  useEffect(() => {
    if (studentsList.length > 0) {
      const stillExists = studentsList.some(s => s.id === selectedStudent);
      if (!stillExists) {
        setSelectedStudent(studentsList[0].id);
      }
    } else {
      setSelectedStudent('');
    }
  }, [studentsList]);

  // Fetch calendar logs
  const fetchCalendarLogs = async () => {
    if (!selectedStudent) return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        studentId: selectedStudent,
        month: selectedMonth,
        year: selectedYear
      }).toString();
      const res = await fetch(`/api/attendance/calendar?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setCalendarLogs(data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading calendar records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarLogs();
  }, [selectedStudent, selectedMonth, selectedYear]);

  // Generate calendar grid days
  // Month is 1-indexed (1-12)
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonthIndex = (month, year) => {
    // 0 = Sunday, 1 = Monday, etc.
    return new Date(year, month - 1, 1).getDay();
  };

  const daysCount = getDaysInMonth(selectedMonth, selectedYear);
  const startDayIndex = getFirstDayOfMonthIndex(selectedMonth, selectedYear);

  const daysGrid = [];
  // Fill empty spaces for offset days from previous month
  for (let i = 0; i < startDayIndex; i++) {
    daysGrid.push(null);
  }
  // Fill month days
  for (let d = 1; d <= daysCount; d++) {
    daysGrid.push(d);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Selectors Card */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Grade Class Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: '110px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Grade</label>
            <select className="select-custom" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} style={{ height: '38px', borderRadius: '8px' }}>
              {grades.map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: '100px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Section</label>
            <select className="select-custom" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} style={{ height: '38px', borderRadius: '8px' }}>
              {sections.map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>

          {/* Search by Name */}
          <div className="form-group" style={{ margin: 0, minWidth: '180px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Search Name</label>
            <input
              type="text"
              placeholder="Type student name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="form-control"
              style={{ height: '38px', borderRadius: '8px', padding: '8px 12px' }}
            />
          </div>

          {/* Student Selector (filtered) */}
          <div className="form-group" style={{ margin: 0, minWidth: '220px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Select Student</label>
            <select className="select-custom" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} style={{ height: '38px', borderRadius: '8px' }}>
              {studentsList.length === 0 && <option value="">No students found</option>}
              {studentsList.map(s => (
                <option key={s.id} value={s.id}>{s.fullName || s.name} ({s.admissionNumber})</option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="form-group" style={{ margin: 0, minWidth: '140px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Month</label>
            <select className="select-custom" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} style={{ height: '38px', borderRadius: '8px' }}>
              {monthNames.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="form-group" style={{ margin: 0, minWidth: '100px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Year</label>
            <select className="select-custom" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ height: '38px', borderRadius: '8px' }}>
              {Array.from({ length: 2050 - 2026 + 1 }, (_, i) => 2026 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Calendar Grid card */}
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', position: 'relative' }}>
        
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '24px' }}>
          {monthNames[selectedMonth - 1]} {selectedYear}
        </h3>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '280px' }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            
            {/* Days header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            {/* Grid days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
              {daysGrid.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} style={{ height: '52px' }} />;
                }

                // Match with attendanceLogs dictionary
                const padDay = day < 10 ? `0${day}` : `${day}`;
                const padMonth = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
                const dateKey = `${selectedYear}-${padMonth}-${padDay}`;
                
                const log = calendarLogs[dateKey];
                
                let dayBg = 'rgba(255,255,255,0.02)';
                let dayColor = 'var(--text-muted)';
                let dayBorder = '1px solid var(--border-glass)';
                
                if (log) {
                  if (log.status === 'Present') { dayBg = '#10b981'; dayColor = '#ffffff'; dayBorder = 'none'; }
                  else if (log.status === 'Absent') { dayBg = '#ef4444'; dayColor = '#ffffff'; dayBorder = 'none'; }
                  else if (log.status === 'Leave') { dayBg = '#f59e0b'; dayColor = '#ffffff'; dayBorder = 'none'; }
                  else if (log.status === 'Late') { dayBg = '#f97316'; dayColor = '#ffffff'; dayBorder = 'none'; }
                }

                return (
                  <div 
                    key={`day-${day}`}
                    onClick={() => log && setActiveTooltip(activeTooltip === dateKey ? null : dateKey)}
                    style={{
                      height: '52px',
                      borderRadius: '8px',
                      background: dayBg,
                      color: dayColor,
                      border: dayBorder,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      cursor: log ? 'pointer' : 'default',
                      position: 'relative',
                      boxShadow: log ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                      transition: 'transform 0.15s ease'
                    }}
                    className="calendar-day-box"
                  >
                    <span>{day}</span>
                    
                    {/* Active tooltip pop-up overlay */}
                    {activeTooltip === dateKey && log && (
                      <div style={{
                        position: 'absolute',
                        bottom: '62px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '200px',
                        padding: '12px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        zIndex: 100,
                        color: '#0f172a',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <strong style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', display: 'block', fontSize: '0.8rem', color: '#1e293b' }}>
                          {monthNames[selectedMonth - 1]} {day}, {selectedYear}
                        </strong>
                        <div>Status: <span style={{ fontWeight: 700, color: log.status === 'Present' ? '#10b981' : (log.status === 'Absent' ? '#ef4444' : '#f59e0b') }}>{log.status}</span></div>
                        {log.remarks && <div>Remarks: <span style={{ color: '#475569' }}>"{log.remarks}"</span></div>}
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>Marked by: {log.markedBy}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}



// ============================================================================
// TAB G: CLASS TIMETABLE LOG VIEW (READ ONLY)
// ============================================================================
export function ClassTimetableView({ showToast }) {
  const [timetables, setTimetables] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchGrade, setSearchGrade] = useState('All');
  const [searchSection, setSearchSection] = useState('All');
  const [activeGrades, setActiveGrades] = useState([]);
  const [activeSections, setActiveSections] = useState([]);

  useEffect(() => {
    const loadGradesAndSections = async () => {
      const [grades, secs] = await Promise.all([
        fetchActiveGrades(),
        fetchActiveSections()
      ]);
      setActiveGrades(grades);
      setActiveSections(secs);
    };
    loadGradesAndSections();
  }, []);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const fetchTimetableData = async () => {
    try {
      setLoading(true);
      const [resTimetables, resTimeslots] = await Promise.all([
        fetch('/api/academics/timetables'),
        fetch('/api/academics/timeslots')
      ]);

      if (resTimetables.ok && resTimeslots.ok) {
        const dataTimetables = await resTimetables.json();
        const dataTimeslots = await resTimeslots.json();
        setTimetables(dataTimetables);
        setTimeslots(dataTimeslots);
      } else {
        showToast('Failed to sync academic schedule.', 'error');
      }
    } catch (err) {
      console.error('Error fetching timetable data:', err);
      showToast('Network error while fetching schedules.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetableData();
  }, []);

  const cohortsWithTimetables = [...new Set(timetables.map(t => t.cohort))].sort();
  
  const filteredCohorts = cohortsWithTimetables.filter(cohort => {
    const matchesQuery = searchQuery.trim() === '' || cohort.toLowerCase().includes(searchQuery.toLowerCase());
    const [g, s] = cohort.split('-');
    const matchesGrade = searchGrade === 'All' || g === searchGrade;
    const matchesSection = searchSection === 'All' || s === searchSection;
    return matchesQuery && matchesGrade && matchesSection;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
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
            {activeGrades.map(g => g.name).map(g => (
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
            {activeSections.map(s => (
              <option key={s.id || s.name} value={s.name}>Section {s.name}</option>
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
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'hsl(var(--color-primary))' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading timetables...</p>
          </div>
        ) : filteredCohorts.length > 0 ? (
          filteredCohorts.map(cohort => {
            const classSlots = timetables.filter(t => t.cohort === cohort);
            return (
              <div key={cohort} className="glass-panel" style={{ padding: '24px', overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    Class Timetable: <span style={{ color: 'hsl(var(--color-primary))' }}>{cohort}</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Weekly schedule grid mapping all structured hours for Class {cohort}.
                  </p>
                </div>

                <table className="table-custom" style={{ width: '100%', minWidth: '700px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '150px' }}>Time Slot</th>
                      {daysOfWeek.map(d => <th key={d}>{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {timeslots.map(slot => (
                      <tr key={slot}>
                        <td style={{ fontWeight: 700, color: 'hsl(var(--color-primary))', fontSize: '0.8rem' }}>{slot}</td>
                        {daysOfWeek.map(day => {
                          const matched = classSlots.find(t => t.day === day && t.time === slot);
                          return (
                            <td key={day} style={{ padding: '8px' }}>
                              {matched ? (
                                <div style={{
                                  background: 'var(--bg-glass-active)',
                                  border: '1px solid var(--border-glass)',
                                  padding: '10px 12px',
                                  borderRadius: '10px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  position: 'relative'
                                }}>
                                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)', textTransform: 'capitalize' }}>{matched.subject}</strong>
                                  {matched.teacher && matched.teacher.trim() !== '' && matched.teacher.toLowerCase() !== 'n/a' && (
                                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <UserCheck size={10} /> {matched.teacher}
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
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No timetables scheduled yet or matching search criteria.
          </div>
        )}
      </div>

    </div>
  );
}

// ============================================================================
// TAB F: YEARLY ATTENDANCE TELEMETRY VIEW
// ============================================================================
export function YearlyAttendanceView({ showToast }) {
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [searchName, setSearchName] = useState('');
  const [yearlyStats, setYearlyStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeGrades, setActiveGrades] = useState([]);
  const [activeSections, setActiveSections] = useState([]);

  useEffect(() => {
    const loadGradesAndSections = async () => {
      const [grades, secs] = await Promise.all([
        fetchActiveGrades(),
        fetchActiveSections()
      ]);
      setActiveGrades(grades);
      if (grades.length > 0) {
        setSelectedGrade(grades[0].name);
      } else {
        setSelectedGrade('');
      }
      setActiveSections(secs);
      if (secs.length > 0) {
        setSelectedSection(secs[0].name);
      }
    };
    loadGradesAndSections();
  }, []);

  const grades = activeGrades.map(g => g.name);
  const sections = activeSections.map(s => s.name);

  // Load filtered students list (identical to MonthlyCalendarView)
  const loadFilteredStudents = async () => {
    try {
      const queryParams = new URLSearchParams({
        class: selectedGrade,
        section: selectedSection,
        search: searchName,
        limit: 100
      }).toString();
      const res = await fetch(`/api/students?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setStudentsList(data.students || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFilteredStudents();
  }, [selectedGrade, selectedSection, searchName]);

  useEffect(() => {
    if (studentsList.length > 0) {
      const stillExists = studentsList.some(s => s.id === selectedStudent);
      if (!stillExists) {
        setSelectedStudent(studentsList[0].id);
      }
    } else {
      setSelectedStudent('');
      setYearlyStats(null);
    }
  }, [studentsList]);

  // Fetch yearly student reports and extract stats for the selected student
  const fetchYearlyStats = async () => {
    if (!selectedStudent) {
      setYearlyStats(null);
      return;
    }
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        studentClass: selectedGrade,
        section: selectedSection
      }).toString();
      const res = await fetch(`/api/attendance/reports/student?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        const matchedReport = data.find(r => r.id === selectedStudent);
        setYearlyStats(matchedReport || null);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading yearly stats.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYearlyStats();
  }, [selectedStudent, selectedGrade, selectedSection]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Selectors Card */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Grade/Class Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: '110px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Grade</label>
            <select className="select-custom" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} style={{ height: '38px', borderRadius: '8px' }}>
              {grades.map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: '100px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Section</label>
            <select className="select-custom" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} style={{ height: '38px', borderRadius: '8px' }}>
              {sections.map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>

          {/* Search by Name */}
          <div className="form-group" style={{ margin: 0, minWidth: '180px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Search Name</label>
            <input
              type="text"
              placeholder="Type student name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="form-control"
              style={{ height: '38px', borderRadius: '8px', padding: '8px 12px' }}
            />
          </div>

          {/* Student Selector */}
          <div className="form-group" style={{ margin: 0, minWidth: '220px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Select Student</label>
            <select className="select-custom" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} style={{ height: '38px', borderRadius: '8px' }}>
              {studentsList.length === 0 && <option value="">No students found</option>}
              {studentsList.map(s => (
                <option key={s.id} value={s.id}>{s.fullName || s.name} ({s.admissionNumber})</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Yearly Report Stats Cards */}
      <div className="glass-panel" style={{ padding: '32px', position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '280px' }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : yearlyStats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Student Header Summary Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                  {yearlyStats.fullName}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Admission Number: <strong style={{ color: 'var(--text-main)' }}>{yearlyStats.admissionNumber}</strong> | Class: <strong style={{ color: 'var(--text-main)' }}>Grade {yearlyStats.studentClass}-{yearlyStats.section}</strong>
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Yearly Attendance</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: yearlyStats.attendancePercentage >= 75 ? '#10b981' : '#ef4444' }}>
                    {yearlyStats.attendancePercentage}%
                  </div>
                </div>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: `conic-gradient(${yearlyStats.attendancePercentage >= 75 ? '#10b981' : '#ef4444'} ${yearlyStats.attendancePercentage}%, rgba(255,255,255,0.05) 0)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'var(--bg-glass-active)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-main)'
                  }}>
                    {yearlyStats.present + yearlyStats.late}/{yearlyStats.totalWorkingDays}d
                  </div>
                </div>
              </div>
            </div>

            {/* Counts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
              
              {/* Present Days Card */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#10b981' }}>Present</span>
                  <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    <CheckCircle size={18} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1' }}>{yearlyStats.present}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>days attended fully</span>
                </div>
              </div>

              {/* Late Days Card */}
              <div style={{
                background: 'rgba(249, 115, 22, 0.08)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#f97316' }}>Late</span>
                  <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
                    <Clock size={18} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1' }}>{yearlyStats.late}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>days marked late arrival</span>
                </div>
              </div>

              {/* Leave Days Card */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#f59e0b' }}>Leave</span>
                  <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                    <Calendar size={18} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1' }}>{yearlyStats.leave}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>days on approved leave</span>
                </div>
              </div>

              {/* Absent Days Card */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#ef4444' }}>Absent</span>
                  <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                    <AlertCircle size={18} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1' }}>{yearlyStats.absent}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>days unexcused absence</span>
                </div>
              </div>

            </div>

            {/* Total Summary Footer Card */}
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px dashed var(--border-glass)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} style={{ color: 'hsl(var(--color-primary))' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Total school session days evaluated: <strong style={{ color: 'var(--text-main)' }}>{yearlyStats.totalWorkingDays} days</strong>
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: yearlyStats.attendancePercentage >= 75 ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
                {yearlyStats.attendancePercentage >= 75 ? 'Compliance: Good Standing' : 'Compliance: Action Required'}
              </span>
            </div>

          </div>
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            No attendance records found for this student.
          </div>
        )}
      </div>

    </div>
  );
}

