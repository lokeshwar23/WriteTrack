import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If a 401 error occurs, the token is invalid or expired.
      // Clear the token and redirect to the login page.
      localStorage.removeItem('token');
      if (typeof window.handleSessionTimeout === 'function') {
        window.handleSessionTimeout();
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Check token expiration periodically
const checkTokenExpiration = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        localStorage.removeItem('token');
        if (typeof window.handleSessionTimeout === 'function') {
          window.handleSessionTimeout();
        } else {
          window.location.href = '/login';
        }
      }
    } catch (error) {
      localStorage.removeItem('token');
      if (typeof window.handleSessionTimeout === 'function') {
        window.handleSessionTimeout();
      } else {
        window.location.href = '/login';
      }
    }
  }
};

// Check token expiration every minute
setInterval(checkTokenExpiration, 60000);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => api.post('/auth/login', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/change-password', { currentPassword, password: newPassword }),
  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, password: newPassword })
};

// Posts API
export const postsAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  getUserPosts: () => api.get('/posts/user/me'),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (postData) => api.post('/posts', postData),
  updatePost: (id, postData) => api.put(`/posts/${id}`, postData),
  deletePost: (id) => api.delete(`/posts/${id}`)
};


// Tasks API
export const tasksAPI = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  toggleComplete: (id) => api.patch(`/tasks/${id}/toggle`),
  assignTask: (id, userId) => api.post(`/tasks/${id}/assign`, { userId })
};


// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentPosts: () => api.get('/dashboard/recent-posts'),
  getRecentTasks: () => api.get('/dashboard/recent-tasks'),
  getActivity: () => api.get('/dashboard/activity')
};

export default api;
