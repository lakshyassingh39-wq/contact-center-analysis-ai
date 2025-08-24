import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { callsAPI, analysisAPI, coachingAPI } from '../services/api';
import { 
  ArrowLeft, 
  Play, 
  FileText, 
  BarChart3, 
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const CallDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { joinCallRoom, leaveCallRoom } = useSocket();
  
  const [call, setCall] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCallData();
    joinCallRoom(id);
    
    return () => {
      leaveCallRoom(id);
    };
  }, [id]);

  const fetchCallData = async () => {
    try {
      setLoading(true);
      
      // Fetch call details
      const callResponse = await callsAPI.get(id);
      setCall(callResponse.data.call);
      
      // Fetch analysis if available
      try {
        const analysisResponse = await analysisAPI.get(id);
        setAnalysis(analysisResponse.data.analysis);
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error fetching analysis:', error);
        }
      }
      
      // Fetch coaching if available
      try {
        const coachingResponse = await coachingAPI.get(id);
        setCoaching(coachingResponse.data.coaching);
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error fetching coaching:', error);
        }
      }
      
    } catch (error) {
      console.error('Error fetching call data:', error);
      toast.error('Failed to load call data');
    } finally {
      setLoading(false);
    }
  };

  const handleTranscribe = async () => {
    try {
      setProcessing(true);
      await analysisAPI.transcribe(id);
      toast.success('Transcription started');
      
      // Refresh data after a short delay
      setTimeout(fetchCallData, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start transcription');
    } finally {
      setProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setProcessing(true);
      await analysisAPI.analyze(id);
      toast.success('Analysis started');
      
      // Refresh data after a short delay
      setTimeout(fetchCallData, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start analysis');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateCoaching = async () => {
    try {
      setProcessing(true);
      await coachingAPI.generate(id);
      toast.success('Coaching plan generation started');
      
      // Refresh data after a short delay
      setTimeout(fetchCallData, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start coaching generation');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploaded':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'transcribing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>;
      case 'transcribed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'analyzing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>;
      case 'analyzed':
      case 'coaching-generated':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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

  if (!call) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Call Not Found</h2>
          <p className="text-gray-600 mb-4">The requested call could not be found.</p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
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
            <h1 className="text-2xl font-bold text-gray-900">{call.originalName}</h1>
            <p className="text-gray-600">Uploaded {formatDate(call.uploadedAt)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon(call.status)}
          <span className="text-sm font-medium text-gray-700 capitalize">
            {call.status.replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* Call Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">File Size:</span>
              <span className="ml-2 text-sm font-medium">{(call.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Duration:</span>
              <span className="ml-2 text-sm font-medium">{formatDuration(call.duration)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Call Type:</span>
              <span className="ml-2 text-sm font-medium capitalize">{call.metadata?.callType || 'Unknown'}</span>
            </div>
            {call.metadata?.agentInfo && (
              <div>
                <span className="text-sm text-gray-500">Agent:</span>
                <span className="ml-2 text-sm font-medium">{call.metadata.agentInfo}</span>
              </div>
            )}
            {call.metadata?.customerInfo && (
              <div>
                <span className="text-sm text-gray-500">Customer:</span>
                <span className="ml-2 text-sm font-medium">{call.metadata.customerInfo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Summary */}
        {analysis && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Overall Score:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Call Opening:</span>
                <span className="text-sm font-medium">{analysis.scores.callOpening.score}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Issue Understanding:</span>
                <span className="text-sm font-medium">{analysis.scores.issueUnderstanding.score}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Resolution Quality:</span>
                <span className="text-sm font-medium">{analysis.scores.resolutionQuality.score}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Predicted CSAT:</span>
                <span className="text-sm font-medium">{analysis.scores.csat.predictedScore}/5</span>
              </div>
            </div>
          </div>
        )}

        {/* Coaching Progress */}
        {coaching && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coaching Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Overall Progress</span>
                  <span className="font-medium">{coaching.completionCriteria.overallProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill bg-blue-600" 
                    style={{ width: `${coaching.completionCriteria.overallProgress}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Articles Read:</span>
                  <span className={coaching.completionCriteria.readArticles ? 'text-green-600' : 'text-gray-400'}>
                    {coaching.progress.articlesRead.length}/{coaching.recommendedResources.articles.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Videos Watched:</span>
                  <span className={coaching.completionCriteria.watchVideos ? 'text-green-600' : 'text-gray-400'}>
                    {coaching.progress.videosWatched.length}/{coaching.recommendedResources.videos.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Quiz Score:</span>
                  <span className={coaching.completionCriteria.passQuiz ? 'text-green-600' : 'text-gray-400'}>
                    {coaching.progress.bestQuizScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {!call.transcript && call.status === 'uploaded' && (
          <button
            onClick={handleTranscribe}
            disabled={processing}
            className="btn-primary flex items-center"
          >
            {processing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Start Transcription
          </button>
        )}

        {call.transcript && !analysis && call.status === 'transcribed' && (
          <button
            onClick={handleAnalyze}
            disabled={processing}
            className="btn-primary flex items-center"
          >
            {processing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            Start Analysis
          </button>
        )}

        {analysis && !coaching && call.status === 'analyzed' && (
          <button
            onClick={handleGenerateCoaching}
            disabled={processing}
            className="btn-primary flex items-center"
          >
            {processing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <BookOpen className="h-4 w-4 mr-2" />
            )}
            Generate Coaching Plan
          </button>
        )}

        {coaching && (
          <Link
            to={`/coaching/${id}`}
            className="btn-primary flex items-center"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            View Coaching Plan
          </Link>
        )}

        <button
          onClick={fetchCallData}
          className="btn-secondary flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Transcript */}
      {call.transcript && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Transcript</h3>
            <button className="btn-secondary text-sm flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {call.transcript}
            </p>
          </div>
        </div>
      )}

      {/* Analysis Details */}
      {analysis && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Strengths</h4>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Improvement Areas</h4>
              <ul className="space-y-2">
                {analysis.improvementAreas.map((area, index) => (
                  <li key={index} className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {analysis.keyInsights && analysis.keyInsights.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Key Insights</h4>
              <ul className="space-y-2">
                {analysis.keyInsights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <Eye className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CallDetail;
