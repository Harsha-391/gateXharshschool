import React, { useState } from 'react';
import './Sidebar.css';
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
  Tags,
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
  Briefcase,
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
  const prefetchApi = (url) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(url).catch(() => {});
  };

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
      'collect-fees', 'fee-structure', 'fees-history',
      'payroll', 'payroll-history', 'teacher-pay-structure', 'staff-pay', 'staff-pay-structure'
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
                <span className="nav-label">Panel</span>
              </button>
            )}

            {hasPermission('grade-management', 'view') && (
              <button
                onClick={() => { setAdminView('grade-list'); setMobileOpen(false); }}
                className={`nav-item ${['grade-list', 'add-grade', 'grade-departments', 'grade-dept-mapping', 'grade-academic-settings', 'academic-grade-subjects'].includes(adminView) ? 'active' : ''}`}
              >
                <GraduationCap size={20} className="flex-shrink-0" />
                <span className="nav-label">Grade Management</span>
              </button>
            )}

            {hasPermission('student-manager', 'view') && (
              <button
                onClick={() => { setAdminView('student-manager'); setMobileOpen(false); }}
                onMouseEnter={() => {
                  prefetchApi('/api/grades/active-options');
                }}
                className={`nav-item ${adminView === 'student-manager' ? 'active' : ''}`}
              >
                <UserPlus2 size={20} className="flex-shrink-0" />
                <span className="nav-label">Student Manager</span>
              </button>
            )}

            {hasPermission('designation-manager', 'view') && (
              <button
                onClick={() => { setAdminView('designation-manage'); setMobileOpen(false); }}
                className={`nav-item ${adminView === 'designation-manage' ? 'active' : ''}`}
              >
                <Briefcase size={20} className="flex-shrink-0" />
                <span className="nav-label">Designation Manage</span>
              </button>
            )}

            {(() => {
              const userRole = userProfile?.role || localStorage.getItem('role') || localStorage.getItem('portal_role');
              const isUserAdmin = userRole === 'Main Admin' || userRole === 'Principal' || userRole === 'Admin Dashboard';
              
              if (isUserAdmin) {
                const hasTLeaveMgmt = hasPermission('teacher-leave-management', 'view');
                const hasSLeaveMgmt = hasPermission('staff-leave-management', 'view');
                if (!hasTLeaveMgmt && !hasSLeaveMgmt) return null;

                return (
                  <button
                    type="button"
                    onClick={() => { setAdminView('leave-management'); setMobileOpen(false); }}
                    className={`nav-item ${adminView === 'leave-management' ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', cursor: 'pointer' }}
                  >
                    <Calendar size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Leave Management</span>
                  </button>
                );
              } else {
                return (
                  <button
                    type="button"
                    onClick={() => { setAdminView('my-leave'); setMobileOpen(false); }}
                    className={`nav-item ${adminView === 'my-leave' ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', cursor: 'pointer' }}
                  >
                    <Calendar size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Leave Management</span>
                  </button>
                );
              }
            })()}

            {(() => {
              const userRole = userProfile?.role || localStorage.getItem('role') || localStorage.getItem('portal_role');
              const isUserAdmin = userRole === 'Main Admin' || userRole === 'Principal' || userRole === 'Admin Dashboard';
              
              if (isUserAdmin) {
                return (
                  <button
                    type="button"
                    onClick={() => { setAdminView('report-management'); setMobileOpen(false); }}
                    className={`nav-item ${adminView === 'report-management' ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', cursor: 'pointer' }}
                  >
                    <ClipboardList size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Work Reports</span>
                  </button>
                );
              } else {
                const userType = userProfile?.userType || localStorage.getItem('userType') || '';
                const isTeacher = userType === 'Teacher' || userRole === 'Teacher';
                if (!isTeacher) return null;

                return (
                  <button
                    type="button"
                    onClick={() => { setAdminView('my-reports'); setMobileOpen(false); }}
                    className={`nav-item ${adminView === 'my-reports' ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', cursor: 'pointer' }}
                  >
                    <ClipboardList size={20} className="flex-shrink-0" />
                    <span className="nav-label" style={{ fontWeight: 600 }}>Work Reports</span>
                  </button>
                );
              }
            })()}

            {(hasPermission('student-directory', 'view') || hasPermission('staff-directory', 'view') || hasPermission('employee-directory', 'view') || hasPermission('teacher-directory', 'view')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminCoreOpen(!adminCoreOpen)}
                  className={`nav-item ${['students', 'staff', 'teachers', 'employees'].includes(adminView) ? 'parent-active' : ''}`}
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
                        onMouseEnter={() => {
                          prefetchApi('/api/students?limit=8&page=1&status=All&class=All');
                          prefetchApi('/api/grades/active-options');
                          prefetchApi('/api/grades/sections');
                        }}
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
                        onMouseEnter={() => {
                          prefetchApi('/api/teachers');
                        }}
                        className={`nav-item ${adminView === 'teachers' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <UserCheck size={18} className="flex-shrink-0" />
                        <span className="nav-label">Teacher Directory</span>
                      </button>
                    )}
                    {hasPermission('staff-directory', 'view') && (
                      <button
                        onClick={() => { setAdminView('staff'); setMobileOpen(false); }}
                        onMouseEnter={() => {
                          prefetchApi('/api/staff?limit=8&page=1&status=All');
                          prefetchApi('/api/rbac/roles');
                          prefetchApi('/api/grades/departments');
                        }}
                        className={`nav-item ${adminView === 'staff' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <UserCheck size={18} className="flex-shrink-0" />
                        <span className="nav-label">Staff Directory</span>
                      </button>
                    )}
                    {hasPermission('employee-directory', 'view') && (
                      <button
                        onClick={() => { setAdminView('employees'); setMobileOpen(false); }}
                        onMouseEnter={() => {
                          prefetchApi('/api/employees');
                        }}
                        className={`nav-item ${adminView === 'employees' ? 'active' : ''}`}
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


            {(hasPermission('register-student', 'create') || hasPermission('register-student', 'view') || 
              hasPermission('add-staff', 'create') || hasPermission('add-staff', 'view') || 
              hasPermission('register-teacher', 'create') || hasPermission('register-teacher', 'view') ||
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
                    {(hasPermission('register-teacher', 'create') || hasPermission('register-teacher', 'view')) && (
                      <button
                        onClick={() => { setAdminView('register-teacher'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'register-teacher' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <UserPlus size={18} className="flex-shrink-0" />
                        <span className="nav-label">Register Teacher</span>
                      </button>
                    )}
                    {(hasPermission('add-staff', 'create') || hasPermission('add-staff', 'view')) && (
                      <button
                        onClick={() => { setAdminView('add-staff'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'add-staff' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <UserPlus size={18} className="flex-shrink-0" />
                        <span className="nav-label">Add Staff</span>
                      </button>
                    )}
                    {(hasPermission('add-employee', 'create') || hasPermission('add-employee', 'view')) && (
                      <button
                        onClick={() => { setAdminView('add-employee'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'add-employee' ? 'active' : ''}`}
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


            {(() => {
              const isClassTeacher = userProfile?.isClassTeacher === true || userProfile?.isClassTeacher === 'Yes' || userProfile?.isClassTeacher === 1;
              const hasEmpAtt = hasPermission('employee-attendance', 'view');
              const hasStuAtt = hasPermission('attendance', 'view') && (userProfile?.role === 'Teacher' ? isClassTeacher : true);
              const hasAttHist = hasPermission('attendance-history', 'view') && (userProfile?.role === 'Teacher' ? isClassTeacher : true);
              if (!hasEmpAtt && !hasStuAtt && !hasAttHist) return null;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setAdminAttendanceOpen(!adminAttendanceOpen)}
                    className={`nav-item ${['employee-attendance', 'attendance', 'attendance-history'].includes(adminView) ? 'parent-active' : ''}`}
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
                      {hasEmpAtt && (
                        <button
                          onClick={() => { setAdminView('employee-attendance'); setMobileOpen(false); }}
                          className={`nav-item ${adminView === 'employee-attendance' ? 'active' : ''}`}
                          style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                        >
                          <QrCode size={18} className="flex-shrink-0" />
                          <span className="nav-label">Staff/Employee Attendance</span>
                        </button>
                      )}
                      {hasStuAtt && (
                        <button
                          onClick={() => { setAdminView('attendance'); setMobileOpen(false); }}
                          className={`nav-item ${adminView === 'attendance' ? 'active' : ''}`}
                          style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                        >
                          <ClipboardCheck size={18} className="flex-shrink-0" />
                          <span className="nav-label">Student Attendance</span>
                        </button>
                      )}
                      {hasAttHist && (
                        <button
                          onClick={() => { setAdminView('attendance-history'); setMobileOpen(false); }}
                          className={`nav-item ${adminView === 'attendance-history' ? 'active' : ''}`}
                          style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                        >
                          <History size={18} className="flex-shrink-0" />
                          <span className="nav-label">Student Attendance History</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}



            {(hasPermission('academic-manager', 'view') || hasPermission('published-timetable', 'view') || hasPermission('published-exam', 'view')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminAcademicOpen(!adminAcademicOpen)}
                  className={`nav-item ${['academic-manager', 'academic-class-timetable', 'academic-teacher-timetable', 'academic-exams', 'academic-exams-history', 'academic-published-timetable', 'academic-published-exam'].includes(adminView) ? 'parent-active' : ''}`}
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
                  className={`nav-item ${['academic-activities', 'academic-events', 'academic-notices', 'academic-holidays', 'academic-calendar'].includes(adminView) ? 'parent-active' : ''}`}
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

            {(hasPermission('results-manager', 'view') || hasPermission('results-marks-entry', 'view') || hasPermission('results-history', 'view')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminResultsOpen(!adminResultsOpen)}
                  className={`nav-item ${['results-manager', 'results-analytics', 'results-marks-entry', 'results-report-cards', 'academic-results', 'results-history'].includes(adminView) ? 'parent-active' : ''}`}
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
                        className={`nav-item ${['results-manager', 'results-analytics', 'results-report-cards', 'academic-results'].includes(adminView) ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <FileSpreadsheet size={18} className="flex-shrink-0" />
                        <span className="nav-label">Results Manager</span>
                      </button>
                    )}
                    {hasPermission('results-marks-entry', 'view') && (
                      <button
                        onClick={() => { setAdminView('results-marks-entry'); setMobileOpen(false); }}
                        className={`nav-item ${adminView === 'results-marks-entry' ? 'active' : ''}`}
                        style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                      >
                        <BookOpen size={18} className="flex-shrink-0" />
                        <span className="nav-label">Marks Entry</span>
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
                    'collect-fees', 'fee-structure', 'fees-history', 
                    'staff-payroll', 'staff-pay-structure', 'teacher-payroll', 'teacher-pay-structure',
                    'employee-payroll', 'employee-pay-structure', 'payroll-history'
                  ].includes(adminView) ? 'parent-active' : ''}`}
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
                    <button
                      onClick={() => { setAdminView('fees-history'); setMobileOpen(false); }}
                      className={`nav-item ${adminView === 'fees-history' ? 'active' : ''}`}
                      style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                    >
                      <History size={18} className="flex-shrink-0" />
                      <span className="nav-label">Fees History</span>
                    </button>

                    {(hasPermission('staff-payroll', 'view') || 
                      hasPermission('staff-pay-structure', 'view') || 
                      hasPermission('teacher-payroll', 'view') || 
                      hasPermission('teacher-pay-structure', 'view') || 
                      hasPermission('employee-payroll', 'view') || 
                      hasPermission('employee-pay-structure', 'view') || 
                      hasPermission('payroll-history', 'view')) && (
                      <>
                        <span className="nav-label" style={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', padding: '8px 12px 4px' }}>Payroll</span>
                        
                        {(hasPermission('staff-payroll', 'view') || hasPermission('staff-pay-structure', 'view')) && (
                          <button
                            onClick={() => { setAdminView('staff-payroll-hub'); setMobileOpen(false); }}
                            className={`nav-item ${['staff-payroll-hub', 'staff-payroll', 'staff-pay-structure'].includes(adminView) ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <Users size={18} className="flex-shrink-0" />
                            <span className="nav-label">Staff</span>
                          </button>
                        )}

                        {(hasPermission('teacher-payroll', 'view') || hasPermission('teacher-pay-structure', 'view')) && (
                          <button
                            onClick={() => { setAdminView('teacher-payroll-hub'); setMobileOpen(false); }}
                            className={`nav-item ${['teacher-payroll-hub', 'teacher-payroll', 'teacher-pay-structure'].includes(adminView) ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <UserCheck size={18} className="flex-shrink-0" />
                            <span className="nav-label">Teacher</span>
                          </button>
                        )}

                        {(hasPermission('employee-payroll', 'view') || hasPermission('employee-pay-structure', 'view')) && (
                          <button
                            onClick={() => { setAdminView('employee-payroll-hub'); setMobileOpen(false); }}
                            className={`nav-item ${['employee-payroll-hub', 'employee-payroll', 'employee-pay-structure'].includes(adminView) ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <UserCog size={18} className="flex-shrink-0" />
                            <span className="nav-label">Employee</span>
                          </button>
                        )}

                        {hasPermission('payroll-history', 'view') && (
                          <button
                            onClick={() => { setAdminView('payroll-history'); setMobileOpen(false); }}
                            className={`nav-item ${adminView === 'payroll-history' ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <History size={18} className="flex-shrink-0" />
                            <span className="nav-label">Payroll History</span>
                          </button>
                        )}
                      </>
                    )}

                  </div>
                )}
              </div>
            )}

            {(hasPermission('expense-dashboard', 'view') || hasPermission('expense-all-expenses', 'view') || hasPermission('expense-tracker', 'view') || hasPermission('expense-history', 'view')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setAdminExpensesOpen(!adminExpensesOpen)}
                  className={`nav-item ${['expense-dashboard', 'expense-all-expenses', 'expense-history'].includes(adminView) ? 'parent-active' : ''}`}
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

            {hasPermission('auxiliary-income', 'view') && (
              <button
                onClick={() => { setAdminView('auxiliary-income'); setMobileOpen(false); }}
                className={`nav-item ${adminView === 'auxiliary-income' ? 'active' : ''}`}
              >
                <Tags size={20} className="flex-shrink-0" />
                <span className="nav-label" style={{ fontWeight: 600 }}>Auxiliary & Other Income</span>
              </button>
            )}

            {hasPermission('financial-reports', 'view') && (
              <div className="sidebar-section-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', padding: '4px 4px 0' }}>
                  Revenue & Reports
                </span>
                <button
                  onClick={() => { setAdminView('reports'); setMobileOpen(false); }}
                  className={`nav-item ${adminView === 'reports' ? 'active' : ''}`}
                  style={{ fontWeight: 500 }}
                >
                  <List size={20} className="flex-shrink-0" />
                  <span className="nav-label">Financial Reports</span>
                </button>
              </div>
            )}

            {(isSuperAdmin() || hasPermission('security-audit', 'view') || hasPermission('roles-permissions', 'view') || hasPermission('settings', 'view')) && (
              <div className="sidebar-section-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', padding: '4px 4px 0' }}>
                  Security & Privacy
                </span>
                {(isSuperAdmin() || hasPermission('security-audit', 'view')) && (
                  <button
                    onClick={() => { setAdminView('security-audit'); setMobileOpen(false); }}
                    onMouseEnter={() => {
                      prefetchApi('/api/rbac/audit-logs');
                    }}
                    className={`nav-item ${adminView === 'security-audit' ? 'active' : ''}`}
                    style={{ fontWeight: 500 }}
                  >
                    <ClipboardList size={20} className="flex-shrink-0" />
                    <span className="nav-label">Security Audit Ledger</span>
                  </button>
                )}
                {(isSuperAdmin() || hasPermission('roles-permissions', 'view')) && (
                  <button
                    onClick={() => { setAdminView('roles-permissions'); setMobileOpen(false); }}
                    onMouseEnter={() => {
                      prefetchApi('/api/rbac/roles');
                      prefetchApi('/api/rbac/users');
                      prefetchApi('/api/rbac/audit-logs');
                    }}
                    className={`nav-item ${adminView === 'roles-permissions' ? 'active' : ''}`}
                    style={{ fontWeight: 500 }}
                  >
                    <Shield size={20} className="flex-shrink-0" />
                    <span className="nav-label">Roles & Permissions</span>
                  </button>
                )}
                {(isSuperAdmin() || hasPermission('settings', 'view')) && (
                  <button
                    onClick={() => { setAdminView('settings'); setMobileOpen(false); }}
                    className={`nav-item ${adminView === 'settings' ? 'active' : ''}`}
                    style={{ fontWeight: 500 }}
                  >
                    <Settings size={20} className="flex-shrink-0" />
                    <span className="nav-label">Settings</span>
                  </button>
                )}
              </div>
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
                  onMouseEnter={() => {
                    if (item.id === 'students') {
                      prefetchApi('/api/students?limit=8&page=1&status=All&class=All');
                      prefetchApi('/api/grades/active-options');
                      prefetchApi('/api/grades/sections');
                    } else if (item.id === 'academic-calendar') {
                      prefetchApi('/api/academics/timetables');
                      prefetchApi('/api/academics/timeslots');
                    } else if (item.id === 'school') {
                      prefetchApi('/api/school');
                    }
                  }}
                  className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
            {localStorage.getItem('from_dev_admin') === 'true' && (
              <button
                onClick={() => {
                  const devToken = localStorage.getItem('dev_token');
                  const authKeys = [
                    'token', 'role', 'portal_role', 'username', 'name', 
                    'permissions', 'overrides', 'school_name', 'school_subdomain', 
                    'from_dev_admin', 'dev_token', 'admin_view'
                  ];
                  authKeys.forEach(k => localStorage.removeItem(k));
                  localStorage.setItem('role', 'Developer Admin');
                  localStorage.setItem('portal_role', 'Developer Admin');
                  localStorage.setItem('username', 'dev@admin.com');
                  localStorage.setItem('name', 'Platform Owner');
                  if (devToken) {
                    localStorage.setItem('token', devToken);
                  }
                  localStorage.removeItem('tenant_subdomain');
                  setMobileOpen(false);
                  
                  const parts = window.location.hostname.split('.');
                  const isSubdomainResolved = parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost') || (parts.length === 1 && !['localhost', 'platform', 'www', 'admin'].includes(parts[0].toLowerCase()));
                  let targetUrl = '/';
                  if (isSubdomainResolved) {
                    const baseHostname = parts.length === 2 && parts[1] === 'localhost' ? 'localhost' : (parts.length === 1 ? 'localhost' : parts.slice(1).join('.'));
                    targetUrl = `${window.location.protocol}//${baseHostname}${window.location.port ? `:${window.location.port}` : ''}/`;
                  }
                  window.location.href = targetUrl;
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
