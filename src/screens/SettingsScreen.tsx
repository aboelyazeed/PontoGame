// ==========================================
// Ponto Game - Settings Screen
// ==========================================

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    I18nManager,
    ScrollView,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavBar } from '../components/ui';

// Force RTL
I18nManager.forceRTL(true);

interface SettingsScreenProps {
    onBack: () => void;
    onNavigate: (screen: 'profile' | 'play' | 'settings') => void;
    hideBottomNav?: boolean;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
    onBack,
    onNavigate,
    hideBottomNav = false,
}) => {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [musicEnabled, setMusicEnabled] = useState(true);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={onBack}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-forward" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>الإعدادات</Text>

                    {/* Empty spacer for centering */}
                    <View style={styles.headerButton} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Audio Section */}
                    <Text style={styles.sectionTitle}>الصوتيات</Text>
                    <View style={styles.settingsCard}>
                        {/* Sound Toggle */}
                        <View style={[styles.settingItem, styles.settingItemBorder]}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingIconContainer}>
                                    <Ionicons name="volume-high" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.settingLabel}>الأصوات</Text>
                            </View>
                            <Switch
                                value={soundEnabled}
                                onValueChange={setSoundEnabled}
                                trackColor={{
                                    false: '#475569',
                                    true: COLORS.primary
                                }}
                                thumbColor="#ffffff"
                                ios_backgroundColor="#475569"
                            />
                        </View>

                        {/* Music Toggle */}
                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingIconContainer}>
                                    <Ionicons name="musical-notes" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.settingLabel}>الموسيقى</Text>
                            </View>
                            <Switch
                                value={musicEnabled}
                                onValueChange={setMusicEnabled}
                                trackColor={{
                                    false: '#475569',
                                    true: COLORS.primary
                                }}
                                thumbColor="#ffffff"
                                ios_backgroundColor="#475569"
                            />
                        </View>
                    </View>

                    {/* General Section */}
                    <Text style={styles.sectionTitle}>عام</Text>
                    <View style={styles.settingsCard}>
                        {/* Language */}
                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingIconContainer}>
                                    <Ionicons name="language" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.settingLabel}>اللغة</Text>
                            </View>
                            <View style={styles.languageValue}>
                                <Text style={styles.languageText}>العربية</Text>
                                <Ionicons name="lock-closed" size={14} color={COLORS.textSlate} />
                            </View>
                        </View>
                    </View>

                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-forward" size={24} color={COLORS.primary} />
                        <Text style={styles.backButtonText}>رجوع</Text>
                    </TouchableOpacity>

                    {/* Version */}
                    <Text style={styles.versionText}>v2.4.0 • Build 8392</Text>
                </ScrollView>
            </SafeAreaView>

            {/* Bottom Navigation */}
            {!hideBottomNav && (
                <BottomNavBar
                    activeTab="settings"
                    onTabPress={(tab) => onNavigate(tab)}
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
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: `${COLORS.primary}30`,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xl,
        paddingBottom: 120, // Space for bottom nav
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textSlate,
        marginBottom: SPACING.sm,
        paddingRight: SPACING.xs,
    },
    settingsCard: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        marginBottom: SPACING.lg,
        overflow: 'hidden',
        ...SHADOWS.md,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
    },
    settingItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cardBorder,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${COLORS.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    languageValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: `${COLORS.backgroundDark}80`,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    languageText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textSlate,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.surfaceDark,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        marginTop: 'auto',
        marginBottom: SPACING.md,
        ...SHADOWS.md,
    },
    backButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    versionText: {
        fontSize: 10,
        color: COLORS.textMuted,
        textAlign: 'center',
        opacity: 0.6,
    },
});

export default SettingsScreen;
