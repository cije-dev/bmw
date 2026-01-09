#!/bin/bash
set -e

echo "🌐 Setting up Nginx reverse proxy for https://cije.us/bmw"
echo "=========================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Install nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt update -y
    apt install -y nginx certbot python3-certbot-nginx
fi

# Get the current directory (where the app is)
APP_DIR=$(pwd)
APP_PORT=3000

# Create nginx configuration
echo "📝 Creating Nginx configuration..."
cat > /etc/nginx/sites-available/bmw <<EOF
# BMW Mental Wellness App - Reverse Proxy
# Accessible at https://cije.us/bmw

location /bmw {
    proxy_pass http://localhost:${APP_PORT};
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
    
    # Remove /bmw prefix when forwarding
    rewrite ^/bmw/?(.*) /\$1 break;
    
    # Increase timeouts for long requests
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
EOF

# Enable the site
if [ -f /etc/nginx/sites-enabled/bmw ]; then
    rm /etc/nginx/sites-enabled/bmw
fi
ln -s /etc/nginx/sites-available/bmw /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    systemctl reload nginx
    echo "✅ Nginx reloaded"
    
    # Setup SSL certificate with Let's Encrypt
    echo ""
    echo "🔒 Setting up SSL certificate..."
    echo "   This will prompt you for your email address"
    certbot --nginx -d cije.us --redirect
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ SSL certificate installed!"
        echo ""
        echo "🎉 Setup complete!"
        echo "   Your app is now accessible at: https://cije.us/bmw"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Make sure your app is running: npm start (or pm2 start)"
        echo "   2. Ensure port ${APP_PORT} is open: sudo ufw allow ${APP_PORT}"
        echo "   3. Test the URL: https://cije.us/bmw"
        echo ""
        echo "🔄 To reload nginx after changes: sudo systemctl reload nginx"
    else
        echo "⚠️  SSL setup failed. You can run manually:"
        echo "   sudo certbot --nginx -d cije.us"
    fi
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

