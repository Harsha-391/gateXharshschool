import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Search, 
  Filter, 
  Download, 
  Activity, 
  AlertCircle, 
  Calendar, 
  User, 
  FileText, 
  Trash2, 
  MessageSquare,
  Clock,
  Briefcase
} from 'lucide-react';

export default function TeacherLeaveManagement({ showToast }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Remarks / Decision Modal State
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [decisionType, setDecisionType] = useState(''); // 'approve' or 'reject'
  const [remarks, setRemarks] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        status: statusFilter,
        fromDate,
        toDate
      });

      const res = await fetch(`/api/teacher-leaves/admin?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      } else {
        showToast('Failed to load leave records.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading leaves.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter, fromDate, toDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeaves();
  };

  const handleOpenDecision = (leave, type) => {
    setSelectedLeave(leave);
    setDecisionType(type);
    setRemarks('');
    setShowDecisionModal(true);
  };

  const handleConfirmDecision = async () => {
    setActioning(true);
    try {
      const url = `/api/teacher-leaves/${selectedLeave.id}/${decisionType}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks })
      });

      if (res.ok) {
        showToast(`Leave request ${decisionType === 'approve' ? 'approved' : 'rejected'}.`, 'success');
        setShowDecisionModal(false);
        fetchLeaves();
      } else {
        const result = await res.json();
        showToast(result.error || 'Operation failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error processing request.', 'error');
    } finally {
      setActioning(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this leave application and remove any associated attendance records?')) {
      return;
    }

    try {
      const res = await fetch(`/api/teacher-leaves/${id}/admin`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Leave request deleted.', 'success');
        fetchLeaves();
      } else {
        const result = await res.json();
        showToast(result.error || 'Failed to delete leave request.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error.', 'error');
    }
  };

  const handleExportCSV = () => {
    if (leaves.length === 0) {
      showToast('No records to export.', 'error');
      return;
    }

    const headers = ['ID', 'Teacher Name', 'Employee ID', 'Leave Type', 'Title', 'From Date', 'To Date', 'Total Days', 'Status', 'Remarks', 'CreatedAt'];
    const rows = leaves.map(l => [
      l.id,
      l.teacherName || '',
      l.teacherEmployeeId || '',
      l.leaveType || '',
      l.title || '',
      l.fromDate || '',
      l.toDate || '',
      l.totalDays || 0,
      l.status || '',
      l.remarks || '',
      l.createdAt || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `teacher_leaves_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick summary counts
  const totalCount = leaves.length;
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const currentlyOnLeaveCount = leaves.filter(l => l.status === 'Approved' && l.fromDate <= todayStr && l.toDate >= todayStr).length;

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Approved':
        return { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' };
      case 'Rejected':
        return { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' };
      default:
        return { background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header card */}
      <div className="glass-panel" style={{
        padding: '24px 30px', borderRadius: '20px',
        border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Teacher Leave Administration</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Review pending leave applications, manage employee status updates, and view analytics.
          </p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem', height: 'fit-content' }}
        >
          <Download size={16} /> Export Records
        </button>
      </div>

      {/* Overview Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Requests</span>
            <FileText size={18} style={{ color: 'hsl(var(--color-primary))' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalCount}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Requests</span>
            <Clock size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{pendingCount}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approved Leaves</span>
            <Check size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{approvedCount}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Currently On Leave</span>
            <Calendar size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6' }}>{currentlyOnLeaveCount}</div>
        </div>

      </div>

      {/* Search & Filter Controls */}
      <div className="glass-panel" style={{
        padding: '20px', borderRadius: '16px',
        border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
        display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by teacher name, title, or leave type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px',
                border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)', color: 'inherit'
              }}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            Find
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          
          {/* Status filter dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', color: 'inherit' }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Only</option>
              <option value="Approved">Approved Only</option>
              <option value="Rejected">Rejected Only</option>
              <option value="TodayPending">Today's Pending Requests</option>
              <option value="CurrentlyOnLeave">Teachers Currently On Leave</option>
            </select>
          </div>

          {/* Date range pickers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', color: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', color: 'inherit' }}
            />
          </div>

          {(fromDate || toDate || search) && (
            <button 
              onClick={() => { setFromDate(''); setToDate(''); setSearch(''); fetchLeaves(); }}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          )}

        </div>
      </div>

      {/* Results Table */}
      <div className="glass-panel" style={{
        padding: '24px', borderRadius: '20px',
        border: '1px solid var(--border-glass)', background: 'var(--bg-card)'
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Activity className="spinner" size={24} /> &nbsp; Fetching leave applications...
          </div>
        ) : leaves.length === 0 ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <div>No matching leave records found.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.015)' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Teacher Details</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Leave Type & Title</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Dates (From - To)</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>Total Days</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Status</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Remarks</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave, idx) => (
                  <tr key={leave.id} style={{ 
                    borderBottom: idx === leaves.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                    background: idx % 2 === 0 ? 'rgba(255,255,255,0.005)' : 'none'
                  }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {leave.teacherPhoto ? (
                          <img 
                            src={leave.teacherPhoto} 
                            alt={leave.teacherName} 
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-glass)' }}
                          />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            <User size={16} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{leave.teacherName}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ID: {leave.teacherEmployeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{leave.leaveType}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>{leave.title}</div>
                      {leave.emergency === 1 && (
                        <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', marginLeft: '5px' }}>EMERGENCY</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-main)' }}>
                      <div>{leave.fromDate}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>to {leave.toDate}</div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: 'var(--text-main)' }}>
                      {leave.totalDays}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        display: 'inline-block', padding: '4px 10px', borderRadius: '20px', 
                        fontSize: '0.78rem', fontWeight: 600, ...getStatusBadgeStyles(leave.status)
                      }}>
                        {leave.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {leave.remarks || <span style={{ opacity: 0.3 }}>—</span>}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        {leave.status === 'Pending' && (
                          <>
                            <button 
                              onClick={() => handleOpenDecision(leave, 'approve')}
                              style={{ border: 'none', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              title="Approve Request"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => handleOpenDecision(leave, 'reject')}
                              style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              title="Reject Request"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDelete(leave.id)}
                          style={{ border: 'none', background: 'none', color: '#6b7280', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Delete Request Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DECISION MODAL */}
      {showDecisionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999999, padding: '20px', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1',
            width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '20px',
            animation: 'scaleUp 0.25s ease-out', padding: '24px', color: '#000000',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#000000' }}>
                {decisionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <button 
                onClick={() => setShowDecisionModal(false)}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
              Provide admin remarks for <strong>{selectedLeave?.teacherName}</strong>'s request. These remarks will be visible in their employee portal.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Admin Remarks</label>
              <textarea
                rows={3}
                placeholder="e.g. Leave approved as per medical certificate."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => setShowDecisionModal(false)}
                className="btn-secondary"
                style={{ padding: '10px 18px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={actioning}
                className="btn-primary"
                style={{
                  padding: '10px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
                  background: decisionType === 'approve' ? '#10b981' : '#ef4444',
                  boxShadow: decisionType === 'approve' ? '0 0 12px rgba(16,185,129,0.3)' : '0 0 12px rgba(239,68,68,0.3)'
                }}
              >
                {actioning ? 'Processing...' : (decisionType === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
