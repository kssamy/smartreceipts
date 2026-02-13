#!/bin/bash

# SmartReceipt Startup Script

echo "🚀 Starting SmartReceipt Application..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "nodemon" 2>/dev/null || true
pkill -f "expo" 2>/dev/null || true
sleep 2

# Start backend server
echo ""
echo "${BLUE}📡 Starting Backend Server...${NC}"
cd "/Users/palanisamykaliyaperumal/Documents/price match/server"
npm run dev > /tmp/smartreceipt-server.log 2>&1 &
SERVER_PID=$!
echo "Backend PID: $SERVER_PID"

# Wait for backend to start
echo "Waiting for backend to connect to databases..."
sleep 10

# Check if backend is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "${GREEN}✅ Backend server is running!${NC}"
    echo "   API: http://localhost:3000"
else
    echo "${RED}❌ Backend server failed to start${NC}"
    echo "Check logs: tail -f /tmp/smartreceipt-server.log"
    exit 1
fi

echo ""
echo "${BLUE}📱 Starting Mobile App...${NC}"
echo ""
echo "Opening in a new terminal window..."
echo ""

# Open mobile app in a new terminal
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '/Users/palanisamykaliyaperumal/Documents/price match/mobile' && echo '📱 SmartReceipt Mobile App' && echo '' && echo 'Press i for iOS Simulator' && echo 'Press a for Android Emulator' && echo '' && npx expo start --port 8082"
end tell
EOF

echo ""
echo "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📋 Instructions:"
echo "   1. A new terminal window opened with the mobile app"
echo "   2. In that window, press 'i' for iOS or 'a' for Android"
echo "   3. Wait for the app to load"
echo ""
echo "🔗 Connections:"
echo "   Backend:  http://localhost:3000"
echo "   Mobile App: http://localhost:8082"
echo "   Mobile API: http://10.0.0.102:3000/api/v1"
echo ""
echo "📊 View Backend Logs:"
echo "   tail -f /tmp/smartreceipt-server.log"
echo ""
echo "🛑 To stop the backend:"
echo "   kill $SERVER_PID"
echo ""
