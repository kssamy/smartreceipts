#!/bin/bash

# SmartReceipt Phase 2 Deployment to Oracle Cloud
# This script deploys the latest backend code to Oracle Cloud

set -e  # Exit on any error

echo "🚀 Starting Phase 2 deployment to Oracle Cloud..."
echo ""

# Configuration
ORACLE_HOST="152.70.114.100"
ORACLE_USER="ubuntu"  # Change this if different
SSH_KEY="$HOME/Downloads/GBI-Bioinformatics-Class.pem"  # Update with correct key path
PROJECT_DIR="/home/ubuntu/smartreceipt"  # Update with actual path on server
CONTAINER_NAME="smartreceipt-backend"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${YELLOW}📝 Using configuration:${NC}"
echo "  Host: $ORACLE_HOST"
echo "  User: $ORACLE_USER"
echo "  SSH Key: $SSH_KEY"
echo "  Project Dir: $PROJECT_DIR"
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "${RED}❌ SSH key not found at: $SSH_KEY${NC}"
    echo "Please update the SSH_KEY variable in this script with the correct path."
    exit 1
fi

# Test SSH connection
echo "${YELLOW}🔌 Testing SSH connection...${NC}"
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$ORACLE_USER@$ORACLE_HOST" "echo 'Connection successful'" 2>/dev/null; then
    echo "${RED}❌ Failed to connect to Oracle Cloud${NC}"
    echo "Please check:"
    echo "  1. SSH key path is correct"
    echo "  2. Oracle Cloud instance is running"
    echo "  3. Security group allows SSH (port 22)"
    exit 1
fi

echo "${GREEN}✅ SSH connection successful${NC}"
echo ""

# Deploy commands
echo "${YELLOW}📦 Deploying Phase 2 to Oracle Cloud...${NC}"
ssh -i "$SSH_KEY" "$ORACLE_USER@$ORACLE_HOST" << 'ENDSSH'
    set -e

    echo "📂 Navigating to project directory..."
    cd /home/ubuntu/smartreceipt/server || { echo "❌ Project directory not found"; exit 1; }

    echo "🔄 Pulling latest code from GitHub..."
    git fetch origin
    git pull origin main

    echo "🐳 Stopping existing container..."
    docker stop smartreceipt-backend || true
    docker rm smartreceipt-backend || true

    echo "🔨 Building new Docker image..."
    docker build -t smartreceipt-backend:latest .

    echo "🚀 Starting new container..."
    docker run -d \
      --name smartreceipt-backend \
      --restart unless-stopped \
      -p 3000:3000 \
      -e NODE_ENV=production \
      -e MONGODB_URI="${MONGODB_URI}" \
      -e REDIS_URL="${REDIS_URL}" \
      -e JWT_SECRET="${JWT_SECRET}" \
      smartreceipt-backend:latest

    echo "⏳ Waiting for container to start..."
    sleep 5

    echo "📊 Checking container status..."
    docker ps | grep smartreceipt-backend

    echo "📜 Viewing recent logs..."
    docker logs --tail 20 smartreceipt-backend

    echo "✅ Deployment completed!"
ENDSSH

echo ""
echo "${GREEN}✅ Phase 2 deployed successfully to Oracle Cloud!${NC}"
echo ""
echo "${YELLOW}🔍 Testing Phase 2 endpoints...${NC}"

# Test the price-watch endpoint
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$ORACLE_HOST:3000/api/v1/")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "${GREEN}✅ Backend is responding${NC}"
else
    echo "${RED}❌ Backend health check failed (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Test the mobile app - it should now connect to Oracle Cloud"
echo "2. Check backend logs: ssh -i $SSH_KEY $ORACLE_USER@$ORACLE_HOST 'docker logs -f smartreceipt-backend'"
echo "3. Monitor cron jobs: Logs will show daily price checks at 2 AM"
