import express from 'express';
import { auth } from '../middleware/auth.js';
import { restoreTenantContext } from '../utils/db.js';
import * as sqlDb from '../utils/sqlDb.js';

const router = express.Router();

// Apply auth and tenant context middlewares to all payroll routes
router.use(auth);
router.use(restoreTenantContext);

// ==========================================
// 1. GET WORKERS DIRECTORY FOR PAYROLL
// ==========================================
router.get('/directory', async (req, res) => {
  try {
    const type = req.query.type; // 'Teacher', 'Staff', 'Employee'
    let queryStr = '';
    
    if (type === 'Teacher') {
      queryStr = 'SELECT id, name, department, role, joiningDate, status, photo FROM teachers';
    } else if (type === 'Staff') {
      queryStr = 'SELECT id, name, department, role, joiningDate, status, photo FROM staff';
    } else if (type === 'Employee') {
      queryStr = 'SELECT id, name, department, designation, joiningDate, status, photo FROM employees';
    } else {
      return res.status(400).json({ error: 'Invalid type parameter. Must be Teacher, Staff, or Employee.' });
    }
    
    const records = await sqlDb.query(queryStr);
    
    // Fetch salary configurations
    const salaryMasters = await sqlDb.query('SELECT employeeId, netSalary, status FROM salary_masters WHERE employeeType = ?', [type]);
    
    // Fetch last payments for each employee
    const lastPayments = await sqlDb.query(
      `SELECT employeeId, paidAmount, paymentDate FROM salary_payments 
       WHERE (employeeId, paymentDate) IN (
         SELECT employeeId, MAX(paymentDate) FROM salary_payments WHERE employeeType = ? GROUP BY employeeId
       )`, [type]
    );
    
    // Merge status & salary fields
    const mapped = records.map(r => {
      const salary = salaryMasters.find(s => s.employeeId === r.id);
      const lastPay = lastPayments.find(p => p.employeeId === r.id);
      const roleValue = type === 'Employee' ? (r.designation || 'N/A') : (r.role || 'N/A');
      return {
        id: r.id,
        name: r.name,
        employeeType: type,
        department: r.department || 'General',
        designation: roleValue,  // used by filter logic
        role: roleValue,         // explicit role field
        joiningDate: r.joiningDate || r.dateOfJoining || 'N/A',
        status: r.status || 'Active',
        photo: r.photo || '',
        salaryStatus: salary && salary.status === 'Active' ? 'Configured' : 'Not Configured',
        currentSalary: salary ? parseFloat(salary.netSalary) : 0.00,
        lastSalaryPaidDate: lastPay ? lastPay.paymentDate : 'Never',
        lastSalaryPaidAmount: lastPay ? parseFloat(lastPay.paidAmount) : 0.00
      };
    });
    
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll directory: ' + error.message });
  }
});

// ==========================================
// 2. SALARY MASTER (INDIVIDUAL CONFIGURATION)
// ==========================================
router.get('/salary-masters/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const rows = await sqlDb.query('SELECT * FROM salary_masters WHERE employeeId = ?', [employeeId]);
    res.json(rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch salary configuration: ' + error.message });
  }
});

