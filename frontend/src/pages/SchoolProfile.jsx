import React, { useState, useEffect } from 'react';
import './SchoolProfile.css';
import { createPortal } from 'react-dom';

// Local slugify helper (mirrors backend utility)
const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const getSchoolSubdomainUrl = (subdomain, path = '') => {
  const { protocol, hostname, port } = window.location;
  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
  if (isIp) {
    const queryJoin = path.includes('?') ? '&' : '?';
    return `${protocol}//${hostname}${port ? `:${port}` : ''}${path}${queryJoin}tenant=${subdomain}`;
  }
  if (hostname === 'localhost') {
    return `${protocol}//${subdomain}.localhost${port ? `:${port}` : ''}${path}`;
  }
  const parts = hostname.split('.');
  if (parts.length > 2) {
    parts[0] = subdomain;
    return `${protocol}//${parts.join('.')}${port ? `:${port}` : ''}${path}`;
  } else {
    return `${protocol}//${subdomain}.${hostname}${port ? `:${port}` : ''}${path}`;
  }
};
import { 
  School as SchoolIcon,
  Users,
  UserCheck,
  UserCog,
  Plus,
  X,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Shield,
  Layers,
  Activity,
  Globe,
  Settings,
  CreditCard,
  Building,
  KeyRound,
  Copy,
  Play,
  Key,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight
} from 'lucide-react';


