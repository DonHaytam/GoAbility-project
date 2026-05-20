import axios from 'axios';

const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const apiBaseURL = rawBaseURL.endsWith('/api') ? rawBaseURL : `${rawBaseURL.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: apiBaseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getCategories: () => api.get('/products/categories'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

export const trainingAPI = {
  getPrograms: (params) => api.get('/training/programs', { params }),
  getProgram: (id) => api.get(`/training/programs/${id}`),
  createProgram: (data) => api.post('/training/programs', data),
  enroll: (programId) => api.post('/training/enroll', { programId }),
  getEnrollments: () => api.get('/training/enrollments'),
  logProgress: (data) => api.post('/training/progress', data),
  getProgress: () => api.get('/training/progress'),
  getAthleteProgress: (id) => api.get(`/training/athletes/${id}/progress`),
};

export const communityAPI = {
  getPosts: (params) => api.get('/community/posts', { params }),
  getPost: (id) => api.get(`/community/posts/${id}`),
  createPost: (data) => api.post('/community/posts', data),
  addComment: (postId, content) => api.post(`/community/posts/${postId}/comments`, { content }),
  togglePostLike: (postId) => api.post(`/community/posts/${postId}/like`),
  checkPostLiked: (postId) => api.get(`/community/posts/${postId}/liked`),
  toggleStoryLike: (storyId) => api.post(`/community/stories/${storyId}/like`),
  approvePost: (id) => api.put(`/community/posts/${id}/approve`),
  deletePost: (id) => api.delete(`/community/posts/${id}`),
  getEvents: () => api.get('/community/events'),
  createEvent: (data) => api.post('/community/events', data),
  registerForEvent: (id) => api.post(`/community/events/${id}/register`),
  getAssociations: () => api.get('/community/associations'),
  getStories: () => api.get('/community/stories'),
  createStory: (data) => api.post('/community/stories', data),
  getMentors: () => api.get('/community/mentors'),
  requestMentorship: (mentorId, goals) => api.post('/community/mentorships', { mentorId, goals }),
};

export const paymentAPI = {
  fakeCheckout: (data) => api.post('/payments/fake-checkout', data),
  getTransactions: () => api.get('/payments/transactions'),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getAthleteStats: () => api.get('/analytics/athlete-stats'),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getAthletes: () => api.get('/users/athletes'),
  getCoaches: () => api.get('/users/coaches'),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  toggleStatus: (id) => api.put(`/users/${id}/toggle-status`),
};

export const contactAPI = {
  send: (data) => api.post('/contact', data),
  getAll: () => api.get('/contact'),
};

export const messagesAPI = {
  getInbox: () => api.get('/messages/inbox'),
  getSent: () => api.get('/messages/sent'),
  getConversation: (userId) => api.get(`/messages/conversation/${userId}`),
  send: (receiverId, content) => api.post('/messages', { receiverId, content }),
  markRead: (id) => api.put(`/messages/${id}/read`),
  getUnreadCount: () => api.get('/messages/unread-count'),
};

export default api;
