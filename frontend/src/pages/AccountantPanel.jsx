import React, { useState, useEffect } from 'react';
import './AccountantPanel.css';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard, DollarSign, CreditCard, Users, UserCheck, TrendingUp, TrendingDown,
  PieChart, FileText, Download, Search, Filter, Plus, CheckCircle, AlertCircle,
  Loader2, Calculator, Receipt, Wallet, Building2, ArrowUpRight, ArrowDownRight,
  ChevronDown, Printer, X, IndianRupee, BookOpen, Banknote, HandCoins, CircleDollarSign,
  ClipboardList, BarChart3, Calendar, Eye, UserCog, UserPlus, Pencil, Trash2, LogOut,
  RefreshCw, History
} from 'lucide-react';

import StudentDirectory from './StudentDirectory';
import { fetchActiveGrades, fetchActiveSections } from '../utils/grades';
import { hasPermission } from '../utils/permissions';

function ConfirmDialog({ show, message, onConfirm, onCancel }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
        width: '100%', maxWidth: '400px', background: 'var(--bg-elevated)', borderRadius: '16px',
        border: '1px solid var(--border-glass)', padding: '28px', boxShadow: 'var(--shadow-lg)',
        textAlign: 'center'
      }}>
        <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '12px' }} />
        <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600, margin: '0 0 20px 0', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{
            padding: '10px 24px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
            borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            padding: '10px 24px', background: '#ef4444', border: 'none',
            borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
          }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
import StaffDirectory from './StaffDirectory';
import EmployeeDirectory from './EmployeeDirectory';
import RegisterStudent from './RegisterStudent';
import AddStaff from './AddStaff';
import AddEmployee from './AddEmployee';

export default function AccountantPanel({ setActiveView, onLogout, accountantView, setAccountantView, onBackToMain }) {
  const [notification, setNotification] = useState(null);
  const showToast = (message, type = 'success') => {
    if (type === 'success' || type === 'info') return;
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const renderContent = () => {
    switch (accountantView) {
      case 'dashboard': return <DashboardView setAccountantView={setAccountantView} />;
      case 'collect-fees': return <CollectFeesView showToast={showToast} />;
      case 'fee-structure': return <FeeStructureView showToast={showToast} />;
      case 'fees-history': return <CollectFeesView showToast={showToast} readOnly={true} />;
      case 'staff-payroll-hub': return <PayrollHub title="Staff" type="Staff" showToast={showToast} />;
      case 'teacher-payroll-hub': return <PayrollHub title="Teacher" type="Teacher" showToast={showToast} />;
      case 'employee-payroll-hub': return <PayrollHub title="Employee" type="Employee" showToast={showToast} />;
      case 'staff-payroll': return <PayrollView showToast={showToast} type="Staff" />;
      case 'staff-pay-structure': return <StaffPaymentStructureView showToast={showToast} type="Staff" />;
      case 'teacher-payroll': return <PayrollView showToast={showToast} type="Teacher" />;
      case 'teacher-pay-structure': return <TeacherSalaryStructureView showToast={showToast} />;
      case 'employee-payroll': return <StaffPaymentsView showToast={showToast} />;
      case 'employee-pay-structure': return <StaffPaymentStructureView showToast={showToast} type="Employee" />;

      case 'expenses': return <ExpensesView showToast={showToast} />;
      case 'reports': return <ReportsView showToast={showToast} />;
      case 'students': return <StudentDirectory />;
      case 'staff-directory': return <StaffDirectory setActiveView={setActiveView} readOnly={true} />;
      case 'employees': return <EmployeeDirectory readOnly={true} />;
      case 'register-student':
        return <RegisterStudent setActiveView={(view) => { if (view === 'students') setAccountantView('students'); else setActiveView(view); }} />;
      case 'add-staff':
        return <AddStaff setActiveView={(view) => { if (view === 'staff' || view === 'staff-directory') setAccountantView('staff-directory'); else setActiveView(view); }} />;
      case 'add-employee':
        return <AddEmployee setActiveView={(view) => { if (view === 'employees') setAccountantView('employees'); else setActiveView(view); }} />;
      default: return <DashboardView setAccountantView={setAccountantView} />;
    }
  };

  return (
    <div className="finance-subadmin animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', borderRadius: '12px',
          background: notification.type === 'success' ? '#10b981' : '#ef4444', color: '#fff',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center',
          gap: '10px', zIndex: 999999, fontWeight: 600, animation: 'slideInRight 0.3s ease forwards'
        }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-panel-header glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981'
          }}>
            <Calculator size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{accountantView === 'dashboard' ? 'Finance Panel' :
              accountantView === 'collect-fees' ? 'Student Fee Collection' :
              accountantView === 'fee-structure' ? 'Fee Structure Configuration' :
              accountantView === 'fees-history' ? 'Fees Payment History' :
              accountantView === 'staff-payroll' ? 'Staff Payroll' :
              accountantView === 'staff-pay-structure' ? 'Staff Pay Structure' :
              accountantView === 'teacher-payroll' ? 'Teacher Payroll' :
              accountantView === 'teacher-pay-structure' ? 'Teacher Pay Structure' :
              accountantView === 'employee-payroll' ? 'Employee Payroll' :
              accountantView === 'employee-pay-structure' ? 'Employee Pay Structure' :
              accountantView === 'payroll-history' ? 'Payroll History' :
              accountantView === 'expenses' ? 'Expense Tracker' :
              accountantView === 'reports' ? 'Financial Reports' :
              accountantView === 'students' ? 'Student Directory' :
              accountantView === 'teacher-list' ? 'Staff Directory' :
              accountantView === 'staff' ? 'Employee Directory' :
              accountantView === 'register-student' ? 'Register Student' :
              accountantView === 'add-teacher' ? 'Add Staff' :
              accountantView === 'add-staff' ? 'Add Employee' : 'Student Fee Collection'}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Comprehensive financial management and accounting portal
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)', padding: '6px 16px', borderRadius: '30px',
            border: '1px solid rgba(16, 185, 129, 0.15)', fontSize: '0.78rem', fontWeight: 600, color: '#10b981'
          }}>
            FY 2026-2027
          </div>

        </div>
      </div>

      {renderContent()}
    </div>
  );
}

/* ============================================================
   DASHBOARD VIEW - Overview cards + charts
   ============================================================ */
