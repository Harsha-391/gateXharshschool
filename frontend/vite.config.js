import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Prevent Node 22 Windows client disconnection ECONNRESET crashes
process.on('uncaughtException', (err) => {
  if (err?.code === 'ECONNRESET' || err?.code === 'EPIPE' || err?.code === 'ETIMEDOUT' || err?.message?.includes('ECONNRESET')) {
    return;
  }
  console.error('Uncaught Exception:', err);
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        compact: false
      }
    }),
    {
      name: 'handle-client-socket-errors',
      configureServer(server) {
        server.httpServer?.on('clientError', (err, socket) => {
          if (err?.code === 'ECONNRESET' || !socket.writable) {
            return;
          }
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });
      }
    }
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, _res) => {
            // Silently handle socket resets without crashing Vite
          });
        }
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, _res) => {
            // Silently handle socket resets without crashing Vite
          });
        }
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            return 'vendor-others';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1200,
    minify: 'esbuild',
    sourcemap: false
  }
})

