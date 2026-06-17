import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  List, 
  Plus, 
  Users, 
  Settings, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  ToggleLeft, 
  ToggleRight, 
  Save 
} from 'lucide-react';

export default function GradeManagement({ currentSubView, setAdminView, showToast }) {
  // Navigation tabs state sync
  const [activeTab, setActiveTab] = useState('grade-list');
  
  useEffect(() => {
    if (currentSubView) {
      setActiveTab(currentSubView);
    }
  }, [currentSubView]);

  // Master States
  const [grades, setGrades] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState({ academicSession: '2026-2027' });
  const [loading, setLoading] = useState(true);

  // Search, Filtering, Pagination States
  const [gradeSearch, setGradeSearch] = useState('');
  const [gradePage, setGradePage] = useState(1);
  const gradeLimit = 8;

  const [deptSearch, setDeptSearch] = useState('');
  const [deptPage, setDeptPage] = useState(1);
  const deptLimit = 8;

  const [logSearch, setLogSearch] = useState('');
  const [logPage, setLogPage] = useState(1);
  const logLimit = 10;

  const [newGrade, setNewGrade] = useState({ name: '', selectedDepts: [] });
  const [editingGrade, setEditingGrade] = useState(null);
  const [newDept, setNewDept] = useState({ name: '' });
  const [editingDept, setEditingDept] = useState(null);
  const [newSection, setNewSection] = useState({ name: '' });
  const [editingSection, setEditingSection] = useState(null);
  const [sections, setSections] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Bulk Action States
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedDepts, setSelectedDepts] = useState([]);

  // Fetch all database records
  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const [gradesRes, deptsRes, mapsRes, logsRes, settingsRes, sectionsRes] = await Promise.all([
        fetch('/api/grades'),
        fetch('/api/grades/departments'),
        fetch('/api/grades/mappings'),
        fetch('/api/rbac/audit-logs'),
        fetch('/api/grades/settings'),
        fetch('/api/grades/sections')
      ]);

      if (gradesRes.ok) setGrades(await gradesRes.json());
      if (deptsRes.ok) setDepartments(await deptsRes.json());
      if (mapsRes.ok) setMappings(await mapsRes.json());
      if (sectionsRes.ok) setSections(await sectionsRes.json());
      if (logsRes.ok) {
        const allLogs = await logsRes.json();
        // Filter logs related to grade management actions
        const filtered = allLogs.filter(l => 
          l.action.includes('Grade') || 
          l.action.includes('Department') || 
          l.action.includes('Mapping') ||
          l.action.includes('Structure') ||
          l.action.includes('Section')
        );
        setAuditLogs(filtered);
      }
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch (err) {
      console.error('Failed to preload grade management data:', err);
      showToast('Error loading data from server.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync tab clicks with Admin View router
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setAdminView(tab);
  };

  // Check if name is Grade 11 or 12 to display department selections
  const showDeptsSelector = (name) => {
    if (!name) return false;
    const clean = name.trim().toUpperCase();
    return clean.includes('11') || clean.includes('12') || clean.includes('XI') || clean.includes('XII');
  };

  // Grade CRUD Actions
  const handleCreateGrade = async (e) => {
    e.preventDefault();
    if (!newGrade.name.trim()) return;

    const formattedName = convertToRoman(newGrade.name.trim());
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formattedName,
          departments: showDeptsSelector(formattedName) ? newGrade.selectedDepts : []
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Grade ${newGrade.name} added successfully!`, 'success');
        setNewGrade({ name: '', selectedDepts: [] });
        loadData();
        handleTabChange('grade-list');
      } else {
        showToast(data.error || 'Failed to create grade.', 'danger');
      }
    } catch (err) {
      showToast('Network error creating grade.', 'danger');
    }
  };

  const handleUpdateGrade = async (e) => {
    e.preventDefault();
    if (!editingGrade.name.trim()) return;

    const formattedName = convertToRoman(editingGrade.name.trim());
    try {
      const res = await fetch(`/api/grades/${editingGrade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formattedName
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Grade updated successfully.', 'success');
        setEditingGrade(null);
        loadData();
      } else {
        showToast(data.error || 'Failed to update grade.', 'danger');
      }
    } catch (err) {
      showToast('Network error.', 'danger');
    }
  };

  const handleDeleteGrade = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete Grade "${name}"? This action will remove all mappings.`)) return;

    try {
      const res = await fetch(`/api/grades/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(`Grade ${name} successfully deleted.`, 'success');
        loadData();
      } else {
        showToast(data.error || 'Deletion blocked.', 'danger');
      }
    } catch (err) {
      showToast('Network error deleting grade.', 'danger');
    }
  };

  // Department CRUD Actions
  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!newDept.name.trim()) return;

    try {
      const res = await fetch('/api/grades/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDept.name.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Department "${newDept.name}" registered.`, 'success');
        setNewDept({ name: '' });
        loadData();
      } else {
        showToast(data.error || 'Failed to register department.', 'danger');
      }
    } catch (err) {
      showToast('Network error.', 'danger');
    }
  };

  const handleUpdateDept = async (e) => {
    e.preventDefault();
    if (!editingDept.name.trim()) return;

    try {
      const res = await fetch(`/api/grades/departments/${editingDept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingDept.name.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Department updated.', 'success');
        setEditingDept(null);
        loadData();
      } else {
        showToast(data.error || 'Update failed.', 'danger');
      }
    } catch (err) {
      showToast('Network error.', 'danger');
    }
  };

  const handleDeleteDept = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete Department "${name}"?`)) return;
    try {
      const res = await fetch(`/api/grades/departments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(`Department "${name}" removed.`, 'success');
        loadData();
      } else {
        showToast(data.error || 'Deletion blocked.', 'danger');
      }
    } catch (err) {
      showToast('Network error.', 'danger');
    }
  };

  // Grade-Dept Mapping Grid Toggle
  const handleToggleMapping = async (gradeId, departmentId) => {
    const existing = mappings.find(m => m.gradeId === gradeId && m.departmentId === departmentId);
    
    if (existing) {
      // Delete Mapping
      try {
        const res = await fetch(`/api/grades/mappings/${existing.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          showToast('Mapping removed.', 'success');
          loadData();
        } else {
          showToast(data.error || 'Mapping deletion blocked.', 'danger');
        }
      } catch (err) {
        showToast('Network error.', 'danger');
      }
    } else {
      // Create Mapping
      try {
        const res = await fetch('/api/grades/mappings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gradeId, departmentId })
        });
        const data = await res.json();
        if (res.ok) {
          showToast('Grade mapping active.', 'success');
          loadData();
        } else {
          showToast(data.error || 'Failed mapping.', 'danger');
        }
      } catch (err) {
        showToast('Network error.', 'danger');
      }
    }
  };

  // Section CRUD Actions
  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSection.name.trim()) return;

    try {
      const res = await fetch('/api/grades/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSection.name.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Section "${newSection.name}" created.`, 'success');
        setNewSection({ name: '' });
        setShowCreateModal(false);
        loadData();
      } else {
        showToast(data.error || 'Failed to create section.', 'danger');
      }
    } catch (err) {
      showToast('Network error.', 'danger');
    }
  };

  const handleUpdateSection = async (e) => {
    e.preventDefault();
    if (!editingSection.name.trim()) return;

    try {
      const res = await fetch(`/api/grades/sections/${editingSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingSection.name.trim(),
          status: editingSection.status
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Section updated successfully.', 'success');
        setEditingSection(null);
        loadData();
      } else {
        showToast(data.error || 'Failed to update section.', 'danger');
      }
    } catch (err) {
      showToast('Network error.', 'danger');
    }
  };

  const handleDeleteSection = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete Section "${name}"?`)) return;
    try {
      const res = await fetch(`/api/grades/sections/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(`Section "${name}" deleted.`, 'success');
        loadData();
      } else {
        showToast(data.error || 'Failed to delete section.', 'danger');
      }
    } catch (err) {
      showToast('Network error.', 'danger');
    }
  };

  // Academic Settings Action
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/grades/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicSession: settings.academicSession })
      });
      if (res.ok) {
        showToast('Academic structure settings updated.', 'success');
        loadData();
      } else {
        showToast('Failed to save settings.', 'danger');
      }
    } catch (err) {
      showToast('Network error.', 'danger');
    }
  };

  // Filters and sorting computations
  const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'LKG': -2, 'UKG': -1, 'NURSERY': -3 };
  const sortGradesHelper = (a, b) => {
    const aVal = a.name.toUpperCase();
    const bVal = b.name.toUpperCase();
    const aRoman = romanMap[aVal];
    const bRoman = romanMap[bVal];
    if (aRoman !== undefined && bRoman !== undefined) return aRoman - bRoman;
    const aNum = parseInt(aVal.replace('GRADE', '').trim());
    const bNum = parseInt(bVal.replace('GRADE', '').trim());
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return aVal.localeCompare(bVal);
  };

  const convertToRoman = (str) => {
    if (!str) return '';
    const clean = str.trim().toUpperCase();
    
    if (['LKG', 'UKG', 'NURSERY'].includes(clean)) {
      return clean;
    }
    
    const match = clean.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      const lookup = {
        1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
      };
      if (lookup[num]) {
        return lookup[num];
      }
    }
    
    const wordsLookup = {
      'FIRST': 'I', 'SECOND': 'II', 'THIRD': 'III', 'FOURTH': 'IV', 'FIFTH': 'V', 'SIXTH': 'VI',
      'SEVENTH': 'VII', 'EIGHTH': 'VIII', 'NINTH': 'IX', 'TENTH': 'X', 'ELEVENTH': 'XI', 'TWELFTH': 'XII',
      '1ST': 'I', '2ND': 'II', '3RD': 'III', '4TH': 'IV', '5TH': 'V', '6TH': 'VI', '7TH': 'VII',
      '8TH': 'VIII', '9TH': 'IX', '10TH': 'X', '11TH': 'XI', '12TH': 'XII'
    };
    
    if (wordsLookup[clean]) {
      return wordsLookup[clean];
    }
    
    return str;
  };

  const isGrade11or12 = (name) => {
    if (!name) return false;
    const clean = name.trim().toUpperCase();
    return clean.includes('11') || clean.includes('12') || clean.includes('XI') || clean.includes('XII');
  };

  const filteredGrades = grades
    .filter(g => g.name.toLowerCase().includes(gradeSearch.toLowerCase()))
    .sort(sortGradesHelper);

  const displayGrades = [];
  filteredGrades.forEach(g => {
    if (isGrade11or12(g.name)) {
      if (departments.length > 0) {
        departments.forEach(d => {
          displayGrades.push({
            ...g,
            displayId: `${g.id}-${d.id}`,
            displayName: `${g.name} (${d.name})`,
            deptName: d.name,
            deptId: d.id
          });
        });
      } else {
        displayGrades.push({
          ...g,
          displayId: g.id,
          displayName: g.name,
          deptName: 'None',
          deptId: null
        });
      }
    } else {
      displayGrades.push({
        ...g,
        displayId: g.id,
        displayName: g.name,
        deptName: 'None',
        deptId: null
      });
    }
  });

  const paginatedGrades = displayGrades.slice(
    (gradePage - 1) * gradeLimit,
    gradePage * gradeLimit
  );
  const gradeTotalPages = Math.ceil(displayGrades.length / gradeLimit);

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(deptSearch.toLowerCase())
  );
  const paginatedDepts = filteredDepts.slice(
    (deptPage - 1) * deptLimit,
    deptPage * deptLimit
  );
  const deptTotalPages = Math.ceil(filteredDepts.length / deptLimit);

  const filteredLogs = auditLogs.filter(l => 
    l.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.details.toLowerCase().includes(logSearch.toLowerCase())
  );
  const paginatedLogs = filteredLogs.slice(
    (logPage - 1) * logLimit,
    logPage * logLimit
  );
  const logTotalPages = Math.ceil(filteredLogs.length / logLimit);

  const handleBulkDeleteGrades = async () => {
    if (selectedGrades.length === 0) return;
    
    // Extract unique master grade IDs
    const masterGradeIds = Array.from(new Set(selectedGrades.map(selectedId => {
      const matchedGrade = grades.find(g => selectedId === g.id || selectedId.startsWith(`${g.id}-`));
      return matchedGrade ? matchedGrade.id : selectedId;
    })));

    if (!window.confirm(`Are you sure you want to delete the ${masterGradeIds.length} selected grades?`)) return;

    try {
      let deletesSucceeded = 0;
      let deletesFailed = 0;
      let errorMsg = '';

      for (const gId of masterGradeIds) {
        const grade = grades.find(g => g.id === gId);
        if (grade) {
          const res = await fetch(`/api/grades/${gId}`, { method: 'DELETE' });
          if (res.ok) {
            deletesSucceeded++;
          } else {
            deletesFailed++;
            const err = await res.json();
            errorMsg = err.error || 'Usage restrictions.';
          }
        }
      }

      if (deletesFailed > 0) {
        showToast(`Deleted ${deletesSucceeded} grades. ${deletesFailed} grades blocked from deletion: ${errorMsg}`, 'danger');
      } else {
        showToast(`Successfully deleted ${deletesSucceeded} grades.`, 'success');
      }

      setSelectedGrades([]);
      loadData();
    } catch (e) {
      showToast('Bulk deletion failed.', 'danger');
    }
  };

  return (
    <div className="grade-management-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sub-navigation Menu Header */}
      <div className="glass-panel" style={{ padding: '8px', display: 'flex', gap: '8px', overflowX: 'auto', borderRadius: '12px' }}>
        <button 
          onClick={() => handleTabChange('grade-list')}
          className={`tab-btn-custom ${activeTab === 'grade-list' ? 'active' : ''}`}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: activeTab === 'grade-list' ? 'rgba(99,102,241,0.1)' : 'transparent',
            color: activeTab === 'grade-list' ? 'rgb(99,102,241)' : 'var(--text-muted)',
            transition: 'all 0.2s ease'
          }}
        >
          <List size={16} /> Grade List
        </button>
        <button 
          onClick={() => handleTabChange('add-grade')}
          className={`tab-btn-custom ${activeTab === 'add-grade' ? 'active' : ''}`}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: activeTab === 'add-grade' ? 'rgba(99,102,241,0.1)' : 'transparent',
            color: activeTab === 'add-grade' ? 'rgb(99,102,241)' : 'var(--text-muted)',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={16} /> Add Grade
        </button>
        <button 
          onClick={() => handleTabChange('grade-departments')}
          className={`tab-btn-custom ${activeTab === 'grade-departments' ? 'active' : ''}`}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: activeTab === 'grade-departments' ? 'rgba(99,102,241,0.1)' : 'transparent',
            color: activeTab === 'grade-departments' ? 'rgb(99,102,241)' : 'var(--text-muted)',
            transition: 'all 0.2s ease'
          }}
        >
           <Users size={16} /> Departments
         </button>

         <button 
           onClick={() => handleTabChange('grade-academic-settings')}
           className={`tab-btn-custom ${activeTab === 'grade-academic-settings' ? 'active' : ''}`}
           style={{
             display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
             background: activeTab === 'grade-academic-settings' ? 'rgba(99,102,241,0.1)' : 'transparent',
             color: activeTab === 'grade-academic-settings' ? 'rgb(99,102,241)' : 'var(--text-muted)',
             transition: 'all 0.2s ease'
           }}
         >
           <Settings size={16} /> Structure Settings
         </button>

         <button 
           onClick={() => handleTabChange('section-utility')}
           className={`tab-btn-custom ${activeTab === 'section-utility' ? 'active' : ''}`}
           style={{
             display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
             background: activeTab === 'section-utility' ? 'rgba(99,102,241,0.1)' : 'transparent',
             color: activeTab === 'section-utility' ? 'rgb(99,102,241)' : 'var(--text-muted)',
             transition: 'all 0.2s ease'
           }}
         >
           <Plus size={16} /> Section Utility
         </button>
       </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px', flexDirection: 'column', gap: '12px' }}>
          <Loader2 className="animate-spin" size={36} style={{ color: 'rgb(99, 102, 241)' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Processing dynamic schema sync...</p>
        </div>
      ) : (
        <div className="tab-contents">
          
          {/* VIEW 1: GRADE LIST */}
          {activeTab === 'grade-list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
                  <div className="search-bar-container" style={{ width: '100%', maxWidth: '300px' }}>
                    <Search size={16} className="search-bar-icon" />
                    <input 
                      type="text" 
                      placeholder="Search grade name..." 
                      className="search-bar-input"
                      value={gradeSearch}
                      onChange={(e) => { setGradeSearch(e.target.value); setGradePage(1); }}
                      style={{ width: '100%' }}
                    />
                  </div>

                </div>

                {selectedGrades.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleBulkDeleteGrades} className="btn-danger" style={{ padding: '8px 14px', fontSize: '0.85rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="custom-table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedGrades.length === paginatedGrades.length && paginatedGrades.length > 0} 
                            onChange={(e) => {
                              if (e.target.checked) setSelectedGrades(paginatedGrades.map(g => g.displayId || g.id));
                              else setSelectedGrades([]);
                            }}
                          />
                        </th>
                        <th>Grade</th>
                        <th>Department</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedGrades.length > 0 ? (
                        paginatedGrades.map((g) => {
                          const rowKey = g.displayId || g.id;
                          return (
                            <tr key={rowKey}>
                              <td>
                                <input 
                                  type="checkbox" 
                                  checked={selectedGrades.includes(rowKey)} 
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedGrades(prev => [...prev, rowKey]);
                                    } else {
                                      setSelectedGrades(prev => prev.filter(id => id !== rowKey));
                                    }
                                  }}
                                />
                              </td>
                              <td style={{ fontWeight: 600 }}>{g.name}</td>
                              <td>
                                {g.deptName !== 'None' ? (
                                  <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'rgb(99, 102, 241)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {g.deptName}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
                                )}
                              </td>

                              <td>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button type="button" onClick={() => setEditingGrade({...g})} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                    <Edit3 size={12} /> Edit
                                  </button>
                                  <button type="button" onClick={() => handleDeleteGrade(g.id, g.name)} className="btn-danger" style={{ padding: '6px 8px', display: 'flex', cursor: 'pointer' }} title="Delete Grade">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            No grades found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {gradeTotalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Showing Page <strong>{gradePage}</strong> of <strong>{gradeTotalPages}</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button disabled={gradePage === 1} onClick={() => setGradePage(p => p - 1)} className="btn-secondary" style={{ padding: '6px 10px' }}>
                        <ChevronLeft size={14} />
                      </button>
                      <button disabled={gradePage === gradeTotalPages} onClick={() => setGradePage(p => p + 1)} className="btn-secondary" style={{ padding: '6px 10px' }}>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Grade Modal */}
              {editingGrade && (
                <div onClick={() => setEditingGrade(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <form onSubmit={handleUpdateGrade} onClick={(e) => e.stopPropagation()} className="glass-panel" style={{ padding: '24px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-elevated)', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Edit Grade</h3>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Grade Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editingGrade.name} 
                        onChange={(e) => setEditingGrade({ ...editingGrade, name: e.target.value })}
                        onBlur={(e) => setEditingGrade({ ...editingGrade, name: convertToRoman(e.target.value) })}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button type="button" onClick={() => setEditingGrade(null)} className="btn-secondary" style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ padding: '8px 16px', cursor: 'pointer' }}>Save Changes</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: ADD GRADE */}
          {activeTab === 'add-grade' && (
            <div className="glass-panel" style={{ padding: '30px', maxWidth: '500px', margin: '0 auto' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 800 }}>Create New Grade / Class</h3>
              <form onSubmit={handleCreateGrade} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Grade Name / Class</label>
                  <input 
                    type="text" 
                    placeholder="e.g. XI, XII, Grade 5, LKG"
                    className="form-control"
                    value={newGrade.name}
                    onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
                    onBlur={(e) => setNewGrade({ ...newGrade, name: convertToRoman(e.target.value) })}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Type standard roman class numbers (XI/XII) to display special department mapping selectors.
                  </small>
                </div>





                <button type="submit" className="btn-primary" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgb(99, 102, 241)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                  <Save size={18} /> Register Grade
                </button>
              </form>
            </div>
          )}

          {/* VIEW 3: DEPARTMENTS */}
          {activeTab === 'grade-departments' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* Department Form */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Add Department</h3>
                  <form onSubmit={handleCreateDept} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Department Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Arts, Science Biology"
                        className="form-control"
                        value={newDept.name}
                        onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                        required
                      />
                    </div>

                    <button type="submit" className="btn-primary" style={{ padding: '10px', background: 'rgb(99, 102, 241)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      Register Department
                    </button>
                  </form>
                </div>

                {/* Departments List */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Departments Registry</h3>
                  <div className="custom-table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Department Name</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.length > 0 ? (
                          departments.map(d => (
                            <tr key={d.id}>
                              <td style={{ fontWeight: 600 }}>{d.name}</td>

                              <td>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button type="button" onClick={() => setEditingDept({...d})} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                    Edit
                                  </button>
                                  <button type="button" onClick={() => handleDeleteDept(d.id, d.name)} className="btn-danger" style={{ padding: '4px 6px', display: 'flex', cursor: 'pointer' }}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                              No departments registered.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Edit Department Modal */}
              {editingDept && (
                <div onClick={() => setEditingDept(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <form onSubmit={handleUpdateDept} onClick={(e) => e.stopPropagation()} className="glass-panel" style={{ padding: '24px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-elevated)', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Edit Department</h3>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Department Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editingDept.name} 
                        onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button type="button" onClick={() => setEditingDept(null)} className="btn-secondary" style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ padding: '8px 16px', cursor: 'pointer' }}>Save Changes</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: SECTION UTILITY */}
          {activeTab === 'section-utility' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Sections Registry</h3>
                  <button 
                    onClick={() => setShowCreateModal(true)} 
                    className="btn-primary" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      fontSize: '0.85rem', 
                      fontWeight: 600, 
                      cursor: 'pointer' 
                    }}
                  >
                    <Plus size={16} /> Create Section
                  </button>
                </div>

                <div className="custom-table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Section Name</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.length > 0 ? (
                        sections.map(s => (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                            <td>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: s.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: s.status === 'Active' ? '#10b981' : '#ef4444'
                              }}>{s.status || 'Active'}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setEditingSection({...s})} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                  Edit
                                </button>
                                <button type="button" onClick={() => handleDeleteSection(s.id, s.name)} className="btn-danger" style={{ padding: '4px 6px', display: 'flex', cursor: 'pointer' }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            No sections registered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create Section Modal */}
              {showCreateModal && (
                <div onClick={() => setShowCreateModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <form onSubmit={handleCreateSection} onClick={(e) => e.stopPropagation()} className="glass-panel" style={{ padding: '24px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-elevated)', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Create New Section</h3>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Section Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. A, B, C, Gold"
                        className="form-control"
                        value={newSection.name}
                        onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ padding: '8px 16px', cursor: 'pointer' }}>Create</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Edit Section Modal */}
              {editingSection && (
                <div onClick={() => setEditingSection(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <form onSubmit={handleUpdateSection} onClick={(e) => e.stopPropagation()} className="glass-panel" style={{ padding: '24px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-elevated)', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Edit Section</h3>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Section Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editingSection.name} 
                        onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Status</label>
                      <select 
                        className="form-control" 
                        value={editingSection.status || 'Active'} 
                        onChange={(e) => setEditingSection({ ...editingSection, status: e.target.value })}
                        style={{ background: 'var(--bg-form)', color: 'var(--text-main)' }}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button type="button" onClick={() => setEditingSection(null)} className="btn-secondary" style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ padding: '8px 16px', cursor: 'pointer' }}>Save Changes</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* VIEW 5: ACADEMIC SETTINGS */}
          {activeTab === 'grade-academic-settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Structure Form */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Academic Structure Settings</h3>
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Current Active Session</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2026-2027"
                      className="form-control"
                      value={settings.academicSession}
                      onChange={(e) => setSettings({ ...settings, academicSession: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '10px', background: 'rgb(99, 102, 241)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Save Settings
                  </button>
                </form>
              </div>

              {/* Audit Logs */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Grade Management Audit Logs</h3>
                  <div className="search-bar-container" style={{ width: '180px' }}>
                    <Search size={14} className="search-bar-icon" />
                    <input 
                      type="text" 
                      placeholder="Search log..." 
                      className="search-bar-input"
                      value={logSearch}
                      onChange={(e) => { setLogSearch(e.target.value); setLogPage(1); }}
                      style={{ fontSize: '0.75rem', padding: '6px 12px 6px 30px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map(log => (
                      <div key={log.id} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                          <span style={{ color: 'rgb(99, 102, 241)' }}>{log.userName} ({log.userRole})</span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{log.action}</span>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.details}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No audit trails found.</div>
                  )}
                </div>

                {logTotalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-glass)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Page {logPage} of {logTotalPages}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button disabled={logPage === 1} onClick={() => setLogPage(p => p - 1)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Prev</button>
                      <button disabled={logPage === logTotalPages} onClick={() => setLogPage(p => p + 1)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Next</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
