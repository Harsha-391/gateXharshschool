import './TeacherWorkReport.css';
import React, { useState, useEffect } from 'react';
import {
  FileText, ClipboardList, Send, Plus, X,
  Edit2, Trash2, RefreshCw, Calendar, Search, BookOpen, Trash, Eye
} from 'lucide-react';

export default function TeacherWorkReport({ showToast, userProfile }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [viewModalReport, setViewModalReport] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [form, setForm] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    overallRemarks: ''
  });

  const [classEntries, setClassEntries] = useState([
    {
      className: '',
      section: '',
      subject: '',
      topic: '',
      workDone: '',
      homework: ''
    }
  ]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/teacher-reports?_t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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

  const filteredReports = reports.filter(r => {
    let matchDate = true;
    if (fromDate) matchDate = matchDate && r.reportDate >= fromDate;
    if (toDate) matchDate = matchDate && r.reportDate <= toDate;
    return matchDate;
  });

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
      reportDate: new Date().toISOString().split('T')[0],
      overallRemarks: ''
    });
    setClassEntries([
      {
        className: '',
        section: '',
        subject: '',
        topic: '',
        workDone: '',
        homework: ''
      }
    ]);
    setShowModal(true);
  };

  const handleOpenEdit = (report) => {
    setEditingReport(report);
    setForm({
      reportDate: report.reportDate,
      overallRemarks: report.tasksCompleted || ''
    });
    
    let parsed = [];
    try {
      if (report.summary && report.summary.startsWith('[')) {
        parsed = JSON.parse(report.summary);
      }
    } catch (e) {
      console.error('Error parsing report summary JSON:', e);
    }

    if (parsed.length > 0) {
      setClassEntries(parsed.map(item => ({
        className: item.className || '',
        section: item.section || '',
        subject: item.subject || '',
        topic: item.topic || '',
        workDone: item.workDone || '',
        homework: item.homework || ''
      })));
    } else {
      // Legacy reports fallback
      const parts = (report.className || '').trim().split(' ');
      const cls = parts[0] || '';
      const sec = parts.slice(1).join(' ') || '';
      setClassEntries([
        {
          className: cls,
          section: sec,
          subject: report.subject || '',
          topic: report.chapterTopic || '',
          workDone: report.summary || '',
          homework: ''
        }
      ]);
    }
    setShowModal(true);
  };

  const addClassEntry = () => {
    setClassEntries(prev => [
      ...prev,
      {
        className: '',
        section: '',
        subject: '',
        topic: '',
        workDone: '',
        homework: ''
      }
    ]);
  };

  const removeClassEntry = (index) => {
    if (classEntries.length === 1) {
      showToast('You must have at least one class entry.', 'error');
      return;
    }
    setClassEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleClassEntryChange = (index, field, value) => {
    setClassEntries(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (classEntries.some(entry => !entry.className.trim() || !entry.section.trim() || !entry.subject.trim() || !entry.workDone.trim())) {
      showToast('Please fill in Class, Section, Subject, and Description for all entries.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reportType: 'Daily Report',
        reportDate: form.reportDate,
        title: form.overallRemarks.trim() ? form.overallRemarks.trim().substring(0, 100) : `Daily Work Report - ${form.reportDate}`,
        summary: JSON.stringify(classEntries),
        subject: classEntries[0]?.subject || '',
        className: `${classEntries[0]?.className || ''} ${classEntries[0]?.section || ''}`.trim(),
        chapterTopic: classEntries[0]?.topic || '',
        tasksCompleted: form.overallRemarks || '',
        hoursWorked: 0,
        syllabusPercentage: 0
      };

      const url = editingReport ? `/api/teacher-reports/${editingReport.id}` : '/api/teacher-reports';
      const method = editingReport ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
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
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/teacher-reports/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
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

  const renderSummaryPreview = (report) => {
    let entries = [];
    try {
      if (report.summary && report.summary.startsWith('[')) {
        entries = JSON.parse(report.summary);
      }
    } catch(e) {}

    if (entries.length > 0) {
      const first = entries[0];
      return (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
            {first.subject} in {first.className} {first.section || ''} — <span style={{ fontWeight: 500, color: 'var(--text-muted, #64748b)' }}>{first.topic}</span>
          </div>
          {entries.length > 1 && (
            <div style={{ fontSize: '0.72rem', color: '#8b5cf6', marginTop: '4px', fontWeight: 700, display: 'inline-block', background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
              + {entries.length - 1} more classes taught
            </div>
          )}
          {report.tasksCompleted && (
            <div style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-muted, #64748b)', fontStyle: 'italic' }}>
              Note: {report.tasksCompleted}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-main, #334155)' }}>{report.summary}</div>
        {report.tasksCompleted && <div style={{ fontSize: '0.75rem', marginTop: '2px', fontStyle: 'italic' }}>Note: {report.tasksCompleted}</div>}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #FF8C42 0%, #8b5cf6 100%)', borderRadius: '18px',
        padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>My Daily Work Reports</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.85 }}>Submit and log your daily teaching reports</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchReports} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={handleOpenNew} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#ffffff', color: '#FF8C42', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Submit Report
          </button>
        </div>
      </div>

      {/* History Table */}
      <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-glass, #e2e8f0)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass, #e2e8f0)', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>Filing History</h3>
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(''); setToDate(''); }}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>
              Clear Filters
            </button>
          )}
        </div>

        {/* Date Filter Controls */}
        <div style={{ background: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-glass, #cbd5e1)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #475569)' }}>
            <Calendar size={16} /> Filter by Date Range:
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="date" value={fromDate} onChange={e => {
              const val = e.target.value;
              setFromDate(val);
              if (toDate && val > toDate) {
                setToDate(val);
              }
            }} max={new Date().toISOString().split('T')[0]}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.84rem', color: '#000000' }} />
            <span style={{ fontSize: '0.84rem', color: '#64748b' }}>to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} max={new Date().toISOString().split('T')[0]} min={fromDate}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.84rem', color: '#000000' }} />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-secondary, #f1f5f9)', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={28} />
            </div>
            <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.88rem' }}>No reports found.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary, #f8fafc)', color: 'var(--text-muted, #475569)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Date</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Class</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Section</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Chapter</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Homework</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Overall Remarks</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => {
                  let entries = [];
                  try {
                    if (report.summary && report.summary.startsWith('[')) {
                      entries = JSON.parse(report.summary);
                    }
                  } catch(e) {}

                  if (entries.length === 0) {
                    const parts = (report.className || '').trim().split(' ');
                    const cls = parts[0] || '';
                    const sec = parts.slice(1).join(' ') || '';
                    entries = [{
                      className: cls,
                      section: sec,
                      subject: report.subject || '',
                      topic: report.chapterTopic || '',
                      homework: '—'
                    }];
                  }

                  return (
                    <tr key={report.id} style={{ borderBottom: '1px solid var(--border-glass, #e2e8f0)' }}>
                      <td style={{ padding: '14px 8px', textAlign: 'center', color: 'var(--text-main, #0f172a)', fontWeight: 600 }}>{report.reportDate}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        {entries.map((e, idx) => (
                          <div key={idx} style={{ margin: idx > 0 ? '4px 0 0 0' : 0, fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>{e.className}</div>
                        ))}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        {entries.map((e, idx) => (
                          <div key={idx} style={{ margin: idx > 0 ? '4px 0 0 0' : 0, fontWeight: 700, color: '#475569' }}>{e.section || '—'}</div>
                        ))}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                        {entries.map((e, idx) => (
                          <div key={idx} style={{ margin: idx > 0 ? '4px 0 0 0' : 0, fontWeight: 700, color: '#FF8C42' }}>{e.subject}</div>
                        ))}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                        {entries.map((e, idx) => (
                          <div key={idx} style={{ margin: idx > 0 ? '4px 0 0 0' : 0, color: '#334155' }}>{e.topic || '—'}</div>
                        ))}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                        {entries.map((e, idx) => (
                          <div key={idx} style={{ margin: idx > 0 ? '4px 0 0 0' : 0, color: '#475569' }}>{e.homework || '—'}</div>
                        ))}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'left', color: '#64748b', fontStyle: 'italic' }}>
                        {report.tasksCompleted || '—'}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button onClick={() => setViewModalReport(report)} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#FF8C42', cursor: 'pointer' }} title="View details"><Eye size={14} /></button>
                          <button onClick={() => handleOpenEdit(report)} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#3b82f6', cursor: 'pointer' }} title="Edit"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(report.id)} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#ef4444', cursor: 'pointer' }} title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Redesigned Dynamic Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '95%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 107, 0,0.1)', color: '#FF8C42', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    {editingReport ? 'Edit Daily Work Report (v2)' : 'Submit Daily Work Report (v2)'}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Log multiple class-wise reports for the day</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* TOP SECTION: General Settings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Report Date *</label>
                  <input type="date" value={form.reportDate} max={new Date().toISOString().split('T')[0]} onChange={e => setForm(p => ({ ...p, reportDate: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Overall Remarks / Notes</label>
                  <input type="text" data-bypass="true" placeholder="General comments or highlights about today's work..." value={form.overallRemarks} onChange={e => setForm(p => ({ ...p, overallRemarks: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.88rem', color: '#0f172a', outline: 'none' }} />
                </div>
              </div>

              {/* DYNAMIC MIDDLE SECTION: Class-wise Reports */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Class Reports ({classEntries.length})</h4>
                  <button type="button" onClick={addClassEntry} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: 'none', background: 'rgba(255, 107, 0,0.1)', color: '#FF8C42', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <Plus size={14} /> Add Class Report
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {classEntries.map((entry, index) => (
                    <div key={index} style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', background: '#ffffff', transition: 'box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 0,0.04)'} onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'}>
                      
                      {/* Delete Entry Button */}
                      <button type="button" onClick={() => removeClassEntry(index)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remove class entry">
                        <Trash size={16} />
                      </button>

                      {/* Header Index Tag */}
                      <div style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', marginBottom: '16px', textTransform: 'uppercase' }}>
                        Class Entry #{index + 1}
                      </div>

                      {/* Main Entry Inputs Grid */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        {/* Row 1: Class, Section, Subject */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Class *</label>
                            <input type="text" data-bypass="true" placeholder="e.g. 10" value={entry.className} onChange={e => handleClassEntryChange(index, 'className', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', color: '#0f172a' }} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Section *</label>
                            <input type="text" data-bypass="true" placeholder="e.g. A" value={entry.section || ''} onChange={e => handleClassEntryChange(index, 'section', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', color: '#0f172a' }} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Subject *</label>
                            <input type="text" data-bypass="true" placeholder="e.g. Mathematics" value={entry.subject} onChange={e => handleClassEntryChange(index, 'subject', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', color: '#0f172a' }} required />
                          </div>
                        </div>

                        {/* Row 2: Topic, Work Done, Homework */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 2fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Chapter</label>
                            <input type="text" data-bypass="true" placeholder="e.g. Chapter 1 (any text)" value={entry.topic} onChange={e => handleClassEntryChange(index, 'topic', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', color: '#0f172a' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Description *</label>
                            <input type="text" data-bypass="true" placeholder="Describe what was taught or done in the class" value={entry.workDone} onChange={e => handleClassEntryChange(index, 'workDone', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', color: '#0f172a' }} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Homework</label>
                            <input type="text" data-bypass="true" placeholder="List homework assigned, exercises, etc." value={entry.homework} onChange={e => handleClassEntryChange(index, 'homework', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', color: '#0f172a' }} />
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <button type="submit" disabled={submitting} style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #FF8C42, #8b5cf6)', color: '#ffffff', fontSize: '0.92rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.7 : 1
              }}>
                <Send size={16} /> {submitting ? 'Submitting...' : (editingReport ? 'Update Report' : 'Submit Report')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewModalReport && (() => {
        let entries = [];
        try {
          if (viewModalReport.summary && viewModalReport.summary.startsWith('[')) {
            entries = JSON.parse(viewModalReport.summary);
          }
        } catch(e) {}

        if (entries.length === 0) {
          const parts = (viewModalReport.className || '').trim().split(' ');
          const cls = parts[0] || '';
          const sec = parts.slice(1).join(' ') || '';
          entries = [{
            className: cls,
            section: sec,
            subject: viewModalReport.subject || '',
            topic: viewModalReport.chapterTopic || '',
            workDone: viewModalReport.summary || '',
            homework: '—'
          }];
        }

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}>
            <div style={{ background: '#ffffff', borderRadius: '24px', width: '95%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 107, 0,0.1)', color: '#FF8C42', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Daily Work Report Details</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Filing Date: {viewModalReport.reportDate}</p>
                  </div>
                </div>
                <button onClick={() => setViewModalReport(null)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                  <X size={18} />
                </button>
              </div>

              {/* General Metadata Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Report Date</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{viewModalReport.reportDate}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Overall Remarks</span>
                  <span style={{ fontSize: '0.88rem', color: '#334155', fontStyle: 'italic' }}>{viewModalReport.tasksCompleted || '—'}</span>
                </div>
              </div>

              {/* Class Reports List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Class Reports ({entries.length})</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {entries.map((entry, idx) => (
                    <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', background: '#f8fafc' }}>
                      {/* Entry Index Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                        <span style={{ background: '#e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.72rem', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Class Entry #{idx + 1}
                        </span>
                      </div>

                      {/* Content Fields Grid */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Meta Fields Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                          <div>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Class</span>
                            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>{entry.className}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Section</span>
                            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>{entry.section || '—'}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Subject</span>
                            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FF8C42' }}>{entry.subject}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Chapter</span>
                            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155' }}>{entry.topic || '—'}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Homework</span>
                            <span style={{ fontSize: '0.86rem', color: '#475569', fontWeight: 500 }}>{entry.homework || '—'}</span>
                          </div>
                        </div>

                        {/* Description Box */}
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>Description (Work Done)</span>
                          <span style={{ fontSize: '0.88rem', color: '#0f172a', lineHeight: 1.5, display: 'block', whiteSpace: 'pre-wrap', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                            {entry.workDone}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={() => setViewModalReport(null)} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

