import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import { 
  Menu,
  Bell, 
  Sun, 
  Moon, 
  MessageSquare, 
  User, 
  LogOut, 
  ChevronDown,
  LayoutDashboard,
  Shield,
  Calculator,
  Wallet,
  UserCog,
  UserCheck
} from 'lucide-react';

export default function Header({ 
  activeView, 
  isCollapsed, 
  setIsCollapsed, 
  mobileOpen, 
  setMobileOpen,
  theme,
  setTheme,
  schoolDetails,
  setActiveView,
  setAdminView,
  isAdmin,
  isDeveloperAdmin,
  onLogout,
  userProfile
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDashboardMenu, setShowDashboardMenu] = useState(false);

  const viewTitles = {
    // Core/Student
    students: { title: 'Student Directory', desc: 'Manage all student profiles, registrations, and academic standings.' },
    'add-teacher': { title: 'Staff Registration Form', desc: 'Enroll a new staff member with full professional profile, credentials, and document uploads.' },
    'teacher-list': { title: 'Staff Directory', desc: 'Review and manage all staff profiles, departments, and employment records.' },
    staff: { title: 'Employee Directory', desc: 'Manage administrative, facilities, technical, and academic support employees.' },
    finance: { title: 'Financial Operations', desc: 'Track pending tuition fees, invoices, receipts, and overhead costs.' },
    school: { title: 'School Details', desc: 'View school details, modify profile variables, and monitor student and employee rollups.' },
    'register-student': { title: 'Student Registration Form', desc: 'Enroll a new student with full bio, parent/guardian contacts, and upload verified credentials.' },

    // Admin Dashboard Specific Views
    overview: { title: 'Admin Overview', desc: 'System rollups, database metrics, and admin dashboard statistics.' },
    teachers: { title: 'Faculty Registry', desc: 'Review and manage all teacher profiles, credentials, and employment records.' },
    'employee-attendance': { title: 'Staff/Employee Attendance', desc: 'Check in/out dashboard and employee attendance log.' },
    'collect-fees': { title: 'Collect Fees', desc: 'Process and record student tuition fee payments.' },
    'fee-structure': { title: 'Fee Structure', desc: 'Configure academic term fee templates.' },
    payroll: { title: 'Pay Staff', desc: 'Calculate and disburse staff salaries.' },
    'teacher-pay-structure': { title: 'Staff Pay Structure', desc: 'Define salary structures for staff.' },
    'staff-pay': { title: 'Pay Employee', desc: 'Manage administrative and support employee payouts.' },
    'staff-pay-structure': { title: 'Employee Pay Structure', desc: 'Define salary structures for support employees.' },
    'staff-payroll-hub': { title: 'Staff Payroll Hub', desc: 'Manage payroll and basic remuneration structures for school staff.' },
    'teacher-payroll-hub': { title: 'Teacher Payroll Hub', desc: 'Manage payroll and basic remuneration structures for school teachers.' },
    'employee-payroll-hub': { title: 'Employee Payroll Hub', desc: 'Manage payroll and basic remuneration structures for school employees.' },
    expenses: { title: 'School Expenses', desc: 'Review, file, and audit expenditures.' },
    income: { title: 'Income Tracker', desc: 'Monitor additional revenue channels and non-fee inflows.' },
    reports: { title: 'Financial Reports', desc: 'Generate visual balance sheets, statement lists, and profit/loss reports.' },
    'student-manager': { title: 'Student Manager', desc: 'Allocate classrooms and sections to enrolled students.' },
    'designation-manage': { title: 'Designation Manage', desc: 'Manage school staff and employee designations.' },
    'add-staff': { title: 'Register Staff', desc: 'Register a new administrative or support staff member.' },
    'add-employee': { title: 'Register Employee', desc: 'Register a new employee in the school system.' },
    'roles-permissions': { title: 'Roles & Permissions', desc: 'Control user permissions and security roles.' },
    'grade-list': { title: 'Grade Management', desc: 'Configure academic classes and sections.' },
    attendance: { title: 'Student Attendance', desc: 'Record daily classroom attendance.' },
    'attendance-history': { title: 'Student Attendance History', desc: 'Review history records of student attendance.' },
    
    // Academics subviews
    'academic-grade-subjects': { title: 'Academic Management', desc: 'Map subjects and courses to grades.' },
    'academic-manager': { title: 'Academic Manager', desc: 'Manage class schedules, teacher hours, assessments, and exam settings.' },
    'academic-class-timetable': { title: 'Class Timetables', desc: 'Create and schedule weekly classes.' },
    'academic-teacher-timetable': { title: 'Staff Timetables', desc: 'View and assign faculty teaching hours.' },
    'academic-exams': { title: 'Exam Management', desc: 'Set up assessments, grading criteria, and exam types.' },
    'academic-exams-history': { title: 'Exam History', desc: 'Review past semesters assessments and logs.' },
    'academic-published-timetable': { title: 'Published Timetables', desc: 'View published class and teacher weekly schedules.' },
    'academic-published-exam': { title: 'Published Exams', desc: 'View active exam schedules.' },
    'academic-events': { title: 'Events Management', desc: 'Schedule assemblies, sports events, and celebrations.' },
    'academic-notices': { title: 'Notices & Board', desc: 'Post announcements and circulars for school members.' },
    'academic-holidays': { title: 'School Holidays', desc: 'Mark non-working holidays on the calendar.' },
    'academic-calendar': { title: 'Academic Calendar', desc: 'Coordinate yearly school milestones and dates.' },
    'academic-activities': { title: 'Academic Activities', desc: 'Schedule school functions, events, holidays, and post announcements.' },
    'results-analytics': { title: 'Results Analytics', desc: 'Analyze academic performance and grade statistics.' },
    'results-marks-entry': { title: 'Marks Entry', desc: 'Record test and term scores.' },
    'results-report-cards': { title: 'Report Cards', desc: 'Generate and print report cards.' },
    'results-history': { title: 'Academic Results History', desc: 'View past years students scores.' },
    'results-manager': { title: 'Results Manager', desc: 'Manage exam scores, analyze class performance, and print report cards.' },

    // Expense Control subviews
    'expense-dashboard': { title: 'Expense Panel', desc: 'Analyze expenditures per day, month, or year with custom comparative filters.' },
    'expense-add-expense': { title: 'Record Expense', desc: 'Record utility bills, administrative supplies, renovation costs, or payroll expenses.' },
    'expense-all-expenses': { title: 'Expenses', desc: 'Search, filter, paginate, sort, and export the complete academy expense history.' },
    'expense-tracker': { title: 'Expense Tracker', desc: 'Analyze expenditures per day, month, or year with custom comparative filters.' },
    'auxiliary-income': { title: 'Auxiliary & Other Income', desc: 'Manage and track supplemental school revenue sources. Fully database-driven.' }
  };

  const currentMeta = viewTitles[activeView] || { title: 'Academy Portal', desc: 'Overview and administration console' };

  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenant = localStorage.getItem('tenant_subdomain');
      if (!token) return;
      const res = await fetch(`/api/notifications?tenantId=${tenant || ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds for real-time
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenant = localStorage.getItem('tenant_subdomain');
      if (!token) return;
      const res = await fetch(`/api/notifications/read?tenantId=${tenant || ''}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err.message);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const tenant = localStorage.getItem('tenant_subdomain');
      if (!token) return;
      const res = await fetch(`/api/notifications/read?tenantId=${tenant || ''}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking notification read:', err.message);
    }
  };

  const handleNotificationClick = async (n) => {
    try {
      const isUnread = !n.read || n.read === 0;
      if (isUnread) {
        await handleMarkRead(n.id);
      }
      if (n.type === 'leave_request') {
        setAdminView('leave-management');
      } else if (n.type === 'task_submission') {
        setAdminView('report-management');
      } else if (n.type === 'leave_status') {
        setAdminView('my-leave');
      }
      setShowNotifications(false);
    } catch (err) {
      console.error('Error handling notification click:', err.message);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header className="app-header animate-fade-in">
      <div className="header-left">
        {/* Toggle button - only show when sidebar is collapsed */}
        {isCollapsed && !mobileOpen && (
          <button 
            onClick={() => {
              if (window.innerWidth <= 900) {
                setMobileOpen(true);
              } else {
                setIsCollapsed(false);
              }
            }}
            className="sidebar-toggle-btn"
            aria-label="Toggle navigation drawer"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="header-title">
          <h1>
            {(() => {
              const fullTitle = activeView === 'overview' && userProfile?.role && userProfile.role !== 'Main Admin' && userProfile.role !== 'Admin Dashboard' && userProfile.role !== 'Principal'
                ? `${userProfile.role} Overview`
                : currentMeta.title;
              const words = fullTitle.split(' ');
              const firstWord = words[0];
              const rest = words.slice(1).join(' ');
              return (
                <>
                  <span style={{ color: '#FF8C42' }}>{firstWord}</span> {rest}
                </>
              );
            })()}
          </h1>
          <p>
            {activeView === 'overview' && userProfile?.role && userProfile.role !== 'Main Admin' && userProfile.role !== 'Admin Dashboard' && userProfile.role !== 'Principal'
              ? `System rollups, metrics, and ${userProfile.role.toLowerCase()} dashboard statistics.`
              : currentMeta.desc}
          </p>
        </div>
      </div>

      <div className="header-right">
        {/* Theme Toggler */}
        <button onClick={toggleTheme} className="action-btn" title="Toggle color scheme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications Icon and Dropdown */}
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
            }} 
            className="action-btn"
            title="Notifications"
          >
            <Bell size={20} />
            {notifications.filter(n => !n.read || n.read === 0).length > 0 && (
              <span className="badge-count">
                {notifications.filter(n => !n.read || n.read === 0).length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="glass-panel" style={{
              position: 'absolute',
              top: '52px',
              right: 0,
              width: '320px',
              padding: '16px',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: '12px',
              border: '1px solid var(--border-glass)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                <span onClick={handleMarkAllRead} style={{ fontSize: '0.75rem', color: 'hsl(var(--color-primary))', cursor: 'pointer', fontWeight: 600 }}>Mark all read</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                {notifications.length > 0 ? (
                  notifications.map(n => {
                    const isUnread = !n.read || n.read === 0;
                    return (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '4px', 
                          padding: '10px', 
                          borderRadius: '8px', 
                          background: isUnread ? 'rgba(255, 107, 0, 0.08)' : 'transparent',
                          border: isUnread ? '1px solid rgba(255, 107, 0, 0.15)' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: isUnread ? 700 : 500, color: 'var(--text-main)' }}>{n.title}</span>
                          {isUnread && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(var(--color-primary))' }}></span>}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>{n.message}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'right' }}>
                          {new Date(n.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Bell size={24} style={{ opacity: 0.5 }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>No new notifications</span>
                    <span style={{ fontSize: '0.7rem' }}>You're all caught up!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>



        {!isAdmin && !isDeveloperAdmin && (
          <button
            onClick={() => setActiveView('admin-login')}
            className="action-btn"
            title="Admin Dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', width: 'auto', padding: '0 12px' }}
          >
            <Shield size={18} />
            <span>Admin Dashboard</span>
          </button>
        )}
      </div>
    </header>
  );
}

