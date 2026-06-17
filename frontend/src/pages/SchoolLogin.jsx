import React, { useState, useEffect } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, School, ChevronRight, UserCheck } from 'lucide-react';

export default function SchoolLogin({ tenantSubdomain, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const role = 'Auto';
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState(null);

  // Fetch school brand details dynamically for this subdomain
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      if (!tenantSubdomain) return;
      try {
        const res = await fetch('/api/school', {
          headers: { 'x-tenant-id': tenantSubdomain }
        });
        if (res.ok) {
          const data = await res.json();
          setSchoolInfo(data);
        }
      } catch (err) {
        console.error('Failed to load school identity for login page:', err);
      }
    };
    fetchSchoolInfo();
  }, [tenantSubdomain]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': tenantSubdomain || 'platform'
        },
        body: JSON.stringify({ username, password, role })
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error('Failed to parse auth response as JSON:', text);
        setError('Server returned non-JSON response. Please verify that your backend server has been restarted (run npm start / npm run dev in backend directory) to register the new auth routes.');
        setLoading(false);
        return;
      }

      if (res.ok) {
        // Save token & active tenant details
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('role', data.role);
        sessionStorage.setItem('portal_role', data.role);
        sessionStorage.setItem('username', data.username || username);
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
        } else if (tenantSubdomain) {
          localStorage.setItem('tenant_subdomain', tenantSubdomain);
        }
        
        onLoginSuccess(data.role, data.name);
      } else {
        setError(data.error || 'Invalid credentials. Please verify your login details.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure. Unable to contact authentication servers. Make sure your backend node process is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 10% 20%, rgba(216, 241, 230, 0.46) 0.1%, rgba(233, 226, 226, 0.28) 90.1%)',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        {/* Login Header (School Branding / Platform Branding) */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-secondary)) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
          }}>
            {schoolInfo?.logo ? (
              <img src={schoolInfo.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
            ) : (
              <School size={32} />
            )}
          </div>
          
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {schoolInfo?.name || 'Aether Academy Login'}
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Unified Multi-Role Login Portal
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              padding: '12px 16px',
              borderRadius: '10px',
              color: '#ef4444',
              fontSize: '0.8rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="form-group">
            <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Username or Email Address *
            </label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="e.g. school_admin or teacher_user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ paddingLeft: '40px', borderRadius: '10px' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Password *
              </label>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                onClick={() => alert('Please contact the school administrator to reset your credentials.')}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '40px', paddingRight: '40px', borderRadius: '10px' }}
              />
              <button
                type="button"
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              padding: '14px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.2)'
            }}
          >
            {loading ? (
              <span className="spinner-border" style={{ width: '18px', height: '18px' }} />
            ) : (
              <>
                Sign In <ChevronRight size={16} />
              </>
            )}
          </button>
          
        </form>



        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '15px' }}>
          <span>Secure AES Encrypted Connection</span>
        </div>

      </div>
    </div>
  );
}
