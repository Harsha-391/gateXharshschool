import React, { useState } from 'react';
import { hasPermission, isSuperAdmin } from '../utils/permissions';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  UserCog,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Settings,
  School,
  UserPlus,
  UserPlus2,
  List,
  Shield,
  ClipboardCheck,
  Calculator,
  Receipt,
  Wallet,
  Banknote,
  ClipboardList,
  ShieldAlert,
  Plus,
  Bell,
  BarChart3,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Clock,
  Calendar,
  History,
  FileSpreadsheet,
  Award,
  RefreshCw,
  QrCode,
  CheckCircle
} from 'lucide-react';

export default function Sidebar({ 
  activeView, 
  setActiveView, 
  isCollapsed, 
  setIsCollapsed, 
  mobileOpen, 
  setMobileOpen, 
  schoolDetails, 
  isAdmin, 
  onAdminLogout, 
  adminView, 
  setAdminView, 
  isDeveloperAdmin,
  onDeveloperAdminLogout,
  onBackToMain,
  userProfile
}) {
  const [adminCoreOpen, setAdminCoreOpen] = useState(false);
  const [adminAttendanceOpen, setAdminAttendanceOpen] = useState(() => {
    return typeof adminView === 'string' && (adminView === 'employee-attendance' || adminView === 'attendance' || adminView === 'attendance-history');
  });
  const [adminAcademicOpen, setAdminAcademicOpen] = useState(() => {
    return typeof adminView === 'string' && (['academic-manager', 'academic-class-timetable', 'academic-teacher-timetable', 'academic-exams', 'academic-exams-history', 'academic-published-exam', 'academic-published-timetable'].includes(adminView));
  });
  const [adminAcademicActivitiesOpen, setAdminAcademicActivitiesOpen] = useState(() => {
    return typeof adminView === 'string' && (['academic-activities', 'academic-events', 'academic-notices', 'academic-holidays', 'academic-calendar'].includes(adminView));
  });
  const [adminRecepOpen, setAdminRecepOpen] = useState(false);
  const [adminFinanceOpen, setAdminFinanceOpen] = useState(() => {
    return typeof adminView === 'string' && ([
      'collect-fees', 'fee-structure', 
      'payroll', 'teacher-pay-structure', 'staff-pay', 'staff-pay-structure'
    ].includes(adminView));
  });
  const [adminExpensesOpen, setAdminExpensesOpen] = useState(() => {
    return typeof adminView === 'string' && (adminView.startsWith('expense-'));
  });
  const [adminResultsOpen, setAdminResultsOpen] = useState(() => {
    return typeof adminView === 'string' && (adminView.startsWith('results-') || adminView === 'academic-results' || adminView === 'results-history');
  });
  const [adminGradeOpen, setAdminGradeOpen] = useState(() => {
    return typeof adminView === 'string' && (adminView.startsWith('grade-') || adminView === 'add-grade' || adminView === 'academic-grade-subjects');
  });
  const menuItems = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'school', label: 'School', icon: School },
    { id: 'academic-calendar', label: 'Academic Calendar', icon: Calendar }
  ];

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div className="brand-icon">
            <GraduationCap size={24} />
          </div>
          <span className="brand-name">
            {isDeveloperAdmin 
              ? 'Dev Dashboard' 
              : (isAdmin 
                  ? ((userProfile?.role === 'Main Admin' || userProfile?.role === 'Admin Dashboard' || userProfile?.role === 'Principal' || !userProfile?.role) 
                      ? 'Admin Dashboard' 
                      : `${userProfile.role} Dashboard`)
                  : (schoolDetails?.name || 'Dashboard')
                )
            }
          </span>
        </div>
        <button 
          onClick={() => {
            if (window.innerWidth <= 900) {
              setMobileOpen(false);
            } else {
              setIsCollapsed(true);
            }
          }}
          className="sidebar-close-btn"
          aria-label="Close navigation drawer"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'inherit',
            flexShrink: 0
          }}
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">

        {isDeveloperAdmin ? (
          <>
            <button
              onClick={() => {
                setActiveView('dashboard');
                setMobileOpen(false);
              }}
              className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={20} className="flex-shrink-0" />
              <span className="nav-label">Platform Dashboard</span>
            </button>
            <button
              onClick={() => {
                setActiveView('school');
                setMobileOpen(false);
              }}
              className={`nav-item ${activeView === 'school' ? 'active' : ''}`}
            >
              <School size={20} className="flex-shrink-0" />
              <span className="nav-label">Schools Registry</span>
            </button>
          </>
        ) : isAdmin ? (
          <>

            {hasPermission('overview', 'view') && (
              <button
                onClick={() => {
                  setAdminView('overview');
                  setMobileOpen(false);
                }}
                className={`nav-item ${adminView === 'overview' ? 'active' : ''}`}
              >
                <List size={20} className="flex-shrink-0" />
                <span className="nav-label">Admin Panel</span>
              </button>
            )}

            {(hasPermission('student-directory', 'view') || hasPermission('teacher-directory', 'view') || hasPermission('staff-directory', 'view')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminCoreOpen(!adminCoreOpen)}
                  className={`nav-item ${['students', 'teachers', 'staff'].includes(adminView) ? 'active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Users size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Core Registers</span>
                  </div>
                  {adminCoreOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                </button>
                {adminCoreOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                    {hasPermission('student-directory', 'view') && (
                      <button
                        onClick={() => { setAdminView('students'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'students' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <Users size={18} className="flex-shrink-0" />
                        <span className="nav-label">Student Directory</span>
                      </button>
                    )}
                    {hasPermission('teacher-directory', 'view') && (
                      <button
                        onClick={() => { setAdminView('teachers'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'teachers' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <UserCheck size={18} className="flex-shrink-0" />
                        <span className="nav-label">Staff Directory</span>
                      </button>
                    )}
                    {hasPermission('staff-directory', 'view') && (
                      <button
                        onClick={() => { setAdminView('staff'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'staff' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <UserCog size={18} className="flex-shrink-0" />
                        <span className="nav-label">Employee Directory</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {(hasPermission('grade-settings', 'view') || hasPermission('grade-subjects', 'view')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminGradeOpen(!adminGradeOpen)}
                  className={`nav-item ${['grade-list', 'add-grade', 'grade-departments', 'grade-dept-mapping', 'grade-academic-settings', 'section-utility', 'academic-grade-subjects'].includes(adminView) ? 'active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
                    <GraduationCap size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Grade Management</span>
                  </div>
                  {adminGradeOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                </button>
                {adminGradeOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                    {hasPermission('grade-settings', 'view') && (
                      <button
                        onClick={() => { setAdminView('grade-list'); setMobileOpen(false); }}
                        className={`nav-item ${['grade-list', 'add-grade', 'grade-departments', 'grade-dept-mapping', 'grade-academic-settings', 'section-utility'].includes(adminView) ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <Settings size={18} className="flex-shrink-0" />
                        <span className="nav-label">Grade Settings</span>
                      </button>
                    )}
                    {hasPermission('grade-subjects', 'view') && (
                      <button
                        onClick={() => { setAdminView('academic-grade-subjects'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'academic-grade-subjects' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <BookOpen size={18} className="flex-shrink-0" />
                        <span className="nav-label">Grade Subjects</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {(hasPermission('register-student', 'create') || hasPermission('register-student', 'view') || 
              hasPermission('add-staff', 'create') || hasPermission('add-staff', 'view') || 
              hasPermission('add-employee', 'create') || hasPermission('add-employee', 'view')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminRecepOpen(!adminRecepOpen)}
                  className="nav-item"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
                    <UserPlus size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Registry Admissions</span>
                  </div>
                  {adminRecepOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                </button>
                {adminRecepOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                    {(hasPermission('register-student', 'create') || hasPermission('register-student', 'view')) && (
                      <button
                        onClick={() => { setAdminView('register-student'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'register-student' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <UserPlus size={18} className="flex-shrink-0" />
                        <span className="nav-label">Register Student</span>
                      </button>
                    )}
                    {(hasPermission('add-staff', 'create') || hasPermission('add-staff', 'view')) && (
                      <button
                        onClick={() => { setAdminView('add-teacher'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'add-teacher' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <UserPlus size={18} className="flex-shrink-0" />
                        <span className="nav-label">Add Staff</span>
                      </button>
                    )}
                    {(hasPermission('add-employee', 'create') || hasPermission('add-employee', 'view')) && (
                      <button
                        onClick={() => { setAdminView('add-staff'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'add-staff' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <UserCog size={18} className="flex-shrink-0" />
                        <span className="nav-label">Add Employee</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {hasPermission('student-manager', 'view') && (
              <button
                onClick={() => { setAdminView('student-manager'); setMobileOpen(false); }}
                className={`nav-item ${adminView === 'student-manager' ? 'active' : ''}`}
              >
                <UserPlus2 size={20} className="flex-shrink-0" />
                <span className="nav-label">Student Manager</span>
              </button>
            )}

            {(hasPermission('employee-attendance', 'view') || hasPermission('attendance', 'view') || hasPermission('attendance-history', 'view')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminAttendanceOpen(!adminAttendanceOpen)}
                  className={`nav-item ${['employee-attendance', 'attendance', 'attendance-history'].includes(adminView) ? 'active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
                    <ClipboardCheck size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Attendance</span>
                  </div>
                  {adminAttendanceOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                </button>
                {adminAttendanceOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                    {hasPermission('employee-attendance', 'view') && (
                      <button
                        onClick={() => { setAdminView('employee-attendance'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'employee-attendance' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <QrCode size={18} className="flex-shrink-0" />
                        <span className="nav-label">Attendance Manager</span>
                      </button>
                    )}
                    {hasPermission('attendance', 'view') && (
                      <button
                        onClick={() => { setAdminView('attendance'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'attendance' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <ClipboardCheck size={18} className="flex-shrink-0" />
                        <span className="nav-label">School Attendance</span>
                      </button>
                    )}
                    {hasPermission('attendance-history', 'view') && (
                      <button
                        onClick={() => { setAdminView('attendance-history'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'attendance-history' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <History size={18} className="flex-shrink-0" />
                        <span className="nav-label">Attendance History</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {(hasPermission('academic-manager', 'view') || hasPermission('published-timetable', 'view') || hasPermission('published-exam', 'view')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminAcademicOpen(!adminAcademicOpen)}
                  className={`nav-item ${['academic-manager', 'academic-class-timetable', 'academic-teacher-timetable', 'academic-exams', 'academic-exams-history', 'academic-published-timetable', 'academic-published-exam'].includes(adminView) ? 'active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
                    <BookOpen size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Academic Manager</span>
                  </div>
                  {adminAcademicOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                </button>
                {adminAcademicOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                    {hasPermission('academic-manager', 'view') && (
                      <button
                        onClick={() => { setAdminView('academic-manager'); setMobileOpen(false); }}
                        className={`nav-item ${['academic-manager', 'academic-class-timetable', 'academic-teacher-timetable', 'academic-exams', 'academic-exams-history'].includes(adminView) ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <BookOpen size={18} className="flex-shrink-0" />
                        <span className="nav-label">Academic Manager</span>
                      </button>
                    )}
                    {hasPermission('published-timetable', 'view') && (
                      <button
                        onClick={() => { setAdminView('academic-published-timetable'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'academic-published-timetable' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <Calendar size={18} className="flex-shrink-0" />
                        <span className="nav-label">Published Timetable</span>
                      </button>
                    )}
                    {hasPermission('published-exam', 'view') && (
                      <button
                        onClick={() => { setAdminView('academic-published-exam'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'academic-published-exam' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <ClipboardList size={18} className="flex-shrink-0" />
                        <span className="nav-label">Published Exam</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {(hasPermission('academic-activities', 'view') || hasPermission('academic-calendar', 'view')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminAcademicActivitiesOpen(!adminAcademicActivitiesOpen)}
                  className={`nav-item ${['academic-activities', 'academic-events', 'academic-notices', 'academic-holidays', 'academic-calendar'].includes(adminView) ? 'active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
                    <Calendar size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Academic Activities</span>
                  </div>
                  {adminAcademicActivitiesOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                </button>
                {adminAcademicActivitiesOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                    {hasPermission('academic-activities', 'view') && (
                      <button
                        onClick={() => { setAdminView('academic-activities'); setMobileOpen(false); }}
                        className={`nav-item ${['academic-activities', 'academic-events', 'academic-notices', 'academic-holidays'].includes(adminView) ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <Calendar size={18} className="flex-shrink-0" />
                        <span className="nav-label">Academic Activities</span>
                      </button>
                    )}
                    {hasPermission('academic-calendar', 'view') && (
                      <button
                        onClick={() => { setAdminView('academic-calendar'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'academic-calendar' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <Calendar size={18} className="flex-shrink-0" />
                        <span className="nav-label">Academic Calendar</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {(hasPermission('results-manager', 'view') || hasPermission('results-history', 'view')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminResultsOpen(!adminResultsOpen)}
                  className={`nav-item ${['results-manager', 'results-analytics', 'results-marks-entry', 'results-report-cards', 'academic-results', 'results-history'].includes(adminView) ? 'active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
                    <GraduationCap size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Results Manager</span>
                  </div>
                  {adminResultsOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                </button>
                {adminResultsOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                    {hasPermission('results-manager', 'view') && (
                      <button
                        onClick={() => { setAdminView('results-manager'); setMobileOpen(false); }}
                        className={`nav-item ${['results-manager', 'results-analytics', 'results-marks-entry', 'results-report-cards', 'academic-results'].includes(adminView) ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <FileSpreadsheet size={18} className="flex-shrink-0" />
                        <span className="nav-label">Results Manager</span>
                      </button>
                    )}
                    {hasPermission('results-history', 'view') && (
                      <button
                        onClick={() => { setAdminView('results-history'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'results-history' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <History size={18} className="flex-shrink-0" />
                        <span className="nav-label">Academic History</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {hasPermission('finance', 'view') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminFinanceOpen(!adminFinanceOpen)}
                  className={`nav-item ${[
                    'collect-fees', 'fee-structure', 
                    'payroll', 'teacher-pay-structure', 'staff-pay', 'staff-pay-structure'
                  ].includes(adminView) ? 'active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Wallet size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Finance</span>
                  </div>
                  {adminFinanceOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                </button>
                {adminFinanceOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                    
                    <span className="nav-label" style={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', padding: '8px 12px 4px' }}>Student Fees</span>
                    <button
                      onClick={() => { setAdminView('collect-fees'); setMobileOpen(false); }}
                      className={`nav-item ${adminView === 'collect-fees' ? 'active' : ''}`}
                      style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                    >
                      <Receipt size={18} className="flex-shrink-0" />
                      <span className="nav-label">Collect Fees</span>
                    </button>
                    <button
                      onClick={() => { setAdminView('fee-structure'); setMobileOpen(false); }}
                      className={`nav-item ${adminView === 'fee-structure' ? 'active' : ''}`}
                      style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                    >
                      <Calculator size={18} className="flex-shrink-0" />
                      <span className="nav-label">Fee Structure</span>
                    </button>

                    <span className="nav-label" style={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', padding: '8px 12px 4px' }}>Payroll</span>
                    <button
                      onClick={() => { setAdminView('payroll'); setMobileOpen(false); }}
                      className={`nav-item ${adminView === 'payroll' ? 'active' : ''}`}
                      style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                    >
                      <Banknote size={18} className="flex-shrink-0" />
                      <span className="nav-label">Manage Payroll</span>
                    </button>
                    <button
                      onClick={() => { setAdminView('teacher-pay-structure'); setMobileOpen(false); }}
                      className={`nav-item ${adminView === 'teacher-pay-structure' ? 'active' : ''}`}
                      style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                    >
                      <Calculator size={18} className="flex-shrink-0" />
                      <span className="nav-label">Teacher Pay Structure</span>
                    </button>
                    <button
                      onClick={() => { setAdminView('staff-pay'); setMobileOpen(false); }}
                      className={`nav-item ${adminView === 'staff-pay' ? 'active' : ''}`}
                      style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                    >
                      <Banknote size={18} className="flex-shrink-0" />
                      <span className="nav-label">Pay Staff</span>
                    </button>
                    <button
                      onClick={() => { setAdminView('staff-pay-structure'); setMobileOpen(false); }}
                      className={`nav-item ${adminView === 'staff-pay-structure' ? 'active' : ''}`}
                      style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                    >
                      <Calculator size={18} className="flex-shrink-0" />
                      <span className="nav-label">Staff Pay Structure</span>
                    </button>

                  </div>
                )}
              </div>
            )}

            {(hasPermission('expense-dashboard', 'view') || hasPermission('expense-all-expenses', 'view') || hasPermission('expense-tracker', 'view') || hasPermission('expense-history', 'view')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminExpensesOpen(!adminExpensesOpen)}
                  className={`nav-item ${['expense-dashboard', 'expense-all-expenses', 'expense-tracker', 'expense-history'].includes(adminView) ? 'active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Wallet size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Expenses</span>
                  </div>
                  {adminExpensesOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                </button>
                {adminExpensesOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                    {hasPermission('expense-dashboard', 'view') && (
                      <button
                        onClick={() => { setAdminView('expense-dashboard'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'expense-dashboard' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <LayoutDashboard size={18} className="flex-shrink-0" />
                        <span className="nav-label">Expense Panel</span>
                      </button>
                    )}
                    {hasPermission('expense-all-expenses', 'view') && (
                      <button
                        onClick={() => { setAdminView('expense-all-expenses'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'expense-all-expenses' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <ClipboardList size={18} className="flex-shrink-0" />
                        <span className="nav-label">Expenses</span>
                      </button>
                    )}
                    {hasPermission('expense-tracker', 'view') && (
                      <button
                        onClick={() => { setAdminView('expense-tracker'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'expense-tracker' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <TrendingDown size={18} className="flex-shrink-0" />
                        <span className="nav-label">Expense Tracker</span>
                      </button>
                    )}
                    {hasPermission('expense-history', 'view') && (
                      <button
                        onClick={() => { setAdminView('expense-history'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'expense-history' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <History size={18} className="flex-shrink-0" />
                        <span className="nav-label">Expense History</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {hasPermission('income', 'view') && (
              <button
                onClick={() => { setAdminView('income'); setMobileOpen(false); }}
                className={`nav-item ${adminView === 'income' ? 'active' : ''}`}
              >
                <CreditCard size={20} className="flex-shrink-0" />
                <span className="nav-label">Income Tracker</span>
              </button>
            )}

            {hasPermission('financial-reports', 'view') && (
              <button
                onClick={() => { setAdminView('reports'); setMobileOpen(false); }}
                className={`nav-item ${adminView === 'reports' ? 'active' : ''}`}
              >
                <List size={20} className="flex-shrink-0" />
                <span className="nav-label">Financial Reports</span>
              </button>
            )}

            {(isSuperAdmin() || hasPermission('roles-permissions', 'view')) && (
              <button
                onClick={() => { setAdminView('roles-permissions'); setMobileOpen(false); }}
                className={`nav-item ${adminView === 'roles-permissions' ? 'active' : ''}`}
              >
                <Shield size={20} className="flex-shrink-0" />
                <span className="nav-label">Roles & Permissions</span>
              </button>
            )}

          </>
        ) : (
          <>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileOpen(false);
                  }}
                  className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
            {sessionStorage.getItem('from_dev_admin') === 'true' && (
              <button
                onClick={() => {
                  sessionStorage.clear();
                  sessionStorage.setItem('role', 'Developer Admin');
                  sessionStorage.setItem('portal_role', 'Developer Admin');
                  sessionStorage.setItem('username', 'dev@admin.com');
                  sessionStorage.setItem('name', 'Platform Owner');
                  localStorage.removeItem('tenant_subdomain');
                  setMobileOpen(false);
                  window.location.href = '/';
                }}
                className="nav-item"
                style={{ color: 'hsl(var(--color-primary))', marginTop: '16px', border: '1px dashed rgba(99, 102, 241, 0.4)', background: 'rgba(99, 102, 241, 0.04)', borderRadius: '8px' }}
              >
                <Shield size={20} className="flex-shrink-0" style={{ color: 'hsl(var(--color-primary))' }} />
                <span className="nav-label" style={{ fontWeight: 700 }}>Back to Dev Admin</span>
              </button>
            )}
          </>
        )}
      </nav>

      <div 
        className="sidebar-profile" 
        onClick={() => {
          if (isDeveloperAdmin) {
            setActiveView('profile');
          } else if (isAdmin) {
            setAdminView('profile');
          } else {
            setActiveView('profile');
          }
          setMobileOpen(false);
        }}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-glass)' }}
      >
        <div className="profile-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-form)', border: '1.5px solid var(--border-glass)', color: '#000000' }}>
          {userProfile?.photo ? (
            <img src={userProfile.photo} alt={userProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (userProfile?.name || 'AD').substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="profile-details" style={{ display: isCollapsed ? 'none' : 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span className="profile-name" style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>{userProfile?.name || 'User'}</span>
          <span className="profile-role" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile?.role || 'Guest'}</span>
        </div>
      </div>
    </aside>
  );
}
