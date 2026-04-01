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
The whole app listens to the User Profile's `unitPreference`. If you set `Metric` in onboarding, the Dashboard analytics `<SpreadGraph />` inherently executes dynamic math converting any historically logged pounds straight into kilograms right on the visual plane. 

### 4. Custom Routine Builder
Navigating to the **Training Plans (Routines)** tab pulls directly from the active Database. You have access to a lightning-fast `builder` interface allowing you to uniquely construct custom routines and permanently store them natively, completely distinct from preset algorithms.

### 5. Protected Wiping
At the footer of the `Profile > Settings` tab sits a fully interactive **Danger Zone**. Protected by an iOS confirmation boundary, tapping it completely triggers SQLite truncation, purging the entire database and booting you back to the initial Onboarding flow. 

---

## 📲 How to Test it on your iPhone 

Because Tojizenin uses deep native modules (ex. WatermelonDB’s SQLite Objective-C bindings), **it CANNOT run inside the standard `Expo Go` sandbox app**. It requires a custom Developer Client build pushed directly to your hardware. 

### Step 1: Pre-Flight Check 
Make sure your iPhone is connected via USB to your Mac, absolutely unlocked, and you’ve trusted the computer. Also, ensure you have **Xcode** installed on your Mac.

### Step 2: Clear & Re-Generate iOS Bindings
If you ever run into a native linking issue with WatermelonDB, run the prebuild to safely regenerate the iOS Swift/Objective-C folders:
```bash
npx expo prebuild --clean
```

### Step 3: Compile and Push
Simply run:
```bash
npx expo run:ios
```
> This command uses your local Node environment to literally compile the application from scratch using Xcode tools under the hood, and automatically flings the standalone app directly onto your attached iPhone (or local Mac Developer iOS Simulator) at 60 Frames Per Second.

---

## 📂 Architecture Map

```text
/tojizenin
├── /app/
│   ├── _layout.tsx           # Global Navigation Guard & Providers
│   ├── onboarding.tsx        # Profile Generator Screen
│   ├── run_workout.tsx       # Live Rep/Weight Logging Engine
│   └── /(tabs)/
│       ├── index.tsx         # Dashboard Analytics & Spread Graphs
│       ├── routines.tsx      # DB-Linked Workout Selection Engine
│       ├── builder.tsx       # Custom Routine Design Interface
│       └── settings.tsx      # Config Page & DB Wipe "Danger Zone"
├── /components/
│   └── SpreadGraph.tsx       # Victory Native interactive visualization
└── /database/
    ├── index.ts              # SQLite Adapter Initialization
    ├── schema.ts             # WatermelonDB Tables v2 Structure 
    ├── seed.ts               # Factory logic for initial db setup & wiping
    └── /models/              # Object Types (UserProfile, SetLog, Exercise, Tag, Routine...)
```
