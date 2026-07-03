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
  Activity
} from 'lucide-react';

export default function TeacherLeave({ showToast }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activePolicies, setActivePolicies] = useState([]);

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

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher-leaves');
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      } else {
        showToast('Failed to load leave records.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to leaves API.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await fetch('/api/leave-settings');
      if (res.ok) {
        const data = await res.json();
        const activeT = data.filter(p => p.employeeType === 'Teacher' && p.status === 'Active');
        setActivePolicies(activeT);
        if (activeT.length > 0 && !form.leaveType) {
          setForm(prev => ({ ...prev, leaveType: activeT[0].leaveType }));
        }
      }
    } catch (err) {
      console.error('Error fetching leave settings:', err);
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchPolicies();
  }, []);

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

    if (new Date(form.fromDate) > new Date(form.toDate)) {
      showToast('Start date cannot be after end date.', 'error');
      return;
    }

    if (form.contactNumber && !/^\d{10}$/.test(form.contactNumber)) {
      showToast('Contact number must be exactly 10 digits.', 'error');
      return;
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

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Approved':
        return { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' };
      case 'Rejected':
        return { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' };
      case 'Cancelled':
        return { background: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', border: '1px solid rgba(107, 114, 128, 0.2)' };
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
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>My Leave Tracker</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Apply for leave, check approval status, and manage your ongoing leaves.
          </p>
        </div>
        <button 
          onClick={handleOpenApply}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '0.9rem', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={18} /> Apply For Leave
        </button>
      </div>

      {/* Main Leave History */}
      <div className="glass-panel" style={{
        padding: '24px', borderRadius: '20px',
        border: '1px solid var(--border-glass)', background: 'var(--bg-card)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Leave Request History</h3>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Activity className="spinner" size={24} /> &nbsp; Loading history...
          </div>
        ) : leaves.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-main)' }}>No Leave Records Yet</div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>You haven't submitted any leave requests yet. Click the button above to apply.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.015)' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Leave Type & Title</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>From Date</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>To Date</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>Total Days</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Status</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Admin Remarks</th>
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
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{leave.leaveType}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>{leave.title}</div>
                      {leave.emergency === 1 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginTop: '6px' }}>
                          <AlertTriangle size={10} /> Emergency
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-main)' }}>{leave.fromDate}</td>
                    <td style={{ padding: '16px', color: 'var(--text-main)' }}>{leave.toDate}</td>
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
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      {leave.remarks || <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {leave.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleOpenEdit(leave)}
                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }}
                            title="Edit Pending Request"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleCancel(leave.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            title="Cancel Application"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', opacity: 0.5 }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPLY/EDIT MODAL */}
      {showApplyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999999, padding: '20px', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1',
            width: '100%', maxWidth: '550px', display: 'flex', flexDirection: 'column', gap: '20px',
            animation: 'scaleUp 0.25s ease-out', padding: '28px', color: '#000000',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            
            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#000000' }}>
                {editingLeave ? 'Update Leave Request' : 'Apply for Leave'}
              </h3>
              <button 
                onClick={() => setShowApplyModal(false)}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                {/* Leave Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Leave Type</label>
                  <select
                    value={form.leaveType}
                    onChange={e => setForm({ ...form, leaveType: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000' }}
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
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Leave Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wedding Attendance"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000' }}
                  />
                </div>

              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>From Date</label>
                  <input
                    type="date"
                    required
                    value={form.fromDate}
                    onChange={e => setForm({ ...form, fromDate: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>To Date</label>
                  <input
                    type="date"
                    required
                    value={form.toDate}
                    onChange={e => setForm({ ...form, toDate: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000' }}
                  />
                </div>

              </div>

              {/* Checkboxes */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: '#000000' }}>
                  <input
                    type="checkbox"
                    checked={form.halfDay}
                    onChange={e => setForm({ ...form, halfDay: e.target.checked })}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  Half Day Support
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: '#000000' }}>
                  <input
                    type="checkbox"
                    checked={form.emergency}
                    onChange={e => setForm({ ...form, emergency: e.target.checked })}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  Emergency Leave
                </label>
              </div>

              {/* Contact & Attachment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    <Phone size={12} /> Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="10 digit mobile"
                    value={form.contactNumber}
                    onChange={e => setForm({ ...form, contactNumber: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    <Paperclip size={12} /> Attachment Link / Info
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. medical_cert.pdf"
                    value={form.attachment}
                    onChange={e => setForm({ ...form, attachment: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000' }}
                  />
                </div>

              </div>

              {/* Reason */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Reason Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why you are requesting leave..."
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', resize: 'vertical' }}
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
                {submitting ? 'Submitting...' : (editingLeave ? 'Update Application' : 'Submit Application')}
                <Send size={16} />
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
