import axios from 'axios';

export const BASE_URL = 'http://localhost:3000';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: tự động gắn token (nếu có) vào mỗi request
axiosInstance.interceptors.request.use((config) => {
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const parsed = JSON.parse(userData);
            if (parsed?.token) {
                config.headers.Authorization = `Bearer ${parsed.token}`;
            }
        } catch (_) {}
    }
    return config;
});

export default axiosInstance;
