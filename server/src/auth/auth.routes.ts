// ==========================================
// Ponto Game - Auth Routes
// ==========================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// ==========================================
// Validation Schemas
// ==========================================

const registerSchema = z.object({
    username: z.string()
        .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
        .max(20, 'اسم المستخدم يجب ألا يتجاوز 20 حرف')
        .regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يحتوي على أحرف غير مسموحة'),
    email: z.string()
        .email('البريد الإلكتروني غير صالح'),
    password: z.string()
        .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    displayName: z.string()
        .min(2, 'الاسم المعروض يجب أن يكون حرفين على الأقل')
        .max(30, 'الاسم المعروض يجب ألا يتجاوز 30 حرف'),
});

const loginSchema = z.object({
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'توكن التحديث مطلوب'),
});

// ==========================================
// Routes
// ==========================================

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = registerSchema.parse(req.body);
        const result = await authService.register(data);

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            data: result,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(ApiError.badRequest(error.errors[0].message));
        } else {
            next(error);
        }
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await authService.login(data);

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: result,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(ApiError.badRequest(error.errors[0].message));
        } else {
            next(error);
        }
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = refreshSchema.parse(req.body);
        const tokens = await authService.refreshTokens(refreshToken);

        res.json({
            success: true,
            data: tokens,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(ApiError.badRequest(error.errors[0].message));
        } else {
            next(error);
        }
    }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await authService.logout(refreshToken);
        }

        res.json({
            success: true,
            message: 'تم تسجيل الخروج بنجاح',
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await authService.getCurrentUser(req.user!.userId);

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/auth/profile - Update profile
router.patch('/profile', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { displayName } = req.body;

        if (!displayName || displayName.length < 2) {
            throw ApiError.badRequest('الاسم المعروض يجب أن يكون حرفين على الأقل');
        }

        const user = await authService.updateProfile(req.user!.userId, { displayName });

        res.json({
            success: true,
            message: 'تم تحديث البروفايل بنجاح',
            data: user,
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/auth/account - Delete account
router.delete('/account', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await authService.deleteAccount(req.user!.userId);

        res.json({
            success: true,
            message: 'تم حذف الحساب بنجاح',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
