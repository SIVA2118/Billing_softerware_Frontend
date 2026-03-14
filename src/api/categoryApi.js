import axios from 'axios';
import { API_BASE_URL } from './baseUrl';

const API = axios.create({ baseURL: `${API_BASE_URL}/categories` });

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const fetchCategories = () => API.get('/');
export const createCategory = (data) => API.post('/', data);
export const deleteCategory = (id) => API.delete(`/${id}`);
