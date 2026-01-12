// ==========================================
// Ponto Game - Splash Screen
// ==========================================

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    I18nManager,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

// Ponto Logo
const PontoLogo = require('../../assets/Ponto Logo.png');
const SplashFooter = require('../../assets/splashfooter.png');

// Force RTL
I18nManager.forceRTL(true);

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish?: () => void;
    progress?: number; // 0-100
}

const SplashScreen: React.FC<SplashScreenProps> = ({
    onFinish,
    progress = 0,
}) => {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const hasFinished = useRef(false);

    // Pulse animation for loading text
    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.5,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    // Entrance animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Simulate loading progress
    useEffect(() => {
        if (progress > 0) {
            setLoadingProgress(progress);
            return;
        }

        // Demo progress for splash screen
        const interval = setInterval(() => {
            setLoadingProgress((prev) => {
                const next = prev + Math.random() * 15;
                if (next >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return next;
            });
        }, 300);

        return () => clearInterval(interval);
    }, [progress]);

    // Handle finish callback separately to avoid setState during render
    useEffect(() => {
        if (loadingProgress >= 100 && !hasFinished.current) {
            hasFinished.current = true;
            // Use setTimeout to ensure we're not in a render cycle
            const timer = setTimeout(() => {
                onFinish?.();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loadingProgress, onFinish]);

    return (
        <View style={styles.container}>
            {/* Background pattern */}
            <View style={styles.patternOverlay} />

            {/* Top glow effect */}
            <View style={styles.topGlow} />

            {/* Main content */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Title with Ponto Logo */}
                <View style={styles.titleContainer}>
                    {/* Ponto Logo instead of text */}
                    <Image
                        source={PontoLogo}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.subtitle}>
                        <Text style={styles.titleDot}>.</Text>
                        لعبة كروت كورة أونلاين
                    </Text>
                </View>
            </Animated.View>

            {/* Footer image with cards */}
            <Image
                source={SplashFooter}
                style={styles.footerImage}
                resizeMode="contain"
            />

            {/* Bottom section */}
            <View style={styles.bottomSection}>
                {/* Loading indicator */}
                <View style={styles.loadingContainer}>
                    <Animated.Text
                        style={[
                            styles.loadingText,
                            { opacity: pulseAnim },
                        ]}
                    >
                        جاري التحميل...
                    </Animated.Text>

                    {/* Progress bar */}
                    <View style={styles.progressBackground}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${Math.min(loadingProgress, 100)}%` },
                            ]}
                        />
                    </View>
                </View>

                {/* Version */}
                <Text style={styles.versionText}>v1.0.0 Alpha</Text>
            </View>

            {/* Bottom gradient fade */}
            <LinearGradient
                colors={['transparent', COLORS.backgroundDark]}
                style={styles.bottomGradient}
                pointerEvents="none"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    patternOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
    },
    topGlow: {
        position: 'absolute',
        top: -height * 0.1,
        left: '50%',
        marginLeft: -width * 0.75,
        width: width * 1.5,
        height: height * 0.5,
        backgroundColor: COLORS.primary,
        opacity: 0.1,
        borderRadius: 9999,
        transform: [{ scaleY: 0.5 }],
    },
    content: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: height * 0.15,
        gap: SPACING.lg,
    },
    logoImage: {
        width: 350,
        height: 175,
    },
    titleContainer: {
        alignItems: 'center',
        gap: SPACING.md,
    },
    titleDot: {
        fontSize: 70,
        fontWeight: '900',
        color: COLORS.primary,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: '500',
        color: '#9db99d',
        opacity: 0.9,
        letterSpacing: 0.5,
    },
    footerImage: {
        width: width - 40,
        height: height * 0.4,
        position: 'absolute',
        bottom: 80,
        left: 20,
        right: 20,
    },
    bottomSection: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: SPACING.xl + SPACING.md,
        paddingHorizontal: SPACING.xl,
        gap: SPACING.lg,
    },
    loadingContainer: {
        width: '100%',
        maxWidth: 200,
        alignItems: 'center',
        gap: SPACING.sm,
    },
    loadingText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    progressBackground: {
        width: '100%',
        height: 6,
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.full,
        // Glow effect
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    versionText: {
        fontSize: 10,
        fontWeight: '400',
        color: COLORS.textMuted,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 128,
    },
});

export default SplashScreen;
