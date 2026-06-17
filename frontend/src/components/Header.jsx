import React, { useState } from 'react';
import { 
  Menu,
  Search, 
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
    'employee-attendance': { title: 'Attendance Manager', desc: 'Check in/out dashboard and employee attendance log.' },
    'collect-fees': { title: 'Collect Fees', desc: 'Process and record student tuition fee payments.' },
    'fee-structure': { title: 'Fee Structure', desc: 'Configure academic term fee templates.' },
    payroll: { title: 'Manage Payroll', desc: 'Calculate and disburse staff salaries.' },
    'teacher-pay-structure': { title: 'Teacher Pay Structure', desc: 'Define salary structures for teachers.' },
    'staff-pay': { title: 'Pay Staff', desc: 'Manage administrative and support staff payouts.' },
    'staff-pay-structure': { title: 'Staff Pay Structure', desc: 'Define salary structures for support employees.' },
    expenses: { title: 'School Expenses', desc: 'Review, file, and audit expenditures.' },
    income: { title: 'Income Tracker', desc: 'Monitor additional revenue channels and non-fee inflows.' },
    reports: { title: 'Financial Reports', desc: 'Generate visual balance sheets, statement lists, and profit/loss reports.' },
    'student-manager': { title: 'Student Manager', desc: 'Allocate classrooms and sections to enrolled students.' },
    'add-staff': { title: 'Add Employee', desc: 'Register a new administrative or support staff member.' },
    'roles-permissions': { title: 'Roles & Permissions', desc: 'Control user permissions and security roles.' },
    'grade-list': { title: 'Grade Management', desc: 'Configure academic classes and sections.' },
    attendance: { title: 'Student Attendance', desc: 'Record daily classroom attendance.' },
    'attendance-history': { title: 'Attendance History', desc: 'Review history records of student attendance.' },
    
    // Academics subviews
    'academic-grade-subjects': { title: 'Academic Management', desc: 'Map subjects and courses to grades.' },
    'academic-manager': { title: 'Academic Manager', desc: 'Manage class schedules, teacher hours, assessments, and exam settings.' },
    'academic-class-timetable': { title: 'Class Timetables', desc: 'Create and schedule weekly classes.' },
    'academic-teacher-timetable': { title: 'Teacher Timetables', desc: 'View and assign faculty teaching hours.' },
    'academic-exams': { title: 'Exam Management', desc: 'Set up assessments, grading criteria, and exam types.' },
    'academic-exam-timetable': { title: 'Exam Timetable', desc: 'Plan dates and scheduling for mid-terms and finals.' },
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
    'expense-dashboard': { title: 'Expense Dashboard', desc: 'Monitor expense totals, approval queues, budget usage, and recent ledger activity.' },
    'expense-add-expense': { title: 'Record Expense', desc: 'Record utility bills, administrative supplies, renovation costs, or payroll expenses.' },
    'expense-all-expenses': { title: 'Expenses', desc: 'Search, filter, paginate, sort, and export the complete academy expense history.' },
    'expense-tracker': { title: 'Expense Tracker', desc: 'Analyze expenditures per day, month, or year with custom comparative filters.' }
  };

  const currentMeta = viewTitles[activeView] || { title: 'Academy Portal', desc: 'Overview and administration console' };

  const notifications = [];

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
            {activeView === 'overview' && userProfile?.role && userProfile.role !== 'Main Admin' && userProfile.role !== 'Admin Dashboard' && userProfile.role !== 'Principal'
              ? `${userProfile.role} Overview`
              : currentMeta.title}
          </h1>
          <p>
            {activeView === 'overview' && userProfile?.role && userProfile.role !== 'Main Admin' && userProfile.role !== 'Admin Dashboard' && userProfile.role !== 'Principal'
              ? `System rollups, metrics, and ${userProfile.role.toLowerCase()} dashboard statistics.`
              : currentMeta.desc}
          </p>
        </div>
      </div>

      <div className="header-right">
        {/* Search bar */}
        <div className="search-bar-container">
          <Search size={18} className="search-bar-icon" />
          <input 
            type="text" 
            placeholder="Search student, staff ID..." 
            className="search-bar-input" 
          />
        </div>

        {/* Theme Toggler */}
        <button onClick={toggleTheme} className="action-btn" title="Toggle color scheme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications Icon and Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }} 
            className="action-btn"
            title="Notifications"
          >
            <Bell size={20} />
            {notifications.some(n => !n.read) && <span className="badge-dot"></span>}
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
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-primary))', cursor: 'pointer', fontWeight: 600 }}>Mark all read</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px', borderRadius: '8px', background: n.read ? 'transparent' : 'rgba(hsl(var(--color-primary)), 0.05)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: n.read ? 400 : 600 }}>{n.text}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.time}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
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
