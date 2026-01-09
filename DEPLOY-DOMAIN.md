# Deploy to https://cije.us/bmw

This guide will help you make your BMW app accessible at `https://cije.us/bmw`.

## 🚀 Quick Deploy (Linux/Ubuntu)

Run the automated deployment script:

```bash
chmod +x deploy-domain.sh
sudo ./deploy-domain.sh
```

This script will:
1. ✅ Start your app with PM2
2. ✅ Install and configure Nginx
3. ✅ Set up SSL certificate (Let's Encrypt)
4. ✅ Configure firewall rules

## 📋 Manual Setup

### Step 1: Start the App

```bash
# Install PM2 if not installed
npm install -g pm2

# Start the app
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Enable PM2 on system startup
```

### Step 2: Install Nginx

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 3: Configure Nginx

```bash
# Copy the configuration
sudo cp nginx-bmw.conf /etc/nginx/sites-available/bmw

# Enable the site
sudo ln -s /etc/nginx/sites-available/bmw /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 4: Setup SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d cije.us

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS
```

### Step 5: Configure Firewall

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### Step 6: DNS Configuration

Make sure your domain `cije.us` points to your server's IP address:

```bash
# Check your server IP
curl ifconfig.me

# Add DNS A record:
# Type: A
# Name: @ (or leave blank)
# Value: YOUR_SERVER_IP
# TTL: 3600
```

## 🪟 Windows Setup

For Windows Server, you have two options:

### Option 1: Nginx for Windows

1. Download Nginx: http://nginx.org/en/download.html
2. Extract to `C:\nginx`
3. Run the PowerShell script:
   ```powershell
   .\setup-nginx-windows.ps1
   ```
4. Edit `C:\nginx\conf\nginx.conf` and add:
   ```nginx
   include bmw.conf;
   ```
5. Start Nginx: `C:\nginx\nginx.exe`

### Option 2: IIS with URL Rewrite

1. Install IIS and URL Rewrite module
2. Create a site for `cije.us`
3. Place `web.config` in the site root
4. Configure SSL certificate in IIS

## ✅ Verify Deployment

1. **Check app is running:**
   ```bash
   pm2 status
   curl http://localhost:3000/api/health
   ```

2. **Test the public URL:**
   ```bash
   curl https://cije.us/bmw/api/health
   ```

3. **Open in browser:**
   - Visit: https://cije.us/bmw
   - Should see the BMW Mental Wellness app

## 🔧 Troubleshooting

### App not accessible

1. Check if app is running:
   ```bash
   pm2 status
   pm2 logs BMW
   ```

2. Check Nginx status:
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

3. Check firewall:
   ```bash
   sudo ufw status
   ```

### SSL Certificate Issues

1. Renew certificate:
   ```bash
   sudo certbot renew
   ```

2. Test renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

### 502 Bad Gateway

This usually means Nginx can't reach the app:

1. Check if app is running on port 3000:
   ```bash
   netstat -tulpn | grep 3000
   ```

2. Check app logs:
   ```bash
   pm2 logs BMW
   ```

3. Restart the app:
   ```bash
   pm2 restart BMW
   ```

## 🔄 Updating the App

After making changes to your app:

```bash
# Pull latest changes
git pull

# Install new dependencies (if any)
npm install

# Restart the app
pm2 restart BMW

# Check logs
pm2 logs BMW
```

## 📊 Monitoring

- **PM2 Dashboard:** `pm2 monit`
- **PM2 Logs:** `pm2 logs BMW`
- **Nginx Access Logs:** `/var/log/nginx/access.log`
- **Nginx Error Logs:** `/var/log/nginx/error.log`

## 🔐 Security Notes

- ✅ SSL certificate auto-renews (Let's Encrypt)
- ✅ Firewall configured (UFW)
- ✅ App runs as non-root user (PM2)
- ✅ Nginx handles SSL termination

## 📝 Files Created

- `deploy-domain.sh` - Automated deployment script
- `setup-nginx.sh` - Nginx setup script
- `setup-nginx-windows.ps1` - Windows setup script
- `nginx-bmw.conf` - Nginx configuration file
- `web.config` - IIS configuration (if using Windows/IIS)

## 🎯 Quick Commands Reference

```bash
# App management
pm2 start ecosystem.config.js --env production
pm2 restart BMW
pm2 stop BMW
pm2 logs BMW
pm2 status

# Nginx management
sudo nginx -t                    # Test config
sudo systemctl reload nginx      # Reload config
sudo systemctl restart nginx     # Restart nginx
sudo systemctl status nginx       # Check status

# SSL management
sudo certbot renew               # Renew certificate
sudo certbot certificates         # List certificates

# Firewall
sudo ufw status                   # Check status
sudo ufw allow 3000/tcp          # Allow port
```

---

**Your app is now live at: https://cije.us/bmw** 🎉

