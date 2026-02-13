# SmartReceipt - Startup Guide

## Current Status

✅ **Dependencies Installed**
- Server dependencies: Installed successfully
- Mobile dependencies: Installed successfully

⚠️ **Requirements Needed**
- Docker is not installed on your system
- MongoDB and Redis need to be set up

## Next Steps - Choose One Option

### Option 1: Install Docker (Recommended - Easiest)

Docker will automatically set up MongoDB and Redis for you.

1. **Install Docker Desktop**:
   - Visit: https://www.docker.com/products/docker-desktop
   - Download and install Docker Desktop for Mac
   - Start Docker Desktop

2. **Start the application**:
   ```bash
   cd "/Users/palanisamykaliyaperumal/Documents/price match"
   docker compose up -d
   ```

3. **Verify it's running**:
   ```bash
   curl http://localhost:3000/health
   ```

4. **Start the mobile app**:
   ```bash
   cd mobile
   npm start
   ```

---

### Option 2: Install MongoDB and Redis Locally

If you prefer not to use Docker:

1. **Install MongoDB**:
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```

2. **Install Redis**:
   ```bash
   brew install redis
   brew services start redis
   ```

3. **Update server/.env** to use local connections:
   ```env
   MONGODB_URI=mongodb://localhost:27017/smartreceipt
   REDIS_URL=redis://localhost:6379
   ```

4. **Start the backend**:
   ```bash
   cd server
   npm run dev
   ```

5. **Start the mobile app** (in a new terminal):
   ```bash
   cd mobile
   npm start
   ```

---

### Option 3: Use Cloud Databases (No Local Install)

Use free cloud services:

1. **MongoDB Atlas** (Free 512MB):
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Create a free cluster
   - Get your connection string
   - Update `server/.env`:
     ```env
     MONGODB_URI=your_atlas_connection_string_here
     ```

2. **Upstash Redis** (Free tier):
   - Visit: https://upstash.com
   - Create a free Redis database
   - Get your Redis URL
   - Update `server/.env`:
     ```env
     REDIS_URL=your_upstash_redis_url_here
     ```

3. **Start the backend**:
   ```bash
   cd server
   npm run dev
   ```

4. **Start the mobile app** (in a new terminal):
   ```bash
   cd mobile
   npm start
   ```

---

## Testing the Backend

Once your backend is running, test it:

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## Starting the Mobile App

Once the backend is running:

```bash
cd "/Users/palanisamykaliyaperumal/Documents/price match/mobile"
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

**Important**: Update `mobile/.env` with the correct API URL:
- For iOS Simulator: `API_URL=http://localhost:3000/api/v1`
- For Android Emulator: `API_URL=http://10.0.2.2:3000/api/v1`
- For Physical Device: `API_URL=http://YOUR_COMPUTER_IP:3000/api/v1`

---

## Troubleshooting

### TypeScript Compilation Errors

The project files have been updated to use `--transpile-only` mode which skips type checking during development. If you still see errors, try:

```bash
cd server
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### MongoDB Connection Errors

Make sure MongoDB is running:
```bash
# If installed via Homebrew
brew services list
brew services restart mongodb-community
```

### Redis Connection Errors

Make sure Redis is running:
```bash
# If installed via Homebrew
brew services list
brew services restart redis
```

---

## My Recommendation

**Install Docker** - It's the easiest and fastest way to get everything running. Docker will:
- Set up MongoDB automatically
- Set up Redis automatically
- Handle all configuration
- Work with one command: `docker compose up`

You can install Docker Desktop here: https://www.docker.com/products/docker-desktop

---

## Quick Command Reference

```bash
# With Docker (recommended)
docker compose up -d              # Start everything
docker compose down               # Stop everything
docker compose logs -f            # View logs

# Without Docker
cd server && npm run dev          # Start backend
cd mobile && npm start            # Start mobile app

# Testing
curl http://localhost:3000/health # Check if backend is running
```

---

## What's Next?

Once the app is running:
1. Open the mobile app
2. Register a new account
3. Scan your first receipt
4. View your spending dashboard

Need help? Check the main [README.md](./README.md) for full documentation.
