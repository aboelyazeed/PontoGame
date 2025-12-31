// ==========================================
// Ponto Game - Auth Store
// ==========================================

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { socketService } from '../services/socket';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
    level: number;
    coins: number;
    rank: string;
    wins: number;
    losses: number;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (data: { username: string; email: string; password: string; displayName: string }) => Promise<void>;
    logout: () => Promise<void>;
    loadUser: () => Promise<void>;
    updateDisplayName: (displayName: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, accessToken, refreshToken } = response.data.data;

            // Save token securely
            await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
            // Save user data (optional, for offline access)
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

            // Connect socket
            socketService.connect(accessToken);

            set({
                user,
                token: accessToken,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            const message = error.response?.data?.error?.message || 'فشل تسجيل الدخول';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    register: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/register', data);
            const { user, accessToken } = response.data.data;

            // Save token
            await SecureStore.setItemAsync(TOKEN_KEY, accessToken);

            // Connect socket
            socketService.connect(accessToken);

            set({
                user,
                token: accessToken,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            const message = error.response?.data?.error?.message || 'فشل إنشاء الحساب';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        try {
            // Optional: call logout API
            // await api.post('/auth/logout');
        } catch (error) {
            console.warn('Logout API failed', error);
        } finally {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
            socketService.disconnect();

            set({
                user: null,
                token: null,
                isAuthenticated: false,
                error: null,
            });
        }
    },

    loadUser: async () => {
        set({ isLoading: true });
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);

            if (token) {
                // Set default header
                api.defaults.headers.common.Authorization = `Bearer ${token}`;

                // Fetch user profile
                const response = await api.get('/auth/me');
                const user = response.data.data;

                // Connect socket
                socketService.connect(token);

                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false, isAuthenticated: false });
            }
        } catch (error) {
            // Token invalid or expired
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },

    updateDisplayName: async (displayName: string) => {
        const state = get();
        try {
            const response = await api.patch('/auth/profile', { displayName });
            const updatedUser = response.data.data;

            set({ user: { ...state.user, ...updatedUser } as User });

            // Update stored user data
            if (state.user) {
                await SecureStore.setItemAsync(USER_KEY, JSON.stringify({ ...state.user, displayName }));
            }
        } catch (error: any) {
            const message = error.response?.data?.error?.message || 'فشل تحديث الاسم';
            throw new Error(message);
        }
    },

    deleteAccount: async () => {
        const state = get();
        try {
            await api.delete('/auth/account');

            // Clear everything
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
            socketService.disconnect();

            set({
                user: null,
                token: null,
                isAuthenticated: false,
                error: null,
            });
        } catch (error: any) {
            const message = error.response?.data?.error?.message || 'فشل حذف الحساب';
            throw new Error(message);
        }
    },

    clearError: () => set({ error: null }),
}));
