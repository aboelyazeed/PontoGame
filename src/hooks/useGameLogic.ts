import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';

// Types matching backend
export type CardPosition = 'FW' | 'MF' | 'DF' | 'GK';
export type CardType = 'player' | 'action' | 'ponto';
export type ActionEffect = 'swap' | 'shoulder' | 'var' | 'mercato' | 'biter' | 'red_card' | 'yellow_card';
export type LegendaryAbility = 'ronaldo' | 'iniesta' | 'shehata' | 'modric' | 'messi' | 'yashin';

export interface GameCard {
    id: string;
    type: CardType;
    name: string;
    nameAr: string;
    position?: CardPosition;
    attack?: number;
    defense?: number;
    description?: string;
    imageUrl?: string;
    isRevealed?: boolean;
    actionEffect?: ActionEffect;
    isLegendary?: boolean;
    legendaryAbility?: LegendaryAbility;
    yellowCards?: number;
}

export interface PlayerState {
    odium: string;
    odiumInfo: {
        username: string;
        displayName: string;
        level: number;
        rank: string;
    };
    hand: GameCard[];
    field: (GameCard | null)[];
    score: number;
    movesRemaining: number;
}

export interface PendingAttack {
    attackerId: string;
    attackerSlotIndex: number;
    defenderSlotIndex: number;
    attackSum: number;
    defenseSum: number;
    defenderMovesRemaining: number;
}

export interface GameState {
    id: string;
    status: 'waiting' | 'starting' | 'playing' | 'finished';
    currentTurn: string;
    turnPhase: 'draw' | 'play' | 'attack' | 'defense' | 'end';
    turnNumber: number;
    turnTimeLimit: number;
    matchStartTime?: number;
    matchTimeLimit: number;
    isGoldenGoal?: boolean;
    winReason?: 'score' | 'timeout' | 'golden_goal' | 'surrender' | 'disconnect';
    player1: PlayerState;
    player2: PlayerState | null;
    pendingAttack?: PendingAttack;
    winner?: string;
}

interface LocalGameState {
    gameState: GameState | null;
    isMyTurn: boolean;
    isDefensePhase: boolean;
    timerSeconds: number;
    matchTimerSeconds: number;
    selectedCardId: string | null;
    selectedFromHand: boolean;
    attackMode: boolean;
    selectedAttackerSlot: number | null;
    lastAttackResult: { result: string; damage: number } | null;
    gameEndInfo: { winnerId: string; reason: string } | null;
}

