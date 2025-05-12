import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.56.1:4000/api', // Replace with your backend API URL
  timeout: 5000,
});

export default api;
