# Docker Troubleshooting & Alternatives

## 🐳 Docker Issues & Solutions

### Problem: "Cannot connect to the Docker daemon"

**Solution Steps:**

1. **Start Docker Desktop:**
   ```bash
   open -a Docker
   # Wait for Docker Desktop to fully start (look for whale icon in menu bar)
   ```

2. **Verify Docker is running:**
   ```bash
   docker info
   # Should show server information without errors
   ```

3. **Alternative: Start from Command Line:**
   ```bash
   # On macOS
   sudo launchctl start com.docker.docker

   # Or restart Docker service
   sudo killall Docker && open /Applications/Docker.app
   ```

### Common Docker Issues:

1. **Docker Desktop not installed:**
   ```bash
   # Install via Homebrew
   brew install --cask docker
   
   # Or download from: https://www.docker.com/products/docker-desktop
   ```

2. **Insufficient resources:**
   - Open Docker Desktop → Settings → Resources
   - Increase memory to at least 4GB
   - Increase CPU to 2+ cores

3. **Port conflicts:**
   ```bash
   # Check what's using the ports
   lsof -i :3000  # Frontend
   lsof -i :3001  # Backend
   lsof -i :27017 # MongoDB
   
   # Kill processes if needed
   sudo kill -9 <PID>
   ```

## 🏃‍♂️ Run Without Docker (Alternative)

If Docker continues to have issues, you can run the application directly:

### Prerequisites:
```bash
# Install Node.js
brew install node

# Install MongoDB (or use MongoDB Atlas cloud)
brew tap mongodb/brew
brew install mongodb-community

# Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas
```

### Setup Steps:

1. **Start MongoDB:**
   ```bash
   # Local MongoDB
   brew services start mongodb/brew/mongodb-community
   
   # Or use MongoDB Atlas and update MONGODB_URI in .env
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   
   # Edit .env file:
   # MONGODB_URI=mongodb://localhost:27017/omind-ai-contact-center
   # PORT=3001
   
   # Start backend
   npm run dev
   ```

3. **Setup Frontend (in new terminal):**
   ```bash
   cd frontend
   npm install
   
   # Start frontend
   npm start
   ```

4. **Access Application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Environment Configuration for Local Development:

```bash
# backend/.env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/omind-ai-contact-center
JWT_SECRET=your-jwt-secret-here

# AI Provider (choose one):
# HUGGINGFACE_API_KEY=your_token_here  # Free option
# OLLAMA_URL=http://localhost:11434    # Local AI
# No key = Mock AI (development)
```

## 🔧 Quick Docker Fixes

### Reset Docker:
```bash
# Remove all containers and images
docker system prune -a

# Reset Docker Desktop
# Docker Desktop → Troubleshoot → Reset to factory defaults
```

### Check Docker Status:
```bash
# Check if Docker daemon is running
docker version

# Check running containers
docker ps

# Check Docker disk usage
docker system df
```

### Restart Docker Services:
```bash
# Restart your application
docker-compose down
docker-compose up --build

# Or with force recreation
docker-compose down --remove-orphans
docker-compose up --build --force-recreate
```

## 🚀 Quick Test Commands

### With Docker:
```bash
# Test the full application
./test-application.sh

# Check AI providers
./test-ai-providers.sh
```

### Without Docker:
```bash
# Test backend
curl http://localhost:3001/api/health

# Test MongoDB connection
mongosh omind-ai-contact-center --eval "db.runCommand('ping')"
```

## 📞 Still Having Issues?

1. **Check System Requirements:**
   - macOS 10.15+ (for Docker Desktop)
   - 4GB+ RAM available
   - 10GB+ disk space

2. **Alternative Solutions:**
   - Use GitHub Codespaces or similar cloud IDE
   - Use MongoDB Atlas instead of local MongoDB
   - Deploy to platforms like Railway, Render, or Heroku

3. **Simplified Development:**
   - Use only the Mock AI provider (no external dependencies)
   - Use SQLite instead of MongoDB (requires code changes)
   - Run frontend only with mock data

## 💡 Pro Tips

- **Keep Docker Desktop running** in the background for development
- **Use Docker Desktop dashboard** to monitor containers
- **Set Docker to start automatically** on system boot
- **Regularly clean up** unused Docker images and containers
