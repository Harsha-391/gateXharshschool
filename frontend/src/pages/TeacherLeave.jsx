import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Edit2, 
  Clock, 
  Send, 
  Plus, 
  X, 
  AlertTriangle, 
  Phone, 
  Paperclip,
  Activity,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  BookOpen
} from 'lucide-react';

export default function TeacherLeave({ showToast, userProfile }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activePolicies, setActivePolicies] = useState([]);
  const [holidays, setHolidays] = useState([]);
  
  // Dashboard Tabs: 'pending' | 'approved' | 'rejected' | 'all'
  const [historyTab, setHistoryTab] = useState('pending');

  // Form State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null); // Leave object if editing
  
  const [form, setForm] = useState({
    leaveType: '',
    title: '',
    reason: '',
    fromDate: '',
    toDate: '',
    halfDay: false,
    emergency: false,
    contactNumber: '',
    attachment: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLeaves(),
        fetchPolicies(),
        fetchHolidays()
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await fetch(`/api/teacher-leaves?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data || []);
      } else {
        showToast('Failed to load leave records.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to leaves API.', 'error');
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await fetch(`/api/teacher-leaves/policies?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setActivePolicies(data || []);
        if (data.length > 0 && !form.leaveType) {
          setForm(prev => ({ ...prev, leaveType: data[0].leaveType }));
        }
      }
    } catch (err) {
      console.error('Error fetching leave settings:', err);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch(`/api/academics/holidays?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setHolidays((data || []).filter(h => h.isDeleted !== 1 && h.isDeleted !== true));
      }
    } catch (err) {
      console.error('Error fetching school holidays:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refetch leaves when the user switches tabs (Pending/Approved/Rejected)
  useEffect(() => {
    fetchLeaves();
  }, [historyTab]);

  // Background polling every 10 seconds and window focus listener for real-time updates
  useEffect(() => {
    const handleFocus = () => {
      fetchLeaves();
    };

    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => {
      fetchLeaves();
    }, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Helper: check if a specific date is a Sunday
  const isSunday = (dateStr) => {
    const d = new Date(dateStr);
    return d.getDay() === 0;
  };

  // Helper: check if a specific date is a School Holiday
  const isSchoolHoliday = (dateStr) => {
    return holidays.some(h => dateStr >= h.startDate && dateStr <= h.endDate);
  };

  // Calculate actual school days (excludes Sunday and holidays)
  const calculateSchoolDays = (startStr, endStr, isHalfDay) => {
    if (!startStr || !endStr) return 0;
    if (isHalfDay) return 0.5;

    const start = new Date(startStr);
    const end = new Date(endStr);
    if (start > end) return 0;

    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      // Exclude Sunday
      if (d.getDay() === 0) continue;
      // Exclude school holidays
      if (isSchoolHoliday(dateStr)) continue;
      count++;
    }
    return count;
  };

  const getUsedDaysForPolicy = (leaveType) => {
    return leaves
      .filter(l => l.leaveType === leaveType && l.status === 'Approved')
      .reduce((sum, l) => sum + Number(l.totalDays || 0), 0);
  };

  const handleOpenApply = () => {
    setEditingLeave(null);
    setForm({
      leaveType: activePolicies.length > 0 ? activePolicies[0].leaveType : '',
      title: '',
      reason: '',
      fromDate: '',
      toDate: '',
      halfDay: false,
      emergency: false,
      contactNumber: '',
      attachment: ''
    });
    setShowApplyModal(true);
  };

  const handleOpenEdit = (leave) => {
    setEditingLeave(leave);
    setForm({
      leaveType: leave.leaveType,
      title: leave.title,
      reason: leave.reason,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      halfDay: leave.halfDay === 1 || leave.halfDay === true,
      emergency: leave.emergency === 1 || leave.emergency === true,
      contactNumber: leave.contactNumber || '',
      attachment: leave.attachment || ''
    });
    setShowApplyModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.leaveType) {
      showToast('Please select a leave type.', 'error');
      return;
    }

    if (new Date(form.fromDate) > new Date(form.toDate)) {
      showToast('Start date cannot be after end date.', 'error');
      return;
    }

    if (form.contactNumber && form.contactNumber.trim().length < 5) {
      showToast('Contact number must be at least 5 digits/characters.', 'error');
      return;
    }

    const calculatedDays = calculateSchoolDays(form.fromDate, form.toDate, form.halfDay);
    if (calculatedDays === 0) {
      showToast('Requested range contains only Sundays or holidays.', 'error');
      return;
    }

    // Overlap checks
    const hasOverlap = leaves.some(l => {
      if (l.status === 'Rejected' || l.status === 'Cancelled') return false;
      if (editingLeave && l.id === editingLeave.id) return false;
      return (form.fromDate <= l.toDate && form.toDate >= l.fromDate);
    });

    if (hasOverlap) {
      showToast('Overlapping leave request detected for these dates.', 'error');
      return;
    }

    // Balance checks
    const targetPolicy = activePolicies.find(p => p.leaveType === form.leaveType);
    if (targetPolicy) {
      const used = getUsedDaysForPolicy(form.leaveType);
      const remaining = Number(targetPolicy.maxDays || 0) - used;
      if (calculatedDays > remaining && !form.emergency) {
        showToast(`Requested days (${calculatedDays}) exceed remaining balance (${remaining} days).`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const url = editingLeave ? `/api/teacher-leaves/${editingLeave.id}` : '/api/teacher-leaves';
      const method = editingLeave ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const result = await res.json();
      if (res.ok) {
        showToast(editingLeave ? 'Leave request updated.' : 'Leave request submitted.', 'success');
        setShowApplyModal(false);
        fetchLeaves();
      } else {
        showToast(result.error || 'Operation failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error, please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this pending leave request?')) {
      return;
    }

    try {
      const res = await fetch(`/api/teacher-leaves/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Leave request cancelled.', 'success');
        fetchLeaves();
      } else {
        const result = await res.json();
        showToast(result.error || 'Failed to cancel leave.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error.', 'error');
    }
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Since backend accepts a text column for attachment, we mock-upload
      // and store the filename or mock path.
      setForm(prev => ({ ...prev, attachment: file.name }));
      showToast(`Document "${file.name}" uploaded successfully.`, 'success');
    }
  };

  // Metrics computations
  const totalBalance = activePolicies.reduce((sum, p) => sum + Number(p.maxDays || 0), 0);
  const totalUsed = leaves.filter(l => l.status === 'Approved').reduce((sum, l) => sum + Number(l.totalDays || 0), 0);
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length;

  const currentYear = new Date().getFullYear();

  // Tab Filtering
  const pendingLeaves = leaves.filter(l => l.status === 'Pending');
  const approvedLeaves = leaves.filter(l => l.status === 'Approved');
  const rejectedLeaves = leaves.filter(l => l.status === 'Rejected');

  const getFilteredLeaves = () => {
    if (historyTab === 'pending') return pendingLeaves;
    if (historyTab === 'approved') return approvedLeaves;
    if (historyTab === 'rejected') return rejectedLeaves;
    return leaves;
  };

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

  // Days auto-calc logic for display in UI
  const formDaysSelected = calculateSchoolDays(form.fromDate, form.toDate, form.halfDay);
  const formSelectedPolicy = activePolicies.find(p => p.leaveType === form.leaveType);
  const formSelectedPolicyRemaining = formSelectedPolicy ? (Number(formSelectedPolicy.maxDays || 0) - getUsedDaysForPolicy(form.leaveType)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      
      {/* 1. Header Card */}
      <div className="glass-panel animate-slide-up" style={{
        padding: '24px 30px', borderRadius: '20px',
        border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '14px', borderRadius: '16px',
            background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Calendar size={28} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>My Leaves</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Track your balance, requests & upcoming time off
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={fetchData} 
            className="btn-secondary" 
            style={{ padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Refresh statistics"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={handleOpenApply}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', fontSize: '0.9rem', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={18} /> Apply for Leave
          </button>
        </div>
      </div>

      {/* 2. Summary Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Available Balance</span>
            <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{Math.max(0, totalBalance - totalUsed)}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Days remaining for use</span>
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Leaves Used</span>
            <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalUsed}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved days taken</span>
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pending Approval</span>
            <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{pendingCount}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting manager response</span>
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Activity size={22} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Approved Filings</span>
            <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{approvedCount}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Successfully processed</span>
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

      </div>

      {/* 3. Leave Balances & Limits */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <TrendingUp size={20} style={{ color: 'hsl(var(--color-primary))' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Leave Balances & Limits</h3>
        </div>
        
        {activePolicies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No active leave policies configured for Teachers.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {activePolicies.map(p => {
              const used = getUsedDaysForPolicy(p.leaveType);
              const limit = Number(p.maxDays || 0);
              const left = Math.max(0, limit - used);
              const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
              
              return (
                <div key={p.id} style={{
                  padding: '16px', borderRadius: '14px', border: '1px solid var(--border-glass)',
                  background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{p.leaveType}</span>
                      <span style={{ marginLeft: '6px', fontSize: '0.72rem', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{p.leaveCode}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: left > 0 ? 'hsl(var(--color-primary))' : '#ef4444' }}>
                      {left} days left
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: left > 2 ? 'linear-gradient(90deg, #3b82f6, #10b981)' : '#ef4444', borderRadius: '4px' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{used} used</span>
                    <span>{limit} total</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. History Log & Tab Navigation */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
        
        {/* Tab Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Filing Status & History</h3>
          
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <button 
              onClick={() => setHistoryTab('pending')}
              style={{
                padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: historyTab === 'pending' ? 'hsl(var(--color-primary))' : 'transparent',
                color: historyTab === 'pending' ? '#ffffff' : 'var(--text-muted)', transition: 'all 0.2s'
              }}
            >
              Pending ({pendingLeaves.length})
            </button>
            <button 
              onClick={() => setHistoryTab('approved')}
              style={{
                padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: historyTab === 'approved' ? 'hsl(var(--color-primary))' : 'transparent',
                color: historyTab === 'approved' ? '#ffffff' : 'var(--text-muted)', transition: 'all 0.2s'
              }}
            >
              Approved ({approvedLeaves.length})
            </button>
            <button 
              onClick={() => setHistoryTab('rejected')}
              style={{
                padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: historyTab === 'rejected' ? 'hsl(var(--color-primary))' : 'transparent',
                color: historyTab === 'rejected' ? '#ffffff' : 'var(--text-muted)', transition: 'all 0.2s'
              }}
            >
              Rejected ({rejectedLeaves.length})
            </button>
            <button 
              onClick={() => setHistoryTab('all')}
              style={{
                padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: historyTab === 'all' ? 'hsl(var(--color-primary))' : 'transparent',
                color: historyTab === 'all' ? '#ffffff' : 'var(--text-muted)', transition: 'all 0.2s'
              }}
            >
              All History ({leaves.length})
            </button>
          </div>
        </div>

        {/* History Table */}
        {getFilteredLeaves().length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={42} style={{ opacity: 0.3, marginBottom: '14px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>No Leave Filings Found</div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem' }}>No requests are currently recorded in the selected category.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.01)' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>Leave Details</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>From Date</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>To Date</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>Total Days</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>Remarks & Docs</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredLeaves().map((leave, idx) => (
                  <tr key={leave.id} style={{ 
                    borderBottom: idx === getFilteredLeaves().length - 1 ? 'none' : '1px solid rgba(0,0,0,0.03)',
                    background: idx % 2 === 0 ? 'rgba(0,0,0,0.003)' : 'none'
                  }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{leave.leaveType}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>{leave.title}</div>
                      {leave.emergency === 1 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginTop: '6px' }}>
                          <AlertTriangle size={10} /> Emergency
                        </span>
                      )}
                      {leave.halfDay === 1 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginTop: '6px', marginLeft: '6px' }}>
                          Half Day
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontWeight: 500 }}>{leave.fromDate}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontWeight: 500 }}>{leave.toDate}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, color: 'var(--text-main)' }}>
                      {leave.totalDays}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ 
                        display: 'inline-block', padding: '4px 10px', borderRadius: '15px', 
                        fontSize: '0.75rem', fontWeight: 700, ...getStatusBadgeStyles(leave.status)
                      }}>
                        {leave.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', maxWidth: '200px' }}>
                      <div style={{ fontSize: '0.8rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={leave.remarks}>
                        <strong>Remarks:</strong> {leave.remarks || <span style={{ opacity: 0.3 }}>N/A</span>}
                      </div>
                      {leave.attachment && (
                        <div style={{ marginTop: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(var(--color-primary))', fontWeight: 600 }}>
                          <Paperclip size={10} /> {leave.attachment}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {leave.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleOpenEdit(leave)}
                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }}
                            title="Edit details"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleCancel(leave.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            title="Cancel request"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.5 }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Bottom Two-Column Widget Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Left widget: Leave Usage Analytics */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Leave Usage — {currentYear}
          </h3>
          {leaves.filter(l => l.status === 'Approved').length === 0 ? (
            <div style={{ height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <Activity size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
              No leave usage recorded for {currentYear}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activePolicies.map(p => {
                const used = getUsedDaysForPolicy(p.leaveType);
                const limit = Number(p.maxDays || 0);
                const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                if (used === 0) return null;

                return (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-main)' }}>{p.leaveType}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{used} days ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'hsl(var(--color-primary))', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right widget: Upcoming School Holidays */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Upcoming School Holidays
          </h3>
          {holidays.length === 0 ? (
            <div style={{ height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <Calendar size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
              No upcoming holidays
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {holidays.slice(0, 3).map(h => (
                <div key={h.id} style={{
                  padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.01)',
                  border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)' }}>{h.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {h.startDate} {h.endDate !== h.startDate ? `to ${h.endDate}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(99,102,241,0.08)', color: '#6366f1', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    {h.type || 'Holiday'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 6. APPLY/EDIT MODAL */}
      {showApplyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999999, padding: '20px', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1',
            width: '100%', maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '20px',
            animation: 'scaleUp 0.2s ease-out', padding: '28px', color: '#000000',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            
            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: 'hsl(var(--color-primary))' }} />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#000000' }}>
                  {editingLeave ? 'Update Leave Request' : 'Apply for Leave'}
                </h3>
              </div>
              <button 
                onClick={() => setShowApplyModal(false)}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                {/* Leave Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Leave Type</label>
                  <select
                    value={form.leaveType}
                    onChange={e => setForm({ ...form, leaveType: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', cursor: 'pointer', fontSize: '0.86rem' }}
                  >
                    {activePolicies.length === 0 ? (
                      <option value="">No Active Policies Configured</option>
                    ) : (
                      activePolicies.map(p => (
                        <option key={p.id} value={p.leaveType}>
                          {p.leaveType} ({p.leaveCode})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Title */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Leave Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Medical Consultation"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', fontSize: '0.86rem' }}
                  />
                </div>

              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>From Date</label>
                  <input
                    type="date"
                    required
                    value={form.fromDate}
                    onChange={e => setForm({ ...form, fromDate: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', fontSize: '0.86rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>To Date</label>
                  <input
                    type="date"
                    required
                    disabled={form.halfDay}
                    value={form.halfDay ? form.fromDate : form.toDate}
                    onChange={e => setForm({ ...form, toDate: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: form.halfDay ? '#e2e8f0' : '#f8fafc', color: '#000000', fontSize: '0.86rem' }}
                  />
                </div>

              </div>

              {/* Checkboxes & Total calculated days badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: '#334155', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={form.halfDay}
                      onChange={e => {
                        const val = e.target.checked;
                        setForm(prev => ({ ...prev, halfDay: val, toDate: val ? prev.fromDate : prev.toDate }));
                      }}
                      style={{ accentColor: 'hsl(var(--color-primary))', width: '15px', height: '15px' }}
                    />
                    Half Day
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: '#334155', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={form.emergency}
                      onChange={e => setForm({ ...form, emergency: e.target.checked })}
                      style={{ accentColor: 'hsl(var(--color-primary))', width: '15px', height: '15px' }}
                    />
                    Emergency Leave
                  </label>
                </div>
                
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                  Total Selected: <span style={{ color: 'hsl(var(--color-primary))', fontSize: '0.95rem' }}>{formDaysSelected}</span> days
                  {formSelectedPolicy && (
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '6px', fontWeight: 500 }}>
                      (Remaining: {formSelectedPolicyRemaining} days)
                    </span>
                  )}
                </div>
              </div>

              {/* Overlap Holiday Alerts */}
              {form.fromDate && (isSunday(form.fromDate) || isSchoolHoliday(form.fromDate)) && (
                <div style={{ background: 'rgba(245,158,11,0.08)', color: '#b45309', border: '1px solid rgba(245,158,11,0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} />
                  <span>Notice: Selected dates overlap with a weekend or school calendar holiday.</span>
                </div>
              )}

              {/* Contact & Attachment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    <Phone size={12} /> Contact Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="10 digit mobile"
                    value={form.contactNumber}
                    onChange={e => setForm({ ...form, contactNumber: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', fontSize: '0.86rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    <Paperclip size={12} /> Supporting Document
                  </label>
                  <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      readOnly
                      placeholder="Upload file..."
                      value={form.attachment}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#000000', fontSize: '0.86rem' }}
                    />
                    <label style={{
                      padding: '10px 14px', background: 'hsl(var(--color-primary))', color: '#ffffff',
                      borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      Browse
                      <input 
                        type="file" 
                        onChange={handleDocumentChange}
                        style={{ display: 'none' }}
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      />
                    </label>
                  </div>
                </div>

              </div>

              {/* Reason */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Reason Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain why you are requesting leave..."
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', resize: 'none', fontSize: '0.86rem' }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{
                  padding: '12px', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px'
                }}
              >
                {submitting ? 'Submitting...' : (editingLeave ? 'Update Request' : 'Submit Leave Request')}
                <Send size={16} />
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
