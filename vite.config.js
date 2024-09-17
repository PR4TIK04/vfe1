import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';


export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Polyfill global for browser usage
      global: resolve('node_modules/global/')
    }
  },
  define: {
    'global': 'globalThis',  // Define globalThis as global in browser
  },
  build: {
    rollupOptions: {
      external: ['/src/main.jsx'],
    },
  },
});
