import './AuxiliaryIncome.css';
import React, { useState, useEffect } from 'react';
import CustomSelect from '../components/CustomSelect';
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
  FileText,
  Eye,
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
  // Tabs: 'dashboard' | 'entries' | 'history'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Helper functions for date formatting in local timezone (YYYY-MM-DD)
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalMonthString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };
  
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
    date: getLocalDateString(),
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
  const [historyDate, setHistoryDate] = useState(getLocalDateString());
  const [historyMonth, setHistoryMonth] = useState(getLocalMonthString()); // "YYYY-MM"
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

      const createdCat = await res.json();
      triggerToast(`Category ${isEdit ? 'updated' : 'created'} successfully!`);
      setShowCategoryModal(false);
      setCategoryForm({ name: '', description: '' });
      setSelectedCategory(null);
      
      // Auto select the new category if in entry modal
      if (!isEdit && createdCat && createdCat.id) {
        setEntryForm(prev => ({
          ...prev,
          categoryId: createdCat.id
        }));
      }
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

  const todayDateStr = getLocalDateString();
  const currentMonthStr = todayDateStr.substring(0, 7);
  const currentYearStr = todayDateStr.substring(0, 4);

  const todayIncome = entries
    .filter(e => e.date === todayDateStr)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const monthIncome = entries
    .filter(e => e.date.substring(0, 7) === currentMonthStr)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const yearIncome = entries
    .filter(e => e.date.substring(0, 4) === currentYearStr)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const daysInCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const avgDailyIncome = Math.round(monthIncome / daysInCurrentMonth);

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

  const handleExportCSV = (entriesToExport, filenamePrefix = 'auxiliary_income') => {
    const headers = ['Receipt No', 'Category', 'Received From', 'Amount (INR)', 'Date', 'Payment Mode', 'Reference', 'Description'];
    const rows = entriesToExport.map(e => [
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
    link.setAttribute('download', `${filenamePrefix}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayStr = getLocalDateString();
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

      {/* Main Tabs and Actions Navigation Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Tab Strip capsule */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '6px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          borderRadius: '14px',
          overflowX: 'auto'
        }}>
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'entries', label: 'Income Entries List' },
            { key: 'history', label: 'History' }
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 18px',
                  borderRadius: '9px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  color: isActive ? '#FF8C42' : 'var(--text-muted)',
                  background: isActive ? 'rgba(255, 140, 66, 0.1)' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px -2px rgba(255,140,66,0.2)' : 'none',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,140,66,0.05)';
                    e.currentTarget.style.color = '#FF8C42';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Manage Categories Action Button */}
        <div>
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
        </div>

      </div>

      {/* TAB CONTENT: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* KPI Summary Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            
            {/* Card 1: Today's Income */}
            <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px', borderLeft: '4px solid #FF8C42', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Today's Income</p>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  <span style={{ color: '#FF8C42', marginRight: '2px' }}>₹</span>{todayIncome.toLocaleString()}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Daily collections</span>
              </div>
              <div style={{ background: 'rgba(255,140,66,0.1)', padding: '12px', borderRadius: '12px', color: '#FF8C42', display: 'flex', alignItems: 'center' }}>
                <Banknote size={22} />
              </div>
            </div>

            {/* Card 2: This Month's Income */}
            <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px', borderLeft: '4px solid #FF8C42', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>This Month's Income</p>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  <span style={{ color: '#FF8C42', marginRight: '2px' }}>₹</span>{monthIncome.toLocaleString()}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Monthly collections</span>
              </div>
              <div style={{ background: 'rgba(255,140,66,0.1)', padding: '12px', borderRadius: '12px', color: '#FF8C42', display: 'flex', alignItems: 'center' }}>
                <Calendar size={22} />
              </div>
            </div>

            {/* Card 3: This Year's Income */}
            <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px', borderLeft: '4px solid #3b82f6', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>This Year's Income</p>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  <span style={{ color: '#3b82f6', marginRight: '2px' }}>₹</span>{yearIncome.toLocaleString()}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Yearly collections</span>
              </div>
              <div style={{ background: 'rgba(59,130,246,0.1)', padding: '12px', borderRadius: '12px', color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                <TrendingUp size={22} />
              </div>
            </div>

            {/* Card 4: Average Daily Income */}
            <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px', borderLeft: '4px solid #8b5cf6', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Avg Daily Income</p>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  ₹{avgDailyIncome.toLocaleString()}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Based on entire month's days</span>
              </div>
              <div style={{ background: 'rgba(139,92,246,0.1)', padding: '12px', borderRadius: '12px', color: '#8b5cf6', display: 'flex', alignItems: 'center' }}>
                <Info size={22} />
              </div>
            </div>

          </div>

          {/* Breakdown & Analytics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Category share card */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-card)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} style={{ color: '#FF8C42' }} /> Category Revenue Distribution
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.keys(categorySummary).length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>No categories data recorded yet.</div>
                ) : (
                  Object.entries(categorySummary)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, val]) => {
                      const percent = totalCollected > 0 ? Math.round((val / totalCollected) * 100) : 0;
                      return (
                        <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{name}</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>₹{val.toLocaleString()} ({percent}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #FF8C42, #E05300)', borderRadius: '4px' }} />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Payment Mode distribution card */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-card)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={16} style={{ color: '#8b5cf6' }} /> Payment Mode Share
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {totalCollected === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>No payments collected yet.</div>
                ) : (
                  Object.entries(methodSummary)
                    .sort((a, b) => b[1] - a[1])
                    .map(([method, val]) => {
                      const percent = totalCollected > 0 ? Math.round((val / totalCollected) * 100) : 0;
                      return (
                        <div key={method} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{method}</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>₹{val.toLocaleString()} ({percent}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)', borderRadius: '4px' }} />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

          </div>

          {/* Top Incomes and Recent Activity Logs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Top Incomes List */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-card)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} style={{ color: '#FF8C42' }} /> Top Revenue Transactions
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <th style={{ padding: '8px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Receipt</th>
                      <th style={{ padding: '8px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Category</th>
                      <th style={{ padding: '8px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Source</th>
                      <th style={{ padding: '8px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '20px 10px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No transactions recorded.</td>
                      </tr>
                    ) : (
                      [...entries]
                        .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
                        .slice(0, 5)
                        .map(e => (
                          <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '10px 10px', fontSize: '0.78rem', color: '#FF8C42', fontWeight: 600 }}>{e.receiptNumber}</td>
                            <td style={{ padding: '10px 10px', fontSize: '0.78rem', color: 'var(--text-main)' }}>{e.categoryName}</td>
                            <td style={{ padding: '10px 10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{e.receivedFrom || 'N/A'}</td>
                            <td style={{ padding: '10px 10px', fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 700, textAlign: 'right' }}>₹{Number(e.amount).toLocaleString()}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-card)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} style={{ color: '#FF8C42' }} /> Recent Activity Logs
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {entries.length === 0 ? (
                  <div style={{ padding: '20px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No activities recorded.</div>
                ) : (
                  [...entries]
                    .sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt)
                    .slice(0, 5)
                    .map(e => (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.01)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <div style={{ minWidth: 0, flex: 1, marginRight: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>{e.categoryName}</span>
                            <span style={{ padding: '2px 6px', background: 'rgba(255,140,66,0.1)', color: '#FF8C42', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 700 }}>{e.paymentMethod}</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.description || `Collected from ${e.receivedFrom || 'N/A'}`}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{Number(e.amount).toLocaleString()}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>{e.date}</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT: ENTRIES */}
      {activeTab === 'entries' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px' }}>
            <button 
              onClick={() => {
                setSelectedEntry(null);
                setEntryForm({
                  categoryId: categories[0]?.id || '',
                  amount: '',
                  date: getLocalDateString(),
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

          {/* Filters Toolbar */}
          <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', alignItems: 'center' }}>
              
              <div>
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
                <CustomSelect 
                  value={filterCategory} 
                  onChange={e => setFilterCategory(e.target.value)} 
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="All" style={optionStyle}>All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} style={optionStyle}>{c.name}</option>
                  ))}
                </CustomSelect>
              </div>

            </div>
          </div>

          {/* Entries Data Table */}
          <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            {/* Table Actions Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-glass)', gap: '10px' }}>
              <button 
                onClick={() => handleExportCSV(todayEntries, 'auxiliary_income_entries')} 
                style={{
                  padding: '6px 12px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-glass)',
                  borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', height: '30px'
                }}
              >
                <Download size={13} /> Export CSV
              </button>
              <button 
                onClick={() => window.print()} 
                style={{
                  padding: '6px 12px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-glass)',
                  borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', height: '30px'
                }}
              >
                <FileText size={13} /> Export PDF
              </button>
            </div>
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
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                          <Loader2 className="animate-spin" size={18} /> Loading entries...
                        </div>
                      </td>
                    </tr>
                  ) : todayEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
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
                        <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            title="View Receipt"
                            onClick={() => setReceiptData(entry)}
                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'transform 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            title="Edit Entry"
                            onClick={() => handleEditEntry(entry)}
                            style={{ background: 'transparent', border: 'none', color: '#eab308', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'transform 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            title="Delete Entry"
                            onClick={() => handleDeleteEntry(entry.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'transform 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <Trash2 size={16} />
                          </button>
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
          

          {/* History Filters Toolbar */}
          <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'center' }}>
              
              {/* Period Mode Option Selector */}
              <div>
                <CustomSelect
                  value={historyPeriodMode}
                  onChange={e => setHistoryPeriodMode(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="date" style={optionStyle}>Date</option>
                  <option value="month" style={optionStyle}>Month</option>
                  <option value="year" style={optionStyle}>Year</option>
                </CustomSelect>
              </div>

              {/* Dynamic Period Picker */}
              <div>
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
                  <CustomSelect
                    value={historyYear}
                    onChange={e => setHistoryYear(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {Array.from({ length: 11 }, (_, i) => String(new Date().getFullYear() - 5 + i)).map(y => (
                      <option key={y} value={y} style={optionStyle}>{y}</option>
                    ))}
                  </CustomSelect>
                )}
              </div>

              {/* Category selector */}
              <div>
                <CustomSelect
                  value={historyCategory}
                  onChange={e => setHistoryCategory(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="All" style={optionStyle}>All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} style={optionStyle}>{c.name}</option>
                  ))}
                </CustomSelect>
              </div>

            </div>
          </div>

          {/* History Entries Table */}
          <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            {/* Table Actions Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-glass)', gap: '10px' }}>
              <button 
                onClick={() => handleExportCSV(filteredHistoryEntries, `auxiliary_income_history_${historyPeriodMode}_${historyPeriodMode === 'date' ? historyDate : historyPeriodMode === 'month' ? historyMonth : historyYear}`)} 
                style={{
                  padding: '6px 12px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-glass)',
                  borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', height: '30px'
                }}
              >
                <Download size={13} /> Export CSV
              </button>
              <button 
                onClick={() => window.print()} 
                style={{
                  padding: '6px 12px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-glass)',
                  borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', height: '30px'
                }}
              >
                <FileText size={13} /> Export PDF
              </button>
            </div>
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
                  {filteredHistoryEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
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
                        <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            title="View Receipt"
                            onClick={() => setReceiptData(entry)}
                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'transform 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            title="Edit Entry"
                            onClick={() => handleEditEntry(entry)}
                            style={{ background: 'transparent', border: 'none', color: '#eab308', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'transform 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            title="Delete Entry"
                            onClick={() => handleDeleteEntry(entry.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'transform 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <Trash2 size={16} />
                          </button>
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
                  <CustomSelect
                    value={entryForm.categoryId}
                    onChange={e => setEntryForm({ ...entryForm, categoryId: e.target.value })}
                    required
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {categories.length === 0 ? (
                      <option value="" disabled style={optionStyle}>No categories created yet</option>
                    ) : (
                      categories.map(c => (
                        <option key={c.id} value={c.id} style={optionStyle}>{c.name}</option>
                      ))
                    )}
                  </CustomSelect>
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
                  <CustomSelect
                    value={entryForm.paymentMethod}
                    onChange={e => setEntryForm({ ...entryForm, paymentMethod: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'].map(m => (
                      <option key={m} value={m} style={optionStyle}>{m}</option>
                    ))}
                  </CustomSelect>
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
            width: '100%', maxWidth: '480px', background: 'var(--bg-elevated)', borderRadius: '20px',
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
                  style={{ ...inputStyle, height: '80px', resize: 'none' }}
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

            {/* Existing Categories scrollable list inside the modal */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
                Existing Categories ({categories.length})
              </h4>
              
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {categories.length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                    No categories created yet.
                  </div>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '10px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>{cat.name}</span>
                        {cat.description && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.description}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleEditCategory(cat)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#FF8C42'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

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
                onClick={() => setReceiptData(null)} 
                style={{
                  flex: 1, padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                  borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center'
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

