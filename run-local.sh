#!/bin/bash

# Run OMIND.AI Contact Center Platform without Docker
echo "🚀 Starting OMIND.AI Contact Center Platform (Non-Docker Mode)..."
echo "================================================================"

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found. Install with: brew install node"
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check npm
if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm not found. Please install Node.js properly."
    exit 1
fi
echo "✅ npm found: $(npm --version)"

# Check if MongoDB is running (local or cloud)
echo ""
echo "🗄️ Checking MongoDB connection..."

# Setup environment if needed
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env from example..."
    cp backend/.env.example backend/.env
fi

# Check MongoDB URI in .env
MONGODB_URI=$(grep "MONGODB_URI=" backend/.env | cut -d '=' -f2)
if [[ $MONGODB_URI == *"localhost"* ]] || [[ $MONGODB_URI == *"127.0.0.1"* ]]; then
    echo "🔍 Local MongoDB configured. Checking if it's running..."
    if command -v mongosh >/dev/null 2>&1; then
        if mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1; then
            echo "✅ Local MongoDB is running"
        else
            echo "⚠️  Local MongoDB not running. Starting it..."
            if command -v brew >/dev/null 2>&1; then
                brew services start mongodb/brew/mongodb-community || {
                    echo "❌ Failed to start MongoDB. Install with:"
                    echo "   brew tap mongodb/brew"
                    echo "   brew install mongodb-community"
                    echo "   Or use MongoDB Atlas (cloud) and update MONGODB_URI in backend/.env"
                    exit 1
                }
            else
                echo "❌ Please start MongoDB manually or use MongoDB Atlas"
                exit 1
            fi
        fi
    else
        echo "⚠️  mongosh not found. MongoDB might not be installed."
        echo "📖 Options:"
        echo "   1. Install local MongoDB: brew install mongodb-community"
        echo "   2. Use MongoDB Atlas: https://www.mongodb.com/atlas"
        echo "   3. Update MONGODB_URI in backend/.env with your cloud connection string"
    fi
else
    echo "☁️  Cloud MongoDB configured (Atlas/remote)"
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

cd ..

# Start backend in background
echo ""
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 5

# Check if backend started successfully
if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ Backend server started successfully"
else
    echo "⚠️  Backend might still be starting..."
fi

cd ..

# Start frontend
echo ""
echo "🎨 Starting frontend server..."
echo "This will open your browser automatically..."
cd frontend

# Set environment variable to prevent auto-browser opening if desired
# export BROWSER=none

npm start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

cd ..

# Monitor services
echo ""
echo "🌐 Application URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo "Health Check: http://localhost:3001/api/health"

echo ""
echo "👤 Demo Login Credentials:"
echo "Email: demo@omind.ai"
echo "Password: demo123"

echo ""
echo "🤖 AI Provider Status:"
if grep -q "OPENAI_API_KEY=" backend/.env && ! grep -q "^#.*OPENAI_API_KEY=" backend/.env; then
    echo "✅ OpenAI configured"
elif grep -q "HUGGINGFACE_API_KEY=" backend/.env && ! grep -q "^#.*HUGGINGFACE_API_KEY=" backend/.env; then
    echo "✅ Hugging Face configured"
elif grep -q "OLLAMA_URL=" backend/.env && ! grep -q "^#.*OLLAMA_URL=" backend/.env; then
    echo "✅ Ollama configured"
else
    echo "ℹ️  Using Mock AI provider (perfect for development)"
fi

echo ""
echo "🔧 Management Commands:"
echo "Stop backend: kill $BACKEND_PID"
echo "Stop frontend: kill $FRONTEND_PID"
echo "Stop both: kill $BACKEND_PID $FRONTEND_PID"
echo "Or use Ctrl+C in terminal where each is running"

echo ""
echo "✨ Application started successfully!"
echo "📝 Logs will appear in terminal. Use Ctrl+C to stop services."

# Wait for user input to stop
echo ""
echo "Press Enter to stop all services or Ctrl+C to keep running..."
read

# Cleanup
echo "🛑 Stopping services..."
kill $BACKEND_PID 2>/dev/null || true
kill $FRONTEND_PID 2>/dev/null || true
echo "✅ Services stopped"
