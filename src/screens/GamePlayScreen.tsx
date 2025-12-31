// ==========================================
// Ponto Game - Game Play Screen (New Design)
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
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

// Force RTL
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');
const CARD_WIDTH = 88;
const SLOT_WIDTH = 64;

interface CardData {
    id: string;
    type: 'player' | 'action' | 'ponto';
    position?: 'FW' | 'MF' | 'DF' | 'GK';
    rating?: number;
    name?: string;
    isRevealed?: boolean;
    isSelected?: boolean;
}

interface GamePlayScreenProps {
    onBack?: () => void;
    onEndTurn?: () => void;
    onAttack?: () => void;
    playerScore?: number;
    opponentScore?: number;
    timeRemaining?: string;
    currentPhase?: 'attack' | 'defense' | 'waiting';
    isMyTurn?: boolean;
}

const GamePlayScreen: React.FC<GamePlayScreenProps> = ({
    onBack,
    onEndTurn,
    onAttack,
    playerScore = 2,
    opponentScore = 1,
    timeRemaining = '٢٠:٠٠',
    currentPhase = 'attack',
    isMyTurn = true,
}) => {
    const [selectedSlot, setSelectedSlot] = useState<number | null>(1);
    const [selectedHandCard, setSelectedHandCard] = useState<number | null>(null);

    // Mock data for demonstration
    const playerSlots: (CardData | null)[] = [
        { id: '1', type: 'player', position: 'DF', rating: 84, name: 'أحمد', isRevealed: true },
        { id: '2', type: 'player', position: 'FW', rating: 92, name: 'محمد', isRevealed: true, isSelected: true },
        { id: '3', type: 'player', position: 'MF', rating: 88, name: 'علي', isRevealed: true },
        null,
        null,
    ];

    const handCards: CardData[] = [
        { id: 'h1', type: 'player', position: 'FW', rating: 94, name: 'محمد' },
        { id: 'h2', type: 'action', name: 'بطاقة قوة' },
        { id: 'h3', type: 'player', position: 'DF', rating: 82, name: 'أحمد' },
        { id: 'h4', type: 'player', position: 'DF', rating: 85, name: 'علي' },
        { id: 'h5', type: 'ponto', name: 'بونتو' },
    ];

    const getPositionColor = (position?: string) => {
        switch (position) {
            case 'FW': return '#eab308';
            case 'MF': return '#22c55e';
            case 'DF': return '#3b82f6';
            case 'GK': return '#f97316';
            default: return COLORS.primary;
        }
    };

    const renderOpponentSlot = (index: number) => (
        <View key={index} style={styles.cardSlot}>
            <View style={styles.cardBack}>
                <Ionicons name="shield" size={24} color="rgba(255,255,255,0.2)" />
            </View>
        </View>
    );

    const renderPlayerSlot = (card: CardData | null, index: number) => {
        const isSelected = index === selectedSlot;

        if (!card) {
            return (
                <TouchableOpacity
                    key={index}
                    style={styles.emptySlot}
                    onPress={() => setSelectedSlot(index)}
                >
                    <Ionicons name="add" size={20} color="rgba(255,255,255,0.1)" />
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                key={index}
                style={[
                    styles.playerSlot,
                    isSelected && styles.playerSlotSelected,
                ]}
                onPress={() => setSelectedSlot(index)}
            >
                {/* Card content placeholder */}
                <View style={styles.cardContent}>
                    <Ionicons name="person" size={24} color={COLORS.textSecondary} />
                </View>

                {/* Status indicator for selected */}
                {isSelected && (
                    <>
                        <View style={styles.selectedIndicatorPing} />
                        <View style={styles.selectedIndicator} />
                    </>
                )}

                {/* Bottom info bar */}
                <View style={[
                    styles.slotInfoBar,
                    isSelected && styles.slotInfoBarSelected,
                ]}>
                    <Text style={styles.slotInfoText}>
                        {card.position} {card.rating}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderHandCard = (card: CardData, index: number) => {
        const isSelected = index === selectedHandCard;

        return (
            <TouchableOpacity
                key={card.id}
                style={[
                    styles.handCard,
                    isSelected && styles.handCardSelected,
                    card.type === 'action' && styles.handCardAction,
                ]}
                onPress={() => setSelectedHandCard(isSelected ? null : index)}
            >
                {/* Card type badge */}
                {card.position && (
                    <View style={[
                        styles.cardTypeBadge,
                        { backgroundColor: getPositionColor(card.position) }
                    ]}>
                        <Text style={styles.cardTypeBadgeText}>{card.position}</Text>
                    </View>
                )}

                {/* Card content */}
                <View style={styles.handCardContent}>
                    {card.type === 'action' ? (
                        <Ionicons name="flash" size={32} color={COLORS.textPrimary} />
                    ) : card.type === 'ponto' ? (
                        <MaterialCommunityIcons name="cards" size={32} color="#fdba74" />
                    ) : (
                        <Ionicons name="person" size={32} color={COLORS.textSecondary} />
                    )}
                </View>

                {/* Rating */}
                {card.rating && (
                    <Text style={styles.handCardRating}>{card.rating}</Text>
                )}

                {/* Name */}
                <Text style={[
                    styles.handCardName,
                    card.type === 'ponto' && styles.handCardNamePonto,
                ]}>
                    {card.name}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

            {/* Background glow */}
            <View style={styles.backgroundGlow} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* 1. SCOREBOARD */}
                <View style={styles.scoreboard}>
                    <View style={styles.scoreboardInner}>
                        {/* Player A (Me) */}
                        <View style={styles.playerScore}>
                            <View style={styles.avatarContainer}>
                                <View style={[styles.avatar, styles.avatarMe]}>
                                    <Ionicons name="person" size={20} color={COLORS.textSecondary} />
                                </View>
                                <View style={styles.levelBadge}>
                                    <Text style={styles.levelBadgeText}>١</Text>
                                </View>
                            </View>
                            <View style={styles.scoreInfo}>
                                <Text style={styles.playerLabel}>أنا</Text>
                                <Text style={styles.scoreValue}>{playerScore}</Text>
                            </View>
                        </View>

                        {/* Timer */}
                        <View style={styles.timerContainer}>
                            <Text style={styles.timerLabel}>الوقت</Text>
                            <Text style={styles.timerValue}>{timeRemaining}</Text>
                        </View>

                        {/* Opponent */}
                        <View style={[styles.playerScore, styles.playerScoreReverse]}>
                            <View style={styles.scoreInfo}>
                                <Text style={styles.playerLabel}>المنافس</Text>
                                <Text style={styles.scoreValue}>{opponentScore}</Text>
                            </View>
                            <View style={styles.avatarContainer}>
                                <View style={[styles.avatar, styles.avatarOpponent]}>
                                    <Ionicons name="person" size={20} color={COLORS.textSlate} />
                                </View>
                                <View style={[styles.levelBadge, styles.levelBadgeOpponent]}>
                                    <Text style={styles.levelBadgeText}>٢</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 2. GAME AREA */}
                <View style={styles.gameArea}>
                    {/* Opponent Field */}
                    <View style={styles.fieldRow}>
                        {[0, 1, 2, 3, 4].map(renderOpponentSlot)}
                    </View>

                    {/* Middle Zone */}
                    <View style={styles.middleZone}>
                        {/* Phase Badge */}
                        <View style={styles.phaseBadge}>
                            <MaterialCommunityIcons name="sword-cross" size={20} color={COLORS.primary} />
                            <Text style={styles.phaseBadgeText}>
                                {isMyTurn ? 'دورك - هجوم' : 'دور المنافس'}
                            </Text>
                        </View>

                        {/* Played Card Area */}
                        <View style={styles.playedCardArea}>
                            <View style={styles.playedCardSlot}>
                                <Text style={styles.playedCardText}>كروت الملعب</Text>
                            </View>
                        </View>
                    </View>

                    {/* Player Field */}
                    <View style={styles.fieldRow}>
                        {playerSlots.map((card, index) => renderPlayerSlot(card, index))}
                    </View>

                    {/* Action Controls */}
                    <View style={styles.actionControls}>
                        <TouchableOpacity
                            style={styles.endTurnButton}
                            onPress={onEndTurn}
                        >
                            <Text style={styles.endTurnText}>إنهاء الدور</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.attackButton}
                            onPress={onAttack}
                        >
                            <MaterialCommunityIcons name="soccer" size={24} color={COLORS.textPrimary} />
                            <Text style={styles.attackButtonText}>هجـــوم</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 3. HAND AREA */}
                <View style={styles.handArea}>
                    {/* Handle */}
                    <View style={styles.handHandle} />

                    {/* Header */}
                    <View style={styles.handHeader}>
                        <Text style={styles.handCount}>كروتك (٧)</Text>
                        <TouchableOpacity>
                            <Text style={styles.sortButton}>ترتيب</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Cards ScrollView */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.handScrollContent}
                        style={styles.handScroll}
                    >
                        {handCards.map((card, index) => renderHandCard(card, index))}
                    </ScrollView>

                    {/* Edge fades */}
                    <View style={styles.handFadeLeft} />
                    <View style={styles.handFadeRight} />
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
    backgroundGlow: {
        position: 'absolute',
        top: '30%',
        left: '50%',
        marginLeft: -width * 0.6,
        width: width * 1.2,
        height: '40%',
        backgroundColor: COLORS.primary,
        opacity: 0.05,
        borderRadius: 9999,
        transform: [{ scaleY: 0.6 }],
    },
    safeArea: {
        flex: 1,
    },

    // SCOREBOARD
    scoreboard: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.xs,
    },
    scoreboardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: `${COLORS.surfaceDark}CC`,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        ...SHADOWS.md,
    },
    playerScore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    playerScoreReverse: {
        flexDirection: 'row-reverse',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceDark,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    avatarMe: {
        borderColor: COLORS.primary,
    },
    avatarOpponent: {
        borderColor: 'rgba(239, 68, 68, 0.5)',
        opacity: 0.7,
    },
    levelBadge: {
        position: 'absolute',
        bottom: -4,
        left: -4,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.surfaceDark,
    },
    levelBadgeOpponent: {
        backgroundColor: 'rgba(127, 29, 29, 0.8)',
        right: -4,
        left: 'auto',
    },
    levelBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    scoreInfo: {
        alignItems: 'flex-start',
    },
    playerLabel: {
        fontSize: 12,
        color: COLORS.textSlate,
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    timerContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    timerLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    timerValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        fontVariant: ['tabular-nums'],
    },

    // GAME AREA
    gameArea: {
        flex: 1,
        paddingHorizontal: SPACING.xs,
        paddingVertical: SPACING.xs,
        justifyContent: 'space-between',
    },
    fieldRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: SPACING.xs,
    },
    cardSlot: {
        flex: 1,
        maxWidth: SLOT_WIDTH,
        aspectRatio: 2 / 3,
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    cardBack: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptySlot: {
        flex: 1,
        maxWidth: SLOT_WIDTH,
        aspectRatio: 2 / 3,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerSlot: {
        flex: 1,
        maxWidth: SLOT_WIDTH,
        aspectRatio: 2 / 3,
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        ...SHADOWS.md,
    },
    playerSlotSelected: {
        borderWidth: 2,
        borderColor: COLORS.primary,
        transform: [{ translateY: -4 }],
        ...SHADOWS.lg,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.5,
    },
    cardContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedIndicator: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    selectedIndicatorPing: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        opacity: 0.5,
    },
    slotInfoBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 2,
        alignItems: 'center',
    },
    slotInfoBarSelected: {
        backgroundColor: COLORS.primary,
    },
    slotInfoText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: COLORS.textSlate,
    },

    // MIDDLE ZONE
    middleZone: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
    },
    phaseBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: `${COLORS.primary}15`,
        borderWidth: 1,
        borderColor: `${COLORS.primary}30`,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
    },
    phaseBadgeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    playedCardArea: {
        width: '100%',
        maxHeight: 100,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    playedCardSlot: {
        width: 80,
        aspectRatio: 2 / 3,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playedCardText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.3)',
        textAlign: 'center',
    },

    // ACTION CONTROLS
    actionControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    endTurnButton: {
        flex: 1,
        backgroundColor: COLORS.surfaceDark,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    endTurnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textSlate,
    },
    attackButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        ...SHADOWS.lg,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
    },
    attackButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },

    // HAND AREA
    handArea: {
        backgroundColor: COLORS.surfaceDark,
        borderTopWidth: 1,
        borderTopColor: COLORS.cardBorder,
        paddingTop: SPACING.xs,
        paddingBottom: SPACING.lg,
        position: 'relative',
        ...SHADOWS.lg,
    },
    handHandle: {
        width: 48,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: SPACING.xs,
    },
    handHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.xs,
    },
    handCount: {
        fontSize: 12,
        color: COLORS.textSlate,
    },
    sortButton: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    handScroll: {
        flexGrow: 0,
    },
    handScrollContent: {
        paddingHorizontal: SPACING.md,
        gap: SPACING.sm,
    },
    handCard: {
        width: CARD_WIDTH,
        aspectRatio: 2 / 3,
        backgroundColor: COLORS.surfaceDarker,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        position: 'relative',
    },
    handCardSelected: {
        transform: [{ translateY: -8 }],
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    handCardAction: {
        borderColor: `${COLORS.primary}50`,
    },
    handCardContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTypeBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    cardTypeBadgeText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    handCardRating: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    handCardName: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        fontSize: 10,
        color: COLORS.textMuted,
    },
    handCardNamePonto: {
        color: '#fdba74',
        fontWeight: 'bold',
        left: 0,
        right: 0,
        textAlign: 'center',
    },
    handFadeLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 32,
        height: '60%',
        backgroundColor: COLORS.surfaceDark,
        opacity: 0.9,
    },
    handFadeRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: '60%',
        backgroundColor: COLORS.surfaceDark,
        opacity: 0.9,
    },
});

export default GamePlayScreen;
