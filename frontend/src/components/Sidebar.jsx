import React, { useState, useEffect } from 'react';
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

  const [hasPublishedCalendarEvents, setHasPublishedCalendarEvents] = useState(false);

  useEffect(() => {
    const checkCalendarPublishStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const tenant = localStorage.getItem('tenant_subdomain');
        if (!token) return;
        const res = await fetch(`/api/academics/calendar/published?tenantId=${tenant || ''}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHasPublishedCalendarEvents(Array.isArray(data) && data.length > 0);
        }
      } catch (err) {
        console.error('Error checking calendar publish status:', err.message);
      }
    };
    checkCalendarPublishStatus();
    const interval = setInterval(checkCalendarPublishStatus, 5000); // Poll every 5 seconds for real-time visibility toggling
    return () => clearInterval(interval);
  }, []);

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

  const getIconColor = (viewName) => {
    switch (viewName) {
      case 'overview':
      case 'dashboard':
        return '#FF8C42'; // Orange
      
      // Academic Section
      case 'academic-manager':
      case 'academic-class-timetable':
      case 'academic-teacher-timetable':
      case 'academic-exams':
      case 'academic-exams-history':
      case 'academic-published-timetable':
      case 'academic-published-exam':
        return '#FF8C42'; // Indigo/Blue
        
      case 'academic-activities':
      case 'academic-events':
      case 'academic-notices':
      case 'academic-holidays':
      case 'academic-calendar':
        return '#8B5CF6'; // Purple
        
      case 'results-manager':
      case 'results-analytics':
      case 'results-marks-entry':
      case 'results-report-cards':
      case 'academic-results':
      case 'results-history':
        return '#10B981'; // Green
        
      // Account Section
      case 'employee-attendance':
      case 'attendance':
      case 'attendance-history':
        return '#0D9488'; // Teal
        
      case 'finance':
      case 'collect-fees':
      case 'fee-structure':
      case 'fees-history':
      case 'staff-payroll':
      case 'staff-payroll-hub':
      case 'staff-pay-structure':
      case 'teacher-payroll':
      case 'teacher-payroll-hub':
      case 'teacher-pay-structure':
      case 'employee-payroll':
      case 'employee-payroll-hub':
      case 'employee-pay-structure':
      case 'payroll-history':
        return '#F59E0B'; // Yellow/Orange
        
      case 'expense-dashboard':
      case 'expense-all-expenses':
      case 'expense-tracker':
      case 'expense-history':
        return '#EF4444'; // Red/Pink
        
      case 'auxiliary-income':
        return '#8B5CF6'; // Purple/Magenta
        
      case 'reports':
      case 'financial-reports':
        return '#2563EB'; // Blue
        
      // Management Section
      case 'grade-list':
      case 'add-grade':
      case 'grade-departments':
      case 'grade-dept-mapping':
      case 'grade-academic-settings':
      case 'academic-grade-subjects':
        return '#8B5CF6'; // Purple
        
      case 'student-manager':
        return '#3B82F6'; // Blue
        
      case 'designation-manage':
        return '#F59E0B'; // Orange
        
      // Reception Section
      case 'core-registers':
      case 'students':
      case 'teachers':
      case 'staff':
      case 'employees':
        return '#3B82F6'; // Blue
        
      case 'registry-admissions':
      case 'register-student':
      case 'add-staff':
      case 'register-teacher':
      case 'add-employee':
        return '#FF8C42'; // Orange
        
      // Member Report Section
      case 'leave-management':
        return '#10B981'; // Green
        
      case 'report-management':
      case 'my-reports':
        return '#3B82F6'; // Blue
        
      // Security & Privacy
      case 'roles-permissions':
        return '#3B82F6'; // Blue
        
      case 'settings':
        return '#64748B'; // Muted Slate
        
      default:
        return '#64748B';
    }
  };

  const menuItems = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'school', label: 'School', icon: School },
    { id: 'academic-calendar', label: 'Academic Calendar', icon: Calendar }
  ];
    
  const rawSchoolName = schoolDetails?.name || localStorage.getItem('school_name') || 'GateX School';
  const nameParts = rawSchoolName.split(' ');
  const firstWord = nameParts[0];
  const restOfName = nameParts.slice(1).join(' ');

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div className="brand-icon-wrapper">
            <GraduationCap size={24} />
          </div>
          <div style={{ display: isCollapsed ? 'none' : 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.15 }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rawSchoolName}>
              <span style={{ color: '#FF8C42' }}>{firstWord}</span> {restOfName}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
              ERP System
            </span>
          </div>
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
            <button
              onClick={() => {
                setActiveView('plans');
                setMobileOpen(false);
              }}
              className={`nav-item ${activeView === 'plans' ? 'active' : ''}`}
            >
              <CreditCard size={20} className="flex-shrink-0" />
              <span className="nav-label">Subscription Plans</span>
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
                style={{ marginBottom: '8px' }}
              >
                <LayoutDashboard size={20} className="flex-shrink-0" style={{ color: getIconColor('overview') }} />
                <span className="nav-label">Panel</span>
              </button>
            )}

            {/* Management Section */}
            {(hasPermission('grade-management', 'view') || 
              hasPermission('student-manager', 'view') || 
              hasPermission('designation-manager', 'view')) && (
              <div className="sidebar-section-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span className="section-title">
                  Management
                </span>
                {hasPermission('grade-management', 'view') && (
                  <button
                    onClick={() => { setAdminView('grade-list'); setMobileOpen(false); }}
                    className={`nav-item ${['grade-list', 'add-grade', 'grade-departments', 'grade-dept-mapping', 'grade-academic-settings', 'academic-grade-subjects'].includes(adminView) ? 'active' : ''}`}
                  >
                    <GraduationCap size={20} className="flex-shrink-0" style={{ color: ['grade-list', 'add-grade', 'grade-departments', 'grade-dept-mapping', 'grade-academic-settings', 'academic-grade-subjects'].includes(adminView) ? '#FF8C42' : getIconColor('grade-list') }} />
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
                    <UserPlus2 size={20} className="flex-shrink-0" style={{ color: adminView === 'student-manager' ? '#FF8C42' : getIconColor('student-manager') }} />
                    <span className="nav-label">Student Manager</span>
                  </button>
                )}
                {hasPermission('designation-manager', 'view') && (
                  <button
                    onClick={() => { setAdminView('designation-manage'); setMobileOpen(false); }}
                    className={`nav-item ${adminView === 'designation-manage' ? 'active' : ''}`}
                  >
                    <Briefcase size={20} className="flex-shrink-0" style={{ color: adminView === 'designation-manage' ? '#FF8C42' : getIconColor('designation-manage') }} />
                    <span className="nav-label">Designation Manager</span>
                  </button>
                )}
              </div>
            )}

            {/* Reception Section */}
            {((hasPermission('student-directory', 'view') || hasPermission('staff-directory', 'view') || hasPermission('employee-directory', 'view') || hasPermission('teacher-directory', 'view')) ||
              (hasPermission('register-student', 'create') || hasPermission('register-student', 'view') || 
               hasPermission('add-staff', 'create') || hasPermission('add-staff', 'view') || 
               hasPermission('register-teacher', 'create') || hasPermission('register-teacher', 'view') ||
               hasPermission('add-employee', 'create') || hasPermission('add-employee', 'view'))) && (
              <div className="sidebar-section-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span className="section-title">
                  Reception
                </span>
                
                {/* Core Registers */}
                {(hasPermission('student-directory', 'view') || hasPermission('staff-directory', 'view') || hasPermission('employee-directory', 'view') || hasPermission('teacher-directory', 'view')) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setAdminCoreOpen(!adminCoreOpen)}
                      className={`nav-item ${['students', 'staff', 'teachers', 'employees'].includes(adminView) ? 'parent-active' : ''}`}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Users size={20} className="flex-shrink-0" style={{ color: ['students', 'staff', 'teachers', 'employees'].includes(adminView) ? '#FF8C42' : getIconColor('core-registers') }} />
                        <span className="nav-label">Core Registers</span>
                      </div>
                      {adminCoreOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                    </button>
                    {adminCoreOpen && (
                      <div className="sidebar-sub-menu" style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid var(--border-glass)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
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
                            <Users size={18} className="flex-shrink-0" style={{ color: adminView === 'students' ? '#FF8C42' : getIconColor('students') }} />
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
                            <UserCheck size={18} className="flex-shrink-0" style={{ color: adminView === 'teachers' ? '#FF8C42' : getIconColor('teachers') }} />
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
                            <UserCheck size={18} className="flex-shrink-0" style={{ color: adminView === 'staff' ? '#FF8C42' : getIconColor('staff') }} />
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
                            <UserCog size={18} className="flex-shrink-0" style={{ color: adminView === 'employees' ? '#FF8C42' : getIconColor('employees') }} />
                            <span className="nav-label">Employee Directory</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Registry Admissions */}
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
                        <UserPlus size={20} className="flex-shrink-0" style={{ color: ['register-student', 'register-teacher', 'add-staff', 'add-employee'].includes(adminView) ? '#FF8C42' : getIconColor('registry-admissions') }} />
                        <span className="nav-label">Registry Admissions</span>
                      </div>
                      {adminRecepOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                    </button>
                    {adminRecepOpen && (
                      <div className="sidebar-sub-menu" style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid var(--border-glass)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                        {(hasPermission('register-student', 'create') || hasPermission('register-student', 'view')) && (
                          <button
                            onClick={() => { setAdminView('register-student'); setMobileOpen(false); }}
                            className={`nav-item ${adminView === 'register-student' ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <UserPlus size={18} className="flex-shrink-0" style={{ color: adminView === 'register-student' ? '#FF8C42' : getIconColor('register-student') }} />
                            <span className="nav-label">Register Student</span>
                          </button>
                        )}
                        {(hasPermission('register-teacher', 'create') || hasPermission('register-teacher', 'view')) && (
                          <button
                            onClick={() => { setAdminView('register-teacher'); setMobileOpen(false); }}
                            className={`nav-item ${adminView === 'register-teacher' ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <UserPlus size={18} className="flex-shrink-0" style={{ color: adminView === 'register-teacher' ? '#FF8C42' : getIconColor('register-teacher') }} />
                            <span className="nav-label">Register Teacher</span>
                          </button>
                        )}
                        {(hasPermission('add-staff', 'create') || hasPermission('add-staff', 'view')) && (
                          <button
                            onClick={() => { setAdminView('add-staff'); setMobileOpen(false); }}
                            className={`nav-item ${adminView === 'add-staff' ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <UserPlus size={18} className="flex-shrink-0" style={{ color: adminView === 'add-staff' ? '#FF8C42' : getIconColor('add-staff') }} />
                            <span className="nav-label">Add Staff</span>
                          </button>
                        )}
                        {(hasPermission('add-employee', 'create') || hasPermission('add-employee', 'view')) && (
                          <button
                            onClick={() => { setAdminView('add-employee'); setMobileOpen(false); }}
                            className={`nav-item ${adminView === 'add-employee' ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <UserCog size={18} className="flex-shrink-0" style={{ color: adminView === 'add-employee' ? '#FF8C42' : getIconColor('add-employee') }} />
                            <span className="nav-label">Add Employee</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Member Report Section */}
            {((() => {
                const userRole = userProfile?.role || localStorage.getItem('role') || localStorage.getItem('portal_role');
                const isUserAdmin = userRole === 'Main Admin' || userRole === 'Principal' || userRole === 'Admin Dashboard';
                if (isUserAdmin) {
                  const hasTLeaveMgmt = hasPermission('teacher-leave-management', 'view');
                  const hasSLeaveMgmt = hasPermission('staff-leave-management', 'view');
                  return hasTLeaveMgmt || hasSLeaveMgmt;
                }
                return true;
              })() ||
              (() => {
                const userRole = userProfile?.role || localStorage.getItem('role') || localStorage.getItem('portal_role');
                const isUserAdmin = userRole === 'Main Admin' || userRole === 'Principal' || userRole === 'Admin Dashboard';
                if (isUserAdmin) return true;
                const userType = userProfile?.userType || localStorage.getItem('userType') || '';
                const isTeacher = userType === 'Teacher' || userRole === 'Teacher';
                return isTeacher;
              })()) && (
              <div className="sidebar-section-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span className="section-title">
                  Member Report
                </span>
                
                {/* Leave Management */}
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
                        <Calendar size={20} className="flex-shrink-0" style={{ color: adminView === 'leave-management' ? '#FF8C42' : getIconColor('leave-management') }} />
                        <span className="nav-label">Leave Management</span>
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
                        <Calendar size={20} className="flex-shrink-0" style={{ color: adminView === 'my-leave' ? '#FF8C42' : getIconColor('my-leave') }} />
                        <span className="nav-label">Leave Management</span>
                      </button>
                    );
                  }
                })()}

                {/* Work Reports */}
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
                        <ClipboardList size={20} className="flex-shrink-0" style={{ color: adminView === 'report-management' ? '#FF8C42' : getIconColor('report-management') }} />
                        <span className="nav-label">Work Reports</span>
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
                        <ClipboardList size={20} className="flex-shrink-0" style={{ color: adminView === 'my-reports' ? '#FF8C42' : getIconColor('my-reports') }} />
                        <span className="nav-label">Work Reports</span>
                      </button>
                    );
                  }
                })()}
              </div>
            )}

            {/* Academic Section */}
            {((hasPermission('academic-manager', 'view') || hasPermission('published-timetable', 'view') || hasPermission('published-exam', 'view')) ||
              (hasPermission('academic-activities', 'view') || hasPermission('academic-calendar', 'view')) ||
              (hasPermission('results-manager', 'view') || hasPermission('results-marks-entry', 'view') || hasPermission('results-history', 'view'))) && (
              <div className="sidebar-section-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span className="section-title">
                  Academic
                </span>

                {(hasPermission('academic-manager', 'view') || hasPermission('published-timetable', 'view') || hasPermission('published-exam', 'view')) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setAdminAcademicOpen(!adminAcademicOpen)}
                      className={`nav-item ${['academic-manager', 'academic-class-timetable', 'academic-teacher-timetable', 'academic-exams', 'academic-exams-history', 'academic-published-timetable', 'academic-published-exam'].includes(adminView) ? 'parent-active' : ''}`}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
                        <BookOpen size={20} className="flex-shrink-0" style={{ color: ['academic-manager', 'academic-class-timetable', 'academic-teacher-timetable', 'academic-exams', 'academic-exams-history', 'academic-published-timetable', 'academic-published-exam'].includes(adminView) ? '#FF8C42' : getIconColor('academic-manager') }} />
                        <span className="nav-label">Academic Manager</span>
                      </div>
                      {adminAcademicOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                    </button>
                    {adminAcademicOpen && (
                      <div className="sidebar-sub-menu" style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid var(--border-glass)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                        {hasPermission('academic-manager', 'view') && (
                          <button
                            onClick={() => { setAdminView('academic-manager'); setMobileOpen(false); }}
                            className={`nav-item ${['academic-manager', 'academic-class-timetable', 'academic-teacher-timetable', 'academic-exams', 'academic-exams-history'].includes(adminView) ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <BookOpen size={18} className="flex-shrink-0" style={{ color: ['academic-manager', 'academic-class-timetable', 'academic-teacher-timetable', 'academic-exams', 'academic-exams-history'].includes(adminView) ? '#FF8C42' : getIconColor('academic-manager') }} />
                            <span className="nav-label">Academic Manager</span>
                          </button>
                        )}
                        {hasPermission('published-timetable', 'view') && (
                          <button
                            onClick={() => { setAdminView('academic-published-timetable'); setMobileOpen(false); }}
                            className={`nav-item ${adminView === 'academic-published-timetable' ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <Calendar size={18} className="flex-shrink-0" style={{ color: adminView === 'academic-published-timetable' ? '#FF8C42' : getIconColor('academic-published-timetable') }} />
                            <span className="nav-label">Published Timetable</span>
                          </button>
                        )}
                        {hasPermission('published-exam', 'view') && (
                          <button
                            onClick={() => { setAdminView('academic-published-exam'); setMobileOpen(false); }}
                            className={`nav-item ${adminView === 'academic-published-exam' ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <ClipboardList size={18} className="flex-shrink-0" style={{ color: adminView === 'academic-published-exam' ? '#FF8C42' : getIconColor('academic-published-exam') }} />
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
                        <Calendar size={20} className="flex-shrink-0" style={{ color: ['academic-activities', 'academic-events', 'academic-notices', 'academic-holidays', 'academic-calendar'].includes(adminView) ? '#FF8C42' : getIconColor('academic-activities') }} />
                        <span className="nav-label">Academic Activities</span>
                      </div>
                      {adminAcademicActivitiesOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                    </button>
                    {adminAcademicActivitiesOpen && (
                      <div className="sidebar-sub-menu" style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid var(--border-glass)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                        {hasPermission('academic-activities', 'view') && (
                          <button
                            onClick={() => { setAdminView('academic-activities'); setMobileOpen(false); }}
                            className={`nav-item ${['academic-activities', 'academic-events', 'academic-notices', 'academic-holidays'].includes(adminView) ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <Calendar size={18} className="flex-shrink-0" style={{ color: ['academic-activities', 'academic-events', 'academic-notices', 'academic-holidays'].includes(adminView) ? '#FF8C42' : getIconColor('academic-activities') }} />
                            <span className="nav-label">Academic Activities</span>
                          </button>
                        )}
                        {hasPermission('academic-calendar', 'view') && (
                          (() => {
                            const userRole = (userProfile?.role || localStorage.getItem('portal_role') || localStorage.getItem('role') || 'Student').toLowerCase();
                            const isCalendarAdmin = ['developer admin', 'main admin', 'admin dashboard', 'principal', 'admin'].includes(userRole);
                            return isCalendarAdmin || hasPublishedCalendarEvents;
                          })()
                        ) && (
                          <button
                            onClick={() => { setAdminView('academic-calendar'); setMobileOpen(false); }}
                            className={`nav-item ${adminView === 'academic-calendar' ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <Calendar size={18} className="flex-shrink-0" style={{ color: adminView === 'academic-calendar' ? '#FF8C42' : getIconColor('academic-calendar') }} />
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
                        <GraduationCap size={20} className="flex-shrink-0" style={{ color: ['results-manager', 'results-analytics', 'results-marks-entry', 'results-report-cards', 'academic-results', 'results-history'].includes(adminView) ? '#FF8C42' : getIconColor('results-manager') }} />
                        <span className="nav-label">Results Manager</span>
                      </div>
                      {adminResultsOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                    </button>
                    {adminResultsOpen && (
                      <div className="sidebar-sub-menu" style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid var(--border-glass)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                        {hasPermission('results-manager', 'view') && (
                          <button
                            onClick={() => { setAdminView('results-manager'); setMobileOpen(false); }}
                            className={`nav-item ${['results-manager', 'results-analytics', 'results-report-cards', 'academic-results'].includes(adminView) ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <FileSpreadsheet size={18} className="flex-shrink-0" style={{ color: ['results-manager', 'results-analytics', 'results-report-cards', 'academic-results'].includes(adminView) ? '#FF8C42' : getIconColor('results-manager') }} />
                            <span className="nav-label">Results Manager</span>
                          </button>
                        )}
                        {hasPermission('results-marks-entry', 'view') && (
                          <button
                            onClick={() => { setAdminView('results-marks-entry'); setMobileOpen(false); }}
                            className={`nav-item ${adminView === 'results-marks-entry' ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <BookOpen size={18} className="flex-shrink-0" style={{ color: adminView === 'results-marks-entry' ? '#FF8C42' : getIconColor('results-marks-entry') }} />
                            <span className="nav-label">Marks Entry</span>
                          </button>
                        )}
                        {hasPermission('results-history', 'view') && (
                          <button
                            onClick={() => { setAdminView('results-history'); setMobileOpen(false); }}
                            className={`nav-item ${adminView === 'results-history' ? 'active' : ''}`}
                            style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                          >
                            <History size={18} className="flex-shrink-0" style={{ color: adminView === 'results-history' ? '#FF8C42' : getIconColor('results-history') }} />
                            <span className="nav-label">Academic History</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Account Section */}
            {(hasPermission('auxiliary-income', 'view') ||
              hasPermission('financial-reports', 'view') ||
              hasPermission('expense-dashboard', 'view') || hasPermission('expense-all-expenses', 'view') || hasPermission('expense-tracker', 'view') || hasPermission('expense-history', 'view') ||
              hasPermission('finance', 'view') ||
              (() => {
                const isClassTeacher = userProfile?.isClassTeacher === true || userProfile?.isClassTeacher === 'Yes' || userProfile?.isClassTeacher === 1;
                const hasEmpAtt = hasPermission('employee-attendance', 'view');
                const hasStuAtt = hasPermission('attendance', 'view') && (userProfile?.role === 'Teacher' ? isClassTeacher : true);
                const hasAttHist = hasPermission('attendance-history', 'view') && (userProfile?.role === 'Teacher' ? isClassTeacher : true);
                return hasEmpAtt || hasStuAtt || hasAttHist;
              })()) && (
              <div className="sidebar-section-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span className="section-title">
                  Account
                </span>

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
                          <ClipboardCheck size={20} className="flex-shrink-0" style={{ color: ['employee-attendance', 'attendance', 'attendance-history'].includes(adminView) ? '#FF8C42' : getIconColor('attendance') }} />
                          <span className="nav-label">Attendance</span>
                        </div>
                        {adminAttendanceOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                      </button>
                      {adminAttendanceOpen && (
                        <div className="sidebar-sub-menu" style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid var(--border-glass)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                          {hasEmpAtt && (
                            <button
                              onClick={() => { setAdminView('employee-attendance'); setMobileOpen(false); }}
                              className={`nav-item ${adminView === 'employee-attendance' ? 'active' : ''}`}
                              style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                            >
                              <QrCode size={18} className="flex-shrink-0" style={{ color: adminView === 'employee-attendance' ? '#FF8C42' : getIconColor('employee-attendance') }} />
                              <span className="nav-label">Staff/Employee Attendance</span>
                            </button>
                          )}
                          {hasStuAtt && (
                            <button
                              onClick={() => { setAdminView('attendance'); setMobileOpen(false); }}
                              className={`nav-item ${adminView === 'attendance' ? 'active' : ''}`}
                              style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                            >
                              <ClipboardCheck size={18} className="flex-shrink-0" style={{ color: adminView === 'attendance' ? '#FF8C42' : getIconColor('attendance') }} />
                              <span className="nav-label">Student Attendance</span>
                            </button>
                          )}
                          {hasAttHist && (
                            <button
                              onClick={() => { setAdminView('attendance-history'); setMobileOpen(false); }}
                              className={`nav-item ${adminView === 'attendance-history' ? 'active' : ''}`}
                              style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                            >
                              <History size={18} className="flex-shrink-0" style={{ color: adminView === 'attendance-history' ? '#FF8C42' : getIconColor('attendance-history') }} />
                              <span className="nav-label">Student Attendance History</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                        <Wallet size={20} className="flex-shrink-0" style={{ color: ['collect-fees', 'fee-structure', 'fees-history', 'staff-payroll', 'staff-pay-structure', 'teacher-payroll', 'teacher-pay-structure', 'employee-payroll', 'employee-pay-structure', 'payroll-history'].includes(adminView) ? '#FF8C42' : getIconColor('finance') }} />
                        <span className="nav-label">Finance</span>
                      </div>
                      {adminFinanceOpen ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                    </button>
                    {adminFinanceOpen && (
                      <div className="sidebar-sub-menu" style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', borderLeft: '1px solid var(--border-glass)', marginLeft: '24px', marginTop: '2px', marginBottom: '6px', gap: '4px' }}>
                        
                        <span className="nav-label" style={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', padding: '8px 12px 4px' }}>Student Fees</span>
                        <button
                          onClick={() => { setAdminView('collect-fees'); setMobileOpen(false); }}
                          className={`nav-item ${adminView === 'collect-fees' ? 'active' : ''}`}
                          style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                        >
                          <Receipt size={18} className="flex-shrink-0" style={{ color: adminView === 'collect-fees' ? '#FF8C42' : getIconColor('collect-fees') }} />
                          <span className="nav-label">Collect Fees</span>
                        </button>
                        <button
                          onClick={() => { setAdminView('fee-structure'); setMobileOpen(false); }}
                          className={`nav-item ${adminView === 'fee-structure' ? 'active' : ''}`}
                          style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                        >
                          <Calculator size={18} className="flex-shrink-0" style={{ color: adminView === 'fee-structure' ? '#FF8C42' : getIconColor('fee-structure') }} />
                          <span className="nav-label">Fee Structure</span>
                        </button>
                        <button
                          onClick={() => { setAdminView('fees-history'); setMobileOpen(false); }}
                          className={`nav-item ${adminView === 'fees-history' ? 'active' : ''}`}
                          style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                        >
                          <History size={18} className="flex-shrink-0" style={{ color: adminView === 'fees-history' ? '#FF8C42' : getIconColor('fees-history') }} />
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
                                <Users size={18} className="flex-shrink-0" style={{ color: ['staff-payroll-hub', 'staff-payroll', 'staff-pay-structure'].includes(adminView) ? '#FF8C42' : getIconColor('staff-payroll') }} />
                                <span className="nav-label">Staff</span>
                              </button>
                            )}

                            {(hasPermission('teacher-payroll', 'view') || hasPermission('teacher-pay-structure', 'view')) && (
                              <button
                                onClick={() => { setAdminView('teacher-payroll-hub'); setMobileOpen(false); }}
                                className={`nav-item ${['teacher-payroll-hub', 'teacher-payroll', 'teacher-pay-structure'].includes(adminView) ? 'active' : ''}`}
                                style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                              >
                                <UserCheck size={18} className="flex-shrink-0" style={{ color: ['teacher-payroll-hub', 'teacher-payroll', 'teacher-pay-structure'].includes(adminView) ? '#FF8C42' : getIconColor('teacher-payroll') }} />
                                <span className="nav-label">Teacher</span>
                              </button>
                            )}

                            {(hasPermission('employee-payroll', 'view') || hasPermission('employee-pay-structure', 'view')) && (
                              <button
                                onClick={() => { setAdminView('employee-payroll-hub'); setMobileOpen(false); }}
                                className={`nav-item ${['employee-payroll-hub', 'employee-payroll', 'employee-pay-structure'].includes(adminView) ? 'active' : ''}`}
                                style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                              >
                                <UserCog size={18} className="flex-shrink-0" style={{ color: ['employee-payroll-hub', 'employee-payroll', 'employee-pay-structure'].includes(adminView) ? '#FF8C42' : getIconColor('employee-payroll') }} />
                                <span className="nav-label">Employee</span>
                              </button>
                            )}

                            {hasPermission('payroll-history', 'view') && (
                              <button
                                onClick={() => { setAdminView('payroll-history'); setMobileOpen(false); }}
                                className={`nav-item ${adminView === 'payroll-history' ? 'active' : ''}`}
                                style={{ padding: '10px 12px', fontSize: '0.88rem', position: 'relative' }}
                              >
                                <History size={18} className="flex-shrink-0" style={{ color: adminView === 'payroll-history' ? '#FF8C42' : getIconColor('payroll-history') }} />
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
                  <button
                    onClick={() => { setAdminView('expense-dashboard'); setMobileOpen(false); }}
                    className={`nav-item ${['expense-dashboard', 'expense-all-expenses', 'expense-history'].includes(adminView) ? 'active' : ''}`}
                  >
                    <Wallet size={20} className="flex-shrink-0" style={{ color: ['expense-dashboard', 'expense-all-expenses', 'expense-history'].includes(adminView) ? '#FF8C42' : getIconColor('expense-dashboard') }} />
                    <span className="nav-label">Expenses</span>
                  </button>
                )}

                {hasPermission('auxiliary-income', 'view') && (
                  <button
                    onClick={() => { setAdminView('auxiliary-income'); setMobileOpen(false); }}
                    className={`nav-item ${adminView === 'auxiliary-income' ? 'active' : ''}`}
                  >
                    <Tags size={20} className="flex-shrink-0" style={{ color: adminView === 'auxiliary-income' ? '#FF8C42' : getIconColor('auxiliary-income') }} />
                    <span className="nav-label">Auxiliary & Other Income</span>
                  </button>
                )}

                {hasPermission('financial-reports', 'view') && (
                  <button
                    onClick={() => { setAdminView('reports'); setMobileOpen(false); }}
                    className={`nav-item ${adminView === 'reports' ? 'active' : ''}`}
                  >
                    <List size={20} className="flex-shrink-0" style={{ color: adminView === 'reports' ? '#FF8C42' : getIconColor('reports') }} />
                    <span className="nav-label">Financial Reports</span>
                  </button>
                )}
              </div>
            )}

            {/* Security & Privacy Section */}
            {(isSuperAdmin() || hasPermission('roles-permissions', 'view') || hasPermission('settings', 'view')) && (
              <div className="sidebar-section-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span className="section-title">
                  Security & Privacy
                </span>

                 {(isSuperAdmin() || hasPermission('roles-permissions', 'view')) && (
                  <button
                    onClick={() => { setAdminView('roles-permissions'); setMobileOpen(false); }}
                    onMouseEnter={() => {
                      prefetchApi('/api/rbac/roles');
                      prefetchApi('/api/rbac/users');
                      prefetchApi('/api/rbac/audit-logs');
                    }}
                    className={`nav-item ${adminView === 'roles-permissions' ? 'active' : ''}`}
                  >
                    <Shield size={20} className="flex-shrink-0" style={{ color: adminView === 'roles-permissions' ? '#FF8C42' : getIconColor('roles-permissions') }} />
                    <span className="nav-label">Roles & Permissions</span>
                  </button>
                )}
                {(isSuperAdmin() || hasPermission('settings', 'view')) && (
                  <button
                    onClick={() => { setAdminView('settings'); setMobileOpen(false); }}
                    className={`nav-item ${adminView === 'settings' ? 'active' : ''}`}
                  >
                    <Settings size={20} className="flex-shrink-0" style={{ color: adminView === 'settings' ? '#FF8C42' : getIconColor('settings') }} />
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
                  <Icon size={20} className="flex-shrink-0" style={{ color: activeView === item.id ? '#FF8C42' : getIconColor(item.id) }} />
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
                style={{ color: 'hsl(var(--color-primary))', marginTop: '16px', border: '1px dashed rgba(255, 107, 0, 0.4)', background: 'rgba(255, 107, 0, 0.04)', borderRadius: '8px' }}
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
      >
        <div className="profile-avatar">
          {userProfile?.photo ? (
            <img src={userProfile.photo} alt={userProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (() => {
              const userRole = userProfile?.role || localStorage.getItem('role') || localStorage.getItem('portal_role');
              const isSchoolAdmin = userRole === 'Main Admin' || userRole === 'Principal';
              const principalNameFromSchool = schoolDetails?.principal || schoolDetails?.principalName;
              const name = (isSchoolAdmin && principalNameFromSchool && principalNameFromSchool !== 'Principal')
                ? principalNameFromSchool
                : (userProfile?.name && userProfile.name !== 'Principal' ? userProfile.name : (principalNameFromSchool || localStorage.getItem('name') || 'Principal'));
              
              const parts = name.split(' ');
              if (parts.length > 1) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
              }
              return name.substring(0, 2).toUpperCase();
            })()
          )}
        </div>
        <div className="profile-details" style={{ display: isCollapsed ? 'none' : 'flex', flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span className="profile-name" style={{ fontSize: '0.88rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
              {(() => {
                const userRole = userProfile?.role || localStorage.getItem('role') || localStorage.getItem('portal_role');
                const isSchoolAdmin = userRole === 'Main Admin' || userRole === 'Principal';
                const principalNameFromSchool = schoolDetails?.principal || schoolDetails?.principalName;
                return (isSchoolAdmin && principalNameFromSchool && principalNameFromSchool !== 'Principal')
                  ? principalNameFromSchool
                  : (userProfile?.name && userProfile.name !== 'Principal' ? userProfile.name : (principalNameFromSchool || localStorage.getItem('name') || 'Principal'));
              })()}
            </span>
            <span className="profile-role" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
              {userProfile?.role || localStorage.getItem('portal_role') || localStorage.getItem('role') || 'Super Admin'}
            </span>
          </div>
          <ChevronDown size={16} style={{ color: 'var(--text-muted)', marginLeft: '8px' }} />
        </div>
      </div>
    </aside>
  );
}

