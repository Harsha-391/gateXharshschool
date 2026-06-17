import mysql from 'mysql2/promise';

const config = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'uttam@2004',
  database: 'school_management'
};

const schoolId = 'SCH-1780999230097';
const subdomain = 'explicabo23435';

async function run() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Connected to MySQL database successfully.');

    // 1. Find all tables in school_management
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [config.database]);

    console.log(`Found ${tables.length} tables. Cleaning up references to tenant '${subdomain}' and school ID '${schoolId}'...`);

    // 2. Delete rows matching tenantId or schoolId in each table
    for (const tableObj of tables) {
      const tableName = tableObj.TABLE_NAME;
      
      // Get column names for this table
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      `, [config.database, tableName]);

      const columnNames = columns.map(c => c.COLUMN_NAME);

      if (columnNames.includes('tenantId')) {
        const [res] = await connection.query(`DELETE FROM \`${tableName}\` WHERE tenantId = ?`, [subdomain]);
        if (res.affectedRows > 0) {
          console.log(`Deleted ${res.affectedRows} rows from table '${tableName}' where tenantId = '${subdomain}'`);
        }
      }

      if (columnNames.includes('schoolId')) {
        const [res] = await connection.query(`DELETE FROM \`${tableName}\` WHERE schoolId = ?`, [schoolId]);
        if (res.affectedRows > 0) {
          console.log(`Deleted ${res.affectedRows} rows from table '${tableName}' where schoolId = '${schoolId}'`);
        }
      }
    }

    // 3. Specifically delete the school entry from schools table if it wasn't matched above
    const [schoolDelRes] = await connection.query(`DELETE FROM schools WHERE id = ? OR subdomain = ?`, [schoolId, subdomain]);
    if (schoolDelRes.affectedRows > 0) {
      console.log(`Deleted school matching ID/subdomain from 'schools' table. Affected rows: ${schoolDelRes.affectedRows}`);
    }

    // 4. Delete the activity entry from activities table matching ID ACT-1780999230097
    const [activityDelRes] = await connection.query(`DELETE FROM activities WHERE id = ?`, ['ACT-1780999230097']);
    if (activityDelRes.affectedRows > 0) {
      console.log(`Deleted activity matching ID from 'activities' table. Affected rows: ${activityDelRes.affectedRows}`);
    }

    console.log('Cleanup completed successfully.');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
