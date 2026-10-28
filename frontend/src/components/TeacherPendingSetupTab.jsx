import React, { useState, useEffect } from 'react';
import './TeacherPendingSetupTab.css';
import {
  Search,
  Trash2,
  CheckCircle,
  Clock,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  UserCheck,
  UserX,
  FileSpreadsheet
} from 'lucide-react';

export default function TeacherPendingSetupTab({ onCompleteSetup, onPendingCountChange, onCountChange, triggerRefresh, refreshKey }) {
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Undo Batch Info
  const [latestBatch, setLatestBatch] = useState(null);
  const [undoLoading, setUndoLoading] = useState(false);

  // Fetch Pending Teachers
  const fetchPendingTeachers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const url = `/api/teachers/import/pending?search=${encodeURIComponent(searchQuery)}&sortBy=${sortBy}&sortOrder=${sortOrder}&page=${page}&limit=${limit}`;
      const res = await fetch(url, {
        headers: {
          'x-tenant-id': tenantSubdomain,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setPendingTeachers(data.pendingTeachers || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
        if (typeof onPendingCountChange === 'function') {
          onPendingCountChange(data.totalCount || 0);
        }
        if (typeof onCountChange === 'function') {
          onCountChange(data.totalCount || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching pending teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Latest Batch Info for Undo Eligibility
  const fetchLatestBatchInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch('/api/teachers/import/latest-batch', {
        headers: {
          'x-tenant-id': tenantSubdomain,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.hasBatch) {
          setLatestBatch(data);
        } else {
          setLatestBatch(null);
        }
      }
    } catch (err) {
      console.error('Error fetching latest batch info:', err);
    }
  };

  useEffect(() => {
    fetchPendingTeachers();
    fetchLatestBatchInfo();
  }, [searchQuery, sortBy, sortOrder, page, triggerRefresh, refreshKey]);

  // Bulk Selection Toggle
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    const pageIds = pendingTeachers.map(t => t.id);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Delete Single Pending Teacher
  const handleDeletePending = async (id, teacherName) => {
    if (!window.confirm(`Are you sure you want to remove "${teacherName}" from the pending setup list?`)) return;

    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch(`/api/teachers/import/pending/${id}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': tenantSubdomain,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        fetchPendingTeachers();
        fetchLatestBatchInfo();
      } else {
        alert('Failed to delete pending teacher.');
      }
    } catch (err) {
      console.error('Error deleting pending teacher:', err);
    }
  };

  // Bulk Delete Pending Teachers
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} pending teachers from staging?`)) return;

    setBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch('/api/teachers/import/pending/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantSubdomain,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (res.ok) {
        setSelectedIds([]);
        fetchPendingTeachers();
        fetchLatestBatchInfo();
      } else {
        alert('Failed to bulk delete pending teachers.');
      }
    } catch (err) {
      console.error('Error in bulk delete:', err);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Undo Last Import Action
  const handleUndoLastImport = async () => {
    if (!latestBatch) return;
    const confirmMsg = `This will remove ${latestBatch.pendingCount} pending teachers from the last import (${latestBatch.fileName || 'Batch'}). Teachers already set up from this batch will NOT be removed. Are you sure?`;
    if (!window.confirm(confirmMsg)) return;

    setUndoLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch(`/api/teachers/import/undo/${latestBatch.batchId}`, {
        method: 'POST',
        headers: {
          'x-tenant-id': tenantSubdomain,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        setLatestBatch(null);
        setSelectedIds([]);
        fetchPendingTeachers();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to undo last import.');
      }
    } catch (err) {
      console.error('Error undoing import:', err);
    } finally {
      setUndoLoading(false);
    }
  };

  // Toggle sort direction
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="pending-setup-container animate-slide-up">
      {/* Control Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="pending-setup-header">
          {/* Search bar */}
          <div className="search-bar-container" style={{ width: '100%', maxWidth: '380px' }}>
            <Search size={18} className="search-bar-icon" />
            <input
              type="text"
              placeholder="Search pending teachers by name, ID, phone, subjects..."
              className="search-bar-input"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              style={{ width: '100%' }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="btn-secondary"
                style={{
                  padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444'
                }}
              >
                {bulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete Selected ({selectedIds.length})
              </button>
            )}

            {/* Undo Last Import Button */}
            {latestBatch && (
              <button
                type="button"
                onClick={handleUndoLastImport}
                disabled={undoLoading}
                className="btn-secondary"
                style={{
                  padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  borderColor: 'rgba(255, 140, 66, 0.4)', color: 'hsl(var(--color-primary))',
                  fontWeight: 600
                }}
                title={`Undo last import (${latestBatch.pendingCount} pending rows, ${latestBatch.hoursLeft}h left)`}
              >
                {undoLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                Undo Last Import ({latestBatch.pendingCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'hsl(var(--color-primary))' }} />
          <span>Loading pending imported teachers...</span>
        </div>
      ) : pendingTeachers.length === 0 ? (
        <div className="glass-panel pending-empty-state">
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'rgba(255, 140, 66, 0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-primary))'
          }}>
            <FileSpreadsheet size={28} />
          </div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
            No pending teachers. Import a list to get started.
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '440px' }}>
            When you import teachers from an Excel or CSV file, they appear here for you to complete their classroom assignments and credentials.
          </p>
        </div>
      ) : (
        <div className="pending-table-container">
          <table className="pending-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={pendingTeachers.length > 0 && pendingTeachers.every(t => selectedIds.includes(t.id))}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th onClick={() => handleSort('teacherId')} style={{ cursor: 'pointer' }}>
                  Teacher ID <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </th>
                <th onClick={() => handleSort('fullName')} style={{ cursor: 'pointer' }}>
                  Full Name <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </th>
                <th>Mobile Number</th>
                <th>Email Address</th>
                <th>Qualification</th>
                <th>Experience</th>
                <th>Subjects</th>
                <th>Designation</th>
                <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                  Imported On <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingTeachers.map(teacher => {
                const isSelected = selectedIds.includes(teacher.id);
                return (
                  <tr key={teacher.id} style={{ background: isSelected ? 'rgba(255, 140, 66, 0.04)' : undefined }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(teacher.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <span className="pending-reserved-badge">
                        {teacher.teacherId}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{teacher.fullName}</strong>
                      {teacher.gender && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                          {teacher.gender}{teacher.dob ? ` • DOB: ${teacher.dob}` : ''}
                        </span>
                      )}
                    </td>
                    <td>{teacher.mobile || 'N/A'}</td>
                    <td>{teacher.email || 'N/A'}</td>
                    <td>{teacher.qualification || 'N/A'}</td>
                    <td>{teacher.experience ? `${teacher.experience} yrs` : '0 yrs'}</td>
                    <td>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem',
                        background: 'rgba(255, 140, 66, 0.08)', color: 'hsl(var(--color-primary))',
                        fontWeight: 600
                      }}>
                        {teacher.subjects || 'N/A'}
                      </span>
                    </td>
                    <td>{teacher.designation || 'Teacher'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => onCompleteSetup(teacher)}
                          className="btn-complete-setup"
                          title="Complete registration for this teacher"
                        >
                          <UserCheck size={14} /> Complete Setup
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePending(teacher.id, teacher.fullName)}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: '6px', borderRadius: '6px'
                          }}
                          title="Remove from staging"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing Page {page} of {totalPages} ({totalCount} pending)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
