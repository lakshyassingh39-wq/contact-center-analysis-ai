import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for file uploads
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  demoLogin: () => api.post('/auth/demo-login'),
};

// Calls API
export const callsAPI = {
  upload: (formData) => api.post('/calls/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  list: (params = {}) => api.get('/calls', { params }),
  get: (id) => api.get(`/calls/${id}`),
  delete: (id) => api.delete(`/calls/${id}`),
};

// Analysis API
export const analysisAPI = {
  transcribe: (callId) => api.post(`/analysis/transcribe/${callId}`),
  analyze: (callId) => api.post(`/analysis/analyze/${callId}`),
  get: (callId) => api.get(`/analysis/${callId}`),
  list: (params = {}) => api.get('/analysis', { params }),
};

// Coaching API
export const coachingAPI = {
  generate: (callId) => api.post(`/coaching/generate/${callId}`),
  get: (callId) => api.get(`/coaching/${callId}`),
  list: (params = {}) => api.get('/coaching', { params }),
  updateProgress: (callId, progressData) => 
    api.post(`/coaching/${callId}/progress`, progressData),
  submitQuiz: (callId, answers) => 
    api.post(`/coaching/${callId}/quiz`, { answers }),
};

export default api;
