const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  callId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Call',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scores: {
    callOpening: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        required: true
      },
      feedback: String,
      criteria: [String]
    },
    issueUnderstanding: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        required: true
      },
      feedback: String,
      criteria: [String]
    },
    sentiment: {
      agentSentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative'],
        required: true
      },
      customerSentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative'],
        required: true
      },
      overallTone: {
        type: String,
        enum: ['professional', 'friendly', 'neutral', 'tense', 'hostile'],
        required: true
      },
      feedback: String
    },
    csat: {
      predictedScore: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        required: true
      },
      indicators: [String],
      feedback: String
    },
    resolutionQuality: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        required: true
      },
      isResolved: {
        type: Boolean,
        required: true
      },
      fcr: {
        type: Boolean,
        required: true
      },
      feedback: String
    }
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  strengths: [String],
  improvementAreas: [String],
  keyInsights: [String],
  analyzedAt: {
    type: Date,
    default: Date.now
  },
  analysisVersion: {
    type: String,
    default: '1.0'
  },
  processingTime: {
    type: Number // in milliseconds
  }
});

// Index for efficient queries
analysisSchema.index({ callId: 1 });
analysisSchema.index({ userId: 1, analyzedAt: -1 });
analysisSchema.index({ 'scores.overallScore': -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
