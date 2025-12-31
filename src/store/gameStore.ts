// ==========================================
// Ponto Game - Game State Store (Zustand)
// ==========================================

import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import {
    GameState,
    GameStatus,
    GamePhase,
    PlayerState,
    PlayerSlot,
    AttackState,
    Card,
    PlayerCard,
    ActionCard,
    PontoCard,
    CardType,
    GameActionType,
} from '../types';
import {
    generatePlayerCardDeck,
    generateActionCardDeck,
    generatePontoCardDeck,
    shuffleDeck,
    drawCards,
    GAME_CONSTANTS,
} from '../constants/cards';
import { socketService } from '../services/socket';

// ==========================================
// Store Interface
// ==========================================

interface GameStore {
    // Game State
    // Game State
    gameState: GameState | null;
    isLocalGame: boolean;
    localPlayerId: string;
    isInQueue: boolean;
    queuePosition: number | null;

    // Actions
    initializeGame: (player1Name: string, player2Name: string) => void;
    joinQueue: () => void;
    leaveQueue: () => void;
    resetGame: () => void;
    setupSocketListeners: () => void;
    cleanupSocketListeners: () => void;

    // Turn Actions
    swapCard: (playerId: string, handCardId: string, slotIndex: number) => boolean;
    revealCard: (playerId: string, slotIndex: number) => boolean;
    playLegendary: (
        playerId: string,
        legendaryCardId: string,
        discardCardIds: [string, string],
        targetSlotIndex: number
    ) => boolean;
    playActionCard: (
        playerId: string,
        cardId: string,
        targetInfo?: { targetPlayerId?: string; targetSlotIndex?: number }
    ) => boolean;
    declareAttack: (playerId: string) => boolean;
    endTurn: (playerId: string) => void;

    // Attack/Defense Actions
    playPontoCard: (playerId: string, cardId: string) => boolean;
    finalizeAttack: (playerId: string) => void;
    useDefenseCard: (playerId: string, cardId: string) => boolean;
    skipDefense: (playerId: string) => void;

    // Timer
    decrementTimer: () => void;

    // Helpers
    getCurrentPlayer: () => PlayerState | null;
    getOpponentPlayer: () => PlayerState | null;
    canPerformAction: (playerId: string) => boolean;
    calculateAttackPoints: () => number;
    calculateDefensePoints: () => number;
}

// ==========================================
// Helper Functions
// ==========================================

function createPlayerState(id: string, name: string): PlayerState {
    return {
        id,
        name,
        score: 0,
        slots: Array.from({ length: GAME_CONSTANTS.INITIAL_SLOT_COUNT }, (_, i) => ({
            index: i,
            card: null,
            isLocked: false,
        })),
        hand: [],
        isCurrentTurn: false,
        movesRemaining: GAME_CONSTANTS.MAX_MOVES_PER_TURN,
        timeRemaining: GAME_CONSTANTS.TURN_TIME,
        defenseMoves: 0,
    };
}

function findCardInHand(hand: Card[], cardId: string): Card | undefined {
    return hand.find((c) => c.id === cardId);
}

function removeCardFromHand(hand: Card[], cardId: string): Card[] {
    return hand.filter((c) => c.id !== cardId);
}

// ==========================================
// Zustand Store
// ==========================================

