import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Mail, 
  Phone, 
  Clock, 
  Award, 
  BookOpen, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  
  // Drawer & Modal States
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    department: 'Science',
    email: '',
    phone: '',
    status: 'Active',
    classes: '',
    hours: '',
    badge: 'Faculty'
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      }
    } catch (err) {
      console.error('Error fetching teachers list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required.';
    if (!formData.subject.trim()) errors.subject = 'Subject specialty is required.';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email syntax.';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required.';
    if (!formData.classes.trim()) errors.classes = 'Assigned classes count is required.';
    if (!formData.hours.trim()) errors.hours = 'Weekly teaching hours is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newTeacher = await res.json();
        setTeachers([newTeacher, ...teachers]);
        setShowAddModal(false);
        // Reset Form
        setFormData({
          name: '',
          subject: '',
          department: 'Science',
          email: '',
          phone: '',
          status: 'Active',
          classes: '',
          hours: '',
          badge: 'Faculty'
        });
        setFormErrors({});
      }
    } catch (err) {
      console.error('Error adding teacher:', err);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Are you sure you want to dismiss this faculty member from the roster?')) {
      try {
        const res = await fetch(`/api/teachers/${teacherId}`, { method: 'DELETE' });
        if (res.ok) {
          setTeachers(teachers.filter(t => t.id !== teacherId));
        }
      } catch (err) {
        console.error('Error removing teacher:', err);
      }
    }
  };

  const filteredTeachers = teachers.filter(tch => {
    const matchesSearch = tch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tch.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || tch.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Action and Search Header */}
      <div className="glass-panel directory-actions" style={{ padding: '16px 24px' }}>
        <div className="search-bar-container" style={{ width: '100%', maxWidth: '360px' }}>
          <Search size={18} className="search-bar-icon" />
          <input 
            type="text" 
            placeholder="Search by staff name or specialized subject..." 
            className="search-bar-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div className="filter-group">
          <select 
            className="select-custom"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="All">All Departments</option>
            <option value="Science">Science Department</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Languages">Languages</option>
            <option value="Social Sciences">Social Sciences</option>
          </select>

          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn-primary"
          >
            <Plus size={18} /> Contract Faculty
          </button>
        </div>
      </div>

      {/* Table containing teacher roster */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Staff Name</th>
                <th>Subject Specialty</th>
                <th>Department</th>
                <th>Classes</th>
                <th>Weekly Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((tch) => (
                  <tr key={tch.id}>
                    <td style={{ fontWeight: 600 }}>{tch.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: tch.avatarBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}>
                          {tch.name.split('. ').pop().split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{tch.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} className="badge badge-info">{tch.badge}</span>
                        </div>
                      </div>
                    </td>
                    <td>{tch.subject}</td>
                    <td>{tch.department}</td>
                    <td>{tch.classes}</td>
                    <td style={{ fontWeight: 600 }}>{tch.hours}h</td>
                    <td>
                      <span className={`badge ${tch.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {tch.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setSelectedConsultation(tch)}
                          className="btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Clock size={12} /> Schedule
                        </button>
                        <button 
                          onClick={() => handleDeleteTeacher(tch.id)}
                          className="btn-secondary" 
                          style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px', borderColor: 'rgb(var(--color-danger-rgb))', color: 'rgb(var(--color-danger-rgb))' }}
                          title="Dismiss Faculty"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No teachers found in the roster.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Faculty Modal */}
      {showAddModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem' }}>Contract New Faculty Member</h2>
              <button onClick={() => setShowAddModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="form-group">
                  <label>Faculty Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="form-control"
                    placeholder="e.g. Dr. Clara Oswald"
                  />
                  {formErrors.name && <span style={{ color: 'rgb(var(--color-danger-rgb))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><AlertCircle size={12}/>{formErrors.name}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Department</label>
                    <select 
                      name="department" 
                      value={formData.department} 
                      onChange={handleInputChange} 
                      className="form-control"
                    >
                      <option value="Science">Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Languages">Languages</option>
                      <option value="Social Sciences">Social Sciences</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Contract Designation Badge</label>
                    <select 
                      name="badge" 
                      value={formData.badge} 
                      onChange={handleInputChange} 
                      className="form-control"
                    >
                      <option value="Faculty">Faculty</option>
                      <option value="HOD">HOD (Department Head)</option>
                      <option value="Advisor">Cohort Advisor</option>
                      <option value="Co-ordinator">Co-ordinator</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Subject Specialization</label>
                  <input 
                    type="text" 
                    name="subject" 
                    value={formData.subject} 
                    onChange={handleInputChange} 
                    className="form-control"
                    placeholder="e.g. Organic Chemistry"
                  />
                  {formErrors.subject && <span style={{ color: 'rgb(var(--color-danger-rgb))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><AlertCircle size={12}/>{formErrors.subject}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="text" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      className="form-control"
                      placeholder="faculty@aether.edu"
                    />
                    {formErrors.email && <span style={{ color: 'rgb(var(--color-danger-rgb))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><AlertCircle size={12}/>{formErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label>Contact Phone</label>
                    <input 
                      type="text" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); setFormData(p => ({ ...p, phone: v })); }}
                      className="form-control"
                      placeholder="10-digit phone number"
                    />
                    {formErrors.phone && <span style={{ color: 'rgb(var(--color-danger-rgb))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><AlertCircle size={12}/>{formErrors.phone}</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Assigned Classes Count</label>
                    <input 
                      type="number" 
                      name="classes" 
                      value={formData.classes} 
                      onChange={handleInputChange} 
                      className="form-control"
                      placeholder="e.g. 5"
                    />
                    {formErrors.classes && <span style={{ color: 'rgb(var(--color-danger-rgb))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><AlertCircle size={12}/>{formErrors.classes}</span>}
                  </div>

                  <div className="form-group">
                    <label>Weekly Hours</label>
                    <input 
                      type="number" 
                      name="hours" 
                      value={formData.hours} 
                      onChange={handleInputChange} 
                      className="form-control"
                      placeholder="e.g. 20"
                    />
                    {formErrors.hours && <span style={{ color: 'rgb(var(--color-danger-rgb))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><AlertCircle size={12}/>{formErrors.hours}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Contract Status</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 400, cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="status" 
                        value="Active" 
                        checked={formData.status === 'Active'} 
                        onChange={handleInputChange} 
                      /> Active
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 400, cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="status" 
                        value="On Leave" 
                        checked={formData.status === 'On Leave'} 
                        onChange={handleInputChange} 
                      /> On Leave
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Contract
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Consultation Scheduling Drawer overlay */}
      {selectedConsultation && (
        <div className="drawer-overlay" onClick={() => setSelectedConsultation(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={22} style={{ color: 'hsl(var(--color-primary))' }} /> Faculty Consultation Scheduler
              </h2>
              <button onClick={() => setSelectedConsultation(null)} className="modal-close">
                <X size={22} />
              </button>
            </div>

            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Header profile info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
                <div className="teacher-avatar-large" style={{ width: '60px', height: '60px', fontSize: '1.25rem', margin: 0, background: selectedConsultation.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, borderRadius: '50%' }}>
                  {selectedConsultation.name.split('. ').pop().split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>{selectedConsultation.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Specialist: {selectedConsultation.subject}</span>
                </div>
              </div>

              {/* Schedule periods */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Weekly Available Periods</h4>
                
                <div className="glass-panel" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block' }}>Mondays & Wednesdays</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Period 4: Parent-Staff Syncs</span>
                  </div>
                  <span className="badge badge-success">11:30 AM - 12:15 PM</span>
                </div>

                <div className="glass-panel" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block' }}>Tuesdays & Thursdays</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Period 7: Academic Remedials</span>
                  </div>
                  <span className="badge badge-success">02:30 PM - 03:15 PM</span>
                </div>
              </div>

              {/* Consultation booking form */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.9rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>Book Appointment Window</h4>
                
                <div className="form-group">
                  <label>Select Date</label>
                  <input type="date" className="form-control" defaultValue="2026-06-01" />
                </div>

                <div className="form-group">
                  <label>Slot Selection</label>
                  <select className="form-control">
                    <option>11:30 AM - 12:15 PM (Remedials)</option>
                    <option>02:30 PM - 03:15 PM (Advisory Sync)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Reason / Topic for Meeting</label>
                  <textarea className="form-control" rows="3" placeholder="Explain the meeting intent..."></textarea>
                </div>

                <button onClick={() => {
                  alert('Appointment Request Sent successfully to ' + selectedConsultation.name);
                  setSelectedConsultation(null);
                }} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                  Confirm Booking Request
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Quick component inline X icon for ease
function X({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
