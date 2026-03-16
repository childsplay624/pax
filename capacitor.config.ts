import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.panafricanexpress.rider',
  appName: 'PAN Express',
  webDir: 'out',
  server: {
    // This allows the app to load the live site while maintaining native plugin access
    // Replace with your production URL when ready: https://panafricanexpress.ng
    url: 'http://localhost:3000',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a0a0e",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#eb0000",
    },
    StatusBar: {
      backgroundColor: "#0a0a0e",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
    }
  }
};

export default config;
