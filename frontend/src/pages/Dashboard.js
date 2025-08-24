import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { callsAPI, analysisAPI } from '../services/api';
import { 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  BarChart3,
  FileAudio,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCalls: 0,
    analyzedCalls: 0,
    averageScore: 0,
    pendingCalls: 0
  });
  const [recentCalls, setRecentCalls] = useState([]);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent calls
      const callsResponse = await callsAPI.list({ limit: 5 });
      setRecentCalls(callsResponse.data.calls);
      
      // Fetch recent analyses
      const analysesResponse = await analysisAPI.list({ limit: 5 });
      setRecentAnalyses(analysesResponse.data.analyses);
      
      // Calculate stats
      const totalCallsResponse = await callsAPI.list({ limit: 100 });
      const allCalls = totalCallsResponse.data.calls;
      
      const analyzedCalls = allCalls.filter(call => call.status === 'analyzed' || call.status === 'coaching-generated');
      const pendingCalls = allCalls.filter(call => ['uploaded', 'transcribing', 'analyzing'].includes(call.status));
      
      // Calculate average score from analyses
      const avgScore = analysesResponse.data.analyses.length > 0
        ? analysesResponse.data.analyses.reduce((sum, analysis) => sum + analysis.overallScore, 0) / analysesResponse.data.analyses.length
        : 0;
      
      setStats({
        totalCalls: allCalls.length,
        analyzedCalls: analyzedCalls.length,
        averageScore: Math.round(avgScore),
        pendingCalls: pendingCalls.length
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploaded':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'transcribing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'transcribed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'analyzing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>;
      case 'analyzed':
      case 'coaching-generated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'uploaded':
        return 'Uploaded';
      case 'transcribing':
        return 'Transcribing...';
      case 'transcribed':
        return 'Transcribed';
      case 'analyzing':
        return 'Analyzing...';
      case 'analyzed':
        return 'Analyzed';
      case 'coaching-generated':
        return 'Complete';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's an overview of your contact center performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileAudio className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.analyzedCalls}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingCalls}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Calls */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Calls</h2>
            <Link 
              to="/upload"
              className="btn-primary text-sm flex items-center"
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload New
            </Link>
          </div>
          
          {recentCalls.length === 0 ? (
            <div className="text-center py-8">
              <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No calls uploaded yet</p>
              <Link 
                to="/upload"
                className="btn-primary mt-4 inline-flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Call
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCalls.map((call) => (
                <div 
                  key={call._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center flex-1">
                    <div className="flex-shrink-0 mr-3">
                      {getStatusIcon(call.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {call.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(call.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <span className="text-xs text-gray-500">
                        {getStatusText(call.status)}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/call/${call._id}`}
                    className="ml-3 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Analysis Results */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Analysis</h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          {recentAnalyses.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No analysis results yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Upload and analyze calls to see results here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => (
                <div 
                  key={analysis._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {analysis.callId?.originalName || 'Unknown Call'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(analysis.analyzedAt)}
                      </p>
                    </div>
                    <div className="flex items-center ml-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getScoreColor(analysis.overallScore)}`}>
                        {analysis.overallScore}%
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/call/${analysis.callId?._id}`}
                    className="ml-3 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/upload"
              className="flex items-center p-4 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors duration-200"
            >
              <Upload className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-primary-800">Upload Call</h3>
                <p className="text-xs text-primary-600">Upload a new call recording</p>
              </div>
            </Link>
            
            <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <Users className="h-8 w-8 text-gray-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-800">Team Analytics</h3>
                <p className="text-xs text-gray-600">Coming soon</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <Calendar className="h-8 w-8 text-gray-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-800">Reports</h3>
                <p className="text-xs text-gray-600">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
