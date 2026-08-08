const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const REMOTE_API_BASE_URL = 'https://agencies-billing.onrender.com/api';

const getDefaultApiBaseUrl = () => {
    if (typeof window === 'undefined') {
        return '/api';
    }

    const hostname = window.location?.hostname || '';

    if (hostname.includes('vercel.app')) {
        return REMOTE_API_BASE_URL;
    }

    // In local Vite dev, call the Render backend directly instead of relying on
    // the dev proxy, which can intermittently drop long-lived HTTPS connections.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return REMOTE_API_BASE_URL;
    }

    return '/api';
};

export const API_BASE_URL = rawBaseUrl
    ? rawBaseUrl.replace(/\/$/, '')
    : getDefaultApiBaseUrl();
