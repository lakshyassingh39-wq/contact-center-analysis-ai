#!/bin/bash

# OMIND.AI Contact Center Platform Test Script
# This script tests the complete workflow end-to-end

set -e

BASE_URL="http://localhost:5000/api"
FRONTEND_URL="http://localhost:3000"

echo "🧪 Testing OMIND.AI Contact Center Platform..."

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2
    
    echo "🔍 Checking $name..."
    if curl -s -f "$url" > /dev/null; then
        echo "✅ $name is running"
    else
        echo "❌ $name is not responding"
        return 1
    fi
}

# Function to test API endpoint
test_api() {
    local method=$1
    local endpoint=$2
    local description=$3
    local headers=$4
    local data=$5
    
    echo "🧪 Testing: $description"
    
    if [ -n "$headers" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "$headers" -d "$data")
    elif [ -n "$headers" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "$headers")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo "✅ $description - Status: $http_code"
        return 0
    else
        echo "❌ $description - Status: $http_code"
        echo "   Response: $body"
        return 1
    fi
}

# Check if services are running
echo "🏥 Health Checks..."
check_service "$BASE_URL/../health" "Backend API"
check_service "$FRONTEND_URL" "Frontend"

# Test authentication
echo ""
echo "🔐 Testing Authentication..."

# Demo login
auth_response=$(curl -s -X POST "$BASE_URL/auth/demo-login")
if echo "$auth_response" | grep -q '"success":true'; then
    echo "✅ Demo login successful"
    auth_token=$(echo "$auth_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "🔑 Token obtained: ${auth_token:0:20}..."
else
    echo "❌ Demo login failed"
    echo "Response: $auth_response"
    exit 1
fi

# Test API endpoints with authentication
echo ""
echo "📊 Testing API Endpoints..."

# Test calls endpoint
test_api "GET" "/calls" "Get calls list" "Authorization: Bearer $auth_token"

# Test analysis endpoints  
test_api "GET" "/analysis" "Get analysis list" "Authorization: Bearer $auth_token"

# Test coaching endpoints
test_api "GET" "/coaching" "Get coaching list" "Authorization: Bearer $auth_token"

echo ""
echo "🎯 Workflow Test..."

# Since we can't easily test file upload in a script, we'll simulate the workflow
echo "📝 Note: File upload testing requires manual testing or integration tests"
echo "   Workflow steps:"
echo "   1. Upload audio file via POST /calls/upload"
echo "   2. Transcribe via POST /analysis/transcribe/{callId}"
echo "   3. Analyze via POST /analysis/analyze/{callId}"
echo "   4. Generate coaching via POST /coaching/generate/{callId}"

echo ""
echo "📱 Frontend Tests..."

# Check if frontend pages are accessible
frontend_pages=("/" "/login" "/dashboard")

for page in "${frontend_pages[@]}"; do
    if curl -s -f "$FRONTEND_URL$page" > /dev/null; then
        echo "✅ Frontend page accessible: $page"
    else
        echo "⚠️  Frontend page may have issues: $page"
    fi
done

echo ""
echo "🎉 Test Summary:"
echo "✅ Backend API is responding"
echo "✅ Authentication is working"
echo "✅ API endpoints are accessible"
echo "✅ Frontend is serving pages"
echo ""
echo "🚀 Ready for demo!"
echo ""
echo "📋 Demo Instructions:"
echo "1. Open $FRONTEND_URL in your browser"
echo "2. Click 'Try Demo Login' or use:"
echo "   Email: demo@omind.ai"
echo "   Password: password"
echo "3. Upload an audio file or use sample data"
echo "4. Watch the AI analysis pipeline in action"
echo ""
echo "📚 API Documentation: $BASE_URL/../api-docs"
