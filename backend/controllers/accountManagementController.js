import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'db.json');
import { readDb as centralReadDb, writeDb as centralWriteDb, addActivity } from '../utils/db.js';

const DEFAULT_STAFF_SALARY_STRUCTURE_IDS = new Set([
  'SSSTR-ADMIN',
  'SSSTR-REG',
  'SSSTR-LIB',
  'SSSTR-IT',
  'SSSTR-SEC',
  'SSSTR-FAC'
]);
const DEFAULT_TEACHER_SALARY_STRUCTURE_IDS = new Set([
  'SSTR-PRIN',
  'SSTR-SRT',
  'SSTR-TCH',
  'SSTR-AST',
  'SSTR-RCP'
]);
const DEFAULT_TEACHER_DESIGNATIONS = new Set([
  'Principal',
  'Senior Teacher',
  'Teacher',
  'Assistant Teacher',
  'Receptionist'
]);

// Auto-seeding helper for mock finance records
const autoSeedAccountManagement = (db) => {
  // disabled mock seeding
};

const removeDefaultStaffSalaryStructures = (db) => {
  const initialCount = db.staffSalaryStructures?.length || 0;
  db.staffSalaryStructures = (db.staffSalaryStructures || []).filter(
    structure => !DEFAULT_STAFF_SALARY_STRUCTURE_IDS.has(structure.id)
  );

  return db.staffSalaryStructures.length !== initialCount;
};

const removeDefaultTeacherSalaryStructures = (db) => {
  const initialCount = db.salaryStructures?.length || 0;
  db.salaryStructures = (db.salaryStructures || []).filter(
    structure => !DEFAULT_TEACHER_SALARY_STRUCTURE_IDS.has(structure.id)
  );

  return db.salaryStructures.length !== initialCount;
};

// Helper to read database
const readDb = () => {
  const db = centralReadDb();
  // Ensure account management collections exist
  if (!db.feeStructures) db.feeStructures = [];
  if (!db.fees) db.fees = [];
  if (!db.salaryStructures) db.salaryStructures = [];
  if (!db.payroll) db.payroll = [];
  if (!db.staffSalaryStructures) db.staffSalaryStructures = [];
  if (!db.staffPayments) db.staffPayments = [];
  if (!db.expenses) db.expenses = [];
  if (!db.income) db.income = [];
  if (!db.expenseHistory) db.expenseHistory = [];

  const removedDefaultStaffStructures = removeDefaultStaffSalaryStructures(db);
  const removedDefaultTeacherStructures = removeDefaultTeacherSalaryStructures(db);
  const historyUpdated = syncExpenseHistory(db);

  if (removedDefaultStaffStructures || removedDefaultTeacherStructures || historyUpdated) {
    centralWriteDb(db);
  }

  return db;
};

// Helper to write database
const writeDb = (data) => {
  centralWriteDb(data);
};

// =============================================
// 1. ACCOUNT MANAGEMENT OVERVIEW / DASHBOARD TELEMETRY
// =============================================
export const getAccountManagementOverview = (req, res) => {
  try {
    const db = readDb();

    const totalFeeCollected = db.fees
      .reduce((sum, f) => sum + (f.paidAmount || 0), 0);

    const totalPendingFees = db.fees
      .filter(f => f.paymentStatus === 'Pending' || f.paymentStatus === 'Partial')
      .reduce((sum, f) => sum + (f.dueAmount || 0), 0);

    const totalExpenses = db.expenses
      .filter(e => !e.deleted)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalIncome = db.income
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    const totalPayrollPaid = db.payroll
      .filter(p => p.paymentStatus === 'Paid')
      .reduce((sum, p) => sum + (p.netSalary || 0), 0);

    const totalPayrollPending = db.payroll
      .filter(p => p.paymentStatus === 'Pending')
      .reduce((sum, p) => sum + (p.netSalary || 0), 0);

    const totalStaffPaymentsPaid = db.staffPayments
      .filter(p => p.paymentStatus === 'Paid')
      .reduce((sum, p) => sum + (p.netSalary || 0), 0);

    const netProfit = totalFeeCollected + totalIncome - totalExpenses;

    // Monthly breakdown for charts (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const monthFees = db.fees
        .filter(f => f.paymentDate?.startsWith(yearMonth))
        .reduce((sum, f) => sum + (f.paidAmount || 0), 0);

      const monthExpenses = db.expenses
        .filter(e => !e.deleted && e.date?.startsWith(yearMonth))
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      monthlyData.push({
        month: monthStr,
        fees: monthFees,
        expenses: monthExpenses,
        profit: monthFees - monthExpenses
      });
    }

    res.json({
      totalFeeCollected,
      totalPendingFees,
      totalExpenses,
      totalIncome,
      totalPayrollPaid,
      totalPayrollPending,
      netProfit,
      totalStudents: (db.students || []).filter(s => s.status === 'Active').length,
      totalTeachers: db.teachers?.length || 0,
      totalFeeRecords: db.fees?.length || 0,
      totalPayrollRecords: db.payroll?.length || 0,
      totalStaffPaymentsPaid,
      totalStaffPaymentsRecords: db.staffPayments?.length || 0,
      totalStaff: db.staff?.length || 0,
      monthlyData
    });
  } catch (err) {
    console.error('Error fetching account management overview:', err);
    res.status(500).json({ error: 'Server error loading account management overview.' });
  }
};

