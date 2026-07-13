import React from 'react';
import './SkeletonLoader.css';

export default function SkeletonLoader({ type = 'page' }) {
  if (type === 'card') {
    return (
      <div className="skeleton-card" style={{
        padding: '20px',
        borderRadius: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        animation: 'pulse 1.5s infinite ease-in-out'
      }}>
        <div style={{ height: '20px', width: '40%', background: 'var(--border-glass)', borderRadius: '4px' }} />
        <div style={{ height: '35px', width: '80%', background: 'var(--border-glass)', borderRadius: '6px' }} />
        <div style={{ height: '15px', width: '60%', background: 'var(--border-glass)', borderRadius: '4px' }} />
      </div>
    );
  }

  return (
    <div className="skeleton-page" style={{
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div style={{ height: '28px', width: '250px', background: 'var(--border-glass)', borderRadius: '6px', opacity: 0.6, animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ height: '16px', width: '400px', background: 'var(--border-glass)', borderRadius: '4px', opacity: 0.4, animation: 'pulse 1.5s infinite ease-in-out' }} />
        </div>
        <div style={{ height: '40px', width: '120px', background: 'var(--border-glass)', borderRadius: '10px', opacity: 0.5, animation: 'pulse 1.5s infinite ease-in-out' }} />
      </div>

      {/* Grid or Content Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            height: '160px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'pulse 1.5s infinite ease-in-out'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--border-glass)', opacity: 0.5 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div style={{ height: '16px', width: '60%', background: 'var(--border-glass)', borderRadius: '4px', opacity: 0.6 }} />
                <div style={{ height: '12px', width: '40%', background: 'var(--border-glass)', borderRadius: '4px', opacity: 0.4 }} />
              </div>
            </div>
            <div style={{ height: '1px', background: 'var(--border-glass)' }} />
            <div style={{ height: '32px', width: '100%', background: 'var(--border-glass)', borderRadius: '8px', opacity: 0.3 }} />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'pulse 1.5s infinite ease-in-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-glass)' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: '16px', width: '12%', background: 'var(--border-glass)', borderRadius: '4px', opacity: 0.6 }} />
          ))}
        </div>
        {[1, 2, 3, 4].map(row => (
          <div key={row} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '12%' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--border-glass)', opacity: 0.5 }} />
              <div style={{ height: '12px', width: '50px', background: 'var(--border-glass)', borderRadius: '4px', opacity: 0.4 }} />
            </div>
            {[2, 3, 4, 5].map(i => (
              <div key={i} style={{ height: '12px', width: '12%', background: 'var(--border-glass)', borderRadius: '4px', opacity: 0.4 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

