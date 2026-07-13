import React, { useState, useEffect, useRef } from 'react';
import './PayrollRedesign.css';
import { 
  DollarSign, Users, UserCheck, UserCog, History, Plus, Search, Settings, 
  CreditCard, Printer, Download, Eye, ArrowUpRight, ArrowDownRight, 
  Calendar, Filter, CheckCircle, Clock, AlertCircle, FileText, ChevronRight, X 
} from 'lucide-react';

// Common utility to get headers with token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const tenant = localStorage.getItem('tenant') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'x-tenant-id': tenant
  };
};

// Formats number to Indian/USD standard currency format
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

// ==========================================
// 1. REDESIGNED PAYROLL HUB (PREMIUM LIGHT THEME)
// ==========================================
export function PayrollHubRedesign({ type, showToast }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryData, setDirectoryData] = useState([]);
  const [allDesignations, setAllDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Salary Configuration States
  const [selectedEmployeeConfig, setSelectedEmployeeConfig] = useState(null);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [revisionHistory, setRevisionHistory] = useState([]);
  
  // Refresh Directory Data
  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/directory?type=${type}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDirectoryData(data);
    } catch (err) {
      showToast?.(err.message || 'Failed to fetch directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignations = async () => {
    try {
      if (type === 'Staff') {
        // For Staff: fetch unique roles from the staff list
        const res = await fetch('/api/staff?limit=1000', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const items = data.teachers || data.data || data || [];
          const roles = [...new Set(items.map(s => s.role || s.designation).filter(Boolean))].sort();
          setAllDesignations(roles);
        }
      } else {
        // For Employee/Teacher: fetch from designations master
        const res = await fetch('/api/designations', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const activeDesignations = data.filter(d => d.status === 'Active' || d.status === 'active').map(d => d.name);
          setAllDesignations(activeDesignations);
        }
      }
    } catch (err) {
      console.error('Failed to load designations:', err);
    }
  };

  useEffect(() => {
    fetchDirectory();
    fetchDesignations();
  }, [type]);

  const handleOpenConfig = async (emp) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/salary-masters/${emp.id}`, {
        headers: getAuthHeaders()
      });
      const config = await res.json();
      
      const revRes = await fetch(`/api/payroll/revisions/${emp.id}`, {
        headers: getAuthHeaders()
      });
      const revisions = await revRes.json();
      setRevisionHistory(revisions);

      setSelectedEmployeeConfig({
        ...emp,
        config: config || {
          basicSalary: 0, hra: 0, da: 0, ta: 0, medical: 0, specialAllowance: 0, otherAllowances: 0,
          pf: 0, esi: 0, profTax: 0, loan: 0, advance: 0, otherDeductions: 0,
          effectiveDate: new Date().toISOString().split('T')[0],
          salaryCycle: 'Monthly',
          status: 'Active'
        }
      });
      setConfigDrawerOpen(true);
    } catch (err) {
      showToast?.('Error loading salary configuration: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Direct instant payment processing
  const handlePaySalaryDirect = async (emp, month, year) => {
    setLoading(true);
    try {
      const configRes = await fetch(`/api/payroll/salary-masters/${emp.id}`, { headers: getAuthHeaders() });
      if (!configRes.ok) throw new Error('Salary master configuration missing for worker');
      const config = await configRes.json();
      const net = parseFloat(config.netSalary || 0);

      const res = await fetch('/api/payroll/payments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employeeId: emp.id,
          employeeType: emp.employeeType || emp.staffCategory || (emp.id.startsWith('TCH') ? 'Teacher' : emp.id.startsWith('EMP') ? 'Employee' : 'Staff'),
          month,
          year,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'Bank Transfer',
          transactionId: 'TXN-' + Date.now(),
          bonus: 0,
          incentive: 0,
          overtime: 0,
          fine: 0,
          loanAdjustment: 0,
          advanceAdjustment: 0,
          remarks: 'Direct Automated Payment',
          paidAmount: net,
          finalPayable: net,
          balance: 0,
          status: 'Paid'
        })
      });

      if (!res.ok) throw new Error(await res.text());
      showToast?.(`Salary paid successfully for ${emp.name}!`, 'success');
      
      await fetchDirectory();
    } catch (err) {
      showToast?.(err.message || 'Payment execution failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payroll-redesign-container" style={{ 
      padding: '28px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '28px',
      background: '#ffffff',
      color: '#0f172a',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
    }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{type} Payroll Management</h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: '#475569' }}>Configure individual salary packages and execute secure, audited payrolls.</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '32px', flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: UserCog },
          { id: 'configuration', label: 'Salary Configuration', icon: Settings },
          { id: 'payment', label: 'Salary Payments', icon: CreditCard }
        ].map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 4px',
                background: 'none',
                border: 'none',
                borderBottom: active ? '3px solid #e07830' : '3px solid transparent',
                color: active ? '#e07830' : '#475569',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.96rem',
                transition: 'all 0.2s',
                marginBottom: '-2px'
              }}
            >
              <Icon size={18} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Renderers */}
      {activeTab === 'dashboard' && <PayrollDashboardRedesign type={type} showToast={showToast} />}
      
      {activeTab === 'configuration' && (
        <SalaryConfigurationTab 
          directoryData={directoryData} 
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onConfigureSalary={handleOpenConfig}
          type={type}
          allDesignations={allDesignations}
        />
      )}

      {activeTab === 'payment' && (
        <PaymentsTab 
          directoryData={directoryData.filter(d => d.salaryStatus === 'Configured')}
          loading={loading}
          onPaySalary={handlePaySalaryDirect}
          showToast={showToast}
          type={type}
          allDesignations={allDesignations}
        />
      )}

      {/* Modals & Slips Drawers */}
      {configDrawerOpen && selectedEmployeeConfig && (
        <SalaryConfigurationDrawer
          employee={selectedEmployeeConfig}
          onClose={() => setConfigDrawerOpen(false)}
          onSave={() => {
            setConfigDrawerOpen(false);
            fetchDirectory();
          }}
          revisionHistory={revisionHistory}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ==========================================
// 2. SALARY CONFIGURATION TAB SUB-COMPONENT
// ==========================================
function SalaryConfigurationTab({ directoryData, loading, searchQuery, setSearchQuery, onConfigureSalary, type, allDesignations = [] }) {
  const [selectedRole, setSelectedRole] = useState('');

  const uniqueDesignations = Array.from(new Set([
    ...allDesignations,
    ...directoryData.map(e => e.role || e.designation).filter(Boolean)
  ]));
  const rolesList = uniqueDesignations;

  const activeRole = selectedRole === '' || selectedRole === 'All' || !uniqueDesignations.includes(selectedRole) ? (uniqueDesignations[0] || '') : selectedRole;

  // Filter query
  const filtered = directoryData.filter(e => {
    const roleOrDesig = (e.role || e.designation || '').toLowerCase();
    const matchesSearch = e.name.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
                          e.id.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
                          (e.department || '').toLowerCase().startsWith(searchQuery.toLowerCase()) ||
                          roleOrDesig.startsWith(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if ((type === 'Staff' || type === 'Employee') && activeRole !== '') {
      return (e.role || e.designation) === activeRole;
    }
    return true;
  });

  const renderTableHeader = () => (
    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Photo</th>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>ID</th>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Name</th>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Department</th>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>{type === 'Staff' ? 'Role' : 'Designation'}</th>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Salary Status</th>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Current Package</th>
      <th style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontWeight: 700 }}>Actions</th>
    </tr>
  );

  const renderTableRow = (emp, index) => (
    <tr key={emp.id} style={{ 
      borderBottom: '1px solid #e2e8f0', 
      background: index % 2 === 0 ? '#ffffff' : '#f8fafc',
      transition: 'all 0.15s'
    }}>
      <td style={{ padding: '14px 16px' }}>
        {emp.photo ? (
          <img src={emp.photo} alt={emp.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
        ) : (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
            {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
        )}
      </td>
      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{emp.id}</td>
      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{emp.name}</td>
      <td style={{ padding: '14px 16px', color: '#334155' }}>{emp.department}</td>
      <td style={{ padding: '14px 16px', color: '#334155' }}>
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.78rem',
          fontWeight: 700,
          background: type === 'Staff' ? '#ede9fe' : '#e0f2fe',
          color: type === 'Staff' ? '#5b21b6' : '#0369a1'
        }}>
          {emp.role || emp.designation}
        </span>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 700,
          background: emp.salaryStatus === 'Configured' ? '#d1fae5' : '#fef3c7',
          color: emp.salaryStatus === 'Configured' ? '#065f46' : '#92400e'
        }}>
          {emp.salaryStatus}
        </span>
      </td>
      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
        {emp.salaryStatus === 'Configured' ? formatCurrency(emp.currentSalary) : '—'}
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        <button
          onClick={() => onConfigureSalary(emp)}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            background: '#e0e7ff',
            border: 'none',
            color: '#e07830',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s'
          }}
        >
          <Settings size={14} />
          {emp.salaryStatus === 'Configured' ? 'Revise Salary' : 'Configure Salary'}
        </button>
      </td>
    </tr>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input
          type="text"
          placeholder="Search by ID, Name, Department to configure..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 44px',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#0f172a',
            fontSize: '0.94rem',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
          }}
        />
      </div>

      {/* Roles Buttons Row side by side (Staff & Employee) */}
      {(type === 'Staff' || type === 'Employee') && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {rolesList.map(roleName => {
            const isActive = activeRole === roleName;
            return (
              <button
                key={roleName}
                onClick={() => setSelectedRole(roleName)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: isActive ? '#0f172a' : '#ffffff',
                  color: isActive ? '#ffffff' : '#0f172a',
                  border: isActive ? '1px solid #0f172a' : '1px solid #cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                {roleName}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '50px', textAlign: 'center', background: '#ffffff', color: '#64748b' }}>
          <Clock className="spin" size={24} style={{ marginBottom: '8px' }} />
          <div>Loading salary masters...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '50px', textAlign: 'center', background: '#ffffff', color: '#64748b' }}>
          <AlertCircle size={24} style={{ marginBottom: '8px' }} />
          <div>No employees found.</div>
        </div>
      ) : (
        // RENDER SINGLE TABLE
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem', background: '#ffffff' }}>
            <thead>
              {renderTableHeader()}
            </thead>
            <tbody>
              {filtered.map((emp, index) => renderTableRow(emp, index))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}// ==========================================
// 3. PAYMENTS TAB SUB-COMPONENT (HIGH CONTRAST)
// ==========================================
function PaymentsTab({ directoryData, loading, onPaySalary, showToast, type, allDesignations = [] }) {
  const today = new Date();
  const curYear = today.getFullYear();
  const currentMonthName = today.toLocaleString('default', { month: 'long' });
  const currentMonthIdx = today.getMonth();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [selectedYear, setSelectedYear] = useState(String(curYear));
  const [paymentsList, setPaymentsList] = useState([]);
  const [loadingPayHistory, setLoadingPayHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Generate years list dynamically from 2024 up to current year
  const dynamicYears = [];
  for (let y = 2024; y <= curYear; y++) {
    dynamicYears.push(String(y));
  }

  // Fetch payments to track duplicate statuses
  const fetchPayments = async () => {
    setLoadingPayHistory(true);
    try {
      const res = await fetch('/api/payroll/payments', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPaymentsList(data);
    } catch (err) {
      showToast?.('Failed to load payroll period context: ' + err.message, 'error');
    } finally {
      setLoadingPayHistory(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [directoryData]);

  // Ensure selected month is not a future month if year is current year
  useEffect(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (parseInt(selectedYear) === curYear) {
      const selectedMonthIdx = months.indexOf(selectedMonth);
      if (selectedMonthIdx > currentMonthIdx) {
        setSelectedMonth(currentMonthName);
      }
    }
  }, [selectedYear, selectedMonth]);

  const getPaidStatusForPeriod = (empId) => {
    const pay = paymentsList.find(p => p.employeeId === empId && p.month === selectedMonth && p.year === selectedYear);
    return pay ? pay.status : 'Unpaid';
  };

  const uniqueDesignations = Array.from(new Set([
    ...allDesignations,
    ...directoryData.map(e => e.role || e.designation).filter(Boolean)
  ]));
  const rolesList = uniqueDesignations;

  const activeRole = selectedRole === '' || selectedRole === 'All' || !uniqueDesignations.includes(selectedRole) ? (uniqueDesignations[0] || '') : selectedRole;

  // Filter list to show all matching workers
  const filtered = directoryData.filter(e => {
    const roleOrDesig = (e.role || e.designation || '').toLowerCase();
    const isMatched = e.name.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
                      e.id.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
                      (e.department || '').toLowerCase().startsWith(searchQuery.toLowerCase()) ||
                      roleOrDesig.startsWith(searchQuery.toLowerCase());
    if (!isMatched) return false;

    if ((type === 'Staff' || type === 'Employee') && activeRole !== '') {
      return (e.role || e.designation) === activeRole;
    }
    return true;
  });

  const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const renderTableHeader = () => (
    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Photo</th>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>ID</th>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Name</th>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Department</th>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>{type === 'Staff' ? 'Role' : 'Designation'}</th>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Net Package Salary</th>
      <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Period Status</th>
      <th style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontWeight: 700 }}>Action</th>
    </tr>
  );

  const renderTableRow = (emp, index) => {
    const payStatus = getPaidStatusForPeriod(emp.id);
    return (
      <tr key={emp.id} style={{ 
        borderBottom: '1px solid #e2e8f0', 
        background: index % 2 === 0 ? '#ffffff' : '#f8fafc',
        transition: 'all 0.15s'
      }}>
        <td style={{ padding: '14px 16px' }}>
          {emp.photo ? (
            <img src={emp.photo} alt={emp.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
              {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          )}
        </td>
        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{emp.id}</td>
        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{emp.name}</td>
        <td style={{ padding: '14px 16px', color: '#334155' }}>{emp.department}</td>
        <td style={{ padding: '14px 16px', color: '#334155' }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: type === 'Staff' ? '#ede9fe' : '#e0f2fe',
            color: type === 'Staff' ? '#5b21b6' : '#0369a1'
          }}>
            {emp.role || emp.designation}
          </span>
        </td>
        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(emp.currentSalary)}</td>
        <td style={{ padding: '14px 16px' }}>
          <span style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            background: payStatus === 'Paid' ? '#d1fae5' : '#fee2e2',
            color: payStatus === 'Paid' ? '#065f46' : '#991b1b'
          }}>
            {payStatus}
          </span>
        </td>
        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
          <button
            onClick={() => onPaySalary(emp, selectedMonth, selectedYear)}
            disabled={payStatus === 'Paid'}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: payStatus === 'Paid' ? '#f1f5f9' : '#10b981',
              border: 'none',
              color: payStatus === 'Paid' ? '#94a3b8' : '#ffffff',
              cursor: payStatus === 'Paid' ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <CreditCard size={14} />
            {payStatus === 'Paid' ? 'Paid' : 'Pay Salary'}
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Month & Year Selectors & Search Toolbar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        gap: '16px', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        background: '#f8fafc', 
        padding: '16px 20px', 
        borderRadius: '12px', 
        border: '1px solid #cbd5e1' 
      }}>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <Calendar size={18} style={{ color: '#e07830' }} />
            <span style={{ fontWeight: 700 }}>Period:</span>
          </div>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600 }}
          >
            {monthsList.map((m, idx) => {
              const isFuture = parseInt(selectedYear) === curYear && idx > currentMonthIdx;
              return (
                <option key={m} value={m} disabled={isFuture}>
                  {m}
                </option>
              );
            })}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600 }}
          >
            {dynamicYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div style={{ position: 'relative', flex: 1, maxWidth: '400px', minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search payment list..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.9rem'
            }}
          />
        </div>

      </div>

      {/* Roles Buttons Row side by side (Staff & Employee) */}
      {(type === 'Staff' || type === 'Employee') && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {rolesList.map(roleName => {
            const isActive = activeRole === roleName;
            return (
              <button
                key={roleName}
                onClick={() => setSelectedRole(roleName)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: isActive ? '#0f172a' : '#ffffff',
                  color: isActive ? '#ffffff' : '#0f172a',
                  border: isActive ? '1px solid #0f172a' : '1px solid #cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                {roleName}
              </button>
            );
          })}
        </div>
      )}

      {loading || loadingPayHistory ? (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '50px', textAlign: 'center', background: '#ffffff', color: '#64748b' }}>
          <Clock className="spin" size={24} style={{ marginBottom: '8px' }} />
          <div>Loading payment queue...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '50px', textAlign: 'center', background: '#ffffff', color: '#64748b' }}>
          <CheckCircle size={24} style={{ marginBottom: '8px', color: '#10b981' }} />
          <div>No employees found.</div>
        </div>
      ) : (
        // RENDER SINGLE TABLE
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem', background: '#ffffff' }}>
            <thead>
              {renderTableHeader()}
            </thead>
            <tbody>
              {filtered.map((emp, index) => renderTableRow(emp, index))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. SALARY CONFIGURATION DRAWER (SOLID WHITE/BLACK TEXT)
// ==========================================
function SalaryConfigurationDrawer({ employee, onClose, onSave, revisionHistory, showToast }) {
  const { config } = employee;
  const [formData, setFormData] = useState({
    basicSalary: config.basicSalary || 0,
    hra: config.hra || 0,
    da: config.da || 0,
    ta: config.ta || 0,
    medical: config.medical || 0,
    specialAllowance: config.specialAllowance || 0,
    otherAllowances: config.otherAllowances || 0,
    pf: config.pf || 0,
    esi: config.esi || 0,
    profTax: config.profTax || 0,
    loan: config.loan || 0,
    advance: config.advance || 0,
    otherDeductions: config.otherDeductions || 0,
    effectiveDate: config.effectiveDate || new Date().toISOString().split('T')[0],
    salaryCycle: config.salaryCycle || 'Monthly',
    status: config.status || 'Active',
    reason: ''
  });
  
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const basic = parseFloat(formData.basicSalary || 0);
  const hra = parseFloat(formData.hra || 0);
  const da = parseFloat(formData.da || 0);
  const ta = parseFloat(formData.ta || 0);
  const medical = parseFloat(formData.medical || 0);
  const specialAllowance = parseFloat(formData.specialAllowance || 0);
  const otherAllowances = parseFloat(formData.otherAllowances || 0);
  
  const grossSalary = basic + hra + da + ta + medical + specialAllowance + otherAllowances;

  const pf = parseFloat(formData.pf || 0);
  const esi = parseFloat(formData.esi || 0);
  const profTax = parseFloat(formData.profTax || 0);
  const loan = parseFloat(formData.loan || 0);
  const advance = parseFloat(formData.advance || 0);
  const otherDeductions = parseFloat(formData.otherDeductions || 0);

  const totalDeductions = pf + esi + profTax + loan + advance + otherDeductions;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/payroll/salary-masters', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employeeId: employee.id,
          employeeType: employee.employeeType || employee.staffCategory || (employee.id.startsWith('TCH') ? 'Teacher' : employee.id.startsWith('EMP') ? 'Employee' : 'Staff'),
          ...formData
        })
      });
      if (!res.ok) throw new Error(await res.text());
      showToast?.('Salary master configuration saved successfully', 'success');
      onSave();
    } catch (err) {
      showToast?.('Failed to save salary configuration: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: '640px', background: '#ffffff', color: '#0f172a', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '28px', borderLeft: '1px solid #cbd5e1', boxShadow: '-10px 0 25px rgba(0,0,0,0.1)' }}>
        
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Salary Configuration</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#475569' }}>{employee.name} ({employee.id})</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          
          {/* Earnings Section */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0d9488', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
              <ArrowUpRight size={18} /> Earnings (Monthly)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {[
                { id: 'basicSalary', label: 'Basic Salary' },
                { id: 'hra', label: 'HRA' },
                { id: 'da', label: 'DA' },
                { id: 'ta', label: 'TA' },
                { id: 'medical', label: 'Medical Allowance' },
                { id: 'specialAllowance', label: 'Special Allowance' },
                { id: 'otherAllowances', label: 'Other Allowances' }
              ].map(f => (
                <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>{f.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData[f.id]}
                    onChange={(e) => handleInputChange(f.id, e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600 }}
                  />
                </div>
              ))}
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', padding: '14px 0 0 0', borderTop: '1px dashed #cbd5e1' }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>Gross Salary:</span>
                <span style={{ fontWeight: 850, color: '#0d9488' }}>{formatCurrency(grossSalary)}</span>
              </div>
            </div>
          </div>

          {/* Deductions Section */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
              <ArrowDownRight size={18} /> Deductions (Monthly)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {[
                { id: 'pf', label: 'Provident Fund (PF)' },
                { id: 'esi', label: 'ESI' },
                { id: 'profTax', label: 'Professional Tax' },
                { id: 'loan', label: 'Loan Recovery' },
                { id: 'advance', label: 'Salary Advance' },
                { id: 'otherDeductions', label: 'Other Deductions' }
              ].map(f => (
                <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>{f.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData[f.id]}
                    onChange={(e) => handleInputChange(f.id, e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600 }}
                  />
                </div>
              ))}
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', padding: '14px 0 0 0', borderTop: '1px dashed #cbd5e1' }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>Total Deductions:</span>
                <span style={{ fontWeight: 850, color: '#e11d48' }}>{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Metadata Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>Effective Date</label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600 }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Salary Revision Log details */}
          {config.netSalary !== undefined && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>Reason for revision (recorded in history)</label>
              <input
                type="text"
                placeholder="e.g. Annual Promotion / Increment"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600 }}
              />
            </div>
          )}

          {/* Summary calculations card */}
          <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>Monthly Take-home Salary (Net)</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#e07830' }}>{formatCurrency(netSalary)}</div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '14px 28px',
                borderRadius: '8px',
                background: '#e07830',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(224, 94, 0, 0.2)'
              }}
            >
              {submitting ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>

        {/* Revision History List */}
        {revisionHistory.length > 0 && (
          <div style={{ marginTop: '36px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Revision History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {revisionHistory.map((rev, idx) => (
                <div key={idx} style={{ padding: '14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{rev.reason || 'Salary Adjustment'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Revised on {rev.revisedDate}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#0d9488', fontWeight: 800 }}>{formatCurrency(rev.newSalary)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'line-through', marginTop: '2px' }}>{formatCurrency(rev.previousSalary)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 5. PAYROLL REDESIGNED DASHBOARD VIEW
// ==========================================
function PayrollDashboardRedesign({ type, showToast }) {
  const today = new Date();
  const curYear = today.getFullYear();
  const currentMonthName = today.toLocaleString('default', { month: 'long' });

  // Always use current month — no manual period selector
  const selectedMonth = currentMonthName;
  const selectedYear = String(curYear);

  const [selectedRole, setSelectedRole] = useState('All');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available roles/designations for Staff or Employee
  useEffect(() => {
    if (type === 'Staff') {
      fetch('/api/staff?limit=1000', { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => {
          const items = data.teachers || data.data || data || [];
          const roles = [...new Set(items.map(s => s.role || s.designation).filter(Boolean))].sort();
          setAvailableRoles(roles);
        })
        .catch(() => setAvailableRoles([]));
    } else if (type === 'Employee') {
      fetch('/api/employees?limit=1000', { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => {
          const items = data.employees || data.data || data || [];
          const desigs = [...new Set(items.map(e => e.designation).filter(Boolean))].sort();
          setAvailableRoles(desigs);
        })
        .catch(() => setAvailableRoles([]));
    } else if (type === 'Teacher') {
      fetch('/api/rbac/roles', { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => {
          const teacherRoles = (data || []).filter(r => r.active && r.name === 'Teacher').map(r => r.name);
          setAvailableRoles([]);
        })
        .catch(() => setAvailableRoles([]));
    } else {
      setAvailableRoles([]);
    }
  }, [type]);

  const fetchMetrics = () => {
    setLoading(true);
    setError(null);
    const roleParam = selectedRole !== 'All' ? `&role=${encodeURIComponent(selectedRole)}` : '';
    fetch(`/api/payroll/dashboard?type=${type}&month=${selectedMonth}&year=${selectedYear}${roleParam}`, { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to load dashboard metrics');
        }
        return res.json();
      })
      .then(data => {
        if (data && data.summary) {
          setStats(data);
        } else {
          throw new Error('Failed to load dashboard metrics');
        }
      })
      .catch(err => {
        setError(err.message);
        setStats(null);
        showToast?.('Failed to load dashboard metrics', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
  }, [type, selectedMonth, selectedYear, selectedRole]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', padding: '50px', color: '#475569' }}>
        <Clock className="spin" size={24} style={{ marginRight: '8px' }} /> Loading dashboard telemetry analytics...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', padding: '50px', color: '#ef4444' }}>
        <AlertCircle size={36} />
        <div style={{ fontWeight: 705, color: '#64748b' }}>{error || 'Failed to load dashboard metrics'}</div>
        <button 
          onClick={fetchMetrics}
          style={{ padding: '10px 20px', background: '#e07830', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, charts } = stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', background: '#ffffff', color: '#0f172a' }}>

      {/* Current Month Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #e07830 0%, #7c3aed 100%)',
        padding: '14px 22px',
        borderRadius: '14px',
        color: '#fff',
        boxShadow: '0 4px 16px rgba(224, 94, 0,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={20} style={{ opacity: 0.9 }} />
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>
            {type || 'Overall'} Payroll — {selectedMonth} {selectedYear}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: 600 }}>
          Live Real-time Data
        </div>
      </div>

      {/* Role / Designation Filter Tabs (only for Staff and Employee) */}
      {(type === 'Staff' || type === 'Employee') && availableRoles.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {type === 'Staff' ? 'Filter by Role:' : 'Filter by Designation:'}
          </span>
          {['All', ...availableRoles].map(r => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              style={{
                padding: '7px 18px',
                borderRadius: '20px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                border: selectedRole === r ? 'none' : '1px solid #cbd5e1',
                background: selectedRole === r
                  ? 'linear-gradient(135deg, #e07830, #7c3aed)'
                  : '#f8fafc',
                color: selectedRole === r ? '#fff' : '#475569',
                boxShadow: selectedRole === r ? '0 4px 12px rgba(224, 94, 0,0.3)' : 'none',
                transition: 'all 0.2s ease',
                transform: selectedRole === r ? 'translateY(-1px)' : 'none'
              }}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Metrics Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
        {(() => {
          const cards = [];
          if (type === 'Teacher') {
            cards.push({ label: 'Total Teachers', val: summary.totalTeachers, icon: UserCheck, color: '#e0e7ff', iconColor: '#e07830' });
          } else if (type === 'Staff') {
            cards.push({ label: selectedRole !== 'All' ? `${selectedRole}s` : 'Total Staff', val: summary.totalStaff, icon: Users, color: '#d1fae5', iconColor: '#059669' });
          } else if (type === 'Employee') {
            cards.push({ label: selectedRole !== 'All' ? `${selectedRole}s` : 'Total Employees', val: summary.totalEmployees, icon: UserCog, color: '#eff6ff', iconColor: '#2563eb' });
          } else {
            cards.push({ label: 'Total Teachers', val: summary.totalTeachers, icon: UserCheck, color: '#e0e7ff', iconColor: '#e07830' });
            cards.push({ label: 'Total Staff', val: summary.totalStaff, icon: Users, color: '#d1fae5', iconColor: '#059669' });
            cards.push({ label: 'Total Employees', val: summary.totalEmployees, icon: UserCog, color: '#eff6ff', iconColor: '#2563eb' });
          }

          cards.push({ label: 'Monthly Cost (Net)', val: formatCurrency(summary.monthlyPayrollCost), icon: DollarSign, color: '#fce7f3', iconColor: '#db2777' });
          cards.push({ label: `Paid ${type || 'Employee'}s`, val: summary.paidEmployees, icon: CheckCircle, color: '#d1fae5', iconColor: '#059669' });
          cards.push({ label: `Pending ${type || 'Employee'}s`, val: summary.pendingEmployees, icon: Clock, color: '#fef3c7', iconColor: '#d97706' });

          return cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>{c.label}</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '6px', color: '#0f172a' }}>{c.val}</div>
                </div>
                <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.iconColor }}>
                  <Icon size={22} />
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* SVG Dashboard Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* 1. Monthly Payroll Cost Trend */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Monthly Payroll Trend (Past 6 Months)</h3>
          {charts.trend.length === 0 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.9rem' }}>No payment trends logged yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '12px', paddingBottom: '12px', borderBottom: '2px solid #e2e8f0' }}>
                {charts.trend.map((t, idx) => {
                  const maxCost = Math.max(...charts.trend.map(x => parseFloat(x.totalPaid || 0))) || 1;
                  const pct = Math.round((parseFloat(t.totalPaid || 0) / maxCost) * 100);
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(t.totalPaid).split('.')[0]}</span>
                      <div style={{ width: '100%', maxWidth: '38px', height: `${pct * 1.3}px`, background: 'linear-gradient(to top, #e07830, #818cf8)', borderRadius: '6px 6px 0 0', minHeight: '8px' }}></div>
                      <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{t.month.substring(0,3)} {t.year}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Department-wise Payroll */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Department-wise Costs</h3>
          {charts.departmentWise.length === 0 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.9rem' }}>No configurations mapped to departments.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {charts.departmentWise.map((d, idx) => {
                const maxCost = Math.max(...charts.departmentWise.map(x => parseFloat(x.totalCost || 0))) || 1;
                const pct = Math.round((parseFloat(d.totalCost || 0) / maxCost) * 100);
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{d.dept}</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatCurrency(d.totalCost)}</span>
                    </div>
                    <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#10b981', borderRadius: '5px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Salary Distribution Category */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Salary Distribution (Packages)</h3>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', height: '200px' }}>
            <svg width="130" height="130" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4" />
              {(() => {
                const low = parseInt(charts.distribution.low || 0);
                const med = parseInt(charts.distribution.medium || 0);
                const high = parseInt(charts.distribution.high || 0);
                const total = low + med + high || 1;
                
                const lowPct = (low / total) * 100;
                const medPct = (med / total) * 100;
                const highPct = (high / total) * 100;
                
                return (
                  <>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="4.2" strokeDasharray={`${lowPct} ${100 - lowPct}`} strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="4.2" strokeDasharray={`${medPct} ${100 - medPct}`} strokeDashoffset={-lowPct} />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4.2" strokeDasharray={`${highPct} ${100 - highPct}`} strokeDashoffset={-(lowPct + medPct)} />
                  </>
                );
              })()}
            </svg>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Low (< 20K)', color: '#ef4444', val: charts.distribution.low || 0 },
                { label: 'Medium (20K - 50K)', color: '#f59e0b', val: charts.distribution.medium || 0 },
                { label: 'High (>= 50K)', color: '#10b981', val: charts.distribution.high || 0 }
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: c.color }}></div>
                  <span style={{ color: '#475569', fontWeight: 600 }}>{c.label}:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{c.val} employees</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Payment Settlement Ratios */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Current Month Payment Status</h3>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '200px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {[
                { label: 'Paid Ratios', val: summary.paidEmployees, color: '#10b981' },
                { label: 'Pending Ratios', val: summary.pendingEmployees, color: '#f59e0b' }
              ].map((s, i) => {
                const total = summary.paidEmployees + summary.pendingEmployees || 1;
                const pct = Math.round((s.val / total) * 100);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#475569', fontWeight: 600 }}>{s.label}</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{s.val} ({pct}%)</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// ==========================================
// 6. CENTRALIZED PAYROLL HISTORY PAGE (LIGHT THEMED)
// ==========================================
export function PayrollHistoryViewRedesign({ showToast }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSecondary, setFilterSecondary] = useState('All'); // dept / role / designation
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date();
  const curYear = today.getFullYear();
  const currentMonthIdx = today.getMonth();

  // Source-fetched dropdown options (not derived from payments)
  const [sourceOptions, setSourceOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payroll/payments', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPayments(data);
    } catch (err) {
      showToast?.('Error loading history: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dropdown options from source APIs — fully dynamic regardless of payment history
  const fetchSourceOptions = async (category) => {
    setLoadingOptions(true);
    setSourceOptions([]);
    try {
      if (category === 'Staff') {
        // Fetch unique roles from staff list (role stored in designation column)
        const res = await fetch('/api/staff?limit=2000', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const items = data.teachers || data.data || (Array.isArray(data) ? data : []);
          const roles = [...new Set(items.map(s => s.role || s.designation).filter(Boolean))].sort();
          setSourceOptions(roles);
        }
      } else if (category === 'Employee') {
        // Fetch employee designations from the designations master API
        const res = await fetch('/api/designations', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const desigs = [...new Set((data || []).map(d => d.name).filter(Boolean))].sort();
          setSourceOptions(desigs);
        }
      } else if (category === 'Teacher') {
        // Fetch teacher departments from the payroll directory SQL endpoint
        const res = await fetch('/api/payroll/directory?type=Teacher', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const depts = [...new Set((data || []).map(t => t.department).filter(Boolean))].sort();
          setSourceOptions(depts);
        }
      } else {
        // All categories — build unique departments from current payment data
        const depts = [...new Set(payments.map(p => p.department).filter(Boolean))].sort();
        setSourceOptions(depts);
      }
    } catch (err) {
      console.error('Failed to load filter options:', err);
      // Fallback: derive from payment data
      const colCfg = getColumnConfig(category);
      const opts = [...new Set(
        payments
          .filter(p => category === 'All' || p.employeeType === category)
          .map(p => colCfg.accessor(p))
          .filter(v => v && v !== '—')
      )].sort();
      setSourceOptions(opts);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Re-fetch source options whenever category changes
  useEffect(() => {
    setFilterSecondary('All');
    fetchSourceOptions(filterCategory);
  }, [filterCategory]);

  // Also refresh All-category options once payments are loaded
  useEffect(() => {
    if (filterCategory === 'All' && payments.length > 0) {
      const depts = [...new Set(payments.map(p => p.department).filter(Boolean))].sort();
      setSourceOptions(depts);
    }
  }, [payments]);

  // Reset month filter to All if current year is selected and current month is future
  useEffect(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (filterYear === String(curYear)) {
      const selectedMonthIdx = months.indexOf(filterMonth);
      if (selectedMonthIdx > currentMonthIdx) {
        setFilterMonth('All');
      }
    }
  }, [filterYear, filterMonth, curYear, currentMonthIdx]);

  // Determine column label and value accessor based on selected category
  const getColumnConfig = (category) => {
    if (category === 'Staff') return { label: 'Role', accessor: (p) => p.role || p.designation || '—' };
    if (category === 'Employee') return { label: 'Designation', accessor: (p) => p.designation || '—' };
    return { label: 'Department', accessor: (p) => p.department || '—' }; // Teacher or All
  };

  const colConfig = getColumnConfig(filterCategory);

  // Filter Logic
  const filtered = payments.filter(p => {
    if (filterCategory !== 'All' && p.employeeType !== filterCategory) return false;
    if (filterSecondary !== 'All' && colConfig.accessor(p) !== filterSecondary) return false;
    if (filterMonth !== 'All' && p.month !== filterMonth) return false;
    if (filterYear !== 'All' && p.year !== filterYear) return false;
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchName = p.employeeName?.toLowerCase().startsWith(query);
      const matchId = p.employeeId?.toLowerCase().startsWith(query);
      const matchReceipt = p.receiptNo?.toLowerCase().startsWith(query);
      if (!matchName && !matchId && !matchReceipt) return false;
    }
    
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Employee ID', 'Name', 'Category', colConfig.label, 'Period', 'Payable', 'Paid', 'Balance', 'Method', 'Date', 'Status'];
    const rows = filtered.map(p => [
      p.receiptNo, p.employeeId, p.employeeName, p.employeeType, colConfig.accessor(p), `${p.month} ${p.year}`, p.finalPayable, p.paidAmount, p.balance, p.paymentMethod, p.paymentDate, p.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_payment_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Badge color for the secondary column cell
  const getSecondaryBadgeStyle = (category) => {
    if (category === 'Staff') return { background: '#ede9fe', color: '#5b21b6' };
    if (category === 'Employee') return { background: '#e0f2fe', color: '#0369a1' };
    return { background: '#f1f5f9', color: '#334155' }; // Teacher / All
  };

  return (
    <div className="payroll-history-container" style={{ 
      padding: '28px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '28px',
      background: '#ffffff',
      color: '#0f172a',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
    }}>
      
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Payroll Payment History</h1>
        <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: '#475569' }}>Audit and query historic salary slip disbursements and settlement vouchers.</p>
      </div>

      {/* Filter Toolbar */}
      <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
          
          {/* Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700 }}>Category</label>
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600 }}
            >
              <option value="All">All Categories</option>
              <option value="Teacher">Teacher</option>
              <option value="Staff">Staff</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          {/* Dynamic Secondary Filter: Department / Role / Designation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: filterCategory === 'Staff' ? '#5b21b6' : filterCategory === 'Employee' ? '#0369a1' : '#475569' }}>
              {colConfig.label}
              {loadingOptions && <span style={{ fontSize: '0.72rem', fontWeight: 400, marginLeft: '6px', opacity: 0.6 }}>loading...</span>}
            </label>
            <select 
              value={filterSecondary} 
              onChange={(e) => setFilterSecondary(e.target.value)}
              disabled={loadingOptions}
              style={{ 
                padding: '10px', borderRadius: '8px', 
                background: '#ffffff', 
                border: filterCategory === 'Staff' ? '1px solid #a78bfa' : filterCategory === 'Employee' ? '1px solid #7dd3fc' : '1px solid #cbd5e1', 
                color: '#0f172a', fontWeight: 600,
                opacity: loadingOptions ? 0.6 : 1
              }}
            >
              <option value="All">All {colConfig.label}s</option>
              {sourceOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '130px' }}>
            <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700 }}>Month</label>
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600 }}
            >
              <option value="All">All Months</option>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => {
                const isFuture = filterYear === String(curYear) && idx > currentMonthIdx;
                return (
                  <option key={m} value={m} disabled={isFuture}>{m}</option>
                );
              })}
            </select>
          </div>

          {/* Year */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '110px' }}>
            <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700 }}>Year</label>
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600 }}
            >
              <option value="All">All Years</option>
              {(() => {
                const dy = [];
                // Allow dynamic years up to current year, disabling any future year in case list is expanded
                for (let y = 2024; y <= curYear + 1; y++) {
                  dy.push(String(y));
                }
                return dy.map(y => (
                  <option key={y} value={y} disabled={parseInt(y) > curYear}>{y}</option>
                ));
              })()}
            </select>
          </div>

        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Text Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search by Employee Name, ID, or Receipt number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#e07830',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 700,
              boxShadow: '0 2px 4px rgba(224, 94, 0, 0.15)'
            }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* History Table */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem', background: '#ffffff' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Receipt No</th>
              <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Employee ID</th>
              <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Name</th>
              <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Category</th>
              <th style={{ padding: '16px', color: filterCategory === 'Staff' ? '#5b21b6' : filterCategory === 'Employee' ? '#0369a1' : '#0f172a', fontWeight: 700 }}>
                {colConfig.label}
              </th>
              <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Period</th>
              <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Payable Amount</th>
              <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Paid Amount</th>
              <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Balance</th>
              <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Method</th>
              <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Payment Date</th>
              <th style={{ padding: '16px', color: '#0f172a', fontWeight: 700 }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontWeight: 700 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                  <Clock className="spin" size={24} style={{ marginBottom: '8px' }} />
                  <div>Loading history...</div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                  <AlertCircle size={24} style={{ marginBottom: '8px' }} />
                  <div>No payroll records found for matching filters.</div>
                </td>
              </tr>
            ) : (
              filtered.map((p, index) => {
                const secondaryVal = colConfig.accessor(p);
                const badgeStyle = getSecondaryBadgeStyle(p.employeeType);
                return (
                  <tr key={p.id} style={{ 
                    borderBottom: '1px solid #e2e8f0', 
                    background: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                    transition: 'all 0.15s'
                  }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#e07830' }}>{p.receiptNo}</td>
                    <td style={{ padding: '14px 16px', color: '#1e293b' }}>{p.employeeId}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{p.employeeName}</td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>{p.employeeType}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        ...badgeStyle
                      }}>
                        {secondaryVal}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{p.month} {p.year}</td>
                    <td style={{ padding: '14px 16px', color: '#0f172a' }}>{formatCurrency(p.finalPayable)}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#10b981' }}>{formatCurrency(p.paidAmount)}</td>
                    <td style={{ padding: '14px 16px', color: p.balance > 0 ? '#b45309' : '#0f172a', fontWeight: p.balance > 0 ? 700 : 500 }}>{formatCurrency(p.balance)}</td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>{p.paymentMethod}</td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>{p.paymentDate}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: p.status === 'Paid' ? '#d1fae5' : p.status === 'Partial' ? '#fef3c7' : '#fee2e2',
                        color: p.status === 'Paid' ? '#065f46' : p.status === 'Partial' ? '#b45309' : '#991b1b'
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setActiveReceipt(p)}
                        title="View Slip / Receipt"
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#475569',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {activeReceipt && (
        <ReceiptSlipModal 
          receipt={activeReceipt} 
          onClose={() => setActiveReceipt(null)} 
        />
      )}
    </div>
  );
}

// ==========================================
// 6A. RECEIPT & SALARY SLIP MODAL DRAWER
// ==========================================
function ReceiptSlipModal({ receipt, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div style="padding: 40px; color: #000; background: #fff; font-family: sans-serif;">
        ${printContent}
      </div>
    `;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); 
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(5px)', padding: '20px' }}>
      <div style={{ background: '#ffffff', color: '#0f172a', width: '100%', maxWidth: '720px', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '90vh', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        
        {/* Modal Controls */}
        <div style={{ padding: '18px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>Payroll Slips View</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handlePrint}
              style={{ padding: '10px 18px', border: 'none', background: '#e07830', color: '#fff', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(224, 94, 0, 0.15)' }}
            >
              <Printer size={16} /> Print Slip
            </button>
            <button 
              onClick={onClose}
              style={{ padding: '10px 14px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Slip Document body (printable) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: '#ffffff' }} ref={printRef}>
          <div style={{ border: '2px solid #0f172a', padding: '30px', position: 'relative', background: '#ffffff' }}>
            
            {/* Slip Header */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Salary Slip & Receipt</h2>
              <div style={{ fontSize: '0.94rem', color: '#475569' }}>SaaS ERP School Management Portal</div>
              <div style={{ marginTop: '10px', fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>Period: {receipt.month} {receipt.year}</div>
            </div>

            <hr style={{ border: 'none', borderBottom: '2px solid #0f172a', margin: '20px 0' }} />

            {/* Employee Information */}
            <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 700 }}>Employee ID:</td>
                  <td>{receipt.employeeId}</td>
                  <td style={{ padding: '6px 0', fontWeight: 700 }}>Employee Name:</td>
                  <td>{receipt.employeeName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 700 }}>Department:</td>
                  <td>{receipt.department}</td>
                  <td style={{ padding: '6px 0', fontWeight: 700 }}>{receipt.employeeType === 'Staff' ? 'Role:' : 'Designation:'}</td>
                  <td>{receipt.designation}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 700 }}>Receipt Number:</td>
                  <td><strong>{receipt.receiptNo}</strong></td>
                  <td style={{ padding: '6px 0', fontWeight: 700 }}>Payment Date:</td>
                  <td>{receipt.paymentDate}</td>
                </tr>
              </tbody>
            </table>

            {/* Income & Deductions Breakdown Tables */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '28px' }}>
              <table style={{ flex: 1, border: '1px solid #cbd5e1', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 700 }}>Earnings</th>
                    <th style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Basic Salary', val: receipt.basicSalary },
                    { label: 'HRA', val: receipt.hra },
                    { label: 'DA', val: receipt.da },
                    { label: 'TA', val: receipt.ta },
                    { label: 'Medical', val: receipt.medical },
                    { label: 'Special Allowance', val: receipt.specialAllowance },
                    { label: 'Other Allowances', val: receipt.otherAllowances }
                  ].map((x, i) => (
                    <tr key={i}>
                      <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>{x.label}</td>
                      <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{formatCurrency(x.val)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Gross Earnings:</td>
                    <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{formatCurrency(receipt.grossSalary)}</td>
                  </tr>
                </tbody>
              </table>

              <table style={{ flex: 1, border: '1px solid #cbd5e1', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 700 }}>Deductions</th>
                    <th style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Provident Fund (PF)', val: receipt.pf },
                    { label: 'ESI', val: receipt.esi },
                    { label: 'Professional Tax', val: receipt.profTax },
                    { label: 'Loan Repayments', val: receipt.loan },
                    { label: 'Salary Advances', val: receipt.advance },
                    { label: 'Other Deductions', val: receipt.otherDeductions }
                  ].map((x, i) => (
                    <tr key={i}>
                      <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>{x.label}</td>
                      <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{formatCurrency(x.val)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Total Deductions:</td>
                    <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{formatCurrency(receipt.totalDeductions)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Adjustments & Settlement details */}
            <table style={{ width: '100%', border: '1px solid #cbd5e1', borderCollapse: 'collapse', marginBottom: '28px', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 700 }}>Adjustment Adjustments</th>
                  <th style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Bonus / Incentives / Overtime:</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#059669', fontWeight: 700 }}>
                    +{formatCurrency(receipt.bonus + receipt.incentive + receipt.overtime)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Fines / Loan / Advance Adjustment deductions:</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                    -{formatCurrency(receipt.fine + receipt.loanAdjustment + receipt.advanceAdjustment)}
                  </td>
                </tr>
                <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                  <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Base Net Salary (Calculated Package):</td>
                  <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{formatCurrency(receipt.netSalary)}</td>
                </tr>
              </tbody>
            </table>

            {/* Final Pay Card */}
            <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>Final Take-home Payable</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{formatCurrency(receipt.finalPayable)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>Paid Amount</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{formatCurrency(receipt.paidAmount)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>Balance Due</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: receipt.balance > 0 ? '#d97706' : '#10b981', marginTop: '4px' }}>{formatCurrency(receipt.balance)}</div>
              </div>
            </div>

            {/* Footer Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
              <div style={{ width: '200px', borderTop: '1px solid #000', textAlign: 'center', padding: '8px 0', fontSize: '0.88rem', fontWeight: 700 }}>
                Employee Signature
              </div>
              <div style={{ width: '200px', borderTop: '1px solid #000', textAlign: 'center', padding: '8px 0', fontSize: '0.88rem', fontWeight: 700 }}>
                Authorized Signature
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}

