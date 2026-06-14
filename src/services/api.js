const BASE_URL = 'http://localhost:3001/api';

const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('nighthub_jwt');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Lỗi kết nối đến server');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

export const authService = {
  login: (email, password) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  socialLogin: () => fetchApi('/auth/social-login', { method: 'POST', body: JSON.stringify({}) }),
  register: (userData) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  forgotPassword: (email) => fetchApi('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (email, otp) => fetchApi('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  resetPassword: (email, newPassword) => fetchApi('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, newPassword }) }),
  getMe: () => fetchApi('/auth/me')
};

export const movieService = {
  getAllMovies: () => fetchApi('/movies'),
  getMovieById: (id) => fetchApi(`/movies/${id}`),
  getCategories: () => fetchApi('/categories'),
  getTags: () => fetchApi('/tags'),
  getTop10Movies: () => fetchApi('/movies/top10')
};

export const profileService = {
  getProfiles: () => fetchApi('/profiles'),
  createProfile: (profileData) => fetchApi('/profiles', { method: 'POST', body: JSON.stringify(profileData) }),
  updateProfile: (id, profileData) => fetchApi(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(profileData) }),
  deleteProfile: (id) => fetchApi(`/profiles/${id}`, { method: 'DELETE' }),
  getVipStatus: () => fetchApi('/profiles/vip-status'),
  upgradeVip: () => fetchApi('/profiles/upgrade-vip', { method: 'POST' })
};

export const watchHistoryService = {
  getWatchHistory: (profileId) => fetchApi(`/watch-history/${profileId}`),
  recordPlay: (profileId, maVP, tienDo = 0) => fetchApi('/watch-history/play', { method: 'POST', body: JSON.stringify({ profileId, maVP, tienDo }) })
};

export const reviewService = {
  getReviews: (movieId) => fetchApi(`/reviews/${movieId}`),
  addReview: (movieId, profileId, text, rating) => fetchApi(`/reviews/${movieId}`, {
    method: 'POST',
    body: JSON.stringify({ profileId, text, rating })
  }),
  deleteReview: (movieId, commentId, profileId) => fetchApi(`/reviews/${movieId}/${commentId}`, {
    method: 'DELETE',
    body: JSON.stringify({ profileId })
  }),
  reportReview: (movieId, commentId, profileId, reason) => fetchApi(`/reviews/${movieId}/${commentId}/report`, {
    method: 'POST',
    body: JSON.stringify({ profileId, reason })
  })
};

export const recommendService = {
  getRecommendations: (profileId) => fetchApi(`/recommend/${profileId}`)
};

export const myListService = {
  getMyList: (profileId) => fetchApi(`/my-list/${profileId}`),
  addToMyList: (profileId, movieId) => fetchApi(`/my-list/${profileId}`, { method: 'POST', body: JSON.stringify({ movieId }) }),
  removeFromMyList: (profileId, movieId) => fetchApi(`/my-list/${profileId}/${movieId}`, { method: 'DELETE' })
};

export default fetchApi;
