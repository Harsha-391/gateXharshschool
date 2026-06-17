import mysql from 'mysql2/promise';

const config = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'uttam@2004',
  database: 'school_management'
};

async function check() {
  try {
    const pool = mysql.createPool(config);
    const [teachers] = await pool.execute("SELECT id, name FROM teachers WHERE tenantId = ?", ['greenvalley']);
    console.log("Teachers in SQL DB:", teachers);
    
    const [staff] = await pool.execute("SELECT id, name FROM staff WHERE tenantId = ?", ['greenvalley']);
    console.log("Staff in SQL DB:", staff);
    
    const [qrs] = await pool.execute("SELECT * FROM employee_qr_codes WHERE tenantId = ?", ['greenvalley']);
    console.log("QRs in SQL DB:", qrs);
    
    await pool.end();
  } catch (err) {
    console.error("Error checking SQL database:", err);
  }
}

check();
