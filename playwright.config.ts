import { defineConfig, devices } from '@playwright/test';

// Release smoke tests. They drive the same bundle that ships inside the iOS
// app (`vite build --mode capacitor`) in WebKit, the engine behind WKWebView.
//
// The one difference: this build sets VITE_PLUS_STORE_MOCK=1 so purchase flows
// can be scripted (there is no App Store in a browser). It is written to its own
// folder, `dist-e2e`, so it can never be mistaken for — or synced into — the
// release `dist`. `npm run build:ios` checks that release bundles contain none of it.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Ten parallel WebKit instances on a cold machine timed out; cap it.
  // GitHub's Linux runners render WebKit in software (no GPU): a single click
  // on this blur-heavy UI takes 2-8s there, so CI gets one worker and longer
  // budgets. Real devices and local macOS runs stay on the tighter limits.
  workers: process.env.CI ? 1 : 4,
  timeout: process.env.CI ? 120_000 : 30_000,
  expect: { timeout: process.env.CI ? 20_000 : 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4319',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'iphone-webkit',
      use: {
        ...devices['iPhone 15'],
        // Keeps the Fire ritual at ~1s; one test opts back into full motion.
        reducedMotion: 'reduce',
        colorScheme: 'light',
      },
    },
  ],
  webServer: {
    command: 'VITE_PLUS_STORE_MOCK=1 npx vite build --mode capacitor --outDir dist-e2e && npx vite preview --mode capacitor --outDir dist-e2e --port 4319 --strictPort',
    url: 'http://localhost:4319',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
