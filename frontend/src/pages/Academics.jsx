import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Clock, 
  BookOpen, 
  Award, 
  Target, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  X
} from 'lucide-react';

export default function Academics() {
  const [selectedClass, setSelectedClass] = useState('Grade 10-A');
  const [timetableRecords, setTimetableRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const classOptions = ['Grade 9-A', 'Grade 9-B', 'Grade 10-A', 'Grade 10-B'];
  const timeslots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM'];

  // Form State
  const [formData, setFormData] = useState({
    cohort: 'Grade 10-A',
    time: '09:00 AM',
    day: 'mon',
    subject: '',
    teacher: '',
    room: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchTimetables = async () => {
    try {
      const res = await fetch('/api/timetables');
      if (res.ok) {
        const data = await res.json();
        setTimetableRecords(data);
      }
    } catch (err) {
      console.error('Error fetching academic schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.subject.trim()) errors.subject = 'Subject name is required.';
    if (!formData.teacher.trim()) errors.teacher = 'Staff name is required.';
    if (!formData.room.trim()) errors.room = 'Classroom code is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Construct the standard database payload structure
    const payload = {
      cohort: formData.cohort,
      time: formData.time,
      [formData.day]: {
        subject: formData.subject,
        teacher: formData.teacher,
        room: formData.room
      }
    };

    try {
      const res = await fetch('/api/timetables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchTimetables(); // Reload state
        setShowAddModal(false);
        setFormData({
          cohort: 'Grade 10-A',
          time: '09:00 AM',
          day: 'mon',
          subject: '',
          teacher: '',
          room: ''
        });
        setFormErrors({});
      }
    } catch (err) {
      console.error('Error recording schedule:', err);
    }
  };

  // Compile matrix rows
  const getMatrixRows = () => {
    // Filter records for selected cohort class
    const classRecords = timetableRecords.filter(r => r.cohort === selectedClass);

    return timeslots.map(time => {
      // Find Monday records, Tuesday records, etc., and merge them
      const row = { time, mon: null, tue: null, wed: null, thu: null, fri: null };
      
      classRecords.filter(r => r.time === time).forEach(rec => {
        if (rec.mon) row.mon = rec.mon;
        if (rec.tue) row.tue = rec.tue;
        if (rec.wed) row.wed = rec.wed;
        if (rec.thu) row.thu = rec.thu;
        if (rec.fri) row.fri = rec.fri;
      });

      // Provide default free-study placeholders for null values
      const defaultFree = { subject: 'Free Study', teacher: 'N/A', room: 'Library' };
      row.mon = row.mon || defaultFree;
      row.tue = row.tue || defaultFree;
      row.wed = row.wed || defaultFree;
      row.thu = row.thu || defaultFree;
      row.fri = row.fri || defaultFree;

      return row;
    });
  };

  const curriculumProgress = [
    { subject: 'Mathematics', completed: '78%', topic: 'Trigonometry Identities', status: 'On Track', color: 'hsl(var(--color-primary))' },
    { subject: 'Physics & Chemistry', completed: '65%', topic: 'Thermodynamics Lab', status: 'Behind Schedule', color: 'rgb(var(--color-warning-rgb))' },
    { subject: 'English Literature', completed: '90%', topic: 'Shakespeare Anthologies', status: 'Completed', color: 'rgb(var(--color-success-rgb))' },
    { subject: 'Modern World History', completed: '82%', topic: 'Industrial Revolutions', status: 'On Track', color: 'hsl(var(--color-info))' }
  ];

  const currentTimetable = getMatrixRows();

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Selection Panel */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Curriculum & Weekly Timetable</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Visualize scheduling matrix and subject syllabus progress indicators.</p>
        </div>

        <div className="filter-group">
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Cohort: </label>
          <select 
            className="select-custom"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classOptions.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn-primary"
          >
            <Plus size={18} /> Add Timetable Period
          </button>
        </div>
      </div>

      {/* Grid containing Timetable & Progress */}
      <div className="chart-grid">
        {/* Weekly Matrix Schedule */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Weekly Matrix Matrix</h3>
            <Clock size={16} style={{ color: 'hsl(var(--color-primary))' }} />
          </div>

          <div className="timetable-grid">
            <div className="timetable-time-cell">Hours</div>
            <div className="timetable-header-cell">Monday</div>
            <div className="timetable-header-cell">Tuesday</div>
            <div className="timetable-header-cell">Wednesday</div>
            <div className="timetable-header-cell">Thursday</div>
            <div className="timetable-header-cell">Friday</div>

            {/* Matrix Slots */}
            {currentTimetable.map((row, i) => (
              <React.Fragment key={i}>
                <div className="timetable-time-cell">{row.time}</div>
                
                {/* Mon */}
                <div className="timetable-slot">
                  <span className="timetable-subject-name">{row.mon.subject}</span>
                  <span className="timetable-teacher-name">{row.mon.teacher}</span>
                  <span className="timetable-room">{row.mon.room}</span>
                </div>

                {/* Tue */}
                <div className="timetable-slot">
                  <span className="timetable-subject-name">{row.tue.subject}</span>
                  <span className="timetable-teacher-name">{row.tue.teacher}</span>
                  <span className="timetable-room">{row.tue.room}</span>
                </div>

                {/* Wed */}
                <div className="timetable-slot">
                  <span className="timetable-subject-name">{row.wed.subject}</span>
                  <span className="timetable-teacher-name">{row.wed.teacher}</span>
                  <span className="timetable-room">{row.wed.room}</span>
                </div>

                {/* Thu */}
                <div className="timetable-slot">
                  <span className="timetable-subject-name">{row.thu.subject}</span>
                  <span className="timetable-teacher-name">{row.thu.teacher}</span>
                  <span className="timetable-room">{row.thu.room}</span>
                </div>

                {/* Fri */}
                <div className="timetable-slot">
                  <span className="timetable-subject-name">{row.fri.subject}</span>
                  <span className="timetable-teacher-name">{row.fri.teacher}</span>
                  <span className="timetable-room">{row.fri.room}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Curriculum syllabus tracking */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Curriculum & Syllabus Status</h3>
            <Target size={16} style={{ color: 'hsl(var(--color-secondary))' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {curriculumProgress.map((curr, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{curr.subject}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: curr.color }}>{curr.status}</span>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'rgba(var(--text-inverse), 0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: curr.completed, height: '100%', borderRadius: '99px', background: curr.color }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>Unit: {curr.topic}</span>
                  <span>{curr.completed} Syllabus Completed</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Department Statistics */}
          <div className="glass-panel" style={{ background: 'rgba(hsl(var(--color-primary)), 0.05)', padding: '16px', borderRadius: '12px', marginTop: '24px', border: '1px solid rgba(hsl(var(--color-primary)), 0.1)' }}>
            <h4 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}><Award size={16} /> Cohort Performance Index</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>Average Grade Rate:</span>
              <strong style={{ color: 'rgb(var(--color-success-rgb))' }}>84.2% (Grade A-)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Add Period Slot Modal */}
      {showAddModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem' }}>Add Schedule Class Period</h2>
              <button onClick={() => setShowAddModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Target Cohort</label>
                    <select 
                      name="cohort" 
                      value={formData.cohort} 
                      onChange={handleInputChange} 
                      className="form-control"
                    >
                      {classOptions.map((c, idx) => (
                        <option key={idx} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Period Hour</label>
                    <select 
                      name="time" 
                      value={formData.time} 
                      onChange={handleInputChange} 
                      className="form-control"
                    >
                      {timeslots.map((t, idx) => (
                        <option key={idx} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Day of the Week</label>
                  <select 
                    name="day" 
                    value={formData.day} 
                    onChange={handleInputChange} 
                    className="form-control"
                  >
                    <option value="mon">Monday</option>
                    <option value="tue">Tuesday</option>
                    <option value="wed">Wednesday</option>
                    <option value="thu">Thursday</option>
                    <option value="fri">Friday</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject Name</label>
                  <input 
                    type="text" 
                    name="subject" 
                    value={formData.subject} 
                    onChange={handleInputChange} 
                    className="form-control"
                    placeholder="e.g. Calculus & Algebra"
                  />
                  {formErrors.subject && <span style={{ color: 'rgb(var(--color-danger-rgb))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><AlertCircle size={12}/>{formErrors.subject}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Assigned Faculty</label>
                    <input 
                      type="text" 
                      name="teacher" 
                      value={formData.teacher} 
                      onChange={handleInputChange} 
                      className="form-control"
                      placeholder="e.g. Prof. Julian Vance"
                    />
                    {formErrors.teacher && <span style={{ color: 'rgb(var(--color-danger-rgb))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><AlertCircle size={12}/>{formErrors.teacher}</span>}
                  </div>

                  <div className="form-group">
                    <label>Classroom Code</label>
                    <input 
                      type="text" 
                      name="room" 
                      value={formData.room} 
                      onChange={handleInputChange} 
                      className="form-control"
                      placeholder="e.g. Room 201"
                    />
                    {formErrors.room && <span style={{ color: 'rgb(var(--color-danger-rgb))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><AlertCircle size={12}/>{formErrors.room}</span>}
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Schedule Period
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
