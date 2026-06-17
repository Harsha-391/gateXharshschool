import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle, 
  Loader2, 
  ClipboardCheck, 
  AlertCircle, 
  Edit3,
  Calendar 
} from 'lucide-react';
import { fetchActiveGrades, fetchActiveSections } from '../utils/grades';

const parseGradeName = (fullName) => {
  if (!fullName) return { baseGrade: '', department: '' };
  const match = fullName.match(/^(.+?)\s*\((.+?)\)$/);
  if (match) {
    return { baseGrade: match[1], department: match[2] };
  }
  return { baseGrade: fullName, department: '' };
};

const isGrade11or12 = (name) => {
  if (!name) return false;
  const clean = name.trim().toUpperCase();
  return clean.includes('11') || clean.includes('12') || clean.includes('XI') || clean.includes('XII');
};

const getStatusBadge = (status) => {
  const colors = {
    Present: { bg: '#10b981', text: '#fff' },
    Absent: { bg: '#ef4444', text: '#fff' },
    Leave: { bg: '#f59e0b', text: '#fff' },
    Late: { bg: '#f97316', text: '#fff' }
  };
  const c = colors[status] || { bg: 'var(--bg-glass)', text: 'var(--text-muted)' };
  return (
    <span style={{
      padding: '4px 14px',
      borderRadius: '20px',
      background: c.bg,
      color: c.text,
      fontSize: '0.75rem',
      fontWeight: 700,
      display: 'inline-block'
    }}>
      {status}
    </span>
  );
};

