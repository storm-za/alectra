# Alectra Solutions - Play Store Setup Guide

## App Details

| Field | Value |
|-------|-------|
| App Name | Alectra |
| Bundle ID | `co.za.alectra.app` |
| Min Android | API 24 (Android 7.0) |
| Target SDK | 34 (Android 14) |
| Architecture | arm64-v8a, armeabi-v7a, x86, x86_64 |

## How It Works

The Android app is a Tauri v2 WebView wrapper that loads `https://alectra.co.za` directly. Every product update, new feature, and order flow is always current with no app update required. The GitHub Actions workflow builds a signed AAB (Android App Bundle) automatically on every push to `main`.

## First-Time Setup

### 1. Generate a Signing Keystore

Run this command on your local machine (you only do this once):

```bash
keytool -genkeypair \
  -v \
  -keystore alectra-release.keystore \
  -alias alectra \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Alectra Solutions, O=Alectra Solutions, L=Pretoria, ST=Gauteng, C=ZA"
```

**Keep this keystore file safe.** If you lose it, you cannot update your app on the Play Store.

### 2. Add GitHub Secrets

Go to your GitHub repository > Settings > Secrets and variables > Actions > New repository secret.

Add these 4 secrets:

| Secret Name | Value |
|-------------|-------|
| `KEYSTORE_BASE64` | Base64-encoded keystore file (see below) |
| `KEYSTORE_PASSWORD` | The `storepass` you used above |
| `KEY_ALIAS` | The alias you chose |
| `KEY_PASSWORD` | The `keypass` you used above |

To encode the keystore as base64:

```bash
base64 -i alectra-release.keystore | pbcopy   # macOS (copies to clipboard)
base64 alectra-release.keystore               # Linux (prints to terminal)
```

Paste the full base64 string as the value of `ANDROID_KEYSTORE_BASE64`.

### 3. Trigger a Build

The workflow runs automatically on push to `main`. You can also trigger it manually:

1. Go to your GitHub repo > Actions tab
2. Click "Build Android AAB" workflow
3. Click "Run workflow" > "Run workflow"

### 4. Download the AAB

After the workflow completes (~13 minutes):

1. Go to **https://github.com/storm-za/alectra/releases**
2. The latest release is tagged `v1.0.0-build.N` — download the `.aab` file attached to it
3. If no keystore secrets are set yet, the release is marked *pre-release* (unsigned — for testing only)
4. Once the 4 `ANDROID_*` secrets are added, every build produces a signed release build

### 5. Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app (or select existing)
3. Go to Release > Production > Create new release
4. Upload the `.aab` file
5. Fill in the release notes
6. Submit for review

## Play Store Listing Assets

| Asset | Requirement | File |
|-------|-------------|------|
| App icon | 512x512 PNG | `src-tauri/icons/playstore-icon.png` |
| Feature graphic | 1024x500 PNG | Create in Canva or similar |
| Screenshots | Min 2, phone size | Take from the live site on mobile |

## Updating the App

Since the app loads from `https://alectra.co.za`, most updates happen server-side with no app update needed. You only need to rebuild and re-submit the AAB if:

- You change the app version in `src-tauri/tauri.conf.json`
- You add new native capabilities (push notifications, camera, etc.)
- Google requires a target SDK update

To bump the version, edit `src-tauri/tauri.conf.json`:

```json
{
  "version": "1.1.0"
}
```

Then push to `main` and download the new AAB from GitHub Actions.

## Troubleshooting

**Build fails with "NDK not found"**: The workflow installs NDK 25.2.9519653. If this version is no longer available, update the version in `.github/workflows/android-build.yml`.

**AAB is unsigned**: Make sure all 4 GitHub Secrets are configured. The workflow will produce an unsigned AAB if secrets are missing (useful for testing).

**App shows blank screen**: Check that `https://alectra.co.za` is accessible. The app requires an internet connection.
