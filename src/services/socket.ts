// ==========================================
// Ponto Game - Socket Client
// ==========================================

import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
// Use your computer's IP address for physical device testing
const DEV_URL = Platform.OS === 'android'
    ? 'http://192.168.1.5:3000'
    : 'http://192.168.1.5:3000';

class SocketService {
    socket: Socket | null = null;

    connect(token: string) {
        this.socket = io(DEV_URL, {
            auth: { token },
            transports: ['websocket'],
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        this.socket.on('connect_error', (err) => {
            console.log('⚠️ Socket connection error:', err);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Generic emit
    emit(event: string, data?: any) {
        this.socket?.emit(event, data);
    }

    // Generic listener
    on(event: string, callback: (data: any) => void) {
        this.socket?.on(event, callback);
    }

    // Remove listener
    off(event: string) {
        this.socket?.off(event);
    }
}

export const socketService = new SocketService();
