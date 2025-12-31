// ==========================================
// Ponto Game - Error Handler Middleware
// ==========================================

import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('❌ Error:', err.message);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'حدث خطأ غير متوقع';

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            code: err.code || 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};

// Custom error class
export class ApiError extends Error {
    statusCode: number;
    code: string;

    constructor(message: string, statusCode: number = 400, code: string = 'BAD_REQUEST') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'ApiError';
    }

    static badRequest(message: string) {
        return new ApiError(message, 400, 'BAD_REQUEST');
    }

    static unauthorized(message: string = 'غير مصرح') {
        return new ApiError(message, 401, 'UNAUTHORIZED');
    }

    static forbidden(message: string = 'ممنوع الوصول') {
        return new ApiError(message, 403, 'FORBIDDEN');
    }

    static notFound(message: string = 'غير موجود') {
        return new ApiError(message, 404, 'NOT_FOUND');
    }

    static conflict(message: string) {
        return new ApiError(message, 409, 'CONFLICT');
    }

    static internal(message: string = 'خطأ داخلي في السيرفر') {
        return new ApiError(message, 500, 'INTERNAL_ERROR');
    }
}
