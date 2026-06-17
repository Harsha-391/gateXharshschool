import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Shield, 
  Check, 
  Camera, 
  Upload, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';

export default function UserProfile({ onProfileUpdate, showToast, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name || '');
        setUsername(data.username || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        if (data.photo) {
          setAvatarPreview(data.photo);
        }
      } else {
        const errData = await res.json();
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        if (showToast) showToast('File size must be under 2MB', 'error');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        if (showToast) showToast('File size must be under 2MB', 'error');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!name.trim()) {
      if (showToast) showToast('Full name is required', 'error');
      return;
    }
    if (!username.trim()) {
      if (showToast) showToast('Username is required', 'error');
      return;
    }

    if (newPassword || confirmPassword) {
      if (!oldPassword) {
        if (showToast) showToast('Please enter your current password to set a new one', 'error');
        return;
      }
      // Simple verification
      if (oldPassword !== profile.password) {
        if (showToast) showToast('Incorrect current password', 'error');
        return;
      }
      if (newPassword.length < 6) {
        if (showToast) showToast('New password must be at least 6 characters long', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        if (showToast) showToast('New passwords do not match', 'error');
        return;
      }
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('username', username);
      formData.append('email', email);
      formData.append('phone', phone);
      if (newPassword) {
        formData.append('password', newPassword);
      }
      if (avatarFile) {
        formData.append('photo', avatarFile);
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        const result = await res.json();
        if (showToast) {
          showToast(result.message || 'Profile updated successfully!', 'success');
        }
        
        // Reset password fields
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Refresh local details and trigger global callback to layout
        if (onProfileUpdate) {
          onProfileUpdate(result.profile);
        }
        fetchProfile();
      } else {
        const errData = await res.json();
        if (showToast) {
          showToast(errData.error || 'Failed to update profile.', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast('Server update failed.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
        <div className="admin-login-spinner" style={{ borderColor: 'rgba(hsl(var(--color-primary)), 0.1)', borderTopColor: 'hsl(var(--color-primary))', width: '40px', height: '40px' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Loading profile information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', maxWidth: '500px', margin: '40px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <AlertCircle size={48} style={{ color: 'rgb(var(--color-danger-rgb))' }} />
        <h2>Profile Error</h2>
        <p>{error}</p>
        <button onClick={fetchProfile} className="btn-primary" style={{ marginTop: '12px' }}>Try Again</button>
      </div>
    );
  }

  // Helper to render permissions nicely
  const renderPermissions = () => {
    if (profile.role === 'Developer Admin' || profile.role === 'Main Admin') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgb(var(--color-success-rgb))', background: 'rgba(var(--color-success-rgb), 0.08)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}>
          <Shield size={16} />
          <span>Full administrative rights (All privileges)</span>
        </div>
      );
    }

    const perms = profile.permissions || {};
    const modules = Object.keys(perms);

    if (modules.length === 0) {
      return <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No special module access assigned.</div>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
        {modules.map(mod => {
          const actions = Object.keys(perms[mod]).filter(action => perms[mod][action]);
          if (actions.length === 0) return null;
          return (
            <div key={mod} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)' }}>{mod}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {actions.map(act => (
                  <span key={act} style={{ fontSize: '0.65rem', background: 'rgba(hsl(var(--color-primary)), 0.08)', color: 'hsl(var(--color-primary))', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
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
    <div className="animate-slide-up" style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '24px',
      alignItems: 'start',
      paddingBottom: '40px'
    }}>
      {/* Dynamic Grid: Left Sidebar Card, Right Main Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Side: Avatar Card & Stats Info */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '10px' }}>
          
          {/* Avatar Interaction */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                border: '3px solid hsl(var(--color-primary))',
                background: 'var(--bg-form)',
                boxShadow: '0 8px 20px rgba(hsl(var(--color-primary)), 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              className="avatar-container"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={48} style={{ color: 'var(--text-muted)' }} />
              )}
              
              {/* Hover Edit Overlay */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.25s ease',
                gap: '4px'
              }}
              className="avatar-hover-overlay"
              >
                <Camera size={18} />
                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Change Photo</span>
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
            />

            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{name || 'User Profile'}</h2>
              <span className="badge badge-info" style={{ marginTop: '6px' }}>{profile.role}</span>
            </div>
          </div>

          <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)' }} />

          {/* User Session / System details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Role Matrix</h3>
            {renderPermissions()}
          </div>

          <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)' }} />

          {/* Session Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>User ID:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.id || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Login Username:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.username || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Current Status:</span>
              <span style={{ color: 'rgb(var(--color-success-rgb))', fontWeight: 700 }}>Active</span>
            </div>
          </div>
          {onLogout && (
            <>
              <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)' }} />
              <button
                onClick={onLogout}
                className="btn-danger"
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  padding: '12px', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>

        {/* Right Side: Form Inputs & Password Updates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main profile form */}
          <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Profile Variables</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-12px' }}>Update account information and personal details.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label>Full Name</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="form-control" 
                    placeholder="Enter full name"
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Login Username</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    className="form-control" 
                    placeholder="Enter login username"
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label>Email Address</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    value={email} 
                    readOnly
                    className="form-control" 
                    placeholder="Enter email address"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    className="form-control" 
                    placeholder="Enter phone number"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)', margin: '8px 0' }} />

            {/* Password Management */}
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Change Password</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-12px' }}>Provide current and new password variables to save changes.</p>

            <div className="form-group">
              <label>Current Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type={showOldPass ? "text" : "password"} 
                  value={oldPassword} 
                  onChange={e => setOldPassword(e.target.value)} 
                  className="form-control" 
                  placeholder="Enter current password to make password changes"
                  style={{ paddingLeft: '38px', paddingRight: '40px' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowOldPass(!showOldPass)} 
                  style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label>New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type={showNewPass ? "text" : "password"} 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="form-control" 
                    placeholder="Enter new password"
                    style={{ paddingLeft: '38px', paddingRight: '40px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPass(!showNewPass)} 
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type={showConfirmPass ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="form-control" 
                    placeholder="Confirm new password"
                    style={{ paddingLeft: '38px', paddingRight: '40px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPass(!showConfirmPass)} 
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={saving}
                style={{ minWidth: '140px', justifyContent: 'center' }}
              >
                {saving ? (
                  <div className="admin-login-spinner" style={{ width: '16px', height: '16px' }} />
                ) : (
                  <>
                    <Check size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Styled avatar hover effect rules */}
      <style>{`
        .avatar-container:hover .avatar-hover-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