export default function SchoolProfile({ schoolDetails, fetchSchoolDetails, isDeveloperAdmin, devActiveTab }) {
  if (!isDeveloperAdmin) {
    return (
      <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
        <div className="glass-panel" style={{ 
          padding: '24px 32px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-secondary)) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 10px rgba(255, 107, 0, 0.25)'
          }}>
            <SchoolIcon size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>School Profile</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Branding & Telemetry Identity
            </p>
          </div>
        </div>

        <div className="glass-panel" style={{
          padding: '32px',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-secondary)) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              {schoolDetails?.logo ? <img src={schoolDetails.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} /> : (schoolDetails?.name || 'SC').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{schoolDetails?.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Domain: {schoolDetails?.subdomain || 'localhost'}.myschoolerp.com</p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            borderTop: '1px solid var(--border-glass)',
            paddingTop: '20px'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Principal</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>{schoolDetails?.principal || schoolDetails?.principalName || 'Not Assigned'}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Email Address</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>{schoolDetails?.email || 'Not Assigned'}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Phone Number</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>{schoolDetails?.phone || 'Not Assigned'}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Session / Period</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>{schoolDetails?.academicSession || '2026-2027'}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Billing Plan</span>
              <span style={{
                fontSize: '0.78rem',
                padding: '3px 10px',
                borderRadius: '10px',
                fontWeight: 700,
                display: 'inline-block',
                background: 'rgba(255, 107, 0, 0.08)',
                color: 'hsl(var(--color-primary))',
                border: '1px solid rgba(255, 107, 0, 0.15)'
              }}>{schoolDetails?.subscriptionPlan || 'Starter Plan'}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Address</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
                {schoolDetails?.address ? `${schoolDetails.address}, ${schoolDetails.city || ''}, ${schoolDetails.state || ''}` : 'Not Specified'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeTab = devActiveTab || 'dashboard';
  const [schools, setSchools] = useState([]);

  // States for Developer Admin managing a school's admin credentials
  const [selectedSchoolForCredentials, setSelectedSchoolForCredentials] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showConfirmCredentialsDialog, setShowConfirmCredentialsDialog] = useState(false);
  const [newSchoolUsername, setNewSchoolUsername] = useState('');
  const [newSchoolPassword, setNewSchoolPassword] = useState('');
  const [confirmSchoolPassword, setConfirmSchoolPassword] = useState('');
  const [credentialsModalLoading, setCredentialsModalLoading] = useState(false);
  const [credentialsModalError, setCredentialsModalError] = useState(null);

  const handleOpenManageCredentialsModal = (school) => {
    setSelectedSchoolForCredentials(school);
    setNewSchoolUsername(school.adminUsername || '');
    setNewSchoolPassword('');
    setConfirmSchoolPassword('');
    setCredentialsModalError(null);
    setShowCredentialsModal(true);
  };

  const validateStrength = (pass) => {
    if (pass.length < 8) return false;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    return hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleSaveChangesClick = () => {
    setCredentialsModalError(null);
    if (!newSchoolUsername || !newSchoolPassword || !confirmSchoolPassword) {
      setCredentialsModalError('All fields are required.');
      return;
    }
    if (newSchoolPassword !== confirmSchoolPassword) {
      setCredentialsModalError('New Password and Confirm Password do not match.');
      return;
    }
    if (!validateStrength(newSchoolPassword)) {
      setCredentialsModalError('Password must be at least 8 characters long, and contain uppercase, lowercase, numbers, and special characters.');
      return;
    }
    setShowConfirmCredentialsDialog(true);
  };

  const handleUpdateSchoolCredentials = async () => {
    setCredentialsModalError(null);
    if (!newSchoolUsername || !newSchoolPassword || !confirmSchoolPassword) {
      setCredentialsModalError('All fields are required.');
      setShowConfirmCredentialsDialog(false);
      return;
    }
    if (newSchoolPassword !== confirmSchoolPassword) {
      setCredentialsModalError('New Password and Confirm Password do not match.');
      setShowConfirmCredentialsDialog(false);
      return;
    }
    if (!validateStrength(newSchoolPassword)) {
      setCredentialsModalError('Password must be at least 8 characters long, and contain uppercase, lowercase, numbers, and special characters.');
      setShowConfirmCredentialsDialog(false);
      return;
    }

    setCredentialsModalLoading(true);
    try {
      const res = await fetch(`/api/platform/schools/${selectedSchoolForCredentials.id}/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newAdminUsername: newSchoolUsername,
          newAdminPassword: newSchoolPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({ message: data.message || 'Admin credentials updated successfully.', type: 'success' });
        setTimeout(() => setNotification(null), 4000);
        setShowCredentialsModal(false);
        setShowConfirmCredentialsDialog(false);
        fetchPlatformData();
      } else {
        setCredentialsModalError(data.error || 'Failed to update credentials.');
        setShowConfirmCredentialsDialog(false);
      }
    } catch (err) {
      setCredentialsModalError('Network error. Failed to connect to server.');
      setShowConfirmCredentialsDialog(false);
    } finally {
      setCredentialsModalLoading(false);
    }
  };

  const [analytics, setAnalytics] = useState({
    totalSchools: 0,
    activeSchools: 0,
    inactiveSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalStaff: 0,
    monthlyRevenue: '₹0',
    recentRegistrations: [],
    growthAnalytics: []
  });

  const [realtimeStats, setRealtimeStats] = useState({
    cpu: 24,
    ram: 42,
    activeSessions: 8,
    uptime: '14d 6h 32m'
  });

  const [plans, setPlans] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalMode, setPlanModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    features: ''
  });

  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    const interval = setInterval(() => {
      setRealtimeStats(prev => {
        const nextCpu = Math.max(12, Math.min(85, prev.cpu + Math.floor(Math.random() * 9) - 4));
        const nextRam = Math.max(38, Math.min(65, prev.ram + Math.floor(Math.random() * 3) - 1));
        const nextSessions = Math.max(5, Math.min(30, prev.activeSessions + Math.floor(Math.random() * 5) - 2));
        return {
          ...prev,
          cpu: nextCpu,
          ram: nextRam,
          activeSessions: nextSessions
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleOpenPlanModal = (mode, plan = null) => {
    setPlanModalMode(mode);
    setSelectedPlan(plan);
    if (mode === 'edit' && plan) {
      setPlanForm({
        name: plan.name,
        price: plan.price,
        features: plan.features
      });
    } else {
      setPlanForm({
        name: '',
        price: '',
        features: ''
      });
    }
    setShowPlanModal(true);
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = planModalMode === 'edit' ? `/api/platform/plans/${selectedPlan.id}` : '/api/platform/plans';
      const method = planModalMode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planForm)
      });
      if (res.ok) {
        showToast(planModalMode === 'edit' ? 'Plan updated successfully.' : 'Plan created successfully.', 'success');
        setShowPlanModal(false);
        fetchPlatformData();
      } else {
        showToast('Operation failed.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const handleDeletePlan = async (id) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      const res = await fetch(`/api/platform/plans/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Plan deleted successfully.', 'success');
        fetchPlatformData();
      } else {
        showToast('Failed to delete plan.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const totalPlanCount = Math.max(1, schools.length);

  const maxRevenue = Math.max(...(analytics.growthAnalytics || []).map(item => item.revenue), 100);
  const points = (analytics.growthAnalytics || []).map((item, idx) => {
    const x = 50 + idx * 85;
    const y = 140 - (item.revenue / maxRevenue) * 90;
    return { x, y, ...item };
  });

  const pathStr = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const fillPathStr = points.length > 0
    ? `${pathStr} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`
    : '';
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [notification, setNotification] = useState(null);

  // Modals Toggles
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedSchool, setSelectedSchool] = useState(null);
  


  // Form State
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    logo: '',
    principalName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    academicSession: '2026-2027',
    subscriptionPlan: 'Starter',
    adminName: '',
    adminEmail: '',
    adminUsername: '',
    adminPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchPlatformData = async () => {
    setLoading(true);
    try {
      // 1. Fetch schools list
      const resSchools = await fetch('/api/platform/schools');
      if (resSchools.ok) {
        const dataSchools = await resSchools.json();
        setSchools(dataSchools);
      }
      
      // 2. Fetch platform analytics
      const resAnalytics = await fetch('/api/platform/analytics');
      if (resAnalytics.ok) {
        const dataAnalytics = await resAnalytics.json();
        setAnalytics(dataAnalytics);
      }

      // 3. Fetch subscription plans
      const resPlans = await fetch('/api/platform/plans');
      if (resPlans.ok) {
        const dataPlans = await resPlans.json();
        setPlans(dataPlans);
      }
    } catch (err) {
      console.error('Failed to load platform owner data:', err);
      showToast('Error syncing platform owner workspace.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Run initial REST load as a fallback/initial state
    fetchPlatformData();

    // 2. Establish WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `${window.location.hostname}:5000`
      : window.location.host;

    let ws;
    let reconnectTimeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWS = () => {
      ws = new WebSocket(`${protocol}//${wsHost}`);

      ws.onopen = () => {
        console.log('[WebSocket] Connected to real-time update stream.');
        reconnectAttempts = 0; // Reset attempts on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'PLATFORM_STATE_UPDATE') {
            const { analytics: dataAnalytics, schools: dataSchools, plans: dataPlans } = message.data;
            setAnalytics(dataAnalytics);
            setSchools(dataSchools);
            setPlans(dataPlans);
          }
        } catch (err) {
          console.error('[WebSocket] Failed to process message:', err);
        }
      };

      ws.onclose = () => {
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(`[WebSocket] Connection closed. Reconnecting in 3 seconds (Attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
          reconnectTimeout = setTimeout(connectWS, 3000);
        } else {
          console.warn('[WebSocket] Maximum reconnection attempts reached. Real-time updates disabled (page will use static REST data).');
        }
      };

      ws.onerror = (err) => {
        if (reconnectAttempts < maxReconnectAttempts) {
          console.error('[WebSocket] Error caught:', err);
        }
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '',
      subdomain: '',
      logo: '',
      principalName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      academicSession: '2026-2027',
      subscriptionPlan: 'Starter',
      adminName: '',
      adminEmail: '',
      adminUsername: '',
      adminPassword: ''
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleOpenEditModal = (school) => {
    setModalMode('edit');
    setSelectedSchool(school);
    setFormData({
      name: school.name || '',
      subdomain: school.subdomain || '',
      logo: school.logo || '',
      principalName: school.principalName || '',
      email: school.email || '',
      phone: school.phone || '',
      address: school.address || '',
      city: school.city || '',
      state: school.state || '',
      country: school.country || 'India',
      academicSession: school.academicSession || '2026-2027',
      subscriptionPlan: school.subscriptionPlan || 'Starter',
      adminName: school.adminName || '',
      adminEmail: school.adminEmail || '',
      adminUsername: school.adminUsername || '',
      adminPassword: '' // keep password blank during edits
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) errors.name = 'School Name is required.';
    
    if (formData.email && !emailRegex.test(formData.email.trim())) {
      errors.email = 'Invalid School Email format.';
    }

    if (modalMode === 'add') {
      if (!formData.subdomain.trim()) {
        errors.subdomain = 'Subdomain is required.';
      } else if (!/^[a-zA-Z]+(-[a-zA-Z]+)*$/.test(formData.subdomain)) {
        errors.subdomain = 'Subdomain must contain only letters (a-z, A-Z) and hyphens.';
      }
      
      if (!formData.adminEmail.trim()) {
        errors.adminEmail = 'Admin Email is required.';
      } else if (!emailRegex.test(formData.adminEmail.trim())) {
        errors.adminEmail = 'Invalid Admin Email format.';
      }

      if (!formData.adminUsername.trim()) errors.adminUsername = 'Admin Username is required.';
      if (!formData.adminPassword.trim()) {
        errors.adminPassword = 'Admin Password is required.';
      } else {
        const pass = formData.adminPassword;
        if (pass.length < 8) {
          errors.adminPassword = 'Admin password must be at least 8 characters long.';
        } else if (!/[A-Z]/.test(pass)) {
          errors.adminPassword = 'Admin password must contain at least one uppercase letter.';
        } else if (!/[a-z]/.test(pass)) {
          errors.adminPassword = 'Admin password must contain at least one lowercase letter.';
        } else if (!/[0-9]/.test(pass)) {
          errors.adminPassword = 'Admin password must contain at least one number.';
        } else if (!/[^A-Za-z0-9]/.test(pass)) {
          errors.adminPassword = 'Admin password must contain at least one special character.';
        }
      }
    } else {
      if (formData.adminEmail && !emailRegex.test(formData.adminEmail.trim())) {
        errors.adminEmail = 'Invalid Admin Email format.';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let res;
      if (modalMode === 'add') {
        res = await fetch('/api/platform/schools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`/api/platform/schools/${selectedSchool.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      if (res.ok) {
        const resultData = await res.json();
        setShowAddModal(false);
        fetchPlatformData();
        if (fetchSchoolDetails) fetchSchoolDetails();
        if (modalMode === 'add') {
          const localUrl = getSchoolSubdomainUrl(resultData.subdomain);
          showToast(
            `School "${resultData.name}" onboarded! Portal: ${localUrl}`,
            'success'
          );
        } else {
          showToast('School parameters updated successfully!', 'success');
        }
      } else {
        const errorData = await res.json();
        showToast(errorData.details || errorData.error || 'Failed to complete registration operation.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error connecting to platform registry.', 'error');
    }
  };

  const handleToggleSuspend = async (school) => {
    const action = school.status === 'Active' ? 'suspend' : 'activate';
    const confirmMsg = `Are you sure you want to ${action} ${school.name}?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/platform/schools/${school.id}/${action}`, {
        method: 'POST'
      });
      if (res.ok) {
        showToast(`School ${action === 'suspend' ? 'suspended' : 'activated'} successfully.`, 'success');
        fetchPlatformData();
      } else {
        showToast('Operation failed.', 'error');
      }
    } catch (err) {
      showToast('Network error during operation.', 'error');
    }
  };

  const handleDeleteSchool = async (school) => {
    const confirmMsg = `CRITICAL WARNING: This will permanently delete ${school.name} and PURGE all of its isolated tenant database data. This operation CANNOT be undone. Type "DELETE" to confirm:`;
    const confirmation = prompt(confirmMsg);
    if (confirmation !== 'DELETE') {
      showToast('Deletion aborted.', 'info');
      return;
    }

    try {
      const res = await fetch(`/api/platform/schools/${school.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('School tenant completely purged from platform.', 'success');
        fetchPlatformData();
      } else {
        showToast('Purging failed.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };



  // Launch School Portal - opens in a new tab without ending superadmin session
  const handleLaunchPortal = (school) => {
    localStorage.setItem('from_dev_admin', 'true');
    const devToken = localStorage.getItem('token') || '';
    const targetUrl = getSchoolSubdomainUrl(school.subdomain, `/?username=${encodeURIComponent(school.adminUsername)}&password=${encodeURIComponent(school.adminPassword)}&from_dev_admin=true&dev_token=${encodeURIComponent(devToken)}`);
    window.open(targetUrl, '_blank');
  };



  // Filtered list
  const filteredSchools = schools.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.subdomain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'All' || s.subscriptionPlan === planFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div className="glass-panel" style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 30000010,
          background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
        }}>
          {notification.type === 'error' ? <AlertCircle size={22} /> : <CheckCircle size={22} />}
          <div>
            <strong style={{ display: 'block', fontSize: '0.9rem' }}>
              {notification.type === 'error' ? 'Action Failed' : 'Success'}
            </strong>
            <span style={{ fontSize: '0.8rem' }}>{notification.message}</span>
          </div>
        </div>
      )}

      {/* PLATFORM HEADER */}
      <div className="glass-panel" style={{ 
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-md)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF8C42 0%, #FF6B00 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 10px rgba(255, 107, 0, 0.25)'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Developer Admin Panel</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Multi-Tenant ERP Master Registry
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchPlatformData}
            className="btn-secondary"
            disabled={loading}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-glass-active)'
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Telemetry
          </button>
          {activeTab === 'schools' && (
            <button
              onClick={handleOpenAddModal}
              className="btn-primary"
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} /> Onboard School
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
          <Activity className="animate-spin" size={40} style={{ color: 'hsl(var(--color-primary))' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Syncing school telemetry statistics...</p>
        </div>
      ) : activeTab === 'dashboard' ? (
        /* PLATFORM DASHBOARD VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* SAAS TOP ACTIONBAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 850, margin: 0, color: 'var(--text-main)' }}>Platform Operations & MRR Insights</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Real-time business intelligence, subscription health, and revenue telemetry.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Month Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter Month</span>
                <select 
                  className="select-custom" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ borderRadius: '10px', fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  <option value="All">All Months</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
              </div>

              {/* Year Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter Year</span>
                <select 
                  className="select-custom" 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{ borderRadius: '10px', fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  <option value="All">All Years</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </div>
            </div>
          </div>

          {/* DYNAMIC CALCULATIONS ACCORDING TO SELECTED MONTH AND YEAR FILTERS */}
          {(() => {
            const filteredSchoolsForRevenue = schools.filter(s => {
              if (s.status !== 'Active') return false;
              const sDate = new Date(s.createdAt);
              const sMonth = sDate.toLocaleString('default', { month: 'long' });
              const sYear = sDate.getFullYear().toString();
              const monthMatch = selectedMonth === 'All' || sMonth === selectedMonth;
              const yearMatch = selectedYear === 'All' || sYear === selectedYear;
              return monthMatch && yearMatch;
            });

            let calculatedMonthlyRevenue = 0;
            filteredSchoolsForRevenue.forEach(s => {
              const matchedPlan = plans.find(p => p.id === s.subscriptionPlan || p.name === s.subscriptionPlan);
              if (matchedPlan) {
                calculatedMonthlyRevenue += parseFloat(matchedPlan.price) || 0;
              }
            });

            const calculatedYearlyRevenue = calculatedMonthlyRevenue * 12;
            const calculatedLifetimeRevenue = calculatedMonthlyRevenue * 18.5;

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                
                {/* Card 1: Monthly Recurring Revenue (MRR) */}
                <div className="glass-panel" style={{ 
                  padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
                  border: '1.5px solid rgba(255, 140, 66, 0.35)', 
                  boxShadow: '0 10px 25px -5px rgba(255, 140, 66, 0.1)',
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(255, 140, 66, 0.04) 100%)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly Recurring Revenue (MRR)</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 140, 66, 0.1)', color: '#FF8C42', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard size={18} />
                    </div>
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800 }}>₹{calculatedMonthlyRevenue.toLocaleString()}</strong>
                    <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                      <TrendingUp size={12} /> +12.4% <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>from last month</span>
                    </span>
                  </div>
                </div>

                {/* Card 2: Annual Recurring Revenue (ARR) */}
                <div className="glass-panel" style={{ 
                  padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
                  border: '1.5px solid rgba(139, 92, 246, 0.35)', 
                  boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.1)',
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(139, 92, 246, 0.04) 100%)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Annualized Run Rate (ARR)</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800 }}>
                      ₹{calculatedYearlyRevenue.toLocaleString()}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                      <TrendingUp size={12} /> +14.8% <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Projected LTV</span>
                    </span>
                  </div>
                </div>

                {/* Card 3: Active Tenants & Suspensions */}
                <div className="glass-panel" style={{ 
                  padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
                  border: '1.5px solid rgba(16, 185, 129, 0.35)', 
                  boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.1)',
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.04) 100%)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active School Tenants</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={18} />
                    </div>
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800 }}>{filteredSchoolsForRevenue.length}</strong>
                    <span style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                      <AlertTriangle size={12} /> {schools.filter(s => {
                        if (s.status === 'Active') return false;
                        const sDate = new Date(s.createdAt);
                        const sMonth = sDate.toLocaleString('default', { month: 'long' });
                        const sYear = sDate.getFullYear().toString();
                        return (selectedMonth === 'All' || sMonth === selectedMonth) && (selectedYear === 'All' || sYear === selectedYear);
                      }).length} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>tenants suspended</span>
                    </span>
                  </div>
                </div>

                {/* Card 4: Total Onboarded Schools */}
                <div className="glass-panel" style={{ 
                  padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
                  border: '1.5px solid rgba(6, 182, 212, 0.35)', 
                  boxShadow: '0 10px 25px -5px rgba(6, 182, 212, 0.1)',
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(6, 182, 212, 0.04) 100%)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Schools Registered</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SchoolIcon size={18} />
                    </div>
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800 }}>
                      {schools.filter(s => {
                        const sDate = new Date(s.createdAt);
                        const sMonth = sDate.toLocaleString('default', { month: 'long' });
                        const sYear = sDate.getFullYear().toString();
                        return (selectedMonth === 'All' || sMonth === selectedMonth) && (selectedYear === 'All' || sYear === selectedYear);
                      }).length}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                      <TrendingUp size={12} /> +100% <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Lifetime onboarding rate</span>
                    </span>
                  </div>
                </div>

                {/* Card 5: Lifetime Revenue Estimation */}
                <div className="glass-panel" style={{ 
                  padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
                  border: '1.5px solid rgba(245, 158, 11, 0.35)', 
                  boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.1)',
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(245, 158, 11, 0.04) 100%)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Lifetime Platform Gross</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building size={18} />
                    </div>
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800 }}>
                      ₹{calculatedLifetimeRevenue.toLocaleString()}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                      <TrendingUp size={12} /> +22.4% <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Net Gross margins</span>
                    </span>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* TWO COLUMN PERFORMANCE DECK */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
            
            {/* LEFT COLUMN: GRAPH, TRANSACTION STATS, AND USAGE INDEX */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* MRR Performance trend Area chart */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Platform Revenue Trend (MRR)</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Historical recurring receipts analysis</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#FF8C42', fontWeight: 700 }}>Peak MRR: ₹{maxRevenue.toLocaleString()}</span>
                </div>
                <div style={{ width: '100%', height: '180px', position: 'relative', marginTop: '10px' }}>
                  <svg viewBox="0 0 420 170" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF8C42" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#FF8C42" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid Lines */}
                    {[30, 70, 110, 150].map((y, idx) => (
                      <line key={idx} x1="30" y1={y} x2="400" y2={y} stroke="var(--border-glass)" strokeDasharray="3 3" />
                    ))}
                    
                    {/* Area Fill */}
                    {fillPathStr && <path d={fillPathStr} fill="url(#areaGrad)" />}
                    
                    {/* Line Stroke */}
                    {pathStr && <path d={pathStr} fill="none" stroke="#FF8C42" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                    
                    {/* Nodes and Tooltips */}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#FF8C42" strokeWidth="2.5" />
                        <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fill="var(--text-main)" fontWeight="bold">₹{p.revenue}</text>
                        <text x={p.x} y="165" textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontWeight="600">{p.month}</text>
                      </g>
                    ))}
                    <line x1="30" y1="150" x2="400" y2="150" stroke="var(--border-glass)" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              {/* Dynamic Payment operations analytics grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* Payment status widget */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Payment Processing Health</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Successful Transactions
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>96.2% (148)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /> Pending Clearances
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>2.6% (4)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> Failed / Refunded
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>1.2% (2)</span>
                    </div>
                  </div>
                </div>

                {/* Subscriptions Renewals Tracker */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Subscription Operational Metrics</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-main)' }}>Net Expansion Churn Rate</span>
                      <span style={{ color: '#10b981' }}>0.48% (Lowest)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-main)' }}>Upgrades / Downgrades</span>
                      <span style={{ color: '#8b5cf6' }}>+5 Upgraded</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-main)' }}>Expiring in 30 Days</span>
                      <span style={{ color: '#ef4444' }}>2 schools</span>
                    </div>
                  </div>
                </div>

              </div>


            </div>

            {/* RIGHT COLUMN: DISTRIBUTION, RECENT FEED, TOP TENANTS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Plan distribution progress list */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Tenant Subscription Plan Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {plans.length > 0 ? (
                    plans.map((p, idx) => {
                      const count = schools.filter(s => s.subscriptionPlan === p.id || s.subscriptionPlan === p.name).length;
                      const percent = Math.round((count / totalPlanCount) * 100);
                      const colors = ['#FF8C42', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899'];
                      const color = colors[idx % colors.length];
                      return (
                        <div key={p.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px', fontWeight: 600 }}>
                            <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                              {p.name} (₹{p.price}/mo)
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>{count} schools ({percent}%)</span>
                          </div>
                          <div style={{ height: '10px', background: 'var(--bg-glass-active)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${percent}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>
                      No active subscription plans configured yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Modern Top schools list */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Top Revenue School Tenants</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {schools.slice(0, 3).map(s => {
                    const matchedPlan = plans.find(p => p.id === s.subscriptionPlan || p.name === s.subscriptionPlan);
                    const cost = matchedPlan ? matchedPlan.price : 0;
                    return (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
                        <div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>{s.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.subdomain}.localhost</span>
                        </div>
                        <strong style={{ fontSize: '0.88rem', color: '#10b981' }}>₹{cost}/mo</strong>
                      </div>
                    );
                  })}
                  {schools.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>No school data available.</p>
                  )}
                </div>
              </div>

              {/* RECENT REGISTRATIONS FEED */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Recent Platform Registrations</h3>
                  <span style={{ fontSize: '0.74rem', color: 'hsl(var(--color-primary))', fontWeight: 600 }}>Real-time</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analytics.recentRegistrations?.length > 0 ? (
                    analytics.recentRegistrations.map(school => (
                      <div 
                        key={school.id} 
                        onClick={() => handleLaunchPortal(school)}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', 
                          borderBottom: '1px solid var(--border-glass)', cursor: 'pointer',
                          padding: '10px', borderRadius: '8px', transition: 'background 0.2s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 107, 0, 0.04)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px', 
                          background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-secondary)) 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.85rem'
                        }}>
                          {school.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block', color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {school.name}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'hsl(var(--color-primary))', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ExternalLink size={10} /> Open Portal
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)' }}>
                            {new Date(school.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span style={{ 
                            fontSize: '0.62rem', fontWeight: 'bold', color: school.status === 'Active' ? '#10b981' : '#ef4444',
                            textTransform: 'uppercase'
                          }}>{school.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>No onboarded schools yet.</p>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : activeTab === 'plans' ? (
        /* PLATFORM SUBSCRIPTION PLANS VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Platform Subscription Tiers & Pricing</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Configure tenant subscription offerings, monthly recurring fees, and operational limits.
              </p>
            </div>
            <button 
              onClick={() => handleOpenPlanModal('add')}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', fontWeight: 700 }}
            >
              <Plus size={16} /> Create Custom Plan
            </button>
          </div>

          {plans.length === 0 ? (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CreditCard size={48} style={{ margin: '0 auto 16px auto', opacity: 0.4, color: 'hsl(var(--color-primary))' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 750, color: 'var(--text-main)', margin: '0 0 6px 0' }}>No Subscription Plans Found</h4>
              <p style={{ fontSize: '0.82rem', margin: 0 }}>Click "Create Custom Plan" above to configure your first platform pricing model.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', width: '100%', justifyContent: 'flex-start' }}>
              {plans.map(p => (
                <div key={p.id} className="glass-panel animate-scale-up" style={{ 
                  width: '280px', 
                  height: '300px', 
                  padding: '22px 24px', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  position: 'relative',
                  border: '1px solid var(--border-glass)'
                }}>
                  {/* Top Portion */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginRight: '45px' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 850, margin: 0, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h4>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: 'hsl(var(--color-primary))' }}>₹{p.price}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ month</span>
                    </div>
                  </div>

                  {/* Actions (Absolute at top-right corner) */}
                  <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleOpenPlanModal('edit', p)}
                      style={{ background: 'var(--bg-glass-active)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Edit Plan"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeletePlan(p.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Delete Plan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Divider and Features list */}
                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', flex: 1, marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Plan Entitlements</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {p.features ? (p.features.split(',').map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'start', gap: '8px', fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 550 }}>
                          <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem', lineHeight: 1 }}>✓</span>
                          <span style={{ lineHeight: '1.2' }}>{feat.trim()}</span>
                        </div>
                      ))) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No features specified</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PLAN MODAL */}
          {showPlanModal && createPortal(
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              zIndex: 30000000, padding: '20px'
            }}>
              <div className="animate-scale-up" style={{
                width: '100%', maxWidth: '480px',
                padding: '32px', borderRadius: '16px', background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                display: 'flex', flexDirection: 'column', gap: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{planModalMode === 'edit' ? 'Edit Subscription Plan' : 'Create Subscription Plan'}</h4>
                  <button onClick={() => setShowPlanModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handlePlanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Plan Name *</label>
                    <input 
                      type="text" required className="form-control" placeholder="e.g. Starter Tier, Platinum Pack"
                      value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Monthly Subscription Fee (₹ INR) *</label>
                    <input 
                      type="number" required min="0" className="form-control" placeholder="e.g. 10000, 25000"
                      value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Plan Features / Entitlements (Comma separated)</label>
                    <textarea 
                      className="form-control" rows="3" placeholder="e.g. Core ERP modules, 200 Students max, Email support"
                      value={planForm.features} onChange={e => setPlanForm({ ...planForm, features: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" onClick={() => setShowPlanModal(false)} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 600 }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: 600 }}>Save Plan</button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
        </div>
      ) : (
        /* PLATFORM SCHOOL LIST REGISTRY VIEW */
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SEARCH, FILTER AND ONBOARD CONTROL ROW */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
              
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by school, code, subdomain..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '38px', borderRadius: '10px' }}
                />
              </div>

              {/* Plan Filter */}
              <select 
                className="select-custom" 
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                style={{ borderRadius: '10px' }}
              >
                <option value="All">All Plans</option>
                {plans.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select 
                className="select-custom" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ borderRadius: '10px' }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Suspended">Suspended Only</option>
              </select>

            </div>
          </div>

          {/* SCHOOL LIST CARDS */}
          {filteredSchools.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
              gap: '16px'
            }}>
              {filteredSchools.map(school => (
                <div key={school.id} className="glass-panel" style={{
                  padding: '20px', borderRadius: '12px',
                  border: '1px solid var(--border-glass)',
                  display: 'flex', flexDirection: 'column', gap: '14px',
                  transition: 'all 0.2s ease',
                  cursor: 'default'
                }}>
                  {/* Header: Logo + Name + Status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                        background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-secondary)) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem'
                      }}>
                        {school.logo ? <img src={school.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} /> : school.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{school.name}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{school.city}, {school.state}</span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.65rem', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                      background: school.status === 'Active' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      color: school.status === 'Active' ? '#10b981' : '#ef4444',
                      border: school.status === 'Active' ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)'
                    }}>{school.status}</span>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', marginBottom: '2px' }}>School Code</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{school.code}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', marginBottom: '2px' }}>Principal</span>
                      <span style={{ color: 'var(--text-main)' }}>{school.principalName}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', marginBottom: '2px' }}>Plan</span>
                      <span style={{
                        fontSize: '0.68rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, display: 'inline-block',
                        background: school.subscriptionPlan === 'Premium' ? 'rgba(245, 158, 11, 0.08)' : school.subscriptionPlan === 'Growth' ? 'rgba(255, 107, 0, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                        color: school.subscriptionPlan === 'Premium' ? '#f59e0b' : school.subscriptionPlan === 'Growth' ? 'hsl(var(--color-primary))' : 'var(--text-muted)',
                        border: school.subscriptionPlan === 'Premium' ? '1px solid rgba(245, 158, 11, 0.15)' : school.subscriptionPlan === 'Growth' ? '1px solid rgba(255, 107, 0, 0.15)' : '1px solid rgba(100, 116, 139, 0.15)'
                      }}>{school.subscriptionPlan}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', marginBottom: '2px' }}>Created</span>
                      <span style={{ color: 'var(--text-main)' }}>{new Date(school.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                    </div>
                  </div>

                  {/* Enrollments */}
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.76rem', padding: '10px 12px', background: 'var(--bg-glass-active)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-main)' }}>Students: <strong>{school.studentCount || 0}</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>Staff: <strong>{school.teacherCount || 0}</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>Employees: <strong>{school.staffCount || 0}</strong></span>
                  </div>



                  {/* Subdomain + Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                      <a 
                        href={getSchoolSubdomainUrl(school.subdomain)}
                        onClick={(e) => { e.preventDefault(); handleLaunchPortal(school); }}
                        title="Open Login Portal"
                        style={{ 
                          fontSize: '0.72rem', color: 'hsl(var(--color-primary))', 
                          display: 'block', 
                          textDecoration: 'underline', fontWeight: 600, cursor: 'pointer',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          transition: 'all 0.2s ease',
                          flex: 1
                        }}
                      >
                        {getSchoolSubdomainUrl(school.subdomain)}
                      </a>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(getSchoolSubdomainUrl(school.subdomain));
                          showToast('Login URL copied to clipboard!', 'success');
                        }}
                        className="btn-secondary" 
                        title="Copy URL" 
                        style={{ padding: '3px 6px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => handleOpenManageCredentialsModal(school)} 
                        className="btn-secondary" 
                        title="Manage Credentials" 
                        style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', color: 'hsl(var(--color-primary))' }}
                      >
                        <Key size={15} />
                      </button>

                      <button onClick={() => handleOpenEditModal(school)} className="btn-secondary" title="Edit School" style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <Edit2 size={15} />
                      </button>

                      <button 
                        onClick={() => handleToggleSuspend(school)} 
                        className="btn-secondary" 
                        title={school.status === 'Active' ? 'Suspend School' : 'Unsuspend School'} 
                        style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', color: school.status === 'Active' ? '#ef4444' : '#10b981' }}
                      >
                        {school.status === 'Active' ? <AlertTriangle size={15} /> : <Play size={15} />}
                      </button>
                      <button onClick={() => handleDeleteSchool(school)} className="btn-secondary" title="Delete Tenant" style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', color: 'rgb(var(--color-danger-rgb))' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
              No school records matching active filters.
            </div>
          )}

        </div>
      )}

      {/* 1. ONBOARD / EDIT SCHOOL MODAL */}
      {showAddModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 30000000, padding: '20px'
        }}>
          <div className="animate-scale-up" style={{
            width: '100%', maxWidth: '720px', maxHeight: '88vh', overflowY: 'auto',
            padding: '32px', borderRadius: '16px', background: 'var(--bg-glass)',
            border: '1px solid var(--border-glass)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', gap: '24px'
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {modalMode === 'add' ? 'Onboard New School Tenant' : `Modify ${selectedSchool.name} Configuration`}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* SECTION A: SCHOOL IDENTITY */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  I. School Identity & Brand
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>School Name *</label>
                    <input 
                      type="text" name="name" className="form-control" placeholder="e.g. Green Valley High School"
                      value={formData.name} onChange={handleInputChange} required
                    />
                    {formErrors.name && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label>School Subdomain *</label>
                    <input 
                      type="text" name="subdomain" className="form-control" placeholder="e.g. greenvalley"
                      value={formData.subdomain} onChange={handleInputChange} required
                      disabled={modalMode === 'edit'} // subdomain cannot be edited
                    />
                    {formErrors.subdomain && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.subdomain}</span>}
                    {formData.subdomain && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        URL: https://{slugify(formData.subdomain)}.myschoolerp.com
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Principal Name</label>
                    <input 
                      type="text" name="principalName" className="form-control" placeholder="e.g. Dr. John Doe"
                      value={formData.principalName} onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>School Logo</label>
                    {formData.logo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                        <img 
                          src={formData.logo} 
                          alt="Logo Preview" 
                          style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass-active)' }} 
                        />
                        <button 
                          type="button" 
                          onClick={handleRemoveLogo}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleLogoUpload}
                          style={{ display: 'none' }}
                          id="school-logo-file-input"
                        />
                        <label 
                          htmlFor="school-logo-file-input"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            border: '1.5px dashed var(--border-glass)',
                            borderRadius: '10px',
                            padding: '10px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            background: 'var(--bg-glass-active)',
                            textAlign: 'center'
                          }}
                        >
                          <Plus size={16} /> Upload School Logo
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION B: CONTACT & LOCATION */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  II. Contact & Location
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>School Email</label>
                    <input 
                      type="email" name="email" className="form-control" placeholder="contact@school.edu"
                      value={formData.email} onChange={handleInputChange}
                      style={{ borderColor: formErrors.email ? '#ef4444' : undefined }}
                    />
                    {formErrors.email && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label>School Phone Number</label>
                    <input 
                      type="text" name="phone" className="form-control" placeholder="10-digit phone number"
                      value={formData.phone} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); setFormData(p => ({ ...p, phone: v })); }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Street Address</label>
                  <input 
                    type="text" name="address" className="form-control" placeholder="123 Academic Way"
                    value={formData.address} onChange={handleInputChange}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label>City</label>
                    <input 
                      type="text" name="city" className="form-control" placeholder="City"
                      value={formData.city} onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input 
                      type="text" name="state" className="form-control" placeholder="State"
                      value={formData.state} onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input 
                      type="text" name="country" className="form-control" placeholder="Country"
                      value={formData.country} onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: SUBSCRIPTION TERMS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  III. Subscription & Plan
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Academic Session</label>
                    <input 
                      type="text" name="academicSession" className="form-control" placeholder="e.g. 2026-2027"
                      value={formData.academicSession} onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Subscription Plan Tier</label>
                    <select name="subscriptionPlan" className="select-custom" style={{ width: '100%' }} value={formData.subscriptionPlan} onChange={handleInputChange} disabled={plans.length === 0}>
                      {plans.length === 0 ? (
                        <option value="">No plans configured. Create a plan first.</option>
                      ) : (
                        plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (₹{p.price}/mo)</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION D: INITIAL ADMINISTRATOR CREDENTIALS */}
              {modalMode === 'add' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    IV. Initial Administrator Account
                  </span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Admin Full Name</label>
                      <input 
                        type="text" name="adminName" className="form-control" placeholder="Admin Name"
                        value={formData.adminName} onChange={handleInputChange} required
                      />
                    </div>

                    <div className="form-group">
                      <label>Admin Email *</label>
                      <input 
                        type="email" name="adminEmail" className="form-control" placeholder="admin@domain.com"
                        value={formData.adminEmail} onChange={handleInputChange} required
                        style={{ borderColor: formErrors.adminEmail ? '#ef4444' : undefined }}
                      />
                      {formErrors.adminEmail && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.adminEmail}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Admin Username *</label>
                      <input 
                        type="text" name="adminUsername" className="form-control" placeholder="school_admin"
                        value={formData.adminUsername} onChange={handleInputChange} required
                      />
                      {formErrors.adminUsername && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.adminUsername}</span>}
                    </div>

                    <div className="form-group">
                      <label>Admin Password *</label>
                      <input 
                        type="password" name="adminPassword" className="form-control" placeholder="••••••••"
                        value={formData.adminPassword} onChange={handleInputChange} required
                      />
                      {formErrors.adminPassword && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.adminPassword}</span>}
                    </div>
                  </div>
                </div>
              )}



              {/* Modal Actions Footer */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-glass)', paddingTop: '20px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ borderRadius: '8px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ borderRadius: '8px', minWidth: '130px' }}>
                  {modalMode === 'add' ? 'Confirm Onboard' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}



      {/* Target School Credentials Management Modal */}
      {showCredentialsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '440px',
            padding: '24px 30px',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key style={{ color: 'hsl(var(--color-primary))' }} size={20} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Manage Admin Credentials</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Update target school admin credentials for <strong>{selectedSchoolForCredentials?.name}</strong> (Subdomain: {selectedSchoolForCredentials?.subdomain}).
            </p>

            {credentialsModalError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{credentialsModalError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* New Admin Username */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>New School Admin Username</label>
                <input
                  type="text"
                  value={newSchoolUsername}
                  onChange={(e) => setNewSchoolUsername(e.target.value)}
                  style={{
                    background: 'var(--bg-form)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                  placeholder="Enter new admin username"
                />
              </div>

              {/* New Admin Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>New School Admin Password</label>
                <input
                  type="password"
                  value={newSchoolPassword}
                  onChange={(e) => setNewSchoolPassword(e.target.value)}
                  style={{
                    background: 'var(--bg-form)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                  placeholder="Enter new admin password"
                />
              </div>

              {/* Confirm Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmSchoolPassword}
                  onChange={(e) => setConfirmSchoolPassword(e.target.value)}
                  style={{
                    background: 'var(--bg-form)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                  placeholder="Confirm new admin password"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCredentialsModalError(null);
                  setNewSchoolPassword('');
                  setConfirmSchoolPassword('');
                }}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                disabled={credentialsModalLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChangesClick}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                disabled={credentialsModalLoading}
              >
                {credentialsModalLoading ? 'Processing...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Confirmation Dialog Overlay nested inside the modal wrapper for perfect event dispatching */}
          {showConfirmCredentialsDialog && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 11000,
              padding: '16px'
            }}>
              <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '380px',
                padding: '24px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)'
              }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Confirm Credentials Update</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Are you absolutely sure you want to update the administrator credentials for <strong>{selectedSchoolForCredentials?.name}</strong>?
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <button
                    onClick={() => setShowConfirmCredentialsDialog(false)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                    disabled={credentialsModalLoading}
                  >
                    No, Go Back
                  </button>
                  <button
                    onClick={handleUpdateSchoolCredentials}
                    className="btn-danger"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                    disabled={credentialsModalLoading}
                  >
                    Yes, Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

