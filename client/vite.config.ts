import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        /^node:.*/, 
        /node_modules/,
        /@radix-ui\/.*/,
        'drizzle-zod'
      ]
    }
  }
});
