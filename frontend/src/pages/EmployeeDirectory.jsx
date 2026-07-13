import React, { useState, useEffect } from 'react';
import './EmployeeDirectory.css';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Mail, 
  Trash2,
  UserCog,
  Plus,
  Eye,
  X,
  Phone,
  MapPin,
  Briefcase,
  Award,
  Clock,
  Edit3,
  ChevronDown,
  User,
  FileText,
  CheckCircle,
  Download,
  ArrowUpDown
} from 'lucide-react';
import { hasPermission } from '../utils/permissions';

const STAFF_CATEGORIES = [
  'All', 'Administration', 'Accounts & Finance', 'IT Department', 'Transport', 'Hostel', 
  'Security', 'Maintenance', 'Housekeeping', 'Health & Medical', 'Store & Inventory', 'Campus Support', 'Other'
];

const DESIGNATIONS = [
  'Administrative Officer',
  'Office Assistant',
  'Data Entry Operator',
  'IT Administrator',
  'Computer Operator',
  'Transport Coordinator',
  'Driver',
  'Hostel Warden',
  'Security Supervisor',
  'Security Guard',
  'Maintenance Staff',
  'Electrician',
  'Plumber',
  'Housekeeping Supervisor',
  'Housekeeping Staff',
  'Cleaner',
  'School Nurse',
  'Store Keeper',
  'Peon',
  'Attendant',
  'Office Boy',
  'Gardener',
  'Other'
];

const DESIGNATION_DETAILS = {
  'Administrative Officer': { category: 'Administration', department: 'Administration' },
  'Office Assistant': { category: 'Administration', department: 'Administration' },
  'Data Entry Operator': { category: 'Administration', department: 'Administration' },
  'IT Administrator': { category: 'IT Department', department: 'Information Technology' },
  'Computer Operator': { category: 'IT Department', department: 'Information Technology' },
  'Transport Coordinator': { category: 'Transport', department: 'Transport' },
  'Driver': { category: 'Transport', department: 'Transport' },
  'Hostel Warden': { category: 'Hostel', department: 'Hostel' },
  'Security Supervisor': { category: 'Security', department: 'Security' },
  'Security Guard': { category: 'Security', department: 'Security' },
  'Maintenance Staff': { category: 'Maintenance', department: 'Maintenance' },
  'Electrician': { category: 'Maintenance', department: 'Maintenance' },
  'Plumber': { category: 'Maintenance', department: 'Maintenance' },
  'Housekeeping Supervisor': { category: 'Housekeeping', department: 'Housekeeping' },
  'Housekeeping Staff': { category: 'Housekeeping', department: 'Housekeeping' },
  'Cleaner': { category: 'Housekeeping', department: 'Housekeeping' },
  'School Nurse': { category: 'Health & Medical', department: 'Medical Services' },
  'Store Keeper': { category: 'Store & Inventory', department: 'Store & Inventory' },
  'Peon': { category: 'Campus Support', department: 'Campus Operations' },
  'Attendant': { category: 'Campus Support', department: 'Campus Operations' },
  'Office Boy': { category: 'Campus Support', department: 'Campus Operations' },
  'Gardener': { category: 'Campus Support', department: 'Campus Operations' },
  'Other': { category: 'Other', department: 'Other' }
};

