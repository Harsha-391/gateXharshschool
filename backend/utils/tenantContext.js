import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage context manager to dynamically store and retrieve the active tenant/subdomain.
// This prevents circular imports between sqlDb.js and db.js.
export const tenantStorage = new AsyncLocalStorage();
