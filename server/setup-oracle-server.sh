#!/bin/bash

# SmartReceipt Oracle Cloud Server Setup Script
# Run this script on your Oracle Cloud Ubuntu instance

set -e

echo "🚀 Starting SmartReceipt server setup on Oracle Cloud..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Update system
echo -e "${GREEN}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo -e "${GREEN}📦 Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Skip MongoDB installation - using MongoDB Atlas cloud database
echo -e "${GREEN}☁️  Using MongoDB Atlas (cloud database)...${NC}"

# Install Git
echo -e "${GREEN}📦 Installing Git...${NC}"
sudo apt install -y git

# Install PM2
echo -e "${GREEN}📦 Installing PM2...${NC}"
sudo npm install -g pm2

# Clone repository
echo -e "${GREEN}📥 Cloning SmartReceipt repository...${NC}"
cd ~
if [ -d "smartreceipts" ]; then
    echo -e "${YELLOW}Repository already exists, pulling latest changes...${NC}"
    cd smartreceipts
    git pull origin main
else
    git clone https://github.com/kssamy/smartreceipts.git
    cd smartreceipts
fi

# Setup server
echo -e "${GREEN}🔧 Setting up backend server...${NC}"
cd server
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOL
NODE_ENV=production
PORT=3000

# MongoDB Atlas (cloud database)
MONGODB_URI=mongodb+srv://smartreceipt:GvbMjJgdbRwNXomc@cluster0.ltveur1.mongodb.net/smartreceipt?retryWrites=true&w=majority

# JWT Secrets (auto-generated)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# API URL (update with your Oracle Cloud public IP)
API_URL=http://YOUR_PUBLIC_IP:3000
EOL
    echo -e "${YELLOW}⚠️  Please edit .env and update YOUR_PUBLIC_IP${NC}"
fi

# Build the application
echo -e "${GREEN}🔨 Building application...${NC}"
npm run build

# Configure firewall
echo -e "${GREEN}🔥 Configuring UFW firewall...${NC}"
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Start application with PM2
echo -e "${GREEN}🚀 Starting application with PM2...${NC}"
pm2 delete smartreceipt-api 2>/dev/null || true
pm2 start dist/index.js --name smartreceipt-api
pm2 save

# Setup PM2 startup
echo -e "${GREEN}🔧 Setting up PM2 startup...${NC}"
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 save

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit the .env file and update YOUR_PUBLIC_IP with your Oracle Cloud public IP:"
echo "   nano ~/smartreceipts/server/.env"
echo ""
echo "2. Restart the application:"
echo "   pm2 restart smartreceipt-api"
echo ""
echo "3. Check the logs (should see 'MongoDB connection established'):"
echo "   pm2 logs smartreceipt-api"
echo ""
echo "4. Test the API:"
echo "   curl http://localhost:3000/api/v1/health"
echo ""
echo -e "${YELLOW}📝 Important reminders:${NC}"
echo "   - Update Oracle Cloud Security List to allow port 3000"
echo "   - MongoDB Atlas Network Access should allow connections from 0.0.0.0/0"
echo "   - Your API will be available at: http://YOUR_PUBLIC_IP:3000"
