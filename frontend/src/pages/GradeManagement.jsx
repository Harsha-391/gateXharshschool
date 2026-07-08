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
                      placeholder="Search grade (e.g. 1, 2)..." 
                      className="search-bar-input"
                      value={gradeSearch}
                      onChange={(e) => { setGradeSearch(e.target.value.replace(/[^0-9]/g, '')); setGradePage(1); }}
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

              <div className="glass-panel" style={{ padding: '24px', maxHeight: '720px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {displayGrades.length > 0 ? (
                    displayGrades.map((g) => {
                      const rowKey = g.displayId || g.id;
                      const gradeSections = g.sections || [];
                      const gradeSubjectsList = subjects.filter(sub => sub.grade?.toUpperCase() === g.displayName?.toUpperCase());

                      return (
                        <div key={rowKey} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card-subtle)', position: 'relative', transition: 'transform 0.2s ease, box-shadow 0.2s ease', minHeight: '280px' }}>
                          
                          {/* Checkbox for bulk delete */}
                          <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 5 }}>
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
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                          </div>

                          {/* Grade Header */}
                          <div style={{ paddingLeft: '28px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{g.name}</h4>
                              {g.deptName !== 'None' && (
                                <span style={{ display: 'inline-block', background: 'rgba(99, 102, 241, 0.1)', color: 'rgb(99, 102, 241)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px' }}>
                                  {g.deptName}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button type="button" onClick={() => {
                                const mappedDepts = mappings.filter(m => m.gradeId === g.id).map(m => m.departmentId);
                                setEditingGrade({
                                  ...g,
                                  selectedDepts: mappedDepts
                                });
                              }} className="btn-secondary" style={{ padding: '6px', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '8px' }} title="Edit Grade Name">
                                <Edit3 size={14} />
                              </button>
                              <button type="button" onClick={() => handleDeleteGrade(g)} className="btn-danger" style={{ padding: '6px', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none' }} title="Delete Grade">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Card Sections List */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                                <Users size={14} /> Sections ({gradeSections.length})
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {gradeSections.length > 0 ? (
                                  gradeSections.map((secName, idx) => (
                                    <span 
                                      key={idx} 
                                      style={{ 
                                        background: 'var(--bg-form)', 
                                        border: '1px solid var(--border-glass)', 
                                        padding: '4px 8px 4px 10px', 
                                        borderRadius: '8px', 
                                        fontSize: '0.8rem', 
                                        fontWeight: 600, 
                                        color: 'var(--text-main)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}
                                    >
                                      {secName}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveSectionDirectly(g, secName);
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: 0,
                                          margin: 0,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          color: 'var(--text-muted)',
                                          transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                        title={`Remove Section ${secName}`}
                                      >
                                        <X size={10} />
                                      </button>
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No sections assigned</span>
                                )}
                              </div>
                            </div>
 
                            {/* Card Subjects List */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                                <BookOpen size={14} /> Subjects ({gradeSubjectsList.length})
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {gradeSubjectsList.length > 0 ? (
                                  gradeSubjectsList.map((sub, idx) => (
                                    <span 
                                      key={idx} 
                                      style={{ 
                                        background: 'rgba(16, 185, 129, 0.08)', 
                                        border: '1px solid rgba(16, 185, 129, 0.15)', 
                                        color: '#10b981', 
                                        padding: '4px 8px 4px 10px', 
                                        borderRadius: '8px', 
                                        fontSize: '0.8rem', 
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}
                                    >
                                      {sub.subjectName}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteModalSubject(sub.id, sub.subjectName);
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: 0,
                                          margin: 0,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          color: '#10b981',
                                          opacity: 0.6,
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.opacity = 1; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = '#10b981'; e.currentTarget.style.opacity = 0.6; }}
                                        title={`Delete Subject ${sub.subjectName}`}
                                      >
                                        <X size={10} />
                                      </button>
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No subjects registered</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Card Options / Actions Footer */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                            <button 
                              type="button" 
                              onClick={() => setSectionModalGrade(g)}
                              className="btn-secondary" 
                              style={{ padding: '10px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', borderRadius: '10px' }}
                            >
                              <Plus size={14} /> Add Section
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setSubjectModalGrade(g)}
                              className="btn-primary" 
                              style={{ padding: '10px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', borderRadius: '10px', background: 'rgb(99, 102, 241)', color: 'white', border: 'none' }}
                            >
                              <BookOpen size={14} /> Grade Subjects
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                      No grades found.
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Grade Modal */}
              {editingGrade && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <form onSubmit={handleUpdateGrade} className="glass-panel" style={{ padding: '24px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-elevated)', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
                    <button type="button" onClick={() => setEditingGrade(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} title="Close Form">
                      <X size={20} />
                    </button>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Edit Grade</h3>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Grade Name</label>
                      <input 
                        type="text" 
                        name="gradeName"
                        data-type="grade-name"
                        className="form-control grade-name-input" 
                        value={editingGrade.name} 
                        onChange={(e) => setEditingGrade({ ...editingGrade, name: e.target.value })}
                        required
                      />
                    </div>

                    {showDeptsSelector(editingGrade.name) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>Select Departments</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {departments.map(dept => {
                            const isChecked = (editingGrade.selectedDepts || []).includes(dept.id);
                            return (
                              <label key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--bg-form)', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentSelected = editingGrade.selectedDepts || [];
                                    if (e.target.checked) {
                                      setEditingGrade(prev => ({
                                        ...prev,
                                        selectedDepts: [...currentSelected, dept.id]
                                      }));
                                    } else {
                                      setEditingGrade(prev => ({
                                        ...prev,
                                        selectedDepts: currentSelected.filter(id => id !== dept.id)
                                      }));
                                    }
                                  }}
                                />
                                {dept.name}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
                    name="gradeName"
                    data-type="grade-name"
                    placeholder="e.g. XI, XII, Grade 5, LKG"
                    className="form-control grade-name-input"
                    value={newGrade.name}
                    onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Type standard roman class numbers (XI/XII) to display special department mapping selectors.
                  </small>
                </div>

                {showDeptsSelector(newGrade.name) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Select Departments</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {departments.map(dept => {
                        const isChecked = newGrade.selectedDepts.includes(dept.id);
                        return (
                          <label key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-form)', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewGrade(prev => ({
                                    ...prev,
                                    selectedDepts: [...prev.selectedDepts, dept.id]
                                  }));
                                } else {
                                  setNewGrade(prev => ({
                                    ...prev,
                                    selectedDepts: prev.selectedDepts.filter(id => id !== dept.id)
                                  }));
                                }
                              }}
                            />
                            {dept.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}


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
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <form onSubmit={handleUpdateDept} className="glass-panel" style={{ padding: '24px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-elevated)', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
                    <button type="button" onClick={() => setEditingDept(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} title="Close Form">
                      <X size={20} />
                    </button>
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



        </div>
      )}

      {/* Add Section Modal */}
      {sectionModalGrade && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', width: '90%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-elevated)', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button type="button" onClick={() => setSectionModalGrade(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} title="Close Form">
              <X size={20} />
            </button>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Manage Sections for {sectionModalGrade.displayName}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Assigned Sections</label>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'var(--bg-form)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)', minHeight: '60px' }}>
                {selectedModalSections.length > 0 ? (
                  selectedModalSections.map(secName => (
                    <span 
                      key={secName} 
                      style={{ 
                        background: 'rgba(99, 102, 241, 0.08)', 
                        border: '1px solid rgba(99, 102, 241, 0.2)', 
                        color: 'rgb(99, 102, 241)', 
                        padding: '6px 12px', 
                        borderRadius: '10px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Section {secName}
                      <button 
                        type="button" 
                        onClick={() => setSelectedModalSections(prev => prev.filter(name => name !== secName))}
                        style={{ background: 'none', border: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#ef4444' }}
                        title="Remove Section Assignment"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No sections assigned to this grade yet.</span>
                )}
              </div>
            </div>

            {/* Quick-create global section */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px', marginTop: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Create & Assign New Section</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. D, Gold, Lily"
                  value={newGlobalSectionName}
                  onChange={(e) => setNewGlobalSectionName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  onClick={handleCreateAndAssignSection}
                  className="btn-secondary" 
                  style={{ padding: '0 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', borderRadius: '10px' }}
                >
                  Create
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
              <button type="button" onClick={() => setSectionModalGrade(null)} className="btn-secondary" style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px' }}>Cancel</button>
              <button 
                type="button" 
                onClick={handleSaveModalSections} 
                disabled={savingSections}
                className="btn-primary" 
                style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', background: 'rgb(99, 102, 241)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {savingSections && <Loader2 className="animate-spin" size={14} />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Subjects Modal */}
      {subjectModalGrade && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', width: '95%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-elevated)', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button type="button" onClick={() => setSubjectModalGrade(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} title="Close Form">
              <X size={20} />
            </button>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Manage Subjects for {subjectModalGrade.displayName}</h3>
            
            {/* Display subjects lists */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Registered Subjects</label>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'var(--bg-form)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)', minHeight: '60px' }}>
                {subjects.filter(sub => sub.grade?.toUpperCase() === subjectModalGrade.displayName?.toUpperCase()).length > 0 ? (
                  subjects.filter(sub => sub.grade?.toUpperCase() === subjectModalGrade.displayName?.toUpperCase()).map(sub => (
                    <span 
                      key={sub.id} 
                      style={{ 
                        background: 'rgba(16, 185, 129, 0.08)', 
                        border: '1px solid rgba(16, 185, 129, 0.2)', 
                        color: '#10b981', 
                        padding: '6px 12px', 
                        borderRadius: '10px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {sub.subjectName}
                      <button 
                        type="button" 
                        onClick={() => handleDeleteModalSubject(sub.id, sub.subjectName)}
                        style={{ background: 'none', border: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#ef4444' }}
                        title="Delete Subject"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No academic subjects registered for this grade yet.</span>
                )}
              </div>
            </div>

            {/* Forms to add new subjects */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              
              {/* Single subject form */}
              <form onSubmit={handleAddModalSubject} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Add Single Subject</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Chemistry, History, English II"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    required
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="submit" 
                    disabled={addingSubject}
                    className="btn-primary" 
                    style={{ padding: '0 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', borderRadius: '10px', background: 'rgb(99, 102, 241)', color: 'white', border: 'none' }}
                  >
                    Add
                  </button>
                </div>
              </form>
             </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
              <button type="button" onClick={() => setSubjectModalGrade(null)} className="btn-secondary" style={{ padding: '8px 20px', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}>Close Panel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