router.post('/salary-masters', async (req, res) => {
  try {
    const {
      employeeId, employeeType, basicSalary, hra, da, ta, medical, specialAllowance, otherAllowances,
      pf, esi, profTax, loan, advance, otherDeductions, effectiveDate, salaryCycle, status, reason
    } = req.body;
    
    if (!employeeId || !employeeType) {
      return res.status(400).json({ error: 'employeeId and employeeType are required.' });
    }
    
    const basic = parseFloat(basicSalary || 0);
    const h = parseFloat(hra || 0);
    const d = parseFloat(da || 0);
    const t = parseFloat(ta || 0);
    const med = parseFloat(medical || 0);
    const spec = parseFloat(specialAllowance || 0);
    const otherA = parseFloat(otherAllowances || 0);
    
    const grossSalary = basic + h + d + t + med + spec + otherA;
    
    const p = parseFloat(pf || 0);
    const e = parseFloat(esi || 0);
    const pt = parseFloat(profTax || 0);
    const ln = parseFloat(loan || 0);
    const adv = parseFloat(advance || 0);
    const otherD = parseFloat(otherDeductions || 0);
    
    const totalDeductions = p + e + pt + ln + adv + otherD;
    const netSalary = grossSalary - totalDeductions;
    
    const [existing] = await sqlDb.query('SELECT * FROM salary_masters WHERE employeeId = ?', [employeeId]);
    const tenantId = req.headers['x-tenant-id'] || 'rerum';
    
    if (existing) {
      // Record salary revision history if net salary changed
      if (parseFloat(existing.netSalary) !== netSalary) {
        const revId = `REV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await sqlDb.query(
          `INSERT INTO salary_revision_history 
           (id, employeeId, employeeType, previousSalary, newSalary, revisedDate, reason, tenantId) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [revId, employeeId, employeeType, parseFloat(existing.netSalary), netSalary, new Date().toISOString().split('T')[0], reason || 'Salary Revised', tenantId]
        );
      }
      
      // Update configuration
      await sqlDb.query(
        `UPDATE salary_masters SET 
          basicSalary = ?, hra = ?, da = ?, ta = ?, medical = ?, specialAllowance = ?, otherAllowances = ?, 
          pf = ?, esi = ?, profTax = ?, loan = ?, advance = ?, otherDeductions = ?, 
          grossSalary = ?, totalDeductions = ?, netSalary = ?, effectiveDate = ?, salaryCycle = ?, status = ?
         WHERE employeeId = ?`,
        [basic, h, d, t, med, spec, otherA, p, e, pt, ln, adv, otherD, grossSalary, totalDeductions, netSalary, effectiveDate, salaryCycle || 'Monthly', status || 'Active', employeeId]
      );
    } else {
      // Insert new individual salary master configuration
      const id = `SM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await sqlDb.query(
        `INSERT INTO salary_masters 
         (id, employeeId, employeeType, basicSalary, hra, da, ta, medical, specialAllowance, otherAllowances, 
          pf, esi, profTax, loan, advance, otherDeductions, grossSalary, totalDeductions, netSalary, effectiveDate, salaryCycle, status, createdAt, tenantId) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, employeeId, employeeType, basic, h, d, t, med, spec, otherA, p, e, pt, ln, adv, otherD, grossSalary, totalDeductions, netSalary, effectiveDate, salaryCycle || 'Monthly', status || 'Active', new Date().toISOString(), tenantId]
      );
    }
    
    res.json({ message: 'Salary configuration saved successfully', grossSalary, totalDeductions, netSalary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save salary configuration: ' + error.message });
  }
});

// ==========================================
// 3. GET REVISION HISTORY
// ==========================================
router.get('/revisions/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const rows = await sqlDb.query('SELECT * FROM salary_revision_history WHERE employeeId = ? ORDER BY revisedDate DESC, id DESC', [employeeId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revision history: ' + error.message });
  }
});

// ==========================================
// 4. SALARY PAYMENTS
// ==========================================
router.get('/payments', async (req, res) => {
  try {
    const rows = await sqlDb.query(
      `SELECT p.*, 
        COALESCE(t.name, st.name, emp.name) as employeeName,
        COALESCE(t.department, st.department, emp.department) as department,
        COALESCE(t.role, st.role, emp.designation) as designation,
        st.role as staffRole
       FROM salary_payments p
       LEFT JOIN teachers t ON p.employeeId = t.id AND p.employeeType = 'Teacher'
       LEFT JOIN staff st ON p.employeeId = st.id AND p.employeeType = 'Staff'
       LEFT JOIN employees emp ON p.employeeId = emp.id AND p.employeeType = 'Employee'
       ORDER BY p.paymentDate DESC, p.id DESC`
    );
    // Normalize: for Staff, expose staffRole as role
    const normalized = rows.map(r => ({
      ...r,
      role: r.employeeType === 'Staff' ? r.staffRole : null,
    }));
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch salary payments: ' + error.message });
  }
});

