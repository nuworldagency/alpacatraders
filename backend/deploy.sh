#!/bin/bash

# Pull latest changes
git pull

# Build and start containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Show logs
docker-compose logs -f
