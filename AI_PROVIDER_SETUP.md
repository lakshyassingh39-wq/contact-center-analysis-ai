# Open-Source AI Provider Setup Guide

This guide helps you configure open-source AI providers for the OMIND.AI Contact Center Platform.

## 🤖 Available Open-Source AI Providers

### 1. Mock Provider (Default - No Setup Required)
**Best for**: Development, testing, demonstrations
**Cost**: Free
**Setup**: No configuration needed

The application will automatically use mock responses when no AI provider is configured. Perfect for development and testing the application flow.

### 2. Hugging Face (Recommended)
**Best for**: Production use with open-source models, experimenting with latest models
**Cost**: Free tier available (rate limited)
**Models**: Mistral-7B, Whisper, DialoGPT, Flan-T5, and more
**Setup**:

1. **Create Hugging Face Account**:
   ```bash
   # Visit https://huggingface.co/join
   ```

2. **Get API Token**:
   - Go to https://huggingface.co/settings/tokens
   - Create a new token with "Read" permissions
   - Copy the token

3. **Configure Environment**:
   ```bash
   # In backend/.env
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Available Open-Source Models**:
   - **Transcription**: openai/whisper-large-v3 (open-source Whisper)
   - **Text Analysis**: mistralai/Mistral-7B-Instruct-v0.1, microsoft/DialoGPT-large
   - **Text Generation**: google/flan-t5-large, facebook/blenderbot-400M-distill

### 3. Ollama (Local Open-Source Models)
**Best for**: Complete privacy, no internet dependency, customization
**Cost**: Free (uses your hardware)
**Models**: Llama 3, Mistral, CodeLlama, Phi-3, and more
**Setup**:

1. **Install Ollama**:
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows
   # Download from https://ollama.ai/download/windows
   ```

2. **Start Ollama Service**:
   ```bash
   ollama serve
   ```

3. **Download Models**:
   ```bash
   # Download Llama 3 (recommended)
   ollama pull llama3
   
   # Or other models
   ollama pull mistral
   ollama pull codellama
   ```

4. **Configure Environment**:
   ```bash
   # In backend/.env
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=llama3
   ```

5. **Note**: Ollama handles text generation but not audio transcription. For audio, you'll need to set up whisper.cpp separately or use mock data.

### 4. OpenAI (Premium Option)
**Best for**: Highest quality AI responses
**Cost**: Pay-per-use (requires billing setup)
**Setup**:

1. **Create OpenAI Account**:
   - Visit https://platform.openai.com/signup

2. **Add Billing Information**:
   - Go to https://platform.openai.com/account/billing
   - Add payment method

3. **Get API Key**:
   - Visit https://platform.openai.com/api-keys
   - Create new secret key
   - Copy the key

## 🚀 Quick Setup Commands

### Option 1: Use Mock Provider (Fastest)
```bash
# No configuration needed
cd omind-ai-contact-center
docker-compose up --build
```

### Option 2: Setup Hugging Face (Recommended)
```bash
# 1. Get HuggingFace token from https://huggingface.co/settings/tokens
# 2. Configure environment
cd omind-ai-contact-center/backend
cp .env.example .env
echo "HUGGINGFACE_API_KEY=your_token_here" >> .env

# 3. Start application
cd ..
docker-compose up --build
```

### Option 3: Setup Ollama (Local Privacy)
```bash
# 1. Install and start Ollama
brew install ollama  # or your OS equivalent
ollama serve &

# 2. Download model
ollama pull llama3

# 3. Configure environment
cd omind-ai-contact-center/backend
cp .env.example .env
echo "OLLAMA_URL=http://host.docker.internal:11434" >> .env
echo "OLLAMA_MODEL=llama3" >> .env

# 4. Start application
cd ..
docker-compose up --build
```

## 📊 Open-Source Provider Comparison

| Provider | Cost | Quality | Setup | Speed | Privacy | Models |
|----------|------|---------|-------|-------|---------|---------|
| Mock | Free | Demo | None | Fast | Complete | N/A |
| HuggingFace | Free* | Good | Easy | Medium | Good | Mistral, Whisper, Flan-T5 |
| Ollama | Free | Good | Medium | Medium | Complete | Llama 3, Mistral, CodeLlama |

*Free tier has rate limits

## 🔧 Advanced Configuration

### Custom Hugging Face Models
```bash
# In aiService.js, modify the model endpoints:
# For transcription: '/models/facebook/wav2vec2-large-960h'
# For analysis: '/models/microsoft/DialoGPT-large'
```

### Ollama Model Options
```bash
# Light models (faster, less memory)
ollama pull llama3:8b

# Larger models (better quality, more memory)
ollama pull llama3:70b

# Specialized models
ollama pull codellama  # Better for structured responses
ollama pull mistral    # Good general purpose
```

### Docker Configuration for Ollama
```yaml
# Add to docker-compose.yml if running Ollama in Docker
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0

volumes:
  ollama_data:
```

## 🎯 Recommendations

### For Development/Testing:
**Use Mock Provider** - No setup required, instant results

### For Free Production Use:
**Use Hugging Face** - Good quality, free tier, cloud-based

### For Privacy/Custom Requirements:
## 🎯 Recommendations

### For Development/Testing:
**Use Mock Provider** - No setup, instant results

### For Production (Free):
**Use Hugging Face** - Good quality, free tier, wide model selection

### For Privacy/Offline:
**Use Ollama** - Complete control, runs locally, customizable

### For Best Open-Source Quality:
**Use Ollama with Llama 3 70B** - Excellent results with larger models

## 🆘 Troubleshooting

### Common Issues:

1. **Hugging Face Rate Limits**:
   ```bash
   # Error: Model is loading, please wait
   # Solution: Wait a few minutes or upgrade to paid tier
   ```

2. **Ollama Connection Issues**:
   ```bash
   # Check if Ollama is running
   curl http://localhost:11434/api/tags
   
   # If using Docker, use host.docker.internal
   OLLAMA_URL=http://host.docker.internal:11434
   ```

3. **Model Loading Errors**:
   ```bash
   # For Ollama, ensure model is downloaded
   ollama list
   ollama pull llama3
   ```

## 📈 Performance Tips

1. **Model Selection**: Start with smaller models for faster responses
2. **Caching**: The application caches results to avoid duplicate API calls
3. **Rate Limiting**: Configure rate limits for external APIs
4. **Hardware**: Ollama performance depends on your CPU/GPU

## 🔄 Switching Providers

The application automatically detects which provider to use based on environment variables. You can switch providers by simply changing the environment configuration:

```bash
# Switch to HuggingFace
export HUGGINGFACE_API_KEY=your_key
unset OLLAMA_URL

# Switch to Ollama
export OLLAMA_URL=http://localhost:11434
unset HUGGINGFACE_API_KEY

# Switch to Mock (remove all keys)
unset HUGGINGFACE_API_KEY OLLAMA_URL
```

The application will restart and use the new provider automatically!
