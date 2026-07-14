import React, { useState, useEffect } from 'react';
import './GradeManagement.css';
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
  Save,
  BookOpen,
  X
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
  const [loading, setLoading] = useState(true);

  // Search, Filtering, Pagination States
  const [gradeSearch, setGradeSearch] = useState('');
  const [gradePage, setGradePage] = useState(1);
  const gradeLimit = 8;

  const [deptSearch, setDeptSearch] = useState('');
  const [deptPage, setDeptPage] = useState(1);
  const deptLimit = 8;

  const [newGrade, setNewGrade] = useState({ name: '', selectedDepts: [] });
  const [editingGrade, setEditingGrade] = useState(null);
  const [newDept, setNewDept] = useState({ name: '' });
  const [editingDept, setEditingDept] = useState(null);
  const [newSection, setNewSection] = useState({ name: '' });
  const [editingSection, setEditingSection] = useState(null);
  const [sections, setSections] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subjects, setSubjects] = useState([]);

  // Modal States for sections & subjects management
  const [sectionModalGrade, setSectionModalGrade] = useState(null);
  const [subjectModalGrade, setSubjectModalGrade] = useState(null);
  const [selectedModalSections, setSelectedModalSections] = useState([]);
  const [newGlobalSectionName, setNewGlobalSectionName] = useState('');
  const [savingSections, setSavingSections] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [bulkSubjectNames, setBulkSubjectNames] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);

  // Bulk Action States
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedDepts, setSelectedDepts] = useState([]);

  // Fetch all database records
  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const [gradesRes, deptsRes, mapsRes, sectionsRes, subjectsRes] = await Promise.all([
        fetch('/api/grades'),
        fetch('/api/grades/departments'),
        fetch('/api/grades/mappings'),
        fetch('/api/grades/sections'),
        fetch('/api/academics/subjects')
      ]);

      if (gradesRes.ok) setGrades(await gradesRes.json());
      if (deptsRes.ok) setDepartments(await deptsRes.json());
      if (mapsRes.ok) setMappings(await mapsRes.json());
      if (sectionsRes.ok) setSections(await sectionsRes.json());
      if (subjectsRes && subjectsRes.ok) setSubjects(await subjectsRes.json());
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

  useEffect(() => {
    if (sectionModalGrade) {
      setSelectedModalSections(sectionModalGrade.sections || []);
    } else {
      setSelectedModalSections([]);
      setNewGlobalSectionName('');
    }
  }, [sectionModalGrade]);

  const handleToggleModalSection = (secName) => {
    if (selectedModalSections.includes(secName)) {
      setSelectedModalSections(prev => prev.filter(name => name !== secName));
    } else {
      setSelectedModalSections(prev => [...prev, secName]);
    }
  };

  const handleCreateAndAssignSection = async () => {
    const cleanName = newGlobalSectionName.trim();
    if (!cleanName) return;

    try {
      const existing = sections.find(s => s.name.toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        if (!selectedModalSections.includes(existing.name)) {
          setSelectedModalSections(prev => [...prev, existing.name]);
        }
        setNewGlobalSectionName('');
        return;
      }

      const res = await fetch('/api/grades/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName })
      });
      const data = await res.json();
      if (res.ok) {
        const sectionsRes = await fetch('/api/grades/sections');
        if (sectionsRes.ok) {
          setSections(await sectionsRes.json());
        }
        setSelectedModalSections(prev => [...prev, data.name]);
        setNewGlobalSectionName('');
        showToast(`Section "${cleanName}" created globally and assigned.`, 'success');
      } else {
        showToast(data.error || 'Failed to create section.', 'danger');
      }
    } catch (err) {
      showToast('Network error.', 'danger');
    }
  };

  const handleSaveModalSections = async () => {
    if (!sectionModalGrade) return;
    setSavingSections(true);
    try {
      const res = await fetch(`/api/grades/${sectionModalGrade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sections: selectedModalSections,
          departmentId: sectionModalGrade.deptId 
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Grade sections updated successfully.', 'success');
        setSectionModalGrade(null);
        loadData();
      } else {
        showToast(data.error || 'Failed to save sections.', 'danger');
      }
    } catch (err) {
      showToast('Network error saving sections.', 'danger');
    } finally {
      setSavingSections(false);
    }
  };

  const handleRemoveSectionDirectly = async (grade, secName) => {
    if (!window.confirm(`Are you sure you want to remove section "${secName}"?`)) return;
    const remainingSections = (grade.sections || []).filter(name => name !== secName);
    try {
      const res = await fetch(`/api/grades/${grade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sections: remainingSections,
          departmentId: grade.deptId
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Section "${secName}" removed from ${grade.name}.`, 'success');
        loadData();
      } else {
        showToast(data.error || 'Failed to remove section.', 'danger');
      }
    } catch (err) {
      showToast('Network error removing section.', 'danger');
    }
  };

  const handleAddModalSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !subjectModalGrade) return;
    setAddingSubject(true);

    try {
      const res = await fetch('/api/academics/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: subjectModalGrade.displayName,
          subjectName: newSubjectName.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Subject "${newSubjectName}" added.`, 'success');
        setNewSubjectName('');
        loadData();
      } else {
        showToast(data.error || 'Failed to add subject.', 'danger');
      }
    } catch (err) {
      showToast('Network error.', 'danger');
    } finally {
      setAddingSubject(false);
    }
  };

  const handleAddModalSubjectsBulk = async (e) => {
    e.preventDefault();
    if (!bulkSubjectNames.trim() || !subjectModalGrade) return;
    setAddingSubject(true);

    const namesArray = bulkSubjectNames
      .split(',')
      .map(name => name.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/academics/subjects/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: subjectModalGrade.displayName,
          subjectNames: namesArray
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Successfully added ${namesArray.length} subjects in bulk.`, 'success');
        setBulkSubjectNames('');
        loadData();
      } else {
        showToast(data.error || 'Failed to add bulk subjects.', 'danger');
      }
    } catch (err) {
      showToast('Network error.', 'danger');
    } finally {
      setAddingSubject(false);
    }
  };

  const handleDeleteModalSubject = async (subId, subName) => {
    if (!window.confirm(`Are you sure you want to delete subject "${subName}"?`)) return;
    try {
      const res = await fetch(`/api/academics/subjects/${subId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Subject "${subName}" deleted.`, 'success');
        loadData();
      } else {
        showToast(data.error || 'Failed to delete subject.', 'danger');
      }
    } catch (err) {
      showToast('Network error deleting subject.', 'danger');
    }
  };

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
          name: formattedName,
          departments: showDeptsSelector(formattedName) ? (editingGrade.selectedDepts || []) : []
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

  const handleDeleteGrade = async (g) => {
    if (g.deptId) {
      const existing = mappings.find(m => m.gradeId === g.id && m.departmentId === g.deptId);
      if (!existing) {
        showToast('Mapping not found.', 'danger');
        return;
      }
      if (!window.confirm(`Are you sure you want to delete department option "${g.displayName}"?`)) return;

      try {
        const res = await fetch(`/api/grades/mappings/${existing.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          showToast(`Option "${g.displayName}" successfully deleted.`, 'success');
          loadData();
        } else {
          showToast(data.error || 'Deletion blocked.', 'danger');
        }
      } catch (err) {
        showToast('Network error deleting mapping.', 'danger');
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete Grade "${g.name}"? This action will remove all mappings.`)) return;

      try {
        const res = await fetch(`/api/grades/${g.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          showToast(`Grade ${g.name} successfully deleted.`, 'success');
          loadData();
        } else {
          showToast(data.error || 'Deletion blocked.', 'danger');
        }
      } catch (err) {
        showToast('Network error deleting grade.', 'danger');
      }
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


  // Filters and sorting computations
  const sortGradesHelper = (a, b) => {
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  };

  const convertToRoman = (str) => {
    if (!str) return '';
    const clean = str.trim().toUpperCase();
    
    if (['LKG', 'UKG', 'NURSERY'].includes(clean)) {
      return clean;
    }
    
    const exactLookup = {
      '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X', '11': 'XI', '12': 'XII',
      'I': 'I', 'II': 'II', 'III': 'III', 'IV': 'IV', 'V': 'V', 'VI': 'VI', 'VII': 'VII', 'VIII': 'VIII', 'IX': 'IX', 'X': 'X', 'XI': 'XI', 'XII': 'XII',
      'FIRST': 'I', 'SECOND': 'II', 'THIRD': 'III', 'FOURTH': 'IV', 'FIFTH': 'V', 'SIXTH': 'VI', 'SEVENTH': 'VII', 'EIGHTH': 'VIII', 'NINTH': 'IX', 'TENTH': 'X', 'ELEVENTH': 'XI', 'TWELFTH': 'XII',
      '1ST': 'I', '2ND': 'II', '3RD': 'III', '4TH': 'IV', '5TH': 'V', '6TH': 'VI', '7TH': 'VII', '8TH': 'VIII', '9TH': 'IX', '10TH': 'X', '11TH': 'XI', '12TH': 'XII'
    };

    if (exactLookup[clean]) {
      return exactLookup[clean];
    }
    
    const match = clean.match(/\b\d+\b/);
    if (match) {
      const num = parseInt(match[0], 10);
      const lookup = {
        1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
      };
      if (lookup[num]) {
        return lookup[num];
      }
    }
    
    return clean;
  };

  const isGrade11or12 = (name) => {
    if (!name) return false;
    const clean = name.trim().toUpperCase();
    const tokens = clean.split(/[\s()\-]+/);
    return tokens.some(t => ['11', '12', 'XI', 'XII'].includes(t));
  };

  const filteredGrades = grades
    .filter(g => {
      if (!gradeSearch) return true;
      const num = parseInt(gradeSearch, 10);
      const lookup = {
        1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
      };
      const roman = lookup[num] || gradeSearch;
      return g.name.toLowerCase().startsWith(roman.toLowerCase());
    })
    .sort(sortGradesHelper);

  const displayGrades = [];
  filteredGrades.forEach(g => {
    if (isGrade11or12(g.name)) {
      const mappingsForGrade = mappings.filter(m => m.gradeId === g.id);
      if (mappingsForGrade.length > 0) {
        mappingsForGrade.forEach(m => {
          const d = departments.find(dept => dept.id === m.departmentId);
          if (d) {
            displayGrades.push({
              ...g,
              displayId: `${g.id}-${d.id}`,
              displayName: `${g.name} (${d.name})`,
              deptName: d.name,
              deptId: d.id,
              sections: m.sections || [],
              createdAt: m.createdAt || g.createdAt
            });
          }
        });
      } else {
        displayGrades.push({
          ...g,
          displayId: g.id,
          displayName: g.name,
          deptName: 'None',
          deptId: null,
          sections: [],
          createdAt: g.createdAt
        });
      }
    } else {
      displayGrades.push({
        ...g,
        displayId: g.id,
        displayName: g.name,
        deptName: 'None',
        deptId: null,
        createdAt: g.createdAt
      });
    }
  });

  // Sort displayGrades sequentially (oldest created showing first)
  displayGrades.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

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


  const handleBulkDeleteGrades = async () => {
    if (selectedGrades.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete the ${selectedGrades.length} selected items?`)) return;

    try {
      let deletesSucceeded = 0;
      let deletesFailed = 0;
      let errorMsg = '';

      for (const rowKey of selectedGrades) {
        const mapping = mappings.find(m => `${m.gradeId}-${m.departmentId}` === rowKey);
        if (mapping) {
          const res = await fetch(`/api/grades/mappings/${mapping.id}`, { method: 'DELETE' });
          if (res.ok) {
            deletesSucceeded++;
          } else {
            deletesFailed++;
            const err = await res.json();
            errorMsg = err.error || 'Usage restrictions.';
          }
        } else {
          // Master grade delete
          const res = await fetch(`/api/grades/${rowKey}`, { method: 'DELETE' });
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
        showToast(`Deleted ${deletesSucceeded} items. ${deletesFailed} items blocked from deletion: ${errorMsg}`, 'danger');
      } else {
        showToast(`Successfully deleted ${deletesSucceeded} items.`, 'success');
      }

      setSelectedGrades([]);
      loadData();
    } catch (e) {
      showToast('Bulk deletion failed.', 'danger');
    }
  };
  return (
    <div className="grade-management-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* â”€â”€ Tab Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="gm-tab-strip">
        {[
          { key: 'grade-list', icon: <List size={15} />, label: 'Grade List' },
          { key: 'add-grade',  icon: <Plus size={15} />, label: 'Add Grade' },
          { key: 'grade-departments', icon: <Users size={15} />, label: 'Departments' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`gm-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px', flexDirection: 'column', gap: '14px' }}>
          <Loader2 className="animate-spin" size={36} style={{ color: '#FF8C42' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Loading grade data…</p>
        </div>
      ) : (
        <div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              VIEW 1 — GRADE LIST
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'grade-list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>



              {/* Search + bulk-delete toolbar */}
              <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', border: '1.5px solid rgba(255,107,0,0.1)', borderRadius: '14px', background: 'var(--bg-card)' }}>
                <div className="gm-search-wrap">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Search grade (e.g. 1, 2)…"
                    className="gm-search-input"
                    value={gradeSearch}
                    onChange={e => { setGradeSearch(e.target.value.replace(/[^0-9]/g, '')); setGradePage(1); }}
                  />
                </div>
                {selectedGrades.length > 0 && (
                  <button onClick={handleBulkDeleteGrades} className="gm-btn-danger">
                    <Trash2 size={14} /> Delete Selected ({selectedGrades.length})
                  </button>
                )}
              </div>

              {/* SaaS Table Form */}
              <div className="glass-panel" style={{ overflowX: 'auto', padding: '0', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)' }}>
                <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,107,0,0.02)' }}>
                      <th style={{ padding: '14px 18px', width: '50px' }}>
                        <input
                          type="checkbox"
                          checked={displayGrades.length > 0 && selectedGrades.length === displayGrades.length}
                          onChange={e => {
                            if (e.target.checked) setSelectedGrades(displayGrades.map(g => g.displayId || g.id));
                            else setSelectedGrades([]);
                          }}
                          style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#FF8C42' }}
                        />
                      </th>
                      <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Class / Grade</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sections</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Subjects</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayGrades.length > 0 ? displayGrades.map(g => {
                      const rowKey = g.displayId || g.id;
                      const gradeSections = g.sections || [];
                      const gradeSubjectsList = subjects.filter(sub => sub.grade?.toUpperCase() === g.displayName?.toUpperCase());

                      return (
                        <tr key={rowKey} style={{ borderBottom: '1px solid var(--border-glass)' }} className="hover-row">
                          {/* Checkbox */}
                          <td style={{ padding: '16px 18px' }}>
                            <input
                              type="checkbox"
                              checked={selectedGrades.includes(rowKey)}
                              onChange={e => {
                                if (e.target.checked) setSelectedGrades(prev => [...prev, rowKey]);
                                else setSelectedGrades(prev => prev.filter(id => id !== rowKey));
                              }}
                              style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#FF8C42' }}
                            />
                          </td>

                          {/* Class / Grade Name */}
                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="gm-grade-avatar" style={{ margin: 0, fontSize: (g.name || '').length > 2 ? '0.7rem' : '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{g.name}</div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                  Grade {g.name}
                                </div>
                                {g.deptName !== 'None' && (
                                  <span className="gm-grade-badge" style={{ marginTop: '2px', display: 'inline-block' }}>{g.deptName}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Sections */}
                          <td style={{ padding: '16px 18px', maxWidth: '280px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {gradeSections.length > 0 ? gradeSections.map((secName, idx) => (
                                <span key={idx} className="gm-chip gm-chip-section">
                                  {secName}
                                  <button
                                    type="button"
                                    className="gm-chip-del"
                                    title={`Remove ${secName}`}
                                    onClick={e => { e.stopPropagation(); handleRemoveSectionDirectly(g, secName); }}
                                  >
                                    <X size={9} />
                                  </button>
                                </span>
                              )) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>No sections</span>
                              )}
                            </div>
                          </td>

                          {/* Subjects */}
                          <td style={{ padding: '16px 18px', maxWidth: '380px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {gradeSubjectsList.length > 0 ? gradeSubjectsList.map((sub, idx) => (
                                <span key={idx} className="gm-chip gm-chip-subject">
                                  {sub.subjectName}
                                  <button
                                    type="button"
                                    className="gm-chip-del"
                                    style={{ color: '#10b981', opacity: 0.7 }}
                                    title={`Delete ${sub.subjectName}`}
                                    onClick={e => { e.stopPropagation(); handleDeleteModalSubject(sub.id, sub.subjectName); }}
                                  >
                                    <X size={9} />
                                  </button>
                                </span>
                              )) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>No subjects</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }}
                                onClick={() => setSectionModalGrade(g)}
                              >
                                <Plus size={12} /> Sections
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }}
                                onClick={() => setSubjectModalGrade(g)}
                              >
                                <BookOpen size={12} /> Subjects
                              </button>
                              <button
                                type="button"
                                className="gm-icon-btn"
                                style={{ height: '32px', width: '32px' }}
                                title="Edit Grade"
                                onClick={() => {
                                  const mappedDepts = mappings.filter(m => m.gradeId === g.id).map(m => m.departmentId);
                                  setEditingGrade({ ...g, selectedDepts: mappedDepts });
                                }}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                className="gm-icon-btn danger"
                                style={{ height: '32px', width: '32px' }}
                                title="Delete Grade"
                                onClick={() => handleDeleteGrade(g)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="5">
                          <div className="gm-empty" style={{ padding: '40px' }}>
                            <div className="gm-empty-icon"><GraduationCap size={26} /></div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No grades found</div>
                            <div style={{ fontSize: '0.82rem' }}>Click "Add Grade" to create your first grade.</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Edit Grade Modal */}
              {editingGrade && (
                <div className="gm-modal-overlay">
                  <form onSubmit={handleUpdateGrade} className="gm-modal-box" style={{ maxWidth: '420px' }}>
                    <div className="gm-modal-header">
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                          <span style={{ color: '#FF8C42' }}>Edit</span> Grade
                        </h3>
                        <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Update grade name or department mapping</p>
                      </div>
                      <button type="button" className="gm-modal-close" onClick={() => setEditingGrade(null)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="gm-modal-body">
                      <div className="gm-form-group">
                        <label className="gm-label">Grade Name</label>
                        <input
                          type="text"
                          name="gradeName"
                          data-type="grade-name"
                          className="gm-input grade-name-input"
                          value={editingGrade.name}
                          onChange={e => setEditingGrade({ ...editingGrade, name: e.target.value })}
                          required
                        />
                      </div>

                      {showDeptsSelector(editingGrade.name) && (
                        <div className="gm-form-group">
                          <label className="gm-label">Select Departments</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {departments.map(dept => {
                              const isChecked = (editingGrade.selectedDepts || []).includes(dept.id);
                              return (
                                <label key={dept.id} className={`gm-dept-checkbox-label ${isChecked ? 'checked' : ''}`}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => {
                                      const cur = editingGrade.selectedDepts || [];
                                      setEditingGrade(prev => ({
                                        ...prev,
                                        selectedDepts: e.target.checked
                                          ? [...cur, dept.id]
                                          : cur.filter(id => id !== dept.id)
                                      }));
                                    }}
                                    style={{ accentColor: '#FF8C42' }}
                                  />
                                  {dept.name}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="gm-modal-footer">
                        <button type="button" className="gm-btn-cancel" onClick={() => setEditingGrade(null)}>Cancel</button>
                        <button type="submit" className="gm-btn-solid" style={{ padding: '9px 22px' }}>Save Changes</button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              VIEW 2 — ADD GRADE
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'add-grade' && (
            <div style={{ maxWidth: '520px', margin: '0 auto' }}>
              <div className="gm-form-panel">
                <div>
                  <h3 className="gm-form-title"><span style={{ color: '#FF8C42' }}>Create</span> New Grade / Class</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Register a new grade level for your school
                  </p>
                </div>

                <div className="gm-divider" />

                <form onSubmit={handleCreateGrade} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="gm-form-group">
                    <label className="gm-label">Grade Name / Class</label>
                    <input
                      type="text"
                      name="gradeName"
                      data-type="grade-name"
                      placeholder="e.g. XI, XII, Grade 5, LKG"
                      className="gm-input grade-name-input"
                      value={newGrade.name}
                      onChange={e => setNewGrade({ ...newGrade, name: e.target.value })}
                      required
                    />
                    <span className="gm-input-hint">
                      Use standard roman numerals (XI / XII) to reveal department mapping options.
                    </span>
                  </div>

                  {showDeptsSelector(newGrade.name) && (
                    <div className="gm-form-group">
                      <label className="gm-label">Select Departments</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {departments.map(dept => {
                          const isChecked = newGrade.selectedDepts.includes(dept.id);
                          return (
                            <label key={dept.id} className={`gm-dept-checkbox-label ${isChecked ? 'checked' : ''}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  if (e.target.checked) setNewGrade(prev => ({ ...prev, selectedDepts: [...prev.selectedDepts, dept.id] }));
                                  else setNewGrade(prev => ({ ...prev, selectedDepts: prev.selectedDepts.filter(id => id !== dept.id) }));
                                }}
                                style={{ accentColor: '#FF8C42' }}
                              />
                              {dept.name}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button type="submit" className="gm-btn-solid" style={{ padding: '12px', marginTop: '4px' }}>
                    <Save size={16} /> Register Grade
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              VIEW 3 — DEPARTMENTS
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'grade-departments' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

              {/* Add Department Form */}
              <div className="gm-form-panel">
                <div>
                  <h3 className="gm-form-title"><span style={{ color: '#FF8C42' }}>Add</span> Department</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Create a new academic department for Grades XI & XII
                  </p>
                </div>
                <div className="gm-divider" />
                <form onSubmit={handleCreateDept} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="gm-form-group">
                    <label className="gm-label">Department Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Arts, Science Biology"
                      className="gm-input"
                      value={newDept.name}
                      onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="gm-btn-solid" style={{ padding: '11px' }}>
                    <Plus size={15} /> Register Department
                  </button>
                </form>
              </div>

              {/* Departments List */}
              <div className="gm-form-panel">
                <div>
                  <h3 className="gm-form-title"><span style={{ color: '#FF8C42' }}>Departments</span> Registry</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {departments.length} department{departments.length !== 1 ? 's' : ''} registered
                  </p>
                </div>
                <div className="gm-divider" />
                {departments.length > 0 ? (
                  <div className="gm-table-wrapper">
                    <table className="gm-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Department Name</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map((d, idx) => (
                          <tr key={d.id}>
                            <td style={{ color: 'var(--text-muted)', width: '36px' }}>{idx + 1}</td>
                            <td style={{ fontWeight: 600 }}>{d.name}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  className="gm-btn-outline"
                                  style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                                  onClick={() => setEditingDept({ ...d })}
                                >
                                  <Edit3 size={12} /> Edit
                                </button>
                                <button
                                  type="button"
                                  className="gm-icon-btn danger"
                                  onClick={() => handleDeleteDept(d.id, d.name)}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="gm-empty">
                    <div className="gm-empty-icon"><Users size={22} /></div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No departments yet</div>
                    <div style={{ fontSize: '0.8rem' }}>Add your first department using the form.</div>
                  </div>
                )}
              </div>

              {/* Edit Department Modal */}
              {editingDept && (
                <div className="gm-modal-overlay">
                  <form onSubmit={handleUpdateDept} className="gm-modal-box" style={{ maxWidth: '420px' }}>
                    <div className="gm-modal-header">
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                          <span style={{ color: '#FF8C42' }}>Edit</span> Department
                        </h3>
                      </div>
                      <button type="button" className="gm-modal-close" onClick={() => setEditingDept(null)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="gm-modal-body">
                      <div className="gm-form-group">
                        <label className="gm-label">Department Name</label>
                        <input
                          type="text"
                          className="gm-input"
                          value={editingDept.name}
                          onChange={e => setEditingDept({ ...editingDept, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="gm-modal-footer">
                        <button type="button" className="gm-btn-cancel" onClick={() => setEditingDept(null)}>Cancel</button>
                        <button type="submit" className="gm-btn-solid" style={{ padding: '9px 22px' }}>Save Changes</button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MODAL — MANAGE SECTIONS
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {sectionModalGrade && (
        <div className="gm-modal-overlay">
          <div className="gm-modal-box" style={{ maxWidth: '480px' }}>
            <div className="gm-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  <span style={{ color: '#FF8C42' }}>Manage</span> Sections
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Grade <strong>{sectionModalGrade.displayName}</strong>
                </p>
              </div>
              <button type="button" className="gm-modal-close" onClick={() => setSectionModalGrade(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="gm-modal-body">

              <div className="gm-form-group">
                <label className="gm-label">Assigned Sections</label>
                <div className="gm-chips-area">
                  {selectedModalSections.length > 0 ? selectedModalSections.map(secName => (
                    <span key={secName} className="gm-chip" style={{ background: 'rgba(255,107,0,0.07)', border: '1px solid rgba(255,107,0,0.18)', color: '#FF8C42', padding: '6px 12px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Section {secName}
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#ef4444', opacity: 0.8, transition: 'opacity 0.15s' }}
                        onClick={() => setSelectedModalSections(prev => prev.filter(n => n !== secName))}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontStyle: 'italic' }}>No sections assigned yet</span>
                  )}
                </div>
              </div>

              <div className="gm-divider" />

              <div className="gm-form-group">
                <label className="gm-label">Create &amp; Assign New Section</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="gm-input"
                    placeholder="e.g. D, Gold, Lily"
                    value={newGlobalSectionName}
                    onChange={e => setNewGlobalSectionName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="gm-btn-outline" style={{ whiteSpace: 'nowrap' }} onClick={handleCreateAndAssignSection}>
                    <Plus size={14} /> Create
                  </button>
                </div>
              </div>

              <div className="gm-modal-footer">
                <button type="button" className="gm-btn-cancel" onClick={() => setSectionModalGrade(null)}>Cancel</button>
                <button
                  type="button"
                  className="gm-btn-solid"
                  style={{ padding: '9px 22px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleSaveModalSections}
                  disabled={savingSections}
                >
                  {savingSections && <Loader2 className="animate-spin" size={14} />} Save Changes
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MODAL — MANAGE SUBJECTS
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {subjectModalGrade && (
        <div className="gm-modal-overlay">
          <div className="gm-modal-box" style={{ maxWidth: '580px' }}>
            <div className="gm-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  <span style={{ color: '#FF8C42' }}>Manage</span> Subjects
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Grade <strong>{subjectModalGrade.displayName}</strong>
                </p>
              </div>
              <button type="button" className="gm-modal-close" onClick={() => setSubjectModalGrade(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="gm-modal-body">

              <div className="gm-form-group">
                <label className="gm-label">Registered Subjects ({subjects.filter(sub => sub.grade?.toUpperCase() === subjectModalGrade.displayName?.toUpperCase()).length})</label>
                <div className="gm-chips-area">
                  {subjects.filter(sub => sub.grade?.toUpperCase() === subjectModalGrade.displayName?.toUpperCase()).length > 0 ? (
                    subjects.filter(sub => sub.grade?.toUpperCase() === subjectModalGrade.displayName?.toUpperCase()).map(sub => (
                      <span key={sub.id} className="gm-chip gm-chip-subject" style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.84rem' }}>
                        {sub.subjectName}
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#ef4444', opacity: 0.8, transition: 'opacity 0.15s' }}
                          onClick={() => handleDeleteModalSubject(sub.id, sub.subjectName)}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontStyle: 'italic' }}>No subjects registered for this grade yet</span>
                  )}
                </div>
              </div>

              <div className="gm-divider" />

              <form onSubmit={handleAddModalSubject} className="gm-form-group">
                <label className="gm-label">Add Single Subject</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="gm-input"
                    placeholder="e.g. Chemistry, History, English II"
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    disabled={addingSubject}
                    className="gm-btn-solid"
                    style={{ whiteSpace: 'nowrap', padding: '9px 18px' }}
                  >
                    {addingSubject ? <Loader2 className="animate-spin" size={13} /> : <Plus size={14} />} Add
                  </button>
                </div>
              </form>

              <div className="gm-modal-footer">
                <button type="button" className="gm-btn-cancel" onClick={() => setSubjectModalGrade(null)}>Close Panel</button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}


