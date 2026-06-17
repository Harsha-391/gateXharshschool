import React, { useState, useEffect } from 'react';
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
  Copy
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
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)'
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
                background: 'rgba(99, 102, 241, 0.08)',
                color: 'hsl(var(--color-primary))',
                border: '1px solid rgba(99, 102, 241, 0.15)'
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
  const [analytics, setAnalytics] = useState({
    totalSchools: 0,
    activeSchools: 0,
    inactiveSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalStaff: 0,
    monthlyRevenue: '$0',
    recentRegistrations: [],
    growthAnalytics: []
  });
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [notification, setNotification] = useState(null);

  // Modals Toggles
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedSchool, setSelectedSchool] = useState(null);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordResetSchool, setPasswordResetSchool] = useState(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');

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
    } catch (err) {
      console.error('Failed to load platform owner data:', err);
      showToast('Error syncing platform owner workspace.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
    if (!formData.name.trim()) errors.name = 'School Name is required.';
    
    if (modalMode === 'add') {
      if (!formData.subdomain.trim()) {
        errors.subdomain = 'Subdomain is required.';
      } else if (!/^[a-z0-9-]+$/i.test(formData.subdomain)) {
        errors.subdomain = 'Subdomain must be alphanumeric with no spaces.';
      }
      
      if (!formData.adminEmail.trim()) errors.adminEmail = 'Admin Email is required.';
      if (!formData.adminUsername.trim()) errors.adminUsername = 'Admin Username is required.';
      if (!formData.adminPassword.trim()) errors.adminPassword = 'Admin Password is required.';
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
        showToast(errorData.error || 'Failed to complete registration operation.', 'error');
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

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newAdminPassword.trim()) {
      alert('Password cannot be empty.');
      return;
    }

    try {
      const res = await fetch(`/api/platform/schools/${passwordResetSchool.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newAdminPassword })
      });
      if (res.ok) {
        showToast(`Administrator password reset for ${passwordResetSchool.name}.`, 'success');
        setShowPasswordModal(false);
        setNewAdminPassword('');
      } else {
        showToast('Failed to reset administrator password.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  // Launch School Portal - opens in a new tab without ending superadmin session
  const handleLaunchPortal = (school) => {
    sessionStorage.setItem('from_dev_admin', 'true');
    const targetUrl = getSchoolSubdomainUrl(school.subdomain, `/?username=${encodeURIComponent(school.adminUsername)}&password=${encodeURIComponent(school.adminPassword)}&from_dev_admin=true`);
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
          zIndex: 999999,
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
            background: 'linear-gradient(135deg, hsl(263, 80%, 55%) 0%, hsl(263, 90%, 45%) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)'
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
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
          <Activity className="animate-spin" size={40} style={{ color: 'hsl(var(--color-primary))' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Syncing school telemetry statistics...</p>
        </div>
      ) : activeTab === 'dashboard' ? (
        /* PLATFORM DASHBOARD VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* STATS OVERVIEW CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            
            {/* Total Schools */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SchoolIcon size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Total Schools</span>
                <strong style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800 }}>{analytics.totalSchools}</strong>
              </div>
            </div>

            {/* Active Tenants */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Active Tenants</span>
                <strong style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800 }}>{analytics.activeSchools}</strong>
              </div>
            </div>

            {/* Suspended Tenants */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Suspended Tenants</span>
                <strong style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800 }}>{analytics.inactiveSchools}</strong>
              </div>
            </div>

            {/* Platform Rollout Students */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Students Enrolled</span>
                <strong style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800 }}>{analytics.totalStudents}</strong>
              </div>
            </div>

            {/* Monthly Platform Revenue */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Monthly Revenue</span>
                <strong style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800 }}>{analytics.monthlyRevenue}</strong>
              </div>
            </div>

          </div>

          {/* TWO COLUMN CONTENT */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
            
            {/* CHART: SCHOOL GROWTH ANALYTICS */}
            <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Platform Revenue & Tenant Growth</h3>
              <div style={{ width: '100%', height: '240px', position: 'relative', marginTop: '10px' }}>
                <svg viewBox="0 0 500 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Grid Lines */}
                  {[40, 80, 120, 160].map((y, idx) => (
                    <line key={idx} x1="40" y1={y} x2="480" y2={y} stroke="var(--border-glass)" strokeDasharray="3 3" />
                  ))}
                  
                  {analytics.growthAnalytics?.map((item, idx) => {
                    const x = 70 + idx * 90;
                    const schoolHeight = (item.schools / Math.max(1, analytics.totalSchools)) * 100;
                    const revHeight = (parseFloat(item.revenue) / 1000) * 100; // normalized scale
                    const ySchool = 160 - schoolHeight;
                    const yRev = 160 - revHeight;
                    
                    return (
                      <g key={idx}>
                        {/* Schools bar */}
                        <rect x={x} y={ySchool} width="20" height={Math.max(4, schoolHeight)} rx="4" fill="#6366f1" opacity="0.85" />
                        {/* Revenue line node */}
                        <circle cx={x + 32} cy={yRev} r="6" fill="#f59e0b" />
                        {item.schools > 0 && <text x={x + 10} y={ySchool - 6} textAnchor="middle" fontSize="9" fill="var(--text-main)" fontWeight="bold">{item.schools} Tenants</text>}
                        <text x={x + 32} y={yRev - 10} textAnchor="middle" fontSize="9" fill="var(--text-main)" fontWeight="bold">${item.revenue}</text>
                        <text x={x + 16} y="185" textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontWeight="600">{item.month}</text>
                      </g>
                    );
                  })}
                  <line x1="40" y1="160" x2="480" y2="160" stroke="var(--text-muted)" strokeWidth="1.5" />
                </svg>
              </div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', justifyContent: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '15px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <span style={{ width: '12px', height: '12px', background: '#6366f1', borderRadius: '3px' }} /> Active Tenants count
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <span style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '50%' }} /> Platform Monthly Revenue
                </span>
              </div>
            </div>

            {/* RECENT REGISTRATIONS FEED */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Recent Registrations</h3>
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
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.04)'; }}
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
                <option value="Starter">Starter</option>
                <option value="Growth">Growth</option>
                <option value="Premium">Premium</option>
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

            {/* Onboard School Trigger */}
            <button className="btn-primary" onClick={handleOpenAddModal} style={{ borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}>
              <Plus size={16} /> Onboard School
            </button>
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
                        background: school.subscriptionPlan === 'Premium' ? 'rgba(245, 158, 11, 0.08)' : school.subscriptionPlan === 'Growth' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                        color: school.subscriptionPlan === 'Premium' ? '#f59e0b' : school.subscriptionPlan === 'Growth' ? 'hsl(var(--color-primary))' : 'var(--text-muted)',
                        border: school.subscriptionPlan === 'Premium' ? '1px solid rgba(245, 158, 11, 0.15)' : school.subscriptionPlan === 'Growth' ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(100, 116, 139, 0.15)'
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
                    <span style={{ color: 'var(--text-muted)' }}>Teachers: <strong>{school.teacherCount || 0}</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>Employees: <strong>{school.staffCount || 0}</strong></span>
                  </div>

                  {/* Credentials Utility */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px', 
                    padding: '8px 12px', 
                    background: 'var(--bg-glass-active)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)',
                    fontSize: '0.74rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                        <KeyRound size={12} style={{ color: 'hsl(var(--color-primary))' }} /> School Admin Account:
                      </span>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`Username: ${school.adminUsername}\nPassword: ${school.adminPassword}`);
                          showToast('School Admin credentials copied!', 'success');
                        }}
                        title="Copy Credentials"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', background: 'rgba(0,0,0,0.02)', padding: '2px 6px', borderRadius: '4px' }}>
                      <span>U: <strong style={{ color: 'var(--text-main)' }}>{school.adminUsername}</strong></span>
                      <span>P: <strong style={{ color: 'var(--text-main)' }}>{school.adminPassword}</strong></span>
                    </div>
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
                      <button onClick={() => handleOpenEditModal(school)} className="btn-secondary" title="Edit School" style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => {
                          setPasswordResetSchool(school);
                          setNewAdminPassword('');
                          setShowPasswordModal(true);
                        }} 
                        className="btn-secondary" 
                        title="Reset School Admin Password" 
                        style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', color: '#f59e0b' }}
                      >
                        <KeyRound size={15} />
                      </button>
                      <button 
                        onClick={() => handleToggleSuspend(school)} 
                        className="btn-secondary" 
                        title={school.status === 'Active' ? 'Suspend School' : 'Activate School'} 
                        style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', color: school.status === 'Active' ? '#ef4444' : '#10b981' }}
                      >
                        {school.status === 'Active' ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
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
          zIndex: 999999, padding: '20px'
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
                    <label>School Logo URL</label>
                    <input 
                      type="text" name="logo" className="form-control" placeholder="https://domain.com/logo.png"
                      value={formData.logo} onChange={handleInputChange}
                    />
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
                    />
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
                    <select name="subscriptionPlan" className="select-custom" style={{ width: '100%' }} value={formData.subscriptionPlan} onChange={handleInputChange}>
                      <option value="Starter">Starter Tier ($99/mo)</option>
                      <option value="Growth">Growth Tier ($249/mo)</option>
                      <option value="Premium">Premium Tier ($499/mo)</option>
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

      {/* 2. RESET PASSWORD MODAL */}
      {showPasswordModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 999999, padding: '20px'
        }}>
          <div className="animate-scale-up" style={{
            width: '100%', maxWidth: '440px', padding: '24px 32px',
            borderRadius: '16px', background: 'var(--bg-glass)',
            border: '1px solid var(--border-glass)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={16} style={{ color: '#f59e0b' }} /> Reset Admin Password
              </h3>
              <button 
                type="button" 
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Specify a new administrative password for the school: <strong style={{ color: 'var(--text-main)' }}>{passwordResetSchool?.name}</strong>.
            </p>

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Enter new password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary" style={{ borderRadius: '8px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ borderRadius: '8px', background: '#f59e0b', borderColor: '#f59e0b' }}>
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
