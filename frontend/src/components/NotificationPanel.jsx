import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, CheckCircle, X, Calendar, Megaphone, Sun, FileText, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const getNotifIcon = (type) => {
  if (!type) return <Bell size={16} />;
  const t = type.toLowerCase();
  if (t.includes('event')) return <Calendar size={16} />;
  if (t.includes('notice')) return <Megaphone size={16} />;
  if (t.includes('holiday')) return <Sun size={16} />;
  if (t.includes('leave')) return <FileText size={16} />;
  if (t.includes('report')) return <FileText size={16} />;
  if (t.includes('timetable')) return <Clock size={16} />;
  return <Bell size={16} />;
};

const getNotifColor = (type) => {
  if (!type) return '#FF8C42';
  const t = type.toLowerCase();
  if (t.includes('event')) return '#3b82f6';
  if (t.includes('notice')) return '#8b5cf6';
  if (t.includes('holiday')) return '#f59e0b';
  if (t.includes('leave') && t.includes('approved')) return '#10b981';
  if (t.includes('leave') && t.includes('rejected')) return '#ef4444';
  if (t.includes('leave')) return '#f97316';
  if (t.includes('report')) return '#06b6d4';
  if (t.includes('timetable')) return '#6366f1';
  return '#FF8C42';
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function NotificationPanel({ maxHeight = '420px', showHeader = true, compact = false }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        // Sort by createdAt DESC (latest first) — backend should already do this but ensure client-side
        const sorted = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [];
        setNotifications(sorted);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: 1 } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayNotifications = showAll ? notifications : notifications.slice(0, 8);

  return (
    <div className="glass-panel" style={{
      borderRadius: '16px', padding: compact ? '16px' : '24px',
      border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
      display: 'flex', flexDirection: 'column', gap: compact ? '12px' : '20px'
    }}>
      {/* Header */}
      {showHeader && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer'
        }}
          onClick={() => setExpanded(!expanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              position: 'relative',
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(255, 107, 0, 0.08)', color: '#FF8C42',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255, 107, 0, 0.15)'
            }}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', width: '18px', height: '18px',
                  fontSize: '0.6rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--bg-card)',
                  animation: 'pulse 2s ease infinite'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            <div>
              <h3 style={{
                fontSize: compact ? '1rem' : '1.15rem', fontWeight: 800, margin: 0,
                color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span style={{ color: '#FF8C42' }}>Notifications</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '6px 12px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600,
                  border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
                  color: '#10b981', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
              >
                <CheckCircle size={12} /> Mark all read
              </button>
            )}
            {expanded ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
          </div>
        </div>
      )}

      {/* Notification List */}
      {expanded && (
        <>
          <div style={{ height: '1px', background: 'var(--border-glass)' }} />
          <div style={{
            maxHeight: maxHeight,
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '8px',
            scrollbarWidth: 'thin'
          }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    height: '52px', borderRadius: '10px',
                    background: 'var(--border-glass)', marginBottom: '8px',
                    animation: 'pulse 1.5s ease infinite'
                  }} />
                ))}
              </div>
            ) : displayNotifications.length === 0 ? (
              <div style={{
                padding: '32px 16px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.08)', color: '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CheckCircle size={24} />
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  No notifications yet
                </span>
              </div>
            ) : (
              displayNotifications.map(notif => {
                const color = getNotifColor(notif.type);
                const isUnread = !notif.read;
                return (
                  <div
                    key={notif.id}
                    onClick={() => isUnread && markAsRead(notif.id)}
                    style={{
                      padding: compact ? '10px 12px' : '12px 16px',
                      borderRadius: '12px',
                      background: isUnread
                        ? `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)`
                        : 'var(--bg-glass-active)',
                      border: `1px solid ${isUnread ? `${color}25` : 'var(--border-glass)'}`,
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      cursor: isUnread ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      if (isUnread) {
                        e.currentTarget.style.transform = 'translateX(2px)';
                        e.currentTarget.style.borderColor = `${color}45`;
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.borderColor = isUnread ? `${color}25` : 'var(--border-glass)';
                    }}
                  >
                    {/* Unread dot */}
                    {isUnread && (
                      <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: color,
                        boxShadow: `0 0 6px ${color}60`,
                        animation: 'pulse 2s ease infinite'
                      }} />
                    )}

                    {/* Icon */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                      background: `${color}12`, color: color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${color}20`,
                      marginTop: '2px'
                    }}>
                      {getNotifIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: compact ? '0.78rem' : '0.82rem',
                        fontWeight: isUnread ? 700 : 600,
                        color: 'var(--text-main)',
                        marginBottom: '3px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {notif.title}
                      </div>
                      <div style={{
                        fontSize: compact ? '0.7rem' : '0.75rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {notif.message}
                      </div>
                      <div style={{
                        fontSize: '0.65rem', color: `${color}99`,
                        fontWeight: 600, marginTop: '4px',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Clock size={10} />
                        {formatTimeAgo(notif.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Show More / Show Less */}
          {notifications.length > 8 && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600,
                border: '1px solid var(--border-glass)', background: 'transparent',
                color: '#FF8C42', cursor: 'pointer', transition: 'all 0.2s',
                width: '100%'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 107, 0, 0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {showAll ? (
                <><ChevronUp size={14} /> Show Less</>
              ) : (
                <><ChevronDown size={14} /> Show All ({notifications.length})</>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
