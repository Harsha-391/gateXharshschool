import React, { useState, useEffect } from 'react';
import './SchoolLogin.css';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, School, ChevronRight, UserCheck, Zap } from 'lucide-react';

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
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        localStorage.setItem('lastActive', Date.now().toString());
        localStorage.setItem('role', data.role);
        localStorage.setItem('portal_role', data.role);
        localStorage.setItem('username', data.username || username);
        localStorage.setItem('name', data.name);
        
        if (data.permissions) {
          localStorage.setItem('permissions', JSON.stringify(data.permissions));
        } else {
          localStorage.removeItem('permissions');
        }
        if (data.overrides) {
          localStorage.setItem('overrides', JSON.stringify(data.overrides));
        } else {
          localStorage.removeItem('overrides');
        }

        if (data.school) {
          localStorage.setItem('school_name', data.school.name);
          localStorage.setItem('school_subdomain', data.school.subdomain);
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
    <div className="sl-page">
      <div className="sl-card">

        {/* â”€â”€ Header / Branding â”€â”€ */}
        <div className="sl-header">
          <div className="sl-logo-wrap">
            {schoolInfo?.logo ? (
              <img src={schoolInfo.logo} alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }} />
            ) : (
              <School size={32} />
            )}
          </div>
          <div>
            <h1 className="sl-school-name">
              {schoolInfo?.name || 'Aether Academy'}
            </h1>
            <p className="sl-subtitle">Unified Multi-Role Login Portal</p>
          </div>
        </div>

        {/* â”€â”€ Feature pills â”€â”€ */}
        <div className="sl-features">
          <span className="sl-feature-pill"><Shield size={11} /> Secure Login</span>
          <span className="sl-feature-pill"><UserCheck size={11} /> Multi-Role</span>
          <span className="sl-feature-pill"><Zap size={11} /> Auto Detect</span>
        </div>

        <div className="sl-divider">Sign In</div>

        {/* â”€â”€ Form â”€â”€ */}
        <form className="sl-form" onSubmit={handleSubmit}>

          {/* Error message */}
          {error && (
            <div className="sl-error">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="sl-field-group">
            <label className="sl-label">Username or Email Address *</label>
            <div className="sl-input-wrap">
              <Mail size={15} className="sl-input-icon" />
              <input
                type="text"
                name="username"
                id="username"
                className="sl-input"
                placeholder="e.g. school_admin or teacher_user"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="sl-field-group">
            <div className="sl-label-row">
              <label className="sl-label">Password *</label>
              <button
                type="button"
                className="sl-forgot-btn"
                onClick={() => alert('Please contact the school administrator to reset your credentials.')}
              >
                Forgot Password?
              </button>
            </div>
            <div className="sl-input-wrap">
              <Lock size={15} className="sl-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="sl-input has-eye"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="sl-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="sl-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="sl-spinner" />
                Signing In…
              </>
            ) : (
              <>
                Sign In <ChevronRight size={16} />
              </>
            )}
          </button>

        </form>

        {/* â”€â”€ Footer â”€â”€ */}
        <div className="sl-footer">
          <Shield size={12} />
          AES Encrypted Â· Secure Connection
        </div>

      </div>
    </div>
  );
}