router.post('/payments', async (req, res) => {
  try {
    const {
      employeeId, employeeType, month, year, paymentDate, paymentMethod, transactionId,
      bonus, incentive, overtime, fine, loanAdjustment, advanceAdjustment, remarks, paidAmount
    } = req.body;
    
    if (!employeeId || !month || !year || !paymentDate || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required payment details.' });
    }
    
    // Check if configuration exists
    const [config] = await sqlDb.query("SELECT * FROM salary_masters WHERE employeeId = ? AND status = 'Active'", [employeeId]);
    if (!config) {
      return res.status(404).json({ error: 'No active salary configuration found for this employee.' });
    }
    
    // Double pay check
    const [duplicate] = await sqlDb.query(
      'SELECT * FROM salary_payments WHERE employeeId = ? AND month = ? AND year = ?',
      [employeeId, month, year]
    );
    if (duplicate) {
      return res.status(400).json({ error: `Salary payment already processed for this employee for ${month}/${year}.` });
    }
    
    const net = parseFloat(config.netSalary);
    const bon = parseFloat(bonus || 0);
    const inc = parseFloat(incentive || 0);
    const ot = parseFloat(overtime || 0);
    const fn = parseFloat(fine || 0);
    const la = parseFloat(loanAdjustment || 0);
    const aa = parseFloat(advanceAdjustment || 0);
    
    const finalPayable = net + bon + inc + ot - fn - la - aa;
    const paid = parseFloat(paidAmount || 0);
    const balance = Math.max(0, finalPayable - paid);
    
    let paymentStatus = 'Paid';
    if (balance > 0) {
      paymentStatus = paid > 0 ? 'Partial' : 'Pending';
    }
    
    // Generate unique receipt number (Format: REC-YYYYMM-XXXXX)
    const countRows = await sqlDb.query('SELECT COUNT(*) as cnt FROM salary_payments');
    const seq = String((countRows[0]?.cnt || 0) + 1).padStart(5, '0');
    const receiptNo = `REC-${year}${month.toUpperCase().substring(0, 3)}-${seq}`;
    
    const tenantId = req.headers['x-tenant-id'] || 'rerum';
    const id = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    await sqlDb.query(
      `INSERT INTO salary_payments 
       (id, receiptNo, employeeId, employeeType, month, year, paymentDate, paymentMethod, transactionId, 
        basicSalary, hra, da, ta, medical, specialAllowance, otherAllowances, pf, esi, profTax, loan, advance, otherDeductions, 
        bonus, incentive, overtime, fine, loanAdjustment, advanceAdjustment, grossSalary, totalDeductions, netSalary, 
        finalPayable, paidAmount, balance, status, remarks, tenantId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, receiptNo, employeeId, employeeType, month, year, paymentDate, paymentMethod, transactionId || '',
        config.basicSalary, config.hra, config.da, config.ta, config.medical, config.specialAllowance, config.otherAllowances,
        config.pf, config.esi, config.profTax, config.loan, config.advance, config.otherDeductions,
        bon, inc, ot, fn, la, aa, config.grossSalary, config.totalDeductions, net,
        finalPayable, paid, balance, paymentStatus, remarks || '', tenantId
      ]
    );
    
    res.status(201).json({
      message: 'Payment processed successfully',
      payment: {
        id, receiptNo, finalPayable, paidAmount: paid, balance, status: paymentStatus
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Salary payment already processed for this employee for the selected period.' });
    }
    res.status(500).json({ error: 'Failed to process payment: ' + error.message });
  }
});

// ==========================================
// 5. PAYROLL DASHBOARD STATS
// ==========================================
router.get('/dashboard', async (req, res) => {
  try {
    // 1. Enforce tenant context validation
    const activeTenant = req.headers['x-tenant-id'] || req.query.tenantId;
    if (!activeTenant || activeTenant === 'platform' || activeTenant === 'default') {
      return res.status(400).json({ error: 'Valid tenant context (x-tenant-id header) is required to access the payroll dashboard.' });
    }

    let { type, role, month, year } = req.query;

    // 2. Validate type query parameter
    const allowedTypes = ['Teacher', 'Staff', 'Employee'];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type parameter. Must be one of: Teacher, Staff, Employee.' });
    }

    // 3. Validate and sanitize month query parameter
    const allowedMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    if (!month) {
      month = currentMonth;
    } else {
      const cleanMonth = month.trim();
      const matchedMonth = allowedMonths.find(m => m.toLowerCase() === cleanMonth.toLowerCase());
      if (!matchedMonth) {
        return res.status(400).json({ error: 'Invalid month parameter. Must be a full month name (e.g., January).' });
      }
      month = matchedMonth;
    }

    // 4. Validate and sanitize year query parameter
    const currentYear = String(new Date().getFullYear());
    if (!year) {
      year = currentYear;
    } else {
      const cleanYear = year.trim();
      const yearNum = parseInt(cleanYear, 10);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100 || !/^\d{4}$/.test(cleanYear)) {
        return res.status(400).json({ error: 'Invalid year parameter. Must be a 4-digit year between 2000 and 2100.' });
      }
      year = cleanYear;
    }
    
    // Counts
    let teachersCount = 0;
    let staffCount = 0;
    let employeesCount = 0;

    if (!type || type === 'Teacher') {
      const [{ count }] = await sqlDb.query('SELECT COUNT(*) as count FROM teachers');
      teachersCount = count;
    }
    if (!type || type === 'Staff') {
      let q = 'SELECT COUNT(*) as count FROM staff';
      let p = [];
      if (role && role !== 'All') {
        q += ' WHERE role = ?';
        p.push(role);
      }
      const [{ count }] = await sqlDb.query(q, p);
      staffCount = count;
    }
    if (!type || type === 'Employee') {
      let q = 'SELECT COUNT(*) as count FROM employees';
      let p = [];
      if (role && role !== 'All') {
        q += ' WHERE designation = ?';
        p.push(role);
      }
      const [{ count }] = await sqlDb.query(q, p);
      employeesCount = count;
    }
    
    // Active payroll costs
    let configCostQuery = 'SELECT SUM(m.netSalary) as monthlyCost FROM salary_masters m';
    let configCostParams = [];
    const joins = [];
    const wheres = ["m.status = 'Active'"];
    
    if (type) {
      wheres.push('m.employeeType = ?');
      configCostParams.push(type);
    }
    
    if (role && role !== 'All') {
      if (type === 'Staff') {
        joins.push('JOIN staff s ON m.employeeId = s.id');
        wheres.push('s.role = ?');
        configCostParams.push(role);
      } else if (type === 'Employee') {
        joins.push('JOIN employees e ON m.employeeId = e.id');
        wheres.push('e.designation = ?');
        configCostParams.push(role);
      } else if (type === 'Teacher') {
        joins.push('JOIN teachers t ON m.employeeId = t.id');
        wheres.push('t.role = ?');
        configCostParams.push(role);
      }
    }
    
    if (joins.length > 0) {
      configCostQuery += ' ' + joins.join(' ');
    }
    configCostQuery += ' WHERE ' + wheres.join(' AND ');
    
    const configCostRows = await sqlDb.query(configCostQuery, configCostParams);
    const monthlyPayrollCost = parseFloat(configCostRows[0]?.monthlyCost || 0);
    
    // Paid vs Pending (Target Period)
    const targetMonth = month;
    const targetYear = year;
    
    let paidQuery = 'SELECT COUNT(DISTINCT p.employeeId) as paidCount FROM salary_payments p';
    let paidParams = [targetMonth, targetYear];
    const paidJoins = [];
    const paidWheres = ['p.month = ?', 'p.year = ?', "p.status = 'Paid'"];
    
    if (type) {
      paidWheres.push('p.employeeType = ?');
      paidParams.push(type);
    }
    if (role && role !== 'All') {
      if (type === 'Staff') {
        paidJoins.push('JOIN staff s ON p.employeeId = s.id');
        paidWheres.push('s.role = ?');
        paidParams.push(role);
      } else if (type === 'Employee') {
        paidJoins.push('JOIN employees e ON p.employeeId = e.id');
        paidWheres.push('e.designation = ?');
        paidParams.push(role);
      } else if (type === 'Teacher') {
        paidJoins.push('JOIN teachers t ON p.employeeId = t.id');
        paidWheres.push('t.role = ?');
        paidParams.push(role);
      }
    }
    
    if (paidJoins.length > 0) {
      paidQuery += ' ' + paidJoins.join(' ');
    }
    paidQuery += ' WHERE ' + paidWheres.join(' AND ');
    
    const paidRows = await sqlDb.query(paidQuery, paidParams);
    const paidEmployeesCount = paidRows[0]?.paidCount || 0;
    
    let totalConfiguredQuery = 'SELECT COUNT(DISTINCT m.employeeId) as totalConfigured FROM salary_masters m';
    let totalConfiguredParams = [];
    const tcJoins = [];
    const tcWheres = ["m.status = 'Active'"];
    
    if (type) {
      tcWheres.push('m.employeeType = ?');
      totalConfiguredParams.push(type);
    }
    if (role && role !== 'All') {
      if (type === 'Staff') {
        tcJoins.push('JOIN staff s ON m.employeeId = s.id');
        tcWheres.push('s.role = ?');
        totalConfiguredParams.push(role);
      } else if (type === 'Employee') {
        tcJoins.push('JOIN employees e ON m.employeeId = e.id');
        tcWheres.push('e.designation = ?');
        totalConfiguredParams.push(role);
      } else if (type === 'Teacher') {
        tcJoins.push('JOIN teachers t ON m.employeeId = t.id');
        tcWheres.push('t.role = ?');
        totalConfiguredParams.push(role);
      }
    }
    
    if (tcJoins.length > 0) {
      totalConfiguredQuery += ' ' + tcJoins.join(' ');
    }
    totalConfiguredQuery += ' WHERE ' + tcWheres.join(' AND ');
    
    const activeConfigsCountRows = await sqlDb.query(totalConfiguredQuery, totalConfiguredParams);
    const totalConfigured = activeConfigsCountRows[0]?.totalConfigured || 0;
    const pendingEmployeesCount = Math.max(0, totalConfigured - paidEmployeesCount);
    
    const upcomingPayments = pendingEmployeesCount;
    
    // Trend (Last 6 Months)
    let trendQuery = 'SELECT p.month, p.year, SUM(p.paidAmount) as totalPaid FROM salary_payments p';
    let trendParams = [];
    const trendJoins = [];
    const trendWheres = [];
    
    if (type) {
      trendWheres.push('p.employeeType = ?');
      trendParams.push(type);
    }
    if (role && role !== 'All') {
      if (type === 'Staff') {
        trendJoins.push('JOIN staff s ON p.employeeId = s.id');
        trendWheres.push('s.role = ?');
        trendParams.push(role);
      } else if (type === 'Employee') {
        trendJoins.push('JOIN employees e ON p.employeeId = e.id');
        trendWheres.push('e.designation = ?');
        trendParams.push(role);
      } else if (type === 'Teacher') {
        trendJoins.push('JOIN teachers t ON p.employeeId = t.id');
        trendWheres.push('t.role = ?');
        trendParams.push(role);
      }
    }
    
    if (trendJoins.length > 0) {
      trendQuery += ' ' + trendJoins.join(' ');
    }
    if (trendWheres.length > 0) {
      trendQuery += ' WHERE ' + trendWheres.join(' AND ');
    }
    trendQuery += ' GROUP BY p.year, p.month ORDER BY p.year DESC, p.month DESC LIMIT 6';
    const trendRows = await sqlDb.query(trendQuery, trendParams);
    
    // Department costs
    let deptCostsQuery = '';
    let deptCostsParams = [];
    if (type === 'Teacher') {
      deptCostsQuery = `
        SELECT department as dept, SUM(netSalary) as totalCost 
        FROM teachers t JOIN salary_masters m ON t.id = m.employeeId 
        WHERE m.status = 'Active' AND department IS NOT NULL AND department != '' 
        ${role && role !== 'All' ? 'AND t.role = ?' : ''}
        GROUP BY department`;
      if (role && role !== 'All') deptCostsParams.push(role);
    } else if (type === 'Staff') {
      deptCostsQuery = `
        SELECT department as dept, SUM(netSalary) as totalCost 
        FROM staff s JOIN salary_masters m ON s.id = m.employeeId 
        WHERE m.status = 'Active' AND department IS NOT NULL AND department != '' 
        ${role && role !== 'All' ? 'AND s.role = ?' : ''}
        GROUP BY department`;
      if (role && role !== 'All') deptCostsParams.push(role);
    } else if (type === 'Employee') {
      deptCostsQuery = `
        SELECT department as dept, SUM(netSalary) as totalCost 
        FROM employees e JOIN salary_masters m ON e.id = m.employeeId 
        WHERE m.status = 'Active' AND department IS NOT NULL AND department != '' 
        ${role && role !== 'All' ? 'AND e.designation = ?' : ''}
        GROUP BY department`;
      if (role && role !== 'All') deptCostsParams.push(role);
    } else {
      deptCostsQuery = `
        SELECT dept, SUM(netSalary) as totalCost FROM (
          SELECT department as dept, netSalary FROM teachers t JOIN salary_masters m ON t.id = m.employeeId WHERE m.status = 'Active'
          UNION ALL
          SELECT department as dept, netSalary FROM staff s JOIN salary_masters m ON s.id = m.employeeId WHERE m.status = 'Active'
          UNION ALL
          SELECT department as dept, netSalary FROM employees e JOIN salary_masters m ON e.id = m.employeeId WHERE m.status = 'Active'
        ) combined 
        WHERE dept IS NOT NULL AND dept != ''
        GROUP BY dept`;
    }
    const deptCosts = await sqlDb.query(deptCostsQuery, deptCostsParams);
    
    // Distribution
    let distQuery = `
      SELECT 
        SUM(CASE WHEN m.netSalary < 20000 THEN 1 ELSE 0 END) as low,
        SUM(CASE WHEN m.netSalary >= 20000 AND m.netSalary < 50000 THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN m.netSalary >= 50000 THEN 1 ELSE 0 END) as high
      FROM salary_masters m`;
    let distParams = [];
    const distJoins = [];
    const distWheres = ["m.status = 'Active'"];
    
    if (type) {
      distWheres.push('m.employeeType = ?');
      distParams.push(type);
    }
    if (role && role !== 'All') {
      if (type === 'Staff') {
        distJoins.push('JOIN staff s ON m.employeeId = s.id');
        distWheres.push('s.role = ?');
        distParams.push(role);
      } else if (type === 'Employee') {
        distJoins.push('JOIN employees e ON m.employeeId = e.id');
        distWheres.push('e.designation = ?');
        distParams.push(role);
      } else if (type === 'Teacher') {
        distJoins.push('JOIN teachers t ON m.employeeId = t.id');
        distWheres.push('t.role = ?');
        distParams.push(role);
      }
    }
    
    if (distJoins.length > 0) {
      distQuery += ' ' + distJoins.join(' ');
    }
    distQuery += ' WHERE ' + distWheres.join(' AND ');
    const distribution = await sqlDb.query(distQuery, distParams);
    
    // Status
    let payStatusQuery = 'SELECT p.status, COUNT(*) as count FROM salary_payments p';
    let payStatusParams = [targetMonth, targetYear];
    const psJoins = [];
    const psWheres = ['p.month = ?', 'p.year = ?'];
    
    if (type) {
      psWheres.push('p.employeeType = ?');
      payStatusParams.push(type);
    }
    if (role && role !== 'All') {
      if (type === 'Staff') {
        psJoins.push('JOIN staff s ON p.employeeId = s.id');
        psWheres.push('s.role = ?');
        payStatusParams.push(role);
      } else if (type === 'Employee') {
        psJoins.push('JOIN employees e ON p.employeeId = e.id');
        psWheres.push('e.designation = ?');
        payStatusParams.push(role);
      } else if (type === 'Teacher') {
        psJoins.push('JOIN teachers t ON p.employeeId = t.id');
        psWheres.push('t.role = ?');
        payStatusParams.push(role);
      }
    }
    
    if (psJoins.length > 0) {
      payStatusQuery += ' ' + psJoins.join(' ');
    }
    payStatusQuery += ' WHERE ' + psWheres.join(' AND ');
    payStatusQuery += ' GROUP BY p.status';
    const payStatus = await sqlDb.query(payStatusQuery, payStatusParams);
    
    res.json({
      summary: {
        totalTeachers: teachersCount,
        totalStaff: staffCount,
        totalEmployees: employeesCount,
        monthlyPayrollCost,
        paidEmployees: paidEmployeesCount,
        pendingEmployees: pendingEmployeesCount,
        upcomingPayments
      },
      charts: {
        trend: (trendRows || []).reverse(),
        departmentWise: deptCosts || [],
        distribution: (distribution && distribution[0]) || { low: 0, medium: 0, high: 0 },
        paymentStatus: payStatus || []
      }
    });
  } catch (error) {
    console.error('[Payroll Dashboard Error] Failed to fetch stats:', {
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'unknown',
      query: req.query,
      errorMessage: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to fetch dashboard stats: ' + error.message
    });
  }
});

export default router;
