const mongoose = require('mongoose');

const coachingSchema = new mongoose.Schema({
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
    required: true,
    unique: true
  },
  callId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Call',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalizedFeedback: {
    summary: {
      type: String,
      required: true
    },
    detailedFeedback: {
      type: String,
      required: true
    },
    priorityAreas: [String],
    actionItems: [String]
  },
  recommendedResources: {
    articles: [{
      title: String,
      description: String,
      url: String,
      category: String,
      estimatedReadTime: Number
    }],
    videos: [{
      title: String,
      description: String,
      url: String,
      duration: Number,
      category: String,
      thumbnail: String
    }],
    callExamples: [{
      title: String,
      description: String,
      audioUrl: String,
      transcriptUrl: String,
      category: String,
      scores: {
        callOpening: Number,
        issueUnderstanding: Number,
        resolutionQuality: Number
      }
    }]
  },
  quiz: {
    questions: [{
      id: String,
      type: {
        type: String,
        enum: ['multiple-choice', 'true-false', 'scenario'],
        required: true
      },
      question: {
        type: String,
        required: true
      },
      options: [String], // for multiple choice
      correctAnswer: String,
      explanation: String,
      category: String,
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      }
    }],
    passingScore: {
      type: Number,
      default: 80
    },
    estimatedTime: {
      type: Number, // in minutes
      default: 10
    }
  },
  completionCriteria: {
    readArticles: {
      type: Boolean,
      default: false
    },
    watchVideos: {
      type: Boolean,
      default: false
    },
    reviewCallExamples: {
      type: Boolean,
      default: false
    },
    passQuiz: {
      type: Boolean,
      default: false
    },
    overallProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  progress: {
    articlesRead: [String],
    videosWatched: [String],
    callExamplesReviewed: [String],
    quizAttempts: [{
      attemptDate: Date,
      score: Number,
      answers: [{
        questionId: String,
        answer: String,
        isCorrect: Boolean
      }]
    }],
    bestQuizScore: {
      type: Number,
      default: 0
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
coachingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
coachingSchema.index({ userId: 1, createdAt: -1 });
coachingSchema.index({ callId: 1 });
coachingSchema.index({ analysisId: 1 });

module.exports = mongoose.model('Coaching', coachingSchema);
