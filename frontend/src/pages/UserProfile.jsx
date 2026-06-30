import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import { 
  User, 
  Shield, 
  AlertCircle,
  LogOut,
  Mail,
  Phone,
  Globe,
  Key
} from 'lucide-react';

export default function UserProfile({ onProfileUpdate, showToast, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for Developer Admin credentials update
  const [showManageModal, setShowManageModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    if (profile && showManageModal) {
      setNewUsername(profile.username || '');
    }
  }, [profile, showManageModal]);

  const validateStrength = (pass) => {
    if (pass.length < 8) return false;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    return hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleUpdateCredentials = async () => {
    setModalError(null);
    if (!currentPassword || !newUsername || !newPassword || !confirmPassword) {
      setModalError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalError('New Password and Confirm Password do not match.');
      return;
    }
    if (!validateStrength(newPassword)) {
      setModalError('Password must be at least 8 characters long, and contain uppercase, lowercase, numbers, and special characters.');
      return;
    }

    setModalLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('/api/platform/owner/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newUsername,
          newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Credentials updated successfully. Logging out...', 'success');
        setShowManageModal(false);
        setShowConfirmDialog(false);
        // Clean up modal states
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Wait 1.5s then trigger logout
        setTimeout(() => {
          if (onLogout) onLogout();
        }, 1500);
      } else {
        setModalError(data.error || 'Failed to update credentials.');
      }
    } catch (err) {
      setModalError('Network error. Failed to connect to server.');
    } finally {
      setModalLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const role = sessionStorage.getItem('role') || sessionStorage.getItem('portal_role');
      if (role === 'Developer Admin') {
        setProfile({
          role: 'Developer Admin',
          name: sessionStorage.getItem('name') || 'Platform Owner',
          username: sessionStorage.getItem('username') || 'dev@admin.com',
          email: 'dev@admin.com',
          phone: 'N/A',
          photo: ''
        });
        return;
      }
      const token = sessionStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
        const savedRole = sessionStorage.getItem('role') || sessionStorage.getItem('portal_role');
        if (savedRole) {
          setProfile({
            role: savedRole,
            name: sessionStorage.getItem('name') || 'Local User',
            username: sessionStorage.getItem('username') || 'local_user',
            email: savedRole.toLowerCase().includes('admin') ? 'dev@admin.com' : 'local@example.com',
            phone: 'N/A',
            photo: ''
          });
          return;
        }
        if (onLogout) onLogout();
        return;
      }
      const res = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        if (res.status === 401 && onLogout) {
          onLogout();
          return;
        }
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to load profile.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '12px' }}>
        <div className="admin-login-spinner" style={{ borderColor: 'rgba(hsl(var(--color-primary)), 0.1)', borderTopColor: 'hsl(var(--color-primary))', width: '32px', height: '32px' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', maxWidth: '440px', margin: '20px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <AlertCircle size={40} style={{ color: 'rgb(var(--color-danger-rgb))' }} />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Profile Error</h2>
        <p style={{ fontSize: '0.85rem' }}>{error}</p>
        <button onClick={fetchProfile} className="btn-primary" style={{ marginTop: '8px', padding: '8px 16px', fontSize: '0.85rem' }}>Try Again</button>
      </div>
    );
  }

  // Helper to render permissions nicely
  const renderPermissions = () => {
    if (profile?.role === 'Developer Admin' || profile?.role === 'Main Admin') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgb(var(--color-success-rgb))', background: 'rgba(var(--color-success-rgb), 0.06)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
          <Shield size={14} />
          <span>Full administrative rights (All privileges)</span>
        </div>
      );
    }

    const perms = profile?.permissions || {};
    const modules = Object.keys(perms);

    if (modules.length === 0) {
      return <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No special module access assigned.</div>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '100px', overflowY: 'auto', paddingRight: '4px' }}>
        {modules.map(mod => {
          const actions = Object.keys(perms[mod]).filter(action => perms[mod][action]);
          if (actions.length === 0) return null;
          return (
            <div key={mod} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px', background: 'var(--bg-card-subtle)', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)' }}>{mod}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {actions.map(act => (
                  <span key={act} style={{ fontSize: '0.6rem', background: 'rgba(hsl(var(--color-primary)), 0.06)', color: 'hsl(var(--color-primary))', padding: '1px 4px', borderRadius: '3px', fontWeight: 600, textTransform: 'uppercase' }}>
                    {act}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 'calc(100vh - 120px)', 
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div className="glass-panel" style={{ 
        width: '100%',
        maxWidth: '460px', 
        padding: '24px 30px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px', 
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        
        {/* Avatar Display */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              overflow: 'hidden',
              position: 'relative',
              border: '3px solid hsl(var(--color-primary))',
              background: 'var(--bg-form)',
              boxShadow: '0 6px 16px rgba(hsl(var(--color-primary)), 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            {profile?.photo ? (
              <img src={profile.photo} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={40} style={{ color: 'var(--text-muted)' }} />
            )}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{profile?.name || 'User Profile'}</h2>
            <span className="badge badge-info" style={{ marginTop: '4px', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '15px' }}>{profile?.role}</span>
          </div>
        </div>

        <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)', margin: 0 }} />

        {/* User Session / System details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Account Role Matrix</h3>
          {renderPermissions()}
        </div>

        <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)', margin: 0 }} />

        {/* Session & Contact Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px dashed var(--border-glass)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Login Username:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{profile?.username || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px dashed var(--border-glass)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> Email Address:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{profile?.email || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px dashed var(--border-glass)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> Phone Number:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{profile?.phone || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={14} /> Current Status:</span>
            <span style={{ color: 'rgb(var(--color-success-rgb))', fontWeight: 700, background: 'rgba(var(--color-success-rgb), 0.1)', padding: '2px 8px', borderRadius: '15px', fontSize: '0.75rem' }}>Active</span>
          </div>
        </div>
        
        {profile?.role === 'Developer Admin' && (
          <>
            <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)', margin: 0 }} />
            <button
              onClick={() => setShowManageModal(true)}
              className="btn-primary"
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '10px', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '4px',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1',
                border: '1.5px solid rgba(99, 102, 241, 0.2)'
              }}
            >
              <Key size={16} />
              <span>Manage Account</span>
            </button>
          </>
        )}

        {onLogout && (
          <>
            <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)', margin: 0 }} />
            <button
              onClick={onLogout}
              className="btn-danger"
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '10px', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 3px 8px rgba(var(--color-danger-rgb), 0.15)',
                marginTop: '4px'
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </>
        )}
      </div>

      {/* Credentials Management Modal */}
      {showManageModal && (
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
          zIndex: 1000,
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Manage Credentials</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Update the platform owner account username and password. After a successful update, you will be logged out and required to login again.
            </p>

            {modalError && (
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
                <span>{modalError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Current Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    background: 'var(--bg-form)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                  placeholder="Enter current password"
                />
              </div>

              {/* New Username */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>New Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={{
                    background: 'var(--bg-form)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                  placeholder="Enter new username"
                />
              </div>

              {/* New Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    background: 'var(--bg-form)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                  placeholder="Enter new password"
                />
              </div>

              {/* Confirm Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    background: 'var(--bg-form)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setModalError(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowConfirmDialog(true)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                disabled={modalLoading}
              >
                {modalLoading ? 'Processing...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Overlay */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
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
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Confirm Credential Update</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Are you absolutely sure you want to update your Developer Admin username and password? You will be signed out immediately.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                disabled={modalLoading}
              >
                No, Go Back
              </button>
              <button
                onClick={handleUpdateCredentials}
                className="btn-danger"
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                disabled={modalLoading}
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
