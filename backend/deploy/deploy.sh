#!/bin/bash

# Load environment variables
source .env

# Create deployment directory
ssh $SSH_USER@$VPS_IP "mkdir -p /app"

# Copy files to server
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '__pycache__' \
    ./ $SSH_USER@$VPS_IP:/app/

# Execute setup script on server
ssh $SSH_USER@$VPS_IP "bash /app/deploy/setup_server.sh"

echo "Deployment completed! Your API should be available at https://$DOMAIN"
