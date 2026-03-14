const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = rawBaseUrl
    ? rawBaseUrl.replace(/\/$/, '')
    : '/api';
