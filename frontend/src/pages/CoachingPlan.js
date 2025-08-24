import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { coachingAPI } from '../services/api';
import { 
  ArrowLeft,
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  Award,
  FileText,
  Video,
  Volume2,
  ExternalLink,
  Trophy
} from 'lucide-react';
import toast from 'react-hot-toast';

const CoachingPlan = () => {
  const { callId } = useParams();
  const navigate = useNavigate();
  
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feedback');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    fetchCoachingPlan();
  }, [callId]);

  const fetchCoachingPlan = async () => {
    try {
      setLoading(true);
      const response = await coachingAPI.get(callId);
      setCoaching(response.data.coaching);
    } catch (error) {
      console.error('Error fetching coaching plan:', error);
      toast.error('Failed to load coaching plan');
    } finally {
      setLoading(false);
    }
  };

  const markResourceAsCompleted = async (type, resourceId) => {
    try {
      await coachingAPI.updateProgress(callId, { type, resourceId });
      await fetchCoachingPlan(); // Refresh data
      toast.success('Progress updated!');
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleQuizAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitQuiz = async () => {
    try {
      const answers = Object.entries(quizAnswers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const response = await coachingAPI.submitQuiz(callId, answers);
      
      if (response.data.passed) {
        toast.success(`Quiz passed with ${response.data.score}%!`);
      } else {
        toast.error(`Quiz score: ${response.data.score}%. You need ${coaching.quiz.passingScore}% to pass.`);
      }
      
      setQuizSubmitted(true);
      await fetchCoachingPlan(); // Refresh data
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const tabs = [
    { id: 'feedback', name: 'Feedback', icon: FileText },
    { id: 'resources', name: 'Resources', icon: BookOpen },
    { id: 'quiz', name: 'Quiz', icon: Award }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!coaching) {
    return (
      <div className="p-6">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Coaching Plan Not Found</h2>
          <p className="text-gray-600 mb-4">
            The coaching plan for this call has not been generated yet.
          </p>
          <Link to={`/call/${callId}`} className="btn-primary">
            Back to Call
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coaching Plan</h1>
            <p className="text-gray-600">
              Personalized training based on your call analysis
            </p>
          </div>
        </div>
        
        {coaching.progress.isCompleted && (
          <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <Trophy className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Completed!</span>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-2">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={`${(coaching.completionCriteria.overallProgress / 100) * 176} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">
                  {coaching.completionCriteria.overallProgress}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Overall</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {coaching.progress.articlesRead.length}/{coaching.recommendedResources.articles.length}
            </div>
            <p className="text-sm text-gray-600">Articles Read</p>
            {coaching.completionCriteria.readArticles && (
              <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
            )}
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {coaching.progress.videosWatched.length}/{coaching.recommendedResources.videos.length}
            </div>
            <p className="text-sm text-gray-600">Videos Watched</p>
            {coaching.completionCriteria.watchVideos && (
              <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
            )}
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {coaching.progress.bestQuizScore}%
            </div>
            <p className="text-sm text-gray-600">Best Quiz Score</p>
            {coaching.completionCriteria.passQuiz && (
              <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
            <p className="text-gray-700">{coaching.personalizedFeedback.summary}</p>
          </div>

          {/* Detailed Feedback */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Detailed Feedback</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {coaching.personalizedFeedback.detailedFeedback}
              </p>
            </div>
          </div>

          {/* Priority Areas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Priority Areas</h3>
            <ul className="space-y-2">
              {coaching.personalizedFeedback.priorityAreas.map((area, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Items */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Action Items</h3>
            <ul className="space-y-2">
              {coaching.personalizedFeedback.actionItems.map((item, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="space-y-6">
          {/* Articles */}
          {coaching.recommendedResources.articles.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📖 Recommended Articles
              </h3>
              <div className="space-y-4">
                {coaching.recommendedResources.articles.map((article, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{article.description}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {article.estimatedReadTime} min read
                          <span className="mx-2">•</span>
                          <span className="capitalize">{article.category}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-2">
                        {coaching.progress.articlesRead.includes(article.title) ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Read</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => markResourceAsCompleted('article', article.title)}
                            className="text-xs btn-primary px-2 py-1"
                          >
                            Mark as Read
                          </button>
                        )}
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {coaching.recommendedResources.videos.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎥 Training Videos
              </h3>
              <div className="space-y-4">
                {coaching.recommendedResources.videos.map((video, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{video.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Video className="h-3 w-3 mr-1" />
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          <span className="mx-2">•</span>
                          <span className="capitalize">{video.category}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-2">
                        {coaching.progress.videosWatched.includes(video.title) ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Watched</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => markResourceAsCompleted('video', video.title)}
                            className="text-xs btn-primary px-2 py-1"
                          >
                            Mark as Watched
                          </button>
                        )}
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <Play className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call Examples */}
          {coaching.recommendedResources.callExamples.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎧 Exemplary Call Examples
              </h3>
              <div className="space-y-4">
                {coaching.recommendedResources.callExamples.map((example, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{example.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{example.description}</p>
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <Volume2 className="h-3 w-3 mr-1" />
                          <span className="capitalize">{example.category}</span>
                        </div>
                        <div className="flex space-x-4 text-xs">
                          <span>Opening: {example.scores.callOpening}%</span>
                          <span>Understanding: {example.scores.issueUnderstanding}%</span>
                          <span>Resolution: {example.scores.resolutionQuality}%</span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-2">
                        {coaching.progress.callExamplesReviewed.includes(example.title) ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Reviewed</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => markResourceAsCompleted('callExample', example.title)}
                            className="text-xs btn-primary px-2 py-1"
                          >
                            Mark as Reviewed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Knowledge Assessment</h3>
              <p className="text-sm text-gray-600">
                Passing score: {coaching.quiz.passingScore}% • 
                Estimated time: {coaching.quiz.estimatedTime} minutes
              </p>
            </div>
            {coaching.progress.quizAttempts.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Best Score:</p>
                <p className="text-lg font-bold text-gray-900">{coaching.progress.bestQuizScore}%</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {coaching.quiz.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  {index + 1}. {question.question}
                </h4>
                
                {question.type === 'multiple-choice' && (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={quizAnswers[question.id] === option}
                          onChange={() => handleQuizAnswer(question.id, option)}
                          className="mr-3"
                          disabled={quizSubmitted}
                        />
                        <span className={quizSubmitted ? 'text-gray-500' : ''}>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'true-false' && (
                  <div className="space-y-2">
                    {['True', 'False'].map((option) => (
                      <label key={option} className="flex items-center">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={quizAnswers[question.id] === option}
                          onChange={() => handleQuizAnswer(question.id, option)}
                          className="mr-3"
                          disabled={quizSubmitted}
                        />
                        <span className={quizSubmitted ? 'text-gray-500' : ''}>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="flex items-center mt-3 text-xs text-gray-500">
                  <span className="capitalize">{question.difficulty}</span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{question.category}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {Object.keys(quizAnswers).length} of {coaching.quiz.questions.length} questions answered
            </div>
            
            {!quizSubmitted && (
              <button
                onClick={submitQuiz}
                disabled={Object.keys(quizAnswers).length < coaching.quiz.questions.length}
                className="btn-primary"
              >
                Submit Quiz
              </button>
            )}

            {quizSubmitted && (
              <div className="text-sm text-green-600">
                Quiz submitted! Check your progress above.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachingPlan;
