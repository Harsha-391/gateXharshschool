import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, DollarSign, Wallet, ClipboardList, BarChart3, Bell, CheckCircle,
  AlertTriangle, Plus, Search, Filter, Download, ArrowUpRight, ArrowDownRight,
  TrendingDown, FileText, X, ShieldAlert, ChevronRight, Eye, Trash2, Edit2, Loader2,
  ListFilter, Calendar, PieChart, Settings, RefreshCw, Shield, ArrowUp, ArrowDown,
  LogOut, History
} from 'lucide-react';
import { fetchActiveGrades } from '../utils/grades';

const getTodayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

export default function ExpensePanel({ setActiveView, onLogout, expenseView, setExpenseView, onAccessAdmin, hideHeader, onBackToMain }) {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [expenseHistory, setExpenseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [budgetLimit] = useState(600000); // Default monthly budget limit

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchExpenses = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('/api/account-management/expenses').then(res => {
        if (!res.ok) throw new Error('Failed to retrieve expenses database records.');
        return res.json();
      }),
      fetch('/api/account-management/income').then(res => {
        if (!res.ok) throw new Error('Failed to retrieve income database records.');
        return res.json();
      }),
      fetch('/api/account-management/expense-history').then(res => {
        if (!res.ok) throw new Error('Failed to retrieve expense history database records.');
        return res.json();
      })
    ])
      .then(([expenseData, incomeData, historyData]) => {
        setExpenses(expenseData || []);
        setIncome(incomeData || []);
        setExpenseHistory(historyData || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching financial records:', err);
        setError(err.message || 'Error communicating with the database.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExpenses();
  }, [expenseView]);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '12px' }}>
          <Loader2 className="animate-spin animate-infinite" size={36} style={{ color: 'hsl(var(--color-danger))' }} />
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Fetching expense metrics...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '14px', textAlign: 'center', padding: '20px' }}>
          <AlertTriangle size={40} style={{ color: 'hsl(var(--color-danger))' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Telemetry Synchronization Error</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '350px', margin: 0 }}>{error}</p>
          <button onClick={fetchExpenses} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600 }}>
            <RefreshCw size={14} /> Retry Sync
          </button>
        </div>
      );
    }

    switch (expenseView) {
      case 'dashboard':
        return <DashboardView expenses={expenses} setExpenseView={setExpenseView} budgetLimit={budgetLimit} />;
      case 'add-expense':
        return <AllExpensesView expenses={expenses} showToast={showToast} fetchExpenses={fetchExpenses} autoOpenAddForm={true} setExpenseView={setExpenseView} />;
      case 'all-expenses':
        return <AllExpensesView expenses={expenses} showToast={showToast} fetchExpenses={fetchExpenses} setExpenseView={setExpenseView} />;
      case 'tracker':
        return <TrackerView expenses={expenses} income={income} fetchExpenses={fetchExpenses} showToast={showToast} budgetLimit={budgetLimit} />;
      case 'history':
        return <HistoryView expenses={expenses} expenseHistory={expenseHistory} fetchExpenses={fetchExpenses} showToast={showToast} budgetLimit={budgetLimit} />;
      default:
        return <AllExpensesView expenses={expenses} showToast={showToast} fetchExpenses={fetchExpenses} setExpenseView={setExpenseView} />;
    }
  };


  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', borderRadius: '12px',
          background: notification.type === 'success' ? '#10b981' : notification.type === 'warning' ? '#f59e0b' : '#ef4444', 
          color: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center',
          gap: '10px', zIndex: 999999, fontWeight: 600, animation: 'slideInRight 0.3s ease forwards'
        }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      {!hideHeader && (
        <div className="admin-panel-header glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(hsl(var(--color-danger)), 0.1)',
              color: 'hsl(var(--color-danger))'
            }}>
              <Wallet size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{expenseView === 'dashboard' ? 'Expense Dashboard' :
               expenseView === 'add-expense' ? 'Expenses' :
               expenseView === 'all-expenses' ? 'Expenses' :
               expenseView === 'tracker' ? 'Time-Period Expense Tracker' : 'New Expense Application'}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {expenseView === 'dashboard' ? 'Monitor expense totals, approval queues, budget usage, and recent ledger activity.' :
                 expenseView === 'add-expense' ? 'Search, filter, paginate, sort, and export the complete academy expense history.' :
                 expenseView === 'categories' ? 'Detailed records segmented across specific school operations and utilities.' :
                 expenseView === 'all-expenses' ? 'Search, filter, paginate, sort, and export the complete academy expense history.' :
                 expenseView === 'reports' ? 'Analyze budget thresholds, daily/weekly burn rates, and vendor analytics.' :
                 expenseView === 'approvals' ? 'Audit workflow queue for reviewing, comment recording, and invoice verification.' :
                 expenseView === 'tracker' ? 'Analyze expenditures per day, month, or year with custom comparative filters.' : 'Record utility bills, administrative supplies, renovation costs, or payroll expenses.'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  );
}

/* ============================================================
   DASHBOARD VIEW
   ============================================================ */
