import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  X, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  BookOpen, 
  Calendar, 
  Award,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  FileText,
  Download,
  Info,
  Edit3,
  MapPin,
  Shield,
  Clock,
  Plus,
  UserCheck,
  UserPlus,
  Loader2
} from 'lucide-react';
import { hasPermission } from '../utils/permissions';

export default function TeacherList({ setActiveView, readOnly = true, onAddClick, onEditClick }) {
  const renderQualificationText = (q) => {
    if (!q) return 'N/A';
    if (Array.isArray(q)) {
      return q.map(item => item.degree).filter(Boolean).join(', ') || 'N/A';
    }
    return q;
  };

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Search, Filters & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);

  // Inspector Drawer
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetch('/api/rbac/roles')
      .then(res => res.json())
      .then(data => {
        setRoles(data.filter(r => r.active));
      })
      .catch(err => console.error('Error fetching roles:', err));

    fetch('/api/grades/departments')
      .then(res => res.json())
      .then(data => {
        setDepartments(data.filter(d => d.status === 'Active' || !d.status));
      })
      .catch(err => console.error('Error fetching departments:', err));
  }, []);

  const handleRegenerateQR = async (empId) => {
    try {
      setQrLoading(true);
      const res = await fetch('/api/employee-attendance/regenerate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, employeeType: 'Teacher' })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTeacher(prev => ({ ...prev, qrCodePath: data.qrPath }));
        setTeachers(prev => prev.map(t => (t.employeeId === empId || t.id === empId) ? { ...t, qrCodePath: data.qrPath } : t));
      } else {
        alert('Failed to regenerate QR code.');
      }
    } catch (err) {
      console.error('Error regenerating QR:', err);
    } finally {
      setQrLoading(false);
    }
  };

  const handlePrintQR = (teacher) => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    const qrUrl = window.location.origin + (teacher.qrCodePath || '');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print ID Badge - ${teacher.fullName || teacher.name}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              text-align: center;
              padding: 40px;
              color: #1e1b4b;
              background: #ffffff;
            }
            .badge-card {
              border: 2px solid #e2e8f0;
              border-radius: 20px;
              padding: 30px;
              display: inline-block;
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
              max-width: 350px;
            }
            .avatar {
              width: 100px;
              height: 100px;
              border-radius: 50%;
              object-fit: cover;
              margin-bottom: 15px;
              border: 3px solid #6366f1;
            }
            .avatar-placeholder {
              width: 100px;
              height: 100px;
              border-radius: 50%;
              margin: 0 auto 15px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 2rem;
              font-weight: bold;
              background: ${teacher.avatarBg || 'linear-gradient(135deg, #6366f1, #a855f7)'};
            }
            .name {
              font-size: 1.5rem;
              font-weight: 800;
              margin: 0 0 5px 0;
            }
            .id {
              font-size: 1rem;
              font-weight: 700;
              color: #6366f1;
              margin: 0 0 20px 0;
            }
            .qr-image {
              width: 200px;
              height: 200px;
              margin-bottom: 20px;
            }
            .footer {
              font-size: 0.8rem;
              color: #64748b;
              font-weight: 500;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="badge-card">
            ${teacher.photo ? `<img class="avatar" src="${teacher.photo}" />` : `
              <div class="avatar-placeholder">
                ${(teacher.fullName || teacher.name || 'T').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
            `}
            <div class="name">${teacher.fullName || teacher.name}</div>
            <div class="id">${teacher.employeeId || teacher.id}</div>
            <div><img class="qr-image" src="${qrUrl}" /></div>
            <div style="font-weight: 600; font-size: 0.9rem;">${teacher.designation || 'Faculty'}</div>
            <div style="font-size: 0.85rem; color: #475569; margin-top: 2px;">${teacher.department || 'Aether Academy'}</div>
            <div class="footer">Scan to record Attendance</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Edit Modal States
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // ==========================================
  // DATA FETCHING
  // ==========================================
  const fetchTeachers = async () => {
    const isSearchOrFilterActive = searchQuery !== '' || departmentFilter !== 'All' || typeFilter !== 'All' || statusFilter !== 'All' || roleFilter !== 'All';
    if (!isSearchOrFilterActive) {
      setTeachers([]);
      setTotalCount(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search: searchQuery,
        department: departmentFilter,
        employmentType: typeFilter,
        status: statusFilter,
        designation: roleFilter,
        sortBy,
        sortOrder,
        page,
        limit
      }).toString();
      
      const res = await fetch(`/api/teachers?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error loading teachers registry:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reload on dependency changes
  useEffect(() => {
    fetchTeachers();
  }, [searchQuery, departmentFilter, typeFilter, statusFilter, roleFilter, sortBy, sortOrder, page]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, departmentFilter, typeFilter, statusFilter, roleFilter]);

  // ==========================================
  // DELETE TEACHER
  // ==========================================
  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (window.confirm(`Are you sure you want to dismiss ${teacherName} (${teacherId}) from the faculty roster?`)) {
      try {
        const res = await fetch(`/api/teachers/${teacherId}`, { method: 'DELETE' });
        if (res.ok) {
          fetchTeachers();
          setSelectedTeacher(null);
        }
      } catch (err) {
        console.error('Error removing teacher record:', err);
      }
    }
  };

  // ==========================================
  // UPDATE TEACHER STATUS
  // ==========================================
  const handleStatusChange = async (teacherId, newStatus) => {
    try {
      const res = await fetch(`/api/teachers/${teacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTeachers();
        if (selectedTeacher && (selectedTeacher.employeeId === teacherId || selectedTeacher.id === teacherId)) {
          setSelectedTeacher(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error('Error updating teacher status:', err);
    }
  };

  // ==========================================
  // EDIT TEACHER
  // ==========================================
  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setEditFormData({
      fullName: teacher.fullName || teacher.name || '',
      mobile: teacher.mobile || teacher.phone || '',
      email: teacher.email || '',
      designation: teacher.designation || '',
      department: teacher.department || '',
      subjectSpecialization: teacher.subjectSpecialization || teacher.subject || '',
      qualification: Array.isArray(teacher.qualification) ? teacher.qualification.map(q => q.degree).filter(Boolean).join(', ') : (teacher.qualification || ''),
      experience: teacher.experience || '',
      salary: teacher.salary || '',
      employmentType: teacher.employmentType || '',
      status: teacher.status || 'Active'
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const teacherId = editingTeacher.employeeId || editingTeacher.id;
      const res = await fetch(`/api/teachers/${teacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        setEditingTeacher(null);
        fetchTeachers();
        setSelectedTeacher(null);
      }
    } catch (err) {
      console.error('Error updating teacher:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // ==========================================
  // STATUS BADGE RENDERER
  // ==========================================
  const getStatusBadge = (status) => {
    const styles = {
      'Active': { bg: 'rgba(var(--color-success-rgb), 0.12)', color: 'rgb(var(--color-success-rgb))', border: '1px solid rgba(var(--color-success-rgb), 0.25)' },
      'Inactive': { bg: 'rgba(var(--color-danger-rgb), 0.12)', color: 'rgb(var(--color-danger-rgb))', border: '1px solid rgba(var(--color-danger-rgb), 0.25)' },
      'On Leave': { bg: 'rgba(var(--color-warning-rgb), 0.12)', color: 'rgb(var(--color-warning-rgb))', border: '1px solid rgba(var(--color-warning-rgb), 0.25)' }
    };
    const s = styles[status] || styles['Active'];
    return (
      <span style={{
        padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem',
        fontWeight: 700, background: s.bg, color: s.color, border: s.border,
        display: 'inline-flex', alignItems: 'center', gap: '4px'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
        {status}
      </span>
    );
  };

  const isSearchOrFilterActive = searchQuery !== '' || departmentFilter !== 'All' || typeFilter !== 'All' || statusFilter !== 'All' || roleFilter !== 'All';

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* Search & Filter Control Bar */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Row 1: Search & Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div className="search-bar-container" style={{ width: '100%', maxWidth: '380px' }}>
            <Search size={18} className="search-bar-icon" />
            <input 
              type="text" 
              placeholder="Search staff, Employee ID, department..." 
              className="search-bar-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} /> Filters:
            </span>
            
            {/* Role filter */}
            <select className="select-custom" value={roleFilter} onChange={(e) => {
              const selectedRole = e.target.value;
              setRoleFilter(selectedRole);
              if (selectedRole !== 'Teacher') {
                setDepartmentFilter('All');
              }
            }}
              style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
              <option value="All">All Roles</option>
              {roles.map(r => (
                <option key={r.id || r.name} value={r.name}>{r.name}</option>
              ))}
            </select>

            {/* Department filter (Only shown when Role is 'Teacher') */}
            {roleFilter === 'Teacher' && (
              <select className="select-custom" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <option value="All">All Departments</option>
                {departments.map(d => (
                  <option key={d.id || d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            )}

            {/* Employment Type filter */}
            <select className="select-custom" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
              <option value="All">All Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Contract">Contract</option>
            </select>

            {/* Status filter */}
            <select className="select-custom" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>

        {/* Row 2: Sort controls */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sort By:</span>
            
            <select className="select-custom" value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
              <option value="name">Staff Name</option>
              <option value="employeeId">Employee ID</option>
              <option value="department">Department</option>
              <option value="joiningDate">Joining Date</option>
              <option value="experience">Experience</option>
            </select>

            <button onClick={toggleSortOrder} className="btn-secondary"
              style={{ padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
              <ArrowUpDown size={14} /> {sortOrder.toUpperCase()}
            </button>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Total Faculty: <strong style={{ color: 'var(--text-main)' }}>{totalCount}</strong>
          </span>
        </div>
      </div>

      {/* ==========================================
          TEACHER ROSTER TABLE
          ========================================== */}
      <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
        
        {!isSearchOrFilterActive ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '100px 24px',
            textAlign: 'center',
            gap: '12px'
          }}>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              opacity: 0.5,
              filter: 'blur(0.8px)',
              letterSpacing: '0.05em'
            }}>
              Please search or select a filter to view faculty records
            </span>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Loading staff directory...
          </div>
        ) : (
          <>
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Employee ID</th>
                    <th>Staff Name</th>
                    <th>Department</th>
                    <th>Subject</th>
                    <th>Mobile</th>
                    <th>Qualification</th>
                    <th>Experience</th>
                    <th>Joining Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.length > 0 ? (
                    teachers.map((t) => (
                      <tr key={t.employeeId || t.id}>
                        <td>
                          {t.photo ? (
                            <img src={t.photo} alt={t.name || t.fullName} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-glass)' }} />
                          ) : (
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: t.avatarBg || 'linear-gradient(135deg, hsl(210, 75%, 60%), hsl(240, 85%, 50%))',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: '0.75rem', fontWeight: 700
                            }}>
                              {(t.fullName || t.name || 'T').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, color: 'hsl(var(--color-primary))' }}>{t.employeeId || t.id}</td>
                        <td style={{ fontWeight: 600 }}>{t.fullName || t.name}</td>
                        <td style={{ fontWeight: 500 }}>{t.department || 'N/A'}</td>
                        <td style={{ fontWeight: 500 }}>{t.subjectSpecialization || t.subject || 'N/A'}</td>
                        <td style={{ fontWeight: 500 }}>{t.mobile || t.phone || 'N/A'}</td>
                        <td style={{ fontWeight: 500, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{renderQualificationText(t.qualification)}</td>
                        <td style={{ fontWeight: 500 }}>{t.experience ? `${t.experience}` : 'N/A'}</td>
                        <td style={{ fontWeight: 500 }}>{t.joiningDate || 'N/A'}</td>
                        <td>
                          {getStatusBadge(t.status || 'Active')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedTeacher(t)} className="btn-secondary" 
                              style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Info size={12} /> View
                            </button>
                            {!readOnly && (
                              <>
                                {hasPermission('teacher-directory', 'edit') && (
                                  <button onClick={() => onEditClick ? onEditClick(t) : openEditModal(t)} className="btn-secondary" 
                                    style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Edit3 size={12} /> Edit
                                  </button>
                                )}
                                {hasPermission('teacher-directory', 'delete') && (
                                  <button onClick={() => handleDeleteTeacher(t.employeeId || t.id, t.fullName || t.name)} className="btn-danger"
                                    style={{ padding: '6px 8px', borderRadius: '8px', background: 'rgba(var(--color-danger-rgb), 0.1)', border: '1px solid rgba(var(--color-danger-rgb), 0.2)', color: 'rgb(var(--color-danger-rgb))' }}
                                    title="Delete profile">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                        No staff found matching your filters. Click "Add Staff" in the sidebar to register new staff.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Showing Page <strong style={{ color: 'var(--text-main)' }}>{page}</strong> of <strong style={{ color: 'var(--text-main)' }}>{totalPages}</strong>
                </span>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={page === 1} onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    className="btn-secondary" style={{ padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button disabled={page === totalPages} onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    className="btn-secondary" style={{ padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ==========================================
          INSPECT TEACHER PROFILE DRAWER
          ========================================== */}
      {selectedTeacher && createPortal(
        <div onClick={() => setSelectedTeacher(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', isolation: 'isolate', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} className="glass-panel animate-scale-up"
            style={{
              width: '100%', maxWidth: '600px', maxHeight: '75vh',
              background: 'var(--bg-elevated)', padding: '30px', display: 'flex', flexDirection: 'column',
              gap: '20px', overflowY: 'auto', borderRadius: '16px', minHeight: 0
            }}>
            
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Staff Profile Inspector</h3>
              <button onClick={() => setSelectedTeacher(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
              {selectedTeacher.photo ? (
                <img src={selectedTeacher.photo} alt={selectedTeacher.fullName || selectedTeacher.name}
                  style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid hsl(var(--color-primary))', boxShadow: 'var(--shadow-md)' }} />
              ) : (
                <div style={{
                  width: '90px', height: '90px', borderRadius: '50%',
                  background: selectedTeacher.avatarBg || 'linear-gradient(135deg, hsl(210, 75%, 60%), hsl(240, 85%, 50%))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '2rem', fontWeight: 800,
                  border: '3px solid hsl(var(--color-primary))'
                }}>
                  {(selectedTeacher.fullName || selectedTeacher.name || 'T').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0' }}>{selectedTeacher.fullName || selectedTeacher.name}</h4>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {getStatusBadge(selectedTeacher.status || 'Active')}
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(hsl(var(--color-primary)), 0.1)', color: 'hsl(var(--color-primary))', border: '1px solid rgba(hsl(var(--color-primary)), 0.2)' }}>
                    {selectedTeacher.employmentType || 'Full Time'}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Employee ID', value: selectedTeacher.employeeId || selectedTeacher.id },
                { label: 'Department', value: selectedTeacher.department || 'N/A' },
                { label: 'Role', value: selectedTeacher.designation || 'N/A' },
                { label: 'Primary Subject', value: selectedTeacher.primarySubject || selectedTeacher.subjectSpecialization || selectedTeacher.subject || 'N/A' },
                { label: 'Secondary Subject', value: selectedTeacher.secondarySubject || 'N/A' },
                { label: 'Total Experience', value: selectedTeacher.experience ? `${selectedTeacher.experience}` : 'N/A' },
                { label: 'Joining Date', value: selectedTeacher.joiningDate || 'N/A' },
                { label: 'Email', value: selectedTeacher.email || 'N/A' },
                { label: 'Mobile', value: selectedTeacher.mobile || selectedTeacher.phone || 'N/A' },
                { label: 'Alternate Mobile', value: selectedTeacher.alternateMobile || 'N/A' },
                { label: 'Emergency Contact', value: selectedTeacher.emergencyContactNumber || selectedTeacher.emergencyPhone || 'N/A' },
                { label: 'Gender / DOB', value: `${selectedTeacher.gender || 'N/A'} / ${selectedTeacher.dob || 'N/A'}` },
                { label: 'Blood Group', value: selectedTeacher.bloodGroup || 'N/A' },
                { label: 'Marital Status', value: selectedTeacher.maritalStatus || 'N/A' },
                { label: 'Nationality', value: selectedTeacher.nationality || 'N/A' },
                { label: 'Aadhaar / PAN ID', value: `${selectedTeacher.aadhaarNumber || 'N/A'} / ${selectedTeacher.panNumber || 'N/A'}` }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.label}</span>
                  <strong style={{ fontSize: '0.85rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</strong>
                </div>
              ))}

              {/* Address Details */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Address Information</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                  <div><strong>Permanent Address:</strong> {selectedTeacher.permanentAddress || selectedTeacher.address || 'N/A'} {selectedTeacher.permanentCity || selectedTeacher.city ? `, ${selectedTeacher.permanentCity || selectedTeacher.city}` : ''} {selectedTeacher.permanentState || selectedTeacher.state ? `, ${selectedTeacher.permanentState || selectedTeacher.state}` : ''} {selectedTeacher.permanentPostalCode || selectedTeacher.pincode ? `- ${selectedTeacher.permanentPostalCode || selectedTeacher.pincode}` : ''}</div>
                  <div><strong>Current Address:</strong> {selectedTeacher.sameAsPermanent ? 'Same as Permanent Address' : `${selectedTeacher.currentAddress || 'N/A'} ${selectedTeacher.currentCity ? `, ${selectedTeacher.currentCity}` : ''} ${selectedTeacher.currentState ? `, ${selectedTeacher.currentState}` : ''} ${selectedTeacher.currentPostalCode ? `- ${selectedTeacher.currentPostalCode}` : ''}`}</div>
                </div>
              </div>

              {/* Qualifications Details */}
              {Array.isArray(selectedTeacher.qualification) && selectedTeacher.qualification.filter(q => q.degree).length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Academic Qualifications</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedTeacher.qualification.filter(q => q.degree).map((q, idx) => (
                      <div key={idx} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: 700, color: 'hsl(var(--color-primary))' }}>{q.degree}</div>
                        <div><strong>Institution:</strong> {q.institution || 'N/A'} ({q.board || 'N/A'})</div>
                        <div><strong>Year / Score:</strong> {q.year || 'N/A'} — {q.percentage || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience Details */}
              {Array.isArray(selectedTeacher.experiences) && selectedTeacher.experiences.filter(e => e.schoolName).length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Previous School History</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedTeacher.experiences.filter(e => e.schoolName).map((exp, idx) => (
                      <div key={idx} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: 700, color: 'hsl(var(--color-secondary))' }}>{exp.schoolName}</div>
                        <div><strong>Role:</strong> {exp.designation || 'N/A'}</div>
                        <div><strong>Duration:</strong> {exp.duration || 'N/A'}</div>
                        <div><strong>Reason for Leaving:</strong> {exp.reason || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Verified Documents */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Uploaded Documents</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Aadhaar Card', field: 'aadhaarFile', icon: 'hsl(var(--color-primary))' },
                  { label: 'PAN Card', field: 'panFile', icon: 'rgb(var(--color-warning-rgb))' },
                  { label: 'Resume / CV', field: 'resumeFile', icon: 'hsl(var(--color-secondary))' },
                  { label: 'Qualification Certificate', field: 'qualificationFile', icon: 'hsl(var(--color-info))' },
                  { label: 'Experience Certificate', field: 'experienceFile', icon: '#10b981' },
                  { label: 'Joining Letter', field: 'joiningLetterFile', icon: '#8b5cf6' },
                  { label: 'Other Document', field: 'otherFile', icon: '#6b7280' },
                ].map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <FileText size={14} style={{ color: doc.icon }} /> {doc.label}
                    </span>
                    {selectedTeacher[doc.field] ? (
                      <a href={selectedTeacher[doc.field]} target="_blank" rel="noreferrer" className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.7rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                        <Download size={10} /> Download
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Not Uploaded</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code Section */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Employee QR Code</span>
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ background: '#ffffff', padding: '8px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', width: '120px', height: '120px', flexShrink: 0 }}>
                  {selectedTeacher.qrCodePath ? (
                    <img src={selectedTeacher.qrCodePath} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', fontWeight: 600 }}>No QR Code Generated</div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '180px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>ID Badge Access QR</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Contains unique Employee ID & Type. Use the camera scanner in the Attendance Manager to record daily check-ins and check-outs.
                    <br/><br/>
                    <strong>Dynamic Department Update:</strong>
                    <ul>
                      <li>Department options now fetch dynamically from the system registry.</li>
                      <li>Ensures alignment with active Grade Management settings.</li>
                    </ul>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {selectedTeacher.qrCodePath ? (
                      <>
                        <a href={selectedTeacher.qrCodePath} download={`QR_${selectedTeacher.employeeId || selectedTeacher.id}.${selectedTeacher.qrCodePath.split('.').pop() || 'png'}`} className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Download size={12} /> Download
                        </a>
                        <button onClick={() => handlePrintQR(selectedTeacher)} className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Print Badge
                        </button>
                      </>
                    ) : null}
                    <button onClick={() => handleRegenerateQR(selectedTeacher.employeeId || selectedTeacher.id)} className="btn-secondary" disabled={qrLoading}
                      style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'rgba(hsl(var(--color-primary)), 0.2)', color: 'hsl(var(--color-primary))' }}>
                      {qrLoading ? 'Generating...' : selectedTeacher.qrCodePath ? 'Regenerate' : 'Generate QR Code'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>, document.body)}

      {/* ==========================================
          EDIT TEACHER MODAL
          ========================================== */}
      {editingTeacher && (
        <div onClick={() => setEditingTeacher(null)}
          className="modal-overlay">
          <div onClick={(e) => e.stopPropagation()} className="glass-panel animate-scale-up"
            style={{
              width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto',
              padding: '30px', borderRadius: '20px', background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Edit Staff Profile
              </h3>
              <button onClick={() => setEditingTeacher(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={editFormData.fullName || ''} onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="form-control" style={{ padding: '10px 14px', borderRadius: '10px' }} />
                </div>

                <div className="form-group">
                  <label>Mobile</label>
                  <input type="text" value={editFormData.mobile || ''} onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                    className="form-control" style={{ padding: '10px 14px', borderRadius: '10px' }} />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={editFormData.email || ''} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="form-control" style={{ padding: '10px 14px', borderRadius: '10px' }} />
                </div>

                 <div className="form-group">
                  <label>Role</label>
                  <select 
                    value={editFormData.designation || ''} 
                    onChange={(e) => {
                      const newDesignation = e.target.value;
                      setEditFormData({ 
                        ...editFormData, 
                        designation: newDesignation,
                        department: newDesignation === 'Teacher' ? editFormData.department : '',
                        subjectSpecialization: newDesignation === 'Teacher' ? editFormData.subjectSpecialization : ''
                      });
                    }}
                    className="form-control" 
                    style={{ padding: '10px 14px', borderRadius: '10px' }}
                  >
                    <option value="">Select Role</option>
                    {roles.map(r => (
                      <option key={r.id || r.name} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {editFormData.designation === 'Teacher' && (
                  <>
                    <div className="form-group animate-slide-down">
                      <label>Department</label>
                      <select value={editFormData.department || ''} onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                        className="form-control" style={{ padding: '10px 14px', borderRadius: '10px' }}>
                        <option value="">Select</option>
                        {departments.map(d => (
                          <option key={d.id || d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group animate-slide-down">
                      <label>Subject</label>
                      <input type="text" value={editFormData.subjectSpecialization || ''} onChange={(e) => setEditFormData({ ...editFormData, subjectSpecialization: e.target.value })}
                        className="form-control" style={{ padding: '10px 14px', borderRadius: '10px' }} />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Qualification</label>
                  <input type="text" value={editFormData.qualification || ''} onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })}
                    className="form-control" style={{ padding: '10px 14px', borderRadius: '10px' }} />
                </div>

                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input type="number" value={editFormData.experience || ''} onChange={(e) => setEditFormData({ ...editFormData, experience: e.target.value })}
                    className="form-control" style={{ padding: '10px 14px', borderRadius: '10px' }} min="0" />
                </div>

                <div className="form-group">
                  <label>Salary (₹/Month)</label>
                  <input type="number" value={editFormData.salary || ''} onChange={(e) => setEditFormData({ ...editFormData, salary: e.target.value })}
                    className="form-control" style={{ padding: '10px 14px', borderRadius: '10px' }} min="0" />
                </div>

                <div className="form-group">
                  <label>Employment Type</label>
                  <select value={editFormData.employmentType || ''} onChange={(e) => setEditFormData({ ...editFormData, employmentType: e.target.value })}
                    className="form-control" style={{ padding: '10px 14px', borderRadius: '10px' }}>
                    <option value="">Select</option>
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select value={editFormData.status || ''} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="form-control" style={{ padding: '10px 14px', borderRadius: '10px' }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingTeacher(null)} className="btn-secondary"
                  style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={editLoading}
                  style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {editLoading ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
