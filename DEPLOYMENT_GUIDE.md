# 🚀 BMW Deployment Guide

Complete step-by-step instructions for deploying BMW on Windows Server 2022 and Linux Mint.

## Quick Start

### Windows Server 2022 (Interserv VPS)

**Prerequisites:**
- Windows Server 2022 with RDP access
- Administrator rights

**Steps:**

1. Download and extract `bmw-app.zip`

2. Open PowerShell as Administrator and navigate to extracted folder

3. Run the deployment script:
   ```powershell
   .\deploy-windows.bat
   ```

4. Edit `.env` file:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=YourSecurePassword
   PORT=3000
   ```

5. Install MariaDB (if not installed):
   - Download from https://mariadb.org/download/
   - Run installer with default settings

6. Initialize database:
   ```bash
   mysql -u root -pYourSecurePassword < setup.sql
   ```

7. Start the application:
   ```bash
   npm start
   ```

8. Configure Windows Firewall to allow port 3000:
   ```powershell
   netsh advfirewall firewall add rule name="BMW Port 3000" dir=in action=allow protocol=TCP localport=3000
   ```

9. Access application:
   - http://localhost:3000
   - http://YOUR_VPS_IP:3000

10. (Optional) Setup PM2 for auto-restart:
    ```bash
    pm2 start ecosystem.config.js --env production
    pm2 startup
    pm2 save
    ```

---

### Linux Mint / Ubuntu

**Prerequisites:**
- Linux Mint or Ubuntu 20.04+
- sudo access

**Steps:**

1. Extract the ZIP file:
   ```bash
   unzip bmw-app.zip
   cd bmw_app
   ```

2. Run the deployment script:
   ```bash
   chmod +x deploy-linux.sh
   ./deploy-linux.sh
   ```

3. Edit `.env` file:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Update:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=YourSecurePassword
   PORT=3000
   ```

4. Initialize database:
   ```bash
   mysql -u root -pYourSecurePassword < setup.sql
   ```

5. Start MariaDB (if not running):
   ```bash
   sudo systemctl start mariadb
   sudo systemctl enable mariadb
   ```

6. Start the application:
   ```bash
   npm start
   ```

7. Configure firewall:
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

8. Access application:
   - http://localhost:3000
   - http://YOUR_SERVER_IP:3000

9. (Optional) Setup PM2 for auto-restart:
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 startup systemd -u $USER --hp $HOME
   pm2 save
   ```

---

## Post-Deployment Setup

### 1. Enable HTTPS (Recommended)

**Option A: Nginx Reverse Proxy + Let's Encrypt (Linux)**

```bash
sudo apt install nginx certbot python3-certbot-nginx

sudo certbot certonly --standalone -d yourdomain.com

# Create Nginx config
sudo nano /etc/nginx/sites-available/bmw
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bmw /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

**Option B: IIS + Let's Encrypt (Windows)**

1. Install IIS Module for Node.js
2. Configure reverse proxy to localhost:3000
3. Install SSL certificate via Let's Encrypt

### 2. Database Backup

**Windows:**
```powershell
mysqldump -u root -p bmw_db > "C:\backups\bmw_backup_$(Get-Date -Format 'yyyy-MM-dd').sql"
```

**Linux:**
```bash
mysqldump -u root -p bmw_db > ~/backups/bmw_backup_$(date +%Y-%m-%d).sql
```

### 3. Monitor Application

**View Logs:**
```bash
pm2 logs bmw
```

**Monitor Resources:**
```bash
pm2 monit
```

**Restart Application:**
```bash
pm2 restart bmw
```

---

## Production Checklist

- [ ] `.env` configured with strong DB password
- [ ] Firewall rules configured for ports 3000/80/443
- [ ] HTTPS enabled
- [ ] Database backups scheduled
- [ ] PM2 auto-restart configured
- [ ] App accessible from external IP
- [ ] Test registration/login flow
- [ ] Test assessment and plan generation
- [ ] Monitor logs for errors

---

## Troubleshooting

### Connection Refused (Port 3000)
```bash
# Check if app is running
pm2 status

# Check if port is in use
netstat -ano | findstr :3000        # Windows
sudo lsof -i :3000                  # Linux

# View error logs
pm2 logs bmw --err
```

### Database Connection Error
```bash
# Test connection
mysql -u root -p -h localhost

# Check MariaDB status
sudo systemctl status mariadb       # Linux
Get-Service MySQL*                  # Windows

# Verify credentials in .env
cat .env  # Linux
type .env # Windows
```

### Application Slow/Unresponsive
```bash
# Check system resources
pm2 monit

# Check database
mysql -u root -p -e "SHOW PROCESSLIST;"

# Restart application
pm2 restart bmw
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3001

# Restart application
npm start
```

---

## Performance Optimization

### Enable Compression
Already enabled in `server.js` (compression middleware)

### Database Optimization
```bash
mysql -u root -p bmw_db

-- Optimize tables
OPTIMIZE TABLE users;
OPTIMIZE TABLE ra_wellness;

-- Check indexes
SHOW INDEX FROM users;
```

### Scale with PM2
```bash
# Currently set to 'max' instances in ecosystem.config.js
# Monitor with: pm2 monit

# Manual scale
pm2 scale bmw 4
```

---

## Support Resources

- **Node.js**: https://nodejs.org/en/docs/
- **Express.js**: https://expressjs.com/
- **MariaDB**: https://mariadb.com/docs/
- **PM2**: https://pm2.keymetrics.io/docs/
- **Nginx**: https://nginx.org/en/docs/

---

**Last Updated:** January 2026  
**Version:** 1.2.0
