import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gym_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gym_token');
      localStorage.removeItem('gym_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
};

// ─── Workouts ─────────────────────────────────────────────────────────────────
export const workoutsAPI = {
  log:    (data) => api.post('/workouts/log-workout', data),
  my:     (params) => api.get('/workouts/my-workouts', { params }),
  get:    (id)   => api.get(`/workouts/${id}`),
};

// ─── Members ──────────────────────────────────────────────────────────────────
export const membersAPI = {
  list:   (params) => api.get('/members/', { params }),
  get:    (id)     => api.get(`/members/${id}`),
  stats:  (id)     => api.get(`/members/${id}/stats`),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  dashboard: () => api.get('/analytics/get-dashboard-data'),
  leaderboard: () => api.get('/analytics/leaderboard'),

};

// ─── Predictions ──────────────────────────────────────────────────────────────
export const predictionsAPI = {
  churn:    (userId)  => api.get(`/predictions/predict-churn/${userId}`),
  segment:  (userId)  => api.get(`/predictions/segment/${userId}`),
  forecast: (periods) => api.get('/predictions/forecast-revenue', { params: { periods } }),
};

// ─── Recommendations ──────────────────────────────────────────────────────────
export const recommendationsAPI = {
  get: () => api.get('/recommendations/recommend'),
};

// ─── Trainers ─────────────────────────────────────────────────────────────────
export const trainersAPI = {
  list: () => api.get('/trainers/'),
  get:  (id) => api.get(`/trainers/${id}`),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  create: (data) => api.post('/payments/', data),
  my:     ()     => api.get('/payments/my-payments'),
};

export default api;
