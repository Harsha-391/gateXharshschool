import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// Auth Session tab isolation: redirect authentication keys from localStorage to sessionStorage
const SESSION_KEYS = [
  'token',
  'role',
  'portal_role',
  'username',
  'name',
  'permissions',
  'overrides',
  'dev_token',
  'from_dev_admin'
];

const originalGetItem = localStorage.getItem.bind(localStorage);
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

localStorage.getItem = function(key) {
  if (SESSION_KEYS.includes(key)) {
    return sessionStorage.getItem(key);
  }
  return originalGetItem(key);
};

localStorage.setItem = function(key, value) {
  if (SESSION_KEYS.includes(key)) {
    return sessionStorage.setItem(key, value);
  }
  return originalSetItem(key, value);
};

localStorage.removeItem = function(key) {
  if (SESSION_KEYS.includes(key)) {
    return sessionStorage.removeItem(key);
  }
  return originalRemoveItem(key);
};

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
