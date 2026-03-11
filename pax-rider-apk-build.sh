# PAX Rider Hub — TWA APK Build Guide
# Run these commands in order after deploying to Vercel

# ── Prerequisites (install once) ─────────────────────────────────
# 1. Java JDK 17+  → https://adoptium.net/
# 2. Android SDK   → https://developer.android.com/studio (just Command Line Tools)
# 3. Node.js 18+

# ── Step 1: Install Bubblewrap ──────────────────────────────────
npm install -g @bubblewrap/cli

# ── Step 2: Initialize TWA project ──────────────────────────────
mkdir pax-rider-apk
cd pax-rider-apk

bubblewrap init --manifest https://YOUR-VERCEL-DOMAIN.vercel.app/rider-manifest.json

# When prompted, accept defaults EXCEPT:
#   Application ID   → com.panafricanexpress.rider
#   App name         → PAX Rider
#   Display mode     → standalone
#   Start URL        → /rider
#   Theme color      → #eb0000
#   Background color → #0a0a0e

# ── Step 3: Generate signing keystore (first time only) ─────────
# Bubblewrap will ask you to create a keystore.
# SAVE THE KEYSTORE FILE AND PASSWORDS SECURELY — you need them for every update.
#
# Key alias:     pax-rider-key
# Key password:  (choose a strong password)
# Store password: (choose a strong password)

# ── Step 4: Build the APK ───────────────────────────────────────
bubblewrap build

# Output: app-release-signed.apk  ← this is your Android app!

# ── Step 5: Install on Android device (sideload) ────────────────
adb install app-release-signed.apk

# OR transfer the .apk to the phone and open it from Files app
# (Enable "Install unknown apps" in Android settings first)

# ── Step 6: Publish to Google Play Store (optional) ─────────────
# 1. Create a Google Play Developer account → https://play.google.com/console
#    (One-time $25 USD fee)
# 2. Use bubblewrap build --skipPwaValidation for Play Store bundle
# 3. Upload .aab file to Play Console

# ── Digital Asset Links (required for TWA to not show URL bar) ───
# After getting your keystore fingerprint, run:
#   bubblewrap fingerprint add
# Then add this file to your Vercel deployment:
# public/.well-known/assetlinks.json

# ───────────────────────────────────────────────────────────────────
# IMPORTANT: Replace YOUR-VERCEL-DOMAIN with your actual domain
# Example: https://pax-express.vercel.app/rider-manifest.json
# ───────────────────────────────────────────────────────────────────
