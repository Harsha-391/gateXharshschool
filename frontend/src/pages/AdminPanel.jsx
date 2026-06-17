import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserCog, 
  Shield, 
  LogOut, 
  LayoutDashboard,
  ClipboardCheck,
  List,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  Receipt,
  UserPlus,
  Venus,
  Mars,
  RefreshCw
} from 'lucide-react';
import StudentDirectory from './StudentDirectory';
import TeacherList from './TeacherList';
import StaffDirectory from './StaffDirectory';
import AcademicPanel from './AcademicPanel';
import { 
  StudentReportsView, 
  ClassReportsView, 
  MonthlyCalendarView
} from './TeacherPanel';
import {
  MarkAttendanceView,
  AttendanceHistoryView
} from './AdminAttendanceViews';
import { fetchActiveGrades, fetchActiveSections } from '../utils/grades';
import {
  CollectFeesView,
  FeeStructureView,
  PayrollView,
  TeacherSalaryStructureView,
  ExpensesView,
  IncomeView,
  ReportsView,
  StaffPaymentsView,
  StaffPaymentStructureView
} from './AccountantPanel';
import RegisterStudent from './RegisterStudent';
import StudentManager from './StudentManager';
import AddTeacher from './AddTeacher';
import AddStaff from './AddStaff';
import ExpensePanel from './ExpensePanel';
import AttendanceManager from './AttendanceManager';
import RolesPermissions from './RolesPermissions';
import GradeManagement from './GradeManagement';
import UserProfile from './UserProfile';

