import axios from 'axios';

// Point to your running Backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const uploadFile = (formData) => api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const getReports = () => api.get('/reports');

export default api;