// =============================================
// 2. FEE STRUCTURES
// =============================================
export const getFeeStructures = (req, res) => {
  try {
    const db = readDb();
    res.json(db.feeStructures || []);
  } catch (err) {
    console.error('Error fetching fee structures:', err);
    res.status(500).json({ error: 'Server error loading fee structures.' });
  }
};

export const createFeeStructure = (req, res) => {
  try {
    const { studentClass, admissionFee, tuitionFee, examFee, transportFee, hostelFee, libraryFee, otherCharges } = req.body;

    if (!studentClass) {
      return res.status(400).json({ error: 'Student class is required.' });
    }

    const db = readDb();

    const admission = Number(admissionFee) || 0;
    const tuition = Number(tuitionFee) || 0;
    const exam = Number(examFee) || 0;
    const transport = Number(transportFee) || 0;
    const hostel = Number(hostelFee) || 0;
    const library = Number(libraryFee) || 0;
    const other = Number(otherCharges) || 0;
    const totalFee = admission + tuition + exam + transport + hostel + library + other;

    // Check if structure for this class already exists
    const existingIndex = db.feeStructures.findIndex(fs => fs.studentClass === studentClass);

    const structure = {
      id: existingIndex > -1 ? db.feeStructures[existingIndex].id : `FSTR-${studentClass}`,
      studentClass,
      admissionFee: admission,
      tuitionFee: tuition,
      examFee: exam,
      transportFee: transport,
      hostelFee: hostel,
      libraryFee: library,
      otherCharges: other,
      totalFee,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex > -1) {
      db.feeStructures[existingIndex] = structure;
    } else {
      db.feeStructures.push(structure);
    }

    addActivity(db, 'account_management', 'Fee Structure Updated', `Fee structure for Grade ${studentClass} set to ₹${totalFee.toLocaleString()}`, 'rgb(var(--color-success-rgb))', 'rgba(var(--color-success-rgb), 0.1)');
    writeDb(db);

    res.status(201).json(structure);
  } catch (err) {
    console.error('Error creating fee structure:', err);
    res.status(500).json({ error: 'Server error saving fee structure.' });
  }
};

