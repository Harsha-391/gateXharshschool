import './LeaveManagement.css';
import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ClipboardList, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  AlertCircle, 
  Search, 
  SlidersHorizontal, 
  Download, 
  ChevronRight, 
  Settings as SettingsIcon, 
  Plus,
  TrendingUp,
  X,
  FileText,
  UserCheck
} from 'lucide-react';

export default function LeaveManagement({ showToast }) {
  // Master Tabs: 'teacher' or 'staff'
  const [roleTab, setRoleTab] = useState('teacher');
  
  // Data States
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeaveType, setSelectedLeaveType] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Table Tabs: 'pending' | 'approved' | 'rejected' | 'today' | 'all'
  const [tableTab, setTableTab] = useState('pending');

  // Modals & Action States
  const [showActionModal, setShowActionModal] = useState(null); // { type: 'approve'|'reject'|'delete', leave: object }
  const [actionRemarks, setActionRemarks] = useState('');
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Fetch Policies and Leaves
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenant = getTenantHeader();
      
      // 1. Fetch Leaves
      const endpoint = roleTab === 'teacher' ? '/api/teacher-leaves/admin' : '/api/staff-leaves/admin';
      const leavesRes = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant
        }
      });
      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        setLeaves(leavesData || []);

        // Get unique departments for filtering
        const depts = [...new Set(leavesData.map(l => roleTab === 'teacher' ? l.teacherDepartment : l.staffDepartment).filter(Boolean))];
        setDepartments(depts);
      } else {
        showToast('Failed to load leave applications.', 'error');
      }

      // 2. Fetch Policies
      const policiesRes = await fetch('/api/leave-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant
        }
      });
      if (policiesRes.ok) {
        const policiesData = await policiesRes.json();
        const activePolicies = policiesData.filter(p => p.employeeType === (roleTab === 'teacher' ? 'Teacher' : 'Staff') && p.status === 'Active');
        setPolicies(activePolicies);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showToast('Error loading leave data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roleTab]);

  const getTenantHeader = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return parts[0];
    }
    return '';
  };

  // KPI Calculations
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  const totalCount = leaves.length;
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length;
  const onLeaveTodayCount = leaves.filter(l => l.status === 'Approved' && l.fromDate <= todayStr && l.toDate >= todayStr).length;
  const leaveUtilization = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  // Filtered Leaves List
  const filteredLeaves = leaves.filter(l => {
    // 1. Search term (Name, ID, Title, Reason)
    const name = (roleTab === 'teacher' ? l.teacherName : l.staffName) || '';
    const empId = (roleTab === 'teacher' ? l.teacherEmployeeId : l.staffEmployeeId) || '';
    const matchSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.reason || '').toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Leave Type
    const matchType = selectedLeaveType === 'All' || l.leaveType === selectedLeaveType;

    // 3. Department
    const dept = (roleTab === 'teacher' ? l.teacherDepartment : l.staffDepartment) || 'N/A';
    const matchDept = selectedDept === 'All' || dept === selectedDept;

    // 4. Status
    const matchStatus = selectedStatus === 'All' || l.status === selectedStatus;

    // 5. Date Range
    let matchDate = true;
    if (fromDate) matchDate = matchDate && l.fromDate >= fromDate;
    if (toDate) matchDate = matchDate && l.toDate <= toDate;

    return matchSearch && matchType && matchDept && matchStatus && matchDate;
  });

  // Table Tab Filtered Data
  const tableData = filteredLeaves.filter(l => {
    if (tableTab === 'pending') return l.status === 'Pending';
    if (tableTab === 'approved') return l.status === 'Approved';
    if (tableTab === 'rejected') return l.status === 'Rejected';
    if (tableTab === 'today') return l.status === 'Approved' && l.fromDate <= todayStr && l.toDate >= todayStr;
    return true; // 'all'
  });

  // Handle Approve/Reject/Delete Submit
  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!showActionModal) return;

    const { type, leave } = showActionModal;
    try {
      const token = localStorage.getItem('token');
      const tenant = getTenantHeader();
      let url = '';
      
      if (type === 'approve') {
        url = roleTab === 'teacher' ? `/api/teacher-leaves/${leave.id}/approve` : `/api/staff-leaves/${leave.id}/approve`;
      } else if (type === 'reject') {
        url = roleTab === 'teacher' ? `/api/teacher-leaves/${leave.id}/reject` : `/api/staff-leaves/${leave.id}/reject`;
      } else if (type === 'delete') {
        url = roleTab === 'teacher' ? `/api/teacher-leaves/${leave.id}/admin` : `/api/staff-leaves/${leave.id}/admin`;
      }

      const method = type === 'delete' ? 'DELETE' : 'POST';
      const body = type === 'delete' ? null : JSON.stringify({ remarks: actionRemarks });

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant
        },
        body
      });

      if (res.ok) {
        showToast(`Leave request ${type}d successfully!`, 'success');
        setShowActionModal(null);
        setActionRemarks('');
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || `Failed to ${type} leave request.`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error performing leave action.', 'error');
    }
  };



  // Export List to CSV
  const handleExport = () => {
    if (filteredLeaves.length === 0) {
      showToast('No records to export.', 'warning');
      return;
    }

    const headers = ['Employee Name', 'Role', 'Leave Type', 'From Date', 'To Date', 'Total Days', 'Status', 'Applied On', 'Reason'];
    const rows = filteredLeaves.map(l => [
      roleTab === 'teacher' ? l.teacherName : l.staffName,
      roleTab.toUpperCase(),
      l.leaveType,
      l.fromDate,
      l.toDate,
      l.totalDays,
      l.status,
      new Date(l.createdAt).toLocaleDateString(),
      l.reason || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${roleTab}_leaves_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export file downloaded successfully!', 'success');
  };

  // Helper formatting dates
  const formatDateFriendly = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', color: '#000000', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.025em' }}>Leave Management Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
            Monitor leave requests, approvals, balances, policies and staff/teacher availability.
          </p>
        </div>
        
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowPolicyModal(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', 
              background: '#ffffff', color: '#0f172a', fontWeight: 600, fontSize: '0.86rem', cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <SettingsIcon size={16} />
            Policy Settings
          </button>
        </div>
      </div>

      {/* Main Role Toggle Bar */}
      <div style={{ display: 'flex', background: '#f1f5f9', padding: '6px', borderRadius: '12px', width: 'fit-content', gap: '4px' }}>
        <button
          onClick={() => setRoleTab('teacher')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 20px', borderRadius: '8px', border: 'none',
            background: roleTab === 'teacher' ? '#ffffff' : 'transparent',
            color: roleTab === 'teacher' ? '#FF8C42' : '#475569',
            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
            boxShadow: roleTab === 'teacher' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={16} />
          Teacher Leave Dashboard
        </button>
        <button
          onClick={() => setRoleTab('staff')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 20px', borderRadius: '8px', border: 'none',
            background: roleTab === 'staff' ? '#ffffff' : 'transparent',
            color: roleTab === 'staff' ? '#FF8C42' : '#475569',
            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
            boxShadow: roleTab === 'staff' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={16} />
          Staff Leave Dashboard
        </button>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
        
        {/* Card 1: Total */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(255, 107, 0,0.1)', color: '#FF8C42', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ClipboardList size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Requests</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>{totalCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>This Month</div>
          </div>
        </div>

        {/* Card 2: Pending */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pending Approval</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>{pendingCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>Awaiting Action</div>
          </div>
        </div>

        {/* Card 3: Approved */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Approved Leaves</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>{approvedCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>This Month</div>
          </div>
        </div>

        {/* Card 4: Rejected */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <XCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Rejected Leaves</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>{rejectedCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>This Month</div>
          </div>
        </div>

        {/* Card 5: On Leave Today */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>On Leave Today</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>{onLeaveTodayCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{roleTab === 'teacher' ? 'Teachers' : 'Staff Members'}</div>
          </div>
        </div>

        {/* Card 6: Utilization */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Leave Utilization</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>{leaveUtilization}%</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>This Month</div>
          </div>
        </div>

      </div>

      {/* Main Content: Filter & Table */}
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          
          {/* Advanced Search & Filters Card */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a', fontSize: '0.96rem' }}>
                <SlidersHorizontal size={18} />
                Search & Filters
              </div>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLeaveType('All');
                  setSelectedDept('All');
                  setSelectedStatus('All');
                  setFromDate('');
                  setToDate('');
                }}
                style={{ background: 'none', border: 'none', color: '#FF8C42', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: '14px', alignItems: 'end' }}>
              
              {/* Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Search {roleTab === 'teacher' ? 'Teacher' : 'Staff'} / Request ID</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="text"
                    placeholder="Search by name, ID, or department..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.86rem', color: '#000000' }}
                  />
                </div>
              </div>

              {/* Leave Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Leave Type</label>
                <select
                  value={selectedLeaveType}
                  onChange={e => setSelectedLeaveType(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.86rem', color: '#000000', cursor: 'pointer' }}
                >
                  <option value="All">All Leave Types</option>
                  {[...new Set(leaves.map(l => l.leaveType))].filter(Boolean).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Leave Status</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.86rem', color: '#000000', cursor: 'pointer' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Date Range */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Date Range</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input 
                    type="date"
                    value={fromDate}
                    onChange={e => {
                      const val = e.target.value;
                      setFromDate(val);
                      if (toDate && val > toDate) {
                        setToDate(val);
                      }
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.8rem', color: '#000000' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>to</span>
                  <input 
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    min={fromDate}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.8rem', color: '#000000' }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Table Container Card */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Table Tabs Headers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                
                <button
                  onClick={() => setTableTab('pending')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: tableTab === 'pending' ? 'rgba(255,140,66,0.08)' : 'transparent',
                    color: tableTab === 'pending' ? '#FF8C42' : '#64748b',
                    fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Pending Requests
                  <span style={{ padding: '2px 6px', borderRadius: '10px', background: tableTab === 'pending' ? '#FF8C42' : '#e2e8f0', color: tableTab === 'pending' ? '#ffffff' : '#475569', fontSize: '0.7rem', fontWeight: 800 }}>
                    {leaves.filter(l => l.status === 'Pending').length}
                  </span>
                </button>

                <button
                  onClick={() => setTableTab('approved')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: tableTab === 'approved' ? 'rgba(16,185,129,0.08)' : 'transparent',
                    color: tableTab === 'approved' ? '#10b981' : '#64748b',
                    fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Approved Leaves
                  <span style={{ padding: '2px 6px', borderRadius: '10px', background: tableTab === 'approved' ? '#10b981' : '#e2e8f0', color: tableTab === 'approved' ? '#ffffff' : '#475569', fontSize: '0.7rem', fontWeight: 800 }}>
                    {leaves.filter(l => l.status === 'Approved').length}
                  </span>
                </button>

                <button
                  onClick={() => setTableTab('rejected')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: tableTab === 'rejected' ? 'rgba(239,68,68,0.08)' : 'transparent',
                    color: tableTab === 'rejected' ? '#ef4444' : '#64748b',
                    fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Rejected Requests
                  <span style={{ padding: '2px 6px', borderRadius: '10px', background: tableTab === 'rejected' ? '#ef4444' : '#e2e8f0', color: tableTab === 'rejected' ? '#ffffff' : '#475569', fontSize: '0.7rem', fontWeight: 800 }}>
                    {leaves.filter(l => l.status === 'Rejected').length}
                  </span>
                </button>

                <button
                  onClick={() => setTableTab('today')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: tableTab === 'today' ? 'rgba(255,140,66,0.08)' : 'transparent',
                    color: tableTab === 'today' ? '#FF8C42' : '#64748b',
                    fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  On Leave Today
                  <span style={{ padding: '2px 6px', borderRadius: '10px', background: tableTab === 'today' ? '#FF8C42' : '#e2e8f0', color: tableTab === 'today' ? '#ffffff' : '#475569', fontSize: '0.7rem', fontWeight: 800 }}>
                    {onLeaveTodayCount}
                  </span>
                </button>

                <button
                  onClick={() => setTableTab('all')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: tableTab === 'all' ? 'rgba(15,23,42,0.08)' : 'transparent',
                    color: tableTab === 'all' ? '#0f172a' : '#64748b',
                    fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Full Leave Directory
                  <span style={{ padding: '2px 6px', borderRadius: '10px', background: tableTab === 'all' ? '#0f172a' : '#e2e8f0', color: tableTab === 'all' ? '#ffffff' : '#475569', fontSize: '0.7rem', fontWeight: 800 }}>
                    {totalCount}
                  </span>
                </button>

              </div>

              {/* Export */}
              <button
                onClick={handleExport}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  background: '#ffffff', color: '#0f172a', fontWeight: 600, fontSize: '0.82rem',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                <Download size={14} />
                Export List
              </button>
            </div>

            {/* Leaves Table */}
            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
                <Clock className="animate-spin" size={32} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <span>Loading leave logs...</span>
              </div>
            ) : tableData.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={28} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>No Requests Found</div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', maxWidth: '280px' }}>
                  No leave requests found matching the active filters or selected tab.
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedLeaveType('All');
                    setSelectedDept('All');
                    setSelectedStatus('All');
                    setFromDate('');
                    setToDate('');
                  }}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#FF8C42', color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 700 }}>
                      <th style={{ padding: '12px 8px' }}>{roleTab === 'teacher' ? 'Teacher Name' : 'Staff Name'}</th>
                      <th style={{ padding: '12px 8px' }}>Leave Type</th>
                      <th style={{ padding: '12px 8px' }}>From Date</th>
                      <th style={{ padding: '12px 8px' }}>To Date</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Days</th>
                      <th style={{ padding: '12px 8px' }}>Department</th>
                      <th style={{ padding: '12px 8px' }}>Status</th>
                      <th style={{ padding: '12px 8px' }}>Applied On</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map(leave => {
                      const name = roleTab === 'teacher' ? leave.teacherName : leave.staffName;
                      const dept = (roleTab === 'teacher' ? leave.teacherDepartment : leave.staffDepartment) || 'N/A';
                      const empId = roleTab === 'teacher' ? leave.teacherEmployeeId : leave.staffEmployeeId;
                      return (
                        <tr key={leave.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '14px 8px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{empId}</div>
                          </td>
                          <td style={{ padding: '14px 8px', fontWeight: 600, color: '#475569' }}>
                            {leave.leaveType}
                            {leave.emergency === 1 && (
                              <span style={{ marginLeft: '6px', fontSize: '0.68rem', padding: '1px 4px', borderRadius: '3px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 800 }}>
                                Emergency
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 8px' }}>{formatDateFriendly(leave.fromDate)}</td>
                          <td style={{ padding: '14px 8px' }}>{formatDateFriendly(leave.toDate)}</td>
                          <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>{leave.totalDays}</td>
                          <td style={{ padding: '14px 8px', color: '#64748b' }}>{dept}</td>
                          <td style={{ padding: '14px 8px' }}>
                            <span style={{ 
                              fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', fontWeight: 700,
                              background: leave.status === 'Approved' ? 'rgba(16,185,129,0.1)' : leave.status === 'Rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                              color: leave.status === 'Approved' ? '#10b981' : leave.status === 'Rejected' ? '#ef4444' : '#d97706'
                            }}>
                              {leave.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 8px', color: '#64748b' }}>
                            {new Date(leave.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '14px 8px' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              
                              {leave.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => setShowActionModal({ type: 'approve', leave })}
                                    style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#10b981', color: '#ffffff', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                                    title="Approve Request"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setShowActionModal({ type: 'reject', leave })}
                                    style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#ef4444', color: '#ffffff', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                                    title="Reject Request"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => setShowActionModal({ type: 'delete', leave })}
                                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                                title="Delete Entry"
                              >
                                Delete
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>



      {/* MODAL 2: ACTION CONFIRMATION (Approve, Reject, Delete) */}
      {showActionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: '16px'
        }}>
          <div style={{
            background: '#ffffff', padding: '28px', borderRadius: '20px', width: '100%', maxWidth: '440px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '18px'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: showActionModal.type === 'approve' ? 'rgba(16,185,129,0.1)' : showActionModal.type === 'reject' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                color: showActionModal.type === 'approve' ? '#10b981' : showActionModal.type === 'reject' ? '#ef4444' : '#f59e0b'
              }}>
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
                  {showActionModal.type === 'approve' ? 'Approve Leave Request' : showActionModal.type === 'reject' ? 'Reject Leave Request' : 'Delete Leave Request'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: '1.4' }}>
                  Are you sure you want to {showActionModal.type} this leave request for{' '}
                  <strong>
                    {roleTab === 'teacher' ? showActionModal.leave.teacherName : showActionModal.leave.staffName}
                  </strong>?
                </p>
              </div>
            </div>

            {showActionModal.type !== 'delete' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Remarks / Reason</label>
                <textarea 
                  rows={2}
                  placeholder="Add administrative remarks (optional)..."
                  value={actionRemarks}
                  onChange={e => setActionRemarks(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#000000', fontSize: '0.86rem', resize: 'vertical' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <button 
                onClick={() => { setShowActionModal(null); setActionRemarks(''); }}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleActionSubmit}
                style={{ 
                  padding: '8px 18px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                  background: showActionModal.type === 'approve' ? '#10b981' : '#ef4444',
                  color: '#ffffff'
                }}
              >
                Confirm {showActionModal.type.charAt(0).toUpperCase() + showActionModal.type.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW POLICY RULES (Settings grid mockup) */}
      {showPolicyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: '16px'
        }}>
          <div style={{
            background: '#ffffff', padding: '28px', borderRadius: '20px', width: '100%', maxWidth: '620px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '20px',
            maxHeight: '85vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SettingsIcon size={20} style={{ color: '#FF8C42' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Active {roleTab === 'teacher' ? 'Teacher' : 'Staff'} Policies
                </span>
              </div>
              <button 
                onClick={() => setShowPolicyModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {policies.length === 0 ? (
              <div style={{ padding: '30px 0', textTransform: 'center', color: '#64748b' }}>
                No active leave policies configured. Configure them under the centralized Settings page.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {policies.map(p => (
                  <div key={p.id} style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{p.leaveType} ({p.leaveCode})</span>
                      <span style={{ fontWeight: 800, color: '#FF8C42', fontSize: '0.88rem' }}>{p.maxDays} Days</span>
                    </div>
                    {p.description && <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>{p.description}</p>}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '0.72rem' }}>
                      <span style={{ background: p.isPaid === 1 ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', color: p.isPaid === 1 ? '#10b981' : '#6b7280', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                        {p.isPaid === 1 ? 'Paid' : 'Unpaid'}
                      </span>
                      {p.carryForward === 1 && (
                        <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                          Carry Forward (Max: {p.maxCarryForward} Days)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                onClick={() => setShowPolicyModal(false)}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#FF8C42', color: '#ffffff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

