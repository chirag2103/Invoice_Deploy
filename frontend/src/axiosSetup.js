// src/axiosSetup.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// let logoutHandler is injected later
let logoutHandler = null;
export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (logoutHandler) logoutHandler(); // call injected handler
    }
    return Promise.reject(error);
  }
);

export default api;
