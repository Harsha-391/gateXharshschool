import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Shield, 
  ShieldAlert, 
  Users, 
  ClipboardList, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle, 
  Search, 
  Filter, 
  Loader2, 
  Activity, 
  Sliders, 
  X, 
  Info,
  Lock,
  ChevronRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { hasPermission, isSuperAdmin } from '../utils/permissions';

const TEACHER_ROLES = ['Principal', 'Vice Principal', 'Academic Coordinator', 'Subject Teacher', 'Librarian', 'Receptionist', 'Accountant', 'Expense Manager'];

const LEGACY_MODULE_MAP = {
  'student-directory': 'core-registers',
  'teacher-directory': 'core-registers',
  'staff-directory': 'core-registers',
  'grade-settings': 'grade-management',
  'grade-subjects': 'grade-management',
  'register-student': 'registry-admissions',
  'add-staff': 'registry-admissions',
  'add-employee': 'registry-admissions',
  'employee-attendance': 'attendance',
  'attendance-history': 'attendance',
  'published-timetable': 'academic-manager',
  'published-exam': 'academic-manager',
  'academic-calendar': 'academic-activities',
  'results-history': 'results-manager',
  'expense-dashboard': 'expenses',
  'expense-all-expenses': 'expenses',
  'expense-tracker': 'expenses',
  'expense-history': 'expenses'
};

