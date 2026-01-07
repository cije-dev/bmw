# 🌟 BMW - Better Mental Wellness

A comprehensive web application helping users improve mental health through personalized wellness plans based on scientific assessments.

## 📋 Features

- **sc-wellness Assessment**: 5-question mental health screening (validated questionnaire)
- **Personalized ra-wellness Plans**: Customized activity recommendations based on assessment scores
- **Secure User Profiles**: Password-protected accounts with score history tracking
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Production-Ready**: PM2 cluster mode, compression, security headers

## 🏗️ Architecture

```
Frontend: HTML5 + CSS3 + Vanilla JavaScript
Backend: Node.js + Express.js
Database: MariaDB
Auth: bcrypt password hashing
Deployment: PM2 + Nginx (optional)
```

## 📦 Installation

### Windows Server 2022 (Interserv VPS)

1. Download and extract the ZIP file
2. Run as Administrator:
   ```bash
   deploy-windows.bat
   ```
3. Edit `.env` with your database credentials
4. Install MariaDB: https://mariadb.org/download/
5. Initialize database:
   ```bash
   mysql -u root -p < setup.sql
   ```
6. Start the app:
   ```bash
   npm start
   ```
   Or with PM2:
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

### Linux Mint / Ubuntu

1. Extract the ZIP file
2. Run the deployment script:
   ```bash
   chmod +x deploy-linux.sh
   ./deploy-linux.sh
   ```
3. Edit `.env` with your database credentials
4. Initialize database:
   ```bash
   sudo mysql -u root -p < setup.sql
   ```
5. Start the app:
   ```bash
   npm start
   ```
   Or with PM2:
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   ```

## 🔧 Configuration

### Environment Variables (.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bmw_db
PORT=3000
NODE_ENV=production
INIT_DB=false
```

## 🚀 Deployment

### Windows Server 2022

1. Install Node.js LTS and MariaDB
2. Configure Windows Firewall:
   ```powershell
   netsh advfirewall firewall add rule name="BMW" dir=in action=allow protocol=TCP localport=3000
   ```
3. Use PM2 for auto-restart:
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 startup
   pm2 save
   ```

### Linux Mint/Ubuntu

1. System packages installed by deploy-linux.sh
2. Configure UFW Firewall:
   ```bash
   sudo ufw allow 3000,80,443
   sudo ufw enable
   ```
3. Use PM2 systemd integration:
   ```bash
   pm2 startup systemd -u $USER --hp $HOME
   pm2 save
   ```
4. (Optional) Setup Nginx reverse proxy for port 80

## 📊 Assessment Details

### sc-wellness Questions (Score 0-20)

1. Little interest or pleasure in doing things?
2. Feeling down, depressed, or hopeless?
3. Trouble falling/staying asleep, or sleeping too much?
4. Feeling nervous, anxious, or on edge?
5. Unable to stop or control worrying?

**Scoring:**
- 0-4: Minimal symptoms ✅
- 5-9: Mild symptoms 👍
- 10-14: Moderate symptoms 📈
- 15-20: Severe symptoms ⚠️

### ra-wellness Activities

**6 Evidence-Based Activities** with recommendations based on assessment level:

- Physical activity (exercise, walking)
- Mindfulness/meditation
- Social connection
- Restorative sleep
- Gratitude/journaling
- Healthy eating

## 📝 API Endpoints

```
POST   /api/register          - Create account
POST   /api/login             - User authentication
GET    /api/profile/:id       - Get user profile
POST   /api/score/:id         - Save assessment score
GET    /api/plan/:score       - Get personalized plan
```

## 🔐 Security

- Passwords hashed with bcrypt (12 rounds)
- CORS enabled for controlled access
- Helmet.js for security headers
- SQL injection prevention via parameterized queries
- HTTPS ready (use reverse proxy)

## 📱 Mobile Support

- Progressive Web App (PWA) ready
- Responsive design (mobile-first)
- Works offline (with caching)

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
Solution: Ensure MariaDB is running
- Windows: Check Services (services.msc)
- Linux: `sudo systemctl start mariadb`

### Port 3000 Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
Solution: Change PORT in .env or kill process using port 3000

### PM2 Logs
```bash
pm2 logs bmw          # View logs
pm2 monit             # Monitor resources
pm2 restart bmw       # Restart app
```

## 📚 Documentation

- sc-wellness: Based on PHQ-9 and GAD-7 screening tools
- ra-wellness: NHS, APA evidence-based recommendations
- Node.js: https://nodejs.org/
- Express: https://expressjs.com/
- MariaDB: https://mariadb.org/

## 📄 License

MIT License - Open source and free to use

## 👨‍💼 Support

For issues or questions:
1. Check logs: `pm2 logs bmw`
2. Verify .env configuration
3. Ensure database is initialized
4. Check firewall rules

## 🎯 Roadmap

- [ ] Mobile app (React Native/Flutter)
- [ ] AI-powered insights
- [ ] Integration with wearables
- [ ] Therapist dashboard
- [ ] Video content library

---

**Version**: 1.2.0  
**Last Updated**: January 2026  
**Status**: Production Ready ✅
