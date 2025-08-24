# OMIND.AI Contact Center Platform

A comprehensive AI-powered contact center analysis platform built with the MERN stack. This application provides intelligent call transcription, quality analysis, and personalized coaching plans using **open-source AI models** for complete data privacy and cost efficiency.

## 🚀 Features

### Core Functionality
- **🎙️ Audio Upload & Processing**: Upload call recordings in multiple formats (MP3, WAV, M4A)
- **📝 AI Transcription**: Automatic speech-to-text conversion using open-source Whisper models
- **🧠 Intelligent Analysis**: Call quality assessment with detailed scoring and insights using open-source LLMs
- **👨‍🏫 Personalized Coaching**: Custom training plans with resources and assessments tailored to agent performance
- **⚡ Real-time Updates**: Live progress tracking during AI processing with Socket.io
- **📊 Comprehensive Dashboard**: Overview of all calls, analyses, and progress tracking

### Technical Features
- **🔐 JWT Authentication**: Secure user authentication and session management
- **🐳 Docker Orchestration**: Complete containerized deployment
- **📱 Responsive Design**: Mobile-first UI with Tailwind CSS
- **🔄 RESTful API**: Well-structured backend with comprehensive endpoints
- **📈 Progress Tracking**: Detailed analytics and completion metrics
- **🗄️ MongoDB Integration**: Robust data persistence and relationships

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│  Express API    │────│    MongoDB      │
│                 │    │                 │    │                 │
│ - Login/Auth    │    │ - File Upload   │    │ - Users         │
│ - File Upload   │    │ - AI Pipeline   │    │ - Calls         │
│ - Dashboard     │    │ - Real-time UI  │    │ - Analyses      │
│ - Results View  │    │ - Coaching Gen  │    │ - Coaching      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       │   AI Service    │
                ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
                │ HuggingFace │   │   Ollama    │   │    Mock     │
                │ (Mistral-7B)│   │ (Local LLM) │   │ (Dev Mode)  │
                │ (Whisper)   │   │ (Llama 3)   │   │             │
                └─────────────┘   └─────────────┘   └─────────────┘
```

### Key Components

1. **Frontend (React)**: Modern UI with Tailwind CSS for responsive design
2. **Backend (Express/Node.js)**: RESTful API with Socket.io for real-time updates
3. **Database (MongoDB)**: Document storage for users, calls, analyses, and coaching
4. **AI Service Layer**: Multi-provider architecture supporting open-source models
5. **Docker Orchestration**: Complete containerized deployment with health checks

### Call Analysis Pipeline

1. **Audio Upload**: User uploads .wav/.mp3/.m4a files with drag-and-drop interface
2. **Transcription**: Open-source Whisper models convert audio to text with timestamps
3. **Quality Analysis**: Open-source LLMs (Mistral-7B, DialoGPT, Flan-T5) analyze transcript for:
   - **Call Opening Score**: Professional greeting and introduction assessment
   - **Issue Understanding Score**: Active listening and comprehension evaluation  
   - **Sentiment Analysis**: Agent and customer emotional tone analysis
   - **CSAT Prediction**: Customer satisfaction scoring with confidence levels
   - **Resolution Quality**: Problem-solving effectiveness and first-call resolution
4. **Coaching Generation**: Dynamically generated personalized coaching plans with:
   - **Detailed Performance Feedback**: Score-based analysis with specific recommendations
   - **Targeted Learning Resources**: Articles, videos, and call examples based on improvement areas
   - **Interactive Knowledge Assessment**: Custom quizzes with difficulty progression
   - **Progress Tracking**: Completion criteria and advancement metrics

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- AI Provider (see options below)

### Open-Source AI Provider Options

**The application uses only open-source AI models - choose based on your needs:**

1. **🆓 Mock Provider (Default)** - Perfect for development and testing
   - **Setup**: None required
   - **Cost**: Free
   - **Use case**: Development, demonstrations, testing

2. **🤗 Hugging Face (Recommended)**
   - **Setup**: Get free API token from [huggingface.co](https://huggingface.co/settings/tokens)
   - **Cost**: Free tier with rate limits
   - **Models**: Mistral-7B, Whisper, DialoGPT, Flan-T5
   - **Use case**: Production with open-source models

3. **🏠 Ollama (Local Models)**
   - **Setup**: Install Ollama locally
   - **Cost**: Free (uses your hardware)
   - **Models**: Llama 3, Mistral, CodeLlama, Phi-3
   - **Use case**: Privacy, offline usage, full control

📖 **Detailed setup instructions**: See [AI_PROVIDER_SETUP.md](AI_PROVIDER_SETUP.md)

### Setup

1. **Clone and Setup**:
```bash
git clone <repository-url>
cd omind-ai-contact-center
cp .env.example .env
# Edit .env with your chosen AI provider credentials (optional for mock mode)
```

2. **Run with Docker** (Recommended):
```bash
docker-compose up --build
```

3. **Manual Setup** (Development):
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd ../frontend
npm install
npm start

# MongoDB (separate terminal - if not using Docker)
mongod
```