// ============================================================================
// ADMIN VERSION OF ROSTER DAILY MARKING VIEW (Single Submit Button)
// ============================================================================
export function MarkAttendanceView({ date, setDate, studentClass, setClass, section, setSection, search, setSearch, showToast }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeGrades, setActiveGrades] = useState([]);
  const [activeSections, setActiveSections] = useState([]);

  const [editingId, setEditingId] = useState(null); // Student ID being edited
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const { baseGrade: baseClass, department: selectedDept } = parseGradeName(studentClass);
  const isHighGrade = isGrade11or12(baseClass);

  // Compute unique base grades from activeGrades
  const baseGrades = [];
  const seenBase = new Set();
  activeGrades.forEach(g => {
    const base = parseGradeName(g.name).baseGrade;
    if (!seenBase.has(base)) {
      seenBase.add(base);
      baseGrades.push(base);
    }
  });

  // Compute departments for the currently selected baseClass
  const departmentsForSelectedGrade = activeGrades
    .filter(g => parseGradeName(g.name).baseGrade === baseClass)
    .map(g => parseGradeName(g.name).department)
    .filter(Boolean);

  const handleBaseClassChange = (newBaseClass) => {
    if (isGrade11or12(newBaseClass)) {
      const depts = activeGrades
        .filter(g => parseGradeName(g.name).baseGrade === newBaseClass)
        .map(g => parseGradeName(g.name).department)
        .filter(Boolean);
      if (depts.length > 0) {
        const targetDept = depts.includes(selectedDept) ? selectedDept : depts[0];
        setClass(`${newBaseClass} (${targetDept})`);
      } else {
        setClass(newBaseClass);
      }
    } else {
      setClass(newBaseClass);
    }
  };

  const handleDeptChange = (newDept) => {
    setClass(`${baseClass} (${newDept})`);
  };

  const handleEditClick = (stu) => {
    setEditingId(stu.id);
    setEditStatus(stu.attendanceStatus);
    setEditRemarks(stu.remarks || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditStatus('');
    setEditRemarks('');
  };

  const handleSaveEdit = async (stuId) => {
    try {
      setSavingEdit(true);
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          studentClass,
          section,
          records: [{ studentId: stuId, status: editStatus, remarks: editRemarks }],
          markedBy: 'uttam306115@gmail.com'
        })
      });

      if (res.ok) {
        showToast('Attendance updated successfully!', 'success');
        setEditingId(null);
        fetchRoster();
      } else {
        showToast('Failed to update attendance.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error updating attendance.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Check if attendance is already submitted
  const isSubmitted = roster.length > 0 && roster.some(s => s.submitted);

  // Load roster
  const fetchRoster = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        date,
        studentClass,
        section,
        search
      }).toString();
      const res = await fetch(`/api/attendance?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setRoster(data);
      }
    } catch (err) {
      console.error('Error loading daily attendance roster:', err);
      showToast('Error loading students registry list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadGradesAndSections = async () => {
      const [grades, secs] = await Promise.all([
        fetchActiveGrades(),
        fetchActiveSections()
      ]);
      setActiveGrades(grades);
      if (grades.length > 0) {
        if (!studentClass) setClass(grades[0].name);
      } else {
        setClass('');
      }
      setActiveSections(secs);
    };
    loadGradesAndSections();
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [date, studentClass, section, search]);

  // Handle single student toggle
  const handleStatusToggle = (stuId, status) => {
    setRoster(prev => prev.map(s => {
      if (s.id === stuId) {
        return { ...s, attendanceStatus: s.attendanceStatus === status ? '' : status };
      }
      return s;
    }));
  };

  // Handle inline remarks modification
  const handleRemarksChange = (stuId, remarks) => {
    setRoster(prev => prev.map(s => {
      if (s.id === stuId) {
        return { ...s, remarks };
      }
      return s;
    }));
  };

  // Mark all as Present
  const markAllPresent = () => {
    setRoster(prev => prev.map(s => ({ ...s, attendanceStatus: 'Present' })));
    showToast('All roster students marked Present!', 'success');
  };

  // Submit Attendance - saves records and then marks them as submitted
  const submitAttendance = async () => {
    try {
      const unlogged = roster.filter(r => !r.attendanceStatus);
      if (unlogged.length > 0) {
        if (!window.confirm(`You have ${unlogged.length} unmarked students. Do you still want to submit attendance?`)) {
          return;
        }
      }

      setSubmitting(true);
      const recordsToSave = roster
        .filter(r => r.attendanceStatus)
        .map(r => ({
          studentId: r.id,
          status: r.attendanceStatus,
          remarks: r.remarks
        }));

      // Step 1: Save all attendance records
      const saveRes = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          studentClass,
          section,
          records: recordsToSave,
          markedBy: 'uttam306115@gmail.com'
        })
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        showToast(err.error || 'Failed to save attendance records.', 'error');
        return;
      }

      // Step 2: Submit (finalize) the attendance
      const submitRes = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, studentClass, section })
      });

      if (submitRes.ok) {
        showToast('Attendance submitted successfully!', 'success');
        fetchRoster();
      } else {
        const err = await submitRes.json();
        showToast(err.error || 'Failed to submit attendance.', 'error');
      }
    } catch (err) {
      console.error('Error submitting attendance:', err);
      showToast('Network error submitting attendance.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. FILTER CONTROLS CARD */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            
            {/* Date Filter */}
            <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Attendance Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val > todayStr) return;
                  setDate(val);
                }}
                max={todayStr}
                className="form-control"
                style={{ height: '38px', borderRadius: '8px', padding: '8px 12px' }}
              />
            </div>

            {/* Class Filter */}
            <div className="form-group" style={{ margin: 0, minWidth: '110px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Grade Class</label>
              <select 
                className="select-custom" 
                value={baseClass} 
                onChange={(e) => handleBaseClassChange(e.target.value)}
                style={{ height: '38px', borderRadius: '8px' }}
              >
                {baseGrades.map(g => (
                  <option key={g} value={g}>
                    {g.startsWith('LKG') || g.startsWith('UKG') || g.startsWith('NURSERY') ? g : `Grade ${g}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter (Only for Grade XI/XII) */}
            {isHighGrade && departmentsForSelectedGrade.length > 0 && (
              <div className="form-group" style={{ margin: 0, minWidth: '130px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Department</label>
                <select 
                  className="select-custom" 
                  value={selectedDept} 
                  onChange={(e) => handleDeptChange(e.target.value)}
                  style={{ height: '38px', borderRadius: '8px' }}
                >
                  {departmentsForSelectedGrade.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Section Filter */}
            <div className="form-group" style={{ margin: 0, minWidth: '100px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Section</label>
              <select 
                className="select-custom" 
                value={section} 
                onChange={(e) => setSection(e.target.value)}
                style={{ height: '38px', borderRadius: '8px' }}
              >
                {activeSections.map(s => (
                  <option key={s.id || s.name} value={s.name}>Section {s.name}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="search-bar-container" style={{ margin: 0, maxWidth: '280px', flex: 1, height: '38px', marginTop: '16px' }}>
              <Search size={16} className="search-bar-icon" />
              <input 
                type="text" 
                placeholder="Search roll, admission, name..."
                className="search-bar-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
              />
            </div>

          </div>

          {/* Mark All Button */}
          <div style={{ marginTop: '16px' }}>
            <button 
              onClick={markAllPresent}
              disabled={roster.length === 0}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', height: '38px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <CheckCircle size={16} /> Mark All Present
            </button>
          </div>

        </div>
      </div>

      {/* 3. ROSTER LIST TABLE */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'hsl(var(--color-primary))' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading student rosters...</p>
          </div>
        ) : roster.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>No Students Registered</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>There are no students registered in Grade {studentClass} - Section {section}.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <table className="student-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-glass-active)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border-glass)' }}>
                <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Roll No</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Photo</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student Name</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Class/Sec</th>
                  {isHighGrade && (
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</th>
                  )}
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Attendance Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remarks / Reasons</th>
                  {isSubmitted && (
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {roster.map((stu) => (
                  <tr key={stu.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s ease' }} className="table-row-hover">
                    
                    {/* Roll No */}
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{stu.rollNumber}</td>
                    
                    {/* Photo */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50px',
                        background: stu.photoBg || 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        overflow: 'hidden'
                      }}>
                        {stu.photo ? <img src={stu.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : stu.fullName.substring(0, 2).toUpperCase()}
                      </div>
                    </td>

                    {/* Name */}
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{stu.fullName}</td>
                    
                    {/* Class/Sec */}
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid var(--border-glass)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {isHighGrade ? `${parseGradeName(stu.studentClass).baseGrade || baseClass}-${stu.section}` : `${stu.studentClass}-${stu.section}`}
                      </span>
                    </td>

                    {/* Department (Only for Grade XI/XII) */}
                    {isHighGrade && (
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          background: 'rgba(99, 102, 241, 0.08)', 
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          color: 'hsl(var(--color-primary))',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {parseGradeName(stu.studentClass).department || selectedDept || '—'}
                        </span>
                      </td>
                    )}

                    {/* Attendance Buttons */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {isSubmitted ? (
                          editingId === stu.id ? (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              {['Present', 'Absent', 'Leave', 'Late'].map(status => {
                                const colors = { Present: '#10b981', Absent: '#ef4444', Leave: '#f59e0b', Late: '#f97316' };
                                return (
                                  <button 
                                    key={status}
                                    onClick={() => setEditStatus(status)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      background: editStatus === status ? colors[status] : 'rgba(255,255,255,0.02)',
                                      color: editStatus === status ? '#ffffff' : 'var(--text-muted)',
                                      border: editStatus === status ? 'none' : '1px solid var(--border-glass)'
                                    }}
                                  >
                                    {status}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            getStatusBadge(stu.attendanceStatus)
                          )
                        ) : (
                          <>
                            {/* Present Button */}
                            <button 
                              onClick={() => handleStatusToggle(stu.id, 'Present')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: stu.attendanceStatus === 'Present' ? '#10b981' : 'rgba(255,255,255,0.02)',
                                color: stu.attendanceStatus === 'Present' ? '#ffffff' : 'var(--text-muted)',
                                border: stu.attendanceStatus === 'Present' ? 'none' : '1px solid var(--border-glass)'
                              }}
                            >
                              Present
                            </button>

                            {/* Absent Button */}
                            <button 
                              onClick={() => handleStatusToggle(stu.id, 'Absent')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: stu.attendanceStatus === 'Absent' ? '#ef4444' : 'rgba(255,255,255,0.02)',
                                color: stu.attendanceStatus === 'Absent' ? '#ffffff' : 'var(--text-muted)',
                                border: stu.attendanceStatus === 'Absent' ? 'none' : '1px solid var(--border-glass)'
                              }}
                            >
                              Absent
                            </button>

                            {/* Leave Button */}
                            <button 
                              onClick={() => handleStatusToggle(stu.id, 'Leave')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: stu.attendanceStatus === 'Leave' ? '#f59e0b' : 'rgba(255,255,255,0.02)',
                                color: stu.attendanceStatus === 'Leave' ? '#ffffff' : 'var(--text-muted)',
                                border: stu.attendanceStatus === 'Leave' ? 'none' : '1px solid var(--border-glass)'
                              }}
                            >
                              Leave
                            </button>

                            {/* Late Button */}
                            <button 
                              onClick={() => handleStatusToggle(stu.id, 'Late')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: stu.attendanceStatus === 'Late' ? '#f97316' : 'rgba(255,255,255,0.02)',
                                color: stu.attendanceStatus === 'Late' ? '#ffffff' : 'var(--text-muted)',
                                border: stu.attendanceStatus === 'Late' ? 'none' : '1px solid var(--border-glass)'
                              }}
                            >
                              Late
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Remarks Input */}
                    <td style={{ padding: '14px 20px', width: '220px' }}>
                      {isSubmitted ? (
                        editingId === stu.id ? (
                          <input 
                            type="text" 
                            placeholder="Add reason/remark..."
                            className="form-control"
                            value={editRemarks}
                            onChange={(e) => setEditRemarks(e.target.value)}
                            style={{ height: '32px', borderRadius: '6px', fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: stu.remarks ? 'var(--text-main)' : 'var(--text-muted)' }}>
                            {stu.remarks || '—'}
                          </span>
                        )
                      ) : (
                        <input 
                          type="text" 
                          placeholder="Add reason/remark..."
                          className="form-control"
                          value={stu.remarks || ''}
                          onChange={(e) => handleRemarksChange(stu.id, e.target.value)}
                          style={{ height: '32px', borderRadius: '6px', fontSize: '0.8rem', padding: '6px 10px' }}
                        />
                      )}
                    </td>

                    {/* Edit Action if isSubmitted */}
                    {isSubmitted && (
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {editingId === stu.id ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleSaveEdit(stu.id)}
                              disabled={savingEdit}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                background: '#10b981',
                                border: 'none',
                                color: '#fff',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {savingEdit ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle size={12} />} Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border-glass)',
                                color: 'var(--text-muted)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(stu)}
                            style={{
                              padding: '5px 14px',
                              borderRadius: '6px',
                              background: 'rgba(99, 102, 241, 0.08)',
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                              color: 'hsl(var(--color-primary))',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              margin: '0 auto'
                            }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        )}
                      </td>
                    )}

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. ACTIONS BOTTOM BAR */}
      {roster.length > 0 && !loading && (
        <div className="glass-panel" style={{ 
          padding: '16px 24px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center', 
          border: '1px solid rgba(255,255,255,0.08)',
          marginTop: '16px'
        }}>
          <button 
            onClick={submitAttendance}
            disabled={submitting}
            className="btn-primary"
            style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              border: 'none', 
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 700
            }}
          >
            {submitting ? (
              <><Loader2 className="animate-spin" size={16} /> Submitting...</>
            ) : (
              <><CheckCircle size={18} /> Submit Attendance</>
            )}
          </button>

          {isSubmitted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
              <CheckCircle size={18} />
              <span style={{ fontWeight: 700 }}>Attendance Submitted</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ============================================================================
// ADMIN VERSION OF ATTENDANCE HISTORY LOG VIEW (Read-only + Single Edit Buttons)
// ============================================================================
export function AttendanceHistoryView({ date, showToast }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [historyDate, setHistoryDate] = useState(date || todayStr);
  const [studentClass, setClass] = useState('');
  const [section, setSection] = useState('A');

  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeGrades, setActiveGrades] = useState([]);
  const [activeSections, setActiveSections] = useState([]);

  const { baseGrade: baseClass, department: selectedDept } = parseGradeName(studentClass);
  const isHighGrade = isGrade11or12(baseClass);

  // Compute unique base grades from activeGrades
  const baseGrades = [];
  const seenBase = new Set();
  activeGrades.forEach(g => {
    const base = parseGradeName(g.name).baseGrade;
    if (!seenBase.has(base)) {
      seenBase.add(base);
      baseGrades.push(base);
    }
  });

  // Compute departments for the currently selected baseClass
  const departmentsForSelectedGrade = activeGrades
    .filter(g => parseGradeName(g.name).baseGrade === baseClass)
    .map(g => parseGradeName(g.name).department)
    .filter(Boolean);

  const handleBaseClassChange = (newBaseClass) => {
    if (isGrade11or12(newBaseClass)) {
      const depts = activeGrades
        .filter(g => parseGradeName(g.name).baseGrade === newBaseClass)
        .map(g => parseGradeName(g.name).department)
        .filter(Boolean);
      if (depts.length > 0) {
        const targetDept = depts.includes(selectedDept) ? selectedDept : depts[0];
        setClass(`${newBaseClass} (${targetDept})`);
      } else {
        setClass(newBaseClass);
      }
    } else {
      setClass(newBaseClass);
    }
  };

  const handleDeptChange = (newDept) => {
    setClass(`${baseClass} (${newDept})`);
  };

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        date: historyDate,
        studentClass,
        section,
        submitted: 'true'
      }).toString();
      const res = await fetch(`/api/attendance?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        // Only show students who have a submitted attendance record
        setRoster(data.filter(s => s.attendanceStatus));
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading attendance history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadGradesAndSections = async () => {
      const [grades, secs] = await Promise.all([
        fetchActiveGrades(),
        fetchActiveSections()
      ]);
      setActiveGrades(grades);
      if (grades.length > 0) {
        setClass(grades[0].name);
      } else {
        setClass('');
      }
      setActiveSections(secs);
      if (secs.length > 0) {
        setSection(secs[0].name);
      }
    };
    loadGradesAndSections();
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [historyDate, studentClass, section]);

  // Statistics
  const totalStudents = roster.length;
  const presentCount = roster.filter(s => s.attendanceStatus === 'Present').length;
  const absentCount = roster.filter(s => s.attendanceStatus === 'Absent').length;
  const leaveCount = roster.filter(s => s.attendanceStatus === 'Leave').length;
  const lateCount = roster.filter(s => s.attendanceStatus === 'Late').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Filter Controls */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Date Picker */}
          <div className="form-group" style={{ margin: 0, minWidth: '180px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--color-primary))', pointerEvents: 'none', zIndex: 1 }} />
              <input
                type="date"
                className="select-custom"
                value={historyDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val > todayStr) return;
                  setHistoryDate(val);
                }}
                max={todayStr}
                style={{ 
                  height: '38px', 
                  borderRadius: '8px', 
                  paddingLeft: '34px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-glass)'
                }}
              />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--color-primary))', fontWeight: 600, marginTop: '2px', display: 'block' }}>
              {formatDisplayDate(historyDate)}
            </span>
          </div>



          {/* Grade Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: '110px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Grade</label>
            <select 
              className="select-custom" 
              value={baseClass} 
              onChange={(e) => handleBaseClassChange(e.target.value)}
              style={{ height: '38px', borderRadius: '8px' }}
            >
              {baseGrades.map(g => (
                <option key={g} value={g}>
                  {g.startsWith('LKG') || g.startsWith('UKG') || g.startsWith('NURSERY') ? g : `Grade ${g}`}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter (Only for Grade XI/XII) */}
          {isHighGrade && departmentsForSelectedGrade.length > 0 && (
            <div className="form-group" style={{ margin: 0, minWidth: '130px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Department</label>
              <select 
                className="select-custom" 
                value={selectedDept} 
                onChange={(e) => handleDeptChange(e.target.value)}
                style={{ height: '38px', borderRadius: '8px' }}
              >
                {departmentsForSelectedGrade.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {/* Section Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: '100px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Section</label>
            <select 
              className="select-custom" 
              value={section} 
              onChange={(e) => setSection(e.target.value)}
              style={{ height: '38px', borderRadius: '8px' }}
            >
              {activeSections.map(s => (
                <option key={s.id || s.name} value={s.name}>Section {s.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Statistics Summary */}
      {roster.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Total</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalStudents}</strong>
          </div>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#10b981', display: 'block' }}>Present</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{presentCount}</strong>
          </div>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#ef4444', display: 'block' }}>Absent</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{absentCount}</strong>
          </div>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#f59e0b', display: 'block' }}>Leave</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{leaveCount}</strong>
          </div>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#f97316', display: 'block' }}>Late</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f97316' }}>{lateCount}</strong>
          </div>
        </div>
      )}

      {/* Attendance History Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'hsl(var(--color-primary))' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading attendance history...</p>
          </div>
        ) : roster.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>No Students Registered</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>There are no students registered or submitted attendance records in Grade {studentClass} - Section {section}.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <table className="student-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-glass-active)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border-glass)' }}>
                <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Roll No</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Photo</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student Name</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Class/Sec</th>
                  {isHighGrade && (
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</th>
                  )}
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((stu) => (
                  <tr key={stu.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s ease' }} className="table-row-hover">
                    
                    {/* Roll No */}
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{stu.rollNumber}</td>
                    
                    {/* Photo */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50px',
                        background: stu.photoBg || 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        overflow: 'hidden'
                      }}>
                        {stu.photo ? <img src={stu.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : stu.fullName.substring(0, 2).toUpperCase()}
                      </div>
                    </td>

                    {/* Name */}
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{stu.fullName}</td>
                    
                    {/* Class/Sec */}
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid var(--border-glass)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {isHighGrade ? `${parseGradeName(stu.studentClass).baseGrade || baseClass}-${stu.section}` : `${stu.studentClass}-${stu.section}`}
                      </span>
                    </td>

                    {/* Department (Only for Grade XI/XII) */}
                    {isHighGrade && (
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          background: 'rgba(99, 102, 241, 0.08)', 
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          color: 'hsl(var(--color-primary))',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {parseGradeName(stu.studentClass).department || selectedDept || '—'}
                        </span>
                      </td>
                    )}

                    {/* Status */}
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      {getStatusBadge(stu.attendanceStatus)}
                    </td>

                    {/* Remarks */}
                    <td style={{ padding: '14px 20px', width: '200px' }}>
                      <span style={{ fontSize: '0.8rem', color: stu.remarks ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {stu.remarks || '—'}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