function DashboardView({ setAccountantView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/finance/overview')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '12px' }}>
      <Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} />
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading financial data...</p>
    </div>
  );

  const cards = [
    { label: 'Total Fee Collection', value: `₹${(data?.totalFeeCollected || 0).toLocaleString()}`, icon: IndianRupee, color: '#10b981', bg: 'rgba(16,185,129,0.08)', trend: '0.0%', up: true },
    { label: 'Pending Fees', value: `₹${(data?.totalPendingFees || 0).toLocaleString()}`, icon: AlertCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', trend: `0 records`, up: false },
    { label: 'Monthly Expenses', value: `₹${(data?.totalExpenses || 0).toLocaleString()}`, icon: TrendingDown, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', trend: '0.0%', up: false },
    { label: 'Net Profit', value: `₹${(data?.netProfit || 0).toLocaleString()}`, icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', trend: '0.0%', up: true },
    { label: 'Total Payroll Paid', value: `₹${(data?.totalPayrollPaid || 0).toLocaleString()}`, icon: Banknote, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', trend: `0 staff`, up: true },
  ];



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-panel" style={{
              padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
              background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.25s ease', cursor: 'default'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = `${card.color}33`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px', background: card.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={22} style={{ color: card.color }} />
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, color: card.up ? '#10b981' : '#f59e0b',
                  display: 'flex', alignItems: 'center', gap: '2px', background: card.up ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                  padding: '3px 8px', borderRadius: '20px'
                }}>
                  {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {card.trend}
                </span>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{card.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Redesigned Structured Actions Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Row 1: Student Fees Management */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Receipt size={16} /> Student Fees Management
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <button onClick={() => setAccountantView('collect-fees')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(16,185,129,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#10b981', color: '#fff' }}><Receipt size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Collect Fees</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Log student tuition payments</div>
              </div>
            </button>
            <button onClick={() => setAccountantView('fee-structure')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(16,185,129,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#10b981', color: '#fff' }}><BookOpen size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Fee Structure</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Define grade fee categories</div>
              </div>
            </button>
          </div>
        </div>

        {/* Row 2: Staff payroll & structure */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#8b5cf6', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} /> Staff Payroll & HR
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <button onClick={() => setAccountantView('staff-payroll')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(139,92,246,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#8b5cf6', color: '#fff' }}><Banknote size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Staff Payroll</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Disburse staff salary slips</div>
              </div>
            </button>
            <button onClick={() => setAccountantView('staff-pay-structure')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(139,92,246,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#8b5cf6', color: '#fff' }}><Calculator size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Staff Pay Structure</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Define staff basic allowances</div>
              </div>
            </button>
          </div>
        </div>

        {/* Row 3: Teacher payroll & structure */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#3b82f6', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={16} /> Teacher Payroll & HR
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <button onClick={() => setAccountantView('teacher-payroll')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(59,130,246,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#3b82f6', color: '#fff' }}><Banknote size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Teacher Payroll</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Disburse teacher monthly salary</div>
              </div>
            </button>
            <button onClick={() => setAccountantView('teacher-pay-structure')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(59,130,246,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#3b82f6', color: '#fff' }}><Calculator size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Teacher Pay Structure</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Configure teacher wage grades</div>
              </div>
            </button>
          </div>
        </div>

        {/* Row 4: Employee payroll & structure */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#ec4899', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCog size={16} /> Employee Payroll & HR
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <button onClick={() => setAccountantView('employee-payroll')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(236,72,153,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#ec4899', color: '#fff' }}><UserCog size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Employee Payroll</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pay support/admin workers</div>
              </div>
            </button>
            <button onClick={() => setAccountantView('employee-pay-structure')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(236,72,153,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#ec4899', color: '#fff' }}><Calculator size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Employee Pay Structure</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Configure operational pay rules</div>
              </div>
            </button>
          </div>
        </div>


        {/* Row 6: Administrative Operations & Directories */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#06b6d4', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCog size={16} /> Operations & Directories
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <button onClick={() => setAccountantView('expenses')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(239,68,68,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#ef4444', color: '#fff' }}><TrendingDown size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Add Expense</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Log school outflow vouchers</div>
              </div>
            </button>
            <button onClick={() => setAccountantView('reports')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(6,182,212,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#06b6d4', color: '#fff' }}><BarChart3 size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>View Reports</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cashflow charts & stats</div>
              </div>
            </button>
            <button onClick={() => setAccountantView('students')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(20,184,166,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#14b8a6', color: '#fff' }}><Users size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Student Directory</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>View student details</div>
              </div>
            </button>
            <button onClick={() => setAccountantView('teacher-list')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(249,115,22,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#f97316', color: '#fff' }}><UserCheck size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Staff Directory</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>View school teachers list</div>
              </div>
            </button>
            <button onClick={() => setAccountantView('staff')} className="btn-payroll-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(168,85,247,0.04)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: '#a855f7', color: '#fff' }}><UserCog size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Employee Directory</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>View school employees list</div>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Revenue Chart (CSS-based bar chart) */}
      {data?.monthlyData && data.monthlyData.length > 0 && (
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: '#10b981' }} /> Monthly Revenue vs Expenses (Last 6 Months)
          </h3>
          {(!data || (data.totalFeeCollected === 0 && data.totalExpenses === 0)) ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>No data available</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Data will appear once records are added</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '200px', padding: '0 10px' }}>
                {data.monthlyData.map((m, i) => {
                  const maxVal = Math.max(...data.monthlyData.map(d => Math.max(d.fees, d.expenses, 1)));
                  const feeH = maxVal > 0 ? (m.fees / maxVal) * 160 : 4;
                  const expH = maxVal > 0 ? (m.expenses / maxVal) * 160 : 4;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '170px' }}>
                        <div style={{
                          width: '20px', height: `${Math.max(feeH, 4)}px`, borderRadius: '4px 4px 0 0',
                          background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', transition: 'height 0.5s ease',
                          minHeight: '4px'
                        }} title={`Fees: ₹${m.fees.toLocaleString()}`} />
                        <div style={{
                          width: '20px', height: `${Math.max(expH, 4)}px`, borderRadius: '4px 4px 0 0',
                          background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)', transition: 'height 0.5s ease',
                          minHeight: '4px'
                        }} title={`Expenses: ₹${m.expenses.toLocaleString()}`} />
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '24px', marginTop: '16px', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} /> Revenue
                </span>
                <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }} /> Expenses
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   COLLECT FEES VIEW
   ============================================================ */
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
  const tokens = clean.split(/[\s()\-]+/);
  return tokens.some(t => ['11', '12', 'XI', 'XII'].includes(t));
};

export function CollectFeesView({ showToast, readOnly = false }) {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/school')
      .then(r => r.json())
      .then(d => setSchoolInfo(d))
      .catch(() => {});
  }, []);
  const [feeStructures, setFeeStructures] = useState([]);
  const [feePeriods, setFeePeriods] = useState([]);
  const [expandedStudents, setExpandedStudents] = useState({});
  const [showMonthRangeModal, setShowMonthRangeModal] = useState(false);
  const [newPeriodFreq, setNewPeriodFreq] = useState('Quarterly');
  const [newPeriodName, setNewPeriodName] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    studentId: '', studentName: '', admissionNumber: '', studentClass: '', section: '',
    feeType: 'Tuition Fee', amount: '', discount: '0', fine: '0', paidAmount: '', paymentMethod: 'Cash', remarks: '',
    billingPeriod: 'Yearly', isCollectDue: false
  });
  const [receiptData, setReceiptData] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedFormGrade, setSelectedFormGrade] = useState('');
  const [selectedFormSection, setSelectedFormSection] = useState('');
  const [selectedFormDept, setSelectedFormDept] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingPeriodComponents, setEditingPeriodComponents] = useState([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [isPaidAmountEdited, setIsPaidAmountEdited] = useState(false);
  const [collectDueState, setCollectDueState] = useState(null);
  // collectDueState: { period, detailsStudent, tuitionDue, transportDue, otherDue, paymentMethod, remarks, fine } | null
  const [selectedDetailsStudentId, setSelectedDetailsStudentId] = useState(null);
  const [sectionTab, setSectionTab] = useState('due'); // 'due', 'completed'

  const [tuitionAmount, setTuitionAmount] = useState('');
  const [transportAmount, setTransportAmount] = useState('');
  const [otherAmount, setOtherAmount] = useState('');

  useEffect(() => {
    if (!showForm) {
      setStudentSearchQuery('');
      setShowStudentDropdown(false);
      setSelectedFormGrade('');
      setSelectedFormSection('');
      setSelectedFormDept('');
      setEditingId(null);
      setEditingPeriodComponents([]);
      setIsPaidAmountEdited(false);
      setTuitionAmount('');
      setTransportAmount('');
      setOtherAmount('');
      setForm({
        studentId: '', studentName: '', admissionNumber: '', studentClass: '', section: '',
        feeType: 'Tuition Fee', amount: '', discount: '0', fine: '0', paidAmount: '', paymentMethod: 'Cash', remarks: '',
        billingPeriod: 'Yearly'
      });
    } else {
      fetchStudents();
    }
  }, [showForm]);

  const [activeGrades, setActiveGrades] = useState([]);
  const [activeSections, setActiveSections] = useState([]);

  useEffect(() => {
    const loadGradesAndSections = async () => {
      const [grades, secs] = await Promise.all([
        fetchActiveGrades(),
        fetchActiveSections()
      ]);
      setActiveGrades(grades);
      setActiveSections(secs);
    };
    loadGradesAndSections();
  }, []);

  const classes = activeGrades.map(g => g.name);
  const feeTypes = ['Tuition Fee', 'Transport Fee', 'Other Charges'];

  const uniqueBaseGrades = [...new Set(activeGrades.map(g => parseGradeName(g.name).baseGrade))];
  const departmentsForSelectedGrade = activeGrades
    .filter(g => parseGradeName(g.name).baseGrade === selectedFormGrade)
    .map(g => parseGradeName(g.name).department)
    .filter(Boolean);

  const allowedSectionsForForm = React.useMemo(() => {
    if (!selectedFormGrade) {
      return activeSections.map(s => s.name);
    }
    const matchingGrades = activeGrades.filter(g => {
      const parsed = parseGradeName(g.name);
      if (parsed.baseGrade !== selectedFormGrade) return false;
      if (selectedFormDept && parsed.department !== selectedFormDept) return false;
      return true;
    });
    const sectionsUnion = new Set();
    matchingGrades.forEach(g => {
      if (g.sections) {
        g.sections.forEach(sec => sectionsUnion.add(sec));
      }
    });
    return Array.from(sectionsUnion);
  }, [selectedFormGrade, selectedFormDept, activeGrades, activeSections]);

  useEffect(() => {
    if (selectedFormSection && !allowedSectionsForForm.includes(selectedFormSection)) {
      setSelectedFormSection('');
    }
  }, [selectedFormGrade, selectedFormDept, allowedSectionsForForm, selectedFormSection]);

  const allowedSectionsForFilter = React.useMemo(() => {
    if (filterClass === 'All') {
      return activeSections.map(s => s.name);
    }
    const matchingGrades = activeGrades.filter(g => {
      const parsed = parseGradeName(g.name);
      return parsed.baseGrade === filterClass;
    });
    const sectionsUnion = new Set();
    matchingGrades.forEach(g => {
      if (g.sections) {
        g.sections.forEach(sec => sectionsUnion.add(sec));
      }
    });
    return Array.from(sectionsUnion);
  }, [filterClass, activeGrades, activeSections]);

  useEffect(() => {
    if (filterSection !== 'All' && !allowedSectionsForFilter.includes(filterSection)) {
      setFilterSection('All');
    }
  }, [filterClass, allowedSectionsForFilter, filterSection]);

  const fetchFees = () => {
    const params = new URLSearchParams();
    if (filterClass !== 'All') {
      if (isGrade11or12(filterClass)) {
        if (filterDept !== 'All') {
          params.set('studentClass', `${filterClass} (${filterDept})`);
        }
      } else {
        params.set('studentClass', filterClass);
      }
    }
    if (filterStatus !== 'All') params.set('status', filterStatus);
    fetch(`/api/finance/fees?${params}`)
      .then(r => r.json())
      .then(d => {
        let filtered = d;
        if (filterClass !== 'All' && isGrade11or12(filterClass) && filterDept === 'All') {
          filtered = d.filter(f => parseGradeName(f.studentClass || f.classId).baseGrade === filterClass);
        }
        if (filterSection !== 'All') {
          filtered = filtered.filter(f => f.section === filterSection);
        }
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          filtered = filtered.filter(f => 
            f.studentName?.toLowerCase().startsWith(q)
          );
        }
        setFees(filtered);
        setLoading(false);
      })
      .catch(() => {
        setFees([]);
        setLoading(false);
      });
  };

  const fetchStudents = () => {
    fetch('/api/students?limit=1000')
      .then(r => r.json())
      .then(d => setStudents(d.students || []))
      .catch(() => {});

    fetch('/api/finance/fee-structures')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setFeeStructures(d);
        } else {
          setFeeStructures([]);
        }
      })
      .catch(() => setFeeStructures([]));

    fetch('/api/finance/fee-periods')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setFeePeriods(d);
        } else {
          setFeePeriods([]);
        }
      })
      .catch(() => setFeePeriods([]));
  };

  useEffect(() => { fetchFees(); fetchStudents(); }, [filterClass, filterDept, filterSection, filterStatus]);

  useEffect(() => {
    if (!form.studentId) {
      const targetClass = (isGrade11or12(selectedFormGrade) && selectedFormDept)
        ? `${selectedFormGrade} (${selectedFormDept})`
        : selectedFormGrade;

      if (targetClass) {
        const classStructures = feeStructures.filter(f => 
          parseGradeName(f.studentClass || '').baseGrade.toLowerCase() === targetClass.toLowerCase()
        );
        const fstr = classStructures[0];
        const freq = fstr ? (fstr.frequency || 'Yearly') : 'Yearly';
        const bpOptions = getBillingPeriodOptions(freq);
        const defaultBp = bpOptions[0] || 'Full Year';

        const matchedFstr = classStructures.find(f => f.monthRange === defaultBp) || fstr;
        let tAmt = 0;
        let trAmt = 0;
        let oAmt = 0;
        if (matchedFstr) {
          tAmt = matchedFstr.tuitionFee || 0;
          trAmt = matchedFstr.transportFee || 0;
          oAmt = matchedFstr.otherCharges || 0;
        }

        const calcTuition = getCalculatedAmount(tAmt, freq, !!(matchedFstr && matchedFstr.monthRange));
        const calcTransport = getCalculatedAmount(trAmt, freq, !!(matchedFstr && matchedFstr.monthRange));
        const calcOther = getCalculatedAmount(oAmt, freq, !!(matchedFstr && matchedFstr.monthRange));

        setTuitionAmount(tAmt ? String(calcTuition) : '');
        setTransportAmount(trAmt ? String(calcTransport) : '');
        setOtherAmount(oAmt ? String(calcOther) : '');

        const baseTotal = calcTuition + calcTransport + calcOther;
        const totalAmount = baseTotal + (Number(form.fine) || 0);

        setForm(prev => ({
          ...prev,
          amount: String(baseTotal),
          paidAmount: String(totalAmount),
          billingPeriod: defaultBp
        }));
        setIsPaidAmountEdited(false);
      } else {
        setTuitionAmount('');
        setTransportAmount('');
        setOtherAmount('');
        setForm(prev => ({
          ...prev,
          amount: '',
          paidAmount: '',
          billingPeriod: 'Yearly'
        }));
        setIsPaidAmountEdited(false);
      }
    }
  }, [selectedFormGrade, selectedFormDept, feeStructures]);

  const getBillingPeriodOptions = (frequency) => {
    if (frequency === 'Monthly') {
      return [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
    }
    const customPeriods = feePeriods.filter(fp => fp.frequency === frequency).map(fp => fp.name);
    if (customPeriods.length > 0) return customPeriods;
    if (frequency === 'Quarterly') {
      return [];
    } else if (frequency === 'Half-Yearly') {
      return [];
    } else {
      return ['Full Year'];
    }
  };

  const getCalculatedAmount = (baseAmount, frequency, hasMonthRange = false) => {
    const amt = Number(baseAmount) || 0;
    if (hasMonthRange) return amt;
    if (frequency === 'Monthly') return Math.round(amt / 12);
    if (frequency === 'Quarterly') return Math.round(amt / 4);
    if (frequency === 'Half-Yearly') return Math.round(amt / 2);
    return amt;
  };

  const selectStudent = (stu) => {
    if (stu) {
      const parsed = parseGradeName(stu.studentClass);
      setSelectedFormGrade(parsed.baseGrade);
      setSelectedFormSection(stu.section);
      setSelectedFormDept(parsed.department);

      const studentBase = parseGradeName(stu.studentClass || '').baseGrade.toLowerCase();
      const classStructures = feeStructures.filter(f => 
        parseGradeName(f.studentClass || '').baseGrade.toLowerCase() === studentBase
      );
      const fstr = classStructures[0];
      const freq = fstr ? (fstr.frequency || 'Yearly') : 'Yearly';
      const bpOptions = getBillingPeriodOptions(freq);
      const defaultBp = bpOptions[0] || 'Full Year';

      const matchedFstr = classStructures.find(f => f.monthRange === defaultBp) || fstr;
      let tAmt = 0;
      let trAmt = 0;
      let oAmt = 0;
      if (matchedFstr) {
        tAmt = matchedFstr.tuitionFee || 0;
        trAmt = matchedFstr.transportFee || 0;
        oAmt = matchedFstr.otherCharges || 0;
      }

      const calcTuition = getCalculatedAmount(tAmt, freq, !!(matchedFstr && matchedFstr.monthRange));
      const calcTransport = getCalculatedAmount(trAmt, freq, !!(matchedFstr && matchedFstr.monthRange));
      const calcOther = getCalculatedAmount(oAmt, freq, !!(matchedFstr && matchedFstr.monthRange));

      setTuitionAmount(tAmt ? String(calcTuition) : '');
      setTransportAmount(trAmt ? String(calcTransport) : '');
      setOtherAmount(oAmt ? String(calcOther) : '');

      const baseTotal = calcTuition + calcTransport + calcOther;
      const totalAmount = baseTotal + (Number(form.fine) || 0);

      setForm(prev => ({
        ...prev,
        studentId: stu.id,
        studentName: stu.fullName || stu.name,
        admissionNumber: stu.admissionNumber,
        studentClass: stu.studentClass,
        section: stu.section,
        amount: String(baseTotal),
        paidAmount: String(totalAmount),
        billingPeriod: defaultBp
      }));
      setIsPaidAmountEdited(false);
      setStudentSearchQuery(stu.fullName || stu.name);
      setShowStudentDropdown(false);
    } else {
      setTuitionAmount('');
      setTransportAmount('');
      setOtherAmount('');
      setForm(prev => ({
        ...prev,
        studentId: '',
        studentName: '',
        admissionNumber: '',
        studentClass: '',
        section: '',
        amount: '',
        paidAmount: '',
        billingPeriod: 'Yearly'
      }));
      setIsPaidAmountEdited(false);
      setStudentSearchQuery('');
      setShowStudentDropdown(false);
    }
  };

  const handleStudentSelect = (e) => {
    const stu = students.find(s => s.id === e.target.value);
    selectStudent(stu);
  };

  const handleBillingPeriodChange = (newBp) => {
    const stu = students.find(s => s.id === form.studentId);
    let tAmt = 0;
    let trAmt = 0;
    let oAmt = 0;
    let freq = 'Yearly';
    let matchedFstr = null;
    if (stu) {
      const studentBase = parseGradeName(stu.studentClass || '').baseGrade.toLowerCase();
      const classStructures = feeStructures.filter(f => 
        parseGradeName(f.studentClass || '').baseGrade.toLowerCase() === studentBase
      );
      matchedFstr = classStructures.find(f => f.monthRange === newBp) || classStructures[0];
      if (matchedFstr) {
        freq = matchedFstr.frequency || 'Yearly';
        tAmt = matchedFstr.tuitionFee || 0;
        trAmt = matchedFstr.transportFee || 0;
        oAmt = matchedFstr.otherCharges || 0;
      }
    }
    const calcTuition = getCalculatedAmount(tAmt, freq, !!(matchedFstr && matchedFstr.monthRange));
    const calcTransport = getCalculatedAmount(trAmt, freq, !!(matchedFstr && matchedFstr.monthRange));
    const calcOther = getCalculatedAmount(oAmt, freq, !!(matchedFstr && matchedFstr.monthRange));

    setTuitionAmount(tAmt ? String(calcTuition) : '');
    setTransportAmount(trAmt ? String(calcTransport) : '');
    setOtherAmount(oAmt ? String(calcOther) : '');

    const baseTotal = calcTuition + calcTransport + calcOther;
    const totalAmount = baseTotal + (Number(form.fine) || 0);

    setForm(prev => ({
      ...prev,
      billingPeriod: newBp,
      amount: String(baseTotal),
      paidAmount: String(totalAmount)
    }));
    setIsPaidAmountEdited(false);
  };

  const updateFormFields = (updates) => {
    setForm(prev => {
      const currentAmount = updates.amount !== undefined ? updates.amount : prev.amount;
      const currentDiscount = updates.discount !== undefined ? updates.discount : prev.discount;
      const currentFine = updates.fine !== undefined ? updates.fine : prev.fine;
      
      const newTotal = (Number(currentAmount) || 0) - (Number(currentDiscount) || 0) + (Number(currentFine) || 0);
      
      let newPaidAmount = prev.paidAmount;
      if (!isPaidAmountEdited || prev.paidAmount === '' || prev.paidAmount === '0') {
        newPaidAmount = String(newTotal);
      }
      
      return {
        ...prev,
        ...updates,
        paidAmount: newPaidAmount
      };
    });
  };

  const handleAmountChange = (type, val) => {
    let tAmt = type === 'Tuition Fee' ? val : tuitionAmount;
    let trAmt = type === 'Transport Fee' ? val : transportAmount;
    let oAmt = type === 'Other Charges' ? val : otherAmount;
    
    if (type === 'Tuition Fee') setTuitionAmount(val);
    else if (type === 'Transport Fee') setTransportAmount(val);
    else if (type === 'Other Charges') setOtherAmount(val);

    const baseTotal = (Number(tAmt) || 0) + (Number(trAmt) || 0) + (Number(oAmt) || 0);
    const totalAmount = baseTotal + (Number(form.fine) || 0);
    
    setForm(prev => ({
      ...prev,
      amount: String(baseTotal),
      paidAmount: !isPaidAmountEdited || prev.paidAmount === '' || prev.paidAmount === '0' ? String(totalAmount) : prev.paidAmount
    }));
  };

  const handleFineChange = (val) => {
    setForm(prev => {
      const nextForm = { ...prev, fine: val };
      const baseTotal = (Number(tuitionAmount) || 0) + (Number(transportAmount) || 0) + (Number(otherAmount) || 0);
      const totalAmount = baseTotal + (Number(val) || 0);
      if (!isPaidAmountEdited || prev.paidAmount === '' || prev.paidAmount === '0') {
        nextForm.paidAmount = String(totalAmount);
      }
      return nextForm;
    });
  };

  const handleEdit = (fee) => {
    setEditingId(fee.id || fee.feeId);
    setForm({
      studentId: fee.studentId,
      studentName: fee.studentName,
      admissionNumber: fee.admissionNumber || '',
      studentClass: fee.studentClass || fee.classId || '',
      section: fee.section || fee.sectionId || '',
      feeType: fee.feeType,
      amount: String(fee.amount || fee.totalAmount || ''),
      discount: '0',
      fine: String(fee.fine || 0),
      paidAmount: String(fee.paidAmount || ''),
      paymentMethod: fee.paymentMethod || 'Cash',
      remarks: fee.remarks || '',
      billingPeriod: fee.billingPeriod || 'Yearly'
    });
    
    if (fee.feeType === 'Tuition Fee') {
      setTuitionAmount(String(fee.amount || ''));
      setTransportAmount('');
      setOtherAmount('');
    } else if (fee.feeType === 'Transport Fee') {
      setTuitionAmount('');
      setTransportAmount(String(fee.amount || ''));
      setOtherAmount('');
    } else {
      setTuitionAmount('');
      setTransportAmount('');
      setOtherAmount(String(fee.amount || ''));
    }

    setStudentSearchQuery(fee.studentName);
    const parsed = parseGradeName(fee.studentClass || fee.classId);
    setSelectedFormGrade(parsed.baseGrade);
    setSelectedFormSection(fee.section || fee.sectionId || '');
    setSelectedFormDept(parsed.department);
    setIsPaidAmountEdited(true);
    setShowForm(true);
  };

  const handlePrintPeriod = (period) => {
    const firstRaw = period.components[0]?.rawFee || {};
    const totalAmt = period.components.reduce((sum, c) => sum + c.amount, 0);
    const totalFine = period.components.reduce((sum, c) => sum + c.fine, 0);
    const totalPaid = period.components.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalDue = period.components.reduce((sum, c) => sum + c.dueAmount, 0);

    setReceiptData({
      isPeriodReceipt: true,
      studentId: firstRaw.studentId,
      admissionNumber: firstRaw.admissionNumber || '',
      studentName: firstRaw.studentName,
      studentClass: firstRaw.studentClass,
      section: firstRaw.section,
      billingPeriod: period.name,
      components: period.components,
      amount: totalAmt,
      discount: 0,
      fine: totalFine,
      totalAmount: totalAmt + totalFine,
      paidAmount: totalPaid,
      dueAmount: totalDue,
      paymentMethod: period.paymentMethod || firstRaw.paymentMethod,
      paymentDate: period.paymentDate || firstRaw.paymentDate,
      transactionId: firstRaw.transactionId,
      receiptNumber: period.receiptNumber || firstRaw.receiptNumber
    });
  };

  const handleEditPeriod = (period) => {
    const firstRaw = period.components[0]?.rawFee || {};
    
    const tuitionComp = period.components.find(c => c.feeType === 'Tuition Fee');
    const transportComp = period.components.find(c => c.feeType === 'Transport Fee');
    const otherComp = period.components.find(c => c.feeType === 'Other Charges');
    
    setTuitionAmount(tuitionComp ? String(tuitionComp.paidAmount) : '');
    setTransportAmount(transportComp ? String(transportComp.paidAmount) : '');
    setOtherAmount(otherComp ? String(otherComp.paidAmount) : '');
    
    const totalFine = period.components.reduce((sum, c) => sum + c.fine, 0);
    const totalPaid = period.components.reduce((sum, c) => sum + c.paidAmount, 0);
    
    setEditingId(`PERIOD_${period.name}_${firstRaw.studentId}`);
    setEditingPeriodComponents(period.components.map(c => c.rawFee).filter(Boolean));
    
    setForm({
      studentId: firstRaw.studentId,
      studentName: firstRaw.studentName,
      admissionNumber: firstRaw.admissionNumber || '',
      studentClass: firstRaw.studentClass || '',
      section: firstRaw.section || '',
      feeType: 'Tuition Fee',
      amount: String(totalPaid),
      discount: '0',
      fine: String(totalFine),
      paidAmount: String(totalPaid),
      paymentMethod: firstRaw.paymentMethod || 'Cash',
      remarks: firstRaw.remarks || '',
      billingPeriod: period.name
    });
    
    setStudentSearchQuery(firstRaw.studentName);
    const parsed = parseGradeName(firstRaw.studentClass);
    setSelectedFormGrade(parsed.baseGrade);
    setSelectedFormSection(firstRaw.section || '');
    setSelectedFormDept(parsed.department);
    setIsPaidAmountEdited(false);
    setShowForm(true);
  };

  const handleCollectDue = (period, detailsStudent) => {
    const dueComponents = period.components.filter(c => c.dueAmount > 0);
    if (dueComponents.length === 0) return;
    const tuitionComp = dueComponents.find(c => c.feeType === 'Tuition Fee');
    const transportComp = dueComponents.find(c => c.feeType === 'Transport Fee');
    const otherComp = dueComponents.find(c => c.feeType === 'Other Charges');
    // Stay on popup – show the inline mini-form
    setCollectDueState({
      period,
      detailsStudent,
      tuitionDue: tuitionComp ? String(tuitionComp.dueAmount) : '',
      transportDue: transportComp ? String(transportComp.dueAmount) : '',
      otherDue: otherComp ? String(otherComp.dueAmount) : '',
      paymentMethod: 'Cash',
      remarks: '',
      fine: '0'
    });
  };

  const handleSubmitDueCollection = async (e) => {
    e.preventDefault();
    if (!collectDueState) return;
    const { period, detailsStudent, tuitionDue, transportDue, otherDue, paymentMethod, remarks, fine } = collectDueState;
    const firstRaw = period.components[0]?.rawFee || {};
    const studentId = firstRaw.studentId || detailsStudent?.studentId;
    const studentName = firstRaw.studentName || detailsStudent?.studentName;
    const admissionNumber = firstRaw.admissionNumber || detailsStudent?.admissionNumber || '';
    const studentClass = firstRaw.studentClass || detailsStudent?.studentClass || '';
    const section = firstRaw.section || detailsStudent?.section || '';
    const fineNum = Number(fine) || 0;
    const dueItems = [];
    if (Number(tuitionDue) > 0) dueItems.push({ type: 'Tuition Fee', amt: Number(tuitionDue) });
    if (Number(transportDue) > 0) dueItems.push({ type: 'Transport Fee', amt: Number(transportDue) });
    if (Number(otherDue) > 0) dueItems.push({ type: 'Other Charges', amt: Number(otherDue) });
    if (dueItems.length === 0) {
      showToast('No due amounts to collect.', 'error');
      return;
    }
    try {
      let savedReceipt = null;
      for (let i = 0; i < dueItems.length; i++) {
        const { type, amt } = dueItems[i];
        const fn = i === 0 ? fineNum : 0;
        const payload = {
          studentId,
          studentName,
          admissionNumber,
          studentClass,
          section,
          feeType: type,
          amount: amt,
          discount: 0,
          fine: fn,
          paidAmount: amt + fn,
          paymentMethod,
          remarks: 'DUE_COLLECTION',
          billingPeriod: period.name
        };
        const res = await fetch('/api/finance/fees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Server error recording due collection.');
        }
        const data = await res.json();
        if (i === 0) savedReceipt = data;
      }
      showToast('Due amount collected successfully!');
      if (savedReceipt) setReceiptData(savedReceipt);
      setCollectDueState(null);
      fetchFees();
    } catch (err) {
      showToast(err.message || 'Network error', 'error');
    }
  };

  const handleNewPeriodCollect = (student) => {
    const classStructures = feeStructures.filter(fs => fs.studentClass === student.studentClass);
    let matchedFs = classStructures[0] || {};
    const freq = matchedFs.frequency || 'Yearly';
    const periodName = matchedFs.monthRange || 'Full Year';
    const hasMonthRange = !!matchedFs.monthRange;

    const configTuition = getCalculatedAmount(matchedFs.tuitionFee || 0, freq, hasMonthRange);
    const configTransport = getCalculatedAmount(matchedFs.transportFee || 0, freq, hasMonthRange);
    const configOther = getCalculatedAmount(matchedFs.otherCharges || 0, freq, hasMonthRange);

    setTuitionAmount(configTuition > 0 ? String(configTuition) : '');
    setTransportAmount(configTransport > 0 ? String(configTransport) : '');
    setOtherAmount(configOther > 0 ? String(configOther) : '');

    const totalAmt = configTuition + configTransport + configOther;

    setEditingId(null);
    setEditingPeriodComponents([]);

    setForm({
      studentId: student.studentId || student.id,
      studentName: student.studentName || student.fullName || student.name,
      admissionNumber: student.admissionNumber || '',
      studentClass: student.studentClass || '',
      section: student.section || '',
      feeType: 'Tuition Fee',
      amount: String(totalAmt),
      discount: '0',
      fine: '0',
      paidAmount: String(totalAmt),
      paymentMethod: 'Cash',
      remarks: '',
      billingPeriod: periodName
    });

    setStudentSearchQuery(student.studentName || student.fullName || student.name);
    const parsed = parseGradeName(student.studentClass);
    setSelectedFormGrade(parsed.baseGrade);
    setSelectedFormSection(student.section || '');
    setSelectedFormDept(parsed.department || '');
    setIsPaidAmountEdited(false);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId) {
      showToast('Please select a student from the search results dropdown list.', 'error');
      return;
    }
    try {
      if (editingId) {
        if (editingId.startsWith('PERIOD_') || editingPeriodComponents.length > 0) {
          const activeFeeTypes = [];
          if (Number(tuitionAmount) > 0) activeFeeTypes.push({ type: 'Tuition Fee', amt: Number(tuitionAmount) });
          if (Number(transportAmount) > 0) activeFeeTypes.push({ type: 'Transport Fee', amt: Number(transportAmount) });
          if (Number(otherAmount) > 0) activeFeeTypes.push({ type: 'Other Charges', amt: Number(otherAmount) });

          if (activeFeeTypes.length === 0) {
            showToast('Please enter an amount for at least one fee type.', 'error');
            return;
          }

          let remainingPaid = form.paidAmount !== '' ? Number(form.paidAmount) : null;
          const totalCollectAmount = activeFeeTypes.reduce((acc, curr) => acc + curr.amt, 0) + Number(form.fine || 0);
          const isFullPayment = (remainingPaid === null || remainingPaid === totalCollectAmount);

          // 1. Deletions: any components that were present in the period but are now 0
          const typesToKeep = activeFeeTypes.map(x => x.type);
          const componentsToDelete = editingPeriodComponents.filter(c => !typesToKeep.includes(c.feeType));
          for (let c of componentsToDelete) {
            const res = await fetch(`/api/finance/fees/${c.id || c.feeId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`Failed to delete component ${c.feeType}`);
          }

          const studentBase = parseGradeName(form.studentClass || '').baseGrade.toLowerCase();
          const classStructures = feeStructures.filter(fs => 
            parseGradeName(fs.studentClass || '').baseGrade.toLowerCase() === studentBase
          );
          const matchedFs = classStructures.find(fs => (fs.monthRange || 'Full Year') === form.billingPeriod) || classStructures[0];
          const freq = matchedFs ? (matchedFs.frequency || 'Yearly') : 'Yearly';
          const hasMonthRange = !!(matchedFs && matchedFs.monthRange);

          // 2. Updates & Insertions
          for (let i = 0; i < activeFeeTypes.length; i++) {
            const { type, amt } = activeFeeTypes[i];
            const fn = i === 0 ? Number(form.fine || 0) : 0;
            const itemTotal = amt + fn;

            let itemPaid = itemTotal;
            if (!isFullPayment) {
              if (remainingPaid !== null) {
                itemPaid = Math.min(remainingPaid, itemTotal);
                remainingPaid -= itemPaid;
              } else {
                itemPaid = itemTotal;
              }
            }

            const existingComp = editingPeriodComponents.find(c => c.feeType === type);

            let structureAmt = amt;
            if (type === 'Tuition Fee' && matchedFs) {
              structureAmt = getCalculatedAmount(matchedFs.tuitionFee || 0, freq, hasMonthRange);
            } else if (type === 'Transport Fee' && matchedFs) {
              structureAmt = getCalculatedAmount(matchedFs.transportFee || 0, freq, hasMonthRange);
            } else if (type === 'Other Charges' && matchedFs) {
              structureAmt = getCalculatedAmount(matchedFs.otherCharges || 0, freq, hasMonthRange);
            }

            const isCollectDue = !!form.isCollectDue;

            // When collecting due on an existing record, the backend replaces paidAmount.
            // So we must send the CUMULATIVE total (already paid + new payment).
            let finalPaid = itemPaid;
            if (isCollectDue && existingComp) {
              finalPaid = (existingComp.paidAmount || 0) + itemPaid;
            }

            const payload = {
              studentId: form.studentId,
              studentName: form.studentName,
              admissionNumber: form.admissionNumber || '',
              studentClass: form.studentClass || '',
              section: form.section || '',
              feeType: type,
              amount: existingComp ? existingComp.amount : structureAmt,
              discount: 0,
              fine: fn,
              paidAmount: finalPaid,
              paymentMethod: form.paymentMethod || 'Cash',
              remarks: form.remarks || '',
              billingPeriod: form.billingPeriod || 'Yearly'
            };

            const url = existingComp ? `/api/finance/fees/${existingComp.id || existingComp.feeId}` : '/api/finance/fees';
            const method = existingComp ? 'PUT' : 'POST';

            const res = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || 'Server error saving fee component.');
            }
          }

          showToast(form.isCollectDue ? `Due amount collected successfully!` : `Fee period updated successfully!`);
          setShowForm(false);
          fetchFees();
        } else {
          const payload = {
            studentId: form.studentId,
            studentName: form.studentName,
            admissionNumber: form.admissionNumber || '',
            studentClass: form.studentClass || '',
            section: form.section || '',
            feeType: form.feeType,
            amount: Number(form.feeType === 'Tuition Fee' ? tuitionAmount : (form.feeType === 'Transport Fee' ? transportAmount : otherAmount)) || 0,
            discount: 0,
            fine: Number(form.fine) || 0,
            paidAmount: Number(form.paidAmount) || 0,
            paymentMethod: form.paymentMethod || 'Cash',
            remarks: form.remarks || '',
            billingPeriod: form.billingPeriod || 'Yearly'
          };
          const res = await fetch(`/api/finance/fees/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            showToast(`Fee record updated successfully!`);
            setShowForm(false);
            fetchFees();
          } else {
            const err = await res.json();
            showToast(err.error || 'Failed to update record', 'error');
          }
        }
      } else {
        const activeFeeTypes = [];
        if (Number(tuitionAmount) > 0) activeFeeTypes.push({ type: 'Tuition Fee', amt: Number(tuitionAmount) });
        if (Number(transportAmount) > 0) activeFeeTypes.push({ type: 'Transport Fee', amt: Number(transportAmount) });
        if (Number(otherAmount) > 0) activeFeeTypes.push({ type: 'Other Charges', amt: Number(otherAmount) });

        if (activeFeeTypes.length === 0) {
          showToast('Please enter an amount for at least one fee type.', 'error');
          return;
        }

        let remainingPaid = form.paidAmount !== '' ? Number(form.paidAmount) : null;
        const totalCollectAmount = activeFeeTypes.reduce((acc, curr) => acc + curr.amt, 0) + Number(form.fine || 0);
        const isFullPayment = (remainingPaid === null || remainingPaid === totalCollectAmount);

        let savedReceipt = null;
        for (let i = 0; i < activeFeeTypes.length; i++) {
          const { type, amt } = activeFeeTypes[i];
          const fn = i === 0 ? Number(form.fine || 0) : 0;
          const itemTotal = amt + fn;

          let itemPaid = itemTotal;
          if (!isFullPayment) {
            if (remainingPaid !== null) {
              itemPaid = Math.min(remainingPaid, itemTotal);
              remainingPaid -= itemPaid;
            } else {
              itemPaid = itemTotal;
            }
          }

          const payload = {
            studentId: form.studentId,
            studentName: form.studentName,
            admissionNumber: form.admissionNumber || '',
            studentClass: form.studentClass || '',
            section: form.section || '',
            feeType: type,
            amount: amt,
            discount: 0,
            fine: fn,
            paidAmount: itemPaid,
            paymentMethod: form.paymentMethod || 'Cash',
            remarks: form.remarks || '',
            billingPeriod: form.billingPeriod || 'Yearly'
          };

          const res = await fetch('/api/finance/fees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Server error recording fee.');
          }
          const data = await res.json();
          if (i === 0) {
            savedReceipt = data;
          }
        }

        showToast(`Fee(s) collected successfully!`);
        if (savedReceipt) {
          setReceiptData(savedReceipt);
        }
        setShowForm(false);
        fetchFees();
      }
    } catch (err) {
      showToast(err.message || 'Network error', 'error');
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  const filteredStudentsForSelect = students.filter(s => {
    const name = (s.fullName || s.name || '').toLowerCase();
    const admNo = (s.admissionNumber || '').toLowerCase();
    const query = studentSearchQuery.toLowerCase();
    const matchesSearch = !studentSearchQuery || name.includes(query) || admNo.includes(query);

    const parsed = parseGradeName(s.studentClass);
    const matchesGrade = !selectedFormGrade || parsed.baseGrade === selectedFormGrade;
    const matchesSection = !selectedFormSection || s.section === selectedFormSection;
    const matchesDept = !selectedFormDept || parsed.department === selectedFormDept;

    return matchesSearch && matchesGrade && matchesSection && matchesDept;
  });

  const groupFeesByStudent = (feesArray) => {
    if (filterClass === 'All' || filterSection === 'All') {
      return [];
    }

    const matchingStudents = students.filter(student => {
      const parsed = parseGradeName(student.studentClass);
      const matchesClass = parsed.baseGrade === filterClass && (!isGrade11or12(filterClass) || filterDept === 'All' || parsed.department === filterDept);
      const matchesSection = student.section === filterSection;
      const sq = search.toLowerCase();
      const firstName = (student.fullName || student.name || '').toLowerCase().split(/\s+/)[0] || '';
      const matchesSearch = !search || firstName.startsWith(sq);
      return matchesClass && matchesSection && matchesSearch;
    });

    return matchingStudents.map(student => {
      const studentFees = (feesArray || []).filter(f => 
        f.studentId === student.id || f.admissionNumber === student.admissionNumber
      );

      const studentBase = parseGradeName(student.studentClass || '').baseGrade.toLowerCase();
      const classStructures = feeStructures.filter(fs => 
        parseGradeName(fs.studentClass || '').baseGrade.toLowerCase() === studentBase
      );
      const periodNames = [...new Set(classStructures.map(fs => fs.monthRange || 'Full Year'))];
      if (periodNames.length === 0) {
        periodNames.push('Full Year');
      }

      const periodsList = periodNames.map(periodName => {
        let matchedFs = classStructures.find(fs => (fs.monthRange || 'Full Year') === periodName);
        if (!matchedFs && classStructures.length > 0) {
          matchedFs = classStructures[0];
        }

        const freq = matchedFs ? (matchedFs.frequency || 'Yearly') : 'Yearly';
        const hasMonthRange = !!(matchedFs && matchedFs.monthRange);

        const configTuition = matchedFs ? getCalculatedAmount(matchedFs.tuitionFee || 0, freq, hasMonthRange) : 0;
        const configTransport = matchedFs ? getCalculatedAmount(matchedFs.transportFee || 0, freq, hasMonthRange) : 0;
        const configOther = matchedFs ? getCalculatedAmount(matchedFs.otherCharges || 0, freq, hasMonthRange) : 0;

        const configMap = {
          'Tuition Fee': configTuition,
          'Transport Fee': configTransport,
          'Other Charges': configOther
        };

        const studentPeriodFees = studentFees.filter(f => f.billingPeriod === periodName);
        const alignedComponents = [];
        const standardTypes = ['Tuition Fee', 'Transport Fee', 'Other Charges'];

        standardTypes.forEach(type => {
          const configAmt = configMap[type] || 0;
          // Primary payment record (not a due-collection entry)
          const pay = studentPeriodFees.find(f => f.feeType === type && f.remarks !== 'DUE_COLLECTION');
          // Due-collection records created via inline due collection
          const dueCollectionRecords = studentPeriodFees.filter(f => f.feeType === type && f.remarks === 'DUE_COLLECTION');
          const totalDueCollected = dueCollectionRecords.reduce((s, r) => s + (r.paidAmount || 0), 0);

          if (configAmt > 0 || pay || dueCollectionRecords.length > 0) {
            const basePaid = pay ? pay.paidAmount : 0;
            const fine = pay ? pay.fine : 0;
            const totalPaid = basePaid + totalDueCollected;
            const due = Math.max(0, (configAmt + fine) - totalPaid);

            alignedComponents.push({
              feeType: type,
              amount: configAmt,
              fine,
              paidAmount: totalPaid,
              dueAmount: due,
              status: pay ? pay.paymentStatus : 'Pending',
              rawFee: pay ? pay : {
                studentId: student.id,
                studentName: student.fullName || student.name,
                admissionNumber: student.admissionNumber,
                studentClass: student.studentClass,
                section: student.section,
                feeType: type,
                amount: configAmt,
                discount: 0,
                fine: 0,
                paidAmount: 0,
                dueAmount: configAmt,
                paymentStatus: 'Pending',
                paymentMethod: 'N/A',
                paymentDate: 'N/A',
                billingPeriod: periodName
              },
              dueCollectionRecords
            });
          }
        });

        let totalFee = 0;
        let paidAmount = 0;
        let dueAmount = 0;

        alignedComponents.forEach(comp => {
          totalFee += comp.amount + comp.fine;
          paidAmount += comp.paidAmount;
          dueAmount += comp.dueAmount;
        });

        let status = 'Pending';
        if (dueAmount <= 0) {
          status = 'Paid';
        } else if (paidAmount > 0) {
          status = 'Partial';
        }

        const firstPay = studentPeriodFees[0] || {};

        return {
          name: periodName,
          components: alignedComponents,
          totalPeriodFee: totalFee,
          paidPeriodAmount: paidAmount,
          duePeriodAmount: dueAmount,
          status,
          paymentMethod: firstPay.paymentMethod || 'N/A',
          paymentDate: firstPay.paymentDate || 'N/A',
          receiptNumber: firstPay.receiptNumber || 'N/A'
        };
      });

      let overallTotal = 0;
      let overallPaid = 0;
      let overallDue = 0;

      periodsList.forEach(p => {
        overallTotal += p.totalPeriodFee;
        overallPaid += p.paidPeriodAmount;
        overallDue += p.duePeriodAmount;
      });

      let overallStatus = 'Pending';
      if (overallDue <= 0) {
        overallStatus = 'Paid';
      } else if (overallPaid > 0) {
        overallStatus = 'Partial';
      }

      return {
        studentId: student.id,
        studentName: student.fullName || student.name,
        admissionNumber: student.admissionNumber,
        studentClass: student.studentClass,
        section: student.section,
        rollNumber: student.rollNumber || student.roll || '',
        periods: periodsList,
        overallTotal,
        overallPaid,
        overallDue,
        overallStatus
      };
    });
  };

  const groupedStudents = groupFeesByStudent(fees);

  const toggleStudentExpand = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Receipt Modal */}
      {receiptData && (() => {
        const printStudent = students.find(s => s.id === receiptData.studentId || s.admissionNumber === receiptData.admissionNumber) || {};
        const baseClass = printStudent.studentClass || receiptData.studentClass || 'N/A';
        const section = printStudent.section || receiptData.section || '';
        const gradeSec = section ? `${baseClass}-${section}` : baseClass;

        return createPortal(
          <div className="modal-overlay" onClick={() => setReceiptData(null)}>
            <div onClick={e => e.stopPropagation()} style={{
              width: '100%', maxWidth: '750px', background: 'var(--bg-elevated)', borderRadius: '16px',
              border: '1px solid var(--border-glass)', padding: '30px', boxShadow: 'var(--shadow-lg)',
              display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-main)'
            }}>
              {/* Receipt Header (Logo & School Info) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-glass)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {schoolInfo?.logo ? (
                    <img src={schoolInfo.logo} alt="School Logo" style={{ height: '60px', width: '60px', objectFit: 'contain' }} />
                  ) : (
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '12px', 
                      background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '1.5rem'
                    }}>
                      {schoolInfo?.name ? schoolInfo.name.charAt(0) : 'S'}
                    </div>
                  )}
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
                      {schoolInfo?.name || 'Aether Academy'}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      {schoolInfo?.address || '123 Academic Street, Education Zone'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      Phone: {schoolInfo?.phone || '+1 234 567 890'} | Email: {schoolInfo?.email || 'admin@aether.edu'}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                    padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem',
                    fontWeight: 700, display: 'inline-block', marginBottom: '8px'
                  }}>
                    FEE RECEIPT
                  </div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 2px 0' }}>
                    Receipt No: {receiptData.receiptNumber || 'N/A'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Date: {receiptData.paymentDate || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Student & Parent Info Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 24px',
                background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                borderRadius: '12px', padding: '16px', fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Student Name</span>
                  <strong style={{ color: 'var(--text-main)' }}>{printStudent.fullName || receiptData.studentName || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Father's Name</span>
                  <strong style={{ color: 'var(--text-main)' }}>{printStudent.fatherName || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Mother's Name</span>
                  <strong style={{ color: 'var(--text-main)' }}>{printStudent.motherName || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Admission No</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{receiptData.admissionNumber || printStudent.admissionNumber || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Roll Number</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{printStudent.rollNumber || printStudent.roll || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Session</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{printStudent.academicYear || receiptData.academicYear || '2026-2027'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Grade & Section</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{gradeSec}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Billing Period</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{receiptData.billingPeriod || 'Yearly'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Payment Method</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{receiptData.paymentMethod || 'Cash'}</span>
                </div>
              </div>

              {/* Fee Components Table */}
              <div style={{ border: '1px solid var(--border-glass)', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-glass)' }}>
                      <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>Fee Component</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Fine</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Paid</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.isPeriodReceipt && receiptData.components ? (
                      receiptData.components.map((comp, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{comp.feeType}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>₹{comp.amount?.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: comp.fine > 0 ? '#ef4444' : 'var(--text-main)' }}>+₹{comp.fine?.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>₹{comp.paidAmount?.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: comp.dueAmount > 0 ? '#f59e0b' : 'var(--text-main)', fontWeight: 600 }}>₹{comp.dueAmount?.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{receiptData.feeType}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>₹{receiptData.amount?.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: receiptData.fine > 0 ? '#ef4444' : 'var(--text-main)' }}>+₹{receiptData.fine?.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>₹{receiptData.paidAmount?.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: receiptData.dueAmount > 0 ? '#f59e0b' : 'var(--text-main)', fontWeight: 600 }}>₹{receiptData.dueAmount?.toLocaleString()}</td>
                      </tr>
                    )}
                    {/* Summary row */}
                    <tr style={{ background: 'var(--bg-card-subtle)', fontWeight: 700 }}>
                      <td style={{ padding: '12px 16px' }}>Total Summary</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>₹{receiptData.amount?.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>+₹{receiptData.fine?.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10b981' }}>₹{receiptData.paidAmount?.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: receiptData.dueAmount > 0 ? '#f59e0b' : '#10b981' }}>₹{receiptData.dueAmount?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature Fields (Two signature lines in bottom) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', padding: '0 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '180px', borderTop: '1px solid var(--text-main)', marginTop: '20px' }}></div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '6px' }}>Principal Signature</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '180px', borderTop: '1px solid var(--text-main)', marginTop: '20px' }}></div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '6px' }}>Accountant Signature</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => window.print()} style={{
                  flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem'
                }}>
                  <Printer size={16} /> Print Receipt
                </button>
                <button onClick={() => setReceiptData(null)} style={{
                  padding: '12px 20px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                  borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
                }}>Close</button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Grade and Section Selection Panel */}
      <div className="glass-panel animate-scale-up" style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', borderRadius: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          <div style={{ minWidth: '150px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Class / Grade</label>
            <select 
              value={filterClass} 
              onChange={e => {
                setFilterClass(e.target.value);
                setFilterDept('All');
                setFilterSection('All');
              }} 
              style={{ ...inputStyle, background: 'var(--bg-card-subtle)', cursor: 'pointer' }}
            >
              <option value="All" style={optionStyle}>Select Grade</option>
              {uniqueBaseGrades.map(c => <option key={c} value={c} style={optionStyle}>Grade {c}</option>)}
            </select>
          </div>

          {isGrade11or12(filterClass) && (
            <div style={{ minWidth: '150px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Department</label>
              <select 
                value={filterDept} 
                onChange={e => setFilterDept(e.target.value)} 
                style={{ ...inputStyle, background: 'var(--bg-card-subtle)', cursor: 'pointer' }}
              >
                <option value="All" style={optionStyle}>All Departments</option>
                {[...new Set(activeGrades
                  .filter(g => parseGradeName(g.name).baseGrade === filterClass)
                  .map(g => parseGradeName(g.name).department)
                  .filter(Boolean)
                )].map(d => (
                  <option key={d} value={d} style={optionStyle}>{d}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ minWidth: '150px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Section</label>
            <select
              value={filterSection}
              onChange={e => setFilterSection(e.target.value)}
              style={{ ...inputStyle, background: 'var(--bg-card-subtle)', cursor: 'pointer' }}
            >
              <option value="All" style={optionStyle}>Select Section</option>
              {allowedSectionsForFilter.map(sec => (
                <option key={sec} value={sec} style={optionStyle}>Section {sec}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Collection Form Modal */}
      {showForm && createPortal(
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
            width: '100%', maxWidth: '650px', background: 'var(--bg-elevated)', borderRadius: '20px',
            border: '1px solid var(--border-glass)', padding: '32px', boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <Receipt size={22} style={{ color: '#10b981' }} /> {editingId ? 'Edit Fee Collection' : 'New Fee Collection'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Student Header Card inside Modal */}
              <div style={{ 
                padding: '16px 20px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-glass)', 
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1.5px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}>
                    {form.studentName ? form.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{form.studentName}</h4>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>Adm No: <strong style={{ color: 'var(--text-main)' }}>{form.admissionNumber}</strong></span>
                  <span>•</span>
                  <span>Class: <strong style={{ color: 'var(--text-main)' }}>{form.studentClass}</strong></span>
                  <span>•</span>
                  <span>Section: <strong style={{ color: 'var(--text-main)' }}>{form.section}</strong></span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                {editingId && !editingId.startsWith('PERIOD_') ? (
                  <>
                    <div>
                      <label style={labelStyle}>Fee Type</label>
                      <input 
                        type="text" 
                        value={form.feeType} 
                        readOnly 
                        style={{ ...inputStyle, background: 'var(--bg-form-subtle)', cursor: 'not-allowed', color: 'var(--text-muted)' }} 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Amount (₹)</label>
                      <input 
                        type="number" 
                        value={form.feeType === 'Tuition Fee' ? tuitionAmount : (form.feeType === 'Transport Fee' ? transportAmount : otherAmount)} 
                        onChange={e => {
                          const val = e.target.value;
                          if (form.feeType === 'Tuition Fee') setTuitionAmount(val);
                          else if (form.feeType === 'Transport Fee') setTransportAmount(val);
                          else setOtherAmount(val);
                          
                          const baseTotal = Number(val) || 0;
                          const totalAmount = baseTotal + (Number(form.fine) || 0);
                          setForm(prev => ({
                            ...prev,
                            amount: String(baseTotal),
                            paidAmount: !isPaidAmountEdited || prev.paidAmount === '' || prev.paidAmount === '0' ? String(totalAmount) : prev.paidAmount
                          }));
                        }} 
                        required 
                        style={inputStyle} 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={labelStyle}>Tuition Fee (₹)</label>
                      <input 
                        type="number" 
                        value={tuitionAmount} 
                        onChange={e => handleAmountChange('Tuition Fee', e.target.value)} 
                        placeholder="0" 
                        style={inputStyle} 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Transport Fee (₹)</label>
                      <input 
                        type="number" 
                        value={transportAmount} 
                        onChange={e => handleAmountChange('Transport Fee', e.target.value)} 
                        placeholder="0" 
                        style={inputStyle} 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Other Charges (₹)</label>
                      <input 
                        type="number" 
                        value={otherAmount} 
                        onChange={e => handleAmountChange('Other Charges', e.target.value)} 
                        placeholder="0" 
                        style={inputStyle} 
                      />
                    </div>
                  </>
                )}

                {form.isCollectDue ? (
                  <div>
                    <label style={labelStyle}>Billing Period</label>
                    <div style={{
                      ...inputStyle,
                      background: 'rgba(16, 185, 129, 0.06)',
                      border: '1.5px solid rgba(16, 185, 129, 0.25)',
                      color: '#10b981',
                      fontWeight: 700,
                      cursor: 'default',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {form.billingPeriod}
                    </div>
                  </div>
                ) : (() => {
                  const selStudent = students.find(s => s.id === form.studentId);
                  let selFs = null;
                  const targetClass = selStudent 
                    ? selStudent.studentClass 
                    : ((isGrade11or12(selectedFormGrade) && selectedFormDept)
                        ? `${selectedFormGrade} (${selectedFormDept})`
                        : selectedFormGrade);
                  
                  if (targetClass) {
                    const classStructures = feeStructures.filter(f => f.studentClass === targetClass);
                    selFs = classStructures.find(f => f.monthRange === form.billingPeriod) || classStructures[0];
                  }
                  const selFreq = selFs ? (selFs.frequency || 'Yearly') : 'Yearly';
                  
                  if (selFreq === 'Yearly') {
                    return (
                      <div>
                        <label style={labelStyle}>Billing Period</label>
                        <div style={{
                          ...inputStyle,
                          background: 'rgba(255, 255, 255, 0.03)',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'not-allowed'
                        }}>
                          Full Year
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div>
                      <label style={labelStyle}>Billing Period</label>
                      <select 
                        value={form.billingPeriod || 'Yearly'} 
                        onChange={e => handleBillingPeriodChange(e.target.value)} 
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        {getBillingPeriodOptions(selFreq).map(opt => (
                          <option key={opt} value={opt} style={optionStyle}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                <div>
                  <label style={labelStyle}>Fine (₹)</label>
                  <input type="number" value={form.fine} onChange={e => handleFineChange(e.target.value)} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Paid Amount (₹)</label>
                  <input type="number" value={form.paidAmount} onChange={e => {
                    setIsPaidAmountEdited(true);
                    setForm({ ...form, paidAmount: e.target.value });
                  }} placeholder="Full amount" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Online'].map(m => <option key={m} value={m} style={optionStyle}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Remarks</label>
                  <input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Optional note" style={inputStyle} />
                </div>
              </div>

              {(() => {
                const tuitionVal = Number(tuitionAmount) || 0;
                const transportVal = Number(transportAmount) || 0;
                const otherVal = Number(otherAmount) || 0;
                const baseTotal = tuitionVal + transportVal + otherVal;
                const totalAmount = baseTotal + (Number(form.fine) || 0);
                const dueAmount = totalAmount - (form.paidAmount !== '' ? (Number(form.paidAmount) || 0) : totalAmount);
                return (
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Base Amount</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{baseTotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Fine</span>
                      <span style={{ color: '#10b981' }}>+ ₹{Number(form.fine || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border-glass)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-main)' }}>Total Payable</span>
                      <span style={{ color: '#10b981' }}>₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-main)' }}>Balance Due</span>
                      <span style={{ color: dueAmount > 0 ? '#ef4444' : '#10b981' }}>₹{dueAmount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '12px 24px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                  borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border-subtle)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card-subtle)'}><X size={16} /> Close</button>
                <button type="submit" style={{
                  padding: '12px 28px', background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', transition: 'transform 0.15s, opacity 0.2s'
                }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                   onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}><CheckCircle size={16} /> {editingId ? 'Update Record' : 'Collect & Generate Receipt'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}


      {/* Student Details Popup Modal */}
      {selectedDetailsStudentId && (() => {
        const detailsStudent = groupedStudents.find(s => (s.studentId || s.id) === selectedDetailsStudentId);
        if (!detailsStudent) return null;
        
        return createPortal(
          <div className="modal-overlay" onClick={() => setSelectedDetailsStudentId(null)}>
            <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
              width: '95%',
              maxWidth: '950px',
              background: 'var(--bg-elevated)',
              borderRadius: '20px',
              border: '1px solid var(--border-glass)',
              padding: '24px 32px',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                    Student Fee Ledger
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Student Name: <strong style={{ color: 'var(--text-main)' }}>{detailsStudent.studentName}</strong></span>
                    <span>•</span>
                    {detailsStudent.rollNumber && (
                      <>
                        <span>Roll No: <strong style={{ color: 'var(--text-main)' }}>{detailsStudent.rollNumber}</strong></span>
                        <span>•</span>
                      </>
                    )}
                    <span>Class: <strong style={{ color: 'var(--text-main)' }}>{detailsStudent.studentClass}</strong></span>
                    <span>•</span>
                    <span>Section: <strong style={{ color: 'var(--text-main)' }}>{detailsStudent.section}</strong></span>
                    <span>•</span>
                    <span>Session: <strong style={{ color: 'var(--text-main)' }}>{detailsStudent.periods[0]?.rawFee?.academicSession || '2026-2027'}</strong></span>
                  </div>
                </div>
                <button onClick={() => setSelectedDetailsStudentId(null)} style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-main)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {detailsStudent.periods.map((period, pIdx) => {
                  const hasPayments = period.paidPeriodAmount > 0;
                  const statusColors = {
                    Paid: { text: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
                    Partial: { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
                    Pending: { text: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)' }
                  };
                  const pColors = hasPayments 
                    ? (statusColors[period.status] || statusColors.Paid)
                    : { text: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)' };
                  const pStatusLabel = hasPayments ? period.status : 'Due';
                  
                  return (
                    <div key={pIdx} style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Calendar size={14} style={{ color: '#10b981' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{period.name} Period</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700,
                            color: pColors.text, background: pColors.bg, border: `1px solid ${pColors.border}`
                          }}>{pStatusLabel}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Period Total: <span style={{ color: 'var(--text-main)' }}>₹{period.totalPeriodFee.toLocaleString()}</span>
                            {period.duePeriodAmount > 0 && (
                              <>
                                {' '}| Due: <span style={{ color: '#ef4444' }}>₹{period.duePeriodAmount.toLocaleString()}</span>
                              </>
                            )}
                          </div>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            {!readOnly && hasPayments && period.duePeriodAmount > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCollectDue(period, detailsStudent); }}
                                title="Collect Due Amount"
                                style={{
                                  padding: '5px 10px',
                                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#fff',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  fontSize: '0.7rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Plus size={11} /> Collect Due ₹{period.duePeriodAmount.toLocaleString()}
                              </button>
                            )}
                            {hasPayments && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); handlePrintPeriod(period); }} title="Print Period Receipt" style={{ padding: '6px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '6px', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Printer size={13} />
                                </button>
                                {!readOnly && (
                                  <button onClick={(e) => { e.stopPropagation(); handleEditPeriod(period); }} title="Edit Period Record" style={{ padding: '6px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '6px', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Pencil size={13} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ overflowX: 'hidden', overflowY: 'auto', maxHeight: '180px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '22%', textAlign: 'left' }}>Fee Component</th>
                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '11%', textAlign: 'right' }}>Amount</th>
                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '11%', textAlign: 'right' }}>Fine</th>
                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '11%', textAlign: 'right' }}>Paid</th>
                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '11%', textAlign: 'right' }}>Due</th>
                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '12%', textAlign: 'right' }}>Receipt #</th>
                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '12%', textAlign: 'right' }}>Date</th>
                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '10%', textAlign: 'right' }}>Method</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Render main component rows */}
                            {period.components.map((comp, cIdx) => {
                              const rawPaid = comp.rawFee?.paidAmount || 0;
                              const calcDue = Math.max(0, (comp.amount + comp.fine) - rawPaid);
                              return (
                                <tr key={`main-${cIdx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.01)', fontSize: '0.8rem' }}>
                                  <td style={{ padding: '10px 10px', fontWeight: 700, color: 'var(--text-main)', width: '22%', textAlign: 'left' }}>{comp.feeType}</td>
                                  <td style={{ padding: '10px 10px', color: 'var(--text-main)', width: '11%', textAlign: 'right' }}>₹{comp.amount.toLocaleString()}</td>
                                  <td style={{ padding: '10px 10px', color: comp.fine > 0 ? '#ef4444' : 'var(--text-muted)', width: '11%', textAlign: 'right' }}>+ ₹{comp.fine.toLocaleString()}</td>
                                  <td style={{ padding: '10px 10px', color: '#10b981', fontWeight: 600, width: '11%', textAlign: 'right' }}>₹{rawPaid.toLocaleString()}</td>
                                  <td style={{ padding: '10px 10px', color: calcDue > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600, width: '11%', textAlign: 'right' }}>₹{calcDue.toLocaleString()}</td>
                                  <td style={{ padding: '10px 10px', color: '#10b981', fontWeight: 600, width: '12%', textAlign: 'right' }}>{comp.rawFee?.receiptNumber || '—'}</td>
                                  <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontSize: '0.75rem', width: '12%', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    {comp.rawFee?.paymentDate && comp.rawFee.paymentDate !== 'N/A' ? comp.rawFee.paymentDate.split('T')[0] : '—'}
                                  </td>
                                  <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontSize: '0.75rem', width: '10%', textAlign: 'right', fontWeight: 500 }}>
                                    {comp.rawFee?.paymentDate && comp.rawFee.paymentDate !== 'N/A' ? (comp.rawFee.paymentMethod || '—') : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Render due collection rows wrapped in a separate card structure with a header & buttons */}
                      {(() => {
                        const allDcRecords = [];
                        period.components.forEach(comp => {
                          if (comp.dueCollectionRecords) {
                            comp.dueCollectionRecords.forEach(dcRec => {
                              allDcRecords.push({ ...dcRec, parentFeeType: comp.feeType });
                            });
                          }
                        });
                        if (allDcRecords.length === 0) return null;
                        return (
                          <div style={{ marginTop: '16px', borderTop: '1px dashed var(--border-glass)', paddingTop: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                Dues Cleared Details
                              </span>
                              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const combinedReceipt = {
                                      studentId: detailsStudent.studentId || detailsStudent.id,
                                      studentName: detailsStudent.fullName || detailsStudent.studentName || detailsStudent.name,
                                      admissionNumber: detailsStudent.admissionNumber || '',
                                      studentClass: detailsStudent.studentClass || '',
                                      section: detailsStudent.section || '',
                                      billingPeriod: period.name,
                                      paymentMethod: allDcRecords[0]?.paymentMethod || 'Cash',
                                      paymentDate: allDcRecords[0]?.paymentDate || new Date().toISOString(),
                                      receiptNumber: allDcRecords[0]?.receiptNumber || 'RCP-DUES',
                                      isPeriodReceipt: true,
                                      components: allDcRecords.map(dc => ({
                                        feeType: `DUE CLEARED (${dc.parentFeeType})`,
                                        amount: dc.amount,
                                        fine: dc.fine,
                                        paidAmount: dc.paidAmount,
                                        dueAmount: 0
                                      })),
                                      amount: allDcRecords.reduce((sum, dc) => sum + (dc.amount || 0), 0),
                                      fine: allDcRecords.reduce((sum, dc) => sum + (dc.fine || 0), 0),
                                      paidAmount: allDcRecords.reduce((sum, dc) => sum + (dc.paidAmount || 0), 0),
                                      dueAmount: 0
                                    };
                                    setReceiptData(combinedReceipt);
                                  }}
                                  title="Print Dues Cleared Receipt"
                                  style={{ padding: '6px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <Printer size={15} />
                                </button>
                                {!readOnly && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const tuitionRec = allDcRecords.find(dc => dc.parentFeeType === 'Tuition Fee');
                                      const transportRec = allDcRecords.find(dc => dc.parentFeeType === 'Transport Fee');
                                      const otherRec = allDcRecords.find(dc => dc.parentFeeType === 'Other Charges');
                                      const firstDc = allDcRecords[0];
                                      setCollectDueState({
                                        period,
                                        detailsStudent,
                                        tuitionDue: tuitionRec ? String(tuitionRec.paidAmount || '') : '',
                                        transportDue: transportRec ? String(transportRec.paidAmount || '') : '',
                                        otherDue: otherRec ? String(otherRec.paidAmount || '') : '',
                                        paymentMethod: firstDc?.paymentMethod || 'Cash',
                                        remarks: '',
                                        fine: String(firstDc?.fine || '0'),
                                        editingDcIds: {
                                          'Tuition Fee': tuitionRec?.id || tuitionRec?.feeId || null,
                                          'Transport Fee': transportRec?.id || transportRec?.feeId || null,
                                          'Other Charges': otherRec?.id || otherRec?.feeId || null
                                        }
                                      });
                                    }}
                                    title="Edit Dues Clearance"
                                    style={{ padding: '6px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <Pencil size={15} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div style={{ overflowX: 'hidden', overflowY: 'auto', maxHeight: '140px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                    <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '22%', textAlign: 'left' }}>Fee Component</th>
                                    <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '11%', textAlign: 'right' }}>Amount</th>
                                    <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '11%', textAlign: 'right' }}>Fine</th>
                                    <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '11%', textAlign: 'right' }}>Paid</th>
                                    <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '11%', textAlign: 'right' }}>Due</th>
                                    <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '12%', textAlign: 'right' }}>Receipt #</th>
                                    <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '12%', textAlign: 'right' }}>Date</th>
                                    <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '10%', textAlign: 'right' }}>Method</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {allDcRecords.map((dcRec, dcIdx) => (
                                    <tr key={`dc-${dcIdx}`} style={{ borderBottom: '1px solid rgba(16,185,129,0.08)', fontSize: '0.78rem', background: 'rgba(16,185,129,0.03)' }}>
                                      <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-main)', width: '22%', textAlign: 'left' }}>
                                        DUE CLEARED ({dcRec.parentFeeType})
                                      </td>
                                      <td style={{ padding: '8px 10px', color: '#10b981', width: '11%', textAlign: 'right' }}>₹{(dcRec.amount || 0).toLocaleString()}</td>
                                      <td style={{ padding: '8px 10px', color: dcRec.fine > 0 ? '#ef4444' : 'var(--text-muted)', width: '11%', textAlign: 'right' }}>+ ₹{(dcRec.fine || 0).toLocaleString()}</td>
                                      <td style={{ padding: '8px 10px', color: '#10b981', fontWeight: 700, width: '11%', textAlign: 'right' }}>₹{(dcRec.paidAmount || 0).toLocaleString()}</td>
                                      <td style={{ padding: '8px 10px', color: 'var(--text-muted)', width: '11%', textAlign: 'right' }}>₹0</td>
                                      <td style={{ padding: '8px 10px', color: '#10b981', fontWeight: 600, width: '12%', textAlign: 'right', fontSize: '0.7rem' }}>{dcRec.receiptNumber || '—'}</td>
                                      <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: '0.75rem', width: '12%', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        {dcRec.paymentDate ? dcRec.paymentDate.split('T')[0] : '—'}
                                      </td>
                                      <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: '0.75rem', width: '10%', textAlign: 'right' }}>
                                        {dcRec.paymentMethod || '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}


      {/* Collect Due Portal Modal */}
      {collectDueState && createPortal(
        <div className="modal-overlay" onClick={() => setCollectDueState(null)} style={{ zIndex: 1100 }}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
            width: '95%',
            maxWidth: '560px',
            background: 'var(--bg-elevated)',
            borderRadius: '20px',
            border: '1px solid rgba(16,185,129,0.25)',
            padding: '28px 32px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.1)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={15} style={{ color: '#10b981' }} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {collectDueState.editingDcIds ? 'Edit Due Collection' : 'Collect Due Payment'}
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {collectDueState.detailsStudent?.studentName} &nbsp;•&nbsp; {collectDueState.period?.name} Period
                </p>
              </div>
              <button onClick={() => setCollectDueState(null)} style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>

            {/* Period info bar */}
            <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>Period: <strong style={{ color: '#10b981' }}>{collectDueState.period?.name}</strong></span>
              <span>Due Tuition: <strong style={{ color: '#ef4444' }}>₹{collectDueState.tuitionDue || 0}</strong></span>
              {collectDueState.transportDue && <span>Due Transport: <strong style={{ color: '#ef4444' }}>₹{collectDueState.transportDue}</strong></span>}
              {collectDueState.otherDue && <span>Due Other: <strong style={{ color: '#ef4444' }}>₹{collectDueState.otherDue}</strong></span>}
            </div>

            {/* Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!collectDueState) return;
              const { period: cPeriod, detailsStudent: cStudent, tuitionDue, transportDue, otherDue, paymentMethod, fine, editingDcIds } = collectDueState;
              const firstRaw = cPeriod.components[0]?.rawFee || {};
              const studentId = firstRaw.studentId || cStudent?.studentId;
              const studentName = firstRaw.studentName || cStudent?.studentName;
              const admissionNumber = firstRaw.admissionNumber || cStudent?.admissionNumber || '';
              const studentClass = firstRaw.studentClass || cStudent?.studentClass || '';
              const section = firstRaw.section || cStudent?.section || '';
              const fineNum = Number(fine) || 0;

              const dueItems = [];
              if (Number(tuitionDue) > 0) dueItems.push({ type: 'Tuition Fee', amt: Number(tuitionDue) });
              if (Number(transportDue) > 0) dueItems.push({ type: 'Transport Fee', amt: Number(transportDue) });
              if (Number(otherDue) > 0) dueItems.push({ type: 'Other Charges', amt: Number(otherDue) });

              const itemsToDelete = [];
              if (editingDcIds) {
                if (editingDcIds['Tuition Fee'] && !(Number(tuitionDue) > 0)) {
                  itemsToDelete.push({ type: 'Tuition Fee', id: editingDcIds['Tuition Fee'] });
                }
                if (editingDcIds['Transport Fee'] && !(Number(transportDue) > 0)) {
                  itemsToDelete.push({ type: 'Transport Fee', id: editingDcIds['Transport Fee'] });
                }
                if (editingDcIds['Other Charges'] && !(Number(otherDue) > 0)) {
                  itemsToDelete.push({ type: 'Other Charges', id: editingDcIds['Other Charges'] });
                }
              }

              if (dueItems.length === 0 && itemsToDelete.length === 0) {
                showToast('No due amounts entered.', 'error');
                return;
              }

              try {
                // 1. Process deletions
                for (const item of itemsToDelete) {
                  const res = await fetch(`/api/finance/fees/${item.id}`, { method: 'DELETE' });
                  if (!res.ok) { const err = await res.json(); throw new Error(err.error || `Error deleting ${item.type}`); }
                }

                // 2. Process active items
                let savedReceipt = null;
                for (let i = 0; i < dueItems.length; i++) {
                  const { type, amt } = dueItems[i];
                  const fn = i === 0 ? fineNum : 0;
                  const payload = { studentId, studentName, admissionNumber, studentClass, section, feeType: type, amount: amt, discount: 0, fine: fn, paidAmount: amt + fn, paymentMethod, remarks: 'DUE_COLLECTION', billingPeriod: cPeriod.name };
                  
                  const existingId = editingDcIds ? editingDcIds[type] : null;
                  const url = existingId ? `/api/finance/fees/${existingId}` : '/api/finance/fees';
                  const method = existingId ? 'PUT' : 'POST';
                  
                  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Error saving due collection'); }
                  const data = await res.json();
                  if (i === 0) savedReceipt = data;
                }

                showToast(editingDcIds ? 'Due collection updated!' : 'Due amount collected successfully!');
                if (savedReceipt) setReceiptData(savedReceipt);
                setCollectDueState(null);
                fetchFees();
              } catch (err) {
                showToast(err.message || 'Network error', 'error');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                {(collectDueState.tuitionDue || collectDueState.tuitionDue === '') && (
                  <div>
                    <label style={labelStyle}>Tuition Fee Due (₹)</label>
                    <input type="number" value={collectDueState.tuitionDue} onChange={e => setCollectDueState(s => ({ ...s, tuitionDue: e.target.value }))} style={inputStyle} placeholder="0" />
                  </div>
                )}
                {(collectDueState.transportDue || collectDueState.transportDue === '') && (
                  <div>
                    <label style={labelStyle}>Transport Fee Due (₹)</label>
                    <input type="number" value={collectDueState.transportDue} onChange={e => setCollectDueState(s => ({ ...s, transportDue: e.target.value }))} style={inputStyle} placeholder="0" />
                  </div>
                )}
                {(collectDueState.otherDue || collectDueState.otherDue === '') && (
                  <div>
                    <label style={labelStyle}>Other Charges Due (₹)</label>
                    <input type="number" value={collectDueState.otherDue} onChange={e => setCollectDueState(s => ({ ...s, otherDue: e.target.value }))} style={inputStyle} placeholder="0" />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Fine (₹)</label>
                  <input type="number" value={collectDueState.fine} onChange={e => setCollectDueState(s => ({ ...s, fine: e.target.value }))} style={inputStyle} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <select value={collectDueState.paymentMethod} onChange={e => setCollectDueState(s => ({ ...s, paymentMethod: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Online'].map(m => <option key={m} value={m} style={optionStyle}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div style={{ padding: '14px', background: 'rgba(16,185,129,0.04)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.12)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Due Being Collected</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>₹{(
                    (Number(collectDueState.tuitionDue) || 0) +
                    (Number(collectDueState.transportDue) || 0) +
                    (Number(collectDueState.otherDue) || 0) +
                    (Number(collectDueState.fine) || 0)
                  ).toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setCollectDueState(null)} style={{ padding: '11px 22px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Cancel</button>
                <button type="submit" style={{ padding: '11px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} /> {collectDueState.editingDcId ? 'Update Collection' : 'Collect & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}


      {/* Redesigned Grouped Fees List */}
      {(filterClass === 'All' || filterSection === 'All') ? (
        <div className="glass-panel animate-scale-up" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Search size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Select Grade and Section to collect fees</div>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <Loader2 className="animate-spin" size={24} style={{ color: '#10b981' }} />
        </div>
      ) : (() => {
        const hasStudentsInClass = (students || []).some(student => {
          const parsed = parseGradeName(student.studentClass);
          const matchesClass = parsed.baseGrade === filterClass && (!isGrade11or12(filterClass) || filterDept === 'All' || parsed.department === filterDept);
          const matchesSection = student.section === filterSection;
          return matchesClass && matchesSection;
        });
        if (!hasStudentsInClass) {
          return (
            <div className="glass-panel animate-scale-up" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-muted)' }}>
              No student records found in this Grade and Section.
            </div>
          );
        }
        return (() => {
          const renderStudentTable = (list) => {
            return (
              <div className="glass-panel animate-scale-up" style={{ borderRadius: '16px', padding: 0, border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
                {/* Embedded Filters Toolbar inside the glass panel header */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.015)' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      value={search} 
                      onChange={e => {
                        const val = e.target.value;
                        if (/^[a-zA-Z\s]*$/.test(val) && val.length <= 50) {
                          setSearch(val);
                        }
                      }} 
                      placeholder="Search by student name..."
                      style={{ ...inputStyle, paddingLeft: '36px', width: '100%', background: 'var(--bg-card-subtle)' }} 
                    />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Class: <span style={{ color: 'var(--text-main)' }}>{filterClass}-{filterSection}</span> ({list.length} Student{list.length !== 1 ? 's' : ''})
                  </div>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {list.length === 0 && search ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Search size={24} style={{ opacity: 0.35 }} />
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>No student found starting with "{search}"</div>
                      <div style={{ fontSize: '0.78rem' }}>Try a different name or clear the search</div>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <tbody>
                      {list.map((student, sIdx) => {
                        const statusColors = {
                          Paid: { text: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
                          Partial: { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
                          Pending: { text: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)' }
                        };
                        const colors = statusColors[student.overallStatus] || statusColors.Paid;
                        
                        return (
                          <tr 
                            key={`main-${sIdx}`}
                            style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s', cursor: 'pointer' }}
                            onClick={() => setSelectedDetailsStudentId(student.studentId || student.id)}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '14px 20px', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                                <div style={{ 
                                  width: '38px', 
                                  height: '38px', 
                                  borderRadius: '50%', 
                                  background: colors.bg, 
                                  border: `1.5px solid ${colors.border}`, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  color: colors.text, 
                                  fontWeight: 700, 
                                  fontSize: '0.85rem' 
                                }}>
                                  {student.studentName ? student.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{student.studentName}</div>
                                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500, flexWrap: 'wrap' }}>
                                      {student.rollNumber && (
                                        <>
                                          <span>Roll No: <strong style={{ color: 'var(--text-main)' }}>{student.rollNumber}</strong></span>
                                          <span>•</span>
                                        </>
                                      )}
                                      <span>Class: <strong style={{ color: 'var(--text-main)' }}>{student.studentClass}-{student.section}</strong></span>
                                      <span>•</span>
                                      <span>Session: <strong style={{ color: 'var(--text-main)' }}>{student.periods[0]?.rawFee?.academicSession || '2026-2027'}</strong></span>
                                    </div>
                                  </div>
                                  {student.periods && student.periods.length > 0 && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                                      {student.periods.map((p, pIdx) => {
                                        const hasPayments = p.paidPeriodAmount > 0;
                                        const pStatus = hasPayments ? p.status : 'Pending';
                                        const statusConfig = {
                                          Paid: { text: 'Paid', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)' },
                                          Partial: { text: 'Partial', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' },
                                          Pending: { text: 'Due', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)' }
                                        };
                                        const cfg = statusConfig[pStatus] || statusConfig.Pending;
                                        return (
                                          <div key={pIdx} style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            background: cfg.bg,
                                            border: `1px solid ${cfg.border}`,
                                            borderRadius: '8px',
                                            padding: '5px 12px',
                                            textAlign: 'center',
                                            flexShrink: 0
                                          }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px', whiteSpace: 'nowrap' }}>
                                              {p.name}
                                            </span>
                                            <span style={{
                                              fontSize: '0.65rem',
                                              fontWeight: 800,
                                              textTransform: 'uppercase',
                                              color: cfg.color,
                                              whiteSpace: 'nowrap'
                                            }}>
                                              {cfg.text}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                                    {!readOnly && !(student.periods.length > 0 && student.overallDue <= 0) && (
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          handleNewPeriodCollect(student);
                                        }} 
                                        style={{
                                          padding: '6px 12px',
                                          background: 'linear-gradient(135deg, #10b981, #059669)',
                                          border: 'none',
                                          borderRadius: '6px',
                                          color: '#fff',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          fontSize: '0.75rem',
                                          boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        <Plus size={12} /> Collect Fee
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {renderStudentTable(groupedStudents)}
            </div>
          );
        })()
      })()
      }

      <ConfirmDialog 
        show={!!showConfirmDelete} 
        message={
          showConfirmDelete?.components 
            ? `Are you sure you want to delete all fee records for ${showConfirmDelete.components[0]?.rawFee?.studentName} in ${showConfirmDelete.name}?`
            : `Are you sure you want to delete the fee record for ${showConfirmDelete?.studentName}?`
        }
        onConfirm={async () => {
          if (showConfirmDelete) {
            try {
              if (showConfirmDelete.components) {
                let success = true;
                for (const comp of showConfirmDelete.components) {
                  const res = await fetch(`/api/finance/fees/${comp.rawFee.id || comp.rawFee.feeId}`, { method: 'DELETE' });
                  if (!res.ok) success = false;
                }
                if (success) {
                  showToast('Period fee records deleted successfully!');
                  fetchFees();
                } else {
                  showToast('Failed to delete some fee records', 'error');
                  fetchFees();
                }
              } else {
                const res = await fetch(`/api/finance/fees/${showConfirmDelete.id || showConfirmDelete.feeId}`, {
                  method: 'DELETE'
                });
                if (res.ok) {
                  showToast('Fee record deleted successfully!');
                  fetchFees();
                } else {
                  showToast('Failed to delete fee record', 'error');
                }
              }
            } catch {
              showToast('Network error', 'error');
            }
            setShowConfirmDelete(null);
          }
        }}
        onCancel={() => setShowConfirmDelete(null)}
      />
    </div>
  );
}

/* ============================================================
   FEE STRUCTURE VIEW
   ============================================================ */
export function FeeStructureView({ showToast }) {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeGrades, setActiveGrades] = useState([]);
  const [selectedFormGrade, setSelectedFormGrade] = useState('');
  const [selectedFormDept, setSelectedFormDept] = useState('');
  const [feePeriods, setFeePeriods] = useState([]);
  const [showMonthRangeModal, setShowMonthRangeModal] = useState(false);
  const [newPeriodFreq, setNewPeriodFreq] = useState('Quarterly');
  const [newPeriodName, setNewPeriodName] = useState('');
  const [form, setForm] = useState({
    studentClass: '', admissionFee: '0', tuitionFee: '0', examFee: '0',
    transportFee: '0', hostelFee: '0', libraryFee: '0', otherCharges: '0',
    frequency: 'Yearly', monthRange: null
  });
  const [rangesData, setRangesData] = useState({});

  const classes = activeGrades.map(g => g.name);

  const uniqueBaseGrades = [...new Set(activeGrades.map(g => parseGradeName(g.name).baseGrade))];
  const departmentsForSelectedGrade = activeGrades
    .filter(g => parseGradeName(g.name).baseGrade === selectedFormGrade)
    .map(g => parseGradeName(g.name).department)
    .filter(Boolean);

  const handleGradeChange = (val) => {
    setSelectedFormGrade(val);
    if (isGrade11or12(val)) {
      const depts = activeGrades
        .filter(g => parseGradeName(g.name).baseGrade === val)
        .map(g => parseGradeName(g.name).department)
        .filter(Boolean);
      setSelectedFormDept(depts[0] || '');
    } else {
      setSelectedFormDept('');
    }
  };

  const getBillingPeriodOptions = (frequency) => {
    if (frequency === 'Monthly') {
      return [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
    }
    const customPeriods = feePeriods.filter(fp => fp.frequency === frequency).map(fp => fp.name);
    if (customPeriods.length > 0) return customPeriods;
    if (frequency === 'Quarterly') {
      return [];
    } else if (frequency === 'Half-Yearly') {
      return [];
    } else {
      return ['Full Year'];
    }
  };

  const handleFrequencyChange = (freq) => {
    setForm(prev => ({ ...prev, frequency: freq, monthRange: null }));
  };

  const fetchStructures = () => {
    fetch('/api/finance/fee-structures')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setStructures(d);
        } else {
          setStructures([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setStructures([]);
        setLoading(false);
      });
  };

  const fetchFeePeriods = () => {
    fetch('/api/finance/fee-periods')
      .then(r => r.json())
      .then(d => setFeePeriods(d || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchStructures();
    const loadGrades = async () => {
      const grades = await fetchActiveGrades();
      setActiveGrades(grades);
    };
    loadGrades();
    fetchFeePeriods();
  }, []);

  useEffect(() => {
    if (showForm && !editingId) {
      if (activeGrades.length > 0) {
        const parsed = parseGradeName(activeGrades[0].name);
        setSelectedFormGrade(parsed.baseGrade);
        setSelectedFormDept(parsed.department);
      }
    }
  }, [showForm, editingId, activeGrades]);

  useEffect(() => {
    if (!showForm) {
      setForm({
        studentClass: '', admissionFee: '0', tuitionFee: '0', examFee: '0',
        transportFee: '0', hostelFee: '0', libraryFee: '0', otherCharges: '0',
        frequency: 'Yearly', monthRange: null
      });
      setRangesData({});
    }
  }, [showForm]);

  useEffect(() => {
    const finalClass = (isGrade11or12(selectedFormGrade) && selectedFormDept)
      ? `${selectedFormGrade} (${selectedFormDept})`
      : selectedFormGrade;

    const freq = form.frequency || 'Yearly';
    const activeOpts = getBillingPeriodOptions(freq);

    if (finalClass && activeOpts.length > 0) {
      const classStructures = structures.filter(s => s.studentClass === finalClass && s.frequency === freq);
      
      const newData = {};
      activeOpts.forEach(opt => {
        const match = classStructures.find(s => (s.monthRange || 'Full Year') === opt);
        if (match) {
          newData[opt] = {
            tuitionFee: String(match.tuitionFee || '0'),
            transportFee: String(match.transportFee || '0'),
            otherCharges: String(match.otherCharges || '0')
          };
        } else {
          newData[opt] = {
            tuitionFee: '0',
            transportFee: '0',
            otherCharges: '0'
          };
        }
      });
      setRangesData(newData);
    } else {
      setRangesData({});
    }
  }, [selectedFormGrade, selectedFormDept, form.frequency, structures, showForm]);

  const handleRangeFieldChange = (range, field, value) => {
    setRangesData(prev => ({
      ...prev,
      [range]: {
        ...(prev[range] || { tuitionFee: '0', transportFee: '0', otherCharges: '0' }),
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalClass = (isGrade11or12(selectedFormGrade) && selectedFormDept)
      ? `${selectedFormGrade} (${selectedFormDept})`
      : selectedFormGrade;

    if (!finalClass) {
      showToast('Please select a grade', 'error');
      return;
    }

    const activeOpts = getBillingPeriodOptions(form.frequency || 'Yearly');
    const structuresToDelete = structures.filter(s => 
      s.studentClass === finalClass && 
      (s.frequency || 'Yearly') !== (form.frequency || 'Yearly')
    );

    try {
      // 1. Delete obsolete structures of different frequency
      if (structuresToDelete.length > 0) {
        const deleteIds = structuresToDelete.map(s => s.id).join(',');
        const deleteRes = await fetch(`/api/finance/fee-structures/${deleteIds}`, { method: 'DELETE' });
        if (!deleteRes.ok) {
          throw new Error('Failed to clean up old fee structures of different frequency.');
        }
      }

      // 2. Save new structures in a single batch request
      const payloads = activeOpts.map(opt => {
        const data = rangesData[opt] || { tuitionFee: '0', transportFee: '0', otherCharges: '0' };
        const tuition = Number(data.tuitionFee) || 0;
        const transport = Number(data.transportFee) || 0;
        const other = Number(data.otherCharges) || 0;

        const isQuarterlyOrHalf = form.frequency === 'Quarterly' || form.frequency === 'Half-Yearly' || form.frequency === 'Monthly';
        const finalMonthRange = isQuarterlyOrHalf ? opt : null;

        return {
          studentClass: finalClass,
          admissionFee: 0,
          tuitionFee: tuition,
          examFee: 0,
          transportFee: transport,
          hostelFee: 0,
          libraryFee: 0,
          otherCharges: other,
          frequency: form.frequency || 'Yearly',
          monthRange: finalMonthRange
        };
      });

      const res = await fetch('/api/finance/fee-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save fee structures');
      }

      showToast(`Fee structures saved for Grade ${finalClass}!`);
      setEditingId(null);
      setShowForm(false);
      fetchStructures();
    } catch (err) {
      showToast(err.message || 'Failed to save structures', 'error');
      fetchStructures();
    }
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const handleEdit = (s) => {
    const parsed = parseGradeName(s.studentClass);
    setSelectedFormGrade(parsed.baseGrade);
    setSelectedFormDept(parsed.department);
    setForm({
      studentClass: s.studentClass || '',
      admissionFee: String(s.admissionFee || '0'),
      tuitionFee: String(s.tuitionFee || '0'),
      examFee: String(s.examFee || '0'),
      transportFee: String(s.transportFee || '0'),
      hostelFee: String(s.hostelFee || '0'),
      libraryFee: String(s.libraryFee || '0'),
      otherCharges: String(s.otherCharges || '0'),
      frequency: s.frequency || 'Yearly',
      monthRange: s.monthRange || null
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  const groupedStructures = React.useMemo(() => {
    const groups = {};
    structures.forEach(s => {
      const key = `${s.studentClass}#${s.frequency || 'Yearly'}`;
      if (!groups[key]) {
        groups[key] = {
          studentClass: s.studentClass,
          frequency: s.frequency || 'Yearly',
          items: []
        };
      }
      groups[key].items.push(s);
    });
    const sorted = Object.values(groups);
    sorted.forEach(g => {
      g.items.sort((a, b) => {
        const opts = getBillingPeriodOptions(g.frequency);
        return opts.indexOf(a.monthRange || 'Full Year') - opts.indexOf(b.monthRange || 'Full Year');
      });
    });
    return sorted;
  }, [structures]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} style={{
          padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none',
          borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: '6px', fontSize: '0.85rem'
        }}>
          <Plus size={16} /> Add/Edit Fee Structure
        </button>
        <button onClick={() => setShowMonthRangeModal(true)} style={{
          padding: '10px 20px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none',
          borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: '6px', fontSize: '0.85rem'
        }}>
          <Calendar size={16} /> Manage Month Ranges
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => { setEditingId(null); setShowForm(false); }}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
            width: '100%', maxWidth: '650px', background: 'var(--bg-elevated)', borderRadius: '20px',
            border: '1px solid var(--border-glass)', padding: '32px', boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <BookOpen size={18} style={{ color: '#3b82f6' }} /> Configure Fee Structure
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Grade</label>
                  <select value={selectedFormGrade} onChange={e => handleGradeChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="" style={optionStyle}>Select Grade</option>
                    {uniqueBaseGrades.map(g => <option key={g} value={g} style={optionStyle}>Grade {g}</option>)}
                  </select>
                </div>
                {isGrade11or12(selectedFormGrade) && departmentsForSelectedGrade.length > 0 && (
                  <div>
                    <label style={labelStyle}>Department</label>
                    <select value={selectedFormDept} onChange={e => setSelectedFormDept(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {departmentsForSelectedGrade.map(d => <option key={d} value={d} style={optionStyle}>{d}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Fee Frequency</label>
                  <select 
                    value={form.frequency || 'Yearly'} 
                    onChange={e => handleFrequencyChange(e.target.value)} 
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="Monthly" style={optionStyle}>Monthly</option>
                    <option value="Quarterly" style={optionStyle}>Quarterly</option>
                    <option value="Half-Yearly" style={optionStyle}>Half-Yearly</option>
                    <option value="Yearly" style={optionStyle}>Yearly</option>
                  </select>
                </div>
              </div>

              {/* Month Ranges List inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px 0' }}>
                  Configure amounts for each period
                </h4>
                {getBillingPeriodOptions(form.frequency || 'Yearly').map(opt => {
                  const data = rangesData[opt] || { tuitionFee: '0', transportFee: '0', otherCharges: '0' };
                  const subTotal = (Number(data.tuitionFee) || 0) + (Number(data.transportFee) || 0) + (Number(data.otherCharges) || 0);
                  return (
                    <div key={opt} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                      gap: '14px', 
                      alignItems: 'end',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px'
                    }}>
                      <div style={{ gridColumn: '1 / -1', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px', marginBottom: '4px' }}>
                        {opt}
                      </div>
                      <div>
                        <label style={labelStyle}>Tuition Fee (₹)</label>
                        <input 
                          type="number" 
                          value={data.tuitionFee} 
                          onChange={e => handleRangeFieldChange(opt, 'tuitionFee', e.target.value)} 
                          style={inputStyle} 
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Transport Fee (₹)</label>
                        <input 
                          type="number" 
                          value={data.transportFee} 
                          onChange={e => handleRangeFieldChange(opt, 'transportFee', e.target.value)} 
                          style={inputStyle} 
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Other Charges (₹)</label>
                        <input 
                          type="number" 
                          value={data.otherCharges} 
                          onChange={e => handleRangeFieldChange(opt, 'otherCharges', e.target.value)} 
                          style={inputStyle} 
                          placeholder="0"
                        />
                      </div>
                      <div style={{ paddingBottom: '10px', fontSize: '0.85rem', fontWeight: 700, color: '#10b981', textAlign: 'right' }}>
                        Total: ₹{subTotal.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const overallTotal = Object.values(rangesData).reduce((sum, item) => {
                  return sum + (Number(item.tuitionFee) || 0) + (Number(item.transportFee) || 0) + (Number(item.otherCharges) || 0);
                }, 0);
                return (
                  <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.06)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Overall Total Fee
                    </span>
                    <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>₹{overallTotal.toLocaleString()}</span>
                  </div>
                );
              })()}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" style={{
                  padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none',
                  borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem'
                }}><CheckCircle size={16} /> Save Fee Structure</button>
                <button type="button" onClick={() => { setEditingId(null); setShowForm(false); }} style={{
                  padding: '12px 24px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                  borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border-subtle)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card-subtle)'}><X size={16} /> Close</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Month Ranges Modal */}
      {showMonthRangeModal && (
        <div className="modal-overlay" onClick={() => setShowMonthRangeModal(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
            width: '100%', maxWidth: '600px', background: 'var(--bg-elevated)', borderRadius: '20px',
            border: '1px solid var(--border-glass)', padding: '32px', boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Calendar size={18} style={{ color: '#8b5cf6' }} /> Manage Month Ranges
              </h3>
              <button onClick={() => setShowMonthRangeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            {/* Add new period */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 auto' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' }}>Frequency</label>
                <select value={newPeriodFreq} onChange={e => setNewPeriodFreq(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', minWidth: '140px' }}>
                  <option value="Quarterly" style={optionStyle}>Quarterly</option>
                  <option value="Half-Yearly" style={optionStyle}>Half-Yearly</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' }}>Period Name</label>
                <input
                  type="text"
                  name="periodName"
                  id="periodName"
                  placeholder="e.g. Q1 (Apr-Jun)"
                  value={newPeriodName}
                  onChange={e => setNewPeriodName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button
                onClick={async () => {
                  if (!newPeriodName.trim()) return;
                  try {
                    const res = await fetch('/api/finance/fee-periods', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ frequency: newPeriodFreq, name: newPeriodName.trim() })
                    });
                    if (res.ok) {
                      const created = await res.json();
                      setFeePeriods(prev => [...prev, created]);
                      setNewPeriodName('');
                      if (showToast) showToast('Month range added!', 'success');
                    } else {
                      const err = await res.json();
                      if (showToast) showToast(err.error || 'Failed to add.', 'error');
                    }
                  } catch { if (showToast) showToast('Network error.', 'error'); }
                }}
                style={{
                  padding: '10px 18px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none',
                  borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '6px', fontSize: '0.82rem', whiteSpace: 'nowrap'
                }}
              >
                <Plus size={15} /> Add
              </button>
            </div>

            {/* List periods grouped by frequency */}
            {['Quarterly', 'Half-Yearly'].map(freq => {
              const items = feePeriods.filter(fp => fp.frequency === freq);
              if (items.length === 0) return null;
              return (
                <div key={freq} style={{ marginBottom: '20px' }}>
                  <div style={{
                    fontSize: '0.78rem', fontWeight: 700, color: freq === 'Quarterly' ? '#f59e0b' : freq === 'Half-Yearly' ? '#3b82f6' : '#10b981',
                    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <Calendar size={14} /> {freq}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {items.map(fp => (
                      <div key={fp.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', background: 'var(--bg-card-subtle)', borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{fp.name}</span>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/finance/fee-periods/${fp.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                setFeePeriods(prev => prev.filter(p => p.id !== fp.id));
                                if (showToast) showToast('Period deleted.', 'success');
                              }
                            } catch { if (showToast) showToast('Delete failed.', 'error'); }
                          }}
                          style={{
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '8px', color: '#ef4444', cursor: 'pointer', padding: '5px 10px',
                            fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {feePeriods.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No custom month ranges configured yet. Add your first one above!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Structures Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : structures.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', borderRadius: '16px' }}>
            No fee structures configured yet. Click "Add/Edit Fee Structure" to create one.
          </div>
        ) : (
          groupedStructures.map((group, i) => {
            const activeOpts = getBillingPeriodOptions(group.frequency);
            const totalTuition = activeOpts.reduce((sum, opt) => {
              const match = group.items.find(item => (item.monthRange || 'Full Year') === opt);
              return sum + (match ? (match.tuitionFee || 0) : 0);
            }, 0);
            const totalTransport = activeOpts.reduce((sum, opt) => {
              const match = group.items.find(item => (item.monthRange || 'Full Year') === opt);
              return sum + (match ? (match.transportFee || 0) : 0);
            }, 0);
            const totalOther = activeOpts.reduce((sum, opt) => {
              const match = group.items.find(item => (item.monthRange || 'Full Year') === opt);
              return sum + (match ? (match.otherCharges || 0) : 0);
            }, 0);
            const overallTotal = totalTuition + totalTransport + totalOther;

            return (
              <div key={i} className="glass-panel" style={{ 
                padding: '24px', 
                borderRadius: '16px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px',
                maxWidth: '420px',
                width: '100%',
                background: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '10px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#3b82f6' }}>Grade {group.studentClass}</h4>
                  <span style={{ 
                    fontSize: '0.7rem', fontWeight: 800, color: '#3b82f6', 
                    background: 'rgba(59, 130, 246, 0.08)', padding: '4px 10px', borderRadius: '12px',
                    textTransform: 'uppercase', letterSpacing: '0.04em'
                  }}>
                    {group.frequency}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '175px', overflowY: 'auto', paddingRight: '4px' }}>
                  {activeOpts.map(opt => {
                    const match = group.items.find(item => (item.monthRange || 'Full Year') === opt);
                    const tuition = match ? (match.tuitionFee || 0) : 0;
                    const transport = match ? (match.transportFee || 0) : 0;
                    const other = match ? (match.otherCharges || 0) : 0;
                    const itemTotal = tuition + transport + other;
                    return (
                      <div key={opt} style={{ 
                        background: 'rgba(0,0,0,0.02)', 
                        borderRadius: '8px', 
                        padding: '10px 14px',
                        border: '1px solid rgba(0,0,0,0.04)' 
                      }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.8rem', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '4px', marginBottom: '6px' }}>
                          {opt}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                            <span>Tuition Fee</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{tuition.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                            <span>Transport Fee</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{transport.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                            <span>Other Charges</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{other.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 700, borderTop: '1px dashed rgba(0,0,0,0.06)', paddingTop: '4px', marginTop: '2px' }}>
                            <span>Total</span>
                            <span>₹{itemTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Tuition Fee</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>₹{totalTuition.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Transport Fee</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>₹{totalTransport.toLocaleString()}</span>
                  </div>
                  {totalOther > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Other Charges</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>₹{totalOther.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '8px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        Grand Total
                      </span>
                      <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.15rem' }}>₹{overallTotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(group.items[0])} style={{
                        background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#3b82f6', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px',
                        transition: 'all 0.2s'
                      }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; }}
                         onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                         title="Edit Structure">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(group.items.map(item => item.id))} style={{
                        background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#ef4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px',
                        transition: 'all 0.2s'
                      }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
                         onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                         title="Delete Structure">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        show={!!confirmDelete}
        message="Are you sure you want to delete this fee structure?"
        onConfirm={async () => {
          try {
            const ids = Array.isArray(confirmDelete) ? confirmDelete.join(',') : confirmDelete;
            const res = await fetch(`/api/finance/fee-structures/${ids}`, { method: 'DELETE' });
            if (res.ok) {
              showToast('Fee structure deleted');
              fetchStructures();
            } else {
              showToast('Error deleting', 'error');
            }
          } catch { showToast('Error deleting', 'error'); }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

/* ============================================================
   STAFF PAYMENT STRUCTURE VIEW
   ============================================================ */
const defaultStaffDesignations = [
  'Administrative Officer',
  'Office Assistant',
  'Data Entry Operator',
  'IT Administrator',
  'Computer Operator',
  'Transport Coordinator',
  'Driver',
  'Hostel Warden',
  'Security Supervisor',
  'Security Guard',
  'Maintenance Staff',
  'Electrician',
  'Plumber',
  'Housekeeping Supervisor',
  'Housekeeping Staff',
  'Cleaner',
  'School Nurse',
  'Store Keeper',
  'Peon',
  'Attendant',
  'Office Boy',
  'Gardener',
  'Other'
];

export function StaffPaymentStructureView({ showToast, type }) {
  const [structures, setStructures] = useState([]);
  const [designationOptions, setDesignationOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    designation: '', basicSalary: '', allowances: '0', bonus: '0',
    deductions: '0', pfDeduction: '0', taxDeduction: '0'
  });

  const fetchStructures = () => {
    fetch('/api/finance/staff-salary-structures')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setStructures(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchDesignationOptions = () => {
    if (type === 'Staff') {
      fetch('/api/rbac/roles')
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const activeRoles = Array.isArray(data) ? data.filter(r => r.active && !['Developer Admin', 'Main Admin', 'Admin Dashboard', 'Teacher'].includes(r.name)).map(r => r.name) : [];
          setDesignationOptions(activeRoles);
        })
        .catch(() => {});
    } else {
      fetch('/api/designations')
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const activeDesignations = Array.isArray(data) ? data.filter(d => d.status === 'Active' || !d.status).map(d => d.name) : [];
          setDesignationOptions(activeDesignations);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchStructures();
    fetchDesignationOptions();
  }, [type]);

  useEffect(() => {
    if (showForm) {
      fetchDesignationOptions();
    }
  }, [showForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/finance/staff-salary-structures/${editingId}` : '/api/finance/staff-salary-structures';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast(`Salary structure for ${form.designation} saved!`);
        setEditingId(null);
        setForm({
          designation: '', basicSalary: '', allowances: '0', bonus: '0',
          deductions: '0', pfDeduction: '0', taxDeduction: '0'
        });
        setShowForm(false);
        fetchStructures();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  const handleDelete = (id, name) => {
    setConfirmDelete({ id, name });
  };

  const handleEdit = (s) => {
    setForm({
      designation: s.designation || '',
      basicSalary: String(s.basicSalary || ''),
      allowances: '0',
      bonus: '0',
      deductions: '0',
      pfDeduction: String(s.pfDeduction || '0'),
      taxDeduction: String(s.taxDeduction || '0')
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const netSalary = Number(form.basicSalary || 0) - Number(form.pfDeduction || 0) - Number(form.taxDeduction || 0);

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  const isStaff = type === 'Staff';
  const labelText = isStaff ? 'Staff' : 'Employee';
  const filteredStructures = structures.filter(s => designationOptions.includes(s.designation));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {hasPermission(isStaff ? 'staff-pay-structure' : 'employee-pay-structure', 'create') && (
          <button onClick={() => { setEditingId(null); setShowForm(true); }} style={{
            padding: '10px 20px', background: 'linear-gradient(135deg, #14b8a6, #0d9488)', border: 'none',
            borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '6px', fontSize: '0.85rem'
          }}>
            <Plus size={16} /> Add {labelText} Salary Structure
          </button>
        )}
      </div>

      {showForm && createPortal(
        <div className="modal-overlay" onClick={() => { setEditingId(null); setShowForm(false); }}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
            width: '100%', maxWidth: '650px', background: 'var(--bg-elevated)', borderRadius: '20px',
            border: '1px solid var(--border-glass)', padding: '32px', boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Calculator size={18} style={{ color: '#14b8a6' }} /> Configure {labelText} Salary Structure
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Designation/Role</label>
                  <select
                    value={form.designation}
                    onChange={e => setForm({ ...form, designation: e.target.value })}
                    required
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="" style={optionStyle}>Select designation</option>
                    {designationOptions.map(designation => (
                      <option key={designation} value={designation} style={optionStyle}>{designation}</option>
                    ))}
                  </select>
                </div>
                {[
                  ['Basic Salary', 'basicSalary'],
                  ['PF Deduction', 'pfDeduction'], ['Tax Deduction', 'taxDeduction']
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label} (₹)</label>
                    <input type="number" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', background: 'rgba(20,184,166,0.06)', borderRadius: '10px', border: '1px solid rgba(20,184,166,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Net Salary</span>
                <span style={{ fontWeight: 800, color: '#14b8a6', fontSize: '1.1rem' }}>₹{netSalary.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{
                  padding: '12px 24px', background: 'linear-gradient(135deg, #14b8a6, #0d9488)', border: 'none',
                  borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem'
                }}><CheckCircle size={16} /> Save {labelText} Structure</button>
                <button type="button" onClick={() => { setEditingId(null); setShowForm(false); }} style={{
                  padding: '12px 24px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                  borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border-subtle)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card-subtle)'}><X size={16} /> Close</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
               <Loader2 className="animate-spin" size={24} />
            </div>
          ) : filteredStructures.length === 0 ? (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', borderRadius: '16px' }}>
              No {labelText.toLowerCase()} salary structures configured yet.
            </div>
          ) : (
            filteredStructures.map((s, i) => (
              <div key={i} className="glass-panel" style={{ 
                padding: '24px', 
                borderRadius: '16px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                maxWidth: '420px',
                width: '100%',
                background: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '10px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#14b8a6' }}>{s.designation}</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {[
                    ['Basic Salary', s.basicSalary],
                    ['PF Deduction', s.pfDeduction], ['Tax Deduction', s.taxDeduction]
                  ].map(([l, v], idx) => (
                    <div key={l} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '0.82rem',
                      padding: '8px 0',
                      borderBottom: idx === 2 ? 'none' : '1px solid rgba(0,0,0,0.04)'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{(v || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Net Salary</span>
                    <span style={{ fontWeight: 800, color: '#14b8a6', fontSize: '1.15rem' }}>₹{(s.netSalary || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {hasPermission(isStaff ? 'staff-pay-structure' : 'employee-pay-structure', 'edit') && (
                      <button onClick={() => handleEdit(s)} style={{
                        background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#3b82f6', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px',
                        transition: 'all 0.2s'
                      }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; }}
                         onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                         title="Edit Structure">
                        <Pencil size={15} />
                      </button>
                    )}
                    {hasPermission(isStaff ? 'staff-pay-structure' : 'employee-pay-structure', 'delete') && (
                      <button onClick={() => handleDelete(s.id, s.designation)} style={{
                        background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#ef4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px',
                        transition: 'all 0.2s'
                      }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
                         onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                         title="Delete Structure">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <ConfirmDialog
          show={!!confirmDelete}
          message={confirmDelete ? `Are you sure you want to delete the structure for ${confirmDelete.name}?` : ''}
          onConfirm={async () => {
            try {
              const res = await fetch(`/api/finance/staff-salary-structures/${confirmDelete.id}`, { method: 'DELETE' });
              if (res.ok) {
                showToast(`Deleted salary structure for ${confirmDelete.name}`);
                fetchStructures();
              } else {
                showToast('Failed to delete structure', 'error');
              }
            } catch { showToast('Network error', 'error'); }
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
    </div>
  );
}

/* ============================================================
   STAFF PAYMENTS VIEW
   ============================================================ */
export function StaffPaymentsView({ showToast }) {
  const [payments, setPayments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    staffId: '', staffName: '', staffRole: '', department: '',
    basicSalary: '30000', allowances: '0', bonus: '0', deductions: '0',
    pfDeduction: '1500', taxDeduction: '1000', paymentMethod: 'Bank Transfer',
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  });
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [designationOptions, setDesignationOptions] = useState([]);

  useEffect(() => {
    if (!showForm) {
      setStaffSearchQuery('');
      setShowStaffDropdown(false);
    }
  }, [showForm]);

  const fetchPayments = () => {
    const params = new URLSearchParams();
    if (filterStatus !== 'All') params.set('status', filterStatus);
    if (search) params.set('search', search);
    fetch(`/api/finance/staff-payments?${params}`)
      .then(r => r.json())
      .then(d => { setPayments(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchStaff = () => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(d => setStaff(d))
      .catch(() => {});
  };

  const fetchDesignationOptions = () => {
    fetch('/api/designations')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const activeDesignations = Array.isArray(data) ? data.filter(d => d.status === 'Active' || !d.status).map(d => d.name) : [];
        setDesignationOptions(activeDesignations);
      })
      .catch(() => {});
  };

  useEffect(() => { 
    fetchPayments(); 
    fetchStaff(); 
    fetchDesignationOptions();
  }, [filterStatus, search]);

  useEffect(() => {
    if (showForm) {
      fetchDesignationOptions();
    }
  }, [showForm]);

  const selectStaff = (s) => {
    if (s) {
      fetch('/api/finance/staff-salary-structures')
        .then(r => r.json())
        .then(structures => {
          const sstr = structures.find(st => st.designation === s.designation || st.designation === s.role);
          setForm(prev => ({
            ...prev,
            staffId: s.id,
            staffName: s.name,
            staffRole: s.designation || s.role,
            department: s.department,
            basicSalary: sstr ? String(sstr.basicSalary) : '30000',
            allowances: '0',
            bonus: '0',
            deductions: '0',
            pfDeduction: sstr ? String(sstr.pfDeduction) : '1500',
            taxDeduction: sstr ? String(sstr.taxDeduction) : '1000'
          }));
        })
        .catch(() => {});
      setStaffSearchQuery(s.name);
      setShowStaffDropdown(false);
    } else {
      setForm(prev => ({
        ...prev,
        staffId: '',
        staffName: '',
        staffRole: prev.staffRole,
        department: ''
      }));
      setStaffSearchQuery('');
    }
  };

  const handleStaffSelect = (e) => {
    const s = staff.find(st => st.id === e.target.value);
    if (s) {
      // Find matching salary structure by role
      fetch('/api/finance/staff-salary-structures')
        .then(r => r.json())
        .then(structures => {
          const sstr = structures.find(st => st.designation === s.designation || st.designation === s.role);
          setForm(prev => ({
            ...prev,
            staffId: s.id,
            staffName: s.name,
            staffRole: s.designation || s.role,
            department: s.department,
            basicSalary: sstr ? String(sstr.basicSalary) : '30000',
            allowances: '0',
            bonus: '0',
            deductions: '0',
            pfDeduction: sstr ? String(sstr.pfDeduction) : '1500',
            taxDeduction: sstr ? String(sstr.taxDeduction) : '1000'
          }));
        })
        .catch(() => {});
    }
  };

  const netSalary = Number(form.basicSalary || 0) - Number(form.pfDeduction || 0) - Number(form.taxDeduction || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    if (form.month && form.month > currentMonthStr) {
      showToast('Cannot select a future month.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/finance/staff-payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast(`Payment of ₹${netSalary.toLocaleString()} processed for ${form.staffName}!`);
        setShowForm(false);
        setForm({ staffId: '', staffName: '', staffRole: '', department: '',
          basicSalary: '30000', allowances: '0', bonus: '0', deductions: '0',
          pfDeduction: '1500', taxDeduction: '1000', paymentMethod: 'Bank Transfer',
          month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` });
        fetchPayments();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  const handleDeleteStaffPayment = (id) => {
    if (window.confirm('Are you sure you want to delete this employee payment record? This will also remove the corresponding salary expense log.')) {
      fetch(`/api/finance/staff-payments/${id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) {
            showToast('Employee payment record deleted successfully.');
            fetchPayments();
          } else {
            showToast('Failed to delete employee payment record.', 'error');
          }
        })
        .catch(() => showToast('Network error', 'error'));
    }
  };

  const todayStr = new Date().toLocaleDateString('en-CA');
  const todaysPayments = payments.filter(p => p.paymentDate === todayStr);

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  const filteredStaffForSelect = staff.filter(s => {
    if (form.staffRole) {
      const matchRole = form.staffRole.toLowerCase();
      const empDesg = (s.designation || '').toLowerCase();
      const empRole = (s.role || '').toLowerCase();
      if (empDesg !== matchRole && empRole !== matchRole) {
        return false;
      }
    }
    if (staffSearchQuery.trim()) {
      const name = (s.name || '').toLowerCase();
      const role = (s.role || '').toLowerCase();
      const desg = (s.designation || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      const query = staffSearchQuery.toLowerCase();
      return name.includes(query) || role.includes(query) || desg.includes(query) || dept.includes(query);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {hasPermission('employee-payroll', 'create') && (
          <button onClick={() => setShowForm(true)} style={{
            padding: '10px 20px', background: 'linear-gradient(135deg, #ec4899, #db2777)', border: 'none',
            borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '6px', fontSize: '0.85rem'
          }}>
            <Plus size={16} /> Process Employee Payment
          </button>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..."
            style={{ ...inputStyle, paddingLeft: '36px', width: '200px' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: '120px', cursor: 'pointer' }}>
          <option value="All" style={optionStyle}>All Status</option>
          <option value="Paid" style={optionStyle}>Paid</option>
          <option value="Pending" style={optionStyle}>Pending</option>
        </select>
      </div>

      {showForm && createPortal(
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
            width: '100%', maxWidth: '650px', background: 'var(--bg-elevated)', borderRadius: '20px',
            border: '1px solid var(--border-glass)', padding: '32px', boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <UserCog size={18} style={{ color: '#ec4899' }} /> Process Employee Salary Payment
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={labelStyle}>Select Employee</label>
                  <input 
                    type="text" 
                    placeholder="Type employee name to search..." 
                    value={staffSearchQuery} 
                    onChange={(e) => {
                      setStaffSearchQuery(e.target.value);
                      setShowStaffDropdown(true);
                      if (!e.target.value) {
                        selectStaff(null);
                      }
                    }} 
                    onFocus={() => setShowStaffDropdown(true)}
                    onBlur={() => setTimeout(() => setShowStaffDropdown(false), 250)}
                    style={inputStyle}
                    required
                  />
                  {showStaffDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      zIndex: 1000,
                      marginTop: '4px',
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      {filteredStaffForSelect.length === 0 ? (
                        <div style={{ padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No matches found</div>
                      ) : (
                        filteredStaffForSelect.slice(0, 10).map(s => (
                          <div 
                            key={s.id} 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectStaff(s);
                            }}
                            style={{
                              padding: '10px 14px',
                              fontSize: '0.85rem',
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-subtle)',
                              transition: 'background 0.15s',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-subtle)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span>{s.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.role}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Designation</label>
                  <select
                    value={form.staffRole}
                    onChange={e => {
                      const selectedRole = e.target.value;
                      fetch('/api/finance/staff-salary-structures')
                        .then(r => r.json())
                        .then(structures => {
                          const sstr = structures.find(st => st.designation === selectedRole);
                          setForm(prev => ({
                            ...prev,
                            staffRole: selectedRole,
                            staffId: '',
                            staffName: '',
                            department: '',
                            basicSalary: sstr ? String(sstr.basicSalary) : '30000',
                            allowances: '0',
                            bonus: '0',
                            deductions: '0',
                            pfDeduction: sstr ? String(sstr.pfDeduction) : '1500',
                            taxDeduction: sstr ? String(sstr.taxDeduction) : '1000'
                          }));
                        })
                        .catch(() => {
                          setForm(prev => ({
                            ...prev,
                            staffRole: selectedRole,
                            staffId: '',
                            staffName: '',
                            department: '',
                            basicSalary: '30000',
                            allowances: '0',
                            bonus: '0',
                            deductions: '0',
                            pfDeduction: '1500',
                            taxDeduction: '1000'
                          }));
                        });
                      setStaffSearchQuery('');
                    }}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="" style={optionStyle}>Select designation</option>
                    {designationOptions.map(designation => (
                      <option key={designation} value={designation} style={optionStyle}>{designation}</option>
                    ))}
                  </select>
                </div>
                {[
                  ['Basic Salary', 'basicSalary'],
                  ['PF Deduction', 'pfDeduction'], ['Tax Deduction', 'taxDeduction']
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label} (₹)</label>
                    <input type="number" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['Bank Transfer', 'UPI', 'Cheque', 'Cash'].map(m => <option key={m} value={m} style={optionStyle}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Salary Month</label>
                  <input
                    type="month"
                    value={form.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                    max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                    onChange={e => setForm({ ...form, month: e.target.value })}
                    required
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  />
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: 'rgba(236,72,153,0.06)', borderRadius: '10px', border: '1px solid rgba(236,72,153,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Net Salary</span>
                <span style={{ fontWeight: 800, color: '#ec4899', fontSize: '1.1rem' }}>₹{netSalary.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" style={{
                  padding: '12px 24px', background: 'linear-gradient(135deg, #ec4899, #db2777)', border: 'none',
                  borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem'
                }}><CheckCircle size={16} /> Process & Pay</button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '12px 24px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                  borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border-subtle)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card-subtle)'}><X size={16} /> Close</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Payment ID', 'Employee', 'Role', 'Basic', 'PF', 'Tax', 'Net Salary', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : todaysPayments.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No employee payments processed today. Click "Process Employee Payment" to get started.</td></tr>
              ) : (
                todaysPayments.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#ec4899' }}>{p.paymentId}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{p.staffName}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.staffRole}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>₹{p.basicSalary?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#ef4444' }}>-₹{p.pfDeduction?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#ef4444' }}>-₹{p.taxDeduction?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#ec4899' }}>₹{p.netSalary?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                        background: p.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: p.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'
                      }}>{p.paymentStatus}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.paymentDate}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {hasPermission('employee-payroll', 'delete') && (
                        <button
                          onClick={() => handleDeleteStaffPayment(p.paymentId)}
                          style={{
                            padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem',
                            display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </td>
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
   PAYROLL VIEW
   ============================================================ */
export function PayrollView({ showToast, type }) {
  const [payroll, setPayroll] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    teacherId: '', teacherName: '', employeeId: '', role: type === 'Teacher' ? 'Teacher' : '', department: '',
    basicSalary: '45000', allowances: '0', bonus: '0', deductions: '0',
    pfDeduction: '1800', taxDeduction: '1200', paymentMethod: 'Bank Transfer',
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  });
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (!showForm) {
      setTeacherSearchQuery('');
      setShowTeacherDropdown(false);
      setSelectedStructureId('');
    }
  }, [showForm]);

  const fetchPayroll = () => {
    const params = new URLSearchParams();
    if (filterStatus !== 'All') params.set('status', filterStatus);
    if (search) params.set('search', search);
    fetch(`/api/finance/payroll?${params}`)
      .then(r => r.json())
      .then(d => { setPayroll(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchTeachers = () => {
    if (type === 'Staff') {
      fetch('/api/staff?limit=1000')
        .then(r => r.json())
        .then(d => setTeachers((d.teachers || []).map(t => ({ ...t, _source: 'Staff' }))))
        .catch(() => {});
    } else if (type === 'Teacher') {
      fetch('/api/teachers')
        .then(r => r.json())
        .then(d => setTeachers((Array.isArray(d) ? d : []).map(t => ({ ...t, _source: 'Teacher' }))))
        .catch(() => {});
    } else {
      Promise.all([
        fetch('/api/staff?limit=1000').then(r => r.json()).then(d => (d.teachers || []).map(t => ({ ...t, _source: 'Staff' }))).catch(() => []),
        fetch('/api/teachers').then(r => r.json()).then(d => (Array.isArray(d) ? d : []).map(t => ({ ...t, _source: 'Teacher' }))).catch(() => [])
      ]).then(([staffList, teacherList]) => {
        setTeachers([...staffList, ...teacherList]);
      });
    }
  };

  const fetchSalaryStructures = () => {
    fetch('/api/finance/salary-structures')
      .then(r => r.json())
      .then(d => setSalaryStructures(d || []))
      .catch(() => {});
  };

  const fetchRoles = () => {
    fetch('/api/rbac/roles')
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        const activeRoles = d.filter(r => r.active && !['Developer Admin', 'Main Admin', 'Admin Dashboard'].includes(r.name));
        setRoles(activeRoles);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchPayroll();
    fetchTeachers();
    fetchSalaryStructures();
    fetchRoles();
  }, [filterStatus, search]);

  useEffect(() => {
    if (showForm) {
      fetchRoles();
    }
  }, [showForm]);

  const selectTeacher = (t) => {
    if (t) {
      let basicSalary = '45000';
      let allowances = '0';
      let deductions = '0';
      let pfDeduction = '1800';
      let taxDeduction = '1200';

      const matchingStructure = salaryStructures.find(s => (s.role || s.designation) === t.designation);
      if (matchingStructure) {
        basicSalary = String(matchingStructure.basicSalary || '0');
        allowances = '0';
        deductions = '0';
        pfDeduction = String(matchingStructure.pfDeduction || '0');
        taxDeduction = String(matchingStructure.taxDeduction || '0');
      }

      setForm(prev => ({
        ...prev,
        teacherId: t.id,
        teacherName: t.name,
        employeeId: t.employeeId || `EMP-${t.id}`,
        role: t.designation || 'Teacher',
        department: t.department || 'General',
        basicSalary,
        allowances,
        deductions,
        pfDeduction,
        taxDeduction
      }));
      setTeacherSearchQuery(t.name);
      setShowTeacherDropdown(false);
    } else {
      setForm(prev => ({
        ...prev,
        teacherId: '',
        teacherName: '',
        employeeId: '',
        role: '',
        department: '',
        basicSalary: '45000',
        allowances: '0',
        deductions: '0',
        pfDeduction: '1800',
        taxDeduction: '1200'
      }));
      setTeacherSearchQuery('');
    }
  };

  const handleTeacherSelect = (e) => {
    const t = teachers.find(t => t.id === e.target.value);
    if (t) {
      setForm(prev => ({
        ...prev, teacherId: t.id, teacherName: t.name,
        employeeId: t.employeeId || `EMP-${t.id}`,
        role: t.designation || 'Teacher',
        department: t.department || 'General'
      }));
    }
  };

  const netSalary = Number(form.basicSalary || 0) - Number(form.pfDeduction || 0) - Number(form.taxDeduction || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    if (form.month && form.month > currentMonthStr) {
      showToast('Cannot select a future month.', 'error');
      return;
    }
    try {
      const payload = {
        ...form,
        role: type === 'Teacher' ? 'Teacher' : form.role
      };
      const res = await fetch('/api/finance/payroll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(`Salary processed for ${form.teacherName}! Net: ₹${netSalary.toLocaleString()}`);
        setShowForm(false);
        setForm({ teacherId: '', teacherName: '', employeeId: '', role: type === 'Teacher' ? 'Teacher' : '', department: '',
          basicSalary: '45000', allowances: '0', bonus: '0', deductions: '0',
          pfDeduction: '1800', taxDeduction: '1200', paymentMethod: 'Bank Transfer',
          month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` });
        setSelectedStructureId('');
        fetchPayroll();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  const handleDeletePayroll = (id) => {
    if (window.confirm('Are you sure you want to delete this payroll record? This will also remove the corresponding salary expense log.')) {
      fetch(`/api/finance/payroll/${id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) {
            showToast('Payroll record deleted successfully.');
            fetchPayroll();
          } else {
            showToast('Failed to delete payroll record.', 'error');
          }
        })
        .catch(() => showToast('Network error', 'error'));
    }
  };

  const todayStr = new Date().toLocaleDateString('en-CA');
  const todaysPayroll = payroll.filter(p => p.paymentDate === todayStr);

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  const filteredTeachersForSelect = teachers.filter(t => {
    if (form.role) {
      const formRole = form.role.toLowerCase();
      const teacherDesg = (t.designation || '').toLowerCase();
      const teacherRole = (t.role || '').toLowerCase();
      const isMatch = (formRole === 'teacher' && (teacherDesg === 'subject teacher' || teacherDesg === 'teacher')) ||
                      (formRole === teacherDesg || formRole === teacherRole);
      if (!isMatch) return false;
    }
    if (teacherSearchQuery.trim()) {
      const q = teacherSearchQuery.toLowerCase();
      const name = (t.name || '').toLowerCase();
      const dept = (t.department || '').toLowerCase();
      const desg = (t.designation || '').toLowerCase();
      const role = (t.role || '').toLowerCase();
      const empId = (t.employeeId || '').toLowerCase();
      return name.includes(q) || dept.includes(q) || desg.includes(q) || role.includes(q) || empId.includes(q);
    }
    return true;
  });

  const isStaff = type === 'Staff';
  const labelText = isStaff ? 'Staff' : 'Teacher';
  const activeRoles = type === 'Teacher'
    ? ['Teacher']
    : (roles.length > 0 ? roles.map(r => r.name) : fallbackStaffRoles).filter(name => name !== 'Teacher');

  const filteredPayTierStructures = salaryStructures.filter(s => {
    const roleName = s.role || s.designation;
    const isStaffRole = roles.some(r => r.name === roleName) || fallbackStaffRoles.includes(roleName);
    if (type === 'Teacher') {
      return !isStaffRole || roleName === 'Teacher';
    } else {
      return isStaffRole && roleName !== 'Teacher';
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {hasPermission(isStaff ? 'staff-payroll' : 'teacher-payroll', 'create') && (
          <button onClick={() => setShowForm(true)} style={{
            padding: '10px 20px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none',
            borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '6px', fontSize: '0.85rem'
          }}>
            <Plus size={16} /> Process {labelText} Salary
          </button>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${labelText.toLowerCase()}...`}
            style={{ ...inputStyle, paddingLeft: '36px', width: '200px' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: '120px', cursor: 'pointer' }}>
          <option value="All" style={optionStyle}>All Status</option>
          <option value="Paid" style={optionStyle}>Paid</option>
          <option value="Pending" style={optionStyle}>Pending</option>
        </select>
      </div>

      {showForm && createPortal(
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
            width: '100%', maxWidth: '650px', background: 'var(--bg-elevated)', borderRadius: '20px',
            border: '1px solid var(--border-glass)', padding: '32px', boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Banknote size={18} style={{ color: '#8b5cf6' }} /> Process {labelText} Salary
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={labelStyle}>Select {labelText}</label>
                  <input 
                    type="text" 
                    placeholder={`Type ${labelText.toLowerCase()} name to search...`} 
                    value={teacherSearchQuery} 
                    onChange={(e) => {
                      setTeacherSearchQuery(e.target.value);
                      setShowTeacherDropdown(true);
                      if (!e.target.value) {
                        selectTeacher(null);
                      }
                    }} 
                    onFocus={() => setShowTeacherDropdown(true)}
                    onBlur={() => setTimeout(() => setShowTeacherDropdown(false), 250)}
                    style={inputStyle}
                    required
                  />
                  {showTeacherDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      zIndex: 1000,
                      marginTop: '4px',
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      {filteredTeachersForSelect.length === 0 ? (
                        <div style={{ padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No matches found</div>
                      ) : (
                        filteredTeachersForSelect.slice(0, 10).map(t => (
                          <div 
                            key={t.id} 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectTeacher(t);
                            }}
                            style={{
                              padding: '10px 14px',
                              fontSize: '0.85rem',
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-subtle)',
                              transition: 'background 0.15s',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-subtle)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span>{t.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.department || 'General'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Role</label>
                  {type === 'Teacher' ? (
                    <input 
                      type="text" 
                      value="Teacher" 
                      readOnly 
                      style={{ ...inputStyle, background: 'var(--bg-form-subtle)', cursor: 'not-allowed', color: 'var(--text-muted)' }} 
                    />
                  ) : (
                    <select
                      value={form.role}
                      onChange={e => {
                        setForm({ ...form, role: e.target.value });
                      }}
                      required
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="" style={optionStyle}>Select role</option>
                      {activeRoles.map(roleName => (
                        <option key={roleName} value={roleName} style={optionStyle}>{roleName}</option>
                      ))}
                    </select>
                  )}
                </div>
                {(form.role === 'Teacher' || type === 'Teacher') && (
                  <div>
                    <label style={labelStyle}>Grade Range Pay Tier</label>
                    <select
                      value={selectedStructureId}
                      onChange={e => {
                        const id = e.target.value;
                        setSelectedStructureId(id);
                        const selectedStr = filteredPayTierStructures.find(s => s.id === id);
                        if (selectedStr) {
                          setForm(prev => ({
                            ...prev,
                            basicSalary: String(selectedStr.basicSalary || '0'),
                            allowances: '0',
                            deductions: '0',
                            pfDeduction: String(selectedStr.pfDeduction || '0'),
                            taxDeduction: String(selectedStr.taxDeduction || '0')
                          }));
                        }
                      }}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="" style={optionStyle}>Select a configured grade/tier to pre-fill</option>
                      {filteredPayTierStructures.map(s => (
                        <option key={s.id} value={s.id} style={optionStyle}>
                          {s.role || s.designation} (Net: ₹{(s.netSalary || 0).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {[
                  ['Basic Salary', 'basicSalary'],
                  ['PF Deduction', 'pfDeduction'], ['Tax Deduction', 'taxDeduction']
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label} (₹)</label>
                    <input type="number" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['Bank Transfer', 'UPI', 'Cheque', 'Cash'].map(m => <option key={m} value={m} style={optionStyle}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Salary Month</label>
                  <input
                    type="month"
                    value={form.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                    max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                    onChange={e => setForm({ ...form, month: e.target.value })}
                    required
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  />
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: 'rgba(139,92,246,0.06)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Net Salary</span>
                <span style={{ fontWeight: 800, color: '#8b5cf6', fontSize: '1.1rem' }}>₹{netSalary.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" style={{
                  padding: '12px 24px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none',
                  borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem'
                }}><CheckCircle size={16} /> Process & Pay</button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '12px 24px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                  borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border-subtle)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card-subtle)'}><X size={16} /> Close</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Payroll Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Payroll ID', 'Staff', 'Role', 'Basic', 'PF', 'Tax', 'Net Salary', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : todaysPayroll.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No staff payroll records processed today. Click "Process Staff Salary" to get started.</td></tr>
              ) : (
                todaysPayroll.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: '#8b5cf6' }}>{p.payrollId}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{p.teacherName}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.role || p.designation}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>₹{p.basicSalary?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#ef4444' }}>-₹{p.pfDeduction?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#ef4444' }}>-₹{p.taxDeduction?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#8b5cf6' }}>₹{p.netSalary?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                        background: p.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: p.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'
                      }}>{p.paymentStatus}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.paymentDate}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {hasPermission(isStaff ? 'staff-payroll' : 'teacher-payroll', 'delete') && (
                        <button
                          onClick={() => handleDeletePayroll(p.payrollId)}
                          style={{
                            padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem',
                            display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </td>
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
   EXPENSES VIEW
   ============================================================ */
export function ExpensesView({ showToast }) {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [fees, setFees] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('All');
  const [search, setSearch] = useState('');

  const categories = {
    'Office & Administrative': ['Stationery', 'Printing', 'Internet Bills', 'Telephone Bills', 'Office Supplies'],
    'Employee Welfare': ['Tea & Refreshments', 'Snacks', 'Staff Meetings', 'Staff Events', 'Training Programs'],
    'Furniture & Equipment': ['Classroom Furniture', 'Office Furniture', 'Laboratory Equipment', 'Sports Equipment', 'Computers', 'Smart Boards', 'Projectors'],
    'Building & Renovation': ['Construction', 'Painting', 'Flooring', 'Plumbing', 'Electrical Work', 'Classroom Renovation', 'Washroom Renovation', 'Roof Repair', 'Boundary Wall Repair'],
    'Utilities': ['Electricity', 'Water', 'Gas', 'Generator Fuel', 'Solar Maintenance'],
    'Transportation': ['Fuel', 'Vehicle Maintenance', 'Repairs', 'Insurance'],
    'Maintenance & Repair': ['AC Repair', 'CCTV Maintenance', 'Computer Repair', 'Furniture Repair', 'Playground Maintenance'],
    'Academic Expenses': ['Books', 'Library', 'Laboratory Materials', 'Examination Materials', 'Software Licenses'],
    'Events & Functions': ['Annual Day', 'Sports Day', 'Science Exhibition', 'Seminars', 'Other Events'],
    'Salary': ['Staff Salaries', 'Employee Payroll'],
    'Other Expenses': ['Miscellaneous Overhead']
  };



  const fetchData = () => {
    Promise.all([
      fetch('/api/finance/overview').then(r => r.ok ? r.json() : null),
      fetch('/api/finance/fees').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/income?includeAuxiliary=true').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/expenses').then(r => r.ok ? r.json() : []),
    ]).then(([overviewData, feesData, incomeData, expensesData]) => {
      setOverview(overviewData);
      setFees(feesData);
      setIncome(incomeData);
      setExpenses(expensesData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);



  // Calculations
  const calculatedTotalExpenses = expenses.filter(e => e.status !== 'Rejected').reduce((s, e) => s + (e.amount || 0), 0);
  const totalTuitionFees = fees.filter(f => f.paymentStatus === 'Paid').reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalOtherIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
  const calculatedTotalIncome = totalTuitionFees + totalOtherIncome;
  const netBalance = calculatedTotalIncome - calculatedTotalExpenses;

  const salaryOverhead = expenses.filter(e => e.category === 'Salary').reduce((sum, e) => sum + (e.amount || 0), 0);
  const operatingOverhead = calculatedTotalExpenses - salaryOverhead;

  // Filter & Search
  const filteredExpenses = expenses.filter(e => {
    const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase()) || 
                        e.expenseId?.toLowerCase().includes(search.toLowerCase()) ||
                        e.vendor?.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || e.category === filterCat;
    return matchSearch && matchCat;
  });

  // Group by category
  const categoryGroups = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    categoryGroups[cat] = (categoryGroups[cat] || 0) + (e.amount || 0);
  });

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#ef4444' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px 28px', borderRadius: '16px', borderLeft: '4px solid #ef4444' }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Total Expenses (Outflow)</p>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', margin: 0 }}>₹{calculatedTotalExpenses.toLocaleString()}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Salary + Operating overheads</span>
        </div>
        <div className="glass-panel" style={{ padding: '24px 28px', borderRadius: '16px', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Operating Overhead</p>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', margin: 0 }}>₹{operatingOverhead.toLocaleString()}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Utilities, Supplies & Renovations</span>
        </div>
      </div>

      {/* Graphs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Category breakdown */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} style={{ color: '#ef4444' }} /> Category Wise Overhead Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {calculatedTotalExpenses === 0 || Object.entries(categoryGroups).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>No data available</span>
                <span>Data will appear once records are added</span>
              </div>
            ) : (
              Object.entries(categoryGroups)
                .sort((a,b) => b[1] - a[1])
                .map(([cat, val]) => {
                  const maxVal = Math.max(...Object.values(categoryGroups), 1);
                  const percent = Math.round((val / maxVal) * 100);
                  const share = calculatedTotalExpenses > 0 ? Math.round((val / calculatedTotalExpenses) * 100) : 0;
                  const catColors = { 
                    Maintenance: '#3b82f6', Salary: '#8b5cf6', Stationery: '#f59e0b', 
                    Utilities: '#06b6d4', Transportation: '#10b981', Events: '#f97316', 
                    'Furniture & Equipment': '#ec4899', 'Building & Renovation': '#ef4444',
                    Other: '#6b7280' 
                  };
                  const color = catColors[cat] || '#6b7280';
                  return (
                    <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat}</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>₹{val.toLocaleString()} ({share}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: '#ef4444' }} /> Monthly Expenditure Trend (Last 6 Months)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {calculatedTotalExpenses === 0 || !overview?.monthlyData || overview.monthlyData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>No data available</span>
                <span>Data will appear once records are added</span>
              </div>
            ) : (
              overview.monthlyData.map((m, idx) => {
                const maxExpenses = Math.max(...(overview?.monthlyData?.map(o => o.expenses) || [1]));
                const percent = Math.round((m.expenses / maxExpenses) * 100);
                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{m.month}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #ef444499)', borderRadius: '5px' }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', minWidth: '60px' }}>₹{m.expenses.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Ledger..." style={{ ...inputStyle, paddingLeft: '36px', width: '220px' }} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...inputStyle, width: '160px', cursor: 'pointer' }}>
          <option value="All" style={optionStyle}>All Categories</option>
          {Object.keys(categories).map(c => <option key={c} value={c} style={optionStyle}>{c}</option>)}
        </select>
      </div>

      {/* Expense Entries Card-like Structure */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredExpenses.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            No expense records matched the criteria.
          </div>
        ) : (
          filteredExpenses.map((exp, i) => (
            <div key={i} className="glass-panel" style={{ 
              padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
              border: '1px solid rgba(255,255,255,0.04)', transition: 'transform 0.2s', position: 'relative'
            }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              
              {/* Header block */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{exp.title}</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {exp.expenseId}</span>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700,
                  background: exp.status === 'Approved' ? 'rgba(16,185,129,0.08)' : exp.status === 'Rejected' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                  color: exp.status === 'Approved' ? '#10b981' : exp.status === 'Rejected' ? '#ef4444' : '#f59e0b'
                }}>{exp.status || 'Pending'}</span>
              </div>

              {/* Amount and category tags */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>₹{exp.amount?.toLocaleString()}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-muted)' }}>{exp.category}</span>
                  {exp.subcategory && <span style={{ fontSize: '0.68rem', fontWeight: 600, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-muted)' }}>{exp.subcategory}</span>}
                </div>
              </div>

              {/* Statement / Remarks */}
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                {exp.description || exp.remarks || 'No description recorded for this entry.'}
              </p>

              {/* Vendor & Payout details */}
              {exp.vendor?.name ? (
                <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Vendor details</div>
                  <div>Name: <strong style={{ color: 'var(--text-main)' }}>{exp.vendor.name}</strong></div>
                  {exp.vendor.contact && <div>Contact: <span style={{ color: 'var(--text-muted)' }}>{exp.vendor.contact}</span></div>}
                  {exp.vendor.email && <div>Email: <span style={{ color: 'var(--text-muted)' }}>{exp.vendor.email}</span></div>}
                  {exp.vendor.address && <div>Address: <span style={{ color: 'var(--text-muted)' }}>{exp.vendor.address}</span></div>}
                </div>
              ) : null}

              {/* Payment execution details */}
              {exp.paymentDetails?.method ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', padding: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <div>Method: <strong style={{ color: 'var(--text-main)' }}>{exp.paymentDetails.method}</strong></div>
                  <div>Date: <strong>{exp.paymentDate || exp.date}</strong></div>
                  {exp.paymentDetails.transactionId && <div style={{ gridColumn: 'span 2' }}>Txn ID: <code style={{ color: '#3b82f6' }}>{exp.paymentDetails.transactionId}</code></div>}
                  {exp.paymentDetails.invoiceNumber && <div style={{ gridColumn: 'span 2' }}>Invoice No: <span style={{ color: 'var(--text-main)' }}>{exp.paymentDetails.invoiceNumber}</span></div>}
                </div>
              ) : null}

              {/* Remarks/Notes */}
              {exp.notes ? (
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                  * Notes: {exp.notes}
                </div>
              ) : null}

              {/* Audit Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px' }}>
                <span>Paid by: {exp.paidBy || 'Finance Dept'}</span>
                <span>Submitted: {exp.submittedBy || 'System'}</span>
              </div>

            </div>
          ))
        )}
      </div>



    </div>
  );
}

/* ============================================================
   INCOME VIEW
   ============================================================ */
export function IncomeView() {
  return null;
}

function Disabled_IncomeView({ showToast, active = true }) {
  const [income, setIncome] = useState([]);
  const [fees, setFees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab and Filter states
  const [activeTab, setActiveTab] = useState('fees');
  const [feeSearch, setFeeSearch] = useState('');
  const [feeClassFilter, setFeeClassFilter] = useState('All');
  const [feeTypeFilter, setFeeTypeFilter] = useState('All');
  const [receiptData, setReceiptData] = useState(null);
  const [auxSearch, setAuxSearch] = useState('');
  const [auxCategoryFilter, setAuxCategoryFilter] = useState('All');
  const [feeDateFilter, setFeeDateFilter] = useState('');

  const sources = ['Donations', 'Grants', 'Event Revenue', 'Canteen', 'Rental', 'Sponsorship', 'Other'];

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/finance/overview').then(r => r.ok ? r.json() : null),
      fetch('/api/finance/fees').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/income?includeAuxiliary=true').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/expenses').then(r => r.ok ? r.json() : []),
    ]).then(([overviewData, feesData, incomeData, expensesData]) => {
      setOverview(overviewData);
      setFees(feesData);
      setIncome(incomeData);
      setExpenses(expensesData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (active) {
      fetchData();
    }
  }, [active]);

  // Aggregations
  const totalTuitionFees = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalOtherIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
  const calculatedTotalIncome = totalTuitionFees + totalOtherIncome;
  const calculatedTotalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netBalance = calculatedTotalIncome - calculatedTotalExpenses;
  const totalPendingFees = fees.reduce((sum, f) => sum + (f.dueAmount || 0), 0);

  // Breakdown of student fees by category
  const feeTypeTotals = {
    'Tuition Fee': 0,
    'Admission Fee': 0,
    'Exam Fee': 0,
    'Transport Fee': 0,
    'Other Charges': 0
  };
  fees.forEach(f => {
    const type = f.feeType || 'Other Charges';
    feeTypeTotals[type] = (feeTypeTotals[type] || 0) + (f.paidAmount || 0);
  });

  // Breakdown of other income sources
  const sourceTotals = {};
  sources.forEach(s => sourceTotals[s] = 0);
  income.forEach(i => {
    const s = i.source || 'Other';
    sourceTotals[s] = (sourceTotals[s] || 0) + (i.amount || 0);
  });
  const tuitionFeesSharePercent = calculatedTotalIncome > 0 ? Math.round((totalTuitionFees / calculatedTotalIncome) * 100) : 0;
  const otherIncomeSharePercent = calculatedTotalIncome > 0 ? Math.round((totalOtherIncome / calculatedTotalIncome) * 100) : 0;

  const classesList = [...new Set(fees.map(f => f.studentClass).filter(Boolean))].sort();
  const feeTypesList = ['Tuition Fee', 'Transport Fee', 'Other Charges'];

  const filteredFees = fees.filter(f => {
    const matchesSearch = !feeSearch || 
      f.studentName?.toLowerCase().includes(feeSearch.toLowerCase()) ||
      f.admissionNumber?.toLowerCase().includes(feeSearch.toLowerCase()) ||
      f.receiptNumber?.toLowerCase().includes(feeSearch.toLowerCase());
      
    const matchesClass = feeClassFilter === 'All' || f.studentClass === feeClassFilter;
    const matchesType = feeTypeFilter === 'All' || f.feeType === feeTypeFilter;
    const matchesDate = !feeDateFilter || f.paymentDate === feeDateFilter;
    
    return matchesSearch && matchesClass && matchesType && matchesDate;
  });

  const filteredAuxiliaryIncome = income.filter(inc => {
    if (auxCategoryFilter !== 'All' && inc.source !== auxCategoryFilter) {
      return false;
    }
    if (auxSearch) {
      const q = auxSearch.toLowerCase();
      const matchSearch =
        (inc.source || '').toLowerCase().includes(q) ||
        (inc.description || '').toLowerCase().includes(q) ||
        (inc.receiptNumber || inc.incomeId ? String(inc.receiptNumber || inc.incomeId) : '').toLowerCase().includes(q) ||
        (inc.receivedBy || '').toLowerCase().includes(q);
      if (!matchSearch) return false;
    }
    return true;
  });

  const auxiliaryCategories = [...new Set(income.map(i => i.source).filter(Boolean))].sort();

  const handleExportAuxiliaryCSV = () => {
    const rows = filteredAuxiliaryIncome.map(inc => ({
      'Receipt No / ID': inc.receiptNumber || inc.incomeId,
      'Category / Source': inc.source,
      'Description / Remarks': inc.description || '',
      'Amount': inc.amount,
      'Date': inc.date,
      'Received By / From': inc.receivedBy || ''
    }));
    if (!rows.length) return showToast('No data to export', 'error');
    const headers = Object.keys(rows[0]);
    const csvContent = [headers.join(','), ...rows.map(r => headers.map(h => `"${(String(r[h] ?? '')).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'auxiliary_income_entries.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Auxiliary Income CSV downloaded!');
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Receipt Modal */}
      {receiptData && createPortal(
        <div className="modal-overlay" onClick={() => setReceiptData(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '440px', background: 'var(--bg-elevated)', borderRadius: '20px',
            border: '1px solid var(--border-glass)', padding: '32px', boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <CheckCircle size={40} style={{ color: '#10b981', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Payment Receipt</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{receiptData.receiptNumber}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', background: 'var(--bg-card-subtle)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              {[
                ['Student', receiptData.studentName],
                ['Class', `${receiptData.studentClass}-${receiptData.section}`],
                ['Fee Type', receiptData.feeType],
                ['Amount', `₹${receiptData.amount?.toLocaleString()}`],
                ['Discount', `₹${receiptData.discount?.toLocaleString()}`],
                ['Fine', `₹${receiptData.fine?.toLocaleString()}`],
                ['Total', `₹${receiptData.totalAmount?.toLocaleString()}`],
                ['Paid', `₹${receiptData.paidAmount?.toLocaleString()}`],
                ['Due', `₹${receiptData.dueAmount?.toLocaleString()}`],
                ['Method', receiptData.paymentMethod],
                ['Date', receiptData.paymentDate],
                ['Transaction', receiptData.transactionId],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{k}</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => window.print()} style={{
                flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem'
              }}>
                <Printer size={16} /> Print Receipt
              </button>
              <button onClick={() => setReceiptData(null)} style={{
                padding: '12px 20px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
              }}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '14px', borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue (Income)</p>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>₹{calculatedTotalIncome.toLocaleString()}</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Student Fees + Auxiliary Income</span>
        </div>
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '14px', borderLeft: '4px solid #3b82f6' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Fee Collections</p>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', marginTop: '6px' }}>₹{totalTuitionFees.toLocaleString()}</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{tuitionFeesSharePercent}% of total revenue</span>
        </div>
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '14px', borderLeft: '4px solid #06b6d4' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Auxiliary & Other Income</p>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#06b6d4', marginTop: '6px' }}>₹{totalOtherIncome.toLocaleString()}</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{otherIncomeSharePercent}% of total revenue</span>
        </div>
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '14px', borderLeft: '4px solid #ef4444' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding Dues (Pending)</p>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '6px' }}>₹{totalPendingFees.toLocaleString()}</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Uncollected student balances</span>
        </div>
      </div>

      {/* Graph Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Monthly Revenue vs Expense trend */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: '#10b981' }} /> Monthly Cash Flow Trend (Last 6 Months)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(calculatedTotalIncome === 0 && calculatedTotalExpenses === 0) || !overview?.monthlyData || overview.monthlyData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>No data available</span>
                <span>Data will appear once records are added</span>
              </div>
            ) : (
              overview.monthlyData.map((m, idx) => {
                const maxIncome = Math.max(...(overview?.monthlyData?.map(o => o.fees) || [1]));
                const maxExpense = Math.max(...(overview?.monthlyData?.map(o => o.expenses) || [1]));
                const overallMax = Math.max(maxIncome, maxExpense, 1);
                
                const incomePercent = Math.round((m.fees / overallMax) * 100);
                const expensePercent = Math.round((m.expenses / overallMax) * 100);

                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{m.month}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${incomePercent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', minWidth: '60px' }}>₹{m.fees.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${expensePercent}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #dc2626)', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', minWidth: '60px' }}>₹{m.expenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Revenue Source Breakdown */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} style={{ color: '#3b82f6' }} /> Revenue Source Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
            {calculatedTotalIncome === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>No data available</span>
                <span>Data will appear once records are added</span>
              </div>
            ) : (
              <>
                {/* Student Fee categories (only show if they have collections) */}
                {Object.entries(feeTypeTotals).map(([type, val]) => {
                  if (val === 0) return null;
                  const percent = calculatedTotalIncome > 0 ? Math.round((val / calculatedTotalIncome) * 100) : 0;
                  const feeColors = {
                    'Tuition Fee': '#3b82f6',
                    'Admission Fee': '#8b5cf6',
                    'Exam Fee': '#6366f1',
                    'Transport Fee': '#06b6d4',
                    'Other Charges': '#64748b'
                  };
                  const color = feeColors[type] || '#3b82f6';
                  return (
                    <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Student {type}s</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>₹{val.toLocaleString()} ({percent}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
                
                {/* Auxiliary sources */}
                {Object.entries(sourceTotals).map(([source, val]) => {
                  if (val === 0) return null;
                  const percent = calculatedTotalIncome > 0 ? Math.round((val / calculatedTotalIncome) * 100) : 0;
                  const sourceColors = {
                    Donations: '#10b981', Grants: '#14b8a6', 'Event Revenue': '#f59e0b',
                    Canteen: '#ec4899', Rental: '#06b6d4', Sponsorship: '#f97316', Other: '#6b7280'
                  };
                  const color = sourceColors[source] || '#10b981';
                  return (
                    <div key={source} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Auxiliary: {source}</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>₹{val.toLocaleString()} ({percent}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Tabs Switcher for Collections History & Auxiliary entries */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginTop: '20px' }}>
        <button 
          onClick={() => setActiveTab('fees')}
          style={{
            background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: 700, 
            color: activeTab === 'fees' ? '#10b981' : 'var(--text-muted)',
            borderBottom: activeTab === 'fees' ? '3px solid #10b981' : 'none',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
        >
          <Receipt size={16} /> Student Fee Collections History
        </button>
        <button 
          onClick={() => setActiveTab('auxiliary')}
          style={{
            background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: 700, 
            color: activeTab === 'auxiliary' ? '#10b981' : 'var(--text-muted)',
            borderBottom: activeTab === 'auxiliary' ? '3px solid #10b981' : 'none',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
        >
          <TrendingUp size={16} /> Auxiliary & Other Income
        </button>
      </div>

      {activeTab === 'fees' ? (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Filter Toolbar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                value={feeSearch} 
                onChange={e => setFeeSearch(e.target.value)} 
                placeholder="Search student, receipt number or admission number..." 
                style={{ ...inputStyle, paddingLeft: '38px' }}
              />
            </div>
            <select 
              value={feeClassFilter} 
              onChange={e => setFeeClassFilter(e.target.value)} 
              style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}
            >
              <option value="All" style={optionStyle}>All Classes</option>
              {classesList.map(c => (
                <option key={c} value={c} style={optionStyle}>{c}</option>
              ))}
            </select>
            <select 
              value={feeTypeFilter} 
              onChange={e => setFeeTypeFilter(e.target.value)} 
              style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}
            >
              <option value="All" style={optionStyle}>All Fee Types</option>
              {feeTypesList.map(t => (
                <option key={t} value={t} style={optionStyle}>{t}</option>
              ))}
            </select>
            <input 
              type="date"
              value={feeDateFilter} 
              onChange={e => setFeeDateFilter(e.target.value)} 
              style={{ ...inputStyle, width: 'auto', minWidth: '150px', cursor: 'pointer' }}
              title="Filter by payment date"
            />
            <button 
              onClick={() => {
                const rows = filteredFees.map(f => ({
                  'Receipt Number': f.receiptNumber,
                  'Student Name': f.studentName,
                  'Admission Number': f.admissionNumber,
                  'Class': f.studentClass,
                  'Section': f.section,
                  'Fee Type': f.feeType,
                  'Paid Amount': f.paidAmount,
                  'Due Amount': f.dueAmount,
                  'Payment Method': f.paymentMethod,
                  'Payment Date': f.paymentDate,
                  'Transaction ID': f.transactionId
                }));
                const headers = Object.keys(rows[0] || {});
                if (!rows.length) return showToast('No data to export', 'error');
                const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'student_fee_collections.csv'; a.click();
                URL.revokeObjectURL(url);
                showToast('Fee Collections CSV downloaded!');
              }}
              style={{
                padding: '10px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', transition: 'all 0.2s',
                height: '42px', boxSizing: 'border-box'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b98144'; e.currentTarget.style.background = '#10b98108'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <Download size={16} /> Export CSV
            </button>
          </div>

          {/* Data Table */}
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Receipt No</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Student</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Class</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Fee Category</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Amount Paid</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Due Balance</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Date</th>

                </tr>
              </thead>
              <tbody>
                {filteredFees.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No fee records found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredFees.map((fee, idx) => {
                    const statusColors = {
                      Paid: { text: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                      Partial: { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                      Pending: { text: '#ef4444', bg: 'rgba(239,68,68,0.08)' }
                    };
                    const status = fee.paymentStatus || 'Paid';
                    const colors = statusColors[status] || statusColors.Paid;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>{fee.receiptNumber}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                          <div>{fee.studentName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Adm: {fee.admissionNumber}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fee.studentClass}-{fee.section}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fee.feeType}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>₹{fee.paidAmount?.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: fee.dueAmount > 0 ? '#f59e0b' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>₹{fee.dueAmount?.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                            color: colors.text, background: colors.bg, display: 'inline-block'
                          }}>{status}</span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fee.paymentDate}</td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Auxiliary Revenue Entries</h3>
          </div>

          {/* Filter Toolbar */}
          <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                value={auxSearch} 
                onChange={e => setAuxSearch(e.target.value)} 
                placeholder="Search category, receipt number, description..." 
                style={{ ...inputStyle, paddingLeft: '38px' }}
              />
            </div>
            
            <select 
              value={auxCategoryFilter} 
              onChange={e => setAuxCategoryFilter(e.target.value)} 
              style={{ ...inputStyle, width: 'auto', minWidth: '160px', cursor: 'pointer' }}
            >
              <option value="All" style={optionStyle}>All Categories</option>
              {auxiliaryCategories.map(cat => (
                <option key={cat} value={cat} style={optionStyle}>{cat}</option>
              ))}
            </select>

            <button 
              onClick={handleExportAuxiliaryCSV}
              style={{
                padding: '10px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', transition: 'all 0.2s',
                height: '42px', boxSizing: 'border-box'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b98144'; e.currentTarget.style.background = '#10b98108'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <Download size={16} /> Export CSV
            </button>
          </div>

          {/* Data Table */}
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Receipt No</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Category / Source</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Description</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Amount</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Date</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Received By / From</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuxiliaryIncome.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No auxiliary income records found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAuxiliaryIncome.map((inc, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>
                        {inc.receiptNumber || `REC-AUX-${inc.incomeId}`}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        {inc.source}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        {inc.description || '-'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>
                        ₹{inc.amount?.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {inc.date}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {inc.receivedBy || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

/* ============================================================
   REPORTS VIEW
   ============================================================ */
export function ReportsView({ showToast }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [staffPayments, setStaffPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);

  // States
  const [breakdownType, setBreakdownType] = useState('inflow'); // 'inflow' | 'outflow'
  const [trendPeriod, setTrendPeriod] = useState('daily'); // 'daily' | 'monthly' | 'yearly'

  useEffect(() => {
    Promise.all([
      fetch('/api/finance/overview').then(r => r.ok ? r.json() : null),
      fetch('/api/finance/fees').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/payroll').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/staff-payments').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/expenses').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/income?includeAuxiliary=true').then(r => r.ok ? r.json() : []),
    ]).then(([overviewData, feesData, payrollData, staffPaymentsData, expensesData, incomeData]) => {
      setOverview(overviewData);
      setFees(feesData);
      setPayroll(payrollData);
      setStaffPayments(staffPaymentsData);
      setExpenses(expensesData);
      setIncome(incomeData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
      <Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} />
    </div>
  );

  // Real-time calculations
  const totalFeeCollections = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalPayrollPaid = expenses.filter(e => !e.deleted && e.category === 'Salary').reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalOperationalExpenses = expenses.filter(e => !e.deleted && e.category !== 'Salary').reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPendingFees = fees.reduce((sum, f) => sum + (f.dueAmount || 0), 0);

  const totalInflow = totalFeeCollections + income.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalOutflow = totalPayrollPaid + totalOperationalExpenses;

  // Breakdown Calculations
  const inflowBreakdown = {
    'Tuition Fee': 0,
    'Admission Fee': 0,
    'Exam Fee': 0,
    'Transport Fee': 0,
    'Other Charges': 0
  };
  fees.forEach(f => {
    const type = f.feeType || 'Other Charges';
    inflowBreakdown[type] = (inflowBreakdown[type] || 0) + (f.paidAmount || 0);
  });
  income.forEach(i => {
    const src = `Auxiliary: ${i.source || 'Other'}`;
    inflowBreakdown[src] = (inflowBreakdown[src] || 0) + (i.amount || 0);
  });

  const outflowBreakdown = {};
  expenses.filter(e => !e.deleted).forEach(e => {
    if (e.category === 'Salary') {
      const sub = e.subcategory || 'Teacher Salary';
      outflowBreakdown[sub] = (outflowBreakdown[sub] || 0) + (e.amount || 0);
    } else {
      outflowBreakdown[e.category] = (outflowBreakdown[e.category] || 0) + (e.amount || 0);
    }
  });

  const breakdownData = breakdownType === 'inflow' ? inflowBreakdown : outflowBreakdown;
  const totalBreakdownSum = Object.values(breakdownData).reduce((sum, v) => sum + v, 0);
  const sortedBreakdown = Object.entries(breakdownData)
    .filter(([_, val]) => val > 0)
    .sort((a, b) => b[1] - a[1]);

  const categoryColors = {
    'Tuition Fee': '#3b82f6',
    'Admission Fee': '#8b5cf6',
    'Exam Fee': '#6366f1',
    'Transport Fee': '#06b6d4',
    'Other Charges': '#64748b',
    'Teacher Salary': '#8b5cf6',
    'Staff Salary': '#a855f7',
    Maintenance: '#f59e0b',
    Stationery: '#10b981',
    Transport: '#06b6d4',
    Utilities: '#ec4899',
    Infrastructure: '#14b8a6',
    Events: '#f97316',
    Other: '#6b7280'
  };

  // Dynamic Trend calculations
  // 1. Daily cash flow trend (June 2026)
  const currentYearMonth = '2026-06';
  const daysInMonth = 30; // June has 30 days
  const dailyData = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${currentYearMonth}-${dayStr}`;
    
    const dayFees = fees
      .filter(f => f.paymentDate === dateStr)
      .reduce((sum, f) => sum + (f.paidAmount || 0), 0);
      
    const dayIncome = income
      .filter(i => i.date === dateStr)
      .reduce((sum, i) => sum + (i.amount || 0), 0);
      
    const dayExpenses = expenses
      .filter(e => !e.deleted && e.date === dateStr)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const dayInflow = dayFees + dayIncome;
    const dayOutflow = dayExpenses;
    
    if (dayInflow > 0 || dayOutflow > 0) {
      dailyData.push({
        label: `Jun ${dayStr}`,
        inflow: dayInflow,
        outflow: dayOutflow
      });
    }
  }

  // 2. Monthly cash flow trend (Current Year 2026)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = months.map((mName, mIdx) => {
    const yearMonth = `2026-${String(mIdx + 1).padStart(2, '0')}`;
    
    const monthFees = fees
      .filter(f => f.paymentDate?.startsWith(yearMonth))
      .reduce((sum, f) => sum + (f.paidAmount || 0), 0);
      
    const monthIncome = income
      .filter(i => i.date?.startsWith(yearMonth))
      .reduce((sum, i) => sum + (i.amount || 0), 0);
      
    const monthExpenses = expenses
      .filter(e => !e.deleted && e.date?.startsWith(yearMonth))
      .reduce((sum, e) => sum + (e.amount || 0), 0);
      
    return {
      label: `${mName} 2026`,
      inflow: monthFees + monthIncome,
      outflow: monthExpenses
    };
  }).filter(m => m.inflow > 0 || m.outflow > 0);

  // 3. Yearly cash flow trend
  const yearlyMap = {};
  fees.forEach(f => {
    const year = f.paymentDate ? f.paymentDate.substring(0, 4) : '2026';
    if (!yearlyMap[year]) yearlyMap[year] = { label: year, inflow: 0, outflow: 0 };
    yearlyMap[year].inflow += (f.paidAmount || 0);
  });
  income.forEach(i => {
    const year = i.date ? i.date.substring(0, 4) : '2026';
    if (!yearlyMap[year]) yearlyMap[year] = { label: year, inflow: 0, outflow: 0 };
    yearlyMap[year].inflow += (i.amount || 0);
  });
  expenses.filter(e => !e.deleted).forEach(e => {
    const year = e.date ? e.date.substring(0, 4) : '2026';
    if (!yearlyMap[year]) yearlyMap[year] = { label: year, inflow: 0, outflow: 0 };
    yearlyMap[year].outflow += (e.amount || 0);
  });
  const yearlyData = Object.values(yearlyMap).sort((a, b) => a.label.localeCompare(b.label));

  // Determine active trend list
  let trendData = [];
  if (trendPeriod === 'daily') {
    trendData = dailyData;
  } else if (trendPeriod === 'monthly') {
    trendData = monthlyData;
  } else {
    trendData = yearlyData;
  }

  // Calculate scaling max
  const maxInflow = Math.max(...trendData.map(t => t.inflow), 1);
  const maxOutflow = Math.max(...trendData.map(t => t.outflow), 1);
  const maxOverall = Math.max(maxInflow, maxOutflow, 1);



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '14px', borderLeft: '4px solid #3b82f6' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Fee Collections</p>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', marginTop: '6px' }}>₹{totalFeeCollections.toLocaleString()}</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Real-time student fee receipts</span>
        </div>
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '14px', borderLeft: '4px solid #8b5cf6' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payroll Payouts</p>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6', marginTop: '6px' }}>₹{totalPayrollPaid.toLocaleString()}</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Salaries paid to teachers & staff</span>
        </div>
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '14px', borderLeft: '4px solid #ef4444' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Expenses</p>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '6px' }}>₹{totalOperationalExpenses.toLocaleString()}</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Non-salary operations costs</span>
        </div>
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '14px', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding Receivables</p>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '6px' }}>₹{totalPendingFees.toLocaleString()}</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pending student fee balances</span>
        </div>
      </div>

      {/* Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Cash Flow Trend Chart */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} style={{ color: '#10b981' }} /> Cash Flow Trend
            </h3>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '2px' }}>
              {[
                { key: 'daily', label: 'Daily (Jun 2026)' },
                { key: 'monthly', label: 'Monthly (2026)' },
                { key: 'yearly', label: 'Yearly' }
              ].map(p => (
                <button 
                  key={p.key}
                  onClick={() => setTrendPeriod(p.key)} 
                  style={{
                    border: 'none', background: trendPeriod === p.key ? 'rgba(16,185,129,0.12)' : 'none',
                    color: trendPeriod === p.key ? '#10b981' : 'var(--text-muted)',
                    fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
            {trendData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>No transaction records</span>
                <span>Trends will populate once data is logged</span>
              </div>
            ) : (
              trendData.map((t, idx) => {
                const inflowPercent = Math.round((t.inflow / maxOverall) * 100);
                const outflowPercent = Math.round((t.outflow / maxOverall) * 100);

                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t.label}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${inflowPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', minWidth: '60px' }}>₹{t.inflow.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${outflowPercent}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #dc2626)', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', minWidth: '60px' }}>₹{t.outflow.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real-Time Category Breakdown */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} style={{ color: breakdownType === 'inflow' ? '#10b981' : '#ef4444' }} /> Category Wise Distribution
            </h3>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '2px' }}>
              <button 
                onClick={() => setBreakdownType('inflow')} 
                style={{
                  border: 'none', background: breakdownType === 'inflow' ? 'rgba(16,185,129,0.12)' : 'none',
                  color: breakdownType === 'inflow' ? '#10b981' : 'var(--text-muted)',
                  fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer'
                }}
              >
                Inflows
              </button>
              <button 
                onClick={() => setBreakdownType('outflow')} 
                style={{
                  border: 'none', background: breakdownType === 'outflow' ? 'rgba(239,68,68,0.12)' : 'none',
                  color: breakdownType === 'outflow' ? '#ef4444' : 'var(--text-muted)',
                  fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer'
                }}
              >
                Outflows
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
            {sortedBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>No distribution data</span>
                <span>Values will show once ledger is populated</span>
              </div>
            ) : (
              sortedBreakdown.map(([cat, val]) => {
                const pct = totalBreakdownSum > 0 ? Math.round((val / totalBreakdownSum) * 100) : 0;
                const barColor = categoryColors[cat] || (breakdownType === 'inflow' ? '#10b981' : '#6366f1');
                return (
                  <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>₹{val.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>



    </div>
  );
}

/* ============================================================
   TEACHER SALARY STRUCTURE VIEW
   ============================================================ */
const fallbackStaffRoles = [
  'Teacher',
  'Principal',
  'Vice Principal',
  'Academic Coordinator',
  'Receptionist',
  'Accountant',
  'Expense Manager'
];

export function TeacherSalaryStructureView({ showToast }) {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    role: 'Teacher', basicSalary: '', allowances: '0',
    deductions: '0', pfDeduction: '0', taxDeduction: '0'
  });
  const [gradeRange, setGradeRange] = useState('');
  const [roles, setRoles] = useState([]);

  const fetchStructures = () => {
    fetch('/api/finance/salary-structures')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setStructures(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchRoles = () => {
    fetch('/api/rbac/roles')
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        const activeRoles = d.filter(r => r.active && !['Developer Admin', 'Main Admin', 'Admin Dashboard'].includes(r.name));
        setRoles(activeRoles);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStructures();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (showForm) {
      fetchRoles();
    }
  }, [showForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalRole = gradeRange.trim() ? gradeRange.trim() : 'Teacher';
    const formData = {
      ...form,
      role: finalRole
    };
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/finance/salary-structures/${editingId}` : '/api/finance/salary-structures';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showToast(`Salary structure for ${finalRole} saved!`);
        setEditingId(null);
        setForm({
          role: 'Teacher', basicSalary: '', allowances: '0',
          deductions: '0', pfDeduction: '0', taxDeduction: '0'
        });
        setGradeRange('');
        setShowForm(false);
        fetchStructures();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  const handleDelete = (id, name) => {
    setConfirmDelete({ id, name });
  };

  const handleEdit = (s) => {
    const roleName = s.role || s.designation;
    setGradeRange(roleName === 'Teacher' ? '' : (roleName || ''));

    setForm({
      role: 'Teacher',
      basicSalary: String(s.basicSalary || ''),
      allowances: '0',
      deductions: '0',
      pfDeduction: String(s.pfDeduction || '0'),
      taxDeduction: String(s.taxDeduction || '0')
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const netSalary = Number(form.basicSalary || 0) - Number(form.pfDeduction || 0) - Number(form.taxDeduction || 0);

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  const filteredTeacherStructures = structures;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {hasPermission('teacher-pay-structure', 'create') && (
          <button onClick={() => { setEditingId(null); setGradeRange(''); setShowForm(true); }} style={{
            padding: '10px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
            borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '6px', fontSize: '0.85rem'
          }}>
            <Plus size={16} /> Add Teacher Pay Structure
          </button>
        )}
      </div>

      {showForm && createPortal(
        <div className="modal-overlay" onClick={() => { setEditingId(null); setGradeRange(''); setShowForm(false); }}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
            width: '100%', maxWidth: '650px', background: 'var(--bg-elevated)', borderRadius: '20px',
            border: '1px solid var(--border-glass)', padding: '32px', boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Calculator size={18} style={{ color: '#10b981' }} /> Configure Teacher Pay Structure
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Role</label>
                  <input
                    type="text"
                    value="Teacher"
                    readOnly
                    style={{ ...inputStyle, background: 'var(--bg-form-subtle)', cursor: 'not-allowed', color: 'var(--text-muted)' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Create Range / Grade Range</label>
                  <input
                    type="text"
                    placeholder="e.g. Grades 11-12, Grades 1-5..."
                    value={gradeRange}
                    onChange={e => setGradeRange(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                {[
                  ['Basic Salary', 'basicSalary'],
                  ['PF Deduction', 'pfDeduction'], ['Tax Deduction', 'taxDeduction']
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label} (₹)</label>
                    <input type="number" required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.06)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Net Salary</span>
                <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>₹{netSalary.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{
                  padding: '12px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
                  borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem'
                }}><CheckCircle size={16} /> Save Teacher Structure</button>
                <button type="button" onClick={() => { setEditingId(null); setGradeRange(''); setShowForm(false); }} style={{
                  padding: '12px 24px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                  borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border-subtle)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card-subtle)'}><X size={16} /> Close</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
 
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : filteredTeacherStructures.length === 0 ? (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', borderRadius: '16px' }}>
              No teacher salary structures configured yet.
            </div>
          ) : (
            filteredTeacherStructures.map((s, i) => (
              <div key={i} className="glass-panel" style={{ 
                padding: '24px', 
                borderRadius: '16px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                maxWidth: '420px',
                width: '100%',
                background: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '10px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                    {(() => { const roleName = s.role || s.designation; return roleName === 'Teacher' ? 'Teacher' : (roleName.toLowerCase().startsWith('teacher') ? roleName : `Teacher (${roleName})`); })()}
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {[
                    ['Basic Salary', s.basicSalary],
                    ['PF Deduction', s.pfDeduction], ['Tax Deduction', s.taxDeduction]
                  ].map(([l, v], idx) => (
                    <div key={l} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '0.82rem',
                      padding: '8px 0',
                      borderBottom: idx === 2 ? 'none' : '1px solid rgba(0,0,0,0.04)'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{(v || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Net Salary</span>
                    <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.15rem' }}>₹{(s.netSalary || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {hasPermission('teacher-pay-structure', 'edit') && (
                      <button onClick={() => handleEdit(s)} style={{
                        background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#3b82f6', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px',
                        transition: 'all 0.2s'
                      }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; }}
                         onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                         title="Edit Structure">
                        <Pencil size={15} />
                      </button>
                    )}
                    {hasPermission('teacher-pay-structure', 'delete') && (
                      <button onClick={() => handleDelete(s.id, s.role || s.designation)} style={{
                        background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#ef4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px',
                        transition: 'all 0.2s'
                      }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
                         onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                         title="Delete Structure">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <ConfirmDialog
          show={!!confirmDelete}
          message={confirmDelete ? `Are you sure you want to delete the structure for ${confirmDelete.name}?` : ''}
          onConfirm={async () => {
            try {
              const res = await fetch(`/api/finance/salary-structures/${confirmDelete.id}`, { method: 'DELETE' });
              if (res.ok) {
                showToast(`Deleted salary structure for ${confirmDelete.name}`);
                fetchStructures();
              } else {
                showToast('Failed to delete structure', 'error');
              }
            } catch { showToast('Network error', 'error'); }
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
    </div>
  );
}

export function FeesHistoryView({ showToast }) {
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [feePeriods, setFeePeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [expandedStudents, setExpandedStudents] = useState({});
  const [activeGrades, setActiveGrades] = useState([]);
  const [activeSections, setActiveSections] = useState([]);
  const [sectionTab, setSectionTab] = useState('due'); // 'due', 'completed'

  useEffect(() => {
    const loadGradesAndSections = async () => {
      try {
        const [grades, secs] = await Promise.all([
          fetchActiveGrades(),
          fetchActiveSections()
        ]);
        setActiveGrades(grades);
        setActiveSections(secs);
      } catch (err) {
        console.error(err);
      }
    };
    loadGradesAndSections();
  }, []);

  useEffect(() => {
    if (filterClass !== 'All') {
      const matchedGrades = activeGrades.filter(g => parseGradeName(g.name).baseGrade === filterClass);
      const allowedSecs = [...new Set(matchedGrades.flatMap(g => g.sections || []))].sort();
      if (filterSection !== 'All' && !allowedSecs.includes(filterSection)) {
        setFilterSection('All');
      }
    } else {
      setFilterSection('All');
    }
  }, [filterClass, activeGrades, filterSection]);

  const uniqueBaseGrades = [...new Set(activeGrades.map(g => parseGradeName(g.name).baseGrade))];

  const allowedSectionsForFilter = React.useMemo(() => {
    if (filterClass === 'All') {
      return activeSections.map(s => s.name);
    }
    const matchingGrades = activeGrades.filter(g => {
      const parsed = parseGradeName(g.name);
      return parsed.baseGrade === filterClass;
    });
    const sectionsUnion = new Set();
    matchingGrades.forEach(g => {
      if (g.sections) {
        g.sections.forEach(sec => sectionsUnion.add(sec));
      }
    });
    return Array.from(sectionsUnion);
  }, [filterClass, activeGrades, activeSections]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, feesRes, structuresRes, periodsRes] = await Promise.all([
        fetch(`/api/students?limit=1000&status=Active&t=${Date.now()}`),
        fetch(`/api/finance/fees?t=${Date.now()}`),
        fetch(`/api/finance/fee-structures?t=${Date.now()}`),
        fetch(`/api/finance/fee-periods?t=${Date.now()}`)
      ]);

      if (studentsRes.ok && feesRes.ok && structuresRes.ok && periodsRes.ok) {
        const studentsData = await studentsRes.json();
        const feesData = await feesRes.json();
        const structuresData = await structuresRes.json();
        const periodsData = await periodsRes.json();
        setStudents(studentsData.students || []);
        setFees(feesData || []);
        setFeeStructures(structuresData || []);
        setFeePeriods(periodsData || []);
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Error loading fees history data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleCacheUpdate = (e) => {
      const updatedUrl = e.detail?.url || '';
      if (
        updatedUrl.includes('/api/finance/fees') ||
        updatedUrl.includes('/api/students') ||
        updatedUrl.includes('/api/finance/fee-structures') ||
        updatedUrl.includes('/api/finance/fee-periods')
      ) {
        fetchData();
      }
    };
    window.addEventListener('api-cache-updated', handleCacheUpdate);
    return () => {
      window.removeEventListener('api-cache-updated', handleCacheUpdate);
    };
  }, []);

  const getCalculatedAmount = (baseAmount, frequency, hasMonthRange = false) => {
    const amt = Number(baseAmount) || 0;
    if (hasMonthRange) return amt;
    if (frequency === 'Monthly') return Math.round(amt / 12);
    if (frequency === 'Quarterly') return Math.round(amt / 4);
    if (frequency === 'Half-Yearly') return Math.round(amt / 2);
    return amt;
  };

  const groupFeesByStudent = (feesArray) => {
    if (filterClass === 'All' || filterSection === 'All') {
      return [];
    }

    const matchingStudents = students.filter(student => {
      const parsed = parseGradeName(student.studentClass);
      const matchesClass = parsed.baseGrade === filterClass && (!isGrade11or12(filterClass) || filterDept === 'All' || parsed.department === filterDept);
      const matchesSection = student.section === filterSection;
      const matchesSearch = !search || (student.fullName || student.name || '').toLowerCase().includes(search.toLowerCase());
      return matchesClass && matchesSection && matchesSearch;
    });

    return matchingStudents.map(student => {
      const studentFees = (feesArray || []).filter(f => 
        f.studentId === student.id || f.admissionNumber === student.admissionNumber
      );

      const classStructures = feeStructures.filter(fs => fs.studentClass === student.studentClass);
      const periodNames = [...new Set(classStructures.map(fs => fs.monthRange || 'Full Year'))];
      if (periodNames.length === 0) {
        periodNames.push('Full Year');
      }

      const periodsList = periodNames.map(periodName => {
        let matchedFs = classStructures.find(fs => (fs.monthRange || 'Full Year') === periodName);
        if (!matchedFs && classStructures.length > 0) {
          matchedFs = classStructures[0];
        }

        const freq = matchedFs ? (matchedFs.frequency || 'Yearly') : 'Yearly';
        const hasMonthRange = !!(matchedFs && matchedFs.monthRange);

        const configTuition = matchedFs ? getCalculatedAmount(matchedFs.tuitionFee || 0, freq, hasMonthRange) : 0;
        const configTransport = matchedFs ? getCalculatedAmount(matchedFs.transportFee || 0, freq, hasMonthRange) : 0;
        const configOther = matchedFs ? getCalculatedAmount(matchedFs.otherCharges || 0, freq, hasMonthRange) : 0;

        const configMap = {
          'Tuition Fee': configTuition,
          'Transport Fee': configTransport,
          'Other Charges': configOther
        };

        const studentPeriodFees = studentFees.filter(f => f.billingPeriod === periodName);
        const alignedComponents = [];
        const standardTypes = ['Tuition Fee', 'Transport Fee', 'Other Charges'];

        standardTypes.forEach(type => {
          const configAmt = configMap[type] || 0;
          const pay = studentPeriodFees.find(f => f.feeType === type);

          if (configAmt > 0 || pay) {
            const paid = pay ? pay.paidAmount : 0;
            const fine = pay ? pay.fine : 0;
            const due = Math.max(0, (configAmt + fine) - paid);

            alignedComponents.push({
              feeType: type,
              amount: configAmt,
              fine,
              paidAmount: paid,
              dueAmount: due,
              status: pay ? pay.paymentStatus : 'Pending',
              rawFee: pay ? pay : {
                studentId: student.id,
                studentName: student.fullName || student.name,
                admissionNumber: student.admissionNumber,
                studentClass: student.studentClass,
                section: student.section,
                feeType: type,
                amount: configAmt,
                discount: 0,
                fine: 0,
                paidAmount: 0,
                dueAmount: configAmt,
                paymentStatus: 'Pending',
                paymentMethod: 'N/A',
                paymentDate: 'N/A',
                billingPeriod: periodName
              }
            });
          }
        });

        let totalFee = 0;
        let paidAmount = 0;
        let dueAmount = 0;

        alignedComponents.forEach(comp => {
          totalFee += comp.amount + comp.fine;
          paidAmount += comp.paidAmount;
          dueAmount += comp.dueAmount;
        });

        let status = 'Pending';
        if (dueAmount <= 0) {
          status = 'Paid';
        } else if (paidAmount > 0) {
          status = 'Partial';
        }

        const firstPay = studentPeriodFees[0] || {};

        return {
          name: periodName,
          components: alignedComponents,
          totalPeriodFee: totalFee,
          paidPeriodAmount: paidAmount,
          duePeriodAmount: dueAmount,
          status,
          paymentMethod: firstPay.paymentMethod || 'N/A',
          paymentDate: firstPay.paymentDate || 'N/A',
          receiptNumber: firstPay.receiptNumber || 'N/A'
        };
      });

      let overallTotal = 0;
      let overallPaid = 0;
      let overallDue = 0;

      periodsList.forEach(p => {
        overallTotal += p.totalPeriodFee;
        overallPaid += p.paidPeriodAmount;
        overallDue += p.duePeriodAmount;
      });

      let overallStatus = 'Pending';
      if (overallDue <= 0) {
        overallStatus = 'Paid';
      } else if (overallPaid > 0) {
        overallStatus = 'Partial';
      }

      return {
        studentId: student.id,
        studentName: student.fullName || student.name,
        admissionNumber: student.admissionNumber,
        studentClass: student.studentClass,
        section: student.section,
        periods: periodsList,
        overallTotal,
        overallPaid,
        overallDue,
        overallStatus
      };
    });
  };

  const groupedStudents = groupFeesByStudent(fees);
  const filteredGroupedStudents = groupedStudents;

  const toggleStudentExpand = (studentId) => { setExpandedStudents(prev => ({ ...prev, [studentId]: !prev[studentId] })); };

  const inputStyle = { padding: '10px 14px', background: 'var(--bg-form)', border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Grade and Section Selection Panel */}
      <div className="glass-panel animate-scale-up" style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', borderRadius: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          <div style={{ minWidth: '150px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Class / Grade</label>
            <select 
              value={filterClass} 
              onChange={e => {
                setFilterClass(e.target.value);
                setFilterDept('All');
                setFilterSection('All');
              }} 
              style={{ ...inputStyle, background: 'var(--bg-card-subtle)', cursor: 'pointer' }}
            >
              <option value="All" style={optionStyle}>Select Grade</option>
              {uniqueBaseGrades.map(c => <option key={c} value={c} style={optionStyle}>Grade {c}</option>)}
            </select>
          </div>

          {isGrade11or12(filterClass) && (
            <div style={{ minWidth: '150px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Department</label>
              <select 
                value={filterDept} 
                onChange={e => setFilterDept(e.target.value)} 
                style={{ ...inputStyle, background: 'var(--bg-card-subtle)', cursor: 'pointer' }}
              >
                <option value="All" style={optionStyle}>All Departments</option>
                {[...new Set(activeGrades
                  .filter(g => parseGradeName(g.name).baseGrade === filterClass)
                  .map(g => parseGradeName(g.name).department)
                  .filter(Boolean)
                )].map(d => (
                  <option key={d} value={d} style={optionStyle}>{d}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ minWidth: '150px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Section</label>
            <select
              value={filterSection}
              onChange={e => setFilterSection(e.target.value)}
              style={{ ...inputStyle, background: 'var(--bg-card-subtle)', cursor: 'pointer' }}
            >
              <option value="All" style={optionStyle}>Select Section</option>
              {allowedSectionsForFilter.map(sec => (
                <option key={sec} value={sec} style={optionStyle}>Section {sec}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {(filterClass === 'All' || filterSection === 'All') ? (
        <div className="glass-panel animate-scale-up" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Search size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Select Grade and Section to view payment history</div>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '280px' }}><Loader2 className="animate-spin" size={32} /></div>
      ) : filteredGroupedStudents.length === 0 ? (
        <div className="glass-panel animate-scale-up" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-muted)' }}>No student records found in this Grade and Section.</div>
      ) : (
        (() => {
          const renderStudentTable = (list) => {
            return (
              <div className="glass-panel animate-scale-up" style={{ borderRadius: '16px', padding: 0, border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
                {/* Embedded Filters Toolbar inside the glass panel header */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.015)' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search by student name..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '36px', width: '100%', background: 'var(--bg-card-subtle)' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Class: <span style={{ color: 'var(--text-main)' }}>{filterClass}-{filterSection}</span> ({list.length} Student{list.length !== 1 ? 's' : ''})
                    </div>
                    <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--border-glass)', background: 'var(--bg-card-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <tbody>
                      {list.flatMap((student, sIdx) => {
                        const id = student.studentId || `${student.admissionNumber}_${student.studentName}`;
                        const isExpanded = !!expandedStudents[id];
                        const statusColors = {
                          Paid: { text: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
                          Partial: { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
                          Pending: { text: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)' }
                        };
                        const colors = statusColors[student.overallStatus] || statusColors.Paid;
                        
                        const mainRow = (
                          <tr 
                            key={`main-${sIdx}`}
                            style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border-glass)', transition: 'background 0.2s', cursor: 'pointer' }}
                            onClick={() => toggleStudentExpand(id)}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                  width: '38px', 
                                  height: '38px', 
                                  borderRadius: '50%', 
                                  background: colors.bg, 
                                  border: `1.5px solid ${colors.border}`, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  color: colors.text, 
                                  fontWeight: 700, 
                                  fontSize: '0.85rem' 
                                }}>
                                  {student.studentName ? student.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{student.studentName}</div>
                                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                                    <span>Adm: <strong style={{ color: 'var(--text-main)' }}>{student.admissionNumber}</strong></span>
                                    <span>•</span>
                                    <span>Class: <strong style={{ color: 'var(--text-main)' }}>{student.studentClass}-{student.section}</strong></span>
                                    <span>•</span>
                                    <span>Session: <strong style={{ color: 'var(--text-main)' }}>{student.periods[0]?.rawFee?.academicSession || '2026-2027'}</strong></span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              ₹{student.overallTotal.toLocaleString()}
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '0.88rem', fontWeight: 700, color: '#10b981' }}>
                              ₹{student.overallPaid.toLocaleString()}
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '0.88rem', fontWeight: 700, color: student.overallDue > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                              ₹{student.overallDue.toLocaleString()}
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase',
                                color: colors.text, background: colors.bg, border: `1px solid ${colors.border}`, display: 'inline-block', minWidth: '70px'
                              }}>{student.overallStatus}</span>
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                              <ChevronDown size={18} style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
                            </td>
                          </tr>
                        );
                        
                        if (!isExpanded) return [mainRow];
                        
                        const detailsRow = (
                          <tr key={`details-${sIdx}`} style={{ background: 'rgba(0,0,0,0.06)', borderBottom: '1px solid var(--border-glass)' }}>
                            <td colSpan={6} style={{ padding: '20px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {student.periods.map((period, pIdx) => {
                                  const pColors = statusColors[period.status] || statusColors.Paid;
                                  return (
                                    <div key={pIdx} style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <Calendar size={14} style={{ color: '#10b981' }} />
                                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{period.name} Period</span>
                                          <span style={{
                                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700,
                                            color: pColors.text, background: pColors.bg, border: `1px solid ${pColors.border}`
                                          }}>{period.status}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                            Period Total: <span style={{ color: 'var(--text-main)' }}>₹{period.totalPeriodFee.toLocaleString()}</span>
                                            {period.duePeriodAmount > 0 && (
                                              <>
                                                {' '}| Due: <span style={{ color: '#ef4444' }}>₹{period.duePeriodAmount.toLocaleString()}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                          <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '22%', textAlign: 'left' }}>Fee Component</th>
                                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '13%', textAlign: 'right' }}>Amount</th>
                                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '13%', textAlign: 'right' }}>Fine</th>
                                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '13%', textAlign: 'right' }}>Paid</th>
                                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '13%', textAlign: 'right' }}>Due</th>
                                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '10%', textAlign: 'right' }}>Receipt #</th>
                                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '11%', textAlign: 'right' }}>Date</th>
                                              <th style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', width: '11%', textAlign: 'right' }}>Method</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {period.components.map((comp, cIdx) => (
                                              <tr key={cIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.01)', fontSize: '0.8rem' }}>
                                                <td style={{ padding: '10px 10px', fontWeight: 700, color: 'var(--text-main)', width: '22%', textAlign: 'left' }}>{comp.feeType}</td>
                                                <td style={{ padding: '10px 10px', color: 'var(--text-main)', width: '13%', textAlign: 'right' }}>₹{comp.amount.toLocaleString()}</td>
                                                <td style={{ padding: '10px 10px', color: comp.fine > 0 ? '#ef4444' : 'var(--text-muted)', width: '12%', textAlign: 'right' }}>+ ₹{comp.fine.toLocaleString()}</td>
                                                <td style={{ padding: '10px 10px', color: '#10b981', fontWeight: 600, width: '12%', textAlign: 'right' }}>₹{comp.paidAmount.toLocaleString()}</td>
                                                <td style={{ padding: '10px 10px', color: comp.dueAmount > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600, width: '12%', textAlign: 'right' }}>₹{comp.dueAmount.toLocaleString()}</td>
                                                <td style={{ padding: '10px 10px', color: '#10b981', fontWeight: 600, width: '10%', textAlign: 'right' }}>{comp.rawFee?.receiptNumber || '—'}</td>
                                                <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontSize: '0.75rem', width: '11%', textAlign: 'right' }}>
                                                  {comp.rawFee?.paymentDate ? comp.rawFee.paymentDate.split('T')[0] : '—'}
                                                </td>
                                                <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontSize: '0.75rem', width: '11%', textAlign: 'right', fontWeight: 500 }}>
                                                  {comp.rawFee?.paymentDate ? (comp.rawFee.paymentMethod || '—') : '—'}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                        
                        return [mainRow, detailsRow];
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {renderStudentTable(filteredGroupedStudents)}
            </div>
          );
        })()
      )}
    </div>
  );
}

/* ============================================================
   PAYROLL HISTORY VIEW
   ============================================================ */
export function PayrollHistoryView({ showToast }) {
  const [activeTab, setActiveTab] = useState('staff'); // 'staff', 'teacher' or 'employee'
  const [staffHistory, setStaffHistory] = useState([]);
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState(''); // 'YYYY-MM'

  const fetchHistory = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/finance/payroll').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/staff-payments').then(r => r.ok ? r.json() : [])
    ]).then(([staffData, employeeData]) => {
      setStaffHistory(Array.isArray(staffData) ? staffData : []);
      setEmployeeHistory(Array.isArray(employeeData) ? employeeData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handleDeletePayroll = (id) => {
    if (window.confirm('Are you sure you want to delete this payroll record? This will also remove the corresponding salary expense log.')) {
      fetch(`/api/finance/payroll/${id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) {
            showToast('Payroll record deleted successfully.');
            fetchHistory();
          } else {
            showToast('Failed to delete payroll record.', 'error');
          }
        })
        .catch(() => showToast('Network error', 'error'));
    }
  };

  const handleDeleteEmployeePayment = (id) => {
    if (window.confirm('Are you sure you want to delete this employee payment record? This will also remove the corresponding salary expense log.')) {
      fetch(`/api/finance/staff-payments/${id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) {
            showToast('Employee payment record deleted successfully.');
            fetchHistory();
          } else {
            showToast('Failed to delete employee payment record.', 'error');
          }
        })
        .catch(() => showToast('Network error', 'error'));
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  // Filter staff history (STF- prefix or role !== 'Teacher')
  const filteredStaff = staffHistory.filter(p => {
    const isStaffRecord = (p.employeeId || p.teacherId || '').startsWith('STF-') || (p.role !== 'Teacher');
    if (!isStaffRecord) return false;

    if (monthFilter) {
      if (!p.month || !p.month.startsWith(monthFilter)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (p.teacherName || '').toLowerCase();
      return name.includes(q);
    }
    return true;
  });

  // Filter teacher history (TCH- prefix or role === 'Teacher')
  const filteredTeacher = staffHistory.filter(p => {
    const isTeacherRecord = (p.employeeId || p.teacherId || '').startsWith('TCH-') || (p.role === 'Teacher');
    if (!isTeacherRecord) return false;

    if (monthFilter) {
      if (!p.month || !p.month.startsWith(monthFilter)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (p.teacherName || '').toLowerCase();
      return name.includes(q);
    }
    return true;
  });

  // Filter employee history
  const filteredEmployee = employeeHistory.filter(p => {
    if (monthFilter) {
      if (!p.month || !p.month.startsWith(monthFilter)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (p.staffName || '').toLowerCase();
      return name.includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Tab Row */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
        <button
          onClick={() => { setActiveTab('staff'); setSearchQuery(''); }}
          style={{
            background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: 700,
            color: activeTab === 'staff' ? '#8b5cf6' : 'var(--text-muted)',
            borderBottom: activeTab === 'staff' ? '3px solid #8b5cf6' : 'none',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
        >
          <Users size={16} /> Staff Payroll History
        </button>
        <button
          onClick={() => { setActiveTab('teacher'); setSearchQuery(''); }}
          style={{
            background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: 700,
            color: activeTab === 'teacher' ? '#3b82f6' : 'var(--text-muted)',
            borderBottom: activeTab === 'teacher' ? '3px solid #3b82f6' : 'none',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
        >
          <Users size={16} /> Teacher Payroll History
        </button>
        <button
          onClick={() => { setActiveTab('employee'); setSearchQuery(''); }}
          style={{
            background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: 700,
            color: activeTab === 'employee' ? '#ec4899' : 'var(--text-muted)',
            borderBottom: activeTab === 'employee' ? '3px solid #ec4899' : 'none',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
        >
          <UserCog size={16} /> Employee Payroll History
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'staff' ? "Search staff name..." : activeTab === 'teacher' ? "Search teacher name..." : "Search employee name..."}
              style={{ ...inputStyle, paddingLeft: '38px' }}
            />
          </div>
          <div>
            <input
              type="month"
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              style={{ ...inputStyle, width: '200px', cursor: 'pointer' }}
              placeholder="Filter by salary month"
            />
          </div>
          {monthFilter && (
            <button
              onClick={() => setMonthFilter('')}
              style={{
                padding: '10px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              Clear Month
            </button>
          )}
        </div>

        {/* Table list */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            {activeTab === 'staff' || activeTab === 'teacher' ? (
              <>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Payroll ID', activeTab === 'staff' ? 'Staff' : 'Teacher', 'Role', 'Basic', 'PF', 'Tax', 'Net Salary', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</td></tr>
                  ) : (activeTab === 'staff' ? filteredStaff : filteredTeacher).length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No {activeTab === 'staff' ? 'staff' : 'teacher'} payroll history records found.</td></tr>
                  ) : (
                    (activeTab === 'staff' ? filteredStaff : filteredTeacher).map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: activeTab === 'staff' ? '#8b5cf6' : '#3b82f6' }}>{p.payrollId}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{p.teacherName}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.role || p.designation}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>₹{p.basicSalary?.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#ef4444' }}>-₹{p.pfDeduction?.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#ef4444' }}>-₹{p.taxDeduction?.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: activeTab === 'staff' ? '#8b5cf6' : '#3b82f6' }}>₹{p.netSalary?.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                            background: p.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                            color: p.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'
                          }}>{p.paymentStatus}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.paymentDate}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {hasPermission('payroll-history', 'delete') && (
                            <button
                              onClick={() => handleDeletePayroll(p.payrollId)}
                              style={{
                                padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '8px', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem',
                                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            ) : (
              <>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Payment ID', 'Employee', 'Role', 'Basic', 'PF', 'Tax', 'Net Salary', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</td></tr>
                  ) : filteredEmployee.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No employee payroll history records found.</td></tr>
                  ) : (
                    filteredEmployee.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: '#ec4899' }}>{p.paymentId}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{p.staffName}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.staffRole}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>₹{p.basicSalary?.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#ef4444' }}>-₹{p.pfDeduction?.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#ef4444' }}>-₹{p.taxDeduction?.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#ec4899' }}>₹{p.netSalary?.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                            background: p.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                            color: p.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'
                          }}>{p.paymentStatus}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.paymentDate}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {hasPermission('payroll-history', 'delete') && (
                            <button
                              onClick={() => handleDeleteEmployeePayment(p.paymentId)}
                              style={{
                                padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '8px', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem',
                                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

export function PayrollHub({ title, type, showToast }) {
  const [activeTab, setActiveTab] = useState('payroll');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Segmented Tab Selector */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
        <button
          onClick={() => setActiveTab('payroll')}
          className="btn-payroll-row"
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'payroll' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'payroll' ? '#ffffff' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'payroll' ? '0 4px 12px rgba(16,185,129,0.2)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Banknote size={16} /> Process Payroll
        </button>
        <button
          onClick={() => setActiveTab('structure')}
          className="btn-payroll-row"
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'structure' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'structure' ? '#ffffff' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'structure' ? '0 4px 12px rgba(139,92,246,0.2)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Calculator size={16} /> Pay Structure
        </button>
      </div>

      {/* Tab Content Area */}
      <div style={{ marginTop: '10px' }}>
        {type === 'Staff' && (
          <>
            {activeTab === 'payroll' && <PayrollView showToast={showToast} type="Staff" />}
            {activeTab === 'structure' && <StaffPaymentStructureView showToast={showToast} type="Staff" />}
          </>
        )}
        {type === 'Teacher' && (
          <>
            {activeTab === 'payroll' && <PayrollView showToast={showToast} type="Teacher" />}
            {activeTab === 'structure' && <TeacherSalaryStructureView showToast={showToast} />}
          </>
        )}
        {type === 'Employee' && (
          <>
            {activeTab === 'payroll' && <StaffPaymentsView showToast={showToast} />}
            {activeTab === 'structure' && <StaffPaymentStructureView showToast={showToast} type="Employee" />}
          </>
        )}
      </div>
    </div>
  );
}

