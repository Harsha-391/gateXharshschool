import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StudentDirectory from './pages/StudentDirectory';
import AddTeacher from './pages/AddTeacher';
import TeacherList from './pages/TeacherList';
import AddStaff from './pages/AddStaff';
import StaffDirectory from './pages/StaffDirectory';
import AccountManagementPortal from './pages/AccountManagementPortal';
import SchoolProfile from './pages/SchoolProfile';
import AttendanceManager from './pages/AttendanceManager';
import RegisterStudent from './pages/RegisterStudent';
import AdminPanel from './pages/AdminPanel';
import SchoolLogin from './pages/SchoolLogin';
import AdminLogin from './pages/AdminLogin';
import AcademicPanel from './pages/AcademicPanel';
import UserProfile from './pages/UserProfile';
import { CheckCircle, AlertCircle } from 'lucide-react';

import './App.css';

// Global Fetch Interceptor for Tenant ID & Auth Token
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  let targetUrl = typeof url === 'string' ? url : (url.url || '');
  if (targetUrl.startsWith('/') || targetUrl.includes('/api/')) {
    options.headers = options.headers || {};
    // Skip tenant header for platform-level API calls
    if (targetUrl.startsWith('/api/platform/')) {
      delete options.headers['x-tenant-id'];
    } else if (!options.headers['x-tenant-id']) {
      const host = window.location.hostname;
      // Skip tenant parsing for IP addresses (e.g. 127.0.0.1)
      const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
      let tenant = null;
      if (!isIp) {
        const parts = host.split('.');
        if (parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost')) {
          tenant = parts[0];
        }
      }
      if (!tenant) {
        const urlParams = new URLSearchParams(window.location.search);
        tenant = urlParams.get('tenant') || localStorage.getItem('tenant_subdomain');
      }
      if (tenant && tenant !== 'www' && tenant !== 'platform') {
        options.headers['x-tenant-id'] = tenant;
      }
    }
    const token = sessionStorage.getItem('token');
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return originalFetch(url, options);
};

const getInitialAuthState = (targetRole) => {
  const path = window.location.pathname;
  if (path.startsWith('/admin') && targetRole === 'Admin') return true;
  if (path.startsWith('/school') && targetRole === 'Developer') return true;
  
  const savedRole = sessionStorage.getItem('role') || sessionStorage.getItem('portal_role');
  if (!savedRole) return false;
  
  if (savedRole === 'Developer Admin' && targetRole === 'Developer') return true;
  if (savedRole === 'Admin Dashboard' && targetRole === 'Admin') return true;
  if ((savedRole === 'Main Admin' || savedRole === 'admin') && targetRole === 'Admin') return true;
  
  return false;
};

