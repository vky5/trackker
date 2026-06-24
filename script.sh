#!/bin/bash

# Clean up any existing processes on ports 3000, 3001, 8080, 8082
echo "Cleaning up existing processes on ports 3000, 3001, 8080, 8082..."
kill -9 $(lsof -t -i:3000) 2>/dev/null || true
kill -9 $(lsof -t -i:3001) 2>/dev/null || true
kill -9 $(lsof -t -i:8080) 2>/dev/null || true
kill -9 $(lsof -t -i:8082) 2>/dev/null || true
sleep 1

# 1. Start Backend API Server (Port 3000)
echo "Starting Backend API Server on port 3000..."
cd server
pnpm run dev > api.log 2>&1 &
cd ..

# 2. Start Demo Website Servers (Ports 8080 and 8082)
echo "Starting Demo Site A Web Server on port 8080..."
python3 -m http.server 8080 > demo.log 2>&1 &

echo "Starting Demo Site B Web Server on port 8082..."
python3 -m http.server 8082 > demoB.log 2>&1 &

# 3. Start Dashboard Frontend (Port 3001)
echo "Starting Dashboard Frontend (Hot Reloading on port 3001)..."
cd dashboard
pnpm run dev > dashboard.log 2>&1 &
cd ..

echo "----------------------------------------"
echo "All processes started in the background!"
echo "- API Log:       server/api.log"
echo "- Demo A Log:    demo.log"
echo "- Demo B Log:    demoB.log"
echo "- Dashboard Log: dashboard/dashboard.log"
echo "----------------------------------------"
