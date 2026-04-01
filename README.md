# 🏋️‍♂️ Tojizenin: The Ultimate Local-First Fitness Tracker

Tojizenin is a premium, data-driven iOS fitness tracking application built heavily around offline speed and smart analytics. Designed strictly for an iPhone and Mac ecosystem, it calculates dynamic **Spread Graphs** of your progression mapping out mathematically estimated `1-Rep Max` algorithms and `Total Volume` accumulation without relying on any external cloud subscription services.

> **Fast, offline, and localized directly on your device.**

---

## 🏗 The Tech Stack

This project was systematically ripped out of a generic Next.js template and refactored into a native-first **React Native (Expo)** powerhouse:

1. **Database:** `@nozbe/watermelondb` — A massive C++ powered local SQLite database for instant, zero-latency workout logging and offline persistence.
2. **Framework:** `Expo Router` — Handling strict Native iOS tab navigation and layout stack logic.
3. **Styling:** `NativeWind v4` — Porting exactly pure Tailwind CSS classes directly into the React Native primitives for an AMOLED-black minimalist finish.
4. **Analytics Pipeline:** `victory-native` & `react-native-svg` — Bringing massive, interactive data spread charts right to your Dashboard natively.
5. **UI & UX:** Native `react-native-reanimated` powering seamless `<Skeleton />` shimmering block loading states while the database connects.

---

## 🛠 Features & Capabilities

### 1. Smart Onboarding Security Guard
When launching the app, the routing layer automatically scans the WatermelonDB. If no **User Profile** exists, you are securely locked into an `Onboarding Flow` capturing:
* Name.
* Height & Weight.
* **Imperial vs Metric** Database Tracking alignment.

### 2. Auto-Seeding Configurations
If your database is completely empty upon onboarding, the internal seeding engine dynamically constructs and injects a standard **Push/Pull/Legs** routine alongside a baseline "Barbell Bench Press" tagged asset so you can log sets instantly without manually creating records yourself.

### 3. Responsive Unit Conversions
The whole app listens to the User Profile's `unitPreference`. If you set `Metric` in onboarding, the Dashboard analytics inherently execute dynamic math converting any historically logged pounds straight into kilograms right on the visual plane. 

### 4. Custom Routine Builder
Navigating to the **Training Plans (Routines)** tab pulls directly from the active Database. You have access to a lightning-fast `builder` interface allowing you to uniquely construct custom routines and permanently store them natively, completely distinct from preset algorithms.

### 5. Protected Wiping
At the footer of the `Profile > Settings` tab sits a fully interactive **Danger Zone**. Protected by an iOS confirmation boundary, tapping it completely triggers SQLite truncation, purging the entire database and booting you back to the initial Onboarding flow. 

---

## 📲 Exact Step-By-Step Commands to Test it on Your iPhone 

Because Tojizenin uses deep native modules (ex. WatermelonDB’s SQLite Objective-C bindings), **it CANNOT run inside the standard `Expo Go` sandbox app**. It requires your Mac to actively compile it using Xcode SDK tools.

Follow these exact steps to push the app to your iPhone:

### Step 1: Pre-Flight Check 
1. **Xcode:** Ensure you have the full Xcode application installed from the Mac App Store (you don't need to open it, you just need it on your machine so the terminal can use its code compilers).
2. **Device Connection:** Plug your iPhone straight into your Mac via the USB cable. 
3. **Trust:** Unlock your iPhone and tap "Trust This Computer" if a prompt drops down.

### Step 2: Open Terminal inside `/tojizenin`
First, ensure you are in the correct directory.
```bash
cd /Users/cyruskakkar/Projects/tojizenin
```

### Step 3: Install Node Packages (If you haven't)
Ensure all core dependencies, babel frameworks, and graphing utilities are installed.
```bash
npm install
```

### Step 4: Clear & Re-Generate iOS Bindings
Since we use WatermelonDB, we have to generate the `ios/` folder native bindings using Expo Prebuild. Running `--clean` ensures there are zero corrupt cached artifacts.
```bash
npx expo prebuild --clean
```
*(If it asks you "Continue with uncommitted changes?", hit 'yes' or 'y'.)*

### Step 5: Compile and Push App to iPhone
Finally, boot up the local Expo network server and fire off Xcode's underlying compilation process to push the `.app` straight to your phone. Use the `-d` flag to select your specific plugged-in device!
```bash
npx expo run:ios -d
```

> **What happens next:** 
> 1. It will present a list in your terminal: `? Select a device/simulator`. Use your arrow keys to select your actual iPhone's name, not the simulators. 
> 2. It will say `Building app for your iPhone...` and takes approximately 1-2 minutes the first time it runs because it compiles a ton of C++ Database logic.
> 3. Once it hits 100%, look at your iPhone! Your custom Tojizenin Dev Client app will automatically pop open, ready to use!