export const deleteFeeStructure = (req, res) => {
  try {
    const db = readDb();
    const idx = db.feeStructures.findIndex(fs => fs.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Fee structure not found.' });

    const removed = db.feeStructures.splice(idx, 1)[0];
    addActivity(db, 'alert', 'Fee Structure Removed', `Removed fee structure for Grade ${removed.studentClass}`, 'rgb(var(--color-danger-rgb))', 'rgba(var(--color-danger-rgb), 0.1)');
    writeDb(db);

    res.json({ success: true, message: `Removed fee structure for ${removed.studentClass}` });
  } catch (err) {
    console.error('Error deleting fee structure:', err);
    res.status(500).json({ error: 'Server error deleting fee structure.' });
  }
};

// =============================================
// 3. STUDENT FEES (COLLECTIONS)
// =============================================
export const getFees = (req, res) => {
  try {
    const { studentClass, section, status, search } = req.query;
    const db = readDb();
    let fees = db.fees || [];

    if (studentClass && studentClass !== 'All') {
      fees = fees.filter(f => f.studentClass === studentClass);
    }
    if (section && section !== 'All') {
      fees = fees.filter(f => f.section === section);
    }
    if (status && status !== 'All') {
      fees = fees.filter(f => f.paymentStatus === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      fees = fees.filter(f =>
        f.studentName?.toLowerCase().includes(q) ||
        f.admissionNumber?.toLowerCase().includes(q) ||
        f.receiptNumber?.toLowerCase().includes(q)
      );
    }

    res.json(fees);
  } catch (err) {
    console.error('Error fetching fees:', err);
    res.status(500).json({ error: 'Server error loading fees.' });
  }
};

export const collectFee = (req, res) => {
  try {
    const { studentId, studentName, admissionNumber, studentClass, section, feeType, amount, discount, fine, paidAmount, paymentMethod, remarks } = req.body;

    if (!studentId || !feeType || !amount) {
      return res.status(400).json({ error: 'Student ID, fee type, and amount are required.' });
    }

    const db = readDb();

    const amt = Number(amount) || 0;
    const disc = Number(discount) || 0;
    const fn = Number(fine) || 0;
    const totalAmount = amt - disc + fn;
    const paid = (paidAmount !== undefined && paidAmount !== null && paidAmount !== '') ? Number(paidAmount) : totalAmount;
    const due = totalAmount - paid;

    const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const feeId = `FEE-${Date.now()}`;
    const newFee = {
      id: feeId,
      feeId,
      studentId,
      studentName: studentName || 'Unknown',
      admissionNumber: admissionNumber || '',
      studentClass: studentClass || '',
      section: section || '',
      feeType,
      amount: amt,
      discount: disc,
      fine: fn,
      totalAmount,
      paidAmount: paid,
      dueAmount: due,
      paymentStatus: due <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Pending'),
      paymentMethod: paymentMethod || 'Cash',
      transactionId: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
      receiptNumber,
      paymentDate: new Date().toISOString().split('T')[0],
      remarks: remarks || '',
      createdAt: new Date().toISOString()
    };

    db.fees.push(newFee);

    addActivity(db, 'account_management', 'Fee Collected', `₹${paid.toLocaleString()} collected from ${studentName} (${feeType})`, 'rgb(var(--color-success-rgb))', 'rgba(var(--color-success-rgb), 0.1)');
    writeDb(db);

    res.status(201).json(newFee);
  } catch (err) {
    console.error('Error collecting fee:', err);
    res.status(500).json({ error: 'Server error recording fee.' });
  }
};

export const updateFee = (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, studentName, admissionNumber, studentClass, section, feeType, amount, discount, fine, paidAmount, paymentMethod, remarks } = req.body;

    const db = readDb();
    const idx = db.fees.findIndex(f => (f.id === id || f.feeId === id));
    if (idx === -1) {
      return res.status(404).json({ error: 'Fee record not found.' });
    }

    const amt = Number(amount) || 0;
    const disc = Number(discount) || 0;
    const fn = Number(fine) || 0;
    const totalAmount = amt - disc + fn;
    const paid = (paidAmount !== undefined && paidAmount !== null && paidAmount !== '') ? Number(paidAmount) : totalAmount;
    const due = totalAmount - paid;

    db.fees[idx] = {
      ...db.fees[idx],
      studentId: studentId || db.fees[idx].studentId,
      studentName: studentName || db.fees[idx].studentName,
      admissionNumber: admissionNumber || db.fees[idx].admissionNumber,
      studentClass: studentClass || db.fees[idx].studentClass,
      section: section || db.fees[idx].section,
      feeType: feeType || db.fees[idx].feeType,
      amount: amt,
      discount: disc,
      fine: fn,
      totalAmount,
      paidAmount: paid,
      dueAmount: due,
      paymentStatus: due <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Pending'),
      paymentMethod: paymentMethod || db.fees[idx].paymentMethod,
      remarks: remarks || '',
      updatedAt: new Date().toISOString()
    };

    addActivity(db, 'account_management', 'Fee Collection Updated', `Fee record for ${db.fees[idx].studentName} updated`, 'rgb(var(--color-success-rgb))', 'rgba(var(--color-success-rgb), 0.1)');
    writeDb(db);

    res.json(db.fees[idx]);
  } catch (err) {
    console.error('Error updating fee:', err);
    res.status(500).json({ error: 'Server error updating fee.' });
  }
};

export const deleteFee = (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const idx = db.fees.findIndex(f => (f.id === id || f.feeId === id));
    if (idx === -1) {
      return res.status(404).json({ error: 'Fee record not found.' });
    }

    const removed = db.fees.splice(idx, 1)[0];
    addActivity(db, 'alert', 'Fee Record Deleted', `Deleted fee record of ${removed.studentName} for ${removed.feeType}`, 'rgb(var(--color-danger-rgb))', 'rgba(var(--color-danger-rgb), 0.1)');
    writeDb(db);

    res.json({ success: true, message: `Deleted fee record for ${removed.studentName}` });
  } catch (err) {
    console.error('Error deleting fee:', err);
    res.status(500).json({ error: 'Server error deleting fee.' });
  }
};

// =============================================
// 4. SALARY STRUCTURES
// =============================================
export const getSalaryStructures = (req, res) => {
  try {
    const db = readDb();
    res.json(db.salaryStructures || []);
  } catch (err) {
    res.status(500).json({ error: 'Server error loading salary structures.' });
  }
};

