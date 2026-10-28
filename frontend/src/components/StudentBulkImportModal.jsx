import React, { useState, useRef } from 'react';
import './StudentBulkImportModal.css';
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
  Users,
  Info,
  Loader2,
  RotateCcw
} from 'lucide-react';

export default function StudentBulkImportModal({ isOpen, onClose, onImportComplete }) {
  if (!isOpen) return null;

  // Wizard Step: 1 = Upload, 2 = Mapping, 3 = Preview, 4 = Processing & Results
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Options
  const [useMotherEmailFallback, setUseMotherEmailFallback] = useState(false);
  const [skipWarnings, setSkipWarnings] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Server Preview Response
  const [previewData, setPreviewData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [selectedRowIndexes, setSelectedRowIndexes] = useState([]);
  const [previewFilter, setPreviewFilter] = useState('all'); // 'all', 'ok', 'warning', 'error'

  // Job Execution & Status
  const [jobId, setJobId] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Handle Drag & Drop
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
      setErrorMessage('Please select a valid spreadsheet file (.xlsx, .xls, or .csv).');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds 5 MB limit. Please select a smaller file.');
      return;
    }
    setFile(selectedFile);
  };

  // Send File for Server-side Parse & Preview
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
      formData.append('useMotherEmailFallback', String(useMotherEmailFallback));

      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const res = await fetch('/api/students/import/preview', {
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
      // Default: select all non-error rows
      const initialSelected = (data.rows || [])
        .filter(r => r.status !== 'Error')
        .map(r => r.rowIndex);
      setSelectedRowIndexes(initialSelected);

      setCurrentStep(2); // Move to Column Mapping
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update a column's mapping dropdown
  const handleMappingChange = (colHeader, newFieldKey) => {
    setColumnMapping(prev => ({
      ...prev,
      [colHeader]: newFieldKey
    }));
  };

  // Toggle selection of a preview row
  const toggleRowSelection = (rowIndex) => {
    setSelectedRowIndexes(prev =>
      prev.includes(rowIndex)
        ? prev.filter(idx => idx !== rowIndex)
        : [...prev, rowIndex]
    );
  };

  // Confirm and Execute Import
  const handleConfirmImport = async () => {
    if (!previewData || !previewData.rows) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

      const payload = {
        rows: previewData.rows.map(r => r.data),
        columnMapping,
        skipWarnings,
        skipDuplicates,
        useMotherEmailFallback,
        selectedRowIndexes,
        fileName: file?.name || 'students.xlsx'
      };

      const res = await fetch('/api/students/import/confirm', {
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
        throw new Error(data.error || 'Failed to initiate batch import.');
      }

      setJobId(data.jobId);
      setBatchId(data.batchId);
      setCurrentStep(4); // Move to Progress Screen

      // Poll job status until completed
      pollJobStatus(data.jobId);
    } catch (err) {
      setErrorMessage(err.message);
      setLoading(false);
    }
  };

  // Poll job status
  const pollJobStatus = (id) => {
    const token = localStorage.getItem('token');
    const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/students/import/status/${id}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'x-tenant-id': tenantSubdomain
          }
        });

        if (res.ok) {
          const status = await res.json();
          setJobStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval);
            setLoading(false);
            if (status.status === 'completed' && status.imported > 0) {
              // Save latest batch ID in localStorage for undo button in Student Directory
              localStorage.setItem('latest_import_batch_id', status.batchId);
              localStorage.setItem('latest_import_batch_time', Date.now().toString());
              window.dispatchEvent(new CustomEvent('students-updated'));
              window.dispatchEvent(new CustomEvent('attendance-refresh'));
            }
          }
        }
      } catch (e) {
        console.error('Error polling import status:', e);
      }
    }, 600);
  };

  // Download Failed Rows Error Report
  const handleDownloadErrorReport = () => {
    if (!jobStatus || !jobStatus.failedRows || jobStatus.failedRows.length === 0) return;

    const headers = ['Row Number', 'Student Name', 'Reason for Failure'];
    const rows = jobStatus.failedRows.map(r => [
      r.rowIndex,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Import_Errors_${jobStatus.batchId || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Filter preview rows
  const filteredRows = (previewData?.rows || []).filter(r => {
    if (previewFilter === 'ok') return r.status === 'OK';
    if (previewFilter === 'warning') return r.status === 'Warning';
    if (previewFilter === 'error') return r.status === 'Error';
    return true;
  });

  return (
    <div className="bulk-import-overlay" onClick={onClose}>
      <div className="bulk-import-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="bulk-import-header">
          <div className="bulk-import-header-left">
            <div className="bulk-import-icon-badge">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="bulk-import-title">Import Students</h3>
              <p className="bulk-import-subtitle">Batch register students via Excel or CSV</p>
            </div>
          </div>
          <button className="bulk-import-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="bulk-import-stepper">
          <div className={`stepper-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
            <span className="stepper-circle">1</span>
            <span>Upload File</span>
          </div>
          <div className={`stepper-divider ${currentStep > 1 ? 'active' : ''}`} />
          <div className={`stepper-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
            <span className="stepper-circle">2</span>
            <span>Column Mapping</span>
          </div>
          <div className={`stepper-divider ${currentStep > 2 ? 'active' : ''}`} />
          <div className={`stepper-item ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}>
            <span className="stepper-circle">3</span>
            <span>Review & Preview</span>
          </div>
          <div className={`stepper-divider ${currentStep > 3 ? 'active' : ''}`} />
          <div className={`stepper-item ${currentStep === 4 ? 'active' : ''}`}>
            <span className="stepper-circle">4</span>
            <span>Summary</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="bulk-import-body">
          {errorMessage && (
            <div className="import-notice-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD FILE */}
          {currentStep === 1 && (
            <>
              <div
                className={`dropzone-container ${dragActive ? 'drag-over' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <div className="dropzone-icon">
                  <Upload size={28} />
                </div>
                <p className="dropzone-prompt-main">
                  {file ? file.name : 'Click or drag spreadsheet file here to upload'}
                </p>
                <p className="dropzone-prompt-sub">
                  Supported formats: .xlsx, .xls, .csv (Maximum 5 MB, up to 2,000 rows)
                </p>

                {file && (
                  <div className="dropzone-selected-file" onClick={(e) => e.stopPropagation()}>
                    <FileText size={18} style={{ color: '#FF8C42' }} />
                    <div>
                      <div className="dropzone-file-name">{file.name}</div>
                      <div className="dropzone-file-size">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                <label className="preview-option-checkbox">
                  <input
                    type="checkbox"
                    checked={useMotherEmailFallback}
                    onChange={(e) => setUseMotherEmailFallback(e.target.checked)}
                  />
                  <span>Use Mother's email for Parent Login if Father's email is missing (Default: Off)</span>
                </label>
              </div>
            </>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {currentStep === 2 && previewData && (
            <>
              <div className="import-notice-banner info">
                <Info size={18} />
                <span>
                  The server auto-detected and matched your spreadsheet columns to standard student form fields. Verify the mappings below. Unmapped columns will be left blank or filled with form defaults.
                </span>
              </div>

              <div className="mapping-table-container">
                <table className="mapping-table">
                  <thead>
                    <tr>
                      <th>Spreadsheet Column</th>
                      <th>Matched System Field</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewData.fileColumns || []).map((col) => {
                      const matchedKey = columnMapping[col] || '';
                      return (
                        <tr key={col}>
                          <td>
                            <div className="mapping-file-col">
                              <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                              <span>{col}</span>
                            </div>
                          </td>
                          <td>
                            <select
                              className="mapping-select"
                              value={matchedKey}
                              onChange={(e) => handleMappingChange(col, e.target.value)}
                            >
                              <option value="">-- Do Not Import / Ignore --</option>
                              {(previewData.availableFields || []).map((field) => (
                                <option key={field.key} value={field.key}>
                                  {field.label} {field.required ? '*(Required)' : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {matchedKey ? (
                              <span className="mapping-status-pill matched">
                                <CheckCircle size={12} /> Matched
                              </span>
                            ) : (
                              <span className="mapping-status-pill ignored">
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
            </>
          )}

          {/* STEP 3: PREVIEW & REVIEW */}
          {currentStep === 3 && previewData && (
            <>
              {/* Notice Banner for Parent Portal Login */}
              <div className="import-notice-banner">
                <AlertTriangle size={18} />
                <span>
                  <strong>Important Notice:</strong> Parent accounts will use the default password and must change it at first login.
                </span>
              </div>

              {/* Summary and Filter Bar */}
              <div className="preview-summary-bar">
                <div className="preview-filter-tabs">
                  <button
                    className={`preview-tab-btn ${previewFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setPreviewFilter('all')}
                  >
                    All ({previewData.summary?.total || 0})
                  </button>
                  <button
                    className={`preview-tab-btn ${previewFilter === 'ok' ? 'active' : ''}`}
                    onClick={() => setPreviewFilter('ok')}
                  >
                    <CheckCircle size={14} style={{ color: '#22c55e' }} /> OK ({previewData.summary?.ok || 0})
                  </button>
                  <button
                    className={`preview-tab-btn ${previewFilter === 'warning' ? 'active' : ''}`}
                    onClick={() => setPreviewFilter('warning')}
                  >
                    <AlertTriangle size={14} style={{ color: '#f59e0b' }} /> Warnings ({previewData.summary?.warning || 0})
                  </button>
                  <button
                    className={`preview-tab-btn ${previewFilter === 'error' ? 'active' : ''}`}
                    onClick={() => setPreviewFilter('error')}
                  >
                    <AlertCircle size={14} style={{ color: '#ef4444' }} /> Errors ({previewData.summary?.error || 0})
                  </button>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Selected: <strong>{selectedRowIndexes.length}</strong> of {previewData.rows?.length || 0} rows
                </div>
              </div>

              {/* Import Options Controls */}
              <div className="preview-options-bar">
                <label className="preview-option-checkbox">
                  <input
                    type="checkbox"
                    checked={!skipWarnings}
                    onChange={(e) => setSkipWarnings(!e.target.checked)}
                  />
                  <span>Import rows with warnings anyway (saved as incomplete, editable later)</span>
                </label>

                <label className="preview-option-checkbox">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                  />
                  <span>Skip duplicates silently</span>
                </label>
              </div>

              {/* Rows Table */}
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectedRowIndexes.length === previewData.rows.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRowIndexes(previewData.rows.map(r => r.rowIndex));
                            } else {
                              setSelectedRowIndexes([]);
                            }
                          }}
                        />
                      </th>
                      <th>Row</th>
                      <th>Status</th>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>DOB</th>
                      <th>Father Email (Parent Login)</th>
                      <th>Notes / Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const isSelected = selectedRowIndexes.includes(row.rowIndex);
                      return (
                        <tr
                          key={row.rowIndex}
                          style={{
                            background: isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                            opacity: isSelected ? 1 : 0.5
                          }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRowSelection(row.rowIndex)}
                            />
                          </td>
                          <td style={{ fontWeight: 600 }}>#{row.rowIndex}</td>
                          <td>
                            <span className={`row-badge ${row.status.toLowerCase()}`}>
                              {row.status === 'OK' && <CheckCircle size={12} />}
                              {row.status === 'Warning' && <AlertTriangle size={12} />}
                              {row.status === 'Error' && <AlertCircle size={12} />}
                              {row.status}
                            </span>
                            {row.isSibling && (
                              <span className="sibling-tag">
                                Sibling
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {row.data.firstName} {row.data.lastName}
                          </td>
                          <td>{row.data.studentClass || '—'} {row.data.section ? `(${row.data.section})` : ''}</td>
                          <td>{row.data.dob || '—'}</td>
                          <td>{row.data.fatherEmail || '—'}</td>
                          <td style={{ color: row.status === 'Error' ? '#ef4444' : row.status === 'Warning' ? '#f59e0b' : 'var(--text-muted)' }}>
                            {row.message}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* STEP 4: PROCESSING & SUMMARY */}
          {currentStep === 4 && (
            <div className="progress-container">
              {loading || (jobStatus && jobStatus.status === 'processing') ? (
                <>
                  <Loader2 size={44} className="animate-spin" style={{ color: '#FF8C42' }} />
                  <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                    Processing Student Bulk Import...
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Registering student records and setting up parent access in isolated transactions.
                  </p>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${jobStatus?.progress || 10}%` }}
                    />
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {jobStatus?.progress || 0}% Complete
                  </span>
                </>
              ) : (
                <>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={36} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>
                    Import Process Completed!
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Batch ID: <code>{batchId}</code>
                  </p>

                  <div className="stats-grid">
                    <div className="stat-box">
                      <span className="stat-number success">{jobStatus?.imported || 0}</span>
                      <span className="stat-label">Students Imported</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-number skipped">{jobStatus?.skipped || 0}</span>
                      <span className="stat-label">Rows Skipped</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-number failed">{jobStatus?.failed || 0}</span>
                      <span className="stat-label">Failed</span>
                    </div>
                  </div>

                  {jobStatus?.failed > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleDownloadErrorReport}
                        style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download size={14} /> Download Failed Rows Error Report
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bulk-import-footer">
          <div>
            {currentStep === 2 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentStep(1)}
                disabled={loading}
              >
                <ArrowLeft size={16} /> Back to Upload
              </button>
            )}
            {currentStep === 3 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentStep(2)}
                disabled={loading}
              >
                <ArrowLeft size={16} /> Back to Mapping
              </button>
            )}
          </div>

          <div className="footer-actions-right">
            {currentStep === 1 && (
              <>
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAnalyzeFile}
                  disabled={!file || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      Continue to Mapping <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setCurrentStep(3)}
              >
                Review & Preview Rows <ArrowRight size={16} />
              </button>
            )}

            {currentStep === 3 && (
              <>
                <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleConfirmImport}
                  disabled={selectedRowIndexes.length === 0 || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Confirm Import ({selectedRowIndexes.length} Students)
                    </>
                  )}
                </button>
              </>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('students-updated'));
                  window.dispatchEvent(new CustomEvent('attendance-refresh'));
                  onImportComplete?.();
                  onClose();
                }}
                disabled={loading || jobStatus?.status === 'processing'}
              >
                Done & View Student Directory
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
