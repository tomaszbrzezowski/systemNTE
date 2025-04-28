import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'router-vendor': ['react-router-dom'],
          'icons-vendor': ['lucide-react']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: []
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    }
  }
});