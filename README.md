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
- **Audio Files**: `sample-data/calls/sample_audio.mp3`

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

## Demo Data

Login with: `demo@omind.ai` / `password`

Sample files provided in `sample-data/` directory for testing the complete workflow.
