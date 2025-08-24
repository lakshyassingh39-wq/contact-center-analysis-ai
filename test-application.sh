#!/bin/bash

# OMIND.AI Contact Center Platform - Application Test Script
# This script runs basic tests to verify the application is working correctly

echo "🚀 Starting OMIND.AI Contact Center Platform Tests..."
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if docker-compose file exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Run this script from the project root."
    exit 1
fi

echo "✅ docker-compose.yml found"

# Check AI provider configuration
echo ""
echo "🤖 Checking AI Provider Configuration..."
if [ -f "backend/.env" ]; then
    if grep -q "OPENAI_API_KEY=" backend/.env && ! grep -q "^#.*OPENAI_API_KEY=" backend/.env; then
        echo "✅ OpenAI provider configured"
        AI_PROVIDER="OpenAI"
    elif grep -q "HUGGINGFACE_API_KEY=" backend/.env && ! grep -q "^#.*HUGGINGFACE_API_KEY=" backend/.env; then
        echo "✅ Hugging Face provider configured"
        AI_PROVIDER="Hugging Face"
    elif grep -q "OLLAMA_URL=" backend/.env && ! grep -q "^#.*OLLAMA_URL=" backend/.env; then
        echo "✅ Ollama provider configured"
        AI_PROVIDER="Ollama (Local)"
    else
        echo "ℹ️  Using Mock AI provider (development mode)"
        AI_PROVIDER="Mock (Development)"
    fi
else
    echo "ℹ️  No .env file found - using Mock AI provider (development mode)"
    AI_PROVIDER="Mock (Development)"
fi

# Build and start the application
echo ""
echo "🔨 Building and starting the application..."
docker-compose down --remove-orphans
docker-compose up --build -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 15

# Check if MongoDB is running
echo ""
echo "🔍 Checking MongoDB connection..."
if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB is running"
else
    echo "❌ MongoDB connection failed"
fi

# Check if backend is running
echo ""
echo "🔍 Checking Backend API..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend API is running (Status: $BACKEND_STATUS)"
else
    echo "❌ Backend API is not responding (Status: $BACKEND_STATUS)"
fi

# Check if frontend is running
echo ""
echo "🔍 Checking Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is running (Status: $FRONTEND_STATUS)"
else
    echo "❌ Frontend is not responding (Status: $FRONTEND_STATUS)"
fi

# Test API endpoints
echo ""
echo "🧪 Testing API Endpoints..."

# Test auth endpoint
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/login || echo "000")
if [ "$AUTH_STATUS" = "405" ] || [ "$AUTH_STATUS" = "400" ]; then
    echo "✅ Auth endpoint is accessible"
else
    echo "❌ Auth endpoint issue (Status: $AUTH_STATUS)"
fi

# Test calls endpoint (should require auth)
CALLS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/calls || echo "000")
if [ "$CALLS_STATUS" = "401" ]; then
    echo "✅ Calls endpoint is protected (requires auth)"
else
    echo "⚠️  Calls endpoint status: $CALLS_STATUS"
fi

echo ""
echo "📊 Test Summary:"
echo "=============================================="
echo "MongoDB: $([ -n "$(docker-compose ps -q mongodb)" ] && echo "✅ Running" || echo "❌ Not running")"
echo "Backend:  $([ "$BACKEND_STATUS" = "200" ] && echo "✅ Running" || echo "❌ Not running")"
echo "Frontend: $([ "$FRONTEND_STATUS" = "200" ] && echo "✅ Running" || echo "❌ Not running")"
echo "AI Provider: $AI_PROVIDER"

echo ""
echo "🌐 Application URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo "API Health: http://localhost:3001/api/health"

echo ""
echo "👤 Demo Login Credentials:"
echo "Email: demo@omind.ai"
echo "Password: demo123"

echo ""
echo "🤖 AI Provider Information:"
echo "Current Provider: $AI_PROVIDER"
if [ "$AI_PROVIDER" = "Mock (Development)" ]; then
    echo "📖 To use real AI models, see: AI_PROVIDER_SETUP.md"
    echo "   - Hugging Face (Free): Get token from https://huggingface.co/settings/tokens"
    echo "   - Ollama (Local): Install with 'brew install ollama'"
    echo "   - OpenAI (Paid): Get API key from https://platform.openai.com/api-keys"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Login with the demo credentials"
echo "3. Upload an audio file to test the AI pipeline"
echo "4. Check real-time processing updates"
echo "5. Review analysis results and coaching plans"

echo ""
echo "🔧 Useful Commands:"
echo "- View logs: docker-compose logs -f"
echo "- Stop services: docker-compose down"
echo "- Restart: docker-compose restart"
echo "- Clean up: docker-compose down -v --remove-orphans"

echo ""
echo "✨ Test completed! $(date)"
