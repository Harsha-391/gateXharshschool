import express from 'express';
import {
  getAccountManagementOverview,
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  getFees,
  collectFee,
  getSalaryStructures,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
  getPayroll,
  processPayroll,
  getStaffSalaryStructures,
  createStaffSalaryStructure,
  updateStaffSalaryStructure,
  deleteStaffSalaryStructure,
  getStaffPayments,
  processStaffPayment,
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getIncome,
  addIncome,
  getExpenseHistory
} from '../controllers/accountManagementController.js';

const router = express.Router();

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

// Salary structures
router.get('/salary-structures', getSalaryStructures);
router.post('/salary-structures', createSalaryStructure);
router.put('/salary-structures/:id', updateSalaryStructure);
router.delete('/salary-structures/:id', deleteSalaryStructure);

// Payroll
router.get('/payroll', getPayroll);
router.post('/payroll', processPayroll);

// Staff Salary Structures
  router.get('/staff-salary-structures', getStaffSalaryStructures);
  router.post('/staff-salary-structures', createStaffSalaryStructure);
  router.put('/staff-salary-structures/:id', updateStaffSalaryStructure);
  router.delete('/staff-salary-structures/:id', deleteStaffSalaryStructure);

  // Staff Payments
router.get('/staff-payments', getStaffPayments);
router.post('/staff-payments', processStaffPayment);

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

export default router;
