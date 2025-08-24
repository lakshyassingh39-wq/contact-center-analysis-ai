const express = require('express');
const Analysis = require('../models/Analysis');
const Coaching = require('../models/Coaching');
const Call = require('../models/Call');
const { auth } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/coaching/generate/{callId}:
 *   post:
 *     summary: Generate personalized coaching plan
 *     tags: [Coaching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coaching plan generated successfully
 *       404:
 *         description: Call or analysis not found
 */
router.post('/generate/:callId', auth, async (req, res) => {
  try {
    const call = await Call.findOne({
      _id: req.params.callId,
      userId: req.user.id
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    const analysis = await Analysis.findOne({ callId: call._id });
    if (!analysis) {
      return res.status(400).json({
        success: false,
        message: 'Call analysis not found. Please analyze the call first.'
      });
    }

    // Check if coaching plan already exists
    const existingCoaching = await Coaching.findOne({ analysisId: analysis._id });
    const forceRegenerate = req.query.force === 'true';
    
    if (existingCoaching && !forceRegenerate) {
      return res.status(200).json({
        success: true,
        message: 'Coaching plan already exists',
        coaching: existingCoaching
      });
    }
    
    // If force regenerate, delete existing coaching
    if (existingCoaching && forceRegenerate) {
      await Coaching.deleteOne({ _id: existingCoaching._id });
    }

    // Update call status
    call.status = 'coaching-generated';
    await call.save();

    // Emit progress update
    req.io.to(`call-${call._id}`).emit('coaching-generation-started', {
      callId: call._id,
      status: 'generating-coaching'
    });

    // Generate coaching plan asynchronously
    generateCoachingAsync(call, analysis, req.user, req.io);

    res.json({
      success: true,
      message: 'Coaching plan generation started',
      callId: call._id
    });
  } catch (error) {
    logger.error('Coaching generation initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting coaching generation'
    });
  }
});

/**
 * Async function to generate coaching plan
 */
async function generateCoachingAsync(call, analysis, user, io) {
  try {
    logger.info(`Starting coaching generation for call ${call._id}`);
    
    const startTime = Date.now();
    const userProfile = {
      name: user.name,
      role: user.role,
      department: user.department
    };

    const coachingResult = await aiService.generateCoaching(analysis, call.transcript, userProfile);
    const processingTime = Date.now() - startTime;

    // Create coaching record
    const coaching = new Coaching({
      analysisId: analysis._id,
      callId: call._id,
      userId: user.id,
      personalizedFeedback: coachingResult.personalizedFeedback,
      recommendedResources: coachingResult.recommendedResources,
      quiz: coachingResult.quiz,
      completionCriteria: {
        readArticles: false,
        watchVideos: false,
        reviewCallExamples: false,
        passQuiz: false,
        overallProgress: 0
      },
      progress: {
        articlesRead: [],
        videosWatched: [],
        callExamplesReviewed: [],
        quizAttempts: [],
        bestQuizScore: 0,
        isCompleted: false
      }
    });

    await coaching.save();

    // Update call status
    call.status = 'coaching-generated';
    await call.save();

    // Emit completion event
    io.to(`call-${call._id}`).emit('coaching-generated', {
      callId: call._id,
      status: 'coaching-generated',
      coaching: coaching,
      processingTime
    });

    logger.info(`Coaching plan generated for call ${call._id} in ${processingTime}ms`);
  } catch (error) {
    logger.error(`Coaching generation failed for call ${call._id}:`, error);
    
    // Update call with error
    call.status = 'failed';
    call.error = {
      message: error.message,
      timestamp: new Date(),
      step: 'coaching'
    };
    await call.save();

    // Emit error event
    io.to(`call-${call._id}`).emit('coaching-generation-failed', {
      callId: call._id,
      status: 'failed',
      error: error.message
    });
  }
}

/**
 * @swagger
 * /api/coaching/{callId}:
 *   get:
 *     summary: Get coaching plan for a call
 *     tags: [Coaching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coaching plan retrieved successfully
 *       404:
 *         description: Coaching plan not found
 */
router.get('/:callId', auth, async (req, res) => {
  try {
    const coaching = await Coaching.findOne({
      callId: req.params.callId,
      userId: req.user.id
    }).populate([
      { path: 'callId', select: 'originalName uploadedAt duration' },
      { path: 'analysisId', select: 'overallScore scores strengths improvementAreas' }
    ]);

    if (!coaching) {
      return res.status(404).json({
        success: false,
        message: 'Coaching plan not found'
      });
    }

    res.json({
      success: true,
      coaching
    });
  } catch (error) {
    logger.error('Get coaching error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving coaching plan'
    });
  }
});

/**
 * @swagger
 * /api/coaching:
 *   get:
 *     summary: Get all coaching plans for user
 *     tags: [Coaching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Coaching plans retrieved successfully
 */
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const coachingPlans = await Coaching.find({ userId: req.user.id })
      .populate([
        { path: 'callId', select: 'originalName uploadedAt duration' },
        { path: 'analysisId', select: 'overallScore' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Coaching.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      coachingPlans,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Get coaching plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving coaching plans'
    });
  }
});

