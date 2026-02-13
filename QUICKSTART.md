# SmartReceipt - Quick Start Guide

Get SmartReceipt running in 5 minutes!

## Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Docker** and **Docker Compose**
- **Expo CLI**: `npm install -g expo-cli`

## Quick Setup

### 1. Install Dependencies (2 minutes)

```bash
# Root dependencies
npm install

# Server dependencies
cd server && npm install && cd ..

# Mobile dependencies
cd mobile && npm install && cd ..
```

### 2. Start Backend with Docker (1 minute)

```bash
# Starts MongoDB, Redis, and Backend API
docker-compose up -d
```

**Check it's running**:
```bash
curl http://localhost:3000/health
```

Expected response: `{"status":"OK",...}`

### 3. Start Mobile App (1 minute)

```bash
cd mobile
npm start
```

Then:
- Press `i` for **iOS Simulator**
- Press `a` for **Android Emulator**
- Scan **QR code** with Expo Go for **physical device**

### 4. Create Your First Account (30 seconds)

1. On the app, tap **"Don't have an account? Register"**
2. Enter:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
3. Tap **Register**

### 5. Scan Your First Receipt (1 minute)

1. Tap the **"Scan"** tab
2. Choose **"Take Photo"** or **"Choose from Gallery"**
3. Take/select a receipt photo
4. Review the extracted data (edit if needed)
5. Tap **"Save Receipt"**
6. View your dashboard with spending analytics!

## Troubleshooting

### Mobile app can't connect to backend?

**For iOS Simulator or Android Emulator on Mac**:
```bash
# Edit mobile/.env
API_URL=http://localhost:3000/api/v1
```

**For Android Emulator specifically**:
```bash
API_URL=http://10.0.2.2:3000/api/v1
```

**For physical device**:
```bash
# Find your computer's IP
ipconfig getifaddr en0  # Mac
ipconfig               # Windows

# Then update mobile/.env
API_URL=http://YOUR_IP:3000/api/v1
```

### Port 3000 already in use?

```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or change the port in server/.env
PORT=3001
```

### Docker issues?

```bash
# View logs
docker-compose logs -f

# Restart everything
docker-compose down
docker-compose up -d

# Nuclear option (removes all data!)
docker-compose down -v
docker-compose up -d
```

### OCR not working?

- Grant camera permissions when prompted
- Ensure good lighting on receipt
- ML Kit downloads models on first use (needs internet)
- Use **"Manual Entry"** as fallback

## What's Next?

- **Dashboard**: View spending breakdown by category
- **Receipts**: Browse all your saved receipts
- **Profile**: Manage your account settings

## Default Test Account

If you want to use a pre-configured test account:

```
Email: test@example.com
Password: password123
```

(You'll need to register this first)

## API Testing

**Register via cURL**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API User",
    "email": "api@example.com",
    "password": "password123"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@example.com",
    "password": "password123"
  }'
```

## Stopping Everything

```bash
# Stop mobile app: Ctrl+C in the terminal

# Stop backend
docker-compose down
```

## Need More Help?

See the full [README.md](./README.md) for:
- Complete API documentation
- Architecture details
- Development workflows
- Deployment guides

---

**You're all set! 🎉 Start scanning receipts and tracking your spending!**