export const useGameStore = create<GameStore>((set, get) => ({
    gameState: null,
    isLocalGame: true,
    localPlayerId: '',
    isInQueue: false,
    queuePosition: null,

    // ==========================================
    // Socket Listeners
    // ==========================================
    setupSocketListeners: () => {
        socketService.on('queue_joined', ({ position }) => {
            set({ isInQueue: true, queuePosition: position });
        });

        socketService.on('queue_left', () => {
            set({ isInQueue: false, queuePosition: null });
        });

        socketService.on('match_found', ({ opponentName }) => {
            console.log('Match found with:', opponentName);
            // Wait for game start
        });

        socketService.on('game_start', (gameState) => {
            // Map server state to client state
            // Note: Server state structure matches close enough, but might need detailed mapping
            // For now, assume we use the server state directly if types align
            set({
                gameState: gameState as unknown as GameState, // Force cast for now, ideally fix types
                isLocalGame: false,
                isInQueue: false,
                queuePosition: null
            });
        });

        socketService.on('game_update', (gameState) => {
            set({ gameState: gameState as unknown as GameState });
        });

        socketService.on('card_played', (data) => {
            // Handle specific animation triggers here if needed
            console.log('Opponent played card:', data);
        });
    },

    cleanupSocketListeners: () => {
        socketService.off('queue_joined');
        socketService.off('queue_left');
        socketService.off('match_found');
        socketService.off('game_start');
        socketService.off('game_update');
        socketService.off('card_played');
    },

    // ==========================================
    // Online Actions
    // ==========================================
    joinQueue: () => {
        socketService.emit('join_queue');
    },

    leaveQueue: () => {
        socketService.emit('leave_queue');
    },

    // ==========================================
    // Initialize Game
    // ==========================================
    initializeGame: (player1Name: string, player2Name: string) => {
        const player1Id = Crypto.randomUUID();
        const player2Id = Crypto.randomUUID();

        // Generate and shuffle decks
        let playerDeck = shuffleDeck(generatePlayerCardDeck());
        let actionDeck = shuffleDeck(generateActionCardDeck());
        let pontoDeck = shuffleDeck(generatePontoCardDeck());

        // Create player states
        const player1 = createPlayerState(player1Id, player1Name);
        const player2 = createPlayerState(player2Id, player2Name);

        // Deal initial slot cards (5 non-legendary players each, face down)
        const nonLegendaryCards = playerDeck.filter((c) => !c.isLegendary);
        const legendaryCards = playerDeck.filter((c) => c.isLegendary);

        // Shuffle non-legendary for slots
        const shuffledNonLegendary = shuffleDeck(nonLegendaryCards);

        // Deal 5 cards to each player's slots
        for (let i = 0; i < GAME_CONSTANTS.INITIAL_SLOT_COUNT; i++) {
            const card1 = shuffledNonLegendary.pop()!;
            const card2 = shuffledNonLegendary.pop()!;

            player1.slots[i].card = { ...card1, isRevealed: false };
            player2.slots[i].card = { ...card2, isRevealed: false };
        }

        // Rebuild player deck with remaining cards
        playerDeck = shuffleDeck([...shuffledNonLegendary, ...legendaryCards]);

        // Deal 2 player cards to each hand (may include legendaries)
        const { cards: hand1Players, remainingDeck: deck1 } = drawCards(
            playerDeck,
            GAME_CONSTANTS.INITIAL_HAND_PLAYERS
        );
        const { cards: hand2Players, remainingDeck: deck2 } = drawCards(
            deck1,
            GAME_CONSTANTS.INITIAL_HAND_PLAYERS
        );
        playerDeck = deck2;

        // Deal 3 action cards to each hand
        const { cards: hand1Actions, remainingDeck: actionDeck1 } = drawCards(
            actionDeck,
            GAME_CONSTANTS.INITIAL_ACTION_CARDS
        );
        const { cards: hand2Actions, remainingDeck: actionDeck2 } = drawCards(
            actionDeck1,
            GAME_CONSTANTS.INITIAL_ACTION_CARDS
        );
        actionDeck = actionDeck2;

        player1.hand = [...hand1Players, ...hand1Actions];
        player2.hand = [...hand2Players, ...hand2Actions];

        // Draw 1 Ponto card each to determine starting player
        const { cards: ponto1, remainingDeck: pontoDeck1 } = drawCards(pontoDeck, 1);
        const { cards: ponto2, remainingDeck: pontoDeck2 } = drawCards(pontoDeck1, 1);
        pontoDeck = pontoDeck2;

        // Higher ponto value starts
        const player1Ponto = ponto1[0] as PontoCard;
        const player2Ponto = ponto2[0] as PontoCard;

        let startingPlayerId: string;
        if (player1Ponto.value > player2Ponto.value) {
            startingPlayerId = player1Id;
            player1.isCurrentTurn = true;
        } else if (player2Ponto.value > player1Ponto.value) {
            startingPlayerId = player2Id;
            player2.isCurrentTurn = true;
        } else {
            // Tie - randomly choose
            startingPlayerId = Math.random() < 0.5 ? player1Id : player2Id;
            if (startingPlayerId === player1Id) {
                player1.isCurrentTurn = true;
            } else {
                player2.isCurrentTurn = true;
            }
        }

        // Add drawn ponto cards to hands
        player1.hand.push(player1Ponto);
        player2.hand.push(player2Ponto);

        const gameState: GameState = {
            id: Crypto.randomUUID(),
            status: GameStatus.ACTIVE,
            phase: GamePhase.TURN,
            players: {
                player1,
                player2,
            },
            currentPlayerId: startingPlayerId,
            currentAttack: null,
            matchTimeElapsed: 0,
            maxMatchTime: GAME_CONSTANTS.MAX_MATCH_TIME,
            winnerId: null,
            turnNumber: 1,
            playerCardDeck: playerDeck,
            actionCardDeck: actionDeck,
            pontoCardDeck: pontoDeck,
            discardPile: [],
        };

        set({
            gameState,
            isLocalGame: true,
            localPlayerId: player1Id,
        });
    },

    // ==========================================
    // Reset Game
    // ==========================================
    resetGame: () => {
        set({
            gameState: null,
            isLocalGame: true,
            localPlayerId: '',
        });
    },

    // ==========================================
    // Swap Card
    // ==========================================
    swapCard: (playerId: string, handCardId: string, slotIndex: number) => {
        const state = get();
        if (!state.gameState || !state.canPerformAction(playerId)) return false;
        if (state.gameState.phase !== GamePhase.TURN) return false;

        const gs = { ...state.gameState };
        const player =
            gs.players.player1.id === playerId ? gs.players.player1 : gs.players.player2;

        // Find card in hand
        const handCard = findCardInHand(player.hand, handCardId);
        if (!handCard || handCard.type !== CardType.PLAYER) return false;

        // Check slot is valid
        const slot = player.slots[slotIndex];
        if (!slot || slot.isLocked) return false;

        // Swap
        const slotCard = slot.card;
        slot.card = handCard as PlayerCard;
        slot.card.isRevealed = true;

        // Put old slot card back in hand (if exists)
        player.hand = removeCardFromHand(player.hand, handCardId);
        if (slotCard) {
            player.hand.push(slotCard);
        }

        // Consume move
        player.movesRemaining -= 1;

        if (!state.isLocalGame) {
            socketService.emit('play_card', { cardId: handCardId, slotIndex });
        }

        set({ gameState: gs });
        return true;
    },

    // ==========================================
    // Reveal Card
    // ==========================================
    revealCard: (playerId: string, slotIndex: number) => {
        const state = get();
        if (!state.gameState || !state.canPerformAction(playerId)) return false;
        if (state.gameState.phase !== GamePhase.TURN) return false;

        const gs = { ...state.gameState };
        const player =
            gs.players.player1.id === playerId ? gs.players.player1 : gs.players.player2;

        const slot = player.slots[slotIndex];
        if (!slot || !slot.card || slot.card.isRevealed) return false;

        slot.card.isRevealed = true;
        player.movesRemaining -= 1;

        set({ gameState: gs });
        return true;
    },

    // ==========================================
    // Play Legendary
    // ==========================================
    playLegendary: (
        playerId: string,
        legendaryCardId: string,
        discardCardIds: [string, string],
        targetSlotIndex: number
    ) => {
        const state = get();
        if (!state.gameState || !state.canPerformAction(playerId)) return false;
        if (state.gameState.phase !== GamePhase.TURN) return false;

        const gs = { ...state.gameState };
        const player =
            gs.players.player1.id === playerId ? gs.players.player1 : gs.players.player2;

        // Find legendary card
        const legendaryCard = findCardInHand(player.hand, legendaryCardId) as PlayerCard;
        if (!legendaryCard || !legendaryCard.isLegendary) return false;

        // Check discard cards exist
        const discard1 = findCardInHand(player.hand, discardCardIds[0]);
        const discard2 = findCardInHand(player.hand, discardCardIds[1]);
        if (!discard1 || !discard2) return false;
        if (discardCardIds[0] === discardCardIds[1]) return false;
        if (discardCardIds[0] === legendaryCardId || discardCardIds[1] === legendaryCardId)
            return false;

        // Check slot
        const slot = player.slots[targetSlotIndex];
        if (!slot || slot.isLocked) return false;

        // Move old slot card to discard
        if (slot.card) {
            gs.discardPile.push(slot.card);
        }

        // Place legendary
        slot.card = { ...legendaryCard, isRevealed: true };

        // Remove cards from hand and add to discard
        player.hand = player.hand.filter(
            (c) =>
                c.id !== legendaryCardId &&
                c.id !== discardCardIds[0] &&
                c.id !== discardCardIds[1]
        );
        gs.discardPile.push(discard1, discard2);

        // Consume move (playing legendary costs 1 move)
        player.movesRemaining -= 1;

        set({ gameState: gs });
        return true;
    },

    // ==========================================
    // Play Action Card
    // ==========================================
    playActionCard: (
        playerId: string,
        cardId: string,
        targetInfo?: { targetPlayerId?: string; targetSlotIndex?: number }
    ) => {
        const state = get();
        if (!state.gameState) return false;

        const gs = { ...state.gameState };
        const player =
            gs.players.player1.id === playerId ? gs.players.player1 : gs.players.player2;

        // Find action card
        const actionCard = findCardInHand(player.hand, cardId) as ActionCard;
        if (!actionCard || actionCard.type !== CardType.ACTION) return false;

        // Check if card can be used in current phase
        if (!actionCard.canUseInPhase.includes(gs.phase)) return false;

        // Execute effect based on card type
        // (Simplified - full implementation would handle each effect)

        // Remove card from hand
        player.hand = removeCardFromHand(player.hand, cardId);
        gs.discardPile.push(actionCard);

        // Consume move if in turn phase
        if (gs.phase === GamePhase.TURN) {
            player.movesRemaining -= 1;
        } else if (gs.phase === GamePhase.DEFENSE) {
            player.defenseMoves -= 1;
        }

        set({ gameState: gs });
        return true;
    },

    // ==========================================
    // Declare Attack
    // ==========================================
    declareAttack: (playerId: string) => {
        const state = get();
        if (!state.gameState || !state.canPerformAction(playerId)) return false;
        if (state.gameState.phase !== GamePhase.TURN) return false;

        const gs = { ...state.gameState };
        const player =
            gs.players.player1.id === playerId ? gs.players.player1 : gs.players.player2;

        // Check has enough moves (attack costs 2)
        if (player.movesRemaining < GAME_CONSTANTS.ATTACK_MOVE_COST) return false;

        // Check has attacking players
        const hasAttackers = player.slots.some(
            (s) =>
                s.card &&
                !s.card.isExpelled &&
                s.card.isRevealed &&
                s.card.attack > 0
        );
        if (!hasAttackers) return false;

        const opponentId =
            gs.players.player1.id === playerId
                ? gs.players.player2.id
                : gs.players.player1.id;
        const opponent =
            gs.players.player1.id === opponentId ? gs.players.player1 : gs.players.player2;

        // Create attack state
        gs.currentAttack = {
            attackerId: playerId,
            defenderId: opponentId,
            attackPoints: 0,
            defensePoints: 0,
            usedPontoCards: [],
            usedActionCards: [],
            attackerActionsComplete: false,
            defenderMoves: GAME_CONSTANTS.DEFENSE_MOVES,
        };

        // Consume moves
        player.movesRemaining -= GAME_CONSTANTS.ATTACK_MOVE_COST;

        // Change phase to attack
        gs.phase = GamePhase.ATTACK;

        // Set defender's defense moves
        opponent.defenseMoves = GAME_CONSTANTS.DEFENSE_MOVES;

        if (!state.isLocalGame) {
            // socketService.emit('attack', { ... }); // This needs simpler server API
        }

        set({ gameState: gs });
        return true;
    },

    // ==========================================
    // End Turn
    // ==========================================
    endTurn: (playerId: string) => {
        const state = get();
        if (!state.gameState) return;

        const gs = { ...state.gameState };

        // Switch turns
        const isPlayer1 = gs.players.player1.id === playerId;
        const currentPlayer = isPlayer1 ? gs.players.player1 : gs.players.player2;
        const nextPlayer = isPlayer1 ? gs.players.player2 : gs.players.player1;

        currentPlayer.isCurrentTurn = false;
        nextPlayer.isCurrentTurn = true;

        // Reset moves and timer for next player
        nextPlayer.movesRemaining = GAME_CONSTANTS.MAX_MOVES_PER_TURN;
        nextPlayer.timeRemaining = GAME_CONSTANTS.TURN_TIME;

        gs.currentPlayerId = nextPlayer.id;
        gs.phase = GamePhase.TURN;
        gs.turnNumber += 1;

        if (!state.isLocalGame) {
            socketService.emit('end_turn');
        }

        set({ gameState: gs });
    },

    // ==========================================
    // Play Ponto Card (during attack)
    // ==========================================
    playPontoCard: (playerId: string, cardId: string) => {
        const state = get();
        if (!state.gameState) return false;
        if (state.gameState.phase !== GamePhase.ATTACK) return false;
        if (!state.gameState.currentAttack) return false;
        if (state.gameState.currentAttack.attackerId !== playerId) return false;

        const gs = { ...state.gameState };
        const player =
            gs.players.player1.id === playerId ? gs.players.player1 : gs.players.player2;

        const pontoCard = findCardInHand(player.hand, cardId) as PontoCard;
        if (!pontoCard || pontoCard.type !== CardType.PONTO) return false;

        // Add ponto card to attack
        gs.currentAttack!.usedPontoCards.push(pontoCard);
        gs.currentAttack!.attackPoints += pontoCard.value;

        // Remove from hand
        player.hand = removeCardFromHand(player.hand, cardId);

        set({ gameState: gs });
        return true;
    },

    // ==========================================
    // Finalize Attack
    // ==========================================
    finalizeAttack: (playerId: string) => {
        const state = get();
        if (!state.gameState || !state.gameState.currentAttack) return;
        if (state.gameState.currentAttack.attackerId !== playerId) return;

        const gs = { ...state.gameState };

        // Calculate base attack from player cards
        const attacker =
            gs.players.player1.id === playerId ? gs.players.player1 : gs.players.player2;

        let baseAttack = 0;
        attacker.slots.forEach((slot) => {
            if (slot.card && !slot.card.isExpelled && slot.card.isRevealed) {
                baseAttack += slot.card.attack;
            }
        });

        gs.currentAttack!.attackPoints += baseAttack;
        gs.currentAttack!.attackerActionsComplete = true;

        // Move to defense phase
        gs.phase = GamePhase.DEFENSE;

        set({ gameState: gs });
    },

    // ==========================================
    // Use Defense Card
    // ==========================================
    useDefenseCard: (playerId: string, cardId: string) => {
        const state = get();
        if (!state.gameState) return false;
        if (state.gameState.phase !== GamePhase.DEFENSE) return false;
        if (!state.gameState.currentAttack) return false;
        if (state.gameState.currentAttack.defenderId !== playerId) return false;

        const gs = { ...state.gameState };
        const defender =
            gs.players.player1.id === playerId ? gs.players.player1 : gs.players.player2;

        if (defender.defenseMoves <= 0) return false;

        const actionCard = findCardInHand(defender.hand, cardId) as ActionCard;
        if (!actionCard || actionCard.type !== CardType.ACTION) return false;
        if (!actionCard.canUseInPhase.includes(GamePhase.DEFENSE)) return false;

        // Add to used action cards
        gs.currentAttack!.usedActionCards.push(actionCard);

        // Remove from hand
        defender.hand = removeCardFromHand(defender.hand, cardId);
        defender.defenseMoves -= 1;

        set({ gameState: gs });
        return true;
    },

    // ==========================================
    // Skip Defense
    // ==========================================
    skipDefense: (playerId: string) => {
        const state = get();
        if (!state.gameState || !state.gameState.currentAttack) return;
        if (state.gameState.currentAttack.defenderId !== playerId) return;

        const gs = { ...state.gameState };

        // Calculate defense points from defender's slots
        const defender =
            gs.players.player1.id === playerId ? gs.players.player1 : gs.players.player2;
        const attacker =
            gs.players.player1.id === playerId ? gs.players.player2 : gs.players.player1;

        let defensePoints = 0;
        defender.slots.forEach((slot) => {
            if (slot.card && !slot.card.isExpelled && slot.card.isRevealed) {
                defensePoints += slot.card.defense;
            }
        });

        gs.currentAttack!.defensePoints = defensePoints;

        // Resolve attack
        const attackPoints = gs.currentAttack!.attackPoints;
        if (attackPoints > defensePoints) {
            // Goal scored
            attacker.score += 1;

            // Check for win
            if (attacker.score >= GAME_CONSTANTS.WINNING_SCORE) {
                gs.status = GameStatus.FINISHED;
                gs.phase = GamePhase.GAME_OVER;
                gs.winnerId = attacker.id;
            }
        }

        // Clear attack state and end turn
        gs.currentAttack = null;
        gs.phase = GamePhase.TURN;

        // Switch to attacker's turn (since they initiated and completed attack)
        attacker.isCurrentTurn = false;
        defender.isCurrentTurn = true;
        gs.currentPlayerId = defender.id;
        defender.movesRemaining = GAME_CONSTANTS.MAX_MOVES_PER_TURN;
        defender.timeRemaining = GAME_CONSTANTS.TURN_TIME;
        gs.turnNumber += 1;

        set({ gameState: gs });
    },

    // ==========================================
    // Timer
    // ==========================================
    decrementTimer: () => {
        const state = get();
        if (!state.gameState || state.gameState.status !== GameStatus.ACTIVE) return;

        const gs = { ...state.gameState };

        // Increment match time
        gs.matchTimeElapsed += 1;

        // Check for time limit
        if (gs.matchTimeElapsed >= gs.maxMatchTime) {
            // Check scores
            const p1Score = gs.players.player1.score;
            const p2Score = gs.players.player2.score;

            if (p1Score !== p2Score) {
                gs.status = GameStatus.FINISHED;
                gs.phase = GamePhase.GAME_OVER;
                gs.winnerId = p1Score > p2Score ? gs.players.player1.id : gs.players.player2.id;
            } else {
                // Golden goal
                gs.phase = GamePhase.GOLDEN_GOAL;
            }
        }

        // Decrement current player's turn timer
        const currentPlayer =
            gs.currentPlayerId === gs.players.player1.id
                ? gs.players.player1
                : gs.players.player2;

        currentPlayer.timeRemaining -= 1;

        if (currentPlayer.timeRemaining <= 0) {
            // Auto end turn
            state.endTurn(currentPlayer.id);
            return;
        }

        set({ gameState: gs });
    },

    // ==========================================
    // Helpers
    // ==========================================
    getCurrentPlayer: () => {
        const state = get();
        if (!state.gameState) return null;
        return state.gameState.currentPlayerId === state.gameState.players.player1.id
            ? state.gameState.players.player1
            : state.gameState.players.player2;
    },

    getOpponentPlayer: () => {
        const state = get();
        if (!state.gameState) return null;
        return state.gameState.currentPlayerId === state.gameState.players.player1.id
            ? state.gameState.players.player2
            : state.gameState.players.player1;
    },

    canPerformAction: (playerId: string) => {
        const state = get();
        if (!state.gameState) return false;
        if (state.gameState.status !== GameStatus.ACTIVE) return false;
        if (state.gameState.currentPlayerId !== playerId) return false;

        const currentPlayer =
            state.gameState.players.player1.id === playerId
                ? state.gameState.players.player1
                : state.gameState.players.player2;

        return currentPlayer.movesRemaining > 0;
    },

    calculateAttackPoints: () => {
        const state = get();
        if (!state.gameState || !state.gameState.currentAttack) return 0;
        return state.gameState.currentAttack.attackPoints;
    },

    calculateDefensePoints: () => {
        const state = get();
        if (!state.gameState || !state.gameState.currentAttack) return 0;
        return state.gameState.currentAttack.defensePoints;
    },
}));

export default useGameStore;
