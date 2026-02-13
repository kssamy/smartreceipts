# Environment Profiles Guide

This mobile app supports separate development and production environments.

## Available Profiles

### 🔧 Development (Local Backend)
- **Backend:** Local server on your Mac (http://172.20.10.5:3000)
- **Use when:** Testing locally, developing features
- **File:** `.env.development`

### 🚀 Production (Oracle Cloud)
- **Backend:** Oracle Cloud server (http://152.70.114.100:3000)
- **Use when:** Testing against production backend
- **File:** `.env.production`

## Usage

### Start with Development Profile (Local)
```bash
cd mobile
npm run start:dev
```

### Start with Production Profile (Oracle Cloud)
```bash
cd mobile
npm run start:prod
```

### Regular Start (Uses current .env)
```bash
npm start
```

## How It Works

Running `npm run start:dev` or `npm run start:prod`:
1. Copies the corresponding environment file to `.env`
2. Starts Expo with that configuration
3. App connects to the specified backend

## Files

- `.env` - Active configuration (auto-generated, gitignored)
- `.env.development` - Development settings (committed)
- `.env.production` - Production settings (committed)
- `.env.example` - Template with all options (committed)

## Updating Environment Variables

### To change development backend:
Edit `mobile/.env.development`

### To change production backend:
Edit `mobile/.env.production`

### After changing:
Restart Expo with the appropriate profile command

## Current Configuration

**Development:**
- API_URL: http://172.20.10.5:3000/api/v1

**Production:**
- API_URL: http://152.70.114.100:3000/api/v1
