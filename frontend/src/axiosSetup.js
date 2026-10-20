import { getSessionVersion } from './services/session';
// src/axiosSetup.js
import axios from 'axios';
import { getErrorMessage } from './services/apiError';

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
    config.sessionVersion = getSessionVersion();
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

// Endpoints where a 401 means "wrong credentials" / "not logged in yet", not
// "your session expired" — a failed login must never force-redirect the user
// away from the login form before they see why it failed.
const AUTH_ENDPOINT_PATTERN =
  /\/api\/(login|register|user\/forgotPassword|user\/password\/reset)/;

// Response interceptor to handle token expiration and other auth errors
api.interceptors.response.use(
  (response) => {
    if (response.config.sessionVersion !== getSessionVersion()) {
      throw new axios.CanceledError('Session changed');
    }
    return response;
  },
  (error) => {
    if (error.config && error.config.sessionVersion !== getSessionVersion()) {
      return Promise.reject(new axios.CanceledError('Session changed'));
    }
    error.uiMessage = getErrorMessage(error);

    const isAuthEndpoint = AUTH_ENDPOINT_PATTERN.test(error.config?.url || '');

    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      const errorMessage = error.uiMessage;

      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // The logout/redirect below is a hard page reload, so a toast fired
      // here would be wiped out immediately. Stash the message and let the
      // login page surface it once it remounts.
      try {
        sessionStorage.setItem('authRedirectMessage', errorMessage);
      } catch {
        // sessionStorage unavailable (private browsing etc.) — non-fatal.
      }

      // Call logout handler if exists (for Redux state cleanup)
      if (logoutHandler) {
        logoutHandler(errorMessage);
      }

      // Redirect to login page with error message
      if (redirectToLogin) {
        redirectToLogin(errorMessage);
      } else if (!window.location.pathname.startsWith('/login')) {
        // Fallback redirect — only if we're not already there.
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
