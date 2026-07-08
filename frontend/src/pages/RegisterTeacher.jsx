import React, { useState, useEffect } from 'react';
import './AddStaff.css';
import { fetchActiveGrades, fetchActiveSections } from '../utils/grades';
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
  AlertTriangle,
  Trash2,
  Plus,
  X
} from 'lucide-react';

// Custom Reusable Searchable Dropdown Select Component
function SearchableSelect({ options, value, onChange, placeholder, className, style, error }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const activeLabel = options.find(opt => opt.value === value)?.label || '';

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = () => setIsOpen(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', width: '100%' }} onClick={(e) => e.stopPropagation()}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={className}
        style={{ 
          ...style, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          borderColor: error ? '#ef4444' : style?.borderColor
        }}
      >
        <span style={{ color: activeLabel ? 'var(--text-main)' : '#94a3b8' }}>
          {activeLabel || placeholder || 'Select Option'}
        </span>
        <ChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)', transition: '0.2s' }} />
      </div>
      {isOpen && (
        <div className="glass-panel" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          background: 'var(--bg-dropdown)', marginTop: '6px',
          maxHeight: '200px', overflowY: 'auto',
          padding: '8px', boxShadow: 'var(--shadow-lg)'
        }}>
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: '1px solid var(--border-glass)', background: 'var(--bg-surface)',
              color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', marginBottom: '4px'
            }}
            autoFocus
          />
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <div 
                key={opt.value} 
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                style={{
                  padding: '10px 12px', borderRadius: '6px', cursor: 'pointer',
                  background: value === opt.value ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: value === opt.value ? 'rgb(99, 102, 241)' : 'var(--text-main)',
                  fontWeight: value === opt.value ? '600' : 'normal', fontSize: '0.85rem'
                }}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No matches found</div>
          )}
        </div>
      )}
    </div>
  );
}

