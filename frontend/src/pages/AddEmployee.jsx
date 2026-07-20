import React, { useState, useEffect, useRef } from 'react';
import './AddEmployee.css';
import { 
  User, 
  Briefcase, 
  Phone, 
  MapPin, 
  Award, 
  Clock, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw, 
  Save, 
  Loader2,
  FileText,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Plus,
  X
} from 'lucide-react';

// ============================================================
// STAFF CATEGORIES & OPTION LISTS
// ============================================================
const STAFF_CATEGORY_MAPPING = {
  'Administration': {
    department: 'Administration',
    designations: ['Administrative Officer', 'Administrative Assistant', 'Office Assistant', 'Data Entry Operator', 'Record Keeper', 'Clerk', 'Front Desk Executive']
  },
  'Accounts & Finance': {
    department: 'Accounts & Finance',
    designations: ['Accountant', 'Accounts Manager', 'Cashier', 'Finance Officer', 'Fee Collection Officer']
  },
  'IT Department': {
    department: 'Information Technology',
    designations: ['IT Administrator', 'ERP Administrator', 'System Administrator', 'Network Administrator', 'Computer Operator', 'Technical Support Executive']
  },
  'Transport': {
    department: 'Transport',
    designations: ['Transport Manager', 'Transport Coordinator', 'Driver', 'Assistant Driver', 'Bus Attendant', 'Vehicle Supervisor']
  },
  'Hostel': {
    department: 'Hostel',
    designations: ['Hostel Warden', 'Assistant Warden', 'Hostel Supervisor', 'Hostel Caretaker']
  },
  'Security': {
    department: 'Security',
    designations: ['Security Supervisor', 'Security Guard', 'Gate Keeper']
  },
  'Maintenance': {
    department: 'Maintenance',
    designations: ['Maintenance Manager', 'Maintenance Staff', 'Electrician', 'Plumber', 'Carpenter', 'Technician']
  },
  'Housekeeping': {
    department: 'Housekeeping',
    designations: ['Housekeeping Supervisor', 'Housekeeping Staff', 'Cleaner', 'Janitor', 'Sweeper']
  },
  'Health & Medical': {
    department: 'Medical Services',
    designations: ['School Nurse', 'Medical Officer', 'Health Assistant', 'First Aid Assistant']
  },
  'Store & Inventory': {
    department: 'Store & Inventory',
    designations: ['Store Keeper', 'Inventory Manager', 'Stock Assistant']
  },
  'Campus Support': {
    department: 'Campus Operations',
    designations: ['Gardener', 'Groundskeeper', 'Attendant', 'Peon', 'Office Boy', 'Messenger']
  }
};

const STAFF_CATEGORIES = Object.keys(STAFF_CATEGORY_MAPPING);

const DEPARTMENTS = [
  'Administration', 'Accounts & Finance', 'Information Technology', 'Transport',
  'Hostel', 'Security', 'Maintenance', 'Housekeeping', 'Medical Services',
  'Store & Inventory', 'Campus Operations'
];

