import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';

// Types matching backend
export type CardPosition = 'FW' | 'MF' | 'DF' | 'GK';
export type CardType = 'player' | 'action' | 'ponto';

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

export interface GameState {
    id: string;
    status: 'waiting' | 'starting' | 'playing' | 'finished';
    currentTurn: string;
    turnPhase: 'draw' | 'play' | 'attack' | 'end';
    turnNumber: number;
    turnTimeLimit: number;
    player1: PlayerState;
    player2: PlayerState | null;
    winner?: string;
}

interface LocalGameState {
    gameState: GameState | null;
    isMyTurn: boolean;
    myPlayerId: string | null;
    timerSeconds: number;
    selectedCardId: string | null;
    selectedFromHand: boolean;
}

export const useGameLogic = (initialGameState?: GameState | null) => {
    const [state, setState] = useState<LocalGameState>({
        gameState: initialGameState || null,
        isMyTurn: false,
        myPlayerId: null,
        timerSeconds: 90,
        selectedCardId: null,
        selectedFromHand: false,
    });

    // Get my player data
    const getMyPlayer = useCallback((): PlayerState | null => {
        if (!state.gameState || !state.myPlayerId) return null;
        if (state.gameState.player1.odium === state.myPlayerId) return state.gameState.player1;
        return state.gameState.player2;
    }, [state.gameState, state.myPlayerId]);

    // Get opponent data
    const getOpponent = useCallback((): PlayerState | null => {
        if (!state.gameState || !state.myPlayerId) return null;
        if (state.gameState.player1.odium === state.myPlayerId) return state.gameState.player2;
        return state.gameState.player1;
    }, [state.gameState, state.myPlayerId]);

    // Socket event listeners
    useEffect(() => {
        // Get my player ID from socket connection
        socketService.on('connected', (data: { playerId: string }) => {
            setState(prev => ({ ...prev, myPlayerId: data.playerId }));
        });

        // Game starts
        socketService.on('game_start', (gameState: GameState) => {
            console.log('🎮 Game started:', gameState);
            setState(prev => ({
                ...prev,
                gameState,
                isMyTurn: gameState.currentTurn === prev.myPlayerId,
            }));
        });

        // Game state updates
        socketService.on('game_update', (gameState: GameState) => {
            console.log('📡 Game update:', gameState);
            setState(prev => ({
                ...prev,
                gameState,
                isMyTurn: gameState.currentTurn === prev.myPlayerId,
            }));
        });

        // Turn starts
        socketService.on('turn_start', (data: { playerId: string; timeLimit: number }) => {
            console.log('⏱️ Turn start:', data);
            setState(prev => ({
                ...prev,
                isMyTurn: data.playerId === prev.myPlayerId,
                timerSeconds: data.timeLimit,
            }));
        });

        // Card played
        socketService.on('card_played', (data: { playerId: string; card: GameCard; slotIndex: number }) => {
            console.log('🃏 Card played:', data);
            // State will be updated by game_update
        });

        // Attack result
        socketService.on('attack_result', (data: any) => {
            console.log('⚔️ Attack result:', data);
            // TODO: Show attack animation
        });

        // Game ended
        socketService.on('game_end', (data: { winnerId: string; reason: string }) => {
            console.log('🏆 Game ended:', data);
            // TODO: Navigate to game over screen
        });

        // Error handling
        socketService.on('error', (data: { message: string; code: string }) => {
            console.error('❌ Game error:', data);
            // TODO: Show toast
        });

        return () => {
            socketService.off('connected');
            socketService.off('game_start');
            socketService.off('game_update');
            socketService.off('turn_start');
            socketService.off('card_played');
            socketService.off('attack_result');
            socketService.off('game_end');
            socketService.off('error');
        };
    }, []);

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

    // Actions
    const selectCard = useCallback((cardId: string, fromHand: boolean) => {
        setState(prev => {
            if (prev.selectedCardId === cardId) {
                return { ...prev, selectedCardId: null, selectedFromHand: false };
            }
            return { ...prev, selectedCardId: cardId, selectedFromHand: fromHand };
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

    const attack = useCallback((attackerSlotIndex: number, defenderSlotIndex: number) => {
        socketService.emit('attack', {
            attackerSlotIndex,
            defenderSlotIndex,
        });
    }, []);

    const endTurn = useCallback(() => {
        socketService.emit('end_turn');
    }, []);

    return {
        gameState: state.gameState,
        isMyTurn: state.isMyTurn,
        timerSeconds: state.timerSeconds,
        selectedCardId: state.selectedCardId,
        myPlayer: getMyPlayer(),
        opponent: getOpponent(),
        selectCard,
        playCard,
        attack,
        endTurn,
    };
};
