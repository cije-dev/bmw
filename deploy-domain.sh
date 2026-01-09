#!/bin/bash
set -e

echo "🚀 Deploying BMW app to https://cije.us/bmw"
echo "============================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

APP_DIR=$(pwd)
APP_PORT=3000

# Step 1: Ensure app is running with PM2
echo "📦 Step 1: Setting up PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Start app with PM2 if not already running
cd "$APP_DIR"
if ! pm2 list | grep -q "BMW"; then
    echo "Starting app with PM2..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    echo "✅ App started with PM2"
else
    echo "✅ App already running with PM2"
    pm2 restart BMW
fi

# Step 2: Setup Nginx reverse proxy
echo ""
echo "🌐 Step 2: Setting up Nginx reverse proxy..."

if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt update -y
    apt install -y nginx certbot python3-certbot-nginx
fi

# Copy nginx configuration
if [ -f "$APP_DIR/nginx-bmw.conf" ]; then
    cp "$APP_DIR/nginx-bmw.conf" /etc/nginx/sites-available/bmw
else
    # Create basic config
    cat > /etc/nginx/sites-available/bmw <<EOF
server {
    listen 80;
    server_name cije.us;
    
    location /bmw {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        rewrite ^/bmw/?(.*) /\$1 break;
    }
}
EOF
fi

# Enable site
if [ -f /etc/nginx/sites-enabled/bmw ]; then
    rm /etc/nginx/sites-enabled/bmw
fi
ln -s /etc/nginx/sites-available/bmw /etc/nginx/sites-enabled/

# Test and reload nginx
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "✅ Nginx configured and reloaded"
else
    echo "❌ Nginx configuration error"
    exit 1
fi

# Step 3: Setup SSL
echo ""
echo "🔒 Step 3: Setting up SSL certificate..."

# Check if SSL already exists
if [ -f /etc/letsencrypt/live/cije.us/fullchain.pem ]; then
    echo "✅ SSL certificate already exists"
    # Update nginx config to use SSL
    certbot --nginx -d cije.us --redirect --non-interactive --agree-tos --email admin@cije.us 2>/dev/null || true
else
    echo "Setting up SSL certificate with Let's Encrypt..."
    echo "You'll be prompted for your email address"
    certbot --nginx -d cije.us --redirect
fi

# Step 4: Firewall
echo ""
echo "🔥 Step 4: Configuring firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable

# Step 5: Verify
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Summary:"
echo "   - App running on: http://localhost:${APP_PORT}"
echo "   - Public URL: https://cije.us/bmw"
echo "   - PM2 status: pm2 status"
echo "   - PM2 logs: pm2 logs BMW"
echo ""
echo "🧪 Test the deployment:"
echo "   curl https://cije.us/bmw/api/health"
echo ""
echo "🔄 Useful commands:"
echo "   pm2 restart BMW          # Restart app"
echo "   pm2 logs BMW             # View logs"
echo "   sudo nginx -t            # Test nginx config"
echo "   sudo systemctl reload nginx  # Reload nginx"
echo ""

