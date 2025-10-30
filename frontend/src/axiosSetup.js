// src/axiosSetup.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Store logout handler and redirect function
let logoutHandler = null;
let redirectToLogin = null;

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

export const setRedirectToLogin = (redirectFn) => {
  redirectToLogin = redirectFn;
};

// Request interceptor to add token to headers
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

// Response interceptor to handle token expiration and other auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const errorMessage =
        error.response.data?.message || 'Authentication failed';

      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Call logout handler if exists (for Redux state cleanup)
      if (logoutHandler) {
        logoutHandler(errorMessage);
      }

      // Redirect to login page with error message
      if (redirectToLogin) {
        redirectToLogin(errorMessage);
      } else {
        // Fallback redirect
        window.location.href = `/login`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
