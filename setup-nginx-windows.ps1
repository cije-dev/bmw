# PowerShell script to setup reverse proxy for https://cije.us/bmw on Windows
# Requires: Nginx for Windows or IIS with URL Rewrite module

Write-Host "🌐 Setting up reverse proxy for https://cije.us/bmw" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Please run as Administrator" -ForegroundColor Red
    exit 1
}

$APP_PORT = 3000
$DOMAIN = "cije.us"
$PATH_PREFIX = "/bmw"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Domain: $DOMAIN"
Write-Host "   Path: $PATH_PREFIX"
Write-Host "   Local Port: $APP_PORT"
Write-Host ""

# Option 1: Nginx for Windows
Write-Host "Option 1: Using Nginx for Windows" -ForegroundColor Green
Write-Host ""

$nginxPath = "C:\nginx"
if (-not (Test-Path $nginxPath)) {
    Write-Host "📦 Nginx not found at $nginxPath" -ForegroundColor Yellow
    Write-Host "   Download Nginx for Windows from: http://nginx.org/en/download.html" -ForegroundColor Yellow
    Write-Host "   Extract to C:\nginx" -ForegroundColor Yellow
    Write-Host ""
    $installNginx = Read-Host "Do you want to download Nginx now? (y/n)"
    if ($installNginx -eq "y") {
        Write-Host "Downloading Nginx..."
        $nginxUrl = "http://nginx.org/download/nginx-1.24.0.zip"
        $zipPath = "$env:TEMP\nginx.zip"
        Invoke-WebRequest -Uri $nginxUrl -OutFile $zipPath
        Expand-Archive -Path $zipPath -DestinationPath "C:\" -Force
        Rename-Item -Path "C:\nginx-1.24.0" -NewName "nginx"
        Remove-Item $zipPath
        Write-Host "✅ Nginx downloaded to C:\nginx" -ForegroundColor Green
    }
}

if (Test-Path "$nginxPath\conf\nginx.conf") {
    Write-Host "📝 Creating Nginx configuration..." -ForegroundColor Yellow
    
    $nginxConfig = @"
# BMW Mental Wellness App - Reverse Proxy Configuration
# Add this inside the http { } block in nginx.conf

server {
    listen 80;
    server_name $DOMAIN;
    
    location $PATH_PREFIX {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
        
        # Remove /bmw prefix when forwarding
        rewrite ^$PATH_PREFIX/?(.*) /`$1 break;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
"@
    
    $configFile = "$nginxPath\conf\bmw.conf"
    $nginxConfig | Out-File -FilePath $configFile -Encoding UTF8
    
    Write-Host "✅ Configuration saved to: $configFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Edit C:\nginx\conf\nginx.conf"
    Write-Host "   2. Add this line inside the http { } block:"
    Write-Host "      include bmw.conf;"
    Write-Host "   3. Test configuration: C:\nginx\nginx.exe -t"
    Write-Host "   4. Start Nginx: C:\nginx\nginx.exe"
    Write-Host ""
    Write-Host "🔒 For SSL (HTTPS):" -ForegroundColor Yellow
    Write-Host "   Use Cloudflare or install certbot-win32"
    Write-Host "   Or use IIS with URL Rewrite module (see below)"
    Write-Host ""
}

# Option 2: IIS with URL Rewrite
Write-Host "Option 2: Using IIS with URL Rewrite" -ForegroundColor Green
Write-Host ""

$iisConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="BMW Reverse Proxy" stopProcessing="true">
                    <match url="^bmw/?(.*)" />
                    <action type="Rewrite" url="http://localhost:$APP_PORT/{R:1}" />
                    <serverVariables>
                        <set name="HTTP_X_FORWARDED_PROTO" value="https" />
                        <set name="HTTP_X_REAL_IP" value="{REMOTE_ADDR}" />
                    </serverVariables>
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
"@

$iisConfigFile = "web.config"
$iisConfig | Out-File -FilePath $iisConfigFile -Encoding UTF8

Write-Host "✅ IIS web.config created: $iisConfigFile" -ForegroundColor Green
Write-Host ""
Write-Host "📝 For IIS setup:" -ForegroundColor Yellow
Write-Host "   1. Install IIS and URL Rewrite module"
Write-Host "   2. Create a site for $DOMAIN"
Write-Host "   3. Place web.config in the site root"
Write-Host "   4. Configure SSL certificate in IIS"
Write-Host ""

Write-Host "🎉 Configuration files created!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Important:" -ForegroundColor Yellow
Write-Host "   - Make sure your app is running on port $APP_PORT"
Write-Host "   - Configure DNS: Point $DOMAIN to your server IP"
Write-Host "   - Set up SSL certificate for HTTPS"
Write-Host "   - Test: https://$DOMAIN$PATH_PREFIX"
Write-Host ""