### Access Points
- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **Demo Login**: `demo@omind.ai` / `password`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login with email/password
- `POST /api/auth/demo-login` - Demo user authentication

### File Management
- `POST /api/calls/upload` - Upload audio file with metadata
- `GET /api/calls/:id` - Get specific call details
- `GET /api/calls` - List user's calls with pagination

### Analysis Pipeline
- `POST /api/analysis/transcribe/:callId` - Trigger audio transcription
- `POST /api/analysis/analyze/:callId` - Generate quality analysis
- `GET /api/analysis/:callId` - Retrieve analysis results

### Coaching System
- `POST /api/coaching/generate/:callId` - Generate personalized coaching plan
- `GET /api/coaching/:callId` - Retrieve coaching plan details
- `POST /api/coaching/:callId/progress` - Update learning progress

## Sample Data & Testing

The platform includes comprehensive sample data for immediate testing:

### Included Sample Files
- **Audio Files**: `sample-data/calls/excellent-customer-service.mp3`
- **Expected Transcripts**: High-quality conversation examples
- **Analysis Results**: Sample scoring and feedback data
- **Coaching Plans**: Complete learning plans with resources

### Demo Workflow
1. Login with demo credentials: `demo@omind.ai` / `password`
2. Upload sample audio file or use provided examples
3. Monitor real-time transcription progress
4. Review detailed quality analysis with scores
5. Explore personalized coaching recommendations
6. Complete interactive quiz assessments

## Integration Points

### Multi-Provider AI Architecture
The platform supports multiple AI providers with automatic fallback:

**1. HuggingFace Integration**
- **Models**: Mistral-7B-Instruct, Whisper-large-v3, DialoGPT, Flan-T5
- **Authentication**: Bearer token authentication
- **Rate Limits**: Free tier with reasonable limits for development
- **Fallback**: Automatic retry with different models

**2. Ollama Local Models**
- **Models**: Llama 3, Mistral, CodeLlama, Phi-3
- **Setup**: Local installation required
- **Benefits**: Complete privacy, no API costs, offline capability
- **Use Case**: Production environments requiring data sovereignty

**3. Mock Provider**
- **Purpose**: Development and demonstration
- **Features**: Realistic sample responses, configurable delays
- **Benefits**: No external dependencies, consistent testing results

### Error Handling & Resilience
- **Circuit Breaker Pattern**: Prevents cascade failures
- **Exponential Backoff**: Intelligent retry mechanisms  
- **Graceful Degradation**: Falls back to mock responses when needed
- **Real-time Notifications**: Socket.io updates for processing status

## Scaling Considerations

### Current Limitations
- Sequential processing (STT → Analysis → Coaching)
- Single API key rate limiting
- In-memory file handling
- No queue system for batch processing

### Production Improvements
1. **Microservices Architecture**:
   - Separate STT service
   - Dedicated analysis service
   - Coaching generation service
   - File processing service

