#!/bin/bash

# Quick test script for AI providers
echo "🤖 Testing AI Provider Configuration..."

cd "$(dirname "$0")"

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env from example..."
    cp backend/.env.example backend/.env
fi

# Test different providers
echo ""
echo "🧪 Testing Mock Provider (Default)..."
echo "No configuration needed - this always works!"

echo ""
echo "🤗 Testing Hugging Face Setup..."
if grep -q "HUGGINGFACE_API_KEY=" backend/.env && ! grep -q "^#.*HUGGINGFACE_API_KEY=" backend/.env; then
    echo "✅ Hugging Face API key found in .env"
    echo "📡 You can test at: https://huggingface.co/docs/api-inference/quicktour"
else
    echo "ℹ️  To setup Hugging Face:"
    echo "   1. Get free token: https://huggingface.co/settings/tokens"
    echo "   2. Add to backend/.env: HUGGINGFACE_API_KEY=your_token_here"
fi

echo ""
echo "🏠 Testing Ollama Setup..."
if command -v ollama >/dev/null 2>&1; then
    echo "✅ Ollama is installed"
    if ollama list >/dev/null 2>&1; then
        echo "✅ Ollama is running"
        echo "📋 Available models:"
        ollama list | grep -v "NAME"
    else
        echo "⚠️  Ollama installed but not running. Start with: ollama serve"
    fi
else
    echo "ℹ️  To setup Ollama:"
    echo "   1. Install: brew install ollama (macOS) or see https://ollama.ai"
    echo "   2. Start: ollama serve"
    echo "   3. Download model: ollama pull llama3"
    echo "   4. Add to backend/.env: OLLAMA_URL=http://localhost:11434"
fi

echo ""
echo "🚀 Testing OpenAI Setup..."
if grep -q "OPENAI_API_KEY=" backend/.env && ! grep -q "^#.*OPENAI_API_KEY=" backend/.env; then
    echo "✅ OpenAI API key found in .env"
    echo "💰 Note: This requires a paid OpenAI account with billing"
else
    echo "ℹ️  To setup OpenAI:"
    echo "   1. Create account: https://platform.openai.com/signup"
    echo "   2. Add billing: https://platform.openai.com/account/billing"
    echo "   3. Get API key: https://platform.openai.com/api-keys"
    echo "   4. Add to backend/.env: OPENAI_API_KEY=your_key_here"
fi

echo ""
echo "🎯 Recommendation:"
echo "For getting started: Use Mock Provider (no setup)"
echo "For free production: Use Hugging Face (free tier)"
echo "For privacy/control: Use Ollama (local models)"
echo "For best quality: Use OpenAI (paid service)"

echo ""
echo "▶️  Ready to start? Run: ./test-application.sh"
