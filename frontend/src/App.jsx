import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SkeletonLoader from './components/SkeletonLoader';
import KeepAlive from './components/KeepAlive';
import { CheckCircle, AlertCircle } from 'lucide-react';

import './App.css';

// Lazy load page components
const StudentDirectory = lazy(() => import('./pages/StudentDirectory'));
const AddTeacher = lazy(() => import('./pages/AddTeacher'));
const TeacherList = lazy(() => import('./pages/TeacherList'));
const AddStaff = lazy(() => import('./pages/AddStaff'));
const StaffDirectory = lazy(() => import('./pages/StaffDirectory'));
const AccountManagementPortal = lazy(() => import('./pages/AccountManagementPortal'));
const SchoolProfile = lazy(() => import('./pages/SchoolProfile'));
const AttendanceManager = lazy(() => import('./pages/AttendanceManager'));
const RegisterStudent = lazy(() => import('./pages/RegisterStudent'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const SchoolLogin = lazy(() => import('./pages/SchoolLogin'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AcademicPanel = lazy(() => import('./pages/AcademicPanel'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const SuspendedScreen = lazy(() => import('./pages/SuspendedScreen'));

// Global Fetch Interceptor with SWR caching and request promise coalescing
const originalFetch = window.fetch;
const apiCache = new Map();
const pendingRequests = new Map();

function getCacheKey(url, options) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = options.headers || {};
  const tenantId = headers['x-tenant-id'] || '';
  const auth = headers['Authorization'] || '';
  return `${method}:${tenantId}:${auth}:${url}`;
}

window.fetch = function (url, options = {}) {
  let targetUrl = '';
  if (typeof url === 'string') {
    targetUrl = url;
  } else if (url && typeof url === 'object') {
    targetUrl = url.url || url.href || '';
  }

  let pathname = targetUrl;
  try {
    const parsed = new URL(targetUrl, window.location.origin);
    pathname = parsed.pathname;
  } catch (e) {}

  options.headers = options.headers || {};

  // 1. Context / headers injection (preserving original functionality)
  if (pathname.startsWith('/') || pathname.includes('/api/')) {
    if (pathname.startsWith('/api/platform/')) {
      delete options.headers['x-tenant-id'];
    } else if (!options.headers['x-tenant-id']) {
      const host = window.location.hostname;
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

  const method = (options.method || 'GET').toUpperCase();
  const isApiCall = pathname.startsWith('/') || pathname.includes('/api/');

  // For mutations (POST, PUT, DELETE, PATCH), invalidate the cache
  if (isApiCall && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    apiCache.clear();
    return originalFetch(url, options).then(async (response) => {
      if (response.status === 403) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          if (data.error === 'Suspended') {
            window.dispatchEvent(new CustomEvent('tenant-suspended', { detail: data }));
          }
        } catch (e) {}
      }
      return response;
    });
  }

  // Only apply caching to API GET requests
  if (method !== 'GET' || !isApiCall) {
    return originalFetch(url, options);
  }

  const cacheKey = getCacheKey(targetUrl, options);
  const now = Date.now();
  const cached = apiCache.get(cacheKey);

  // Return fresh cache (within 5 seconds)
  if (cached && (now - cached.timestamp < 5000)) {
    return Promise.resolve(cached.response.clone());
  }

  // Return stale cache (between 5s and 5m) and trigger background revalidation (SWR)
  if (cached && (now - cached.timestamp < 300000)) {
    if (!pendingRequests.has(cacheKey)) {
      const revalidatePromise = originalFetch(url, options)
        .then(async (response) => {
          pendingRequests.delete(cacheKey);
          if (response.ok) {
            apiCache.set(cacheKey, {
              response: response.clone(),
              timestamp: Date.now()
            });
            window.dispatchEvent(new CustomEvent('api-cache-updated', { detail: { url: targetUrl } }));
          }
          return response;
        })
        .catch((err) => {
          pendingRequests.delete(cacheKey);
        });
      pendingRequests.set(cacheKey, revalidatePromise);
    }
    return Promise.resolve(cached.response.clone());
  }

  // Check if identical request is already in-flight
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey).then(res => res.clone());
  }

  // Perform full fresh fetch
  const fetchPromise = originalFetch(url, options)
    .then(async (response) => {
      pendingRequests.delete(cacheKey);
      
      if (response.status === 403) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          if (data.error === 'Suspended') {
            window.dispatchEvent(new CustomEvent('tenant-suspended', { detail: data }));
          }
        } catch (e) {}
      }

      if (response.ok) {
        apiCache.set(cacheKey, {
          response: response.clone(),
          timestamp: Date.now()
        });
      }
      return response;
    })
    .catch((err) => {
      pendingRequests.delete(cacheKey);
      throw err;
    });

  pendingRequests.set(cacheKey, fetchPromise);
  return fetchPromise.then(res => res.clone());
}

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
  const [isSuspended, setIsSuspended] = useState(false);

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
      const res = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
        setIsSuspended(false);
      } else if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        if (data.error === 'Suspended') {
          setIsSuspended(true);
          if (data.school) {
            setSchoolDetails(data.school);
          }
        }
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

  useEffect(() => {
    const handleTenantSuspended = (e) => {
      setIsSuspended(true);
      if (e.detail && e.detail.school) {
        setSchoolDetails(e.detail.school);
      }
    };
    window.addEventListener('tenant-suspended', handleTenantSuspended);
    return () => window.removeEventListener('tenant-suspended', handleTenantSuspended);
  }, []);

  // Global Input Validation Handler for all inputs and textareas in the application
  useEffect(() => {
    const handleInputValidation = (e) => {
      if (e._simulated) return;
      const target = e.target;
      if (!target) return;

      const isInput = target.tagName === 'INPUT';
      const isTextarea = target.tagName === 'TEXTAREA';
      if (!isInput && !isTextarea) return;

      // Bypass validation entirely for login forms, login pages, and password fields
      const isLoginForm = target.closest('[class*="login"]') || 
                           target.closest('[id*="login"]') || 
                           target.closest('form') && (
                             (target.closest('form').className || '').toLowerCase().includes('login') ||
                             (target.closest('form').getAttribute('id') || '').toLowerCase().includes('login')
                           );
      
      const isLoginView = !isDeveloperAdmin && !isAdmin && !isSchoolAdmin;
      const isSubadminLoginActive = !!activeSubadminLogin;
      
      const isPasswordField = target.getAttribute('type') === 'password' || 
                              (target.getAttribute('name') || target.name || '').toLowerCase().includes('password') || 
                              (target.getAttribute('id') || target.id || '').toLowerCase().includes('password');

      if (isLoginForm || isLoginView || isSubadminLoginActive || isPasswordField) {
        return;
      }

      const type = target.getAttribute('type') || 'text';
      const name = (target.getAttribute('name') || target.name || '').toLowerCase();
      const id = (target.getAttribute('id') || target.id || '').toLowerCase();
      const placeholder = (target.getAttribute('placeholder') || '').toLowerCase();
      const label = target.labels && target.labels.length > 0 ? target.labels[0].textContent.toLowerCase() : '';

      // Check if it is a phone number, pin number, or PAN card field:
      const isPhone = name.includes('phone') || name.includes('contact') || name.includes('mobile') || id.includes('phone') || id.includes('contact') || id.includes('mobile') || placeholder.includes('phone') || placeholder.includes('contact') || placeholder.includes('mobile');
      const isPin = name.includes('pin') || id.includes('pin') || placeholder.includes('pin') || placeholder.includes('postal') || name.includes('postal') || id.includes('postal') || name.includes('zip') || id.includes('zip');
      const isPan = name.includes('pan') || id.includes('pan') || placeholder.includes('pan') || label.includes('pan');

      const isNumericType = type === 'number' || target.getAttribute('inputmode') === 'numeric';
      const isNumericField = isNumericType || name.includes('amount') || name.includes('salary') || name.includes('marks') || name.includes('roll') || name.includes('price') || name.includes('fee') || name.includes('budget') || name.includes('rate') || name.includes('count') || name.includes('limit') || name.includes('percentage');

      const isEmail = type === 'email' || name.includes('email');
      const isPassword = type === 'password' || name.includes('password');
      const isUsername = name.includes('username') || name.includes('user') || id.includes('username') || id.includes('user');
      const isSubdomain = name.includes('subdomain') || id.includes('subdomain');
      const isUrl = type === 'url' || name.includes('url') || name.includes('logo') || name.includes('website') || name.includes('attachment') || name.includes('photo') || name.includes('file');
      const isDocFile = type === 'file';

      const isBypassedString = isEmail || isPassword || isUsername || isSubdomain || isUrl || isDocFile;
      const isGradeName = name === 'gradename' || 
                          (target.classList && target.classList.contains('grade-name-input')) || 
                          target.getAttribute('data-type') === 'grade-name' || 
                          placeholder.includes('xi, xii') || 
                          label.includes('grade name') ||
                          label.includes('grade/class') ||
                          label.includes('class/grade');

      let val = target.value;
      let originalVal = val;

      if (isPhone) {
        // Enforce phone number format: allow only digits, +, -, spaces, parentheses, and max length of 15
        val = val.replace(/[^0-9+\-\s()]/g, '');
        if (val.length > 15) val = val.substring(0, 15);
      } else if (isPin) {
        // Enforce pin code format: only digits, max length 10
        val = val.replace(/[^0-9]/g, '');
        if (val.length > 10) val = val.substring(0, 10);
      } else if (isPan) {
        // Enforce PAN card format: only letters and digits, max length 10
        val = val.replace(/[^a-zA-Z0-9]/g, '');
        if (val.length > 10) val = val.substring(0, 10);
      } else if (isGradeName) {
        // Enforce Grade Name/Class format: allow letters, digits, and spaces, max length 50
        val = val.replace(/[^a-zA-Z0-9\s]/g, '');
        if (val.length > 50) val = val.substring(0, 50);
      } else if (isNumericField) {
        // Enforce numeric field: allow only digits and optional decimal point
        val = val.replace(/[^0-9.]/g, '');
        // prevent double decimals
        const parts = val.split('.');
        if (parts.length > 2) {
          val = parts[0] + '.' + parts.slice(1).join('');
        }
        if (val.length > 25) val = val.substring(0, 25);
      } else if (isBypassedString) {
        // Bypassed strings (email, password, etc.) - keep whatever characters, but limit standard input length to 100 (except passwords / URLs which can be 200)
        const maxLengthLimit = (isUrl || isPassword) ? 200 : 100;
        if (val.length > maxLengthLimit) val = val.substring(0, maxLengthLimit);
      } else {
        // String section (Names, generic titles, etc.)
        // Limit to string/letters only (A-Z, a-z and spaces) and max 50 characters
        val = val.replace(/[^a-zA-Z\s]/g, '');
        if (val.length > 50) val = val.substring(0, 50);
      }

      // Check if it's a description section (descriptions, textareas, addresses, remarks, notes)
      const isDescriptionField = name.includes('description') || name.includes('remarks') || name.includes('notes') || name.includes('address') || isTextarea;
      if (isDescriptionField) {
        // Allow any characters but limit to 2000 characters validation
        if (originalVal.length > 2000) {
          val = originalVal.substring(0, 2000);
        } else {
          val = originalVal; // restore original characters for descriptions (we don't strip text)
        }
      }

      if (originalVal !== val) {
        target.value = val;
        // Trigger React's internal fiber state re-render
        const prototype = target.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (valueSetter) {
          valueSetter.call(target, val);
        }
        const event = new Event('input', { bubbles: true });
        event._simulated = true;
        target.dispatchEvent(event);
      }
    };

    document.addEventListener('input', handleInputValidation, true);
    return () => document.removeEventListener('input', handleInputValidation, true);
  }, []);


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

    return (
      <>
        <KeepAlive active={activeView === 'profile'}>
          <UserProfile onProfileUpdate={setUserProfile} showToast={showToast} onLogout={handleLogout} />
        </KeepAlive>

        <KeepAlive active={activeView === 'students' || activeView === 'default'}>
          <StudentDirectory readOnly={true} onAddClick={() => setActiveView('register-student')} />
        </KeepAlive>

        {activeView === 'register-student' && (
          <RegisterStudent setActiveView={setActiveView} />
        )}

        {activeView === 'add-teacher' && (
          <AddTeacher setActiveView={setActiveView} />
        )}

        <KeepAlive active={activeView === 'teachers' || activeView === 'teacher-list'}>
          <TeacherList setActiveView={setActiveView} readOnly={true} onAddClick={() => setActiveView('add-teacher')} />
        </KeepAlive>

        {activeView === 'add-staff' && (
          <AddStaff setActiveView={setActiveView} />
        )}

        <KeepAlive active={activeView === 'staff'}>
          <StaffDirectory readOnly={true} onAddClick={() => setActiveView('add-staff')} />
        </KeepAlive>

        <KeepAlive active={activeView === 'finance'}>
          <AccountManagementPortal />
        </KeepAlive>

        <KeepAlive active={activeView === 'employee-attendance'}>
          <AttendanceManager />
        </KeepAlive>

        <KeepAlive active={activeView === 'school'}>
          <SchoolProfile schoolDetails={schoolDetails} fetchSchoolDetails={fetchSchoolDetails} isDeveloperAdmin={isDeveloperAdmin} />
        </KeepAlive>

        <KeepAlive active={activeView === 'academic-calendar'}>
          <AcademicPanel subView="academic-calendar" setAdminView={setActiveView} />
        </KeepAlive>

        {activeView === 'admin-login' && (
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
        )}
      </>
    );
  };

  const isLoggedIn = isDeveloperAdmin || isAdmin || isSchoolAdmin;

  if (isSuspended && !isDeveloperAdmin) {
    return (
      <Suspense fallback={<SkeletonLoader type="page" />}>
        <SuspendedScreen 
          schoolDetails={schoolDetails} 
          onUnsuspended={() => {
            setIsSuspended(false);
            fetchSchoolDetails();
          }} 
        />
      </Suspense>
    );
  }

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
      <Suspense fallback={<SkeletonLoader type="page" />}>
        <SchoolLogin 
          tenantSubdomain={loginTenant} 
          onLoginSuccess={handleLoginSuccess} 
        />
      </Suspense>
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
          <Suspense fallback={<SkeletonLoader type="page" />}>
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
          </Suspense>
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
          <Suspense fallback={<SkeletonLoader type="page" />}>
            {renderCurrentView()}
          </Suspense>
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
