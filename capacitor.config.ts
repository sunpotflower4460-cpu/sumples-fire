import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sunpotflower.sumplesfire',
  appName: 'Fire Task',
  webDir: 'dist',
  // Matches the app canvas (#0a0a0a) so there is no white flash before the web view paints.
  backgroundColor: '#0a0a0a',
  ios: {
    // Dark-only app: keep system chrome (keyboard, scroll indicators) dark as well.
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },
};

export default config;
