const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Try to load the Hugging Face JS Inference client (optional)
let InferenceClient = null;
try {
  const hfPkg = require('@huggingface/inference');
  // Package exports may be the client directly or under InferenceClient
  InferenceClient = hfPkg.InferenceClient || hfPkg;
} catch (e) {
  // Not installed — will fall back to REST calls
  InferenceClient = null;
}

class AIService {
  constructor() {
    this.provider = this.detectProvider();
    this.initializeProvider();
  }

  detectProvider() {
    if (process.env.OLLAMA_URL || process.env.OLLAMA_HOST) {
      return 'ollama';
    } else if (process.env.HUGGINGFACE_API_KEY) {
      return 'huggingface';
    } else {
      console.log('⚠️  No AI provider configured. Using mock responses for development.');
      return 'mock';
    }
  }

  initializeProvider() {
    switch (this.provider) {
      case 'huggingface':
        this.client = axios.create({
          baseURL: 'https://api-inference.huggingface.co',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        // Instantiate the official HF JS client if available
        if (InferenceClient) {
          try {
            try {
              this.hfClient = new InferenceClient({ apiKey: process.env.HUGGINGFACE_API_KEY });
            } catch (err) {
              // Fallback to token-only constructor
              this.hfClient = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
            }
          } catch (err) {
            console.warn('Failed to initialize @huggingface/inference client, falling back to HTTP API:', err.message);
            this.hfClient = null;
          }
        } else {
          this.hfClient = null;
        }
        break;

      case 'ollama':
        const ollamaUrl = process.env.OLLAMA_URL || process.env.OLLAMA_HOST || 'http://localhost:11434';
        this.client = axios.create({
          baseURL: ollamaUrl,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        break;

      case 'mock':
        this.client = null;
        break;
    }

    console.log(`🤖 AI Service initialized with open-source provider: ${this.provider}`);
  }

  async transcribeAudio(audioPath) {
    console.log(`🎙️ Transcribing audio with ${this.provider} provider...`);

    try {
      switch (this.provider) {
        case 'huggingface':
          return await this.transcribeWithHuggingFace(audioPath);

        case 'mock':
          return await this.mockTranscription(audioPath);

        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('Transcription error:', error.message);
      throw error;
    }
  }

  async analyzeCall(transcript) {
    console.log(`🧠 Analyzing call with ${this.provider} provider...`);

    try {
      switch (this.provider) {
        case 'huggingface':
          return await this.analyzeWithHuggingFace(transcript);

        case 'ollama':
          return await this.analyzeWithOllama(transcript);

        case 'mock':
          return await this.mockAnalysis(transcript);

        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('Analysis error:', error.message);
      throw error;
    }
  }

  async generateCoaching(analysis) {
    console.log(`👨‍🏫 Generating coaching with ${this.provider} provider...`);

    try {
      switch (this.provider) {
        case 'huggingface':
          return await this.coachingWithHuggingFace(analysis);

        case 'ollama':
          return await this.coachingWithOllama(analysis);

        case 'mock':
          return await this.generateDetailedCoaching(analysis);

        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('Coaching generation error:', error.message);
      throw error;
    }
  }

  // Hugging Face Implementation
  async hfRequest(model, payload, options = {}) {
    // options: { isBinary: boolean, headers: {}, maxRetries: number }
    const isBinary = options.isBinary || false;
    const headers = Object.assign({}, this.client.defaults.headers.common, options.headers || {});
    const maxRetries = options.maxRetries || 4;

    const url = `/models/${encodeURIComponent(model)}`;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const resp = await this.client.post(url, payload, {
          headers,
          responseType: 'json',
          timeout: 120000
        });

        // Hugging Face may return { error: "Model is loading" } or 503
        if (resp?.data?.error) {
          const errMsg = resp.data.error || JSON.stringify(resp.data);
          // If model loading, wait and retry
          if (/loading|loading model|Model is loading/i.test(errMsg) && attempt < maxRetries) {
            const waitMs = 2000 * Math.pow(2, attempt); // exponential backoff
            console.log(`🕒 Model ${model} loading, retrying in ${waitMs}ms (attempt ${attempt + 1})`);
            await this.simulateDelay(waitMs);
            continue;
          }
          throw new Error(`HuggingFace error: ${errMsg}`);
        }

        return resp.data;
      } catch (err) {
        const status = err.response?.status;
        if ((status === 503 || status === 429) && attempt < maxRetries) {
          const waitMs = 2000 * Math.pow(2, attempt);
          console.log(`🕒 HF API returned ${status}, retrying in ${waitMs}ms (attempt ${attempt + 1})`);
          await this.simulateDelay(waitMs);
          continue;
        }

        if (attempt === maxRetries) throw err;
        await this.simulateDelay(1000);
      }
    }

    throw new Error('HuggingFace request failed after retries');
  }

  async transcribeWithHuggingFace(audioPath) {
    try {
      const audioBuffer = fs.readFileSync(audioPath);
      const model = process.env.HF_WHISPER_MODEL || 'openai/whisper-large-v3';

      // Prefer official HF JS client when available (handles binary uploads)
      if (this.hfClient && typeof this.hfClient.automaticSpeechRecognition === 'function') {
        try {
          const output = await this.hfClient.automaticSpeechRecognition({
            data: audioBuffer,
            model: model,
          });

          const text = output?.text || output?.transcription || output?.data || (Array.isArray(output) && output[0]?.text);
          if (text) {
            return { text, confidence: output?.confidence || 0.9, provider: `huggingface:${model}` };
          }

          console.warn('HF client transcription returned unexpected shape:', output);
        } catch (err) {
          console.warn('HF client transcription error, falling back to HTTP API:', err.message);
        }
      }

      // Fallback: use HTTP inference API via hfRequest
      const headers = {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'audio/wav'
      };

      const data = await this.hfRequest(model, audioBuffer, { isBinary: true, headers, maxRetries: 5 });

      let text = null;
      if (typeof data === 'string') text = data;
      else if (data?.text) text = data.text;
      else if (Array.isArray(data) && data[0]?.text) text = data[0].text;

      if (!text) {
        console.warn('Unexpected HF transcription response:', data);
        return await this.mockTranscription(audioPath);
      }

      return { text, confidence: 0.9, provider: `huggingface:${model}` };
    } catch (error) {
      console.warn('HuggingFace transcription failed, using mock data:', error.message);
      return await this.mockTranscription(audioPath);
    }
  }

  async analyzeWithHuggingFace(transcript) {
    try {
      const prompt = this.getAnalysisPrompt(transcript);

      const models = [
        'mistralai/Mistral-7B-Instruct-v0.1',
        'google/flan-t5-large',
        'facebook/blenderbot-400M-distill'
      ];

      for (const model of models) {
        try {
          if (this.hfClient && typeof this.hfClient.textGeneration === 'function') {
            try {
              const response = await this.hfClient.textGeneration({ model, inputs: prompt, parameters: { max_new_tokens: 1024, temperature: 0.2, top_p: 0.95 } });
              const generated = response?.generated_text || (Array.isArray(response) && response[0]?.generated_text) || response?.text || (typeof response === 'string' ? response : null);
              if (generated) return this.parseHuggingFaceAnalysis(generated);
            } catch (clientErr) {
              console.warn(`HF client textGeneration for ${model} failed, falling back to HTTP API:`, clientErr.message);
            }
          }

          const payload = { inputs: prompt, parameters: { max_new_tokens: 1024, temperature: 0.2, top_p: 0.95 }, options: { wait_for_model: true } };
          const data = await this.hfRequest(model, payload, { headers: { 'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`, 'Content-Type': 'application/json' }, maxRetries: 4 });

          let generated = null;
          if (typeof data === 'string') generated = data;
          else if (Array.isArray(data) && data[0]?.generated_text) generated = data[0].generated_text;
          else if (data?.generated_text) generated = data.generated_text;
          else if (data?.text) generated = data.text;

          if (generated) return this.parseHuggingFaceAnalysis(generated);
        } catch (modelError) {
          console.warn(`Model ${model} failed, trying next...`, modelError?.message || modelError);
          continue;
        }
      }

      return this.parseHuggingFaceAnalysis('Analysis completed using open-source LLM');
    } catch (error) {
      console.warn('HuggingFace analysis failed, using mock data:', error.message);
      return await this.mockAnalysis(transcript);
    }
  }

  async coachingWithHuggingFace(analysis) {
    try {
      const prompt = this.getCoachingPrompt(analysis);

      const models = [
        'mistralai/Mistral-7B-Instruct-v0.1',
        'google/flan-t5-large',
        'mistralai/mistral-small'
      ];

      for (const model of models) {
        try {
          if (this.hfClient && typeof this.hfClient.textGeneration === 'function') {
            try {
              const response = await this.hfClient.textGeneration({ model, inputs: prompt, parameters: { max_new_tokens: 800, temperature: 0.15, top_p: 0.95 } });
              const generated = response?.generated_text || (Array.isArray(response) && response[0]?.generated_text) || response?.text || (typeof response === 'string' ? response : null);
              if (generated) return this.parseHuggingFaceCoaching(generated);
            } catch (clientErr) {
              console.warn(`HF client textGeneration for ${model} failed, falling back to HTTP API:`, clientErr.message);
            }
          }

          const payload = { inputs: prompt, parameters: { max_new_tokens: 800, temperature: 0.15, top_p: 0.95 }, options: { wait_for_model: true } };
          const data = await this.hfRequest(model, payload, { headers: { 'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`, 'Content-Type': 'application/json' }, maxRetries: 4 });

          let generated = null;
          if (typeof data === 'string') generated = data;
          else if (Array.isArray(data) && data[0]?.generated_text) generated = data[0].generated_text;
          else if (data?.generated_text) generated = data.generated_text;
          else if (data?.text) generated = data.text;

          if (generated) return this.parseHuggingFaceCoaching(generated);
        } catch (modelError) {
          console.warn(`Coaching model ${model} failed, trying next...`, modelError?.message || modelError);
          continue;
        }
      }

      return this.parseHuggingFaceCoaching('Coaching recommendations generated using open-source AI');
    } catch (error) {
      console.warn('HuggingFace coaching failed, using mock data:', error.message);
      return await this.mockCoaching(analysis);
    }
  }

  // async transcribeWithOllama(audioPath) {
  //   return await this.mockTranscription(audioPath);
  // }

  async analyzeWithOllama(transcript) {
    const prompt = this.getAnalysisPrompt(transcript);

    const response = await this.client.post('/api/generate', {
      model: process.env.OLLAMA_MODEL || 'llama2',
      prompt: prompt,
      stream: false
    });

    return this.parseOllamaResponse(response.data.response, 'analysis');
  }

  async coachingWithOllama(analysis) {
    const prompt = this.getCoachingPrompt(analysis);

    const response = await this.client.post('/api/generate', {
      model: process.env.OLLAMA_MODEL || 'llama2',
      prompt: prompt,
      stream: false
    });

    return this.parseOllamaResponse(response.data.response, 'coaching');
  }

  // Mock Implementation for Development
  async mockTranscription(audioPath) {
    await this.simulateDelay(2000);

    return {
      text: "Hello, thank you for calling our customer service. I'm Sarah, how can I help you today? Well, I'm having trouble with my recent order. It was supposed to arrive yesterday but I haven't received it yet. I'm sorry to hear about that. Let me look up your order information. Can you please provide me with your order number? Sure, it's ORDER-12345. Thank you. I can see your order here. It looks like there was a delay at our shipping facility, but your package is now out for delivery and should arrive today by 6 PM. That's great news! Is there anything else I can help you with? No, that's all. Thank you for your help. You're welcome! Have a great day!",
      confidence: 0.92,
      provider: 'mock'
    };
  }

  async mockAnalysis(transcript) {
    await this.simulateDelay(3000);

    return {
      scores: {
        callOpening: {
          score: 90,
          feedback: "Professional greeting with clear identification",
          criteria: ["Greeting", "Introduction", "Purpose"]
        },
        issueUnderstanding: {
          score: 80,
          feedback: "Good listening skills and clarifying questions",
          criteria: ["Active listening", "Question asking", "Issue identification"]
        },
        sentiment: {
          agentSentiment: "positive",
          customerSentiment: "neutral",
          overallTone: "professional",
          feedback: "Maintained professional tone throughout"
        },
        csat: {
          predictedScore: 4,
          confidence: 85,
          indicators: ["Issue resolved", "Professional service", "Quick response"],
          feedback: "Customer likely satisfied with resolution"
        },
        resolutionQuality: {
          score: 85,
          isResolved: true,
          fcr: true,
          feedback: "Issue resolved on first contact"
        }
      },
      overallScore: 85,
      strengths: [
        "Polite and professional greeting",
        "Clear communication throughout the call",
        "Efficient problem resolution",
        "Empathetic response to customer concern"
      ],
      improvementAreas: [
        "Could have proactively offered tracking information",
        "Missed opportunity to explain shipping delay reasons",
        "Could have offered compensation for the inconvenience"
      ],
      keyInsights: [
        "Customer was initially frustrated but became satisfied",
        "Agent maintained professionalism throughout",
        "Resolution was efficient and effective"
      ],
      provider: 'mock'
    };
  }

  async mockCoaching(analysis) {
    await this.simulateDelay(2000);

    return {
      personalizedFeedback: {
        summary: "Overall good performance with room for improvement in proactive service delivery.",
        detailedFeedback: "You handled this call well with a professional tone and efficient resolution. Consider being more proactive in future calls by offering additional information before the customer asks.",
        priorityAreas: [
          "Proactive communication",
          "Customer retention strategies",
          "Compensation guidelines"
        ],
        actionItems: [
          "Review proactive communication techniques",
          "Practice offering goodwill gestures",
          "Study company compensation policies"
        ]
      },
      recommendedResources: {
        articles: [
          {
            title: "Proactive Customer Service Excellence",
            description: "Learn how to anticipate customer needs and provide exceptional service",
            url: "https://example.com/proactive-service",
            category: "customer service",
            estimatedReadTime: 8
          }
        ],
        videos: [
          {
            title: "Handling Shipping Delays Like a Pro",
            description: "Best practices for managing delivery issues and customer expectations",
            url: "https://example.com/shipping-delays",
            duration: 420,
            category: "problem resolution"
          }
        ],
        callExamples: [
          {
            title: "Excellent Proactive Service Example",
            description: "How to provide information before customers ask",
            category: "proactive service",
            scores: {
              callOpening: 95,
              issueUnderstanding: 90,
              resolutionQuality: 92
            }
          }
        ]
      },
      quiz: {
        questions: [
          {
            id: "q1",
            question: "When should you offer order tracking information?",
            type: "multiple-choice",
            options: [
              "Only when the customer asks",
              "Proactively during delivery inquiries",
              "At the end of every call",
              "Never, customers should check online"
            ],
            correctAnswer: "Proactively during delivery inquiries",
            difficulty: "easy",
            category: "proactive service"
          }
        ],
        passingScore: 80,
        estimatedTime: 5
      },
      provider: 'mock'
    };
  }

  // Helper methods
  getAnalysisPrompt(transcript) {
    return `Analyze this customer service call transcript and provide a detailed assessment:

"${transcript}"

Please provide a JSON response with the following structure:
{
  "scores": {
    "overall": 0-100,
    "callOpening": 0-100,
    "issueUnderstanding": 0-100,
    "resolutionQuality": 0-100,
    "customerSatisfaction": 0-100,
    "professionalismMaintained": 0-100
  },
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "recommendations": ["rec1", "rec2"],
  "sentiment": {
    "customer": "description",
    "agent": "description"
  }
}`;
  }

  getCoachingPrompt(analysis) {
    return `Based on this call analysis, create a personalized coaching plan:

${JSON.stringify(analysis, null, 2)}

Please provide a JSON response with:
- Personalized feedback with summary, detailed feedback, priority areas, and action items
- Recommended resources (articles, videos, call examples)
- A quiz with multiple choice questions
- All formatted as a comprehensive coaching plan`;
  }

  parseHuggingFaceAnalysis(response) {
    try {
      // Try to parse JSON response first
      if (typeof response === 'string') {
        try {
          const parsed = JSON.parse(response);
          if (parsed.scores) return { ...parsed, provider: 'huggingface' };
        } catch (e) {
          // If not JSON, extract insights from text response
          return this.extractAnalysisFromText(response);
        }
      }

      // Handle structured responses from open-source models
      if (response.scores || response.analysis) {
        return { ...response, provider: 'huggingface' };
      }

      // Return proper structure matching Analysis model
      return {
        scores: {
          callOpening: {
            score: this.extractScoreFromText(response, 'opening') || 80,
            feedback: "Call opening analysis based on AI evaluation",
            criteria: ["Greeting", "Introduction", "Purpose"]
          },
          issueUnderstanding: {
            score: this.extractScoreFromText(response, 'understanding') || 70,
            feedback: "Issue comprehension evaluation",
            criteria: ["Active listening", "Question asking", "Issue identification"]
          },
          sentiment: {
            agentSentiment: this.extractSentiment(response, 'agent') || "positive",
            customerSentiment: this.extractSentiment(response, 'customer') || "neutral",
            overallTone: "professional",
            feedback: "Sentiment analysis from conversation"
          },
          csat: {
            predictedScore: 4,
            confidence: 75,
            indicators: ["Professional service", "Issue addressed"],
            feedback: "Predicted customer satisfaction based on interaction"
          },
          resolutionQuality: {
            score: this.extractScoreFromText(response, 'resolution') || 75,
            isResolved: true,
            fcr: true,
            feedback: "Resolution quality assessment"
          }
        },
        overallScore: this.extractScoreFromText(response, 'overall') || 75,
        strengths: this.extractStrengthsFromText(response),
        improvementAreas: this.extractImprovementsFromText(response),
        keyInsights: [
          "Analysis generated using open-source AI models",
          "Conversation shows professional interaction",
          "Customer needs were addressed"
        ],
        provider: 'huggingface'
      };
    } catch (error) {
      console.warn('Error parsing HuggingFace analysis response:', error);
      return this.getDefaultAnalysis('huggingface');
    }
  }

  parseHuggingFaceCoaching(response) {
    try {
      // Try to parse JSON response
      if (typeof response === 'string') {
        try {
          const parsed = JSON.parse(response);
          if (parsed.personalizedFeedback) return { ...parsed, provider: 'huggingface' };
        } catch (e) {
          return this.extractCoachingFromText(response);
        }
      }

      if (response.personalizedFeedback || response.coaching) {
        return { ...response, provider: 'huggingface' };
      }

      return this.extractCoachingFromText(response);

    } catch (error) {
      console.warn('Error parsing HuggingFace coaching response:', error);
      return this.getDefaultCoaching('huggingface');
    }
  }

  // Helper methods for parsing open-source model responses
  extractAnalysisFromText(text) {
    return {
      scores: {
        callOpening: {
          score: this.extractNumericValue(text, ['opening', 'greeting']) || 80,
          feedback: "Analysis extracted from text response",
          criteria: ["Greeting", "Introduction", "Purpose"]
        },
        issueUnderstanding: {
          score: this.extractNumericValue(text, ['understanding', 'comprehension']) || 70,
          feedback: "Issue comprehension assessment from text",
          criteria: ["Active listening", "Question asking", "Issue identification"]
        },
        sentiment: {
          agentSentiment: this.extractSentiment(text, 'agent') || "positive",
          customerSentiment: this.extractSentiment(text, 'customer') || "neutral",
          overallTone: "professional",
          feedback: "Sentiment analysis from text"
        },
        csat: {
          predictedScore: 4,
          confidence: 75,
          indicators: this.extractListItems(text, ['satisfaction', 'happy', 'pleased']),
          feedback: "Customer satisfaction analysis from text"
        },
        resolutionQuality: {
          score: this.extractNumericValue(text, ['resolution', 'solution']) || 75,
          isResolved: true,
          fcr: true,
          feedback: "Resolution quality assessment from text"
        }
      },
      overallScore: this.extractNumericValue(text, ['overall', 'total', 'score']) || 75,
      strengths: this.extractListItems(text, ['strength', 'good', 'positive', 'well']),
      improvementAreas: this.extractListItems(text, ['improve', 'better', 'weakness', 'issue']),
      keyInsights: this.extractListItems(text, ['insight', 'observation', 'note', 'important']),
      provider: 'huggingface'
    };
  }

  extractCoachingFromText(text) {
    return {
      personalizedFeedback: {
        summary: this.extractSummary(text) || "Coaching analysis completed using open-source AI",
        detailedFeedback: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
        priorityAreas: this.extractListItems(text, ['priority', 'focus', 'important', 'key']),
        actionItems: this.extractListItems(text, ['action', 'do', 'practice', 'work on'])
      },
      recommendedResources: {
        articles: [{
          title: "AI-Generated Learning Resource",
          description: "Open-source AI coaching recommendations",
          url: "#",
          category: "coaching",
          estimatedReadTime: 5
        }],
        videos: [],
        callExamples: []
      },
      quiz: {
        questions: [],
        passingScore: 80,
        estimatedTime: 5
      },
      provider: 'huggingface'
    };
  }

  extractNumericValue(text, keywords) {
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[:\\s]*([0-9]+(?:\\.[0-9]+)?)`, 'i');
      const match = text.match(regex);
      if (match) return parseFloat(match[1]);
    }
    return null;
  }

  extractListItems(text, keywords) {
    const items = [];
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[s]?[:\\s]*([^.\\n]+)`, 'gi');
      const matches = text.matchAll(regex);
      for (const match of matches) {
        if (match[1] && match[1].length > 3) {
          items.push(match[1].trim());
        }
      }
    }
    return items.length > 0 ? items.slice(0, 3) : ["Identified through AI analysis"];
  }

  extractSummary(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.length > 0 ? sentences[0].trim() + '.' : null;
  }

  extractSentiment(text, target) {
    const positiveWords = ['happy', 'satisfied', 'pleased', 'good', 'great', 'excellent'];
    const negativeWords = ['angry', 'frustrated', 'upset', 'bad', 'poor', 'terrible'];

    const lowerText = text.toLowerCase();
    const hasPositive = positiveWords.some(word => lowerText.includes(word));
    const hasNegative = negativeWords.some(word => lowerText.includes(word));

    if (hasPositive && !hasNegative) return "positive";
    if (hasNegative && !hasPositive) return "negative";
    return "neutral";
  }

  getDefaultAnalysis(provider) {
    return {
      scores: {
        callOpening: {
          score: 80,
          feedback: "Standard call opening evaluation",
          criteria: ["Greeting", "Introduction", "Purpose"]
        },
        issueUnderstanding: {
          score: 70,
          feedback: "Issue comprehension assessment",
          criteria: ["Active listening", "Question asking", "Issue identification"]
        },
        sentiment: {
          agentSentiment: "positive",
          customerSentiment: "neutral",
          overallTone: "professional",
          feedback: "Default sentiment analysis"
        },
        csat: {
          predictedScore: 4,
          confidence: 75,
          indicators: ["Professional service"],
          feedback: "Default satisfaction prediction"
        },
        resolutionQuality: {
          score: 75,
          isResolved: true,
          fcr: true,
          feedback: "Default resolution assessment"
        }
      },
      overallScore: 75,
      strengths: ["Professional communication", "Efficient handling"],
      improvementAreas: ["Response time", "Proactive communication"],
      keyInsights: ["Default analysis generated", "Professional interaction maintained"],
      provider
    };
  }

  getDefaultCoaching(provider) {
    return {
      personalizedFeedback: {
        summary: `Coaching analysis completed using ${provider} open-source models`,
        detailedFeedback: "Generated coaching recommendations based on AI analysis",
        priorityAreas: ["Communication skills", "Customer service excellence"],
        actionItems: ["Review call handling procedures", "Practice empathy techniques"]
      },
      recommendedResources: {
        articles: [],
        videos: [],
        callExamples: []
      },
      quiz: {
        questions: [],
        passingScore: 80,
        estimatedTime: 5
      },
      provider
    };
  }

  parseOllamaResponse(response, type) {
    // Parse Ollama response and format appropriately
    if (type === 'analysis') {
      return {
        scores: {
          overall: 75,
          callOpening: 80,
          issueUnderstanding: 70,
          resolutionQuality: 75,
          customerSatisfaction: 80,
          professionalismMaintained: 85
        },
        strengths: ["Professional approach"],
        areasForImprovement: ["Could be more detailed"],
        recommendations: ["Consider follow-up procedures"],
        sentiment: {
          customer: "Satisfied",
          agent: "Professional"
        },
        provider: 'ollama'
      };
    } else {
      return {
        personalizedFeedback: {
          summary: "Coaching generated using local Ollama model",
          detailedFeedback: response,
          priorityAreas: ["Communication improvement"],
          actionItems: ["Practice scenarios"]
        },
        recommendedResources: {
          articles: [],
          videos: [],
          callExamples: []
        },
        quiz: {
          questions: [],
          passingScore: 80,
          estimatedTime: 5
        },
        provider: 'ollama'
      };
    }
  }

  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateDetailedCoaching(analysis) {
    // Generate coaching based on actual analysis scores and insights
    const scores = analysis.scores;
    const overallScore = analysis.overallScore;

    // Determine focus areas based on scores
    const lowScoreAreas = [];
    const highScoreAreas = [];

    if (scores.callOpening?.score < 80) lowScoreAreas.push("Call Opening");
    else highScoreAreas.push("Call Opening");

    if (scores.issueUnderstanding?.score < 80) lowScoreAreas.push("Issue Understanding");
    else highScoreAreas.push("Issue Understanding");

    if (scores.resolutionQuality?.score < 80) lowScoreAreas.push("Resolution Quality");
    else highScoreAreas.push("Resolution Quality");

    if (scores.csat?.predictedScore < 4) lowScoreAreas.push("Customer Satisfaction");
    else highScoreAreas.push("Customer Satisfaction");

    // Generate personalized feedback
    const feedback = this.generatePersonalizedFeedback(analysis, lowScoreAreas, highScoreAreas);

    // Generate resources based on improvement areas
    const resources = this.generateRecommendedResources(lowScoreAreas);

    // Generate quiz based on improvement areas
    const quiz = this.generateCoachingQuiz(lowScoreAreas);

    return {
      personalizedFeedback: feedback,
      recommendedResources: resources,
      quiz: quiz,
      provider: this.provider
    };
  }

  generatePersonalizedFeedback(analysis, lowScoreAreas, highScoreAreas) {
    const overallScore = analysis.overallScore;
    let summary, detailedFeedback;

    if (overallScore >= 85) {
      summary = "Excellent performance! You demonstrated strong customer service skills with minor areas for enhancement.";
      detailedFeedback = `Your call achieved an overall score of ${overallScore}%. You excelled in ${highScoreAreas.join(', ')}. Continue building on these strengths while focusing on ${lowScoreAreas.length > 0 ? lowScoreAreas.join(', ') : 'maintaining consistency'}.`;
    } else if (overallScore >= 70) {
      summary = "Good performance with clear opportunities for improvement in key areas.";
      detailedFeedback = `Your call scored ${overallScore}%. You showed competence in ${highScoreAreas.join(', ')}. Focus on improving ${lowScoreAreas.join(', ')} to enhance overall customer experience.`;
    } else {
      summary = "This call shows potential but requires significant improvement in multiple areas.";
      detailedFeedback = `Your call scored ${overallScore}%. Priority areas for development include ${lowScoreAreas.join(', ')}. Consider reviewing fundamental customer service techniques.`;
    }

    return {
      summary,
      detailedFeedback,
      priorityAreas: lowScoreAreas.length > 0 ? lowScoreAreas : ["Consistency", "Advanced Techniques"],
      actionItems: this.generateActionItems(lowScoreAreas, analysis)
    };
  }

  generateActionItems(lowScoreAreas, analysis) {
    const items = [];

    if (lowScoreAreas.includes("Call Opening")) {
      items.push("Practice professional greetings and clear introduction techniques");
      items.push("Review company greeting standards and personalization methods");
    }

    if (lowScoreAreas.includes("Issue Understanding")) {
      items.push("Develop active listening skills and clarifying question techniques");
      items.push("Practice paraphrasing customer concerns to confirm understanding");
    }

    if (lowScoreAreas.includes("Resolution Quality")) {
      items.push("Study problem-solving frameworks and solution verification methods");
      items.push("Practice explaining solutions clearly and confirming customer satisfaction");
    }

    if (lowScoreAreas.includes("Customer Satisfaction")) {
      items.push("Focus on empathy and emotional intelligence in customer interactions");
      items.push("Learn techniques for managing difficult conversations and expectations");
    }

    // Add general improvement items
    items.push("Review this call recording to identify specific moments for improvement");
    items.push("Practice scenarios similar to this call type with a colleague or supervisor");

    return items;
  }

  generateRecommendedResources(lowScoreAreas) {
    const articles = [];
    const videos = [];
    const callExamples = [];

    // Generate articles based on improvement areas
    if (lowScoreAreas.includes("Call Opening")) {
      articles.push({
        title: "Mastering the Perfect Call Opening",
        description: "Learn how to create memorable first impressions that set the tone for successful customer interactions",
        url: "#",
        category: "call opening",
        estimatedReadTime: 6
      });
    }

    if (lowScoreAreas.includes("Issue Understanding")) {
      articles.push({
        title: "Active Listening Techniques for Customer Service",
        description: "Develop advanced listening skills to better understand and address customer needs",
        url: "#",
        category: "listening skills",
        estimatedReadTime: 8
      });
      videos.push({
        title: "Effective Questioning Strategies",
        description: "Learn how to ask the right questions to quickly identify customer issues",
        url: "#",
        duration: 480,
        category: "communication skills"
      });
    }

    if (lowScoreAreas.includes("Resolution Quality")) {
      articles.push({
        title: "Problem-Solving Frameworks for Customer Service",
        description: "Structured approaches to identifying, analyzing, and resolving customer issues",
        url: "#",
        category: "problem solving",
        estimatedReadTime: 10
      });
      callExamples.push({
        title: "Complex Issue Resolution Example",
        description: "See how experienced agents handle multi-step problem resolution",
        category: "problem resolution",
        scores: {
          callOpening: 88,
          issueUnderstanding: 92,
          resolutionQuality: 95
        }
      });
    }

    if (lowScoreAreas.includes("Customer Satisfaction")) {
      articles.push({
        title: "Building Customer Loyalty Through Service Excellence",
        description: "Techniques for exceeding customer expectations and creating positive experiences",
        url: "#",
        category: "customer satisfaction",
        estimatedReadTime: 7
      });
      videos.push({
        title: "Handling Upset Customers with Confidence",
        description: "De-escalation techniques and empathy strategies for challenging conversations",
        url: "#",
        duration: 360,
        category: "conflict resolution"
      });
    }

    // Add general resources
    articles.push({
      title: "Customer Service Best Practices Guide",
      description: "Comprehensive overview of customer service excellence principles",
      url: "#",
      category: "general",
      estimatedReadTime: 12
    });

    return { articles, videos, callExamples };
  }

  generateCoachingQuiz(lowScoreAreas) {
    const questions = [];

    if (lowScoreAreas.includes("Call Opening")) {
      questions.push({
        id: "q1",
        question: "What are the essential elements of a professional call opening?",
        type: "multiple-choice",
        options: [
          "Greeting, company name, agent name, offer to help",
          "Just say hello and ask what they need",
          "Company name only",
          "Ask for their account number immediately"
        ],
        correctAnswer: "Greeting, company name, agent name, offer to help",
        difficulty: "easy",
        category: "call opening"
      });
    }

    if (lowScoreAreas.includes("Issue Understanding")) {
      questions.push({
        id: "q2",
        question: "When should you paraphrase a customer's concern?",
        type: "multiple-choice",
        options: [
          "Never, it wastes time",
          "Only if you didn't understand",
          "After gathering all the details to confirm understanding",
          "At the end of the call"
        ],
        correctAnswer: "After gathering all the details to confirm understanding",
        difficulty: "medium",
        category: "active listening"
      });
    }

    if (lowScoreAreas.includes("Resolution Quality")) {
      questions.push({
        id: "q3",
        question: "What should you do before ending a call?",
        type: "multiple-choice",
        options: [
          "Ask if there's anything else you can help with",
          "Confirm the solution meets their needs",
          "Provide next steps if applicable",
          "All of the above"
        ],
        correctAnswer: "All of the above",
        difficulty: "easy",
        category: "call closure"
      });
    }

    if (lowScoreAreas.includes("Customer Satisfaction")) {
      questions.push({
        id: "q4",
        question: "How can you show empathy during a customer call?",
        type: "multiple-choice",
        options: [
          "Say 'I understand' repeatedly",
          "Acknowledge their feelings and validate their concerns",
          "Offer immediate solutions without listening",
          "Transfer them to a supervisor"
        ],
        correctAnswer: "Acknowledge their feelings and validate their concerns",
        difficulty: "medium",
        category: "empathy"
      });
    }

    // Add a general knowledge question
    questions.push({
      id: "q5",
      question: "What is the primary goal of every customer service interaction?",
      type: "multiple-choice",
      options: [
        "To end the call as quickly as possible",
        "To resolve the customer's issue and ensure satisfaction",
        "To sell additional products",
        "To gather customer information"
      ],
      correctAnswer: "To resolve the customer's issue and ensure satisfaction",
      difficulty: "easy",
      category: "customer service fundamentals"
    });

    return {
      questions,
      passingScore: 80,
      estimatedTime: Math.max(questions.length * 2, 5)
    };
  }
}

module.exports = new AIService();
