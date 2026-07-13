import './StaffWorkReport.css';
import React, { useState, useEffect } from 'react';
import {
  FileText, ClipboardList, Send, Plus, X,
  Edit2, Trash2, RefreshCw, Calendar, Search, Activity
} from 'lucide-react';

export default function StaffWorkReport({ showToast, userProfile }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  const [form, setForm] = useState({
    reportType: 'Daily Report',
    reportDate: new Date().toISOString().split('T')[0],
    department: '',
    title: '',
    summary: '',
    tasksCompleted: '',
    hoursWorked: '',
    attachment: ''
  });

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/staff-reports?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  useEffect(() => {
    const handleFocus = () => fetchReports();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(fetchReports, 15000);
    return () => { window.removeEventListener('focus', handleFocus); clearInterval(interval); };
  }, []);

  const handleOpenNew = () => {
    setEditingReport(null);
    setForm({
      reportType: 'Daily Report',
      reportDate: new Date().toISOString().split('T')[0],
      department: '', title: '', summary: '',
      tasksCompleted: '', hoursWorked: '', attachment: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (report) => {
    setEditingReport(report);
    setForm({
      reportType: report.reportType,
      reportDate: report.reportDate,
      department: report.department || '',
      title: report.title,
      summary: report.summary,
      tasksCompleted: report.tasksCompleted || '',
      hoursWorked: report.hoursWorked || '',
      attachment: report.attachment || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) {
      showToast('Title and summary are required.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const url = editingReport ? `/api/staff-reports/${editingReport.id}` : '/api/staff-reports';
      const method = editingReport ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const result = await res.json();
      if (res.ok) {
        showToast(editingReport ? 'Report updated successfully.' : 'Report submitted successfully.', 'success');
        setShowModal(false);
        fetchReports();
      } else {
        showToast(result.error || 'Failed to submit report.', 'error');
      }
    } catch (err) {
      showToast('Error submitting report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      const res = await fetch(`/api/staff-reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Report deleted.', 'success');
        fetchReports();
      } else {
        const result = await res.json();
        showToast(result.error || 'Failed to delete.', 'error');
      }
    } catch (err) {
      showToast('Error deleting report.', 'error');
    }
  };

  const reportTypeBadge = (type) => {
    return (
      <span style={{
        padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700,
        background: 'rgba(59,130,246,0.1)', color: '#2563eb',
        border: '1px solid rgba(59,130,246,0.2)'
      }}>
        {type}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', borderRadius: '18px',
        padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>My Work Reports</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.85 }}>Submit & track your daily work reports</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchReports} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={handleOpenNew} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#ffffff', color: '#0ea5e9', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Submit Report
          </button>
        </div>
      </div>

      {/* History Table */}
      <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-glass, #e2e8f0)', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>Filing History</h3>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>Loading reports...</div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-secondary, #f1f5f9)', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={28} />
            </div>
            <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.88rem' }}>No reports found.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary, #f8fafc)', color: 'var(--text-muted, #475569)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Report Details</th>
                  <th style={{ padding: '12px 8px' }}>Department</th>
                  <th style={{ padding: '12px 8px' }}>Date</th>
                  <th style={{ padding: '12px 8px' }}>Hours</th>
                  <th style={{ padding: '12px 8px' }}>Summary / Tasks</th>
                  <th style={{ padding: '12px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id} style={{ borderBottom: '1px solid var(--border-glass, #e2e8f0)' }}>
                    <td style={{ padding: '14px 8px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '2px' }}>{report.title}</div>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: 'var(--text-main, #0f172a)', fontSize: '0.8rem' }}>{report.department || '—'}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: 'var(--text-main, #0f172a)', fontWeight: 600 }}>{report.reportDate}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 700, color: '#0ea5e9' }}>{report.hoursWorked || '—'}</td>
                    <td style={{ padding: '14px 8px', color: 'var(--text-muted, #64748b)', maxWidth: '250px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main, #334155)' }}>{report.summary}</div>
                      {report.tasksCompleted && <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>Tasks: {report.tasksCompleted}</div>}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button onClick={() => handleOpenEdit(report)} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#3b82f6', cursor: 'pointer' }}><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(report.id)} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-card, #ffffff)', borderRadius: '18px', width: '95%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ClipboardList size={20} style={{ color: '#0ea5e9' }} />
                {editingReport ? 'Edit Report' : 'Submit Daily Report'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #475569)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Report Date *</label>
                  <input type="date" value={form.reportDate} onChange={e => setForm(p => ({ ...p, reportDate: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-glass, #cbd5e1)', background: 'var(--bg-secondary, #f8fafc)', fontSize: '0.86rem', color: 'var(--text-main, #000)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #475569)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Department</label>
                  <input type="text" placeholder="e.g. Administration" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-glass, #cbd5e1)', background: 'var(--bg-secondary, #f8fafc)', fontSize: '0.86rem', color: 'var(--text-main, #000)' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #475569)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Title *</label>
                <input type="text" placeholder="Brief title for your report" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-glass, #cbd5e1)', background: 'var(--bg-secondary, #f8fafc)', fontSize: '0.86rem', color: 'var(--text-main, #000)' }} required />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #475569)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Work Summary *</label>
                <textarea placeholder="Describe work done today..." value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-glass, #cbd5e1)', background: 'var(--bg-secondary, #f8fafc)', fontSize: '0.86rem', color: 'var(--text-main, #000)', resize: 'vertical' }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #475569)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Tasks Completed</label>
                  <input type="text" placeholder="e.g. Filed records, Managed inventory" value={form.tasksCompleted} onChange={e => setForm(p => ({ ...p, tasksCompleted: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-glass, #cbd5e1)', background: 'var(--bg-secondary, #f8fafc)', fontSize: '0.86rem', color: 'var(--text-main, #000)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #475569)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Hours Worked</label>
                  <input type="number" step="0.5" min="0" max="24" placeholder="e.g. 8" value={form.hoursWorked} onChange={e => setForm(p => ({ ...p, hoursWorked: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-glass, #cbd5e1)', background: 'var(--bg-secondary, #f8fafc)', fontSize: '0.86rem', color: 'var(--text-main, #000)' }} />
                </div>
              </div>

              <button type="submit" disabled={submitting} style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)', color: '#ffffff', fontSize: '0.92rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.7 : 1
              }}>
                <Send size={16} /> {submitting ? 'Submitting...' : (editingReport ? 'Update Report' : 'Submit Report')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

