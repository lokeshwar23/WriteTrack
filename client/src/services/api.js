import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear tokens and show session timeout popup
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          if (typeof window.handleSessionTimeout === 'function') {
            window.handleSessionTimeout();
          } else {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, force logout
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (typeof window.handleSessionTimeout === 'function') {
          window.handleSessionTimeout();
        } else {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => api.post('/auth/login', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  sendOTP: (email) => api.post('/auth/send-otp', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/change-password', { currentPassword, password: newPassword }),
  updateProfile: (profileData) => {
    const formData = new FormData();
    Object.keys(profileData).forEach(key => {
      if (profileData[key] !== undefined && profileData[key] !== null) {
        formData.append(key, profileData[key]);
      }
    });
    return api.put('/auth/update-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  updatePreferences: (preferences) => api.put('/auth/update-preferences', preferences),
  deleteAccount: (password) => api.delete('/auth/delete-account', { data: { password } })
};

// Posts API
export const postsAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  getUserPosts: () => api.get('/posts/user/me'),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (postData) => api.post('/posts', postData),
  updatePost: (id, postData) => api.put(`/posts/${id}`, postData),
  deletePost: (id) => api.delete(`/posts/${id}`),
  toggleLike: (id) => api.post(`/posts/${id}/like`)
};

// Comments API
export const commentsAPI = {
  getComments: (postId) => api.get(`/comments/post/${postId}`),
  createComment: (commentData) => api.post('/comments', commentData),
  updateComment: (id, commentData) => api.put(`/comments/${id}`, commentData),
  deleteComment: (id) => api.delete(`/comments/${id}`),
  toggleLike: (id) => api.post(`/comments/${id}/like`)
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

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.put(`/users/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentPosts: () => api.get('/dashboard/recent-posts'),
  getRecentTasks: () => api.get('/dashboard/recent-tasks'),
  getActivity: () => api.get('/dashboard/activity')
};

export default api; 