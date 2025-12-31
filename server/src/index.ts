// ==========================================
// Ponto Game Server - Main Entry Point
// ==========================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './auth/auth.routes';
import { setupGameSocket } from './game/game.gateway';
import { errorHandler } from './middleware/errorHandler';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// API Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use(errorHandler);

// Setup game socket handlers
setupGameSocket(io);

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`
🎮 Ponto Game Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server running on port ${PORT}
📡 Socket.io ready for connections
🗄️  Database: PostgreSQL + Prisma
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
});

export { io };
