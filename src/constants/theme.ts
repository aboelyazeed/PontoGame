// ==========================================
// Ponto Game - Theme Constants
// ==========================================

export const COLORS = {
    // Primary colors
    primary: '#09aa09',
    primaryDark: '#078807',
    primaryLight: '#2ed12e',
    accentGreen: '#4ade80',

    // Background colors
    backgroundDark: '#102210',
    backgroundLight: '#f5f8f5',
    surfaceDark: '#1a2e1a',
    surfaceDarker: '#0d1a0d',
    mutedGreen: '#2b402b',

    // Text colors
    textPrimary: '#ffffff',
    textSecondary: '#9db99d',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    textSlate: '#94a3b8',

    // UI colors
    cardBackground: 'rgba(255, 255, 255, 0.1)',
    cardBorder: 'rgba(255, 255, 255, 0.05)',

    // Semantic colors
    success: '#27ae60',
    error: '#c0392b',
    warning: '#f39c12',
    gold: '#fbbf24',
};

export const FONTS = {
    regular: 'NotoSansArabic_400Regular',
    bold: 'NotoSansArabic_700Bold',
    black: 'NotoSansArabic_900Black',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const BORDER_RADIUS = {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
};

export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    glow: (color: string, intensity: number = 0.5) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: intensity,
        shadowRadius: 20,
        elevation: 10,
    }),
};