export const createSalaryStructure = (req, res) => {
  try {
    const { designation, basicSalary, allowances, deductions, pfDeduction, taxDeduction } = req.body;

    if (!designation || !basicSalary) {
      return res.status(400).json({ error: 'Designation and basic salary are required.' });
    }

    const db = readDb();
    const existingIdx = db.salaryStructures.findIndex(s => s.designation === designation);

    const structure = {
      id: existingIdx > -1 ? db.salaryStructures[existingIdx].id : `SSTR-${Date.now()}`,
      designation,
      basicSalary: Number(basicSalary) || 0,
      allowances: Number(allowances) || 0,
      deductions: Number(deductions) || 0,
      pfDeduction: Number(pfDeduction) || 0,
      taxDeduction: Number(taxDeduction) || 0,
      netSalary: (Number(basicSalary) || 0) + (Number(allowances) || 0) - (Number(deductions) || 0) - (Number(pfDeduction) || 0) - (Number(taxDeduction) || 0),
      updatedAt: new Date().toISOString()
    };

    if (existingIdx > -1) {
      db.salaryStructures[existingIdx] = structure;
    } else {
      db.salaryStructures.push(structure);
    }

    addActivity(db, 'account_management', 'Salary Structure Updated', `Structure for "${designation}" updated`, 'hsl(var(--color-info))', 'rgba(hsl(var(--color-info)), 0.1)');
    writeDb(db);

    res.status(201).json(structure);
  } catch (err) {
    res.status(500).json({ error: 'Server error saving salary structure.' });
  }
};

