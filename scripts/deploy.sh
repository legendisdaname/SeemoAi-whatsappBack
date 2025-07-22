#!/bin/bash

# Production Deployment Script for WhatsApp API Backend
set -e

echo "🚀 Starting production deployment..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run as root"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from env.example"
    exit 1
fi

# Check if API_KEY is set and not default
if grep -q "default-dev-key-change-in-production" .env; then
    echo "❌ Please change the default API key in .env file"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Create production directories
echo "📁 Creating production directories..."
mkdir -p sessions uploads logs
chmod 755 sessions uploads logs

# Set up PM2 if available
if command -v pm2 &> /dev/null; then
    echo "📋 Setting up PM2 process manager..."
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'whatsapp-api',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

    echo "✅ PM2 configuration created"
else
    echo "⚠️  PM2 not found. Consider installing it for production: npm install -g pm2"
fi

# Create systemd service file (if running as root)
if [ "$EUID" -eq 0 ]; then
    echo "📋 Creating systemd service..."
    
    cat > /etc/systemd/system/whatsapp-api.service << EOF
[Unit]
Description=WhatsApp API Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable whatsapp-api
    echo "✅ Systemd service created and enabled"
fi

# Run tests
echo "🧪 Running tests..."
npm test

echo "✅ Production deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Start the service:"
if command -v pm2 &> /dev/null; then
    echo "   pm2 start ecosystem.config.js"
else
    echo "   npm start"
fi
echo "2. Check logs:"
echo "   tail -f logs/app.log"
echo "3. Monitor health:"
echo "   curl https://platform.seemoai.com/api/health"
echo ""
echo "🔗 API Documentation: https://platform.seemoai.com/api-docs" 