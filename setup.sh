#!/bin/bash

# OMIND.AI Contact Center Platform Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up OMIND.AI Contact Center Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your OpenAI API key before running the application."
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/uploads
mkdir -p backend/logs
mkdir -p scripts

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -f package-lock.json ]; then
    npm install
fi
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -f package-lock.json ]; then
    npm install
fi
cd ..

echo "✅ Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Edit .env file and add your OpenAI API key"
echo "2. Run: docker-compose up --build"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Use demo login: demo@omind.ai / password"
echo ""
echo "📚 For more information, see README.md"
