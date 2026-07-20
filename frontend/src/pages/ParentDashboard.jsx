import React, { useState, useEffect, useRef } from 'react';
import './ParentDashboard.css';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Award, 
  BookOpen, 
  Clock, 
  CreditCard, 
  Bell, 
  Mail, 
  FileText, 
  Settings, 
  User, 
  LogOut, 
  CheckCircle,
  AlertCircle,
  Lock,
  Plus,
  Send,
  Printer,
  ChevronRight,
  ChevronDown,
  BookMarked,
  Sun,
  Moon,
  Shield,
  Camera,
  Phone,
  Globe
} from 'lucide-react';

export default function ParentDashboard({ onLogout, theme, setTheme }) {
  const [activeTab, setActiveTab] = useState('children');
  const [attendanceSubTab, setAttendanceSubTab] = useState('history');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [photo, setPhoto] = useState(localStorage.getItem('parent_photo') || '');
  const notificationRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
        localStorage.setItem('parent_photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getParentInitials = () => {
    const parentName = localStorage.getItem('name') || activeChild?.fatherName || activeChild?.motherName || 'Parent';
    const parts = parentName.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parentName.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [parentNotifications, setParentNotifications] = useState([]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Data states for active child
  const [attendance, setAttendance] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [results, setResults] = useState([]);
  const [overallResults, setOverallResults] = useState([]);
  const [resultsSubTab, setResultsSubTab] = useState('history');
  const [fees, setFees] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [timetables, setTimetables] = useState({ classTimetables: [], teacherTimetables: [] });
  const [examTimetables, setExamTimetables] = useState([]);
  const [exams, setExams] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [timetableSubTab, setTimetableSubTab] = useState('class');
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, type: 'Sick Leave', startDate: '2026-07-10', endDate: '2026-07-11', reason: 'Fever and cold', status: 'Approved' }
  ]);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Teacher', text: 'Hello, please review the upcoming science project guidelines for next week.', time: '10:30 AM', date: '2026-07-14' }
  ]);
  const [newMessageText, setNewMessageText] = useState('');
  const [leaveForm, setLeaveForm] = useState({ type: 'Sick Leave', startDate: '', endDate: '', reason: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  // Homework mock tracker
  const [homeworkList, setHomeworkList] = useState([
    { id: 1, title: 'Chapter 5 Algebra Problems', subject: 'Mathematics', dueDate: '2026-07-18', status: 'Pending', description: 'Complete questions 1 to 15 on page 142.' },
    { id: 2, title: 'Photosynthesis Diagram', subject: 'Science', dueDate: '2026-07-19', status: 'Pending', description: 'Draw and label the steps of photosynthesis in the scrapbook.' },
    { id: 3, title: 'English Grammar Exercise', subject: 'English', dueDate: '2026-07-14', status: 'Completed', description: 'Complete exercises A and B on Prepositions.' }
  ]);

  // Load school branding & parent children on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const token = localStorage.getItem('token');
      const tenant = localStorage.getItem('tenant_subdomain') || 'default';
      
      try {
        // Fetch school branding
        const schoolRes = await fetch('/api/school', {
          headers: { 'x-tenant-id': tenant }
        });
        if (schoolRes.ok) {
          const sData = await schoolRes.json();
          setSchoolInfo(sData);
        }

        // Fetch children
        const childrenRes = await fetch('/api/students', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (childrenRes.ok) {
          const list = await childrenRes.json();
          const studentArray = Array.isArray(list) ? list : (list.students || []);
          setChildren(studentArray);
          if (studentArray.length > 0) {
            setActiveChild(studentArray[0]);
          }
        }
      } catch (err) {
        console.error('Error loading parent portal details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Hydrate data whenever activeChild changes or month/year changes
  useEffect(() => {
    if (!activeChild) return;
    
    const fetchChildData = async () => {
      const token = localStorage.getItem('token');
      const tenant = localStorage.getItem('tenant_subdomain') || 'default';
      
      try {
        // 1. Fetch child attendance
        const attRes = await fetch(`/api/attendance/calendar?studentId=${activeChild.id}&month=${selectedMonth}&year=${selectedYear}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (attRes.ok) {
          const attData = await attRes.json();
          setAttendance(attData || {});
        }

        // 2. Fetch results & overall results
        const resRes = await fetch('/api/academics/results', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (resRes.ok) {
          const resData = await resRes.json();
          // Filter results for active child
          setResults(Array.isArray(resData) ? resData.filter(r => String(r.studentId) === String(activeChild.id)) : []);
        }

        const overallRes = await fetch('/api/academics/overall-results', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (overallRes.ok) {
          const overallData = await overallRes.json();
          setOverallResults(Array.isArray(overallData) ? overallData.filter(o => String(o.studentId) === String(activeChild.id)) : []);
        }

        // 3. Fetch fees
        const feesRes = await fetch('/api/finance/fees', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (feesRes.ok) {
          const feesData = await feesRes.json();
          // Filter fees by student ID or admission number reliably
          setFees(Array.isArray(feesData) ? feesData.filter(f => 
            String(f.studentId) === String(activeChild.id) || 
            (f.admissionNumber && activeChild.admissionNumber && String(f.admissionNumber).trim().toLowerCase() === String(activeChild.admissionNumber).trim().toLowerCase())
          ) : []);
        }

        const fstrRes = await fetch('/api/finance/fee-structures', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (fstrRes.ok) {
          const fstrData = await fstrRes.json();
          setFeeStructures(Array.isArray(fstrData) ? fstrData : []);
        }

        // 4. Fetch timetables
        const timetableRes = await fetch('/api/academics/published-timetables', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (timetableRes.ok) {
          const timetablesData = await timetableRes.json();
          setTimetables(timetablesData || { classTimetables: [], teacherTimetables: [] });
        }

        // Fetch exam timetables
        const examTimetableRes = await fetch('/api/academics/exam-timetables', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (examTimetableRes.ok) {
          const examTimetablesData = await examTimetableRes.json();
          setExamTimetables(examTimetablesData || []);
        }

        // Fetch exams list to check published status
        const examsRes = await fetch('/api/academics/exams', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (examsRes.ok) {
          const examsData = await examsRes.json();
          setExams(examsData || []);
        }

        // Fetch timeslots list
        const timeslotsRes = await fetch('/api/academics/timeslots', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (timeslotsRes.ok) {
          const timeslotsData = await timeslotsRes.json();
          setTimeslots(timeslotsData || []);
        }

        // 5. Fetch notices
        const noticesRes = await fetch('/api/academics/notices', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (noticesRes.ok) {
          const noticesData = await noticesRes.json();
          setNotices(Array.isArray(noticesData) ? noticesData : []);
        }

        // 6. Fetch events
        const eventsRes = await fetch('/api/academics/events', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(Array.isArray(eventsData) ? eventsData : []);
        }

        // 7. Fetch holidays
        const holidaysRes = await fetch('/api/academics/holidays', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant 
          }
        });
        if (holidaysRes.ok) {
          const holidaysData = await holidaysRes.json();
          setHolidays(Array.isArray(holidaysData) ? holidaysData : []);
        }
      } catch (err) {
        console.error('Error fetching child records:', err);
      }
    };
    
    fetchChildData();
  }, [activeChild, selectedMonth, selectedYear]);

  // Real-time Student Notification Sync (DB & Live Actions)
  useEffect(() => {
    if (!activeChild) return;

    const syncRealNotifications = async () => {
      const realList = [];
      const childName = activeChild.name || 'Student';
      const childCohort = activeChild.section ? `${activeChild.studentClass || activeChild.grade || 'Grade'}-${activeChild.section}` : (activeChild.grade || activeChild.studentClass || 'Class');

      // 1. Fetch real database notifications from backend API
      try {
        const token = localStorage.getItem('token');
        const tenant = localStorage.getItem('tenant_subdomain') || 'default';
        if (token) {
          const res = await fetch(`/api/notifications?tenantId=${tenant}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const apiData = await res.json();
            if (Array.isArray(apiData)) {
              apiData.forEach(n => {
                realList.push({
                  id: `db-${n.id}`,
                  category: n.type || 'notice',
                  title: n.title,
                  message: n.message,
                  time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
                  timestamp: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
                  read: n.read === 1 || n.read === true,
                  badgeBg: 'rgba(255, 140, 66, 0.15)',
                  badgeColor: '#FF8C42',
                  badgeText: (n.type || 'NOTIFICATION').toUpperCase()
                });
              });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching API notifications:', err);
      }

      // 2. Real Today Attendance Notification (only when marked)
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLog = attendance[todayStr];
      if (todayLog && todayLog.status) {
        const isPresent = todayLog.status === 'Present';
        const isAbsent = todayLog.status === 'Absent';

        realList.push({
          id: `att-real-${todayStr}-${activeChild.id}`,
          category: 'attendance',
          title: `Attendance Marked: ${childName}`,
          message: `Today (${todayStr}), ${childName} has been marked as ${todayLog.status.toUpperCase()}.${todayLog.remarks ? ' Remarks: ' + todayLog.remarks : ''}`,
          time: 'Today',
          timestamp: Date.now(),
          targetTab: 'attendance',
          badgeBg: isPresent ? 'rgba(16, 185, 129, 0.15)' : (isAbsent ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
          badgeColor: isPresent ? '#10b981' : (isAbsent ? '#ef4444' : '#f59e0b'),
          badgeText: `ATTENDANCE: ${todayLog.status.toUpperCase()}`,
          read: false
        });
      }

      // 3. Real Fee Receipts Collected & Due Cleared / Partial Notifications
      if (fees && fees.length > 0) {
        // Calculate expected total for child quarter
        let expectedQuarterTotal = 4000;
        if (activeChild && feeStructures && feeStructures.length > 0) {
          const childClass = (activeChild.studentClass || activeChild.grade || '').toLowerCase();
          const matchedFs = feeStructures.find(fs => (fs.studentClass || '').toLowerCase().includes(childClass));
          if (matchedFs) {
            const tFee = matchedFs.tuitionFee || 0;
            const trFee = activeChild.transportRequired === 'Yes' ? (matchedFs.transportFee || 0) : 0;
            const oFee = matchedFs.otherCharges || 0;
            const qTot = (tFee + trFee + oFee);
            if (qTot > 0) expectedQuarterTotal = qTot;
          }
        }

        fees.forEach((f, idx) => {
          const quarterLabel = f.billingPeriod || f.feeType || 'Quarter Fee';
          if (f.status === 'Paid' || (f.paidAmount && Number(f.paidAmount) > 0)) {
            const isDueColl = f.remarks === 'DUE_COLLECTION' || f.isDueCollection || (f.receiptNumber && String(f.receiptNumber).includes('DUES'));
            const isPartial = !isDueColl && (
              (f.dueAmount && Number(f.dueAmount) > 0) || 
              (Number(f.paidAmount || 0) < expectedQuarterTotal)
            );

            let statusLabel = 'FEE CLEARED';
            let badgeBg = 'rgba(16, 185, 129, 0.15)';
            let badgeColor = '#10b981';

            if (isDueColl) {
              statusLabel = 'DUE COLLECTED';
              badgeBg = 'rgba(16, 185, 129, 0.15)';
              badgeColor = '#10b981';
            } else if (isPartial) {
              statusLabel = 'PARTIALLY PAID';
              badgeBg = 'rgba(245, 158, 11, 0.15)';
              badgeColor = '#f59e0b';
            }

            const feeTimestamp = f.createdAt ? new Date(f.createdAt).getTime() : (f.paymentDate ? new Date(f.paymentDate).getTime() : Date.now()) + (idx * 100);
            realList.push({
              id: `fee-receipt-${f.id || f.receiptNumber || Math.random()}`,
              category: 'fee',
              title: `Fee Status (${statusLabel}): ${childName}`,
              message: isDueColl
                ? `Receipt #${f.receiptNumber || ('REC-' + (f.id || '101'))}: ₹${f.paidAmount} due collected for ${quarterLabel} for ${childName}.`
                : (isPartial 
                  ? `Receipt #${f.receiptNumber || ('REC-' + (f.id || '101'))}: ₹${f.paidAmount} partially paid for ${quarterLabel} for ${childName}.`
                  : `Receipt #${f.receiptNumber || ('REC-' + (f.id || '101'))}: ₹${f.paidAmount} paid for ${quarterLabel} for ${childName}.`),
              time: f.paymentDate ? f.paymentDate.split('T')[0] : 'Recorded',
              timestamp: feeTimestamp,
              targetTab: 'fees',
              badgeBg,
              badgeColor,
              badgeText: statusLabel,
              read: false
            });
          }
        });
      }

      // 4. Real Published Timetables (background priority)
      if (timetables && timetables.classTimetables && timetables.classTimetables.length > 0) {
        const classMatch = timetables.classTimetables.find(t => t.cohort === childCohort || t.cohort === activeChild.grade || t.cohort === activeChild.studentClass);
        if (classMatch) {
          realList.push({
            id: `tt-class-${childCohort}`,
            category: 'timetable',
            title: `Timetable Shared: Grade ${childCohort}`,
            message: `Weekly subject timetable for ${childName} (${childCohort}) has been published.`,
            time: 'Active',
            timestamp: 100000,
            targetTab: 'timetable',
            badgeBg: 'rgba(255, 140, 66, 0.15)',
            badgeColor: '#FF8C42',
            badgeText: `TIMETABLE (${childCohort})`,
            read: false
          });
        }
      }

      // Group exam timetables by examId so only ONE notification is rendered per exam
      const examTTList = getActiveChildExamTimetable();
      if (examTTList && examTTList.length > 0) {
        const uniqueExamsMap = {};
        examTTList.forEach(et => {
          const key = et.examId || 'general';
          if (!uniqueExamsMap[key]) {
            uniqueExamsMap[key] = et;
          }
        });

        Object.values(uniqueExamsMap).forEach((et, idx) => {
          const relatedExam = exams.find(e => String(e.id) === String(et.examId));
          realList.push({
            id: `tt-exam-${et.examId || idx}`,
            category: 'timetable',
            title: `Exam Date Sheet Shared: ${relatedExam?.title || et.examId || 'Semester Exam'}`,
            message: `Exam date sheet published for ${childName} (${childCohort}). View full timetable for schedule.`,
            time: 'Scheduled',
            timestamp: 200000 + idx,
            targetTab: 'timetable',
            badgeBg: 'rgba(139, 92, 246, 0.15)',
            badgeColor: '#8b5cf6',
            badgeText: 'EXAM TIMETABLE',
            read: false
          });
        });
      }

      // 5. Real School Notices
      if (notices && notices.length > 0) {
        notices.forEach(n => {
          const isExpired = n.expiryDate && n.expiryDate < todayStr;
          if (!isExpired && !n.isDeleted) {
            realList.push({
              id: `notice-${n.id}`,
              category: 'notice',
              title: `Announcement: ${n.title}`,
              message: n.content,
              time: n.date || n.publishDate || 'Notice',
              timestamp: n.publishDate ? new Date(n.publishDate).getTime() : 300000,
              targetTab: 'notices',
              badgeBg: 'rgba(59, 130, 246, 0.15)',
              badgeColor: '#3b82f6',
              badgeText: 'SCHOOL NOTICE',
              read: false
            });
          }
        });
      }

      // 6. Active/Upcoming School Events (Auto-disappears after event date ends)
      if (events && events.length > 0) {
        events.forEach((e, idx) => {
          const eventDateStr = e.date || e.eventDate || e.startDate || '';
          const eventEndStr = e.endDate || eventDateStr;
          const isPast = eventEndStr ? eventEndStr < todayStr : false;

          if (!isPast && !e.isDeleted && e.status === 'Published') {
            realList.push({
              id: `evt-${e.id || idx}`,
              category: 'notice',
              title: `School Event: ${e.title}`,
              message: `Upcoming event "${e.title}" scheduled on ${eventDateStr}${e.venue ? ' at ' + e.venue : ''}.${e.description ? ' Details: ' + e.description : ''}`,
              time: eventDateStr || 'Upcoming',
              timestamp: eventDateStr ? new Date(eventDateStr).getTime() : 350000,
              targetTab: 'notices',
              badgeBg: 'rgba(255, 140, 66, 0.15)',
              badgeColor: '#FF8C42',
              badgeText: 'SCHOOL EVENT',
              read: false
            });
          }
        });
      }

      // 7. Active/Upcoming School Holidays (Auto-disappears after holiday end date)
      if (holidays && holidays.length > 0) {
        holidays.forEach((h, idx) => {
          const hStartStr = h.startDate || h.date || '';
          const hEndStr = h.endDate || hStartStr;
          const isPast = hEndStr ? hEndStr < todayStr : false;

          if (!isPast && !h.isDeleted && h.status === 'Published') {
            realList.push({
              id: `hld-${h.id || idx}`,
              category: 'notice',
              title: `School Holiday: ${h.name || h.title}`,
              message: `School closed from ${hStartStr}${hEndStr && hEndStr !== hStartStr ? ' to ' + hEndStr : ''} (${h.name || h.title}).${h.description ? ' ' + h.description : ''}`,
              time: hStartStr || 'Holiday',
              timestamp: hStartStr ? new Date(hStartStr).getTime() : 380000,
              targetTab: 'notices',
              badgeBg: 'rgba(139, 92, 246, 0.15)',
              badgeColor: '#8b5cf6',
              badgeText: 'HOLIDAY ALERT',
              read: false
            });
          }
        });
      }

      // Priority sort: Fee Receipts & Due Clearances ALWAYS TOP (#1 priority), then Attendance, Notices, Timetables
      realList.sort((a, b) => {
        const catPriority = { fee: 1000, attendance: 900, notice: 500, db: 400, timetable: 100 };
        const pA = catPriority[a.category] || 100;
        const pB = catPriority[b.category] || 100;
        if (pA !== pB) return pB - pA;
        return (b.timestamp || 0) - (a.timestamp || 0);
      });

      setParentNotifications(realList);
    };

    syncRealNotifications();
    const interval = setInterval(syncRealNotifications, 3000);
    return () => clearInterval(interval);
  }, [activeChild, attendance, fees, timetables, examTimetables, exams, results, notices, events, holidays]);

  // Handle changing active child
  const handleChildChange = (e) => {
    const selected = children.find(c => c.id === e.target.value);
    if (selected) {
      setActiveChild(selected);
    }
  };

  // Submit Leave request
  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      alert('Please fill out all leave fields.');
      return;
    }
    const newRequest = {
      id: Date.now(),
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      status: 'Pending'
    };
    setLeaveRequests(prev => [newRequest, ...prev]);
    setLeaveForm({ type: 'Sick Leave', startDate: '', endDate: '', reason: '' });
    alert('Leave request submitted successfully.');
  };

  // Submit Chat Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    const msg = {
      id: Date.now(),
      sender: 'Parent',
      text: newMessageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0]
    };
    setMessages(prev => [...prev, msg]);
    setNewMessageText('');
    
    // Simulate auto reply from teacher after 2 seconds
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'Teacher',
        text: 'Thank you for your message. I will check and get back to you shortly.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0]
      }]);
    }, 2000);
  };

  // Submit Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const tenant = localStorage.getItem('tenant_subdomain') || 'default';
      
      const res = await fetch('/api/rbac/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (res.ok) {
        alert('Password updated successfully.');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update password.');
      }
    } catch (err) {
      alert('Error updating password.');
    }
  };

  // Print Fee Receipt popup
  const handlePrintReceipt = (receipt) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Fee Payment Receipt - ${receipt.receiptNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              padding: 40px;
              color: #1e293b;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 1.8rem;
              font-weight: 800;
              color: #FF8C42;
              margin: 0;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 40px;
            }
            .meta-item label {
              font-size: 0.85rem;
              color: #64748b;
              display: block;
              margin-bottom: 4px;
            }
            .meta-item value {
              font-size: 1rem;
              font-weight: 600;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            .table th {
              background: #f8fafc;
              border-bottom: 2px solid #e2e8f0;
              padding: 12px;
              text-align: left;
            }
            .table td {
              border-bottom: 1px solid #f1f5f9;
              padding: 12px;
            }
            .footer {
              text-align: center;
              margin-top: 60px;
              font-size: 0.8rem;
              color: #64748b;
            }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div class="title">${schoolInfo?.name || 'Aether Academy'}</div>
            <div>Fee Payment Receipt</div>
          </div>
          <div class="meta-grid">
            <div>
              <div class="meta-item">
                <label>Student Name</label>
                <value>${receipt.studentName}</value>
              </div>
              <div class="meta-item" style="margin-top: 12px;">
                <label>Admission Number</label>
                <value>${receipt.admissionNumber}</value>
              </div>
              <div class="meta-item" style="margin-top: 12px;">
                <label>Grade & Section</label>
                <value>${receipt.studentClass} - ${receipt.section || 'A'}</value>
              </div>
            </div>
            <div>
              <div class="meta-item">
                <label>Receipt Number</label>
                <value>${receipt.receiptNumber}</value>
              </div>
              <div class="meta-item" style="margin-top: 12px;">
                <label>Payment Date</label>
                <value>${receipt.paymentDate || 'N/A'}</value>
              </div>
              <div class="meta-item" style="margin-top: 12px;">
                <label>Payment Method</label>
                <value>${receipt.paymentMethod}</value>
              </div>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Remarks</th>
                <th style="text-align: right;">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${receipt.feeType || 'Tuition Fee'}</td>
                <td>${receipt.remarks || 'Term Fees payment'}</td>
                <td style="text-align: right; font-weight: 700;">₹${receipt.paidAmount}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            This is a computer generated document. No signature required.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper: render monthly attendance calendar days
  const renderCalendarDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const cells = [];

    // Empty cells before start day
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day-cell empty" />);
    }

    // Days grid
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const log = attendance[dateString] || {};
      let statusClass = '';
      if (log.status === 'Present') statusClass = 'present';
      else if (log.status === 'Absent') statusClass = 'absent';
      else if (log.status === 'Late') statusClass = 'late';
      else if (log.status === 'Holiday') statusClass = 'holiday';

      cells.push(
        <div key={`day-${day}`} className={`calendar-day-cell ${statusClass}`}>
          <span style={{ fontWeight: 700 }}>{day}</span>
          {log.status && (
            <span style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>
              {log.status}
            </span>
          )}
        </div>
      );
    }

    return cells;
  };

  // Filter timetables for active student
  const getActiveChildTimetable = () => {
    if (!activeChild) return [];
    const childCohort = activeChild.section ? `${activeChild.studentClass}-${activeChild.section}` : activeChild.studentClass;
    const match = (timetables.classTimetables || []).find(t => t.cohort === childCohort);
    return match ? match.slots : [];
  };

  const getActiveChildExamTimetable = () => {
    if (!activeChild) return [];
    const childCohort = activeChild.section ? `${activeChild.studentClass}-${activeChild.section}` : activeChild.studentClass;
    return examTimetables.filter(et => {
      const relatedExam = exams.find(e => String(e.id) === String(et.examId));
      if (!relatedExam || !relatedExam.timetablePublished) return false;

      // 1. Check exact cohort match (e.g. "I-A")
      if (et.cohort && et.cohort.toLowerCase() === childCohort.toLowerCase()) return true;
      if (et.classId && et.classId.toLowerCase() === childCohort.toLowerCase()) return true;

      // 2. Check grade-general match (e.g. cohort "I-" matches child in grade "I" section "A")
      if (et.cohort && et.cohort.toLowerCase() === `${activeChild.studentClass?.toLowerCase()}-`) return true;

      // 3. Check individual grade/section (handling empty/blank section as applying to all sections)
      if (et.grade && et.grade.toLowerCase() === activeChild.studentClass?.toLowerCase()) {
        if (!et.section || et.section.trim() === '' || et.section.toLowerCase() === 'all' || !activeChild.section || (et.section.toLowerCase() === activeChild.section?.toLowerCase())) {
          return true;
        }
      }
      return false;
    });
  };

  const getActiveChildExams = () => {
    if (!activeChild) return [];
    return exams.filter(ex => {
      if (!ex.timetablePublished) return false;
      return (ex.gradeSections || []).some(gs => {
        if (gs.grade && gs.grade.toLowerCase() === activeChild.studentClass?.toLowerCase()) {
          if (!gs.section || gs.section.trim() === '' || gs.section.toLowerCase() === 'all' || !activeChild.section || (gs.section.toLowerCase() === activeChild.section?.toLowerCase())) {
            return true;
          }
        }
        return false;
      });
    });
  };

  if (loading) {
    return (
      <div className="parent-dashboard-container" style={{ display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="sl-spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px' }} />
          <h3>Loading Parent Dashboard Portal...</h3>
        </div>
      </div>
    );
  }

  // Sidebar Links Configuration
  const sidebarLinks = [
    { id: 'children', label: 'My Children', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'results', label: 'Results & Reports', icon: Award },
    { id: 'timetable', label: 'Timetable', icon: Clock },
    { id: 'fees', label: 'Fee Status & Receipts', icon: CreditCard },
    { id: 'notices', label: 'Events & Holidays', icon: Calendar }
  ];

  return (
    <div className="parent-dashboard-container">
      
      {/* Sidebar Navigation */}
      <aside className="parent-sidebar">
        <div className="sidebar-header" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-glass, rgba(255, 255, 255, 0.08))' }}>
          {schoolInfo?.logo ? (
            <img src={schoolInfo.logo} alt="School Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px' }} />
          ) : (
            <BookMarked size={28} style={{ color: '#FF8C42' }} />
          )}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FF8C42', margin: 0 }}>Parent Portal</h2>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
              {schoolInfo?.name || 'Academy ERP'}
            </div>
          </div>
        </div>

        <div className="sidebar-menu">
          {sidebarLinks.map(link => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`menu-item ${activeTab === link.id ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>

        {/* Profile Card at the bottom of Sidebar */}
        <div style={{ marginTop: 'auto' }}>
          
          {/* Profile Card Trigger */}
          <div 
            onClick={() => setActiveTab(prev => prev === 'settings' ? 'children' : 'settings')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '16px 24px', 
              borderTop: '1px solid var(--border-glass, rgba(255, 255, 255, 0.08))', 
              cursor: 'pointer',
              background: activeTab === 'settings' ? 'var(--bg-glass-active)' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            <div className="child-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem', background: '#FF8C42', border: 'none' }}>
              {photo ? (
                <img src={photo} alt="Parent Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                getParentInitials()
              )}
            </div>
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                  {localStorage.getItem('name') || (activeChild ? (activeChild.fatherName || activeChild.motherName) : 'Parent')}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                  Parent
                </span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: '8px' }} />
            </div>
          </div>

        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="parent-main-content">
        
        {/* Top Navbar */}
        <header className="parent-navbar">
          <div className="navbar-left">
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.15rem' }}>
              Welcome back, Parent
            </h3>
          </div>

          <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme} 
              className="action-btn" 
              title="Toggle color scheme" 
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications Indicator & Popover */}
            <div ref={notificationRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="action-btn" 
                title="Notifications" 
              >
                <Bell size={18} />
                {parentNotifications.some(n => !n.read) && (
                  <span className="badge-dot" />
                )}
              </button>

              {showNotifications && (
                <div style={{ 
                  position: 'absolute', 
                  top: '52px', 
                  right: 0, 
                  width: '360px', 
                  background: 'var(--bg-elevated, #ffffff)', 
                  border: '1px solid var(--border-glass)', 
                  borderRadius: '16px', 
                  padding: '16px', 
                  zIndex: 9999, 
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(12px)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Notifications</h4>
                      {activeChild && (
                        <div style={{ fontSize: '0.7rem', color: '#FF8C42', fontWeight: 600 }}>
                          For: {activeChild.name}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setParentNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      style={{ background: 'none', border: 'none', color: '#FF8C42', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Mark all read
                    </button>
                  </div>

                  {/* Single Unified Notification List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                    {parentNotifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          if (n.targetTab) setActiveTab(n.targetTab);
                          setShowNotifications(false);
                          setParentNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                        }}
                        style={{ 
                          padding: '10px 12px', 
                          borderRadius: '10px', 
                          background: n.read ? 'transparent' : 'var(--bg-card-subtle, rgba(255, 255, 255, 0.04))', 
                          borderLeft: n.read ? '3px solid transparent' : '3px solid #FF8C42', 
                          border: '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 700, 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            background: n.badgeBg || 'rgba(255, 140, 66, 0.15)', 
                            color: n.badgeColor || '#FF8C42',
                            textTransform: 'uppercase'
                          }}>
                            {n.badgeText || n.category || 'Notification'}
                          </span>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{n.time}</span>
                        </div>

                        <div style={{ fontSize: '0.8rem', fontWeight: n.read ? 500 : 700, color: 'var(--text-main)' }}>{n.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>{n.message}</div>
                      </div>
                    ))}
                    {parentNotifications.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '16px' }}>
                        No notifications available.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {children.length > 0 && (
              <div className="child-select-container">
                <Users size={16} style={{ color: '#FF8C42' }} />
                <select 
                  value={activeChild?.id || ''} 
                  onChange={handleChildChange}
                  className="child-select"
                >
                  {children.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        {/* Viewport content */}
        <main className="parent-viewport">
          
          {/* TAB 2: MY CHILDREN (WITH SELECTED CHILD OVERVIEW) */}
          {activeTab === 'children' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {activeChild && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="parent-grid-3">
                    
                    {/* Child Summary Card */}
                    <div className="parent-card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div className="child-avatar" style={{ background: activeChild.photoBg }}>
                        {activeChild.photo ? (
                          <img src={activeChild.photo} alt={activeChild.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          activeChild.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{activeChild.name}</h3>
                        <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Admission: <strong>{activeChild.admissionNumber}</strong>
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Grade & Section: <strong>{activeChild.grade}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Quick Info Card */}
                    <div className="parent-card" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>92%</div>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Attendance</div>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--border-glass)', height: '40px' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FF8C42' }}>₹0</div>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Due Fees</div>
                      </div>
                    </div>

                    {/* Academic Performance Card */}
                    <div className="parent-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <Award size={36} style={{ color: '#F59E0B' }} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>Last Examination Result</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {results.length > 0 ? `Overall Grade: ${results[0].grade} (GPA: ${results[0].gpa})` : 'No exam results released yet.'}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* School Notices list */}
                  <div className="parent-card">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700 }}>
                      Recent School Announcements
                    </h3>
                    {notices.slice(0, 3).map(n => (
                      <div key={n.id} className="notice-item">
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{n.title}</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {n.content}
                        </p>
                      </div>
                    ))}
                    {notices.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        No announcements available.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE */}
          {activeTab === 'attendance' && activeChild && (() => {
            // Compute stats from attendance object
            const allEntries = Object.entries(attendance); // [["2026-07-01", {status:"Present"}], ...]
            const monthEntries = allEntries.filter(([date]) => {
              const d = new Date(date);
              return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
            });
            const presentCount  = monthEntries.filter(([,v]) => v.status === 'Present').length;
            const absentCount   = monthEntries.filter(([,v]) => v.status === 'Absent').length;
            const lateCount     = monthEntries.filter(([,v]) => v.status === 'Late').length;
            const holidayCount  = monthEntries.filter(([,v]) => v.status === 'Holiday').length;
            const totalSchoolDays = presentCount + absentCount + lateCount;
            const attendancePct = totalSchoolDays > 0 ? Math.round(((presentCount + lateCount) / totalSchoolDays) * 100) : 0;

            // Compute yearly stats
            const yearlyEntries = allEntries.filter(([date]) => {
              const d = new Date(date);
              return d.getFullYear() === selectedYear;
            });
            const yPresentCount  = yearlyEntries.filter(([,v]) => v.status === 'Present').length;
            const yAbsentCount   = yearlyEntries.filter(([,v]) => v.status === 'Absent').length;
            const yLateCount     = yearlyEntries.filter(([,v]) => v.status === 'Late').length;
            const yHolidayCount  = yearlyEntries.filter(([,v]) => v.status === 'Holiday').length;
            const yTotalSchoolDays = yPresentCount + yAbsentCount + yLateCount;
            const yAttendancePct = yTotalSchoolDays > 0 ? Math.round(((yPresentCount + yLateCount) / yTotalSchoolDays) * 100) : 0;

            const monthsBreakdown = Array.from({ length: 12 }, (_, i) => {
              const mEntries = yearlyEntries.filter(([date]) => {
                const d = new Date(date);
                return d.getMonth() === i;
              });
              const mPresent = mEntries.filter(([,v]) => v.status === 'Present').length;
              const mAbsent  = mEntries.filter(([,v]) => v.status === 'Absent').length;
              const mLate    = mEntries.filter(([,v]) => v.status === 'Late').length;
              const mTotal = mPresent + mAbsent + mLate;
              const mPct = mTotal > 0 ? Math.round(((mPresent + mLate) / mTotal) * 100) : null;
              return {
                name: new Date(0, i).toLocaleString('default', { month: 'short' }),
                fullName: new Date(0, i).toLocaleString('default', { month: 'long' }),
                pct: mPct,
                present: mPresent,
                absent: mAbsent,
                late: mLate
              };
            });

            // History: all entries sorted newest-first
            let historyEntries = [...allEntries].sort((a, b) => new Date(b[0]) - new Date(a[0]));
            if (attendanceDateFilter) {
              historyEntries = historyEntries.filter(([date]) => date === attendanceDateFilter);
            }

            const statusColor = { Present: '#10b981', Absent: '#ef4444', Late: '#f59e0b', Holiday: '#3b82f6' };
            const statusBg    = { Present: 'rgba(16,185,129,0.1)', Absent: 'rgba(239,68,68,0.1)', Late: 'rgba(245,158,11,0.1)', Holiday: 'rgba(59,130,246,0.1)' };

             return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                 {/* Sub-tabs buttons */}
                <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'history', label: 'Attendance History' },
                    { id: 'summary', label: 'Monthly Report & Calendar' },
                    { id: 'yearly', label: 'Yearly Report' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setAttendanceSubTab(tab.id)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-glass)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: attendanceSubTab === tab.id ? '#FF8C42' : 'transparent',
                        color: attendanceSubTab === tab.id ? '#ffffff' : 'var(--text-muted)',
                        boxShadow: attendanceSubTab === tab.id ? '0 4px 12px rgba(255, 140, 66, 0.25)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        if (attendanceSubTab !== tab.id) {
                          e.currentTarget.style.background = 'rgba(255, 140, 66, 0.05)';
                          e.currentTarget.style.color = '#FF8C42';
                        }
                      }}
                      onMouseLeave={e => {
                        if (attendanceSubTab !== tab.id) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Month/Year Selector - Show if Monthly Report & Calendar is active */}
                {attendanceSubTab === 'summary' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Attendance — {activeChild.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="form-control" style={{ width: '130px', padding: '6px 10px' }}>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                      </select>
                      <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="form-control" style={{ width: '100px', padding: '6px 10px' }}>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Year Selector - Show if Yearly Report is active */}
                {attendanceSubTab === 'yearly' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Yearly Attendance — {activeChild.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="form-control" style={{ width: '100px', padding: '6px 10px' }}>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ── SECTION 4: Yearly Summary Stats ── */}
                {attendanceSubTab === 'yearly' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="parent-card">
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                        Yearly Report — {selectedYear}
                      </h4>

                      {/* Attendance % bar */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Overall Yearly Attendance</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: yAttendancePct >= 75 ? '#10b981' : '#ef4444' }}>{yAttendancePct}%</span>
                        </div>
                        <div style={{ height: '10px', background: 'var(--border-glass)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${yAttendancePct}%`, background: yAttendancePct >= 75 ? '#10b981' : '#ef4444', borderRadius: '99px', transition: 'width 0.5s ease' }} />
                        </div>
                        {yAttendancePct < 75 && (
                          <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>⚠ Attendance below 75% threshold</p>
                        )}
                      </div>

                      {/* Stat boxes */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                        {[
                          { label: 'Present',  count: yPresentCount,  color: '#10b981', bg: 'rgba(16,185,129,0.08)'  },
                          { label: 'Absent',   count: yAbsentCount,   color: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
                          { label: 'Late',     count: yLateCount,     color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
                          { label: 'Holidays', count: yHolidayCount,  color: '#3b82f6', bg: 'rgba(59,130,246,0.08)'  },
                        ].map(s => (
                          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: '12px', padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly Breakdown Grid */}
                    <div className="parent-card">
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                        Monthly Breakdown
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                        {monthsBreakdown.map(m => {
                          const hasData = m.pct !== null;
                          return (
                            <div key={m.name} style={{
                              padding: '12px',
                              borderRadius: '12px',
                              background: 'var(--bg-card-subtle)',
                              border: '1px solid var(--border-glass)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{m.fullName}</span>
                                <span style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  color: hasData ? (m.pct >= 75 ? '#10b981' : '#ef4444') : 'var(--text-muted)'
                                }}>{hasData ? `${m.pct}%` : 'N/A'}</span>
                              </div>
                              <div style={{ height: '6px', background: 'var(--border-glass)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%',
                                  width: hasData ? `${m.pct}%` : '0%',
                                  background: hasData ? (m.pct >= 75 ? '#10b981' : '#ef4444') : 'transparent',
                                  borderRadius: '3px'
                                }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                <span>P: {m.present}</span>
                                <span>A: {m.absent}</span>
                                <span>L: {m.late}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SECTION 1 & 2: Combined Monthly Report & Calendar ── */}
                {attendanceSubTab === 'summary' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Monthly Summary Stats Card */}
                    <div className="parent-card">
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                        Monthly Report — {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
                      </h4>

                      {/* Attendance % bar */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Overall Attendance</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: attendancePct >= 75 ? '#10b981' : '#ef4444' }}>{attendancePct}%</span>
                        </div>
                        <div style={{ height: '10px', background: 'var(--border-glass)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${attendancePct}%`, background: attendancePct >= 75 ? '#10b981' : '#ef4444', borderRadius: '99px', transition: 'width 0.5s ease' }} />
                        </div>
                        {attendancePct < 75 && (
                          <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>⚠ Attendance below 75% threshold</p>
                        )}
                      </div>

                      {/* Stat boxes */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                        {[
                          { label: 'Present',  count: presentCount,  color: '#10b981', bg: 'rgba(16,185,129,0.08)'  },
                          { label: 'Absent',   count: absentCount,   color: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
                          { label: 'Late',     count: lateCount,     color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
                          { label: 'Holidays', count: holidayCount,  color: '#3b82f6', bg: 'rgba(59,130,246,0.08)'  },
                        ].map(s => (
                          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: '12px', padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly Attendance Calendar Card */}
                    <div className="parent-card">
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                        Attendance Calendar — {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
                      </h4>
                      <div className="calendar-grid">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                          <div key={d} className="calendar-header-day">{d}</div>
                        ))}
                        {renderCalendarDays()}
                      </div>
                      {/* Legend */}
                      <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Present',       bg: 'rgba(16,185,129,0.2)',  border: '#10b981' },
                          { label: 'Absent',        bg: 'rgba(239,68,68,0.2)',   border: '#ef4444' },
                          { label: 'Late',          bg: 'rgba(245,158,11,0.2)',  border: '#f59e0b' },
                          { label: 'School Holiday',bg: 'rgba(59,130,246,0.2)',  border: '#3b82f6' },
                        ].map(l => (
                          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <span style={{ width: '12px', height: '12px', background: l.bg, border: `1px solid ${l.border}`, borderRadius: '3px', display: 'inline-block' }} />
                            {l.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SECTION 3: Attendance History ── */}
                {attendanceSubTab === 'history' && (
                  <div className="parent-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                        Attendance History — {activeChild.name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter by Date:</span>
                        <input
                          type="date"
                          value={attendanceDateFilter}
                          onChange={e => setAttendanceDateFilter(e.target.value)}
                          className="form-control"
                          style={{
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-glass)',
                            background: 'var(--bg-card-subtle)',
                            color: 'var(--text-main)',
                            fontSize: '0.82rem',
                            outline: 'none'
                          }}
                        />
                        {attendanceDateFilter && (
                          <button
                            onClick={() => setAttendanceDateFilter('')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    {historyEntries.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                              {['Date', 'Day', 'Status', 'Remarks'].map(h => (
                                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {historyEntries.map(([date, val]) => {
                              const d = new Date(date);
                              const dayName = d.toLocaleString('default', { weekday: 'long' });
                              const displayDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                              const st = val.status || 'Unknown';
                              return (
                                <tr key={date} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-subtle)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-main)' }}>{displayDate}</td>
                                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{dayName}</td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <span style={{
                                      display: 'inline-block',
                                      padding: '3px 10px',
                                      borderRadius: '99px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      background: statusBg[st] || 'var(--bg-card-subtle)',
                                      color: statusColor[st] || 'var(--text-muted)',
                                      border: `1px solid ${statusColor[st] || 'var(--border-glass)'}40`,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.04em'
                                    }}>{st}</span>
                                  </td>
                                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{val.remarks || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <Calendar size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                        <p style={{ margin: 0, fontWeight: 600 }}>No attendance records found.</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Records will appear here once attendance is marked.</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })()}

          {/* TAB 4: RESULTS & ACADEMIC HISTORY */}
          {activeTab === 'results' && activeChild && (() => {
            const childResults = results.filter(r => String(r.studentId) === String(activeChild.id));
            const childOverall = overallResults.filter(o => String(o.studentId) === String(activeChild.id));

            // Group child results by examName
            const examMap = {};
            childResults.forEach(r => {
              const eKey = r.examName || r.examId || 'General Examination';
              if (!examMap[eKey]) {
                const ov = childOverall.find(o => String(o.examId) === String(r.examId) || o.examName === r.examName);
                examMap[eKey] = {
                  examId: r.examId,
                  examName: eKey,
                  academicSession: r.academicSession || '2026-2027',
                  subjects: [],
                  totalObtained: ov ? parseFloat(ov.obtainedMarks || 0) : 0,
                  totalMax: ov ? parseFloat(ov.totalMarks || 0) : 0,
                  percentage: ov ? ov.percentage : null,
                  gpa: ov ? ov.gpa : null,
                  grade: ov ? ov.overallGrade : null,
                  status: ov ? (ov.resultStatus || (ov.percentage >= 40 ? 'PASS' : 'FAIL')) : null,
                  rank: ov ? ov.rank : null
                };
              }
              examMap[eKey].subjects.push(r);
            });

            // Re-calculate totals if overall record wasn't present
            Object.values(examMap).forEach(ex => {
              if (!ex.totalMax || ex.totalMax === 0) {
                ex.totalObtained = ex.subjects.reduce((sum, s) => sum + parseFloat(s.obtainedMarks || 0), 0);
                ex.totalMax = ex.subjects.reduce((sum, s) => sum + parseFloat(s.totalMarks || 100), 0);
                ex.percentage = ex.totalMax > 0 ? Math.round((ex.totalObtained / ex.totalMax) * 100) : 0;
                if (!ex.grade) {
                  ex.grade = ex.percentage >= 90 ? 'A+' : ex.percentage >= 80 ? 'A' : ex.percentage >= 70 ? 'B' : ex.percentage >= 60 ? 'C' : ex.percentage >= 40 ? 'D' : 'F';
                }
                if (!ex.gpa) {
                  ex.gpa = ex.percentage >= 90 ? 4.0 : ex.percentage >= 80 ? 3.5 : ex.percentage >= 70 ? 3.0 : ex.percentage >= 60 ? 2.5 : ex.percentage >= 40 ? 2.0 : 0.0;
                }
                if (!ex.status) {
                  ex.status = ex.percentage >= 40 ? 'PASS' : 'FAIL';
                }
              }
            });

            const examHistoryList = Object.values(examMap);

            // Compute cumulative metrics
            const totalExams = examHistoryList.length;
            const avgPercentage = totalExams > 0 ? Math.round(examHistoryList.reduce((sum, e) => sum + (e.percentage || 0), 0) / totalExams) : 0;
            const passedExams = examHistoryList.filter(e => e.status === 'PASS').length;

            const handlePrintReportCard = (examItem) => {
              const printWindow = window.open('', '_blank', 'width=850,height=900');
              printWindow.document.write(`
                <html>
                  <head>
                    <title>Report Card - ${activeChild.name} (${examItem.examName})</title>
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
                      body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e293b; background: #fff; }
                      .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
                      .logo { font-size: 1.8rem; font-weight: 800; color: #FF8C42; margin: 0; }
                      .sub-logo { font-size: 0.9rem; color: #64748b; margin-top: 4px; }
                      .title { font-size: 1.3rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin: 16px 0 0 0; }
                      .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
                      .meta-item { font-size: 0.85rem; color: #475569; }
                      .meta-item strong { color: #0f172a; font-weight: 700; }
                      .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                      .table th { background: #f1f5f9; border-bottom: 2px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 0.8rem; text-transform: uppercase; color: #475569; }
                      .table td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; font-size: 0.85rem; }
                      .summary-box { display: flex; justify-content: space-around; background: #fff7ed; border: 1px solid #ffedd5; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
                      .summary-num { font-size: 1.4rem; font-weight: 800; color: #FF8C42; }
                      .summary-label { font-size: 0.72rem; text-transform: uppercase; color: #9a3412; font-weight: 600; margin-top: 2px; }
                      .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; }
                      .sig-line { border-top: 1px solid #cbd5e1; width: 180px; text-align: center; font-size: 0.8rem; color: #64748b; padding-top: 6px; }
                    </style>
                  </head>
                  <body onload="window.print()">
                    <div class="header">
                      <h1 class="logo">${schoolInfo?.name || 'Academy School ERP'}</h1>
                      <div class="sub-logo">Official Examination Progress Report</div>
                      <h2 class="title">${examItem.examName} (${examItem.academicSession})</h2>
                    </div>

                    <div class="meta-grid">
                      <div class="meta-item">Student Name: <strong>${activeChild.name}</strong></div>
                      <div class="meta-item">Admission Number: <strong>${activeChild.admissionNumber}</strong></div>
                      <div class="meta-item">Class / Grade: <strong>${activeChild.grade || activeChild.studentClass} ${activeChild.section ? `- Section ${activeChild.section}` : ''}</strong></div>
                      <div class="meta-item">Roll Number: <strong>${activeChild.rollNumber || activeChild.roll || 'N/A'}</strong></div>
                    </div>

                    <table class="table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Obtained Marks</th>
                          <th>Total Marks</th>
                          <th>Percentage</th>
                          <th>Grade</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${examItem.subjects.map(s => `
                          <tr>
                            <td><strong>${s.subject}</strong></td>
                            <td>${s.obtainedMarks}</td>
                            <td>${s.totalMarks}</td>
                            <td>${Math.round((s.obtainedMarks / s.totalMarks) * 100)}%</td>
                            <td><strong style="color: ${s.grade === 'F' ? '#ef4444' : '#10b981'}">${s.grade || '-'}</strong></td>
                            <td>${s.remarks || '—'}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>

                    <div class="summary-box">
                      <div>
                        <div class="summary-num">${examItem.totalObtained} / ${examItem.totalMax}</div>
                        <div class="summary-label">Total Marks</div>
                      </div>
                      <div>
                        <div class="summary-num">${examItem.percentage}%</div>
                        <div class="summary-label">Percentage</div>
                      </div>
                      <div>
                        <div class="summary-num" style="color: ${examItem.grade === 'F' ? '#ef4444' : '#10b981'}">${examItem.grade}</div>
                        <div class="summary-label">Overall Grade</div>
                      </div>
                      <div>
                        <div class="summary-num">${examItem.gpa}</div>
                        <div class="summary-label">GPA</div>
                      </div>
                      <div>
                        <div class="summary-num" style="color: ${examItem.status === 'PASS' ? '#10b981' : '#ef4444'}">${examItem.status}</div>
                        <div class="summary-label">Result Status</div>
                      </div>
                    </div>

                    <div class="signatures">
                      <div class="sig-line">Class Teacher</div>
                      <div class="sig-line">Principal / Controller of Exams</div>
                    </div>
                  </body>
                </html>
              `);
              printWindow.document.close();
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* ACADEMIC HISTORY & EXAM REPORTS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Exam Cards Roster */}
                  {examHistoryList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {examHistoryList.map((exItem, idx) => (
                        <div key={idx} className="parent-card">
                          <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF8C42', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Session: {exItem.academicSession}
                            </span>
                            <h3 style={{ margin: '2px 0 0 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              {exItem.examName}
                            </h3>
                          </div>

                          {/* Subjects Table */}
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                                  {['Subject', 'Obtained Marks', 'Total Marks', 'Remarks'].map(h => (
                                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {exItem.subjects.map(s => (
                                  <tr key={s.id || s.subject} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-main)' }}>{s.subject}</td>
                                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.obtainedMarks}</td>
                                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{s.totalMarks}</td>
                                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s.remarks || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="parent-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <Award size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>No published exam history found for {activeChild.name}.</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Exam reports will appear here once results are published by the school admin.</p>
                    </div>
                  )}

                </div>

              </div>
            );
          })()}

          {/* TAB 5: HOMEWORK */}
          {activeTab === 'homework' && (
            <div className="parent-card">
              <h3 style={{ margin: '0 0 20px 0' }}>Homework & Assignments Tracker</h3>
              <div className="homework-list">
                {homeworkList.map(h => (
                  <div key={h.id} className="homework-item">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{h.title}</h4>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(255,107,0,0.1)', color: '#FF8C42', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {h.subject}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {h.description}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>
                        Due Date: {h.dueDate}
                      </p>
                    </div>
                    <span className={`homework-status-pill ${h.status.toLowerCase()}`}>
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: TIMETABLE */}
          {activeTab === 'timetable' && activeChild && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Sub-tabs buttons */}
              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                {[
                  { id: 'class', label: 'Class Timetable' },
                  { id: 'exam', label: 'Exam Timetable' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTimetableSubTab(tab.id)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      background: timetableSubTab === tab.id ? '#FF8C42' : 'transparent',
                      color: timetableSubTab === tab.id ? '#ffffff' : 'var(--text-muted)',
                      boxShadow: timetableSubTab === tab.id ? '0 4px 12px rgba(255, 140, 66, 0.25)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      if (timetableSubTab !== tab.id) {
                        e.currentTarget.style.background = 'rgba(255, 140, 66, 0.05)';
                        e.currentTarget.style.color = '#FF8C42';
                      }
                    }}
                    onMouseLeave={e => {
                      if (timetableSubTab !== tab.id) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* CLASS TIMETABLE SECTION */}
              {timetableSubTab === 'class' && (() => {
                const defaultTimeslots = [
                  '09:00 AM - 10:00 AM',
                  '10:00 AM - 11:00 AM',
                  '11:00 AM - 12:00 PM',
                  '01:00 PM - 02:00 PM',
                  '02:00 PM - 03:00 PM'
                ];
                const activeSlots = timeslots.length > 0 ? timeslots : defaultTimeslots;
                const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const hasTimetable = getActiveChildTimetable().length > 0;

                return (
                  <div className="parent-card">
                    <h3 style={{ margin: '0 0 20px 0' }}>Weekly Class Timetable - Grade {activeChild.studentClass}-{activeChild.section || ''} ({activeChild.name})</h3>
                    {hasTimetable ? (
                      <div className="timetable-grid-container">
                        <table className="timetable-table">
                          <thead>
                            <tr>
                              <th style={{ width: '150px' }}>Time Slot</th>
                              {daysOfWeek.map(d => <th key={d}>{d}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {activeSlots.map(slot => {
                              const breakMatch = slot.match(/\[(.*?)\]/);
                              const breakType = breakMatch ? breakMatch[1] : null;
                              const isBreak = !!breakType;

                              if (isBreak) {
                                return (
                                  <tr key={slot} style={{ background: 'rgba(255, 140, 66, 0.02)' }}>
                                    <td style={{ fontWeight: 700, color: '#FF8C42', fontSize: '0.8rem', padding: '12px' }}>{slot}</td>
                                    <td colSpan={6} style={{
                                      textAlign: 'center',
                                      verticalAlign: 'middle',
                                      padding: '12px',
                                      fontWeight: 800,
                                      color: '#d97706',
                                      letterSpacing: '3px',
                                      fontSize: '0.85rem',
                                      textTransform: 'uppercase',
                                      background: 'rgba(255, 140, 66, 0.04)',
                                      borderLeft: '1px solid var(--border-glass)',
                                      borderRadius: '8px'
                                    }}>
                                      {breakType}
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr key={slot}>
                                  <td style={{ fontWeight: 700, color: '#FF8C42', fontSize: '0.8rem' }}>{slot}</td>
                                  {daysOfWeek.map(day => {
                                    const classSlots = getActiveChildTimetable();
                                    const matched = classSlots.find(s => s.day === day && s.time === slot);
                                    return (
                                      <td key={day} style={{ padding: '8px' }}>
                                        {matched ? (
                                          <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            gap: '2px'
                                          }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>{matched.subject}</span>
                                            {matched.teacher && matched.teacher.trim() !== '' && matched.teacher.toLowerCase() !== 'n/a' && (
                                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <UserCheck size={9} /> {matched.teacher}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic', padding: '12px', textAlign: 'center' }}>
                                            Free Study
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No published class timetables found for Grade {activeChild.grade}.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* EXAM TIMETABLE SECTION */}
              {timetableSubTab === 'exam' && (() => {
                const childExams = getActiveChildExams();
                const childCohort = activeChild.section ? `${activeChild.studentClass}-${activeChild.section}` : activeChild.studentClass;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="parent-card" style={{ paddingBottom: '0' }}>
                      <h3 style={{ margin: '0' }}>Exam Timetable Schedule - Grade {activeChild.studentClass}-{activeChild.section || ''} ({activeChild.name})</h3>
                    </div>
                    {childExams.length > 0 ? (
                      childExams.map(ex => {
                        // Get timetable slots for this exam and child cohort
                        const cohortSchedules = examTimetables.filter(et => {
                          if (String(et.examId) !== String(ex.id)) return false;
                          // Check cohort match
                          if (et.cohort && et.cohort.toLowerCase() === childCohort.toLowerCase()) return true;
                          if (et.classId && et.classId.toLowerCase() === childCohort.toLowerCase()) return true;
                          // Check grade and section individually
                          if (et.grade && et.grade.toLowerCase() === activeChild.studentClass?.toLowerCase()) {
                            if (!et.section || et.section.trim() === '' || et.section.toLowerCase() === 'all' || !activeChild.section || (et.section.toLowerCase() === activeChild.section?.toLowerCase())) {
                              return true;
                            }
                          }
                          return false;
                        });

                        // Sort chronologically
                        cohortSchedules.sort((a, b) => {
                          const dateA = a.examDate || a.date || '';
                          const dateB = b.examDate || b.date || '';
                          return dateA.localeCompare(dateB);
                        });

                        const totalSubjects = cohortSchedules.length;
                        const earliestStart = cohortSchedules[0] ? (cohortSchedules[0].examDate || cohortSchedules[0].date) : null;
                        const latestEnd = cohortSchedules[cohortSchedules.length - 1] ? (cohortSchedules[cohortSchedules.length - 1].examDate || cohortSchedules[cohortSchedules.length - 1].date) : null;

                        const formatTimetableDate = (dStr) => {
                          if (!dStr) return '-';
                          try {
                            return new Date(dStr + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                          } catch (e) {
                            return dStr;
                          }
                        };

                        return (
                          <div
                            key={ex.id}
                            className="parent-card animate-scale-up"
                            style={{
                              padding: '0',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              border: '1px solid var(--border-glass)'
                            }}
                          >
                            {/* Card Header */}
                            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                  Grade - {activeChild.studentClass}-{activeChild.section || ''}
                                  {ex.academicSession && ` · Session ${ex.academicSession}`}
                                </div>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{ex.examName || ex.name}</h3>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255, 107, 0, 0.08)', color: 'hsl(var(--color-primary))', border: '1px solid rgba(255, 107, 0, 0.15)', fontWeight: 600 }}>{ex.examType || ex.term}</span>
                                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.15)', fontWeight: 600 }}>Total Marks: {ex.totalMarks || 100}</span>
                                </div>
                              </div>
                              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)' }}>Published</span>
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', fontSize: '0.8rem' }}>
                                <div style={{ color: 'var(--text-muted)' }}>Total Subjects</div>
                                <div style={{ fontWeight: 600, textAlign: 'right' }}>{totalSubjects}</div>
                                <div style={{ color: 'var(--text-muted)' }}>Start Date</div>
                                <div style={{ fontWeight: 600, textAlign: 'right' }}>{formatTimetableDate(earliestStart) || '-'}</div>
                                <div style={{ color: 'var(--text-muted)' }}>End Date</div>
                                <div style={{ fontWeight: 600, textAlign: 'right' }}>{formatTimetableDate(latestEnd) || 'Not scheduled'}</div>
                              </div>

                              {/* Subjects and corresponding marks */}
                              <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '1px dashed var(--border-glass)' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subjects & Marks</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {(() => {
                                    const list = [];
                                    cohortSchedules.forEach(slot => {
                                      const subKey = `${activeChild.studentClass}-${slot.subject}`;
                                      const marks = ex.subjectMarks && ex.subjectMarks[subKey] !== undefined ? ex.subjectMarks[subKey] : (ex.totalMarks || 100);
                                      list.push({ subject: slot.subject, marks });
                                    });
                                    if (list.length === 0) {
                                      return <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No subjects added</div>;
                                    }
                                    return list.map((item, idx) => (
                                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center', padding: '4px 0' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.subject}</span>
                                        <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.78rem' }}>{item.marks} Marks</span>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              </div>

                              {/* Timetable Schedule Section */}
                              {cohortSchedules.length > 0 && (
                                <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border-glass)', paddingTop: '12px' }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                    Timetable Schedule
                                  </div>
                                  <div className="timetable-grid-container" style={{ overflowX: 'auto' }}>
                                    <table className="timetable-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                      <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                          <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)' }}>Subject</th>
                                          <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)' }}>Date</th>
                                          <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)' }}>Time</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {cohortSchedules.map(slot => (
                                          <tr key={slot.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <td style={{ fontWeight: 700, padding: '8px' }}>{slot.subject}</td>
                                            <td style={{ padding: '8px' }}>{formatTimetableDate(slot.examDate || slot.date)}</td>
                                            <td style={{ padding: '8px' }}>
                                              {slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : (slot.timeSlot || slot.duration || '-')}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="parent-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No published exam timetables found for Grade {activeChild.studentClass}-{activeChild.section || ''}.
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          )}

          {/* TAB 7: FEE STATUS & RECEIPTS */}
          {activeTab === 'fees' && activeChild && (() => {
            const childFees = fees;
            const quarters = [
              { key: 'july-sep', label: '1. (July-Sep)' },
              { key: 'oct-dec', label: '2. (Oct-Dec)' },
              { key: 'jan-mar', label: '3. (Jan-Mar)' },
              { key: 'apr-jun', label: '4. (Apr-Jun)' }
            ];

            // Map payment for each quarter
            const quarterStatus = quarters.map(q => {
              const matchedPayments = childFees.filter(f => {
                const bp = (f.billingPeriod || f.feeType || '').toLowerCase();
                return bp.includes(q.key) || bp.includes(q.label.toLowerCase());
              });

              const totalPaid = matchedPayments.reduce((sum, f) => sum + Number(f.paidAmount || 0), 0);
              const lastPayment = matchedPayments[matchedPayments.length - 1];

              // Calculate expected total for the quarter from feeStructures if available, or default
              let expectedQuarterTotal = 4000;
              if (activeChild) {
                const childClass = (activeChild.studentClass || activeChild.grade || '').toLowerCase();
                const matchedFs = feeStructures.find(fs => (fs.studentClass || '').toLowerCase().includes(childClass));
                if (matchedFs) {
                  const tFee = matchedFs.tuitionFee || 0;
                  const trFee = activeChild.transportRequired === 'Yes' ? (matchedFs.transportFee || 0) : 0;
                  const oFee = matchedFs.otherCharges || 0;
                  const quarterTotal = (tFee + trFee + oFee);
                  if (quarterTotal > 0) expectedQuarterTotal = quarterTotal;
                }
              }
              if (totalPaid > expectedQuarterTotal) {
                expectedQuarterTotal = totalPaid;
              }

              const remainingDue = Math.max(0, expectedQuarterTotal - totalPaid);

              let status = 'DUE';
              let badgeColor = '#ef4444';
              let badgeBg = 'rgba(239, 68, 68, 0.06)';
              let border = 'rgba(239, 68, 68, 0.3)';

              if (totalPaid > 0 && remainingDue === 0) {
                status = 'DUE CLEARED';
                badgeColor = '#10b981';
                badgeBg = 'rgba(16, 185, 129, 0.06)';
                border = 'rgba(16, 185, 129, 0.3)';
              } else if (totalPaid > 0) {
                status = 'PARTIAL';
                badgeColor = '#f59e0b';
                badgeBg = 'rgba(245, 158, 11, 0.06)';
                border = 'rgba(245, 158, 11, 0.3)';
              }

              return {
                ...q,
                status,
                totalPaid,
                remainingDue,
                expectedQuarterTotal,
                lastPayment,
                badgeColor,
                badgeBg,
                border
              };
            });

            const paidCount = quarterStatus.filter(q => q.status === 'DUE CLEARED').length;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Fee Structure & Quarterly Status Card */}
                <div className="parent-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Student Fee Status</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Session 2026-2027 · {activeChild.name} (Class {activeChild.studentClass || activeChild.grade}{activeChild.section ? `-${activeChild.section}` : ''})
                      </p>
                    </div>
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: '99px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: paidCount === 4 ? 'rgba(16,185,129,0.15)' : 'rgba(255,140,66,0.15)',
                      color: paidCount === 4 ? '#10b981' : '#FF8C42',
                      border: `1px solid ${paidCount === 4 ? '#10b981' : '#FF8C42'}40`
                    }}>
                      {paidCount === 4 ? 'Fully Paid' : `${paidCount} / 4 Quarters Cleared`}
                    </span>
                  </div>

                  {/* Quarters Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    {quarterStatus.map((q, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: `1px solid ${q.border}`,
                          background: q.badgeBg,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {q.label}
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '99px',
                            background: q.status === 'DUE CLEARED' ? 'rgba(16,185,129,0.2)' : (q.status === 'PARTIAL' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'),
                            color: q.badgeColor,
                            border: `1px solid ${q.badgeColor}40`
                          }}>
                            {q.status === 'DUE CLEARED' ? 'PAID' : (q.status === 'PARTIAL' ? 'PARTIAL' : 'DUE')}
                          </span>
                        </div>

                        {q.status === 'DUE CLEARED' && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <div>Paid Amount: <strong style={{ color: '#10b981' }}>₹{q.totalPaid}</strong></div>
                            <div>Paid Date: {q.lastPayment?.paymentDate || 'Recorded'}</div>
                            {q.lastPayment?.receiptNumber && (
                              <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>Receipt: #{q.lastPayment.receiptNumber}</div>
                            )}
                          </div>
                        )}

                        {q.status === 'PARTIAL' && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <div>Paid So Far: <strong style={{ color: '#f59e0b' }}>₹{q.totalPaid}</strong></div>
                            <div>Remaining Due: <strong style={{ color: '#ef4444' }}>₹{q.remainingDue}</strong></div>
                            <div>Last Paid: {q.lastPayment?.paymentDate || 'Recorded'}</div>
                          </div>
                        )}

                        {q.status === 'DUE' && (
                          <div style={{ fontSize: '0.78rem', color: '#ef4444', fontStyle: 'italic', marginTop: '4px' }}>
                            Fee Payment Pending (DUE)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Transactions & Receipts Log */}
                <div className="parent-card">
                  <h3 style={{ margin: '0 0 16px 0' }}>Payment Transactions & Receipts</h3>
                  {childFees.length > 0 ? (
                    <div className="timetable-grid-container">
                      {(() => {
                        const getQuarterKey = (f) => {
                          const bp = (f.billingPeriod || f.feeType || '').toLowerCase();
                          if (bp.includes('july-sep') || bp.includes('1.')) return '1. (July-Sep)';
                          if (bp.includes('oct-dec') || bp.includes('2.')) return '2. (Oct-Dec)';
                          if (bp.includes('jan-mar') || bp.includes('3.')) return '3. (Jan-Mar)';
                          if (bp.includes('apr-jun') || bp.includes('4.')) return '4. (Apr-Jun)';
                          return f.billingPeriod || 'Other Period';
                        };

                        const groupedFees = {};
                        childFees.forEach(f => {
                          const qKey = getQuarterKey(f);
                          if (!groupedFees[qKey]) groupedFees[qKey] = [];
                          groupedFees[qKey].push(f);
                        });

                        const quarterKeys = Object.keys(groupedFees);

                        return (
                          <table className="timetable-table">
                            <tbody>
                              {quarterKeys.map((qKey) => {
                                const items = groupedFees[qKey];
                                const quarterTotalPaid = items.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);

                                // Find target quarter expected total amount
                                let expectedQuarterTotal = 4000;
                                if (activeChild) {
                                  const childClass = (activeChild.studentClass || activeChild.grade || '').toLowerCase();
                                  const matchedFs = feeStructures.find(fs => (fs.studentClass || '').toLowerCase().includes(childClass));
                                  if (matchedFs) {
                                    const tFee = matchedFs.tuitionFee || 0;
                                    const trFee = activeChild.transportRequired === 'Yes' ? (matchedFs.transportFee || 0) : 0;
                                    const oFee = matchedFs.otherCharges || 0;
                                    const qTot = (tFee + trFee + oFee);
                                    if (qTot > 0) expectedQuarterTotal = qTot;
                                  }
                                }
                                if (quarterTotalPaid > expectedQuarterTotal) {
                                  expectedQuarterTotal = quarterTotalPaid;
                                }

                                const qRemainingDue = Math.max(0, expectedQuarterTotal - quarterTotalPaid);
                                const isQuarterPaid = qRemainingDue === 0 && quarterTotalPaid > 0;
                                const isQuarterPartial = quarterTotalPaid > 0 && qRemainingDue > 0;

                                let runningPaid = 0;

                                return (
                                  <React.Fragment key={qKey}>
                                    {/* Quarter Banner */}
                                    <tr style={{ background: 'rgba(255, 140, 66, 0.08)' }}>
                                      <td colSpan={7} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255, 140, 66, 0.2)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                          <span style={{ fontWeight: 800, color: '#FF8C42', fontSize: '0.84rem' }}>
                                            Quarter: {qKey} — Total Collected: ₹{quarterTotalPaid.toLocaleString()} ({items.length} Transaction{items.length > 1 ? 's' : ''})
                                          </span>
                                          <span style={{
                                            fontSize: '0.72rem',
                                            fontWeight: 800,
                                            padding: '3px 12px',
                                            borderRadius: '99px',
                                            background: isQuarterPaid ? 'rgba(16,185,129,0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            color: isQuarterPaid ? '#10b981' : '#ef4444',
                                            border: `1px solid ${isQuarterPaid ? '#10b981' : '#ef4444'}40`
                                          }}>
                                            QUARTER STATUS: {isQuarterPaid ? 'PAID' : (isQuarterPartial ? `PARTIAL (DUE: ₹${qRemainingDue})` : 'DUE')}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Column Header Row for this Quarter */}
                                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                                      <th style={{ padding: '8px 12px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Receipt No</th>
                                      <th style={{ padding: '8px 12px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quarter / Billing Period</th>
                                      <th style={{ padding: '8px 12px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fee Item</th>
                                      <th style={{ padding: '8px 12px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Method</th>
                                      <th style={{ padding: '8px 12px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount Paid</th>
                                      <th style={{ padding: '8px 12px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Date</th>
                                      <th style={{ padding: '8px 12px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Receipt Status / Entry Details</th>
                                    </tr>
                                    {items.map((f, i) => {
                                      const isDueCollection = f.remarks === 'DUE_COLLECTION' || f.isDueCollection || (f.receiptNumber && f.receiptNumber.includes('DUES'));
                                      
                                      runningPaid += Number(f.paidAmount || 0);
                                      const remainingDueAfterThis = Math.max(0, expectedQuarterTotal - runningPaid);
                                      
                                      let entryBadgeText = 'FULL PAYMENT CLEARED';
                                      let entryBadgeBg = 'rgba(16, 185, 129, 0.12)';
                                      let entryBadgeColor = '#10b981';

                                      if (isDueCollection) {
                                        entryBadgeText = `DUE CLEARED ENTRY (₹${f.paidAmount})`;
                                        entryBadgeBg = 'rgba(16, 185, 129, 0.15)';
                                        entryBadgeColor = '#10b981';
                                      } else if (remainingDueAfterThis > 0) {
                                        entryBadgeText = `PARTIAL PAYMENT (DUE: ₹${remainingDueAfterThis})`;
                                        entryBadgeBg = 'rgba(245, 158, 11, 0.15)';
                                        entryBadgeColor = '#f59e0b';
                                      } else {
                                        entryBadgeText = 'FULL PAYMENT CLEARED';
                                        entryBadgeBg = 'rgba(16, 185, 129, 0.15)';
                                        entryBadgeColor = '#10b981';
                                      }

                                      return (
                                        <tr key={f.id || `${qKey}-${i}`}>
                                          <td><strong>{f.receiptNumber || `REC-${1000 + i}`}</strong></td>
                                          <td style={{ fontWeight: 600 }}>{qKey}</td>
                                          <td>{f.feeType}</td>
                                          <td>{f.paymentMethod}</td>
                                          <td style={{ color: '#10b981', fontWeight: 700 }}>₹{f.paidAmount}</td>
                                          <td>{f.paymentDate ? f.paymentDate.split('T')[0] : 'N/A'}</td>
                                          <td>
                                            <span style={{
                                              padding: '4px 10px',
                                              borderRadius: '99px',
                                              fontSize: '0.72rem',
                                              fontWeight: 800,
                                              background: entryBadgeBg,
                                              color: entryBadgeColor,
                                              border: `1px solid ${entryBadgeColor}40`,
                                              display: 'inline-block',
                                              whiteSpace: 'nowrap'
                                            }}>
                                              {entryBadgeText}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No payment receipts logs recorded yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 8: EVENTS & HOLIDAYS */}
          {activeTab === 'notices' && (() => {
            const todayStr = new Date().toISOString().split('T')[0];
            
            // Filter active/published Events
            const activeEventsList = (events || []).filter(e => {
              if (e.isDeleted || e.status !== 'Published') return false;
              const endDateStr = e.endDate || e.date || e.startDate || '';
              return endDateStr ? endDateStr >= todayStr : true;
            });

            // Filter active/published Holidays
            const activeHolidaysList = (holidays || []).filter(h => {
              if (h.isDeleted || h.status !== 'Published') return false;
              const endDateStr = h.endDate || h.startDate || h.date || '';
              return endDateStr ? endDateStr >= todayStr : true;
            });

            // Filter active Notices
            const activeNoticesList = (notices || []).filter(n => {
              if (n.isDeleted || n.status === 'Draft') return false;
              return !n.expiryDate || n.expiryDate >= todayStr;
            });

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 1. School Events Section */}
                <div className="parent-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>School Events</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Upcoming school functions, competitions, and academic activities
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '99px', background: 'rgba(255, 140, 66, 0.15)', color: '#FF8C42' }}>
                      {activeEventsList.length} Active Event{activeEventsList.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {activeEventsList.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                      {activeEventsList.map((evt) => {
                        const sDate = evt.startDate || evt.date || 'Scheduled';
                        const eDate = evt.endDate || sDate;
                        const dateDisplay = sDate === eDate ? sDate : `${sDate} to ${eDate}`;
                        const timeDisplay = evt.startTime || evt.time ? `${evt.startTime || evt.time}${evt.endTime ? ' - ' + evt.endTime : ''}` : 'All Day';

                        return (
                          <div key={evt.id} style={{
                            padding: '16px',
                            borderRadius: '14px',
                            background: 'var(--bg-card-subtle, rgba(255, 255, 255, 0.03))',
                            border: '1px solid var(--border-glass)',
                            borderLeft: '4px solid #FF8C42',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{evt.title}</h4>
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', background: 'rgba(255, 140, 66, 0.15)', color: '#FF8C42', textTransform: 'uppercase' }}>
                                {evt.type || 'EVENT'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <div>📅 <strong>Dates:</strong> {dateDisplay}</div>
                              <div>⏰ <strong>Time:</strong> {timeDisplay}</div>
                              {evt.venue && <div>📍 <strong>Venue:</strong> {evt.venue}</div>}
                            </div>

                            {evt.description && (
                              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                                {evt.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', background: 'var(--bg-card-subtle)', borderRadius: '12px', border: '1px dashed var(--border-glass)' }}>
                      No active upcoming school events published yet.
                    </div>
                  )}
                </div>

                {/* 2. School Holidays Section */}
                <div className="parent-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>School Holidays</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Official holiday schedule and school closure announcements
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '99px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                      {activeHolidaysList.length} Active Holiday{activeHolidaysList.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {activeHolidaysList.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                      {activeHolidaysList.map((hld) => {
                        const sDate = hld.startDate || hld.date || 'Holiday';
                        const eDate = hld.endDate || sDate;
                        const dateDisplay = sDate === eDate ? sDate : `${sDate} to ${eDate}`;

                        return (
                          <div key={hld.id} style={{
                            padding: '16px',
                            borderRadius: '14px',
                            background: 'var(--bg-card-subtle, rgba(255, 255, 255, 0.03))',
                            border: '1px solid var(--border-glass)',
                            borderLeft: '4px solid #8b5cf6',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{hld.name || hld.title}</h4>
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', textTransform: 'uppercase' }}>
                                HOLIDAY
                              </span>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              📅 <strong>Duration:</strong> {dateDisplay}
                            </div>

                            {hld.description && (
                              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                                {hld.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', background: 'var(--bg-card-subtle)', borderRadius: '12px', border: '1px dashed var(--border-glass)' }}>
                      No active upcoming school holidays published yet.
                    </div>
                  )}
                </div>

                {/* 3. General Announcements */}
                {activeNoticesList.length > 0 && (
                  <div className="parent-card">
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 800 }}>General Announcements</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {activeNoticesList.map(n => (
                        <div key={n.id} className="notice-item" style={{ borderLeftColor: '#3b82f6' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: 'var(--text-main)' }}>{n.title}</h4>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {n.publishDate || n.date || 'Notice'}
                            </span>
                          </div>
                          <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {n.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* TAB 9: LEAVE REQUESTS */}
          {activeTab === 'leaves' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
              
              {/* Form to Apply Leave */}
              <div className="parent-card">
                <h3 style={{ margin: '0 0 20px 0' }}>Request Student Leave</h3>
                <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Leave Category</label>
                    <select
                      value={leaveForm.type}
                      onChange={e => setLeaveForm(prev => ({ ...prev, type: e.target.value }))}
                      className="form-control"
                    >
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Family Event">Family Event</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label>Start Date</label>
                      <input 
                        type="date"
                        value={leaveForm.startDate}
                        onChange={e => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input 
                        type="date"
                        value={leaveForm.endDate}
                        onChange={e => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Reason / Remarks</label>
                    <textarea 
                      value={leaveForm.reason}
                      onChange={e => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="form-control"
                      rows="4"
                      placeholder="Reason for student absence..."
                      required
                    />
                  </div>
                  <button type="submit" className="menu-item" style={{ background: '#FF8C42', color: 'white', fontWeight: 700, padding: '12px', justifyContent: 'center' }}>
                    <Plus size={16} /> Submit Leave Request
                  </button>
                </form>
              </div>

              {/* Leave History List */}
              <div className="parent-card">
                <h3 style={{ margin: '0 0 20px 0' }}>Request History Logs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {leaveRequests.map(r => (
                    <div key={r.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{r.type}</h4>
                        <p style={{ margin: '4px 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Duration: {r.startDate} to {r.endDate}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Reason: {r.reason}
                        </p>
                      </div>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: '20px',
                        background: r.status === 'Approved' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                        color: r.status === 'Approved' ? '#10b981' : '#f59e0b'
                      }}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 10: MESSAGES */}
          {activeTab === 'messages' && (
            <div className="parent-card" style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
              <h3 style={{ margin: '0 0 16px 0' }}>Direct Message with Teacher</h3>
              
              {/* Message History */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '10px', marginBottom: '20px' }}>
                {messages.map(m => (
                  <div key={m.id} style={{
                    alignSelf: m.sender === 'Parent' ? 'flex-end' : 'flex-start',
                    background: m.sender === 'Parent' ? '#FF8C42' : 'rgba(255,255,255,0.05)',
                    color: m.sender === 'Parent' ? 'white' : 'var(--text-main)',
                    padding: '12px 16px',
                    borderRadius: m.sender === 'Parent' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                    maxWidth: '70%',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ fontSize: '0.85rem' }}>{m.text}</div>
                    <div style={{ fontSize: '0.62rem', color: m.sender === 'Parent' ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                      {m.time}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Sender input */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text"
                  value={newMessageText}
                  onChange={e => setNewMessageText(e.target.value)}
                  placeholder="Type message to the grade coordinator..."
                  className="form-control"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="menu-item" style={{ background: '#FF8C42', color: 'white', width: '60px', padding: 0, justifyContent: 'center' }}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {/* TAB 11: SETTINGS / PROFILE */}
          {activeTab === 'settings' && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: 'calc(100vh - 120px)', 
              padding: '16px',
              boxSizing: 'border-box'
            }}>
              <div className="glass-panel" style={{ 
                width: '100%',
                maxWidth: '460px', 
                padding: '24px 30px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px', 
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                position: 'relative',
                boxSizing: 'border-box'
              }}>
                
                {/* Avatar Display */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <div 
                      style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '3px solid hsl(var(--color-primary))',
                        background: 'var(--bg-form)',
                        boxShadow: '0 6px 16px rgba(hsl(var(--color-primary)), 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {photo ? (
                        <img src={photo} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                          {getParentInitials()}
                        </div>
                      )}
                    </div>
                    
                    {/* Camera Overlay Icon */}
                    <label 
                      htmlFor="profile-photo-upload-input"
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'hsl(var(--color-primary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s ease',
                        border: '2px solid var(--bg-card)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </label>
                    <input 
                      type="file" 
                      id="profile-photo-upload-input" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handlePhotoChange}
                    />
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {localStorage.getItem('name') || (activeChild ? (activeChild.fatherName || activeChild.motherName) : 'Parent')}
                    </h2>
                    <span className="badge badge-info" style={{ marginTop: '4px', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '15px', display: 'inline-block' }}>PARENT</span>
                  </div>
                </div>

                <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)', margin: 0 }} />

                {/* Account Role Matrix Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Account Role Matrix</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgb(var(--color-success-rgb))', background: 'rgba(var(--color-success-rgb), 0.06)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Shield size={14} />
                    <span>Parent portal access (View-only privileges)</span>
                  </div>
                </div>

                <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)', margin: 0 }} />

                {/* Session & Contact Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px dashed var(--border-glass)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Login Username:</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{localStorage.getItem('username') || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px dashed var(--border-glass)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> Email Address:</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{localStorage.getItem('email') || (activeChild ? (activeChild.fatherEmail || activeChild.motherEmail) : '') || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px dashed var(--border-glass)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> Phone Number:</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{localStorage.getItem('phone') || (activeChild ? (activeChild.fatherMobile || activeChild.motherMobile) : '') || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={14} /> Current Status:</span>
                    <span style={{ color: 'rgb(var(--color-success-rgb))', fontWeight: 700, background: 'rgba(var(--color-success-rgb), 0.1)', padding: '2px 8px', borderRadius: '15px', fontSize: '0.75rem' }}>Active</span>
                  </div>
                </div>

                <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)', margin: 0 }} />

                <button 
                  onClick={onLogout} 
                  className="btn-danger" 
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    fontWeight: 700, 
                    background: 'rgba(239, 68, 68, 0.05)', 
                    color: '#ef4444', 
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>

              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
