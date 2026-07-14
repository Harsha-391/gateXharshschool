import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import { 
  User, 
  Shield, 
  AlertCircle,
  LogOut,
  Mail,
  Phone,
  Globe
} from 'lucide-react';

export default function UserProfile({ onProfileUpdate, showToast, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const role = localStorage.getItem('role') || localStorage.getItem('portal_role');
      if (role === 'Developer Admin') {
        setProfile({
          role: 'Developer Admin',
          name: localStorage.getItem('name') || 'Platform Owner',
          username: localStorage.getItem('username') || 'dev@admin.com',
          email: 'dev@admin.com',
          phone: 'N/A',
          photo: ''
        });
        return;
      }
      const token = localStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
        const savedRole = localStorage.getItem('role') || localStorage.getItem('portal_role');
        if (savedRole) {
          setProfile({
            role: savedRole,
            name: localStorage.getItem('name') || 'Local User',
            username: localStorage.getItem('username') || 'local_user',
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (showToast) showToast('File size must be less than 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Photo = reader.result;
      try {
        const token = localStorage.getItem('token');
        let headers = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/auth/profile/photo', {
          method: 'POST',
          headers,
          body: JSON.stringify({ photo: base64Photo })
        });

        if (res.ok) {
          const data = await res.json();
          setProfile(prev => prev ? { ...prev, photo: data.photo } : prev);
          
          if (onProfileUpdate) {
            onProfileUpdate(prev => prev ? { ...prev, photo: data.photo } : { photo: data.photo });
          }

          localStorage.setItem('photo', data.photo);

          if (showToast) showToast('Profile picture updated successfully!', 'success');
        } else {
          const errData = await res.json().catch(() => ({}));
          if (showToast) showToast(errData.error || 'Failed to upload photo.', 'error');
        }
      } catch (err) {
        console.error('Photo upload failed:', err);
        if (showToast) showToast('Failed to connect to server.', 'error');
      }
    };
    reader.onerror = () => {
      if (showToast) showToast('Failed to read selected image file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const [schoolDetails, setSchoolDetails] = useState(null);

  useEffect(() => {
    fetchProfile();
    const fetchSchool = async () => {
      try {
        const res = await fetch('/api/school');
        if (res.ok) {
          const data = await res.json();
          setSchoolDetails(data);
        }
      } catch (err) {
        console.error('Error fetching school details in profile:', err);
      }
    };
    fetchSchool();
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
          <div style={{ position: 'relative' }}>
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
            
            {/* Camera Overlay Icon */}
            <label 
              htmlFor="profile-photo-upload-input"
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'hsl(var(--color-primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease',
                border: '2px solid var(--bg-card)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </label>
            <input 
              type="file" 
              id="profile-photo-upload-input" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handlePhotoUpload}
            />
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
    </div>
  );
}

