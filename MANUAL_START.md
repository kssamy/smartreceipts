# SmartReceipt - Manual Startup Guide

## ✅ Backend is Already Running!

Your backend server is currently running and working:
- **Status**: ✅ Running
- **URL**: http://localhost:3000
- **MongoDB**: Connected to Atlas
- **Redis**: Connected to Upstash

**Don't close the terminal where the backend is running!**

---

## 📱 Start Mobile App (New Terminal)

### Step 1: Open a **BRAND NEW** Terminal Window

- Press `Cmd + N` or open Terminal from Applications

### Step 2: Navigate to Mobile Folder

```bash
cd "/Users/palanisamykaliyaperumal/Documents/price match/mobile"
```

### Step 3: Clear Any Cached Metro Bundler

```bash
rm -rf .expo
npx expo start -c
```

The `-c` flag clears the cache and should fix the "too many files" error.

### Step 4: Wait for Expo Menu

You'll see something like:

```
› Metro waiting on exp://10.0.0.102:8081
› Scan the QR code above with Expo Go (Android) or Camera (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

### Step 5: Choose Your Platform

**For iOS Simulator:**
- Press `i`
- Wait 30-60 seconds for simulator to open
- App will load automatically

**For Android Emulator:**
- Make sure Android Studio emulator is running first
- Press `a`
- App will load on emulator

**For Physical Device:**
- Install "Expo Go" from App Store (iOS) or Play Store (Android)
- Scan the QR code shown in terminal
- App will load on your phone

---

## 🎯 What to Do After App Loads

1. **You'll see the Login Screen**
   - Tap "Don't have an account? Register"

2. **Register:**
   - Name: Your name
   - Email: your@email.com
   - Password: password123 (or your choice)
   - Tap "Register"

3. **Go to Scan Tab** (bottom navigation)
   - Choose "Manual Entry" (or take a photo)
   - Add a test receipt:
     - Store: Walmart
     - Item: Milk - $3.99
     - Total: $3.99
   - Tap "Save Receipt"

4. **View Dashboard**
   - See your spending chart!
   - Category breakdown

---

## 🐛 Troubleshooting

### If you get "too many files" error again:

```bash
# In mobile terminal:
watchman shutdown-server
rm -rf .expo
rm -rf node_modules/.cache
npx expo start -c
```

### If you get "Cannot connect to server":

The mobile app is configured to use: `http://10.0.0.102:3000/api/v1`

**Make sure:**
- Backend is running (check other terminal)
- Your phone/simulator is on the same WiFi network
- Your firewall allows connections on port 3000

### To check backend status:

```bash
curl http://localhost:3000/health
```

Should return: `{"status":"OK",...}`

---

## 🔄 Restarting Everything

If something goes wrong:

### 1. Stop Everything
```bash
# Kill all processes
pkill -f nodemon
pkill -f expo
```

### 2. Start Backend
```bash
cd "/Users/palanisamykaliyaperumal/Documents/price match/server"
npm run dev
```

Wait for: ✅ MongoDB connected, ✅ Redis connected, ✅ Server running

### 3. Start Mobile (in NEW terminal)
```bash
cd "/Users/palanisamykaliyaperumal/Documents/price match/mobile"
npx expo start -c
```

---

## 📞 Need Help?

Current configuration:
- Backend: Running ✅
- MongoDB Atlas: Connected ✅
- Upstash Redis: Connected ✅
- API URL: `http://10.0.0.102:3000/api/v1`

The backend is ready - you just need to start the mobile app in a fresh terminal!
