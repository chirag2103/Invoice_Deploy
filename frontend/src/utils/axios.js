import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies
});

let logoutCallback = null;

export const setLogoutCallback = (callback) => {
  logoutCallback = callback;
};

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
let isLoggingOut = false;

instance.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log('Response received:', {
      status: response.status,
      hasToken: !!response.data.token,
      endpoint: response.config.url,
    });
    return response;
  },
  (error) => {
    console.error('Response error:', error.response || error);

    if (error.response) {
      // Handle 401 Unauthorized errors
      if (error.response.status === 401 && !isLoggingOut) {
        const errorMessage = error.response.data.message || '';
        console.log('401 error received:', errorMessage);

        // Only handle token-related 401s for automatic logout
        if (
          errorMessage.toLowerCase().includes('token') ||
          errorMessage.toLowerCase().includes('expired') ||
          errorMessage.toLowerCase().includes('authentication failed')
        ) {
          isLoggingOut = true;
          console.log('Initiating logout process');
          // Clear token
          localStorage.removeItem('token');
          // Call logout callback if set
          if (logoutCallback) {
            logoutCallback();
          }
          // Reset flag after a delay
          setTimeout(() => {
            isLoggingOut = false;
          }, 1000);
        }
      }

      // Return the error message from the server
      return Promise.reject({
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
        data: error.response.data,
      });
    }

    // Handle network errors
    return Promise.reject({
      message: error.message || 'Network error occurred',
      status: 0,
    });
  }
);

export default instance;
