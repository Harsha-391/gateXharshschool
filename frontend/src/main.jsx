import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Intercept and redirect all relative /api and /uploads fetch requests to VITE_API_URL in production
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

  const baseUrl = import.meta.env.VITE_API_URL || '';
  if (baseUrl) {
    if (url.startsWith('/api') || url.startsWith('/uploads')) {
      const target = `${baseUrl}${url}`;
      if (input instanceof Request) {
        return originalFetch(new Request(target, input), init);
      }
      return originalFetch(target, init);
    }
    const currentOrigin = window.location.origin;
    if (url.startsWith(currentOrigin)) {
      const relativePath = url.substring(currentOrigin.length);
      if (relativePath.startsWith('/api') || relativePath.startsWith('/uploads')) {
        const target = `${baseUrl}${relativePath}`;
        if (input instanceof Request) {
          return originalFetch(new Request(target, input), init);
        }
        return originalFetch(target, init);
      }
    }
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
