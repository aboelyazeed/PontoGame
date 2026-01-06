// ==========================================
// GamePlayScreen - Refactored Main Component
// ==========================================

import React, { useState } from 'react';
import {
    View,
    Text,
    StatusBar,
    I18nManager,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Hooks & Store
import { useGameLogic, GameCard } from '../../hooks/useGameLogic';
import { useAuthStore } from '../../store/authStore';

// Styles
import { styles, GAME_COLORS } from './GamePlayScreen.styles';

// Components
import {
    FieldSlot,
    GameHeader,
    HandArea,
    DeckSidebar,
    CenterZone,
    ActionButtons,
    GameModals,
} from './components';

// Force RTL
I18nManager.forceRTL(true);

// ==========================================
// Types
// ==========================================

interface GamePlayScreenProps {
    onBack?: () => void;
    initialGameState?: any;
}

// ==========================================
// Main Component
// ==========================================

const GamePlayScreen: React.FC<GamePlayScreenProps> = ({ onBack, initialGameState }) => {
    const { user } = useAuthStore();
    const myPlayerId = user?.id || null;

    // Game Logic Hook
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

    // ==========================================
    // UI State
    // ==========================================

    const [showMenu, setShowMenu] = useState(false);
    const [selectedActionCard, setSelectedActionCard] = useState<GameCard | null>(null);
    const [actionTargetMode, setActionTargetMode] = useState<'none' | 'swap_my' | 'swap_opp' | 'target_opp' | 'target_my' | 'target_slot'>('none');
    const [tempTargetData, setTempTargetData] = useState<any>({});
    const [instructionText, setInstructionText] = useState<string | null>(null);

    // Confirm Dialog State
    const [confirmConfig, setConfirmConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
    }>({
        visible: false,
        title: '',
        message: '',
    });

    // ==========================================
    // Computed Values
    // ==========================================

    const isAttackPontoNeeded = gameState?.turnPhase === 'attack' && isMyTurn && !!pendingAttack && !pendingAttack.pontoCard;

    const phaseText = instructionText ? instructionText
        : gameState?.turnPhase === 'draw' ? (isMyTurn ? 'اسحب كرتين' : 'الخصم يسحب')
            : gameState?.turnPhase === 'attack' ? (isMyTurn ? 'اكشف مهاجم آخر أو أنهِ الهجوم' : 'الخصم يهاجم')
                : isDefensePhase ? 'دافع!'
                    : isMyTurn ? 'دورك - اللعب'
                        : 'دور المنافس';

    // ==========================================
    // Handlers
    // ==========================================

    const showAlert = (title: string, message: string) => {
        setAlertConfig({ visible: true, title, message });
    };

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    const handleSurrender = () => {
        setConfirmConfig({
            visible: true,
            title: 'استسلام',
            message: 'هل أنت متأكد من الاستسلام؟',
            onConfirm: () => {
                surrender();
                setConfirmConfig(prev => ({ ...prev, visible: false }));
            },
        });
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
                useActionCard(card.id);
                setSelectedActionCard(null);
                break;
        }
    };

    const resetActionState = () => {
        setSelectedActionCard(null);
        setActionTargetMode('none');
        setInstructionText(null);
        setTempTargetData({});
    };

    const handleFieldTargetPress = (card: GameCard | null, slotIndex: number, isOpponent: boolean) => {
        if (!selectedActionCard) return;

        if (actionTargetMode === 'target_opp') {
            if (!isOpponent || !card) {
                showAlert('خطأ', 'يجب اختيار لاعب خصم');
                return;
            }
            useActionCard(selectedActionCard.id, { slotIndex1: slotIndex, isOpponentSlot1: true });
            resetActionState();
        }
        else if (actionTargetMode === 'target_my') {
            if (isOpponent || !card) {
                showAlert('خطأ', 'يجب اختيار لاعب من فريقك');
                return;
            }
            useActionCard(selectedActionCard.id, { slotIndex1: slotIndex });
            resetActionState();
        }
        else if (actionTargetMode === 'swap_my') {
            if (isOpponent || !card) {
                showAlert('خطأ', 'يجب اختيار لاعب من فريقك أولاً');
                return;
            }
            setTempTargetData({ slotIndex1: slotIndex });
            setActionTargetMode('swap_opp');
            setInstructionText('اختر لاعب الخصم للمبادلة');
        }
        else if (actionTargetMode === 'swap_opp') {
            if (!isOpponent || !card) {
                showAlert('خطأ', 'يجب اختيار لاعب خصم');
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

    const handleFieldCardPress = (card: GameCard | null, slotIndex: number, isOpponent: boolean) => {
        if (gameState?.turnPhase === 'draw') return;

        if (isAttackPontoNeeded) {
            showAlert('تنبيه', 'يجب سحب كارت بونطو أولاً!');
            return;
        }

        if (actionTargetMode !== 'none') {
            handleFieldTargetPress(card, slotIndex, isOpponent);
            return;
        }

        if (gameState?.turnPhase === 'play' || gameState?.turnPhase === 'attack') {
            if (!isMyTurn) return;
            if (isOpponent) return;

            if (gameState.turnPhase === 'play' && selectedCardId && myPlayer) {
                const isHandCard = myPlayer.hand.some(c => c.id === selectedCardId);
                if (isHandCard && card) {
                    swapCards(selectedCardId, slotIndex);
                    return;
                }
            }

            if (card) {
                selectCard(card.id, false);
            }
            return;
        }

        if (gameState?.turnPhase === 'defense') {
            if (!isDefensePhase) return;
            if (isOpponent) return;

            if (card) {
                selectCard(card.id, false);
            }
            return;
        }
    };

    const handleEmptySlotPress = (slotIndex: number) => {
        if (gameState?.turnPhase === 'draw') return;

        if (isAttackPontoNeeded) {
            showAlert('تنبيه', 'يجب سحب كارت بونطو أولاً!');
            return;
        }

        if (!isMyTurn || attackMode) return;

        if (selectedCardId) {
            playCard(slotIndex);
        }
    };

    const handleHandCardPress = (card: GameCard) => {
        if (gameState?.turnPhase === 'draw') return;

        if (isAttackPontoNeeded) {
            showAlert('تنبيه', 'يجب سحب كارت بونطو أولاً!');
            return;
        }

        if (!isMyTurn && !isDefensePhase) return;

        if (card.type === 'action') {
            setSelectedActionCard(card);
        } else {
            selectCard(card.id, true);
        }
    };

    // ==========================================
    // Loading State
    // ==========================================

    if (!gameState) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={GAME_COLORS.primary} />
                <Text style={styles.loadingText}>جاري تحميل اللعبة...</Text>
            </View>
        );
    }

    // ==========================================
    // Render
    // ==========================================

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={GAME_COLORS.backgroundDark} />
            <View style={styles.backgroundGlow} />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <GameHeader
                    myPlayer={myPlayer}
                    opponent={opponent}
                    timerSeconds={timerSeconds}
                    matchTimerSeconds={matchTimerSeconds}
                    isMyTurn={isMyTurn}
                />

                {/* Main Game Area */}
                <View style={styles.mainArea}>
                    {/* Opponent Field */}
                    <View style={styles.fieldRow}>
                        {(opponent?.field || [null, null, null, null, null]).map((card, i) => (
                            <FieldSlot
                                key={`opp-${i}`}
                                card={card}
                                index={i}
                                isOpponent={true}
                                isTarget={actionTargetMode === 'target_opp' || actionTargetMode === 'swap_opp'}
                                onPress={handleFieldCardPress}
                                disabled={!isMyTurn && !isDefensePhase}
                            />
                        ))}
                    </View>

                    {/* Center Zone with Decks */}
                    <View style={styles.centerZone}>
                        <DeckSidebar
                            position="left"
                            isMyTurn={isMyTurn}
                            turnPhase={gameState.turnPhase || 'play'}
                            onDrawFromDeck={drawFromDeck}
                        />

                        <CenterZone
                            phaseText={phaseText}
                            movesRemaining={myPlayer?.movesRemaining || 0}
                            isMyTurn={isMyTurn}
                            pendingAttack={pendingAttack}
                            lastAttackResult={lastAttackResult}
                        />

                        <DeckSidebar
                            position="right"
                            isMyTurn={isMyTurn}
                            turnPhase={gameState.turnPhase || 'play'}
                            isAttackPontoNeeded={isAttackPontoNeeded}
                            onDrawPonto={drawPonto}
                        />
                    </View>

                    {/* Player Field */}
                    <View style={styles.fieldRow}>
                        {(myPlayer?.field || [null, null, null, null, null]).map((card, i) => (
                            <FieldSlot
                                key={`my-${i}`}
                                card={card}
                                index={i}
                                isOpponent={false}
                                isSelected={card?.id === selectedCardId}
                                isAttacker={pendingAttack?.attackerId === myPlayerId && pendingAttack?.attackerSlots?.includes(i) || false}
                                onPress={card ? handleFieldCardPress : () => handleEmptySlotPress(i)}
                                disabled={!isMyTurn && !isDefensePhase}
                            />
                        ))}
                    </View>

                    {/* Action Buttons */}
                    <ActionButtons
                        selectedCardId={selectedCardId}
                        myPlayer={myPlayer}
                        turnPhase={gameState.turnPhase || 'play'}
                        isMyTurn={isMyTurn}
                        isDefensePhase={isDefensePhase}
                        isAttackPontoNeeded={isAttackPontoNeeded}
                        pendingAttack={pendingAttack}
                        onRevealAttacker={revealAttacker}
                        onRevealDefender={revealDefender}
                        onEndAttackPhase={endAttackPhase}
                        onAcceptGoal={acceptGoal}
                        onEndDefense={endDefense}
                        onEndTurn={endTurn}
                    />
                </View>

                {/* Hand Area */}
                <HandArea
                    cards={myPlayer?.hand || []}
                    selectedCardId={selectedCardId}
                    onCardPress={handleHandCardPress}
                    onMenuPress={() => setShowMenu(true)}
                    disabled={!isMyTurn && !isDefensePhase}
                />
            </SafeAreaView>

            {/* All Modals */}
            <GameModals
                showMenu={showMenu}
                onMenuClose={() => setShowMenu(false)}
                onSurrender={handleSurrender}
                selectedActionCard={selectedActionCard}
                actionTargetMode={actionTargetMode}
                onActionUse={handleActionUse}
                onActionCancel={() => setSelectedActionCard(null)}
                gameEndInfo={gameEndInfo}
                myPlayerId={myPlayerId}
                onBack={onBack}
                alertConfig={alertConfig}
                onAlertHide={hideAlert}
                confirmConfig={confirmConfig}
                onConfirmCancel={() => setConfirmConfig(prev => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

export default GamePlayScreen;
