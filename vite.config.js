import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/jetLagSpreadsheet/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
});
