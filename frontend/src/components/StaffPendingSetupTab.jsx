import React, { useState, useEffect } from 'react';
import './StaffPendingSetupTab.css';
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

export default function StaffPendingSetupTab({ onCompleteSetup, onPendingCountChange, onCountChange, refreshKey }) {
  const [pendingStaff, setPendingStaff] = useState([]);
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

  // Fetch Pending Staff
  const fetchPendingStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const url = `/api/staff/import/pending?search=${encodeURIComponent(searchQuery)}&sortBy=${sortBy}&sortOrder=${sortOrder}&page=${page}&limit=${limit}`;
      const res = await fetch(url, {
        headers: {
          'x-tenant-id': tenantSubdomain,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setPendingStaff(data.pendingStaff || []);
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
      console.error('Error fetching pending staff:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Latest Batch Info for Undo Eligibility
  const fetchLatestBatchInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch('/api/staff/import/latest-batch', {
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
    fetchPendingStaff();
    fetchLatestBatchInfo();
  }, [searchQuery, sortBy, sortOrder, page, refreshKey]);

  // Handle single deletion from staging
  const handleDeletePending = async (id, name) => {
    if (!window.confirm(`Are you sure you want to dismiss ${name || 'this staff member'} from pending setup?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch(`/api/staff/import/pending/${id}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': tenantSubdomain,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        setSelectedIds(prev => prev.filter(x => x !== id));
        fetchPendingStaff();
        fetchLatestBatchInfo();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to remove pending staff record.');
      }
    } catch (err) {
      console.error('Error deleting pending staff:', err);
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to dismiss ${selectedIds.length} selected staff member(s) from pending setup?`)) {
      return;
    }

    setBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch('/api/staff/import/pending/bulk-delete', {
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
        fetchPendingStaff();
        fetchLatestBatchInfo();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to bulk delete pending staff.');
      }
    } catch (err) {
      console.error('Error bulk deleting pending staff:', err);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (pendingStaff.every(s => selectedIds.includes(s.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingStaff.map(s => s.id));
    }
  };

  // Handle Undo Last Import
  const handleUndoRecentImport = async () => {
    if (!latestBatch || !latestBatch.batchId) return;
    const confirmMsg = `Undo import for file "${latestBatch.fileName || 'Staff import'}"?\nThis will remove ${latestBatch.pendingInBatch || 0} pending staff members. Staff already set up will NOT be removed.\n\nAre you sure you want to proceed?`;
    if (!window.confirm(confirmMsg)) return;

    setUndoLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch(`/api/staff/import/undo/${latestBatch.batchId}`, {
        method: 'POST',
        headers: {
          'x-tenant-id': tenantSubdomain,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        setLatestBatch(null);
        setSelectedIds([]);
        fetchPendingStaff();
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
              placeholder="Search pending staff by name, ID, phone, role..."
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
                onClick={handleUndoRecentImport}
                disabled={undoLoading}
                className="btn-secondary"
                style={{
                  padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  borderColor: '#f59e0b', color: '#b45309', fontWeight: 600
                }}
                title={`Undo last import (${latestBatch.pendingInBatch} pending staff rows remaining)`}
              >
                {undoLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                Undo Last Import ({latestBatch.pendingInBatch})
              </button>
            )}
          </div>
        </div>

        {/* Informational Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 140, 66, 0.05)',
          border: '1px solid var(--border-glass)', fontSize: '0.8rem', color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="hsl(var(--color-primary))" />
            <span>
              Showing <strong>{totalCount}</strong> imported staff member{totalCount === 1 ? '' : 's'} awaiting role assignment and setup.
            </span>
          </div>
          <span style={{ fontSize: '0.75rem' }}>
            Click <strong>Complete Setup</strong> on any row to assign role, review profile, and add to the main Staff Directory.
          </span>
        </div>
      </div>

      {/* Main Staging Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
          <Loader2 size={32} className="animate-spin" color="hsl(var(--color-primary))" />
        </div>
      ) : pendingStaff.length === 0 ? (
        <div className="glass-panel pending-empty-state">
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(255, 140, 66, 0.08)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-primary))'
          }}>
            <FileSpreadsheet size={32} />
          </div>
          <h4 style={{ margin: '0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            No Pending Staff Setup Records
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px' }}>
            {searchQuery
              ? `No pending staff match the search term "${searchQuery}".`
              : 'All imported staff members have completed setup or no bulk spreadsheet has been imported yet. Use the "Import Staff" button above to upload a spreadsheet.'}
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
                    checked={pendingStaff.length > 0 && pendingStaff.every(s => selectedIds.includes(s.id))}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th onClick={() => handleSort('staffId')} style={{ cursor: 'pointer' }}>
                  Staff ID <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </th>
                <th onClick={() => handleSort('fullName')} style={{ cursor: 'pointer' }}>
                  Full Name <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </th>
                <th>Mobile Number</th>
                <th>Email Address</th>
                <th>Department</th>
                <th>Designation / Role</th>
                <th>Qualification</th>
                <th>Experience</th>
                <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                  Imported On <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingStaff.map(staff => {
                const isSelected = selectedIds.includes(staff.id);
                return (
                  <tr key={staff.id} style={{ background: isSelected ? 'rgba(255, 140, 66, 0.04)' : undefined }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(staff.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <span className="pending-reserved-badge">
                        {staff.staffId || staff.staff_id}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{staff.fullName}</strong>
                      {staff.gender && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                          {staff.gender}{staff.dob ? ` • DOB: ${staff.dob}` : ''}
                        </span>
                      )}
                    </td>
                    <td>{staff.mobile || staff.phone || 'N/A'}</td>
                    <td>{staff.email || 'N/A'}</td>
                    <td>{staff.department || 'N/A'}</td>
                    <td>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem',
                        background: 'rgba(255, 140, 66, 0.08)', color: 'hsl(var(--color-primary))',
                        fontWeight: 600
                      }}>
                        {staff.designation || 'Staff'}
                      </span>
                    </td>
                    <td>{staff.qualification || 'N/A'}</td>
                    <td>{staff.experience ? `${staff.experience} yrs` : '0 yrs'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => onCompleteSetup(staff)}
                          className="btn-complete-setup"
                          title="Complete registration & assign role for this staff member"
                        >
                          <UserCheck size={14} /> Complete Setup
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePending(staff.id, staff.fullName)}
                          className="btn-secondary"
                          style={{
                            padding: '6px 10px', borderRadius: '8px', color: '#ef4444',
                            borderColor: 'rgba(239, 68, 68, 0.3)'
                          }}
                          title="Dismiss pending record"
                        >
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
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages} ({totalCount} total)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
