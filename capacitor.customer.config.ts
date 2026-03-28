import type { CapacitorConfig } from '@capacitor/cli';

// ═══════════════════════════════════════════════════════
//  PAN EXPRESS CUSTOMER APP  ·  com.panafricanexpress.app
//  This config builds the CUSTOMER APK (PAN Express).
//  For the Rider APK see: capacitor.config.ts
// ═══════════════════════════════════════════════════════

const config: CapacitorConfig = {
  appId: 'com.panafricanexpress.app',
  appName: 'PAN Express',
  webDir: 'out',
  server: {
    // ── Production: opens on customer home ─────────────────
    url: 'https://panafricanexpress.ng',
    // ── Local dev: comment above line, uncomment below ─────
    // url: 'http://localhost:3000',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#ffffff",       // white splash for customer app
      androidScaleType: "CENTER_CROP",
      showSpinner: false,               // clean, no spinner for customer
    },
    StatusBar: {
      backgroundColor: "#ffffff",
    },
    Keyboard: {
      resize: "body",
      style: "light",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  }
};

export default config;
