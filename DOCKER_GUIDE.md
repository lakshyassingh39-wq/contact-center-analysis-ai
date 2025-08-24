# 🐳 Running OMIND.AI Contact Center Platform with Docker

## Quick Start (3 Simple Steps)

### 1. **Ensure Docker is Running**
```bash
# Check if Docker is running
docker info

# If not running, start Docker Desktop
open -a Docker  # macOS
# Or start Docker Desktop from Applications
```

### 2. **Configure Environment (Optional)**
```bash
# The app works immediately with default settings
# Optional: Copy environment file for customization
cp .env.example .env

# Edit .env if you want to use real AI providers:
# - Hugging Face: HUGGINGFACE_API_KEY=your_token
# - OpenAI: OPENAI_API_KEY=your_key
# - Ollama: OLLAMA_URL=http://host.docker.internal:11434
```

### 3. **Start the Application**
```bash
# Build and start all services
docker-compose up --build

# Or run in background (detached mode)
docker-compose up --build -d
```

## 🌐 **Access Your Application**

Once started, access these URLs:

- **Frontend (Main App)**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

## 👤 **Demo Login**

Use these credentials to test the application:
- **Email**: `demo@omind.ai`
- **Password**: `demo123`

## 🔧 **Docker Management Commands**

### **View Running Services**
```bash
# Check status of all services
docker-compose ps

# View logs from all services
docker-compose logs

# View logs from specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
```

### **Stop Services**
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Stop and remove everything (images, containers, volumes)
docker-compose down -v --remove-orphans --rmi all
```

### **Restart Services**
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up --build --force-recreate
```

## 🔍 **Monitoring & Debugging**

### **Check Service Health**
```bash
# Check container health status
docker-compose ps

# Check individual container logs
docker logs omind-backend
docker logs omind-frontend
docker logs omind-mongodb
```

### **Access Container Shell**
```bash
# Access backend container
docker exec -it omind-backend bash

# Access MongoDB container
docker exec -it omind-mongodb mongosh

# Access frontend container (if needed)
docker exec -it omind-frontend sh
```

### **Test Endpoints**
```bash
# Test backend health
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:3000

# Test MongoDB connection
docker exec omind-mongodb mongosh --eval "db.runCommand('ping')"
```

## 🔄 **Development Workflow**

### **Code Changes**
When you make code changes:

```bash
# For backend changes
docker-compose restart backend

# For frontend changes (with hot reload)
# No restart needed - changes are auto-detected

# For major changes
docker-compose down
docker-compose up --build
```

### **Database Management**
```bash
# Access MongoDB shell
docker exec -it omind-mongodb mongosh omind-ai-contact-center

# Backup database
docker exec omind-mongodb mongodump --out /tmp/backup

# Reset database (fresh start)
docker-compose down -v
docker-compose up -d mongodb
# Wait for MongoDB to initialize, then start other services
docker-compose up backend frontend
```

## 🚀 **Production Deployment**

### **Build for Production**
```bash
# Build optimized images
docker-compose -f docker-compose.yml build --no-cache

# Run in production mode
NODE_ENV=production docker-compose up -d
```

### **Environment Variables for Production**
```bash
# Set in .env file:
NODE_ENV=production
MONGODB_URI=mongodb://admin:password123@mongodb:27017/omind-ai-contact-center?authSource=admin
JWT_SECRET=your-super-secure-production-secret
REACT_APP_API_URL=http://your-domain.com:5000

# For real AI (choose one):
OPENAI_API_KEY=your-openai-key
# OR
HUGGINGFACE_API_KEY=your-huggingface-token
# OR
OLLAMA_URL=http://localhost:11434
```

## 📊 **Service Configuration Overview**

Your `docker-compose.yml` includes:

### **MongoDB (Database)**
- **Port**: 27017
- **Credentials**: admin/password123
- **Database**: omind-ai-contact-center
- **Volume**: Persistent data storage

### **Backend (API Server)**
- **Port**: 5000
- **Framework**: Node.js/Express
- **Features**: AI processing, file uploads, authentication
- **Health Check**: Built-in monitoring

### **Frontend (React App)**
- **Port**: 3000
- **Framework**: React 18
- **Features**: Modern UI, real-time updates
- **Hot Reload**: Enabled for development

## ⚠️ **Troubleshooting**

### **Common Issues & Solutions**

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :3000  # Frontend
   lsof -i :5000  # Backend
   lsof -i :27017 # MongoDB
   
   # Kill processes if needed
   sudo kill -9 <PID>
   ```

2. **Docker Daemon Not Running**
   ```bash
   # Start Docker Desktop
   open -a Docker
   
   # Verify it's running
   docker info
   ```

3. **Build Failures**
   ```bash
   # Clean build (removes cache)
   docker-compose build --no-cache
   
   # Remove old images
   docker image prune -f
   
   # Complete reset
   docker system prune -a
   ```

4. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   
   # Restart MongoDB
   docker-compose restart mongodb
   
   # Reset MongoDB data
   docker-compose down -v
   docker-compose up -d mongodb
   ```

5. **Frontend Not Loading**
   ```bash
   # Check if backend is responding
   curl http://localhost:5000/api/health
   
   # Check frontend logs
   docker-compose logs frontend
   
   # Clear browser cache and try again
   ```

## 💡 **Performance Tips**

1. **Speed Up Builds**
   ```bash
   # Use Docker BuildKit
   DOCKER_BUILDKIT=1 docker-compose build
   
   # Cache node_modules in images
   # (Already configured in Dockerfiles)
   ```

2. **Monitor Resource Usage**
   ```bash
   # Check Docker resource usage
   docker stats
   
   # Check disk usage
   docker system df
   ```

3. **Optimize for Development**
   ```bash
   # Use bind mounts for faster development
   # (Already configured in docker-compose.yml)
   
   # Run only necessary services
   docker-compose up mongodb backend  # Skip frontend if developing separately
   ```

## 🎯 **Next Steps After Starting**

1. **Open**: http://localhost:3000
2. **Login**: demo@omind.ai / demo123
3. **Upload**: Try uploading an audio file
4. **Explore**: Check the AI analysis and coaching features
5. **Develop**: Make changes and see them reflected immediately

## 📚 **Additional Resources**

- **Docker Troubleshooting**: See `DOCKER_TROUBLESHOOTING.md`
- **AI Provider Setup**: See `AI_PROVIDER_SETUP.md`
- **API Documentation**: Available at http://localhost:5000/api/docs (when running)
- **Local Development**: Use `./run-local.sh` for non-Docker setup

---

**Ready to start?** Just run:
```bash
docker-compose up --build
```

Then open http://localhost:3000 and login with demo@omind.ai / demo123! 🚀
