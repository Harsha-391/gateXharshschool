import { query } from '../utils/sqlDb.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TENANTS_DIR = path.join(__dirname, '..', 'tenants');

async function run() {
  try {
    console.log('1. Cleaving SQL expenses table...');
    const result = await query('DELETE FROM expenses');
    console.log('SQL expenses cleared successfully:', result);

    console.log('2. Cleaving SQL activities related to expenses...');
    const resultAct = await query("DELETE FROM activities WHERE type = 'account_management' AND (title LIKE '%Expense%' OR desc LIKE '%Expense%')");
    console.log('SQL expense activities cleared successfully:', resultAct);

    console.log('3. Updating JSON tenant backups...');
    const tenantFiles = ['db_default.json', 'db_greenvalley.json'];
    for (const file of tenantFiles) {
      const filePath = path.join(TENANTS_DIR, file);
      if (fs.existsSync(filePath)) {
        console.log(`Processing file: ${file}`);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        data.expenses = [];
        data.expenseHistory = [];
        // Also clean up any activities list
        if (data.activities) {
          data.activities = data.activities.filter(act => 
            !(act.type === 'account_management' && 
             (act.title?.includes('Expense') || act.desc?.includes('Expense') || act.description?.includes('Expense')))
          );
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Reset expenses & history in: ${file}`);
      }
    }
    
    console.log('Database cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during database cleanup:', error);
    process.exit(1);
  }
}

run();
