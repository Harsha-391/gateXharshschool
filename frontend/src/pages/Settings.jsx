import React, { useState, useEffect } from 'react';
import { 
  Clock, Save, ShieldAlert, Settings as SettingsIcon, Calendar, Coffee, 
  AlertCircle, Check, X, Edit2, Trash2, Sliders, FileText, ChevronRight, HelpCircle, ToggleLeft, ToggleRight
} from 'lucide-react';

const TimePickerSelect = ({ value, onChange }) => {
  const match = value ? value.match(/(\d+):(\d+)\s*(AM|PM)/i) : null;
  const initialHour = match ? match[1] : '08';
  const initialMinute = match ? match[2] : '00';
  const initialPeriod = match ? match[3].toUpperCase() : 'AM';

  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [period, setPeriod] = useState(initialPeriod);

  useEffect(() => {
    if (value) {
      const m = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (m) {
        setHour(m[1]);
        setMinute(m[2]);
        setPeriod(m[3].toUpperCase());
      }
    }
  }, [value]);

  const handleSelectChange = (newHour, newMinute, newPeriod) => {
    setHour(newHour);
    setMinute(newMinute);
    setPeriod(newPeriod);
    onChange(`${newHour}:${newMinute} ${newPeriod}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <select
        value={hour}
        onChange={(e) => handleSelectChange(e.target.value, minute, period)}
        style={{ flex: 1, padding: '10px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
      >
        {hours.map(h => <option key={h} value={h} style={{ color: '#0f172a' }}>{h}</option>)}
      </select>
      <span style={{ alignSelf: 'center', fontWeight: 700, color: '#475569' }}>:</span>
      <select
        value={minute}
        onChange={(e) => handleSelectChange(hour, e.target.value, period)}
        style={{ flex: 1, padding: '10px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
      >
        {minutes.map(m => <option key={m} value={m} style={{ color: '#0f172a' }}>{m}</option>)}
      </select>
      <select
        value={period}
        onChange={(e) => handleSelectChange(hour, minute, e.target.value)}
        style={{ padding: '10px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
      >
        <option value="AM" style={{ color: '#0f172a' }}>AM</option>
        <option value="PM" style={{ color: '#0f172a' }}>PM</option>
      </select>
    </div>
  );
};

export default function Settings({ showToast }) {
  const [settingsTab, setSettingsTab] = useState('attendance'); // 'attendance' or 'leaves'
  // --- Attendance Settings States ---
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [settings, setSettings] = useState({
    checkInStart: '08:00 AM',
    lateTime: '09:00 AM',
    halfDayTime: '11:00 AM',
    checkOutTime: '05:00 PM',
    minWorkingHours: 8.00,
    gracePeriod: 15
  });
  const [tempSettings, setTempSettings] = useState({ ...settings });

  // --- Leave Settings States ---
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [savingLeave, setSavingLeave] = useState(false);
  const [leavePolicies, setLeavePolicies] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    maxDays: 12,
    isPaid: true,
    carryForward: false,
    encashment: false,
    status: 'Active'
  });

  const getTenantHeader = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant');
    if (tenantParam) return tenantParam;

    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return parts[0];
    }
    return '';
  };

  // --- API Handlers ---
  const fetchAttendanceSettings = async () => {
    setLoadingAttendance(true);
    try {
      const token = localStorage.getItem('token');
      const tenant = getTenantHeader();
      const response = await fetch('/api/attendance-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant
        }
      });
      if (response.ok) {
        const data = await response.json();
        const loaded = {
          checkInStart: data.checkInStart || '08:00 AM',
          lateTime: data.lateTime || '09:00 AM',
          halfDayTime: data.halfDayTime || '11:00 AM',
          checkOutTime: data.checkOutTime || '05:00 PM',
          minWorkingHours: Number(data.minWorkingHours) || 8.00,
          gracePeriod: Number(data.gracePeriod) || 15
        };
        setSettings(loaded);
        setTempSettings(loaded);
      }
    } catch (err) {
      console.error('Error fetching attendance settings:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchLeaveSettings = async () => {
    setLoadingLeaves(true);
    try {
      const token = localStorage.getItem('token');
      const tenant = getTenantHeader();
      const response = await fetch('/api/leave-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLeavePolicies(data);
      }
    } catch (err) {
      console.error('Error fetching leave settings:', err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  useEffect(() => {
    fetchAttendanceSettings();
    fetchLeaveSettings();
  }, []);

  // --- Attendance Actions ---
  const handleAttendanceChange = (e) => {
    const { name, value } = e.target;
    setTempSettings(prev => ({
      ...prev,
      [name]: name === 'gracePeriod' || name === 'minWorkingHours' ? Number(value) : value
    }));
  };

  const handleAttendanceTimeChange = (fieldName, timeStr) => {
    setTempSettings(prev => ({
      ...prev,
      [fieldName]: timeStr
    }));
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    setSavingAttendance(true);
    try {
      const token = localStorage.getItem('token');
      const tenant = getTenantHeader();
      const response = await fetch('/api/attendance-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant
        },
        body: JSON.stringify(tempSettings)
      });
      if (response.ok) {
        const updated = await response.json();
        const final = {
          checkInStart: updated.checkInStart,
          lateTime: updated.lateTime,
          halfDayTime: updated.halfDayTime,
          checkOutTime: updated.checkOutTime,
          minWorkingHours: Number(updated.minWorkingHours),
          gracePeriod: Number(updated.gracePeriod)
        };
        setSettings(final);
        setShowAttendanceModal(false);
        showToast('Attendance rules updated successfully!', 'success');
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to save settings.', 'error');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast('Failed to save settings.', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  // --- Leave Actions ---
  const handleOpenLeaveModal = (policy = null) => {
    if (policy) {
      setSelectedPolicy(policy);
      setLeaveForm({
        leaveCode: policy.leaveCode || '',
        leaveType: policy.leaveType || '',
        maxDays: Number(policy.maxDays) || 0,
        maxCarryForward: Number(policy.maxCarryForward) || 0,
        isPaid: policy.isPaid === 1 || policy.isPaid === true,
        status: policy.status || 'Active',
        description: policy.description || ''
      });
    } else {
      setSelectedPolicy(null);
      setLeaveForm({
        leaveCode: '',
        leaveType: '',
        maxDays: 0,
        maxCarryForward: 0,
        isPaid: true,
        status: 'Active',
        description: ''
      });
    }
    setShowLeaveModal(true);
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setSavingLeave(true);
    try {
      const token = localStorage.getItem('token');
      const tenant = getTenantHeader();
      const payload = {
        leaveCode: leaveForm.leaveCode,
        leaveType: leaveForm.leaveType,
        maxDays: Number(leaveForm.maxDays),
        maxCarryForward: Number(leaveForm.maxCarryForward),
        isPaid: leaveForm.isPaid,
        status: leaveForm.status,
        description: leaveForm.description
      };
      
      const response = await fetch('/api/leave-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast(selectedPolicy ? 'Leave policy updated successfully!' : 'Leave policy created successfully!', 'success');
        setShowLeaveModal(false);
        fetchLeaveSettings();
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to save leave policy.', 'error');
      }
    } catch (err) {
      console.error('Error saving leave settings:', err);
      showToast('Failed to update leave settings.', 'error');
    } finally {
      setSavingLeave(false);
    }
  };

  const handleDeleteLeavePolicy = async (leaveType) => {
    if (!window.confirm(`Are you sure you want to delete the leave policy "${leaveType}"? This will delete it for both Teacher and Staff.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const tenant = getTenantHeader();
      const response = await fetch(`/api/leave-settings/${encodeURIComponent(leaveType)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant
        }
      });
      if (response.ok) {
        showToast('Leave policy deleted successfully!', 'success');
        fetchLeaveSettings();
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to delete leave policy.', 'error');
      }
    } catch (err) {
      console.error('Error deleting leave policy:', err);
      showToast('Failed to delete leave policy.', 'error');
    }
  };

  const filteredLeavePolicies = leavePolicies.filter(p => p.employeeType === 'Teacher');

  if (loadingAttendance || loadingLeaves) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'hsl(var(--color-primary))', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Dynamic Title Header */}
      <div className="glass-panel" style={{
        padding: '24px 30px', borderRadius: '20px',
        border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SettingsIcon size={26} /> Institutional Settings & Rules
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Configure default check-in timelines, scanner grace parameters, and staff leave entitlement rules.
          </p>
        </div>
      </div>

      {/* Tab Selector Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => setSettingsTab('attendance')}
          style={{
            padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
            border: '1px solid var(--border-glass)',
            background: settingsTab === 'attendance' ? 'var(--color-primary)' : 'var(--bg-card)',
            color: settingsTab === 'attendance' ? '#ffffff' : 'var(--text-main)',
            boxShadow: settingsTab === 'attendance' ? '0 4px 12px rgba(99,102,241,0.2)' : 'none',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease-out'
          }}
        >
          <Clock size={16} /> Attendance Rules
        </button>
        <button 
          onClick={() => setSettingsTab('leaves')}
          style={{
            padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
            border: '1px solid var(--border-glass)',
            background: settingsTab === 'leaves' ? 'var(--color-primary)' : 'var(--bg-card)',
            color: settingsTab === 'leaves' ? '#ffffff' : 'var(--text-main)',
            boxShadow: settingsTab === 'leaves' ? '0 4px 12px rgba(99,102,241,0.2)' : 'none',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease-out'
          }}
        >
          <FileText size={16} /> Leave Policy Settings
        </button>
      </div>

      {/* Main Settings Display */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
          
          {/* COLUMN 1: ATTENDANCE RULES */}
          {settingsTab === 'attendance' && (
            <div style={{
              padding: '28px', borderRadius: '20px',
              border: '1px solid #cbd5e1', background: '#ffffff', color: '#000000',
              display: 'flex', flexDirection: 'column', gap: '20px', width: '100%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={20} style={{ color: '#0f172a' }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#000000' }}>Attendance Rules</span>
                </div>
                <button
                  onClick={() => { setTempSettings({ ...settings }); setShowAttendanceModal(true); }}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: 600 }}
                >
                  <Sliders size={14} /> Configure Rules
                </button>
              </div>

              {/* Milestone summaries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Check-In Start Time:</span>
                  <span style={{ fontSize: '0.95rem', color: '#000000', fontWeight: 700 }}>{settings.checkInStart}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Late Threshold:</span>
                  <span style={{ fontSize: '0.95rem', color: '#ca8a04', fontWeight: 700 }}>{settings.lateTime} (+{settings.gracePeriod}m grace)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Half-Day Threshold:</span>
                  <span style={{ fontSize: '0.95rem', color: '#2563eb', fontWeight: 700 }}>{settings.halfDayTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Check-Out Threshold:</span>
                  <span style={{ fontSize: '0.95rem', color: '#16a34a', fontWeight: 700 }}>{settings.checkOutTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Min Working Hours:</span>
                  <span style={{ fontSize: '0.95rem', color: '#000000', fontWeight: 700 }}>{settings.minWorkingHours} Hours/Day</span>
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', padding: '14px', display: 'flex', gap: '10px' }}>
                <AlertCircle size={18} style={{ color: '#0f172a', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.4' }}>
                  Scans before <strong>{settings.lateTime}</strong> (+ {settings.gracePeriod}m grace) record as Present. Scans after the grace period up to <strong>{settings.halfDayTime}</strong> record as Late. Scans after <strong>{settings.halfDayTime}</strong> are auto-marked as Half Day.
                </span>
              </div>
            </div>
          )}

          {/* COLUMN 2: LEAVE SETTINGS */}
          {settingsTab === 'leaves' && (
            <div style={{
              padding: '28px', borderRadius: '20px',
              border: '1px solid #cbd5e1', background: '#ffffff', color: '#000000',
              display: 'flex', flexDirection: 'column', gap: '20px', width: '100%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} style={{ color: '#0f172a' }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#000000' }}>Leave Policy Settings</span>
                </div>
                <button
                  onClick={() => handleOpenLeaveModal(null)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: 600 }}
                >
                  + Add Policy
                </button>
              </div>

              {/* Leave Policies Table */}
              {filteredLeavePolicies.length > 0 && (
                <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left', color: '#000000', background: '#ffffff' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '12px 16px' }}>Code</th>
                        <th style={{ padding: '12px 16px' }}>Leave Name</th>
                        <th style={{ padding: '12px 16px' }}>Default Days</th>
                        <th style={{ padding: '12px 16px' }}>Max Carry Forward</th>
                        <th style={{ padding: '12px 16px' }}>Classification</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px' }}>Description</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeavePolicies.map((policy, idx) => (
                        <tr 
                          key={policy.id} 
                          style={{ 
                            borderBottom: idx === filteredLeavePolicies.length - 1 ? 'none' : '1px solid #cbd5e1',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{policy.leaveCode}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{policy.leaveType}</td>
                          <td style={{ padding: '12px 16px' }}>{policy.maxDays} Days</td>
                          <td style={{ padding: '12px 16px' }}>{policy.maxCarryForward} Days</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', background: policy.isPaid === 1 ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', color: policy.isPaid === 1 ? '#10b981' : '#6b7280', fontWeight: 700 }}>
                              {policy.isPaid === 1 ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', background: policy.status === 'Active' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', color: policy.status === 'Active' ? '#10b981' : '#ef4444', border: policy.status === 'Active' ? '1px solid rgba(16,185,129,0.1)' : '1px solid rgba(239,68,68,0.1)', fontWeight: 600 }}>
                              {policy.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={policy.description}>
                            {policy.description || '—'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => handleOpenLeaveModal(policy)}
                                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                                title="Edit Policy"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteLeavePolicy(policy.leaveType)}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                                title="Delete Policy"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* EDIT ATTENDANCE MODAL DIALOG (Light Mode styled) */}
      {showAttendanceModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999999, padding: '20px', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1',
            width: '100%', maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '20px',
            animation: 'scaleUp 0.15s ease-out', padding: '28px', color: '#000000',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} style={{ color: '#000000' }} />
                Configure Shift Rules
              </h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAttendanceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Timing Fields Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Check-In Start</label>
                  <TimePickerSelect
                    value={tempSettings.checkInStart}
                    onChange={(val) => handleAttendanceTimeChange('checkInStart', val)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Late Threshold</label>
                  <TimePickerSelect
                    value={tempSettings.lateTime}
                    onChange={(val) => handleAttendanceTimeChange('lateTime', val)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Half-Day Threshold</label>
                  <TimePickerSelect
                    value={tempSettings.halfDayTime}
                    onChange={(val) => handleAttendanceTimeChange('halfDayTime', val)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Check-Out Start</label>
                  <TimePickerSelect
                    value={tempSettings.checkOutTime}
                    onChange={(val) => handleAttendanceTimeChange('checkOutTime', val)}
                  />
                </div>
              </div>

              {/* Grace & Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Late Grace Period ({tempSettings.gracePeriod} min)</label>
                  <input
                    type="range"
                    name="gracePeriod"
                    value={tempSettings.gracePeriod}
                    onChange={handleAttendanceChange}
                    min="0"
                    max="60"
                    step="5"
                    style={{ accentColor: '#0f172a', width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Minimum Working Hours ({tempSettings.minWorkingHours} hrs)</label>
                  <input
                    type="range"
                    name="minWorkingHours"
                    value={tempSettings.minWorkingHours}
                    onChange={handleAttendanceChange}
                    min="1"
                    max="12"
                    step="0.5"
                    style={{ accentColor: '#0f172a', width: '100%' }}
                  />
                </div>
              </div>

              {/* Modal Footer / Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  style={{ padding: '10px 18px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#334155', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAttendance}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px', borderRadius: '8px', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: savingAttendance ? 'not-allowed' : 'pointer' }}
                >
                  <Check size={14} />
                  {savingAttendance ? 'Saving...' : 'Save Shift Rules'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONFIGURE LEAVE POLICY MODAL (Light Mode styled) */}
      {showLeaveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999999, padding: '20px', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1',
            width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '20px',
            animation: 'scaleUp 0.15s ease-out', padding: '28px', color: '#000000',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#000000' }}>
                {selectedPolicy ? 'Edit Leave Policy' : 'Add New Leave Policy'}
              </h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Code & Name Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Leave Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., CL, SL, PL"
                    value={leaveForm.leaveCode}
                    onChange={e => setLeaveForm({ ...leaveForm, leaveCode: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Leave Name *</label>
                  <input
                    type="text"
                    required
                    readOnly={!!selectedPolicy}
                    placeholder="e.g., Casual Leave"
                    value={leaveForm.leaveType}
                    onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: selectedPolicy ? '#e2e8f0' : '#f8fafc', color: '#000000', fontSize: '0.88rem', cursor: selectedPolicy ? 'not-allowed' : 'text' }}
                  />
                </div>
              </div>

              {/* Days & Carry Forward Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Default Days (Annual)</label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    step="0.5"
                    required
                    value={leaveForm.maxDays}
                    onChange={e => setLeaveForm({ ...leaveForm, maxDays: Number(e.target.value) })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Max Carry Forward Days</label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    step="0.5"
                    required
                    value={leaveForm.maxCarryForward}
                    onChange={e => setLeaveForm({ ...leaveForm, maxCarryForward: Number(e.target.value) })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Paid Status & Policy Status Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Leave Classification</label>
                  <select
                    value={leaveForm.isPaid ? 'Paid' : 'Unpaid'}
                    onChange={e => setLeaveForm({ ...leaveForm, isPaid: e.target.value === 'Paid' })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', fontSize: '0.88rem', fontWeight: 600 }}
                  >
                    <option value="Paid">Paid Policy</option>
                    <option value="Unpaid">Unpaid Policy</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Status</label>
                  <select
                    value={leaveForm.status}
                    onChange={e => setLeaveForm({ ...leaveForm, status: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', fontSize: '0.88rem', fontWeight: 600 }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe when and how this leave type can be used..."
                  value={leaveForm.description}
                  onChange={e => setLeaveForm({ ...leaveForm, description: e.target.value })}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', fontSize: '0.88rem', resize: 'vertical' }}
                />
              </div>

              {/* Modal Footer / Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  style={{ padding: '10px 18px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#334155', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLeave}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px', borderRadius: '8px', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: savingLeave ? 'not-allowed' : 'pointer' }}
                >
                  <Check size={14} />
                  {savingLeave ? 'Saving...' : (selectedPolicy ? 'Save Changes' : '+ Add Policy')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