const EMPLOYMENT_TYPES = ['None', 'Full-Time', 'Part-Time', 'Contract', 'Temporary'];
const EMPLOYEE_STATUSES = ['None', 'Active', 'Inactive'];
const BLOOD_GROUPS = ['None', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DESIGNATION_LEVELS = ['None', 'Trainee', 'Junior', 'Associate', 'Senior', 'Lead', 'Supervisor', 'Coordinator', 'Manager', 'Head', 'Director'];

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

// ============================================================
// STEP DEFINITIONS
// ============================================================
const STEPS = [
  { id: 1, label: 'Basic Information', icon: User, color: 'hsl(var(--color-primary))' },
  { id: 2, label: 'Employment Info', icon: Briefcase, color: 'hsl(var(--color-secondary))' },
  { id: 3, label: 'Contact Details', icon: Phone, color: 'hsl(210, 90%, 55%)' },
  { id: 4, label: 'Address', icon: MapPin, color: 'rgb(var(--color-success-rgb))' },
  { id: 5, label: 'Qualifications', icon: Award, color: 'hsl(280, 80%, 55%)' },
  { id: 6, label: 'Experience', icon: Clock, color: 'rgb(var(--color-warning-rgb))' },
  { id: 7, label: 'Documents & Review', icon: FileText, color: 'hsl(0, 80%, 55%)' }
];

function DragAndDropFile({ fieldName, label, file, onFileChange, onRemove, accept = "*" }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragOver(true);
    } else if (e.type === "dragleave") {
      setDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fileObj = e.dataTransfer.files[0];
      if (fileObj.size > 50 * 1024 * 1024) {
        alert("File size exceeds 50MB limit. Please upload a smaller document.");
        return;
      }
      onFileChange({ target: { files: [fileObj] } }, fieldName);
    }
  };

  return (
    <div 
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      style={{
        padding: '16px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: dragOver ? 'rgba(255, 107, 0, 0.05)' : 'rgba(255,255,255,0.01)',
        border: dragOver ? '2px dashed rgb(255, 107, 0)' : '1px solid var(--border-glass)',
        transition: 'all 0.3s ease',
        minHeight: '120px',
        justifyContent: 'center'
      }}
    >
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{label}</span>
      
      {!file ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
          <Upload size={20} style={{ color: 'var(--text-muted)' }} />
          <label htmlFor={fieldName} style={{ color: 'hsl(var(--color-primary))', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            Upload File <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>or drag here</span>
          </label>
          <input 
            type="file" 
            id={fieldName} 
            accept={accept} 
            onChange={(e) => onFileChange(e, fieldName)} 
            style={{ display: 'none' }} 
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Files under 50MB</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-glass-active)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} style={{ color: 'hsl(var(--color-primary))' }} />
            {file.name}
          </span>
          <button 
            type="button" 
            onClick={() => onRemove(fieldName)} 
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CUSTOM SELECT COMPONENT (always opens below)
// ============================================================
function CustomSelect({ options, value, onChange, placeholder, name, className, style }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o === value) || null;

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', ...style }} onClick={(e) => e.stopPropagation()}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={className}
        style={{
          padding: '12px 16px', borderRadius: '10px', width: '100%', boxSizing: 'border-box',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-form)', border: '1.5px solid #cbd5e1',
          color: value ? 'var(--text-main)' : '#94a3b8',
          fontSize: '0.95rem', fontFamily: 'var(--font-primary)',
          transition: 'all 0.3s ease'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel || placeholder || 'Select...'}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '8px', opacity: 0.6 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {isOpen && (
        <div className="glass-panel" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          marginTop: '6px', maxHeight: '220px', overflowY: 'auto',
          background: 'var(--bg-dropdown)', border: '1px solid var(--border-glass)',
          borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          padding: '6px'
        }}>
          {options.length === 0 ? (
            <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
              No options
            </div>
          ) : options.map((opt, i) => (
            <div key={i}
              onClick={() => {
                onChange({ target: { name, value: opt } });
                setIsOpen(false);
              }}
              style={{
                padding: '10px 14px', cursor: 'pointer', fontSize: '0.9rem',
                borderRadius: '8px',
                background: opt === value ? 'rgba(hsl(var(--color-primary)), 0.12)' : 'transparent',
                color: opt === value ? 'hsl(var(--color-primary))' : 'var(--text-main)',
                fontWeight: opt === value ? 600 : 400,
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => { if (opt !== value) e.currentTarget.style.background = 'var(--bg-glass-active)'; }}
              onMouseLeave={(e) => { if (opt !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

let staffFilesCache = {
  photo: null,
  aadhaarFile: null,
  panFile: null,
  resumeFile: null,
  qualificationFile: null,
  experienceFile: null,
  otherFile: null
};

let staffPreviewsCache = {
  photo: ''
};

export default function AddEmployee({ setActiveView, editData }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [roles, setRoles] = useState([]);
  const [designations, setDesignations] = useState([]);
  const isSubmitting = React.useRef(false);

  useEffect(() => {
    fetch('/api/rbac/roles')
      .then(res => res.json())
      .then(data => {
        setRoles(data.filter(r => r.active && r.name !== 'Teacher'));
      })
      .catch(err => console.error('Error fetching roles in AddStaff:', err));

    fetch('/api/designations')
      .then(res => res.json())
      .then(data => {
        const active = data.filter(d => d.status === 'Active' || !d.status);
        setDesignations(active.map(d => d.name));
      })
      .catch(err => console.error('Error fetching designations in AddStaff:', err));
  }, []);

  // Generate Staff ID on mount
  useEffect(() => {
    if (editData) return;
    const rand = Math.floor(1000 + Math.random() * 9000);
    setStaffId(`STF-${new Date().getFullYear()}-${rand}`);
  }, [editData]);

  // ============================================================
  // FORM STATE
  // ============================================================
  const [formData, setFormData] = useState({
    // Step 1: Basic
    firstName: '', middleName: '', lastName: '', gender: '',
    dob: '', bloodGroup: '', nationality: 'Indian', maritalStatus: '',
    aadhaarNumber: '', panNumber: '',
    // Step 2: Employment
    joiningDate: new Date().toISOString().split('T')[0], staffCategory: '', designation: '', designationLevel: '', department: '',
    employmentType: '', employeeStatus: 'Active',
    // Step 3: Contact
    mobile: '', alternateMobile: '', email: '', emergencyContactNumber: '',
    // Step 4: Address
    currentAddress: '', currentCity: '', currentState: '', currentCountry: 'India', currentPostalCode: '',
    permanentAddress: '', permanentCity: '', permanentState: '', permanentCountry: 'India', permanentPostalCode: '',
    sameAsPermanent: false,
    experience: ''
  });

  const [qualifications, setQualifications] = useState([
    { degree: '', institution: '', boardUniversity: '', year: '', percentage: '' }
  ]);

  const [experiences, setExperiences] = useState([
    { organization: '', designation: '', fromDate: '', toDate: '', responsibilities: '' }
  ]);

  // File uploads
  const [files, setFiles] = useState(staffFilesCache);
  const [filePreviews, setFilePreviews] = useState(staffPreviewsCache);

  const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';
  const draftKey = `employee_add_draft_${tenantSubdomain}`;

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
  };

  useEffect(() => {
    if (editData) return;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.qualifications) setQualifications(parsed.qualifications);
        if (parsed.experiences) setExperiences(parsed.experiences);
        if (parsed.staffId) setStaffId(parsed.staffId);
      } catch (err) {
        console.error('Failed to restore employee draft:', err);
      }
    }
  }, [editData]);

  useEffect(() => {
    if (editData) return;
    const isFormEmpty = !formData.firstName && !formData.lastName && !formData.mobile && !formData.email && !formData.experience;
    if (!isFormEmpty) {
      const draftPayload = {
        formData,
        qualifications,
        experiences,
        staffId
      };
      localStorage.setItem(draftKey, JSON.stringify(draftPayload));
    }
  }, [formData, qualifications, experiences, staffId, editData]);

  useEffect(() => {
    Object.assign(staffFilesCache, files);
  }, [files]);

  useEffect(() => {
    Object.assign(staffPreviewsCache, filePreviews);
  }, [filePreviews]);

  const [existingFiles, setExistingFiles] = useState({});

  useEffect(() => {
    if (editData) {
      setExistingFiles({
        photo: editData.photo || '',
        aadhaarFile: editData.aadhaarFile || '',
        panFile: editData.panFile || '',
        resumeFile: editData.resumeFile || '',
        qualificationFile: editData.qualificationFile || '',
        experienceFile: editData.experienceFile || '',
        otherFile: editData.otherFile || ''
      });
      if (editData.photo) {
        setFilePreviews({ photo: editData.photo });
      }
    }
  }, [editData]);

  useEffect(() => {
    if (editData && Object.keys(editData).length > 0) {
      setStaffId(editData.staffId || editData.id || '');

      let parsedQualifications = editData.qualification || editData.qualifications || [];
      if (typeof parsedQualifications === 'string') {
        try {
          parsedQualifications = JSON.parse(parsedQualifications);
        } catch (e) {
          parsedQualifications = [];
        }
      }
      if (!Array.isArray(parsedQualifications)) {
        parsedQualifications = [];
      }
      if (parsedQualifications.length === 0) {
        parsedQualifications = [
          { degree: '', institution: '', boardUniversity: '', year: '', percentage: '' }
        ];
      }

      let parsedExperiences = editData.experiences || [];
      if (typeof parsedExperiences === 'string') {
        try {
          parsedExperiences = JSON.parse(parsedExperiences);
        } catch (e) {
          parsedExperiences = [];
        }
      }
      if (!Array.isArray(parsedExperiences)) {
        parsedExperiences = [];
      }
      if (parsedExperiences.length === 0) {
        parsedExperiences = [
          { organization: '', designation: '', fromDate: '', toDate: '', responsibilities: '' }
        ];
      }

      setFormData({
        firstName: editData.firstName || '',
        middleName: editData.middleName || '',
        lastName: editData.lastName || '',
        gender: editData.gender || '',
        dob: editData.dob ? editData.dob.split(/[ T]/)[0] : '',
        bloodGroup: editData.bloodGroup || '',
        nationality: editData.nationality || 'Indian',
        maritalStatus: editData.maritalStatus || '',
        aadhaarNumber: editData.aadhaarNumber || '',
        panNumber: editData.panNumber || '',
        joiningDate: editData.joiningDate ? editData.joiningDate.split(/[ T]/)[0] : '',
        staffCategory: editData.staffCategory || editData.role || '',
        designation: editData.designation || '',
        designationLevel: editData.designationLevel || '',
        department: editData.department || '',
        employmentType: editData.employmentType || '',
        employeeStatus: editData.employeeStatus || editData.status || 'Active',
        mobile: editData.mobile || editData.phone || '',
        alternateMobile: editData.alternateMobile || '',
        email: editData.email || '',
        emergencyContactNumber: editData.emergencyContactNumber || '',
        currentAddress: editData.currentAddress || '',
        currentCity: editData.currentCity || '',
        currentState: editData.currentState || '',
        currentCountry: editData.currentCountry || 'India',
        currentPostalCode: editData.currentPostalCode || '',
        permanentAddress: editData.permanentAddress || '',
        permanentCity: editData.permanentCity || '',
        permanentState: editData.permanentState || '',
        permanentCountry: editData.permanentCountry || 'India',
        permanentPostalCode: editData.permanentPostalCode || '',
        sameAsPermanent: editData.sameAsPermanent === true || editData.sameAsPermanent === 'true' || editData.sameAsPermanent === 'Yes',
        experience: editData.experience || ''
      });

      setQualifications(parsedQualifications);
      setExperiences(parsedExperiences);
    }
  }, [editData]);

  const handleDesignationChange = (e) => {
    const { value } = e.target;
    const details = DESIGNATION_DETAILS[value] || { category: 'Other', department: 'Other' };
    
    setFormData(prev => ({
      ...prev,
      designation: value,
      department: details.department,
      staffCategory: details.category
    }));
    
    if (validationErrors.designation || validationErrors.staffCategory) {
      setValidationErrors(prev => ({
        ...prev,
        designation: '',
        staffCategory: ''
      }));
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => {
        const updated = { ...prev, [name]: checked };
        if (name === 'sameAsPermanent' && checked) {
          updated.permanentAddress = prev.currentAddress;
          updated.permanentCity = prev.currentCity;
          updated.permanentState = prev.currentState;
          updated.permanentCountry = prev.currentCountry;
          updated.permanentPostalCode = prev.currentPostalCode;
        }
        return updated;
      });
    } else {
      let val = value;
      if (name === 'panNumber') {
        val = val.toUpperCase().slice(0, 10);
      }
      setFormData(prev => ({ ...prev, [name]: val }));
      if (validationErrors[name]) {
        setValidationErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value,
        designation: '',
        designationLevel: '',
      };
      
      // Auto-select department according to the chosen category
      if (STAFF_CATEGORY_MAPPING[value]) {
        updated.department = STAFF_CATEGORY_MAPPING[value].department;
      }
      return updated;
    });
    
    // Clear validation errors for these fields
    setValidationErrors(prev => ({
      ...prev,
      staffCategory: '',
      designation: '',
      department: ''
    }));
  };

  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formData.firstName.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
      
      if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber.replace(/\s/g, ''))) {
        errors.aadhaarNumber = 'Aadhaar number must be exactly 12 digits';
      }
      if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
        errors.panNumber = 'PAN number must be in ABCDE1234F format';
      }
    }
    if (step === 2) {
      if (!formData.designation) errors.designation = 'Designation is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNumericChange = (e, maxLen = 10) => {
    const { name, value } = e.target;
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, maxLen);
    setFormData(prev => ({ ...prev, [name]: cleaned }));
  };

  const handleNameChange = (e) => {
    const { name, value } = e.target;
    const cleaned = value.replace(/[^A-Za-z\s]/g, '').slice(0, 50);
    setFormData(prev => ({ ...prev, [name]: cleaned }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert('File too large. Max 50MB.'); return; }
    setFiles(prev => ({ ...prev, [fieldName]: file }));
    if (fieldName === 'photo' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreviews(prev => ({ ...prev, photo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (fieldName) => {
    setFiles(prev => ({ ...prev, [fieldName]: null }));
    setExistingFiles(prev => ({ ...prev, [fieldName]: '' }));
    if (fieldName === 'photo') setFilePreviews(prev => ({ ...prev, photo: '' }));
    const el = document.getElementById(fieldName);
    if (el) el.value = '';
  };

  // Qualification handlers
  const addQualification = () => setQualifications(prev => [...prev, { degree: '', institution: '', boardUniversity: '', year: '', percentage: '' }]);
  const removeQualification = (i) => setQualifications(prev => prev.filter((_, idx) => idx !== i));
  const updateQualification = (i, field, value) => {
    setQualifications(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  };

  // Experience handlers
  const addExperience = () => setExperiences(prev => [...prev, { organization: '', designation: '', fromDate: '', toDate: '', responsibilities: '' }]);
  const removeExperience = (i) => setExperiences(prev => prev.filter((_, idx) => idx !== i));
  const updateExperience = (i, field, value) => {
    setExperiences(prev => prev.map((exp, idx) => {
      if (idx !== i) return exp;
      const updated = { ...exp, [field]: value };
      if (field === 'fromDate' && updated.toDate && value > updated.toDate) {
        updated.toDate = value;
      }
      return updated;
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: '', middleName: '', lastName: '', gender: '',
      dob: '', bloodGroup: '', nationality: 'Indian', maritalStatus: '',
      aadhaarNumber: '', panNumber: '',
      joiningDate: new Date().toISOString().split('T')[0], staffCategory: '', designation: '', designationLevel: '', department: '',
      employmentType: '', employeeStatus: 'Active',
      mobile: '', alternateMobile: '', email: '', emergencyContactNumber: '',
      currentAddress: '', currentCity: '', currentState: '', currentCountry: 'India', currentPostalCode: '',
      permanentAddress: '', permanentCity: '', permanentState: '', permanentCountry: 'India', permanentPostalCode: '',
      sameAsPermanent: false,
      experience: ''
    });
    setQualifications([{ degree: '', institution: '', boardUniversity: '', year: '', percentage: '' }]);
    setExperiences([{ organization: '', designation: '', fromDate: '', toDate: '', responsibilities: '' }]);
    setFiles({ photo: null, aadhaarFile: null, panFile: null, resumeFile: null, qualificationFile: null, experienceFile: null, otherFile: null });
    setFilePreviews({ photo: '' });
    setCurrentStep(1);
    const rand = Math.floor(1000 + Math.random() * 9000);
    setStaffId(`STF-${new Date().getFullYear()}-${rand}`);
    clearDraft();
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async () => {
    if (isSubmitting.current) return;
    
    let isValid = true;
    for (let step = 1; step <= 2; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        isValid = false;
        break;
      }
    }
    if (!isValid) return;
    isSubmitting.current = true;
    setLoading(true);
    try {
      const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ');
      const fd = new FormData();

      // Append all form data
      Object.keys(formData).forEach(k => {
        if (k === 'staffCategory' && !formData.staffCategory && formData.designation) {
          const details = DESIGNATION_DETAILS[formData.designation];
          fd.append(k, details ? details.category : '');
        } else {
          fd.append(k, formData[k]);
        }
      });
      fd.append('fullName', fullName);
      fd.append('staffId', staffId);
      fd.append('qualification', JSON.stringify(qualifications));
      fd.append('experiences', JSON.stringify(experiences));

      // Append files
      Object.keys(files).forEach(k => { if (files[k]) fd.append(k, files[k]); });

      const url = editData ? `/api/employees/${editData.id}` : '/api/employees';
      const method = editData ? 'PUT' : 'POST';

      const res = await fetch(url, { method: method, body: fd });
      if (res.ok) {
        resetForm();
        setCurrentStep(1);
        setLoading(false);
        isSubmitting.current = false;
        if (editData && typeof setActiveView === 'function') {
          setActiveView('employees');
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register staff.');
        setLoading(false);
        isSubmitting.current = false;
      }
    } catch (err) {
      console.error('Staff registration error:', err);
      alert('Server connection error.');
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================================
  // SHARED STYLES
  // ============================================================
  const inputStyle = { padding: '12px 16px', borderRadius: '10px', width: '100%', boxSizing: 'border-box' };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' };
  const sectionHeaderStyle = (color) => ({
    fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px',
    color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', margin: 0
  });

  // ============================================================
  // RENDER STEPS
  // ============================================================

  const renderStep1 = () => (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={sectionHeaderStyle()}>
        <User size={18} style={{ color: 'hsl(var(--color-primary))' }} />
        Step 1: Basic Information
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="form-group">
          <label>Employee ID (Auto Generated)</label>
          <input 
            type="text" 
            value="EMP-2026-XXXX" 
            disabled 
            className="form-control" 
            style={{ opacity: 0.6, fontStyle: 'italic', background: 'rgba(255,255,255,0.02)' }}
          />
        </div>

        <div className="form-group">
          <label>First Name *</label>
          <input 
            type="text" 
            name="firstName" 
            value={formData.firstName} 
            onChange={handleNameChange} 
            className="form-control" 
            placeholder="First name"
            style={{ borderColor: validationErrors.firstName ? '#ef4444' : undefined }}
          />
          {validationErrors.firstName && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.firstName}</span>}
        </div>

        <div className="form-group">
          <label>Middle Name (Optional)</label>
          <input 
            type="text" 
            name="middleName" 
            value={formData.middleName} 
            onChange={handleNameChange} 
            className="form-control" 
            placeholder="Middle name"
          />
        </div>

        <div className="form-group">
          <label>Last Name *</label>
          <input 
            type="text" 
            name="lastName" 
            value={formData.lastName} 
            onChange={handleNameChange} 
            className="form-control" 
            placeholder="Last name"
            style={{ borderColor: validationErrors.lastName ? '#ef4444' : undefined }}
          />
          {validationErrors.lastName && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.lastName}</span>}
        </div>

        <div className="form-group">
          <label>Gender *</label>
          <CustomSelect 
            name="gender" 
            value={formData.gender} 
            onChange={handleChange} 
            options={['None', 'Male', 'Female', 'Other']} 
            placeholder="Choose Gender" 
            className="form-control" 
            style={{ borderColor: validationErrors.gender ? '#ef4444' : undefined }} 
          />
          {validationErrors.gender && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.gender}</span>}
        </div>

        <div className="form-group">
          <label>Date of Birth *</label>
          <input 
            type="date" 
            name="dob" 
            value={formData.dob} 
            onChange={handleChange} 
            max={new Date().toLocaleDateString('en-CA')} 
            className="form-control" 
            style={{ borderColor: validationErrors.dob ? '#ef4444' : undefined }} 
          />
          {validationErrors.dob && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.dob}</span>}
        </div>

        <div className="form-group">
          <label>Blood Group</label>
          <CustomSelect 
            name="bloodGroup" 
            value={formData.bloodGroup} 
            onChange={handleChange} 
            options={BLOOD_GROUPS} 
            placeholder="Choose Blood Group" 
            className="form-control" 
          />
        </div>

        <div className="form-group">
          <label>Nationality</label>
          <input 
            type="text" 
            name="nationality" 
            value={formData.nationality} 
            onChange={handleChange} 
            className="form-control" 
            placeholder="e.g. Indian" 
          />
        </div>

        <div className="form-group">
          <label>Marital Status</label>
          <CustomSelect 
            name="maritalStatus" 
            value={formData.maritalStatus} 
            onChange={handleChange} 
            options={['None', 'Single', 'Married', 'Divorced', 'Widowed']} 
            placeholder="Choose Marital Status" 
            className="form-control" 
          />
        </div>

        <div className="form-group">
          <label>Aadhaar Number (Optional)</label>
          <input 
            type="text" 
            name="aadhaarNumber" 
            value={formData.aadhaarNumber} 
            onChange={(e) => handleNumericChange(e, 12)} 
            className="form-control" 
            placeholder="12-digit Aadhaar ID"
            style={{ borderColor: validationErrors.aadhaarNumber ? '#ef4444' : undefined }}
            maxLength={12}
          />
          {validationErrors.aadhaarNumber && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.aadhaarNumber}</span>}
        </div>

        <div className="form-group">
          <label>PAN Number (Optional)</label>
          <input 
            type="text" 
            name="panNumber" 
            value={formData.panNumber} 
            onChange={handleChange} 
            className="form-control" 
            placeholder="10-digit PAN ID"
            style={{ borderColor: validationErrors.panNumber ? '#ef4444' : undefined }}
            maxLength={10}
          />
          {validationErrors.panNumber && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.panNumber}</span>}
        </div>

        <div className="form-group">
          <DragAndDropFile 
            fieldName="photo"
            label="Staff Profile Photo (Optional)"
            file={files.photo || (existingFiles.photo ? { name: existingFiles.photo.split('/').pop() } : null)}
            onFileChange={handleFileChange}
            onRemove={removeFile}
            accept="image/*"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={sectionHeaderStyle()}>
        <Briefcase size={18} style={{ color: 'hsl(var(--color-secondary))' }} />
        Step 2: Employment Information
      </h3>
      <div style={gridStyle}>
        <div className="form-group">
          <label>Designation *</label>
          <CustomSelect name="designation" value={formData.designation} onChange={handleDesignationChange} options={designations} placeholder="Choose Designation" className="form-control" style={{ border: validationErrors.designation ? '1.5px solid #ef4444' : undefined }} />
          {validationErrors.designation && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.designation}</span>}
        </div>
        <div className="form-group">
          <label>Designation Level</label>
          <CustomSelect name="designationLevel" value={formData.designationLevel} onChange={handleChange} options={DESIGNATION_LEVELS} placeholder="Choose Level" className="form-control" />
        </div>
        <div className="form-group">
          <label>Employment Type</label>
          <CustomSelect name="employmentType" value={formData.employmentType} onChange={handleChange} options={EMPLOYMENT_TYPES} placeholder="Choose Type" className="form-control" />
        </div>
        <div className="form-group">
          <label>Date of Birth</label>
          <input type="date" name="dob" value={formData.dob} onChange={handleChange} max={new Date().toLocaleDateString('en-CA')} className="form-control" />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={sectionHeaderStyle()}>
        <Phone size={18} style={{ color: 'hsl(210, 90%, 55%)' }} />
        Step 3: Contact Information
      </h3>
      <div style={gridStyle}>
        <div className="form-group">
          <label>Mobile Number</label>
          <input type="text" name="mobile" value={formData.mobile} onChange={(e) => handleNumericChange(e, 10)} className="form-control" placeholder="10-digit mobile" />
        </div>
        <div className="form-group">
          <label>Alternate Mobile (Optional)</label>
          <input type="text" name="alternateMobile" value={formData.alternateMobile} onChange={(e) => handleNumericChange(e, 10)} className="form-control" placeholder="Alternate number" />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" placeholder="staff@school.com" />
        </div>
        <div className="form-group">
          <label>Emergency Contact Number</label>
          <input type="text" name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={(e) => handleNumericChange(e, 10)} className="form-control" placeholder="Emergency number" />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={sectionHeaderStyle()}>
        <MapPin size={18} style={{ color: 'rgb(var(--color-success-rgb))' }} />
        Step 4: Address Information
      </h3>

      {/* Current Address */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={14} /> Current Address
        </h4>
        <div style={gridStyle}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Address Line</label>
            <input type="text" name="currentAddress" value={formData.currentAddress} onChange={handleChange} className="form-control" placeholder="House/flat no, street, area" />
          </div>
          <div className="form-group">
            <label>City</label>
            <input type="text" name="currentCity" value={formData.currentCity} onChange={handleChange} className="form-control" placeholder="City" />
          </div>
          <div className="form-group">
            <label>State</label>
            <input type="text" name="currentState" value={formData.currentState} onChange={handleChange} className="form-control" placeholder="State" />
          </div>
          <div className="form-group">
            <label>Country</label>
            <input type="text" name="currentCountry" value={formData.currentCountry} onChange={handleChange} className="form-control" placeholder="Country" />
          </div>
          <div className="form-group">
            <label>Postal Code</label>
            <input type="text" name="currentPostalCode" value={formData.currentPostalCode} onChange={(e) => handleNumericChange(e, 6)} className="form-control" placeholder="6-digit code" />
          </div>
        </div>
      </div>

      {/* Same as checkbox */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', background: formData.sameAsPermanent ? 'rgba(var(--color-success-rgb), 0.08)' : 'transparent', border: '1px solid var(--border-glass)', transition: 'all 0.2s ease' }}>
        <input type="checkbox" name="sameAsPermanent" checked={formData.sameAsPermanent} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'rgb(var(--color-success-rgb))' }} />
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Same as Current Address</span>
      </label>

      {/* Permanent Address */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: formData.sameAsPermanent ? 0.5 : 1, pointerEvents: formData.sameAsPermanent ? 'none' : 'auto' }}>
        <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={14} /> Permanent Address
        </h4>
        <div style={gridStyle}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Address Line</label>
            <input type="text" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className="form-control" placeholder="House/flat no, street, area" />
          </div>
          <div className="form-group">
            <label>City</label>
            <input type="text" name="permanentCity" value={formData.permanentCity} onChange={handleChange} className="form-control" placeholder="City" />
          </div>
          <div className="form-group">
            <label>State</label>
            <input type="text" name="permanentState" value={formData.permanentState} onChange={handleChange} className="form-control" placeholder="State" />
          </div>
          <div className="form-group">
            <label>Country</label>
            <input type="text" name="permanentCountry" value={formData.permanentCountry} onChange={handleChange} className="form-control" placeholder="Country" />
          </div>
          <div className="form-group">
            <label>Postal Code</label>
            <input type="text" name="permanentPostalCode" value={formData.permanentPostalCode} onChange={(e) => handleNumericChange(e, 6)} className="form-control" placeholder="6-digit code" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={sectionHeaderStyle()}>
        <Award size={18} style={{ color: 'hsl(280, 80%, 55%)' }} />
        Step 5: Qualification Information
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Add multiple qualifications as needed. All fields are optional.</p>

      {qualifications.map((q, i) => (
        <div key={i} className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'hsl(280, 80%, 55%)' }}>Qualification #{i + 1}</span>
            {qualifications.length > 1 && (
              <button type="button" onClick={() => removeQualification(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                <Trash2 size={14} /> Remove
              </button>
            )}
          </div>
          <div style={gridStyle}>
            <div className="form-group">
              <label>Degree</label>
              <input type="text" value={q.degree} onChange={(e) => updateQualification(i, 'degree', e.target.value)} className="form-control" placeholder="e.g. B.Com, MBA" />
            </div>
            <div className="form-group">
              <label>Institution</label>
              <input type="text" value={q.institution} onChange={(e) => updateQualification(i, 'institution', e.target.value)} className="form-control" placeholder="Institution name" />
            </div>
            <div className="form-group">
              <label>Board/University</label>
              <input type="text" value={q.boardUniversity} onChange={(e) => updateQualification(i, 'boardUniversity', e.target.value)} className="form-control" placeholder="Board / University" />
            </div>
            <div className="form-group">
              <label>Year of Passing</label>
              <input type="text" value={q.year} onChange={(e) => updateQualification(i, 'year', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} className="form-control" placeholder="e.g. 2020" />
            </div>
            <div className="form-group">
              <label>Percentage/CGPA</label>
              <input type="text" value={q.percentage} onChange={(e) => updateQualification(i, 'percentage', e.target.value)} className="form-control" placeholder="e.g. 85% or 8.5" />
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={addQualification} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', alignSelf: 'flex-start', fontWeight: 600, cursor: 'pointer' }}>
        <Plus size={16} /> Add Another Qualification
      </button>
    </div>
  );

  const renderStep6 = () => (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={sectionHeaderStyle()}>
        <Clock size={18} style={{ color: 'rgb(var(--color-warning-rgb))' }} />
        Step 6: Experience Information
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Add previous work experience. All fields are optional.</p>

      <div className="form-group" style={{ maxWidth: '300px' }}>
        <label>Total Experience (in Years)</label>
        <input 
          type="text"
          name="experience"
          value={formData.experience || ''}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, experience: v }));
          }}
          className="form-control"
          placeholder="e.g. 5"
          maxLength={10}
          inputMode="numeric"
        />
      </div>

      {experiences.map((exp, i) => (
        <div key={i} className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'rgb(var(--color-warning-rgb))' }}>Experience #{i + 1}</span>
            {experiences.length > 1 && (
              <button type="button" onClick={() => removeExperience(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                <Trash2 size={14} /> Remove
              </button>
            )}
          </div>
          <div style={gridStyle}>
            <div className="form-group">
              <label>Organization</label>
              <input type="text" value={exp.organization} onChange={(e) => updateExperience(i, 'organization', e.target.value)} className="form-control" placeholder="Company / school name" />
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input type="text" value={exp.designation} onChange={(e) => updateExperience(i, 'designation', e.target.value)} className="form-control" placeholder="Job title" />
            </div>
            <div className="form-group">
              <label>From Date</label>
              <input type="date" value={exp.fromDate} onChange={(e) => updateExperience(i, 'fromDate', e.target.value)} max={new Date().toLocaleDateString('en-CA')} className="form-control" />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input type="date" value={exp.toDate} onChange={(e) => updateExperience(i, 'toDate', e.target.value)} max={new Date().toLocaleDateString('en-CA')} min={exp.fromDate} className="form-control" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Key Responsibilities</label>
              <input type="text" value={exp.responsibilities} onChange={(e) => updateExperience(i, 'responsibilities', e.target.value)} className="form-control" placeholder="Brief description of responsibilities" />
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={addExperience} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', alignSelf: 'flex-start', fontWeight: 600, cursor: 'pointer' }}>
        <Plus size={16} /> Add Another Experience
      </button>
    </div>
  );

  const renderStep7 = () => {
    const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ') || '—';
    const docUploads = [
      { key: 'aadhaarFile', label: 'Aadhaar Card' },
      { key: 'panFile', label: 'PAN Card' },
      { key: 'resumeFile', label: 'Resume / CV' },
      { key: 'qualificationFile', label: 'Qualification Certificate' },
      { key: 'experienceFile', label: 'Experience Letter' },
      { key: 'otherFile', label: 'Other Document' }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Document Uploads */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={sectionHeaderStyle()}>
            <Upload size={18} style={{ color: 'hsl(0, 80%, 55%)' }} />
            Document Uploads (Optional)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {docUploads.map(doc => (
              <div key={doc.key} className="form-group">
                <DragAndDropFile 
                  fieldName={doc.key}
                  label={doc.label}
                  file={files[doc.key] || (existingFiles[doc.key] ? { name: existingFiles[doc.key].split('/').pop() } : null)}
                  onFileChange={handleFileChange}
                  onRemove={removeFile}
                  accept="*"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Final Review */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={sectionHeaderStyle()}>
            <CheckCircle size={18} style={{ color: 'rgb(var(--color-success-rgb))' }} />
            Final Review
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Basic Info Card */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid hsl(var(--color-primary))' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 10px 0', color: 'hsl(var(--color-primary))' }}>Basic Information</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                <div><strong>Name:</strong> {fullName}</div>
                <div><strong>Staff ID:</strong> {staffId}</div>
                <div><strong>Gender:</strong> {formData.gender || '—'}</div>
                <div><strong>DOB:</strong> {formData.dob || '—'}</div>
                <div><strong>Blood Group:</strong> {formData.bloodGroup || '—'}</div>
                <div><strong>Nationality:</strong> {formData.nationality || '—'}</div>
              </div>
            </div>

            {/* Employment Card */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid hsl(var(--color-secondary))' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 10px 0', color: 'hsl(var(--color-secondary))' }}>Employment</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                <div><strong>Category:</strong> {formData.staffCategory || '—'}</div>
                <div><strong>Designation:</strong> {formData.designation || '—'}</div>
                <div><strong>Level:</strong> {formData.designationLevel || '—'}</div>
                <div><strong>Department:</strong> {formData.department || '—'}</div>
                <div><strong>Type:</strong> {formData.employmentType || '—'}</div>
                <div><strong>Joining:</strong> {formData.joiningDate || '—'}</div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid hsl(210, 90%, 55%)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 10px 0', color: 'hsl(210, 90%, 55%)' }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                <div><strong>Mobile:</strong> {formData.mobile || '—'}</div>
                <div><strong>Email:</strong> {formData.email || '—'}</div>
                <div><strong>Emergency:</strong> {formData.emergencyContactNumber || '—'}</div>
              </div>
            </div>

            {/* Address Card */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid rgb(var(--color-success-rgb))' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 10px 0', color: 'rgb(var(--color-success-rgb))' }}>Address</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                <div><strong>Current:</strong> {[formData.currentAddress, formData.currentCity, formData.currentState].filter(Boolean).join(', ') || '—'}</div>
                <div><strong>Permanent:</strong> {formData.sameAsPermanent ? 'Same as current' : ([formData.permanentAddress, formData.permanentCity, formData.permanentState].filter(Boolean).join(', ') || '—')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="animate-slide-up no-card-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Success Toast */}
      {false && successToast && (
        <div className="glass-panel" style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 99999,
          background: 'rgba(var(--color-success-rgb), 0.95)', color: 'white',
          padding: '16px 24px', borderRadius: '12px', display: 'flex',
          alignItems: 'center', gap: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          animation: 'slide-up 0.3s ease'
        }}>
          <CheckCircle size={24} />
          <div>
            <strong style={{ display: 'block' }}>{editData ? 'Changes Saved!' : 'Staff Registered!'}</strong>
            <span style={{ fontSize: '0.8rem' }}>{editData ? 'Staff profile updated successfully.' : 'Staff member added to the directory.'}</span>
          </div>
        </div>
      )}

      {/* Stepper Header (Desktop view) */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '800px', padding: '0 10px' }}>
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <React.Fragment key={step.id}>
                <div 
                  onClick={() => {
                    setCurrentStep(step.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '8px', 
                    cursor: 'pointer',
                    opacity: isActive ? 1 : 0.6,
                    transition: 'opacity 0.3s'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isActive 
                      ? 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-secondary)) 100%)' 
                      : isCompleted 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : 'var(--bg-form)',
                    border: isActive 
                      ? 'none' 
                      : isCompleted 
                        ? '1px solid rgb(16, 185, 129)' 
                        : '1px solid var(--border-glass)',
                    color: isActive 
                      ? 'white' 
                      : isCompleted 
                        ? 'rgb(16, 185, 129)' 
                        : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}>
                    {isCompleted ? <CheckCircle size={16} /> : step.id}
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'hsl(var(--color-primary))' : 'var(--text-muted)',
                    whiteSpace: 'nowrap'
                  }}>
                    {step.label}
                  </span>
                </div>
                
                {index < STEPS.length - 1 && (
                  <div style={{ 
                    flex: 1, 
                    height: '2px', 
                    background: isCompleted ? 'rgb(16, 185, 129)' : 'var(--border-glass)', 
                    margin: '0 12px',
                    alignSelf: 'center',
                    minWidth: '20px'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Active Step Progress Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {STEPS[currentStep - 1].label}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Step {currentStep} of 7 — Complete fields to advance.
          </p>
        </div>
        
        {/* Reset Draft Button */}
        {!editData && (
          <button 
            type="button" 
            onClick={resetForm}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
          >
            <RotateCcw size={12} /> Reset Draft
          </button>
        )}
      </div>

      {/* Current Step Content */}
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="add-teacher-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
          {currentStep === 7 && renderStep7()}

          {/* Navigation Footer */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between', marginTop: '10px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <button type="button" onClick={() => setActiveView('staff')} className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
            <div>
              {currentStep < STEPS.length ? (
                <button type="button" onClick={nextStep} className="btn-primary" style={{ padding: '12px 28px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} className="btn-primary" disabled={loading} style={{ padding: '12px 28px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer', minWidth: '180px', justifyContent: 'center' }}>
                  {loading ? (<><Loader2 size={16} className="animate-spin" /> {editData ? 'Saving...' : 'Submitting...'}</>) : (<><Save size={16} /> {editData ? 'Save Changes' : 'Submit'}</>)}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