// =============================================
// 5. PAYROLL
// =============================================
export const getPayroll = (req, res) => {
  try {
    const { status, search, month } = req.query;
    const db = readDb();
    let payroll = db.payroll || [];

    if (status && status !== 'All') {
      payroll = payroll.filter(p => p.paymentStatus === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      payroll = payroll.filter(p =>
        p.teacherName?.toLowerCase().includes(q) ||
        p.employeeId?.toLowerCase().includes(q)
      );
    }
    if (month) {
      payroll = payroll.filter(p => p.paymentDate?.startsWith(month));
    }

    res.json(payroll);
  } catch (err) {
    res.status(500).json({ error: 'Server error loading payroll.' });
  }
};

export const processPayroll = (req, res) => {
  try {
    const { teacherId, teacherName, employeeId, designation, department, basicSalary, allowances, bonus, deductions, pfDeduction, taxDeduction, paymentMethod } = req.body;

    if (!teacherId || !teacherName || !basicSalary) {
      return res.status(400).json({ error: 'Teacher ID, name, and salary are required.' });
    }

    const db = readDb();

    const basic = Number(basicSalary) || 0;
    const allow = Number(allowances) || 0;
    const bon = Number(bonus) || 0;
    const ded = Number(deductions) || 0;
    const pf = Number(pfDeduction) || 0;
    const tax = Number(taxDeduction) || 0;
    const netSalary = basic + allow + bon - ded - pf - tax;

    const newPayroll = {
      payrollId: `PAY-${Date.now()}`,
      teacherId,
      teacherName,
      employeeId: employeeId || `EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      designation: designation || 'Teacher',
      department: department || 'General',
      basicSalary: basic,
      allowances: allow,
      bonus: bon,
      deductions: ded,
      pfDeduction: pf,
      taxDeduction: tax,
      netSalary,
      paymentStatus: 'Paid',
      paymentDate: new Date().toLocaleDateString('en-CA'),
      paymentMethod: paymentMethod || 'Bank Transfer',
      createdAt: new Date().toISOString()
    };

    db.payroll.push(newPayroll);

    // Also log as expense
    const expId = `EXP-${Date.now()}`;
    db.expenses.push({
      id: expId,
      expenseId: expId,
      title: `Salary - ${teacherName}`,
      category: 'Salary',
      subcategory: 'Teacher Salary',
      amount: netSalary,
      description: `Monthly salary payout for ${teacherName} (${designation})`,
      date: new Date().toLocaleDateString('en-CA'),
      paidBy: 'Accountant',
      attachment: '',
      grade: '',
      department: department || 'Academic',
      expenseType: 'Personnel'
    });

    addActivity(db, 'account_management', 'Salary Processed', `₹${netSalary.toLocaleString()} paid to ${teacherName}`, 'rgb(var(--color-success-rgb))', 'rgba(var(--color-success-rgb), 0.1)');
    writeDb(db);

    res.status(201).json(newPayroll);
  } catch (err) {
    res.status(500).json({ error: 'Server error processing payroll.' });
  }
};

// =============================================
// 6. STAFF SALARY STRUCTURES
// =============================================
export const getStaffSalaryStructures = (req, res) => {
  try {
    const db = readDb();
    res.json(db.staffSalaryStructures || []);
  } catch (err) {
    res.status(500).json({ error: 'Server error loading staff salary structures.' });
  }
};

export const createStaffSalaryStructure = (req, res) => {
  try {
    const { designation, designationLevel, employmentType, basicSalary, allowances, bonus, deductions, pfDeduction, taxDeduction } = req.body;

    if (!designation || !basicSalary) {
      return res.status(400).json({ error: 'Designation and basic salary are required.' });
    }

    const db = readDb();
    const existingIdx = db.staffSalaryStructures.findIndex(s => 
      s.designation === designation &&
      (s.designationLevel || '') === (designationLevel || '') &&
      (s.employmentType || '') === (employmentType || '')
    );

    const structure = {
      id: existingIdx > -1 ? db.staffSalaryStructures[existingIdx].id : `SSSTR-${Date.now()}`,
      designation,
      designationLevel: designationLevel || '',
      employmentType: employmentType || '',
      basicSalary: Number(basicSalary) || 0,
      allowances: Number(allowances) || 0,
      bonus: Number(bonus) || 0,
      deductions: Number(deductions) || 0,
      pfDeduction: Number(pfDeduction) || 0,
      taxDeduction: Number(taxDeduction) || 0,
      netSalary: (Number(basicSalary) || 0) + (Number(allowances) || 0) + (Number(bonus) || 0) - (Number(deductions) || 0) - (Number(pfDeduction) || 0) - (Number(taxDeduction) || 0),
      updatedAt: new Date().toISOString()
    };

    if (existingIdx > -1) {
      db.staffSalaryStructures[existingIdx] = structure;
    } else {
      db.staffSalaryStructures.push(structure);
    }

    const levelStr = designationLevel ? ` (${designationLevel})` : '';
    const typeStr = employmentType ? ` [${employmentType}]` : '';
    addActivity(db, 'account_management', 'Staff Salary Structure Updated', `Structure for "${designation}${levelStr}${typeStr}" updated`, 'hsl(var(--color-info))', 'rgba(hsl(var(--color-info)), 0.1)');
    writeDb(db);

    res.status(201).json(structure);
  } catch (err) {
    res.status(500).json({ error: 'Server error saving staff salary structure.' });
  }
};

// =============================================
// 7. STAFF PAYMENTS
// =============================================
export const getStaffPayments = (req, res) => {
  try {
    const { status, search, month } = req.query;
    const db = readDb();
    let payments = db.staffPayments || [];

    if (status && status !== 'All') {
      payments = payments.filter(p => p.paymentStatus === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      payments = payments.filter(p =>
        p.staffName?.toLowerCase().includes(q) ||
        p.staffRole?.toLowerCase().includes(q)
      );
    }
    if (month) {
      payments = payments.filter(p => p.paymentDate?.startsWith(month));
    }

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Server error loading staff payments.' });
  }
};

export const processStaffPayment = (req, res) => {
  try {
    const { staffId, staffName, staffRole, department, basicSalary, allowances, bonus, deductions, pfDeduction, taxDeduction, paymentMethod, designationLevel, employmentType } = req.body;

    if (!staffId || !staffName || !basicSalary) {
      return res.status(400).json({ error: 'Staff ID, name, and salary are required.' });
    }

    const db = readDb();

    const basic = Number(basicSalary) || 0;
    const allow = Number(allowances) || 0;
    const bon = Number(bonus) || 0;
    const ded = Number(deductions) || 0;
    const pf = Number(pfDeduction) || 0;
    const tax = Number(taxDeduction) || 0;
    const netSalary = basic + allow + bon - ded - pf - tax;

    const newPayment = {
      paymentId: `SPAY-${Date.now()}`,
      staffId,
      staffName,
      staffRole: staffRole || 'Staff',
      department: department || 'General',
      designationLevel: designationLevel || '',
      employmentType: employmentType || '',
      basicSalary: basic,
      allowances: allow,
      bonus: bon,
      deductions: ded,
      pfDeduction: pf,
      taxDeduction: tax,
      netSalary,
      paymentStatus: 'Paid',
      paymentDate: new Date().toLocaleDateString('en-CA'),
      paymentMethod: paymentMethod || 'Bank Transfer',
      createdAt: new Date().toISOString()
    };

    db.staffPayments.push(newPayment);

    // Also log as expense
    const expId = `EXP-${Date.now()}`;
    db.expenses.push({
      id: expId,
      expenseId: expId,
      title: `Salary - ${staffName}`,
      category: 'Salary',
      subcategory: 'Staff Salary',
      amount: netSalary,
      description: `Monthly salary payout for ${staffName} (${staffRole})`,
      date: new Date().toLocaleDateString('en-CA'),
      paidBy: 'Accountant',
      attachment: '',
      grade: '',
      department: department || 'Administration',
      expenseType: 'Personnel'
    });

    addActivity(db, 'account_management', 'Staff Salary Processed', `₹${netSalary.toLocaleString()} paid to ${staffName}`, 'rgb(var(--color-success-rgb))', 'rgba(var(--color-success-rgb), 0.1)');
    writeDb(db);

    res.status(201).json(newPayment);
  } catch (err) {
    res.status(500).json({ error: 'Server error processing staff payment.' });
  }
};

// =============================================
// 8. EXPENSES
// =============================================
export const getExpenses = (req, res) => {
  try {
    const { category, search } = req.query;
    const db = readDb();
    let expenses = (db.expenses || []).filter(e => !e.deleted);

    if (category && category !== 'All') {
      expenses = expenses.filter(e => e.category === category);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      expenses = expenses.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q)
      );
    }

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Server error loading expenses.' });
  }
};

export const addExpense = (req, res) => {
  try {
    const { 
      title, 
      category, 
      subcategory,
      amount, 
      description, 
      date, 
      paymentDate,
      paidBy, 
      vendor,
      paymentDetails,
      status,
      submittedBy,
      approvedBy,
      remarks,
      notes,
      attachment,
      grade,
      department,
      expenseType
    } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({ error: 'Title, category, and amount are required.' });
    }

    const db = readDb();
    const expId = `EXP-${Date.now()}`;

    const newExpense = {
      id: expId,
      expenseId: expId,
      title,
      category,
      subcategory: subcategory || '',
      amount: Number(amount) || 0,
      description: description || '',
      date: date || new Date().toISOString().split('T')[0],
      paymentDate: paymentDate || '',
      paidBy: paidBy || 'Accountant',
      vendor: vendor || { name: '', contact: '', email: '', address: '' },
      paymentDetails: paymentDetails || { method: 'Cash', transactionId: '', invoiceNumber: '' },
      status: 'Approved',
      submittedBy: submittedBy || 'Expense Management',
      approvedBy: approvedBy || 'System',
      remarks: remarks || '',
      notes: notes || '',
      attachment: attachment || '',
      grade: grade || '',
      department: department || '',
      expenseType: expenseType || 'Operational',
      createdAt: new Date().toISOString()
    };

    db.expenses.push(newExpense);

    addActivity(
      db, 
      'account_management', 
      'Expense Recorded', 
      `₹${Number(amount).toLocaleString()} for ${title} (${category})`, 
      'rgb(var(--color-success-rgb))', 
      'rgba(var(--color-success-rgb), 0.1)'
    );

    // Budget Limit Alert Check (Mock alert if amount exceeds 50000)
    if (Number(amount) >= 50000) {
      addActivity(
        db,
        'alert',
        'High Expense Alert',
        `High value expense submitted: ${title} (₹${Number(amount).toLocaleString()})`,
        'rgb(var(--color-danger-rgb))',
        'rgba(var(--color-danger-rgb), 0.1)'
      );
    }

    writeDb(db);

    res.status(201).json(newExpense);
  } catch (err) {
    console.error('Error adding expense:', err);
    res.status(500).json({ error: 'Server error adding expense.' });
  }
};

export const updateExpense = (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    
    const idx = db.expenses.findIndex(e => e.expenseId === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    const currentExpense = db.expenses[idx];
    const updatedExpense = {
      ...currentExpense,
      ...req.body,
      // Ensure ID doesn't change
      expenseId: currentExpense.expenseId,
      amount: req.body.amount !== undefined ? Number(req.body.amount) : currentExpense.amount
    };

    db.expenses[idx] = updatedExpense;

    addActivity(
      db,
      'account_management',
      'Expense Updated',
      `Expense details updated for "${updatedExpense.title}" (₹${Number(updatedExpense.amount || 0).toLocaleString()})`,
      'hsl(var(--color-info))',
      'rgba(hsl(var(--color-info)), 0.1)'
    );

    writeDb(db);
    res.json(updatedExpense);
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ error: 'Server error updating expense.', details: err.message });
  }
};

export const deleteExpense = (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();

    const idx = db.expenses.findIndex(e => e.expenseId === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    db.expenses[idx].deleted = true;
    db.expenses[idx].status = 'Deleted';
    const removed = db.expenses[idx];

    addActivity(
      db,
      'alert',
      'Expense Removed',
      `Deleted expense record: ${removed.title} (₹${removed.amount.toLocaleString()})`,
      'rgb(var(--color-danger-rgb))',
      'rgba(var(--color-danger-rgb), 0.1)'
    );

    writeDb(db);
    res.json({ success: true, message: `Removed expense: ${removed.title}` });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Server error deleting expense.' });
  }
};

// =============================================
// 7. INCOME
// =============================================
export const getIncome = (req, res) => {
  try {
    const { source, search } = req.query;
    const db = readDb();
    let income = db.income || [];

    if (source && source !== 'All') {
      income = income.filter(i => i.source === source);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      income = income.filter(i =>
        i.source?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q)
      );
    }

    res.json(income);
  } catch (err) {
    res.status(500).json({ error: 'Server error loading income.' });
  }
};

export const addIncome = (req, res) => {
  try {
    const { source, amount, description, date, receivedBy } = req.body;

    if (!source || !amount) {
      return res.status(400).json({ error: 'Source and amount are required.' });
    }

    const db = readDb();

    const newIncome = {
      incomeId: `INC-${Date.now()}`,
      source,
      amount: Number(amount) || 0,
      description: description || '',
      date: date || new Date().toISOString().split('T')[0],
      receivedBy: receivedBy || 'Accountant',
      createdAt: new Date().toISOString()
    };

    db.income.push(newIncome);

    addActivity(db, 'account_management', 'Income Recorded', `₹${Number(amount).toLocaleString()} from ${source}`, 'rgb(var(--color-success-rgb))', 'rgba(var(--color-success-rgb), 0.1)');
    writeDb(db);

    res.status(201).json(newIncome);
  } catch (err) {
    res.status(500).json({ error: 'Server error adding income.' });
  }
};

export const deleteSalaryStructure = (req, res) => {
  try {
    const db = readDb();
    const idx = db.salaryStructures.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Salary structure not found.' });

    const removed = db.salaryStructures.splice(idx, 1)[0];
    addActivity(db, 'alert', 'Salary Structure Removed', `Removed salary structure for ${removed.designation}`, 'rgb(var(--color-danger-rgb))', 'rgba(var(--color-danger-rgb), 0.1)');
    writeDb(db);

    res.json({ success: true, message: `Removed salary structure for ${removed.designation}` });
  } catch (err) {
    console.error('Error deleting salary structure:', err);
    res.status(500).json({ error: 'Server error deleting salary structure.' });
  }
};

export const deleteStaffSalaryStructure = (req, res) => {
  try {
    const db = readDb();
    const idx = db.staffSalaryStructures.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Staff salary structure not found.' });

    const removed = db.staffSalaryStructures.splice(idx, 1)[0];
    addActivity(db, 'alert', 'Staff Salary Structure Removed', `Removed staff salary structure for ${removed.designation}`, 'rgb(var(--color-danger-rgb))', 'rgba(var(--color-danger-rgb), 0.1)');
    writeDb(db);

    res.json({ success: true, message: `Removed staff salary structure for ${removed.designation}` });
  } catch (err) {
    console.error('Error deleting staff salary structure:', err);
    res.status(500).json({ error: 'Server error deleting staff salary structure.' });
  }
};

export const updateFeeStructure = (req, res) => {
  try {
    const { id } = req.params;
    const { studentClass, admissionFee, tuitionFee, examFee, transportFee, hostelFee, libraryFee, otherCharges } = req.body;
    const db = readDb();

    const idx = db.feeStructures.findIndex(fs => fs.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Fee structure not found.' });

    const admission = Number(admissionFee) || 0;
    const tuition = Number(tuitionFee) || 0;
    const exam = Number(examFee) || 0;
    const transport = Number(transportFee) || 0;
    const hostel = Number(hostelFee) || 0;
    const library = Number(libraryFee) || 0;
    const other = Number(otherCharges) || 0;
    const totalFee = admission + tuition + exam + transport + hostel + library + other;

    db.feeStructures[idx] = {
      ...db.feeStructures[idx],
      studentClass: studentClass || db.feeStructures[idx].studentClass,
      admissionFee: admission,
      tuitionFee: tuition,
      examFee: exam,
      transportFee: transport,
      hostelFee: hostel,
      libraryFee: library,
      otherCharges: other,
      totalFee,
      updatedAt: new Date().toISOString()
    };

    addActivity(db, 'account_management', 'Fee Structure Updated', `Fee structure for Grade ${db.feeStructures[idx].studentClass} updated to ₹${totalFee.toLocaleString()}`, 'rgb(var(--color-success-rgb))', 'rgba(var(--color-success-rgb), 0.1)');
    writeDb(db);

    res.json(db.feeStructures[idx]);
  } catch (err) {
    console.error('Error updating fee structure:', err);
    res.status(500).json({ error: 'Server error updating fee structure.' });
  }
};

export const updateSalaryStructure = (req, res) => {
  try {
    const { id } = req.params;
    const { designation, basicSalary, allowances, deductions, pfDeduction, taxDeduction } = req.body;
    const db = readDb();

    const idx = db.salaryStructures.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Salary structure not found.' });

    const basic = Number(basicSalary) || 0;
    const allow = Number(allowances) || 0;
    const deduct = Number(deductions) || 0;
    const pf = Number(pfDeduction) || 0;
    const tax = Number(taxDeduction) || 0;

    db.salaryStructures[idx] = {
      ...db.salaryStructures[idx],
      designation: designation || db.salaryStructures[idx].designation,
      basicSalary: basic,
      allowances: allow,
      deductions: deduct,
      pfDeduction: pf,
      taxDeduction: tax,
      netSalary: basic + allow - deduct - pf - tax,
      updatedAt: new Date().toISOString()
    };

    addActivity(db, 'account_management', 'Salary Structure Updated', `Salary structure for "${db.salaryStructures[idx].designation}" updated`, 'hsl(var(--color-info))', 'rgba(hsl(var(--color-info)), 0.1)');
    writeDb(db);

    res.json(db.salaryStructures[idx]);
  } catch (err) {
    console.error('Error updating salary structure:', err);
    res.status(500).json({ error: 'Server error updating salary structure.' });
  }
};

export const updateStaffSalaryStructure = (req, res) => {
  try {
    const { id } = req.params;
    const { designation, designationLevel, employmentType, basicSalary, allowances, bonus, deductions, pfDeduction, taxDeduction } = req.body;
    const db = readDb();

    const idx = db.staffSalaryStructures.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Staff salary structure not found.' });

    const basic = Number(basicSalary) || 0;
    const allow = Number(allowances) || 0;
    const bon = Number(bonus) || 0;
    const deduct = Number(deductions) || 0;
    const pf = Number(pfDeduction) || 0;
    const tax = Number(taxDeduction) || 0;

    db.staffSalaryStructures[idx] = {
      ...db.staffSalaryStructures[idx],
      designation: designation || db.staffSalaryStructures[idx].designation,
      designationLevel: designationLevel !== undefined ? designationLevel : db.staffSalaryStructures[idx].designationLevel,
      employmentType: employmentType !== undefined ? employmentType : db.staffSalaryStructures[idx].employmentType,
      basicSalary: basic,
      allowances: allow,
      bonus: bon,
      deductions: deduct,
      pfDeduction: pf,
      taxDeduction: tax,
      netSalary: basic + allow + bon - deduct - pf - tax,
      updatedAt: new Date().toISOString()
    };

    addActivity(db, 'account_management', 'Staff Salary Structure Updated', `Staff salary structure for "${db.staffSalaryStructures[idx].designation}" updated`, 'hsl(var(--color-info))', 'rgba(hsl(var(--color-info)), 0.1)');
    writeDb(db);

    res.json(db.staffSalaryStructures[idx]);
  } catch (err) {
    console.error('Error updating staff salary structure:', err);
    res.status(500).json({ error: 'Server error updating staff salary structure.' });
  }
};

// =============================================
// 9. EXPENSE SNAPSHOT HISTORY AUTO-SAVING
// =============================================
const syncExpenseHistory = (db) => {
  if (!db.expenseHistory) db.expenseHistory = [];
  if (!db.expenses) db.expenses = [];

  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  const currentMonthStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(today.getFullYear());

  let updated = false;

  // 1. Find all completed dates with expenses
  const expenseDates = [...new Set(db.expenses.map(e => e.date).filter(Boolean))];
  expenseDates.forEach(date => {
    if (date < todayStr) {
      const total = db.expenses
        .filter(e => !e.deleted && e.date === date)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const existingIdx = db.expenseHistory.findIndex(h => h.type === 'daily' && h.period === date);
      if (existingIdx === -1) {
        db.expenseHistory.push({
          id: `HST-DAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'daily',
          period: date,
          totalAmount: total,
          createdAt: new Date().toISOString()
        });
        updated = true;
      } else if (db.expenseHistory[existingIdx].totalAmount !== total) {
        db.expenseHistory[existingIdx].totalAmount = total;
        db.expenseHistory[existingIdx].updatedAt = new Date().toISOString();
        updated = true;
      }
    }
  });

  // 2. Find all completed months with expenses
  const expenseMonths = [...new Set(db.expenses.map(e => e.date?.substring(0, 7)).filter(Boolean))];
  expenseMonths.forEach(month => {
    if (month < currentMonthStr) {
      const total = db.expenses
        .filter(e => !e.deleted && e.date?.startsWith(month))
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const existingIdx = db.expenseHistory.findIndex(h => h.type === 'monthly' && h.period === month);
      if (existingIdx === -1) {
        db.expenseHistory.push({
          id: `HST-MTH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'monthly',
          period: month,
          totalAmount: total,
          createdAt: new Date().toISOString()
        });
        updated = true;
      } else if (db.expenseHistory[existingIdx].totalAmount !== total) {
        db.expenseHistory[existingIdx].totalAmount = total;
        db.expenseHistory[existingIdx].updatedAt = new Date().toISOString();
        updated = true;
      }
    }
  });

  // 3. Find all completed years with expenses
  const expenseYears = [...new Set(db.expenses.map(e => e.date?.substring(0, 4)).filter(Boolean))];
  expenseYears.forEach(year => {
    if (year < currentYearStr) {
      const total = db.expenses
        .filter(e => !e.deleted && e.date?.startsWith(year))
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const existingIdx = db.expenseHistory.findIndex(h => h.type === 'yearly' && h.period === year);
      if (existingIdx === -1) {
        db.expenseHistory.push({
          id: `HST-YR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'yearly',
          period: year,
          totalAmount: total,
          createdAt: new Date().toISOString()
        });
        updated = true;
      } else if (db.expenseHistory[existingIdx].totalAmount !== total) {
        db.expenseHistory[existingIdx].totalAmount = total;
        db.expenseHistory[existingIdx].updatedAt = new Date().toISOString();
        updated = true;
      }
    }
  });

  return updated;
};

export const getExpenseHistory = (req, res) => {
  try {
    const db = readDb();
    const updated = syncExpenseHistory(db);
    if (updated) {
      writeDb(db);
    }
    res.json(db.expenseHistory || []);
  } catch (err) {
    console.error('Error fetching expense history:', err);
    res.status(500).json({ error: 'Server error loading expense history.' });
  }
};