2. **Queue System**:
   - Redis/RabbitMQ for async processing
   - Background workers for AI tasks
   - Webhook notifications for completion

3. **Scalability**:
   - Kubernetes deployment
   - Auto-scaling based on queue depth
   - CDN for audio file storage
   - Database sharding

4. **Reliability**:
   - Circuit breakers for AI services
   - Multiple AI provider fallbacks
   - Data backup and recovery
   - Health monitoring

## Security Considerations

- API key management (AWS Secrets Manager)
- User authentication and authorization
- File upload validation and scanning
- Rate limiting and DDoS protection
- Data encryption at rest and in transit

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test API endpoints
npm run test:api
```

## Deployment

### Docker Compose (Local)
```bash
docker-compose up --build
```

### Kubernetes (Production)
```bash
kubectl apply -f k8s/
```

## Challenges & Trade-offs

### 1. **AI Model Performance vs Cost**
- **Challenge**: Balancing quality AI analysis with cost efficiency
- **Solution**: Open-source model hierarchy with intelligent fallbacks
- **Trade-off**: Slightly longer processing times vs. zero API costs

### 2. **Real-time Processing vs Resource Usage**
- **Challenge**: Providing real-time updates without overwhelming system resources
- **Solution**: Socket.io for efficient bidirectional communication
- **Trade-off**: Additional complexity vs. superior user experience

### 3. **Data Privacy vs Processing Power** 
- **Challenge**: Ensuring sensitive call data remains secure
- **Solution**: Local Ollama models for complete data sovereignty
- **Trade-off**: Higher hardware requirements vs. maximum privacy

### 4. **Development Speed vs Production Readiness**
- **Challenge**: Building functional prototype while maintaining scalability
- **Solution**: Modular architecture with clear separation of concerns
- **Trade-off**: Additional abstraction layers vs. future-proof design

### 5. **Accuracy vs Consistency**
- **Challenge**: Open-source models may have variable outputs
- **Solution**: Response parsing with fallback to structured mock data
- **Trade-off**: Occasional generic responses vs. reliable system operation

## Next Steps for Scaling, Security & Extension

### Immediate Improvements (Phase 1)
1. **Enhanced Security**
   - API key rotation and vault integration
   - File upload validation and virus scanning
   - Rate limiting per user and IP
   - HTTPS enforcement and CORS hardening

2. **Performance Optimization**
   - Redis caching for frequent queries
   - Database indexing optimization
   - CDN integration for static assets
   - Connection pooling and query optimization

### Scaling Architecture (Phase 2)
1. **Microservices Decomposition**
   - Separate STT, analysis, and coaching services
   - Event-driven architecture with message queues
   - Independent scaling of AI processing components
   - Service mesh for inter-service communication

2. **Infrastructure Scaling**
   - Kubernetes orchestration with auto-scaling
   - Load balancing with health checks
   - Database sharding and read replicas
   - Multi-region deployment for global access

### Advanced Features (Phase 3)
1. **Real-time Call Analysis**
   - Live call monitoring and coaching
   - WebRTC integration for voice processing
   - Real-time sentiment analysis and alerts
   - Supervisor intervention capabilities

2. **Advanced Analytics & AI**
   - Custom fine-tuned models for contact center domain
   - Predictive analytics for agent performance
   - Automated quality assurance workflows
   - Integration with CRM and workforce management systems

3. **Enterprise Integration**
   - SSO authentication (SAML, OAuth)
   - API gateway for external integrations
   - Data export and reporting capabilities
   - Compliance frameworks (GDPR, CCPA, SOX)

### Technology Evolution
- **Edge Computing**: Local AI processing for latency reduction
- **Federated Learning**: Collaborative model improvement without data sharing
- **Advanced NLP**: Emotion detection, intent classification, outcome prediction
- **Mobile Applications**: Native apps for agents and supervisors

## Demo Data

Login with: `demo@omind.ai` / `password`

Sample files provided in `sample-data/` directory for testing the complete workflow.
