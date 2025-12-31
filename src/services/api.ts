// ==========================================
// Ponto Game - API Client
// ==========================================

import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ⚠️ IMPORTANT: Replace with your computer's IP address for physical device testing
// Run 'ipconfig' in terminal and find your IPv4 address (e.g., 192.168.1.x)
const LOCAL_IP = '192.168.1.5'; // User's IP address

// Determine API URL based on platform
const getApiUrl = () => {
    if (__DEV__) {
        // Development mode
        if (Platform.OS === 'android') {
            // Android Emulator uses 10.0.2.2 to reach host machine
            // Physical Android device needs actual IP
            return `http://${LOCAL_IP}:3000/api`;
        } else if (Platform.OS === 'ios') {
            // iOS Simulator can use localhost
            // Physical iOS device needs actual IP
            return `http://${LOCAL_IP}:3000/api`;
        } else {
            // Web
            return 'http://localhost:3000/api';
        }
    }
    // Production URL (update when deploying)
    return 'https://your-production-api.com/api';
};

const API_URL = getApiUrl();
console.log('🔗 API URL:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('Error fetching token', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized (Token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // TODO: Refresh token logic
                return api(originalRequest);
            } catch (refreshError) {
                // TODO: Redirect to login
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