export default function EmployeeDirectory({ readOnly = true, onAddClick, onEditClick }) {
  const getQrImageUrl = (qrCodePath, employeeId, employeeType) => {
    if (qrCodePath && qrCodePath.startsWith('data:')) {
      return qrCodePath;
    }
    const payload = JSON.stringify({ employeeId, employeeType });
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=1e1b4b&data=${encodeURIComponent(payload)}`;
  };

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [designationFilter, setDesignationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [inspectStaff, setInspectStaff] = useState(null);
  const [editStaff, setEditStaff] = useState(null);
  const [editData, setEditData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const isSearchOrFilterActive = searchQuery.trim() !== '' || designationFilter !== 'All' || statusFilter !== 'All';

  const handleRegenerateQR = async (empId) => {
    try {
      setQrLoading(true);
      const res = await fetch('/api/employee-attendance/regenerate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, employeeType: 'Employee' })
      });
      if (res.ok) {
        const data = await res.json();
        setInspectStaff(prev => ({ ...prev, qrCodePath: data.qrPath }));
        setStaffList(prev => prev.map(s => s.id === empId ? { ...s, qrCodePath: data.qrPath } : s));
      } else {
        alert('Failed to regenerate QR code.');
      }
    } catch (err) {
      console.error('Error regenerating QR:', err);
    } finally {
      setQrLoading(false);
    }
  };

  const handlePrintQR = async (staff) => {
    let schoolName = 'SITFG School';
    try {
      const res = await fetch('/api/school');
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) schoolName = data.name;
      }
    } catch (e) {
      console.error(e);
    }

    const printWindow = window.open('', '_blank', 'width=600,height=700');
    const qrUrl = getQrImageUrl(staff.qrCodePath, staff.id, 'Staff');
    const avatarBg = staff.avatarBg || 'linear-gradient(135deg, #FF8C42, #E05300)';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print ID Badge - ${staff.fullName || staff.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              text-align: center;
              padding: 40px;
              color: #1e293b;
              background: #f1f5f9;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 90vh;
              margin: 0;
            }
            .badge-card {
              border: 1px solid rgba(255, 140, 66, 0.12);
              border-radius: 24px;
              background: #ffffff;
              box-shadow: 0 25px 50px -12px rgba(255, 140, 66, 0.08), 0 10px 15px -3px rgba(0,0,0,0.03);
              width: 340px;
              overflow: hidden;
              position: relative;
              text-align: center;
              border-top: 4px solid #FF8C42;
            }
            .header-banner {
              background: linear-gradient(135deg, #FF8C42 0%, #E05300 100%);
              padding: 24px 20px 40px;
              color: #ffffff;
              text-align: center;
              position: relative;
            }
            .header-banner h2 {
              margin: 0;
              font-size: 1.25rem;
              font-weight: 800;
              letter-spacing: 0.04em;
              text-transform: uppercase;
              text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }
            .header-banner p {
              margin: 4px 0 0 0;
              font-size: 0.7rem;
              font-weight: 700;
              color: rgba(255, 255, 255, 0.9);
              text-transform: uppercase;
              letter-spacing: 0.12em;
            }
            .card-body {
              padding: 24px;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .avatar-container {
              position: relative;
              margin-top: -70px;
              margin-bottom: 14px;
              z-index: 10;
            }
            .avatar {
              width: 96px;
              height: 96px;
              border-radius: 50%;
              object-fit: cover;
              border: 4px solid #ffffff;
              box-shadow: 0 8px 20px rgba(255, 140, 66, 0.15), 0 2px 4px rgba(0,0,0,0.05);
            }
            .avatar-placeholder {
              width: 96px;
              height: 96px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 2.2rem;
              font-weight: 800;
              border: 4px solid #ffffff;
              box-shadow: 0 8px 20px rgba(255, 140, 66, 0.15), 0 2px 4px rgba(0,0,0,0.05);
              background: ${avatarBg};
            }
            .name {
              font-size: 1.3rem;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 4px 0;
              text-align: center;
              letter-spacing: -0.02em;
            }
            .role-badge {
              font-size: 0.75rem;
              font-weight: 700;
              color: #E05300;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              margin-bottom: 20px;
              background: #fff5f0;
              border: 1px solid rgba(255, 140, 66, 0.15);
              padding: 4px 14px;
              border-radius: 99px;
              display: inline-block;
            }
            .qr-container {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 16px;
              border-radius: 16px;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            }
            .qr-image {
              width: 170px;
              height: 170px;
              display: block;
            }
            .meta-info {
              width: 100%;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              border-top: 1px dashed #e2e8f0;
              padding-top: 16px;
              margin-bottom: 12px;
              text-align: left;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            .meta-label {
              font-size: 0.65rem;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .meta-value {
              font-size: 0.82rem;
              font-weight: 600;
              color: #1e293b;
            }
            .footer {
              background: #fff5f0;
              color: #E05300;
              padding: 10px;
              text-align: center;
              font-size: 0.72rem;
              font-weight: 800;
              border-top: 1px solid rgba(255, 140, 66, 0.1);
              text-transform: uppercase;
              letter-spacing: 0.08em;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div class="badge-card">
            <div class="header-banner">
              <h2>${schoolName}</h2>
              <p>Security ID Badge</p>
            </div>
            <div class="card-body">
              <div class="avatar-container">
                ${staff.photo ? `<img class="avatar" src="${staff.photo}" />` : `
                  <div class="avatar-placeholder">
                    ${(staff.fullName || staff.name || 'S').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                `}
              </div>
              <div class="name">${staff.fullName || staff.name}</div>
              <div class="role-badge">	ext{${staff.designation || staff.role || 'Staff'}}</div>
              
              <div class="qr-container">
                <img class="qr-image" src="${qrUrl}" />
              </div>

              <div class="meta-info">
                <div class="meta-item">
                  <span class="meta-label">Staff ID</span>
                  <span class="meta-value">${staff.id}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Department</span>
                  <span class="meta-value">${staff.department || 'Administration'}</span>
                </div>
              </div>
            </div>
            <div class="footer">Scan to record Attendance</div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error('Error loading staff roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetch('/api/designations')
      .then(res => res.json())
      .then(data => {
        setDesignations(data.map(d => d.name));
      })
      .catch(err => console.error('Error fetching designations in StaffDirectory:', err));
  }, []);

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to dismiss this employee?')) {
      const originalStaffList = [...staffList];

      // Optimistically update local state
      setStaffList(prev => prev.filter(s => s.id !== staffId));
      if (inspectStaff?.id === staffId) {
        setInspectStaff(null);
      }

      try {
        const res = await fetch(`/api/employees/${staffId}`, { method: 'DELETE' });
        if (!res.ok) {
          // Rollback on server failure
          setStaffList(originalStaffList);
          alert('Failed to delete staff member.');
        }
      } catch (err) {
        console.error('Error removing staff:', err);
        // Rollback on network failure
        setStaffList(originalStaffList);
        alert('Network error removing staff member.');
      }
    }
  };

  const openEdit = (staff) => {
    setEditStaff(staff);
    setEditData({ ...staff });
    setEditSuccess(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditDesignationChange = (e) => {
    const { value } = e.target;
    const mapping = DESIGNATION_DETAILS[value] || { category: 'Other', department: 'Other' };
    setEditData(prev => ({
      ...prev,
      designation: value,
      staffCategory: mapping.category,
      role: mapping.category,
      department: mapping.department
    }));
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/employees/${editStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (res.ok) {
        const updated = await res.json();
        setStaffList(prev => prev.map(s => s.id === updated.id ? updated : s));
        if (inspectStaff?.id === updated.id) setInspectStaff(updated);
        setEditSuccess(true);
        setTimeout(() => { setEditStaff(null); setEditSuccess(false); }, 1200);
      } else {
        alert('Failed to update staff.');
      }
    } catch (err) {
      console.error('Error updating staff:', err);
      alert('Server error.');
    } finally {
      setEditLoading(false);
    }
  };

  const filteredStaff = staffList.filter(s => {
    const name = (s.fullName || s.name || '').toLowerCase();
    const id = (s.employeeId || s.id || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    
    let matchesSearch = true;
    if (q.trim() !== '') {
      const cleanQ = q.replace(/^(emp-?|staff-?)/i, '');
      const cleanId = id.replace(/^(emp-?|staff-?)/i, '');
      const idMatch = cleanQ !== '' && cleanId.includes(cleanQ);
      matchesSearch = name.startsWith(q) || idMatch;
    }
    const matchesDesignation = designationFilter === 'All' || (s.designation || '') === designationFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesDesignation && matchesStatus;
  });

  // Sort filtered staff list
  filteredStaff.sort((a, b) => {
    let valA = '';
    let valB = '';
    if (sortBy === 'name') {
      valA = (a.fullName || a.name || '').toLowerCase();
      valB = (b.fullName || b.name || '').toLowerCase();
    } else if (sortBy === 'id') {
      valA = (a.id || '').toLowerCase();
      valB = (b.id || '').toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return valA.localeCompare(valB, undefined, { numeric: true });
    } else {
      return valB.localeCompare(valA, undefined, { numeric: true });
    }
  });

  const displayStaff = isSearchOrFilterActive ? filteredStaff : [];

  // Safe JSON parse for qualifications/experiences
  const parseJSON = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
    return [];
  };



  // ============================================================
  // INSPECT DRAWER
  // ============================================================
  const renderInspectDrawer = () => {
    if (!inspectStaff) return null;
    const s = inspectStaff;
    const qualArr = parseJSON(s.qualification);
    const expArr = parseJSON(s.experiences);
    const fullName = s.fullName || s.name || '—';

    return createPortal(
      <div onClick={() => setInspectStaff(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', isolation: 'isolate', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
        <div onClick={(e) => e.stopPropagation()} className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '75vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden', background: '#ffffff' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Eye size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Employee Profile
            </h3>
            <button onClick={() => setInspectStaff(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}><X size={20} /></button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
            {/* Profile Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '14px', background: s.avatarBg || 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.3rem', overflow: 'hidden', flexShrink: 0 }}>
                {s.photo ? <img src={s.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (fullName.split(' ').map(n => n[0]).join('').slice(0, 2))}
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.15rem' }}>{fullName}</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.staffCategory || s.role || '—'} • {s.department || '—'}</p>
                <span className={`badge ${s.status === 'Active' ? 'badge-success' : s.status === 'On Leave' ? 'badge-warning' : 'badge-danger'}`} style={{ marginTop: '6px', display: 'inline-block' }}>{s.status || 'Active'}</span>
              </div>
            </div>

            {/* Info Sections */}
            {renderInfoSection('Basic Information', User, 'hsl(var(--color-primary))', [
              { label: 'Employee ID', value: s.id },
              { label: 'Gender', value: s.gender },
              { label: 'Date of Birth', value: s.dob },
              { label: 'Blood Group', value: s.bloodGroup },
              { label: 'Nationality', value: s.nationality },
              { label: 'Marital Status', value: s.maritalStatus },
              { label: 'Aadhaar', value: s.aadhaarNumber },
              { label: 'PAN', value: s.panNumber }
            ])}

            {renderInfoSection('Employment', Briefcase, 'hsl(var(--color-secondary))', [
              { label: 'Category', value: s.staffCategory || s.role },
              { label: 'Designation', value: s.designation },
              { label: 'Department', value: s.department },
              { label: 'Employment Type', value: s.employmentType },
              { label: 'Joining Date', value: s.joiningDate || s.dateOfJoining },
              { label: 'Status', value: s.employeeStatus || s.status }
            ])}

            {renderInfoSection('Contact', Phone, 'hsl(210, 90%, 55%)', [
              { label: 'Mobile', value: s.mobile || s.phone },
              { label: 'Alternate', value: s.alternateMobile },
              { label: 'Email', value: s.email },
              { label: 'Emergency', value: s.emergencyContactNumber || s.emergencyPhone }
            ])}

            {renderInfoSection('Current Address', MapPin, 'rgb(var(--color-success-rgb))', [
              { label: 'Address', value: s.currentAddress || s.address },
              { label: 'City', value: s.currentCity || s.city },
              { label: 'State', value: s.currentState || s.state },
              { label: 'Postal Code', value: s.currentPostalCode || s.pincode }
            ])}

            {s.permanentAddress && renderInfoSection('Permanent Address', MapPin, 'hsl(280, 80%, 55%)', [
              { label: 'Address', value: s.permanentAddress },
              { label: 'City', value: s.permanentCity },
              { label: 'State', value: s.permanentState },
              { label: 'Postal Code', value: s.permanentPostalCode }
            ])}

            {/* Qualifications */}
            {qualArr.length > 0 && qualArr.some(q => q.degree) && (
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid hsl(280, 80%, 55%)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 10px 0', color: 'hsl(280, 80%, 55%)', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={14} /> Qualifications</h4>
                {qualArr.filter(q => q.degree).map((q, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: i < qualArr.length - 1 ? '1px solid var(--border-glass)' : 'none', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 600 }}>{q.degree}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{[q.institution, q.boardUniversity, q.year].filter(Boolean).join(' • ')}{q.percentage ? ` — ${q.percentage}` : ''}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Experiences */}
            {expArr.length > 0 && expArr.some(e => e.organization) && (
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid rgb(var(--color-warning-rgb))' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 10px 0', color: 'rgb(var(--color-warning-rgb))', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={14} /> Experience</h4>
                {expArr.filter(e => e.organization).map((exp, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: i < expArr.length - 1 ? '1px solid var(--border-glass)' : 'none', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 600 }}>{exp.designation || 'Employee'} at {exp.organization}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{[exp.fromDate, exp.toDate].filter(Boolean).join(' â†’ ')}</div>
                    {exp.responsibilities && <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{exp.responsibilities}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* QR Code Section */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Employee QR Code</span>
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ background: '#ffffff', padding: '8px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', width: '120px', height: '120px', flexShrink: 0 }}>
                  <img src={getQrImageUrl(s.qrCodePath, s.id, 'Staff')} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '180px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>ID Badge Access QR</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Contains unique Employee ID & Type. Use the camera scanner in the Staff/Employee Attendance to record daily check-ins and check-outs.
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <a href={getQrImageUrl(s.qrCodePath, s.id, 'Staff')} download={`QR_${s.id}.png`} className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Download size={12} /> Download
                    </a>
                    <button onClick={() => handlePrintQR(s)} className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Print Badge
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>


        </div>
      </div>, document.body);
  };

  // Info Section helper
  const renderInfoSection = (title, Icon, color, fields) => (
    <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', borderLeft: `4px solid ${color}` }}>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 10px 0', color, display: 'flex', alignItems: 'center', gap: '8px' }}><Icon size={14} /> {title}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 16px', fontSize: '0.82rem' }}>
        {fields.map((f, i) => (
          <div key={i}><strong>{f.label}:</strong> {f.value || '—'}</div>
        ))}
      </div>
    </div>
  );

  // ============================================================
  // EDIT MODAL
  // ============================================================
  const renderEditModal = () => {
    if (!editStaff) return null;
    const inputStyle = { padding: '10px 14px', borderRadius: '8px', width: '100%', boxSizing: 'border-box' };
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div onClick={() => setEditStaff(null)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
        <div className="glass-panel" style={{ position: 'relative', width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', padding: '28px', borderRadius: '16px' }}>
          {editSuccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
              <CheckCircle size={48} style={{ color: 'rgb(var(--color-success-rgb))' }} />
              <h3 style={{ margin: 0, fontWeight: 700 }}>Employee Updated!</h3>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Edit3 size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Edit Employee Profile
                </h3>
                <button onClick={() => setEditStaff(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
                  <input type="text" name="fullName" value={editData.fullName || editData.name || ''} onChange={(e) => { const v = e.target.value.replace(/[^A-Za-z\s]/g, '').slice(0, 50); setEditData(p => ({ ...p, fullName: v, name: v })); }} className="form-control" style={inputStyle} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email</label>
                  <input type="email" name="email" value={editData.email || ''} onChange={handleEditChange} className="form-control" style={inputStyle} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mobile</label>
                  <input type="text" name="mobile" value={editData.mobile || editData.phone || ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); setEditData(p => ({ ...p, mobile: v, phone: v })); }} className="form-control" style={inputStyle} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Status</label>
                  <select name="status" value={editData.status || 'Active'} onChange={handleEditChange} className="form-control" style={inputStyle}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Designation</label>
                  <select name="designation" value={editData.designation || ''} onChange={handleEditDesignationChange} className="form-control" style={inputStyle}>
                    <option value="">Select Designation</option>
                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Employment Type</label>
                  <select name="employmentType" value={editData.employmentType || ''} onChange={handleEditChange} className="form-control" style={inputStyle}>
                    <option value="">Select</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button onClick={() => setEditStaff(null)} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleEditSave} className="btn-primary" disabled={editLoading} style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editLoading ? 'Saving...' : <><CheckCircle size={14} /> Save Changes</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Search & Filter Bar */}
      <div className="glass-panel directory-actions" style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div className="search-bar-container" style={{ width: '100%', maxWidth: '360px' }}>
          <Search size={18} className="search-bar-icon" />
          <input 
            type="text" 
            placeholder="Search by employee name..."
            className="search-bar-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
            style={{ width: '100%' }}
          />
        </div>

        <div className="filter-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="select-custom" value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)}>
            <option value="All">All Designations</option>
            {designations.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="select-custom" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '8px' }}>Sort By:</span>
          <select className="select-custom" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Employee Name</option>
            <option value="id">Employee ID</option>
          </select>

          <button 
            type="button" 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} 
            className="btn-secondary" 
            style={{ padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            <ArrowUpDown size={14} /> {sortOrder.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Designation</th>
                  <th>Designation Level</th>
                  <th>Employee Type</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayStaff.length > 0 ? (
                  displayStaff.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: s.avatarBg || 'linear-gradient(135deg, #667eea, #764ba2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '0.75rem', fontWeight: 700, overflow: 'hidden', flexShrink: 0
                          }}>
                            {s.photo ? <img src={s.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ((s.fullName || s.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2))}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.fullName || s.name}</span>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontSize: '0.82rem' }}>{s.designation || '—'}</span></td>
                      <td><span style={{ fontSize: '0.82rem' }}>{s.designationLevel || '—'}</span></td>
                      <td><span style={{ fontSize: '0.82rem' }}>{s.employmentType || '—'}</span></td>
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>
                          <div>{s.mobile || s.phone || '—'}</div>
                          {s.email && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.email}</div>}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${s.status === 'Active' ? 'badge-success' : s.status === 'On Leave' ? 'badge-warning' : s.status === 'Inactive' ? 'badge-danger' : 'badge-info'}`}>
                          {s.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setInspectStaff(s)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px' }} title="Inspect">
                            <Eye size={13} />
                          </button>
                          {!readOnly && (
                            <>
                              {hasPermission('staff-directory', 'edit') && (
                                <button onClick={() => onEditClick ? onEditClick(s) : openEdit(s)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px' }} title="Edit">
                                  <Edit3 size={13} />
                                </button>
                              )}
                              {hasPermission('staff-directory', 'delete') && (
                                <button onClick={() => handleDeleteStaff(s.id)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px', borderColor: 'rgb(var(--color-danger-rgb))', color: 'rgb(var(--color-danger-rgb))' }} title="Dismiss">
                                  <Trash2 size={13} />
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
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      {!isSearchOrFilterActive ? 'Please select a filter or enter a search query to load employees.' : searchQuery ? `No employees found starting with '${searchQuery}'.` : 'No employees match your search criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>

      {/* Inspect Drawer */}
      {renderInspectDrawer()}

      {/* Edit Modal */}
      {renderEditModal()}
    </div>
  );
}

