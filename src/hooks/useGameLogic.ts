import { useState, useEffect, useCallback, useRef } from 'react';
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
    imageName?: string;
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
    lockedSlots?: number[]; // Slots locked by Biter card
    nextAttackCancelled?: boolean; // VAR effect
    // Legendary effects
    rulesBlocked?: boolean;
    tacticsBlocked?: boolean;
    extraPontoAvailable?: boolean; // Abo Kaaf ability
}

export interface PendingAttack {
    attackerId: string;
    attackerSlots: number[];
    pontoCard?: GameCard;
    pontoCards?: GameCard[];
    attackSum: number;
    defenseSum: number;
    defensePontoCard?: GameCard;
    defensePontoCards?: GameCard[];
    defenderMovesRemaining?: number;
    defenderSlots: number[];
}

export interface GameState {
    id: string;
    status: 'waiting' | 'starting' | 'playing' | 'finished';
    currentTurn: string;
    turnPhase: 'draw' | 'play' | 'attack' | 'defense' | 'end';
    turnNumber: number;
    turnTimeLimit: number;
    turnStartTime?: number;
    matchStartTime?: number;
    matchTimeLimit: number;
    isGoldenGoal?: boolean;
    winReason?: 'score' | 'timeout' | 'golden_goal' | 'surrender' | 'disconnect';
    player1: PlayerState;
    player2: PlayerState | null;
    pendingAttack?: PendingAttack;
    winner?: string;
    serverTime?: number; // For clock synchronization
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
        if (state.gameState.player2?.odium === myPlayerId) return state.gameState.player2;

