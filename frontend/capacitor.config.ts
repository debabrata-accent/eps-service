import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.epsservice.app',
  appName: 'EPS Service',
  // The built web assets (from `npm run build`) live here.
  webDir: 'dist',
  android: {
    // Allow cleartext only in debug if ever needed; production talks HTTPS to Railway.
    allowMixedContent: false,
  },
  server: {
    // Use https scheme so cookies/secure contexts behave like the web.
    androidScheme: 'https',
  },
};

export default config;
