import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5181,
    host: true,
    proxy: {
      '/api': {
        target: process.env.API_PROXY || 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
});