// ─── Overview Stats Card (Theme-Aware) ──────────────────────────────────────
function GenderRatioBar({ maleCount, femaleCount, total }) {
  const malePct = total > 0 ? Math.round((maleCount / total) * 100) : 50;
  const femalePct = 100 - malePct;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {/* Track */}
      <div style={{
        height: '7px', borderRadius: '99px', overflow: 'hidden',
        background: 'var(--border-glass)', display: 'flex'
      }}>
        <div style={{
          width: `${malePct}%`,
          background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
          borderRadius: total === 0 ? '99px' : '99px 0 0 99px',
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
        }} />
        <div style={{
          width: `${femalePct}%`,
          background: 'linear-gradient(90deg, #ec4899, #f472b6)',
          borderRadius: total === 0 ? '99px' : '0 99px 99px 0',
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
        }} />
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Male: <strong style={{ color: '#3b82f6' }}>{maleCount}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: '3px', opacity: 0.7 }}>({malePct}%)</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ec4899', flexShrink: 0 }} />
          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Female: <strong style={{ color: '#ec4899' }}>{femaleCount}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: '3px', opacity: 0.7 }}>({femalePct}%)</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function StatOverviewCard({ icon, accentColor, title, subtitle, total, maleCount, femaleCount, loading, onClick }) {
  return (
    <div
      onClick={onClick}
      className="glass-panel"
      style={{
        cursor: 'pointer',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-glass)',
        background: 'var(--bg-card)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Header: icon + label + total */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Icon */}
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
            background: `${accentColor}18`,
            color: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${accentColor}30`
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              {subtitle}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {title}
            </div>
          </div>
        </div>

        {/* Total count bubble */}
        <div style={{
          textAlign: 'center',
          minWidth: '56px',
          padding: '8px 12px',
          borderRadius: '12px',
          background: `${accentColor}12`,
          border: `1px solid ${accentColor}25`,
          flexShrink: 0
        }}>
          {loading ? (
            <div style={{ width: '24px', height: '18px', background: 'var(--border-glass)', borderRadius: '4px', margin: '0 auto' }} />
          ) : (
            <>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: accentColor, lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
            </>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border-glass)' }} />

      {/* Gender breakdown */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ height: '7px', borderRadius: '99px', background: 'var(--border-glass)' }} />
          <div style={{ height: '12px', borderRadius: '4px', background: 'var(--border-glass)', width: '70%' }} />
        </div>
      ) : (
        <GenderRatioBar maleCount={maleCount} femaleCount={femaleCount} total={total} />
      )}
    </div>
  );
}

export default function AdminPanel({ setActiveView, onLogout, adminView, setAdminView, onBackToMain, userProfile, setUserProfile }) {
  const [editingStudentForRegister, setEditingStudentForRegister] = useState(null);
  const [directoryKey, setDirectoryKey] = useState(0);
  // Roster/Filter States for Admin Attendance Panel
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [studentSearch, setStudentSearch] = useState('');
  const [attendanceTab, setAttendanceTab] = useState('mark-attendance');
  const [notification, setNotification] = useState(null);

  // Overview stats state
  const [overviewStats, setOverviewStats] = useState({
    students: { total: 0, male: 0, female: 0 },
    staff: { total: 0, male: 0, female: 0 },
    employees: { total: 0, male: 0, female: 0 }
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchOverviewStats = async () => {
    setStatsLoading(true);
    try {
      // Fetch teachers (staff/faculty)
      const [teachersRes, staffRes] = await Promise.all([
        fetch('/api/teachers?limit=9999&status=All'),
        fetch('/api/staff')
      ]);

      let students = { total: 0, male: 0, female: 0 };
      let staffStats = { total: 0, male: 0, female: 0 };
      let employeeStats = { total: 0, male: 0, female: 0 };

      if (teachersRes.ok) {
        const data = await teachersRes.json();
        const list = data.teachers || [];
        staffStats = {
          total: list.length,
          male: list.filter(t => (t.gender || '').toLowerCase() === 'male').length,
          female: list.filter(t => (t.gender || '').toLowerCase() === 'female').length
        };
      }

      if (staffRes.ok) {
        const list = await staffRes.json();
        employeeStats = {
          total: list.length,
          male: list.filter(s => (s.gender || '').toLowerCase() === 'male').length,
          female: list.filter(s => (s.gender || '').toLowerCase() === 'female').length
        };
      }

      // Students: fetch with status=All to get total count
      try {
        const stuRes = await fetch('/api/students?limit=9999&status=All&class=All');
        if (stuRes.ok) {
          const data = await stuRes.json();
          const list = data.students || [];
          students = {
            total: data.totalCount || list.length,
            male: list.filter(s => (s.gender || '').toLowerCase() === 'male').length,
            female: list.filter(s => (s.gender || '').toLowerCase() === 'female').length
          };
        }
      } catch(e) {
        // Students may have no class filter by default - use 0
      }

      setOverviewStats({ students, staff: staffStats, employees: employeeStats });
    } catch (err) {
      console.error('Error fetching overview stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewStats();
  }, []);

  // Sync adminView with attendanceTab and active grades
  useEffect(() => {
    if (adminView === 'attendance') {
      setAttendanceTab('mark-attendance');
      const loadGradesAndSections = async () => {
        const [grades, secs] = await Promise.all([
          fetchActiveGrades(),
          fetchActiveSections()
        ]);
        if (grades.length > 0) {
          setSelectedClass(grades[0].name);
        } else {
          setSelectedClass('');
        }
        if (secs.length > 0) {
          setSelectedSection(secs[0].name);
        }
      };
      loadGradesAndSections();
    }
  }, [adminView]);

  // Reset student editing state when navigating away from register-student
  useEffect(() => {
    if (adminView !== 'register-student') {
      setEditingStudentForRegister(null);
    }
  }, [adminView]);

  // Toast Notification helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const renderAdminContent = () => {
    if (adminView && adminView.startsWith('expense-')) {
      const subView = adminView.replace('expense-', '');
      return (
        <ExpensePanel
          setActiveView={setActiveView}
          onLogout={() => setAdminView('students')}
          expenseView={subView}
          setExpenseView={(v) => setAdminView('expense-' + v)}
          hideHeader={true}
        />
      );
    }

    switch (adminView) {
      case 'academic-manager':
      case 'academic-class-timetable':
      case 'academic-teacher-timetable':
      case 'academic-exams':
      case 'academic-exams-history':
      case 'academic-exam-timetable':
      case 'academic-published-timetable':
      case 'academic-published-exam':
      case 'academic-activities':
      case 'academic-events':
      case 'academic-notices':
      case 'academic-holidays':
      case 'academic-calendar':
      case 'academic-results':
      case 'academic-reports':
      case 'academic-grade-subjects':
      case 'results-manager':
      case 'results-analytics':
      case 'results-marks-entry':
      case 'results-report-cards':
      case 'results-history':
        return <AcademicPanel subView={adminView} setAdminView={setAdminView} />;
      case 'grade-list':
      case 'add-grade':
      case 'grade-departments':
      case 'grade-dept-mapping':
      case 'grade-academic-settings':
      case 'section-utility':
        return <GradeManagement currentSubView={adminView} setAdminView={setAdminView} showToast={showToast} />;
      case 'overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)' }}>Directory Overview</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Live headcount and gender distribution across all categories</p>
              </div>
              <button
                onClick={fetchOverviewStats}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600,
                  border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
                  color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-main)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {/* ── ROW 1: Simple Count Cards ───────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>

              {/* Total Students */}
              <div
                className="glass-panel"
                onClick={() => setAdminView('students')}
                style={{
                  cursor: 'pointer', borderRadius: '16px', padding: '24px 20px',
                  border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', gap: '18px',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                  background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(99,102,241,0.2)'
                }}>
                  <Users size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Total Students</div>
                  {statsLoading
                    ? <div style={{ height: '28px', width: '50px', borderRadius: '6px', background: 'var(--border-glass)' }} />
                    : <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>{overviewStats.students.total}</div>
                  }
                </div>
              </div>

              {/* Total Staff */}
              <div
                className="glass-panel"
                onClick={() => setAdminView('teachers')}
                style={{
                  cursor: 'pointer', borderRadius: '16px', padding: '24px 20px',
                  border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', gap: '18px',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                  background: 'rgba(16,185,129,0.1)', color: '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(16,185,129,0.2)'
                }}>
                  <UserCheck size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Total Staff</div>
                  {statsLoading
                    ? <div style={{ height: '28px', width: '50px', borderRadius: '6px', background: 'var(--border-glass)' }} />
                    : <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{overviewStats.staff.total}</div>
                  }
                </div>
              </div>

              {/* Total Employees */}
              <div
                className="glass-panel"
                onClick={() => setAdminView('staff')}
                style={{
                  cursor: 'pointer', borderRadius: '16px', padding: '24px 20px',
                  border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', gap: '18px',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                  background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(245,158,11,0.2)'
                }}>
                  <UserCog size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Total Employees</div>
                  {statsLoading
                    ? <div style={{ height: '28px', width: '50px', borderRadius: '6px', background: 'var(--border-glass)' }} />
                    : <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{overviewStats.employees.total}</div>
                  }
                </div>
              </div>

            </div>

            {/* ── ROW 2: Gender Ratio Cards ────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>

              {/* Students Ratio */}
              <div className="glass-panel" style={{
                borderRadius: '16px', padding: '20px',
                border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
                display: 'flex', flexDirection: 'column', gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Students</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>Gender Ratio</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ textAlign: 'center', padding: '6px 10px', borderRadius: '8px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>{statsLoading ? '–' : overviewStats.students.male}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>Male</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '6px 10px', borderRadius: '8px', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ec4899', lineHeight: 1 }}>{statsLoading ? '–' : overviewStats.students.female}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>Female</div>
                    </div>
                  </div>
                </div>
                <div style={{ height: '1px', background: 'var(--border-glass)' }} />
                {statsLoading
                  ? <div style={{ height: '7px', borderRadius: '99px', background: 'var(--border-glass)' }} />
                  : <GenderRatioBar maleCount={overviewStats.students.male} femaleCount={overviewStats.students.female} total={overviewStats.students.total} />
                }
              </div>

              {/* Staff Ratio */}
              <div className="glass-panel" style={{
                borderRadius: '16px', padding: '20px',
                border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
                display: 'flex', flexDirection: 'column', gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Staff</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>Gender Ratio</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ textAlign: 'center', padding: '6px 10px', borderRadius: '8px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>{statsLoading ? '–' : overviewStats.staff.male}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>Male</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '6px 10px', borderRadius: '8px', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ec4899', lineHeight: 1 }}>{statsLoading ? '–' : overviewStats.staff.female}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>Female</div>
                    </div>
                  </div>
                </div>
                <div style={{ height: '1px', background: 'var(--border-glass)' }} />
                {statsLoading
                  ? <div style={{ height: '7px', borderRadius: '99px', background: 'var(--border-glass)' }} />
                  : <GenderRatioBar maleCount={overviewStats.staff.male} femaleCount={overviewStats.staff.female} total={overviewStats.staff.total} />
                }
              </div>

              {/* Employees Ratio */}
              <div className="glass-panel" style={{
                borderRadius: '16px', padding: '20px',
                border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
                display: 'flex', flexDirection: 'column', gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employees</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>Gender Ratio</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ textAlign: 'center', padding: '6px 10px', borderRadius: '8px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>{statsLoading ? '–' : overviewStats.employees.male}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>Male</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '6px 10px', borderRadius: '8px', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ec4899', lineHeight: 1 }}>{statsLoading ? '–' : overviewStats.employees.female}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>Female</div>
                    </div>
                  </div>
                </div>
                <div style={{ height: '1px', background: 'var(--border-glass)' }} />
                {statsLoading
                  ? <div style={{ height: '7px', borderRadius: '99px', background: 'var(--border-glass)' }} />
                  : <GenderRatioBar maleCount={overviewStats.employees.male} femaleCount={overviewStats.employees.female} total={overviewStats.employees.total} />
                }
              </div>

            </div>

          </div>
        );
      case 'students':
        return (
          <StudentDirectory 
            key={`students-${directoryKey}`} 
            readOnly={false} 
            onAddClick={() => {
              setEditingStudentForRegister(null);
              setAdminView('register-student');
            }} 
            onEditClick={(student) => {
              setEditingStudentForRegister(student);
              setAdminView('register-student');
            }}
          />
        );
      case 'teachers':
        return <TeacherList key={`teachers-${directoryKey}`} setActiveView={setActiveView} readOnly={false} onAddClick={() => setAdminView('add-teacher')} />;
      case 'staff':
        return <StaffDirectory key={directoryKey} readOnly={false} onAddClick={() => setAdminView('add-staff')} />;
      case 'employee-attendance':
        return <AttendanceManager />;

      case 'collect-fees':
        return <CollectFeesView showToast={showToast} />;
      case 'fee-structure':
        return <FeeStructureView showToast={showToast} />;
      case 'payroll':
        return <PayrollView showToast={showToast} />;
      case 'teacher-pay-structure':
        return <TeacherSalaryStructureView showToast={showToast} />;
      case 'staff-pay':
        return <StaffPaymentsView showToast={showToast} />;
      case 'staff-pay-structure':
        return <StaffPaymentStructureView showToast={showToast} />;
      case 'expenses':
        return <ExpensesView showToast={showToast} />;
      case 'income':
        return <IncomeView showToast={showToast} />;
      case 'reports':
        return <ReportsView showToast={showToast} />;
      case 'register-student':
        return (
          <RegisterStudent 
            editData={editingStudentForRegister}
            setActiveView={(view) => { 
              if (view === 'students') { 
                setDirectoryKey(k => k + 1); 
                setAdminView('students'); 
              } else {
                setActiveView(view); 
              }
            }} 
          />
        );
      case 'student-manager':
        return <StudentManager showToast={showToast} />;
      case 'add-teacher':
        return <AddTeacher setActiveView={(view) => { if (view === 'teachers' || view === 'teacher-list') { setDirectoryKey(k => k + 1); setAdminView('teachers'); } else setActiveView(view); }} />;
      case 'add-staff':
        return <AddStaff setActiveView={(view) => { if (view === 'staff') { setDirectoryKey(k => k + 1); setAdminView('staff'); } else setActiveView(view); }} />;

      case 'attendance-history':
        return (
          <AttendanceHistoryView 
            date={selectedDate}
            showToast={showToast}
          />
        );
      case 'class-reports':
        return (
          <ClassReportsView showToast={showToast} />
        );
      case 'attendance':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Sub-Tab Bar for Admin Attendance */}
            <div className="glass-panel" style={{ padding: '8px', display: 'flex', gap: '8px', overflowX: 'auto', borderRadius: '12px' }}>
              <button 
                onClick={() => {
                  setAttendanceTab('mark-attendance');
                  setAdminView('attendance');
                }}
                className={`tab-btn-custom ${attendanceTab === 'mark-attendance' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: attendanceTab === 'mark-attendance' ? 'rgba(hsl(var(--color-primary)), 0.1)' : 'transparent',
                  color: attendanceTab === 'mark-attendance' ? 'hsl(var(--color-primary))' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                <ClipboardCheck size={16} /> Mark Attendance
              </button>
              
              <button 
                onClick={() => {
                  setAttendanceTab('student-reports');
                  setAdminView('attendance');
                }}
                className={`tab-btn-custom ${attendanceTab === 'student-reports' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: attendanceTab === 'student-reports' ? 'rgba(hsl(var(--color-success)), 0.1)' : 'transparent',
                  color: attendanceTab === 'student-reports' ? 'hsl(var(--color-success))' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Users size={16} /> Student Reports
              </button>
              
              <button 
                onClick={() => {
                  setAttendanceTab('monthly-calendar');
                  setAdminView('attendance');
                }}
                className={`tab-btn-custom ${attendanceTab === 'monthly-calendar' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: attendanceTab === 'monthly-calendar' ? 'rgba(hsl(var(--color-info)), 0.1)' : 'transparent',
                  color: attendanceTab === 'monthly-calendar' ? 'hsl(var(--color-info))' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Calendar size={16} /> Monthly Attendance
              </button>

            </div>

            {/* Notification Toast inside View */}
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

            {/* Dynamic Attendance Sub-views */}
            {attendanceTab === 'mark-attendance' && (
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
            )}

            {attendanceTab === 'student-reports' && (
              <StudentReportsView showToast={showToast} />
            )}

            {attendanceTab === 'monthly-calendar' && (
              <MonthlyCalendarView showToast={showToast} />
            )}
          </div>
        );
      case 'roles-permissions':
        return <RolesPermissions />;
      case 'profile':
        return <UserProfile onProfileUpdate={setUserProfile} showToast={showToast} onLogout={onLogout} />;
      default:
        return (
          <StudentDirectory 
            readOnly={false} 
            onAddClick={() => {
              setEditingStudentForRegister(null);
              setAdminView('register-student');
            }} 
            onEditClick={(student) => {
              setEditingStudentForRegister(student);
              setAdminView('register-student');
            }}
          />
        );
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Admin Content */}
      {renderAdminContent()}
    </div>
  );
}
