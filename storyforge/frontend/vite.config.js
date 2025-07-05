import { defineConfig, createLogger } from 'vite';
import react from '@vitejs/plugin-react';

// Create a custom logger for proxy events
const logger = createLogger();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  customLogger: logger,
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            logger.error(`Proxy error: ${err.message}`);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            logger.info(`Proxying: ${req.method} ${req.url}`);
          });
        },
      },
    },
  },
}); 