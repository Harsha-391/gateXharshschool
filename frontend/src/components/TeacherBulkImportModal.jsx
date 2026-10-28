import React, { useState, useRef } from 'react';
import './TeacherBulkImportModal.css';
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

export default function TeacherBulkImportModal({ isOpen, onClose, onImportComplete }) {
  if (!isOpen) return null;

  // Steps: 1 = Upload, 2 = Mapping, 3 = Designations & Preview, 4 = Results
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
  };

  // 1. Analyze and Preview File
  const handleAnalyzeFile = async () => {
    if (!file) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch('/api/teachers/import/preview', {
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

  // 2. Confirm and Stage Teachers
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
        fileName: file?.name || 'teacher_import.xlsx'
      };

      const res = await fetch('/api/teachers/import/confirm', {
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
        throw new Error(data.error || 'Failed to confirm teacher import.');
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
    const confirmMsg = `This will remove ${resultSummary.importedCount || 0} pending teachers from the last import. Teachers already set up from this batch will NOT be removed. Are you sure?`;
    if (!window.confirm(confirmMsg)) return;

    setUndoLoading(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch(`/api/teachers/import/undo/${resultSummary.batchId}`, {
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

      setUndoSuccessMessage(`Batch successfully undone! Removed ${data.removedCount} pending teachers.`);
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
      r => r.validationStatus === 'Error' || r.validationStatus === 'Duplicate'
    );
    if (errorRows.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch('/api/teachers/import/error-report', {
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
      a.download = 'Teacher_Import_Error_Report.xlsx';
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
    { key: 'subjects', label: 'Subjects (Required)' },
    { key: 'mobile', label: 'Mobile Number' },
    { key: 'email', label: 'Email Address' },
    { key: 'qualification', label: 'Qualification' },
    { key: 'experience', label: 'Experience (years)' },
    { key: 'joiningDate', label: 'Joining Date' },
    { key: 'designation', label: 'Designation' },
    { key: 'gender', label: 'Gender' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'address', label: 'Address' }
  ];

  const filteredPreviewRows = (previewData?.rows || []).filter(r => {
    if (previewFilter === 'valid') return r.validationStatus === 'Valid';
    if (previewFilter === 'error') return r.validationStatus === 'Error';
    if (previewFilter === 'duplicate') return r.validationStatus === 'Duplicate';
    return true;
  });

  return (
    <div className="teacher-import-modal-overlay">
      <div className="teacher-import-modal-card">
        {/* Modal Header */}
        <div className="teacher-import-modal-header">
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
                Bulk Teacher Import
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
        <div className="teacher-import-steps-bar">
          <div className={`teacher-import-step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'done' : ''}`}>
            <span className="teacher-import-step-circle">{currentStep > 1 ? <Check size={14} /> : '1'}</span>
            <span>Upload File</span>
          </div>
          <span style={{ color: 'var(--border-glass)' }}>&rarr;</span>
          <div className={`teacher-import-step-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'done' : ''}`}>
            <span className="teacher-import-step-circle">{currentStep > 2 ? <Check size={14} /> : '2'}</span>
            <span>Column Mapping</span>
          </div>
          <span style={{ color: 'var(--border-glass)' }}>&rarr;</span>
          <div className={`teacher-import-step-item ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'done' : ''}`}>
            <span className="teacher-import-step-circle">{currentStep > 3 ? <Check size={14} /> : '3'}</span>
            <span>Preview &amp; Resolve</span>
          </div>
          <span style={{ color: 'var(--border-glass)' }}>&rarr;</span>
          <div className={`teacher-import-step-item ${currentStep === 4 ? 'active' : ''}`}>
            <span className="teacher-import-step-circle">4</span>
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
        <div className="teacher-import-modal-body">
          {/* STEP 1: Upload File */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                className={`teacher-import-dropzone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'rgba(255, 140, 66, 0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-primary))'
                }}>
                  <Upload size={28} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {file ? file.name : 'Choose a spreadsheet or drag & drop here'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Supported formats: .xlsx, .xls, .csv (Max file size: 5 MB, up to 1,000 rows)
                  </p>
                </div>
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
                      Pre-formatted template with standard columns and sample teacher data.
                    </span>
                  </div>
                </div>
                <a
                  href="/api/teachers/import/template"
                  download="Teacher_Import_Template.xlsx"
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
                      <th>Maps to Teacher Field</th>
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
                              {systemFields.map(f => (
                                <option key={f.key} value={f.key}>{f.label}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {matched ? (
                              <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={14} /> Mapped
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                Ignored
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

          {/* STEP 3: Preview & Resolve Designations */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Unmatched Designation Resolution Card */}
              {previewData?.unmatchedDesignations && previewData.unmatchedDesignations.length > 0 && (
                <div style={{
                  padding: '16px', borderRadius: '12px', background: 'rgba(255, 140, 66, 0.05)',
                  border: '1px solid rgba(255, 140, 66, 0.25)', display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} style={{ color: 'hsl(var(--color-primary))' }} />
                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Resolve Unknown Designations ({previewData.unmatchedDesignations.length})
                    </h5>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    The following designations are not in the master list. Choose whether to create them, map them to an existing designation, or leave blank.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                    {previewData.unmatchedDesignations.map(unmatched => {
                      const res = designationResolutions[unmatched] || { action: 'create', name: unmatched };
                      return (
                        <div key={unmatched} style={{
                          padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-surface)',
                          border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '6px'
                        }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--color-primary))' }}>
                            "{unmatched}"
                          </span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <select
                              value={res.action}
                              onChange={(e) => setDesignationResolutions(prev => ({
                                ...prev,
                                [unmatched]: { ...res, action: e.target.value }
                              }))}
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-glass)' }}
                            >
                              <option value="create">Create New Designation</option>
                              <option value="map">Map to Existing</option>
                              <option value="blank">Set as Default Teacher</option>
                            </select>

                            {res.action === 'map' && (
                              <select
                                value={res.target || ''}
                                onChange={(e) => setDesignationResolutions(prev => ({
                                  ...prev,
                                  [unmatched]: { ...res, target: e.target.value }
                                }))}
                                style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-glass)' }}
                              >
                                <option value="">Select Existing...</option>
                                {(previewData.availableDesignations || []).map(d => (
                                  <option key={d.id} value={d.name}>{d.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Filter Tabs & Preview Stats */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('all')}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                      cursor: 'pointer', border: '1px solid var(--border-glass)',
                      background: previewFilter === 'all' ? 'rgba(255, 140, 66, 0.15)' : 'transparent',
                      color: previewFilter === 'all' ? 'hsl(var(--color-primary))' : 'var(--text-muted)'
                    }}
                  >
                    All ({previewData?.summary?.total || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('valid')}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                      cursor: 'pointer', border: '1px solid var(--border-glass)',
                      background: previewFilter === 'valid' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      color: previewFilter === 'valid' ? '#10b981' : 'var(--text-muted)'
                    }}
                  >
                    Valid ({previewData?.summary?.valid || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('error')}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                      cursor: 'pointer', border: '1px solid var(--border-glass)',
                      background: previewFilter === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      color: previewFilter === 'error' ? '#ef4444' : 'var(--text-muted)'
                    }}
                  >
                    Errors ({previewData?.summary?.error || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('duplicate')}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                      cursor: 'pointer', border: '1px solid var(--border-glass)',
                      background: previewFilter === 'duplicate' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                      color: previewFilter === 'duplicate' ? '#f59e0b' : 'var(--text-muted)'
                    }}
                  >
                    Duplicates ({previewData?.summary?.duplicate || 0})
                  </button>
                </div>

                {(previewData?.summary?.error > 0 || previewData?.summary?.duplicate > 0) && (
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={13} /> Download Error Report
                  </button>
                )}
              </div>

              {/* Data Rows Preview Table */}
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Status</th>
                      <th>Full Name</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>Subjects</th>
                      <th>Designation</th>
                      <th>Gender / DOB</th>
                      <th>Notes / Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreviewRows.slice(0, 50).map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{r.rowIndex}</td>
                        <td>
                          <span className={`status-chip ${r.validationStatus?.toLowerCase()}`}>
                            {r.validationStatus}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{r.fullName || '-'}</td>
                        <td>{r.mobile || '-'}</td>
                        <td>{r.email || '-'}</td>
                        <td>{r.subjects || '-'}</td>
                        <td>{r.designation || '-'}</td>
                        <td>{r.gender || '-'} / {r.dob || '-'}</td>
                        <td style={{ color: r.validationStatus === 'Valid' ? 'var(--text-muted)' : '#ef4444', maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {r.validationMessage || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredPreviewRows.length > 50 && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  Showing first 50 rows of {filteredPreviewRows.length} matching rows.
                </span>
              )}
            </div>
          )}

          {/* STEP 4: Results Confirmation */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#10b981'
              }}>
                <CheckCircle size={36} />
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Batch Staged Successfully!
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '520px' }}>
                  {resultSummary?.importedCount || 0} teacher(s) have been placed in the <strong>Pending Setup</strong> roster with reserved IDs. They will NOT appear in attendance, timetable or directory until setup is completed.
                </p>
              </div>

              {/* Stats badges */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ padding: '12px 20px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', display: 'block' }}>
                    {resultSummary?.importedCount || 0}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Staged (Pending)</span>
                </div>
                <div style={{ padding: '12px 20px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444', display: 'block' }}>
                    {resultSummary?.skippedCount || 0}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Skipped / Errors</span>
                </div>
              </div>

              {undoSuccessMessage && (
                <div style={{
                  padding: '12px 18px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981', fontSize: '0.82rem', fontWeight: 600
                }}>
                  {undoSuccessMessage}
                </div>
              )}

              {/* Undo & Actions */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '10px' }}>
                {!undoSuccessMessage && (
                  <button
                    type="button"
                    onClick={handleUndoImport}
                    disabled={undoLoading}
                    className="btn-secondary"
                    style={{
                      padding: '10px 18px', borderRadius: '10px', fontSize: '0.82rem',
                      fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                      borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444'
                    }}
                  >
                    {undoLoading ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                    Undo Last Import
                  </button>
                )}

                {resultSummary?.skippedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="btn-secondary"
                    style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={15} /> Download Error Report
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="teacher-import-modal-footer">
          {currentStep > 1 && currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="btn-secondary"
              style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleAnalyzeFile}
                disabled={!file || loading}
                className="btn-primary"
                style={{
                  padding: '10px 22px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: (!file || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <>Next: Map Columns <ArrowRight size={16} /></>}
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="btn-primary"
                style={{
                  padding: '10px 22px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                }}
              >
                Next: Preview &amp; Validate <ArrowRight size={16} />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={loading || (previewData?.summary?.valid || 0) === 0}
                className="btn-primary"
                style={{
                  padding: '10px 24px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '6px',
                  cursor: (loading || (previewData?.summary?.valid || 0) === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Staging Teachers...</> : <>Import {previewData?.summary?.valid || 0} Valid Teachers <ArrowRight size={16} /></>}
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
                style={{ padding: '10px 24px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Close &amp; View Pending Roster
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
