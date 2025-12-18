#!/bin/bash

# Script to run all microservices in the background

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Microservices Stack...${NC}"

# Kill existing services if any
pkill -f "catalog-service/server.js" || true
pkill -f "inventory-service/server.js" || true
pkill -f "pricing-service/server.js" || true
pkill -f "reviews-service/server.js" || true
pkill -f "gateway/server.js" || true

# Helper to start service
start_service() {
    local dir=$1
    local port=$2
    echo "Starting $dir on port $port..."
    (cd "$dir" && node server.js > server.log 2>&1 &)
}

# Start Services
start_service "catalog-service" 3001
start_service "inventory-service" 3002
start_service "pricing-service" 3003
start_service "reviews-service" 3004
start_service "gateway" 3000

echo -e "${GREEN}Stack initialized. Checking health in 5s...${NC}"
sleep 5

# Check if ports are open
lsof -i :3000,3001,3002,3003,3004

echo -e "${GREEN}All services should be running at http://localhost:3000${NC}"