function DashboardView({ expenses, setExpenseView, budgetLimit }) {
  // Current Month calculations
  const today = new Date();
  const currentMonthStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  const todayStr = today.toLocaleDateString('en-CA');
  const currentYearStr = today.getFullYear().toString();

  const monthlyExpenses = expenses.filter(e => !e.deleted && e.date?.startsWith(currentMonthStr));
  const totalApprovedMonthly = monthlyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Daily spending calculations for the current month (June 2026, etc.)
  const year = today.getFullYear();
  const monthNum = today.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

  const dailyData = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentMonthStr}-${d.toString().padStart(2, '0')}`;
    dailyData[dateStr] = 0;
  }

  monthlyExpenses.forEach(e => {
    if (e.date && dailyData[e.date] !== undefined) {
      dailyData[e.date] += e.amount || 0;
    }
  });

  const sortedDays = Object.entries(dailyData)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const yearlyExpenses = expenses.filter(e => !e.deleted && e.date?.startsWith(currentYearStr));
  const totalYearly = yearlyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const todayExpenses = expenses.filter(e => !e.deleted && e.date === todayStr);
  const totalToday = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Group by category
  const categoryGroups = {};
  expenses.forEach(e => {
    if (e.deleted) return;
    const cat = e.category || 'Other';
    categoryGroups[cat] = (categoryGroups[cat] || 0) + (e.amount || 0);
  });

  const sortedCategories = Object.entries(categoryGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const metrics = [
    { label: 'Current Month Expenses', value: `₹${totalApprovedMonthly.toLocaleString()}`, subText: `Budget: ₹${budgetLimit.toLocaleString()}`, color: totalApprovedMonthly > budgetLimit ? '#ef4444' : '#10b981', icon: Wallet, progress: Math.min((totalApprovedMonthly / budgetLimit) * 100, 100) },
    { label: 'Current Year Total', value: `₹${totalYearly.toLocaleString()}`, subText: 'Cumulative overall spending', color: '#3b82f6', icon: BarChart3 },
    { label: "Today's Overhead", value: `₹${totalToday.toLocaleString()}`, subText: 'Recorded today', color: '#a855f7', icon: Calendar }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Stat Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="glass-panel" style={{
              padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
              background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</span>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', background: `${m.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={18} style={{ color: m.color }} />
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{m.value}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{m.subText}</p>
              </div>
              {m.progress !== undefined && (
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${m.progress}%`, height: '100%', background: m.color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Grid: Charts & Activities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Category breakdown */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <PieChart size={18} style={{ color: 'hsl(var(--color-danger))' }} /> Top Spending Categories
            </h3>
            <button 
              onClick={() => setExpenseView('categories')}
              className="btn-text" 
              style={{ fontSize: '0.75rem', color: 'hsl(var(--color-danger))', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Analyze Categories
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sortedCategories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>No data available</span>
                <span>Data will appear once records are added</span>
              </div>
            ) : (
              sortedCategories.map(([cat, val]) => {
                const maxVal = Math.max(...Object.values(categoryGroups), 1);
                const percent = Math.round((val / maxVal) * 100);
                const catColors = { 
                  Maintenance: '#3b82f6', Salary: '#8b5cf6', Stationery: '#f59e0b', 
                  Utilities: '#06b6d4', Transportation: '#10b981', Events: '#f97316', 
                  Other: '#6b7280' 
                };
                const color = catColors[cat] || 'hsl(var(--color-danger))';
                return (
                  <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>₹{val.toLocaleString()}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Add and Actions */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} style={{ color: 'hsl(var(--color-danger))' }} /> Quick Actions
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Frequently used controls for managing corporate spending and approving utility requisitions.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button 
              onClick={() => setExpenseView('add-expense')}
              style={{
                padding: '16px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff',
                border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '0.85rem',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)', transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Plus size={20} />
              <span>Record Expense</span>
            </button>
            
            <button 
              onClick={() => setExpenseView('all-expenses')}
              style={{
                padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-main)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
                fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <ClipboardList size={15} /> Ledger View
            </button>
            <button 
              onClick={() => setExpenseView('reports')}
              style={{
                padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-main)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
                fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <BarChart3 size={15} /> Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Daily Spending Trends */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <BarChart3 size={18} style={{ color: 'hsl(var(--color-danger))' }} /> Daily Spending Trends (Current Month)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Active Month: {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', width: '100%' }}>
          {sortedDays.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>No data available</span>
              <span>Daily trends will appear as expenses are recorded</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100%', width: '100%', padding: '0 10px', overflowX: 'auto' }}>
              {sortedDays.map(([dateStr, val], idx) => {
                const maxVal = Math.max(...Object.values(dailyData), 1);
                const height = (val / maxVal) * 160;
                const dayNum = parseInt(dateStr.split('-')[2]);
                const isToday = dateStr === todayStr;
                return (
                  <div key={idx} style={{ flex: 1, minWidth: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '100%' }}>
                      {val > 0 && (
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)' }}>₹{val.toLocaleString()}</span>
                      )}
                      <div style={{
                        width: '100%', maxWidth: '24px', height: `${Math.max(height, 4)}px`, borderRadius: '4px 4px 0 0',
                        background: val > 0 
                          ? (isToday ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)')
                          : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.3s ease', minHeight: '4px',
                        border: isToday ? '1px solid #f59e0b' : 'none'
                      }} title={`Date: ${dateStr} | Spent: ₹${val.toLocaleString()}`} />
                    </div>
                    <span style={{ fontSize: '0.65rem', color: isToday ? 'hsl(var(--color-warning))' : 'var(--text-muted)', fontWeight: isToday ? 800 : 600 }}>{dayNum}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Ledger Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <ClipboardList size={18} style={{ color: 'hsl(var(--color-danger))' }} /> Recent Activity Ledger
          </h3>
          <button 
            onClick={() => setExpenseView('all-expenses')}
            style={{ background: 'none', border: 'none', color: 'hsl(var(--color-danger))', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
          >
            View Full Ledger
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Title', 'Category', 'Amount', 'Date', 'Vendor'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No expense records registered.</td>
                </tr>
              ) : (
                expenses.slice(0, 5).map((exp, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{exp.title}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)'
                      }}>{exp.category}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>₹{exp.amount?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exp.date}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exp.vendor?.name || 'Various'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ADD EXPENSE VIEW
   ============================================================ */
function AddExpenseView({ showToast, setExpenseView, onClose, onSuccess, isModal = false, editExpense = null }) {
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    title: '', category: 'Office & Administrative', subcategory: 'Office Supplies',
    amount: '', date: new Date().toLocaleDateString('en-CA'), paymentDate: '',
    vendorName: '', vendorContact: '', vendorEmail: '', vendorAddress: '',
    paymentMethod: 'Cash', transactionId: '', invoiceNumber: '',
    remarks: '', notes: '', attachmentName: '', status: 'Pending',
    grade: '', department: '', expenseType: 'Operational'
  });

  useEffect(() => {
    if (editExpense) {
      setForm({
        title: editExpense.title || '',
        category: editExpense.category || 'Office & Administrative',
        subcategory: editExpense.subcategory || 'Office Supplies',
        amount: editExpense.amount || '',
        date: editExpense.date || new Date().toLocaleDateString('en-CA'),
        paymentDate: editExpense.paymentDate || '',
        vendorName: editExpense.vendor?.name || '',
        vendorContact: editExpense.vendor?.contact || '',
        vendorEmail: editExpense.vendor?.email || '',
        vendorAddress: editExpense.vendor?.address || '',
        paymentMethod: editExpense.paymentDetails?.method || 'Cash',
        transactionId: editExpense.paymentDetails?.transactionId || '',
        invoiceNumber: editExpense.paymentDetails?.invoiceNumber || '',
        remarks: editExpense.remarks || editExpense.description || '',
        notes: editExpense.notes || '',
        attachmentName: editExpense.attachment || '',
        status: editExpense.status || 'Pending',
        grade: editExpense.grade || '',
        department: editExpense.department || '',
        expenseType: editExpense.expenseType || 'Operational'
      });
    }
  }, [editExpense]);

  useEffect(() => {
    const loadClassifications = async () => {
      try {
        const [gradesData, deptsRes] = await Promise.all([
          fetchActiveGrades(),
          fetch('/api/grades/departments').then(res => res.json())
        ]);
        setGrades(gradesData || []);
        setDepartments(deptsRes || []);
      } catch (err) {
        console.error('Failed loading classification details for new expense form:', err);
      }
    };
    loadClassifications();
  }, []);

  const categories = {
    'Office & Administrative': ['Stationery', 'Printing', 'Internet Bills', 'Telephone Bills', 'Office Supplies'],
    'Employee Welfare': ['Tea & Refreshments', 'Snacks', 'Employee Meetings', 'Employee Events', 'Training Programs'],
    'Furniture & Equipment': ['Classroom Furniture', 'Office Furniture', 'Laboratory Equipment', 'Sports Equipment', 'Computers', 'Smart Boards', 'Projectors'],
    'Building & Renovation': ['Construction', 'Painting', 'Flooring', 'Plumbing', 'Electrical Work', 'Classroom Renovation', 'Washroom Renovation', 'Roof Repair', 'Boundary Wall Repair'],
    'Utilities': ['Electricity', 'Water', 'Gas', 'Generator Fuel', 'Solar Maintenance'],
    'Transportation': ['Fuel', 'Vehicle Maintenance', 'Repairs', 'Insurance'],
    'Maintenance & Repair': ['AC Repair', 'CCTV Maintenance', 'Computer Repair', 'Furniture Repair', 'Playground Maintenance'],
    'Academic Expenses': ['Books', 'Library', 'Laboratory Materials', 'Examination Materials', 'Software Licenses'],
    'Events & Functions': ['Annual Day', 'Sports Day', 'Science Exhibition', 'Seminars', 'Other Events'],
    'Other Expenses': ['Miscellaneous Overhead']
  };

  const handleCategoryChange = (cat) => {
    const subcats = categories[cat] || [];
    setForm(prev => ({
      ...prev,
      category: cat,
      subcategory: subcats[0] || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title: form.title,
      category: form.category,
      subcategory: form.subcategory,
      amount: Number(form.amount) || 0,
      description: form.remarks,
      date: form.date,
      paymentDate: form.paymentDate || form.date,
      paidBy: 'Expense Management',
      vendor: {
        name: form.vendorName,
        contact: form.vendorContact,
        email: form.vendorEmail,
        address: form.vendorAddress
      },
      paymentDetails: {
        method: form.paymentMethod,
        transactionId: form.transactionId,
        invoiceNumber: form.invoiceNumber
      },
      status: form.status,
      submittedBy: 'Expense Management',
      remarks: form.remarks,
      notes: form.notes,
      attachment: form.attachmentName || 'invoice_mock.pdf',
      grade: '',
      department: '',
      expenseType: 'Operational'
    };

    const url = editExpense 
      ? `/api/account-management/expenses/${editExpense.expenseId}`
      : '/api/account-management/expenses';
    const method = editExpense ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(editExpense 
          ? `Expense of ₹${Number(form.amount).toLocaleString()} successfully updated!`
          : `Expense of ₹${Number(form.amount).toLocaleString()} successfully logged!`
        );
        if (!editExpense) {
          setForm({
            title: '', category: 'Office & Administrative', subcategory: 'Office Supplies',
            amount: '', date: new Date().toLocaleDateString('en-CA'), paymentDate: '',
            vendorName: '', vendorContact: '', vendorEmail: '', vendorAddress: '',
            paymentMethod: 'Cash', transactionId: '', invoiceNumber: '',
            remarks: '', notes: '', attachmentName: '', status: 'Pending',
            grade: '', department: '', expenseType: 'Operational'
          });
        }
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showToast(editExpense ? 'Failed to update expense.' : 'Failed to record expense. Verify parameters.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network interface error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fieldLabelStyle = { 
    fontSize: '0.72rem', 
    fontWeight: 700, 
    color: isModal ? '#475569' : 'var(--text-muted)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.04em', 
    marginBottom: '6px', 
    display: 'block' 
  };
  const inputStyle = {
    width: '100%', 
    padding: '11px 14px', 
    background: isModal ? '#ffffff' : 'var(--bg-form)',
    border: isModal ? '1px solid #cbd5e1' : '1px solid var(--border-glass)', 
    borderRadius: '10px', 
    color: isModal ? '#0f172a' : 'var(--text-main)',
    fontSize: '0.85rem', 
    outline: 'none', 
    boxSizing: 'border-box', 
    transition: 'border-color 0.2s'
  };
  const sectionTitleStyle = { 
    fontSize: '0.85rem', 
    fontWeight: 800, 
    color: isModal ? '#0f172a' : 'var(--text-main)', 
    borderBottom: isModal ? '1px solid #e2e8f0' : '1px solid var(--border-glass)', 
    paddingBottom: '8px', 
    marginBottom: '16px' 
  };

  return (
    <div className={isModal ? "" : "glass-panel"} style={isModal ? { padding: 0 } : { padding: '32px', borderRadius: '16px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Basic Information */}
        <div>
          <h4 style={sectionTitleStyle}>Basic Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <label style={fieldLabelStyle}>Expense Title</label>
              <input 
                type="text" required placeholder="Fiber internet lease renewal" 
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>Expense Category</label>
              <select 
                value={form.category} onChange={e => handleCategoryChange(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabelStyle}>Subcategory</label>
              <select 
                value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value})}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {(categories[form.category] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabelStyle}>Amount (₹)</label>
              <input 
                type="number" required placeholder="12500" 
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>Expense Date</label>
              <input 
                type="date" required 
                value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                max={new Date().toLocaleDateString('en-CA')}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>Payment Settlement Date</label>
              <input 
                type="date" 
                value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })}
                max={new Date().toLocaleDateString('en-CA')}
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={fieldLabelStyle}>Description / Statement of Purpose</label>
              <input 
                type="text" placeholder="Annual renewal of high-speed office fiber line (500Mbps)" 
                value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>



        {/* Vendor Information */}
        <div>
          <h4 style={sectionTitleStyle}>Vendor / Supplier Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <label style={fieldLabelStyle}>Vendor Name</label>
              <input 
                type="text" placeholder="Aegis Digital Solutions" 
                value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>Contact Number</label>
              <input 
                type="tel" placeholder="+91 9876543210" 
                value={form.vendorContact} onChange={e => setForm({ ...form, vendorContact: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>Email Address</label>
              <input 
                type="email" placeholder="billing@aegissolutions.com" 
                value={form.vendorEmail} onChange={e => setForm({ ...form, vendorEmail: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>Postal Address</label>
              <input 
                type="text" placeholder="Plot 12, Sector 5, Industrial Area" 
                value={form.vendorAddress} onChange={e => setForm({ ...form, vendorAddress: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Payment details */}
        <div>
          <h4 style={sectionTitleStyle}>Payment Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <label style={fieldLabelStyle}>Payment Method</label>
              <select 
                value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabelStyle}>Transaction / Reference ID</label>
              <input 
                type="text" placeholder="TXN-938210398" 
                value={form.transactionId} onChange={e => setForm({ ...form, transactionId: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>Invoice / Receipt Number</label>
              <input 
                type="text" placeholder="INV-2026-883" 
                value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>Document Upload (Mock)</label>
              <input 
                type="text" placeholder="invoice_receipt.pdf" 
                value={form.attachmentName} onChange={e => setForm({ ...form, attachmentName: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: isModal ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
          <button 
            type="button" 
            onClick={onClose || (() => setExpenseView('tracker'))}
            style={{
              padding: '12px 24px', 
              background: isModal ? '#f1f5f9' : 'rgba(255,255,255,0.04)', 
              color: isModal ? '#334155' : '#fff',
              border: isModal ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.08)', 
              borderRadius: '10px', 
              fontWeight: 600, 
              cursor: 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.85rem'
            }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '12px 28px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff',
              border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            {editExpense ? 'Save Changes' : 'Submit Expense Requisition'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ============================================================
   CATEGORIES VIEW
   ============================================================ */
function AllExpensesView({ expenses, showToast, fetchExpenses, autoOpenAddForm = false, setExpenseView }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [subcategoryFilter, setSubcategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showAddForm, setShowAddForm] = useState(autoOpenAddForm);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    if (autoOpenAddForm) {
      setShowAddForm(true);
    }
  }, [autoOpenAddForm]);

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingExpense(null);
    if (setExpenseView) {
      setExpenseView('all-expenses');
    }
  };

  const itemsPerPage = 10;

  const categories = [
    'Office & Administrative', 'Employee Welfare', 'Furniture & Equipment', 
    'Building & Renovation', 'Utilities', 'Transportation', 
    'Maintenance & Repair', 'Academic Expenses', 'Events & Functions', 'Other Expenses'
  ];

  const subcategoriesMap = {
    'Office & Administrative': ['Stationery', 'Printing', 'Internet Bills', 'Telephone Bills', 'Office Supplies'],
    'Employee Welfare': ['Tea & Refreshments', 'Snacks', 'Employee Meetings', 'Employee Events', 'Training Programs'],
    'Furniture & Equipment': ['Classroom Furniture', 'Office Furniture', 'Laboratory Equipment', 'Sports Equipment', 'Computers', 'Smart Boards', 'Projectors'],
    'Building & Renovation': ['Construction', 'Painting', 'Flooring', 'Plumbing', 'Electrical Work', 'Classroom Renovation', 'Washroom Renovation', 'Roof Repair', 'Boundary Wall Repair'],
    'Utilities': ['Electricity', 'Water', 'Gas', 'Generator Fuel', 'Solar Maintenance'],
    'Transportation': ['Fuel', 'Vehicle Maintenance', 'Repairs', 'Insurance'],
    'Maintenance & Repair': ['AC Repair', 'CCTV Maintenance', 'Computer Repair', 'Furniture Repair', 'Playground Maintenance'],
    'Academic Expenses': ['Books', 'Library', 'Laboratory Materials', 'Examination Materials', 'Software Licenses'],
    'Events & Functions': ['Annual Day', 'Sports Day', 'Science Exhibition', 'Seminars', 'Other Events'],
    'Other Expenses': ['Miscellaneous Overhead']
  };

  const subcategoryOptions = categoryFilter === 'All'
    ? Array.from(new Set(Object.values(subcategoriesMap).flat()))
    : (subcategoriesMap[categoryFilter] || []);

  // Process sorting/filtering
  const filtered = expenses.filter(e => {
    if (e.deleted) return false;
    const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase()) || 
                        e.expenseId?.toLowerCase().includes(search.toLowerCase()) ||
                        e.vendor?.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'All' || e.category === categoryFilter;
    const matchSubcategory = subcategoryFilter === 'All' || e.subcategory === subcategoryFilter;

    return matchSearch && matchCategory && matchSubcategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Permanently remove expense request "${title}"?`)) return;
    try {
      const res = await fetch(`/api/account-management/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Expense successfully removed.');
        fetchExpenses();
      } else {
        showToast('Error removing expense.', 'error');
      }
    } catch {
      showToast('Network communication error', 'error');
    }
  };

  const exportCSV = () => {
    if (!sorted.length) return showToast('No items to export.', 'error');
    const headers = ['ID', 'Title', 'Category', 'Subcategory', 'Amount', 'Date', 'Vendor', 'Method'];
    const csvContent = [
      headers.join(','),
      ...sorted.map(e => [
        e.expenseId,
        `"${e.title}"`,
        e.category,
        e.subcategory || '',
        e.amount,
        e.date,
        `"${e.vendor?.name || ''}"`,
        e.paymentDetails?.method || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense_report_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Ledger successfully downloaded as CSV.');
  };

  const inputStyle = {
    padding: '10px 14px', background: 'var(--bg-form)',
    border: '1px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.82rem', outline: 'none'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Action Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button 
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '11px 20px', fontWeight: 700,
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            color: '#fff', border: 'none', borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem',
            cursor: 'pointer', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)'
          }}
        >
          <Plus size={16} /> Record Expense
        </button>
      </div>

      {/* Filtering Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" placeholder="Search title, ID, vendor..." 
            value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{ ...inputStyle, paddingLeft: '36px', width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <select 
          value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setSubcategoryFilter('All'); setCurrentPage(1); }}
          style={{ ...inputStyle, cursor: 'pointer', width: '160px' }}
        >
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
          value={subcategoryFilter} onChange={e => { setSubcategoryFilter(e.target.value); setCurrentPage(1); }}
          style={{ ...inputStyle, cursor: 'pointer', width: '180px' }}
        >
          <option value="All">All Subcategories</option>
          {subcategoryOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
        </select>

        <select 
          value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer', width: '140px' }}
        >
          <option value="date-desc">Newest Date</option>
          <option value="date-asc">Oldest Date</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
          <option value="title-asc">Alphabetical</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['ID', 'Expense Title', 'Category', 'Vendor', 'Amount', 'Date', 'Method', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No expenses found matching the selected filters.</td>
                </tr>
              ) : (
                paginated.map((exp, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--color-danger))' }}>{exp.expenseId}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{exp.title}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{exp.category}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{exp.vendor?.name || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{exp.amount?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{exp.date}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{exp.paymentDetails?.method || 'Cash'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setSelectedExpense(exp)}
                          style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            color: '#3b82f6', cursor: 'pointer', padding: '6px', borderRadius: '6px'
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingExpense(exp);
                            setShowAddForm(true);
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            color: '#f59e0b', cursor: 'pointer', padding: '6px', borderRadius: '6px'
                          }}
                          title="Edit Expense"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(exp.expenseId, exp.title)}
                          style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px'
                          }}
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing page {currentPage} of {totalPages} ({filtered.length} total records)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              Previous
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedExpense && (
        <div className="modal-overlay" onClick={() => setSelectedExpense(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            maxWidth: '500px', width: '90%', background: '#ffffff', borderRadius: '20px',
            border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Expense Voucher Details</h3>
              <button onClick={() => setSelectedExpense(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflowY: 'auto', flex: 1 }}>
              {[
                ['Expense ID', selectedExpense.expenseId],
                ['Title', selectedExpense.title],
                ['Category', selectedExpense.category],
                ['Subcategory', selectedExpense.subcategory || 'General'],
                ['Amount', `₹${selectedExpense.amount?.toLocaleString()}`],
                ['Expense Date', selectedExpense.date],
                ['Vendor Name', selectedExpense.vendor?.name || '—'],
                ['Vendor Contact', selectedExpense.vendor?.contact || '—'],
                ['Vendor Email', selectedExpense.vendor?.email || '—'],
                ['Vendor Address', selectedExpense.vendor?.address || '—'],
                ['Payment Method', selectedExpense.paymentDetails?.method || 'Cash'],
                ['Transaction ID', selectedExpense.paymentDetails?.transactionId || '—'],
                ['Invoice Number', selectedExpense.paymentDetails?.invoiceNumber || '—'],
                ['Submitted By', selectedExpense.submittedBy || 'Expense Management'],
                ['Remarks', selectedExpense.remarks || '—']
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>{k}</span>
                  <span style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={handleCloseForm} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            maxWidth: '850px', width: '95%', maxHeight: '90vh', background: '#ffffff', borderRadius: '20px',
            border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', color: '#0f172a'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {editingExpense ? <Edit2 size={22} style={{ color: '#f59e0b' }} /> : <Plus size={22} style={{ color: '#ef4444' }} />}
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editingExpense ? 'Edit Expense Details' : 'Record Expense'}
                </h3>
              </div>
              <button onClick={handleCloseForm} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><X size={20} /></button>
            </div>
            
            <AddExpenseView 
              showToast={showToast} 
              setExpenseView={setExpenseView} 
              onClose={handleCloseForm}
              onSuccess={() => {
                fetchExpenses();
                handleCloseForm();
              }}
              isModal={true}
              editExpense={editingExpense}
            />
          </div>
        </div>
      )}

    </div>
  );
}

function TrackerView({ expenses, income, fetchExpenses, showToast, budgetLimit }) {
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  const currentMonthStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(today.getFullYear());

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('All');

  // Classification Lists (from backend API)
  const [grades, setGrades] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Interaction Hover States for SVGs
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState(null);
  const [hoveredDonutIdx, setHoveredDonutIdx] = useState(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState(null);
  const [hoveredIncExpIdx, setHoveredIncExpIdx] = useState(null); // { idx: number, type: 'income' | 'expense' }

  // Voucher details selection state
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);

  // Load Classification Data
  useEffect(() => {
    let active = true;
    const loadClassifications = async () => {
      try {
        const [gradesData, deptsRes] = await Promise.all([
          fetchActiveGrades(),
          fetch('/api/grades/departments').then(res => res.json())
        ]);
        if (active) {
          setGrades(gradesData || []);
          setDepartments(deptsRes || []);
        }
      } catch (err) {
        console.error('Failed loading classification details for TrackerView:', err);
      }
    };
    loadClassifications();
    return () => { active = false; };
  }, []);



  const handleSelectVoucher = (tx) => {
    if (tx.type === 'expense') {
      const fullExpense = expenses.find(e => (e.expenseId === tx.id || e.id === tx.id));
      if (fullExpense) {
        setSelectedVoucher(fullExpense);
      }
    }
  };

  // Filter Expenses (Client Side)
  const processedExpenses = expenses.filter(e => {
    if (e.deleted) return false;
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
    if (gradeFilter !== 'All' && e.grade !== gradeFilter) return false;
    if (departmentFilter !== 'All' && e.department !== departmentFilter) return false;
    if (expenseTypeFilter !== 'All' && e.expenseType !== expenseTypeFilter) return false;
    return true;
  });

  const activeExpenses = processedExpenses;

  // KPI Calculations
  const totalSpend = activeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const todaySpend = activeExpenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + (e.amount || 0), 0);
  const monthlySpend = activeExpenses.filter(e => e.date?.startsWith(currentMonthStr)).reduce((sum, e) => sum + (e.amount || 0), 0);
  const yearlySpend = activeExpenses.filter(e => e.date?.startsWith(currentYearStr)).reduce((sum, e) => sum + (e.amount || 0), 0);

  const currentDayOfMonth = today.getDate();
  const avgDailySpend = currentDayOfMonth > 0 ? Math.round(monthlySpend / currentDayOfMonth) : 0;
  const budgetProgressPercent = Math.min(Math.round((monthlySpend / budgetLimit) * 100), 100);

  // Category Colors Palette
  const categoryColors = {
    'Office & Administrative': '#3b82f6', // blue
    'Employee Welfare': '#8b5cf6',       // purple
    'Furniture & Equipment': '#06b6d4',  // cyan
    'Building & Renovation': '#ec4899',   // pink
    'Utilities': '#eab308',               // yellow
    'Transportation': '#14b8a6',         // teal
    'Maintenance & Repair': '#f97316',   // orange
    'Academic Expenses': '#10b981',      // green
    'Events & Functions': '#a855f7',     // light purple
    'Other Expenses': '#6b7280',          // gray
    'Salary': '#ef4444'                  // red
  };
  const getCategoryColor = (cat) => categoryColors[cat] || '#8b5cf6';

  // Analytics Calculations
  const categoryTotals = {};
  activeExpenses.forEach(e => {
    const cat = e.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
  });
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const highestCategory = sortedCategories.length > 0 ? sortedCategories[0] : ['N/A', 0];
  const lowestCategory = sortedCategories.length > 1 ? sortedCategories[sortedCategories.length - 1] : (sortedCategories.length === 1 ? sortedCategories[0] : ['N/A', 0]);

  // Spending Growth calculation (Month vs Previous Month)
  const getPrevMonthStr = () => {
    let y = today.getFullYear();
    let m = today.getMonth(); // 0-indexed, so 0 is Jan, 5 is June
    if (m === 0) {
      m = 12;
      y = y - 1;
    }
    return `${y}-${String(m).padStart(2, '0')}`;
  };
  const prevMonthStr = getPrevMonthStr();
  const prevMonthSpend = expenses
    .filter(e => !e.deleted && e.date?.startsWith(prevMonthStr))
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  let growthPercent = 0;
  if (prevMonthSpend > 0) {
    growthPercent = Math.round(((monthlySpend - prevMonthSpend) / prevMonthSpend) * 100);
  } else if (monthlySpend > 0) {
    growthPercent = 100;
  }

  // Filter Income based on Date Range
  const filteredIncome = income.filter(inc => {
    if (startDate && inc.date < startDate) return false;
    if (endDate && inc.date > endDate) return false;
    return true;
  });

  // Merged Transactions Feed
  const mergedTransactions = [
    ...processedExpenses.map(e => ({
      id: e.expenseId || e.id,
      title: e.title,
      amount: e.amount,
      date: e.date,
      type: 'expense',
      category: e.category
    })),
    ...filteredIncome.map(i => ({
      id: i.incomeId || i.id,
      title: i.source,
      amount: i.amount,
      date: i.date,
      type: 'income',
      category: 'Inflow / Tuition Fee'
    }))
  ];
  mergedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentTransactions = mergedTransactions.slice(0, 5);

  // Top 10 High Value Expenses
  const top10Expenses = [...activeExpenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);



  // Reset Filters helper
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategoryFilter('All');
    setGradeFilter('All');
    setDepartmentFilter('All');
    setExpenseTypeFilter('All');
    setHistoryPage(1);
    showToast('Dashboard filters cleared.');
  };

  // Unique categories list from expenses database
  const availableCategories = Array.from(new Set(expenses.filter(e => !e.deleted).map(e => e.category).filter(Boolean)));

  // Custom rounded top bar path builder (SVG)
  const drawRoundedBarPath = (x, y, w, h, radius) => {
    const r = Math.min(radius, w / 2, h);
    if (r <= 0) return `M ${x} ${y + h} L ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} Z`;
    return `
      M ${x} ${y + h}
      L ${x} ${y + r}
      A ${r} ${r} 0 0 1 ${x + r} ${y}
      L ${x + w - r} ${y}
      A ${r} ${r} 0 0 1 ${x + w} ${y + r}
      L ${x + w} ${y + h}
      Z
    `;
  };

  /* ============================================================
     1. CHART DATA - DAILY EXPENSE TREND
     ============================================================ */
  const trendDaysCount = getDaysInMonth(today.getFullYear(), today.getMonth());
  const trendData = Array.from({ length: trendDaysCount }, (_, idx) => {
    const dNum = idx + 1;
    const dStr = `${currentMonthStr}-${String(dNum).padStart(2, '0')}`;
    const total = activeExpenses.filter(e => e.date === dStr).reduce((sum, e) => sum + (e.amount || 0), 0);
    return { day: dNum, dateStr: dStr, amount: total };
  });

  const maxTrendVal = Math.max(...trendData.map(d => d.amount), 100);

  // SVG Trend dimensions
  const trendW = 600;
  const trendH = 220;
  const trendPadL = 65;
  const trendPadR = 25;
  const trendPadT = 20;
  const trendPadB = 40;
  const trendChartW = trendW - trendPadL - trendPadR;
  const trendChartH = trendH - trendPadT - trendPadB;

  const trendPoints = trendData.map((d, i) => {
    const x = trendPadL + (i / (trendDaysCount - 1)) * trendChartW;
    const y = (trendH - trendPadB) - (d.amount / maxTrendVal) * trendChartH;
    return { x, y, index: i, ...d };
  });

  const trendLinePath = trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const trendAreaPath = trendPoints.length > 0 ? `${trendLinePath} L ${trendPoints[trendPoints.length - 1].x} ${trendH - trendPadB} L ${trendPoints[0].x} ${trendH - trendPadB} Z` : '';

  /* ============================================================
     2. CHART DATA - MONTHLY COMPARISON
     ============================================================ */
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const prefix = `${currentYearStr}-${String(i + 1).padStart(2, '0')}`;
    const total = activeExpenses.filter(e => e.date?.startsWith(prefix)).reduce((sum, e) => sum + (e.amount || 0), 0);
    return { label: monthLabels[i], amount: total };
  });
  const maxMonthlyVal = Math.max(...monthlyData.map(m => m.amount), 100);

  // SVG Monthly dimensions
  const mChartW = 600;
  const mChartH = 220;
  const mPadL = 60;
  const mPadR = 20;
  const mPadT = 20;
  const mPadB = 40;
  const mAreaW = mChartW - mPadL - mPadR;
  const mAreaH = mChartH - mPadT - mPadB;
  const mBarW = mAreaW / 12 - 6;

  /* ============================================================
     3. CHART DATA - INCOME VS EXPENSE (6 MONTHS)
     ============================================================ */
  const getPast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const prefix = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push({ prefix, label });
    }
    return months;
  };
  const last6Months = getPast6Months();
  const incExpData = last6Months.map(({ prefix, label }) => {
    const expTotal = activeExpenses.filter(e => e.date?.startsWith(prefix)).reduce((sum, e) => sum + (e.amount || 0), 0);
    return { label, expense: expTotal };
  });
  const maxIncExpVal = Math.max(...incExpData.map(d => d.expense), 100);

  // SVG Expense dimensions
  const ieChartW = 600;
  const ieChartH = 220;
  const iePadL = 60;
  const iePadR = 20;
  const iePadT = 20;
  const iePadB = 40;
  const ieAreaW = ieChartW - iePadL - iePadR;
  const ieAreaH = ieChartH - iePadT - iePadB;
  const ieGroupW = ieAreaW / 6;
  const ieBarW = ieGroupW - 30; // wider bar since it is singular

  /* ============================================================
     4. CHART DATA - CATEGORY DISTRIBUTION (DONUT)
     ============================================================ */
  const donutR = 60;
  const donutC = 2 * Math.PI * donutR; // ~376.99
  let donutCumulativePct = 0;
  const donutSlices = donutSlicesVal => sortedCategories.map(([cat, val], idx) => {
    const pct = val / (totalSpend || 1);
    const dashArray = `${pct * donutC} ${donutC - (pct * donutC)}`;
    const dashOffset = -donutCumulativePct * donutC;
    donutCumulativePct += pct;
    return { cat, val, pct, dashArray, dashOffset, color: getCategoryColor(cat), index: idx };
  });
  donutCumulativePct = 0;
  const calculatedSlices = donutSlices();

  const activeDonutSlice = hoveredDonutIdx !== null ? calculatedSlices[hoveredDonutIdx] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      

      {/* 2. SIX PREMIUM KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        {/* Total Spend */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filtered Outlay</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <Wallet size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>₹{totalSpend.toLocaleString()}</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Sum of filtered expenditures</p>
          </div>
        </div>

        {/* Today's Spend */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Overhead Today</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>₹{todaySpend.toLocaleString()}</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Recorded on {today.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Current Month Spend */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly Spend</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>₹{monthlySpend.toLocaleString()}</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Current month: {today.toLocaleDateString(undefined, { month: 'long' })}</p>
          </div>
        </div>

        {/* Current Year Spend */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Yearly Spend</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
              <BarChart3 size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>₹{yearlySpend.toLocaleString()}</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Yearly cumulative total ({currentYearStr})</p>
          </div>
        </div>

        {/* Average Daily Spend */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Daily Burn Rate</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6' }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>₹{avgDailySpend.toLocaleString()}</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Avg daily spend in {today.toLocaleDateString(undefined, { month: 'short' })}</p>
          </div>
        </div>



      </div>

      {/* 3. DUAL GRID: CHARTS PANEL & DYNAMIC INSIGHTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* COLUMN 1: INTERACTIVE SVG CHARTS PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CHART 1: DAILY EXPENSE TREND */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <TrendingDown size={18} style={{ color: 'hsl(var(--color-danger))' }} /> Daily Spending Trend (Current Month)
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Peak Day: ₹{maxTrendVal.toLocaleString()}</span>
            </div>
            
            {/* SVG Graphic Area */}
            <div style={{ position: 'relative', width: '100%', height: `${trendH}px`, background: 'rgba(0,0,0,0.1)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
              
              {/* Tooltip Overlay */}
              {hoveredTrendPoint !== null && trendPoints[hoveredTrendPoint] && (
                <div style={{
                  position: 'absolute',
                  left: `${trendPoints[hoveredTrendPoint].x}px`,
                  top: `${trendPoints[hoveredTrendPoint].y - 50}px`,
                  transform: 'translateX(-50%)',
                  background: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  color: '#fff',
                  fontSize: '0.68rem',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 20
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{trendPoints[hoveredTrendPoint].dateStr}</span>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>₹{trendPoints[hoveredTrendPoint].amount.toLocaleString()}</span>
                </div>
              )}

              <svg 
                viewBox={`0 0 ${trendW} ${trendH}`} 
                width="100%" 
                height="100%"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const relativeX = (x / rect.width) * trendW;
                  const chartX = relativeX - trendPadL;
                  const index = Math.round((chartX / trendChartW) * (trendDaysCount - 1));
                  if (index >= 0 && index < trendDaysCount) {
                    setHoveredTrendPoint(index);
                  }
                }}
                onMouseLeave={() => setHoveredTrendPoint(null)}
              >
                <defs>
                  <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.00"/>
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                  const y = trendPadT + p * trendChartH;
                  const gridVal = Math.round(maxTrendVal * (1 - p));
                  return (
                    <g key={i}>
                      <line x1={trendPadL} y1={y} x2={trendW - trendPadR} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                      <text x={trendPadL - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="9" fontWeight="600">
                        ₹{gridVal >= 1000 ? (gridVal / 1000).toFixed(0) + 'K' : gridVal}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis labels (every 5 days) */}
                {trendPoints.filter((_, idx) => idx === 0 || (idx + 1) % 5 === 0 || idx === trendDaysCount - 1).map((p, i) => (
                  <g key={i}>
                    <line x1={p.x} y1={trendH - trendPadB} x2={p.x} y2={trendH - trendPadB + 4} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <text x={p.x} y={trendH - trendPadB + 16} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600">
                      Day {p.day}
                    </text>
                  </g>
                ))}

                {/* Area under curve */}
                {trendAreaPath && (
                  <path d={trendAreaPath} fill="url(#trendAreaGrad)" />
                )}

                {/* Main line path */}
                {trendLinePath && (
                  <path d={trendLinePath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                )}

                {/* Dots on nodes */}
                {trendPoints.map((p, i) => (
                  <circle 
                    key={i} 
                    cx={p.x} 
                    cy={p.y} 
                    r={hoveredTrendPoint === i ? 5 : 2} 
                    fill={hoveredTrendPoint === i ? '#ef4444' : 'rgba(255, 255, 255, 0.4)'}
                    stroke={hoveredTrendPoint === i ? '#fff' : 'none'}
                    strokeWidth="1.5"
                    style={{ transition: 'r 0.15s ease' }}
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* TWO CHART ROW: MONTHLY & INCOME VS EXPENSE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* CHART 2: MONTHLY COMPARISON */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 size={15} style={{ color: '#3b82f6' }} /> Monthly Comparison ({currentYearStr})
                </h4>
              </div>

              {/* Tooltip */}
              {hoveredMonthIdx !== null && monthlyData[hoveredMonthIdx] && (
                <div style={{
                  position: 'absolute',
                  left: `${mPadL + hoveredMonthIdx * (mAreaW / 12) + (mAreaW / 12) / 2}px`,
                  top: `${mPadT + (1 - monthlyData[hoveredMonthIdx].amount / maxMonthlyVal) * mAreaH - 35}px`,
                  transform: 'translateX(-50%)',
                  background: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: '#fff',
                  fontSize: '0.68rem',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                  zIndex: 20
                }}>
                  ₹{monthlyData[hoveredMonthIdx].amount.toLocaleString()}
                </div>
              )}

              <div style={{ width: '100%', height: `${mChartH}px` }}>
                <svg viewBox={`0 0 ${mChartW} ${mChartH}`} width="100%" height="100%">
                  <defs>
                    <linearGradient id="monthlyBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.3"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  {[0, 0.5, 1].map((p, i) => {
                    const y = mPadT + p * mAreaH;
                    const val = Math.round(maxMonthlyVal * (1 - p));
                    return (
                      <g key={i}>
                        <line x1={mPadL} y1={y} x2={mChartW - mPadR} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                        <text x={mPadL - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="9" fontWeight="600">
                          ₹{val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {monthlyData.map((d, i) => {
                    const barH = (d.amount / maxMonthlyVal) * mAreaH;
                    const x = mPadL + i * (mAreaW / 12) + 3;
                    const y = (mChartH - mPadB) - barH;
                    return (
                      <g key={i} 
                         onMouseEnter={() => setHoveredMonthIdx(i)}
                         onMouseLeave={() => setHoveredMonthIdx(null)}
                         style={{ cursor: 'pointer' }}
                      >
                        <path 
                          d={drawRoundedBarPath(x, y, mBarW, barH, 4)} 
                          fill={hoveredMonthIdx === i ? '#60a5fa' : 'url(#monthlyBarGrad)'} 
                          style={{ transition: 'all 0.2s ease' }}
                        />
                        <text x={x + mBarW / 2} y={mChartH - mPadB + 16} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="700">
                          {d.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* CHART 3: EXPENSE (6 MONTHS) */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingDown size={15} style={{ color: '#ef4444' }} /> Expense (6 Months)
                </h4>
              </div>
 
              {/* Tooltip */}
              {hoveredIncExpIdx !== null && incExpData[hoveredIncExpIdx] && (
                <div style={{
                  position: 'absolute',
                  left: `${iePadL + hoveredIncExpIdx * ieGroupW + ieGroupW / 2}px`,
                  top: `${(ieChartH - iePadB) - (incExpData[hoveredIncExpIdx].expense / maxIncExpVal) * ieAreaH - 35}px`,
                  transform: 'translateX(-50%)',
                  background: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  color: '#fff',
                  fontSize: '0.68rem',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                  zIndex: 20
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>{incExpData[hoveredIncExpIdx].label}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '2px', justifyContent: 'center' }}>
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>₹{incExpData[hoveredIncExpIdx].expense.toLocaleString()}</span>
                  </div>
                </div>
              )}
 
              <div style={{ width: '100%', height: `${ieChartH}px` }}>
                <svg viewBox={`0 0 ${ieChartW} ${ieChartH}`} width="100%" height="100%">
                  <defs>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85"/>
                      <stop offset="100%" stopColor="#dc2626" stopOpacity="0.3"/>
                    </linearGradient>
                  </defs>
 
                  {/* Grid lines */}
                  {[0, 0.5, 1].map((p, i) => {
                    const y = iePadT + p * ieAreaH;
                    const val = Math.round(maxIncExpVal * (1 - p));
                    return (
                      <g key={i}>
                        <line x1={iePadL} y1={y} x2={ieChartW - iePadR} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                        <text x={iePadL - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="9" fontWeight="600">
                          ₹{val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val}
                        </text>
                      </g>
                    );
                  })}
 
                  {/* Single Bars */}
                  {incExpData.map((d, i) => {
                    const expH = (d.expense / maxIncExpVal) * ieAreaH;
                    const x = iePadL + i * ieGroupW + (ieGroupW - ieBarW) / 2;
                    const y = (ieChartH - iePadB) - expH;
 
                    return (
                      <g key={i}
                         onMouseEnter={() => setHoveredIncExpIdx(i)}
                         onMouseLeave={() => setHoveredIncExpIdx(null)}
                         style={{ cursor: 'pointer' }}
                      >
                        {/* Expense Bar */}
                        <path 
                          d={drawRoundedBarPath(x, y, ieBarW, expH, 4)} 
                          fill={hoveredIncExpIdx === i ? '#f87171' : 'url(#expGrad)'} 
                          style={{ transition: 'all 0.2s ease' }}
                        />
                        {/* Label */}
                        <text x={iePadL + i * ieGroupW + ieGroupW / 2} y={ieChartH - iePadB + 16} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="700">
                          {d.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

          </div>

          {/* CHART 4: CATEGORY DISTRIBUTION (DONUT) */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PieChart size={15} style={{ color: 'hsl(var(--color-danger))' }} /> Category Allocation
            </h4>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center' }}>
              
              {/* SVG Donut */}
              <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <svg viewBox="0 0 160 160" width="100%" height="100%">
                  {calculatedSlices.length === 0 ? (
                    <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                  ) : (
                    calculatedSlices.map((s, idx) => (
                      <circle 
                        key={idx}
                        cx="80"
                        cy="80"
                        r={donutR}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={hoveredDonutIdx === idx ? 17 : 12}
                        strokeDasharray={s.dashArray}
                        strokeDashoffset={s.dashOffset}
                        transform="rotate(-90 80 80)"
                        onMouseEnter={() => setHoveredDonutIdx(idx)}
                        onMouseLeave={() => setHoveredDonutIdx(null)}
                        style={{ transition: 'stroke-width 0.15s ease', cursor: 'pointer' }}
                      />
                    ))
                  )}
                </svg>
                
                {/* Center Text Panel */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                    {activeDonutSlice ? activeDonutSlice.cat : 'Total Spend'}
                  </span>
                  <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                    ₹{activeDonutSlice ? activeDonutSlice.val.toLocaleString() : totalSpend.toLocaleString()}
                  </span>
                  {activeDonutSlice && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: activeDonutSlice.color, marginTop: '1px' }}>
                      {Math.round(activeDonutSlice.pct * 100)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Donut Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                {sortedCategories.slice(0, 5).map(([cat, val], idx) => {
                  const pct = Math.round((val / (totalSpend || 1)) * 100);
                  return (
                    <div 
                      key={cat} 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px', background: hoveredDonutIdx === idx ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                      onMouseEnter={() => setHoveredDonutIdx(idx)}
                      onMouseLeave={() => setHoveredDonutIdx(null)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getCategoryColor(cat), flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: hoveredDonutIdx === idx ? 'var(--text-main)' : 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{cat}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', marginLeft: '6px' }}>{pct}%</span>
                    </div>
                  );
                })}
                {sortedCategories.length > 5 && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '14px', marginTop: '2px' }}>
                    + {sortedCategories.length - 5} more categories
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* COLUMN 2: ANALYTICS & RECENT FEED */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* STATS HIGHLIGHTS CARD */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <TrendingDown size={17} style={{ color: 'hsl(var(--color-danger))' }} /> Financial Insights
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Category Peaks */}
              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.015)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Peak Expense Category</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{highestCategory[0]}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444' }}>₹{highestCategory[1].toLocaleString()}</span>
                </div>
              </div>

              {/* Category Troughs */}
              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.015)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lowest Expense Category</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{lowestCategory[0]}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>₹{lowestCategory[1].toLocaleString()}</span>
                </div>
              </div>

              {/* Month Growth Rate */}
              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.015)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Spending Growth %</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Month over Month (MoM)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyEnd: 'flex-end' }}>
                  {growthPercent >= 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#ef4444', fontWeight: 800, fontSize: '0.85rem' }}>
                      <ArrowUpRight size={14} /> +{growthPercent}%
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#10b981', fontWeight: 800, fontSize: '0.85rem' }}>
                      <ArrowDownRight size={14} /> {growthPercent}%
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* TOP 10 EXPENSES LIST */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, marginBottom: '14px' }}>
              <TrendingDown size={17} style={{ color: 'hsl(var(--color-danger))' }} /> Top 10 Major Vouchers
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
              {top10Expenses.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No ledger data matches filters.</div>
              ) : (
                top10Expenses.map((exp, idx) => (
                  <div 
                    key={exp.expenseId || exp.id} 
                    onClick={() => setSelectedVoucher(exp)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      paddingBottom: '8px', 
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', width: '18px' }}>#{idx + 1}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{exp.title}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{exp.category} • {exp.date}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginLeft: '8px' }}>₹{exp.amount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COMBINED RECENT TRANSACTIONS STREAM */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, marginBottom: '14px' }}>
              <ClipboardList size={17} style={{ color: 'hsl(var(--color-danger))' }} /> Ledger Transaction Stream
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentTransactions.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No activity records found.</div>
              ) : (
                recentTransactions.map((tx, idx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleSelectVoucher(tx)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '10px', 
                        borderRadius: '10px', 
                        background: 'rgba(255,255,255,0.005)', 
                        border: '1px solid rgba(255,255,255,0.02)',
                        cursor: tx.type === 'expense' ? 'pointer' : 'default'
                      }}
                    >
                      <div style={{
                        padding: '6px',
                        borderRadius: '8px',
                        background: isIncome ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isIncome ? '#10b981' : '#ef4444'
                      }}>
                        {isIncome ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{tx.title}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{tx.category} • {tx.date}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isIncome ? '#10b981' : '#ef4444' }}>
                          {isIncome ? '+' : '-'}₹{tx.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 5. VOUCHER AUDIT DETAILS MODAL Overlay */}
      {selectedVoucher && (
        <div className="modal-overlay" onClick={() => setSelectedVoucher(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            maxWidth: '520px', width: '90%', background: '#ffffff', borderRadius: '20px',
            border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Shield size={18} style={{ color: 'hsl(var(--color-danger))' }} /> Voucher Verification Details
              </h3>
              <button onClick={() => setSelectedVoucher(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
              {[
                ['Voucher Identifier', selectedVoucher.expenseId || selectedVoucher.id],
                ['Title / Purpose', selectedVoucher.title],
                ['Primary Category', selectedVoucher.category],
                ['Subcategory Tag', selectedVoucher.subcategory || 'General Overhead'],
                ['Total Requisition Value', `₹${selectedVoucher.amount?.toLocaleString()}`],
                ['Filing Date', selectedVoucher.date],
                ['Payment Type', selectedVoucher.expenseType || 'Operational'],
                ['School Grade Alloc', selectedVoucher.grade || 'Global / Schoolwide'],
                ['Department Owner', selectedVoucher.department || 'Global / Schoolwide'],
                ['Vendor Business Name', selectedVoucher.vendor?.name || 'Various / Internal'],
                ['Vendor Contact Mob', selectedVoucher.vendor?.contact || '—'],
                ['Vendor Email Addr', selectedVoucher.vendor?.email || '—'],
                ['Settlement Method', selectedVoucher.paymentDetails?.method || 'Cash'],
                ['Recorded By Agent', selectedVoucher.submittedBy || 'Accountant'],
                ['Remarks / Statement', selectedVoucher.remarks || '—']
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#475569', fontWeight: 600, flexShrink: 0, marginRight: '16px' }}>{k}</span>
                  <span style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function HistoryView({ expenses, expenseHistory, fetchExpenses, showToast, budgetLimit }) {
  const [historyTab, setHistoryTab] = useState('date');

  const todayStr = new Date().toLocaleDateString('en-CA');
  const currentMonthStr = todayStr.substring(0, 7);
  const currentYearStr = todayStr.substring(0, 4);

  const [selectedDateHistory, setSelectedDateHistory] = useState(todayStr);
  const [selectedMonthHistory, setSelectedMonthHistory] = useState(currentMonthStr);
  const [selectedYearHistory, setSelectedYearHistory] = useState(currentYearStr);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const exportHistoryCSV = () => {
    if (!filteredPeriodExpenses.length) return showToast('No items to export.', 'error');
    const headers = ['ID', 'Title', 'Category', 'Subcategory', 'Amount', 'Date', 'Vendor', 'Method', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredPeriodExpenses.map(e => [
        e.expenseId,
        `"${e.title}"`,
        e.category,
        e.subcategory || '',
        e.amount,
        e.date,
        `"${e.vendor?.name || ''}"`,
        e.paymentDetails?.method || '',
        e.deleted ? 'Deleted' : 'Active'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense_history_report_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('History ledger successfully downloaded as CSV.');
  };

  // Synchronized value change handlers
  const handleDateChange = (dateVal) => {
    if (dateVal > todayStr) {
      dateVal = todayStr;
    }
    setSelectedDateHistory(dateVal);
    if (dateVal) {
      setSelectedMonthHistory(dateVal.substring(0, 7));
      setSelectedYearHistory(dateVal.substring(0, 4));
    }
  };

  const handleMonthChange = (monthVal) => {
    if (monthVal > currentMonthStr) {
      monthVal = currentMonthStr;
    }
    setSelectedMonthHistory(monthVal);
    if (monthVal) {
      setSelectedYearHistory(monthVal.substring(0, 4));
      const daySuffix = selectedDateHistory ? selectedDateHistory.substring(8) : '01';
      let targetDate = `${monthVal}-${daySuffix}`;
      if (targetDate > todayStr) {
        targetDate = todayStr;
      }
      setSelectedDateHistory(targetDate);
    }
  };

  const handleYearChange = (yearVal) => {
    setSelectedYearHistory(yearVal);
    if (yearVal) {
      const monthSuffix = selectedMonthHistory ? selectedMonthHistory.substring(5, 7) : '01';
      const daySuffix = selectedDateHistory ? selectedDateHistory.substring(8) : '01';
      
      let targetMonth = `${yearVal}-${monthSuffix}`;
      if (targetMonth > currentMonthStr) {
        targetMonth = currentMonthStr;
      }
      setSelectedMonthHistory(targetMonth);
      
      let targetDate = `${yearVal}-${targetMonth.substring(5, 7)}-${daySuffix}`;
      if (targetDate > todayStr) {
        targetDate = todayStr;
      }
      setSelectedDateHistory(targetDate);
    }
  };

  // Compute available years dynamically from current year back to 2024
  const availableYears = [];
  const startYear = 2024;
  const currentYearNum = new Date().getFullYear();
  for (let y = currentYearNum; y >= startYear; y--) {
    availableYears.push(String(y));
  }

  // Filter expenses matching historical period
  const filteredPeriodExpenses = expenses.filter(e => {
    if (historyTab === 'date') return e.date === selectedDateHistory;
    if (historyTab === 'month') return e.date?.startsWith(selectedMonthHistory);
    if (historyTab === 'year') return e.date?.startsWith(selectedYearHistory);
    return false;
  });

  // Selected Day Calculations
  const daySnapshot = (expenseHistory || []).find(h => h.type === 'daily' && h.period === selectedDateHistory);
  const dayLive = expenses.filter(e => !e.deleted && e.date === selectedDateHistory).reduce((sum, e) => sum + (e.amount || 0), 0);
  const dayTotal = daySnapshot ? daySnapshot.totalAmount : dayLive;

  // Selected Month Calculations
  const monthSnapshot = (expenseHistory || []).find(h => h.type === 'monthly' && h.period === selectedMonthHistory);
  const monthLive = expenses.filter(e => !e.deleted && e.date?.startsWith(selectedMonthHistory)).reduce((sum, e) => sum + (e.amount || 0), 0);
  const monthTotal = monthSnapshot ? monthSnapshot.totalAmount : monthLive;

  // Selected Year Calculations
  const yearSnapshot = (expenseHistory || []).find(h => h.type === 'yearly' && h.period === selectedYearHistory);
  const yearLive = expenses.filter(e => !e.deleted && e.date?.startsWith(selectedYearHistory)).reduce((sum, e) => sum + (e.amount || 0), 0);
  const yearTotal = yearSnapshot ? yearSnapshot.totalAmount : yearLive;
  // Category-wise totals and colors for active period
  const periodActiveExpenses = filteredPeriodExpenses;
  const periodCategoryTotals = {};
  periodActiveExpenses.forEach(e => {
    if (e.deleted) return;
    const cat = e.category || 'Other';
    periodCategoryTotals[cat] = (periodCategoryTotals[cat] || 0) + (e.amount || 0);
  });
  const sortedPeriodCategories = Object.entries(periodCategoryTotals).sort((a, b) => b[1] - a[1]);
  const totalPeriodSpend = periodActiveExpenses.filter(e => !e.deleted).reduce((sum, e) => sum + (e.amount || 0), 0);

  const categoryColors = {
    'Office & Administrative': '#3b82f6',
    'Employee Welfare': '#8b5cf6',
    'Furniture & Equipment': '#06b6d4',
    'Building & Renovation': '#ec4899',
    'Utilities': '#eab308',
    'Transportation': '#14b8a6',
    'Maintenance & Repair': '#f97316',
    'Academic Expenses': '#10b981',
    'Events & Functions': '#a855f7',
    'Other Expenses': '#6b7280',
    'Salary': '#ef4444'
  };
  const getCategoryColor = (cat) => categoryColors[cat] || '#8b5cf6';

  const inputStyle = {
    padding: '11px 14px', background: 'var(--bg-form)',
    border: '1px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', width: '100%', boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Selection Control Panel */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <History size={18} style={{ color: 'hsl(var(--color-danger))' }} /> Expense History Filters
          </h3>
          
          {/* Tab Selectors */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            {['date', 'month', 'year'].map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setHistoryTab(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: historyTab === tab ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'transparent',
                  color: historyTab === tab ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'date' ? 'Day' : tab === 'month' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
          {/* Input Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Choose {historyTab === 'date' ? 'Target Date' : historyTab === 'month' ? 'Target Month' : 'Target Year'}
            </label>
            
            {historyTab === 'date' && (
              <input
                type="date"
                value={selectedDateHistory}
                onChange={(e) => handleDateChange(e.target.value)}
                max={new Date().toLocaleDateString('en-CA')}
                style={inputStyle}
              />
            )}
            
            {historyTab === 'month' && (
              <input
                type="month"
                value={selectedMonthHistory}
                onChange={(e) => handleMonthChange(e.target.value)}
                max={new Date().toLocaleDateString('en-CA').substring(0, 7)}
                style={inputStyle}
              />
            )}
            
            {historyTab === 'year' && (
              <select
                value={selectedYearHistory}
                onChange={(e) => handleYearChange(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            )}
          </div>

          {/* Quick Info text */}
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Historical Sync Active</span>
            <span>Historical snapshots are archived when the corresponding day, month, or fiscal year concludes. All records are securely synced in the centralized database.</span>
          </div>
        </div>
      </div>

      {/* KPI Cards & Category Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Card 1: Day Expense */}
        {historyTab === 'date' && (
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Day Expense ({selectedDateHistory})</span>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ef4444', margin: '2px 0' }}>
                ₹{dayTotal.toLocaleString()}
              </h3>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>
                Snapshot: ₹{daySnapshot ? daySnapshot.totalAmount.toLocaleString() : '0'} • Live: ₹{dayLive.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Card 2: Month Expense */}
        {historyTab === 'month' && (
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <TrendingDown size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Month Expense ({selectedMonthHistory})</span>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#3b82f6', margin: '2px 0' }}>
                ₹{monthTotal.toLocaleString()}
              </h3>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>
                Snapshot: ₹{monthSnapshot ? monthSnapshot.totalAmount.toLocaleString() : '0'} • Live: ₹{monthLive.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Card 3: Year Expense */}
        {historyTab === 'year' && (
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Wallet size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Year Expense ({selectedYearHistory})</span>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#a855f7', margin: '2px 0' }}>
                ₹{yearTotal.toLocaleString()}
              </h3>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>
                Snapshot: ₹{yearSnapshot ? yearSnapshot.totalAmount.toLocaleString() : '0'} • Live: ₹{yearLive.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Category Breakdown Card */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category Breakdown</span>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', margin: '2px 0 0 0' }}>Expenditures by category for this period</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '110px', overflowY: 'auto', paddingRight: '4px' }}>
            {sortedPeriodCategories.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>No category expenditures recorded.</div>
            ) : (
              sortedPeriodCategories.map(([cat, val]) => {
                const pct = totalPeriodSpend > 0 ? Math.round((val / totalPeriodSpend) * 100) : 0;
                const color = getCategoryColor(cat);
                return (
                  <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>₹{val.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* General Ledger Table Card */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <ClipboardList size={18} style={{ color: 'hsl(var(--color-danger))' }} /> Recorded General Ledger For Period ({filteredPeriodExpenses.length})
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={exportHistoryCSV}
              className="btn-secondary"
              style={{
                padding: '8px 14px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem'
              }}
            >
              <Download size={13} /> Export CSV
            </button>
            <button 
              onClick={() => window.print()}
              className="btn-secondary"
              style={{
                padding: '8px 14px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem'
              }}
            >
              Print Ledger
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['ID', 'Expense Title', 'Category', 'Vendor', 'Amount', 'Date', 'Method', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPeriodExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No recorded operational expenses found in this fiscal period.
                  </td>
                </tr>
              ) : (
                filteredPeriodExpenses.map((exp, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.15s', opacity: exp.deleted ? 0.65 : 1 }}>
                    <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--color-danger))' }}>{exp.expenseId}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', textDecoration: exp.deleted ? 'line-through' : 'none' }}>
                      {exp.title}
                      {exp.deleted && (
                        <span style={{ fontSize: '0.62rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontWeight: 700 }}>Deleted</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: exp.deleted ? 'line-through' : 'none' }}>{exp.category}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: exp.deleted ? 'line-through' : 'none' }}>{exp.vendor?.name || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', textDecoration: exp.deleted ? 'line-through' : 'none' }}>₹{exp.amount?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: exp.deleted ? 'line-through' : 'none' }}>{exp.date}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: exp.deleted ? 'line-through' : 'none' }}>{exp.paymentDetails?.method || 'Cash'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button 
                        onClick={() => setSelectedExpense(exp)}
                        style={{
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                          color: '#3b82f6', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center'
                        }}
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedExpense && (
        <div className="modal-overlay" onClick={() => setSelectedExpense(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            maxWidth: '520px', width: '90%', background: '#ffffff', borderRadius: '20px',
            border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Shield size={18} style={{ color: 'hsl(var(--color-danger))' }} /> Voucher History Log Details
              </h3>
              <button onClick={() => setSelectedExpense(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
              {[
                ['Voucher Identifier', selectedExpense.expenseId || selectedExpense.id],
                ['Title / Purpose', selectedExpense.title],
                ['Primary Category', selectedExpense.category],
                ['Subcategory Tag', selectedExpense.subcategory || 'General Overhead'],
                ['Total Requisition Value', `₹${selectedExpense.amount?.toLocaleString()}`],
                ['Filing Date', selectedExpense.date],
                ['Payment Type', selectedExpense.expenseType || 'Operational'],
                ['School Grade Alloc', selectedExpense.grade || 'Global / Schoolwide'],
                ['Department Owner', selectedExpense.department || 'Global / Schoolwide'],
                ['Vendor Business Name', selectedExpense.vendor?.name || 'Various / Internal'],
                ['Vendor Contact Mob', selectedExpense.vendor?.contact || '—'],
                ['Vendor Email Addr', selectedExpense.vendor?.email || '—'],
                ['Settlement Method', selectedExpense.paymentDetails?.method || 'Cash'],
                ['Reference ID', selectedExpense.paymentDetails?.transactionId || '—'],
                ['Invoice Number', selectedExpense.paymentDetails?.invoiceNumber || '—'],
                ['Recorded By Agent', selectedExpense.submittedBy || 'Accountant'],
                ['Remarks / Statement', selectedExpense.remarks || '—']
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#475569', fontWeight: 600, flexShrink: 0, marginRight: '16px' }}>{k}</span>
                  <span style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
