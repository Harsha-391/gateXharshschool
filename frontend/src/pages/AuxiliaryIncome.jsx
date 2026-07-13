import './AuxiliaryIncome.css';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Banknote,
  Tags,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Printer,
  Download,
  Loader2,
  X,
  CheckCircle,
  TrendingUp,
  Calendar,
  CreditCard,
  AlertCircle,
  ChevronRight,
  Info,
  DollarSign
} from 'lucide-react';

export default function AuxiliaryIncome({ showToast }) {
  // Tabs: 'entries' | 'categories'
  const [activeTab, setActiveTab] = useState('entries');
  
  // Data states
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Modal states
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  // Form states
  const [entryForm, setEntryForm] = useState({
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    receivedFrom: '',
    paymentMethod: 'Cash',
    referenceNumber: '',
    description: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  // History tab states
  const [historyPeriodMode, setHistoryPeriodMode] = useState('month'); // 'date' | 'month' | 'year'
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().substring(0, 7)); // "YYYY-MM"
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear().toString());
  const [historyCategory, setHistoryCategory] = useState('All');

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

  const getHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem('token');
    const tenant = getTenantHeader();
    return {
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': tenant,
      ...extraHeaders
    };
  };

  // Fetch categories and entries
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/finance/auxiliary/categories', {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to load categories');
      const data = await res.json();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
      setError('Database Connection Offline: Auxiliary Income requires an active database connection.');
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const url = '/api/finance/auxiliary/entries';
      const res = await fetch(url, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to load entries');
      const data = await res.json();
      setEntries(data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Database Connection Offline: Auxiliary Income requires an active database connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchCategories(), fetchEntries()]);
  }, []);

  // Toast helper
  const triggerToast = (msg, type = 'success') => {
    if (showToast) {
      showToast(msg, type);
    } else {
      alert(`${type.toUpperCase()}: ${msg}`);
    }
  };

  // CRUD actions for Categories
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      triggerToast('Category name is required.', 'error');
      return;
    }

    try {
      const isEdit = !!selectedCategory;
      const url = isEdit 
        ? `/api/finance/auxiliary/categories/${selectedCategory.id}` 
        : '/api/finance/auxiliary/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(categoryForm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save category');
      }

      triggerToast(`Category ${isEdit ? 'updated' : 'created'} successfully!`);
      setShowCategoryModal(false);
      setCategoryForm({ name: '', description: '' });
      setSelectedCategory(null);
      fetchCategories();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category? All entries in this category will also be deleted!')) {
      return;
    }

    try {
      const res = await fetch(`/api/finance/auxiliary/categories/${catId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete category');
      triggerToast('Category removed successfully.');
      fetchCategories();
      fetchEntries();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const handleEditCategory = (cat) => {
    setSelectedCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description || ''
    });
    setShowCategoryModal(true);
  };

  // CRUD actions for entries
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    const { categoryId, amount, date } = entryForm;
    if (!categoryId || !amount || !date) {
      triggerToast('Category, Amount, and Date are required.', 'error');
      return;
    }

    try {
      const isEdit = !!selectedEntry;
      const url = isEdit 
        ? `/api/finance/auxiliary/entries/${selectedEntry.id}` 
        : '/api/finance/auxiliary/entries';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(entryForm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save entry');
      }

      triggerToast(`Auxiliary income entry ${isEdit ? 'updated' : 'recorded'} successfully!`);
      setShowEntryModal(false);
      setEntryForm({
        categoryId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        receivedFrom: '',
        paymentMethod: 'Cash',
        referenceNumber: '',
        description: ''
      });
      setSelectedEntry(null);
      fetchEntries();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this income entry?')) {
      return;
    }

    try {
      const res = await fetch(`/api/finance/auxiliary/entries/${entryId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete entry');
      triggerToast('Entry deleted successfully.');
      fetchEntries();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    setEntryForm({
      categoryId: entry.categoryId,
      amount: String(entry.amount),
      date: entry.date,
      receivedFrom: entry.receivedFrom || '',
      paymentMethod: entry.paymentMethod || 'Cash',
      referenceNumber: entry.referenceNumber || '',
      description: entry.description || ''
    });
    setShowEntryModal(true);
  };

  // Calculations for dashboard summary cards
  const totalCollected = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const categoriesCount = categories.length;

  // History tab filtering
  const filteredHistoryEntries = entries.filter(entry => {
    // 1. Filter by category
    if (historyCategory !== 'All' && String(entry.categoryId) !== String(historyCategory)) {
      return false;
    }
    
    // 2. Filter by date/month/year based on historyPeriodMode
    if (historyPeriodMode === 'date') {
      return entry.date === historyDate;
    } else if (historyPeriodMode === 'month') {
      return entry.date.substring(0, 7) === historyMonth;
    } else if (historyPeriodMode === 'year') {
      return entry.date.substring(0, 4) === historyYear;
    }
    
    return true;
  });

  const historyTotalCollected = filteredHistoryEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Category', 'Received From', 'Amount (INR)', 'Date', 'Payment Mode', 'Reference', 'Description'];
    const rows = filteredHistoryEntries.map(e => [
      e.receiptNumber,
      e.categoryName,
      e.receivedFrom || 'N/A',
      e.amount,
      e.date,
      e.paymentMethod,
      e.referenceNumber || '-',
      (e.description || '').replace(/"/g, '""')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `auxiliary_income_history_${historyPeriodMode}_${historyPeriodMode === 'date' ? historyDate : historyPeriodMode === 'month' ? historyMonth : historyYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(entry => {
    // 1. Filter by category
    if (filterCategory !== 'All' && String(entry.categoryId) !== String(filterCategory)) {
      return false;
    }
    // 2. Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchSearch = 
        (entry.receiptNumber || '').toLowerCase().includes(query) ||
        (entry.receivedFrom || '').toLowerCase().includes(query) ||
        (entry.description || '').toLowerCase().includes(query) ||
        (entry.categoryName || '').toLowerCase().includes(query);
      if (!matchSearch) return false;
    }
    // 3. Filter by today's date
    return entry.date === todayStr;
  });

  const printedEntries = activeTab === 'history' ? filteredHistoryEntries : todayEntries;
  const printedTotal = printedEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  
  // Group by category for visual analytics bars
  const categorySummary = {};
  entries.forEach(e => {
    const name = e.categoryName || 'Uncategorized';
    categorySummary[name] = (categorySummary[name] || 0) + Number(e.amount || 0);
  });

  const methodSummary = {
    Cash: 0,
    UPI: 0,
    'Bank Transfer': 0,
    Cheque: 0,
    Card: 0,
    Other: 0
  };
  entries.forEach(e => {
    const method = e.paymentMethod || 'Cash';
    if (methodSummary[method] !== undefined) {
      methodSummary[method] += Number(e.amount || 0);
    } else {
      methodSummary.Other += Number(e.amount || 0);
    }
  });

  // Styles
  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  
  const labelStyle = { 
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', 
    textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' 
  };
  
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', padding: '10px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
            Auxiliary & Other Income
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Manage and track supplemental school revenue sources. Fully database-driven.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => {
              setSelectedCategory(null);
              setCategoryForm({ name: '', description: '' });
              setShowCategoryModal(true);
            }} 
            style={{
              padding: '10px 16px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-glass)',
              borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border-subtle)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card-subtle)'}
          >
            <Tags size={16} /> Manage Categories
          </button>
          
          <button 
            onClick={() => {
              if (categories.length === 0) {
                triggerToast('Please create at least one income category first. Opening Category Creator...', 'warning');
                setSelectedCategory(null);
                setCategoryForm({ name: '', description: '' });
                setShowCategoryModal(true);
                return;
              }
              setSelectedEntry(null);
              setEntryForm({
                categoryId: categories[0]?.id || '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                receivedFrom: '',
                paymentMethod: 'Cash',
                referenceNumber: '',
                description: ''
              });
              setShowEntryModal(true);
            }} 
            style={{
              padding: '10px 18px', background: 'linear-gradient(135deg, #FF8C42, #E05300)', border: 'none',
              borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', boxShadow: '0 4px 12px rgba(255, 140, 66, 0.2)'
            }}
          >
            <Plus size={16} /> Record Income Entry
          </button>
        </div>
      </div>

      {/* Database Offline Error Banner */}
      {error && (
        <div style={{
          padding: '16px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1.5px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', color: '#ef4444'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* KPI: Total Auxiliary Revenue */}
        <div className="glass-panel" style={{ padding: '24px 28px', borderRadius: '16px', borderLeft: '4px solid #FF8C42' }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Total Collected Revenue</p>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#FF8C42' }}>₹</span>{totalCollected.toLocaleString()}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>All time custom auxiliary collections</span>
        </div>

        {/* KPI: Category Count */}
        <div className="glass-panel" style={{ padding: '24px 28px', borderRadius: '16px', borderLeft: '4px solid #FF8C42' }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Configured Categories</p>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {categoriesCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>active types</span>
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>School-specific configuration</span>
        </div>

        {/* KPI: Average Entry Size */}
        <div className="glass-panel" style={{ padding: '24px 28px', borderRadius: '16px', borderLeft: '4px solid #8b5cf6' }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Average Collection</p>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            ₹{entries.length > 0 ? Math.round(totalCollected / entries.length).toLocaleString() : '0'}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Per transaction average size</span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', gap: '20px' }}>
        <button
          onClick={() => setActiveTab('entries')}
          style={{
            padding: '12px 6px', background: 'none', border: 'none',
            borderBottom: activeTab === 'entries' ? '3px solid #FF8C42' : '3px solid transparent',
            color: activeTab === 'entries' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s'
          }}
        >
          Income Entries List
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '12px 6px', background: 'none', border: 'none',
            borderBottom: activeTab === 'categories' ? '3px solid #FF8C42' : '3px solid transparent',
            color: activeTab === 'categories' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s'
          }}
        >
          Categories Manager
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 6px', background: 'none', border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid #FF8C42' : '3px solid transparent',
            color: activeTab === 'history' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s'
          }}
        >
          History
        </button>
      </div>

      {/* TAB CONTENT: ENTRIES */}
      {activeTab === 'entries' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Analytics Bars and Grid Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Category Breakdown list */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} style={{ color: '#FF8C42' }} /> Category Collections Share
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.keys(categorySummary).length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No data matching the filters</div>
                ) : (
                  Object.entries(categorySummary).map(([name, val]) => {
                    const percent = totalCollected > 0 ? Math.round((val / totalCollected) * 100) : 0;
                    return (
                      <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{name}</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>₹{val.toLocaleString()} ({percent}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: '#FF8C42', borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Payment Method share */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={16} style={{ color: '#8b5cf6' }} /> Payment Mode Breakdown
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {totalCollected === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No payments collected yet</div>
                ) : (
                  Object.entries(methodSummary).map(([method, val]) => {
                    const percent = totalCollected > 0 ? Math.round((val / totalCollected) * 100) : 0;
                    if (val === 0) return null;
                    return (
                      <div key={method} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{method}</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>₹{val.toLocaleString()} ({percent}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: '#8b5cf6', borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              
              <div>
                <label style={labelStyle}>Search Query</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="Search source, desc, receipt..." 
                    style={{ ...inputStyle, paddingLeft: '36px' }} 
                  />
                </div>
              </div>
              
              <div>
                <label style={labelStyle}>Category</label>
                <select 
                  value={filterCategory} 
                  onChange={e => setFilterCategory(e.target.value)} 
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="All" style={optionStyle}>All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} style={optionStyle}>{c.name}</option>
                  ))}
                </select>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => window.print()} 
                style={{
                  padding: '8px 18px', background: 'linear-gradient(135deg, #FF8C42, #E05300)', border: 'none',
                  borderRadius: '8px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Printer size={14} /> Print Ledger
              </button>
            </div>
          </div>

          {/* Entries Data Table */}
          <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                    {['Receipt No', 'Category', 'Received From', 'Amount', 'Date', 'Pay Mode', 'Reference', 'Actions'].map(h => (
                      <th key={h} style={{ 
                        padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, 
                        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', 
                        borderBottom: '1px solid rgba(255,255,255,0.04)' 
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                          <Loader2 className="animate-spin" size={18} /> Loading entries...
                        </div>
                      </td>
                    </tr>
                  ) : todayEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No auxiliary income records found for today. Record an entry above to start tracking supplemental revenue.
                      </td>
                    </tr>
                  ) : (
                    todayEntries.map((entry, idx) => (
                      <tr 
                        key={entry.id} 
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#FF8C42' }}>
                          {entry.receiptNumber}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {entry.categoryName}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                          {entry.receivedFrom || 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          ₹{Number(entry.amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {entry.date}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700,
                            background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6'
                          }}>{entry.paymentMethod}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {entry.referenceNumber || '-'}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CATEGORIES */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                    {['Category Name', 'Description', 'Created Date', 'Actions'].map(h => (
                      <th key={h} style={{ 
                        padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, 
                        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', 
                        borderBottom: '1px solid rgba(255,255,255,0.04)' 
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No categories found. Create a custom category to get started.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr 
                        key={cat.id} 
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {cat.name}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {cat.description || 'No description provided.'}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              onClick={() => handleEditCategory(cat)}
                              style={{
                                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                                cursor: 'pointer', transition: 'color 0.2s', padding: '4px'
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = '#FF8C42'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              <Edit3 size={15} />
                            </button>

                            <button 
                              onClick={() => handleDeleteCategory(cat.id)}
                              style={{
                                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                                cursor: 'pointer', transition: 'color 0.2s', padding: '4px'
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: HISTORY */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Filter Stats Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', borderLeft: '3px solid #FF8C42' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filtered Total Collected</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                ₹{historyTotalCollected.toLocaleString()}
              </h4>
            </div>
            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', borderLeft: '3px solid #FF8C42' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Transactions Count</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                {filteredHistoryEntries.length} records
              </h4>
            </div>
          </div>

          {/* History Filters Toolbar */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              
              {/* Period Mode Option Selector */}
              <div>
                <label style={labelStyle}>History Period Filter</label>
                <select
                  value={historyPeriodMode}
                  onChange={e => setHistoryPeriodMode(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="date" style={optionStyle}>Date</option>
                  <option value="month" style={optionStyle}>Month</option>
                  <option value="year" style={optionStyle}>Year</option>
                </select>
              </div>

              {/* Dynamic Period Picker */}
              <div>
                <label style={labelStyle}>
                  {historyPeriodMode === 'date' ? 'Select Date' : historyPeriodMode === 'month' ? 'Select Month' : 'Select Year'}
                </label>
                {historyPeriodMode === 'date' && (
                  <input
                    type="date"
                    value={historyDate}
                    onChange={e => setHistoryDate(e.target.value)}
                    style={inputStyle}
                  />
                )}
                {historyPeriodMode === 'month' && (
                  <input
                    type="month"
                    value={historyMonth}
                    onChange={e => setHistoryMonth(e.target.value)}
                    style={inputStyle}
                  />
                )}
                {historyPeriodMode === 'year' && (
                  <select
                    value={historyYear}
                    onChange={e => setHistoryYear(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {Array.from({ length: 11 }, (_, i) => String(new Date().getFullYear() - 5 + i)).map(y => (
                      <option key={y} value={y} style={optionStyle}>{y}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Category selector */}
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={historyCategory}
                  onChange={e => setHistoryCategory(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="All" style={optionStyle}>All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} style={optionStyle}>{c.name}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* History Actions Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={handleExportCSV}
                style={{
                  padding: '8px 18px', background: 'var(--text-main)', border: 'none',
                  borderRadius: '8px', color: 'var(--bg-elevated)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Download size={14} /> Export CSV
              </button>

              <button
                onClick={() => window.print()}
                style={{
                  padding: '8px 18px', background: 'linear-gradient(135deg, #FF8C42, #E05300)', border: 'none',
                  borderRadius: '8px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Printer size={14} /> Print History Ledger
              </button>
            </div>
          </div>

          {/* History Entries Table */}
          <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                    {['Receipt No', 'Category', 'Received From', 'Amount', 'Date', 'Pay Mode', 'Reference'].map(h => (
                      <th key={h} style={{ 
                        padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, 
                        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', 
                        borderBottom: '1px solid rgba(255,255,255,0.04)' 
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHistoryEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No auxiliary income records found matching the selected history period or category.
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryEntries.map((entry) => (
                      <tr 
                        key={entry.id} 
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#FF8C42' }}>
                          {entry.receiptNumber}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {entry.categoryName}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                          {entry.receivedFrom || 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          ₹{Number(entry.amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {entry.date}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700,
                            background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6'
                          }}>{entry.paymentMethod}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {entry.referenceNumber || '-'}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL MODAL: RECORD/EDIT ENTRY */}
      {showEntryModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowEntryModal(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
            width: '100%', maxWidth: '580px', background: 'var(--bg-elevated)', borderRadius: '20px',
            border: '1px solid var(--border-glass)', padding: '#c0c0c0' in window ? '24px' : '32px', boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <form onSubmit={handleSaveEntry} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Banknote size={18} style={{ color: '#FF8C42' }} /> {selectedEntry ? 'Edit Entry Details' : 'Record Income Entry'}
                </h3>
                <button 
                  type="button" 
                  onClick={() => setShowEntryModal(false)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={entryForm.categoryId}
                    onChange={e => setEntryForm({ ...entryForm, categoryId: e.target.value })}
                    required
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id} style={optionStyle}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Amount (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    value={entryForm.amount}
                    onChange={e => setEntryForm({ ...entryForm, amount: e.target.value })}
                    required
                    placeholder="Enter collected amount"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Transaction Date</label>
                  <input 
                    type="date"
                    value={entryForm.date}
                    onChange={e => setEntryForm({ ...entryForm, date: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Received From</label>
                  <input 
                    type="text"
                    value={entryForm.receivedFrom}
                    onChange={e => setEntryForm({ ...entryForm, receivedFrom: e.target.value })}
                    placeholder="e.g. Sponsor name, Canteen manager"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <select
                    value={entryForm.paymentMethod}
                    onChange={e => setEntryForm({ ...entryForm, paymentMethod: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'].map(m => (
                      <option key={m} value={m} style={optionStyle}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Ref Number / Txn ID</label>
                  <input 
                    type="text"
                    value={entryForm.referenceNumber}
                    onChange={e => setEntryForm({ ...entryForm, referenceNumber: e.target.value })}
                    placeholder="e.g. UPI ID, Cheque No"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description / Notes</label>
                <textarea 
                  value={entryForm.description}
                  onChange={e => setEntryForm({ ...entryForm, description: e.target.value })}
                  placeholder="Record specific transaction remarks here..."
                  style={{ ...inputStyle, height: '80px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" style={{
                  padding: '12px 24px', background: 'linear-gradient(135deg, #FF8C42, #E05300)', border: 'none',
                  borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem'
                }}>
                  <CheckCircle size={16} /> Save Record
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEntryModal(false)} 
                  style={{
                    padding: '12px 24px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                    borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* PORTAL MODAL: SAVE/EDIT CATEGORY */}
      {showCategoryModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
            width: '100%', maxWidth: '440px', background: 'var(--bg-elevated)', borderRadius: '20px',
            border: '1px solid var(--border-glass)', padding: '32px', boxShadow: 'var(--shadow-lg)'
          }}>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Tags size={18} style={{ color: '#FF8C42' }} /> {selectedCategory ? 'Edit Category' : 'Create Custom Category'}
                </h3>
                <button 
                  type="button" 
                  onClick={() => setShowCategoryModal(false)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <label style={labelStyle}>Category Name</label>
                <input 
                  type="text"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Canteen Income, Canteen Sales"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea 
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Write a short summary about what this category covers..."
                  style={{ ...inputStyle, height: '100px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" style={{
                  padding: '12px 24px', background: 'linear-gradient(135deg, #FF8C42, #E05300)', border: 'none',
                  borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem'
                }}>
                  <CheckCircle size={16} /> Save Category
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCategoryModal(false)} 
                  style={{
                    padding: '12px 24px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                    borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* PORTAL MODAL: RECEIPT VIEWER & PRINTER */}
      {receiptData && createPortal(
        <div className="modal-overlay" onClick={() => setReceiptData(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '16px',
            padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', color: '#1a1a1a',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            {/* Printable Receipt Frame */}
            <div id="auxiliary-receipt-print" style={{ color: '#111' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#FF8C42' }}>OFFICIAL PAYMENT RECEIPT</h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>Auxiliary & Revenue Ledger</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {[
                  ['Receipt No', receiptData.receiptNumber],
                  ['Date Received', receiptData.date],
                  ['Income Category', receiptData.categoryName],
                  ['Received From', receiptData.receivedFrom || 'N/A'],
                  ['Payment Mode', receiptData.paymentMethod],
                  ['Ref/Txn ID', receiptData.referenceNumber || '-']
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>{k}:</span>
                    <span style={{ color: '#1e293b', fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>TOTAL RECEIVED AMOUNT:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FF8C42' }}>₹{Number(receiptData.amount).toLocaleString()}</span>
                </div>
              </div>

              {receiptData.description && (
                <div style={{ marginBottom: '24px', padding: '10px', background: '#fdfdfd', borderLeft: '3px solid #FF8C42', fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' }}>
                  Remarks: {receiptData.description}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <span>Issued by Accountant</span>
                <span>Authorized Signature</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button 
                onClick={() => window.print()} 
                style={{
                  flex: 1, padding: '10px', background: '#FF8C42', color: '#fff', border: 'none',
                  borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem'
                }}
              >
                <Printer size={15} /> Print Receipt
              </button>
              
              <button 
                onClick={() => setReceiptData(null)} 
                style={{
                  padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                  borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Printable Ledger Area (Hidden on screen, shown in print) */}
      <div id="auxiliary-ledger-print">
        <div style={{ borderBottom: '2px dashed #000', paddingBottom: '16px', marginBottom: '20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0', color: '#000' }}>AUXILIARY & OTHER INCOME LEDGER</h2>
          <p style={{ fontSize: '0.85rem', margin: 0, textTransform: 'uppercase', fontWeight: 600, color: '#000' }}>School Revenue Ledger Statement</p>
          <p style={{ fontSize: '0.75rem', color: '#555', margin: '4px 0 0 0' }}>Printed on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th style={{ color: '#000', fontWeight: 'bold' }}>Receipt No</th>
              <th style={{ color: '#000', fontWeight: 'bold' }}>Category</th>
              <th style={{ color: '#000', fontWeight: 'bold' }}>Received From</th>
              <th style={{ color: '#000', fontWeight: 'bold' }}>Amount</th>
              <th style={{ color: '#000', fontWeight: 'bold' }}>Date</th>
              <th style={{ color: '#000', fontWeight: 'bold' }}>Pay Mode</th>
              <th style={{ color: '#000', fontWeight: 'bold' }}>Reference</th>
              <th style={{ color: '#000', fontWeight: 'bold' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {printedEntries.map(entry => (
              <tr key={entry.id}>
                <td style={{ color: '#000' }}>{entry.receiptNumber}</td>
                <td style={{ color: '#000' }}>{entry.categoryName}</td>
                <td style={{ color: '#000' }}>{entry.receivedFrom || 'N/A'}</td>
                <td style={{ color: '#000', fontWeight: 'bold' }}>₹{Number(entry.amount).toLocaleString()}</td>
                <td style={{ color: '#000' }}>{entry.date}</td>
                <td style={{ color: '#000' }}>{entry.paymentMethod}</td>
                <td style={{ color: '#000' }}>{entry.referenceNumber || '-'}</td>
                <td style={{ color: '#000' }}>{entry.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '30px', borderTop: '2px solid #000', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#000' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>TOTAL LEDGER RECEIPTS COUNT: {printedEntries.length}</span>
          <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>TOTAL AMOUNT COLLECTED: ₹{printedTotal.toLocaleString()}</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        #auxiliary-ledger-print {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #auxiliary-ledger-print, #auxiliary-ledger-print * {
            visibility: visible;
          }
          #auxiliary-ledger-print {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            color: #000 !important;
            background: #fff !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .print-table th, .print-table td {
            border: 1px solid #ddd;
            padding: 8px 10px;
            font-size: 0.8rem;
            text-align: left;
          }
          .print-table th {
            background-color: #f5f5f5 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}} />
    </div>
  );
}