/**
 * @swagger
 * /api/coaching/{callId}/progress:
 *   post:
 *     summary: Update learning progress
 *     tags: [Coaching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [article, video, callExample]
 *               resourceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Progress updated successfully
 */
router.post('/:callId/progress', auth, validateRequest(schemas.updateProgress), async (req, res) => {
  try {
    const { type, resourceId } = req.body;

    const coaching = await Coaching.findOne({
      callId: req.params.callId,
      userId: req.user.id
    });

    if (!coaching) {
      return res.status(404).json({
        success: false,
        message: 'Coaching plan not found'
      });
    }

    // Update progress based on type
    switch (type) {
      case 'article':
        if (!coaching.progress.articlesRead.includes(resourceId)) {
          coaching.progress.articlesRead.push(resourceId);
        }
        break;
      case 'video':
        if (!coaching.progress.videosWatched.includes(resourceId)) {
          coaching.progress.videosWatched.push(resourceId);
        }
        break;
      case 'callExample':
        if (!coaching.progress.callExamplesReviewed.includes(resourceId)) {
          coaching.progress.callExamplesReviewed.push(resourceId);
        }
        break;
    }

    // Calculate overall progress
    const totalResources = 
      coaching.recommendedResources.articles.length +
      coaching.recommendedResources.videos.length +
      coaching.recommendedResources.callExamples.length;

    const completedResources = 
      coaching.progress.articlesRead.length +
      coaching.progress.videosWatched.length +
      coaching.progress.callExamplesReviewed.length;

    const resourceProgress = totalResources > 0 ? (completedResources / totalResources) * 70 : 0;
    const quizProgress = coaching.progress.bestQuizScore >= coaching.quiz.passingScore ? 30 : 0;
    
    coaching.completionCriteria.overallProgress = Math.round(resourceProgress + quizProgress);

    // Update completion criteria
    coaching.completionCriteria.readArticles = 
      coaching.progress.articlesRead.length === coaching.recommendedResources.articles.length;
    coaching.completionCriteria.watchVideos = 
      coaching.progress.videosWatched.length === coaching.recommendedResources.videos.length;
    coaching.completionCriteria.reviewCallExamples = 
      coaching.progress.callExamplesReviewed.length === coaching.recommendedResources.callExamples.length;

    await coaching.save();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      progress: coaching.progress,
      completionCriteria: coaching.completionCriteria
    });
  } catch (error) {
    logger.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating progress'
    });
  }
});

/**
 * @swagger
 * /api/coaching/{callId}/quiz:
 *   post:
 *     summary: Submit quiz answers
 *     tags: [Coaching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answer:
 *                       type: string
 *     responses:
 *       200:
 *         description: Quiz submitted successfully
 */
router.post('/:callId/quiz', auth, async (req, res) => {
  try {
    const { answers } = req.body;

    const coaching = await Coaching.findOne({
      callId: req.params.callId,
      userId: req.user.id
    });

    if (!coaching) {
      return res.status(404).json({
        success: false,
        message: 'Coaching plan not found'
      });
    }

    // Score the quiz
    let correctAnswers = 0;
    const scoredAnswers = answers.map(answer => {
      const question = coaching.quiz.questions.find(q => q.id === answer.questionId);
      const isCorrect = question && question.correctAnswer === answer.answer;
      if (isCorrect) correctAnswers++;
      
      return {
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect
      };
    });

    const score = Math.round((correctAnswers / coaching.quiz.questions.length) * 100);

    // Add quiz attempt
    const quizAttempt = {
      attemptDate: new Date(),
      score,
      answers: scoredAnswers
    };

    coaching.progress.quizAttempts.push(quizAttempt);
    coaching.progress.bestQuizScore = Math.max(coaching.progress.bestQuizScore, score);

    // Update completion criteria
    coaching.completionCriteria.passQuiz = score >= coaching.quiz.passingScore;

    // Check if fully completed
    const allCriteriaCompleted = 
      coaching.completionCriteria.readArticles &&
      coaching.completionCriteria.watchVideos &&
      coaching.completionCriteria.reviewCallExamples &&
      coaching.completionCriteria.passQuiz;

    if (allCriteriaCompleted && !coaching.progress.isCompleted) {
      coaching.progress.isCompleted = true;
      coaching.progress.completedAt = new Date();
      coaching.completionCriteria.overallProgress = 100;
    }

    await coaching.save();

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      score,
      passed: score >= coaching.quiz.passingScore,
      bestScore: coaching.progress.bestQuizScore,
      isCompleted: coaching.progress.isCompleted,
      answers: scoredAnswers
    });
  } catch (error) {
    logger.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting quiz'
    });
  }
});

module.exports = router;
