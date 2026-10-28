import React, { useState, useRef } from 'react';
import './StaffBulkImportModal.css';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  FileText,
  Loader2,
  RotateCcw,
  Download,
  Filter,
  Check
} from 'lucide-react';

export default function StaffBulkImportModal({ isOpen, onClose, onImportComplete }) {
  if (!isOpen) return null;

  // Steps: 1 = Upload, 2 = Mapping, 3 = Department/Designation & Preview, 4 = Results
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Preview Response
  const [previewData, setPreviewData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [designationResolutions, setDesignationResolutions] = useState({});
  const [previewFilter, setPreviewFilter] = useState('all'); // 'all', 'valid', 'error', 'duplicate'

  // Results & Undo
  const [resultSummary, setResultSummary] = useState(null);
  const [undoLoading, setUndoLoading] = useState(false);
  const [undoSuccessMessage, setUndoSuccessMessage] = useState('');

  const fileInputRef = useRef(null);

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setErrorMessage('');
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      setErrorMessage('Please upload a valid spreadsheet file (.xlsx, .xls, or .csv).');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5 MB limit. Please upload a smaller file.');
      return;
    }
    setFile(selectedFile);
    // Automatically start analysis immediately upon file selection so the user doesn't wait
    handleAnalyzeFile(selectedFile);
  };

  // 1. Analyze and Preview File
  const handleAnalyzeFile = async (targetFile = null) => {
    const fileToProcess = targetFile || file;
    if (!fileToProcess) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', fileToProcess);

      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch('/api/staff/import/preview', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-tenant-id': tenantSubdomain
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse spreadsheet file.');
      }

      setPreviewData(data);
      setColumnMapping(data.detectedMapping || {});

      // Initialize designation resolutions
      const initialResolutions = {};
      (data.unmatchedDesignations || []).forEach(desig => {
        initialResolutions[desig] = { action: 'create', name: desig };
      });
      setDesignationResolutions(initialResolutions);

      setCurrentStep(2); // Move to Column Mapping
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Confirm and Stage Staff
  const handleConfirmImport = async () => {
    if (!previewData || !previewData.rows) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const payload = {
        rows: previewData.rows,
        columnMapping,
        designationResolutions,
        fileName: file?.name || 'staff_import.xlsx'
      };

      const res = await fetch('/api/staff/import/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-tenant-id': tenantSubdomain
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm staff import.');
      }

      setResultSummary(data);
      setCurrentStep(4); // Move to Results Screen

      if (typeof onImportComplete === 'function') {
        onImportComplete(data);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Undo Last Import from Modal
  const handleUndoImport = async () => {
    if (!resultSummary?.batchId) return;
    const confirmMsg = `This will remove ${resultSummary.importedCount || 0} pending staff members from the last import. Staff already set up from this batch will NOT be removed. Are you sure?`;
    if (!window.confirm(confirmMsg)) return;

    setUndoLoading(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch(`/api/staff/import/undo/${resultSummary.batchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-tenant-id': tenantSubdomain
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to undo import.');
      }

      setUndoSuccessMessage(`Batch successfully undone! Removed ${data.removedCount} pending staff.`);
      if (typeof onImportComplete === 'function') {
        onImportComplete();
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setUndoLoading(false);
    }
  };

  // 4. Download Error Report
  const handleDownloadErrorReport = async () => {
    const errorRows = (previewData?.rows || []).filter(
      r => (r.validationStatus || r.status) === 'Error' || (r.validationStatus || r.status) === 'Duplicate'
    );
    if (errorRows.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch('/api/staff/import/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-tenant-id': tenantSubdomain
        },
        body: JSON.stringify({ rows: errorRows })
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Staff_Import_Error_Report.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to download error report.');
    }
  };

  // Supported Field Keys
  const systemFields = [
    { key: '', label: '-- Skip Column --' },
    { key: 'fullName', label: 'Full Name (Required)' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation / Role' },
    { key: 'mobile', label: 'Mobile Number' },
    { key: 'email', label: 'Email Address' },
    { key: 'gender', label: 'Gender' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'joiningDate', label: 'Joining Date' },
    { key: 'qualification', label: 'Qualification' },
    { key: 'experience', label: 'Experience (years)' },
    { key: 'bloodGroup', label: 'Blood Group' },
    { key: 'nationality', label: 'Nationality' },
    { key: 'maritalStatus', label: 'Marital Status' },
    { key: 'address', label: 'Address' },
    { key: 'alternateMobile', label: 'Alternate Mobile' }
  ];

  const filteredPreviewRows = (previewData?.rows || []).filter(r => {
    const status = r.validationStatus || r.status || '';
    if (previewFilter === 'valid') return status === 'Valid';
    if (previewFilter === 'error') return status === 'Error';
    if (previewFilter === 'duplicate') return status === 'Duplicate';
    return true;
  });

  return (
    <div className="staff-import-modal-overlay">
      <div className="staff-import-modal-card">
        {/* Modal Header */}
        <div className="staff-import-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(255, 140, 66, 0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-primary))'
            }}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Bulk Staff Import
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Staging Roster &amp; Pending Setup Flow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '6px', borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="staff-import-steps-bar">
          <div className={`staff-import-step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'done' : ''}`}>
            <span className="staff-import-step-circle">{currentStep > 1 ? <Check size={14} /> : '1'}</span>
            <span>Upload File</span>
          </div>
          <span style={{ color: 'var(--border-glass)' }}>&rarr;</span>
          <div className={`staff-import-step-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'done' : ''}`}>
            <span className="staff-import-step-circle">{currentStep > 2 ? <Check size={14} /> : '2'}</span>
            <span>Column Mapping</span>
          </div>
          <span style={{ color: 'var(--border-glass)' }}>&rarr;</span>
          <div className={`staff-import-step-item ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'done' : ''}`}>
            <span className="staff-import-step-circle">{currentStep > 3 ? <Check size={14} /> : '3'}</span>
            <span>Preview &amp; Resolve</span>
          </div>
          <span style={{ color: 'var(--border-glass)' }}>&rarr;</span>
          <div className={`staff-import-step-item ${currentStep === 4 ? 'active' : ''}`}>
            <span className="staff-import-step-circle">4</span>
            <span>Confirmation</span>
          </div>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div style={{
            margin: '16px 24px 0', padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.82rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="staff-import-modal-body">
          {/* STEP 1: Upload File */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                className={`staff-import-dropzone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => !loading && fileInputRef.current?.click()}
                style={{ cursor: loading ? 'wait' : 'pointer', minHeight: '190px' }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%',
                      background: 'rgba(255, 140, 66, 0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-primary))'
                    }}>
                      <Loader2 size={32} className="animate-spin" />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Analyzing {file ? file.name : 'spreadsheet'}...
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Detecting columns, reading rows and validating staff data...
                      </p>
                    </div>
                  </>
                ) : file ? (
                  <>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: '#10b981'
                    }}>
                      <CheckCircle size={32} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {file.name}
                      </h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {(file.size / 1024).toFixed(1)} KB &bull; Click below to analyze or choose a different file
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnalyzeFile(file);
                          }}
                          className="btn-primary"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '8px 20px', fontSize: '0.84rem', fontWeight: 700, borderRadius: '8px'
                          }}
                        >
                          <ArrowRight size={15} /> Upload &amp; Analyze Now
                        </button>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          or click anywhere to change file
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: 'rgba(255, 140, 66, 0.1)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-primary))'
                    }}>
                      <Upload size={28} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Choose a spreadsheet or drag &amp; drop here
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Supported formats: .xlsx, .xls, .csv (Max file size: 5 MB, up to 1,000 rows)
                      </p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Sample Template Link */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderRadius: '12px', background: 'rgba(255, 140, 66, 0.04)',
                border: '1px solid var(--border-glass)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} style={{ color: 'hsl(var(--color-primary))' }} />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                      Download Sample Template
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Pre-formatted template with standard columns and sample staff data.
                    </span>
                  </div>
                </div>
                <a
                  href="/api/staff/import/template"
                  download="Staff_Import_Template.xlsx"
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', fontSize: '0.8rem', textDecoration: 'none',
                    fontWeight: 600, borderRadius: '8px'
                  }}
                >
                  <Download size={14} /> Download Sample
                </a>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Verify Column Mapping
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    We automatically detected the following column mappings. Adjust if necessary.
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Total rows found: <strong>{previewData?.totalRows || 0}</strong>
                </span>
              </div>

              <div style={{ border: '1px solid var(--border-glass)', borderRadius: '12px', overflow: 'hidden' }}>
                <table className="mapping-table">
                  <thead>
                    <tr>
                      <th>Spreadsheet Column Header</th>
                      <th>Maps to Staff Field</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewData?.rawHeaders || []).map(header => {
                      const matched = columnMapping[header] || '';
                      return (
                        <tr key={header}>
                          <td style={{ fontWeight: 600 }}>{header}</td>
                          <td>
                            <select
                              value={matched}
                              onChange={(e) => setColumnMapping(prev => ({ ...prev, [header]: e.target.value }))}
                              style={{
                                padding: '6px 12px', borderRadius: '8px',
                                border: '1px solid var(--border-glass)', background: 'var(--bg-surface)',
                                color: 'var(--text-main)', fontSize: '0.8rem', width: '100%', maxWidth: '260px'
                              }}
                            >
                              {systemFields.map(field => (
                                <option key={field.key} value={field.key}>
                                  {field.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {matched ? (
                              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                <CheckCircle size={14} /> Mapped
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                Skipped
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Resolve */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Unmatched Designations / Roles Banner */}
              {previewData?.unmatchedDesignations?.length > 0 && (
                <div style={{
                  padding: '14px 18px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="#f59e0b" />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#b45309' }}>
                      Designation Resolution ({previewData.unmatchedDesignations.length} Unmatched)
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    The following designations are not currently in your system. Choose how to handle each one:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {previewData.unmatchedDesignations.map(desig => (
                      <div key={desig} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem' }}>
                        <strong style={{ minWidth: '120px' }}>{desig}</strong>
                        <select
                          value={designationResolutions[desig]?.action || 'create'}
                          onChange={(e) => {
                            const action = e.target.value;
                            setDesignationResolutions(prev => ({
                              ...prev,
                              [desig]: { action, mapTo: action === 'map' ? (previewData.activeDesignations?.[0] || 'Receptionist') : undefined }
                            }));
                          }}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-glass)', fontSize: '0.78rem' }}
                        >
                          <option value="create">Create New Designation</option>
                          <option value="map">Map to Existing</option>
                        </select>
                        {designationResolutions[desig]?.action === 'map' && (
                          <select
                            value={designationResolutions[desig]?.mapTo || ''}
                            onChange={(e) => {
                              const mapTo = e.target.value;
                              setDesignationResolutions(prev => ({
                                ...prev,
                                [desig]: { action: 'map', mapTo }
                              }));
                            }}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-glass)', fontSize: '0.78rem' }}
                          >
                            {(previewData.activeDesignations || ['Receptionist', 'Accountant', 'Librarian']).map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics Counters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 140, 66, 0.05)', border: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Rows</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{previewData?.totalRows || 0}</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#10b981' }}>Valid</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{previewData?.validCount || 0}</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>Errors</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>{previewData?.errorCount || 0}</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>Duplicates</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>{previewData?.duplicateCount || 0}</div>
                </div>
              </div>

              {/* Filter Tabs & Error Download */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['all', 'valid', 'error', 'duplicate'].map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPreviewFilter(f)}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem',
                        fontWeight: 600, border: 'none', cursor: 'pointer',
                        background: previewFilter === f ? 'hsl(var(--color-primary))' : 'rgba(255, 140, 66, 0.08)',
                        color: previewFilter === f ? '#ffffff' : 'var(--text-main)',
                        textTransform: 'capitalize'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {((previewData?.errorCount || 0) > 0 || (previewData?.duplicateCount || 0) > 0) && (
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '6px' }}
                  >
                    <Download size={12} /> Download Error Log (.xlsx)
                  </button>
                )}
              </div>

              {/* Preview Table */}
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Status</th>
                      <th>Full Name</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Issues / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreviewRows.slice(0, 100).map((row, idx) => {
                      const rowStatus = row.validationStatus || row.status || 'Valid';
                      const rowErrors = row.validationErrors || row.errors || [];
                      return (
                        <tr key={idx}>
                          <td>{row.rowNumber || idx + 1}</td>
                          <td>
                            <span className={`status-badge ${rowStatus.toLowerCase()}`}>
                              {rowStatus}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{row.data?.fullName || 'N/A'}</td>
                          <td>{row.data?.mobile || 'N/A'}</td>
                          <td>{row.data?.email || 'N/A'}</td>
                          <td>{row.data?.department || 'N/A'}</td>
                          <td>{row.data?.designation || 'Staff'}</td>
                          <td style={{ color: rowStatus === 'Valid' ? 'var(--text-muted)' : '#ef4444', fontSize: '0.72rem' }}>
                            {rowErrors.length > 0 ? rowErrors.join(', ') : 'Ready for staging'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: Results & Summary */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#10b981'
              }}>
                <CheckCircle size={36} />
              </div>

              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800 }}>
                  Staff Imported Successfully to Pending Setup!
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '480px' }}>
                  {(resultSummary?.importedCount ?? resultSummary?.stagedCount) || 0} staff members have been staged with collision-free reserved Staff IDs. They are ready in the <strong>Pending Staff Setup</strong> tab for role assignment and completion.
                </p>
              </div>

              {resultSummary?.reservedRange && (
                <div style={{
                  padding: '12px 20px', borderRadius: '12px', background: 'rgba(255, 140, 66, 0.06)',
                  border: '1px solid var(--border-glass)', fontSize: '0.85rem', fontWeight: 600
                }}>
                  Reserved Staff ID Range: <span style={{ color: 'hsl(var(--color-primary))' }}>{resultSummary.reservedRange}</span>
                </div>
              )}

              {/* Undo Last Import Card */}
              <div style={{
                width: '100%', maxWidth: '520px', padding: '16px', borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#b45309', display: 'block' }}>
                    Need to cancel this import?
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Undo is available for 24 hours. Removes staged pending rows only.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleUndoImport}
                  disabled={undoLoading || Boolean(undoSuccessMessage)}
                  className="btn-secondary"
                  style={{
                    padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem',
                    fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px',
                    borderColor: '#f59e0b', color: '#b45309'
                  }}
                >
                  {undoLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  Undo Import
                </button>
              </div>

              {undoSuccessMessage && (
                <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>
                  {undoSuccessMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="staff-import-modal-footer">
          {currentStep > 1 && currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', fontSize: '0.82rem' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          <div>
            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleAnalyzeFile}
                disabled={!file || loading}
                className="btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Upload &amp; Analyze
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700
                }}
              >
                Continue to Preview <ArrowRight size={16} />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={loading || (previewData?.validCount || 0) === 0}
                className="btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 22px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Import {previewData?.validCount || 0} Staff to Pending Setup
                  </>
                )}
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
                style={{
                  padding: '9px 24px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700
                }}
              >
                Go to Pending Staff Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
