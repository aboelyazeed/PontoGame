// ==========================================
// Ponto Game - Game Mode Selection Screen
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

// Force RTL
I18nManager.forceRTL(true);

type GameMode = 'online' | 'local';

interface GameModeScreenProps {
    onBack: () => void;
    onStartGame: (mode: GameMode) => void;
    playerStats?: {
        wins: number;
        rank: string;
        xp: number;
        winStreak: number;
    };
}

const GameModeScreen: React.FC<GameModeScreenProps> = ({
    onBack,
    onStartGame,
    playerStats = {
        wins: 124,
        rank: 'أسطوري',
        xp: 5890,
        winStreak: 7,
    },
}) => {
    const [selectedMode, setSelectedMode] = useState<GameMode>('online');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-forward" size={28} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Main Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>اختار نوع اللعب</Text>
                        <Text style={styles.subtitle}>عايز تلعب ازاي النهاردة؟</Text>
                    </View>

                    {/* Player Stats Card */}
                    <View style={styles.statsCard}>
                        <Text style={styles.statsTitle}>إحصائيات اللاعب</Text>

                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Ionicons name="trophy" size={24} color={COLORS.primary} />
                                <Text style={styles.statLabel}>الانتصارات</Text>
                                <Text style={styles.statValue}>{playerStats.wins}</Text>
                            </View>

                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="medal" size={24} color={COLORS.primary} />
                                <Text style={styles.statLabel}>الرتبة</Text>
                                <Text style={styles.statValue}>{playerStats.rank}</Text>
                            </View>

                            <View style={styles.statItem}>
                                <Ionicons name="star" size={24} color={COLORS.primary} />
                                <Text style={styles.statLabel}>نقاط الخبرة</Text>
                                <Text style={styles.statValue}>{playerStats.xp.toLocaleString()}</Text>
                            </View>

                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="fire" size={24} color={COLORS.primary} />
                                <Text style={styles.statLabel}>سلسلة انتصارات</Text>
                                <Text style={styles.statValue}>{playerStats.winStreak}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Mode Selection */}
                    <View style={styles.modeGrid}>
                        {/* Online Mode */}
                        <TouchableOpacity
                            style={[
                                styles.modeCard,
                                selectedMode === 'online' && styles.modeCardSelected,
                            ]}
                            onPress={() => setSelectedMode('online')}
                            activeOpacity={0.8}
                        >
                            {selectedMode === 'online' && (
                                <View style={styles.modeGlow} />
                            )}
                            <View style={styles.modeContent}>
                                <Ionicons
                                    name="globe-outline"
                                    size={48}
                                    color={selectedMode === 'online' ? COLORS.primary : COLORS.textSlate}
                                />
                                <Text style={[
                                    styles.modeTitle,
                                    selectedMode === 'online' && styles.modeTitleSelected,
                                ]}>أونلاين</Text>

                                {selectedMode === 'online' && (
                                    <>
                                        <View style={styles.checkBadge}>
                                            <Ionicons name="checkmark" size={14} color={COLORS.textPrimary} />
                                        </View>
                                        <Text style={styles.selectedLabel}>مُختار</Text>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* Local Mode */}
                        <TouchableOpacity
                            style={[
                                styles.modeCard,
                                selectedMode === 'local' && styles.modeCardSelected,
                            ]}
                            onPress={() => setSelectedMode('local')}
                            activeOpacity={0.8}
                        >
                            {selectedMode === 'local' && (
                                <View style={styles.modeGlow} />
                            )}
                            <View style={styles.modeContent}>
                                <MaterialCommunityIcons
                                    name="wifi"
                                    size={48}
                                    color={selectedMode === 'local' ? COLORS.primary : COLORS.textSlate}
                                />
                                <Text style={[
                                    styles.modeTitle,
                                    selectedMode === 'local' && styles.modeTitleSelected,
                                ]}>شبكة</Text>

                                {selectedMode === 'local' && (
                                    <>
                                        <View style={styles.checkBadge}>
                                            <Ionicons name="checkmark" size={14} color={COLORS.textPrimary} />
                                        </View>
                                        <Text style={styles.selectedLabel}>مُختار</Text>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Bottom Button */}
                <View style={styles.bottomContainer}>
                    <LinearGradient
                        colors={['transparent', COLORS.backgroundDark, COLORS.backgroundDark]}
                        style={styles.bottomGradient}
                    />
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={() => onStartGame(selectedMode)}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.startButtonText}>يلا بينا</Text>
                        <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
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
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: 120,
    },
    titleContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSlate,
    },
    statsCard: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: `${COLORS.primary}30`,
        ...SHADOWS.md,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: SPACING.md,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
    },
    statItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: COLORS.surfaceDarker,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: `${COLORS.primary}15`,
        gap: 4,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSlate,
        fontWeight: 'bold',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.accentGreen,
    },
    modeGrid: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    modeCard: {
        flex: 1,
        aspectRatio: 1,
        backgroundColor: COLORS.surfaceDark,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        overflow: 'hidden',
    },
    modeCardSelected: {
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    modeGlow: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        backgroundColor: COLORS.primary,
        opacity: 0.1,
    },
    modeContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    modeTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textSlate,
    },
    modeTitleSelected: {
        color: COLORS.textPrimary,
    },
    checkBadge: {
        position: 'absolute',
        top: SPACING.sm,
        left: SPACING.sm,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedLabel: {
        position: 'absolute',
        bottom: SPACING.sm,
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.lg,
    },
    bottomGradient: {
        position: 'absolute',
        top: -48,
        left: 0,
        right: 0,
        height: 96,
    },
    startButton: {
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        ...SHADOWS.lg,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.4,
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
});

export default GameModeScreen;
