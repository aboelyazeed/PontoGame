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
    Image,
    Modal,
    Alert,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useGameLogic, GameCard } from '../hooks/useGameLogic';
import { useAuthStore } from '../store/authStore';

// Force RTL
I18nManager.forceRTL(true);

const { width, height } = Dimensions.get('window');

// Colors matching HTML design
const COLORS = {
    primary: '#09aa09',
    primaryDark: '#067a06',
    backgroundDark: '#102210',
    surfaceDark: '#1a331a',
    surfaceLighter: '#244224',
    cardBorder: 'rgba(255,255,255,0.1)',
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textSlate: '#6B7280',
    error: '#ef4444',
    warning: '#eab308',
    info: '#3b82f6',
    ponto: '#F97316',
    secondary: '#F97316',
    surfaceDarker: '#142814',
    success: '#22c55e',
};

// Card images mapping
const CARD_IMAGES: Record<string, any> = {
    'GK.png': require('../../assets/Cards/GK.png'),
    'DF.png': require('../../assets/Cards/DF.png'),
    'CDM.png': require('../../assets/Cards/CDM.png'),
    'CAM.png': require('../../assets/Cards/CAM.png'),
    'FW.png': require('../../assets/Cards/FW.png'),
    'ST.png': require('../../assets/Cards/ST.png'),
};

const getCardImage = (card: GameCard) => {
    if (card.imageUrl && CARD_IMAGES[card.imageUrl]) {
        return CARD_IMAGES[card.imageUrl];
    }
    switch (card.position) {
        case 'GK': return CARD_IMAGES['GK.png'];
        case 'DF': return CARD_IMAGES['DF.png'];
        case 'MF': return card.defense && card.defense > 3 ? CARD_IMAGES['CDM.png'] : CARD_IMAGES['CAM.png'];
        case 'FW': return CARD_IMAGES['FW.png'];
        default: return null;
    }
};

const getPositionColor = (position?: string) => {
    switch (position) {
        case 'FW': return COLORS.warning;
        case 'MF': return COLORS.primary;
        case 'DF': return COLORS.info;
        case 'GK': return COLORS.ponto;
        default: return COLORS.primary;
    }
};

interface GamePlayScreenProps {
    onBack?: () => void;
    initialGameState?: any;
}

