import axios from 'axios';

// Create a central client
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true 
});

// Upload Function
export const uploadFile = (formData) => api.post('/upload', formData, {
  headers: { 
    'Content-Type': 'multipart/form-data' 
  }
});

// Get Reports Function
export const getReports = () => api.get('/reports');

// Logout Function
export const logoutUser = () => api.post('/auth/logout');

export default api;