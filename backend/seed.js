import { seedGreenValley } from './seedGreenValley.js';
import * as sqlDb from './utils/sqlDb.js';

seedGreenValley()
  .then(async () => {
    await sqlDb.closeAllPools();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Seed error:', err);
    await sqlDb.closeAllPools();
    process.exit(1);
  });