// Hook accepts myPlayerId from auth store
export const useGameLogic = (myPlayerId: string | null, initialGameState?: GameState | null) => {
    const [state, setState] = useState<LocalGameState>({
        gameState: initialGameState || null,
        isMyTurn: false,
        isDefensePhase: false,
        timerSeconds: 90,
        matchTimerSeconds: 1200,
        selectedCardId: null,
        selectedFromHand: false,
        attackMode: false,
        selectedAttackerSlot: null,
        lastAttackResult: null,
        gameEndInfo: null,
    });

    // Get my player data
    const getMyPlayer = useCallback((): PlayerState | null => {
        if (!state.gameState || !myPlayerId) return null;
        if (state.gameState.player1.odium === myPlayerId) return state.gameState.player1;
        return state.gameState.player2;
    }, [state.gameState, myPlayerId]);

    // Get opponent data
    const getOpponent = useCallback((): PlayerState | null => {
        if (!state.gameState || !myPlayerId) return null;
        if (state.gameState.player1.odium === myPlayerId) return state.gameState.player2;
        return state.gameState.player1;
    }, [state.gameState, myPlayerId]);

    // Check if it's my turn
    const checkIsMyTurn = useCallback((gameState: GameState): boolean => {
        if (!myPlayerId) return false;
        // During defense phase, the defender (currentTurn) is the one who should act
        if (gameState.turnPhase === 'defense') {
            return gameState.currentTurn === myPlayerId;
        }
        return gameState.currentTurn === myPlayerId;
    }, [myPlayerId]);

    // Socket event listeners
    useEffect(() => {
        // Game starts
        socketService.on('game_start', (gameState: GameState) => {
            console.log('🎮 Game started:', gameState);
            console.log('🔑 My Player ID:', myPlayerId);
            console.log('👤 Player1:', gameState.player1.odium);
            console.log('👤 Player2:', gameState.player2?.odium);

            setState(prev => ({
                ...prev,
                gameState,
                isMyTurn: checkIsMyTurn(gameState),
                isDefensePhase: gameState.turnPhase === 'defense',
                matchTimerSeconds: gameState.matchTimeLimit || 1200,
                timerSeconds: gameState.turnTimeLimit || 90,
            }));
        });

        // Game state updates
        socketService.on('game_update', (gameState: GameState) => {
            console.log('📡 Game update:', gameState.turnPhase, 'currentTurn:', gameState.currentTurn);
            setState(prev => ({
                ...prev,
                gameState,
                isMyTurn: checkIsMyTurn(gameState),
                isDefensePhase: gameState.turnPhase === 'defense',
            }));
        });

        // Turn starts
        socketService.on('turn_start', (data: { playerId: string; timeLimit: number }) => {
            console.log('⏱️ Turn start:', data, 'myId:', myPlayerId);
            setState(prev => ({
                ...prev,
                isMyTurn: data.playerId === myPlayerId,
                timerSeconds: data.timeLimit,
                attackMode: false,
                selectedAttackerSlot: null,
                selectedCardId: null,
            }));
        });

        // Card played
        socketService.on('card_played', (data: { playerId: string; card: GameCard; slotIndex: number }) => {
            console.log('🃏 Card played:', data);
        });

        // Card flipped
        socketService.on('card_flipped', (data: { playerId: string; slotIndex: number; card: GameCard }) => {
            console.log('🔄 Card flipped:', data);
        });

        // Cards swapped
        socketService.on('cards_swapped', (data: { playerId: string; fieldSlotIndex: number }) => {
            console.log('🔄 Cards swapped:', data);
        });

        // Action card used
        socketService.on('action_card_used', (data: { playerId: string; cardId: string; drawnCards?: GameCard[]; varResult?: number }) => {
            console.log('⚡ Action card used:', data);
        });

        // Legendary summoned
        socketService.on('legendary_summoned', (data: { playerId: string; legendaryCardId: string; fieldSlotIndex: number; card: GameCard }) => {
            console.log('⭐ Legendary summoned:', data);
        });

        // Attack result
        socketService.on('attack_result', (data: { result: string; damage: number }) => {
            console.log('⚔️ Attack result:', data);
            setState(prev => ({ ...prev, lastAttackResult: data }));
            setTimeout(() => {
                setState(prev => ({ ...prev, lastAttackResult: null }));
            }, 2000);
        });

        // Game ended
        socketService.on('game_end', (data: { winnerId: string; reason: string }) => {
            console.log('🏆 Game ended:', data);
            setState(prev => ({ ...prev, gameEndInfo: data }));
        });

        // Error handling
        socketService.on('error', (data: { message: string; code: string }) => {
            console.error('❌ Game error:', data);
        });

        return () => {
            socketService.off('game_start');
            socketService.off('game_update');
            socketService.off('turn_start');
            socketService.off('card_played');
            socketService.off('card_flipped');
            socketService.off('cards_swapped');
            socketService.off('action_card_used');
            socketService.off('legendary_summoned');
            socketService.off('attack_result');
            socketService.off('game_end');
            socketService.off('error');
        };
    }, [myPlayerId, checkIsMyTurn]);

    // Timer countdown
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (state.isMyTurn && state.timerSeconds > 0) {
            interval = setInterval(() => {
                setState(prev => ({
                    ...prev,
                    timerSeconds: prev.timerSeconds - 1,
                }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [state.isMyTurn, state.timerSeconds]);

    // Match timer countdown
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (state.gameState?.status === 'playing' && state.matchTimerSeconds > 0) {
            interval = setInterval(() => {
                setState(prev => ({
                    ...prev,
                    matchTimerSeconds: prev.matchTimerSeconds - 1,
                }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [state.gameState?.status, state.matchTimerSeconds]);

    // Actions
    const selectCard = useCallback((cardId: string, fromHand: boolean) => {
        setState(prev => {
            if (prev.selectedCardId === cardId) {
                return { ...prev, selectedCardId: null, selectedFromHand: false, attackMode: false };
            }
            return { ...prev, selectedCardId: cardId, selectedFromHand: fromHand, attackMode: false };
        });
    }, []);

    const playCard = useCallback((slotIndex: number) => {
        if (!state.selectedCardId || !state.selectedFromHand) return;

        socketService.emit('play_card', {
            cardId: state.selectedCardId,
            slotIndex,
        });

        setState(prev => ({ ...prev, selectedCardId: null, selectedFromHand: false }));
    }, [state.selectedCardId, state.selectedFromHand]);

    const drawCards = useCallback((cardType: 'player' | 'action' | 'ponto', count: number) => {
        socketService.emit('draw_cards', { cardType, count });
    }, []);

    const flipCard = useCallback((slotIndex: number) => {
        socketService.emit('flip_card', { slotIndex });
    }, []);

    const swapCards = useCallback((handCardId: string, fieldSlotIndex: number) => {
        socketService.emit('swap_cards', { handCardId, fieldSlotIndex });
        setState(prev => ({ ...prev, selectedCardId: null, selectedFromHand: false }));
    }, []);

    const useActionCard = useCallback((cardId: string, targetData?: {
        slotIndex1?: number;
        slotIndex2?: number;
        isOpponentSlot1?: boolean;
        isOpponentSlot2?: boolean;
    }) => {
        socketService.emit('use_action_card', { cardId, ...targetData });
        setState(prev => ({ ...prev, selectedCardId: null, selectedFromHand: false }));
    }, []);

    const summonLegendary = useCallback((legendaryCardId: string, discardCardIds: [string, string], fieldSlotIndex: number) => {
        socketService.emit('summon_legendary', { legendaryCardId, discardCardIds, fieldSlotIndex });
        setState(prev => ({ ...prev, selectedCardId: null, selectedFromHand: false }));
    }, []);

    // Attack flow
    const enterAttackMode = useCallback((attackerSlotIndex: number) => {
        setState(prev => ({
            ...prev,
            attackMode: true,
            selectedAttackerSlot: attackerSlotIndex,
            selectedCardId: null,
            selectedFromHand: false,
        }));
    }, []);

    const cancelAttackMode = useCallback(() => {
        setState(prev => ({
            ...prev,
            attackMode: false,
            selectedAttackerSlot: null,
        }));
    }, []);

    const attack = useCallback((defenderSlotIndex: number) => {
        if (state.selectedAttackerSlot === null) return;

        socketService.emit('attack', {
            attackerSlotIndex: state.selectedAttackerSlot,
            defenderSlotIndex,
        });

        setState(prev => ({
            ...prev,
            attackMode: false,
            selectedAttackerSlot: null,
        }));
    }, [state.selectedAttackerSlot]);

    const endDefense = useCallback(() => {
        socketService.emit('end_defense');
    }, []);

    const endTurn = useCallback(() => {
        socketService.emit('end_turn');
    }, []);

    const surrender = useCallback(() => {
        socketService.emit('surrender');
    }, []);

    const clearGameEnd = useCallback(() => {
        setState(prev => ({ ...prev, gameEndInfo: null }));
    }, []);

    return {
        // State
        gameState: state.gameState,
        isMyTurn: state.isMyTurn,
        isDefensePhase: state.isDefensePhase,
        timerSeconds: state.timerSeconds,
        matchTimerSeconds: state.matchTimerSeconds,
        selectedCardId: state.selectedCardId,
        attackMode: state.attackMode,
        selectedAttackerSlot: state.selectedAttackerSlot,
        lastAttackResult: state.lastAttackResult,
        gameEndInfo: state.gameEndInfo,
        myPlayer: getMyPlayer(),
        opponent: getOpponent(),
        pendingAttack: state.gameState?.pendingAttack,
        myPlayerId,

        // Actions
        selectCard,
        playCard,
        drawCards,
        flipCard,
        swapCards,
        useActionCard,
        summonLegendary,
        enterAttackMode,
        cancelAttackMode,
        attack,
        endDefense,
        endTurn,
        surrender,
        clearGameEnd,
    };
};
