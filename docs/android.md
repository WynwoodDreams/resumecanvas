# ResumeCanvas on Android (Play Store)

The Android app is a Trusted Web Activity (TWA): a thin native shell that
opens the live PWA at **https://resumecanvas-seven.vercel.app** full-screen,
with no browser chrome. The site stays the single source of truth — every
deploy updates the app instantly, no Play release needed.

Two files in this repo drive it:

- `twa-manifest.json` — Bubblewrap's project config (package id, colors, icons).
- `.well-known/assetlinks.json` — Digital Asset Links. Android only hides the
  browser bar when this file (served from the production domain) lists the
  SHA-256 fingerprint of the key that signed the APK/AAB. It ships with a
  placeholder until you generate a signing key below.

## One-time setup (on your machine)

1. Install Node 18+ and a JDK 17 (`brew install openjdk@17` / `apt install openjdk-17-jdk`).
2. Install Bubblewrap: `npm i -g @bubblewrap/cli`
3. From the repo root run:

   ```bash
   bubblewrap init --manifest https://resumecanvas-seven.vercel.app/manifest.webmanifest
   ```

   Bubblewrap reads `twa-manifest.json` and asks to create a signing keystore
   (`android.keystore`). **Keep this file and its passwords safe and out of
   git** — losing it means you can never update the app on Play. (It's already
   covered by `.gitignore`.)

   On first run Bubblewrap offers to download the Android SDK + build tools
   for you; accept.

## Build

```bash
bubblewrap build
```

Outputs:

- `app-release-signed.apk` — for sideloading / local testing.
- `app-release-bundle.aab` — what you upload to the Play Console.

## Wire up Digital Asset Links (removes the browser bar)

1. Print your signing key's fingerprint:

   ```bash
   keytool -list -v -keystore android.keystore -alias android | grep SHA256
   ```

2. Paste the `AA:BB:...` value into
   `.well-known/assetlinks.json` (replacing the placeholder), commit, and
   deploy.

3. If you later enroll in **Play App Signing** (recommended), Google re-signs
   the app with its own key: add the *"App signing key certificate"* SHA-256
   from Play Console → Setup → App integrity as a **second** entry in the
   `sha256_cert_fingerprints` array. Both fingerprints can coexist.

4. Verify: https://developers.google.com/digital-asset-links/tools/generator
   — or just install the APK; if you see a URL bar, asset links aren't
   matching yet.

## Test locally

```bash
adb install app-release-signed.apk
```

Things worth checking on-device: install banner icon, the onboarding chooser,
voice dictation (Chrome on Android supports the Web Speech API), camera scan
(TextDetector works here), share sheet (PDF share), and offline launch
(airplane mode after first run).

## Play Console checklist

- Create the app (package id `com.wynwooddreams.resumecanvas`), upload the
  `.aab` to an internal testing track first.
- Store listing assets: the 512×512 icon is `icon-512.png` in this repo;
  you'll also need a 1024×500 feature graphic and at least 2 phone
  screenshots (the FINAL pane and the editor + preview make good ones).
- Data safety form: the app collects nothing and sends nothing — all resume
  data stays in on-device browser storage; voice audio is processed by the
  browser's speech service and never stored. Mention the backup/export
  feature writes files only at the user's request.
- Content rating: complete the questionnaire (utility app, no user-generated
  public content).

## Updating the app

Web changes need nothing — the TWA always loads the live site. You only
rebuild and re-upload (bumping `appVersionCode` in `twa-manifest.json`) when
the shell itself changes: icons, name, colors, start URL, or package id.
