import axios from 'axios';
import { API_BASE_URL } from './baseUrl';

const API = axios.create({ baseURL: `${API_BASE_URL}/invoices` });

// Add token to headers if it exists
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const fetchInvoices = (params = {}) => API.get('/', { params });
export const fetchInvoice = (id) => API.get(`/${id}`);
export const createInvoice = (data) => API.post('/', data);
export const updateInvoice = (id, data) => API.put(`/${id}`, data);
export const deleteInvoice = (id) => API.delete(`/${id}`);
