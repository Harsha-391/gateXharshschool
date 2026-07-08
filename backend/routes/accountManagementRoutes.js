import express from 'express';
import { auth } from '../middleware/auth.js';
import { restoreTenantContext } from '../utils/db.js';
import {
  getAccountManagementOverview,
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  getFees,
  collectFee,
  updateFee,
  deleteFee,
  getSalaryStructures,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
  getPayroll,
  processPayroll,
  deletePayroll,
  getStaffSalaryStructures,
  createStaffSalaryStructure,
  updateStaffSalaryStructure,
  deleteStaffSalaryStructure,
  getStaffPayments,
  processStaffPayment,
  deleteStaffPayment,
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getIncome,
  addIncome,
  getExpenseHistory,
  getFeePeriods,
  createFeePeriod,
  deleteFeePeriod
} from '../controllers/accountManagementController.js';

const router = express.Router();

// Apply auth and tenant context restore to all endpoints
router.use(auth);
router.use(restoreTenantContext);

import { checkPermission } from '../middleware/permissionMiddleware.js';

const getPermissionParams = (req) => {
  const path = req.path;
  const method = req.method;
  
  const methodActionMap = {
    'GET': 'view',
    'POST': 'create',
    'PUT': 'edit',
    'PATCH': 'edit',
    'DELETE': 'delete'
  };
  const action = methodActionMap[method] || 'view';

  if (path.startsWith('/fee-structures') || path.startsWith('/fee-periods')) {
    return { module: 'fee-structures', action };
  }
  if (path.startsWith('/fees')) {
    return { module: 'income', action };
  }
  if (path.startsWith('/salary-structures')) {
    return { module: 'teacher-pay-structure', action };
  }
  if (path.startsWith('/payroll')) {
    const isTeacher = req.query.type === 'Teacher' || (req.body && (req.body.employeeId?.startsWith('TCH-') || req.body.role === 'Teacher'));
    return { module: isTeacher ? 'teacher-payroll' : 'staff-payroll', action };
  }
  if (path.startsWith('/staff-salary-structures')) {
    const isEmployee = req.query.type === 'Employee' || (req.body && req.body.type === 'Employee');
    return { module: isEmployee ? 'employee-pay-structure' : 'staff-pay-structure', action };
  }
  if (path.startsWith('/staff-payments')) {
    return { module: 'employee-payroll', action };
  }
  if (path.startsWith('/expenses') || path.startsWith('/expense-history')) {
    return { module: 'expenses', action };
  }
  if (path.startsWith('/income')) {
    return { module: 'income', action };
  }
  if (path.startsWith('/overview')) {
    return { module: 'dashboard', action };
  }
  
  return null;
};

router.use((req, res, next) => {
  const params = getPermissionParams(req);
  if (!params) return next();
  return checkPermission(params.module, params.action)(req, res, next);
});

// Dashboard overview
router.get('/overview', getAccountManagementOverview);

// Fee structures
router.get('/fee-structures', getFeeStructures);
router.post('/fee-structures', createFeeStructure);
router.put('/fee-structures/:id', updateFeeStructure);
router.delete('/fee-structures/:id', deleteFeeStructure);

// Student fees (collections)
router.get('/fees', getFees);
router.post('/fees', collectFee);
router.put('/fees/:id', updateFee);
router.delete('/fees/:id', deleteFee);

// Salary structures
router.get('/salary-structures', getSalaryStructures);
router.post('/salary-structures', createSalaryStructure);
router.put('/salary-structures/:id', updateSalaryStructure);
router.delete('/salary-structures/:id', deleteSalaryStructure);

// Payroll
router.get('/payroll', getPayroll);
router.post('/payroll', processPayroll);
router.delete('/payroll/:id', deletePayroll);

// Staff Salary Structures
  router.get('/staff-salary-structures', getStaffSalaryStructures);
  router.post('/staff-salary-structures', createStaffSalaryStructure);
  router.put('/staff-salary-structures/:id', updateStaffSalaryStructure);
  router.delete('/staff-salary-structures/:id', deleteStaffSalaryStructure);

  // Staff Payments
router.get('/staff-payments', getStaffPayments);
router.post('/staff-payments', processStaffPayment);
router.delete('/staff-payments/:id', deleteStaffPayment);

// Expenses
router.get('/expenses', getExpenses);
router.post('/expenses', addExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

// Income
router.get('/income', getIncome);
router.post('/income', addIncome);

// Expense history snapshot logs
router.get('/expense-history', getExpenseHistory);

// Fee periods (custom month ranges)
router.get('/fee-periods', getFeePeriods);
router.post('/fee-periods', createFeePeriod);
router.delete('/fee-periods/:id', deleteFeePeriod);

export default router;
