import React, { useState, useEffect } from 'react';
import {
  FileText, ClipboardList, Users, Calendar,
  Search, SlidersHorizontal, Download, X,
  Eye, Trash2, Clock, Activity
} from 'lucide-react';

export default function ReportManagement({ showToast }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [showDetailModal, setShowDetailModal] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'history'

  const getTenantHeader = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') return parts[0];
    return '';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenant = getTenantHeader();
      const res = await fetch(`/api/teacher-reports/admin?_t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenant }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data || []);
      } else {
        showToast('Failed to load reports.', 'error');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      showToast('Error loading reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const totalCount = reports.length;
  const todayCount = reports.filter(r => r.reportDate === todayStr).length;
  const thisMonthCount = reports.filter(r => r.reportDate >= new Date().toISOString().slice(0, 7)).length;

  const matchQuery = (name, term) => {
    if (!term) return true;
    const lowerTerm = term.trim().toLowerCase();
    const lowerName = (name || '').toLowerCase();
    return lowerName.startsWith(lowerTerm);
  };

  const filteredReports = reports.filter(r => {
    const matchSearch = matchQuery(r.teacherName, searchTerm);
    let matchDate = true;
    if (fromDate) matchDate = matchDate && r.reportDate >= fromDate;
    if (toDate) matchDate = matchDate && r.reportDate <= toDate;
    return matchSearch && matchDate;
  });

  const todaysReports = reports.filter(r => {
    const isToday = r.reportDate === todayStr;
    const matchSearch = matchQuery(r.teacherName, searchTerm);
    return isToday && matchSearch;
  });

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!reportToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const tenant = getTenantHeader();
      const res = await fetch(`/api/teacher-reports/${reportToDelete.id}/admin`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenant }
      });
      if (res.ok) {
        showToast('Report deleted successfully!', 'success');
        setReportToDelete(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete report.', 'error');
      }
    } catch (err) {
      showToast('Error deleting report.', 'error');
    }
  };

  const handleExport = () => {
    if (filteredReports.length === 0) return showToast('No data to export.', 'error');
    const headers = ['Report Date', 'Name', 'Title', 'Summary'];
    const csvRows = [headers.join(',')];
    filteredReports.forEach(r => {
      csvRows.push([
        r.reportDate,
        `"${r.teacherName || ''}"`,
        `"${r.title}"`,
        `"${(r.summary || '').replace(/"/g, '""').substring(0, 100)}"`
      ].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `teacher_reports_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>Teacher Work Reports Directory</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>
            View submitted work reports from teachers.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          { label: 'TOTAL SUBMITTED', value: totalCount, icon: <FileText size={22} />, color: '#6366f1' },
          { label: 'FILED TODAY', value: todayCount, icon: <Activity size={22} />, color: '#2563eb' },
          { label: "THIS MONTH'S FILINGS", value: thisMonthCount, icon: <Calendar size={22} />, color: '#3b82f6' }
        ].map((card, i) => (
          <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{card.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: card.color, lineHeight: 1.2 }}>{card.value}</div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: `${card.color}12`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
            <SlidersHorizontal size={16} /> Search & Filters
          </div>
          <button onClick={() => { setSearchTerm(''); setFromDate(''); setToDate(''); }}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>
            Clear Filters
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Search Teacher</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input type="text" placeholder="Search teacher name starting with..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.86rem', color: '#000000' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Date Range</label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} max={todayStr}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.8rem', color: '#000000' }} />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>to</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} max={todayStr}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.8rem', color: '#000000' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Helper Table Render */}
      {(() => {
        window.renderTable = (data, emptyMessage) => {
          if (loading) {
            return (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
                <Clock size={32} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <span>Loading reports...</span>
              </div>
            );
          }
          if (data.length === 0) {
            const displayMsg = searchTerm ? "No records found matching search." : emptyMessage;
            return (
              <div style={{ padding: '40px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
                <span style={{ color: '#64748b', fontSize: '0.82rem' }}>{displayMsg}</span>
              </div>
            );
          }

          return (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left' }}>Teacher Name</th>
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
                  {data.map(report => {
                    const name = report.teacherName;
                    const dept = report.teacherDepartment || 'N/A';
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
                      <tr key={report.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{name || 'Unknown'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{dept}</div>
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>{report.reportDate}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                          {entries.map((e, idx) => (
                            <div key={idx} style={{ margin: idx > 0 ? '4px 0 0 0' : 0, fontWeight: 700, color: '#0f172a' }}>{e.className}</div>
                          ))}
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                          {entries.map((e, idx) => (
                            <div key={idx} style={{ margin: idx > 0 ? '4px 0 0 0' : 0, fontWeight: 700, color: '#475569' }}>{e.section || '—'}</div>
                          ))}
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                          {entries.map((e, idx) => (
                            <div key={idx} style={{ margin: idx > 0 ? '4px 0 0 0' : 0, fontWeight: 700, color: '#6366f1' }}>{e.subject}</div>
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
                            <button onClick={() => setShowDetailModal(report)} title="View Details" style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#6366f1', cursor: 'pointer' }}>
                              <Eye size={14} />
                            </button>
                            <button onClick={() => setReportToDelete(report)} title="Delete" style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #ef4444', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        };
      })()}

      {/* Tabbed Table Card */}
      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
          {/* Tabs Navigation */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('today')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.86rem',
                background: activeTab === 'today' ? '#6366f1' : '#f1f5f9',
                color: activeTab === 'today' ? '#ffffff' : '#475569',
                transition: 'all 0.2s'
              }}
            >
              Today's Submissions ({todaysReports.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.86rem',
                background: activeTab === 'history' ? '#6366f1' : '#f1f5f9',
                color: activeTab === 'history' ? '#ffffff' : '#475569',
                transition: 'all 0.2s'
              }}
            >
              All Filings History ({filteredReports.length})
            </button>
          </div>

          {activeTab === 'history' && (
            <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
              <Download size={14} /> Export List
            </button>
          )}
        </div>

        {activeTab === 'today' 
          ? window.renderTable(todaysReports, "No reports submitted today.") 
          : window.renderTable(filteredReports, "No reports found in history.")
        }
      </div>

      {/* Detail Modal */}
      {showDetailModal && (() => {
        let entries = [];
        try {
          if (showDetailModal.summary && showDetailModal.summary.startsWith('[')) {
            entries = JSON.parse(showDetailModal.summary);
          }
        } catch (e) {}
        const isMultiClass = entries.length > 0;

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setShowDetailModal(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '24px', width: '95%', maxWidth: isMultiClass ? '750px' : '600px', maxHeight: '85vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Report Details</h3>
                <button onClick={() => setShowDetailModal(null)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px', borderRadius: '50%' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Meta Info Header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Submitted By</span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 750, color: '#0f172a' }}>{showDetailModal.teacherName || 'Unknown'}</span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '2px' }}>{showDetailModal.teacherDesignation || 'Teacher'} • {showDetailModal.teacherDepartment || 'Academic'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Report Info</span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '2px' }}>Date: {showDetailModal.reportDate}</span>
                  </div>
                  {showDetailModal.tasksCompleted && (
                    <div style={{ gridColumn: 'span 2', marginTop: '6px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Overall Remarks</span>
                      <span style={{ fontSize: '0.86rem', color: '#334155', fontStyle: 'italic' }}>{showDetailModal.tasksCompleted}</span>
                    </div>
                  )}
                </div>

                {/* Class Wise Details */}
                {isMultiClass ? (
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class-wise Work Logs</h4>
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
                                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#6366f1' }}>{entry.subject}</span>
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
                ) : (
                  /* Legacy Fallback List */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '14px' }}>
                    {[
                      { l: 'Title', v: showDetailModal.title },
                      { l: 'Summary', v: showDetailModal.summary },
                      { l: 'Tasks Completed', v: showDetailModal.tasksCompleted || '—' }
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '12px', borderBottom: i < 2 ? '1px dashed #f1f5f9' : 'none', paddingBottom: i < 2 ? '10px' : '0' }}>
                        <div style={{ width: '150px', flexShrink: 0, fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.l}</div>
                        <div style={{ fontSize: '0.86rem', color: '#0f172a', flex: 1, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{item.v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Modal */}
      {reportToDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setReportToDelete(null)}>
          <form onClick={e => e.stopPropagation()} onSubmit={handleDeleteSubmit} style={{ background: '#ffffff', borderRadius: '18px', width: '95%', maxWidth: '440px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>🗑️ Delete Work Report</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Are you sure you want to permanently delete this work report: <strong>"{reportToDelete.title}"</strong>?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setReportToDelete(null)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer', background: '#ef4444', color: '#ffffff' }}>Delete</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
