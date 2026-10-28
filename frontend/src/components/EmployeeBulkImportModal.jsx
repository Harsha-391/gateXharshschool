import React, { useState, useRef } from 'react';
import './EmployeeBulkImportModal.css';
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
  Loader2,
  RotateCcw,
  Download
} from 'lucide-react';

export default function EmployeeBulkImportModal({ isOpen, onClose, onImportComplete }) {
  if (!isOpen) return null;

  // Wizard Step: 1 = Upload, 2 = Column Mapping, 3 = Preview & Validate, 4 = Results
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Options
  const [skipInvalid, setSkipInvalid] = useState(true);

  // Server Preview Response
  const [previewData, setPreviewData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [previewFilter, setPreviewFilter] = useState('all'); // 'all', 'valid', 'error', 'duplicate'

  // Results & Undo
  const [resultSummary, setResultSummary] = useState(null);
  const [undoLoading, setUndoLoading] = useState(false);
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
      setErrorMessage('Please upload a valid spreadsheet file (.xlsx, .xls, or .csv).');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5 MB limit. Please upload a smaller file.');
      return;
    }
    setFile(selectedFile);
  };

  // 1. Send File for Server-side Parse & Preview
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

      const res = await fetch('/api/employees/import/preview', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-tenant-id': tenantSubdomain
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse spreadsheet.');
      }

      setPreviewData(data);
      setColumnMapping(data.detectedMapping || {});
      setCurrentStep(2); // Move to Column Mapping Step
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Confirm and Execute Batch Import
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
        skipInvalid,
        fileName: file?.name || 'employee_import.xlsx'
      };

      const res = await fetch('/api/employees/import/confirm', {
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
        throw new Error(data.error || 'Failed to execute employee import.');
      }

      setResultSummary(data);
      setCurrentStep(4); // Move to Results Screen

      // Save batch ID in localStorage for undo button
      if (data.batchId) {
        localStorage.setItem('latest_emp_import_batch_id', data.batchId);
        localStorage.setItem('latest_emp_import_batch_time', Date.now().toString());
        localStorage.setItem('latest_emp_import_batch_count', (data.importedCount || 0).toString());
      }

      // Dynamically notify system components to refresh immediately
      window.dispatchEvent(new CustomEvent('refresh_employees', { detail: data }));
      if (typeof onImportComplete === 'function') {
        onImportComplete(data);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';
      const res = await fetch('/api/employees/import/template', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-tenant-id': tenantSubdomain
        }
      });
      if (!res.ok) throw new Error('Failed to download template.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Employee_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading template: ' + err.message);
    }
  };

  // Download Error Report
  const handleDownloadErrorReport = async () => {
    if (!resultSummary || !resultSummary.skippedRows || resultSummary.skippedRows.length === 0) {
      alert('No error rows available to download.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';
      const res = await fetch('/api/employees/import/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-tenant-id': tenantSubdomain
        },
        body: JSON.stringify({ skippedRows: resultSummary.skippedRows })
      });
      if (!res.ok) throw new Error('Failed to generate error report.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Employee_Import_Error_Report.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading error report: ' + err.message);
    }
  };

  // Undo Last Import directly from modal
  const handleUndoImport = async () => {
    if (!resultSummary?.batchId) return;
    if (!window.confirm(`Are you sure you want to undo this import? This will remove all ${resultSummary.importedCount} employees from the system.`)) {
      return;
    }

    setUndoLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantSubdomain = localStorage.getItem('tenant_subdomain') || 'default';
      const res = await fetch(`/api/employees/import/undo/${resultSummary.batchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-tenant-id': tenantSubdomain
        },
        body: JSON.stringify({ force: true })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to undo import.');

      alert(data.message || 'Import undone successfully.');
      localStorage.removeItem('latest_emp_import_batch_id');
      localStorage.removeItem('latest_emp_import_batch_time');
      window.dispatchEvent(new Event('refresh_employees'));
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setUndoLoading(false);
    }
  };

  // Filter rows for preview
  const filteredRows = (previewData?.rows || []).filter(r => {
    if (previewFilter === 'valid') return r.status === 'Valid';
    if (previewFilter === 'error') return r.status === 'Error';
    if (previewFilter === 'duplicate') return r.status === 'Duplicate';
    return true;
  });

  return (
    <div className="emp-import-overlay" onClick={onClose}>
      <div className="emp-import-modal animate-slide-up" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="emp-import-header">
          <div className="emp-import-header-left">
            <div className="emp-import-icon-badge">
              <Users size={22} />
            </div>
            <div>
              <h3>Bulk Employee Import</h3>
              <p>Import employees into the registry with auto-validation and instant QR generation</p>
            </div>
          </div>
          <button className="emp-import-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Stepper Navigation */}
        <div className="emp-import-stepper">
          <div className={`emp-import-step ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <span className="emp-import-step-num">{currentStep > 1 ? '✓' : '1'}</span>
            <span>Upload File</span>
          </div>
          <div className={`emp-import-step ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <span className="emp-import-step-num">{currentStep > 2 ? '✓' : '2'}</span>
            <span>Column Mapping</span>
          </div>
          <div className={`emp-import-step ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <span className="emp-import-step-num">{currentStep > 3 ? '✓' : '3'}</span>
            <span>Preview & Validate</span>
          </div>
          <div className={`emp-import-step ${currentStep === 4 ? 'active' : ''}`}>
            <span className="emp-import-step-num">4</span>
            <span>Results & Confirmation</span>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div style={{ margin: '16px 24px 0', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="emp-import-body">

          {/* STEP 1: UPLOAD FILE */}
          {currentStep === 1 && (
            <div>
              <div 
                className={`emp-import-dropzone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".xlsx,.xls,.csv" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                />
                
                <div className="emp-import-dropzone-icon">
                  <Upload size={28} />
                </div>
                
                {!file ? (
                  <>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Click to select or drag and drop spreadsheet</h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Supports .xlsx, .xls, and .csv files up to 5 MB (Max 1,000 rows)</p>
                  </>
                ) : (
                  <div className="emp-import-file-badge" onClick={e => e.stopPropagation()}>
                    <FileSpreadsheet size={24} style={{ color: '#FF8C42' }} />
                    <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                      <strong style={{ display: 'block', fontSize: '0.88rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{file.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFile(null)} 
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Download Template Box */}
              <div className="emp-import-template-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={22} style={{ color: '#FF8C42' }} />
                  <div>
                    <strong style={{ fontSize: '0.88rem', display: 'block' }}>Need the format template?</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Download sample file with all supported employee columns and realistic sample data.</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={handleDownloadTemplate} 
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Download size={14} /> Download Sample Template
                </button>
              </div>

              {/* Information Callout */}
              <div style={{ marginTop: '20px', padding: '14px 18px', background: 'rgba(255, 140, 66, 0.05)', borderRadius: '10px', borderLeft: '3px solid #FF8C42', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Important Notes:</strong>
                • Employees have no login credentials created; they are added purely to staff records and directories.<br />
                • Sensitive fields (Mobile, Email, Aadhaar, PAN) are AES-256 encrypted at rest.<br />
                • If Employee ID is left empty, the system will auto-assign sequential IDs in the format <code>EMP-2026-XXXX</code>.
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {currentStep === 2 && previewData && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700 }}>Map Spreadsheet Columns to Employee Attributes</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  We auto-matched columns based on your headers. Review and adjust any mappings if necessary.
                </p>
              </div>

              <div className="emp-import-mapping-grid">
                {(previewData.fileColumns || []).map(header => {
                  const currentMappedKey = columnMapping[header] || '';
                  const targetDef = (previewData.availableFields || []).find(f => f.key === currentMappedKey);

                  return (
                    <div key={header} className="emp-import-map-item">
                      <div className="emp-import-map-label">
                        <span>File Column: <strong style={{ color: 'var(--text-main)' }}>{header}</strong></span>
                        {targetDef?.required && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>Required</span>}
                      </div>
                      <select 
                        className="select-custom"
                        value={currentMappedKey}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [header]: e.target.value })}
                        style={{ padding: '8px 12px', fontSize: '0.82rem', borderRadius: '8px' }}
                      >
                        <option value="">— Ignore / Don't Import —</option>
                        {(previewData.availableFields || []).map(f => (
                          <option key={f.key} value={f.key}>
                            {f.label} {f.required ? '*' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION */}
          {currentStep === 3 && previewData && (
            <div>
              {/* Summary Stats Row */}
              <div className="emp-import-stats-row">
                <div 
                  className={`emp-import-stat-card ${previewFilter === 'all' ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setPreviewFilter('all')}
                >
                  <span className="emp-import-stat-value">{previewData.summary?.total || 0}</span>
                  <span className="emp-import-stat-label">Total Rows</span>
                </div>
                <div 
                  className={`emp-import-stat-card ${previewFilter === 'valid' ? 'active' : ''}`}
                  style={{ cursor: 'pointer', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                  onClick={() => setPreviewFilter('valid')}
                >
                  <span className="emp-import-stat-value" style={{ color: '#10b981' }}>{previewData.summary?.valid || 0}</span>
                  <span className="emp-import-stat-label">Valid Rows</span>
                </div>
                <div 
                  className={`emp-import-stat-card ${previewFilter === 'error' ? 'active' : ''}`}
                  style={{ cursor: 'pointer', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  onClick={() => setPreviewFilter('error')}
                >
                  <span className="emp-import-stat-value" style={{ color: '#ef4444' }}>{previewData.summary?.error || 0}</span>
                  <span className="emp-import-stat-label">Errors</span>
                </div>
                <div 
                  className={`emp-import-stat-card ${previewFilter === 'duplicate' ? 'active' : ''}`}
                  style={{ cursor: 'pointer', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                  onClick={() => setPreviewFilter('duplicate')}
                >
                  <span className="emp-import-stat-value" style={{ color: '#f59e0b' }}>{previewData.summary?.duplicate || 0}</span>
                  <span className="emp-import-stat-label">Duplicates</span>
                </div>
              </div>

              {/* Skip Option */}
              <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem' }}>
                  <input 
                    type="checkbox" 
                    checked={skipInvalid} 
                    onChange={e => setSkipInvalid(e.target.checked)} 
                    style={{ accentColor: '#FF8C42' }}
                  />
                  <span><strong>Import only valid rows</strong> (skip bad/duplicate rows and generate error report)</span>
                </label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Showing {filteredRows.length} of {previewData.rows.length} rows</span>
              </div>

              {/* Table Preview */}
              <div className="emp-import-table-wrap">
                <table className="emp-import-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Row</th>
                      <th>Status</th>
                      <th>Employee Name</th>
                      <th>Designation</th>
                      <th>Mobile / Phone</th>
                      <th>Validation Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length > 0 ? (
                      filteredRows.map(row => {
                        const d = row.data || {};
                        const name = d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || '—';
                        return (
                          <tr key={row.rowIndex}>
                            <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{row.rowIndex}</td>
                            <td>
                              <span className={`emp-status-badge ${row.status.toLowerCase()}`}>
                                {row.status === 'Valid' && <CheckCircle size={12} />}
                                {row.status === 'Error' && <AlertCircle size={12} />}
                                {row.status === 'Duplicate' && <AlertTriangle size={12} />}
                                {row.status}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{name}</td>
                            <td>{d.designation || '—'}</td>
                            <td>{d.mobile || d.phone || '—'}</td>
                            <td style={{ color: row.status === 'Valid' ? '#10b981' : '#ef4444', fontSize: '0.78rem' }}>
                              {row.message}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          No rows found matching current filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: RESULTS */}
          {currentStep === 4 && resultSummary && (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={36} />
              </div>

              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 8px 0' }}>Import Completed!</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
                Employee batch <code>{resultSummary.batchId}</code> has been processed and saved.
              </p>

              {/* Metric Highlights */}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
                <div style={{ padding: '16px 28px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', display: 'block' }}>{resultSummary.importedCount}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Imported Successfully</span>
                </div>
                {resultSummary.skippedCount > 0 && (
                  <div style={{ padding: '16px 28px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', display: 'block' }}>{resultSummary.skippedCount}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Skipped / Errors</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {resultSummary.skippedCount > 0 && (
                  <button 
                    type="button"
                    onClick={handleDownloadErrorReport} 
                    className="btn-secondary"
                    style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                  >
                    <Download size={15} /> Download Error Report (.xlsx)
                  </button>
                )}

                <button 
                  type="button"
                  onClick={handleUndoImport}
                  disabled={undoLoading}
                  className="btn-secondary"
                  style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                >
                  {undoLoading ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />} Undo Import
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="emp-import-footer">
          <div>
            {currentStep > 1 && currentStep < 4 && (
              <button 
                type="button" 
                onClick={() => setCurrentStep(prev => prev - 1)} 
                className="btn-secondary"
                disabled={loading}
                style={{ padding: '10px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep === 1 && (
              <button 
                type="button" 
                onClick={handleAnalyzeFile} 
                disabled={!file || loading}
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <>Continue to Mapping <ArrowRight size={16} /></>}
              </button>
            )}

            {currentStep === 2 && (
              <button 
                type="button" 
                onClick={() => setCurrentStep(3)} 
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Preview Data <ArrowRight size={16} />
              </button>
            )}

            {currentStep === 3 && (
              <button 
                type="button" 
                onClick={handleConfirmImport} 
                disabled={loading || (previewData?.summary?.valid === 0 && skipInvalid)}
                className="btn-primary"
                style={{ padding: '10px 28px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Processing Import...</> : <>Confirm & Import ({previewData?.summary?.valid || 0} Employees) <CheckCircle size={16} /></>}
              </button>
            )}

            {currentStep === 4 && (
              <button 
                type="button" 
                onClick={onClose} 
                className="btn-primary"
                style={{ padding: '10px 28px', fontSize: '0.85rem' }}
              >
                Done / Close
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