export default function App() {
  const [activeView, setActiveViewState] = useState('students');
  const [activeSubadminLogin, setActiveSubadminLogin] = useState(null);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const setActiveView = (view) => {
    if (view === 'admin-login') {
      setActiveSubadminLogin('admin');
    } else {
      setActiveViewState(view);
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [schoolDetails, setSchoolDetails] = useState({ name: 'Aether Academy', principal: 'Alex Devlin' });
  
  const [userProfile, setUserProfile] = useState({
    name: sessionStorage.getItem('name') || 'User',
    role: sessionStorage.getItem('role') || sessionStorage.getItem('portal_role') || 'Guest',
    photo: sessionStorage.getItem('photo') || '',
    username: sessionStorage.getItem('username') || ''
  });

  const fetchUserProfile = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        sessionStorage.setItem('name', data.name);
        sessionStorage.setItem('role', data.role);
        if (data.photo) {
          sessionStorage.setItem('photo', data.photo);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };
  
  // Authentication states
  const [isDeveloperAdmin, setIsDeveloperAdmin] = useState(() => getInitialAuthState('Developer'));
  const [isAdmin, setIsAdmin] = useState(() => getInitialAuthState('Admin'));
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(() => getInitialAuthState('SchoolAdmin'));

  // Active view states for sub-dashboards with persistence
  const [adminView, setAdminViewState] = useState(() => sessionStorage.getItem('admin_view') || 'overview');
  const setAdminView = (view) => {
    sessionStorage.setItem('admin_view', view);
    setAdminViewState(view);
  };

  const initialised = useRef(false);

  const getActiveTenant = () => {
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost')) {
      return parts[0];
    }
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tenant') || localStorage.getItem('tenant_subdomain') || null;
  };

  const fetchSchoolDetails = async () => {
    try {
      const tenant = getActiveTenant();
      if (!tenant) {
        setSchoolDetails({ name: 'School ERP Platform', principal: 'Master Admin' });
        return;
      }
      const res = await fetch('/api/school');
      if (res.ok) {
        const data = await res.json();
        setSchoolDetails(data);
      }
    } catch (err) {
      console.error('Error loading school details:', err);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 900) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const checkRoutePath = () => {
    return false;
  };

  // Restore session & path on mount
  useEffect(() => {
    fetchSchoolDetails();
    fetchUserProfile();

    const savedRole = sessionStorage.getItem('role') || sessionStorage.getItem('portal_role');
    if (savedRole) {
      switch (savedRole) {
        case 'Developer Admin':
          setIsDeveloperAdmin(true);
          setActiveView('dashboard');
          break;
        case 'Student':
        case 'Parent':
          setIsAdmin(false);
          setIsSchoolAdmin(false);
          setActiveView('students');
          break;
        default:
          // Any other role is admin/staff level (Teacher, Accountant, Clerk, etc.)
          setIsAdmin(true);
          setIsSchoolAdmin(false);
          break;
      }
    }
    initialised.current = true;
  }, []);

  // Listen for browser forward/back buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setIsDeveloperAdmin(false);
      setIsAdmin(false);
      setIsSchoolAdmin(false);

      const savedRole = sessionStorage.getItem('role') || sessionStorage.getItem('portal_role');
      if (savedRole) {
        switch (savedRole) {
          case 'Developer Admin':
            setIsDeveloperAdmin(true);
            setActiveView('dashboard');
            break;
          case 'Student':
          case 'Parent':
            setIsAdmin(false);
            setIsSchoolAdmin(false);
            setActiveView('students');
            break;
          default:
            // Any other role is admin/staff level (Teacher, Accountant, Clerk, etc.)
            setIsAdmin(true);
            setIsSchoolAdmin(false);
            break;
        }
      } else {
        setActiveView('students');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update window address dynamically for routing appearance
  useEffect(() => {
    if (!initialised.current) return;
    
    const tenant = getActiveTenant();
    const host = window.location.hostname;
    const parts = host.split('.');
    const isSubdomainResolved = parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost');
    const query = (tenant && !isSubdomainResolved) ? `?tenant=${tenant}` : '';

    const isLoggedIn = isDeveloperAdmin || isAdmin || isSchoolAdmin;

    if (!isLoggedIn) {
      window.history.pushState(null, '', `/${query}`);
    } else if (isDeveloperAdmin) {
      window.history.pushState(null, '', `/school${query}`);
    } else if (isAdmin) {
      window.history.pushState(null, '', `/admin${query}`);
    } else {
      window.history.pushState(null, '', `/${activeView}${query}`);
    }
  }, [activeView, isDeveloperAdmin, isAdmin, isSchoolAdmin]);

  // Dynamic Browser Tab Title and Favicon Manager
  useEffect(() => {
    const faviconLink = document.getElementById('favicon-link');
    const tenant = getActiveTenant();
    
    // 1. Platform Level (No active school tenant)
    if (!tenant) {
      document.title = 'School ERP | Dev Admin';
      if (faviconLink) {
        faviconLink.setAttribute('href', '/favicon.svg');
      }
      return;
    }

    // 2. School Tenant Level
    const schoolName = schoolDetails?.name || 'School';
    const logoUrl = schoolDetails?.logo || '/favicon.svg';

    if (faviconLink) {
      faviconLink.setAttribute('href', logoUrl);
    }

    // Determine current user context/role
    const isLoggedIn = isDeveloperAdmin || isAdmin || isSchoolAdmin;
    if (!isLoggedIn) {
      document.title = `${schoolName} | Login`;
      return;
    }

    // Logged-in user role
    const role = userProfile?.role || sessionStorage.getItem('role') || sessionStorage.getItem('portal_role');
    if (role === 'Main Admin' || role === 'Admin Dashboard' || role === 'Principal') {
      document.title = `${schoolName} | Admin`;
    } else if (role) {
      document.title = `${schoolName} | ${role}`;
    } else {
      document.title = `${schoolName} | Portal`;
    }
  }, [schoolDetails, userProfile, isDeveloperAdmin, isAdmin, isSchoolAdmin]);

  // URL Auto-login Hook
  useEffect(() => {
    const autoLogin = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const usernameParam = urlParams.get('username');
      const passwordParam = urlParams.get('password');
      const tenantParam = urlParams.get('tenant');
      const fromDevAdminParam = urlParams.get('from_dev_admin');

      if (fromDevAdminParam === 'true') {
        sessionStorage.setItem('from_dev_admin', 'true');
      }

      if (usernameParam && passwordParam && tenantParam) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-tenant-id': tenantParam
            },
            body: JSON.stringify({ username: usernameParam, password: passwordParam, role: 'Auto' })
          });

          if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('role', data.role);
            sessionStorage.setItem('portal_role', data.role);
            sessionStorage.setItem('username', data.username || usernameParam);
            sessionStorage.setItem('name', data.name);
            
            if (data.permissions) {
              sessionStorage.setItem('permissions', JSON.stringify(data.permissions));
            } else {
              sessionStorage.removeItem('permissions');
            }
            if (data.overrides) {
              sessionStorage.setItem('overrides', JSON.stringify(data.overrides));
            } else {
              sessionStorage.removeItem('overrides');
            }

            if (data.school) {
              sessionStorage.setItem('school_name', data.school.name);
              sessionStorage.setItem('school_subdomain', data.school.subdomain);
              localStorage.setItem('tenant_subdomain', data.school.subdomain);
            }

            // Remove username/password query params but keep the tenant (only if not resolved from subdomain)
            const host = window.location.hostname;
            const parts = host.split('.');
            const isSubdomainResolved = parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost');
            const cleanUrl = window.location.pathname + (isSubdomainResolved ? '' : `?tenant=${tenantParam}`);
            window.history.replaceState(null, '', cleanUrl);

            handleLoginSuccess(data.role, data.name);
          }
        } catch (err) {
          console.error('URL auto-login exception:', err);
        }
      }
    };
    autoLogin();
  }, []);

  const handleLoginSuccess = (role, name) => {
    sessionStorage.setItem('portal_role', role);
    if (role === 'Developer Admin') {
      setIsDeveloperAdmin(true);
      setActiveView('dashboard');
    } else if (role === 'Student') {
      setIsAdmin(false);
      setIsSchoolAdmin(false);
      setActiveView('students');
    } else if (role === 'Parent') {
      setIsAdmin(false);
      setIsSchoolAdmin(false);
      setActiveView('students');
    } else {
      // Any admin/subadmin/staff/teacher dashboard role
      setIsAdmin(true);
      setIsSchoolAdmin(false);
      
      // Select appropriate initial view if they don't have student view access
      setAdminView('overview');
    }
    fetchSchoolDetails();
    fetchUserProfile();
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('tenant_subdomain');
    setIsDeveloperAdmin(false);
    setIsAdmin(false);
    setIsSchoolAdmin(false);
    setActiveView('students');
    
    // Clear path on logout
    const tenant = getActiveTenant();
    const host = window.location.hostname;
    const parts = host.split('.');
    const isSubdomainResolved = parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost');
    const query = (tenant && !isSubdomainResolved) ? `?tenant=${tenant}` : '';
    window.history.pushState(null, '', `/${query}`);
  };

  const handleBackToMain = () => {
    setIsAdmin(false);
    setIsSchoolAdmin(true);
    setActiveViewState('students');
    sessionStorage.setItem('role', 'Main Admin');
    sessionStorage.setItem('portal_role', 'Main Admin');

    const tenant = getActiveTenant();
    const query = (tenant && !isSubdomainResolved) ? `?tenant=${tenant}` : '';
    window.history.pushState(null, '', `/students${query}`);
  };

  const renderCurrentView = () => {
    if (isDeveloperAdmin) {
      if (activeView === 'profile') {
        return <UserProfile onProfileUpdate={setUserProfile} showToast={showToast} onLogout={handleLogout} />;
      }
      return <SchoolProfile schoolDetails={schoolDetails} fetchSchoolDetails={fetchSchoolDetails} isDeveloperAdmin={isDeveloperAdmin} devActiveTab={activeView === 'school' ? 'schools' : 'dashboard'} />;
    }

    if (isAdmin) {
      return <AdminPanel setActiveView={setActiveView} onLogout={handleLogout} adminView={adminView} setAdminView={setAdminView} onBackToMain={handleBackToMain} userProfile={userProfile} setUserProfile={setUserProfile} />;
    }

    switch (activeView) {
      case 'profile':
        return <UserProfile onProfileUpdate={setUserProfile} showToast={showToast} onLogout={handleLogout} />;
      case 'students':
        return <StudentDirectory readOnly={true} onAddClick={() => setActiveView('register-student')} />;
      case 'register-student':
        return <RegisterStudent setActiveView={setActiveView} />;
      case 'add-teacher':
        return <AddTeacher setActiveView={setActiveView} />;
      case 'teachers':
      case 'teacher-list':
        return <TeacherList setActiveView={setActiveView} readOnly={true} onAddClick={() => setActiveView('add-teacher')} />;
      case 'add-staff':
        return <AddStaff setActiveView={setActiveView} />;
      case 'staff':
        return <StaffDirectory readOnly={true} onAddClick={() => setActiveView('add-staff')} />;
      case 'finance':
        return <AccountManagementPortal />;
      case 'employee-attendance':
        return <AttendanceManager />;
      case 'school':
        return <SchoolProfile schoolDetails={schoolDetails} fetchSchoolDetails={fetchSchoolDetails} isDeveloperAdmin={isDeveloperAdmin} />;
      case 'academic-calendar':
        return <AcademicPanel subView="academic-calendar" setAdminView={setActiveView} />;
      case 'admin-login':
        return (
          <AdminLogin 
            onLogin={() => {
              sessionStorage.setItem('role', 'Admin Dashboard');
              sessionStorage.setItem('portal_role', 'Admin Dashboard');
              setIsAdmin(true);
              setIsSchoolAdmin(false);
              setAdminView('students');
            }} 
            onCancel={() => setActiveView('students')} 
          />
        );

      default:
        return <StudentDirectory readOnly={true} onAddClick={() => setActiveView('register-student')} />;
    }
  };

  const isLoggedIn = isDeveloperAdmin || isAdmin || isSchoolAdmin;

  if (!isLoggedIn) {
    const host = window.location.hostname;
    const parts = host.split('.');
    let loginTenant = null;
    if (parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost')) {
      loginTenant = parts[0];
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      loginTenant = urlParams.get('tenant') || null;
    }

    if (!loginTenant) {
      localStorage.removeItem('tenant_subdomain');
    }

    return (
      <SchoolLogin 
        tenantSubdomain={loginTenant} 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  if (activeSubadminLogin) {
    return (
      <div data-theme="light" style={{
        width: '100vw',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, hsl(250, 100%, 97%) 0%, hsl(320, 100%, 97%) 100%)',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 20px',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        {activeSubadminLogin === 'admin' && (
          <AdminLogin 
            onLogin={() => {
              sessionStorage.setItem('role', 'Admin Dashboard');
              sessionStorage.setItem('portal_role', 'Admin Dashboard');
              setIsAdmin(true);
              setIsSchoolAdmin(false);
              setAdminView('dashboard');
              setActiveSubadminLogin(null);
            }} 
            onCancel={() => setActiveSubadminLogin(null)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        schoolDetails={schoolDetails}
        isAdmin={isAdmin}
        onAdminLogout={handleLogout}
        adminView={adminView}
        setAdminView={setAdminView}
        isDeveloperAdmin={isDeveloperAdmin}
        onDeveloperAdminLogout={handleLogout}
        onBackToMain={handleBackToMain}
        userProfile={userProfile}
      />

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
          }}
        />
      )}

      <div className="app-content">
        <Header
          activeView={isAdmin ? adminView : activeView}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          theme={theme}
          setTheme={setTheme}
          schoolDetails={schoolDetails}
          isAdmin={isAdmin}
          isDeveloperAdmin={isDeveloperAdmin}
          setActiveView={setActiveView}
          setAdminView={setAdminView}
          onLogout={handleLogout}
          userProfile={userProfile}
        />

        <main style={{ flex: 1, marginTop: '10px' }}>
          {renderCurrentView()}
        </main>
      </div>

      {/* Toast Notification helper */}
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
          fontWeight: 600
        }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
}
