import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';
import { getRolePrefix } from '../utils/navigation';

export default function NotFound() {
  const navigate = useNavigate();
  const currentRole = localStorage.getItem('role') || localStorage.getItem('portal_role') || 'Admin';
  const dashboardPath = `/${getRolePrefix(currentRole)}/dashboard`;

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(255, 140, 66, 0.12) 0%, transparent 60%), linear-gradient(135deg, hsl(220, 25%, 8%) 0%, hsl(220, 30%, 5%) 100%)',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        padding: '48px 36px',
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(255, 140, 66, 0.15)',
          border: '1px solid rgba(255, 140, 66, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FF8C42'
        }}>
          <AlertTriangle size={36} />
        </div>

        <div>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            margin: '0',
            background: 'linear-gradient(135deg, #ffffff 30%, #FF8C42 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            404
          </h1>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '8px 0 0 0', color: 'var(--text-main, #ffffff)' }}>
            Page Not Found
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, rgba(255, 255, 255, 0.6))', margin: '10px 0 0 0', lineHeight: 1.5 }}>
            The screen or destination you are attempting to reach does not exist, has been moved, or you may not have access to it.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <button
            onClick={() => navigate(dashboardPath)}
            className="btn-primary"
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(255, 140, 66, 0.3)'
            }}
          >
            <Home size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
