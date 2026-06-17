import React, { useState, useEffect } from 'react';
import { fetchActiveGrades, fetchActiveSections } from '../utils/grades';
import { 
  User, 
  Users, 
  MapPin, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw, 
  Save, 
  Loader2,
  FileText,
  ChevronRight,
  ChevronLeft,
  Activity,
  Truck,
  Home,
  DollarSign,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

// Custom Reusable Searchable Dropdown Select Component
function SearchableSelect({ options, value, onChange, placeholder, className, style, error }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const activeLabel = options.find(opt => opt.value === value)?.label || '';

  // Close dropdown on click outside
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
          borderColor: error ? 'rgb(var(--color-danger-rgb))' : style?.borderColor
        }}
      >
        <span style={{ color: activeLabel ? 'var(--text-main)' : '#94a3b8' }}>
          {activeLabel || placeholder || 'Select Option'}
        </span>
        <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▼</span>
      </div>
      
      {isOpen && (
        <div className="glass-panel" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          marginTop: '6px',
          maxHeight: '200px',
          overflowY: 'auto',
          background: 'var(--bg-elevated)',
          padding: '8px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <input 
            type="text"
            className="form-control"
            placeholder="Type to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: '8px', padding: '8px', fontSize: '0.85rem' }}
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
                  padding: '10px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: value === opt.value ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: value === opt.value ? 'rgb(99, 102, 241)' : 'var(--text-main)',
                  fontWeight: value === opt.value ? '600' : 'normal',
                  fontSize: '0.85rem'
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
function DragAndDropFile({ fieldName, label, file, onFileChange, onRemove, accept = "image/*,application/pdf" }) {
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
      
      // Validation Check size limit (5MB)
      if (fileObj.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit. Please upload a smaller document.");
        return;
      }
      
      // Allowed types
      const allowedExts = ['pdf', 'png', 'jpg', 'jpeg'];
      const fileExt = fileObj.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(fileExt)) {
        alert("Invalid file format. PDFs and images (JPG, PNG) only.");
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
        background: dragOver ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.01)',
        border: dragOver ? '2px dashed rgb(99, 102, 241)' : '1px solid var(--border-glass)',
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

let studentFilesCache = {
  photo: null,
  birthCertificateFile: null,
  aadhaarFile: null,
  marksheetFile: null,
  transferCertificateFile: null,
  addressProofFile: null,
  medicalCertificateFile: null,
  additionalFile: null
};

export default function RegisterStudent({ setActiveView, editData }) {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [draftRestoredAlert, setDraftRestoredAlert] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const isSubmitting = React.useRef(false);

  const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';
  const draftKey = `admission_draft_${tenantSubdomain}`;

  // Form Fields State (Unified for 9 Steps)
  const [formData, setFormData] = useState({
    // Step 1: Student Details
    firstName: '',
    middleName: '',
    lastName: '',
    fullName: '',
    admissionNumber: '',
    manualAdmissionNumber: false,
    admissionDate: new Date().toISOString().split('T')[0],
    dob: '',
    gender: '',
    bloodGroup: '',
    nationality: 'Indian',
    category: 'General',
    religion: 'Hinduism',
    aadhaarNumber: '',

    // Step 2: Academic Info
    academicYear: '2026-2027',
    admissionType: 'New Admission',
    studentClass: '',
    section: '',
    rollNumber: '',
    autoRollNumber: true,
    previousSchoolName: '',
    previousSchoolAddress: '',
    previousClassStudied: '',
    transferCertificateNumber: '',
    status: 'Pending',

    // Step 3: Parent Info
    fatherName: '',
    fatherOccupation: '',
    fatherMobile: '',
    fatherEmail: '',
    motherName: '',
    motherOccupation: '',
    motherMobile: '',
    motherEmail: '',
    guardianName: '',
    guardianRelation: '',
    guardianContact: '',

    // Step 4: Contact & Address
    currentAddress: '',
    permanentAddress: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    emergencyContactNumber: '',
    sameAsPermanent: false,

    // Step 5: Medical Info
    medicalConditions: '',
    allergies: '',
    disabilities: '',
    emergencyNotes: '',
    doctorName: '',
    doctorContact: '',

    // Step 6: Transport (Optional)
    transportRequired: 'No',
    route: '',
    pickupPoint: '',
    dropPoint: '',
    transportFeePlan: '',

    // Step 7: Hostel (Optional)
    hostelRequired: 'No',
    hostelBlock: '',
    roomNumber: '',
    bedNumber: '',

    // Step 8: Fee Details
    feeStructure: 'STANDARD-2026',
    scholarshipDetails: '',
    discountType: '',
    discountAmount: '0',
    initialPaymentStatus: 'Pending'
  });

  // Step 9 File Upload State
  const [files, setFiles] = useState(studentFilesCache);

  useEffect(() => {
    Object.assign(studentFilesCache, files);
  }, [files]);

  const [formErrors, setFormErrors] = useState({});

  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);

  const bloodGroupOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  const categoryOptions = [
    { value: 'General', label: 'General' },
    { value: 'OBC', label: 'OBC' },
    { value: 'SC', label: 'SC' },
    { value: 'ST', label: 'ST' },
    { value: 'EWS', label: 'EWS' }
  ];

  const religionOptions = [
    { value: 'Hinduism', label: 'Hinduism' },
    { value: 'Islam', label: 'Islam' },
    { value: 'Christianity', label: 'Christianity' },
    { value: 'Sikhism', label: 'Sikhism' },
    { value: 'Buddhism', label: 'Buddhism' },
    { value: 'Jainism', label: 'Jainism' },
    { value: 'Other', label: 'Other' }
  ];

  const feeStructureOptions = [
    { value: 'STANDARD-2026', label: 'Standard Tuition Fee (₹25,000/Yr)' },
    { value: 'PREMIUM-2026', label: 'Premium Boarding & Tuition (₹65,000/Yr)' },
    { value: 'SPORTS-2026', label: 'Sports Roster Discount structure (₹20,000/Yr)' }
  ];

  const discountTypeOptions = [
    { value: '', label: 'No Discount' },
    { value: 'Percentage', label: 'Percentage (%)' },
    { value: 'Fixed', label: 'Fixed Amount (₹)' }
  ];

  // Load dynamic grades & sections
  useEffect(() => {
    const loadGradesAndSections = async () => {
      const activeGrades = await fetchActiveGrades();
      setClassOptions(activeGrades.map(g => ({ 
        value: g.name, 
        label: g.name.startsWith('LKG') || g.name.startsWith('UKG') || g.name.startsWith('NURSERY') ? g.name : `Grade ${g.name}` 
      })));

      const activeSections = await fetchActiveSections();
      setSectionOptions(activeSections.map(s => ({
        value: s.name,
        label: `Section ${s.name}`
      })));
    };
    loadGradesAndSections();
  }, []);

  // Populate from editData
  useEffect(() => {
    if (editData) {
      const derivedFullName = editData.fullName || editData.name || '';
      const parts = derivedFullName.trim().split(/\s+/);
      const first = editData.firstName || parts[0] || '';
      const last = editData.lastName || parts.slice(1).join(' ') || '';

      setFormData({
        firstName: first,
        middleName: editData.middleName || '',
        lastName: last,
        fullName: derivedFullName,
        admissionNumber: editData.admissionNumber || '',
        manualAdmissionNumber: true,
        admissionDate: editData.admissionDate || '',
        dob: editData.dob || '',
        gender: editData.gender || '',
        bloodGroup: editData.bloodGroup || '',
        nationality: editData.nationality || 'Indian',
        category: editData.category || 'General',
        religion: editData.religion || 'Hinduism',
        aadhaarNumber: editData.aadhaarNumber || '',
        academicYear: editData.academicYear || '2026-2027',
        admissionType: editData.admissionType || 'New Admission',
        studentClass: editData.studentClass || '',
        section: editData.section || '',
        rollNumber: editData.rollNumber || editData.roll || '',
        autoRollNumber: false,
        previousSchoolName: editData.previousSchoolName || '',
        previousSchoolAddress: editData.previousSchoolAddress || '',
        previousClassStudied: editData.previousClassStudied || '',
        transferCertificateNumber: editData.transferCertificateNumber || '',
        status: editData.status || 'Active',
        fatherName: editData.fatherName || '',
        fatherOccupation: editData.fatherOccupation || '',
        fatherMobile: editData.fatherMobile || '',
        fatherEmail: editData.fatherEmail || '',
        motherName: editData.motherName || '',
        motherOccupation: editData.motherOccupation || '',
        motherMobile: editData.motherMobile || '',
        motherEmail: editData.motherEmail || '',
        guardianName: editData.guardianName || '',
        guardianRelation: editData.guardianRelation || '',
        guardianContact: editData.guardianContact || '',
        currentAddress: editData.currentAddress || editData.address || '',
        permanentAddress: editData.permanentAddress || '',
        city: editData.city || '',
        state: editData.state || '',
        country: editData.country || 'India',
        postalCode: editData.postalCode || editData.pincode || '',
        emergencyContactNumber: editData.emergencyContactNumber || '',
        sameAsPermanent: editData.sameAsPermanent || false,
        medicalConditions: editData.medicalConditions || '',
        allergies: editData.allergies || '',
        disabilities: editData.disabilities || '',
        emergencyNotes: editData.emergencyNotes || '',
        doctorName: editData.doctorName || '',
        doctorContact: editData.doctorContact || '',
        transportRequired: editData.transportRequired || 'No',
        route: editData.route || '',
        pickupPoint: editData.pickupPoint || '',
        dropPoint: editData.dropPoint || '',
        transportFeePlan: editData.transportFeePlan || '',
        hostelRequired: editData.hostelRequired || 'No',
        hostelBlock: editData.hostelBlock || '',
        roomNumber: editData.roomNumber || '',
        bedNumber: editData.bedNumber || '',
        feeStructure: editData.feeStructure || 'STANDARD-2026',
        scholarshipDetails: editData.scholarshipDetails || '',
        discountType: editData.discountType || '',
        discountAmount: String(editData.discountAmount || '0'),
        initialPaymentStatus: editData.initialPaymentStatus || 'Pending'
      });
    }
  }, [editData]);

  // 1. Auto Load Draft
  useEffect(() => {
    if (editData) return;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...parsed }));
        setDraftRestoredAlert(true);
        setTimeout(() => setDraftRestoredAlert(false), 5000);
      } catch (err) {
        console.error('Failed to restore draft registration:', err);
      }
    }
  }, [editData]);

  // 2. Auto-Save Draft to LocalStorage on change
  useEffect(() => {
    if (editData) return;
    const hasAnyContent = Object.keys(formData).some(key => {
      if (key === 'nationality' || key === 'religion' || key === 'category' || key === 'country' || key === 'academicYear' || key === 'admissionType' || key === 'admissionDate' || key === 'sameAsPermanent' || key === 'manualAdmissionNumber' || key === 'autoRollNumber') {
        return false;
      }
      return formData[key] !== '' && formData[key] !== 'No';
    });

    if (hasAnyContent) {
      setDraftSaving(true);
      localStorage.setItem(draftKey, JSON.stringify(formData));
      const timer = setTimeout(() => setDraftSaving(false), 600);
      return () => clearTimeout(timer);
    }
  }, [formData, editData]);

  // Clean Draft Storage
  const clearDraft = () => {
    localStorage.removeItem(draftKey);
  };

  // Generate Unique Admission Number
  useEffect(() => {
    if (editData) return;
    if (!formData.manualAdmissionNumber && !formData.admissionNumber) {
      setFormData(prev => ({
        ...prev,
        admissionNumber: `ADM-${Date.now().toString().slice(-6)}`
      }));
    }
  }, [formData.manualAdmissionNumber, editData]);

  // Generate Unique Roll Number
  useEffect(() => {
    if (editData) return;
    if (formData.autoRollNumber && !formData.rollNumber) {
      setFormData(prev => ({
        ...prev,
        rollNumber: `${Math.floor(10 + Math.random() * 90)}`
      }));
    }
  }, [formData.autoRollNumber, editData]);

  // Handle address copying
  useEffect(() => {
    if (formData.sameAsPermanent) {
      setFormData(prev => ({
        ...prev,
        currentAddress: prev.permanentAddress
      }));
    }
  }, [formData.sameAsPermanent, formData.permanentAddress]);

  // Field change handlers
  const handleTextChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    
    if (name === 'firstName' || name === 'middleName' || name === 'lastName') {
      val = val.replace(/[^A-Za-z\s]/g, '').slice(0, 50);
    }
    
    setFormData(prev => {
      const updated = { ...prev, [name]: val };
      // Compute full name if updating first/middle/last name
      if (name === 'firstName' || name === 'middleName' || name === 'lastName') {
        updated.fullName = [updated.firstName, updated.middleName, updated.lastName].filter(Boolean).join(' ');
      }
      return updated;
    });

    // Clear inline error if field modified
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePincodeChange = (e) => {
    const cleanVal = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, postalCode: cleanVal }));
    if (formErrors.postalCode) setFormErrors(prev => ({ ...prev, postalCode: '' }));
  };

  const handleMobileChange = (e) => {
    const { name, value } = e.target;
    const cleanVal = value.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, [name]: cleanVal }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAadhaarChange = (e) => {
    const { value } = e.target;
    const cleanVal = value.replace(/[^0-9]/g, '').slice(0, 12);
    setFormData(prev => ({ ...prev, aadhaarNumber: cleanVal }));
    if (formErrors.aadhaarNumber) setFormErrors(prev => ({ ...prev, aadhaarNumber: '' }));
  };

  const handleSelectChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setFiles(prev => ({ ...prev, [fieldName]: file }));
  };

  const removeFile = (fieldName) => {
    setFiles(prev => ({ ...prev, [fieldName]: null }));
    const el = document.getElementById(fieldName);
    if (el) el.value = '';
  };

  // Step Validator
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formData.firstName.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
      if (!formData.gender) errors.gender = 'Gender is required';
      if (!formData.dob) errors.dob = 'Date of birth is required';
      if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber.replace(/\s/g, ''))) {
        errors.aadhaarNumber = 'Aadhaar number must be exactly 12 digits';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setActiveStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const performReset = () => {
    if (!editData) clearDraft();
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      fullName: '',
      admissionNumber: '',
      manualAdmissionNumber: false,
      admissionDate: new Date().toISOString().split('T')[0],
      dob: '',
      gender: '',
      bloodGroup: '',
      nationality: 'Indian',
      category: 'General',
      religion: 'Hinduism',
      aadhaarNumber: '',
      academicYear: '2026-2027',
      admissionType: 'New Admission',
      studentClass: '',
      section: '',
      rollNumber: '',
      autoRollNumber: true,
      previousSchoolName: '',
      previousSchoolAddress: '',
      previousClassStudied: '',
      transferCertificateNumber: '',
      status: 'Pending',
      fatherName: '',
      fatherOccupation: '',
      fatherMobile: '',
      fatherEmail: '',
      motherName: '',
      motherOccupation: '',
      motherMobile: '',
      motherEmail: '',
      guardianName: '',
      guardianRelation: '',
      guardianContact: '',
      currentAddress: '',
      permanentAddress: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      emergencyContactNumber: '',
      sameAsPermanent: false,
      medicalConditions: '',
      allergies: '',
      disabilities: '',
      emergencyNotes: '',
      doctorName: '',
      doctorContact: '',
      transportRequired: 'No',
      route: '',
      pickupPoint: '',
      dropPoint: '',
      transportFeePlan: '',
      hostelRequired: 'No',
      hostelBlock: '',
      roomNumber: '',
      bedNumber: '',
      feeStructure: 'STANDARD-2026',
      scholarshipDetails: '',
      discountType: '',
      discountAmount: '0',
      initialPaymentStatus: 'Pending'
    });
    setFiles({
      photo: null,
      birthCertificateFile: null,
      aadhaarFile: null,
      marksheetFile: null,
      transferCertificateFile: null,
      addressProofFile: null,
      medicalCertificateFile: null,
      additionalFile: null
    });
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
      if (targetTag !== 'textarea' && e.target.type !== 'submit') {
        e.preventDefault();
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setFormSubmitted(true);

    // Validate overall required fields
    let isValid = true;
    for (let step = 1; step <= 7; step++) {
      if (!validateStep(step)) {
        setActiveStep(step);
        isValid = false;
        break;
      }
    }

    if (!isValid) {
      isSubmitting.current = false;
      return;
    }

    setLoading(true);

    try {
      const dataObj = new FormData();
      Object.keys(formData).forEach(key => {
        dataObj.append(key, formData[key]);
      });

      // Files attachment
      Object.keys(files).forEach(key => {
        if (files[key]) {
          dataObj.append(key, files[key]);
        }
      });

      const url = editData ? `/api/students/${editData.id}` : '/api/students';
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
        setSuccessToast(true);
        setTimeout(() => setSuccessToast(false), 5000);
        if (editData) {
          setActiveView('students');
        }
      } else {
        const errData = await res.json();
        alert(errData.error || 'Server error occurred during admission submit.');
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
    { num: 1, label: 'Student Information', icon: <User size={16} /> },
    { num: 2, label: 'Academic Details', icon: <FileSpreadsheet size={16} /> },
    { num: 3, label: 'Parent Details', icon: <Users size={16} /> },
    { num: 4, label: 'Address & Contact', icon: <MapPin size={16} /> },
    { num: 5, label: 'Medical Profile', icon: <Activity size={16} /> },
    { num: 6, label: 'Transport Block', icon: <Truck size={16} /> },
    { num: 7, label: 'Hostel Block', icon: <Home size={16} /> },
    { num: 8, label: 'Documents Upload', icon: <Upload size={16} /> },
    { num: 9, label: 'Final Review', icon: <CheckCircle size={16} /> }
  ];

  return (
    <div className="animate-slide-up no-card-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Draft Save Alert Toast */}
      {draftSaving && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: 'rgba(99, 102, 241, 0.95)',
          color: 'white',
          padding: '10px 18px',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: 600,
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none'
        }}>
          <RotateCcw size={14} className="animate-spin" />
          Saving Draft progress...
        </div>
      )}

      {/* Draft Restored Banner */}
      {draftRestoredAlert && (
        <div className="glass-panel" style={{
          padding: '14px 20px',
          background: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.2)',
          color: 'rgb(16, 185, 129)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.875rem'
        }}>
          <CheckCircle size={18} />
          <span>Draft restored! You can continue from your previous session.</span>
        </div>
      )}

      {/* Success Success Toast */}
      {successToast && (
        <div className="glass-panel" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: 'rgba(16, 185, 129, 0.95)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideInUp 0.3s ease'
        }}>
          <CheckCircle size={24} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>Admission Confirmed!</strong>
            <span style={{ fontSize: '0.8rem' }}>Student registered, login accounts created, and assigned to class roster.</span>
          </div>
        </div>
      )}

      {/* Stepper Header (Desktop view) */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '800px', padding: '0 10px' }}>
          {steps.map((s, index) => (
            <React.Fragment key={s.num}>
              <div 
                onClick={() => {
                  setActiveStep(s.num);
                }}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  opacity: activeStep === s.num ? 1 : 0.6,
                  transition: 'opacity 0.3s'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: activeStep === s.num 
                    ? 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-secondary)) 100%)' 
                    : activeStep > s.num 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'var(--bg-form)',
                  border: activeStep === s.num 
                    ? 'none' 
                    : activeStep > s.num 
                      ? '1px solid rgb(16, 185, 129)' 
                      : '1px solid var(--border-glass)',
                  color: activeStep === s.num 
                    ? 'white' 
                    : activeStep > s.num 
                      ? 'rgb(16, 185, 129)' 
                      : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 'bold'
                }}>
                  {activeStep > s.num ? <CheckCircle size={16} /> : s.num}
                </div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: activeStep === s.num ? 700 : 500,
                  color: activeStep === s.num ? 'hsl(var(--color-primary))' : 'var(--text-muted)',
                  whiteSpace: 'nowrap'
                }}>
                  {s.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div style={{ 
                  flex: 1, 
                  height: '2px', 
                  background: activeStep > s.num ? 'rgb(16, 185, 129)' : 'var(--border-glass)', 
                  margin: '0 12px',
                  alignSelf: 'center',
                  minWidth: '20px'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Active Step Progress Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {steps[activeStep - 1].label}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Step {activeStep} of 9 — Complete fields to advance.
          </p>
        </div>
        
        {/* Reset Draft Button */}
        {!editData && (
          <button 
            type="button" 
            onClick={resetForm}
            className="btn-secondary"
            style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={14} /> Clear Form & Draft
          </button>
        )}
      </div>

      {/* FORM BODY STAGE */}
      <form 
        onSubmit={(e) => e.preventDefault()} 
        onKeyDown={handleFormKeyDown} 
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        
        {/* STEP 1: STUDENT INFO */}
        {activeStep === 1 && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} style={{ color: 'hsl(var(--color-primary))' }} /> Basic Student Profile
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              
              <div className="form-group">
                <label>First Name *</label>
                <input 
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="Student first name"
                  style={{ borderColor: formErrors.firstName ? '#ef4444' : undefined }}
                />
                {formErrors.firstName && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.firstName}</span>}
              </div>

              <div className="form-group">
                <label>Middle Name (Optional)</label>
                <input 
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleTextChange}
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
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="Last name"
                  style={{ borderColor: formErrors.lastName ? '#ef4444' : undefined }}
                />
                {formErrors.lastName && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.lastName}</span>}
              </div>

              <div className="form-group">
                <label>Date of Birth *</label>
                <input 
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleTextChange}
                  max={new Date().toLocaleDateString('en-CA')}
                  className="form-control"
                  style={{ borderColor: formErrors.dob ? '#ef4444' : undefined }}
                />
                {formErrors.dob && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.dob}</span>}
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <SearchableSelect 
                  options={genderOptions}
                  value={formData.gender}
                  onChange={(val) => handleSelectChange('gender', val)}
                  placeholder="Choose Gender"
                  className="form-control"
                  error={formErrors.gender}
                />
                {formErrors.gender && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.gender}</span>}
              </div>

              <div className="form-group">
                <label>Blood Group</label>
                <SearchableSelect 
                  options={bloodGroupOptions}
                  value={formData.bloodGroup}
                  onChange={(val) => handleSelectChange('bloodGroup', val)}
                  placeholder="Choose Blood Group"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Admission Number *</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="text"
                    name="admissionNumber"
                    value={formData.admissionNumber}
                    onChange={handleTextChange}
                    disabled={!formData.manualAdmissionNumber}
                    className="form-control"
                    placeholder="Auto Generated"
                    style={{ borderColor: formErrors.admissionNumber ? '#ef4444' : undefined }}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer', marginTop: '6px', fontWeight: 'normal' }}>
                  <input 
                    type="checkbox"
                    name="manualAdmissionNumber"
                    checked={formData.manualAdmissionNumber}
                    onChange={handleTextChange}
                  /> Manual Override admission ID
                </label>
                {formErrors.admissionNumber && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.admissionNumber}</span>}
              </div>

              <div className="form-group">
                <label>Admission Date *</label>
                <input 
                  type="date"
                  name="admissionDate"
                  value={formData.admissionDate}
                  onChange={handleTextChange}
                  max={new Date().toLocaleDateString('en-CA')}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Nationality</label>
                <input 
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="e.g. Indian"
                />
              </div>

              <div className="form-group">
                <label>Category/Caste</label>
                <SearchableSelect 
                  options={categoryOptions}
                  value={formData.category}
                  onChange={(val) => handleSelectChange('category', val)}
                  placeholder="Select Category"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Religion</label>
                <SearchableSelect 
                  options={religionOptions}
                  value={formData.religion}
                  onChange={(val) => handleSelectChange('religion', val)}
                  placeholder="Select Religion"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Aadhaar Number (Optional)</label>
                <input 
                  type="text"
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleAadhaarChange}
                  className="form-control"
                  placeholder="12-digit UIDAI number"
                  style={{ borderColor: formErrors.aadhaarNumber ? '#ef4444' : undefined }}
                  maxLength={12}
                />
                {formErrors.aadhaarNumber && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.aadhaarNumber}</span>}
              </div>

              <div className="form-group">
                <DragAndDropFile 
                  fieldName="photo"
                  label="Student Profile Photo (Optional)"
                  file={files.photo}
                  onFileChange={handleFileChange}
                  onRemove={removeFile}
                  accept="image/*"
                />
              </div>

            </div>
          </div>
        )}

        {/* STEP 2: ACADEMIC DETAILS */}
        {activeStep === 2 && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={16} style={{ color: 'hsl(var(--color-info))' }} /> Academic Enrolment & Status
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              
              <div className="form-group">
                <label>Academic Session *</label>
                <select 
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleTextChange}
                  className="form-control"
                >
                  {Array.from({ length: 2030 - 2026 + 1 }, (_, i) => {
                    const s = 2026 + i;
                    return `${s}-${s + 1}`;
                  }).map(sy => (
                    <option key={sy} value={sy}>{sy}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Admission Type *</label>
                <select 
                  name="admissionType"
                  value={formData.admissionType}
                  onChange={handleTextChange}
                  className="form-control"
                >
                  <option value="New Admission">New Admission</option>
                  <option value="Transfer">Transfer / Promotion</option>
                </select>
              </div>

              <div className="form-group">
                <label>Class/Grade *</label>
                <SearchableSelect 
                  options={classOptions}
                  value={formData.studentClass}
                  onChange={(val) => handleSelectChange('studentClass', val)}
                  placeholder="Choose Class"
                  className="form-control"
                  error={formErrors.studentClass}
                />
                {formErrors.studentClass && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.studentClass}</span>}
              </div>


              <div className="form-group">
                <label>Previous School Name (if Transfer)</label>
                <input 
                  type="text"
                  name="previousSchoolName"
                  value={formData.previousSchoolName}
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="Previous institute name"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Previous School Address</label>
                <input 
                  type="text"
                  name="previousSchoolAddress"
                  value={formData.previousSchoolAddress}
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="Address of previous school"
                />
              </div>

              <div className="form-group">
                <label>Previous Class Studied</label>
                <input 
                  type="text"
                  name="previousClassStudied"
                  value={formData.previousClassStudied}
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="Class last studied"
                />
              </div>

              <div className="form-group">
                <label>Transfer Certificate (TC) Number</label>
                <input 
                  type="text"
                  name="transferCertificateNumber"
                  value={formData.transferCertificateNumber}
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="TC reference number"
                />
              </div>

            </div>
          </div>
        )}

        {/* STEP 3: PARENT/GUARDIAN INFO */}
        {activeStep === 3 && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} style={{ color: 'hsl(var(--color-secondary))' }} /> Parent / Guardian Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              {/* Father Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderRight: '1px solid var(--border-glass)', paddingRight: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--color-primary))', margin: 0 }}>Father Details</h4>
                <div className="form-group">
                  <label>Father Name *</label>
                  <input 
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleTextChange}
                    className="form-control"
                    placeholder="Father's full name"
                    style={{ borderColor: formErrors.fatherName ? '#ef4444' : undefined }}
                  />
                  {formErrors.fatherName && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{formErrors.fatherName}</span>}
                </div>
                <div className="form-group">
                  <label>Father Occupation</label>
                  <input 
                    type="text"
                    name="fatherOccupation"
                    value={formData.fatherOccupation}
                    onChange={handleTextChange}
                    className="form-control"
                    placeholder="Father's profession"
                  />
                </div>
                <div className="form-group">
                  <label>Father Mobile *</label>
                  <input 
                    type="text"
                    name="fatherMobile"
                    value={formData.fatherMobile}
                    onChange={handleMobileChange}
                    className="form-control"
                    placeholder="10-digit mobile number"
                    style={{ borderColor: formErrors.fatherMobile ? '#ef4444' : undefined }}
                  />
                  {formErrors.fatherMobile && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{formErrors.fatherMobile}</span>}
                </div>
                <div className="form-group">
                  <label>Father Email</label>
                  <input 
                    type="email"
                    name="fatherEmail"
                    value={formData.fatherEmail}
                    onChange={handleTextChange}
                    className="form-control"
                    placeholder="Father's email address"
                    style={{ borderColor: formErrors.fatherEmail ? '#ef4444' : undefined }}
                  />
                  {formErrors.fatherEmail && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{formErrors.fatherEmail}</span>}
                </div>
              </div>

              {/* Mother Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderRight: '1px solid var(--border-glass)', paddingRight: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--color-secondary))', margin: 0 }}>Mother Details</h4>
                <div className="form-group">
                  <label>Mother Name *</label>
                  <input 
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleTextChange}
                    className="form-control"
                    placeholder="Mother's full name"
                    style={{ borderColor: formErrors.motherName ? '#ef4444' : undefined }}
                  />
                  {formErrors.motherName && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{formErrors.motherName}</span>}
                </div>
                <div className="form-group">
                  <label>Mother Occupation</label>
                  <input 
                    type="text"
                    name="motherOccupation"
                    value={formData.motherOccupation}
                    onChange={handleTextChange}
                    className="form-control"
                    placeholder="Mother's profession"
                  />
                </div>
                <div className="form-group">
                  <label>Mother Mobile *</label>
                  <input 
                    type="text"
                    name="motherMobile"
                    value={formData.motherMobile}
                    onChange={handleMobileChange}
                    className="form-control"
                    placeholder="10-digit mobile number"
                    style={{ borderColor: formErrors.motherMobile ? '#ef4444' : undefined }}
                  />
                  {formErrors.motherMobile && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{formErrors.motherMobile}</span>}
                </div>
                <div className="form-group">
                  <label>Mother Email</label>
                  <input 
                    type="email"
                    name="motherEmail"
                    value={formData.motherEmail}
                    onChange={handleTextChange}
                    className="form-control"
                    placeholder="Mother's email address"
                    style={{ borderColor: formErrors.motherEmail ? '#ef4444' : undefined }}
                  />
                  {formErrors.motherEmail && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{formErrors.motherEmail}</span>}
                </div>
              </div>

              {/* Guardian Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#10b981', margin: 0 }}>Guardian Details (Optional)</h4>
                <div className="form-group">
                  <label>Guardian Name</label>
                  <input 
                    type="text"
                    name="guardianName"
                    value={formData.guardianName}
                    onChange={handleTextChange}
                    className="form-control"
                    placeholder="Guardian full name"
                  />
                </div>
                <div className="form-group">
                  <label>Guardian Relation</label>
                  <input 
                    type="text"
                    name="guardianRelation"
                    value={formData.guardianRelation}
                    onChange={handleTextChange}
                    className="form-control"
                    placeholder="e.g. Uncle, Grandparent"
                  />
                </div>
                <div className="form-group">
                  <label>Guardian Contact Number</label>
                  <input 
                    type="text"
                    name="guardianContact"
                    value={formData.guardianContact}
                    onChange={handleMobileChange}
                    className="form-control"
                    placeholder="10-digit phone number"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 4: CONTACT & ADDRESS */}
        {activeStep === 4 && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} style={{ color: 'rgb(16, 185, 129)' }} /> Contact Details & Residential Address
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group">
                <label>Permanent Address *</label>
                <input 
                  type="text"
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="Plot/house no., society, street name"
                  style={{ borderColor: formErrors.permanentAddress ? '#ef4444' : undefined }}
                />
                {formErrors.permanentAddress && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.permanentAddress}</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 10px 0' }}>
                <input 
                  type="checkbox"
                  id="sameAsPermanent"
                  name="sameAsPermanent"
                  checked={formData.sameAsPermanent}
                  onChange={handleTextChange}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="sameAsPermanent" style={{ fontSize: '0.85rem', cursor: 'pointer', margin: 0, fontWeight: 500 }}>
                  Current Address is Same as Permanent Address
                </label>
              </div>

              <div className="form-group">
                <label>Current Address *</label>
                <input 
                  type="text"
                  name="currentAddress"
                  value={formData.currentAddress}
                  onChange={handleTextChange}
                  disabled={formData.sameAsPermanent}
                  className="form-control"
                  placeholder="Plot/house no., current locality"
                  style={{ borderColor: formErrors.currentAddress ? '#ef4444' : undefined }}
                />
                {formErrors.currentAddress && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.currentAddress}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label>City *</label>
                  <input 
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleTextChange}
                    className="form-control"
                    placeholder="City"
                    style={{ borderColor: formErrors.city ? '#ef4444' : undefined }}
                  />
                  {formErrors.city && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.city}</span>}
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input 
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleTextChange}
                    className="form-control"
                    placeholder="State"
                    style={{ borderColor: formErrors.state ? '#ef4444' : undefined }}
                  />
                  {formErrors.state && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.state}</span>}
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <input 
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleTextChange}
                    className="form-control"
                    placeholder="Country"
                  />
                </div>

                <div className="form-group">
                  <label>Postal Code / Pincode *</label>
                  <input 
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handlePincodeChange}
                    className="form-control"
                    placeholder="6-digit PIN code"
                    style={{ borderColor: formErrors.postalCode ? '#ef4444' : undefined }}
                  />
                  {formErrors.postalCode && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.postalCode}</span>}
                </div>

                <div className="form-group">
                  <label>Emergency Contact Number *</label>
                  <input 
                    type="text"
                    name="emergencyContactNumber"
                    value={formData.emergencyContactNumber}
                    onChange={handleMobileChange}
                    className="form-control"
                    placeholder="Emergency mobile number"
                    style={{ borderColor: formErrors.emergencyContactNumber ? '#ef4444' : undefined }}
                  />
                  {formErrors.emergencyContactNumber && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{formErrors.emergencyContactNumber}</span>}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 5: MEDICAL DETAILS */}
        {activeStep === 5 && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} style={{ color: 'hsl(var(--color-danger))' }} /> Medical Profile & Health History
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Medical Conditions / Health Issues</label>
                <textarea 
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="Describe any chronic illnesses, medical conditions, or daily medications..."
                  rows={3}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Allergies (Food, Drugs, Environmental)</label>
                <textarea 
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="Detail any critical allergies and instructions..."
                  rows={3}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Disabilities or Special Education Needs (SEN)</label>
                <textarea 
                  name="disabilities"
                  value={formData.disabilities}
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="Describe special assistance requirements or disabilities..."
                  rows={3}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Emergency Medical Notes</label>
                <textarea 
                  name="emergencyNotes"
                  value={formData.emergencyNotes}
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="Emergency first-aid advice or medical alerts..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Family Doctor Name</label>
                <input 
                  type="text"
                  name="doctorName"
                  value={formData.doctorName}
                  onChange={handleTextChange}
                  className="form-control"
                  placeholder="Dr. Name"
                />
              </div>

              <div className="form-group">
                <label>Doctor Contact Number</label>
                <input 
                  type="text"
                  name="doctorContact"
                  value={formData.doctorContact}
                  onChange={handleMobileChange}
                  className="form-control"
                  placeholder="Phone"
                />
              </div>

            </div>
          </div>
        )}

        {/* STEP 6: TRANSPORT (OPTIONAL) */}
        {activeStep === 6 && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={16} style={{ color: 'hsl(var(--color-primary))' }} /> School Transport Services (Optional)
            </h3>

            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Require School Bus/Transport Service?</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input 
                    type="radio" 
                    name="transportRequired" 
                    value="Yes" 
                    checked={formData.transportRequired === 'Yes'}
                    onChange={handleTextChange}
                  /> Yes, require transport
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input 
                    type="radio" 
                    name="transportRequired" 
                    value="No" 
                    checked={formData.transportRequired === 'No'}
                    onChange={handleTextChange}
                  /> No, self transport
                </label>
              </div>
            </div>

          </div>
        )}

        {/* STEP 7: HOSTEL (OPTIONAL) */}
        {activeStep === 7 && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Home size={16} style={{ color: 'hsl(var(--color-secondary))' }} /> Hostels & Boarding Accommodation (Optional)
            </h3>

            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Require Hostel/Boarding Facility?</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input 
                    type="radio" 
                    name="hostelRequired" 
                    value="Yes" 
                    checked={formData.hostelRequired === 'Yes'}
                    onChange={handleTextChange}
                  /> Yes, require boarding
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input 
                    type="radio" 
                    name="hostelRequired" 
                    value="No" 
                    checked={formData.hostelRequired === 'No'}
                    onChange={handleTextChange}
                  /> No, day scholar
                </label>
              </div>
            </div>


          </div>
        )}



        {/* STEP 8: DOCUMENT UPLOADS */}
        {activeStep === 8 && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={16} style={{ color: 'rgb(245, 158, 11)' }} /> Document Checklist (PDFs or Images under 5MB)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <DragAndDropFile 
                fieldName="birthCertificateFile"
                label="Birth Certificate"
                file={files.birthCertificateFile}
                onFileChange={handleFileChange}
                onRemove={removeFile}
              />

              <DragAndDropFile 
                fieldName="aadhaarFile"
                label="Aadhaar Card File"
                file={files.aadhaarFile}
                onFileChange={handleFileChange}
                onRemove={removeFile}
              />

              <DragAndDropFile 
                fieldName="marksheetFile"
                label="Previous Marksheet Document"
                file={files.marksheetFile}
                onFileChange={handleFileChange}
                onRemove={removeFile}
              />

              <DragAndDropFile 
                fieldName="transferCertificateFile"
                label="Transfer Certificate (TC)"
                file={files.transferCertificateFile}
                onFileChange={handleFileChange}
                onRemove={removeFile}
              />

              <DragAndDropFile 
                fieldName="addressProofFile"
                label="Residence Address Proof"
                file={files.addressProofFile}
                onFileChange={handleFileChange}
                onRemove={removeFile}
              />

              <DragAndDropFile 
                fieldName="medicalCertificateFile"
                label="Medical Clearance Certificate"
                file={files.medicalCertificateFile}
                onFileChange={handleFileChange}
                onRemove={removeFile}
              />

              <DragAndDropFile 
                fieldName="additionalFile"
                label="Additional Supportive Docs"
                file={files.additionalFile}
                onFileChange={handleFileChange}
                onRemove={removeFile}
              />
            </div>
          </div>
        )}

        {/* STEP 9: FINAL REVIEW PAGE */}
        {activeStep === 9 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px', background: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.2)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} style={{ color: 'hsl(var(--color-warning))', flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>Review Admissions Ledger Profile</strong>
                <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>Please double-check all registered values below. Submitting will commit the record and auto-create parent and student accounts.</span>
              </div>
            </div>

            {/* Review Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              {/* Card 1: Student Personal */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--color-primary))', margin: 0 }}>Personal Profile</h4>
                  <button type="button" onClick={() => setActiveStep(1)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div><strong>Full Name:</strong> {formData.fullName}</div>
                  <div><strong>Gender / DOB:</strong> {formData.gender} / {formData.dob}</div>
                  <div><strong>Blood Group:</strong> {formData.bloodGroup || 'N/A'}</div>
                  <div><strong>Nationality:</strong> {formData.nationality}</div>
                  <div><strong>Category / Religion:</strong> {formData.category} / {formData.religion}</div>
                  <div><strong>Aadhaar Number:</strong> {formData.aadhaarNumber || 'N/A'}</div>
                </div>
              </div>

              {/* Card 2: Academic Info */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--color-info))', margin: 0 }}>Academic Enrollment</h4>
                  <button type="button" onClick={() => setActiveStep(2)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div><strong>Admission ID:</strong> {formData.admissionNumber}</div>
                  <div><strong>Class:</strong> Class {formData.studentClass}</div>
                  <div><strong>Type / Session:</strong> {formData.admissionType} / {formData.academicYear}</div>
                  <div><strong>TC Number:</strong> {formData.transferCertificateNumber || 'N/A'}</div>
                </div>
              </div>

              {/* Card 3: Family Contact */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--color-secondary))', margin: 0 }}>Parent & Family Contact</h4>
                  <button type="button" onClick={() => setActiveStep(3)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div><strong>Father:</strong> {formData.fatherName} ({formData.fatherMobile})</div>
                  <div><strong>Mother:</strong> {formData.motherName} ({formData.motherMobile})</div>
                  {formData.guardianName && <div><strong>Guardian:</strong> {formData.guardianName} ({formData.guardianContact})</div>}
                </div>
              </div>

              {/* Card 4: Address Details */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'rgb(16, 185, 129)', margin: 0 }}>Address Details</h4>
                  <button type="button" onClick={() => setActiveStep(4)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div><strong>Permanent:</strong> {formData.permanentAddress}</div>
                  <div><strong>Current:</strong> {formData.sameAsPermanent ? 'Same as Permanent' : formData.currentAddress}</div>
                  <div><strong>City / State / Zip:</strong> {formData.city}, {formData.state} - {formData.postalCode}</div>
                </div>
              </div>

              {/* Card 5: Health & Transport */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--color-danger))', margin: 0 }}>Health, Hostel & Transport</h4>
                  <button type="button" onClick={() => setActiveStep(5)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div><strong>SEN / Disabilities:</strong> {formData.disabilities || 'None'}</div>
                  <div><strong>Transport Required:</strong> {formData.transportRequired}</div>
                  <div><strong>Hostel Required:</strong> {formData.hostelRequired}</div>
                </div>
              </div>


            </div>

            {/* Document checklist reviews */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>Uploaded Documents Review</h4>
                <button type="button" onClick={() => setActiveStep(8)} style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.8rem' }}>
                <div><strong>Photograph:</strong> {files.photo ? <span style={{ color: '#10b981' }}>✔ {files.photo.name}</span> : <span style={{ color: '#ef4444' }}>✘ Missing *</span>}</div>
                <div><strong>Birth Certificate:</strong> {files.birthCertificateFile ? <span>✔ {files.birthCertificateFile.name}</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                <div><strong>Aadhaar Card:</strong> {files.aadhaarFile ? <span>✔ {files.aadhaarFile.name}</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                <div><strong>Previous Marksheet:</strong> {files.marksheetFile ? <span>✔ {files.marksheetFile.name}</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                <div><strong>Transfer Cert (TC):</strong> {files.transferCertificateFile ? <span>✔ {files.transferCertificateFile.name}</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                <div><strong>Address Proof:</strong> {files.addressProofFile ? <span>✔ {files.addressProofFile.name}</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                <div><strong>Medical Clearance:</strong> {files.medicalCertificateFile ? <span>✔ {files.medicalCertificateFile.name}</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
                <div><strong>Additional Docs:</strong> {files.additionalFile ? <span>✔ {files.additionalFile.name}</span> : <span style={{ color: 'var(--text-muted)' }}>Not uploaded</span>}</div>
              </div>
            </div>

          </div>
        )}

        {/* STEPPER WIZARD CONTROLS */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '10px',
          borderTop: '1px solid var(--border-glass)',
          paddingTop: '20px'
        }}>
          <div>
            {activeStep > 1 && (
              <button 
                type="button" 
                onClick={handlePrev} 
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              onClick={() => { if (!editData) clearDraft(); setActiveView('students'); }} 
              className="btn-secondary"
              style={{ padding: '12px 24px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
            >
              {editData ? 'Cancel' : 'Cancel Admission'}
            </button>
            
            {activeStep < 9 ? (
              <button 
                type="button" 
                onClick={handleNext} 
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit}
                className="btn-primary"
                disabled={loading}
                style={{ 
                  padding: '12px 28px', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontWeight: 700,
                  cursor: 'pointer',
                  minWidth: '200px',
                  justifyContent: 'center'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> {editData ? 'Save' : 'Submit Admission'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
