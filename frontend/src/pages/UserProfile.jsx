import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  AlertCircle,
  LogOut,
  Mail,
  Phone,
  Hash,
  Globe
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
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        
        {/* Avatar Display */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              overflow: 'hidden',
              position: 'relative',
              border: '4px solid hsl(var(--color-primary))',
              background: 'var(--bg-form)',
              boxShadow: '0 8px 25px rgba(hsl(var(--color-primary)), 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            {profile?.photo ? (
              <img src={profile.photo} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={56} style={{ color: 'var(--text-muted)' }} />
            )}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{profile?.name || 'User Profile'}</h2>
            <span className="badge badge-info" style={{ marginTop: '8px', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '20px' }}>{profile?.role}</span>
          </div>
        </div>

        <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)' }} />

        {/* User Session / System details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Role Matrix</h3>
          {renderPermissions()}
        </div>

        <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)' }} />

        {/* Session & Contact Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--border-glass)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Hash size={16} /> User ID:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{profile?.id || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--border-glass)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Login Username:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{profile?.username || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--border-glass)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} /> Email Address:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{profile?.email || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--border-glass)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={16} /> Phone Number:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{profile?.phone || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={16} /> Current Status:</span>
            <span style={{ color: 'rgb(var(--color-success-rgb))', fontWeight: 700, background: 'rgba(var(--color-success-rgb), 0.1)', padding: '2px 10px', borderRadius: '20px' }}>Active</span>
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
                padding: '14px', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(var(--color-danger-rgb), 0.2)'
              }}
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
