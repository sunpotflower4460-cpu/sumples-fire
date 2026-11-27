import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../build/plus-guide',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Keep the shared comparison film and downloadable sheet at their published URLs.
        assetFileNames: (asset) => asset.names.some((name) => name.endsWith('.mp4') || name === 'flame-sheet.webp')
          ? 'assets/[name][extname]'
          : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
