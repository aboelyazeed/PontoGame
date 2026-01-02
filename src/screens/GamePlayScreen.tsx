import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    I18nManager,
    ScrollView,
    Dimensions,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useGameLogic, GameCard } from '../hooks/useGameLogic';

// Force RTL
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');
const CARD_WIDTH = 80;
const SLOT_WIDTH = 60;

// Card images
const CARD_IMAGES: Record<string, any> = {
    'GK.png': require('../../assets/Cards/GK.png'),
    'DF.png': require('../../assets/Cards/DF.png'),
    'CDM.png': require('../../assets/Cards/CDM.png'),
    'CAM.png': require('../../assets/Cards/CAM.png'),
    'FW.png': require('../../assets/Cards/FW.png'),
    'ST.png': require('../../assets/Cards/ST.png'),
};

interface GamePlayScreenProps {
    onBack?: () => void;
    initialGameState?: any;
}

const GamePlayScreen: React.FC<GamePlayScreenProps> = ({ onBack, initialGameState }) => {
    const {
        gameState,
        isMyTurn,
        timerSeconds,
        selectedCardId,
        myPlayer,
        opponent,
        selectCard,
        playCard,
        endTurn,
    } = useGameLogic(initialGameState);

    const getPositionColor = (position?: string) => {
        switch (position) {
            case 'FW': return '#eab308';
            case 'MF': return '#22c55e';
            case 'DF': return '#3b82f6';
            case 'GK': return '#f97316';
            default: return COLORS.primary;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const renderOpponentSlot = (card: GameCard | null, index: number) => (
        <View key={index} style={styles.cardSlot}>
            {card ? (
                <View style={styles.cardBack}>
                    <Ionicons name="help" size={20} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.cardBackText}>?</Text>
                </View>
            ) : (
                <View style={styles.emptySlotInner}>
                    <Ionicons name="remove" size={16} color="rgba(255,255,255,0.1)" />
                </View>
            )}
        </View>
    );

    const renderPlayerSlot = (card: GameCard | null, index: number) => {
        const isSelected = card?.id === selectedCardId;

        if (!card) {
            return (
                <TouchableOpacity
                    key={index}
                    style={styles.emptySlot}
                    onPress={() => playCard(index)}
                    disabled={!isMyTurn || !selectedCardId}
                >
                    <Ionicons name="add" size={20} color="rgba(255,255,255,0.1)" />
                </TouchableOpacity>
            );
        }

        const cardImage = card.imageUrl ? CARD_IMAGES[card.imageUrl] : null;

        return (
            <TouchableOpacity
                key={index}
                style={[styles.playerSlot, isSelected && styles.playerSlotSelected]}
                onPress={() => selectCard(card.id, false)}
                disabled={!isMyTurn}
            >
                {cardImage ? (
                    <Image source={cardImage} style={styles.cardImage} resizeMode="cover" />
                ) : (
                    <View style={styles.cardContent}>
                        <Ionicons name="person" size={20} color={COLORS.textSecondary} />
                    </View>
                )}

                {/* Stats overlay */}
                <View style={styles.slotStatsBar}>
                    {card.attack !== undefined && card.attack > 0 && (
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="sword" size={8} color="#ef4444" />
                            <Text style={styles.statText}>{card.attack}</Text>
                        </View>
                    )}
                    {card.defense !== undefined && card.defense > 0 && (
                        <View style={styles.statItem}>
                            <Ionicons name="shield" size={8} color="#3b82f6" />
                            <Text style={styles.statText}>{card.defense}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderHandCard = (card: GameCard, index: number) => {
        const isSelected = card.id === selectedCardId;
        const cardImage = card.imageUrl ? CARD_IMAGES[card.imageUrl] : null;

        return (
            <TouchableOpacity
                key={card.id}
                style={[
                    styles.handCard,
                    isSelected && styles.handCardSelected,
                    card.type === 'action' && styles.handCardAction,
                    card.type === 'ponto' && styles.handCardPonto,
                ]}
                onPress={() => selectCard(card.id, true)}
                disabled={!isMyTurn}
            >
                {cardImage ? (
                    <Image source={cardImage} style={styles.handCardImage} resizeMode="cover" />
                ) : (
                    <View style={styles.handCardContent}>
                        {card.type === 'action' ? (
                            <Ionicons name="flash" size={28} color="#F59E0B" />
                        ) : card.type === 'ponto' ? (
                            <Text style={styles.pontoValue}>+{card.attack}</Text>
                        ) : (
                            <Ionicons name="person" size={28} color={COLORS.textSecondary} />
                        )}
                    </View>
                )}

                <Text numberOfLines={1} style={styles.handCardName}>
                    {card.nameAr || card.name}
                </Text>
            </TouchableOpacity>
        );
    };

    // Loading state
    if (!gameState) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>جاري تحميل اللعبة...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* SCOREBOARD */}
                <View style={styles.scoreboard}>
                    <View style={styles.scoreboardInner}>
                        <View style={styles.playerScore}>
                            <View style={[styles.avatar, styles.avatarMe]}>
                                <Ionicons name="person" size={18} color={COLORS.textSecondary} />
                            </View>
                            <View style={styles.scoreInfo}>
                                <Text style={styles.playerLabel}>{myPlayer?.odiumInfo.displayName || 'أنا'}</Text>
                                <Text style={styles.scoreValue}>{myPlayer?.score || 0}</Text>
                            </View>
                        </View>

                        <View style={styles.centerInfo}>
                            <View style={[styles.timerContainer, isMyTurn && styles.timerActive]}>
                                <Text style={styles.timerText}>{formatTime(timerSeconds)}</Text>
                            </View>
                            <Text style={styles.turnText}>{isMyTurn ? 'دورك' : 'دور المنافس'}</Text>
                        </View>

                        <View style={[styles.playerScore, styles.playerScoreReverse]}>
                            <View style={styles.scoreInfo}>
                                <Text style={styles.playerLabel}>{opponent?.odiumInfo.displayName || 'المنافس'}</Text>
                                <Text style={styles.scoreValue}>{opponent?.score || 0}</Text>
                            </View>
                            <View style={[styles.avatar, styles.avatarOpponent]}>
                                <Ionicons name="person" size={18} color={COLORS.textSlate} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* GAME AREA */}
                <View style={styles.gameArea}>
                    {/* Opponent Field */}
                    <View style={styles.fieldRow}>
                        {(opponent?.field || [null, null, null, null, null]).map((card, i) => renderOpponentSlot(card, i))}
                    </View>

                    {/* Middle Zone */}
                    <View style={styles.middleZone}>
                        <View style={styles.phaseBadge}>
                            <MaterialCommunityIcons name="sword-cross" size={18} color={COLORS.primary} />
                            <Text style={styles.phaseBadgeText}>
                                {isMyTurn ? 'دورك' : 'دور المنافس'}
                            </Text>
                        </View>

                        {isMyTurn && myPlayer && (
                            <View style={styles.movesContainer}>
                                <Text style={styles.movesLabel}>حركات:</Text>
                                <View style={styles.movesPills}>
                                    {[...Array(3)].map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.movePill,
                                                i < myPlayer.movesRemaining ? styles.movePillActive : styles.movePillInactive
                                            ]}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Player Field */}
                    <View style={styles.fieldRow}>
                        {(myPlayer?.field || [null, null, null, null, null]).map((card, i) => renderPlayerSlot(card, i))}
                    </View>

                    {/* Action Controls */}
                    <View style={styles.actionControls}>
                        <TouchableOpacity
                            style={[styles.endTurnButton, !isMyTurn && styles.buttonDisabled]}
                            onPress={endTurn}
                            disabled={!isMyTurn}
                        >
                            <Text style={styles.endTurnText}>إنهاء الدور</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.attackButton, !isMyTurn && styles.buttonDisabled]}
                            disabled={!isMyTurn}
                        >
                            <MaterialCommunityIcons name="soccer" size={22} color="#FFF" />
                            <Text style={styles.attackButtonText}>هجوم</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* HAND AREA */}
                <View style={styles.handArea}>
                    <View style={styles.handHeader}>
                        <Text style={styles.handCount}>كروتك ({myPlayer?.hand.length || 0})</Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.handScrollContent}
                    >
                        {(myPlayer?.hand || []).map((card, index) => renderHandCard(card, index))}
                    </ScrollView>
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
    loadingContainer: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    safeArea: {
        flex: 1,
    },

    // SCOREBOARD
    scoreboard: {
        paddingHorizontal: SPACING.sm,
        paddingTop: SPACING.sm,
    },
    scoreboardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surfaceDark,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    playerScore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    playerScoreReverse: {
        flexDirection: 'row-reverse',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.surfaceDarker,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    avatarMe: {
        borderColor: COLORS.primary,
    },
    avatarOpponent: {
        borderColor: '#ef4444',
    },
    scoreInfo: {
        alignItems: 'center',
    },
    playerLabel: {
        fontSize: 9,
        color: COLORS.textSlate,
    },
    scoreValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    centerInfo: {
        alignItems: 'center',
    },
    timerContainer: {
        backgroundColor: COLORS.surfaceDarker,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    timerActive: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    timerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        fontFamily: 'monospace',
    },
    turnText: {
        fontSize: 9,
        color: COLORS.textSecondary,
        marginTop: 2,
    },

    // GAME AREA
    gameArea: {
        flex: 1,
        paddingTop: SPACING.sm,
        justifyContent: 'space-between',
    },
    fieldRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: SPACING.sm,
        height: 80,
    },
    cardSlot: {
        flex: 1,
        maxWidth: SLOT_WIDTH,
        height: '100%',
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    cardBack: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e3a1e',
    },
    cardBackText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptySlot: {
        flex: 1,
        maxWidth: SLOT_WIDTH,
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 6,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptySlotInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerSlot: {
        flex: 1,
        maxWidth: SLOT_WIDTH,
        height: '100%',
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        overflow: 'hidden',
    },
    playerSlotSelected: {
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slotStatsBar: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingVertical: 2,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    statText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#FFF',
    },

    // MIDDLE ZONE
    middleZone: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 6,
    },
    phaseBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    phaseBadgeText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 12,
    },
    movesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    movesLabel: {
        color: COLORS.textSlate,
        fontSize: 10,
    },
    movesPills: {
        flexDirection: 'row',
        gap: 3,
    },
    movePill: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    movePillActive: {
        backgroundColor: COLORS.primary,
    },
    movePillInactive: {
        backgroundColor: '#374151',
    },

    // ACTION CONTROLS
    actionControls: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xs,
    },
    endTurnButton: {
        flex: 1,
        backgroundColor: COLORS.surfaceDark,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    endTurnText: {
        color: COLORS.textSlate,
        fontWeight: 'bold',
        fontSize: 13,
    },
    attackButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#b91c1c',
        paddingVertical: 10,
        borderRadius: 8,
    },
    attackButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // HAND AREA
    handArea: {
        height: 140,
        backgroundColor: COLORS.surfaceDarker,
        borderTopWidth: 1,
        borderTopColor: COLORS.cardBorder,
        paddingVertical: SPACING.xs,
    },
    handHeader: {
        paddingHorizontal: SPACING.md,
        marginBottom: 4,
    },
    handCount: {
        color: COLORS.textSlate,
        fontSize: 11,
    },
    handScrollContent: {
        paddingHorizontal: SPACING.md,
        gap: 6,
    },
    handCard: {
        width: CARD_WIDTH,
        height: 100,
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        overflow: 'hidden',
    },
    handCardSelected: {
        borderColor: COLORS.primary,
        borderWidth: 2,
        transform: [{ translateY: -8 }],
    },
    handCardAction: {
        borderColor: '#F59E0B',
    },
    handCardPonto: {
        borderColor: '#8B5CF6',
    },
    handCardImage: {
        width: '100%',
        height: '70%',
    },
    handCardContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pontoValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#8B5CF6',
    },
    handCardName: {
        fontSize: 9,
        color: COLORS.textSecondary,
        textAlign: 'center',
        padding: 4,
    },
});

export default GamePlayScreen;
