import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

const emptyDatabase = {
  students: [],
  teachers: [],
  staff: [],
  attendance: [],
  timetables: [],
  invoices: [],
  activities: [],
  feeStructures: [],
  fees: [],
  salaryStructures: [],
  payroll: [],
  staffSalaryStructures: [],
  staffPayments: [],
  expenses: [],
  income: [],
  school: {
    name: "Aether Academy",
    subdomain: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    ratePerStudent: "250.00",
    razorpayAccountId: "",
    adminName: "Rajesh Kumar",
    adminEmail: "admin@academy.edu",
    adminPassword: "admin123",
    principal: "Rajesh Kumar"
  }
};

const resetDatabase = () => {
  try {
    console.log('Resetting db.json to clean empty state...');
    fs.writeFileSync(DB_FILE, JSON.stringify(emptyDatabase, null, 2), 'utf8');
    console.log('✅ DATABASE SUCCESSFULLY RESET TO CLEAN EMPTY STATE!');
  } catch (err) {
    console.error('Error resetting database:', err);
  }
};

resetDatabase();
