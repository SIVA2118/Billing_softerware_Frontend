import axios from 'axios';
import { API_BASE_URL } from './baseUrl';

const API = axios.create({ baseURL: `${API_BASE_URL}/products` });

// Add token to headers if it exists
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const fetchProducts = () => API.get('/');
export const fetchProduct = (id) => API.get(`/${id}`);
export const createProduct = (data) => API.post('/', data);
export const updateProduct = (id, data) => API.put(`/${id}`, data);
export const deleteProduct = (id) => API.delete(`/${id}`);
