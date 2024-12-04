#!/bin/bash

# Install dependencies for both frontend and backend
echo "Installing dependencies..."
cd frontend && npm install
cd ../backend && pip install -r requirements.txt

# Build the frontend
echo "Building frontend..."
cd ../frontend && npm run build

# Start both services
echo "Starting services..."
# Start the backend API in the background
cd ../backend && python -m uvicorn main:app --host 0.0.0.0 --port 8080 &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 5

# Start the frontend
cd ../frontend && PORT=3000 npm start

# If frontend exits, kill the backend
kill $BACKEND_PID
