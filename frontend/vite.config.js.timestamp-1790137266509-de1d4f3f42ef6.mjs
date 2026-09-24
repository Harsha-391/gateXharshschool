// vite.config.js
import { defineConfig } from "file:///E:/data/App/school/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///E:/data/App/school/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
process.on("uncaughtException", (err) => {
  if (err?.code === "ECONNRESET" || err?.code === "EPIPE" || err?.code === "ETIMEDOUT" || err?.message?.includes("ECONNRESET")) {
    return;
  }
  console.error("Uncaught Exception:", err);
});
var vite_config_default = defineConfig({
  plugins: [
    react({
      babel: {
        compact: false
      }
    }),
    {
      name: "handle-client-socket-errors",
      configureServer(server) {
        server.httpServer?.on("clientError", (err, socket) => {
          if (err?.code === "ECONNRESET" || !socket.writable) {
            return;
          }
          socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
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
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err, _req, _res) => {
          });
        }
      },
      "/uploads": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err, _req, _res) => {
          });
        }
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            if (id.includes("lucide-react")) {
              return "vendor-lucide";
            }
            return "vendor-others";
          }
        }
      }
    },
    chunkSizeWarningLimit: 1200,
    minify: "esbuild",
    sourcemap: false
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxkYXRhXFxcXEFwcFxcXFxzY2hvb2xcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXGRhdGFcXFxcQXBwXFxcXHNjaG9vbFxcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovZGF0YS9BcHAvc2Nob29sL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5cclxuLy8gUHJldmVudCBOb2RlIDIyIFdpbmRvd3MgY2xpZW50IGRpc2Nvbm5lY3Rpb24gRUNPTk5SRVNFVCBjcmFzaGVzXHJcbnByb2Nlc3Mub24oJ3VuY2F1Z2h0RXhjZXB0aW9uJywgKGVycikgPT4ge1xyXG4gIGlmIChlcnI/LmNvZGUgPT09ICdFQ09OTlJFU0VUJyB8fCBlcnI/LmNvZGUgPT09ICdFUElQRScgfHwgZXJyPy5jb2RlID09PSAnRVRJTUVET1VUJyB8fCBlcnI/Lm1lc3NhZ2U/LmluY2x1ZGVzKCdFQ09OTlJFU0VUJykpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc29sZS5lcnJvcignVW5jYXVnaHQgRXhjZXB0aW9uOicsIGVycik7XHJcbn0pO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3Qoe1xyXG4gICAgICBiYWJlbDoge1xyXG4gICAgICAgIGNvbXBhY3Q6IGZhbHNlXHJcbiAgICAgIH1cclxuICAgIH0pLFxyXG4gICAge1xyXG4gICAgICBuYW1lOiAnaGFuZGxlLWNsaWVudC1zb2NrZXQtZXJyb3JzJyxcclxuICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xyXG4gICAgICAgIHNlcnZlci5odHRwU2VydmVyPy5vbignY2xpZW50RXJyb3InLCAoZXJyLCBzb2NrZXQpID0+IHtcclxuICAgICAgICAgIGlmIChlcnI/LmNvZGUgPT09ICdFQ09OTlJFU0VUJyB8fCAhc29ja2V0LndyaXRhYmxlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHNvY2tldC5lbmQoJ0hUVFAvMS4xIDQwMCBCYWQgUmVxdWVzdFxcclxcblxcclxcbicpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgXSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IHRydWUsXHJcbiAgICBwb3J0OiA1MTczLFxyXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxyXG4gICAgY29yczogdHJ1ZSxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6NTAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgY29uZmlndXJlOiAocHJveHkpID0+IHtcclxuICAgICAgICAgIHByb3h5Lm9uKCdlcnJvcicsIChlcnIsIF9yZXEsIF9yZXMpID0+IHtcclxuICAgICAgICAgICAgLy8gU2lsZW50bHkgaGFuZGxlIHNvY2tldCByZXNldHMgd2l0aG91dCBjcmFzaGluZyBWaXRlXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgICcvdXBsb2Fkcyc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjUwMDAnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5KSA9PiB7XHJcbiAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyLCBfcmVxLCBfcmVzKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFNpbGVudGx5IGhhbmRsZSBzb2NrZXQgcmVzZXRzIHdpdGhvdXQgY3Jhc2hpbmcgVml0ZVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3MoaWQpIHtcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXJlYWN0JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2x1Y2lkZS1yZWFjdCcpKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItbHVjaWRlJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1vdGhlcnMnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTIwMCxcclxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxyXG4gICAgc291cmNlbWFwOiBmYWxzZVxyXG4gIH1cclxufSlcclxuXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlEsU0FBUyxvQkFBb0I7QUFDMVMsT0FBTyxXQUFXO0FBR2xCLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxRQUFRO0FBQ3ZDLE1BQUksS0FBSyxTQUFTLGdCQUFnQixLQUFLLFNBQVMsV0FBVyxLQUFLLFNBQVMsZUFBZSxLQUFLLFNBQVMsU0FBUyxZQUFZLEdBQUc7QUFDNUg7QUFBQSxFQUNGO0FBQ0EsVUFBUSxNQUFNLHVCQUF1QixHQUFHO0FBQzFDLENBQUM7QUFHRCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsTUFDSixPQUFPO0FBQUEsUUFDTCxTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0Q7QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLGdCQUFnQixRQUFRO0FBQ3RCLGVBQU8sWUFBWSxHQUFHLGVBQWUsQ0FBQyxLQUFLLFdBQVc7QUFDcEQsY0FBSSxLQUFLLFNBQVMsZ0JBQWdCLENBQUMsT0FBTyxVQUFVO0FBQ2xEO0FBQUEsVUFDRjtBQUNBLGlCQUFPLElBQUksa0NBQWtDO0FBQUEsUUFDL0MsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLElBQ2QsTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsV0FBVyxDQUFDLFVBQVU7QUFDcEIsZ0JBQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxNQUFNLFNBQVM7QUFBQSxVQUV2QyxDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNWLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLFdBQVcsQ0FBQyxVQUFVO0FBQ3BCLGdCQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssTUFBTSxTQUFTO0FBQUEsVUFFdkMsQ0FBQztBQUFBLFFBQ0g7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGFBQWEsSUFBSTtBQUNmLGNBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQixnQkFBSSxHQUFHLFNBQVMsT0FBTyxLQUFLLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDcEQscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQixxQkFBTztBQUFBLFlBQ1Q7QUFDQSxtQkFBTztBQUFBLFVBQ1Q7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLHVCQUF1QjtBQUFBLElBQ3ZCLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxFQUNiO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