export default function RolesPermissions() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, roles, matrix, audit
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search/Filter states
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('All');

  // Matrix tab active role selection
  const [matrixRoleId, setMatrixRoleId] = useState('');

  // Modals
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null); // null means adding
  const [roleForm, setRoleForm] = useState({ name: '', description: '', active: true });

  useEffect(() => {
    const isModalOpen = showRoleModal;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      const appContent = document.querySelector('.app-content');
      if (appContent) {
        appContent.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
      const appContent = document.querySelector('.app-content');
      if (appContent) {
        appContent.style.overflow = '';
      }
    }
    return () => {
      document.body.style.overflow = '';
      const appContent = document.querySelector('.app-content');
      if (appContent) {
        appContent.style.overflow = '';
      }
    };
  }, [showRoleModal]);

  const modules = [
    { id: 'overview', label: 'Admin Panel' },
    { id: 'student-directory', label: 'Student Directory' },
    { id: 'teacher-directory', label: 'Staff Directory' },
    { id: 'staff-directory', label: 'Employee Directory' },
    { id: 'grade-settings', label: 'Grade Settings' },
    { id: 'grade-subjects', label: 'Grade Subjects' },
    { id: 'register-student', label: 'Register Student' },
    { id: 'add-staff', label: 'Add Staff' },
    { id: 'add-employee', label: 'Add Employee' },
    { id: 'student-manager', label: 'Student Manager' },
    { id: 'employee-attendance', label: 'Attendance Manager' },
    { id: 'attendance', label: 'School Attendance' },
    { id: 'attendance-history', label: 'Attendance History' },
    { id: 'academic-manager', label: 'Academic Manager' },
    { id: 'published-timetable', label: 'Published Timetable' },
    { id: 'published-exam', label: 'Published Exam' },
    { id: 'academic-activities', label: 'Academic Activities' },
    { id: 'academic-calendar', label: 'Academic Calendar' },
    { id: 'results-manager', label: 'Results Manager' },
    { id: 'results-history', label: 'Academic History' },
    { id: 'finance', label: 'Finance' },
    { id: 'expense-dashboard', label: 'Expense Panel' },
    { id: 'expense-all-expenses', label: 'Expenses' },
    { id: 'expense-tracker', label: 'Expense Tracker' },
    { id: 'expense-history', label: 'Expense History' },
    { id: 'income', label: 'Income Tracker' },
    { id: 'financial-reports', label: 'Financial Reports' },
    { id: 'roles-permissions', label: 'Roles & Permissions' }
  ];

  const actions = [
    { id: 'view', label: 'View' },
    { id: 'create', label: 'Create' },
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete' },
    { id: 'export', label: 'Export' },
    { id: 'import', label: 'Import' }
  ];

  const showToast = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes, auditRes] = await Promise.all([
        fetch('/api/rbac/roles'),
        fetch('/api/rbac/users'),
        fetch('/api/rbac/audit-logs')
      ]);

      if (!rolesRes.ok || !usersRes.ok || !auditRes.ok) {
        throw new Error('Some API requests returned error status.');
      }

      const rolesData = await rolesRes.json();
      const usersData = await usersRes.json();
      const auditData = await auditRes.json();

      setRoles(rolesData);
      setUsers(usersData);
      setAuditLogs(auditData);

      if (rolesData.length > 0 && !matrixRoleId) {
        setMatrixRoleId(rolesData[0].id);
      }
    } catch (err) {
      console.error('Failed to load RBAC configuration details:', err);
      showToast('Connection failure. Check if backend servers are online.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateOrUpdateRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return;
    
    setSubmitting(true);
    try {
      const method = editingRole ? 'PUT' : 'POST';
      const url = editingRole ? `/api/rbac/roles/${editingRole.id}` : '/api/rbac/roles';
      
      const payload = {
        name: roleForm.name,
        description: roleForm.description,
        active: roleForm.active
      };

      if (!editingRole) {
        // Create initial empty permissions matrix for new role
        const initialMatrix = {};
        modules.forEach(m => {
          initialMatrix[m.id] = {};
          actions.forEach(a => {
            initialMatrix[m.id][a.id] = false;
          });
        });
        payload.permissions = initialMatrix;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(editingRole ? 'Role updated successfully!' : 'New role registered successfully!', 'success');
        setShowRoleModal(false);
        setEditingRole(null);
        setRoleForm({ name: '', description: '', active: true });
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to complete role operation.', 'error');
      }
    } catch (err) {
      showToast('Network error during request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };



  const handleDeleteRole = async (role) => {
    if (!confirm(`Are you sure you want to permanently delete the role "${role.name}"? This action is irreversible.`)) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/rbac/roles/${role.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Role removed from system.', 'success');
        if (matrixRoleId === role.id && roles.length > 1) {
          const remaining = roles.filter(r => r.id !== role.id);
          setMatrixRoleId(remaining[0].id);
        }
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to delete role.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMatrixCheckbox = async (moduleId, actionId) => {
    const selectedRole = roles.find(r => r.id === matrixRoleId);
    if (!selectedRole) return;

    const updatedPermissions = {};
    Object.keys(selectedRole.permissions || {}).forEach(k => {
      updatedPermissions[k] = { ...selectedRole.permissions[k] };
    });

    if (!updatedPermissions[moduleId]) {
      updatedPermissions[moduleId] = {};
      actions.forEach(act => {
        let val = false;
        const legacyModule = LEGACY_MODULE_MAP[moduleId];
        if (legacyModule && updatedPermissions[legacyModule]?.[act.id] !== undefined) {
          val = !!updatedPermissions[legacyModule][act.id];
        }
        updatedPermissions[moduleId][act.id] = val;
      });
    }
    
    updatedPermissions[moduleId][actionId] = !updatedPermissions[moduleId][actionId];

    // Optimistic UI updates
    setRoles(roles.map(r => r.id === matrixRoleId ? { ...r, permissions: updatedPermissions } : r));

    try {
      const res = await fetch(`/api/rbac/roles/${matrixRoleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updatedPermissions })
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Failed to save matrix update.', 'error');
        fetchAllData(); // rollback
      }
    } catch (err) {
      showToast('Network error during sync.', 'error');
      fetchAllData(); // rollback
    }
  };

  const handleBulkMatrixToggle = async (mode) => {
    const selectedRole = roles.find(r => r.id === matrixRoleId);
    if (!selectedRole) return;

    const updatedPermissions = {};
    modules.forEach(m => {
      updatedPermissions[m.id] = {};
      actions.forEach(a => {
        updatedPermissions[m.id][a.id] = (mode === 'grant-all');
      });
    });

    try {
      const res = await fetch(`/api/rbac/roles/${matrixRoleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updatedPermissions })
      });
      if (res.ok) {
        setRoles(roles.map(r => r.id === matrixRoleId ? { ...r, permissions: updatedPermissions } : r));
        showToast(mode === 'grant-all' ? 'All access grants verified!' : 'Cleared all access parameters.', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update role permissions.', 'error');
        fetchAllData();
      }
    } catch (err) {
      showToast('Network error.', 'error');
      fetchAllData();
    }
  };



  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          (log.details && log.details.toLowerCase().includes(auditSearch.toLowerCase()));
    const matchesAction = auditActionFilter === 'All' || log.action === auditActionFilter;
    return matchesSearch && matchesAction;
  });

  // Analytics helper calculations
  const totalRoles = roles.length;
  const activeRoles = roles.filter(r => r.active).length;
  const systemRoles = roles.filter(r => r.isSystem).length;
  const activeUsers = users.filter(u => u.status === 'Active').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <Loader2 className="spinner" size={48} style={{ color: 'hsl(var(--color-primary))' }} />
        <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading Security Matrices...</span>
      </div>
    );
  }

  const selectedMatrixRole = roles.find(r => r.id === matrixRoleId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      
      {/* Toast notifications */}
      {success && (
        <div className="glass-panel" style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 1100, display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px 24px',
          borderRadius: '12px', color: '#10b981', boxShadow: '0 8px 32px rgba(16,185,129,0.15)',
          animation: 'slideIn 0.3s ease forwards'
        }}>
          <CheckCircle size={20} />
          <span style={{ fontWeight: 600 }}>{success}</span>
        </div>
      )}

      {error && (
        <div className="glass-panel" style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 1100, display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px 24px',
          borderRadius: '12px', color: '#ef4444', boxShadow: '0 8px 32px rgba(239,68,68,0.15)',
          animation: 'slideIn 0.3s ease forwards'
        }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* Header telemetry row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            <Shield size={28} style={{ color: 'hsl(var(--color-primary))' }} />
            Role & Permission Management
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            System-wide Role-Based Access Control (RBAC) and Audit Ledger configurations.
          </p>
        </div>
        <button 
          onClick={fetchAllData}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.88rem', height: 'fit-content' }}
        >
          <RefreshCw size={16} /> Refresh Matrices
        </button>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', paddingBottom: '2px', gap: '24px', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Dashboard Overview', icon: Activity },
          { id: 'roles', label: 'Roles Management', icon: Shield },
          { id: 'matrix', label: 'Permissions Matrix', icon: Sliders },
          { id: 'audit', label: 'Security Audit Ledger', icon: ClipboardList }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none', padding: '12px 4px', fontSize: '0.92rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? 'hsl(var(--color-primary))' : 'var(--text-muted)', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '8px', position: 'relative', outline: 'none', transition: 'all 0.2s ease',
                borderBottom: isActive ? '2px solid hsl(var(--color-primary))' : '2px solid transparent',
                marginBottom: '-2px', whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Dashboard KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="glass-panel card-stats" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Registered Roles</span>
                <Shield size={20} style={{ color: 'hsl(var(--color-primary))' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalRoles}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                {activeRoles} Active / {systemRoles} System Defaults
              </div>
            </div>

            <div className="glass-panel card-stats" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Assigned Staff</span>
                <Users size={20} style={{ color: 'hsl(var(--color-secondary))' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{users.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                {activeUsers} Active Logins
              </div>
            </div>

            <div className="glass-panel card-stats" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Security Events</span>
                <Activity size={20} style={{ color: 'hsl(var(--color-success))' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{auditLogs.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Total logs recorded in system ledger
              </div>
            </div>
          </div>

          {/* Quick shortcuts and Recent Audits row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
            
            {/* Quick configuration steps */}
            <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Quick Configuration Tasks</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { title: 'Create Custom Access Role', desc: 'Create a tailored subadmin template (e.g. Finance Admin) with custom scopes.', action: () => { setActiveTab('roles'); setShowRoleModal(true); } },
                  { title: 'Update Permission Matrices', desc: 'Configure modules like Academics and Fee structures settings directly in the grid.', action: () => setActiveTab('matrix') }
                ].map((task, idx) => (
                  <div key={idx} onClick={task.action} style={{
                    padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)',
                    cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }} className="quick-task-row">
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>{task.title}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{task.desc}</p>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Audit highlights */}
            <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Recent Access Log Events</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-primary))', flexShrink: 0
                    }}>
                      <Lock size={16} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{log.action}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.details}
                      </p>
                      <span style={{ fontSize: '0.72rem', color: 'hsl(var(--color-primary))', fontWeight: 500 }}>by {log.userName} ({log.userRole})</span>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '24px 0' }}>No logs registered yet.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. ROLES MANAGEMENT */}
      {activeTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Active Role Profiles</h2>
            <button 
              onClick={() => { setEditingRole(null); setRoleForm({ name: '', description: '', active: true }); setShowRoleModal(true); }}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem' }}
            >
              <Plus size={16} /> Add Custom Role
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {roles.length > 0 ? (
              roles.map(role => (
                <div key={role.id} className="glass-panel" style={{
                  borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', opacity: role.active ? 1 : 0.65
                }}>
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                        {role.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {role.isSystem && (
                          <span style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', color: 'hsl(var(--color-primary))', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>
                            System Default
                          </span>
                        )}
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: role.active ? '#10b981' : '#ef4444',
                          boxShadow: role.active ? '0 0 8px #10b981' : '0 0 8px #ef4444'
                        }}></span>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>
                      {role.description || 'No description provided.'}
                    </p>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
                      <span>
                        Grants: <strong>
                          {role.permissions 
                            ? Object.values(role.permissions).reduce((acc, current) => acc + Object.values(current || {}).filter(Boolean).length, 0)
                            : 0
                          }
                        </strong> points
                      </span>
                      <span>Created: <strong>{new Date(role.createdAt || Date.now()).toLocaleDateString()}</strong></span>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-glass)', padding: '12px 20px',
                    display: 'flex', justifyContent: 'flex-end', gap: '8px'
                  }}>
                    <button 
                      onClick={() => {
                        setEditingRole(role);
                        setRoleForm({ name: role.name, description: role.description || '', active: role.active });
                        setShowRoleModal(true);
                      }}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      Edit Info
                    </button>
                    <button 
                      onClick={() => handleDeleteRole(role)}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                      title="Delete Role"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
                <ShieldAlert size={36} style={{ color: 'hsl(var(--color-primary))', margin: '0 auto 12px auto', display: 'block', opacity: 0.6 }} />
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>No Roles Found</div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem' }}>Create a custom role to configure RBAC settings.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
          
          {/* Left panel role select */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-muted)' }}>Role Profiles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {roles.length > 0 ? (
                roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setMatrixRoleId(r.id)}
                    style={{
                      textAlign: 'left', background: r.id === matrixRoleId ? 'rgba(99, 102, 241, 0.08)' : 'none',
                      border: r.id === matrixRoleId ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent',
                      padding: '12px 14px', borderRadius: '10px', color: r.id === matrixRoleId ? 'hsl(var(--color-primary))' : 'var(--text-main)',
                      fontSize: '0.88rem', fontWeight: r.id === matrixRoleId ? 700 : 500, cursor: 'pointer', outline: 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease'
                    }}
                    className="role-select-item"
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    {r.isSystem && <Lock size={12} style={{ color: 'var(--text-muted)' }} />}
                  </button>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '12px 14px', textAlign: 'center' }}>
                  No Roles Found
                </div>
              )}
            </div>
          </div>

          {/* Right panel spreadsheet matrix */}
          {selectedMatrixRole ? (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Permissions Grid for: <span style={{ color: 'hsl(var(--color-primary))' }}>{selectedMatrixRole?.name}</span>
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Select or clear checkpoints to allocate functional modules access permissions. Changes save instantly.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleBulkMatrixToggle('grant-all')}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  >
                    Grant All Access
                  </button>
                  <button 
                    onClick={() => handleBulkMatrixToggle('clear-all')}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {(selectedMatrixRole?.id === 'role-super-admin' || selectedMatrixRole?.id === 'role-principal') && (
                <div style={{
                  display: 'flex', gap: '12px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.15)',
                  padding: '16px 20px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5
                }}>
                  <Info size={18} style={{ color: 'hsl(var(--color-primary))', flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>Notice:</strong> Principal / Super Admin has absolute system authorization bypass. Checkpoints toggled here are primarily for visual auditing; their actual API permissions bypass check is hardcoded in core logic.
                  </span>
                </div>
              )}

              {/* Matrix Table */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid var(--border-glass)' }}>
                      <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-main)', width: '250px' }}>ERP Module Section</th>
                      {actions.map(act => (
                        <th key={act.id} style={{ padding: '16px 12px', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>
                          {act.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((mod, modIdx) => (
                      <tr key={mod.id} style={{
                        borderBottom: modIdx === modules.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                        background: modIdx % 2 === 0 ? 'rgba(255,255,255,0.005)' : 'none',
                        transition: 'background 0.2s ease'
                      }} className="matrix-row-hover">
                        <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {mod.label}
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: '2px' }}>
                            code: {mod.id}
                          </div>
                        </td>
                        {actions.map(act => {
                          let checked = false;
                          const rolePermissions = selectedMatrixRole?.permissions;
                          if (rolePermissions) {
                            if (rolePermissions[mod.id]?.[act.id] !== undefined) {
                              checked = !!rolePermissions[mod.id][act.id];
                            } else {
                              const legacyModule = LEGACY_MODULE_MAP[mod.id];
                              if (legacyModule && rolePermissions[legacyModule]?.[act.id] !== undefined) {
                                checked = !!rolePermissions[legacyModule][act.id];
                              }
                            }
                          }
                          return (
                            <td key={act.id} style={{ padding: '12px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleMatrixCheckbox(mod.id, act.id)}
                                style={{
                                  cursor: 'pointer', width: '16px', height: '16px', accentColor: 'hsl(var(--color-primary))',
                                  border: '1px solid var(--border-glass)', borderRadius: '4px'
                                }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
              <ShieldAlert size={36} style={{ color: 'hsl(var(--color-primary))', margin: '0 auto 12px auto', display: 'block', opacity: 0.6 }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>No Roles Selected or Found</div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem' }}>Please select a role from the sidebar or create a new role to configure permissions.</p>
            </div>
          )}
        </div>
      )}



      {/* TAB CONTENT: 5. AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Filter bar */}
          <div className="glass-panel" style={{
            padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search logs by keyword, admin name, action details..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '40px', borderRadius: '10px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={16} style={{ color: 'var(--text-muted)' }} />
                <select
                  className="form-control"
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  style={{ borderRadius: '10px', width: '180px', padding: '8px 12px' }}
                >
                  <option value="All">All Actions</option>
                  <option value="Create Role">Create Role</option>
                  <option value="Update Role">Update Role</option>
                  <option value="Delete Role">Delete Role</option>
                  <option value="Update User Access">Update User Access</option>
                </select>
              </div>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Showing {filteredLogs.length} logged actions
            </span>
          </div>

          {/* Logs scrollable container */}
          <div className="glass-panel" style={{
            padding: '24px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
            maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            {filteredLogs.map(log => (
              <div key={log.id} style={{
                padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-glass)',
                background: 'rgba(255,255,255,0.005)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                flexWrap: 'wrap', gap: '16px'
              }}>
                <div style={{ display: 'flex', gap: '16px', minWidth: '280px', flex: 1 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-primary))',
                    flexShrink: 0
                  }}>
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{log.action}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {log.details}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Operator: <strong style={{ color: 'hsl(var(--color-primary))' }}>{log.userName}</strong> ({log.userRole})</span>
                      <span>IP Address: <strong>{log.ipAddress}</strong></span>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No security log matching current filters has been logged.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ROLE FORM MODAL (ADD / EDIT) */}
      {showRoleModal && createPortal(
        <div className="modal-overlay" onClick={() => { setShowRoleModal(false); setEditingRole(null); }}>
          <form onSubmit={handleCreateOrUpdateRole} onClick={(e) => e.stopPropagation()} className="glass-panel animate-scale-up" style={{
            width: '100%', maxWidth: '500px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
            borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)', position: 'relative'
          }}>
            <button 
              type="button" 
              onClick={() => { setShowRoleModal(false); setEditingRole(null); }}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={22} style={{ color: 'hsl(var(--color-primary))' }} />
              {editingRole ? 'Edit Access Role Profile' : 'Register Custom Access Role'}
            </h3>

            <div className="form-group">
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Role Name *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Accounts Auditor, Front Desk Assistant"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                disabled={editingRole?.isSystem}
                style={{ marginTop: '6px', borderRadius: '10px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Description</label>
              <textarea
                className="form-control"
                placeholder="Provide a summary of this role's operations scope..."
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                style={{ marginTop: '6px', borderRadius: '10px', minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="role-active-chk"
                checked={roleForm.active}
                onChange={(e) => setRoleForm({ ...roleForm, active: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--color-primary))', cursor: 'pointer' }}
              />
              <label htmlFor="role-active-chk" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                Activate role profile for user mappings
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => { setShowRoleModal(false); setEditingRole(null); }}
                className="btn-secondary"
                style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={submitting}
                style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
              >
                {submitting ? <Loader2 size={16} className="spinner" /> : (editingRole ? 'Save Changes' : 'Register Role')}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}



    </div>
  );
}
