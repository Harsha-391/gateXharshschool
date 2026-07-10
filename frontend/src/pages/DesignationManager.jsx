import './DesignationManager.css';
import React, { useState, useEffect } from 'react';
import { hasPermission } from '../utils/permissions';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function DesignationManager({ showToast }) {
  const canView = hasPermission('designation-manager', 'view');
  const canCreate = hasPermission('designation-manager', 'create');
  const canEdit = hasPermission('designation-manager', 'edit');
  const canDelete = hasPermission('designation-manager', 'delete');

  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Form States
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Active');
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDesignations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/designations');
      if (res.ok) {
        const data = await res.json();
        setDesignations(data);
      } else {
        showToast('Failed to load designations.', 'danger');
      }
    } catch (err) {
      console.error('Error fetching designations:', err);
      showToast('Error connecting to the server.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId && !canEdit) {
      showToast('You do not have permission to edit designations.', 'danger');
      return;
    }
    if (!editingId && !canCreate) {
      showToast('You do not have permission to create designations.', 'danger');
      return;
    }
    if (!name.trim()) {
      showToast('Designation name is required.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId ? `/api/designations/${editingId}` : '/api/designations';
      const method = editingId ? 'PUT' : 'POST';
      const body = JSON.stringify({ name: name.trim(), status });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      const data = await res.json();

      if (res.ok) {
        showToast(
          editingId ? 'Designation updated successfully!' : 'Designation created successfully!',
          'success'
        );
        setName('');
        setStatus('Active');
        setEditingId(null);
        fetchDesignations();
      } else {
        showToast(data.error || 'Operation failed.', 'danger');
      }
    } catch (err) {
      console.error('Submit error:', err);
      showToast('An error occurred during submission.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (designation) => {
    setEditingId(designation.id);
    setName(designation.name);
    setStatus(designation.status || 'Active');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setStatus('Active');
  };

  const handleDelete = async (id, designationName) => {
    if (!canDelete) {
      showToast('You do not have permission to delete designations.', 'danger');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the designation "${designationName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/designations/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        showToast('Designation deleted successfully.', 'success');
        if (editingId === id) {
          handleCancelEdit();
        }
        fetchDesignations();
      } else {
        showToast(data.error || 'Failed to delete designation.', 'danger');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('An error occurred while deleting.', 'danger');
    }
  };

  const handleToggleStatus = async (designation) => {
    if (!canEdit) {
      showToast('You do not have permission to edit designations.', 'danger');
      return;
    }
    const newStatus = designation.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`/api/designations/${designation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        showToast(`Status updated to ${newStatus}.`, 'success');
        fetchDesignations();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to toggle status.', 'danger');
      }
    } catch (err) {
      console.error('Status toggle error:', err);
      showToast('An error occurred.', 'danger');
    }
  };

  // Filtered designations
  const filteredDesignations = designations.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredDesignations.length / itemsPerPage));
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDesignations.slice(indexOfFirstItem, indexOfLastItem);

  if (!canView) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-main)' }}>Access Denied</h3>
        <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
          You do not have permission to view the Designation Management module.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
          padding: '10px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Briefcase size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Designation Management</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Create and configure dynamic employee designations.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Form: Add / Edit Designation */}
        {canCreate || (editingId && canEdit) ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {editingId ? 'Edit Designation' : 'Add New Designation'}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Designation Name *</label>
                <input
                  type="text"
                  placeholder="e.g. IT Administrator"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-glass)',
                    background: 'var(--bg-card-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-glass)',
                    background: 'var(--bg-card-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : editingId ? (
                    'Update'
                  ) : (
                    <>
                      <Plus size={16} /> Create
                    </>
                  )}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Designation Form
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Select a designation from the table to edit (requires edit permissions), or contact your system administrator to grant creation rights.
            </p>
          </div>
        )}

        {/* Right Section: Designation Table */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Search Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-card-subtle)',
            border: '1.5px solid var(--border-glass)',
            borderRadius: '8px',
            padding: '8px 12px',
            gap: '8px'
          }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search designations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                width: '100%'
              }}
            />
            {searchQuery && (
              <X 
                size={16} 
                onClick={() => setSearchQuery('')} 
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }} 
              />
            )}
          </div>

          {/* Table container */}
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : currentItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                No designations found.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>Designation Name</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item) => (
                    <tr 
                      key={item.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                        background: editingId === item.id ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px 8px', fontWeight: 500, color: 'var(--text-main)' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={!canEdit}
                          title={canEdit ? "Click to toggle status" : ""}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: canEdit ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: 0
                          }}
                        >
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: item.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: item.status === 'Active' ? '#10b981' : '#ef4444'
                          }}>
                            {item.status || 'Active'}
                          </span>
                        </button>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(item)}
                              title="Edit Designation"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              <Edit3 size={16} />
                            </button>
                          )}
                          
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              title="Delete Designation"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination controls */}
          {!loading && filteredDesignations.length > itemsPerPage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <span>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredDesignations.length)} of {filteredDesignations.length} items
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-glass)',
                    color: page === 1 ? 'rgba(255,255,255,0.05)' : 'var(--text-main)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: page === 1 ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                
                <span style={{ fontWeight: 600 }}>{page} / {totalPages}</span>
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-glass)',
                    color: page === totalPages ? 'rgba(255,255,255,0.05)' : 'var(--text-main)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: page === totalPages ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
