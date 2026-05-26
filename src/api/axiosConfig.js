import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Se proxyará a través de Vite
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
