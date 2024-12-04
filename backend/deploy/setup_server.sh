#!/bin/bash

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
fi

# Setup Nginx configuration
sudo cp /app/deploy/nginx.conf /etc/nginx/sites-available/tradeviewpro
sudo ln -sf /etc/nginx/sites-available/tradeviewpro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Install Certbot for SSL
sudo apt-get install -y certbot python3-certbot-nginx

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Setup SSL certificate
sudo certbot --nginx -d alpacatrader.nuworldagency.com --non-interactive --agree-tos --email admin@nuworldagency.com

# Start the application
cd /app
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "Deployment completed successfully!"
