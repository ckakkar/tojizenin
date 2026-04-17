# Tojizenin

A local-first fitness tracker for iOS. Logs sets, tracks estimated 1RM and total volume over time, and works completely offline — no cloud, no subscriptions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo Router (React Native, file-based navigation) |
| Database | WatermelonDB — C++ SQLite bindings, zero-latency offline queries |
| Styling | NativeWind v4 — Tailwind CSS for React Native |
| Charts | victory-native + react-native-svg |
| Animations | react-native-reanimated (skeleton loaders, transitions) |
| Language | TypeScript |

---

## Features

- **Onboarding guard** — on first launch, routes to a setup flow; on return, loads straight into the app
- **Push/Pull/Legs preset** — auto-seeded on first setup; 3 days, 9 exercises, ready to use immediately
- **Custom routine builder** — create routines with named days; add any exercises you want per day
- **Active workout session** — navigate between exercises, log weight × reps per set, see est. 1RM per set inline
- **Dashboard** — spread graph of your estimated 1RM and total volume over time per exercise
- **Unit preference** — imperial (lbs/in) or metric (kg/cm); set in onboarding, respected everywhere
- **Settings** — view your profile, nuke the database and start over

---

## Getting It on iPhone 15 Pro Max

> The app uses WatermelonDB's native SQLite bindings (Objective-C/C++) which cannot run inside Expo Go. It must be compiled with Xcode and sideloaded onto your device.

### What you need

- **Mac** running macOS 13 Ventura or later
- **Xcode 16+** — install from the Mac App Store (it's free; ~14 GB)
- **Apple Developer account** — the free tier works for personal device installs
- **iPhone 15 Pro Max** plugged in via **USB-C** cable
- **Node.js 20+** and **npm** installed (`node -v` to check)

---

### Step 1 — Trust your Mac on the phone

Plug the iPhone in via USB-C. On the phone, unlock it and tap **Trust** when the "Trust This Computer?" prompt appears. If it doesn't appear, go to **Settings → General → Transfer or Reset iPhone → Reset → Reset Location & Privacy**, then plug in again.

---

### Step 2 — Register your device with your Apple Developer account

Open Xcode at least once after installing it so it downloads simulators and sets up command-line tools:

```bash
sudo xcode-select --switch /Applications/Xcode.app
xcodebuild -version
```

You should see `Xcode 16.x` printed back. If not, open Xcode from Applications and let it finish setup.

---

### Step 3 — Clone and install dependencies

```bash
git clone https://github.com/ckakkar/tojizenin.git
cd tojizenin
npm install
```

---

### Step 4 — Generate the native iOS project

WatermelonDB needs a real `ios/` folder with its Objective-C bindings compiled in. `expo prebuild` generates this from scratch. The `--clean` flag wipes any previous build artifacts so nothing is stale:

```bash
npx expo prebuild --clean
```

If prompted "Continue with uncommitted changes?" — type `y`.

This takes about 30–60 seconds. When it finishes you'll see an `ios/` folder appear.

---

### Step 5 — Open the generated project in Xcode and set your signing identity

```bash
open ios/tojizenin.xcworkspace
```

In Xcode:

1. Click **tojizenin** in the left sidebar (the blue project icon at the top)
2. Select the **tojizenin** target under TARGETS
3. Click the **Signing & Capabilities** tab
4. Under **Team**, select your Apple ID / Developer account from the dropdown
   - If you don't see it, click **Add an Account…** and sign in with your Apple ID
5. Xcode will auto-generate a provisioning profile. You may see a "Fix Issue" button — click it.

You only need to do steps 1–5 **once**. After this, signing is remembered.

---

### Step 6 — Build and run on your iPhone 15 Pro Max

Go back to Terminal:

```bash
npx expo run:ios -d
```

You'll see a device picker. Use your arrow keys to select your **iPhone 15 Pro Max** (it shows the device name, not "simulator"). Hit Enter.

Xcode will compile the native modules (~2–3 min first time, ~30 sec after). When it finishes:

1. The app installs on your iPhone automatically
2. It opens to the Tojizenin onboarding screen

If you get **"Untrusted Developer"** on the phone:  
Go to **Settings → General → VPN & Device Management** → tap your Apple ID email → tap **Trust**.

---

### Step 7 — Subsequent runs (no rebuild needed)

Once the app is installed, you can start the JS bundler alone for fast reloads:

```bash
npx expo start --dev-client
```

Scan the QR code with the Camera app, or tap the app icon on your phone — it connects to the bundler automatically. Code changes hot-reload without recompiling the native layer.

---

### Troubleshooting

| Problem | Fix |
|---|---|
| `command not found: expo` | Run `npm install` first, then use `npx expo` |
| Build fails with "No profiles for bundle ID" | Open Xcode → Signing & Capabilities → make sure a Team is selected |
| App icon appears but crashes on open | Run `npx expo prebuild --clean` then rebuild |
| "Untrusted Developer" on phone | Settings → General → VPN & Device Management → trust your Apple ID |
| WatermelonDB JSI error at startup | Ensure `newArchEnabled: true` in `app.json` and rebuild clean |
| Device not showing in `run:ios -d` picker | Unplug, reboot iPhone, re-plug, tap Trust |
