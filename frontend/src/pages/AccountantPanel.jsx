import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard, DollarSign, CreditCard, Users, UserCheck, TrendingUp, TrendingDown,
  PieChart, FileText, Download, Search, Filter, Plus, CheckCircle, AlertCircle,
  Loader2, Calculator, Receipt, Wallet, Building2, ArrowUpRight, ArrowDownRight,
  ChevronDown, Printer, X, IndianRupee, BookOpen, Banknote, HandCoins, CircleDollarSign,
  ClipboardList, BarChart3, Calendar, Eye, UserCog, UserPlus, Pencil, Trash2, LogOut
} from 'lucide-react';

import StudentDirectory from './StudentDirectory';
import { fetchActiveGrades, fetchActiveSections } from '../utils/grades';

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
import TeacherList from './TeacherList';
import StaffDirectory from './StaffDirectory';
import RegisterStudent from './RegisterStudent';
import AddTeacher from './AddTeacher';
import AddStaff from './AddStaff';

export default function AccountantPanel({ setActiveView, onLogout, accountantView, setAccountantView, onBackToMain }) {
  const [notification, setNotification] = useState(null);
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const renderContent = () => {
    switch (accountantView) {
      case 'dashboard': return <DashboardView setAccountantView={setAccountantView} />;
      case 'collect-fees': return <CollectFeesView showToast={showToast} />;
      case 'fee-structure': return <FeeStructureView showToast={showToast} />;
      case 'payroll': return <PayrollView showToast={showToast} />;
      case 'teacher-pay-structure': return <TeacherSalaryStructureView showToast={showToast} />;
      case 'expenses': return <ExpensesView showToast={showToast} />;
      case 'income': return <IncomeView showToast={showToast} />;
      case 'reports': return <ReportsView showToast={showToast} />;
      case 'staff-pay': return <StaffPaymentsView showToast={showToast} />;
      case 'staff-pay-structure': return <StaffPaymentStructureView showToast={showToast} />;
      case 'students': return <StudentDirectory />;
      case 'teacher-list': return <TeacherList setActiveView={setActiveView} readOnly={true} />;
      case 'staff': return <StaffDirectory readOnly={true} />;
      case 'register-student':
        return <RegisterStudent setActiveView={(view) => { if (view === 'students') setAccountantView('students'); else setActiveView(view); }} />;
      case 'add-teacher':
        return <AddTeacher setActiveView={(view) => { if (view === 'teachers' || view === 'teacher-list') setAccountantView('teacher-list'); else setActiveView(view); }} />;
      case 'add-staff':
        return <AddStaff setActiveView={(view) => { if (view === 'staff') setAccountantView('staff'); else setActiveView(view); }} />;
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
               accountantView === 'payroll' ? 'Staff Payroll Management' :
               accountantView === 'teacher-pay-structure' ? 'Staff Pay Structure' :
               accountantView === 'expenses' ? 'Expense Tracker' :
               accountantView === 'income' ? 'Income Tracker' :
               accountantView === 'reports' ? 'Financial Reports' :
               accountantView === 'staff-pay' ? 'Employee Salary Payments' :
               accountantView === 'staff-pay-structure' ? 'Employee Pay Structure' :
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
    { label: 'Other Income', value: `₹${(data?.totalIncome || 0).toLocaleString()}`, icon: HandCoins, color: '#ec4899', bg: 'rgba(236,72,153,0.08)', trend: '0 records', up: true },
  ];

  const quickActions = [
    { label: 'Collect Fees', icon: Receipt, view: 'collect-fees', color: '#10b981' },
    { label: 'Fee Structure', icon: BookOpen, view: 'fee-structure', color: '#3b82f6' },
    { label: 'Process Payroll', icon: Banknote, view: 'payroll', color: '#8b5cf6' },
    { label: 'Staff Pay Structure', icon: Calculator, view: 'teacher-pay-structure', color: '#10b981' },
    { label: 'Employee Payments', icon: UserCog, view: 'staff-pay', color: '#ec4899' },
    { label: 'Employee Pay Structure', icon: Calculator, view: 'staff-pay-structure', color: '#14b8a6' },
    { label: 'Add Expense', icon: TrendingDown, view: 'expenses', color: '#ef4444' },
    { label: 'Add Income', icon: TrendingUp, view: 'income', color: '#f59e0b' },
    { label: 'View Reports', icon: BarChart3, view: 'reports', color: '#06b6d4' },
    { label: 'Student Directory', icon: Users, view: 'students', color: '#14b8a6' },
    { label: 'Staff Directory', icon: UserCheck, view: 'teacher-list', color: '#f97316' },
    { label: 'Employee Directory', icon: UserCog, view: 'staff', color: '#a855f7' },
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

      {/* Quick Actions */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CircleDollarSign size={18} style={{ color: '#10b981' }} /> Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <div key={i} className="glass-panel admin-dash-card" onClick={() => setAccountantView(action.view)} style={{
                padding: '20px', cursor: 'pointer', borderRadius: '14px', transition: 'all 0.2s ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center'
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={22} style={{ color: action.color }} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{action.label}</span>
              </div>
            );
          })}
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
  return clean.includes('11') || clean.includes('12') || clean.includes('XI') || clean.includes('XII');
};

export function CollectFeesView({ showToast }) {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [feeStructures, setFeeStructures] = useState([]);
  const [filterClass, setFilterClass] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    studentId: '', studentName: '', admissionNumber: '', studentClass: '', section: '',
    feeType: 'Tuition Fee', amount: '', discount: '0', fine: '0', paidAmount: '', paymentMethod: 'Cash', remarks: ''
  });
  const [receiptData, setReceiptData] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedFormGrade, setSelectedFormGrade] = useState('');
  const [selectedFormSection, setSelectedFormSection] = useState('');
  const [selectedFormDept, setSelectedFormDept] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [isPaidAmountEdited, setIsPaidAmountEdited] = useState(false);

  useEffect(() => {
    if (!showForm) {
      setStudentSearchQuery('');
      setShowStudentDropdown(false);
      setSelectedFormGrade('');
      setSelectedFormSection('');
      setSelectedFormDept('');
      setEditingId(null);
      setIsPaidAmountEdited(false);
      setForm({
        studentId: '', studentName: '', admissionNumber: '', studentClass: '', section: '',
        feeType: 'Tuition Fee', amount: '', discount: '0', fine: '0', paidAmount: '', paymentMethod: 'Cash', remarks: ''
      });
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
  const feeTypes = ['Tuition Fee', 'Admission Fee', 'Exam Fee', 'Transport Fee', 'Other Charges'];

  const uniqueBaseGrades = [...new Set(activeGrades.map(g => parseGradeName(g.name).baseGrade))];
  const departmentsForSelectedGrade = activeGrades
    .filter(g => parseGradeName(g.name).baseGrade === selectedFormGrade)
    .map(g => parseGradeName(g.name).department)
    .filter(Boolean);

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
    if (search) params.set('search', search);
    fetch(`/api/finance/fees?${params}`)
      .then(r => r.json())
      .then(d => {
        let filtered = d;
        if (filterClass !== 'All' && isGrade11or12(filterClass) && filterDept === 'All') {
          filtered = d.filter(f => parseGradeName(f.studentClass || f.classId).baseGrade === filterClass);
        }
        setFees(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchStudents = () => {
    fetch('/api/students?limit=1000')
      .then(r => r.json())
      .then(d => setStudents(d.students || []))
      .catch(() => {});

    fetch('/api/finance/fee-structures')
      .then(r => r.json())
      .then(d => setFeeStructures(d))
      .catch(() => {});
  };

  useEffect(() => { fetchFees(); fetchStudents(); }, [filterClass, filterDept, filterStatus, search]);

  const selectStudent = (stu) => {
    if (stu) {
      const parsed = parseGradeName(stu.studentClass);
      setSelectedFormGrade(parsed.baseGrade);
      setSelectedFormSection(stu.section);
      setSelectedFormDept(parsed.department);

      const fstr = feeStructures.find(f => f.studentClass === stu.studentClass);
      let defaultAmount = '';
      if (fstr) {
        if (form.feeType === 'Tuition Fee') defaultAmount = fstr.tuitionFee;
        else if (form.feeType === 'Admission Fee') defaultAmount = fstr.admissionFee;
        else if (form.feeType === 'Exam Fee') defaultAmount = fstr.examFee;
        else if (form.feeType === 'Transport Fee') defaultAmount = fstr.transportFee;
        else if (form.feeType === 'Other Charges') defaultAmount = fstr.otherCharges;
      }

      setForm(prev => ({
        ...prev,
        studentId: stu.id,
        studentName: stu.fullName || stu.name,
        admissionNumber: stu.admissionNumber,
        studentClass: stu.studentClass,
        section: stu.section,
        amount: defaultAmount ? String(defaultAmount) : '',
        paidAmount: defaultAmount ? String(defaultAmount) : ''
      }));
      setIsPaidAmountEdited(false);
      setStudentSearchQuery(stu.fullName || stu.name);
      setShowStudentDropdown(false);
    } else {
      setForm(prev => ({
        ...prev,
        studentId: '',
        studentName: '',
        admissionNumber: '',
        studentClass: '',
        section: '',
        amount: '',
        paidAmount: ''
      }));
      setIsPaidAmountEdited(false);
      setStudentSearchQuery('');
    }
  };

  const handleStudentSelect = (e) => {
    const stu = students.find(s => s.id === e.target.value);
    if (stu) {
      const fstr = feeStructures.find(f => f.studentClass === stu.studentClass);
      let defaultAmount = '';
      if (fstr) {
        if (form.feeType === 'Tuition Fee') defaultAmount = fstr.tuitionFee;
        else if (form.feeType === 'Admission Fee') defaultAmount = fstr.admissionFee;
        else if (form.feeType === 'Exam Fee') defaultAmount = fstr.examFee;
        else if (form.feeType === 'Transport Fee') defaultAmount = fstr.transportFee;
        else if (form.feeType === 'Library Fee') defaultAmount = fstr.libraryFee;
        else if (form.feeType === 'Hostel Fee') defaultAmount = fstr.hostelFee;
        else if (form.feeType === 'Other Charges') defaultAmount = fstr.otherCharges;
      }

      setForm(prev => ({
        ...prev,
        studentId: stu.id,
        studentName: stu.fullName || stu.name,
        admissionNumber: stu.admissionNumber,
        studentClass: stu.studentClass,
        section: stu.section,
        amount: defaultAmount ? String(defaultAmount) : '',
        paidAmount: defaultAmount ? String(defaultAmount) : ''
      }));
      setIsPaidAmountEdited(false);
    } else {
      setForm(prev => ({
        ...prev,
        studentId: '',
        studentName: '',
        admissionNumber: '',
        studentClass: '',
        section: '',
        amount: '',
        paidAmount: ''
      }));
      setIsPaidAmountEdited(false);
    }
  };

  const handleFeeTypeChange = (newFeeType, selectedStudentId = form.studentId) => {
    const stu = students.find(s => s.id === selectedStudentId);
    let defaultAmount = '';
    if (stu) {
      const fstr = feeStructures.find(f => f.studentClass === stu.studentClass);
      if (fstr) {
        if (newFeeType === 'Tuition Fee') defaultAmount = fstr.tuitionFee;
        else if (newFeeType === 'Admission Fee') defaultAmount = fstr.admissionFee;
        else if (newFeeType === 'Exam Fee') defaultAmount = fstr.examFee;
        else if (newFeeType === 'Transport Fee') defaultAmount = fstr.transportFee;
        else if (newFeeType === 'Other Charges') defaultAmount = fstr.otherCharges;
      }
    }
    setForm(prev => ({
      ...prev,
      feeType: newFeeType,
      amount: defaultAmount ? String(defaultAmount) : prev.amount,
      paidAmount: defaultAmount ? String(defaultAmount) : prev.paidAmount
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
      discount: String(fee.discount || 0),
      fine: String(fee.fine || 0),
      paidAmount: String(fee.paidAmount || ''),
      paymentMethod: fee.paymentMethod || 'Cash',
      remarks: fee.remarks || ''
    });
    setStudentSearchQuery(fee.studentName);
    const parsed = parseGradeName(fee.studentClass || fee.classId);
    setSelectedFormGrade(parsed.baseGrade);
    setSelectedFormSection(fee.section || fee.sectionId || '');
    setSelectedFormDept(parsed.department);
    setIsPaidAmountEdited(true);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId) {
      showToast('Please select a student from the search results dropdown list.', 'error');
      return;
    }
    try {
      const url = editingId ? `/api/finance/fees/${editingId}` : '/api/finance/fees';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = await res.json();
        if (editingId) {
          showToast(`Fee record updated successfully!`);
        } else {
          showToast(`Fee collected successfully! Receipt: ${data.receiptNumber}`);
          setReceiptData(data);
        }
        setShowForm(false);
        setForm({ studentId: '', studentName: '', admissionNumber: '', studentClass: '', section: '',
          feeType: 'Tuition Fee', amount: '', discount: '0', fine: '0', paidAmount: '', paymentMethod: 'Cash', remarks: '' });
        setEditingId(null);
        fetchFees();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to submit fee record', 'error');
      }
    } catch { showToast('Network error', 'error'); }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setShowForm(true)} style={{
          padding: '10px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
          borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: '6px', fontSize: '0.85rem', boxShadow: '0 4px 15px rgba(16,185,129,0.2)'
        }}>
          <Plus size={16} /> Collect New Fee
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, receipt..."
            style={{ ...inputStyle, paddingLeft: '36px', width: '220px' }} />
        </div>
        <select 
          value={filterClass} 
          onChange={e => {
            setFilterClass(e.target.value);
            setFilterDept('All');
          }} 
          style={{ ...inputStyle, width: '120px', cursor: 'pointer' }}
        >
          <option value="All" style={optionStyle}>All Classes</option>
          {uniqueBaseGrades.map(c => <option key={c} value={c} style={optionStyle}>Grade {c}</option>)}
        </select>
        {isGrade11or12(filterClass) && (
          <select 
            value={filterDept} 
            onChange={e => setFilterDept(e.target.value)} 
            style={{ ...inputStyle, width: '150px', cursor: 'pointer' }}
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
        )}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: '120px', cursor: 'pointer' }}>
          <option value="All" style={optionStyle}>All Status</option>
          <option value="Paid" style={optionStyle}>Paid</option>
          <option value="Pending" style={optionStyle}>Pending</option>
          <option value="Partial" style={optionStyle}>Partial</option>
        </select>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                <div>
                  <label style={labelStyle}>Select Grade</label>
                  <select 
                    value={selectedFormGrade} 
                    onChange={e => {
                      setSelectedFormGrade(e.target.value);
                      setSelectedFormDept('');
                      selectStudent(null);
                    }} 
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="" style={optionStyle}>All Grades</option>
                    {uniqueBaseGrades.map(g => (
                      <option key={g} value={g} style={optionStyle}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Select Section</label>
                  <select 
                    value={selectedFormSection} 
                    onChange={e => {
                      setSelectedFormSection(e.target.value);
                      selectStudent(null);
                    }} 
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="" style={optionStyle}>All Sections</option>
                    {activeSections.map(s => s.name).map(sec => (
                      <option key={sec} value={sec} style={optionStyle}>Section {sec}</option>
                    ))}
                  </select>
                </div>

                {isGrade11or12(selectedFormGrade) && departmentsForSelectedGrade.length > 0 && (
                  <div>
                    <label style={labelStyle}>Select Department</label>
                    <select 
                      value={selectedFormDept} 
                      onChange={e => {
                        setSelectedFormDept(e.target.value);
                        selectStudent(null);
                      }} 
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="" style={optionStyle}>All Departments</option>
                      {departmentsForSelectedGrade.map(dept => (
                        <option key={dept} value={dept} style={optionStyle}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <label style={labelStyle}>Select Student</label>
                  <input 
                    type="text" 
                    placeholder="Type student name to search..." 
                    value={studentSearchQuery} 
                    onChange={(e) => {
                      setStudentSearchQuery(e.target.value);
                      setShowStudentDropdown(true);
                      if (!e.target.value) {
                        selectStudent(null);
                      }
                    }} 
                    onFocus={() => setShowStudentDropdown(true)}
                    onBlur={() => setTimeout(() => setShowStudentDropdown(false), 250)}
                    style={inputStyle}
                  />
                  {showStudentDropdown && (
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
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}>
                      {filteredStudentsForSelect.length === 0 ? (
                        <div style={{ padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No matches found</div>
                      ) : (
                        filteredStudentsForSelect.slice(0, 10).map(s => (
                          <div 
                            key={s.id} 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectStudent(s);
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
                            <span>{s.fullName || s.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Grade {s.studentClass}-{s.section}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Fee Type</label>
                  <select value={form.feeType} onChange={e => handleFeeTypeChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {feeTypes.map(f => <option key={f} value={f} style={optionStyle}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Amount (₹)</label>
                  <input type="number" value={form.amount} onChange={e => updateFormFields({ amount: e.target.value })} required placeholder="12000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Discount (₹)</label>
                  <input type="number" value={form.discount} onChange={e => updateFormFields({ discount: e.target.value })} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fine (₹)</label>
                  <input type="number" value={form.fine} onChange={e => updateFormFields({ fine: e.target.value })} placeholder="0" style={inputStyle} />
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
                const totalAmount = (Number(form.amount) || 0) - (Number(form.discount) || 0) + (Number(form.fine) || 0);
                const dueAmount = totalAmount - (form.paidAmount !== '' ? (Number(form.paidAmount) || 0) : totalAmount);
                return (
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Base Amount</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{Number(form.amount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Discount</span>
                      <span style={{ color: '#ef4444' }}>- ₹{Number(form.discount || 0).toLocaleString()}</span>
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

      {/* Fees Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Receipt #', 'Student', 'Class', 'Fee Type', 'Amount', 'Discount', 'Fine', 'Paid', 'Due', 'Status', 'Method', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={13} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  <Loader2 className="animate-spin" size={20} style={{ marginRight: '8px' }} /> Loading...
                </td></tr>
              ) : fees.length === 0 ? (
                <tr><td colSpan={13} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  No fee records found. Click "Collect New Fee" to get started.
                </td></tr>
              ) : (
                fees.slice(0, 50).map((fee, i) => {
                  const baseAmt = fee.amount !== undefined && fee.amount !== null ? fee.amount : (fee.totalAmount - (fee.fine || 0) + (fee.discount || 0));
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: '#10b981', whiteSpace: 'nowrap' }}>{fee.receiptNumber}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{fee.studentName}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fee.studentClass}-{fee.section}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fee.feeType}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>₹{baseAmt?.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: '#ef4444', whiteSpace: 'nowrap' }}>₹{fee.discount?.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: '#10b981', whiteSpace: 'nowrap' }}>₹{fee.fine?.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: '#10b981', whiteSpace: 'nowrap' }}>₹{fee.paidAmount?.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: fee.dueAmount > 0 ? '#ef4444' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>₹{fee.dueAmount?.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                          background: fee.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : fee.paymentStatus === 'Partial' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                          color: fee.paymentStatus === 'Paid' ? '#10b981' : fee.paymentStatus === 'Partial' ? '#f59e0b' : '#ef4444'
                        }}>{fee.paymentStatus}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fee.paymentMethod}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fee.paymentDate}</td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button onClick={() => handleEdit(fee)} style={{
                            background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                          }} title="Edit"><Pencil size={14} /></button>
                          <button onClick={() => setShowConfirmDelete(fee)} style={{
                            background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                          }} title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog 
        show={!!showConfirmDelete} 
        message={`Are you sure you want to delete the fee record for ${showConfirmDelete?.studentName}?`}
        onConfirm={async () => {
          if (showConfirmDelete) {
            try {
              const res = await fetch(`/api/finance/fees/${showConfirmDelete.id || showConfirmDelete.feeId}`, {
                method: 'DELETE'
              });
              if (res.ok) {
                showToast('Fee record deleted successfully!');
                fetchFees();
              } else {
                showToast('Failed to delete fee record', 'error');
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
  const [form, setForm] = useState({
    studentClass: '', admissionFee: '0', tuitionFee: '0', examFee: '0',
    transportFee: '0', hostelFee: '0', libraryFee: '0', otherCharges: '0'
  });

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

  const fetchStructures = () => {
    fetch('/api/finance/fee-structures')
      .then(r => r.json())
      .then(d => { setStructures(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStructures();
    const loadGrades = async () => {
      const grades = await fetchActiveGrades();
      setActiveGrades(grades);
    };
    loadGrades();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalClass = (isGrade11or12(selectedFormGrade) && selectedFormDept)
      ? `${selectedFormGrade} (${selectedFormDept})`
      : selectedFormGrade;

    if (!finalClass) {
      showToast('Please select a grade', 'error');
      return;
    }

    const payload = {
      ...form,
      studentClass: finalClass
    };

    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/finance/fee-structures/${editingId}` : '/api/finance/fee-structures';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(`Fee structure saved for Grade ${finalClass}!`);
        setEditingId(null);
        setShowForm(false);
        fetchStructures();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save', 'error');
      }
    } catch { showToast('Network error', 'error'); }
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
      otherCharges: String(s.otherCharges || '0')
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

  const total = Number(form.admissionFee || 0) + Number(form.tuitionFee || 0) + Number(form.examFee || 0) +
    Number(form.transportFee || 0) + Number(form.hostelFee || 0) + Number(form.libraryFee || 0) + Number(form.otherCharges || 0);

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
                {[
                  ['Admission Fee', 'admissionFee'], ['Tuition Fee', 'tuitionFee'], ['Exam Fee', 'examFee'],
                  ['Transport Fee', 'transportFee'], ['Other Charges', 'otherCharges']
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label} (₹)</label>
                    <input type="number" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.06)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Annual Fee</span>
                <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>₹{total.toLocaleString()}</span>
              </div>
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
          structures.map((s, i) => (
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
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#3b82f6' }}>Grade {s.studentClass}</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {[
                  ['Admission Fee', s.admissionFee], ['Tuition Fee', s.tuitionFee], ['Exam Fee', s.examFee],
                  ['Transport Fee', s.transportFee], ['Other Charges', s.otherCharges]
                ].map(([l, v], idx) => (
                  <div key={l} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '0.82rem',
                    padding: '8px 0',
                    borderBottom: idx === 4 ? 'none' : '1px solid rgba(0,0,0,0.04)'
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{(v || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Total Fee</span>
                  <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.15rem' }}>₹{(s.totalFee || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(s)} style={{
                    background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#3b82f6', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px',
                    transition: 'all 0.2s'
                  }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; }}
                     onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                     title="Edit Structure">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} style={{
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
          ))
        )}
      </div>

      <ConfirmDialog
        show={!!confirmDelete}
        message="Are you sure you want to delete this fee structure?"
        onConfirm={async () => {
          try {
            const res = await fetch(`/api/finance/fee-structures/${confirmDelete}`, { method: 'DELETE' });
            if (res.ok) { showToast('Fee structure deleted'); fetchStructures(); }
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

export function StaffPaymentStructureView({ showToast }) {
  const [structures, setStructures] = useState([]);
  const [designationOptions, setDesignationOptions] = useState(defaultStaffDesignations);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    designation: '', basicSalary: '', allowances: '', bonus: '0',
    deductions: '0', pfDeduction: '0', taxDeduction: '0'
  });

  const fetchStructures = () => {
    fetch('/api/finance/staff-salary-structures')
      .then(r => r.json())
      .then(d => { setStructures(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchDesignationOptions = () => {
    fetch('/api/staff')
      .then(r => r.json())
      .then(staff => {
        const staffRoles = (staff || []).map(s => s.role).filter(Boolean);
        setDesignationOptions([...new Set([...defaultStaffDesignations, ...staffRoles])]);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStructures();
    fetchDesignationOptions();
  }, []);

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
          designation: '', basicSalary: '', allowances: '', bonus: '0',
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
      allowances: String(s.allowances || ''),
      bonus: String(s.bonus || '0'),
      deductions: String(s.deductions || '0'),
      pfDeduction: String(s.pfDeduction || '0'),
      taxDeduction: String(s.taxDeduction || '0')
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const netSalary = Number(form.basicSalary || 0) + Number(form.allowances || 0) + Number(form.bonus || 0)
    - Number(form.deductions || 0) - Number(form.pfDeduction || 0) - Number(form.taxDeduction || 0);

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} style={{
          padding: '10px 20px', background: 'linear-gradient(135deg, #14b8a6, #0d9488)', border: 'none',
          borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: '6px', fontSize: '0.85rem'
        }}>
          <Plus size={16} /> Add Employee Salary Structure
        </button>
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
                  <Calculator size={18} style={{ color: '#14b8a6' }} /> Configure Employee Salary Structure
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
                  ['Basic Salary', 'basicSalary'], ['Allowances', 'allowances'], ['Bonus', 'bonus'],
                  ['Deductions', 'deductions'], ['PF Deduction', 'pfDeduction'], ['Tax Deduction', 'taxDeduction']
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
                }}><CheckCircle size={16} /> Save Employee Structure</button>
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
          ) : structures.length === 0 ? (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', borderRadius: '16px' }}>
              No employee salary structures configured yet.
            </div>
          ) : (
            structures.map((s, i) => (
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
                    ['Basic Salary', s.basicSalary], ['Allowances', s.allowances], ['Bonus', s.bonus],
                    ['Deductions', s.deductions], ['PF Deduction', s.pfDeduction], ['Tax Deduction', s.taxDeduction]
                  ].map(([l, v], idx) => (
                    <div key={l} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '0.82rem',
                      padding: '8px 0',
                      borderBottom: idx === 5 ? 'none' : '1px solid rgba(0,0,0,0.04)'
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
                    <button onClick={() => handleEdit(s)} style={{
                      background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#3b82f6', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px',
                      transition: 'all 0.2s'
                    }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; }}
                       onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                       title="Edit Structure">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(s.id, s.designation)} style={{
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
    basicSalary: '30000', allowances: '6000', bonus: '0', deductions: '1500',
    pfDeduction: '1500', taxDeduction: '1000', paymentMethod: 'Bank Transfer'
  });
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

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
    fetch('/api/staff')
      .then(r => r.json())
      .then(d => setStaff(d))
      .catch(() => {});
  };

  useEffect(() => { fetchPayments(); fetchStaff(); }, [filterStatus, search]);

  const selectStaff = (s) => {
    if (s) {
      fetch('/api/finance/staff-salary-structures')
        .then(r => r.json())
        .then(structures => {
          const sstr = structures.find(st => st.designation === s.role);
          setForm(prev => ({
            ...prev,
            staffId: s.id,
            staffName: s.name,
            staffRole: s.role,
            department: s.department,
            basicSalary: sstr ? String(sstr.basicSalary) : '30000',
            allowances: sstr ? String(sstr.allowances) : '6000',
            bonus: sstr ? String(sstr.bonus || 0) : '0',
            deductions: sstr ? String(sstr.deductions) : '1500',
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
          const sstr = structures.find(st => st.designation === s.role);
          setForm(prev => ({
            ...prev,
            staffId: s.id,
            staffName: s.name,
            staffRole: s.role,
            department: s.department,
            basicSalary: sstr ? String(sstr.basicSalary) : '30000',
            allowances: sstr ? String(sstr.allowances) : '6000',
            bonus: sstr ? String(sstr.bonus || 0) : '0',
            deductions: sstr ? String(sstr.deductions) : '1500',
            pfDeduction: sstr ? String(sstr.pfDeduction) : '1500',
            taxDeduction: sstr ? String(sstr.taxDeduction) : '1000'
          }));
        })
        .catch(() => {});
    }
  };

  const netSalary = Number(form.basicSalary || 0) + Number(form.allowances || 0) + Number(form.bonus || 0)
    - Number(form.deductions || 0) - Number(form.pfDeduction || 0) - Number(form.taxDeduction || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/finance/staff-payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast(`Payment of ₹${netSalary.toLocaleString()} processed for ${form.staffName}!`);
        setShowForm(false);
        setForm({ staffId: '', staffName: '', staffRole: '', department: '',
          basicSalary: '30000', allowances: '6000', bonus: '0', deductions: '1500',
          pfDeduction: '1500', taxDeduction: '1000', paymentMethod: 'Bank Transfer' });
        fetchPayments();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  const filteredStaffForSelect = staff.filter(s => {
    if (form.staffRole) {
      if ((s.role || '').toLowerCase() !== form.staffRole.toLowerCase()) {
        return false;
      }
    }
    if (staffSearchQuery.trim()) {
      const name = (s.name || '').toLowerCase();
      const role = (s.role || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      const query = staffSearchQuery.toLowerCase();
      return name.includes(query) || role.includes(query) || dept.includes(query);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setShowForm(true)} style={{
          padding: '10px 20px', background: 'linear-gradient(135deg, #ec4899, #db2777)', border: 'none',
          borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: '6px', fontSize: '0.85rem'
        }}>
          <Plus size={16} /> Process Employee Payment
        </button>
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
                            allowances: sstr ? String(sstr.allowances) : '6000',
                            bonus: sstr ? String(sstr.bonus || 0) : '0',
                            deductions: sstr ? String(sstr.deductions) : '1500',
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
                            allowances: '6000',
                            bonus: '0',
                            deductions: '1500',
                            pfDeduction: '1500',
                            taxDeduction: '1000'
                          }));
                        });
                      setStaffSearchQuery('');
                    }}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="" style={optionStyle}>Select designation</option>
                    {defaultStaffDesignations.map(designation => (
                      <option key={designation} value={designation} style={optionStyle}>{designation}</option>
                    ))}
                  </select>
                </div>
                {[
                  ['Basic Salary', 'basicSalary'], ['Allowances', 'allowances'], ['Bonus', 'bonus'],
                  ['Deductions', 'deductions'], ['PF Deduction', 'pfDeduction'], ['Tax Deduction', 'taxDeduction']
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
                {['Payment ID', 'Employee', 'Role', 'Basic', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No employee payment records. Click "Process Employee Payment" to get started.</td></tr>
              ) : (
                payments.slice(0, 50).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#ec4899' }}>{p.paymentId}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{p.staffName}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.staffRole}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>₹{p.basicSalary?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#10b981' }}>+₹{p.allowances?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#ef4444' }}>-₹{((p.deductions || 0) + (p.pfDeduction || 0) + (p.taxDeduction || 0))?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#ec4899' }}>₹{p.netSalary?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                        background: p.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: p.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'
                      }}>{p.paymentStatus}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.paymentDate}</td>
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
export function PayrollView({ showToast }) {
  const [payroll, setPayroll] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    teacherId: '', teacherName: '', employeeId: '', designation: '', department: '',
    basicSalary: '45000', allowances: '5000', bonus: '0', deductions: '2000',
    pfDeduction: '1800', taxDeduction: '1200', paymentMethod: 'Bank Transfer'
  });
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [selectedStructureId, setSelectedStructureId] = useState('');

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
    fetch('/api/teachers?limit=1000')
      .then(r => r.json())
      .then(d => setTeachers(d.teachers || []))
      .catch(() => {});
  };

  const fetchSalaryStructures = () => {
    fetch('/api/finance/salary-structures')
      .then(r => r.json())
      .then(d => setSalaryStructures(d || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPayroll();
    fetchTeachers();
    fetchSalaryStructures();
  }, [filterStatus, search]);

  const selectTeacher = (t) => {
    if (t) {
      const isStandardRole = [
        'Principal', 'Vice Principal', 'Academic Coordinator',
        'Librarian', 'Receptionist', 'Accountant', 'Expense Manager'
      ].includes(t.designation);

      let basicSalary = '45000';
      let allowances = '5000';
      let deductions = '2000';
      let pfDeduction = '1800';
      let taxDeduction = '1200';

      if (isStandardRole) {
        const matchingStructure = salaryStructures.find(s => s.designation === t.designation);
        if (matchingStructure) {
          basicSalary = String(matchingStructure.basicSalary || '0');
          allowances = String(matchingStructure.allowances || '0');
          deductions = String(matchingStructure.deductions || '0');
          pfDeduction = String(matchingStructure.pfDeduction || '0');
          taxDeduction = String(matchingStructure.taxDeduction || '0');
        }
      }

      setForm(prev => ({
        ...prev,
        teacherId: t.id,
        teacherName: t.name,
        employeeId: t.employeeId || `EMP-${t.id}`,
        designation: t.designation || 'Teacher',
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
        designation: '',
        department: '',
        basicSalary: '45000',
        allowances: '5000',
        deductions: '2000',
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
        designation: t.designation || 'Teacher',
        department: t.department || 'General'
      }));
    }
  };

  const netSalary = Number(form.basicSalary || 0) + Number(form.allowances || 0) + Number(form.bonus || 0)
    - Number(form.deductions || 0) - Number(form.pfDeduction || 0) - Number(form.taxDeduction || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/finance/payroll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast(`Salary processed for ${form.teacherName}! Net: ₹${netSalary.toLocaleString()}`);
        setShowForm(false);
        setForm({ teacherId: '', teacherName: '', employeeId: '', designation: '', department: '',
          basicSalary: '45000', allowances: '5000', bonus: '0', deductions: '2000',
          pfDeduction: '1800', taxDeduction: '1200', paymentMethod: 'Bank Transfer' });
        setSelectedStructureId('');
        fetchPayroll();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  const filteredTeachersForSelect = teachers.filter(t => {
    if (form.designation) {
      const formDesg = form.designation.toLowerCase();
      const teacherDesg = (t.designation || '').toLowerCase();
      const isMatch = (formDesg === 'subject teacher' && (teacherDesg === 'subject teacher' || teacherDesg === 'teacher')) ||
                      (formDesg === teacherDesg);
      if (!isMatch) return false;
    }
    if (teacherSearchQuery.trim()) {
      const q = teacherSearchQuery.toLowerCase();
      const name = (t.name || '').toLowerCase();
      const dept = (t.department || '').toLowerCase();
      const desg = (t.designation || '').toLowerCase();
      const empId = (t.employeeId || '').toLowerCase();
      return name.includes(q) || dept.includes(q) || desg.includes(q) || empId.includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setShowForm(true)} style={{
          padding: '10px 20px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none',
          borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: '6px', fontSize: '0.85rem'
        }}>
          <Plus size={16} /> Process Staff Salary
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..."
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
                  <Banknote size={18} style={{ color: '#8b5cf6' }} /> Process Staff Salary
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={labelStyle}>Select Staff</label>
                  <input 
                    type="text" 
                    placeholder="Type staff name to search..." 
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
                  <label style={labelStyle}>Designation</label>
                  <select
                    value={form.designation}
                    onChange={e => {
                      setForm({ ...form, designation: e.target.value });
                    }}
                    required
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="" style={optionStyle}>Select designation</option>
                    <option value="Subject Teacher" style={optionStyle}>Subject Teacher</option>
                    <option value="Principal" style={optionStyle}>Principal</option>
                    <option value="Vice Principal" style={optionStyle}>Vice Principal</option>
                    <option value="Academic Coordinator" style={optionStyle}>Academic Coordinator</option>
                    <option value="Librarian" style={optionStyle}>Librarian</option>
                    <option value="Receptionist" style={optionStyle}>Receptionist</option>
                    <option value="Accountant" style={optionStyle}>Accountant</option>
                    <option value="Expense Manager" style={optionStyle}>Expense Manager</option>
                  </select>
                </div>
                {form.designation === 'Subject Teacher' && (
                  <div>
                    <label style={labelStyle}>Grade Range Pay Tier</label>
                    <select
                      value={selectedStructureId}
                      onChange={e => {
                        const id = e.target.value;
                        setSelectedStructureId(id);
                        const selectedStr = salaryStructures.find(s => s.id === id);
                        if (selectedStr) {
                          setForm(prev => ({
                            ...prev,
                            basicSalary: String(selectedStr.basicSalary || '0'),
                            allowances: String(selectedStr.allowances || '0'),
                            deductions: String(selectedStr.deductions || '0'),
                            pfDeduction: String(selectedStr.pfDeduction || '0'),
                            taxDeduction: String(selectedStr.taxDeduction || '0')
                          }));
                        }
                      }}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="" style={optionStyle}>Select a configured grade/tier to pre-fill</option>
                      {salaryStructures.map(s => (
                        <option key={s.id} value={s.id} style={optionStyle}>
                          {s.designation} (Net: ₹{(s.netSalary || 0).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {[
                  ['Basic Salary', 'basicSalary'], ['Allowances', 'allowances'], ['Bonus', 'bonus'],
                  ['Deductions', 'deductions'], ['PF Deduction', 'pfDeduction'], ['Tax Deduction', 'taxDeduction']
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
                {['Payroll ID', 'Staff', 'Designation', 'Basic', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : payroll.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No payroll records. Click "Process Salary" to get started.</td></tr>
              ) : (
                payroll.slice(0, 50).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: '#8b5cf6' }}>{p.payrollId}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{p.teacherName}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.designation}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>₹{p.basicSalary?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#10b981' }}>+₹{p.allowances?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#ef4444' }}>-₹{(p.deductions + p.pfDeduction + p.taxDeduction)?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#8b5cf6' }}>₹{p.netSalary?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                        background: p.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: p.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'
                      }}>{p.paymentStatus}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.paymentDate}</td>
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
      fetch('/api/finance/income').then(r => r.ok ? r.json() : []),
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
export function IncomeView({ showToast }) {
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

  const sources = ['Donations', 'Grants', 'Event Revenue', 'Canteen', 'Rental', 'Sponsorship', 'Other'];

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/finance/overview').then(r => r.ok ? r.json() : null),
      fetch('/api/finance/fees').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/income').then(r => r.ok ? r.json() : []),
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
  const feeTypesList = ['Tuition Fee', 'Admission Fee', 'Exam Fee', 'Transport Fee', 'Other Charges'];

  const filteredFees = fees.filter(f => {
    const matchesSearch = !feeSearch || 
      f.studentName?.toLowerCase().includes(feeSearch.toLowerCase()) ||
      f.admissionNumber?.toLowerCase().includes(feeSearch.toLowerCase()) ||
      f.receiptNumber?.toLowerCase().includes(feeSearch.toLowerCase());
      
    const matchesClass = feeClassFilter === 'All' || f.studentClass === feeClassFilter;
    const matchesType = feeTypeFilter === 'All' || f.feeType === feeTypeFilter;
    
    return matchesSearch && matchesClass && matchesType;
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
                  <th style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
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
                        <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button 
                            onClick={() => setReceiptData(fee)}
                            style={{
                              background: 'rgba(16,185,129,0.1)', border: 'none', padding: '6px',
                              borderRadius: '8px', color: '#10b981', cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                            }}
                            title="View Receipt"
                            onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; e.currentTarget.style.color = '#10b981'; }}
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Auxiliary Revenue Entries</h3>
          </div>
          {/* Income Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {income.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                No revenue entries recorded yet.
              </div>
            ) : (
              income.map((inc, i) => (
                <div key={i} className="glass-panel" style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: '2px 8px', borderRadius: '10px' }}>{inc.source}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{inc.date}</span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', margin: 0 }}>₹{inc.amount?.toLocaleString()}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '6px', minHeight: '36px' }}>{inc.description || 'No description provided'}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Received: {inc.receivedBy || 'Finance Dept'}</span>
                    <span>ID: {inc.incomeId}</span>
                  </div>
                </div>
              ))
            )}
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
  const [activeLedgerTab, setActiveLedgerTab] = useState('fees');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [breakdownType, setBreakdownType] = useState('inflow'); // 'inflow' | 'outflow'
  const [trendPeriod, setTrendPeriod] = useState('daily'); // 'daily' | 'monthly' | 'yearly'

  useEffect(() => {
    Promise.all([
      fetch('/api/finance/overview').then(r => r.ok ? r.json() : null),
      fetch('/api/finance/fees').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/payroll').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/staff-payments').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/expenses').then(r => r.ok ? r.json() : []),
      fetch('/api/finance/income').then(r => r.ok ? r.json() : []),
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

  const exportCSV = (rows, filename) => {
    if (!rows.length) return showToast('No data to export', 'error');
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    showToast(`${filename} downloaded!`);
  };

  const handleExport = () => {
    let rows = [];
    let filename = '';
    if (activeLedgerTab === 'fees') {
      rows = fees.map(f => ({
        ReceiptNo: f.receiptNumber, Student: f.studentName, Class: f.studentClass, Type: f.feeType, Paid: f.paidAmount, Due: f.dueAmount, Status: f.paymentStatus, Date: f.paymentDate
      }));
      filename = 'fees_report.csv';
    } else if (activeLedgerTab === 'expenses') {
      rows = expenses.filter(e => !e.deleted && e.category !== 'Salary').map(e => ({
        ID: e.expenseId, Title: e.title, Category: e.category, Amount: e.amount, Date: e.date, PaidBy: e.paidBy
      }));
      filename = 'expenses_report.csv';
    } else if (activeLedgerTab === 'salaries') {
      rows = [
        ...payroll.map(p => ({ ID: p.payrollId, Name: p.teacherName, Role: p.designation, Amount: p.netSalary, Method: p.paymentMethod, Date: p.paymentDate })),
        ...staffPayments.map(s => ({ ID: s.paymentId, Name: s.staffName, Role: s.staffRole, Amount: s.netSalary, Method: s.paymentMethod, Date: s.paymentDate }))
      ];
      filename = 'salaries_report.csv';
    } else if (activeLedgerTab === 'auxiliary') {
      rows = income.map(i => ({
        ID: i.incomeId, Source: i.source, Description: i.description, Amount: i.amount, Date: i.date
      }));
      filename = 'auxiliary_income_report.csv';
    }
    exportCSV(rows, filename);
  };

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

  // Unified salaries list
  const salariesList = [
    ...payroll.map(p => ({ id: p.payrollId, name: p.teacherName, role: p.designation, amount: p.netSalary, method: p.paymentMethod, date: p.paymentDate })),
    ...staffPayments.map(s => ({ id: s.paymentId, name: s.staffName, role: s.staffRole, amount: s.netSalary, method: s.paymentMethod, date: s.paymentDate }))
  ].sort((a,b) => b.date.localeCompare(a.date));

  // Styles
  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

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

  const getFilteredData = () => {
    const q = ledgerSearch.toLowerCase();
    if (activeLedgerTab === 'fees') {
      return fees.filter(f => !ledgerSearch || f.studentName?.toLowerCase().includes(q) || f.receiptNumber?.toLowerCase().includes(q) || f.admissionNumber?.toLowerCase().includes(q));
    }
    if (activeLedgerTab === 'expenses') {
      return expenses.filter(e => !e.deleted && e.category !== 'Salary').filter(e => !ledgerSearch || e.title?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q) || e.expenseId?.toLowerCase().includes(q));
    }
    if (activeLedgerTab === 'salaries') {
      return salariesList.filter(s => !ledgerSearch || s.name?.toLowerCase().includes(q) || s.role?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q));
    }
    if (activeLedgerTab === 'auxiliary') {
      return income.filter(i => !ledgerSearch || i.source?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.incomeId?.toLowerCase().includes(q));
    }
    return [];
  };

  const filteredItems = getFilteredData();

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

  const renderLedgerTable = () => {
    if (activeLedgerTab === 'fees') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-glass)' }}>
              {['Receipt No', 'Student Name', 'Class', 'Category', 'Paid', 'Due', 'Status', 'Date'].map(h => (
                <th key={h} style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No records found</td></tr>
            ) : (
              filteredItems.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>{f.receiptNumber}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{f.studentName}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>{f.studentClass}-{f.section}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{f.feeType}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>₹{f.paidAmount?.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: f.dueAmount > 0 ? '#f59e0b' : 'var(--text-muted)' }}>₹{f.dueAmount?.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                      background: f.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.08)' : f.paymentStatus === 'Partial' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                      color: f.paymentStatus === 'Paid' ? '#10b981' : f.paymentStatus === 'Partial' ? '#f59e0b' : '#ef4444'
                    }}>{f.paymentStatus}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.paymentDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }
    if (activeLedgerTab === 'expenses') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-glass)' }}>
              {['Expense ID', 'Title', 'Category', 'Subcategory', 'Amount', 'Paid By', 'Date'].map(h => (
                <th key={h} style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No records found</td></tr>
            ) : (
              filteredItems.map((e, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>{e.expenseId}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{e.title}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>{e.category}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.subcategory || '-'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>₹{e.amount?.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.paidBy}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }
    if (activeLedgerTab === 'salaries') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-glass)' }}>
              {['Payment ID', 'Employee Name', 'Role/Designation', 'Net Paid', 'Payment Method', 'Payout Date'].map(h => (
                <th key={h} style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No records found</td></tr>
            ) : (
              filteredItems.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#8b5cf6' }}>{s.id}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{s.name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>{s.role}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#8b5cf6' }}>₹{s.amount?.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.method}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }
    if (activeLedgerTab === 'auxiliary') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-glass)' }}>
              {['Income ID', 'Source Category', 'Description', 'Amount Inflow', 'Date Received'].map(h => (
                <th key={h} style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No records found</td></tr>
            ) : (
              filteredItems.map((inc, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#06b6d4' }}>{inc.incomeId}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{inc.source}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inc.description || 'No description'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>₹{inc.amount?.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inc.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }
  };

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

      {/* Transaction Ledger */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Real-Time Transaction Ledger</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Inspect all double-entry ledger listings on the fly</p>
          </div>
          <button 
            onClick={handleExport}
            style={{
              padding: '10px 18px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
              borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem',
              boxShadow: '0 4px 15px rgba(16,185,129,0.15)'
            }}
          >
            <Download size={16} /> Export Selected Ledger
          </button>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '2px', flexWrap: 'wrap' }}>
          {[
            { key: 'fees', label: 'Fee Collections', color: '#10b981' },
            { key: 'expenses', label: 'Operational Expenses', color: '#ef4444' },
            { key: 'salaries', label: 'Salary Payouts', color: '#8b5cf6' },
            { key: 'auxiliary', label: 'Auxiliary Revenue', color: '#06b6d4' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveLedgerTab(tab.key); setLedgerSearch(''); }}
              style={{
                background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 700,
                color: activeLedgerTab === tab.key ? tab.color : 'var(--text-muted)',
                borderBottom: activeLedgerTab === tab.key ? `3px solid ${tab.color}` : 'none',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            value={ledgerSearch} 
            onChange={e => setLedgerSearch(e.target.value)} 
            placeholder={`Search by name, ID or details...`}
            style={{ ...inputStyle, paddingLeft: '38px' }}
          />
        </div>

        {/* Table View */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
          {renderLedgerTable()}
        </div>
      </div>

    </div>
  );
}

/* ============================================================
   TEACHER SALARY STRUCTURE VIEW
   ============================================================ */
export function TeacherSalaryStructureView({ showToast }) {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    designation: '', basicSalary: '', allowances: '',
    deductions: '0', pfDeduction: '0', taxDeduction: '0'
  });
  const [selectedRole, setSelectedRole] = useState('');
  const [gradeRange, setGradeRange] = useState('');

  const fetchStructures = () => {
    fetch('/api/finance/salary-structures')
      .then(r => r.json())
      .then(d => { setStructures(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalDesignation = selectedRole === 'Subject Teacher' ? gradeRange : selectedRole;
    if (!finalDesignation) {
      showToast('Please specify a designation or grade range.', 'error');
      return;
    }
    const formData = {
      ...form,
      designation: finalDesignation
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
        showToast(`Salary structure for ${finalDesignation} saved!`);
        setEditingId(null);
        setForm({
          designation: '', basicSalary: '', allowances: '',
          deductions: '0', pfDeduction: '0', taxDeduction: '0'
        });
        setSelectedRole('');
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
    const isStandardRole = [
      'Principal', 'Vice Principal', 'Academic Coordinator',
      'Librarian', 'Receptionist', 'Accountant', 'Expense Manager'
    ].includes(s.designation);

    if (isStandardRole) {
      setSelectedRole(s.designation);
      setGradeRange('');
    } else {
      setSelectedRole('Subject Teacher');
      setGradeRange(s.designation || '');
    }

    setForm({
      designation: s.designation || '',
      basicSalary: String(s.basicSalary || ''),
      allowances: String(s.allowances || ''),
      deductions: String(s.deductions || '0'),
      pfDeduction: String(s.pfDeduction || '0'),
      taxDeduction: String(s.taxDeduction || '0')
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const netSalary = Number(form.basicSalary || 0) + Number(form.allowances || 0)
    - Number(form.deductions || 0) - Number(form.pfDeduction || 0) - Number(form.taxDeduction || 0);

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg-form)',
    border: '1.5px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-main)',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
  const optionStyle = { background: 'var(--bg-form)', color: 'var(--text-main)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => { setEditingId(null); setSelectedRole(''); setGradeRange(''); setShowForm(true); }} style={{
          padding: '10px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
          borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: '6px', fontSize: '0.85rem'
        }}>
          <Plus size={16} /> Add Staff Pay Structure
        </button>
      </div>

      {showForm && createPortal(
        <div className="modal-overlay" onClick={() => { setEditingId(null); setSelectedRole(''); setGradeRange(''); setShowForm(false); }}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-up" style={{
            width: '100%', maxWidth: '650px', background: 'var(--bg-elevated)', borderRadius: '20px',
            border: '1px solid var(--border-glass)', padding: '32px', boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Calculator size={18} style={{ color: '#10b981' }} /> Configure Staff Pay Structure
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Designation</label>
                  <select
                    value={selectedRole}
                    onChange={e => {
                      setSelectedRole(e.target.value);
                      if (e.target.value !== 'Subject Teacher') {
                        setGradeRange('');
                      }
                    }}
                    required
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="" style={optionStyle}>Select designation</option>
                    <option value="Subject Teacher" style={optionStyle}>Subject Teacher</option>
                    <option value="Principal" style={optionStyle}>Principal</option>
                    <option value="Vice Principal" style={optionStyle}>Vice Principal</option>
                    <option value="Academic Coordinator" style={optionStyle}>Academic Coordinator</option>
                    <option value="Librarian" style={optionStyle}>Librarian</option>
                    <option value="Receptionist" style={optionStyle}>Receptionist</option>
                    <option value="Accountant" style={optionStyle}>Accountant</option>
                    <option value="Expense Manager" style={optionStyle}>Expense Manager</option>
                  </select>
                </div>
                {selectedRole === 'Subject Teacher' && (
                  <div>
                    <label style={labelStyle}>Create Range / Grade Range</label>
                    <input
                      type="text"
                      placeholder="e.g. Grades 11-12, Grades 1-5..."
                      value={gradeRange}
                      onChange={e => setGradeRange(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>
                )}
                {[
                  ['Basic Salary', 'basicSalary'], ['Allowances', 'allowances'],
                  ['Deductions', 'deductions'], ['PF Deduction', 'pfDeduction'], ['Tax Deduction', 'taxDeduction']
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
                }}><CheckCircle size={16} /> Save Structure</button>
                <button type="button" onClick={() => { setEditingId(null); setSelectedRole(''); setGradeRange(''); setShowForm(false); }} style={{
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
          ) : structures.length === 0 ? (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', borderRadius: '16px' }}>
              No staff salary structures configured yet.
            </div>
          ) : (
            structures.map((s, i) => (
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
                    {[
                      'Principal', 'Vice Principal', 'Academic Coordinator',
                      'Librarian', 'Receptionist', 'Accountant', 'Expense Manager'
                    ].includes(s.designation) ? s.designation : `Subject Teacher (${s.designation})`}
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {[
                    ['Basic Salary', s.basicSalary], ['Allowances', s.allowances],
                    ['Deductions', s.deductions], ['PF Deduction', s.pfDeduction], ['Tax Deduction', s.taxDeduction]
                  ].map(([l, v], idx) => (
                    <div key={l} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '0.82rem',
                      padding: '8px 0',
                      borderBottom: idx === 4 ? 'none' : '1px solid rgba(0,0,0,0.04)'
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
                    <button onClick={() => handleEdit(s)} style={{
                      background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#3b82f6', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px',
                      transition: 'all 0.2s'
                    }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; }}
                       onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                       title="Edit Structure">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(s.id, s.designation)} style={{
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
