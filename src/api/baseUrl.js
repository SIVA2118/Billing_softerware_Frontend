const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

const getDefaultApiBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location?.hostname?.includes('vercel.app')) {
        return 'https://agencies-billing.onrender.com/api';
    }
    return '/api';
};

export const API_BASE_URL = rawBaseUrl
    ? rawBaseUrl.replace(/\/$/, '')
    : getDefaultApiBaseUrl();
