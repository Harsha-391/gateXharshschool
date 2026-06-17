import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FolderPlus,
  ArrowRight
} from 'lucide-react';
import { fetchActiveGrades, fetchActiveSections } from '../utils/grades';

export default function StudentManager({ showToast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  
  // Dropdown filter states
  const [sessionFilter, setSessionFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [gradeOptions, setGradeOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [allocations, setAllocations] = useState({});

  const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

  useEffect(() => {
    const loadGradesAndSections = async () => {
      const [activeGrades, activeSections] = await Promise.all([
        fetchActiveGrades(),
        fetchActiveSections()
      ]);
      if (activeGrades && activeGrades.length > 0) {
        setGradeOptions(activeGrades.map(g => g.name));
      } else {
        setGradeOptions([]);
      }
      if (activeSections && activeSections.length > 0) {
        setSectionOptions(activeSections.map(s => s.name));
      } else {
        setSectionOptions([]);
      }
    };
    loadGradesAndSections();
  }, []);

  const fetchStudents = async () => {
    if (!classFilter && !searchQuery) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        search: searchQuery,
        academicYear: sessionFilter,
        limit: 1000
      }).toString();
      
      const res = await fetch(`/api/students?${queryParams}`, {
        headers: { 'x-tenant-id': tenantSubdomain }
      });
      if (res.ok) {
        const data = await res.json();
        const fetchedStudents = data.students || [];
        setStudents(fetchedStudents);
        
        // Initialize dropdown states for allocations
        const initialAllocations = {};
        fetchedStudents.forEach(s => {
          initialAllocations[s.id] = {
            studentClass: s.studentClass || classFilter || (gradeOptions[0] || ''),
            section: s.section || '',
            rollNumber: s.rollNumber || s.roll || ''
          };
        });
        setAllocations(initialAllocations);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch whenever filter dropdowns or search query change
  useEffect(() => {
    fetchStudents();
  }, [sessionFilter, classFilter, statusFilter, searchQuery]);

  const handleAllocationChange = (studentId, field, value) => {
    setAllocations(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleActivateStudent = async (studentId) => {
    const allocation = allocations[studentId];
    if (!allocation || !allocation.section) {
      alert('Please allocate a section first.');
      return;
    }

    setUpdatingId(studentId);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantSubdomain
        },
        body: JSON.stringify({
          studentClass: allocation.studentClass,
          section: allocation.section,
          rollNumber: allocation.rollNumber || '',
          status: 'Active'
        })
      });

      if (res.ok) {
        if (showToast) {
          showToast('Student successfully activated and section allocated!', 'success');
        } else {
          alert('Student successfully activated!');
        }
        
        if (statusFilter === 'Pending') {
          // Remove from list if we are viewing pending registrations only
          setStudents(prev => prev.filter(s => s.id !== studentId));
        } else {
          // Update details locally if we are viewing all/active students
          setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'Active', studentClass: allocation.studentClass, section: allocation.section, rollNumber: allocation.rollNumber, roll: allocation.rollNumber } : s));
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update student section.');
      }
    } catch (err) {
      console.error('Error activating student:', err);
      alert('API connection error while updating student.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter local state based on search bar and class selection
  const filteredStudents = students.filter(s => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      (s.name || '').toLowerCase().includes(query) ||
      (s.admissionNumber || '').toLowerCase().includes(query) ||
      (s.id || '').toLowerCase().includes(query)
    );
    if (!matchesSearch) return false;

    // If there is a search query, bypass the grade/class filter to show the search results globally
    if (searchQuery) return true;

    // Show student if they already belong to the selected class/grade, OR if they are newly added (Pending/No grade/class assigned)
    const matchesClass = s.studentClass === classFilter || 
                         (s.grade && s.grade.split('-')[0] === classFilter) ||
                         (!s.studentClass && !s.grade);

    return matchesClass;
  });

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderPlus size={20} style={{ color: 'hsl(var(--color-primary))' }} /> Student Section Manager
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Allocate grades and sections (A to E) to register students. Pending students will only appear in attendance, results, and directory listings after activation.
          </p>
        </div>
        
        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search students by name / ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px', borderRadius: '10px', height: '40px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Dynamic Dropdown Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>1. Session / Academic Year</label>
          <select
            className="form-control"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            style={{ width: '160px', height: '38px', borderRadius: '8px', fontSize: '0.82rem', padding: '0 8px', cursor: 'pointer' }}
          >
            <option value="All">All Sessions</option>
            {Array.from({ length: 2030 - 2026 + 1 }, (_, i) => {
              const s = 2026 + i;
              return `${s}-${s + 1}`;
            }).map(sy => (
              <option key={sy} value={sy}>{sy}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>2. Class / Grade</label>
          <select
            className="form-control"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{ width: '160px', height: '38px', borderRadius: '8px', fontSize: '0.82rem', padding: '0 8px', cursor: 'pointer' }}
          >
            <option value="">Select Grade</option>
            {gradeOptions.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>3. Status</label>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '140px', height: '38px', borderRadius: '8px', fontSize: '0.82rem', padding: '0 8px', cursor: 'pointer' }}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Roster Area */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'hsl(var(--color-primary))' }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Retrieving student entries...</span>
        </div>
      ) : (!classFilter && !searchQuery) ? (
        <div className="glass-panel" style={{ padding: '48px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-glass)', textAlign: 'center' }}>
          <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.08)', color: 'hsl(var(--color-primary))', marginBottom: '16px' }}>
            <Users size={32} />
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Please Select a Grade / Class</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '380px', marginTop: '6px' }}>
            Select a specific grade from the dropdown filter, or search globally by name or ID to manage and allocate students.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-glass)', textAlign: 'center' }}>
          <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(var(--color-success-rgb), 0.08)', color: 'rgb(var(--color-success-rgb))', marginBottom: '16px' }}>
            <CheckCircle size={32} />
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>No Students Found</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '380px', marginTop: '6px' }}>
            {searchQuery 
              ? 'No students match your active filters and search query.' 
              : `No registrations found matching Academic Year "${sessionFilter}", Class "${classFilter}", and Status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Admission Info</th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Student Details</th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Family & Contact</th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Class / Grade</th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Assign Roll No.</th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Allocate Section</th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => {
                const allocation = allocations[student.id] || { studentClass: student.studentClass || (gradeOptions[0] || 'LKG'), section: student.section || '', rollNumber: student.rollNumber || student.roll || '' };
                const isUpdating = updatingId === student.id;

                return (
                  <tr 
                    key={student.id} 
                    style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s ease' }}
                    className="hover-row"
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'hsl(var(--color-primary))' }}>{student.admissionNumber || 'ADM-NEW'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{student.admissionDate || 'Today'}</div>
                    </td>
                    
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {student.photo ? (
                          <img 
                            src={student.photo} 
                            alt={student.name} 
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            background: student.photoBg || 'rgba(99,102,241,0.1)', 
                            color: '#ffffff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 700, 
                            fontSize: '0.8rem' 
                          }}>
                            {student.name ? student.name.charAt(0) : 'S'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{student.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{student.gender || 'Not specified'}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: student.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: student.status === 'Active' ? '#10b981' : '#f59e0b'
                      }}>
                        {student.status === 'Active' ? 'Active' : 'Pending'}
                      </span>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{student.fatherName || student.guardian || 'Parent Details'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{student.phone || 'No Mobile'}</div>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {student.studentClass || classFilter || (gradeOptions[0] || '')}
                      </span>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Roll No"
                        value={allocation.rollNumber || ''}
                        onChange={(e) => handleAllocationChange(student.id, 'rollNumber', e.target.value)}
                        style={{ width: '100px', height: '38px', borderRadius: '8px', fontSize: '0.82rem', padding: '0 8px' }}
                        disabled={isUpdating}
                      />
                    </td>

                    <td style={{ padding: '16px' }}>
                      <select
                        className="form-control"
                        value={allocation.section}
                        onChange={(e) => handleAllocationChange(student.id, 'section', e.target.value)}
                        style={{ width: '100px', height: '38px', borderRadius: '8px', fontSize: '0.82rem', padding: '0 8px', cursor: 'pointer' }}
                        disabled={isUpdating}
                      >
                        <option value="">-</option>
                        {sectionOptions.map(sec => (
                          <option key={sec} value={sec}>Section {sec}</option>
                        ))}
                      </select>
                    </td>

                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleActivateStudent(student.id)}
                        disabled={isUpdating}
                        className="btn-custom btn-primary"
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '8px 16px', 
                          borderRadius: '8px', 
                          fontSize: '0.8rem', 
                          fontWeight: 600, 
                          border: 'none', 
                          cursor: 'pointer',
                          boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)',
                          transition: 'all 0.2s ease',
                          background: student.status === 'Active' ? 'rgba(255,255,255,0.06)' : 'hsl(var(--color-primary))',
                          color: student.status === 'Active' ? 'var(--text-main)' : '#ffffff'
                        }}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> ...
                          </>
                        ) : (
                          <>
                            {student.status === 'Active' ? 'Re-allocate' : 'Activate'} <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
