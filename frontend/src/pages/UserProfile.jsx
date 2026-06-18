import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  AlertCircle,
  LogOut,
  Mail,
  Phone
} from 'lucide-react';

export default function UserProfile({ onProfileUpdate, showToast, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
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
    if (profile?.role === 'Developer Admin' || profile?.role === 'Main Admin') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgb(var(--color-success-rgb))', background: 'rgba(var(--color-success-rgb), 0.08)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}>
          <Shield size={16} />
          <span>Full administrative rights (All privileges)</span>
        </div>
      );
    }

    const perms = profile?.permissions || {};
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        {/* Left Side: Avatar Card & Stats Info */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '10px' }}>
          
          {/* Avatar Display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                position: 'relative',
                border: '3px solid hsl(var(--color-primary))',
                background: 'var(--bg-form)',
                boxShadow: '0 8px 20px rgba(hsl(var(--color-primary)), 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              {profile?.photo ? (
                <img src={profile.photo} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={48} style={{ color: 'var(--text-muted)' }} />
              )}
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{profile?.name || 'User Profile'}</h2>
              <span className="badge badge-info" style={{ marginTop: '6px' }}>{profile?.role}</span>
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
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile?.id || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Login Username:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile?.username || 'N/A'}</span>
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

        {/* Right Side: Read-only Profile Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Profile Details</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-12px' }}>Your personal account variables registered on the system.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--bg-form)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Full Name</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{profile?.name || 'N/A'}</span>
              </div>

              <div style={{ background: 'var(--bg-form)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Login Username</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{profile?.username || 'N/A'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--bg-form)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Email Address</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{profile?.email || 'N/A'}</span>
              </div>

              <div style={{ background: 'var(--bg-form)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Phone Number</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{profile?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
