import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  QrCode, 
  Camera, 
  Users, 
  UserCheck, 
  UserMinus,
  Clock, 
  TrendingUp, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  RefreshCw, 
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function AttendanceManager() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [todayRecords, setTodayRecords] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Scanner states
  const [scanActive, setScanActive] = useState(false);
  const [scanResult, setScanResult] = useState(null); // Success/Warning scan payload
  const [scanError, setScanError] = useState(null);
  const [lastScannedId, setLastScannedId] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(0);

  // Filter States for Reports
  const [filterEmpId, setFilterEmpId] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // Scanner Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const successTimeoutRef = useRef(null);

  // --------------------------------------------------------
  // FETCH ANALYTICS & TODAY RECORDS
  // --------------------------------------------------------
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await fetch('/api/employee-attendance/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching attendance stats:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchTodayRecords = async () => {
    try {
      const res = await fetch('/api/employee-attendance/today');
      if (res.ok) {
        const data = await res.json();
        setTodayRecords(data || []);
      }
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        employeeId: filterEmpId,
        department: filterDept,
        employeeType: filterType,
        month: filterMonth,
        year: filterYear
      }).toString();
      
      const res = await fetch(`/api/employee-attendance/reports?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchTodayRecords();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, filterDept, filterType, filterMonth, filterYear]);

  // --------------------------------------------------------
  // WEB AUDIO BEEP HELPER
  // --------------------------------------------------------
  const playBeep = (type = 'success') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.value = 900;
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        // Warning dual beep
        osc.frequency.value = 350;
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn('Web Audio API beep blocked or unsupported:', e);
    }
  };

  // --------------------------------------------------------
  // CAMERA QR SCANNER LOOP
  // --------------------------------------------------------
  const startScanner = async () => {
    setScanError(null);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.play();
        setScanActive(true);
        requestRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setScanError('Could not access device camera. Please grant permission.');
    }
  };

  const stopScanner = () => {
    setScanActive(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanLoop = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      requestRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // JSQR Decoder
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code) {
      try {
        const payload = JSON.parse(code.data);
        if (payload.employeeId && payload.employeeType) {
          // Debounce same scan to prevent duplicate scans in a row (5 seconds threshold)
          const now = Date.now();
          if (payload.employeeId === lastScannedId && (now - lastScanTime) < 5000) {
            // Skip processing, wait for timeout
          } else {
            setLastScannedId(payload.employeeId);
            setLastScanTime(now);
            processAttendanceScan(payload.employeeId, payload.employeeType);
          }
        }
      } catch (err) {
        // Code read is not our ERP payload
      }
    }
    requestRef.current = requestAnimationFrame(scanLoop);
  };

  const processAttendanceScan = async (employeeId, employeeType) => {
    try {
      const res = await fetch('/api/employee-attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, employeeType })
      });
      
      if (res.ok) {
        const data = await res.json();
        playBeep('success');
        setScanResult({
          type: 'success',
          title: data.scanType === 'Check-In' ? 'Check-In Recorded!' : 'Check-Out Recorded!',
          message: data.message,
          details: data.employeeDetails
        });
        fetchAnalytics();
        fetchTodayRecords();
      } else {
        const errData = await res.json();
        playBeep('warning');
        setScanResult({
          type: errData.alreadyRecorded ? 'info' : 'error',
          title: errData.alreadyRecorded ? 'Already Scanned' : 'Scan Refused',
          message: errData.message || errData.error || 'Check-in constraints rejected this scan.',
          details: errData.employeeDetails || null
        });
      }
    } catch (err) {
      console.error('Scan processing failed:', err);
      playBeep('warning');
      setScanResult({
        type: 'error',
        title: 'Network Timeout',
        message: 'Could not connect to ERP server.',
        details: null
      });
    }

    // Auto dismiss check success card after 4.5 seconds
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => {
      setScanResult(null);
    }, 4500);
  };

  useEffect(() => {
    return () => {
      stopScanner();
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'rgb(var(--color-success-rgb))';
      case 'Late': return 'rgb(var(--color-warning-rgb))';
      case 'Incomplete Attendance': return 'rgb(var(--color-danger-rgb))';
      case 'Absent': return '#6b7280';
      default: return 'var(--text-main)';
    }
  };

  // CSV Export helper
  const handleExportCSV = () => {
    if (reports.length === 0) return;
    const headers = ['Date', 'Employee ID', 'Type', 'Name', 'Department', 'Designation', 'Check-In', 'Check-Out', 'Hours Worked', 'Status'];
    const rows = reports.map(r => [
      r.date, r.employeeId, r.employeeType, r.name, r.department, r.designation, r.checkIn || '—', r.checkOut || '—', r.workingHours || '0', r.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QR_Attendance_Report_${filterMonth}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    const dateStr = new Date().toLocaleDateString();
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Attendance Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #1e293b; }
            h2 { margin-bottom: 2px; }
            .meta { font-size: 0.85rem; color: #64748b; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 0.85rem; }
            th { background: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Aether Academy QR Attendance History</h2>
          <div class="meta">Generated on ${dateStr} | Department: ${filterDept} | Month: ${filterMonth}/${filterYear}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee ID</th>
                <th>Type</th>
                <th>Name</th>
                <th>Department</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${reports.map(r => `
                <tr>
                  <td>${r.date}</td>
                  <td>${r.employeeId}</td>
                  <td>${r.employeeType}</td>
                  <td>${r.name}</td>
                  <td>${r.department}</td>
                  <td>${r.checkIn || '—'}</td>
                  <td>${r.checkOut || '—'}</td>
                  <td>${r.workingHours || '0'} hrs</td>
                  <td><strong>${r.status}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Title Section */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(hsl(var(--color-primary)), 0.1)', color: 'hsl(var(--color-primary))' }}>
            <QrCode size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>QR Attendance Manager</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Camera-based instant scanning, real-time analytics, and detailed compliance reporting.</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Users },
            { id: 'scanner', label: 'QR Scanner', icon: Camera },
            { id: 'today', label: 'Today\'s Log', icon: Clock },
            { id: 'reports', label: 'Reports & Analytics', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== 'scanner') stopScanner();
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s',
                background: activeTab === tab.id ? 'hsl(var(--color-primary))' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          1. DASHBOARD VIEW
          ======================================================== */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Present Today', value: analytics?.presentToday ?? '—', icon: UserCheck, color: 'rgb(var(--color-success-rgb))', bg: 'rgba(var(--color-success-rgb), 0.1)' },
              { label: 'Late Arrivals', value: analytics?.lateToday ?? '—', icon: Clock, color: 'rgb(var(--color-warning-rgb))', bg: 'rgba(var(--color-warning-rgb), 0.1)' },
              { label: 'Absent Today', value: analytics?.absentToday ?? '—', icon: UserMinus, color: 'rgb(var(--color-danger-rgb))', bg: 'rgba(var(--color-danger-rgb), 0.1)' },
              { label: 'Check-Outs', value: analytics?.checkOutsToday ?? '—', icon: QrCode, color: 'hsl(var(--color-info))', bg: 'rgba(hsl(var(--color-info)), 0.1)' }
            ].map((card, i) => (
              <div key={i} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{card.label}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: card.color }}>{card.value}</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '12px', background: card.bg, color: card.color }}>
                  <card.icon size={22} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Department Breakdown */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} style={{ color: 'hsl(var(--color-primary))' }} /> Department-wise Attendance
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {analytics?.departmentStats && Object.keys(analytics.departmentStats).length > 0 ? (
                  Object.entries(analytics.departmentStats).map(([dept, stats]) => {
                    const present = stats.present + stats.late;
                    const total = stats.total || 1;
                    const percent = Math.round((present / total) * 100);
                    return (
                      <div key={dept} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
                          <span>{dept}</span>
                          <span style={{ color: percent > 75 ? 'rgb(var(--color-success-rgb))' : percent > 40 ? 'rgb(var(--color-warning-rgb))' : 'rgb(var(--color-danger-rgb))' }}>
                            {present}/{total} ({percent}%)
                          </span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${percent}%`,
                            background: percent > 75 ? 'linear-gradient(90deg, hsl(140, 75%, 50%), hsl(160, 75%, 40%))' : percent > 40 ? 'linear-gradient(90deg, hsl(40, 80%, 55%), hsl(45, 80%, 50%))' : 'linear-gradient(90deg, hsl(0, 85%, 60%), hsl(350, 85%, 50%))',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease-out'
                          }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '40px 0' }}>No records logged yet today.</div>
                )}
              </div>
            </div>

            {/* Roster Summaries */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Roster Compliance summaries</h3>
              
              {/* Teacher Summary */}
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Staff Summary</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total: {analytics?.teacherSummary?.total ?? 0}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(var(--color-success-rgb), 0.05)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Present</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgb(var(--color-success-rgb))', marginTop: '2px' }}>{analytics?.teacherSummary?.present ?? 0}</div>
                  </div>
                  <div style={{ background: 'rgba(var(--color-warning-rgb), 0.05)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Late</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgb(var(--color-warning-rgb))', marginTop: '2px' }}>{analytics?.teacherSummary?.late ?? 0}</div>
                  </div>
                  <div style={{ background: 'rgba(var(--color-danger-rgb), 0.05)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Absent</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgb(var(--color-danger-rgb))', marginTop: '2px' }}>{analytics?.teacherSummary?.absent ?? 0}</div>
                  </div>
                </div>
              </div>

              {/* Staff Summary */}
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Non-Academic Employee Summary</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total: {analytics?.staffSummary?.total ?? 0}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(var(--color-success-rgb), 0.05)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Present</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgb(var(--color-success-rgb))', marginTop: '2px' }}>{analytics?.staffSummary?.present ?? 0}</div>
                  </div>
                  <div style={{ background: 'rgba(var(--color-warning-rgb), 0.05)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Late</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgb(var(--color-warning-rgb))', marginTop: '2px' }}>{analytics?.staffSummary?.late ?? 0}</div>
                  </div>
                  <div style={{ background: 'rgba(var(--color-danger-rgb), 0.05)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Absent</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgb(var(--color-danger-rgb))', marginTop: '2px' }}>{analytics?.staffSummary?.absent ?? 0}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Last 7 Days Trends Chart (Styled CSS Blocks) */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '24px' }}>Attendance Roster Trends (Last 7 Days)</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '200px', padding: '0 20px', gap: '10px' }}>
              {analytics?.trends && analytics.trends.map((day, i) => {
                const total = day.present + day.late + day.absent || 1;
                const presPercent = (day.present / total) * 100;
                const latePercent = (day.late / total) * 100;
                const absPercent = (day.absent / total) * 100;

                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', gap: '8px' }}>
                    <div style={{ width: '24px', height: '80%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ height: `${absPercent}%`, background: 'rgba(239, 68, 68, 0.4)' }} title={`Absent: ${day.absent}`} />
                      <div style={{ height: `${latePercent}%`, background: 'rgba(245, 158, 11, 0.8)' }} title={`Late: ${day.late}`} />
                      <div style={{ height: `${presPercent}%`, background: 'hsl(var(--color-primary))' }} title={`Present: ${day.present}`} />
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>{day.label}</span>
                  </div>
                );
              })}
            </div>
            {/* Chart Legend */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'hsl(var(--color-primary))' }} />
                <span>Present (On Time)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.8)' }} />
                <span>Late Arrival</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.4)' }} />
                <span>Absent</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          2. QR SCANNER VIEW (LIVE CAMERA FEED)
          ======================================================== */}
      {activeTab === 'scanner' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Live Scanner Capture Box */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={18} style={{ color: 'hsl(var(--color-primary))' }} /> Live Scanner Camera
            </h3>

            <div style={{ position: 'relative', width: '100%', maxWidth: '440px', aspectRatio: '4/3', borderRadius: '16px', overflow: 'hidden', background: '#000000', border: '2px solid var(--border-glass)' }}>
              {/* Invisible HTML5 video to stream camera */}
              <video ref={videoRef} style={{ display: 'none' }} />
              
              {/* Canvas where frames are processed & QR bounding boxes drawn */}
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

              {/* Aiming Reticle box */}
              {scanActive && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: '60%', height: '60%', border: '2px dashed hsl(var(--color-primary))', borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', pointerEvents: 'none'
                }}>
                  {/* Bouncing Scanner Line */}
                  <div style={{
                    width: '100%', height: '2px', background: 'hsl(var(--color-primary))',
                    boxShadow: '0 0 10px hsl(var(--color-primary))', position: 'absolute',
                    animation: 'scannerLine 2.5s ease-in-out infinite'
                  }} />
                </div>
              )}

              {/* Non-Active Overlay */}
              {!scanActive && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'rgba(0,0,0,0.7)', zIndex: 10 }}>
                  <QrCode size={48} style={{ color: '#64748b' }} />
                  <button onClick={startScanner} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '10px', fontWeight: 700 }}>
                    Enable Camera Scanner
                  </button>
                  {scanError && <span style={{ fontSize: '0.75rem', color: 'rgb(var(--color-danger-rgb))', fontWeight: 600 }}>{scanError}</span>}
                </div>
              )}
            </div>

            {scanActive && (
              <button onClick={stopScanner} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', color: 'rgb(var(--color-danger-rgb))', borderColor: 'rgba(var(--color-danger-rgb), 0.2)' }}>
                Stop Camera Feed
              </button>
            )}
          </div>

          {/* Real-time Scan Result Card Overlay / Overlay display */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '300px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Live Scan Activity Screen</h3>
            
            {scanResult ? (
              <div className="animate-scale-up" style={{
                borderRadius: '16px', padding: '24px', border: '1px solid var(--border-glass)',
                background: scanResult.type === 'success' ? 'rgba(16, 185, 129, 0.05)' : scanResult.type === 'info' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {scanResult.type === 'success' ? (
                    <CheckCircle2 size={24} style={{ color: 'rgb(var(--color-success-rgb))' }} />
                  ) : scanResult.type === 'info' ? (
                    <AlertTriangle size={24} style={{ color: 'rgb(var(--color-warning-rgb))' }} />
                  ) : (
                    <AlertCircle size={24} style={{ color: 'rgb(var(--color-danger-rgb))' }} />
                  )}
                  <strong style={{ fontSize: '1.1rem', color: scanResult.type === 'success' ? 'rgb(var(--color-success-rgb))' : scanResult.type === 'info' ? 'rgb(var(--color-warning-rgb))' : 'rgb(var(--color-danger-rgb))' }}>{scanResult.title}</strong>
                </div>

                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>{scanResult.message}</p>

                {/* Scanned Employee Details Card */}
                {scanResult.details && (
                  <div className="glass-panel animate-slide-up" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '14px', alignItems: 'center', marginTop: '10px' }}>
                    {scanResult.details.photo ? (
                      <img src={scanResult.details.photo} alt="" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-glass)' }} />
                    ) : (
                      <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, hsl(210, 75%, 60%), hsl(240, 85%, 50%))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                        {scanResult.details.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{scanResult.details.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{scanResult.details.employeeId} • {scanResult.details.designation}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                        <span style={{ color: getStatusColor(scanResult.details.status) }}>{scanResult.details.status}</span>
                        <span style={{ color: 'var(--text-muted)' }}>|</span>
                        <span>In: {scanResult.details.checkIn}</span>
                        {scanResult.details.checkOut !== '—' && (
                          <>
                            <span style={{ color: 'var(--text-muted)' }}>|</span>
                            <span>Out: {scanResult.details.checkOut}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '220px', color: 'var(--text-muted)', gap: '10px' }}>
                <QrCode size={36} style={{ opacity: 0.3 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Awaiting employee QR scan...</span>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================
          3. TODAY'S ATTENDANCE LOG VIEW
          ======================================================== */}
      {activeTab === 'today' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Today's Check-ins & Check-outs</h3>
            <button onClick={fetchTodayRecords} className="btn-secondary" style={{ padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
              <RefreshCw size={12} /> Refresh Logs
            </button>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.length > 0 ? (
                  todayRecords.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: 'hsl(var(--color-primary))' }}>{r.employeeId}</td>
                      <td style={{ fontWeight: 600 }}>{r.employeeType}</td>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>{r.department}</td>
                      <td>{r.designation}</td>
                      <td style={{ fontWeight: 600, color: 'rgb(var(--color-success-rgb))' }}>{r.checkIn}</td>
                      <td style={{ fontWeight: 600, color: r.checkOut ? 'hsl(var(--color-primary))' : 'var(--text-muted)' }}>{r.checkOut || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{r.workingHours ? `${r.workingHours} hrs` : '—'}</td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: getStatusColor(r.status), border: `1px solid ${getStatusColor(r.status)}`, padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No attendance scans recorded today yet. Enable QR Scanner tab to check-in.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          4. REPORTS & ANALYTICS VIEW
          ======================================================== */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search Employee ID..."
                className="search-bar-input"
                value={filterEmpId}
                onChange={(e) => setFilterEmpId(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {/* Department */}
              <select className="select-custom" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                <option value="All">All Departments</option>
                {['Science', 'Mathematics', 'English', 'Social Science', 'Computer Science', 'Administration', 'IT Department', 'Transport', 'Security'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Type */}
              <select className="select-custom" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="All">All Roster Types</option>
<option value="Teacher">Staff Only</option>
<option value="Staff">Employee Only</option>
              </select>

              {/* Month */}
              <select className="select-custom" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                <option value="All">All Months</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const m = i + 1;
                  return <option key={m} value={m}>{new Date(2026, i).toLocaleString('en-US', { month: 'long' })}</option>;
                })}
              </select>

              {/* Year */}
              <select className="select-custom" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>

              <button onClick={fetchReports} className="btn-secondary" style={{ padding: '8px 12px', borderRadius: '8px' }}>
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Results Grid List */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Attendance Roster Search History</h3>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrintReport} className="btn-secondary" style={{ padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                  <Printer size={13} /> Print
                </button>
                <button onClick={handleExportCSV} className="btn-secondary" style={{ padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                  <Download size={13} /> Export CSV
                </button>
              </div>
            </div>

            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Employee ID</th>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Querying attendance logs...</td>
                    </tr>
                  ) : reports.length > 0 ? (
                    reports.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.date}</td>
                        <td style={{ fontWeight: 700, color: 'hsl(var(--color-primary))' }}>{r.employeeId}</td>
                        <td style={{ fontWeight: 600 }}>{r.employeeType}</td>
                        <td style={{ fontWeight: 600 }}>{r.name}</td>
                        <td>{r.department}</td>
                        <td>{r.designation}</td>
                        <td style={{ color: 'rgb(var(--color-success-rgb))', fontWeight: 600 }}>{r.checkIn || '—'}</td>
                        <td style={{ color: r.checkOut ? 'hsl(var(--color-primary))' : 'var(--text-muted)', fontWeight: 600 }}>{r.checkOut || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{r.workingHours ? `${r.workingHours} hrs` : '—'}</td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: getStatusColor(r.status), border: `1px solid ${getStatusColor(r.status)}`, padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No historical logs found matching the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS Scanner Line Animation */}
      <style>{`
        @keyframes scannerLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>

    </div>
  );
}
