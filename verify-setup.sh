#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verifying Confirmation App Setup${NC}"

# Check if servers are running
echo -e "${YELLOW}Checking servers...${NC}"

# Check backend
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend server is running on port 3001${NC}"
else
    echo -e "${RED}❌ Backend server is not running${NC}"
    exit 1
fi

# Check frontend
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✅ Frontend server is running on port 5173${NC}"
else
    echo -e "${RED}❌ Frontend server is not running${NC}"
    exit 1
fi

# Test API endpoints
echo -e "${YELLOW}Testing API endpoints...${NC}"

# Test registration
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"verify@example.com","password":"password123","name":"Verify User"}')

if echo "$REGISTER_RESPONSE" | grep -q "User created successfully"; then
    echo -e "${GREEN}✅ User registration works${NC}"
else
    echo -e "${RED}❌ User registration failed${NC}"
    echo "Response: $REGISTER_RESPONSE"
fi

# Test login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"verify@example.com","password":"password123"}')

if echo "$LOGIN_RESPONSE" | grep -q "Login successful"; then
    echo -e "${GREEN}✅ User login works${NC}"
else
    echo -e "${RED}❌ User login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
fi

echo -e "${GREEN}🎉 Setup verification complete!${NC}"
echo -e "${BLUE}Frontend: http://localhost:5173${NC}"
echo -e "${BLUE}Backend API: http://localhost:3001/api${NC}"
echo -e "${YELLOW}You can now use the application!${NC}"