        console.log('⚠️ Observer mode or ID mismatch:', {
            myId: myPlayerId,
            p1: state.gameState.player1.odium,
            p2: state.gameState.player2?.odium
        });
        return null;
    }, [state.gameState, myPlayerId]);

    // Get opponent data
    const getOpponent = useCallback((): PlayerState | null => {
        if (!state.gameState || !myPlayerId) return null;
        if (state.gameState.player1.odium === myPlayerId) return state.gameState.player2;
        if (state.gameState.player2?.odium === myPlayerId) return state.gameState.player1;

        return null;
    }, [state.gameState, myPlayerId]);

    // Clock synchronization
    const clockOffsetRef = useRef<number>(0);

    const getSyncedNow = () => Date.now() + clockOffsetRef.current;

    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            if (!state.gameState) return;

            // Sync Match Timer
            if (state.gameState.matchStartTime) {
                const now = getSyncedNow();
                const elapsed = (now - state.gameState.matchStartTime) / 1000;
                const matchRemaining = Math.max(0, Math.floor((state.gameState.matchTimeLimit || 1200) - elapsed));

                setState(prev => ({ ...prev, matchTimerSeconds: matchRemaining }));
            }

            // Sync Turn Timer
            // Check if game is playing
            if (state.gameState.status === 'playing' && state.gameState.turnStartTime) {
                const now = getSyncedNow();
                const elapsed = (now - state.gameState.turnStartTime) / 1000;
                const turnRemaining = Math.max(0, Math.floor((state.gameState.turnTimeLimit || 90) - elapsed));

                setState(prev => ({ ...prev, timerSeconds: turnRemaining }));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [state.gameState?.turnStartTime, state.gameState?.matchStartTime, state.gameState?.status]);

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

            // Update clock offset
            if (gameState.serverTime) {
                clockOffsetRef.current = gameState.serverTime - Date.now();
                console.log('⏰ Synced clock offset:', clockOffsetRef.current);
            }

            // Calculate accurate turn timer from server's turnStartTime
            const now = getSyncedNow();
            let turnRemaining = gameState.turnTimeLimit || 90;
            if (gameState.turnStartTime) {
                const elapsed = (now - gameState.turnStartTime) / 1000;
                turnRemaining = Math.max(0, Math.floor(gameState.turnTimeLimit - elapsed));
            }

            // Calculate accurate match timer from server's matchStartTime
            let matchRemaining = gameState.matchTimeLimit || 1200;
            if (gameState.matchStartTime) {
                const elapsed = (now - gameState.matchStartTime) / 1000;
                matchRemaining = Math.max(0, Math.floor(gameState.matchTimeLimit - elapsed));
            }

            setState(prev => ({
                ...prev,
                gameState,
                isMyTurn: checkIsMyTurn(gameState),
                isDefensePhase: gameState.turnPhase === 'defense' && checkIsMyTurn(gameState),
                matchTimerSeconds: matchRemaining,
                timerSeconds: turnRemaining,
            }));
        });

        // Game state updates - sync timers from server timestamps
        socketService.on('game_update', (gameState: GameState) => {
            console.log('📡 Game update:', gameState.turnPhase, 'currentTurn:', gameState.currentTurn);

            // Update clock offset
            if (gameState.serverTime) {
                clockOffsetRef.current = gameState.serverTime - Date.now();
            }

            // Calculate accurate turn timer from server's turnStartTime
            const now = getSyncedNow();
            let turnRemaining = gameState.turnTimeLimit || 90;
            if (gameState.turnStartTime) {
                const elapsed = (now - gameState.turnStartTime) / 1000;
                turnRemaining = Math.max(0, Math.floor(gameState.turnTimeLimit - elapsed));
            }

            // Calculate accurate match timer from server's matchStartTime
            let matchRemaining = gameState.matchTimeLimit || 1200;
            if (gameState.matchStartTime) {
                const elapsed = (now - gameState.matchStartTime) / 1000;
                matchRemaining = Math.max(0, Math.floor(gameState.matchTimeLimit - elapsed));
            }

            setState(prev => ({
                ...prev,
                gameState,
                isMyTurn: checkIsMyTurn(gameState),
                isDefensePhase: gameState.turnPhase === 'defense' && checkIsMyTurn(gameState),
                timerSeconds: turnRemaining,
                matchTimerSeconds: matchRemaining,
            }));
        });

        // Turn starts
        socketService.on('turn_start', (data: { playerId: string; timeLimit: number; remainingTime?: number; turnStartTime?: number }) => {
            console.log('⏱️ Turn start:', data, 'myId:', myPlayerId);
            // Calculate remaining time from server's turnStartTime if available
            let remaining = data.remainingTime ?? data.timeLimit;
            if (data.turnStartTime) {
                const now = getSyncedNow();
                const elapsed = (now - data.turnStartTime) / 1000;
                remaining = Math.max(0, Math.floor(data.timeLimit - elapsed));
            }
            setState(prev => ({
                ...prev,
                isMyTurn: data.playerId === myPlayerId,
                timerSeconds: remaining,
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

        // Golden Goal started
        socketService.on('golden_goal_started', (data: { message: string }) => {
            console.log('⚽🏆 Golden Goal Started:', data.message);
            // You might want to add a toast or alert here in the UI layer
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
            socketService.off('golden_goal_started');
        };
    }, [myPlayerId, checkIsMyTurn]);

    // Timer countdown - runs for both players (not just active player)
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (state.gameState?.status === 'playing' && state.timerSeconds > 0) {
            interval = setInterval(() => {
                setState(prev => ({
                    ...prev,
                    timerSeconds: prev.timerSeconds - 1,
                }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [state.gameState?.status, state.timerSeconds]);

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

    // Draw Phase (mandatory at turn start - FREE) - tap decks to draw
    const drawFromDeck = useCallback((deckType: 'player' | 'action') => {
        socketService.emit('draw_from_deck', { deckType });
    }, []);

    // NEW ATTACK/DEFENSE FLOW
    const revealAttacker = useCallback((slotIndex: number) => {
        socketService.emit('reveal_attacker', { slotIndex });
    }, []);

    const endAttackPhase = useCallback(() => {
        socketService.emit('end_attack_phase');
    }, []);

    const revealDefender = useCallback((slotIndex: number) => {
        socketService.emit('reveal_defender', { slotIndex });
    }, []);

    const acceptGoal = useCallback(() => {
        socketService.emit('accept_goal');
    }, []);

    const endDefense = useCallback(() => {
        socketService.emit('end_defense');
    }, []);

    const drawPonto = useCallback(() => {
        socketService.emit('draw_ponto');
    }, []);

    // Abo Kaaf ability - draw extra ponto (FREE, no move cost)
    const drawExtraPonto = useCallback(() => {
        socketService.emit('draw_extra_ponto');
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

        // New Attack/Defense Flow
        revealAttacker,
        endAttackPhase,
        revealDefender,
        acceptGoal,
        endDefense,
        drawPonto,
        drawExtraPonto, // Abo Kaaf ability
        endTurn,
        surrender,
        clearGameEnd,
        drawFromDeck,
    };
};
