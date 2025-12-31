// ==========================================
// Ponto Game - Auth Middleware
// ==========================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler.js';

export interface JwtPayload {
    userId: string;
    username: string;
    iat: number;
    exp: number;
}

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('توكن المصادقة مطلوب');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw ApiError.unauthorized('توكن غير صالح');
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'secret'
        ) as JwtPayload;

        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(ApiError.unauthorized('توكن منتهي الصلاحية أو غير صالح'));
        } else {
            next(error);
        }
    }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token) {
                const decoded = jwt.verify(
                    token,
                    process.env.JWT_SECRET || 'secret'
                ) as JwtPayload;
                req.user = decoded;
            }
        }
        next();
    } catch {
        // Ignore errors for optional auth
        next();
    }
};
