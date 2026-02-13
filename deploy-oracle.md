# Deploy SmartReceipt to Oracle Cloud

## Prerequisites
- Oracle Cloud account (free tier is fine)
- SSH key pair for connecting to the instance

## Step 1: Create Compute Instance

1. **Login to Oracle Cloud Console**
   - Go to: https://cloud.oracle.com/
   - Sign in with your Oracle Cloud account

2. **Create a VM Instance**
   - Navigate to: **Compute** → **Instances** → **Create Instance**

   **Configuration:**
   - **Name:** `smartreceipt-server`
   - **Image:** Ubuntu 22.04 (or latest)
   - **Shape:**
     - Free Tier: VM.Standard.E2.1.Micro (1 OCPU, 1GB RAM)
     - OR Ampere: VM.Standard.A1.Flex (4 OCPUs, 24GB RAM - Free!)
   - **Virtual Cloud Network:** Create new or use default
   - **Subnet:** Public subnet
   - **Public IP:** Assign a public IPv4 address
   - **SSH Keys:** Upload your public key or generate new

3. **Note down the Public IP address** after creation

## Step 2: Configure Firewall (Security List)

1. **Navigate to:** Your VCN → Security Lists → Default Security List
2. **Add Ingress Rules:**

   | Type | Source CIDR | IP Protocol | Source Port | Destination Port | Description |
   |------|-------------|-------------|-------------|------------------|-------------|
   | Stateful | 0.0.0.0/0 | TCP | All | 22 | SSH |
   | Stateful | 0.0.0.0/0 | TCP | All | 3000 | Node.js API |
   | Stateful | 0.0.0.0/0 | TCP | All | 80 | HTTP |
   | Stateful | 0.0.0.0/0 | TCP | All | 443 | HTTPS |

## Step 3: Connect to Your Instance

```bash
ssh -i /path/to/your-private-key ubuntu@<YOUR_PUBLIC_IP>
```

## Step 4: Install Dependencies on the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Git
sudo apt install -y git

# Install PM2 (process manager)
sudo npm install -g pm2
```

## Step 5: Clone and Setup Your Application

```bash
# Clone your repository
cd ~
git clone https://github.com/kssamy/smartreceipts.git
cd smartreceipts/server

# Install dependencies
npm install

# Create environment file
nano .env
```

**Copy this into .env:**
```
NODE_ENV=production
PORT=3000

# MongoDB (local)
MONGODB_URI=mongodb://localhost:27017/smartreceipt

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-this-too

# Redis (optional - comment out if not using)
# REDIS_URL=redis://localhost:6379

# API URL
API_URL=http://<YOUR_ORACLE_CLOUD_PUBLIC_IP>:3000
```

**Save and exit:** Ctrl+X, then Y, then Enter

## Step 6: Build and Start the Application

```bash
# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/index.js --name smartreceipt-api

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Copy and run the command that PM2 outputs
```

## Step 7: Configure Ubuntu Firewall

```bash
# Allow required ports
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 3000/tcp    # Node.js API
sudo ufw enable
```

## Step 8: Test the Deployment

From your local machine:
```bash
curl http://<YOUR_ORACLE_CLOUD_PUBLIC_IP>:3000/api/v1/health
```

You should see: `{"status":"ok","timestamp":"..."}`

## Step 9: Update Mobile App Configuration

Update your mobile app to use the Oracle Cloud IP:

**Edit:** `mobile/.env`
```
API_URL=http://<YOUR_ORACLE_CLOUD_PUBLIC_IP>:3000/api/v1
```

Or hardcode in: `mobile/src/config/api.ts`
```typescript
export const API_URL = 'http://<YOUR_ORACLE_CLOUD_PUBLIC_IP>:3000/api/v1';
```

## Step 10: (Optional) Setup HTTPS with Let's Encrypt

```bash
# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/smartreceipt
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Or use IP address

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/smartreceipt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# If you have a domain, get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Useful PM2 Commands

```bash
# View logs
pm2 logs smartreceipt-api

# Restart app
pm2 restart smartreceipt-api

# Stop app
pm2 stop smartreceipt-api

# Monitor
pm2 monit

# View status
pm2 status
```

## Updating Your Application

```bash
cd ~/smartreceipts
git pull origin main
cd server
npm install
npm run build
pm2 restart smartreceipt-api
```

## Cost Estimate

**Oracle Cloud Free Tier:**
- ✅ FREE forever
- 2 VMs (AMD) or 1 powerful Arm VM
- 200GB storage
- 10TB outbound data transfer/month

**Paid options (if you scale):**
- VM.Standard.E4.Flex: ~$0.015/OCPU/hour
- Block storage: ~$0.0255/GB/month

## Security Best Practices

1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Enable UFW firewall**
4. **Keep system updated:** `sudo apt update && sudo apt upgrade`
5. **Use HTTPS** (Let's Encrypt is free)
6. **Limit SSH access** to your IP only
7. **Regular backups** of MongoDB data

## Monitoring

```bash
# Check API health
curl http://<YOUR_IP>:3000/api/v1/health

# Check MongoDB
mongosh
> show dbs
> use smartreceipt
> db.users.countDocuments()

# Check system resources
htop
df -h
free -h
```

## Troubleshooting

**API not responding:**
```bash
pm2 logs smartreceipt-api
sudo systemctl status mongod
```

**MongoDB issues:**
```bash
sudo systemctl restart mongod
sudo systemctl status mongod
journalctl -u mongod
```

**Firewall blocking:**
```bash
sudo ufw status
sudo ufw allow 3000/tcp
```

## Architecture

```
[Mobile App]
    ↓ HTTPS/HTTP
[Oracle Cloud VM]
    ├── Nginx (reverse proxy, SSL)
    ├── Node.js API (PM2)
    └── MongoDB (local)
```

## Next Steps

1. Set up automated backups (MongoDB dumps)
2. Configure monitoring (Oracle Cloud Monitoring)
3. Set up CI/CD pipeline (GitHub Actions)
4. Add domain name and SSL certificate
5. Consider MongoDB Atlas for database (managed service)
