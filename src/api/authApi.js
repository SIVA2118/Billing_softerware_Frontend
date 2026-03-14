import axios from 'axios';
import { API_BASE_URL } from './baseUrl';

const API = axios.create({ baseURL: `${API_BASE_URL}/auth` });

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const createEmployee = (data) => API.post('/employees', data);
export const fetchEmployees = () => API.get('/employees');
export const deleteEmployee = (id) => API.delete(`/employees/${id}`);
