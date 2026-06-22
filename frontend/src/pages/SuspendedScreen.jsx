import React, { useEffect } from 'react';
import './SuspendedScreen.css';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function SuspendedScreen({ schoolDetails, onUnsuspended }) {
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/school');
        if (res.ok) {
          onUnsuspended();
        }
      } catch (err) {
        console.log('Suspension status poll failed:', err);
      }
    };

    // Poll status immediately and then every 3 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [onUnsuspended]);

  const schoolName = schoolDetails?.name || 'School Portal';
  const logoUrl = schoolDetails?.logo || null;

  return (
    <div className="suspended-screen-wrapper">
      <div className="suspended-screen-card">
        {/* Glowing Warning Icon */}
        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#ef4444',
          marginBottom: '8px',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)'
        }}>
          <ShieldAlert size={36} className="animate-pulse" />
        </div>

        {/* School branding */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={schoolName} 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            />
          ) : (
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#ffffff',
              textTransform: 'uppercase'
            }}>
              {schoolName.substring(0, 2)}
            </div>
          )}
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            {schoolName}
          </h2>
        </div>

        {/* Split line */}
        <div style={{ width: '100%', height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />

        {/* Message */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5', margin: 0 }}>
            Access Suspended
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: '1.6', fontWeight: 400 }}>
            This school portal has been temporarily suspended by the platform administrator. 
            All school operations, scanning tools, attendance lists, and user sessions are currently offline.
          </p>
        </div>

        {/* Footer Support Info */}
        <div className="suspended-support-box">
          Please contact platform support to resolve billing issues or restore service.
        </div>

        {/* Checking Connection */}
        <div className="suspended-status-indicator">
          <RefreshCw size={12} className="animate-spin" style={{ color: '#ef4444' }} />
          <span>Monitoring status in real-time...</span>
        </div>
      </div>
    </div>

  );
}
