// ==========================================
// Ponto Game - Auth Service
// ==========================================

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

const SALT_ROUNDS = 10;

export interface RegisterInput {
    username: string;
    email: string;
    password: string;
    displayName: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export class AuthService {
    // ========================================
    // Register new user
    // ========================================
    async register(input: RegisterInput) {
        const { username, email, password, displayName } = input;

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username },
                ],
            },
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw ApiError.conflict('البريد الإلكتروني مستخدم بالفعل');
            }
            throw ApiError.conflict('اسم المستخدم مستخدم بالفعل');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                displayName,
            },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                level: true,
                coins: true,
                rank: true,
                createdAt: true,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.username);

        return { user, ...tokens };
    }

    // ========================================
    // Login user
    // ========================================
    async login(input: LoginInput) {
        const { email, password } = input;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw ApiError.unauthorized('بيانات الدخول غير صحيحة');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
            throw ApiError.unauthorized('بيانات الدخول غير صحيحة');
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.username);

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                level: user.level,
                xp: user.xp,
                coins: user.coins,
                rank: user.rank,
                wins: user.wins,
                losses: user.losses,
                winStreak: user.winStreak,
            },
            ...tokens,
        };
    }

    // ========================================
    // Refresh tokens
    // ========================================
    async refreshTokens(refreshToken: string) {
        // Find token in database
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!storedToken) {
            throw ApiError.unauthorized('توكن التحديث غير صالح');
        }

        // Check expiry
        if (storedToken.expiresAt < new Date()) {
            // Delete expired token
            await prisma.refreshToken.delete({
                where: { id: storedToken.id },
            });
            throw ApiError.unauthorized('توكن التحديث منتهي الصلاحية');
        }

        // Delete old token
        await prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });

        // Generate new tokens
        return this.generateTokens(storedToken.userId, storedToken.user.username);
    }

    // ========================================
    // Logout (revoke refresh token)
    // ========================================
    async logout(refreshToken: string) {
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }

    // ========================================
    // Get current user
    // ========================================
    async getCurrentUser(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                level: true,
                xp: true,
                coins: true,
                rank: true,
                wins: true,
                losses: true,
                winStreak: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw ApiError.notFound('المستخدم غير موجود');
        }

        return user;
    }

    // ========================================
    // Update user profile
    // ========================================
    async updateProfile(userId: string, data: { displayName?: string }) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                displayName: data.displayName,
            },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                level: true,
                xp: true,
                coins: true,
                rank: true,
                wins: true,
                losses: true,
                winStreak: true,
            },
        });

        return user;
    }

    // ========================================
    // Delete user account
    // ========================================
    async deleteAccount(userId: string) {
        // Delete refresh tokens first
        await prisma.refreshToken.deleteMany({
            where: { userId },
        });

        // Delete user
        await prisma.user.delete({
            where: { id: userId },
        });

        return { success: true };
    }

    // ========================================
    // Generate access & refresh tokens
    // ========================================
    private async generateTokens(userId: string, username: string): Promise<TokenPair> {
        // Access token
        const secret = process.env.JWT_SECRET || 'secret';
        const accessToken = jwt.sign(
            { userId, username },
            secret,
            { expiresIn: '1h' } as jwt.SignOptions
        );

        // Refresh token
        const refreshToken = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt,
            },
        });

        return { accessToken, refreshToken };
    }
}

export const authService = new AuthService();
