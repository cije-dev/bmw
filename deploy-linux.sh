#!/bin/bash
set -e

echo "🚀 BMW - Better Mental Wellness"
echo "================================"
echo "Linux Mint / Ubuntu Deployment"
echo ""

# Update system
echo "Updating system packages..."
sudo apt update -y

# Install Node.js LTS
echo "Installing Node.js LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install MariaDB
echo "Installing MariaDB Server..."
sudo apt install -y mariadb-server

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Create project
mkdir -p ~/bmw
cd ~/bmw

echo "Installing npm dependencies..."
npm install

echo ""
echo "✅ Installation Complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and update DB credentials"
echo "2. Start MariaDB: sudo systemctl start mariadb"
echo "3. Setup database: mysql -u root -p < setup.sql"
echo "4. Start BMW:"
echo "   npm start (development)"
echo "   pm2 start ecosystem.config.js --env production (production)"
echo ""
echo "Access: http://localhost:3000"
echo "Monitor: pm2 monit"
echo "Logs: pm2 logs bmw"
echo ""
