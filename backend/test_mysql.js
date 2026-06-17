import mysql from 'mysql2/promise';

const config = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'uttam@2004',
  database: 'school_management'
};

async function test() {
  try {
    const pool = mysql.createPool(config);
    const conn = await pool.getConnection();
    console.log("SQL Connected successfully!");
    
    const [schools] = await pool.execute("SELECT * FROM schools");
    console.log("Schools count:", schools.length);
    console.log("Schools subdomains:", schools.map(s => s.subdomain));
    
    const [timetables] = await pool.execute("SELECT * FROM timetables WHERE tenantId = ?", ['greenvalley']);
    console.log("Timetables count for greenvalley:", timetables.length);
    console.log("Timetables:", JSON.stringify(timetables, null, 2));
    
    conn.release();
    await pool.end();
  } catch (err) {
    console.error("Error connecting or querying:", err);
  }
}

test();