// Drag & Drop File Upload Component
function DragAndDropFile({ fieldName, label, file, onFileChange, onRemove, accept = "*" }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") { setDragOver(true); }
    else if (e.type === "dragleave") { setDragOver(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
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
      onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
      style={{
        padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px',
        background: dragOver ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.01)',
        border: dragOver ? '2px dashed rgb(99, 102, 241)' : '1px solid var(--border-glass)',
        transition: 'all 0.3s ease', minHeight: '120px', justifyContent: 'center'
      }}
    >
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{label}</span>
      
      {!file ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
          <Upload size={20} style={{ color: 'var(--text-muted)' }} />
          <label htmlFor={fieldName} style={{ color: 'hsl(var(--color-primary))', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            Upload File <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>or drag here</span>
          </label>
          <input type="file" id={fieldName} accept={accept} onChange={(e) => onFileChange(e, fieldName)} style={{ display: 'none' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max 50MB</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '0.75rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={12} style={{ color: 'rgb(99, 102, 241)' }} /> {file.name}
          </span>
          <button type="button" onClick={() => onRemove(fieldName)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

let teacherFilesCache = {
  photo: null, aadhaarFile: null, panFile: null, resumeFile: null,
  qualificationFile: null, experienceFile: null, joiningLetterFile: null, otherFile: null
};

export default function RegisterTeacher({ setActiveView, editData }) {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [draftRestoredAlert, setDraftRestoredAlert] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const isSubmitting = React.useRef(false);

  const [activeGrades, setActiveGrades] = useState([]);
  const [activeSections, setActiveSections] = useState([]);

  useEffect(() => {
    const loadGradesAndSections = async () => {
      try {
        const grades = await fetchActiveGrades();
        setActiveGrades(grades);
        const sections = await fetchActiveSections();
        setActiveSections(sections);
      } catch (err) {
        console.error('Error fetching grades/sections in teacher wizard:', err);
      }
    };
    loadGradesAndSections();
  }, []);

  const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';
  const draftKey = `teacher_register_draft_${tenantSubdomain}`;

  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '', fullName: '',
    gender: '', dob: '', bloodGroup: '', nationality: 'Indian', maritalStatus: '',
    aadhaarNumber: '', panNumber: '',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: '', department: '', primarySubject: '', secondarySubject: '', status: 'Active',
    mobile: '', alternateMobile: '', email: '', password: '', emergencyContactNumber: '',
    currentAddress: '', currentCity: '', currentState: '', currentCountry: 'India', currentPostalCode: '',
    permanentAddress: '', permanentCity: '', permanentState: '', permanentCountry: 'India', permanentPostalCode: '',
    sameAsPermanent: false,
    assignedGradeId: '',
    assignedSectionId: '',
    isClassTeacher: false,
    attendancePermission: false,
    qualifications: [
      { degree: 'B.Ed', institution: '', board: '', year: '', percentage: '' },
      { degree: 'M.Ed', institution: '', board: '', year: '', percentage: '' },
      { degree: 'B.Sc', institution: '', board: '', year: '', percentage: '' },
      { degree: 'M.Sc', institution: '', board: '', year: '', percentage: '' }
    ],
    experience: '',
    experiences: [{ schoolName: '', designation: '', duration: '', reason: '' }]
  });

  const [files, setFiles] = useState(teacherFilesCache);
  useEffect(() => { Object.assign(teacherFilesCache, files); }, [files]);

  const [formErrors, setFormErrors] = useState({});
  const [existingFiles, setExistingFiles] = useState({});

  const genderOptions = [
    { value: '', label: 'None' },
    { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }
  ];
  const bloodGroupOptions = [
    { value: '', label: 'None' },
    { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' }, { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }
  ];
  const maritalStatusOptions = [
    { value: '', label: 'None' },
    { value: 'Single', label: 'Single' }, { value: 'Married', label: 'Married' },
    { value: 'Divorced', label: 'Divorced' }, { value: 'Widowed', label: 'Widowed' }, { value: 'Other', label: 'Other' }
  ];
  const employmentTypeOptions = [
    { value: '', label: 'None' },
    { value: 'Full Time', label: 'Full Time' }, { value: 'Part Time', label: 'Part Time' },
    { value: 'Contract', label: 'Contract' }, { value: 'Visiting Faculty', label: 'Visiting Faculty' }
  ];
  const statusOptions = [
    { value: '', label: 'None' },
    { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }
  ];

  const [departmentOptions, setDepartmentOptions] = useState([]);

  useEffect(() => {
    fetch('/api/grades/departments')
      .then(res => res.json())
      .then(data => {
        const activeDepts = data.filter(d => d.status === 'Active' || !d.status);
        setDepartmentOptions([{ value: '', label: 'None' }, ...activeDepts.map(d => ({ value: d.name, label: d.name }))]);
      })
      .catch(err => console.error('Error fetching departments:', err));
  }, []);

  useEffect(() => {
    if (editData) {
      setExistingFiles({
        photo: editData.photo || '', aadhaarFile: editData.aadhaarFile || '',
        panFile: editData.panFile || '', resumeFile: editData.resumeFile || '',
        qualificationFile: editData.qualificationFile || '', experienceFile: editData.experienceFile || '',
        joiningLetterFile: editData.joiningLetterFile || '', otherFile: editData.otherFile || ''
      });
    }
  }, [editData]);

  // Draft auto-load
  useEffect(() => {
    if (editData) return;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...parsed }));
        setDraftRestoredAlert(true);
        setTimeout(() => setDraftRestoredAlert(false), 5000);
      } catch (err) { console.error('Failed to restore draft:', err); }
    }
  }, [editData]);

  // Draft auto-save
  useEffect(() => {
    if (editData) return;
    const hasAnyContent = Object.keys(formData).some(key => {
      if (['nationality', 'currentCountry', 'permanentCountry', 'joiningDate', 'sameAsPermanent', 'status', 'qualifications', 'experiences', 'isClassTeacher', 'attendancePermission'].includes(key)) return false;
      return formData[key] !== '' && formData[key] !== false && formData[key] !== null;
    });
    if (hasAnyContent) {
      const serialized = JSON.stringify(formData);
      const existing = localStorage.getItem(draftKey);
      if (existing !== serialized) {
        setDraftSaving(true);
        localStorage.setItem(draftKey, serialized);
        const timer = setTimeout(() => setDraftSaving(false), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [formData, editData]);

  // Populate from editData
  useEffect(() => {
    if (editData && Object.keys(editData).length > 0) {
      let parsedQualifications = editData.qualification || editData.qualifications || [];
      if (typeof parsedQualifications === 'string') { try { parsedQualifications = JSON.parse(parsedQualifications); } catch(e) { parsedQualifications = []; } }
      if (!Array.isArray(parsedQualifications)) parsedQualifications = [];
      if (parsedQualifications.length === 0) {
        parsedQualifications = [
          { degree: 'B.Ed', institution: '', board: '', year: '', percentage: '' },
          { degree: 'M.Ed', institution: '', board: '', year: '', percentage: '' },
          { degree: 'B.Sc', institution: '', board: '', year: '', percentage: '' },
          { degree: 'M.Sc', institution: '', board: '', year: '', percentage: '' }
        ];
      }

      let parsedExperiences = editData.experiences || [];
      if (typeof parsedExperiences === 'string') { try { parsedExperiences = JSON.parse(parsedExperiences); } catch(e) { parsedExperiences = []; } }
      if (!Array.isArray(parsedExperiences)) parsedExperiences = [];
      if (parsedExperiences.length === 0) parsedExperiences = [{ schoolName: '', designation: '', duration: '', reason: '' }];

      setFormData({
        firstName: editData.firstName || '', middleName: editData.middleName || '', lastName: editData.lastName || '',
        fullName: editData.fullName || editData.name || '',
        gender: editData.gender || '', dob: editData.dob ? editData.dob.split(/[ T]/)[0] : '',
        bloodGroup: editData.bloodGroup || '', nationality: editData.nationality || 'Indian',
        maritalStatus: editData.maritalStatus || '',
        aadhaarNumber: editData.aadhaarNumber || '', panNumber: editData.panNumber || '',
        joiningDate: editData.joiningDate ? editData.joiningDate.split(/[ T]/)[0] : '',
        employmentType: editData.employmentType || '',
        department: editData.department || '',
        primarySubject: editData.primarySubject || editData.subject || editData.subjectSpecialization || '',
        secondarySubject: editData.secondarySubject || '', status: editData.status || 'Active',
        mobile: editData.mobile || editData.phone || '', alternateMobile: editData.alternateMobile || '',
        email: editData.email || '', password: editData.password || '',
        emergencyContactNumber: editData.emergencyContactNumber || '',
        assignedGradeId: editData.assignedGradeId || '',
        assignedSectionId: editData.assignedSectionId || '',
        isClassTeacher: editData.isClassTeacher === true || editData.isClassTeacher === 'true' || editData.isClassTeacher === 1 || editData.isClassTeacher === 'Yes',
        attendancePermission: editData.attendancePermission === true || editData.attendancePermission === 'true' || editData.attendancePermission === 1 || editData.attendancePermission === 'Yes',
        currentAddress: editData.currentAddress || '', currentCity: editData.currentCity || '',
        currentState: editData.currentState || '', currentCountry: editData.currentCountry || 'India',
        currentPostalCode: editData.currentPostalCode || '',
        permanentAddress: editData.permanentAddress || '', permanentCity: editData.permanentCity || '',
        permanentState: editData.permanentState || '', permanentCountry: editData.permanentCountry || 'India',
        permanentPostalCode: editData.permanentPostalCode || '',
        sameAsPermanent: editData.sameAsPermanent === true || editData.sameAsPermanent === 'true' || editData.sameAsPermanent === 'Yes',
        qualifications: parsedQualifications, experience: editData.experience || '', experiences: parsedExperiences
      });
    }
  }, [editData]);

  const clearDraft = () => localStorage.removeItem(draftKey);

  // Address copy handler
  useEffect(() => {
    if (formData.sameAsPermanent) {
      setFormData(prev => ({
        ...prev,
        currentAddress: prev.permanentAddress, currentCity: prev.permanentCity,
        currentState: prev.permanentState, currentCountry: prev.permanentCountry,
        currentPostalCode: prev.permanentPostalCode
      }));
    }
  }, [formData.sameAsPermanent, formData.permanentAddress, formData.permanentCity, formData.permanentState, formData.permanentCountry, formData.permanentPostalCode]);

  const handleTextChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (name === 'firstName' || name === 'middleName' || name === 'lastName') {
      val = val.replace(/[^A-Za-z\s]/g, '').slice(0, 50);
    }
    if (name === 'panNumber') val = val.toUpperCase().slice(0, 10);
    if (name === 'experience') val = val.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData(prev => {
      const updated = { ...prev, [name]: val };
      if (['firstName', 'middleName', 'lastName'].includes(name)) {
        updated.fullName = [updated.firstName, updated.middleName, updated.lastName].filter(Boolean).join(' ');
      }
      return updated;
    });
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleMobileChange = (e) => {
    const { name, value } = e.target;
    const cleanVal = value.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, [name]: cleanVal }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAadhaarChange = (e) => {
    const cleanVal = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
    setFormData(prev => ({ ...prev, aadhaarNumber: cleanVal }));
    if (formErrors.aadhaarNumber) setFormErrors(prev => ({ ...prev, aadhaarNumber: '' }));
  };

  const handlePincodeChange = (e) => {
    const { name, value } = e.target;
    const cleanVal = value.replace(/[^0-9]/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, [name]: cleanVal }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (formErrors[fieldName]) setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  // Qualifications handlers
  const handleQualChange = (index, field, value) => {
    const updatedQuals = [...formData.qualifications];
    let val = value;
    if (field === 'percentage') {
      val = val.replace(/[^0-9.%]/g, '');
    }
    updatedQuals[index][field] = val;
    setFormData(prev => ({ ...prev, qualifications: updatedQuals }));
  };
  const addQualRow = () => setFormData(prev => ({ ...prev, qualifications: [...prev.qualifications, { degree: '', institution: '', board: '', year: '', percentage: '' }] }));
  const removeQualRow = (index) => setFormData(prev => ({ ...prev, qualifications: prev.qualifications.filter((_, idx) => idx !== index) }));

  // Experience handlers
  const handleExpChange = (index, field, value) => {
    const updatedExps = [...formData.experiences];
    updatedExps[index][field] = value;
    setFormData(prev => ({ ...prev, experiences: updatedExps }));
  };
  const addExpRow = () => setFormData(prev => ({ ...prev, experiences: [...prev.experiences, { schoolName: '', designation: '', duration: '', reason: '' }] }));
  const removeExpRow = (index) => setFormData(prev => ({ ...prev, experiences: prev.experiences.filter((_, idx) => idx !== index) }));

  // File handlers
  const handleFileChange = (e, fieldName) => { const file = e.target.files[0]; if (!file) return; setFiles(prev => ({ ...prev, [fieldName]: file })); };
  const removeFile = (fieldName) => { setFiles(prev => ({ ...prev, [fieldName]: null })); const el = document.getElementById(fieldName); if (el) el.value = ''; };

  // Navigation
  const handleNext = () => { if (validateStep(activeStep)) { setActiveStep(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const handlePrev = () => { setActiveStep(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // Step validator
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formData.firstName.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
      if (!formData.gender) errors.gender = 'Gender is required';
      if (!formData.dob) errors.dob = 'Date of birth is required';
      if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber.replace(/\s/g, ''))) errors.aadhaarNumber = 'Aadhaar must be 12 digits';
      if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) errors.panNumber = 'PAN format: ABCDE1234F';
    }
    if (step === 3) {
      if (formData.mobile && formData.mobile.length !== 10) errors.mobile = 'Mobile must be 10 digits';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const performReset = () => {
    clearDraft();
    setFormData({
      firstName: '', middleName: '', lastName: '', fullName: '', gender: '', dob: '', bloodGroup: '',
      nationality: 'Indian', maritalStatus: '', aadhaarNumber: '', panNumber: '',
      joiningDate: new Date().toISOString().split('T')[0],
      employmentType: '', department: '', primarySubject: '', secondarySubject: '', status: 'Active',
      mobile: '', alternateMobile: '', email: '', password: '', emergencyContactNumber: '',
      currentAddress: '', currentCity: '', currentState: '', currentCountry: 'India', currentPostalCode: '',
      permanentAddress: '', permanentCity: '', permanentState: '', permanentCountry: 'India', permanentPostalCode: '',
      sameAsPermanent: false,
      qualifications: [
        { degree: 'B.Ed', institution: '', board: '', year: '', percentage: '' },
        { degree: 'M.Ed', institution: '', board: '', year: '', percentage: '' },
        { degree: 'B.Sc', institution: '', board: '', year: '', percentage: '' },
        { degree: 'M.Sc', institution: '', board: '', year: '', percentage: '' }
      ],
      experience: '', experiences: [{ schoolName: '', designation: '', duration: '', reason: '' }]
    });
    setFiles({ photo: null, aadhaarFile: null, panFile: null, resumeFile: null, qualificationFile: null, experienceFile: null, joiningLetterFile: null, otherFile: null });
    setFormErrors({});
    setFormSubmitted(false);
    setActiveStep(1);
  };

  const resetForm = () => {
    if (window.confirm("Are you sure you want to clear the entire form and draft data?")) {
      performReset();
    }
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter') {
      const targetTag = e.target.tagName.toLowerCase();
      if (targetTag !== 'textarea' && e.target.type !== 'submit') e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setFormSubmitted(true);

    let isValid = true;
    for (let step = 1; step <= 7; step++) {
      if (!validateStep(step)) { setActiveStep(step); isValid = false; break; }
    }
    if (!isValid) { isSubmitting.current = false; return; }

    setLoading(true);
    try {
      const dataObj = new FormData();
      // Teacher-specific: set designation to Teacher
      dataObj.append('designation', 'Teacher');
      Object.keys(formData).forEach(key => {
        if (key === 'qualifications') {
          dataObj.append('qualification', JSON.stringify(formData[key]));
          dataObj.append('qualifications', JSON.stringify(formData[key]));
        } else if (key === 'experiences') {
          dataObj.append(key, JSON.stringify(formData[key]));
        } else {
          dataObj.append(key, formData[key]);
        }
      });

      Object.keys(files).forEach(key => { if (files[key]) dataObj.append(key, files[key]); });

      const url = editData ? `/api/teachers/${editData.employeeId || editData.id}` : '/api/teachers';
      const method = editData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'x-tenant-id': tenantSubdomain },
        body: dataObj
      });

      if (res.ok) {
        performReset();
        setActiveStep(1);
        setLoading(false);
        isSubmitting.current = false;
        if (editData && typeof setActiveView === 'function') {
          setActiveView('teachers');
        }
      } else {
        const errData = await res.json();
        const detailsMsg = errData.details ? `: ${errData.details}` : '';
        alert(`${errData.error || 'Server error occurred during teacher registration.'}${detailsMsg}`);
        setLoading(false);
        isSubmitting.current = false;
      }
    } catch (err) {
      console.error(err);
      alert('Internal Server error connecting to the API.');
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const steps = [
    { num: 1, label: 'Basic Info', icon: <User size={16} /> },
    { num: 2, label: 'Professional', icon: <Briefcase size={16} /> },
    { num: 3, label: 'Contact Details', icon: <Phone size={16} /> },
    { num: 4, label: 'Address Info', icon: <MapPin size={16} /> },
    { num: 5, label: 'Qualifications', icon: <Award size={16} /> },
    { num: 6, label: 'Experience', icon: <Clock size={16} /> },
    { num: 7, label: 'Documents', icon: <Upload size={16} /> },
    { num: 8, label: 'Final Review', icon: <CheckCircle size={16} /> }
  ];

  // ==========================================
  // Field style helpers
  // ==========================================
  const inputStyle = { padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.85rem', width: '100%', outline: 'none', transition: '0.2s' };
  const errorInputStyle = { ...inputStyle, borderColor: '#ef4444' };
  const labelStyle = { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', display: 'block' };

  return (
    <div className="animate-slide-up no-card-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {draftSaving && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 99999,
          background: 'rgba(99, 102, 241, 0.95)', color: 'white',
          padding: '10px 18px', borderRadius: '8px', fontSize: '0.8rem',
          fontWeight: 600, boxShadow: 'var(--shadow-md)', display: 'flex',
          alignItems: 'center', gap: '8px', pointerEvents: 'none'
        }}>
          <RotateCcw size={14} className="animate-spin" /> Saving Draft progress...
        </div>
      )}

      {draftRestoredAlert && (
        <div className="glass-panel animate-slide-down" style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
          background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600,
          color: 'hsl(var(--color-primary))'
        }}>
          <AlertCircle size={16} /> Draft restored from your previous session. Continue editing or reset.
        </div>
      )}

      {/* Step Progress */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', overflowX: 'auto' }}>
          {steps.map((s) => (
            <div key={s.num} onClick={() => setActiveStep(s.num)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                cursor: 'pointer', opacity: 1,
                transition: '0.3s', flex: 1, minWidth: '70px'
              }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: s.num === activeStep ? 'hsl(var(--color-primary))' : s.num < activeStep ? 'rgb(var(--color-success-rgb))' : 'var(--bg-surface)',
                color: (s.num === activeStep || s.num < activeStep) ? 'white' : 'var(--text-muted)',
                border: s.num === activeStep ? 'none' : '1px solid var(--border-glass)',
                transition: '0.3s', fontSize: '0.75rem', fontWeight: 700
              }}>
                {s.num < activeStep ? <CheckCircle size={16} /> : s.icon}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: s.num === activeStep ? 'hsl(var(--color-primary))' : 'var(--text-muted)', textAlign: 'center' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* STEP 1: Basic Information */}
          {activeStep === 1 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Basic Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div><label style={labelStyle}>First Name *</label><input name="firstName" value={formData.firstName} onChange={handleTextChange} style={formErrors.firstName ? errorInputStyle : inputStyle} placeholder="Enter first name" />{formErrors.firstName && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{formErrors.firstName}</span>}</div>
                <div><label style={labelStyle}>Middle Name</label><input name="middleName" value={formData.middleName} onChange={handleTextChange} style={inputStyle} placeholder="Enter middle name" /></div>
                <div><label style={labelStyle}>Last Name *</label><input name="lastName" value={formData.lastName} onChange={handleTextChange} style={formErrors.lastName ? errorInputStyle : inputStyle} placeholder="Enter last name" />{formErrors.lastName && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{formErrors.lastName}</span>}</div>
                <div><label style={labelStyle}>Gender *</label><SearchableSelect options={genderOptions} value={formData.gender} onChange={(v) => handleSelectChange('gender', v)} placeholder="Select Gender" className="form-control" style={inputStyle} error={formErrors.gender} />{formErrors.gender && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{formErrors.gender}</span>}</div>
                <div><label style={labelStyle}>Date of Birth *</label><input type="date" name="dob" value={formData.dob} onChange={handleTextChange} style={formErrors.dob ? errorInputStyle : inputStyle} />{formErrors.dob && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{formErrors.dob}</span>}</div>
                <div><label style={labelStyle}>Blood Group</label><SearchableSelect options={bloodGroupOptions} value={formData.bloodGroup} onChange={(v) => handleSelectChange('bloodGroup', v)} placeholder="Select Blood Group" className="form-control" style={inputStyle} /></div>
                <div><label style={labelStyle}>Nationality</label><input name="nationality" value={formData.nationality} onChange={handleTextChange} style={inputStyle} /></div>
                <div><label style={labelStyle}>Marital Status</label><SearchableSelect options={maritalStatusOptions} value={formData.maritalStatus} onChange={(v) => handleSelectChange('maritalStatus', v)} placeholder="Select" className="form-control" style={inputStyle} /></div>
                <div><label style={labelStyle}>Aadhaar Number</label><input name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleAadhaarChange} style={formErrors.aadhaarNumber ? errorInputStyle : inputStyle} placeholder="12-digit Aadhaar" maxLength={12} />{formErrors.aadhaarNumber && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{formErrors.aadhaarNumber}</span>}</div>
                <div><label style={labelStyle}>PAN Number</label><input name="panNumber" value={formData.panNumber} onChange={handleTextChange} style={formErrors.panNumber ? errorInputStyle : inputStyle} placeholder="ABCDE1234F" maxLength={10} />{formErrors.panNumber && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{formErrors.panNumber}</span>}</div>
              </div>
            </div>
          )}

          {/* STEP 2: Professional Information */}
          {activeStep === 2 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Professional Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div><label style={labelStyle}>Joining Date</label><input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleTextChange} style={inputStyle} /></div>
                <div><label style={labelStyle}>Employment Type</label><SearchableSelect options={employmentTypeOptions} value={formData.employmentType} onChange={(v) => handleSelectChange('employmentType', v)} placeholder="Select Type" className="form-control" style={inputStyle} /></div>
                <div>
                  <label style={labelStyle}>Designation</label>
                  <div style={{ ...inputStyle, background: 'rgba(99, 102, 241, 0.08)', fontWeight: 700, color: 'hsl(var(--color-primary))' }}>Teacher</div>
                </div>
                <div><label style={labelStyle}>Department</label><SearchableSelect options={departmentOptions} value={formData.department} onChange={(v) => handleSelectChange('department', v)} placeholder="Select Department" className="form-control" style={inputStyle} /></div>
                <div><label style={labelStyle}>Status</label><SearchableSelect options={statusOptions} value={formData.status} onChange={(v) => handleSelectChange('status', v)} placeholder="Select" className="form-control" style={inputStyle} /></div>
                <div><label style={labelStyle}>Subjects</label><input name="primarySubject" value={formData.primarySubject} onChange={handleTextChange} style={inputStyle} placeholder="e.g. Mathematics, Science" /></div>
                
                {(() => {
                  const gradeOptions = [
                    { value: '', label: 'None' },
                    ...activeGrades.map(g => ({ value: g.name, label: g.name }))
                  ];
                  const matchedGrade = activeGrades.find(g => g.name === formData.assignedGradeId);
                  const sectionsList = matchedGrade ? (matchedGrade.sections || []) : [];
                  const sectionOptions = [
                    { value: '', label: 'None' },
                    ...sectionsList.map(secName => ({ value: secName, label: `Section ${secName}` }))
                  ];
                  const yesNoOptions = [
                    { value: false, label: 'No' },
                    { value: true, label: 'Yes' }
                  ];

                  return (
                    <>
                      <div>
                        <label style={labelStyle}>Is Class Teacher?</label>
                        <SearchableSelect 
                          options={yesNoOptions} 
                          value={formData.isClassTeacher} 
                          onChange={(v) => {
                            setFormData(prev => ({
                              ...prev,
                              isClassTeacher: v,
                              attendancePermission: v, // Match attendance permission to isClassTeacher status
                              assignedGradeId: v ? prev.assignedGradeId : '',
                              assignedSectionId: v ? prev.assignedSectionId : ''
                            }));
                          }} 
                          placeholder="Select" 
                          className="form-control" 
                          style={inputStyle} 
                        />
                      </div>

                      {formData.isClassTeacher && (
                        <>
                          <div>
                            <label style={labelStyle}>Assigned Grade</label>
                            <SearchableSelect 
                              options={gradeOptions} 
                              value={formData.assignedGradeId} 
                              onChange={(v) => {
                                setFormData(prev => ({
                                  ...prev,
                                  assignedGradeId: v,
                                  assignedSectionId: '' // reset section
                                }));
                              }} 
                              placeholder="Select Grade" 
                              className="form-control" 
                              style={inputStyle} 
                            />
                          </div>

                          <div>
                            <label style={labelStyle}>Assigned Section</label>
                            <SearchableSelect 
                              options={sectionOptions} 
                              value={formData.assignedSectionId} 
                              onChange={(v) => handleSelectChange('assignedSectionId', v)} 
                              placeholder={formData.assignedGradeId ? "Select Section" : "Select Grade First"} 
                              className="form-control" 
                              style={inputStyle} 
                              error={!formData.assignedGradeId ? "Select Grade first" : undefined}
                            />
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* STEP 3: Contact Details */}
          {activeStep === 3 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Contact Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div><label style={labelStyle}>Mobile Number *</label><input name="mobile" value={formData.mobile} onChange={handleMobileChange} style={formErrors.mobile ? errorInputStyle : inputStyle} placeholder="10-digit mobile" maxLength={10} />{formErrors.mobile && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{formErrors.mobile}</span>}</div>
                <div><label style={labelStyle}>Alternate Mobile</label><input name="alternateMobile" value={formData.alternateMobile} onChange={handleMobileChange} style={inputStyle} placeholder="10-digit mobile" maxLength={10} /></div>
                <div><label style={labelStyle}>Email *</label><input type="email" name="email" value={formData.email} onChange={handleTextChange} style={formErrors.email ? errorInputStyle : inputStyle} placeholder="teacher@school.com" />{formErrors.email && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{formErrors.email}</span>}</div>
                <div><label style={labelStyle}>Password (Login)</label><input type="text" name="password" value={formData.password} onChange={handleTextChange} style={inputStyle} placeholder="Default: teacher123" /></div>
                <div><label style={labelStyle}>Emergency Contact</label><input name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={handleMobileChange} style={inputStyle} placeholder="10-digit number" maxLength={10} /></div>
              </div>
            </div>
          )}

          {/* STEP 4: Address Information */}
          {activeStep === 4 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Address Information
              </h3>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>Permanent Address</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address Line</label><input name="permanentAddress" value={formData.permanentAddress} onChange={handleTextChange} style={inputStyle} placeholder="House No, Street" /></div>
                <div><label style={labelStyle}>City</label><input name="permanentCity" value={formData.permanentCity} onChange={handleTextChange} style={inputStyle} placeholder="City" /></div>
                <div><label style={labelStyle}>State</label><input name="permanentState" value={formData.permanentState} onChange={handleTextChange} style={inputStyle} placeholder="State" /></div>
                <div><label style={labelStyle}>Country</label><input name="permanentCountry" value={formData.permanentCountry} onChange={handleTextChange} style={inputStyle} /></div>
                <div><label style={labelStyle}>Postal Code</label><input name="permanentPostalCode" value={formData.permanentPostalCode} onChange={handlePincodeChange} style={inputStyle} placeholder="6-digit PIN" maxLength={6} /></div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                <input type="checkbox" name="sameAsPermanent" checked={formData.sameAsPermanent} onChange={handleTextChange} id="sameAsPermanent" style={{ width: '16px', height: '16px' }} />
                <label htmlFor="sameAsPermanent" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>Current address is same as permanent</label>
              </div>

              {!formData.sameAsPermanent && (
                <>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>Current Address</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address Line</label><input name="currentAddress" value={formData.currentAddress} onChange={handleTextChange} style={inputStyle} placeholder="House No, Street" /></div>
                    <div><label style={labelStyle}>City</label><input name="currentCity" value={formData.currentCity} onChange={handleTextChange} style={inputStyle} placeholder="City" /></div>
                    <div><label style={labelStyle}>State</label><input name="currentState" value={formData.currentState} onChange={handleTextChange} style={inputStyle} placeholder="State" /></div>
                    <div><label style={labelStyle}>Country</label><input name="currentCountry" value={formData.currentCountry} onChange={handleTextChange} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Postal Code</label><input name="currentPostalCode" value={formData.currentPostalCode} onChange={handlePincodeChange} style={inputStyle} placeholder="6-digit PIN" maxLength={6} /></div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 5: Qualifications */}
          {activeStep === 5 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Academic Qualifications
              </h3>
              <div className="custom-table-container">
                <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Degree / Course</th>
                      <th>Institution</th>
                      <th>Board / University</th>
                      <th>Year</th>
                      <th>Score / %</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.qualifications.map((q, idx) => (
                      <tr key={idx}>
                        <td><input value={q.degree} onChange={(e) => handleQualChange(idx, 'degree', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8rem' }} placeholder="B.Ed" /></td>
                        <td><input value={q.institution} onChange={(e) => handleQualChange(idx, 'institution', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8rem' }} placeholder="University" /></td>
                        <td><input value={q.board} onChange={(e) => handleQualChange(idx, 'board', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8rem' }} placeholder="Board" /></td>
                        <td><input value={q.year} onChange={(e) => handleQualChange(idx, 'year', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8rem', maxWidth: '80px' }} placeholder="2020" /></td>
                        <td><input value={q.percentage} onChange={(e) => handleQualChange(idx, 'percentage', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8rem', maxWidth: '80px' }} placeholder="85%" /></td>
                        <td style={{ textAlign: 'right' }}>
                          {formData.qualifications.length > 1 && (
                            <button type="button" onClick={() => removeQualRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addQualRow} className="btn-secondary" style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> Add Qualification
              </button>
            </div>
          )}

          {/* STEP 6: Experience */}
          {activeStep === 6 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Teaching Experience
              </h3>
              <div><label style={labelStyle}>Total Teaching Experience (in Years)</label><input name="experience" value={formData.experience} onChange={handleTextChange} style={inputStyle} placeholder="e.g. 5" maxLength={10} inputMode="numeric" /></div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>Previous Schools</h4>
              <div className="custom-table-container">
                <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>School Name</th>
                      <th>Designation</th>
                      <th>Duration</th>
                      <th>Reason for Leaving</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.experiences.map((exp, idx) => (
                      <tr key={idx}>
                        <td><input value={exp.schoolName} onChange={(e) => handleExpChange(idx, 'schoolName', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8rem' }} placeholder="School Name" /></td>
                        <td><input value={exp.designation} onChange={(e) => handleExpChange(idx, 'designation', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8rem' }} placeholder="Teacher" /></td>
                        <td><input value={exp.duration} onChange={(e) => handleExpChange(idx, 'duration', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8rem' }} placeholder="2 Years" /></td>
                        <td><input value={exp.reason} onChange={(e) => handleExpChange(idx, 'reason', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8rem' }} placeholder="Reason" /></td>
                        <td style={{ textAlign: 'right' }}>
                          {formData.experiences.length > 1 && (
                            <button type="button" onClick={() => removeExpRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addExpRow} className="btn-secondary" style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> Add Experience
              </button>
            </div>
          )}

          {/* STEP 7: Document Uploads */}
          {activeStep === 7 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Document Uploads
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <DragAndDropFile fieldName="photo" label="Passport Photo" file={files.photo} onFileChange={handleFileChange} onRemove={removeFile} accept="image/*" />
                <DragAndDropFile fieldName="aadhaarFile" label="Aadhaar Card" file={files.aadhaarFile} onFileChange={handleFileChange} onRemove={removeFile} accept=".pdf,.jpg,.jpeg,.png" />
                <DragAndDropFile fieldName="panFile" label="PAN Card" file={files.panFile} onFileChange={handleFileChange} onRemove={removeFile} accept=".pdf,.jpg,.jpeg,.png" />
                <DragAndDropFile fieldName="resumeFile" label="Resume / CV" file={files.resumeFile} onFileChange={handleFileChange} onRemove={removeFile} accept=".pdf,.doc,.docx" />
                <DragAndDropFile fieldName="qualificationFile" label="Qualification Certificate" file={files.qualificationFile} onFileChange={handleFileChange} onRemove={removeFile} accept=".pdf,.jpg,.jpeg,.png" />
                <DragAndDropFile fieldName="experienceFile" label="Experience Certificate" file={files.experienceFile} onFileChange={handleFileChange} onRemove={removeFile} accept=".pdf,.jpg,.jpeg,.png" />
                <DragAndDropFile fieldName="joiningLetterFile" label="Joining Letter" file={files.joiningLetterFile} onFileChange={handleFileChange} onRemove={removeFile} accept=".pdf,.jpg,.jpeg,.png" />
                <DragAndDropFile fieldName="otherFile" label="Other Document" file={files.otherFile} onFileChange={handleFileChange} onRemove={removeFile} />
              </div>
              {editData && Object.keys(existingFiles).some(k => existingFiles[k]) && (
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Previously Uploaded Files</span>
                  {Object.entries(existingFiles).filter(([, v]) => v).map(([key, path]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                      <FileText size={12} style={{ color: 'hsl(var(--color-primary))' }} />
                      <span style={{ fontWeight: 600 }}>{key}:</span>
                      <a href={path} target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--color-primary))', textDecoration: 'none' }}>View File</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 8: Final Review */}
          {activeStep === 8 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px', background: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.2)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} style={{ color: 'hsl(var(--color-warning))', flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Review Teacher Profile Ledger</strong>
                  <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>Please double-check all registered values below. Submitting will commit the record and auto-create login account details.</span>
                </div>
              </div>

              {/* Review Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                
                {/* Card 1: Basic Information */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--color-primary))', margin: 0 }}>Basic Profile</h4>
                    <button type="button" onClick={() => setActiveStep(1)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    <div><strong>Full Name:</strong> {formData.fullName || `${formData.firstName} ${formData.lastName}`}</div>
                    <div><strong>Gender / DOB:</strong> {formData.gender || 'N/A'} / {formData.dob || 'N/A'}</div>
                    <div><strong>Blood Group:</strong> {formData.bloodGroup || 'N/A'}</div>
                    <div><strong>Nationality:</strong> {formData.nationality || 'N/A'}</div>
                    <div><strong>Marital Status:</strong> {formData.maritalStatus || 'N/A'}</div>
                    <div><strong>Aadhaar / PAN Number:</strong> {formData.aadhaarNumber || 'N/A'} / {formData.panNumber || 'N/A'}</div>
                  </div>
                </div>

                {/* Card 2: Professional Information */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--color-info))', margin: 0 }}>Professional Details</h4>
                    <button type="button" onClick={() => setActiveStep(2)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    <div><strong>Role:</strong> Teacher</div>
                    <div><strong>Department:</strong> {formData.department || 'N/A'}</div>
                    <div><strong>Subjects:</strong> {formData.primarySubject || 'N/A'} {formData.secondarySubject ? `, ${formData.secondarySubject}` : ''}</div>
                    <div><strong>Type / Session:</strong> {formData.employmentType || 'N/A'} / {formData.joiningDate || 'N/A'}</div>
                    <div><strong>Status:</strong> {formData.status || 'Active'}</div>
                  </div>
                </div>

                {/* Card 3: Contact Details */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--color-secondary))', margin: 0 }}>Contact Details</h4>
                    <button type="button" onClick={() => setActiveStep(3)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    <div><strong>Mobile Number:</strong> {formData.mobile || 'N/A'} {formData.alternateMobile ? `/ ${formData.alternateMobile}` : ''}</div>
                    <div><strong>Email Address:</strong> {formData.email || 'N/A'}</div>
                    <div><strong>Emergency Number:</strong> {formData.emergencyContactNumber || 'N/A'}</div>
                    <div><strong>Portal Access:</strong> Credentials will be auto-generated</div>
                  </div>
                </div>

                {/* Card 4: Address Details */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'rgb(16, 185, 129)', margin: 0 }}>Residential Addresses</h4>
                    <button type="button" onClick={() => setActiveStep(4)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    <div><strong>Permanent:</strong> {formData.permanentAddress || 'N/A'} ({formData.permanentCity || 'N/A'}, {formData.permanentState || 'N/A'})</div>
                    <div><strong>Current Address:</strong> {formData.sameAsPermanent ? 'Same as Permanent' : `${formData.currentAddress || 'N/A'} (${formData.currentCity || 'N/A'}, ${formData.currentState || 'N/A'})`}</div>
                  </div>
                </div>

                {/* Card 5: Qualification & Experience summary */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'rgb(245, 158, 11)', margin: 0 }}>Qualification &amp; Experience</h4>
                    <button type="button" onClick={() => setActiveStep(5)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    <div><strong>Total Experience:</strong> {formData.experience || 'None listed'}</div>
                    <div><strong>Qualifications Count:</strong> {formData.qualifications ? formData.qualifications.filter(q => q.degree).length : 0} degrees filled</div>
                  </div>
                </div>

                {/* Card 6: Previous Experience History */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#0ea5e9', margin: 0 }}>Previous Experience History</h4>
                    <button type="button" onClick={() => setActiveStep(6)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    <div><strong>Prev History Count:</strong> {formData.experiences ? formData.experiences.filter(e => e.schoolName).length : 0} records filled</div>
                  </div>
                </div>

              </div>

              {/* Document checklist reviews */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>Uploaded Documents Review</h4>
                  <button type="button" onClick={() => setActiveStep(7)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.8rem' }}>
                  <div><strong>Photograph:</strong> {files.photo ? <span style={{ color: '#10b981' }}>✔ {files.photo.name}</span> : existingFiles.photo ? <span style={{ color: '#10b981' }}>✔ Existing Photo</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                  <div><strong>Aadhaar Card:</strong> {files.aadhaarFile ? <span>✔ {files.aadhaarFile.name}</span> : existingFiles.aadhaarFile ? <span style={{ color: '#10b981' }}>✔ Existing Document</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                  <div><strong>PAN Card:</strong> {files.panFile ? <span>✔ {files.panFile.name}</span> : existingFiles.panFile ? <span style={{ color: '#10b981' }}>✔ Existing Document</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                  <div><strong>Resume/CV Document:</strong> {files.resumeFile ? <span>✔ {files.resumeFile.name}</span> : existingFiles.resumeFile ? <span style={{ color: '#10b981' }}>✔ Existing Document</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                  <div><strong>Degrees/Certs:</strong> {files.qualificationFile ? <span>✔ {files.qualificationFile.name}</span> : existingFiles.qualificationFile ? <span style={{ color: '#10b981' }}>✔ Existing Document</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                  <div><strong>Exp Certificates:</strong> {files.experienceFile ? <span>✔ {files.experienceFile.name}</span> : existingFiles.experienceFile ? <span style={{ color: '#10b981' }}>✔ Existing Document</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                  <div><strong>Joining Letter:</strong> {files.joiningLetterFile ? <span>✔ {files.joiningLetterFile.name}</span> : existingFiles.joiningLetterFile ? <span style={{ color: '#10b981' }}>✔ Existing Document</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                  <div><strong>Other Docs:</strong> {files.otherFile ? <span>✔ {files.otherFile.name}</span> : existingFiles.otherFile ? <span style={{ color: '#10b981' }}>✔ Existing Document</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(var(--color-warning-rgb), 0.06)', border: '1px solid rgba(var(--color-warning-rgb), 0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={16} style={{ color: 'rgb(var(--color-warning-rgb))' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--color-warning-rgb))' }}>
                  Please verify all information before submitting. This will {editData ? 'update the teacher profile' : 'create a new teacher record and login credentials'}.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {activeStep > 1 && (
              <button type="button" onClick={handlePrev} className="btn-secondary"
                style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <ChevronLeft size={16} /> Previous
              </button>
            )}
            <button type="button" onClick={resetForm} className="btn-secondary"
              style={{ padding: '10px 16px', borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'rgb(var(--color-danger-rgb))' }}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {activeStep < 8 ? (
              <button type="button" onClick={handleNext} className="btn-primary"
                style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                Next Step <ChevronRight size={16} />
              </button>
            ) : (
              <button type="submit" className="btn-primary" disabled={loading}
                style={{ padding: '12px 32px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> {editData ? 'Updating...' : 'Registering...'}</> : <><Save size={16} /> {editData ? 'Update Teacher' : 'Register Teacher'}</>}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
