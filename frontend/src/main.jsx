import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


// Intercept, cache, deduplicate, and redirect all relative /api and /uploads fetch requests
const getCache = new Map();
const activeRequests = new Map();

const clearGetCache = () => {
  getCache.clear();
};

const originalFetch = window.fetch;
window.fetch = (input, init) => {
  let url = '';
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof Request) {
    url = input.url;
  } else if (input && typeof input.toString === 'function') {
    url = input.toString();
  }

  const method = (init && init.method) ? init.method.toUpperCase() : 'GET';
  
  const getTenantHeader = () => {
    if (init && init.headers) {
      if (init.headers['x-tenant-id']) return init.headers['x-tenant-id'];
      if (init.headers.get && typeof init.headers.get === 'function') {
        const val = init.headers.get('x-tenant-id');
        if (val) return val;
      }
    }
    if (input instanceof Request && input.headers) {
      const val = input.headers.get('x-tenant-id');
      if (val) return val;
    }
    return localStorage.getItem('tenant_subdomain') || '';
  };
  const tenantId = getTenantHeader();

  if (tenantId) {
    if (!init) init = {};
    if (!init.headers) {
      init.headers = {};
    }
    if (init.headers instanceof Headers) {
      if (!init.headers.has('x-tenant-id')) {
        init.headers.set('x-tenant-id', tenantId);
      }
    } else if (Array.isArray(init.headers)) {
      if (!init.headers.some(h => h[0].toLowerCase() === 'x-tenant-id')) {
        init.headers.push(['x-tenant-id', tenantId]);
      }
    } else {
      if (!init.headers['x-tenant-id']) {
        init.headers['x-tenant-id'] = tenantId;
      }
    }
  }

  const token = localStorage.getItem('token');
  if (token) {
    if (!init) init = {};
    if (!init.headers) {
      init.headers = {};
    }
    if (init.headers instanceof Headers) {
      if (!init.headers.has('Authorization') && !init.headers.has('authorization')) {
        init.headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(init.headers)) {
      if (!init.headers.some(h => h[0].toLowerCase() === 'authorization')) {
        init.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      if (!init.headers['Authorization'] && !init.headers['authorization']) {
        init.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  const baseUrl = import.meta.env.VITE_API_URL || '';
  let target = url;
  if (baseUrl) {
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    if (url.startsWith('/api') || url.startsWith('/uploads')) {
      target = `${cleanBaseUrl}${cleanUrl}`;
    } else {
      const currentOrigin = window.location.origin;
      if (url.startsWith(currentOrigin)) {
        const relativePath = url.substring(currentOrigin.length);
        const cleanRelativePath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
        if (relativePath.startsWith('/api') || relativePath.startsWith('/uploads')) {
          target = `${cleanBaseUrl}${cleanRelativePath}`;
        }
      }
    }
  }

  // Prevent double slashes in target URL (preserving protocol double slash)
  target = target.replace(/([^:]\/)\/+/g, "$1");

  const isApiGet = method === 'GET' && target.includes('/api/');

  if (!isApiGet) {
    if (method !== 'GET' && target.includes('/api/')) {
      clearGetCache();
    }
    if (target !== url) {
      if (input instanceof Request) {
        return originalFetch(new Request(target, input), init);
      }
      return originalFetch(target, init);
    }
    return originalFetch(input, init);
  }

  const cacheKey = `${target}::${tenantId || ''}`;
  const now = Date.now();

  if (getCache.has(cacheKey)) {
    const cached = getCache.get(cacheKey);
    if (now - cached.timestamp < 5000) {
      return Promise.resolve(cached.response.clone());
    } else {
      getCache.delete(cacheKey);
    }
  }

  if (activeRequests.has(cacheKey)) {
    return activeRequests.get(cacheKey).then(res => res.clone());
  }

  const fetchInput = (input instanceof Request && baseUrl && target !== url) ? new Request(target, input) : (target !== url ? target : input);

  const fetchPromise = originalFetch(fetchInput, init)
    .then(async (res) => {
      activeRequests.delete(cacheKey);
      if (res.ok) {
        getCache.set(cacheKey, {
          response: res.clone(),
          timestamp: Date.now()
        });
      }
      return res;
    })
    .catch((err) => {
      activeRequests.delete(cacheKey);
      throw err;
    });

  activeRequests.set(cacheKey, fetchPromise);
  return fetchPromise.then(res => res.clone());
};

// Intercept session and auth reads/writes to redirect to sessionStorage (enabling multi-tab multi-dashboard support)
const sessionKeys = new Set([
  'token',
  'refreshToken',
  'role',
  'portal_role',
  'permissions',
  'overrides',
  'username',
  'name',
  'email',
  'phone',
  'lastActive',
  'userType',
  'photo',
  'parent_photo',
  'admin_view',
  'school_name',
  'school_subdomain',
  'tenant_subdomain',
  'from_dev_admin',
  'dev_token',
  'active_session_id',
  'fee_filter_class',
  'fee_filter_dept',
  'fee_filter_section',
  'fee_transport_filter'
]);

const originalGetItem = localStorage.getItem.bind(localStorage);
localStorage.getItem = function(key) {
  if (sessionKeys.has(key)) {
    return sessionStorage.getItem(key);
  }
  return originalGetItem(key);
};

const originalSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
  if (sessionKeys.has(key)) {
    sessionStorage.setItem(key, value);
    return;
  }
  return originalSetItem(key, value);
};

const originalRemoveItem = localStorage.removeItem.bind(localStorage);
localStorage.removeItem = function(key) {
  if (sessionKeys.has(key)) {
    sessionStorage.removeItem(key);
    // Also clean from localStorage in case old legacy data was left over
    try { originalRemoveItem(key); } catch (e) {}
    return;
  }
  return originalRemoveItem(key);
};

const originalClear = localStorage.clear.bind(localStorage);
localStorage.clear = function() {
  sessionStorage.clear();
  return originalClear();
};

// Clean up any legacy auth keys mistakenly left in global localStorage so they don't leak across tabs
sessionKeys.forEach(k => {
  try {
    originalRemoveItem(k);
  } catch (e) {}
});

createRoot(document.getElementById('root')).render(
  <App />
)

