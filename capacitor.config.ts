import type { CapacitorConfig } from '@capacitor/cli';

// ═══════════════════════════════════════════════════════
//  PAX RIDER APP  ·  com.panafricanexpress.rider
//  This config builds the RIDER APK (PAX Rider).
//  For the Customer APK see: capacitor.customer.config.ts
// ═══════════════════════════════════════════════════════

const config: CapacitorConfig = {
  appId: 'com.panafricanexpress.rider',
  appName: 'PAX Rider',
  webDir: 'out',
  server: {
    // ── Production: opens directly on the rider dashboard ──
    url: 'https://panafricanexpress.com/rider',
    // ── Local dev: comment above line, uncomment below ─────
    // url: 'http://localhost:3000/rider',
    cleartext: false,
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
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  }
};

export default config;
