import axios from 'axios';
import { API_BASE_URL } from './baseUrl';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchRoutes = () => axios.get(`${API_BASE_URL}/routes`, getAuthHeaders());
export const createRoute = (data) => axios.post(`${API_BASE_URL}/routes`, data, getAuthHeaders());
export const deleteRoute = (id) => axios.delete(`${API_BASE_URL}/routes/${id}`, getAuthHeaders());
