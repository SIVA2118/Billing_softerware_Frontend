import axios from 'axios';
import { API_BASE_URL } from './baseUrl';

const API = axios.create({ baseURL: `${API_BASE_URL}/buyers` });

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const fetchBuyers = () => API.get('/');
export const createBuyer = (data) => API.post('/', data);
export const deleteBuyer = (id) => API.delete(`/${id}`);