const GamePlayScreen: React.FC<GamePlayScreenProps> = ({ onBack, initialGameState }) => {
    const { user } = useAuthStore();
    const myPlayerId = user?.id || null;

    const {
        gameState,
        isMyTurn,
        isDefensePhase,
        timerSeconds,
        matchTimerSeconds,
        selectedCardId,
        attackMode,
        selectedAttackerSlot,
        lastAttackResult,
        gameEndInfo,
        myPlayer,
        opponent,
        pendingAttack,
        selectCard,
        playCard,
        drawCards,
        flipCard,
        swapCards,
        useActionCard,
        summonLegendary,
        // New Attack/Defense Flow
        revealAttacker,
        endAttackPhase,
        revealDefender,
        acceptGoal,
        endDefense,
        drawPonto,
        endTurn,
        surrender,
        clearGameEnd,
        drawFromDeck,
    } = useGameLogic(myPlayerId, initialGameState);

    const [showMenu, setShowMenu] = useState(false);
    // Action Card State
    const [selectedActionCard, setSelectedActionCard] = useState<GameCard | null>(null);
    const [actionTargetMode, setActionTargetMode] = useState<'none' | 'swap_my' | 'swap_opp' | 'target_opp' | 'target_my' | 'target_slot'>('none');
    const [tempTargetData, setTempTargetData] = useState<any>({});
    const [instructionText, setInstructionText] = useState<string | null>(null);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSurrender = () => {
        Alert.alert('استسلام', 'هل أنت متأكد؟', [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'استسلام', style: 'destructive', onPress: surrender },
        ]);
        setShowMenu(false);
    };

    const handleActionUse = (card: GameCard) => {
        if (!card.actionEffect) return;

        switch (card.actionEffect) {
            case 'swap':
                setActionTargetMode('swap_my');
                setInstructionText('اختر لاعب من عندك لتبديله');
                break;
            case 'red_card':
            case 'yellow_card':
                setActionTargetMode('target_opp');
                setInstructionText('اختر لاعب الخصم');
                break;
            case 'biter':
            case 'shoulder':
                setActionTargetMode('target_my');
                setInstructionText('اختر لاعبك للتأثير');
                break;
            default:
                // No target needed (VAR, Mercato)
                useActionCard(card.id);
                setSelectedActionCard(null);
                break;
        }
    };

    const handleFieldTargetPress = (card: GameCard | null, slotIndex: number, isOpponent: boolean) => {
        if (!selectedActionCard) return;

        const effect = selectedActionCard.actionEffect;

        if (actionTargetMode === 'target_opp') {
            if (!isOpponent || !card) {
                Alert.alert('خطأ', 'يجب اختيار لاعب خصم');
                return;
            }
            useActionCard(selectedActionCard.id, { slotIndex1: slotIndex, isOpponentSlot1: true });
            resetActionState();
        }
        else if (actionTargetMode === 'target_my') {
            if (isOpponent || !card) {
                Alert.alert('خطأ', 'يجب اختيار لاعب من فريقك');
                return;
            }
            useActionCard(selectedActionCard.id, { slotIndex1: slotIndex });
            resetActionState();
        }
        else if (actionTargetMode === 'swap_my') {
            if (isOpponent || !card) {
                Alert.alert('خطأ', 'يجب اختيار لاعب من فريقك أولاً');
                return;
            }
            setTempTargetData({ slotIndex1: slotIndex });
            setActionTargetMode('swap_opp');
            setInstructionText('اختر لاعب الخصم للمبادلة');
        }
        else if (actionTargetMode === 'swap_opp') {
            if (!isOpponent || !card) {
                Alert.alert('خطأ', 'يجب اختيار لاعب خصم');
                return;
            }
            useActionCard(selectedActionCard.id, {
                slotIndex1: tempTargetData.slotIndex1,
                slotIndex2: slotIndex,
                isOpponentSlot2: true
            });
            resetActionState();
        }
    };

    const resetActionState = () => {
        setSelectedActionCard(null);
        setActionTargetMode('none');
        setInstructionText(null);
        setTempTargetData({});
    };

    const handleFieldCardPress = (card: GameCard | null, slotIndex: number, isOpponent: boolean) => {
        // Block all interactions during draw phase
        if (gameState?.turnPhase === 'draw') return;

        // Handle Action Targeting
        if (actionTargetMode !== 'none') {
            handleFieldTargetPress(card, slotIndex, isOpponent);
            return;
        }

        // During play/attack phase - tap own face-down card to SELECT it (reveal needs confirmation)
        if (gameState?.turnPhase === 'play' || gameState?.turnPhase === 'attack') {
            if (!isMyTurn) return;
            if (isOpponent) return; // Can't select opponent's cards

            if (card) {
                // Select the card (whether revealed or not)
                selectCard(card.id, false);
            }
            return;
        }

        // During defense phase - tap own face-down card to SELECT it
        if (gameState?.turnPhase === 'defense') {
            if (!isDefensePhase) return;
            if (isOpponent) return; // Can't select opponent's cards

            if (card) {
                selectCard(card.id, false);
            }
            return;
        }
    };

    const handleEmptySlotPress = (slotIndex: number) => {
        // Block during draw phase
        if (gameState?.turnPhase === 'draw') return;
        if (!isMyTurn || attackMode) return;
        if (actionTargetMode !== 'none') return; // Don't allow playing to empty slots while targeting

        if (selectedCardId && myPlayer) {
            const selectedCard = myPlayer.hand.find(c => c.id === selectedCardId);
            if (selectedCard && selectedCard.type === 'player') {
                playCard(slotIndex);
            }
        }
    };

    const handleHandCardPress = (card: GameCard) => {
        // Block during draw phase
        if (gameState?.turnPhase === 'draw') return;
        if (!isMyTurn && !isDefensePhase) return;

        if (card.type === 'action') {
            setSelectedActionCard(card);
            // Don't select it as "active" card for playing, but show modal
            selectCard(card.id, true); // Keep visual selection too? Maybe.
        } else {
            selectCard(card.id, true);
        }
    };

    // Render opponent field slot
    const renderOpponentSlot = (card: GameCard | null, index: number) => {
        const isTarget = attackMode;
        return (
            <TouchableOpacity
                key={index}
                style={[styles.fieldSlot, isTarget && styles.fieldSlotTarget]}
                onPress={() => handleFieldCardPress(card, index, true)}
                disabled={!attackMode}
            >
                {card ? (
                    card.isRevealed === false ? (
                        <View style={styles.cardBack}>
                            <View style={styles.cardBackCircle} />
                        </View>
                    ) : (
                        <View style={styles.slotCardFilled}>
                            {getCardImage(card) && (
                                <Image source={getCardImage(card)} style={styles.slotCardImage} resizeMode="cover" />
                            )}
                            <View style={styles.slotCardOverlay}>
                                <Text style={styles.slotCardStat}>
                                    {card.position} {card.attack || card.defense}
                                </Text>
                            </View>
                        </View>
                    )
                ) : (
                    <View style={styles.emptySlotCircle} />
                )}
            </TouchableOpacity>
        );
    };

    // Render player field slot
    const renderPlayerSlot = (card: GameCard | null, index: number) => {
        const isSelected = card?.id === selectedCardId;
        const isAttacker = attackMode && selectedAttackerSlot === index;

        if (!card) {
            return (
                <TouchableOpacity
                    key={index}
                    style={styles.fieldSlot}
                    onPress={() => handleEmptySlotPress(index)}
                    disabled={!isMyTurn || attackMode}
                >
                    <View style={styles.emptySlotCircle} />
                </TouchableOpacity>
            );
        }

        const cardImage = getCardImage(card);
        return (
            <TouchableOpacity
                key={index}
                style={[
                    styles.fieldSlot,
                    isSelected && styles.fieldSlotSelected,
                    isAttacker && styles.fieldSlotAttacker,
                ]}
                onPress={() => handleFieldCardPress(card, index, false)}
                disabled={!isMyTurn}
            >
                <View style={[styles.slotCardFilled, card.isRevealed && { opacity: 0.6 }]}>
                    {cardImage && (
                        <Image source={cardImage} style={styles.slotCardImage} resizeMode="cover" />
                    )}
                    {isAttacker && (
                        <View style={styles.attackerPing} />
                    )}
                    <View style={[styles.slotCardOverlay, isSelected && styles.slotCardOverlaySelected]}>
                        <Text style={styles.slotCardStat}>
                            {card.position} {card.attack || card.defense}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Render hand card
    const renderHandCard = (card: GameCard) => {
        const isSelected = card.id === selectedCardId;
        const cardImage = getCardImage(card);

        return (
            <TouchableOpacity
                key={card.id}
                style={[styles.handCard, isSelected && styles.handCardSelected]}
                onPress={() => handleHandCardPress(card)}
                disabled={!isMyTurn && !isDefensePhase}
            >
                {cardImage ? (
                    <Image source={cardImage} style={styles.handCardImage} resizeMode="cover" />
                ) : (
                    <View style={styles.handCardPlaceholder}>
                        {card.type === 'action' ? (
                            <MaterialIcons name="flash-on" size={32} color={COLORS.warning} />
                        ) : card.type === 'ponto' ? (
                            <Text style={styles.pontoCardValue}>+{card.attack}</Text>
                        ) : (
                            <Ionicons name="person" size={32} color={COLORS.textSecondary} />
                        )}
                    </View>
                )}
                <View style={styles.handCardGradient} />

                {card.position && (
                    <View style={[styles.positionBadge, { backgroundColor: getPositionColor(card.position) }]}>
                        <Text style={styles.positionBadgeText}>{card.position}</Text>
                    </View>
                )}

                {card.type === 'player' && (
                    <>
                        <Text style={styles.handCardRating}>{card.attack || card.defense}</Text>
                        <Text style={styles.handCardName}>{card.nameAr}</Text>
                    </>
                )}

                {card.type === 'action' && (
                    <Text style={styles.handCardActionLabel}>أكشن</Text>
                )}

                {card.type === 'ponto' && (
                    <Text style={styles.handCardPontoLabel}>بونتو</Text>
                )}
            </TouchableOpacity>
        );
    };

    // Loading state
    if (!gameState) {
        return (
            <View style={styles.loadingContainer}>
                <MaterialCommunityIcons name="soccer" size={48} color={COLORS.primary} />
                <Text style={styles.loadingText}>جاري تحميل اللعبة...</Text>
            </View>
        );
    }

    const phaseText = instructionText ? instructionText
        : gameState?.turnPhase === 'draw' ? (isMyTurn ? 'اسحب كرتين' : 'الخصم يسحب')
            : gameState?.turnPhase === 'attack' ? (isMyTurn ? 'اكشف مهاجم آخر أو أنهِ الهجوم' : 'الخصم يهاجم')
                : isDefensePhase ? 'دافع!'
                    : isMyTurn ? 'دورك - اللعب'
                        : 'دور المنافس';
    const isAttackPontoNeeded = gameState?.turnPhase === 'attack' && isMyTurn && pendingAttack && !pendingAttack.pontoCard;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

            {/* Background Glow */}
            <View style={styles.backgroundGlow} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>

                {/* HEADER - Scoreboard */}
                <View style={styles.header}>
                    <View style={styles.scoreboardContainer}>
                        {/* My Player */}
                        <View style={styles.playerSection}>
                            <View style={styles.avatarContainer}>
                                <View style={[styles.avatar, styles.avatarMe]}>
                                    <Ionicons name="person" size={18} color={COLORS.textSecondary} />
                                </View>
                                <View style={styles.levelBadge}>
                                    <Text style={styles.levelText}>{myPlayer?.odiumInfo.level || 1}</Text>
                                </View>
                            </View>
                            <Text style={styles.scoreText}>{myPlayer?.score || 0}</Text>
                        </View>

                        {/* Timer Section */}
                        <View style={styles.timerSection}>
                            <View style={styles.timerBlock}>
                                <Text style={styles.timerLabel}>الدور</Text>
                                <Text style={[styles.timerValue, isMyTurn && styles.timerValueActive]}>
                                    {formatTime(timerSeconds)}
                                </Text>
                            </View>
                            <View style={styles.timerDivider} />
                            <View style={styles.timerBlock}>
                                <Text style={styles.timerLabelGray}>المباراة</Text>
                                <Text style={styles.timerValueGray}>{formatTime(matchTimerSeconds)}</Text>
                            </View>
                        </View>

                        {/* Opponent */}
                        <View style={[styles.playerSection, styles.playerSectionReverse]}>
                            <Text style={styles.scoreText}>{opponent?.score || 0}</Text>
                            <View style={styles.avatarContainer}>
                                <View style={[styles.avatar, styles.avatarOpponent]}>
                                    <Ionicons name="person" size={18} color={COLORS.textSlate} />
                                </View>
                                <View style={styles.levelBadgeOpponent}>
                                    <Text style={styles.levelText}>{opponent?.odiumInfo.level || 1}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* MAIN GAME AREA */}
                <View style={styles.mainArea}>

                    {/* Opponent Field - Full Width */}
                    <View style={styles.fieldRow}>
                        {(opponent?.field || [null, null, null, null, null]).map((card, i) =>
                            renderOpponentSlot(card, i)
                        )}
                    </View>

                    {/* Center Zone with Decks on sides */}
                    <View style={styles.centerZone}>

                        {/* Left Side - Players + Action Decks */}
                        <View style={styles.deckSidebarLeft}>
                            {/* Player Deck - ONLY visible/clickable during draw phase */}
                            <TouchableOpacity
                                style={[
                                    styles.deckCard,
                                    gameState?.turnPhase === 'draw' && isMyTurn && styles.deckCardActive
                                ]}
                                onPress={() => drawFromDeck('player')}
                                disabled={!isMyTurn || gameState?.turnPhase !== 'draw'}
                            >
                                <Ionicons name="people" size={20} color={gameState?.turnPhase === 'draw' && isMyTurn ? COLORS.primary : 'rgba(255,255,255,0.2)'} />
                                <Text style={[styles.deckLabel, gameState?.turnPhase === 'draw' && isMyTurn && styles.deckLabelActive]}>لاعبين</Text>
                            </TouchableOpacity>

                            {/* Action Deck - ONLY clickable during draw phase */}
                            <TouchableOpacity
                                style={[
                                    styles.deckCard,
                                    gameState?.turnPhase === 'draw' && isMyTurn && styles.deckCardActive
                                ]}
                                onPress={() => drawFromDeck('action')}
                                disabled={!isMyTurn || gameState?.turnPhase !== 'draw'}
                            >
                                <MaterialIcons name="flash-on" size={20} color={gameState?.turnPhase === 'draw' && isMyTurn ? COLORS.warning : 'rgba(255,255,255,0.2)'} />
                                <Text style={[styles.deckLabel, gameState?.turnPhase === 'draw' && isMyTurn && styles.deckLabelActive]}>أكشن</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Center Field Circle */}
                        <View style={styles.centerContent}>
                            <View style={styles.phaseBadge}>
                                <Text style={styles.phaseBadgeText}>{phaseText}</Text>
                            </View>

                            <View style={styles.fieldCircle}>
                                <View style={styles.fieldCircleInner}>
                                    <View style={styles.fieldLine} />
                                    <View style={styles.fieldDot} />
                                </View>
                            </View>

                            {/* Moves Indicator */}
                            {isMyTurn && myPlayer && (gameState?.turnPhase === 'play' || gameState?.turnPhase === 'attack') && (
                                <View style={styles.movesIndicator}>
                                    {[0, 1, 2].map(i => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.moveDot,
                                                i < myPlayer.movesRemaining && styles.moveDotActive
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}

                            {/* Defender Moves Indicator */}
                            {isDefensePhase && pendingAttack && (
                                <View style={styles.movesIndicator}>
                                    {[0, 1, 2].map(i => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.moveDot,
                                                i < (pendingAttack.defenderMovesRemaining || 0) && styles.moveDotActive
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}

                            {/* Attack/Defense Battle Display */}
                            {(gameState?.turnPhase === 'attack' || gameState?.turnPhase === 'defense') && pendingAttack && (
                                <View style={styles.battleDisplay}>
                                    {/* Ponto Card Display */}
                                    {pendingAttack.pontoCard && (
                                        <View style={styles.pontoCardDisplay}>
                                            <Image
                                                source={CARD_IMAGES[(pendingAttack.pontoCard.imageName || 'ponto') as keyof typeof CARD_IMAGES] || CARD_IMAGES['ponto' as keyof typeof CARD_IMAGES]}
                                                style={styles.pontoCardImage}
                                                resizeMode="contain"
                                            />
                                            <Text style={styles.pontoCardValue}>+{pendingAttack.pontoCard.attack}</Text>
                                        </View>
                                    )}

                                    <View style={styles.battleSide}>
                                        <Text style={styles.battleLabel}>هجوم</Text>
                                        <Text style={styles.battleValue}>{pendingAttack.attackSum}</Text>
                                    </View>
                                    <Text style={styles.battleVs}>VS</Text>
                                    <View style={styles.battleSide}>
                                        <Text style={styles.battleLabel}>دفاع</Text>
                                        <Text style={styles.battleValue}>{pendingAttack.defenseSum}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Attack Result */}
                            {lastAttackResult && (
                                <View style={[
                                    styles.attackResult,
                                    lastAttackResult.result === 'goal' && styles.attackResultGoal,
                                ]}>
                                    <Text style={styles.attackResultText}>
                                        {lastAttackResult.result === 'goal'
                                            ? `هدف! +${lastAttackResult.damage}`
                                            : 'تصدي!'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Right Side - Ponto Deck */}
                        <View style={styles.deckSidebarRight}>
                            <TouchableOpacity
                                style={[
                                    styles.deckCard,
                                    isAttackPontoNeeded && styles.deckCardActive
                                ]}
                                onPress={() => isAttackPontoNeeded ? drawPonto() : drawCards('ponto', 1)}
                                disabled={!isMyTurn || (myPlayer?.movesRemaining || 0) < 1}
                            >
                                <MaterialCommunityIcons name="diamond" size={20} color={isAttackPontoNeeded ? COLORS.ponto : "rgba(255,255,255,0.4)"} />
                                <Text style={[styles.deckLabel, isAttackPontoNeeded && styles.deckLabelActive]}>بونتو</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Player Field - Full Width */}
                    <View style={styles.fieldRow}>
                        {(myPlayer?.field || [null, null, null, null, null]).map((card, i) =>
                            renderPlayerSlot(card, i)
                        )}
                    </View>

                    {/* Action Buttons - Full Width */}
                    <View style={styles.actionButtons}>
                        {/* Reveal Button (Contextual) */}
                        {(() => {
                            if (!selectedCardId || !myPlayer) return null;
                            const index = myPlayer.field.findIndex(c => c?.id === selectedCardId);
                            if (index === -1) return null;
                            const card = myPlayer.field[index];
                            if (!card || card.isRevealed) return null;

                            const isAttack = (gameState?.turnPhase === 'play' || gameState?.turnPhase === 'attack');
                            const isDefense = isDefensePhase;

                            const isValidAttackReveal = isAttack && isMyTurn && (card.position === 'FW' || card.position === 'MF');
                            const isValidDefenseReveal = isDefense && (card.position === 'DF' || card.position === 'GK');

                            if (isValidAttackReveal || isValidDefenseReveal) {
                                return (
                                    <TouchableOpacity
                                        style={styles.revealButton}
                                        onPress={() => {
                                            if (isValidAttackReveal) revealAttacker(index);
                                            else revealDefender(index);
                                        }}
                                    >
                                        <Ionicons name="eye" size={18} color="#FFF" />
                                        <Text style={styles.revealButtonText}>كشف الكرت</Text>
                                    </TouchableOpacity>
                                );
                            }
                            return null;
                        })()}

                        {/* Defense Phase Buttons */}
                        {isDefensePhase && (
                            <>
                                <TouchableOpacity
                                    style={styles.acceptGoalButton}
                                    onPress={acceptGoal}
                                >
                                    <Ionicons name="football-outline" size={18} color="#FFF" />
                                    <Text style={styles.acceptGoalText}>قبول الهدف</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.defenseButton}
                                    onPress={endDefense}
                                >
                                    <Ionicons name="shield-checkmark" size={18} color="#FFF" />
                                    <Text style={styles.defenseButtonText}>إنهاء الدفاع</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Attack Phase Button */}
                        {gameState?.turnPhase === 'attack' && isMyTurn && pendingAttack?.pontoCard && (
                            <TouchableOpacity
                                style={styles.endAttackButton}
                                onPress={endAttackPhase}
                            >
                                <MaterialCommunityIcons name="sword" size={18} color="#FFF" />
                                <Text style={styles.endAttackText}>إنهاء الهجوم</Text>
                            </TouchableOpacity>
                        )}

                        {/* Play Phase Buttons */}
                        {gameState?.turnPhase === 'play' && (
                            <TouchableOpacity
                                style={[styles.endTurnButton, !isMyTurn && styles.buttonDisabled]}
                                onPress={endTurn}
                                disabled={!isMyTurn}
                            >
                                <Text style={styles.endTurnText}>إنهاء الدور</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* HAND AREA */}
                <View style={styles.handArea}>
                    <View style={styles.handDragIndicator} />
                    <View style={styles.handHeader}>
                        <Text style={styles.handCount}>كروتك ({myPlayer?.hand.length || 0})</Text>
                        <TouchableOpacity onPress={() => setShowMenu(true)}>
                            <Ionicons name="menu" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handScroll}>
                        {(myPlayer?.hand || []).map(card => renderHandCard(card))}
                    </ScrollView>
                </View>

            </SafeAreaView>

            {/* Menu Modal */}
            <Modal visible={showMenu} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
                    <View style={styles.menuModal}>
                        <TouchableOpacity style={styles.menuItem} onPress={handleSurrender}>
                            <Ionicons name="flag" size={20} color={COLORS.error} />
                            <Text style={styles.menuItemDanger}>استسلام</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
                            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                            <Text style={styles.menuItemText}>إغلاق</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Action Card Modal */}
            <Modal
                visible={!!selectedActionCard && actionTargetMode === 'none'}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedActionCard(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.actionModalContent}>
                        <Text style={styles.actionModalTitle}>{selectedActionCard?.nameAr || 'أكشن'}</Text>

                        <View style={styles.actionCardPreview}>
                            <MaterialIcons name="flash-on" size={48} color={COLORS.warning} />
                            <Text style={styles.actionCardPreviewName}>{selectedActionCard?.name}</Text>
                        </View>

                        <Text style={styles.actionModalDesc}>{selectedActionCard?.description}</Text>

                        <View style={styles.actionModalButtons}>
                            <TouchableOpacity
                                style={styles.actionUseButton}
                                onPress={() => selectedActionCard && handleActionUse(selectedActionCard)}
                            >
                                <Text style={styles.actionButtonText}>استخدام</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionCancelButton}
                                onPress={() => setSelectedActionCard(null)}
                            >
                                <Text style={styles.actionButtonText}>إلغاء</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


            {/* Game End Modal */}
            <Modal visible={!!gameEndInfo} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.gameEndModal}>
                        <MaterialCommunityIcons
                            name={gameEndInfo?.winnerId === myPlayer?.odium ? 'trophy' : 'emoticon-sad'}
                            size={64}
                            color={gameEndInfo?.winnerId === myPlayer?.odium ? '#FFD700' : COLORS.error}
                        />
                        <Text style={styles.gameEndTitle}>
                            {gameEndInfo?.winnerId === myPlayer?.odium ? 'فوز!' : 'خسارة'}
                        </Text>
                        <Text style={styles.gameEndReason}>{gameEndInfo?.reason}</Text>
                        <TouchableOpacity style={styles.gameEndButton} onPress={onBack}>
                            <Text style={styles.gameEndButtonText}>خروج</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        left: '-10%',
        width: '120%',
        height: '40%',
        backgroundColor: 'rgba(9, 170, 9, 0.05)',
        borderRadius: 1000,
        transform: [{ scaleX: 1.5 }],
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    safeArea: {
        flex: 1,
    },

    // HEADER
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    scoreboardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(26, 51, 26, 0.8)',
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    playerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '25%',
    },
    playerSectionReverse: {
        flexDirection: 'row-reverse',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceLighter,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    avatarMe: {
        borderColor: COLORS.primary,
    },
    avatarOpponent: {
        borderColor: 'rgba(239, 68, 68, 0.5)',
    },
    levelBadge: {
        position: 'absolute',
        bottom: -4,
        left: -4,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.surfaceDark,
    },
    levelBadgeOpponent: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: 'rgba(127, 29, 29, 0.8)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.surfaceDark,
    },
    levelText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    scoreText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    timerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    timerBlock: {
        alignItems: 'center',
    },
    timerLabel: {
        fontSize: 9,
        color: 'rgba(9, 170, 9, 0.8)',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    timerLabelGray: {
        fontSize: 9,
        color: COLORS.textSlate,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    timerValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        fontFamily: 'monospace',
    },
    timerValueActive: {
        color: COLORS.primary,
    },
    timerValueGray: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textSlate,
        fontFamily: 'monospace',
    },
    timerDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 8,
    },

    // MAIN AREA - Column layout
    mainArea: {
        flex: 1,
        flexDirection: 'column',
        paddingHorizontal: 8,
        paddingVertical: 8,
        justifyContent: 'space-between',
    },

    // DECK SIDEBARS
    deckSidebar: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    deckSidebarLeft: {
        width: 55,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    deckSidebarRight: {
        width: 55,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    deckCard: {
        width: 48,
        height: 64,
        backgroundColor: COLORS.surfaceLighter,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deckLabel: {
        position: 'absolute',
        bottom: -14,
        fontSize: 8,
        color: COLORS.textSlate,
        fontWeight: 'bold',
    },
    deckCardActive: {
        borderColor: COLORS.primary,
        borderWidth: 2,
        backgroundColor: 'rgba(9, 170, 9, 0.2)',
    },
    deckLabelActive: {
        color: COLORS.primary,
    },
    drawsRemainingBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        marginTop: 4,
    },
    drawsRemainingText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },

    // CENTER ZONE
    centerZone: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // FIELD
    fieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
        paddingHorizontal: 4,
    },
    fieldSlot: {
        flex: 1,
        aspectRatio: 2 / 3,
        backgroundColor: COLORS.surfaceLighter,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fieldSlotSelected: {
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    fieldSlotAttacker: {
        borderColor: COLORS.primary,
        borderWidth: 2,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 8,
    },
    fieldSlotTarget: {
        borderColor: COLORS.error,
        borderWidth: 2,
    },
    cardBack: {
        flex: 1,
        width: '100%',
        backgroundColor: COLORS.surfaceLighter,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBackCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    emptySlotCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    slotCardFilled: {
        flex: 1,
        width: '100%',
    },
    slotCardImage: {
        width: '100%',
        height: '100%',
    },
    slotCardOverlay: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 2,
        alignItems: 'center',
    },
    slotCardOverlaySelected: {
        backgroundColor: COLORS.primary,
    },
    slotCardStat: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#FFF',
    },
    attackerPing: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },

    phaseBadge: {
        position: 'absolute',
        top: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(9, 170, 9, 0.2)',
    },
    phaseBadgeText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    fieldCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(22, 101, 52, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    fieldCircleInner: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fieldLine: {
        position: 'absolute',
        width: '100%',
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    fieldDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    movesIndicator: {
        position: 'absolute',
        top: 40,
        flexDirection: 'row',
        gap: 4,
        zIndex: 25,
    },
    moveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.surfaceLighter,
    },
    moveDotActive: {
        backgroundColor: COLORS.primary,
    },
    battleDisplay: {
        position: 'absolute',
        bottom: -40,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 12,
    },
    battleSide: {
        alignItems: 'center',
    },
    battleLabel: {
        color: COLORS.textSecondary,
        fontSize: 10,
        fontWeight: '600',
    },
    battleValue: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    battleVs: {
        color: COLORS.warning,
        fontSize: 12,
        fontWeight: 'bold',
    },
    attackResult: {
        position: 'absolute',
        backgroundColor: COLORS.surfaceDark,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.info,
    },
    attackResultGoal: {
        backgroundColor: 'rgba(9, 170, 9, 0.3)',
        borderColor: COLORS.primary,
    },
    attackResultText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // ACTION BUTTONS
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 4,
        marginTop: 8,
    },
    endTurnButton: {
        flex: 1,
        backgroundColor: COLORS.surfaceLighter,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    endTurnText: {
        color: COLORS.textSlate,
        fontSize: 12,
        fontWeight: 'bold',
    },
    attackButton: {
        flex: 2,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 12,
    },
    attackButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    defenseButton: {
        flex: 1,
        backgroundColor: COLORS.info,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    defenseButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    revealButton: {
        flex: 1,
        backgroundColor: COLORS.success,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    revealButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    drawPontoButton: {
        flex: 2,
        backgroundColor: COLORS.ponto,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    drawPontoText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    pontoCardDisplay: {
        position: 'absolute',
        top: -65,
        alignSelf: 'center',
        alignItems: 'center',
        zIndex: 30,
    },
    pontoCardImage: {
        width: 40,
        height: 56,
        borderRadius: 4,
        backgroundColor: COLORS.surfaceLighter,
    },
    pontoCardValue: {
        color: COLORS.ponto,
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    acceptGoalButton: {
        flex: 1,
        backgroundColor: COLORS.error,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    acceptGoalText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    endAttackButton: {
        flex: 1,
        backgroundColor: COLORS.warning,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    endAttackText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.5,
    },

    // HAND AREA
    handArea: {
        backgroundColor: COLORS.surfaceDark,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 8,
        paddingBottom: 24,
    },
    handDragIndicator: {
        width: 48,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 8,
    },
    handHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    handCount: {
        fontSize: 12,
        color: COLORS.textSlate,
        fontWeight: '500',
    },
    handScroll: {
        paddingHorizontal: 16,
        gap: 12,
    },
    handCard: {
        width: 88,
        aspectRatio: 2 / 3,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: COLORS.surfaceLighter,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    handCardSelected: {
        borderColor: COLORS.primary,
        borderWidth: 2,
        transform: [{ translateY: -8 }],
    },
    handCardImage: {
        width: '100%',
        height: '100%',
    },
    handCardPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    handCardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'transparent',
    },
    positionBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    positionBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    handCardRating: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    handCardName: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
    },
    handCardActionLabel: {
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: COLORS.warning,
        fontSize: 10,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowRadius: 2,
    },
    handCardPontoLabel: {
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: COLORS.secondary,
        fontSize: 10,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowRadius: 2,
    },

    // ACTION MODAL
    actionModalContent: {
        width: '85%',
        backgroundColor: COLORS.surfaceDarker,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    actionModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    actionCardPreview: {
        width: 100,
        height: 140,
        backgroundColor: COLORS.surfaceLighter,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.warning,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    actionCardPreviewName: {
        color: COLORS.warning,
        marginTop: 8,
        fontWeight: 'bold',
    },
    actionModalDesc: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    actionModalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    actionUseButton: {
        flex: 1,
        backgroundColor: COLORS.warning,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionCancelButton: {
        flex: 1,
        backgroundColor: COLORS.surfaceLighter,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    actionButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },


    // DRAW PHASE MODAL
    drawPhaseModal: {
        width: '90%',
        backgroundColor: COLORS.surfaceDarker,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
        gap: 16,
    },
    drawPhaseTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 8,
    },
    drawPhaseSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    drawOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceLighter,
        borderRadius: 16,
        padding: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 16,
    },
    drawOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    drawOptionTextContainer: {
        flex: 1,
    },
    drawOptionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    drawOptionDesc: {
        fontSize: 12,
        color: COLORS.textSlate,
    },


    // OTHER MODALS & LABELS


    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuModal: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 16,
        padding: 16,
        width: 200,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
    },
    menuItemText: {
        color: COLORS.textPrimary,
        fontSize: 15,
    },
    menuItemDanger: {
        color: COLORS.error,
        fontSize: 15,
    },
    gameEndModal: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        width: 280,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    gameEndTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    gameEndReason: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    gameEndButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    gameEndButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default GamePlayScreen;
