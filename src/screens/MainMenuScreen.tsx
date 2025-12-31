// ==========================================
// Ponto Game - Main Menu Screen (New Design)
// ==========================================

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavBar } from '../components/ui';
import { useAuthStore } from '../store/authStore';

// Force RTL
I18nManager.forceRTL(true);

interface MainMenuScreenProps {
    onPlayLocal: () => void;
    onPlayOnline?: () => void;
    onPlayWifi?: () => void;
    onSettings?: () => void;
    onProfile?: () => void;
    hideBottomNav?: boolean;
}

const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
    onPlayLocal,
    onPlayOnline,
    onPlayWifi,
    onSettings,
    onProfile,
    hideBottomNav = false,
}) => {
    const { user } = useAuthStore();

    // Use auth store data with fallback defaults
    const userName = user?.displayName || 'لاعب';
    const userLevel = user?.level || 1;
    const userRank = user?.rank || 'مبتدئ';
    const userCoins = user?.coins || 0;

    const handleTabPress = (tab: 'profile' | 'play' | 'settings') => {
        switch (tab) {
            case 'profile':
                onProfile?.();
                break;
            case 'play':
                onPlayLocal();
                break;
            case 'settings':
                onSettings?.();
                break;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

            {/* Background Pattern Overlay */}
            <View style={styles.patternOverlay} />

            {/* Pitch gradient at bottom */}
            <LinearGradient
                colors={['transparent', `${COLORS.primary}15`]}
                style={styles.pitchGradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    {/* Profile Button */}
                    <TouchableOpacity
                        style={styles.profileButton}
                        activeOpacity={0.8}
                        onPress={onProfile}
                    >
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={32} color={COLORS.textSecondary} />
                            </View>
                        </View>
                        {/* Level Badge */}
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>{userLevel}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* User Info */}
                    <View style={styles.userInfo}>
                        <Text style={styles.greeting}>
                            كابتن <Text style={styles.userName}>{userName}</Text>
                        </Text>
                        <View style={styles.rankBadge}>
                            <MaterialCommunityIcons name="soccer" size={14} color={COLORS.accentGreen} />
                            <Text style={styles.rankText}>{userRank}</Text>
                        </View>
                    </View>

                    {/* Coins */}
                    <View style={styles.coinsContainer}>
                        <FontAwesome5 name="coins" size={16} color={COLORS.gold} />
                        <Text style={styles.coinAmount}>{userCoins.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    {/* Play Match Button */}
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={onPlayLocal}
                        activeOpacity={0.9}
                    >
                        {/* Glow effect */}
                        <View style={styles.playButtonGlow} />

                        <View style={styles.playButtonContent}>
                            <View style={styles.playButtonTextContainer}>
                                <Text style={styles.playButtonTitle}>العب ماتش</Text>
                                <Text style={styles.playButtonSubtitle}>جاهز للتحدي؟</Text>
                            </View>
                            <View style={styles.playIconContainer}>
                                <Ionicons name="play" size={28} color={COLORS.textPrimary} />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Settings Button */}
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={onSettings}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.settingsText}>الإعدادات</Text>
                        <Ionicons name="settings-sharp" size={24} color={COLORS.accentGreen} />
                    </TouchableOpacity>
                </View>

                {/* Footer - Above navbar */}
                <View style={styles.footer}>
                    <Text style={styles.versionText}>
                        الإصدار 1.0.4 - جميع الحقوق محفوظة
                    </Text>
                </View>
            </SafeAreaView>

            {/* Bottom Navigation */}
            {!hideBottomNav && (
                <BottomNavBar
                    activeTab="play"
                    onTabPress={handleTabPress}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
    },
    patternOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.03,
    },
    pitchGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    safeArea: {
        flex: 1,
        paddingBottom: 80, // Space for bottom nav
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        gap: SPACING.md,
    },
    profileButton: {
        position: 'relative',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: COLORS.primary,
        padding: 4,
        backgroundColor: `${COLORS.surfaceDark}80`,
    },
    avatarPlaceholder: {
        flex: 1,
        borderRadius: 36,
        backgroundColor: COLORS.surfaceDark,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelBadge: {
        position: 'absolute',
        bottom: -4,
        left: -4,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.backgroundDark,
        ...SHADOWS.sm,
    },
    levelText: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    greeting: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    userName: {
        color: COLORS.primary,
    },
    rankBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${COLORS.surfaceDark}50`,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        gap: 4,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    rankText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.accentGreen,
    },
    coinsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    coinAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        gap: SPACING.md,
    },
    playButton: {
        width: '100%',
        maxWidth: 400,
        height: 96,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        ...SHADOWS.lg,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.4,
    },
    playButtonGlow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    playButtonContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
    },
    playButtonTextContainer: {
        gap: 4,
    },
    playButtonTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.textPrimary,
    },
    playButtonSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    playIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        width: 64,
        height: 4,
        borderRadius: 2,
        backgroundColor: `${COLORS.surfaceDark}80`,
        marginVertical: SPACING.sm,
    },
    settingsButton: {
        width: '100%',
        maxWidth: 400,
        height: 64,
        backgroundColor: COLORS.surfaceDark,
        borderRadius: BORDER_RADIUS.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        ...SHADOWS.md,
    },
    settingsText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    footer: {
        alignItems: 'center',
        paddingBottom: SPACING.md,
    },
    versionText: {
        fontSize: 10,
        color: COLORS.textMuted,
    },
});

export default MainMenuScreen;
