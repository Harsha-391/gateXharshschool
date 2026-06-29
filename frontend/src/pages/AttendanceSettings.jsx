import React, { useState, useEffect } from 'react';
import { 
  Clock, Save, ShieldAlert, Settings, Calendar, Coffee, AlertCircle, Check, X, Edit2, Sliders
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

const AttendanceSettings = ({ showToast }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [settings, setSettings] = useState({
    checkInStart: '08:00 AM',
    lateTime: '09:00 AM',
    halfDayTime: '11:00 AM',
    checkOutTime: '05:00 PM',
    minWorkingHours: 8.00,
    gracePeriod: 15
  });

  const [tempSettings, setTempSettings] = useState({ ...settings });

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

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
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
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempSettings(prev => ({
      ...prev,
      [name]: name === 'gracePeriod' || name === 'minWorkingHours' ? Number(value) : value
    }));
  };

  const handleTimeChange = (fieldName, timeStr) => {
    setTempSettings(prev => ({
      ...prev,
      [fieldName]: timeStr
    }));
  };

  const openEditModal = () => {
    setTempSettings({ ...settings });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
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
        setShowModal(false);
        showToast('Attendance rules updated successfully!', 'success');
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to save settings.', 'error');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast('Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Premium Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <Settings size={28} style={{ color: '#0f172a' }} />
            Attendance Rules & Settings
          </h2>
          <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
            Active scanner configurations for academic and non-academic staff.
          </p>
        </div>

        {/* Configure Button - Solid black styled label */}
        <button
          onClick={openEditModal}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: '#0f172a',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)',
            transition: 'all 0.2s ease'
          }}
        >
          <Sliders size={16} />
          Configure Shift Rules
        </button>
      </div>

      {/* Active Rules Card Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Timing Status Card */}
        <div style={{ padding: '24px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <Clock size={20} style={{ color: '#0f172a' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Daily Shift Milestones</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Check-In Start Time:</span>
              <span style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>{settings.checkInStart}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Late Threshold:</span>
              <span style={{ fontSize: '0.95rem', color: '#ca8a04', fontWeight: 700 }}>{settings.lateTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Half-Day Threshold:</span>
              <span style={{ fontSize: '0.95rem', color: '#2563eb', fontWeight: 700 }}>{settings.halfDayTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Check-Out Starts:</span>
              <span style={{ fontSize: '0.95rem', color: '#16a34a', fontWeight: 700 }}>{settings.checkOutTime}</span>
            </div>
          </div>
        </div>

        {/* Grace Periods Status Card */}
        <div style={{ padding: '24px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <ShieldAlert size={20} style={{ color: '#0f172a' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Grace & Duty Criteria</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Late Grace Period:</span>
              <span style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>{settings.gracePeriod} Minutes</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Min Working Hours:</span>
              <span style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>{settings.minWorkingHours} Hours / Day</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Scanner Lockout Cooldown:</span>
              <span style={{ fontSize: '0.95rem', color: '#ef4444', fontWeight: 700 }}>1 Minute</span>
            </div>
          </div>
        </div>

      </div>

      {/* active rules description box */}
      <div style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <AlertCircle size={22} style={{ color: '#0f172a', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Interactive Shift Rules Roster</span>
          <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.5' }}>
            Current scans auto-calculate shift statuses dynamically:
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Scans between <strong>{settings.checkInStart}</strong> and <strong>{settings.lateTime}</strong> (+ {settings.gracePeriod}m grace) will record as <span style={{ color: '#16a34a', fontWeight: 700 }}>Present</span>.</li>
              <li>Scans after the grace period up to <strong>{settings.halfDayTime}</strong> will record as <span style={{ color: '#ca8a04', fontWeight: 700 }}>Late</span>.</li>
              <li>Scans after <strong>{settings.halfDayTime}</strong> will record as <span style={{ color: '#2563eb', fontWeight: 700 }}>Half Day</span>.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* EDIT CONFIG MODAL DIALOG */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '580px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0', animation: 'scaleUp 0.15s ease-out',
            display: 'flex', flexDirection: 'column', maxHeight: '90vh'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sliders size={18} style={{ color: '#0f172a' }} />
                Configure Shift Rules
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', overflowY: 'auto' }}>
              
              {/* Timing Fields Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Check-In Start</label>
                  <TimePickerSelect
                    value={tempSettings.checkInStart}
                    onChange={(val) => handleTimeChange('checkInStart', val)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Late Threshold</label>
                  <TimePickerSelect
                    value={tempSettings.lateTime}
                    onChange={(val) => handleTimeChange('lateTime', val)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Half-Day Threshold</label>
                  <TimePickerSelect
                    value={tempSettings.halfDayTime}
                    onChange={(val) => handleTimeChange('halfDayTime', val)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Check-Out Start</label>
                  <TimePickerSelect
                    value={tempSettings.checkOutTime}
                    onChange={(val) => handleTimeChange('checkOutTime', val)}
                  />
                </div>

              </div>

              {/* Grace & Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Late Grace Period ({tempSettings.gracePeriod} min)</label>
                  <input
                    type="range"
                    name="gracePeriod"
                    value={tempSettings.gracePeriod}
                    onChange={handleChange}
                    min="0"
                    max="60"
                    step="5"
                    style={{ accentColor: '#0f172a', width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Minimum Working Hours ({tempSettings.minWorkingHours} hrs)</label>
                  <input
                    type="range"
                    name="minWorkingHours"
                    value={tempSettings.minWorkingHours}
                    onChange={handleChange}
                    min="1"
                    max="12"
                    step="0.5"
                    style={{ accentColor: '#0f172a', width: '100%' }}
                  />
                </div>

              </div>

              {/* Modal Footer / Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#ffffff', fontSize: '0.85rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)' }}
                >
                  <Check size={14} />
                  {saving ? 'Saving...' : 'Save Shift Rules'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttendanceSettings;
