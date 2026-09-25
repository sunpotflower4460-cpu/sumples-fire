import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

import { cloudflare } from "@cloudflare/vite-plugin";

// `--mode capacitor` builds the bundle shipped inside the iOS app. The
// Cloudflare plugin only matters for web deploys and would otherwise copy
// wrangler.json / .assetsignore (with local absolute paths) into the app.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'capacitor' ? [react()] : [react(), cloudflare()],
  test: {
    // Playwright owns e2e/; Vitest would otherwise try to run those specs.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
}));
